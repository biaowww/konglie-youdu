import './journey.css'

export type MapStep = 'first' | 'second' | 'chi' | 'restored'
type Props = { step: MapStep; path: string[]; onChoose: (id: string) => void; onChi: () => void; onEnding: () => void }

const FIRST = ['creek', 'tree', 'cloud']
const SECOND = ['lamp', 'steps']
const NODES: Record<string, { name: string; x: number; y: number }> = {
  start: { name: '入山', x: 20, y: 89 },
  creek: { name: '溪边石阶', x: 30, y: 70 },
  tree: { name: '古树月门', x: 46, y: 66 },
  cloud: { name: '云外栈道', x: 65, y: 60 },
  lamp: { name: '灯下回望', x: 42, y: 46 },
  steps: { name: '山腰小径', x: 62, y: 43 },
  chi: { name: '山腰古寺', x: 48, y: 28 },
  summit: { name: '两界交界', x: 80, y: 8 },
}
const COPY: Record<MapStep, string> = {
  first: '三条山路，都能到古寺。选一条。',
  second: '再选一处落脚。',
  chi: '山腰古寺到了，玉玦在响。',
  restored: '色彩沿着你来时的路，回到山里。',
}
const EDGE_PATHS: Record<string, string> = {
  'start-creek': 'M20 89 L27 77 L30 70',
  'start-tree': 'M20 89 L35 76 L46 66',
  'start-cloud': 'M20 89 L47 76 L65 60',
  'creek-lamp': 'M30 70 L35 57 L42 46',
  'creek-steps': 'M30 70 L47 56 L62 43',
  'tree-lamp': 'M46 66 L43 55 L42 46',
  'tree-steps': 'M46 66 L55 54 L62 43',
  'cloud-lamp': 'M65 60 L52 52 L42 46',
  'cloud-steps': 'M65 60 L64 51 L62 43',
  'lamp-chi': 'M42 46 L45 36 L48 28',
  'steps-chi': 'M62 43 L55 35 L48 28',
  'chi-summit': 'M48 28 L63 18 L80 8',
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
        <img className="journey-map-art" src="./assets/art-reboot/fable/a-mountain.webp" alt="游沿着墨点石径上山" />
        <div className="journey-map-wash" aria-hidden="true" />
        <header className="journey-heading">
          <span>卦山 · 你的路线</span>
          <h2>{COPY[step]}</h2>
        </header>
        <svg className="journey-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {edges.map(([from, to]) => {
            const restored = selected(from) && (selected(to) || active(to))
            const d = EDGE_PATHS[`${from}-${to}`] || `M${NODES[from].x} ${NODES[from].y} L${NODES[to].x} ${NODES[to].y}`
            return <path key={`${from}-${to}`} className={restored ? 'is-restored' : ''} d={d} />
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
          {path.length === 0 ? '选路不增加数值，只改变你看见的山。' : `已选 ${path.length} 处落脚，路线已记下。`}
        </div>
      </section>
    </main>
  )
}
