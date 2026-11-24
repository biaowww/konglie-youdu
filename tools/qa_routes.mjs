import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, process.env.QA_OUT || 'qa/full-flow')
const CHOICE = process.env.ROUTE_CHOICE || 'first'
fs.mkdirSync(OUT, { recursive: true })
const URL = process.env.GAME_URL || 'http://127.0.0.1:7104/'
const child = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
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
const report = { choice: CHOICE, checks: [], levels: [], routePath: [], consoleErrors: [], networkErrors: [] }
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

  await send('Page.navigate', { url: URL }, sessionId)
  await until(`!!document.querySelector('.title-actions .primary-button')`, 15000)
  await evaluate(`document.querySelector('.title-actions .primary-button').click()`)
  await until(`!!document.querySelector('.journey-skip')`)
  await evaluate(`document.querySelector('.journey-skip').click()`)
  check('入山按钮出现', await until(`!!document.querySelector('.arrival-copy .primary-button')`, 6000))
  await evaluate(`document.querySelector('.arrival-copy .primary-button').click()`)
  await until(`document.querySelectorAll('.route-node').length>0`)
  check('四层路线与山顶共10个节点', await evaluate(`document.querySelectorAll('.route-node').length===10`))
  check('起点有两个有效候选', await evaluate(`document.querySelectorAll('.route-node.is-next').length===2`))
  await evaluate(`document.querySelector('[aria-label="放大地图"]').click()`)
  check('地图可放大', await evaluate(`document.querySelector('.route-map-world').style.transform.includes('1.15')`))
  await evaluate(`document.querySelector('[aria-label="重置地图视图"]').click()`)
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 1080, y: 760, button: 'left', clickCount: 1 }, sessionId)
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1160, y: 700, button: 'left', buttons: 1 }, sessionId)
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 1160, y: 700, button: 'left', clickCount: 1 }, sessionId)
  check('地图可拖动平移', await evaluate(`!document.querySelector('.route-map-world').style.transform.includes('translate(0px, 0px)')`))
  await evaluate(`document.querySelector('[aria-label="重置地图视图"]').click()`)
  await screenshot('map.png')

  let restCount = 0
  for (let step = 0; step < 5; step += 1) {
    const count = await evaluate(`document.querySelectorAll('.route-node.is-next').length`)
    if (!count) throw new Error(`第${step + 1}层没有可到达节点`)
    const clickNext = `(()=>{const nodes=[...document.querySelectorAll('.route-node.is-next')];const node=${CHOICE === 'last' ? 'nodes[nodes.length-1]' : 'nodes[0]'};node.click()})()`
    const kind = await evaluate(`(()=>{const nodes=[...document.querySelectorAll('.route-node.is-next')];const node=${CHOICE === 'last' ? 'nodes[nodes.length-1]' : 'nodes[0]'};return [...node.classList].find(name=>name.startsWith('route-kind-'))})()`)
    if (kind === 'route-kind-summit') {
      await evaluate(clickNext)
      await sleep(350)
      for (let index = 0; index < 3; index += 1) {
        await evaluate(`document.querySelector('.ending-copy .primary-button').click()`)
        await sleep(180)
      }
      check('路线可到达最终结局', await evaluate(`document.querySelector('.ending-copy h1')?.textContent==='空裂：游渡'`))
      await screenshot('ending.png')
      break
    }
    await evaluate(clickNext)
    if (kind === 'route-kind-rest') {
      await until(`!!document.querySelector('.rest-screen')`)
      await screenshot(`rest-${step}.png`)
      await evaluate(`document.querySelector('.rest-copy .secondary-button').click()`)
      await sleep(250)
      await evaluate(`document.querySelector('.rest-copy .primary-button').click()`)
      await until(`document.querySelectorAll('.route-node').length>0`)
      restCount += 1
      continue
    }

    await until(`!!document.querySelector('.level-screen')`)
    const level = await evaluate(`document.querySelector('.level-screen').dataset.level`)
    report.levels.push(level)
    await evaluate(`document.querySelector('.statue-hotspot').click()`)
    await until(`document.querySelector('.level-screen')?.dataset.phase==='inner'`)
    if (level === 'chen' || level === 'yi') {
      if (level === 'yi') await evaluate(`document.querySelector('.choice-panel .primary-button').click()`)
      for (let index = 0; index < 3; index += 1) {
        await evaluate(`document.querySelector('.word-token[aria-label*="可吸收"]:not([disabled])').click()`)
        await sleep(150)
      }
    } else if (level === 'chi' || level === 'man') {
      for (let index = 0; index < 3; index += 1) {
        const point = await evaluate(`(()=>{const c=document.querySelector('.level-screen canvas');const t=JSON.parse(c.dataset.targets||'[]')[0];if(!t)return null;const r=c.getBoundingClientRect();return{x:r.left+t.x*r.width,y:r.top+t.y*r.height}})()`)
        if (!point) throw new Error(`${level}缺少目标`)
        await clickPoint(point.x, point.y)
        await sleep(250)
      }
    } else if (level === 'tan') {
      const start = Date.now()
      while (Date.now() - start < 30000) {
        const value = await evaluate(`Number(document.querySelector('.basket-panel footer strong')?.textContent||0)`)
        if (value >= 12) break
        await evaluate(`document.querySelector('.apple-large')?.click()`)
        await sleep(250)
      }
      await evaluate(`document.querySelector('.basket-panel footer .primary-button').click()`)
    }
    check(`${level}可完成`, await until(`!!document.querySelector('.level-complete')`, 7000))
    await evaluate(`document.querySelector('.level-complete .primary-button').click()`)
    await sleep(400)
    if (await evaluate(`!!document.querySelector('.card-modal')`)) {
      await evaluate(`document.querySelector('.reward-card').click()`)
      await evaluate(`document.querySelector('.card-modal > .primary-button').click()`)
      await sleep(180)
    }
  }

  check('每局恰好三个主题关卡', report.levels.length === 3)
  check('每局恰好一次歇脚', restCount === 1)
  report.routePath = await evaluate(`JSON.parse(localStorage.getItem('youdu-save-v1')).route.path`)
  check('实际路径记录为起点加四段', report.routePath.length === 5)

  await evaluate(`(()=>{const save=JSON.parse(localStorage.getItem('youdu-save-v1'));save.route.currentNodeId='city';save.route.path=['city'];localStorage.setItem('youdu-save-v1',JSON.stringify(save))})()`)
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true }, sessionId)
  await send('Page.navigate', { url: URL }, sessionId)
  await until(`!!document.querySelector('.title-actions .secondary-button')`)
  await evaluate(`[...document.querySelectorAll('.title-actions button')].find(button=>button.textContent.includes('继续上次')).click()`)
  await until(`document.querySelectorAll('.route-node').length>0`)
  check('375px 多路线地图无横向溢出', await evaluate(`document.body.scrollWidth===375 && document.querySelector('.route-map-viewport').getBoundingClientRect().left>=0`))
  await screenshot('mobile-map.png')

  for (const event of events) {
    if (event.method === 'Runtime.exceptionThrown') report.consoleErrors.push(event.params.exceptionDetails?.text || 'exception')
    if (event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error') report.consoleErrors.push('console.error')
    if (event.method === 'Network.responseReceived' && event.params.response.status >= 400) report.networkErrors.push(`${event.params.response.status} ${event.params.response.url}`)
  }
  check('无控制台错误', report.consoleErrors.length === 0)
  check('无失败资源', report.networkErrors.length === 0)
} catch (error) {
  report.fatal = String(error)
  check('路线验收执行完成', false)
} finally {
  try { await Promise.race([send('Browser.close'), sleep(1000)]) } catch { /* closed */ }
  if (child.exitCode === null) child.kill()
}
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
if (report.fatal || report.checks.some((item) => !item.pass)) process.exitCode = 1
