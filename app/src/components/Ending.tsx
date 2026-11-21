import { useState } from 'react'
import { audio } from '../game/audio'
export default function Ending({ onRestart }: { onRestart: () => void }) {
  const [touches, setTouches] = useState(0)
  const complete = touches >= 3
  const touch = () => { if (complete) return; audio.play('complete'); setTouches((value) => value + 1) }
  return <section className="ending-screen" style={{ '--touch-progress': touches / 3 } as React.CSSProperties} aria-label="两界交界结局"><div className="ending-background" style={{ filter: `grayscale(${Math.max(0, 1 - touches / 3)}) saturate(${0.8 + touches * 0.35})` }} /><div className="ending-rift" aria-hidden="true" /><div className={`ending-characters touch-${touches}`}><img className="ending-you" src="/assets/you-front.webp" alt="游" /><img className="ending-du" src="/assets/du.webp" alt="渡" /><img className="ending-jade" src="/assets/jade.webp" alt="玉玦重新拼合" /></div><div className="ending-copy">{!complete ? <><span className="eyebrow">两界交界 · {touches} / 3</span><h2>每一次触碰，都让世界恢复一点颜色。</h2><p>游与渡隔着两个世界的边界。没有最后一击，只有一次次靠近。</p><button type="button" className="primary-button" onClick={touch}>伸出手</button></> : <><span className="eyebrow">联系已经重新发生</span><h1>空裂：游渡</h1><p className="ending-theme">Cats are who we are.</p><p>卦山没有完全变回从前，但游与渡终于能听见彼此。</p><button type="button" className="primary-button" onClick={onRestart}>再走一次卦山</button></>}</div></section>
}
