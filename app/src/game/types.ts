export type LevelId = 'chen' | 'chi' | 'man' | 'yi' | 'tan'
export type Screen = 'title' | 'prologue' | 'arrival' | 'map' | 'level' | 'ending'
export type LevelPhase = 'outer' | 'transition' | 'inner' | 'complete'

export interface LevelConfig {
  id: LevelId
  name: string
  subtitle: string
  scene: string
  innerScene?: string
  color: string
  intro: string
  tutorial: string
  hint: string
  outro: string
  fenLines: string[]
}

export interface RewardCard {
  id: string
  name: string
  image: string
  quote: string
}

export interface SaveState {
  seed: number
  order: LevelId[]
  completed: LevelId[]
  cards: RewardCard[]
  volume: number
}
