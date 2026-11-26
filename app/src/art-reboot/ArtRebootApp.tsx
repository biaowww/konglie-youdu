import { useEffect, useState } from 'react'
import Opening from './Opening'
import ChiPlay from './ChiPlay'
import JourneyMap from './JourneyMap'
import ArrivalClip from './ArrivalClip'
import SliceEnding from './SliceEnding'
import type { MapStep } from './JourneyMap'

type Screen = 'comic' | 'title' | 'arrival' | 'map' | 'chi' | 'ending'
type Saved = { step: MapStep; path: string[]; screen: 'map' | 'ending' }
const SAVE_KEY = 'youdu-slice-journey-v1'
const MAP_STEPS: MapStep[] = ['first', 'second', 'chi', 'restored']

function readSaved(): Saved | null {
  try {
    const value = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null') as Partial<Saved> | null
    if (!value || !MAP_STEPS.includes(value.step as MapStep) || !Array.isArray(value.path) || !value.path.every((id) => typeof id === 'string')) return null
    if (value.screen !== 'map' && value.screen !== 'ending') return null
    return { step: value.step as MapStep, path: value.path, screen: value.screen }
  } catch {
    return null
  }
}

export default function ArtRebootApp() {
  const [saved] = useState(readSaved)
  const [screen, setScreen] = useState<Screen>(saved?.screen ?? 'comic')
  const [step, setStep] = useState<MapStep>(saved?.step ?? 'first')
  const [path, setPath] = useState<string[]>(saved?.path ?? [])

  useEffect(() => {
    if (screen !== 'map' && screen !== 'ending') return
    const saved: Saved = { step, path, screen }
    localStorage.setItem(SAVE_KEY, JSON.stringify(saved))
  }, [screen, step, path])

  const choose = (id: string) => {
    setPath((current) => [...current, id])
    setStep((current) => current === 'first' ? 'second' : 'chi')
  }
  const restart = () => {
    localStorage.removeItem(SAVE_KEY)
    setStep('first')
    setPath([])
    setScreen('title')
  }

  if (screen === 'arrival') return <ArrivalClip onFinish={() => setScreen('map')} />
  if (screen === 'map') return <JourneyMap step={step} path={path} onChoose={choose} onChi={() => setScreen('chi')} onEnding={() => setScreen('ending')} />
  if (screen === 'chi') return <ChiPlay onExit={(completed) => { setStep(completed ? 'restored' : 'chi'); setScreen('map') }} />
  if (screen === 'ending') return <SliceEnding onRestart={restart} />
  return <Opening key={screen} initial={screen} onEnter={() => setScreen('arrival')} />
}
