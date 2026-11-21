import { useCallback, useEffect, useRef, useState } from 'react'

type AppleType = 'small' | 'large' | 'glow'
type Apple = { uid: number; type: AppleType; x: number; duration: number }
type Props = { hintSignal: number; onSolved: () => void; onMessage: (message: string) => void }

const TYPES = {
  small: { name: '小山果', space: 1, value: 2, color: '#9fc9b4' },
  large: { name: '饱满山果', space: 3, value: 6, color: '#c4a35a' },
  glow: { name: '幻光山果', space: 2, value: 3, color: '#9b8aa6' },
}
const CAPACITY = 6
const GOAL = 12

function AppleIcon({ type }: { type: AppleType }) {
  const config = TYPES[type]
  return (
    <svg viewBox="0 0 64 74" aria-hidden="true">
      <path d="M35 18c3-9 9-13 17-14-1 8-6 14-15 16" fill="#4a8169" />
      <path d="M32 22c-4-8-3-14 1-19" fill="none" stroke="#463728" strokeWidth="4" strokeLinecap="round" />
      <path d="M32 20C12 9 3 27 8 47c5 22 18 26 25 22 8 4 22-2 24-23 3-20-10-34-25-26z" fill={config.color} />
      <path d="M18 31c3-6 8-9 13-9" fill="none" stroke="#f4ecdd" strokeOpacity=".45" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export default function GreedPuzzle({ hintSignal, onSolved, onMessage }: Props) {
  const [apples, setApples] = useState<Apple[]>([])
  const [basket, setBasket] = useState<Apple[]>([])
  const idRef = useRef(0)
  const timers = useRef<number[]>([])

  const spawn = useCallback(() => {
    const roll = Math.random()
    const type: AppleType = roll > 0.76 ? 'large' : roll > 0.42 ? 'glow' : 'small'
    const apple: Apple = { uid: ++idRef.current, type, x: 10 + Math.random() * 80, duration: 7 + Math.random() * 4 }
    setApples((current) => [...current.slice(-15), apple])
    const timer = window.setTimeout(() => setApples((current) => current.filter((item) => item.uid !== apple.uid)), apple.duration * 1000)
    timers.current.push(timer)
  }, [])

  useEffect(() => {
    timers.current.forEach(window.clearTimeout); timers.current = []
    for (let i = 0; i < 5; i += 1) spawn()
    const interval = window.setInterval(spawn, 1250)
    return () => { window.clearInterval(interval); timers.current.forEach(window.clearTimeout); timers.current = [] }
  }, [spawn])

  useEffect(() => {
    if (hintSignal) onMessage('隐：两个饱满山果就够了。包里的东西也可以放下，不必从头再来。')
  }, [hintSignal, onMessage])

  const space = basket.reduce((sum, apple) => sum + TYPES[apple.type].space, 0)
  const value = basket.reduce((sum, apple) => sum + TYPES[apple.type].value, 0)

  const takeApple = (apple: Apple) => {
    const config = TYPES[apple.type]
    if (space + config.space > CAPACITY) {
      onMessage('隐：包满了。先放下一些，再拿真正需要的。')
      return
    }
    setBasket((current) => [...current, apple])
    setApples((current) => current.filter((item) => item.uid !== apple.uid))
  }

  const submit = () => {
    if (value < GOAL) {
      onMessage(`隐：还需要 ${GOAL - value} 点回声。可以留大的，也可以放下多余的。`)
      return
    }
    onSolved()
  }

  return (
    <div className="greed-puzzle">
      <div className="apple-field" aria-label="掉落的山果">
        {apples.map((apple) => (
          <button type="button" key={apple.uid} className={`apple apple-${apple.type}`}
            style={{ left: `${apple.x}%`, animationDuration: `${apple.duration}s` }}
            onClick={() => takeApple(apple)} aria-label={`拾取${TYPES[apple.type].name}，占 ${TYPES[apple.type].space} 格，价值 ${TYPES[apple.type].value}`}>
            <AppleIcon type={apple.type} /><span>{TYPES[apple.type].name}</span>
          </button>
        ))}
      </div>
      <aside className="basket-panel" aria-label="游的邮差包">
        <header><span>邮差包</span><strong>{space} / {CAPACITY} 格</strong></header>
        <div className="basket-slots" aria-hidden="true">{Array.from({ length: CAPACITY }, (_, index) => <i key={index} className={index < space ? 'slot-filled' : ''} />)}</div>
        <div className="basket-items">
          {basket.length === 0 ? <p>还没有装入山果。</p> : basket.map((apple) => (
            <button type="button" key={apple.uid} onClick={() => setBasket((current) => current.filter((item) => item.uid !== apple.uid))} aria-label={`放下${TYPES[apple.type].name}`}>
              <span>{TYPES[apple.type].name}</span><small>{TYPES[apple.type].space} 格 · {TYPES[apple.type].value} 回声</small><b>放下</b>
            </button>
          ))}
        </div>
        <footer><span>回声 <strong>{value}</strong> / {GOAL}</span><button type="button" className="primary-button" onClick={submit}>带上山果</button></footer>
      </aside>
    </div>
  )
}
