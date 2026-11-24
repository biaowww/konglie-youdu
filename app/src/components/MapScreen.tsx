import { Map, Sparkles } from 'lucide-react'
import { LEVELS, MAP_POINTS } from '../game/content'
import type { LevelId, RewardCard } from '../game/types'

type Props = {
  order: LevelId[]
  completed: LevelId[]
  cards: RewardCard[]
  seed: number
  replay: boolean
  onNext: (level: LevelId | null) => void
  onShowCards: () => void
}

export default function MapScreen({ order, completed, cards, seed, replay, onNext, onShowCards }: Props) {
  const nextPointIndex = completed.length + 1
  const currentPoint = MAP_POINTS[completed.length]
  const colorProgress = completed.length / 5
  const points = MAP_POINTS.map((point) => `${point.x},${point.y}`).join(' ')

  return (
    <section className={`map-screen ${replay ? 'map-replay' : ''}`} aria-label="卦山攀登地图">
      <div className="map-background" style={{ filter: `grayscale(${Math.max(0.08, 1 - colorProgress * 0.92)}) saturate(${0.7 + colorProgress * 0.9})` }} />
      <div className="map-shade" />
      <header className="map-title-block">
        <span className="eyebrow"><Map size={14} />卦山 · 攀登路线</span>
        <h2>让色彩回到山里</h2>
        <p>{completed.length === 0 ? '从第一座神像开始。' : `已经修复 ${completed.length} / 5 处失联。`}</p>
      </header>

      <svg className="map-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polyline className="route-base" points={points} />
        <polyline className="route-restored" points={MAP_POINTS.slice(0, nextPointIndex).map((point) => `${point.x},${point.y}`).join(' ')} />
      </svg>

      {MAP_POINTS.map((point, index) => {
        const isSummit = index === MAP_POINTS.length - 1
        const level = !isSummit && index > 0 ? order[index - 1] : null
        const isCompleted = index > 0 && index <= completed.length
        const isNext = index === nextPointIndex
        const name = isSummit ? '两界交界' : index === 0 ? '入山' : level ? LEVELS[level].name : ''
        return (
          <button
            key={`${index}-${name}`}
            type="button"
            className={`map-node ${isCompleted ? 'node-complete' : ''} ${isNext ? 'node-next' : ''}`}
            style={{ left: `${point.x}%`, top: `${point.y}%`, '--level-color': level ? LEVELS[level].color : '#c4a35a' } as React.CSSProperties}
            disabled={!isNext}
            onClick={() => onNext(isSummit ? null : level)}
            aria-label={isNext ? `前往${name}` : `${name}${isCompleted ? '，已完成' : '，尚未到达'}`}
          >
            <span className="node-dot">{isCompleted ? '✓' : isSummit ? '渡' : index === 0 ? '游' : name}</span>
            <span className="node-label">{name}</span>
          </button>
        )
      })}

      <img className="map-you-icon" src="./assets/you-icon.webp" alt="游当前位置" style={{ left: `${currentPoint.x}%`, top: `${currentPoint.y}%` }} />

      {replay && completed.length > 0 && (
        <div className="route-replay" aria-live="polite">
          <Sparkles size={18} />
          <span>色彩沿着你来时的路，回到山里。</span>
          {MAP_POINTS.slice(1, nextPointIndex).map((point, index) => (
            <img key={index} src="./assets/you-icon.webp" alt="" className="cat-spirit" style={{ left: `${point.x}%`, top: `${point.y}%`, animationDelay: `${index * 160}ms` }} />
          ))}
        </div>
      )}

      <footer className="map-footer">
        <span className="seed-label">路线种子 {seed}</span>
        <button type="button" className="text-button" onClick={onShowCards} disabled={cards.length === 0}>卡牌 {cards.length}</button>
      </footer>
    </section>
  )
}
