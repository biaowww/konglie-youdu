import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const DIST = path.join(ROOT, 'app/dist')
const OUT = HERE
fs.mkdirSync(OUT, { recursive: true })
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'youdu-echo-qa-'))
const child = spawn(CHROME, [
  '--headless=new', ...(process.env.CHROME_NO_SANDBOX === '1' ? ['--no-sandbox'] : []), '--remote-debugging-pipe', `--user-data-dir=${profile}`,
  '--no-first-run', '--disable-extensions', '--disable-sync', '--disable-gpu', '--mute-audio', '--window-size=1440,900', 'about:blank',
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
const check = (name, pass, detail) => {
  report.checks.push({ name, pass: Boolean(pass), ...(detail === undefined ? {} : { detail }) })
  if (process.env.QA_DEBUG) console.error('CHECK', name, pass)
  if (!pass) console.error('FAIL', name, detail === undefined ? '' : JSON.stringify(detail))
}
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png' }
let server
let URL_ = process.env.GAME_URL
if (!URL_) {
  server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const file = path.join(DIST, rel)
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
    fs.createReadStream(file).pipe(res)
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  URL_ = `http://127.0.0.1:${server.address().port}/echo.html`
}
let sessionId
try {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  sessionId = (await send('Target.attachToTarget', { targetId, flatten: true })).sessionId
  for (const method of ['Runtime.enable', 'Network.enable', 'Page.enable']) await send(method, {}, sessionId)
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId)
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId)
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result?.value
  }
  const until = async (expression, timeout = 10000) => {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      if (await evaluate(expression)) return true
      await sleep(150)
    }
    return false
  }
  const center = async (selector) => evaluate(`(()=>{const e=document.querySelector('${selector}');if(!e)return null;const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}})()`)
  const screenshot = async (name) => {
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId)
    fs.writeFileSync(path.join(OUT, name), Buffer.from(shot.data, 'base64'))
  }
  const click = async (selector) => {
    const p = await center(selector)
    if (!p) throw new Error(`Missing ${selector}`)
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 }, sessionId)
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 }, sessionId)
  }
  const tap = async (selector) => {
    const p = await center(selector)
    if (!p) throw new Error(`Missing ${selector}`)
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, id: 1 }] }, sessionId)
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }, sessionId)
  }
  const drag = async (selector, touch) => {
    const from = await center('.echo-jade')
    const to = await center(selector)
    if (!from || !to) throw new Error(`Cannot drag to ${selector}`)
    const steps = 12
    if (touch) {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from.x, y: from.y, id: 1 }] }, sessionId)
      for (let i = 1; i <= steps; i++) {
        await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from.x + (to.x - from.x) * i / steps, y: from.y + (to.y - from.y) * i / steps, id: 1 }] }, sessionId)
        await sleep(18)
      }
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }, sessionId)
    } else {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x, y: from.y }, sessionId)
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: from.x, y: from.y, button: 'left', buttons: 1, clickCount: 1 }, sessionId)
      for (let i = 1; i <= steps; i++) {
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x + (to.x - from.x) * i / steps, y: from.y + (to.y - from.y) * i / steps, button: 'left', buttons: 1 }, sessionId)
        await sleep(18)
      }
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: to.x, y: to.y, button: 'left', buttons: 0, clickCount: 1 }, sessionId)
    }
    await sleep(250)
  }
  const playScene = async (scene, first, second, label, touch) => {
    const press = touch ? tap : click
    await until(`document.querySelector('.echo-game')?.dataset.scene==='${scene}'`)
    check(`${label}：原画与两个可交互物件已加载`, await evaluate(`document.querySelector('.echo-backdrop').naturalWidth>0 && document.querySelectorAll('.echo-object').length===2`))
    const jade = await center('.echo-jade')
    check(`${label}：玉玦热区≥44px`, jade && jade.w >= 44 && jade.h >= 44, jade)
    if (scene === 'bell') {
      await press(`[data-object="${second}"]`)
      check(`${label}：错误顺序不会推进`, await evaluate(`document.querySelector('.echo-game').dataset.step==='0' && document.querySelector('.echo-guide').textContent.includes('还不是')`))
    }
    await drag(`[data-object="${first}"]`, touch)
    check(`${label}：玉玦拖放推进因果`, await until(`document.querySelector('.echo-game').dataset.step==='1'`))
    if (scene === 'bell' && !touch) {
      await send('Page.navigate', { url: URL_ }, sessionId)
      check(`${label}：刷新恢复本关进度`, await until(`document.querySelector('.echo-game')?.dataset.scene==='bell' && document.querySelector('.echo-game').dataset.step==='1'`))
    }
    await press(`[data-object="${second}"]`)
    check(`${label}：完整因果演出后完成`, await until(`document.querySelector('.echo-game').dataset.resolved==='true'`))
    await sleep(500)
    await screenshot(`${scene}${touch ? '-mobile' : ''}.png`)
    await press('[data-act="next"]')
  }
  const playAll = async (label, touch) => {
    await playScene('bell', 'rope', 'bell', `${label}·铃`, touch)
    await playScene('seed', 'seed', 'bowl', `${label}·种子`, touch)
    await playScene('light', 'ink', 'lamp', `${label}·灯`, touch)
    check(`${label}：进入两界结尾`, await until(`!!document.querySelector('[data-screen="ending"]')`))
    await screenshot(`ending${touch ? '-mobile' : ''}.png`)
    await (touch ? tap : click)('[data-act="restart"]')
    check(`${label}：可重新开始`, await until(`!!document.querySelector('[data-screen="intro"]')`))
  }

  await send('Page.navigate', { url: URL_ }, sessionId)
  check('B 版独立首页', await until(`!!document.querySelector('[data-screen="intro"]')`, 15000))
  await screenshot('intro.png')
  await click('[data-act="start"]')
  await playAll('桌面', false)

  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true }, sessionId)
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 }, sessionId)
  await send('Page.navigate', { url: URL_ }, sessionId)
  await evaluate(`localStorage.removeItem('youdu-echo-journey-v1'); location.reload()`)
  await until(`!!document.querySelector('[data-screen="intro"]')`, 15000)
  await tap('[data-act="start"]')
  await playAll('375px', true)
  check('375px：无横向溢出', await evaluate(`document.documentElement.scrollWidth<=innerWidth`))

  for (const event of events) {
    if (event.method === 'Runtime.exceptionThrown') report.consoleErrors.push(event.params.exceptionDetails?.text || 'exception')
    if (event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error') report.consoleErrors.push('console.error')
    if (event.method === 'Network.responseReceived' && event.params.response.status >= 400) report.networkErrors.push(`${event.params.response.status} ${event.params.response.url}`)
  }
  check('无控制台错误', report.consoleErrors.length === 0, report.consoleErrors)
  check('无失败资源', report.networkErrors.length === 0, report.networkErrors)
} catch (error) {
  report.fatal = String(error?.stack || error)
  check('验收脚本完整执行', false, report.fatal)
} finally {
  try { await Promise.race([send('Browser.close'), sleep(1000)]) } catch { /* closed */ }
  if (child.exitCode === null) child.kill()
  server?.close()
  try { fs.rmSync(profile, { recursive: true, force: true }) } catch { /* ignore */ }
}
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
const failed = report.checks.filter((item) => !item.pass)
console.log(JSON.stringify({ total: report.checks.length, passed: report.checks.length - failed.length, failed, consoleErrors: report.consoleErrors, networkErrors: report.networkErrors }))
if (report.fatal || failed.length) process.exitCode = 1
