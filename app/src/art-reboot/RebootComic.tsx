import { useState } from 'react'
import { ArrowRight, SkipForward } from 'lucide-react'

type Props = { onComplete: () => void }

const PANELS = [
  { kicker: '01 · 世界', text: '空裂之后，城市与人都被情绪隔开。' },
  { kicker: '02 · 游', text: '主人说不出的情绪，留在了这只猫身上。' },
  { kicker: '03 · 归途', text: '游沿着玉玦的回应回卦山，寻找主人。' },
  { kicker: '04 · 痴', text: '先看清三个“痴”，让古寺复色，才能继续向前。' },
]

export default function RebootComic({ onComplete }: Props) {
  const [active, setActive] = useState(0)
  return (
    <main className="reboot-shell reboot-comic-shell">
      <section className="reboot-comic" aria-label="逐格出城漫画">
        <header className="reboot-comic-header">
          <div><span className="reboot-kicker">空裂：游渡</span><h1>离开位面城</h1></div>
          <span>{String(active + 1).padStart(2, '0')} / 04</span>
        </header>
        <div className="reboot-comic-grid">
          {PANELS.map((panel, index) => {
            const visible = index <= active
            return (
              <article key={panel.kicker} className={`comic-panel comic-panel-${index} ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
                <div className="comic-panel-art">
                  <img className={`comic-shot comic-shot-${index}`} src={`./assets/art-reboot/cinematic/comic-0${index + 1}.webp`} alt={panel.text} />
                </div>
                <div className="comic-caption"><span>{panel.kicker}</span><p>{panel.text}</p></div>
              </article>
            )
          })}
        </div>
        <footer className="reboot-comic-footer">
          <button type="button" className="reboot-text-link" onClick={onComplete}><SkipForward size={15} />跳过漫画</button>
          <button type="button" className="reboot-primary" onClick={() => active === PANELS.length - 1 ? onComplete() : setActive((value) => value + 1)}>
            {active === PANELS.length - 1 ? '进入游戏' : '下一格'}<ArrowRight size={17} />
          </button>
        </footer>
      </section>
    </main>
  )
}
