import { useState } from 'react'
import { ArrowRight, Play, RotateCcw } from 'lucide-react'
import RebootComic from './RebootComic'
import ChiReboot from './ChiReboot'

type Screen = 'comic' | 'title' | 'chi'

export default function ArtRebootApp() {
  const [screen, setScreen] = useState<Screen>('comic')

  if (screen === 'comic') return <RebootComic onComplete={() => setScreen('title')} />
  if (screen === 'chi') return <ChiReboot onExit={() => setScreen('title')} />

  return (
    <main className="reboot-shell">
      <section className="reboot-title" aria-label="空裂游渡开始界面">
        <div className="reboot-title-scene" />
        <div className="reboot-title-cat"><img src="./assets/art-reboot/you.webp" alt="颈挂玉玦的自然猫游" /></div>
        <div className="reboot-title-statue"><img src="./assets/art-reboot/statue.webp" alt="古老猫神像" /></div>
        <div className="reboot-title-copy">
          <span className="reboot-kicker">独立统一美术原型 · 山腰古寺</span>
          <h1>空裂：游渡</h1>
          <p>一只猫，一枚玉玦，和一次寻找主人的归途。</p>
          <div className="reboot-title-actions">
            <button type="button" className="reboot-primary" onClick={() => setScreen('chi')}>进入痴<Play size={17} /></button>
            <button type="button" className="reboot-secondary" onClick={() => setScreen('comic')}>重看漫画<RotateCcw size={16} /></button>
          </div>
          <span className="reboot-build-note">新美术测试版 · 可玩切片</span>
        </div>
        <button type="button" className="reboot-text-link reboot-enter-title" onClick={() => setScreen('chi')}>直接前往神像<ArrowRight size={15} /></button>
      </section>
    </main>
  )
}
