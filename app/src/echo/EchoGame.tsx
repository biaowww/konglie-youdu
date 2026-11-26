import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as RPE, ReactNode } from 'react'

type SceneId = 'bell' | 'seed' | 'light'
type Action = { id: string; label: string; verb: string; hint: string; feedback: string; x: number; y: number }
type Scene = { id: SceneId; title: string; broken: string; art: string; alt: string; result: string; actions: Action[] }
type Screen = 'intro' | 'game' | 'ending'
type Point = { x: number; y: number }
type Saved = { screen: Screen; scene: number; step: number }

const SCENES: Scene[] = [
  {
    id: 'bell', title: '树拱下的铃', broken: '主人走过亭前，却听不见游。铃绳已经烂断。', art: 'temple', alt: '淡墨古寺与弯成月洞的树拱',
    result: '铃响了。主人第一次回头。',
    actions: [
      { id: 'rope', label: '断绳', verb: '拨', hint: '先把绳结拨回檐下的钩子，别让它再淋雨。', feedback: '绳结挂回檐下。现在，铃绳不会再被雨水泡烂。', x: 36, y: 43 },
      { id: 'bell', label: '铃', verb: '拽', hint: '绳结已经挂好，拽一下铃。', feedback: '铃声响过树拱。主人停下了脚步。', x: 56, y: 54 },
    ],
  },
  {
    id: 'seed', title: '石像与种子', broken: '石像散成碎点，玉玦的穗子挂在高处，游够不着。', art: 'statue', alt: '多色墨点构成的抽象猫神像',
    result: '新枝托住石像。游叼下了穗子。',
    actions: [
      { id: 'seed', label: '种荚', verb: '拨', hint: '先把种荚拨进石座的裂缝。', feedback: '种荚落进裂缝。它还缺一瓢水。', x: 30, y: 64 },
      { id: 'bowl', label: '供碗', verb: '推', hint: '把供碗推到檐下，让水沿碗沿流进裂缝。', feedback: '水进了裂缝。枝条一笔一笔托起了石像。', x: 63, y: 56 },
    ],
  },
  {
    id: 'light', title: '两界之灯', broken: '主人提着灯站在交界处，却望向另一边。', art: 'poster', alt: '蓝紫墨点组成的游与压迫感的空裂瞬间',
    result: '裂痕还在，但两边终于看见彼此。',
    actions: [
      { id: 'ink', label: '墨碟', verb: '踩', hint: '让游踩一下墨碟，在灯罩纸上留下爪印。', feedback: '爪印落在灯罩上。光有了游的形状。', x: 28, y: 66 },
      { id: 'lamp', label: '灯', verb: '拨', hint: '把灯拨向玉玦的缺口，让光穿过去。', feedback: '光穿过玦口。主人看见了游的剪影。', x: 66, y: 44 },
    ],
  },
]
const SAVE_KEY = 'youdu-echo-journey-v1'

function readSaved(): Saved | null {
  try {
    const value = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null') as Partial<Saved> | null
    if (!value || !['intro', 'game', 'ending'].includes(value.screen || '') || typeof value.scene !== 'number' || typeof value.step !== 'number') return null
    if (value.scene < 0 || value.scene >= SCENES.length || value.step < 0 || value.step > 2) return null
    return value as Saved
  } catch {
    return null
  }
}

function ObjectMark({ action, done, expected, onClick }: { action: Action; done: boolean; expected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`echo-object is-${action.id} ${done ? 'is-done' : ''} ${expected ? 'is-expected' : ''}`}
      style={{ left: `${action.x}%`, top: `${action.y}%` }}
      data-object={action.id}
      aria-label={`${action.verb}：${action.label}`}
      onClick={onClick}
    >
      <span className="echo-object-shape" aria-hidden="true" />
      <span className="echo-object-label">{action.verb} · {action.label}</span>
    </button>
  )
}

function SceneEffect({ scene, step, children }: { scene: Scene; step: number; children?: ReactNode }) {
  return <div className={`echo-effect scene-${scene.id} step-${step}`} aria-hidden="true">{children}</div>
}

export default function EchoGame() {
  const [saved] = useState(readSaved)
  const [screen, setScreen] = useState<Screen>(saved?.screen ?? 'intro')
  const [sceneIndex, setSceneIndex] = useState(saved?.scene ?? 0)
  const [step, setStep] = useState(saved?.step ?? 0)
  const [message, setMessage] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [lens, setLens] = useState<Point>({ x: 50, y: 82 })
  const [dragging, setDragging] = useState(false)
  const stage = useRef<HTMLElement>(null)
  const scene = SCENES[sceneIndex]
  const expected = scene.actions[step]
  const resolved = step >= scene.actions.length

  useEffect(() => {
    const saved: Saved = { screen, scene: sceneIndex, step }
    localStorage.setItem(SAVE_KEY, JSON.stringify(saved))
  }, [screen, sceneIndex, step])

  const act = (id: string) => {
    if (resolved) return
    if (id !== expected.id) {
      setMessage('这个物件还不是现在的答案。看看当前断开的那一处。')
      return
    }
    setMessage(expected.feedback)
    setShowHint(false)
    setStep((current) => current + 1)
  }

  const pointFrom = (event: RPE): Point | null => {
    const rect = stage.current?.getBoundingClientRect()
    if (!rect) return null
    return {
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
    }
  }

  const moveLens = (event: RPE) => {
    if (!dragging) return
    const point = pointFrom(event)
    if (point) setLens(point)
  }

  const dropLens = (event: RPE) => {
    setDragging(false)
    const point = pointFrom(event)
    if (!point || resolved) return
    const nearest = scene.actions.reduce((best, action) => {
      const distance = Math.hypot(action.x - point.x, action.y - point.y)
      return distance < best.distance ? { action, distance } : best
    }, { action: scene.actions[0], distance: Number.POSITIVE_INFINITY })
    if (nearest.distance > 13) {
      setMessage('玉玦没有碰到物件。也可以直接点一下物件。')
      return
    }
    setLens({ x: nearest.action.x, y: nearest.action.y })
    act(nearest.action.id)
  }

  const next = () => {
    if (sceneIndex === SCENES.length - 1) {
      setScreen('ending')
      return
    }
    setSceneIndex((current) => current + 1)
    setStep(0)
    setMessage('')
    setShowHint(false)
    setLens({ x: 50, y: 82 })
  }

  const restartChapter = () => {
    setStep(0)
    setMessage('')
    setShowHint(false)
    setLens({ x: 50, y: 82 })
  }

  if (screen === 'intro') {
    return (
      <main className="echo-shell">
        <section className="echo-stage echo-intro" data-screen="intro">
          <img className="echo-backdrop" src="./assets/echo/temple.webp" alt="留白古寺与树拱" />
          <div className="echo-intro-copy">
            <span>空裂：回声</span>
            <h1>物件还记得<br />原来的联系。</h1>
            <p>游带来一枚玉玦。<br />这一次，让断开的事重新发生。</p>
            <button type="button" data-act="start" onClick={() => { setSceneIndex(0); setStep(0); setScreen('game') }}>开始</button>
          </div>
          <img className="echo-intro-you" src="./assets/echo/you-cutout.png" alt="游" />
        </section>
      </main>
    )
  }

  if (screen === 'ending') {
    return (
      <main className="echo-shell">
        <section className="echo-stage echo-ending" data-screen="ending">
          <img className="echo-backdrop" src="./assets/echo/poster.webp" alt="空裂两边的游与主人" />
          <div className="echo-ending-copy">
            <span>两界交界</span>
            <h2>裂痕没有消失。<br />但彼此终于看见。</h2>
            <p>铃、枝条与灯，都还记得游。</p>
            <button type="button" data-act="restart" onClick={() => { localStorage.removeItem(SAVE_KEY); setSceneIndex(0); setStep(0); setScreen('intro') }}>再走一遍</button>
          </div>
          <img className="echo-ending-yin" src="./assets/echo/yin.webp" alt="隐的注视" />
        </section>
      </main>
    )
  }

  return (
    <main className="echo-shell">
      <section ref={stage} className={`echo-stage echo-game scene-${scene.id} step-${step} ${resolved ? 'is-resolved' : ''}`} data-screen="game" data-scene={scene.id} data-step={step} data-resolved={resolved}>
        <img className="echo-backdrop" src={`./assets/echo/${scene.art}.webp`} alt={scene.alt} />
        <div className="echo-paper" aria-hidden="true" />
        <header className="echo-heading">
          <span>0{sceneIndex + 1} · {scene.title}</span>
          <h2>{scene.broken}</h2>
        </header>
        <div className="echo-cat" aria-hidden="true"><img src="./assets/echo/you-cutout.png" alt="" /></div>
        {scene.actions.map((action, index) => (
          <ObjectMark key={action.id} action={action} done={index < step} expected={!resolved && index === step} onClick={() => act(action.id)} />
        ))}
        <SceneEffect scene={scene} step={step}>
          {scene.id === 'bell' && <>
            <svg className="echo-rope" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M36 43 Q43 34 56 54" /></svg>
            <div className="echo-bell-rings"><i /><i /><i /></div>
          </>}
          {scene.id === 'seed' && <svg className="echo-branches" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M48 70 Q50 45 48 25" /><path d="M48 58 Q35 43 24 35" /><path d="M49 52 Q65 42 77 29" /><path d="M48 42 Q41 30 39 19" />
          </svg>}
          {scene.id === 'light' && <>
            <div className="echo-paw">··<br />· ·</div>
            <svg className="echo-beam" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M66 44 L45 80" /></svg>
          </>}
        </SceneEffect>
        <button
          type="button"
          className={`echo-jade ${dragging ? 'is-dragging' : ''}`}
          style={{ left: `${lens.x}%`, top: `${lens.y}%` }}
          data-act="jade"
          aria-label="拖动玉玦到物件上"
          onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true) }}
          onPointerMove={moveLens}
          onPointerUp={dropLens}
          onPointerCancel={() => setDragging(false)}
        >
          <span>玦</span>
        </button>
        <div className="echo-guide" aria-live="polite">
          {message || (resolved ? scene.result : '拖玉玦到物件上，或直接点物件。')}
        </div>
        {!resolved && <button type="button" className="echo-hint" data-act="hint" onClick={() => setShowHint((value) => !value)}>隐</button>}
        {showHint && !resolved && <p className="echo-hint-text">{expected.hint}</p>}
        {!resolved && <button type="button" className="echo-reset" data-act="reset" onClick={restartChapter}>重来</button>}
        {resolved && <button type="button" className="echo-next" data-act="next" onClick={next}>{sceneIndex === SCENES.length - 1 ? '去两界交界' : '继续'}</button>}
      </section>
    </main>
  )
}
