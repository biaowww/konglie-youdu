import { useEffect, useRef, useState } from 'react'
import './journey.css'

export default function ArrivalClip({ onFinish }: { onFinish: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [needsTap, setNeedsTap] = useState(false)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduced) return
    const play = video.current?.play()
    play?.catch(() => setNeedsTap(true))
  }, [reduced])

  const play = () => {
    video.current?.play().then(() => setNeedsTap(false)).catch(() => setNeedsTap(true))
  }

  return (
    <main className="journey-shell">
      <section className="journey-stage journey-arrival" data-screen="arrival" aria-label="卦山空裂前后短 CG">
        <div className="journey-arrival-frame">
          <video ref={video} src="./assets/art-reboot/fable/gua-arrival.mp4" poster="./assets/art-reboot/fable/c1-mountain.webp" muted playsInline preload="auto" onEnded={onFinish} aria-label="同一座卦山由斑驳色彩逐渐褪成灰白" />
        </div>
        <p className="journey-arrival-caption">空裂前后，同一座山。</p>
        <nav className="journey-arrival-actions" aria-label="CG 操作">
          {(needsTap || reduced) && <button type="button" data-act="play-cg" onClick={play}>播放</button>}
          <button type="button" data-act="skip-cg" onClick={onFinish}>{reduced ? '继续入山' : '跳过 CG'}</button>
        </nav>
      </section>
    </main>
  )
}
