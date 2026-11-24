import { useState } from 'react'
import Opening from './Opening'
import ChiReboot from './ChiReboot'

type Screen = 'comic' | 'title' | 'chi'

export default function ArtRebootApp() {
  const [screen, setScreen] = useState<Screen>('comic')

  // 痴的视觉将在下一阶段替换；本阶段只保留进入流程。
  if (screen === 'chi') return <ChiReboot onExit={() => setScreen('title')} />
  return <Opening key={screen} initial={screen} onEnter={() => setScreen('chi')} />
}
