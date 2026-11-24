import { useState } from 'react'
import { ArrowRight, SkipForward } from 'lucide-react'

type Props = { onComplete: () => void }

const PANELS = [
  { kicker: '01 · 世界', label: '裂城', text: '空裂之后，城市与人都被情绪隔开。' },
  { kicker: '02 · 游', label: '出城', text: '主人说不出的情绪，留在了这只猫身上。' },
  { kicker: '03 · 归途', label: '远行', text: '游沿着玉玦的回应回卦山，寻找主人。' },
  { kicker: '04 · 五毒', label: '入山', text: '卦山把五毒放大成失真的情绪。看清它们，才能继续靠近主人。' },
]

export default function RebootComic({ onComplete }: Props) {
  const [active, setActive] = useState(0)
  const next = () => active === PANELS.length - 1 ? onComplete() : setActive((value) => value + 1)
  return (
    <main className="reboot-shell reboot-comic-shell">
      <section className="reboot-comic" aria-label="逐格出城漫画">
        <header className="reboot-comic-header">
          <div><span className="reboot-kicker">空裂：游渡</span><h1>离开位面城</h1></div>
          <span>{String(active + 1).padStart(2, '0')} / 04</span>
        </header>
        <div className="comic-cinema">
          <div className={`comic-main-shot shot-${active}`} data-panel={active + 1} key={active}>
            <img className={`comic-shot comic-shot-${active}`} src={`./assets/art-reboot/cinematic/comic-0${active + 1}.webp`} alt={PANELS[active].text} />
            {active === 0 && <div className="comic-effect-rift" aria-hidden="true" />}
            {active === 1 && (
              <><div className="comic-effect-retreat" aria-hidden="true" /><div className="comic-effect-footprints" aria-hidden="true">{[0, 1, 2, 3, 4].map((index) => <i key={index} style={{ '--step': index } as React.CSSProperties} />)}</div></>
            )}
            {active === 2 && <div className="comic-effect-road" aria-hidden="true" />}
            {active === 3 && <div className="comic-effect-clusters" aria-hidden="true">{[0, 1, 2, 3, 4].map((index) => <i key={index} style={{ '--step': index } as React.CSSProperties} />)}</div>}
            <div className={`comic-caption caption-${active}`}><span>{PANELS[active].kicker}</span><p>{PANELS[active].text}</p></div>
          </div>
          <nav className="comic-rail" aria-label="选择分镜">
            {PANELS.map((panel, index) => (
              <button key={panel.kicker} type="button" className={index === active ? 'is-active' : ''} onClick={() => setActive(index)} aria-label={`查看第${index + 1}格：${panel.label}`} aria-pressed={index === active}>
                <img src={`./assets/art-reboot/cinematic/comic-0${index + 1}.webp`} alt="" />
                <span><small>0{index + 1}</small>{panel.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <footer className="reboot-comic-footer">
          <button type="button" className="reboot-text-link" onClick={onComplete}><SkipForward size={15} />跳过漫画</button>
          <button type="button" className="reboot-primary" onClick={next}>{active === PANELS.length - 1 ? '进入游戏' : '下一格'}<ArrowRight size={17} /></button>
        </footer>
      </section>
    </main>
  )
}
