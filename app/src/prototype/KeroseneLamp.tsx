type Props = {
  id: number
  x: number
  y: number
  size: number
  variant: number
  delay: number
  onInspect: (id: number) => void
}

export default function KeroseneLamp({ id, x, y, size, variant, delay, onInspect }: Props) {
  return (
    <button
      type="button"
      className={`chi-lamp chi-lamp-${variant}`}
      style={{ left: `${x}%`, top: `${y}%`, width: size, '--lamp-delay': `${delay}s` } as React.CSSProperties}
      onClick={() => onInspect(id)}
      aria-label="查看幻境中的煤油灯"
    >
      <svg viewBox="0 0 64 92" aria-hidden="true">
        <path className="chi-lamp-aura" d="M32 4C13 20 8 39 13 60c4 18 34 18 38 0 5-21-1-40-19-56Z" />
        <path className="chi-lamp-flame" d="M32 19c-8 12-9 21-4 29 2 4 6 4 8 0 5-8 4-17-4-29Z" />
        <path className="chi-lamp-glass" d="M20 42c-4 10-5 21-2 31h28c3-10 2-21-2-31-7 4-17 4-24 0Z" />
        <path className="chi-lamp-metal" d="M17 37c8-5 22-5 30 0l-3 6c-8 3-16 3-24 0Zm-3 35c10-4 26-4 36 0l-4 8c-9 3-19 3-28 0Zm4 10h28l-4 6H22Z" />
        <path className="chi-lamp-handle" d="M21 38c-8-20 30-20 22 0" />
      </svg>
    </button>
  )
}
