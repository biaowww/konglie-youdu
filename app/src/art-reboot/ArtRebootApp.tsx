import { useState } from 'react'
import Opening from './Opening'
import ChiPlay from './ChiPlay'

type Screen = 'comic' | 'title' | 'chi'

export default function ArtRebootApp() {
  const [screen, setScreen] = useState<Screen>('comic')

  if (screen === 'chi') return <ChiPlay onExit={() => setScreen('title')} />
  return <Opening key={screen} initial={screen} onEnter={() => setScreen('chi')} />
}
