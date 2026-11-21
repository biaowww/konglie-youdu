import { useEffect, useState } from 'react'

type Variant = 'chen' | 'yi'
type Word = { id: number; char: string; x: number; y: number; target: boolean }
type Props = {
  variant: Variant
  resetKey: number
  hintSignal: number
  onFound: (count: number) => void
  onSolved: () => void
  onMessage: (message: string) => void
}

const COORDS = [[13, 24], [31, 20], [51, 28], [73, 21], [86, 39], [19, 47], [40, 45], [60, 52], [79, 59], [26, 68], [48, 72], [69, 76], [11, 79], [88, 81], [56, 15]]

function makeWords(variant: Variant, resetKey: number): Word[] {
  const targetChars = variant === 'chen' ? ['听', '听', '听'] : ['悔', '退', '改']
  const decoys = variant === 'chen' ? ['怒', '争', '胜', '怨', '骂', '恨', '吼', '辩', '气', '敌', '打', '赢'] : ['信', '行', '定', '路', '山', '风', '心', '念', '止', '观', '渡', '游']
  const targetIndexes = variant === 'chen' ? [2, 7, 11] : [1, 8, 12]
  const shift = resetKey % 3
  return COORDS.map(([x, y], id) => {
    const targetIndex = targetIndexes.indexOf(id)
    return { id, x: Math.max(8, Math.min(90, x + shift * 2)), y, target: targetIndex >= 0, char: targetIndex >= 0 ? targetChars[targetIndex] : decoys[id % decoys.length] }
  })
}

export default function WordPuzzle({ variant, resetKey, hintSignal, onFound, onSolved, onMessage }: Props) {
  const [words] = useState<Word[]>(() => makeWords(variant, resetKey))
  const [found, setFound] = useState<number[]>([])
  const [choice, setChoice] = useState<string | null>(variant === 'chen' ? '聆听' : null)
  const hinted = hintSignal > 0 ? words.find((word) => word.target && !found.includes(word.id))?.id ?? null : null

  useEffect(() => {
    if (!hintSignal) return
    if (!choice) { onMessage('隐：先选一条路。两条都能继续，没有标准答案。'); return }
    const target = words.find((word) => word.target && !found.includes(word.id))
    if (!target) return
    onMessage(`隐：留意${target.x < 40 ? '左侧' : target.x > 65 ? '右侧' : '中间'}，只需要找“${target.char}”。`)
  }, [hintSignal, choice, words, found, onMessage])

  const selectWord = (word: Word) => {
    if (found.includes(word.id)) return
    if (!word.target) {
      onMessage(variant === 'chen' ? `隐：不必回应“${word.char}”。继续找“听”。` : `隐：“${word.char}”不是此刻的动摇。只处理“悔、退、改”。`)
      return
    }
    const next = [...found, word.id]
    setFound(next); onFound(next.length)
    if (next.length === 3) onSolved()
  }

  if (!choice) {
    return (
      <div className="choice-panel">
        <span className="choice-eyebrow">碑林 · 没有标准答案</span>
        <h3>这一次，你想怎样走？</h3>
        <div className="choice-actions">
          <button type="button" className="primary-button" onClick={() => { setChoice('继续向上'); onMessage('隐：好。那就让“继续向上”留下来。现在，消除动摇。') }}>继续向上</button>
          <button type="button" className="secondary-button" onClick={() => { setChoice('停留听风'); onMessage('隐：好。停留也是选择。现在，消除动摇。') }}>停留听风</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`word-puzzle word-${variant}`}>
      {choice && variant === 'yi' && <div className="choice-ribbon">你的选择：{choice}</div>}
      {words.map((word, index) => (
        <button
          type="button"
          key={word.id}
          className={`word-token ${found.includes(word.id) ? 'word-found' : ''} ${hinted === word.id ? 'word-hinted' : ''}`}
          style={{ left: `${word.x}%`, top: `${word.y}%`, '--delay': `${-(index % 6)}s` } as React.CSSProperties}
          onClick={() => selectWord(word)}
          disabled={found.includes(word.id)}
          aria-label={`${word.char}${word.target ? '，可吸收' : ''}`}
        >{word.char}</button>
      ))}
    </div>
  )
}
