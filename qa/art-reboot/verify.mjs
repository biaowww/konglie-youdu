// 阶段验收：独立四格漫画 + 开始界面（真实 Chrome / CDP）。
// 默认自带静态服务读取 app/dist（先 npm run build）；也可用 GAME_URL 指向已有预览。
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
const INK_LIMIT = 0.08 // 文字/标题/印章身下允许的着墨比例上限
const TEXT = {
  1: '卦山的颜色，正在一笔一笔掉下去。',
  2: '寄往卦山的信，全都退了回来。',
  3: '渡是我的主人。玉玦还在响——渡还在山上。',
  4: '五处浊色未清。我上山。',
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const report = { url: '', checks: [], measurements: {}, artMaps: {}, consoleErrors: [], networkErrors: [] }
const check = (name, pass, detail) => {
  report.checks.push({ name, pass: Boolean(pass), ...(detail !== undefined ? { detail } : {}) })
  if (!pass) console.error('FAIL', name, detail !== undefined ? JSON.stringify(detail) : '')
}

// ── 静态服务 ──
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2' }
let server
let URL_ = process.env.GAME_URL
if (!URL_) {
  if (!fs.existsSync(path.join(DIST, 'art-reboot.html'))) {
    console.error('缺少 app/dist/art-reboot.html，请先运行 npm run build')
    process.exit(1)
  }
  server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const file = path.join(DIST, rel)
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
    fs.createReadStream(file).pipe(res)
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  URL_ = `http://127.0.0.1:${server.address().port}/art-reboot.html`
}
report.url = URL_

// ── Chrome ──
const CANDIDATES = [process.env.CHROME_PATH, '/home/ubuntu/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean)
const CHROME_PATH = CANDIDATES.find((item) => fs.existsSync(item))
if (!CHROME_PATH) { console.error('找不到 Chrome，请设置 CHROME_PATH'); process.exit(1) }
const LIBS = '/home/ubuntu/.local/share/youdu-chrome-libs/usr/lib/x86_64-linux-gnu'
const env = { ...process.env }
if (!env.LD_LIBRARY_PATH && fs.existsSync(LIBS)) env.LD_LIBRARY_PATH = LIBS
const noSandbox = process.env.CHROME_NO_SANDBOX === '1' || (process.platform === 'linux' && process.env.CHROME_NO_SANDBOX !== '0')
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'youdu-verify-'))
const child = spawn(CHROME_PATH, [
  '--headless=new', ...(noSandbox ? ['--no-sandbox'] : []), '--remote-debugging-pipe', `--user-data-dir=${profile}`,
  '--no-first-run', '--disable-extensions', '--disable-sync', '--disable-gpu', '--hide-scrollbars', '--mute-audio', '--window-size=1440,900', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'], env })
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
      if (message.error) item.reject(new Error(message.error.message)); else item.resolve(message.result)
    } else if (message.method) events.push(message)
  }
})
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++nextId
  pending.set(id, { resolve, reject })
  writer.write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0')
})

// 页面内工具：文字、可见性、留白采样、原画墨量图
const HELPERS = `
window.__qa = {
  stage: () => document.querySelector('.fable-stage'),
  step: () => document.querySelector('.fable-stage')?.dataset.fableStep,
  rect: (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } },
  opacity: (el) => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= Number(getComputedStyle(n).opacity); return o },
  caption: (n) => {
    const el = document.querySelector('[data-caption="' + n + '"]'); if (!el) return null
    const s = __qa.rect(__qa.stage()), r = __qa.rect(el)
    const spans = [...el.querySelectorAll('span')].map((span) => __qa.rect(span))
    const inside = (q) => q.x >= s.x - .5 && q.y >= s.y - .5 && q.x + q.w <= s.x + s.w + .5 && q.y + q.h <= s.y + s.h + .5 && q.x >= 0 && q.x + q.w <= innerWidth + .5
    return { text: el.textContent, fontPx: parseFloat(getComputedStyle(el).fontSize), opacity: __qa.opacity(el), rect: r, inside: inside(r) && spans.every(inside), wraps: [...el.querySelectorAll('span')].some((span) => span.getClientRects().length > 1) }
  },
  running: (sel) => [...document.querySelectorAll(sel)].reduce((sum, el) => sum + el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running' || a.playState === 'pending').length, 0),
  // 把当前所有可见原画按各自的 cover/object-position 画进与视口同尺寸的画布，
  // 统计元素（逐个子 span，若有）身下的“着墨比例”。斜切裁掉的部分也按有画计算（偏严）。
  inkUnder: async (sel) => {
    const el = document.querySelector(sel); if (!el) return 1
    const c = document.createElement('canvas'); c.width = innerWidth; c.height = innerHeight
    const g = c.getContext('2d', { willReadFrequently: true }); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height)
    for (const img of document.querySelectorAll('img.fable-base')) {
      if (__qa.opacity(img) < .05) continue
      await img.decode(); const b = __qa.rect(img)
      const k = Math.max(b.w / img.naturalWidth, b.h / img.naturalHeight), dw = img.naturalWidth * k, dh = img.naturalHeight * k
      const [px, py] = getComputedStyle(img).objectPosition.split(' ').map((v) => parseFloat(v) / 100)
      g.save(); g.beginPath(); g.rect(b.x, b.y, b.w, b.h); g.clip()
      g.drawImage(img, b.x + (b.w - dw) * px, b.y + (b.h - dh) * py, dw, dh); g.restore()
    }
    const parts = el.querySelectorAll('span').length ? [...el.querySelectorAll('span')] : [el]
    let ink = 0, total = 0
    for (const part of parts) {
      const r = __qa.rect(part)
      const x = Math.max(0, Math.floor(r.x)), y = Math.max(0, Math.floor(r.y))
      const w = Math.min(c.width - x, Math.ceil(r.w)), h = Math.min(c.height - y, Math.ceil(r.h))
      if (w <= 0 || h <= 0) continue
      const d = g.getImageData(x, y, w, h).data
      for (let i = 0; i < d.length; i += 4) { total++; if (.299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2] < 225) ink++ }
    }
    return total ? Math.round(ink / total * 1000) / 1000 : 1
  },
  // 原画的粗网格墨量/彩度图（0–9），存入报告供校准动效与文字位置
  artMap: async (src) => {
    const img = new Image(); img.src = src; await img.decode()
    const cols = 20, rows = Math.max(4, Math.min(40, Math.round(cols * img.naturalHeight / img.naturalWidth)))
    const c = document.createElement('canvas'); c.width = cols * 8; c.height = rows * 8
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, c.width, c.height)
    const d = g.getImageData(0, 0, c.width, c.height).data; const ink = [], sat = []
    for (let r = 0; r < rows; r++) { let a = '', b = ''
      for (let q = 0; q < cols; q++) { let dark = 0, s = 0
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const i = ((r * 8 + y) * c.width + q * 8 + x) * 4
          const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2])
          dark += 1 - (.299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2]) / 255; s += mx ? (mx - mn) / mx : 0 }
        a += Math.min(9, Math.floor(dark / 64 * 10)); b += Math.min(9, Math.floor(s / 64 * 10)) }
      ink.push(a); sat.push(b) }
    return { size: img.naturalWidth + 'x' + img.naturalHeight, ink, sat }
  },
}`

let sessionId
try {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  sessionId = (await send('Target.attachToTarget', { targetId, flatten: true })).sessionId
  await send('Runtime.enable', {}, sessionId)
  await send('Network.enable', {}, sessionId)
  await send('Page.enable', {}, sessionId)
  await send('Page.addScriptToEvaluateOnNewDocument', { source: HELPERS }, sessionId)
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId)
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result?.value
  }
  const until = async (expression, timeout = 12000) => {
    const start = Date.now()
    while (Date.now() - start < timeout) { if (await evaluate(expression)) return true; await sleep(150) }
    return false
  }
  const screenshot = async (name) => {
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId)
    fs.writeFileSync(path.join(OUT, name), Buffer.from(shot.data, 'base64'))
  }
  const center = async (selector) => evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)return null;const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,disabled:!!el.disabled}})()`)
  // 真实输入：鼠标点击 / 触摸点按命中元素中心（不走 element.click()）
  const click = async (selector) => {
    const p = await center(selector); if (!p) throw new Error('找不到 ' + selector)
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y }, sessionId)
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 }, sessionId)
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 }, sessionId)
    await sleep(120)
  }
  const tap = async (selector) => {
    const p = await center(selector); if (!p) throw new Error('找不到 ' + selector)
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, id: 1 }] }, sessionId)
    await sleep(40)
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }, sessionId)
    await sleep(160)
    return p
  }
  const NEXT = '[data-act="next"]', BACK = '[data-act="back"]', SKIP = '[data-act="skip"]', ENTER = '[data-act="enter"]', REPLAY = '[data-act="replay"]'
  const captionOk = async (n, label) => {
    const c = await evaluate(`__qa.caption(${n})`)
    check(`${label}：第${n}格文字逐字正确`, c?.text === TEXT[n], c?.text)
    check(`${label}：第${n}格文字可见、完整在画面内、不折行、字号≥14px`, c && c.opacity >= .95 && c.inside && !c.wraps && c.fontPx >= 14, c)
    const ink = await evaluate(`__qa.inkUnder('[data-caption="${n}"]')`)
    report.measurements[`${label}-第${n}格文字`] = { fontPx: c?.fontPx, rect: c?.rect, inkUnder: ink }
    check(`${label}：第${n}格文字落在留白（身下着墨<${INK_LIMIT * 100}%）`, ink < INK_LIMIT, ink)
  }
  const inkOk = async (label, selector) => {
    const ink = await evaluate(`__qa.inkUnder(${JSON.stringify(selector)})`)
    report.measurements[label] = ink
    check(`${label}（身下着墨<${INK_LIMIT * 100}%）`, ink < INK_LIMIT, ink)
  }

  // ═════ 桌面 1440×900 ═════
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId)
  await send('Page.navigate', { url: URL_ }, sessionId)
  check('入口载入并停在第①格', await until(`window.__qa && __qa.step()==='1'`, 15000))
  for (const name of ['c1-mountain', 'c2-window', 'c3-jade', 'c4-scroll']) report.artMaps[name] = await evaluate(`__qa.artMap('./assets/art-reboot/fable/${name}.webp')`)
  check('没有旧轮播/卡片结构', await evaluate(`!document.querySelector('.comic-rail, .comic-main-shot, .reboot-title-copy, .reboot-primary')`))

  await sleep(900)
  await captionOk(1, '桌面')
  check('第①格前格按钮不可用', (await center(BACK))?.disabled === true)
  check('第①格局部动效在运行（墨点退色）', await evaluate(`__qa.running('[data-panel="1"]')`) > 0)
  check('动效只在当前格：②③此刻静止', await evaluate(`__qa.running('[data-panel="2"]')+__qa.running('[data-panel="3"]')`) === 0)
  await sleep(3200)
  await screenshot('comic-1.png')

  await click(NEXT)
  check('后格：进入第②格', await until(`__qa.step()==='2'`))
  await sleep(900)
  await captionOk(2, '桌面')
  check('第②格局部动效在运行（毛边与信角）', await evaluate(`__qa.running('[data-panel="2"]')`) >= 2)
  await sleep(900)
  await screenshot('comic-2.png')

  await click(NEXT)
  check('后格：进入第③格', await until(`__qa.step()==='3'`))
  await sleep(900)
  await captionOk(3, '桌面')
  check('第③格局部动效在运行（玉玦两拍、包带、点簇）', await evaluate(`__qa.running('[data-panel="3"]')`) >= 3)
  const shapes = await evaluate(`[1,2,3].map(n=>{const a=document.querySelector('[data-panel="'+n+'"] .fable-art');const r=a.getBoundingClientRect();return{ratio:Math.round(r.width/r.height*100)/100,clip:getComputedStyle(a).clipPath}})`)
  report.measurements.panelShapes = shapes
  check('不等画幅：①横长条 ②竖窄条 ③斜切格', shapes[0].ratio > 1.8 && shapes[1].ratio < .6 && shapes[2].clip.startsWith('polygon') && new Set(shapes.map((s) => s.ratio)).size === 3, shapes)
  // 前两格的文字在三格同屏时仍须留白
  await inkOk('桌面：三格同屏时第1格文字仍在留白', '[data-caption="1"]')
  await inkOk('桌面：三格同屏时第2格文字仍在留白', '[data-caption="2"]')
  check('文字无底板（背景透明、无边框）', await evaluate(`[...document.querySelectorAll('.fable-caption')].every(el=>{const s=getComputedStyle(el);return s.backgroundColor==='rgba(0, 0, 0, 0)'&&s.backgroundImage==='none'&&parseFloat(s.borderTopWidth)===0})`))
  check('三格文字互不重叠', await evaluate(`(()=>{const r=[1,2,3].map(n=>__qa.rect(document.querySelector('[data-caption="'+n+'"]')));const hit=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;return !hit(r[0],r[1])&&!hit(r[0],r[2])&&!hit(r[1],r[2])})()`))
  await sleep(600)
  await screenshot('comic-3.png')

  await click(BACK)
  check('前格：③退回②', await until(`__qa.step()==='2'`))
  await click(BACK)
  check('前格：②退回①', await until(`__qa.step()==='1'`))
  await click(NEXT); await click(NEXT)
  check('再次前进回到第③格', await until(`__qa.step()==='3'`))

  await click(NEXT)
  check('后格：进入第④格竖卷', await until(`__qa.step()==='4' && !!document.querySelector('.fable-scroll')`))
  await sleep(700)
  const moving = await evaluate(`(()=>{const s=document.querySelector('.fable-scroll');return{settled:__qa.stage().dataset.settled,transform:getComputedStyle(s).transform,running:s.getAnimations().length}})()`)
  check('竖卷正在上行（尚未停稳、有位移）', moving.settled === 'false' && moving.transform !== 'none' && moving.running > 0, moving)
  const t1 = await evaluate(`getComputedStyle(document.querySelector('.fable-scroll')).transform`)
  await sleep(1800)
  const t2 = await evaluate(`getComputedStyle(document.querySelector('.fable-scroll')).transform`)
  const ty = (m) => Number(m.replace(/[^0-9.,-]/g, '').split(',')[5])
  check('竖卷镜头自下而上（画面向下位移增大）', ty(t2) > ty(t1) + 20, { t1, t2 })
  check('竖卷自行停稳', await until(`__qa.stage().dataset.settled==='true'`, 10000))
  await sleep(1200)
  await evaluate(`(document.querySelector('.fable-scroll').__same = true, document.querySelector('.fable-scroll > img').__same = true)`)
  const settledBox = await evaluate(`(()=>{const s=document.querySelector('.fable-scroll');return{rect:__qa.rect(s),stage:__qa.rect(__qa.stage()),transform:getComputedStyle(s).transform}})()`)
  check('停稳后竖卷铺满舞台且无残余位移', settledBox.transform === 'none' && Math.abs(settledBox.rect.w - settledBox.stage.w) < 1 && Math.abs(settledBox.rect.h - settledBox.stage.h) < 1, settledBox)
  await captionOk(4, '桌面')
  check('第④格局部动效存在（五处浊痕漂移、山顶玉色脉动）', await evaluate(`document.querySelectorAll('.p4-mark').length===5 && document.querySelectorAll('.p4-summit i').length>0 && __qa.running('.fable-scroll .fable-fx')>0`))
  await screenshot('comic-4.png')

  await click(BACK)
  check('前格：④退回③', await until(`__qa.step()==='3'`))
  await click(NEXT)
  await until(`__qa.step()==='4'`)
  await click(NEXT)
  check('上行途中再按后格可立即停稳', await until(`__qa.stage().dataset.settled==='true'`, 1500))
  await evaluate(`(document.querySelector('.fable-scroll').__same = true, document.querySelector('.fable-scroll > img').__same = true)`)

  await click(NEXT)
  check('停稳后接入开始界面', await until(`__qa.step()==='title'`))
  const cont = await evaluate(`(()=>{const s=document.querySelector('.fable-scroll'),i=document.querySelector('.fable-scroll > img');return{sameNode:s.__same===true&&i.__same===true,rect:__qa.rect(s),transform:getComputedStyle(s).transform,src:i.getAttribute('src'),natural:i.naturalWidth}})()`)
  check('开始界面与停稳竖卷是同一节点、同一张图、同一位置（无跳切）', cont.sameNode && cont.transform === 'none' && cont.src.endsWith('c4-scroll.webp') && cont.natural > 0 && JSON.stringify(cont.rect) === JSON.stringify(settledBox.rect), cont)
  await sleep(1700)
  const title = await evaluate(`(()=>{const h=document.querySelector('.fable-title h1'),seal=document.querySelector('[data-act="enter"]'),re=document.querySelector('[data-act="replay"]');const cs=getComputedStyle(seal);return{h1:h?.textContent,h1Opacity:__qa.opacity(h),hRect:__qa.rect(h),seal:seal?.textContent.trim(),sealOpacity:__qa.opacity(seal),sealRect:__qa.rect(seal),sealRadius:cs.borderRadius,sealShadow:cs.boxShadow,sealClip:cs.clipPath.slice(0,7),replay:re?.textContent.trim(),reRect:__qa.rect(re),stage:__qa.rect(__qa.stage())}})()`)
  report.measurements.title = title
  const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  const within = (a, s) => a.x >= s.x && a.y >= s.y && a.x + a.w <= s.x + s.w + .5 && a.y + a.h <= s.y + s.h + .5
  check('开始界面标题为「空裂：游渡」，可见且完整在画面内', title.h1 === '空裂：游渡' && title.h1Opacity >= .95 && within(title.hRect, title.stage), title)
  check('「入山」是印章形而非现代卡片（无圆角、无投影、不规则印面）', title.seal === '入山' && title.sealOpacity >= .95 && title.sealRadius === '0px' && title.sealShadow === 'none' && title.sealClip === 'polygon', title)
  check('保留「重看漫画」', title.replay === '重看漫画')
  check('标题、印章、重看漫画互不重叠', !hit(title.hRect, title.sealRect) && !hit(title.hRect, title.reRect) && !hit(title.sealRect, title.reRect))
  await inkOk('桌面：标题落在留白', '.fable-title h1')
  await inkOk('桌面：「入山」印章落在留白', ENTER)
  await screenshot('title.png')

  await click(REPLAY)
  check('重看漫画：回到第①格', await until(`__qa.step()==='1'`))
  await click(SKIP)
  check('跳过：从第①格直达开始界面', await until(`__qa.step()==='title' && !!document.querySelector('[data-act="enter"]')`))
  await sleep(1600)
  await click(ENTER)
  check('入山：进入痴表世界', await until(`document.querySelector('.chi-play')?.dataset.phase==='outer'`, 8000))
  check('痴：旧原型结构已不在（无旧痴容器、卡片 HUD）', await evaluate(`!document.querySelector('.reboot-chi, .reboot-hud, .reboot-card, .reboot-primary')`))
  await sleep(700); await screenshot('outer.png')

  // ── 痴：真实交互（鼠标 / 触摸拖灯、点字） ──
  const playChi = async (label, touch) => {
    const press = touch ? tap : click
    const st = await center('.chi-statue')
    check(`${label}：神像热区≥44px`, st && st.w >= 44 && st.h >= 44, st)
    await press('.chi-statue')
    check(`${label}：点神像进入里世界`, await until(`document.querySelector('.chi-play')?.dataset.phase==='inner'`, 5000))
    check(`${label}：提示一由隐说出（无底板）`, await until(`(()=>{const p=document.querySelector('[data-hint="why"]');return p&&getComputedStyle(p).backgroundColor==='rgba(0, 0, 0, 0)'})()`, 4000))
    const yinPx = await evaluate(`parseFloat(getComputedStyle(document.querySelector('.chi-yin-text')).fontSize)`)
    check(`${label}：隐的字高≥14px`, yinPx >= 14, yinPx)
    const drag = async (to) => {
      const p = await center('.chi-lamp'); const n = 10
      if (touch) {
        await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, id: 1 }] }, sessionId)
        for (let i = 1; i <= n; i++) { await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p.x + (to.x - p.x) * i / n, y: p.y + (to.y - p.y) * i / n, id: 1 }] }, sessionId); await sleep(16) }
        await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }, sessionId)
      } else {
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y }, sessionId)
        await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1 }, sessionId)
        for (let i = 1; i <= n; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x + (to.x - p.x) * i / n, y: p.y + (to.y - p.y) * i / n, button: 'left', buttons: 1 }, sessionId); await sleep(16) }
        await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: to.x, y: to.y, button: 'left', buttons: 0, clickCount: 1 }, sessionId)
      }
      await sleep(300)
    }
    const lamp0 = await center('.chi-lamp')
    check(`${label}：探灯热区≥44px`, lamp0 && lamp0.w >= 44 && lamp0.h >= 44, lamp0)
    for (const [k, id] of ['t1', 't2', 't3'].entries()) {
      const sel = `.chi-glyph[data-id="${id}"]`
      check(`${label}：${id} 未照时不可辨`, await evaluate(`!document.querySelector('${sel}').classList.contains('is-lit')`))
      const g = await center(sel)
      await drag(g)
      check(`${label}：拖灯照出 ${id}`, await evaluate(`document.querySelector('${sel}').classList.contains('is-lit')`))
      check(`${label}：${id} 热区≥44px`, g.w >= 44 && g.h >= 44, g)
      if (k === 0 && !touch) { await sleep(600); await screenshot('inner.png') }
      await press(sel)
      check(`${label}：点中 ${id}，刻痕亮 ${k + 1} 格`, await until(`document.querySelectorAll('.chi-jade i.is-lit').length===${k + 1}`, 2500))
    }
    const lamp1 = await center('.chi-lamp')
    check(`${label}：探灯确实被拖动`, Math.hypot(lamp1.x - lamp0.x, lamp1.y - lamp0.y) > 30, { lamp0, lamp1 })
    check(`${label}：找齐后进入局部复色`, await until(`document.querySelector('.chi-play')?.dataset.phase==='complete' && document.querySelector('.chi-bg').getAttribute('src').endsWith('chi-complete.webp')`, 5000))
    const hints = await evaluate(`document.querySelector('.chi-play').dataset.hints`)
    check(`${label}：全程提示≤3次`, hints.split(',').filter(Boolean).length <= 3, hints)
    const ex = await center('.chi-exit')
    check(`${label}：退出热区≥44px`, ex && ex.w >= 44 && ex.h >= 44, ex)
  }
  await playChi('桌面痴', false)
  await sleep(1200); await screenshot('complete.png')
  await click('.chi-exit')
  check('痴：下山回到开始界面', await until(`__qa.step()==='title'`, 5000))

  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true }, sessionId)
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 }, sessionId)
  await send('Page.navigate', { url: URL_ }, sessionId)
  await until(`window.__qa && __qa.step()==='1'`, 15000)
  await tap(SKIP); await until(`__qa.step()==='title'`); await sleep(1600)
  await tap(ENTER)
  check('375px：触摸入山进入痴', await until(`document.querySelector('.chi-play')?.dataset.phase==='outer'`, 8000))
  await playChi('375px痴', true)
  check('375px痴：无横向溢出', await evaluate(`document.documentElement.scrollWidth<=innerWidth`))
  await sleep(800); await screenshot('chi-mobile.png')

  // ═════ 手机 375×812 触摸 ═════
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true }, sessionId)
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 }, sessionId)
  await send('Page.navigate', { url: URL_ }, sessionId)
  check('375px：载入第①格', await until(`window.__qa && __qa.step()==='1'`, 15000))
  await sleep(900)
  await captionOk(1, '375px')
  for (const sel of [BACK, SKIP, NEXT]) { const p = await center(sel); check(`375px：${sel} 触摸热区≥44px`, p && p.w >= 44 && p.h >= 44, p) }
  await tap(NEXT)
  check('375px：触摸后格到第②格', await until(`__qa.step()==='2'`))
  await sleep(900)
  await captionOk(2, '375px')
  await tap(NEXT)
  check('375px：触摸后格到第③格', await until(`__qa.step()==='3'`))
  await sleep(900)
  await captionOk(3, '375px')
  await inkOk('375px：三格同屏时第1格文字仍在留白', '[data-caption="1"]')
  await inkOk('375px：三格同屏时第2格文字仍在留白', '[data-caption="2"]')
  const p3 = await evaluate(`(()=>{const a=__qa.rect(document.querySelector('[data-panel="3"] .fable-art')),s=__qa.rect(__qa.stage()),nav=__qa.rect(document.querySelector('.fable-nav'));return{a,s,nav}})()`)
  check('375px：斜切格完整在画面内，不被裁坏、不被翻格按钮压住', within(p3.a, p3.s) && p3.a.y + p3.a.h <= p3.nav.y + .5, p3)
  await screenshot('mobile.png')
  await tap(BACK)
  check('375px：触摸前格退回第②格', await until(`__qa.step()==='2'`))
  await tap(NEXT); await tap(NEXT)
  check('375px：触摸进入第④格', await until(`__qa.step()==='4'`))
  check('375px：竖卷停稳', await until(`__qa.stage().dataset.settled==='true'`, 10000))
  await sleep(1200)
  await captionOk(4, '375px')
  check('375px：第④格文字不被翻格按钮压住', await evaluate(`(()=>{const c=__qa.rect(document.querySelector('[data-caption="4"]')),n=__qa.rect(document.querySelector('.fable-nav'));return c.y+c.h<=n.y+.5})()`))
  await screenshot('mobile-comic-4.png')
  await tap(NEXT)
  check('375px：触摸进入开始界面', await until(`__qa.step()==='title'`))
  await sleep(1700)
  const m = await evaluate(`(()=>{const seal=__qa.rect(document.querySelector('[data-act="enter"]')),h=__qa.rect(document.querySelector('.fable-title h1')),re=__qa.rect(document.querySelector('[data-act="replay"]')),s=__qa.rect(__qa.stage());return{seal,h,re,s,scrollW:document.documentElement.scrollWidth,vw:innerWidth,vh:innerHeight}})()`)
  report.measurements.mobileTitle = m
  check('375px：无横向溢出', m.scrollW === 375 && m.s.x >= 0 && m.s.x + m.s.w <= 375.5, m)
  check('375px：印章≥44px、在拇指可及的下半屏且完整在画面内', m.seal.w >= 44 && m.seal.h >= 44 && m.seal.y + m.seal.h / 2 > m.vh * .5 && within(m.seal, m.s), m.seal)
  check('375px：标题完整在画面内', within(m.h, m.s), m.h)
  check('375px：重看漫画热区≥44px', m.re.w >= 44 && m.re.h >= 44, m.re)
  check('375px：标题、印章、重看漫画互不重叠', !hit(m.seal, m.h) && !hit(m.seal, m.re) && !hit(m.h, m.re), m)
  await inkOk('375px：标题落在留白', '.fable-title h1')
  await inkOk('375px：「入山」印章落在留白', ENTER)
  await screenshot('mobile-title.png')
  await tap(REPLAY)
  check('375px：触摸重看漫画回到第①格', await until(`__qa.step()==='1'`))
  await tap(SKIP)
  check('375px：触摸跳过到开始界面', await until(`__qa.step()==='title'`))
  await sleep(1600)
  await tap(ENTER)
  check('375px：触摸「入山」进入痴流程', await until(`document.querySelector('.chi-play')?.dataset.phase==='outer'`, 8000))

  const failedRequests = new Map()
  for (const event of events) {
    if (event.method === 'Runtime.exceptionThrown') report.consoleErrors.push(event.params.exceptionDetails?.exception?.description || event.params.exceptionDetails?.text || 'exception')
    if (event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error') report.consoleErrors.push(event.params.args?.map((arg) => arg.value ?? arg.description).join(' ') || 'console.error')
    if (event.method === 'Network.responseReceived' && event.params.response.status >= 400) report.networkErrors.push(`${event.params.response.status} ${event.params.response.url}`)
    if (event.method === 'Network.loadingFailed' && !event.params.canceled) failedRequests.set(event.params.requestId, event.params.errorText)
  }
  for (const [id, text] of failedRequests) report.networkErrors.push(`failed ${id} ${text}`)
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
const ink = Object.fromEntries(Object.entries(report.measurements).filter(([, v]) => typeof v === 'number' || v?.inkUnder !== undefined).map(([k, v]) => [k, typeof v === 'number' ? v : v.inkUnder]))
console.log(JSON.stringify({ url: report.url, total: report.checks.length, passed: report.checks.length - failed.length, failed, inkUnder: ink, panelShapes: report.measurements.panelShapes, consoleErrors: report.consoleErrors, networkErrors: report.networkErrors }))
if (report.fatal || failed.length) process.exitCode = 1
