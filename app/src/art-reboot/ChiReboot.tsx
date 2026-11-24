import { useEffect, useState } from 'react'
import FocusPuzzle from '../game/puzzles/FocusPuzzle'
import { audio } from '../game/audio'

type Props = { onExit: () => void }
type Phase = 'outer' | 'transition' | 'inner' | 'complete'

const LAMPS = [
  [7, 14, 42], [35, 18, 34], [61, 24, 46], [85, 19, 36],
  [20, 42, 48], [48, 37, 36], [77, 42, 44], [91, 54, 34],
  [12, 62, 38], [36, 57, 48], [68, 61, 38], [84, 73, 46],
  [22, 78, 36], [54, 76, 42],
]
const FEN_LINES = ['忿：光越多，越看不清。', '忿：玉玦认得你。你却不认得它。']

export default function ChiReboot({ onExit }: Props) {
  const [phase, setPhase] = useState<Phase>('outer')
  const [found, setFound] = useState(0)
  const [guide, setGuide] = useState('先靠近神像。别急着相信眼前的灯。')
  const [hintSignal, setHintSignal] = useState(0)
  const [resetKey, setResetKey] = useState(0)
  const [fenEpisode, setFenEpisode] = useState(0)
  const [lampCount, setLampCount] = useState(7)
  const [extinguished, setExtinguished] = useState<number[]>([])
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    if (phase !== 'transition') return
    const timer = window.setTimeout(() => {
      setPhase('inner')
      setGuide('按住并拖动探灯。看清“痴”后，点一下。')
    }, 1250)
    return () => window.clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== 'inner') return
    const timers = [
      window.setTimeout(() => { setFenEpisode(1); setLampCount(11) }, 5000),
      window.setTimeout(() => setFenEpisode(0), 9500),
      window.setTimeout(() => { setFenEpisode(2); setLampCount(LAMPS.length) }, 13000),
      window.setTimeout(() => setFenEpisode(0), 18000),
    ]
    return () => timers.forEach(window.clearTimeout)
  }, [phase, resetKey])

  const reset = () => {
    setPhase('outer')
    setFound(0)
    setGuide('先靠近神像。别急着相信眼前的灯。')
    setFenEpisode(0)
    setLampCount(7)
    setExtinguished([])
    setResetKey((value) => value + 1)
  }

  const suffix = phase === 'inner' || phase === 'complete' ? 'inner' : 'outer'

  return (
    <main className="reboot-shell">
      <section className={`reboot-chi reboot-phase-${phase}`} data-phase={phase} aria-label="痴关卡独立统一美术原型">
        <div className="reboot-chi-scene" />
        <div className="reboot-chi-atmosphere" />
        <header className="reboot-chi-header">
          <div><span className="reboot-kicker">美术原型 02 · 山腰古寺</span><h1>痴</h1><small>{suffix === 'outer' ? '表世界 · 失焦' : '里世界 · 灯海'}</small></div>
          <div className="reboot-ui-actions">
            <button type="button" className="reboot-ui-icon" onClick={onExit} aria-label="返回开始界面"><img src={`./assets/art-reboot/ui-back-${suffix}.webp`} alt="" /></button>
            <button type="button" className="reboot-ui-icon reboot-ui-wide" onClick={() => {
              void audio.start().catch(() => undefined)
              const next = !muted
              setMuted(next)
              audio.setMuted(next)
            }} aria-label={muted ? '开启声音' : '静音'}><img src={`./assets/art-reboot/ui-volume-${suffix}.webp`} alt="" /></button>
            <button type="button" className="reboot-ui-icon" onClick={() => setHintSignal((value) => value + 1)} aria-label="获得提示"><img src={`./assets/art-reboot/ui-hint-${suffix}.webp`} alt="" /></button>
            <button type="button" className="reboot-ui-icon" onClick={reset} aria-label="重置痴原型"><img src={`./assets/art-reboot/ui-reset-${suffix}.webp`} alt="" /></button>
          </div>
        </header>

        <div className="reboot-you"><img src="./assets/art-reboot/you.webp" alt="自然形态的游与颈间玉玦" /></div>

        {phase === 'outer' && (
          <button type="button" className="reboot-statue" onClick={() => { setPhase('transition'); audio.play('switch') }} aria-label="触碰猫神像">
            <img src="./assets/art-reboot/statue.webp" alt="完整石质猫神像" />
            <span>触碰神像</span>
          </button>
        )}

        {phase === 'transition' && <div className="reboot-transition"><img src="./assets/art-reboot/statue.webp" alt="" /><span>表里之间</span></div>}

        {(phase === 'inner' || phase === 'complete') && (
          <>
            <div className="reboot-lamps" aria-label="幻境煤油灯">
              {LAMPS.slice(0, lampCount).map(([x, y, size], index) => (
                <button key={index} type="button" className={`reboot-lamp ${extinguished.includes(index) ? 'is-out' : ''}`} style={{ left: `${x}%`, top: `${y}%`, width: size, '--delay': `${-index * .41}s` } as React.CSSProperties} onClick={() => {
                  if (extinguished.includes(index)) return
                  setExtinguished((current) => [...current, index])
                  setGuide('那只是忿留下的灯影。别让它替你决定。')
                }} aria-label="查看幻境煤油灯"><img src="./assets/art-reboot/lamp.webp" alt="手绘煤油灯" /></button>
              ))}
            </div>
            <FocusPuzzle
              variant="chi"
              resetKey={resetKey}
              hintSignal={hintSignal}
              onFound={setFound}
              onSolved={() => { setPhase('complete'); audio.play('complete') }}
              onMessage={(message) => setGuide(message.replace(/^隐：/, ''))}
            />
            <div className="reboot-progress"><span>聚焦</span>{[0, 1, 2].map((index) => <i key={index} className={index < found ? 'is-found' : ''} />)}<strong>{found} / 3</strong></div>
          </>
        )}

        {fenEpisode > 0 && phase === 'inner' && (
          <div className={`reboot-fen reboot-fen-${fenEpisode}`} aria-live="polite"><img src="./assets/art-reboot/fen.webp" alt="忿穿过灯海" /><p>{FEN_LINES[fenEpisode - 1]}</p></div>
        )}

        {phase === 'complete' && (
          <div className="reboot-complete" role="status"><span className="reboot-kicker">局部复色 · 痴</span><h2>看清，不等于找到答案。<br />只是终于不再误认。</h2><button type="button" className="reboot-primary" onClick={onExit}>返回开始界面</button></div>
        )}

        <aside className="reboot-guide" aria-live="polite"><img src="./assets/art-reboot/yin.webp" alt="隐" /><div><span>隐</span><p>{guide}</p></div></aside>
      </section>
    </main>
  )
}
