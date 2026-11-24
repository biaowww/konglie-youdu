import { useEffect, useState } from 'react'
import { ArrowLeft, Lightbulb, RotateCcw } from 'lucide-react'
import FocusPuzzle from '../game/puzzles/FocusPuzzle'
import { audio } from '../game/audio'
import KeroseneLamp from './KeroseneLamp'
import './ChiPrototype.css'

type Props = { onExit: () => void }
type Phase = 'outer' | 'transition' | 'inner' | 'complete'

const LAMPS = [
  [8, 18, 46], [31, 15, 38], [52, 23, 52], [88, 19, 40],
  [13, 39, 56], [36, 32, 42], [58, 37, 36], [79, 37, 58],
  [92, 51, 40], [8, 57, 44], [28, 52, 52], [47, 58, 38],
  [69, 52, 48], [86, 65, 42], [17, 73, 54], [37, 77, 40],
  [78, 82, 56], [93, 85, 38],
]
const DUST = Array.from({ length: 24 }, (_, index) => ({
  x: (index * 37 + 11) % 96,
  y: (index * 53 + 7) % 88,
  delay: -(index % 8) * .7,
  duration: 7 + index % 5,
}))

export default function ChiPrototype({ onExit }: Props) {
  const [phase, setPhase] = useState<Phase>('outer')
  const [found, setFound] = useState(0)
  const [guide, setGuide] = useState('隐：先靠近神像。别急着相信眼前的灯。')
  const [hintSignal, setHintSignal] = useState(0)
  const [resetKey, setResetKey] = useState(0)
  const [fenEpisode, setFenEpisode] = useState(0)
  const [lampCount, setLampCount] = useState(9)
  const [extinguished, setExtinguished] = useState<number[]>([])
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    if (phase !== 'transition') return
    const timer = window.setTimeout(() => {
      setPhase('inner')
      setGuide('隐：按住并拖动探灯。看清“痴”后，点一下。')
    }, 1400)
    return () => window.clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== 'inner') return
    const timers = [
      window.setTimeout(() => { setFenEpisode(1); setLampCount(14) }, 5500),
      window.setTimeout(() => setFenEpisode(0), 10500),
      window.setTimeout(() => { setFenEpisode(2); setLampCount(LAMPS.length) }, 14000),
      window.setTimeout(() => setFenEpisode(0), 20000),
    ]
    return () => timers.forEach(window.clearTimeout)
  }, [phase, resetKey])

  const startTransition = () => {
    audio.play('switch')
    setPhase('transition')
    setGuide('隐：玉玦在回应。只是回应，不是答案。')
  }

  const reset = () => {
    setPhase('outer')
    setFound(0)
    setFenEpisode(0)
    setLampCount(9)
    setExtinguished([])
    setGuide('隐：先靠近神像。别急着相信眼前的灯。')
    setResetKey((value) => value + 1)
  }

  const inspectLamp = (id: number) => {
    if (extinguished.includes(id)) return
    setExtinguished((current) => [...current, id])
    setGuide('隐：那只是忿留下的灯影。别让它替你决定。')
    audio.play('click')
  }

  const uiSuffix = phase === 'inner' || phase === 'complete' ? 'inner' : 'outer'
  const fenText = fenEpisode === 1 ? '忿：左边什么都没有。' : '忿：玉玦认得你。你却不认得它。'

  return (
    <section className={`chi-prototype chi-phase-${phase}`} data-phase={phase} aria-label="痴关卡美术与交互原型">
      <div className="chi-scene">
        <div className="chi-temple" />
        <div className="chi-color-wash" />
        <div className="chi-dust" aria-hidden="true">
          {DUST.map((particle, index) => (
            <i key={index} style={{ left: `${particle.x}%`, top: `${particle.y}%`, animationDelay: `${particle.delay}s`, animationDuration: `${particle.duration}s` }} />
          ))}
        </div>

        <header className="chi-header">
          <div>
            <span className="eyebrow">美术原型 01 · 山腰古寺</span>
            <h1>痴</h1>
            <span className="chi-phase-name">{phase === 'outer' || phase === 'transition' ? '表世界 · 失焦' : '里世界 · 灯海'}</span>
          </div>
          <div className="chi-ui-actions">
            <button type="button" className="chi-ui-button" onClick={onExit} aria-label="返回标题">
              <img src={`./assets/chi/ui-action-${uiSuffix}.webp`} alt="" /><ArrowLeft size={19} />
            </button>
            <button type="button" className="chi-ui-button chi-ui-wide" onClick={() => {
              void audio.start().catch(() => undefined)
              const next = !muted
              setMuted(next)
              audio.setMuted(next)
            }} aria-label={muted ? '开启声音' : '静音'}>
              <img src={`./assets/chi/ui-volume-${uiSuffix}.webp`} alt={muted ? '声音已关闭' : '声音已开启'} />
            </button>
            <button type="button" className="chi-ui-button" onClick={() => setHintSignal((value) => value + 1)} aria-label="获得提示">
              <img src={`./assets/chi/ui-settings-${uiSuffix}.webp`} alt="" /><Lightbulb size={17} />
            </button>
            <button type="button" className="chi-ui-button" onClick={reset} aria-label="重置痴原型">
              <img src={`./assets/chi/ui-action-${uiSuffix}.webp`} alt="" /><RotateCcw size={17} />
            </button>
          </div>
        </header>

        <div className="chi-you" aria-label="自然形态的游，颈间挂着玉玦">
          <img className="chi-you-image" src="./assets/chi/you.webp" alt="自然形态的游" />
          <svg className="chi-collar" viewBox="0 0 180 70" aria-hidden="true"><path d="M20 8Q90 70 160 8" /></svg>
          <img className="chi-neck-jade" src="./assets/chi/jade.webp" alt="颈间的玉玦" />
        </div>

        {phase === 'outer' && (
          <button type="button" className="chi-statue-button" onClick={startTransition} aria-label="触碰猫神像">
            <span className="chi-statue-ring" />
            <img src="./assets/chi/statue.webp" alt="有呼吸与微光的猫神像" />
            <span className="chi-statue-label">触碰神像</span>
          </button>
        )}

        {phase === 'transition' && (
          <div className="chi-transition" aria-live="polite">
            <img src="./assets/chi/jade.webp" alt="" />
            <span>表里之间</span>
          </div>
        )}

        {(phase === 'inner' || phase === 'complete') && (
          <>
            <div className="chi-lamp-field" aria-label="幻境煤油灯干扰">
              {LAMPS.slice(0, lampCount).map(([x, y, size], index) => (
                <span key={index} className={extinguished.includes(index) ? 'chi-lamp-out' : ''}>
                  <KeroseneLamp id={index} x={x} y={y} size={size} variant={index % 3} delay={-index * .37} onInspect={inspectLamp} />
                </span>
              ))}
            </div>
            <FocusPuzzle
              variant="chi"
              resetKey={resetKey}
              hintSignal={hintSignal}
              onFound={setFound}
              onSolved={() => { setPhase('complete'); audio.play('complete') }}
              onMessage={setGuide}
            />
            <div className="chi-progress" aria-label={`已找到${found}个痴，共3个`}>
              <span>聚焦</span>
              {[0, 1, 2].map((index) => <i key={index} className={index < found ? 'is-found' : ''} />)}
              <strong>{found} / 3</strong>
            </div>
          </>
        )}

        {fenEpisode > 0 && phase === 'inner' && (
          <div className={`chi-fen-vision chi-fen-episode-${fenEpisode}`} aria-live="polite">
            <img src="./assets/chi/fen.webp" alt="忿从灯海中掠过" />
            <p>{fenText}</p>
          </div>
        )}

        {phase === 'complete' && (
          <div className="chi-complete" role="status">
            <span className="eyebrow">局部复色 · 痴</span>
            <h2>看清，不等于找到答案。<br />只是终于不再误认。</h2>
            <button type="button" className="primary-button" onClick={onExit}>返回标题</button>
          </div>
        )}

        <aside className="chi-guide" aria-live="polite">
          <img src="./assets/chi/yin.webp" alt="隐" />
          <div><span>隐</span><p>{guide.replace(/^隐：/, '')}</p></div>
        </aside>
      </div>
    </section>
  )
}
