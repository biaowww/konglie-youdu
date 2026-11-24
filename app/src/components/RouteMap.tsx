import { useRef, useState } from 'react'
import { Map as MapIcon, Minus, Moon, Plus, RotateCcw, Sparkles } from 'lucide-react'
import { LEVELS } from '../game/content'
import { availableNodeIds } from '../game/route'
import type { RewardCard, RouteState } from '../game/types'
import './RouteMap.css'

type Props = {
  route: RouteState
  cards: RewardCard[]
  replay: boolean
  onNext: (nodeId: string) => void
  onShowCards: () => void
}

export default function RouteMap({ route, cards, replay, onNext, onShowCards }: Props) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef({ pointerId: -1, x: 0, y: 0, offsetX: 0, offsetY: 0 })
  const nextIds = availableNodeIds(route)
  const nodesById = new Map(route.nodes.map((node) => [node.id, node]))
  const current = nodesById.get(route.currentNodeId) ?? route.nodes[0]
  const pathNodes = route.path.map((id) => nodesById.get(id)).filter((node) => node !== undefined)
  const progress = (route.path.length - 1) / 4
  const pathPoints = pathNodes.map((node) => `${node.x},${node.y}`).join(' ')

  const clampOffset = (x: number, y: number) => ({
    x: Math.max(-180, Math.min(180, x)),
    y: Math.max(-160, Math.min(160, y)),
  })

  return (
    <section className="route-map-screen" aria-label="多路线卦山地图">
      <div
        className="route-map-viewport"
        onPointerDown={(event) => {
          if ((event.target as Element).closest('button')) return
          event.currentTarget.setPointerCapture(event.pointerId)
          drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y }
        }}
        onPointerMove={(event) => {
          if (drag.current.pointerId !== event.pointerId) return
          setOffset(clampOffset(drag.current.offsetX + event.clientX - drag.current.x, drag.current.offsetY + event.clientY - drag.current.y))
        }}
        onPointerUp={(event) => {
          drag.current.pointerId = -1
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
        }}
        onPointerCancel={() => { drag.current.pointerId = -1 }}
        onWheel={(event) => setScale((value) => Math.max(.8, Math.min(1.8, value - event.deltaY * .001)))}
      >
        <div className="route-map-world" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, filter: `grayscale(${Math.max(.04, 1 - progress * .92)}) saturate(${.7 + progress * .65})` }}>
          <div className="route-map-landscape" />
          <svg className="route-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {route.nodes.flatMap((node) => node.next.map((nextId) => {
              const next = nodesById.get(nextId)
              return next ? <line key={`${node.id}-${nextId}`} x1={node.x} y1={node.y} x2={next.x} y2={next.y} className="route-edge" /> : null
            }))}
            <polyline className="route-travelled" points={pathPoints} />
          </svg>

          {route.nodes.map((node) => {
            const completed = route.path.includes(node.id)
            const next = nextIds.includes(node.id)
            const name = node.kind === 'start' ? '出发' : node.kind === 'summit' ? '' : node.kind === 'rest' ? '歇脚' : node.level ? LEVELS[node.level].name : ''
            return (
              <button
                key={node.id}
                type="button"
                className={`route-node ${completed ? 'is-complete' : ''} ${next ? 'is-next' : ''} route-kind-${node.kind}`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                disabled={!next}
                onClick={() => onNext(node.id)}
                aria-label={next ? `前往${node.location}${name ? `，${name}` : ''}` : `${node.location}${completed ? '，已走过' : '，暂不可达'}`}
              >
                <span className="route-node-dot">{node.kind === 'rest' ? <Moon size={16} /> : node.kind === 'summit' ? <Sparkles size={16} /> : node.kind === 'start' ? '游' : name}</span>
                <span className="route-node-label"><strong>{node.location}</strong><small>{name}</small></span>
              </button>
            )
          })}

          <img className="route-you-icon" src="./assets/you-icon.webp" alt="游当前位置" style={{ left: `${current.x}%`, top: `${current.y}%` }} />
          {replay && pathNodes.slice(1).map((node, index) => (
            <img key={node.id} src="./assets/you-icon.webp" alt="" className="route-cat-spirit" style={{ left: `${node.x}%`, top: `${node.y}%`, animationDelay: `${index * 160}ms` }} />
          ))}
        </div>
      </div>

      <header className="route-map-title">
        <span className="eyebrow"><MapIcon size={14} />卦山 · 多路线攀登</span>
        <h2>选择下一段路</h2>
        <p>{route.path.length === 1 ? '每局三处主题关卡与一次歇脚。' : `已走过 ${route.path.length - 1} / 4 段路。`}</p>
      </header>

      {replay && <div className="route-replay-note"><Sparkles size={17} /><span>色彩只沿着你走过的路回来。</span></div>}

      <div className="route-map-tools" aria-label="地图视图控制">
        <button type="button" className="icon-button" onClick={() => setScale((value) => Math.min(1.8, value + .15))} aria-label="放大地图"><Plus size={17} /></button>
        <button type="button" className="icon-button" onClick={() => setScale((value) => Math.max(.8, value - .15))} aria-label="缩小地图"><Minus size={17} /></button>
        <button type="button" className="icon-button" onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }} aria-label="重置地图视图"><RotateCcw size={16} /></button>
      </div>

      <footer className="route-map-footer">
        <span>路线种子 {route.seed} · 拖动平移，滚轮缩放</span>
        <button type="button" className="text-button" onClick={onShowCards} disabled={cards.length === 0}>卡牌 {cards.length}</button>
      </footer>
    </section>
  )
}
