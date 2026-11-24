import { useEffect, useRef, useState } from 'react'
import { ArrowRight, SkipForward } from 'lucide-react'
import './JourneyPrologue.css'

type Props = { onComplete: () => void }

const DURATION_MS = 10000
const FPS = 24
const TOTAL_FRAMES = DURATION_MS / 1000 * FPS
const CAPTIONS = [
  { eyebrow: '01 · 出城', text: '带着玉玦，离开位面城。' },
  { eyebrow: '02 · 归途', text: '游要回卦山，寻找渡。' },
  { eyebrow: '03 · 入山', text: '山把声音藏起来了。玉玦却还在回应。' },
]

function clamp(value: number) {
  return Math.max(0, Math.min(1, value))
}

function smooth(value: number) {
  const t = clamp(value)
  return t * t * (3 - 2 * t)
}

function mix(from: number, to: number, progress: number) {
  return from + (to - from) * progress
}

export default function JourneyPrologue({ onComplete }: Props) {
  const stageRef = useRef<HTMLElement>(null)
  const [shot, setShot] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    const root = stageRef.current
    const stage = root?.querySelector<HTMLElement>('.journey-stage')
    if (!root || !stage) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let request = 0
    let startedAt = 0
    let previousFrame = -1
    let previousShot = -1

    const render = (now: number) => {
      if (!startedAt) startedAt = now
      const elapsed = reducedMotion ? DURATION_MS : Math.min(DURATION_MS, now - startedAt)
      const frame = Math.min(TOTAL_FRAMES, Math.floor(elapsed / 1000 * FPS))
      if (frame !== previousFrame) {
        previousFrame = frame
        const time = frame / TOTAL_FRAMES
        const cityProgress = smooth(time / .32)
        const mapProgress = smooth((time - .28) / .38)
        const mountainProgress = smooth((time - .64) / .36)
        const properties: Record<string, string> = {
          '--city-opacity': String(1 - smooth((time - .27) / .07)),
          '--city-camera': `${mix(0, -9, cityProgress)}%`,
          '--city-you-x': `${mix(5, 72, cityProgress)}%`,
          '--city-you-y': `${mix(68, 63, cityProgress)}%`,
          '--city-you-opacity': String(1 - smooth((time - .28) / .045)),
          '--map-opacity': String(smooth((time - .27) / .07) * (1 - smooth((time - .62) / .08))),
          '--map-camera': `${mix(4, -24, mapProgress)}%`,
          '--map-scale': String(mix(1.02, 1.2, mapProgress)),
          '--map-you-x': `${mix(12, 82, mapProgress)}%`,
          '--map-you-y': `${mix(68, 31, mapProgress)}%`,
          '--map-you-scale': String(mix(.52, .38, mapProgress)),
          '--map-you-opacity': String(smooth((time - .285) / .045) * (1 - smooth((time - .625) / .045))),
          '--route-progress': String(1 - mapProgress),
          '--mountain-opacity': String(smooth((time - .62) / .09)),
          '--mountain-scale': String(mix(1.02, 1.17, mountainProgress)),
          '--mountain-color': String(smooth((time - .77) / .15)),
          '--mountain-you-x': `${mix(12, 53, mountainProgress)}%`,
          '--mountain-you-y': `${mix(73, 59, mountainProgress)}%`,
          '--mountain-you-scale': String(mix(.52, .63, mountainProgress)),
          '--mountain-you-opacity': String(smooth((time - .64) / .05)),
          '--jade-signal': String(smooth((time - .82) / .12) * (.82 + Math.sin(frame * .7) * .18)),
        }
        for (const [name, value] of Object.entries(properties)) stage.style.setProperty(name, value)
        root.dataset.frame = String(frame)
        const nextShot = time < .3 ? 0 : time < .66 ? 1 : 2
        if (nextShot !== previousShot) {
          previousShot = nextShot
          setShot(nextShot)
          root.dataset.shot = String(nextShot + 1)
        }
      }
      if (elapsed < DURATION_MS && !reducedMotion) request = requestAnimationFrame(render)
      else setFinished(true)
    }

    request = requestAnimationFrame(render)
    return () => cancelAnimationFrame(request)
  }, [])

  return (
    <section ref={stageRef} className="journey-screen" data-shot="1" data-frame="0" aria-label="出城旅行：分层原画与24帧程序动画">
      <div className="journey-stage">
        <div className="journey-shot journey-city">
          <div className="journey-city-camera" />
          <div className="journey-city-veil" />
          <div className="journey-you journey-you-city">
            <img src="./assets/you-walk-alpha.webp" alt="游背着邮差包走出位面城" />
          </div>
        </div>

        <div className="journey-shot journey-map">
          <div className="journey-map-camera" />
          <svg className="journey-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path className="journey-route-base" d="M12 68 C30 63 38 47 52 48 S67 35 82 31" />
            <path className="journey-route-travelled" pathLength="1" d="M12 68 C30 63 38 47 52 48 S67 35 82 31" />
          </svg>
          <span className="journey-place journey-place-city">位面城</span>
          <span className="journey-place journey-place-mountain">卦山</span>
          <div className="journey-you journey-you-map">
            <img src="./assets/you-walk-alpha.webp" alt="游在地图上向卦山移动" />
          </div>
        </div>

        <div className="journey-shot journey-mountain">
          <div className="journey-mountain-camera">
          <div className="journey-mountain-mono" />
          <div className="journey-mountain-color" />
          </div>
          <div className="journey-mountain-mist" />
          <div className="journey-you journey-you-mountain">
            <img src="./assets/you-walk-alpha.webp" alt="游走近斑驳的卦山" />
          </div>
          <img className="journey-jade-signal" src="./assets/jade.webp" alt="玉玦发出回应" />
        </div>

        <div className="journey-caption" aria-live="polite">
          <span className="eyebrow">{CAPTIONS[shot].eyebrow}</span>
          <p>{CAPTIONS[shot].text}</p>
        </div>

        {finished && (
          <button type="button" className="primary-button journey-continue" onClick={onComplete}>
            进入卦山<ArrowRight size={18} />
          </button>
        )}
      </div>
      <button type="button" className="text-button journey-skip" onClick={onComplete}>
        <SkipForward size={15} />跳过演出
      </button>
    </section>
  )
}
