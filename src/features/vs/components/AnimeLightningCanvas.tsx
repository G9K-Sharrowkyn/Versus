import { useEffect, useRef } from 'react'

type Point = { x: number; y: number }

const SIZE = 500
const CENTER: Point = { x: SIZE / 2, y: 20 }
const MIN_SEGMENT_HEIGHT = 5
const GROUND_HEIGHT = SIZE - 20
const ROUGHNESS = 2
const MAX_DIFFERENCE = SIZE / 5

const createLightning = (): Point[] => {
  let segmentHeight = GROUND_HEIGHT - CENTER.y
  let lightning: Point[] = [
    CENTER,
    {
      x: Math.random() * (SIZE - 100) + 50,
      y: GROUND_HEIGHT + (Math.random() - 0.9) * 50,
    },
  ]
  let currDiff = MAX_DIFFERENCE

  while (segmentHeight > MIN_SEGMENT_HEIGHT) {
    const newSegments: Point[] = []
    for (let index = 0; index < lightning.length - 1; index += 1) {
      const start = lightning[index]
      const end = lightning[index + 1]
      const midX = (start.x + end.x) / 2
      const newX = midX + (Math.random() * 2 - 1) * currDiff
      newSegments.push(start, { x: newX, y: (start.y + end.y) / 2 })
    }

    newSegments.push(lightning[lightning.length - 1])
    lightning = newSegments

    currDiff /= ROUGHNESS
    segmentHeight /= 2
  }

  return lightning
}

export function AnimeLightningCanvas({ frameIntervalMs = 16 }: { frameIntervalMs?: number }) {
  const hostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const auditMode =
      typeof document !== 'undefined' && document.documentElement.dataset.vsAudit === 'true'
    let frame = 0
    let previous = 0
    let canvas: HTMLCanvasElement | null = null
    let context: CanvasRenderingContext2D | null = null
    const dpr = window.devicePixelRatio || 1

    const ensureCanvas = () => {
      if (!canvas) {
        canvas = document.createElement('canvas')
        canvas.className = 'lightning-canvas'
        host.appendChild(canvas)
      }

      const width = Math.max(220, Math.floor(host.clientWidth))
      const height = Math.max(100, Math.floor(host.clientHeight))
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context = canvas.getContext('2d')
      if (context) {
        context.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
    }

    const draw = (time: number) => {
      if (!context) return
      if (time - previous < Math.max(16, frameIntervalMs)) {
        if (!auditMode) frame = requestAnimationFrame(draw)
        return
      }
      previous = time

      const width = Math.max(1, Math.floor(host.clientWidth))
      const height = Math.max(1, Math.floor(host.clientHeight))
      const ctx = context

      const sourceX = width - 1
      const sourceY = height * 0.5
      const beamLength = width * 0.56
      const fanHalfHeight = height * 0.44
      const alongDenominator = GROUND_HEIGHT - CENTER.y

      const transformed = createLightning().map((point) => {
        const along = (point.y - CENTER.y) / alongDenominator
        const lateral = (point.x - CENTER.x) / (SIZE / 2)
        return {
          x: sourceX - along * beamLength,
          y: sourceY + lateral * fanHalfHeight,
        }
      })

      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'lighter'

      ctx.beginPath()
      ctx.moveTo(transformed[0].x, transformed[0].y)
      for (let index = 1; index < transformed.length; index += 1) {
        ctx.lineTo(transformed[index].x, transformed[index].y)
      }
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = 'hsl(188, 100%, 78%)'
      ctx.shadowColor = 'hsl(188, 100%, 78%)'
      ctx.shadowBlur = 14
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(transformed[0].x, transformed[0].y)
      for (let index = 1; index < transformed.length; index += 1) {
        ctx.lineTo(transformed[index].x, transformed[index].y)
      }
      ctx.shadowBlur = 0
      ctx.strokeStyle = 'hsla(190, 100%, 96%, 0.92)'
      ctx.lineWidth = 0.9
      ctx.stroke()

      if (!auditMode) frame = requestAnimationFrame(draw)
    }

    ensureCanvas()
    const resizeObserver = new ResizeObserver(() => ensureCanvas())
    resizeObserver.observe(host)

    if (auditMode) {
      draw(0)
    } else {
      frame = requestAnimationFrame(draw)
    }

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      if (canvas && canvas.parentNode === host) host.removeChild(canvas)
    }
  }, [frameIntervalMs])

  return (
    <div className="lightning-wrapper">
      <div ref={hostRef} className="lightning" />
    </div>
  )
}
