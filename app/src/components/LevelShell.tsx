import { ArrowLeft, Lightbulb, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { audio } from '../game/audio'
import type { LevelConfig, LevelId, LevelPhase } from '../game/types'
import FocusPuzzle from '../game/puzzles/FocusPuzzle'
import WordPuzzle from '../game/puzzles/WordPuzzle'
import GreedPuzzle from '../game/puzzles/GreedPuzzle'
import Guide from './Guide'

type Props = {
  level: LevelConfig
  onComplete: (id: LevelId) => void
  onExit: () => void
}

export default function LevelShell({ level, onComplete, onExit }: Props) {
  const [phase, setPhase] = useState<LevelPhase>('outer')
  const [guide, setGuide] = useState(level.intro)
  const [resetKey, setResetKey] = useState(0)
  const [hintSignal, setHintSignal] = useState(0)
  const [fenVisible, setFenVisible] = useState(false)
  const [fenLine, setFenLine] = useState(level.fenLines[0])
  const fenIndex = useRef(0)

  useEffect(() => {
    if (phase !== 'inner') return
    let hideTimer = 0
    const show = () => {
      setFenLine(level.fenLines[fenIndex.current % level.fenLines.length]); fenIndex.current += 1
      setFenVisible(true); hideTimer = window.setTimeout(() => setFenVisible(false), 3900)
    }
    const first = window.setTimeout(show, level.id === 'chen' ? 5000 : 8000)
    const interval = window.setInterval(show, 15000)
    return () => { window.clearTimeout(first); window.clearTimeout(hideTimer); window.clearInterval(interval) }
  }, [phase, level])

  const enterInner = () => {
    audio.play('switch'); setPhase('transition'); setGuide('隐：玉佩能打开另一层。跟住它的光。')
    window.setTimeout(() => { setPhase('inner'); setGuide(level.tutorial) }, 1150)
  }

  const handleFound = (count: number) => {
    audio.play('absorb')
    if (count < 3) setGuide(`隐：已经收住 ${count} 个，还剩 ${3 - count} 个。`)
  }

  const handleSolved = () => {
    audio.play('complete'); setGuide(level.outro)
    window.setTimeout(() => setPhase('complete'), 450)
  }

  const reset = () => {
    setPhase('outer'); setGuide(level.intro); setResetKey((value) => value + 1); setHintSignal(0); setFenVisible(false)
  }

  const background = phase === 'outer' || phase === 'transition' ? level.scene : level.innerScene || level.scene

  return (
    <section className={`level-screen level-${level.id} phase-${phase}`} data-level={level.id} data-phase={phase} style={{ '--level-color': level.color } as React.CSSProperties} aria-label={`${level.name}关卡`}>
      <div className="level-background" style={{ backgroundImage: `url(${background})` }} />
      <div className="level-vignette" />
      <header className="level-heading">
        <button type="button" className="icon-button" onClick={onExit} aria-label="返回卦山地图"><ArrowLeft size={18} /><span>地图</span></button>
        <div className="level-title"><span>{level.name}</span><small>{level.subtitle}</small></div>
        <div className="level-actions">
          {phase === 'inner' && <button type="button" className="icon-button" onClick={() => setHintSignal((value) => value + 1)} aria-label="获取提示"><Lightbulb size={18} /><span>提示</span></button>}
          <button type="button" className="icon-button" onClick={reset} aria-label="重新开始本关"><RotateCcw size={18} /><span>重置</span></button>
        </div>
      </header>

      {phase === 'outer' && (
        <>
          <div className="floating-level-words" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index} style={{ left: `${12 + (index % 4) * 23}%`, top: `${20 + Math.floor(index / 4) * 34}%`, animationDelay: `${-index}s` }}>{level.name}</span>)}</div>
          <img className="level-statue" src="./assets/statue.webp" alt="古老猫神像" />
          <img className="level-you-back" src="./assets/you-back.webp" alt="游望向神像" />
          <img className="level-jade" src="./assets/jade.webp" alt="玉佩正在感应" />
          <button type="button" className="statue-hotspot" onClick={enterInner} aria-label={`触碰猫神像，进入${level.name}的里世界`}><span className="statue-ring" /><span className="statue-label">触碰猫神像</span></button>
        </>
      )}

      {phase === 'transition' && <div className="level-transition" aria-live="polite"><img src="./assets/jade.webp" alt="" /><p>玉佩正在打开里世界</p></div>}

      {phase === 'inner' && (
        <>
          {(level.id === 'chi' || level.id === 'man') && <FocusPuzzle key={`${level.id}-${resetKey}`} variant={level.id} resetKey={resetKey} hintSignal={hintSignal} onFound={handleFound} onSolved={handleSolved} onMessage={setGuide} />}
          {(level.id === 'chen' || level.id === 'yi') && <WordPuzzle key={`${level.id}-${resetKey}`} variant={level.id} resetKey={resetKey} hintSignal={hintSignal} onFound={handleFound} onSolved={handleSolved} onMessage={setGuide} />}
          {level.id === 'tan' && <GreedPuzzle key={`${level.id}-${resetKey}`} hintSignal={hintSignal} onSolved={handleSolved} onMessage={setGuide} />}
        </>
      )}

      {fenVisible && phase === 'inner' && <div className={`fen-interference fen-${level.id}`}><img src="./assets/fen-red.webp" alt="忿出现干扰" /><p>{fenLine}</p></div>}

      {phase === 'complete' && (
        <div className="level-complete">
          <span className="completion-mark">{level.name} · 已解</span>
          <h2>{level.outro}</h2>
          <p>这一处的色彩，已经回到卦山。</p>
          <button type="button" className="primary-button" onClick={() => onComplete(level.id)}>继续攀登</button>
        </div>
      )}

      <Guide text={guide} />
    </section>
  )
}
