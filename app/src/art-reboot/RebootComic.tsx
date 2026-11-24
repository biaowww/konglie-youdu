import { useState } from 'react'
import { ArrowRight, SkipForward } from 'lucide-react'

type Props = { onComplete: () => void }

const PANELS = [
  { kicker: '01 · 空裂之后', text: '城市还在，颜色却先离开了。' },
  { kicker: '02 · 出城', text: '游只带上一枚玉玦。' },
  { kicker: '03 · 归途', text: '它要回卦山，寻找主人。' },
  { kicker: '04 · 入山', text: '山把回答藏起来了。' },
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
                  {index < 3 ? <img className="comic-city" src="./assets/art-reboot/city.webp" alt="位面城与出城道路" /> : <img className="comic-temple" src="./assets/art-reboot/temple.webp" alt="山腰古寺" />}
                  {index === 1 && <img className="comic-you" src="./assets/art-reboot/you.webp" alt="自然猫游" />}
                  {index === 2 && <div className="comic-route"><i /><span>位面城</span><span>卦山</span></div>}
                  {index === 3 && <img className="comic-statue" src="./assets/art-reboot/statue.webp" alt="猫神像" />}
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
