type GuideProps = { text: string; speaker?: '隐' | '忿' }

export default function Guide({ text, speaker = '隐' }: GuideProps) {
  return (
    <div className={`guide-dialogue ${speaker === '忿' ? 'guide-fen' : ''}`} aria-live="polite">
      {speaker === '隐' ? <img className="guide-avatar" src="/assets/yin-icon.webp" alt="隐的头像" /> : <span className="guide-avatar guide-avatar-fen">忿</span>}
      <div className="guide-copy"><span className="guide-name">{speaker}</span><p>{text.replace(/^(隐|忿)：/, '')}</p></div>
    </div>
  )
}
