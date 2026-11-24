import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'qa/mobile')
fs.mkdirSync(OUT, { recursive: true })
const URL = process.env.GAME_URL || 'http://127.0.0.1:7101/'
const child = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-pipe', `--user-data-dir=${path.join(OUT, 'profile')}`, '--no-first-run', '--disable-extensions', '--disable-gpu', '--mute-audio', '--window-size=375,812', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] })
const writer = child.stdio[3]; const reader = child.stdio[4]
let nextId = 0; let buffer = Buffer.alloc(0); const pending = new Map(); const events = []
reader.on('data', (chunk) => {
  buffer = Buffer.concat([buffer, chunk]); let end
  while ((end = buffer.indexOf(0)) !== -1) {
    const raw = buffer.subarray(0, end).toString('utf8'); buffer = buffer.subarray(end + 1)
    let message; try { message = JSON.parse(raw) } catch { continue }
    if (message.id !== undefined && pending.has(message.id)) { const item = pending.get(message.id); pending.delete(message.id); message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result) }
    else if (message.method) events.push(message)
  }
})
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, { resolve, reject }); writer.write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0') })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const report = { checks: [], consoleErrors: [], networkErrors: [] }
const check = (name, pass) => report.checks.push({ name, pass: Boolean(pass) })
let sessionId
try {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  sessionId = (await send('Target.attachToTarget', { targetId, flatten: true })).sessionId
  await send('Runtime.enable', {}, sessionId); await send('Network.enable', {}, sessionId); await send('Page.enable', {}, sessionId)
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true }, sessionId)
  const evaluate = async (expression) => { const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result?.value }
  const screenshot = async (name) => { const shot = await send('Page.captureScreenshot', { format: 'png' }, sessionId); fs.writeFileSync(path.join(OUT, name), Buffer.from(shot.data, 'base64')) }
  const loadLevel = async (level) => {
    await evaluate(`localStorage.setItem('youdu-save-v1',JSON.stringify({seed:7,order:['${level}','chen','man','yi','tan'],completed:[],cards:[],volume:0,route:{seed:7,nodes:[{id:'city',layer:0,kind:'start',location:'测试入口',x:20,y:80,next:['test']},{id:'test',layer:1,kind:'level',level:'${level}',location:'测试地点',x:50,y:50,next:[]}],currentNodeId:'city',path:['city']}}))`)
    await send('Page.navigate', { url: URL }, sessionId); await sleep(1500)
    await evaluate(`[...document.querySelectorAll('.title-actions button')].find(button=>button.textContent.includes('继续上次')).click()`); await sleep(250)
    await evaluate(`document.querySelector('.route-node.is-next').click()`); await sleep(200)
    await evaluate(`document.querySelector('.statue-hotspot').click()`); await sleep(1450)
  }

  await send('Page.navigate', { url: URL }, sessionId); await sleep(1500)
  check('移动端标题无横向溢出', await evaluate(`document.body.scrollWidth===375 && window.innerWidth===375`))
  await screenshot('mobile-title.png')
  await evaluate(`document.querySelector('.title-actions .primary-button').click()`); await sleep(650)
  check('出城舞台完整位于375px屏幕内', await evaluate(`(()=>{const r=document.querySelector('.journey-stage').getBoundingClientRect();return r.left>=0 && r.right<=375 && r.top>=0 && r.bottom<=812 && document.body.scrollWidth===375})()`))
  await screenshot('mobile-prologue.png')
  await evaluate(`document.querySelector('.journey-skip').click()`); await sleep(250)
  check('跳过出城进入入山', await evaluate(`!!document.querySelector('.arrival-copy')`))
  await loadLevel('chi')
  check('痴进入里世界', await evaluate(`document.querySelector('.level-screen')?.dataset.phase==='inner'`))
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 80, y: 360, id: 1 }] }, sessionId)
  await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 170, y: 470, id: 1 }] }, sessionId)
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }, sessionId)
  await sleep(250)
  check('触摸拖动不误收集', await evaluate(`JSON.parse(document.querySelector('canvas').dataset.targets||'[]').length===3`))
  const point = await evaluate(`(()=>{const c=document.querySelector('canvas');const t=JSON.parse(c.dataset.targets)[0];const r=c.getBoundingClientRect();return{x:r.left+t.x*r.width,y:r.top+t.y*r.height}})()`)
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: point.x, y: point.y, id: 1 }] }, sessionId)
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }, sessionId)
  await sleep(250)
  check('触摸点选可收集目标', await evaluate(`JSON.parse(document.querySelector('canvas').dataset.targets||'[]').length===2`))
  check('触摸操作不滚动页面', await evaluate(`window.scrollX===0 && window.scrollY===0`))
  await screenshot('mobile-chi.png')
  await loadLevel('tan'); await sleep(1800)
  check('贪背包完整位于屏幕内', await evaluate(`(()=>{const r=document.querySelector('.basket-panel').getBoundingClientRect();return r.left>=0 && r.right<=375 && r.bottom<=812 && r.top>=0})()`))
  await screenshot('mobile-tan.png')
  check('移动端无横向溢出', await evaluate(`document.body.scrollWidth===375`))
  for (const event of events) {
    if (event.method === 'Runtime.exceptionThrown') report.consoleErrors.push(event.params.exceptionDetails?.text || 'exception')
    if (event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error') report.consoleErrors.push('console.error')
    if (event.method === 'Network.responseReceived' && event.params.response.status >= 400) report.networkErrors.push(`${event.params.response.status} ${event.params.response.url}`)
  }
  check('无控制台错误', report.consoleErrors.length === 0)
  check('无失败资源', report.networkErrors.length === 0)
} catch (error) { report.fatal = String(error); check('移动验收执行完成', false) }
finally { try { await Promise.race([send('Browser.close'), sleep(1000)]) } catch { /* closed */ } if (child.exitCode === null) child.kill() }
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
if (report.fatal || report.checks.some((item) => !item.pass)) process.exitCode = 1
