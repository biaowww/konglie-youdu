import { useCallback, useEffect, useRef, useState } from 'react'
import './chi-play.css'
import type { CSSProperties, KeyboardEvent as RKE, PointerEvent as RPE, ReactNode } from 'react'

// 痴：表世界 → 点神像 → 同机位里世界 → 拖探灯照出三个“痴” → 墨点入玉玦刻痕 → 局部复色。
// 坐标均为原画（1536×864）百分比；画面内无卡片 HUD、无悬浮玉玦、无贴纸角色。

type Phase = 'outer' | 'turning' | 'inner' | 'complete'
type Glyph = { id: string; ch: string; x: number; y: number; size: number; rot: number; target: boolean }
type Win = { x0: number; y0: number; x1: number; y1: number }
type Pt = { x: number; y: number }
type Props = { onExit: (completed: boolean) => void }

const IMG = './assets/art-reboot/fable/'
const GLYPHS: Glyph[] = [
  { id: 't1', ch: '痴', x: 41, y: 27, size: 3.4, rot: -14, target: true },
  { id: 't2', ch: '痴', x: 57, y: 47, size: 2.3, rot: 21, target: true },
  { id: 't3', ch: '痴', x: 34, y: 63, size: 2.8, rot: 7, target: true },
  { id: 'd1', ch: '疾', x: 49, y: 19, size: 2.6, rot: 9, target: false },
  { id: 'd2', ch: '知', x: 37, y: 43, size: 3.0, rot: -6, target: false },
  { id: 'd3', ch: '疑', x: 51, y: 61, size: 2.5, rot: -18, target: false },
  { id: 'd4', ch: '病', x: 61, y: 31, size: 3.1, rot: 4, target: false },
]
const LAMP_HOME: Pt = { x: 24.5, y: 79 }
const R = 8.5 // 光区半径（画宽 %）
const JADE: Pt = { x: 79, y: 79 }
const STATUE = { x: 18.6, y: 48, w: 8.2, h: 24 }
const YIN: Pt = { x: 67, y: 49 }
const SHAPE = [1, .86, 1.05, .9, .97, .82, 1.04, .93, .88, 1.02, .9, .98]
const HINTS: Record<string, string[]> = {
  why: ['浊色藏成三个痴', '清掉才寻得到渡', '按住提灯照照看'],
  click: ['看见了', '就点它'],
  stall: ['还有', '在留白深处'],
}
const WIN_FULL: Win = { x0: 0, y0: 0, x1: 100, y1: 100 }
// 竖屏取景须同时容下神龛、寻字区、隐的留白与游身上的玉玦
const WIN_MAIN_MOBILE: Win = { x0: 14, y0: 0, x1: 86, y1: 100 }
const WIN_YU_MOBILE: Win = { x0: 60, y0: 45, x1: 100, y1: 100 }
// 忿：一簇向上扬的焰笔（dx, dy 画宽%, 角度）；蓝态与暖态剪影相同
const FEN = [[0, 0, -30], [1.2, -2.4, -42], [2.6, -.8, -20], [.6, 2.2, -55], [3.4, 1.6, -12], [-1.4, -1.6, -60], [4.4, -2.2, -28], [2, -4, -48], [-.4, 3.8, -70]]
const STALL_MS = 20000

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const litBy = (g: Pt, l: Pt) => Math.hypot((g.x - l.x) * 16, (g.y - l.y) * 9) < R * 16 * .8
const lampPoly = (l: Pt) => SHAPE.map((k, i) => {
  const a = (i / SHAPE.length) * Math.PI * 2
  return `${(l.x + Math.cos(a) * R * k).toFixed(2)}% ${(l.y + Math.sin(a) * R * k * 16 / 9).toFixed(2)}%`
}).join(',')

function usePortrait() {
  const q = '(max-aspect-ratio: 4/5)'
  const [p, setP] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const on = () => setP(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return p
}

function Frame({ win, className, children }: { win: Win; className: string; children: ReactNode }) {
  const w = (win.x1 - win.x0) / 100, h = (win.y1 - win.y0) / 100
  const scene: CSSProperties = { width: `${100 / w}%`, height: `${100 / h}%`, left: `${-win.x0 / w}%`, top: `${-win.y0 / h}%` }
  return <div className={`chi-frame ${className}`} style={{ aspectRatio: `${(w * 16) / (h * 9)}` }}><div className="chi-scene">{children && <div className="chi-scene-inner" style={scene}>{children}</div>}</div></div>
}

function Jade({ found, flash }: { found: number; flash: boolean }) {
  // 玉玦是画中游包带上的那枚：这里只在它外弧上点亮刻痕，不另画玉玦
  return (
    <div className={`chi-jade ${flash ? 'is-flash' : ''}`} style={{ left: `${JADE.x}%`, top: `${JADE.y}%` }} data-found={found} aria-label={`玉玦刻痕 ${found}/3`} role="img">
      {[0, 1, 2].map((i) => <i key={i} className={i < found ? 'is-lit' : ''} style={{ '--a': `${-60 + i * 60}deg` } as CSSProperties} />)}
    </div>
  )
}

function YinWords({ lines, k }: { lines: string[] | null; k: string }) {
  return (
    <div className={`chi-yin ${lines ? 'is-speaking' : ''}`} style={{ left: `${YIN.x}%`, top: `${YIN.y}%` }}>
      <span className="chi-yin-dots" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</span>
      {lines && <p key={k} className="chi-yin-text" data-hint={k}>{lines.map((line, li) => <span key={li}>{[...line].map((c, ci) => <b key={ci} style={{ '--d': `${(li * 8 + ci) * 70}ms` } as CSSProperties}>{c}</b>)}</span>)}</p>}
    </div>
  )
}
export default function ChiPlay({ onExit }: Props) {
  const portrait = usePortrait()
  const [phase, setPhase] = useState<Phase>('outer')
  const [lamp, setLamp] = useState<Pt>(LAMP_HOME)
  const [trail, setTrail] = useState<Pt[]>([])
  const [found, setFound] = useState<string[]>([])
  const [shards, setShards] = useState<{ id: string; x: number; y: number }[]>([])
  const [hint, setHint] = useState<string | null>(null)
  const [used, setUsed] = useState<string[]>([])
  const [fen, setFen] = useState(false)
  const [flash, setFlash] = useState(false)
  const [moved, setMoved] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const drag = useRef(false)
  const last = useRef(0)

  const say = useCallback((k: string) => {
    setUsed((u) => { if (u.includes(k) || u.length >= 3) return u; setHint(k); return [...u, k] })
  }, [])

  useEffect(() => {
    if (phase !== 'inner') return
    last.current = Date.now()
    const t = window.setTimeout(() => say('why'), 900)
    const f = window.setTimeout(() => setFen(true), 6000)
    const g = window.setTimeout(() => setFen(false), 7600)
    return () => { clearTimeout(t); clearTimeout(f); clearTimeout(g) }
  }, [phase, say])

  useEffect(() => {
    if (phase !== 'inner') return
    const id = window.setInterval(() => { if (Date.now() - last.current > STALL_MS) { say('stall'); last.current = Date.now() } }, 1000)
    return () => clearInterval(id)
  }, [phase, say])

  useEffect(() => { last.current = Date.now() }, [found.length])

  useEffect(() => {
    if (!hint) return
    const t = window.setTimeout(() => setHint(null), 5200)
    return () => clearTimeout(t)
  }, [hint])

  const targets = GLYPHS.filter((g) => g.target)
  const lit = GLYPHS.filter((g) => phase === 'inner' && litBy(g, lamp))

  const toPt = (e: RPE): Pt | null => {
    const r = box.current?.getBoundingClientRect()
    if (!r) return null
    return { x: Math.min(97, Math.max(3, ((e.clientX - r.left) / r.width) * 100)), y: Math.min(95, Math.max(5, ((e.clientY - r.top) / r.height) * 100)) }
  }
  const down = (e: RPE) => { drag.current = true; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); move(e) }
  const move = (e: RPE) => {
    if (!drag.current) return
    const p = toPt(e); if (!p) return
    setTrail((t) => [lamp, ...t].slice(0, 3)); setLamp(p); last.current = Date.now()
    if (GLYPHS.some((g) => g.target && !found.includes(g.id) && litBy(g, p))) say('click')
    if (!moved) { setMoved(true); if (hint === 'why') setHint(null) }
  }
  const up = () => { drag.current = false; window.setTimeout(() => setTrail([]), 600) }
  const keyLamp = (e: RKE) => {
    const d: Record<string, Pt> = { ArrowLeft: { x: -3, y: 0 }, ArrowRight: { x: 3, y: 0 }, ArrowUp: { x: 0, y: -4 }, ArrowDown: { x: 0, y: 4 } }
    const v = d[e.key]; if (!v) return
    e.preventDefault(); setLamp((l) => ({ x: l.x + v.x, y: l.y + v.y })); setMoved(true); last.current = Date.now()
  }

  const take = (g: Glyph) => {
    if (!g.target || found.includes(g.id) || !litBy(g, lamp)) return
    const next = [...found, g.id]
    setFound(next); setHint(null)
    setShards((s) => [...s, { id: g.id, x: g.x, y: g.y }])
    window.setTimeout(() => setShards((s) => s.filter((x) => x.id !== g.id)), 1100)
    if (next.length === targets.length) {
      setFlash(true)
      window.setTimeout(() => { setFlash(false); setPhase('complete') }, reduced() ? 50 : 1300)
    }
  }

  const enter = () => { setPhase('turning'); window.setTimeout(() => setPhase('inner'), reduced() ? 30 : 900) }
  const win = portrait ? WIN_MAIN_MOBILE : WIN_FULL
  const img = phase === 'outer' || phase === 'turning' ? 'chi-outer' : phase === 'complete' ? 'chi-complete' : 'chi-inner'

  return (
    <main className={`chi-play is-${phase} ${portrait ? 'is-portrait' : ''}`} data-phase={phase} data-found={found.length} data-hints={used.join(',')}>
      <Frame win={win} className="chi-main">
        <div ref={box} className="chi-stage" onPointerDown={phase === 'inner' ? down : undefined} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <img className="chi-bg" src={`${IMG}${img}.webp`} alt="" draggable={false} />
          {phase === 'turning' && <img className="chi-bg chi-bg-next" src={`${IMG}chi-inner.webp`} alt="" draggable={false} />}
          {phase === 'outer' && <button className="chi-statue" style={{ left: `${STATUE.x}%`, top: `${STATUE.y}%`, width: `${STATUE.w}%`, height: `${STATUE.h}%` }} onClick={enter} aria-label="触碰神像" />}
          {phase === 'inner' && <>
            <div className="chi-light" style={{ clipPath: `polygon(${lampPoly(lamp)})` }} aria-hidden="true" />
            {trail.map((t, i) => <i key={i} className="chi-trail" style={{ left: `${t.x}%`, top: `${t.y}%`, opacity: .5 - i * .15 }} />)}
            {GLYPHS.map((g) => {
              const on = lit.includes(g), got = found.includes(g.id)
              return <button key={g.id} className={`chi-glyph ${on ? 'is-lit' : ''} ${got ? 'is-got' : ''}`} data-id={g.id} data-target={g.target} disabled={got}
                style={{ left: `${g.x}%`, top: `${g.y}%`, fontSize: `${g.size}cqw`, '--r': `${g.rot}deg` } as CSSProperties}
                onPointerDown={(e) => e.stopPropagation()} onClick={() => take(g)} aria-label={on ? g.ch : '笔触'}>{got ? '' : g.ch}</button>
            })}
            <button className="chi-lamp" style={{ left: `${lamp.x}%`, top: `${lamp.y}%` }} aria-label="探灯（方向键移动）" onKeyDown={keyLamp} onPointerDown={down}><i /><i /><i /></button>
            {shards.map((s) => <span key={s.id} className="chi-shard" style={{ left: `${s.x}%`, top: `${s.y}%`, '--tx': `${JADE.x - s.x}cqw`, '--ty': `${(JADE.y - s.y) * 9 / 16}cqw` } as CSSProperties}>{Array.from({ length: 6 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</span>)}
            <div className={`chi-fen ${fen ? 'is-cross' : ''}`} aria-hidden="true">{FEN.map(([x, y, a], i) => <i key={i} style={{ left: `${x}cqw`, top: `${y}cqw`, '--a': `${a}deg` } as CSSProperties} />)}</div>
          </>}
          {phase === 'complete' && <div className="chi-fen is-warm" aria-hidden="true">{FEN.map(([x, y, a], i) => <i key={i} style={{ left: `${x}cqw`, top: `${y}cqw`, '--a': `${a}deg` } as CSSProperties} />)}</div>}
          {phase !== 'outer' && phase !== 'turning' && <Jade found={found.length} flash={flash || phase === 'complete'} />}
          {phase === 'inner' && <YinWords lines={hint ? HINTS[hint] : null} k={hint ?? ''} />}
          {phase === 'complete' && <YinWords lines={['浊色清了', '玉玦向上']} k="done" />}
        </div>
      </Frame>
      {portrait && phase !== 'outer' && <Frame win={WIN_YU_MOBILE} className="chi-yu">{null}</Frame>}
      <nav className="chi-nav">
        {phase === 'outer' && <span className="chi-cue">点神像</span>}
        <button className="chi-exit" onClick={() => onExit(phase === 'complete')}>{phase === 'complete' ? '下山' : '退出'}</button>
      </nav>
    </main>
  )
}
