import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = '/Users/wvngbvao483/offcircle_dev/konglie-youdu'
const OUT = path.join(ROOT, 'qa/full-flow')
fs.mkdirSync(OUT, { recursive: true })
const URL = process.env.GAME_URL || 'http://127.0.0.1:7100/'
const child = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--remote-debugging-pipe', `--user-data-dir=${path.join(OUT, 'profile-final')}`,
  '--no-first-run', '--disable-extensions', '--disable-sync', '--disable-gpu', '--hide-scrollbars', '--mute-audio', '--window-size=1440,900', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] })
let stderr = ''
child.stderr.on('data', (chunk) => { stderr = (stderr + chunk.toString()).slice(-2500) })
const writer = child.stdio[3]; const reader = child.stdio[4]
let nextId = 0; let buffer = Buffer.alloc(0)
const pending = new Map(); const events = []
reader.on('data', (chunk) => {
  buffer = Buffer.concat([buffer, chunk]); let end
  while ((end = buffer.indexOf(0)) !== -1) {
    const raw = buffer.subarray(0, end).toString('utf8'); buffer = buffer.subarray(end + 1)
    let message; try { message = JSON.parse(raw) } catch { continue }
    if (message.id !== undefined && pending.has(message.id)) {
      const item = pending.get(message.id); pending.delete(message.id)
      if (message.error) item.reject(new Error(`${item.method}: ${message.error.message}`)); else item.resolve(message.result)
    } else if (message.method) events.push(message)
  }
})
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++nextId; pending.set(id, { resolve, reject, method })
  writer.write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0')
})
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const report = { checks: [], levels: [], consoleErrors: [], networkErrors: [], requests: 0, encodedBytes: 0 }
const check = (name, pass) => { report.checks.push({ name, pass: Boolean(pass) }); if (!pass) console.error('FAIL', name) }
let sessionId
try {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  sessionId = (await send('Target.attachToTarget', { targetId, flatten: true })).sessionId
  await send('Runtime.enable', {}, sessionId); await send('Network.enable', {}, sessionId); await send('Page.enable', {}, sessionId)
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId)
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId)
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result?.value
  }
  const until = async (expression, timeout = 12000) => {
    const start = Date.now()
    while (Date.now() - start < timeout) { if (await evaluate(expression)) return true; await sleep(200) }
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
  const fps = async () => evaluate(`new Promise(resolve=>{let n=0;const start=performance.now();const tick=()=>{n++;if(n>=45)resolve(Math.round(n*1000/(performance.now()-start)));else requestAnimationFrame(tick)};requestAnimationFrame(tick)})`)

  await send('Page.navigate', { url: URL }, sessionId)
  await until(`!!document.querySelector('.title-content h1')`, 20000)
  await sleep(300)
  check('标题使用空裂：游渡', await evaluate(`document.querySelector('.title-content h1')?.textContent==='空裂：游渡'`))
  await screenshot('title.png')
  await evaluate(`document.querySelector('.title-actions .primary-button').click()`); await sleep(250)
  check('出城漫画第一页', await evaluate(`document.querySelector('.comic-caption h2')?.textContent==='出城'`))
  await evaluate(`document.querySelector('.prologue-next').click()`); await sleep(200)
  check('出城漫画第二页', await evaluate(`document.querySelector('.comic-caption h2')?.textContent==='归山'`))
  await evaluate(`document.querySelector('.prologue-next').click()`); await sleep(1800)
  await evaluate(`document.querySelector('.arrival-copy .primary-button').click()`); await sleep(400)
  await until(`document.querySelector('.map-you-icon')?.naturalWidth>0`, 10000)
  check('地图头像 icon 已加载', await evaluate(`document.querySelector('.map-you-icon')?.naturalWidth>0`))
  await screenshot('map-start.png')
  const order = await evaluate(`JSON.parse(localStorage.getItem('youdu-save-v1')).order`)
  check('五关顺序包含五个不同关卡', new Set(order).size === 5)

  for (const level of order) {
    await evaluate(`document.querySelector('.map-node.node-next').click()`); await sleep(200)
    check(`${level} 进入正确关卡`, await evaluate(`document.querySelector('.level-screen')?.dataset.level==='${level}'`))
    if (report.levels.length === 0) check('隐对话框使用指定头像', await evaluate(`document.querySelector('.guide-avatar')?.getAttribute('src')==='/assets/yin-icon.webp'`))
    await evaluate(`document.querySelector('.statue-hotspot').click()`); await sleep(1450)
    check(`${level} 进入里世界`, await evaluate(`document.querySelector('.level-screen')?.dataset.phase==='inner'`))
    await screenshot(`level-${level}.png`)

    if (level === 'chen' || level === 'yi') {
      if (level === 'yi') await evaluate(`document.querySelector('.choice-panel .primary-button').click()`)
      for (let index = 0; index < 3; index += 1) {
        await evaluate(`document.querySelector('.word-token[aria-label*="可吸收"]:not([disabled])').click()`)
        await sleep(180)
      }
    } else if (level === 'chi' || level === 'man') {
      if (level === 'man') report.manFps = await fps(); else report.chiFps = await fps()
      for (let index = 0; index < 3; index += 1) {
        const point = await evaluate(`(()=>{const canvas=document.querySelector('canvas');const targets=JSON.parse(canvas.dataset.targets||'[]');const rect=canvas.getBoundingClientRect();const target=targets[0];return target?{x:rect.left+target.x*rect.width,y:rect.top+target.y*rect.height}:null})()`)
        if (!point) throw new Error(`${level} 缺少可点击目标`)
        await clickPoint(point.x, point.y); await sleep(280)
      }
    } else if (level === 'tan') {
      const start = Date.now()
      while (Date.now() - start < 30000) {
        const value = await evaluate(`Number(document.querySelector('.basket-panel footer strong')?.textContent||0)`)
        if (value >= 12) break
        await evaluate(`document.querySelector('.apple-large')?.click()`)
        await sleep(300)
      }
      check('贪背包达到目标回声', await evaluate(`Number(document.querySelector('.basket-panel footer strong')?.textContent||0)>=12`))
      await evaluate(`document.querySelector('.basket-panel footer .primary-button').click()`)
    }
    check(`${level} 可完成`, await until(`!!document.querySelector('.level-complete')`, 6000))
    report.levels.push(level)
    await evaluate(`document.querySelector('.level-complete .primary-button').click()`); await sleep(500)
    if (await evaluate(`!!document.querySelector('.card-modal')`)) {
      await screenshot(`card-${level}.png`)
      await evaluate(`document.querySelector('.reward-card').click()`); await sleep(150)
      check(`${level} 卡牌可翻面`, await evaluate(`!!document.querySelector('.reward-card blockquote')`))
      await evaluate(`document.querySelector('.card-modal > .primary-button').click()`); await sleep(250)
    }
  }
  check('五关全部完成', report.levels.length === 5)
  await screenshot('map-restored.png')
  await evaluate(`document.querySelector('.map-node.node-next').click()`); await sleep(350)
  for (let index = 0; index < 3; index += 1) { await evaluate(`document.querySelector('.ending-copy .primary-button').click()`); await sleep(250) }
  check('三次触碰后到达最终结局', await evaluate(`document.querySelector('.ending-copy h1')?.textContent==='空裂：游渡'`))
  await screenshot('ending.png')

  for (const event of events) {
    if (event.method === 'Runtime.exceptionThrown') report.consoleErrors.push(event.params.exceptionDetails?.text || 'Runtime exception')
    if (event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error') report.consoleErrors.push(event.params.args?.map((arg) => arg.value || arg.description).join(' '))
    if (event.method === 'Network.responseReceived') {
      report.requests += 1
      if (event.params.response.status >= 400) report.networkErrors.push(`${event.params.response.status} ${event.params.response.url}`)
    }
    if (event.method === 'Network.loadingFinished') report.encodedBytes += event.params.encodedDataLength || 0
  }
  check('无控制台错误', report.consoleErrors.length === 0)
  check('无失败资源', report.networkErrors.length === 0)
} catch (error) {
  report.fatal = String(error); report.browserStderr = stderr; check('全流程执行完成', false)
} finally {
  try { await send('Browser.close') } catch { /* closed */ }
  if (child.exitCode === null) child.kill()
}
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
if (report.fatal || report.checks.some((item) => !item.pass)) process.exitCode = 1
