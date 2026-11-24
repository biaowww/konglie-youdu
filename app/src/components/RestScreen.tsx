import { useState } from 'react'
import { ArrowRight, Moon } from 'lucide-react'
import { audio } from '../game/audio'
import './RestScreen.css'

type Props = { location: string; onComplete: () => void }

export default function RestScreen({ location, onComplete }: Props) {
  const [rested, setRested] = useState(false)
  const listensToFen = location.includes('碑林')
  const instruction = listensToFen ? '隐：忿没有跟来。它其实知道，哪条路更安全。' : '隐：把探灯放下，听一会儿风。准备好了，再继续走。'
  const observation = listensToFen ? '你第一次听见，怒意后面还有别的声音。那不是阻拦，更像一声没说完的提醒。' : '你听见风穿过碑林。原来停驻不是落后，而是终于看见身边的东西。'
  return (
    <section className={`rest-screen ${rested ? 'is-rested' : ''}`} aria-label={`${location}轻事件`}>
      <div className="rest-landscape" />
      <div className="rest-you"><img src="./assets/chi/you.webp" alt="游在歇脚处停下" /><img src="./assets/chi/jade.webp" alt="玉玦微光" /></div>
      <div className="rest-copy">
        <span className="eyebrow"><Moon size={15} />{location} · 歇脚</span>
        <h2>{rested ? '玉玦的光，也不再催促了。' : '这里不用解谜。'}</h2>
        <p>{rested ? observation : instruction}</p>
        {!rested ? (
          <button type="button" className="secondary-button" onClick={() => { setRested(true); audio.play('switch') }}>放下探灯，停一会儿</button>
        ) : (
          <button type="button" className="primary-button" onClick={onComplete}>继续登山<ArrowRight size={17} /></button>
        )}
      </div>
    </section>
  )
}
