import type { LevelConfig, LevelId, RewardCard } from './types'

export const LEVELS: Record<LevelId, LevelConfig> = {
  chen: { id: 'chen', name: '嗔', subtitle: '怒火之下，先听见', scene: '/assets/chen-outer.webp', innerScene: '/assets/chen-inner.webp', color: '#c25a4a', intro: '隐：忿挡住了山路。它不想听解释，你也无需赢过它。', tutorial: '隐：别反击。找到三个“听”，让它知道自己被听见了。', hint: '隐：不用碰那些怒言。专心找“听”。', outro: '忿的声音低了下来。原来盛怒之下，藏着一直没被听见的委屈。', fenLines: ['忿：你是不是也想说我错了？', '忿：别用那种眼神看我！', '忿：反正没人会听。'] },
  chi: { id: 'chi', name: '痴', subtitle: '让失焦的真相清晰', scene: '/assets/chi-scene.webp', color: '#7e9596', intro: '隐：这里的字都像是答案，却又都不是。玉佩正在回应。', tutorial: '隐：按住并拖动探灯。看清“痴”后，点一下，让玉佩收住它。', hint: '隐：把光移到文字更密集的地方，先看清，再点选。', outro: '你找到的不是答案本身，而是看清的方法。', fenLines: ['忿：左边什么都没有。', '忿：那不是“痴”，是你看错了。', '忿：光只会让你更糊涂。'] },
  man: { id: 'man', name: '慢', subtitle: '在赶路时看见微光', scene: '/assets/man-scene.webp', color: '#d4af37', intro: '隐：你一直在赶路，快得连身边的微光都看不见了。', tutorial: '隐：按住画面，时间就会慢下来。拖动去看，找到三个“慢”。', hint: '隐：先按住，让字慢下来，再移动灯光。无需着急。', outro: '被你忽略的微光，也有自己的声音。慢下来，才能听见。', fenLines: ['忿：快点，渡可不会一直等你。', '忿：那些微光有什么用？', '忿：停下就是输。'] },
  yi: { id: 'yi', name: '疑', subtitle: '选择之后，不再反复', scene: '/assets/yi-scene.webp', color: '#9b8aa6', intro: '隐：碑林没有标准答案。困住你的，是每一次选择之后的反复。', tutorial: '隐：先选一条路。然后消除“悔、退、改”，让你的选择留下来。', hint: '隐：不需要消除所有文字，只处理“悔、退、改”三个动摇。', outro: '路没有变得确定，但你不再每一步都否定自己。', fenLines: ['忿：你确定不要换吗？', '忿：另一条路才更好。', '忿：你又会选错的。'] },
  tan: { id: 'tan', name: '贪', subtitle: '欲望之间，学会取舍', scene: '/assets/tan-scene.webp', color: '#c4a35a', intro: '隐：树上的山果都诱人，但你的邮差包只有六格。', tutorial: '隐：拾取山果，回声达到 12 即可。装满时可以放下重来，不必全接。', hint: '隐：两个饱满山果已经足够。别被更多幻光迷惑。', outro: '你带走的不一定最多，却足够回应这一路的寻找。', fenLines: ['忿：大的当然更好。', '忿：再拿一个，又不会怎样。', '忿：全装上才算赢。'] },
}
export const LEVEL_ORDER: LevelId[] = ['chen', 'chi', 'man', 'yi', 'tan']
export const CARDS: RewardCard[] = [
  { id: 'tree', name: '山中树', image: '/assets/card-tree.webp', quote: '山不言，仍替每一片叶子留着位置。' },
  { id: 'dragon', name: '同源纹', image: '/assets/card-dragon.webp', quote: '纹路终会磨损，同源的东西仍会相认。' },
  { id: 'cat', name: '猫精灵', image: '/assets/card-cat.webp', quote: '没有被听见，不等于不存在。' },
  { id: 'statue', name: '古老神像', image: '/assets/card-statue.webp', quote: '短暂看见另一层，已足够让联系发生。' },
]
export const PROLOGUE = [
  { image: '/assets/city.webp', title: '出城', text: '游离开位面城，重新踏上归乡的路。邮差包里没有多少行李，只有一枚一直当作包扣的玉玦。' },
  { image: '/assets/mountain-a.webp', title: '归山', text: '它要回卦山，寻找渡。可越靠近故乡，越难辨清方向——仿佛有什么，把山与山里的人都隔开了。' },
]
export const MAP_POINTS = [{ x: 8, y: 84 }, { x: 21, y: 70 }, { x: 36, y: 59 }, { x: 51, y: 48 }, { x: 65, y: 37 }, { x: 78, y: 26 }, { x: 90, y: 13 }]
export function shuffleLevels(seed: number): LevelId[] {
  const result = [...LEVEL_ORDER]
  let value = seed >>> 0
  const random = () => { value += 0x6D2B79F5; let t = value; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  for (let i = result.length - 1; i > 0; i -= 1) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]] }
  return result
}
export function rollCard(seed: number, level: LevelId, completedCount: number): RewardCard | null {
  const text = `${seed}:${level}:${completedCount}`
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619) }
  const normalized = (hash >>> 0) / 4294967296
  if (normalized >= 0.45) return null
  return CARDS[(hash >>> 8) % CARDS.length]
}
