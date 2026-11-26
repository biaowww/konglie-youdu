import './journey.css'

export default function SliceEnding({ onRestart }: { onRestart: () => void }) {
  return (
    <main className="journey-shell">
      <section className="journey-stage journey-ending" data-screen="ending" aria-label="两界交界">
        <img className="journey-ending-art" src="./assets/art-reboot/fable/c3-jade.webp" alt="包带上的玉玦与淡蓝紫点簇" />
        <div className="journey-contact" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ '--i': index } as React.CSSProperties} />)}</div>
        <div className="journey-ending-copy">
          <span>两界交界</span>
          <h2>玉玦又响了。</h2>
          <p>渡在山的另一边。<br />这一次，联系没有断开。</p>
          <button type="button" data-act="restart" onClick={onRestart}>重走山路</button>
          <small>痴 · 单关卡流程切片</small>
        </div>
      </section>
    </main>
  )
}
