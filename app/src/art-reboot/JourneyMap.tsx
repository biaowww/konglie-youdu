import './journey.css'

export type MapStep = 'first' | 'second' | 'chi' | 'restored'
type Props = { step: MapStep; path: string[]; onChoose: (id: string) => void; onChi: () => void; onEnding: () => void }

const FIRST = ['creek', 'tree', 'cloud']
const SECOND = ['lamp', 'steps']
const NODES: Record<string, { name: string; x: number; y: number }> = {
  start: { name: '入山', x: 22, y: 86 },
  creek: { name: '溪边石阶', x: 18, y: 66 },
  tree: { name: '古树月门', x: 47, y: 65 },
  cloud: { name: '云外栈道', x: 76, y: 60 },
  lamp: { name: '灯下回望', x: 31, y: 43 },
  steps: { name: '山腰小径', x: 65, y: 41 },
  chi: { name: '山腰古寺', x: 48, y: 24 },
  summit: { name: '两界交界', x: 80, y: 8 },
}
const COPY: Record<MapStep, string> = {
  first: '三条山路，都能到古寺。选一条。',
  second: '再选一处落脚。',
  chi: '山腰古寺到了，玉玦在响。',
  restored: '色彩沿着你来时的路，回到山里。',
}

export default function JourneyMap({ step, path, onChoose, onChi, onEnding }: Props) {
  const selected = (id: string) => id === 'start' || path.includes(id) || (id === 'chi' && step === 'restored')
  const active = (id: string) => (step === 'first' && FIRST.includes(id)) || (step === 'second' && SECOND.includes(id)) || (step === 'chi' && id === 'chi') || (step === 'restored' && id === 'summit')
  const edges: [string, string][] = []
  if (path[0]) edges.push(['start', path[0]])
  else FIRST.forEach((id) => edges.push(['start', id]))
  if (path[1]) edges.push([path[0], path[1]])
  else if (path[0]) SECOND.forEach((id) => edges.push([path[0], id]))
  if (path[1]) edges.push([path[1], 'chi'])
  if (step === 'restored') edges.push(['chi', 'summit'])

  return (
    <main className="journey-shell">
      <section className={`journey-stage journey-map is-${step}`} data-screen="map" data-step={step} aria-label="卦山分支地图">
        <img className="journey-map-art" src="./assets/art-reboot/fable/c4-scroll.webp" alt="游沿着墨点石径上山" />
        <div className="journey-map-wash" aria-hidden="true" />
        <header className="journey-heading">
          <span>卦山 · 你的路线</span>
          <h2>{COPY[step]}</h2>
        </header>
        <svg className="journey-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {edges.map(([from, to]) => {
            const a = NODES[from], b = NODES[to]
            const restored = selected(from) && (selected(to) || active(to))
            return <line key={`${from}-${to}`} className={restored ? 'is-restored' : ''} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
          })}
        </svg>
        {Object.entries(NODES).map(([id, node]) => {
          if (id === 'start') return <span key={id} className="journey-start" style={{ left: `${node.x}%`, top: `${node.y}%` }}>游</span>
          const enabled = active(id)
          return (
            <button
              key={id}
              type="button"
              className={`journey-node ${selected(id) ? 'is-selected' : ''} ${enabled ? 'is-active' : ''}`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              disabled={!enabled}
              data-node={id}
              aria-label={enabled ? `前往${node.name}` : `${node.name}，尚未选择`}
              onClick={() => id === 'chi' ? onChi() : id === 'summit' ? onEnding() : onChoose(id)}
            >
              <i aria-hidden="true" />
              <span>{node.name}</span>
            </button>
          )
        })}
        <div className="journey-trail" aria-live="polite">
          {path.length === 0 ? '选路不增加数值，只改变你看见的山。' : path.map((id) => NODES[id].name).join(' → ')}
        </div>
      </section>
    </main>
  )
}
