import { useEffect, useReducer } from 'react'
import type { AnimationEvent, CSSProperties } from 'react'

/**
 * 独立四格漫画 + 开始界面。
 * 第①–③格在同一张纸上以不等画幅逐格落下；第④格是通栏竖卷，
 * 上行停稳后同一个 DOM 节点原地成为开始界面背景（无跳切）。
 * 动效只作用于当前格，且都是有限次数。
 */

type Props = { initial?: 'comic' | 'title'; onEnter: () => void }
type Step = 0 | 1 | 2 | 3 | 4
type State = { step: Step; settled: boolean }
type Action = 'next' | 'back' | 'skip' | 'settle' | 'replay'

const ART = './assets/art-reboot/fable'
const TEXT = {
  p1: ['卦山的颜色，', '正在一笔一笔掉下去。'],
  p2: ['寄往卦山的信，', '全都退了回来。'],
  p3: ['渡是我的主人。', '玉玦还在响——', '渡还在山上。'],
  p4: ['五处浊色未清。', '我上山。'],
}

// ① 退色米点：[x%, y%, 朝向deg]，自右向左排列，落在山体着墨处。
// 每粒只把自己身下的原画点触褪淡，不另画新东西。
const P1_GRAINS: [number, number, number][] = [
  [82.5, 29, -30], [72.5, 17, 20], [62.5, 40, -12], [57.5, 29, 34], [52.5, 63, -24], [47.5, 17, 8],
  [42.5, 75, -38], [37.5, 40, 16], [27.5, 63, -8], [22.5, 17, 28], [17.5, 40, -20], [12.5, 75, 12],
]
// ③ 玦口点簇：[颜色, 散开位移x, 散开位移y]（单位 cqw）
const P3_DOTS: [string, number, number][] = [
  ['#a9bfe6', -2.4, -1.6], ['#bba8da', 2.2, -1.9], ['#bba8da', -2.8, 1.2],
  ['#a9bfe6', 2.6, 1.5], ['#bba8da', 0, 2.6], ['#a9bfe6', 0.4, -2.8],
]
// ④ 五处浊痕旁的漂移点：[x%, y%]（相对竖卷）
const P4_MARKS: [number, number][] = [[77, 23], [72, 37], [42, 31], [9, 52], [30, 63]]
const P4_SUMMIT: [number, number][] = [[-1.6, -0.6], [0.3, -1.3], [1.8, -0.2], [-0.6, 0.9], [1.1, 1.2]]

function reduce(state: State, action: Action): State {
  switch (action) {
    case 'next':
      if (state.step < 3) return { step: (state.step + 1) as Step, settled: false }
      if (state.step === 3) return state.settled ? { step: 4, settled: true } : { step: 3, settled: true }
      return state
    case 'back':
      if (state.step === 0) return state
      if (state.step === 4) return { step: 3, settled: true }
      return { step: (state.step - 1) as Step, settled: false }
    case 'skip': return { step: 4, settled: true }
    case 'settle': return state.step === 3 ? { step: 3, settled: true } : state
    case 'replay': return { step: 0, settled: false }
  }
}

const vars = (values: Record<string, string | number>) => values as CSSProperties

export default function Opening({ initial = 'comic', onEnter }: Props) {
  const [state, dispatch] = useReducer(reduce, initial === 'title' ? { step: 4, settled: true } : { step: 0, settled: false })
  const { step, settled } = state
  const isTitle = step === 4
  const onScroll = step >= 3

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') dispatch('next')
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') dispatch('back')
      if (event.key === 'Escape') dispatch('skip')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const cls = (index: number) => `${step >= index ? 'is-shown' : ''} ${step === index ? 'is-current' : ''}`
  const onRiseEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && event.animationName === 'fable-scroll-rise') dispatch('settle')
  }

  return (
    <main className="fable-shell">
      <section
        className="fable-stage"
        data-fable-step={isTitle ? 'title' : String(step + 1)}
        data-settled={settled ? 'true' : 'false'}
        aria-label={isTitle ? '空裂游渡开始界面' : '开场四格漫画'}
      >
        {/* 第①–③格：同一张纸上的不等画幅 */}
        {!onScroll && (
          <div className="fable-page">
            <figure className={`fable-panel fable-p1 ${cls(0)}`} data-panel="1">
              <div className="fable-art">
                <img className="fable-base" src={`${ART}/c1-mountain.webp`} alt="高位俯瞰卦山：一道留白裂隙斜贯山体，一侧尚有暖色，一侧已褪成墨灰" />
                <div className="fable-fx" aria-hidden="true">
                  {P1_GRAINS.map(([x, y, r], index) => (
                    <i key={index} className="p1-grain" style={vars({ left: `${x}%`, top: `${y}%`, '--r': `${r}deg`, '--i': index })} />
                  ))}
                </div>
              </div>
              <figcaption className="fable-caption fable-c1" data-caption="1">
                {TEXT.p1.map((line) => <span key={line}>{line}</span>)}
              </figcaption>
            </figure>

            <figure className={`fable-panel fable-p2 ${cls(1)}`} data-panel="2">
              <div className="fable-art">
                <img className="fable-base" src={`${ART}/c2-window.webp`} alt="位面城窗边，背着邮包的游侧坐，身旁是一摞退回的信" />
                <div className="fable-fx" aria-hidden="true">
                  <img className="p2-fur" src={`${ART}/c2-window.webp`} alt="" />
                  <img className="p2-letter" src={`${ART}/c2-window.webp`} alt="" />
                </div>
              </div>
              <figcaption className="fable-caption fable-vertical fable-c2" data-caption="2">
                {TEXT.p2.map((line) => <span key={line}>{line}</span>)}
              </figcaption>
            </figure>

            <figure className={`fable-panel fable-p3 ${cls(2)}`} data-panel="3">
              <div className="fable-art">
                <div className="p3-sway">
                  <img className="fable-base" src={`${ART}/c3-jade.webp`} alt="包带上系着的玉玦特写，玦口内有一团淡蓝紫的点" />
                  <div className="fable-fx" aria-hidden="true">
                    <span className="p3-cluster">
                      {P3_DOTS.map(([color, dx, dy], index) => (
                        <i key={index} className="p3-dot" style={vars({ '--c': color, '--dx': `${dx}cqw`, '--dy': `${dy}cqw` })} />
                      ))}
                    </span>
                  </div>
                </div>
              </div>
              <figcaption className="fable-caption fable-vertical fable-c3" data-caption="3">
                {TEXT.p3.map((line) => <span key={line}>{line}</span>)}
              </figcaption>
            </figure>
          </div>
        )}

        {/* 第④格：竖卷。停稳后原地成为开始界面背景 */}
        {onScroll && (
          <div className="fable-scroll-wrap" data-panel="4">
            <div className={`fable-scroll ${settled ? 'is-settled' : ''}`} onAnimationEnd={onRiseEnd}>
              <img className="fable-base" src={`${ART}/c4-scroll.webp`} alt="竖卷：游立在山脚，石径蜿蜒上行，贪、嗔、痴、慢、疑五处浊痕分布在不同高度，山顶有淡蓝紫的点" />
              <div className="fable-fx" aria-hidden="true">
                {P4_MARKS.map(([x, y], index) => (
                  <i key={index} className="p4-mark" style={vars({ left: `${x}%`, top: `${y}%`, '--i': index })} />
                ))}
                <span className="p4-summit">
                  {P4_SUMMIT.map(([dx, dy], index) => (
                    <i key={index} style={vars({ '--dx': `${dx}cqw`, '--dy': `${dy}cqw`, '--i': index })} />
                  ))}
                </span>
              </div>
            </div>
            {!isTitle && (
              <p className={`fable-caption fable-vertical fable-c4 ${settled ? 'is-shown' : ''}`} data-caption="4">
                {TEXT.p4.map((line) => <span key={line}>{line}</span>)}
              </p>
            )}
            {isTitle && (
              <div className="fable-title">
                <h1><span>空裂：</span><span>游渡</span></h1>
                <button type="button" className="fable-seal" data-act="enter" onClick={onEnter} aria-label="入山">
                  <span>入山</span>
                </button>
                <button type="button" className="fable-ink-btn fable-replay" data-act="replay" onClick={() => dispatch('replay')}>重看漫画</button>
              </div>
            )}
          </div>
        )}

        {!isTitle && (
          <>
            <div className="fable-marks" role="img" aria-label={`第 ${step + 1} 格，共 4 格`}>
              {[0, 1, 2, 3].map((index) => <i key={index} className={index <= step ? 'is-on' : ''} />)}
            </div>
            <nav className="fable-nav" aria-label="翻格">
              <button type="button" className="fable-ink-btn" data-act="back" onClick={() => dispatch('back')} disabled={step === 0}>前格</button>
              <button type="button" className="fable-ink-btn" data-act="skip" onClick={() => dispatch('skip')}>跳过</button>
              <button type="button" className="fable-ink-btn" data-act="next" onClick={() => dispatch('next')}>{step === 3 && settled ? '启程' : '后格'}</button>
            </nav>
          </>
        )}
      </section>
    </main>
  )
}
