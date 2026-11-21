import { useEffect, useState } from 'react'
import { ArrowRight, Play, RotateCcw, Volume2, VolumeX, X } from 'lucide-react'
import MapScreen from './components/MapScreen'
import LevelShell from './components/LevelShell'
import Guide from './components/Guide'
import Ending from './components/Ending'
import { LEVELS, PROLOGUE, rollCard, shuffleLevels } from './game/content'
import { audio } from './game/audio'
import type { LevelId, RewardCard, SaveState, Screen } from './game/types'
import './App.css'

const SAVE_KEY = 'youdu-save-v1'

function loadSave(): SaveState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as SaveState
    if (!Array.isArray(value.order) || !Array.isArray(value.completed) || !Array.isArray(value.cards)) return null
    return value
  } catch { return null }
}

export default function App() {
  const [saved] = useState<SaveState | null>(loadSave)
  const [screen, setScreen] = useState<Screen>('title')
  const [prologuePage, setProloguePage] = useState(0)
  const [arrived, setArrived] = useState(false)
  const [seed, setSeed] = useState(saved?.seed ?? 20261121)
  const [order, setOrder] = useState<LevelId[]>(saved?.order ?? shuffleLevels(20261121))
  const [completed, setCompleted] = useState<LevelId[]>(saved?.completed ?? [])
  const [cards, setCards] = useState<RewardCard[]>(saved?.cards ?? [])
  const [volume, setVolume] = useState(saved?.volume ?? 0.45)
  const [muted, setMuted] = useState(false)
  const [currentLevel, setCurrentLevel] = useState<LevelId | null>(null)
  const [replay, setReplay] = useState(false)
  const [activeCard, setActiveCard] = useState<RewardCard | null>(null)
  const [showCollection, setShowCollection] = useState(false)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => { audio.setVolume(volume) }, [volume])
  useEffect(() => {
    const state: SaveState = { seed, order, completed, cards, volume }
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  }, [seed, order, completed, cards, volume])
  useEffect(() => {
    if (screen !== 'arrival') return
    const timer = window.setTimeout(() => setArrived(true), 1500)
    return () => window.clearTimeout(timer)
  }, [screen])

  const startAudio = () => { void audio.start().catch(() => undefined) }

  const newGame = () => {
    startAudio()
    const nextSeed = Math.floor(Date.now() % 1000000)
    setSeed(nextSeed); setOrder(shuffleLevels(nextSeed)); setCompleted([]); setCards([])
    setCurrentLevel(null); setProloguePage(0); setActiveCard(null); setShowCollection(false); setReplay(false)
    setScreen('prologue')
  }

  const continueGame = () => {
    startAudio()
    setScreen(completed.length >= 5 ? 'ending' : 'map')
  }

  const nextFromMap = (level: LevelId | null) => {
    audio.play('click')
    if (!level) { setScreen('ending'); return }
    setCurrentLevel(level); setScreen('level')
  }

  const completeLevel = (id: LevelId) => {
    if (completed.includes(id)) return
    const nextCompleted = [...completed, id]
    setCompleted(nextCompleted); setCurrentLevel(null); setScreen('map'); setReplay(true)
    window.setTimeout(() => setReplay(false), 2700)
    const reward = rollCard(seed, id, nextCompleted.length)
    if (reward && !cards.some((card) => card.id === reward.id)) {
      setCards((current) => [...current, reward]); setActiveCard(reward); setFlipped(false); audio.play('card')
    }
  }

  const openCard = (card: RewardCard) => {
    setShowCollection(false); setActiveCard(card); setFlipped(false); audio.play('card')
  }

  return (
    <main className="youdu-app" data-screen={screen}>
      {screen === 'title' && (
        <section className="title-screen">
          <div className="title-background" />
          <div className="title-content">
            <img className="title-logo" src="/assets/logo.webp" alt="空裂：游渡标志" />
            <span className="title-overline">空裂世界观 · 卦山篇</span>
            <h1>空裂：游渡</h1>
            <p>一只猫，一座山，和一次重新建立联系的攀登。</p>
            <div className="title-actions">
              <button type="button" className="primary-button" onClick={newGame}><Play size={18} />开始攀登</button>
              {saved && <button type="button" className="secondary-button" onClick={continueGame}>继续上次 · {saved.completed.length} / 5</button>}
            </div>
            <span className="title-note">完整测试版 · 鼠标与触屏可玩</span>
          </div>
        </section>
      )}

      {screen === 'prologue' && (
        <section className="prologue-screen">
          <div className="comic-page">
            <img src={PROLOGUE[prologuePage].image} alt={PROLOGUE[prologuePage].title} />
            <div className="comic-caption"><span>{String(prologuePage + 1).padStart(2, '0')} / 02</span><h2>{PROLOGUE[prologuePage].title}</h2><p>{PROLOGUE[prologuePage].text}</p></div>
          </div>
          <button type="button" className="primary-button prologue-next" onClick={() => {
            audio.play('click')
            if (prologuePage === 0) setProloguePage(1)
            else { setArrived(false); setScreen('arrival') }
          }}>
            {prologuePage === 0 ? '翻到下一页' : '回到卦山'}<ArrowRight size={18} />
          </button>
        </section>
      )}

      {screen === 'arrival' && (
        <section className={`arrival-screen ${arrived ? 'arrived' : ''}`}>
          <div className="arrival-outer" /><div className="arrival-inner" />
          <div className="arrival-copy">
            <span className="eyebrow">空裂之后 · 卦山</span>
            <h2>山还在，只是颜色与联系被隔开了。</h2>
            <p>表世界失去色彩，信息开始失真。只有古老猫神像，还能让另一层短暂显现。</p>
            {arrived && <button type="button" className="primary-button" onClick={() => { audio.play('switch'); setScreen('map') }}>进入卦山</button>}
          </div>
        </section>
      )}

      {screen === 'map' && <MapScreen order={order} completed={completed} cards={cards} seed={seed} replay={replay} onNext={nextFromMap} onShowCards={() => setShowCollection(true)} />}
      {screen === 'level' && currentLevel && <LevelShell level={LEVELS[currentLevel]} onComplete={completeLevel} onExit={() => { setCurrentLevel(null); setScreen('map') }} />}
      {screen === 'ending' && <Ending onRestart={newGame} />}

      {activeCard && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveCard(null) }}>
          <section className="card-modal" role="dialog" aria-modal="true" aria-label={`卡牌：${activeCard.name}`}>
            <button type="button" className="modal-close icon-button" onClick={() => setActiveCard(null)} aria-label="关闭卡牌"><X size={20} /></button>
            <span className="eyebrow">山中拾得 · 世界观卡牌</span>
            <button type="button" className={`reward-card ${flipped ? 'card-flipped' : ''}`} onClick={() => setFlipped((value) => !value)} aria-label={flipped ? '查看卡牌正面' : '翻开卡牌背面'}>
              {!flipped ? <><img className="card-frame-image" src="/assets/card-frame.webp" alt="卡牌框" /><img className="card-art-image" src={activeCard.image} alt={activeCard.name} /><span className="card-name">{activeCard.name}</span></> : <blockquote>「{activeCard.quote}」</blockquote>}
            </button>
            <p className="card-instruction">点击卡牌翻面</p>
            <button type="button" className="primary-button" onClick={() => setActiveCard(null)}>收入卡册</button>
          </section>
        </div>
      )}

      {showCollection && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCollection(false) }}>
          <section className="collection-modal" role="dialog" aria-modal="true" aria-label="卡牌册">
            <header><div><span className="eyebrow">本次攀登</span><h2>卡牌册</h2></div><button type="button" className="icon-button" onClick={() => setShowCollection(false)} aria-label="关闭卡牌册"><X size={20} /></button></header>
            <div className="collection-grid">{cards.map((card) => <button type="button" key={card.id} onClick={() => openCard(card)}><img src={card.image} alt={card.name} /><span>{card.name}</span></button>)}</div>
          </section>
        </div>
      )}

      <div className="sound-controls">
        <button type="button" className="icon-button" onClick={() => { startAudio(); const next = !muted; setMuted(next); audio.setMuted(next) }} aria-label={muted ? '开启声音' : '静音'}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
        <input aria-label="音量" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => { startAudio(); setVolume(Number(event.target.value)) }} />
      </div>

      {screen !== 'title' && screen !== 'level' && <button type="button" className="new-run-button text-button" onClick={newGame}><RotateCcw size={14} />新的攀登</button>}
      {screen === 'arrival' && <Guide text="隐：别怕。山只是暂时听不见你。" />}
    </main>
  )
}
