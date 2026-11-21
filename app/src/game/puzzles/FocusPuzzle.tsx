import { useEffect, useRef } from 'react'

type Variant = 'chi' | 'man'
type Glyph = { id: number; char: string; x: number; y: number; size: number; angle: number; target: boolean; found: boolean; direction: number }
type Props = {
  variant: Variant
  resetKey: number
  hintSignal: number
  onFound: (count: number) => void
  onSolved: () => void
  onMessage: (message: string) => void
}

const POSITIONS = [
  [0.17, 0.25], [0.34, 0.20], [0.51, 0.30], [0.73, 0.23], [0.86, 0.37], [0.12, 0.49],
  [0.30, 0.52], [0.47, 0.44], [0.63, 0.49], [0.58, 0.70], [0.80, 0.62], [0.90, 0.76],
  [0.19, 0.75], [0.35, 0.67], [0.44, 0.81], [0.72, 0.80], [0.85, 0.84], [0.08, 0.85],
  [0.53, 0.17], [0.66, 0.36], [0.25, 0.39], [0.77, 0.48], [0.39, 0.59], [0.61, 0.59],
]

function randomGenerator(seed: number) {
  let value = seed >>> 0
  return () => {
    value += 0x6D2B79F5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeGlyphs(variant: Variant, seed: number): Glyph[] {
  const random = randomGenerator(seed)
  const target = variant === 'chi' ? '痴' : '慢'
  const decoys = variant === 'chi' ? ['知', '疾', '吃', '疑', '目', '真', '妄'] : ['快', '赶', '冲', '先', '急', '忙', '速']
  const targetIndexes = new Set([0, 3, 9])
  return POSITIONS.map(([x, y], id) => ({
    id, target: targetIndexes.has(id), found: false,
    char: targetIndexes.has(id) ? target : decoys[id % decoys.length],
    x: Math.max(0.07, Math.min(0.93, x + (random() - 0.5) * 0.04)),
    y: Math.max(0.16, Math.min(0.84, y + (random() - 0.5) * 0.03)),
    size: 28 + random() * 30,
    angle: (random() - 0.5) * (variant === 'chi' ? 1.3 : 0.35),
    direction: id % 2 === 0 ? 1 : -1,
  }))
}

export default function FocusPuzzle({ variant, resetKey, hintSignal, onFound, onSolved, onMessage }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glyphsRef = useRef<Glyph[]>(makeGlyphs(variant, 19))
  const pointRef = useRef({ x: 0.5, y: 0.52, active: false })
  const gestureRef = useRef({ down: false, dragged: false, x: 0, y: 0, pointerId: -1 })
  const hintRef = useRef<{ id: number; started: number } | null>(null)
  const dirtyRef = useRef(true)
  const foundRef = useRef(0)
  const targetChar = variant === 'chi' ? '痴' : '慢'

  useEffect(() => {
    glyphsRef.current = makeGlyphs(variant, 19 + resetKey * 37)
    foundRef.current = 0
    hintRef.current = null
    pointRef.current = { x: 0.5, y: 0.52, active: false }
    dirtyRef.current = true
  }, [resetKey, variant])

  useEffect(() => {
    if (!hintSignal) return
    const target = glyphsRef.current.find((glyph) => glyph.target && !glyph.found)
    if (!target) return
    hintRef.current = { id: target.id, started: performance.now() }
    const horizontal = target.x < 0.38 ? '左侧' : target.x > 0.63 ? '右侧' : '中间'
    onMessage(`隐：试着留意${horizontal}的区域。${variant === 'man' ? '按住，让时间慢一点。' : '先聚焦，再点选。'}`)
  }, [hintSignal, onMessage, variant])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const blurredLayer = document.createElement('canvas')
    const sharpLayer = document.createElement('canvas')
    let frame = 0
    let width = 1
    let height = 1
    let dpr = 1
    let lastPaint = 0
    let lastTargetUpdate = 0
    let previousTime = performance.now()

    const paintGlyphs = (layer: HTMLCanvasElement, sharp: boolean, time: number) => {
      const brush = layer.getContext('2d')
      if (!brush) return
      brush.setTransform(dpr, 0, 0, dpr, 0, 0)
      brush.clearRect(0, 0, width, height)
      brush.textAlign = 'center'; brush.textBaseline = 'middle'
      brush.filter = variant === 'chi' && !sharp ? 'blur(5px)' : 'none'
      const dt = Math.min(0.06, (time - previousTime) / 1000)
      for (const glyph of glyphsRef.current) {
        if (glyph.found) continue
        if (variant === 'man') {
          const speed = gestureRef.current.down ? 0.015 : 0.045
          glyph.x += glyph.direction * speed * dt
          if (glyph.x < 0.06 || glyph.x > 0.94) glyph.direction *= -1
          glyph.x = Math.max(0.06, Math.min(0.94, glyph.x))
        }
        brush.save(); brush.translate(glyph.x * width, glyph.y * height); brush.rotate(glyph.angle)
        const scale = Math.max(0.72, Math.min(1.2, width / 1050))
        brush.font = `${Math.round(glyph.size * scale)}px "Songti SC", "Hiragino Sans GB", serif`
        brush.globalAlpha = sharp ? (glyph.target ? 0.96 : 0.72) : (variant === 'chi' ? 0.33 : 0.24)
        brush.fillStyle = glyph.target ? (variant === 'chi' ? '#173d66' : '#725d19') : '#3e4f5e'
        if (variant === 'man' && glyph.target) {
          brush.shadowColor = '#e8c547'; brush.shadowBlur = sharp ? 14 : 5
        }
        brush.fillText(glyph.char, 0, 0); brush.restore()
      }
      brush.filter = 'none'; brush.globalAlpha = 1; brush.shadowBlur = 0
      previousTime = time
    }

    const rebuild = (time: number) => {
      for (const layer of [blurredLayer, sharpLayer]) {
        layer.width = Math.round(width * dpr); layer.height = Math.round(height * dpr)
      }
      paintGlyphs(blurredLayer, false, time)
      paintGlyphs(sharpLayer, true, time)
      dirtyRef.current = false
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      width = Math.max(1, rect.width); height = Math.max(1, rect.height)
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr)
      dirtyRef.current = true
    }
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize()

    const draw = (time: number) => {
      frame = requestAnimationFrame(draw)
      if (time - lastPaint < 30) return
      lastPaint = time
      if (time - lastTargetUpdate > 180) {
        lastTargetUpdate = time
        canvas.dataset.targets = JSON.stringify(glyphsRef.current.filter((glyph) => glyph.target && !glyph.found).map((glyph) => ({ id: glyph.id, x: glyph.x, y: glyph.y })))
      }
      if (dirtyRef.current || variant === 'man') rebuild(time)
      context.setTransform(dpr, 0, 0, dpr, 0, 0); context.clearRect(0, 0, width, height)
      context.drawImage(blurredLayer, 0, 0, blurredLayer.width, blurredLayer.height, 0, 0, width, height)

      const point = pointRef.current
      const px = point.x * width; const py = point.y * height
      const radius = Math.max(82, Math.min(136, Math.min(width, height) * 0.19))
      context.save(); context.beginPath(); context.arc(px, py, radius, 0, Math.PI * 2); context.clip()
      context.drawImage(sharpLayer, 0, 0, sharpLayer.width, sharpLayer.height, 0, 0, width, height)
      context.restore()

      const glow = context.createRadialGradient(px, py, radius * 0.45, px, py, radius * 1.08)
      glow.addColorStop(0, variant === 'man' ? 'rgba(232,197,71,0.06)' : 'rgba(188,225,230,0)')
      glow.addColorStop(1, variant === 'man' ? 'rgba(212,175,55,0.25)' : 'rgba(111,176,205,0.28)')
      context.fillStyle = glow; context.beginPath(); context.arc(px, py, radius * 1.08, 0, Math.PI * 2); context.fill()
      context.strokeStyle = point.active ? 'rgba(207,229,220,0.72)' : 'rgba(207,229,220,0.3)'
      context.lineWidth = 1.4; context.setLineDash([3, 7]); context.beginPath(); context.arc(px, py, radius, 0, Math.PI * 2); context.stroke(); context.setLineDash([])

      if (hintRef.current && time - hintRef.current.started < 3500) {
        const target = glyphsRef.current.find((glyph) => glyph.id === hintRef.current?.id)
        if (target && !target.found) {
          context.strokeStyle = 'rgba(212,175,55,0.75)'; context.lineWidth = 2
          context.beginPath(); context.arc(target.x * width, target.y * height, 78 + Math.sin(time / 170) * 7, 0, Math.PI * 2); context.stroke()
        }
      }
    }
    frame = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(frame); observer.disconnect() }
  }, [variant, resetKey])

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) }
  }

  const collectAt = (x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const nearest = glyphsRef.current.filter((glyph) => !glyph.found)
      .map((glyph) => ({ glyph, distance: Math.hypot((glyph.x - x) * rect.width, (glyph.y - y) * rect.height) }))
      .sort((a, b) => a.distance - b.distance)[0]
    if (!nearest || nearest.distance > 62) return
    if (!nearest.glyph.target) {
      onMessage(`隐：这是“${nearest.glyph.char}”，不是“${targetChar}”。再看一眼。`)
      return
    }
    nearest.glyph.found = true
    dirtyRef.current = true
    foundRef.current += 1
    onFound(foundRef.current)
    if (foundRef.current === 3) onSolved()
  }

  const pointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (gestureRef.current.down) return
    const point = getPoint(event)
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.focus({ preventScroll: true })
    gestureRef.current = { down: true, dragged: false, x: event.clientX, y: event.clientY, pointerId: event.pointerId }
    pointRef.current = { ...point, active: true }
  }
  const pointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const gesture = gestureRef.current
    if (!gesture.down || gesture.pointerId !== event.pointerId) return
    const point = getPoint(event)
    if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 8) gesture.dragged = true
    pointRef.current = { ...point, active: true }
  }
  const pointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const gesture = gestureRef.current
    if (gesture.pointerId !== event.pointerId) return
    const point = getPoint(event)
    if (!gesture.dragged) collectAt(point.x, point.y)
    gestureRef.current.down = false; gestureRef.current.pointerId = -1
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const keyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    const moves: Record<string, [number, number]> = { ArrowLeft: [-0.04, 0], ArrowRight: [0.04, 0], ArrowUp: [0, -0.04], ArrowDown: [0, 0.04] }
    if (moves[event.key]) {
      event.preventDefault(); const [dx, dy] = moves[event.key]
      pointRef.current = { x: Math.max(0.03, Math.min(0.97, pointRef.current.x + dx)), y: Math.max(0.08, Math.min(0.92, pointRef.current.y + dy)), active: true }
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); collectAt(pointRef.current.x, pointRef.current.y)
    }
  }

  return <canvas ref={canvasRef} className="puzzle-canvas" tabIndex={0}
    aria-label={`${variant === 'chi' ? '探灯聚焦' : '按住减速'}，寻找三个${targetChar}。方向键移动，Enter 选择。`}
    onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
    onPointerCancel={() => { gestureRef.current.down = false; gestureRef.current.pointerId = -1 }} onKeyDown={keyDown} />
}
