import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'qa/art-reboot')
fs.mkdirSync(OUT, { recursive: true })
const URL = process.env.GAME_URL || 'http://127.0.0.1:7106/art-reboot.html'
const CHROME_PATH = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const child = spawn(CHROME_PATH, [
  '--headless=new', '--remote-debugging-pipe', `--user-data-dir=${path.join(OUT, 'profile')}`,
  '--no-first-run', '--disable-extensions', '--disable-sync', '--disable-gpu', '--hide-scrollbars', '--mute-audio', '--window-size=1440,900', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] })
const writer = child.stdio[3]
const reader = child.stdio[4]
let nextId = 0
let buffer = Buffer.alloc(0)
const pending = new Map()
const events = []
reader.on('data', (chunk) => {
  buffer = Buffer.concat([buffer, chunk])
  let end
  while ((end = buffer.indexOf(0)) !== -1) {
    const raw = buffer.subarray(0, end).toString('utf8')
    buffer = buffer.subarray(end + 1)
    let message
    try { message = JSON.parse(raw) } catch { continue }
    if (message.id !== undefined && pending.has(message.id)) {
      const item = pending.get(message.id)
      pending.delete(message.id)
      message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result)
    } else if (message.method) events.push(message)
  }
})
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++nextId
  pending.set(id, { resolve, reject })
  writer.write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0')
})
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const report = { checks: [], consoleErrors: [], networkErrors: [] }
const check = (name, pass) => { report.checks.push({ name, pass: Boolean(pass) }); if (!pass) console.error('FAIL', name) }
let sessionId
try {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  sessionId = (await send('Target.attachToTarget', { targetId, flatten: true })).sessionId
  await send('Runtime.enable', {}, sessionId)
  await send('Network.enable', {}, sessionId)
  await send('Page.enable', {}, sessionId)
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId)
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId)
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result?.value
  }
  const until = async (expression, timeout = 12000) => {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      if (await evaluate(expression)) return true
      await sleep(180)
    }
    return false
  }
  const screenshot = async (name) => {
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId)
    fs.writeFileSync(path.join(OUT, name), Buffer.from(shot.data, 'base64'))
  }
  const clickPoint = async (x, y) => {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }, sessionId)
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }, sessionId)
  }
  const targetPoint = async () => evaluate(`(()=>{const c=document.querySelector('.reboot-chi canvas');const t=JSON.parse(c.dataset.targets||'[]')[0];if(!t)return null;const r=c.getBoundingClientRect();return{x:r.left+t.x*r.width,y:r.top+t.y*r.height}})()`)

  await send('Page.navigate', { url: URL }, sessionId)
  await until(`document.querySelector('.comic-main-shot')?.dataset.panel==='1'`, 15000)
  await sleep(1800)
  check('漫画使用主镜头与分镜索引', await evaluate(`document.querySelectorAll('.comic-rail button').length===4 && !!document.querySelector('.comic-main-shot')`))
  for (let index = 0; index < 4; index += 1) {
    await screenshot(`comic-${index + 1}.png`)
    await evaluate(`document.querySelector('.reboot-comic-footer .reboot-primary').click()`)
    await sleep(1800)
  }
  check('四格漫画后进入开始界面', await evaluate(`document.querySelector('.reboot-title h1')?.textContent==='空裂：游渡'`))
  check('完整场景原画已加载', await evaluate(`document.querySelector('.reboot-title-scene')?.naturalWidth>0`))
  await screenshot('title.png')
  await evaluate(`document.querySelector('.reboot-title-actions .reboot-primary').click()`)
  check('开始界面可进入痴', await evaluate(`document.querySelector('.reboot-chi')?.dataset.phase==='outer' && document.querySelector('.reboot-chi-scene')?.naturalWidth>0`))
  await screenshot('outer.png')
  await evaluate(`document.querySelector('.reboot-statue').click()`)
  check('神像切换进入里世界', await until(`document.querySelector('.reboot-chi')?.dataset.phase==='inner'`))
  await sleep(1600)
  check('灯海与探灯同时存在', await evaluate(`document.querySelectorAll('.reboot-lamp').length>=7 && JSON.parse(document.querySelector('.reboot-chi canvas').dataset.targets||'[]').length===3`))
  check('目标与操作提示清晰', await evaluate(`document.querySelector('.reboot-objective')?.textContent.includes('找齐 3 个') && document.querySelector('.reboot-objective')?.textContent.includes('点一下')`))
  check('手绘 UI 已加载', await evaluate(`document.querySelector('.reboot-ui-icon img')?.naturalWidth>0`))
  await screenshot('inner.png')
  await evaluate(`document.querySelector('.reboot-lamp').click()`)
  check('幻境灯可被识别', await evaluate(`document.querySelector('.reboot-guide')?.textContent.includes('灯影') && document.querySelectorAll('.reboot-lamp.is-out').length===1`))
  check('忿出现并增加灯海', await until(`!!document.querySelector('.reboot-fen') && document.querySelectorAll('.reboot-lamp').length>=11`, 8000))
  await sleep(1000)
  check('忿在场景中可见', await evaluate(`Number(getComputedStyle(document.querySelector('.reboot-fen img')).opacity)>.1`))
  await screenshot('fen.png')
  for (let index = 0; index < 3; index += 1) {
    const point = await targetPoint()
    if (!point) throw new Error('缺少痴目标')
    await clickPoint(point.x, point.y)
    await sleep(320)
  }
  check('三个痴均可点击并完成', await evaluate(`document.querySelector('.reboot-chi')?.dataset.phase==='complete'`))
  await screenshot('complete.png')

  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true }, sessionId)
  await send('Page.navigate', { url: URL }, sessionId)
  await until(`!!document.querySelector('.reboot-comic-footer .reboot-text-link')`, 15000)
  await evaluate(`document.querySelector('.reboot-comic-footer .reboot-text-link').click()`)
  await evaluate(`document.querySelector('.reboot-title-actions .reboot-primary').click()`)
  await evaluate(`document.querySelector('.reboot-statue').click()`)
  await until(`document.querySelector('.reboot-chi')?.dataset.phase==='inner'`)
  await until(`JSON.parse(document.querySelector('.reboot-chi canvas')?.dataset.targets||'[]').length===3`)
  const mobilePoint = await targetPoint()
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: mobilePoint.x, y: mobilePoint.y, id: 1 }] }, sessionId)
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }, sessionId)
  await sleep(350)
  check('375px 触摸可收集一个痴', await evaluate(`JSON.parse(document.querySelector('.reboot-chi canvas').dataset.targets||'[]').length===2`))
  check('移动端原型无横向溢出', await evaluate(`document.body.scrollWidth===375 && document.querySelector('.reboot-chi').getBoundingClientRect().left>=0`))
  await screenshot('mobile.png')

  for (const event of events) {
    if (event.method === 'Runtime.exceptionThrown') report.consoleErrors.push(event.params.exceptionDetails?.text || 'exception')
    if (event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error') report.consoleErrors.push('console.error')
    if (event.method === 'Network.responseReceived' && event.params.response.status >= 400) report.networkErrors.push(`${event.params.response.status} ${event.params.response.url}`)
  }
  check('无控制台错误', report.consoleErrors.length === 0)
  check('无失败资源', report.networkErrors.length === 0)
} catch (error) {
  report.fatal = String(error)
  check('独立美术原型验收完成', false)
} finally {
  try { await Promise.race([send('Browser.close'), sleep(1000)]) } catch { /* closed */ }
  if (child.exitCode === null) child.kill()
}
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
if (report.fatal || report.checks.some((item) => !item.pass)) process.exitCode = 1
