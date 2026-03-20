import { useEffect, useRef } from 'react'

const BOLT_COLOR = '#00c8ff'
const ROUGHNESS = 2
const MIN_SEG = 5
const BOLTS_PER_FRAME = 2
const UPDATE_MS = 33 // ~30 fps

type Pt = { x: number; y: number }

interface Strand {
  pts: Pt[]
  lineWidth: number
  alpha: number
  shadowBlur: number
}

function makePts(sx: number, sy: number, ex: number, ey: number, maxDiff: number): Pt[] {
  let pts: Pt[] = [{ x: sx, y: sy }, { x: ex, y: ey }]
  let segW = Math.max(1, ex - sx)
  let diff = maxDiff

  while (segW > MIN_SEG) {
    const next: Pt[] = [pts[0]]
    for (let i = 0; i < pts.length - 1; i++) {
      const s = pts[i]
      const e = pts[i + 1]
      next.push(
        { x: (s.x + e.x) / 2, y: (s.y + e.y) / 2 + (Math.random() * 2 - 1) * diff },
        e,
      )
    }
    pts = next
    diff /= ROUGHNESS
    segW /= 2
  }

  return pts
}

function makeBranchingBolt(w: number, h: number): Strand[] {
  const strands: Strand[] = []
  const base = h / 3

  // ── Main bolt ───────────────────────────────────────────────
  const mainEndX = w * 1.2 + Math.random() * w * 0.3
  const mainEndY = Math.random() * h
  const mainPts = makePts(0, h / 2, mainEndX, mainEndY, base)
  strands.push({ pts: mainPts, lineWidth: 1.5, alpha: 1.0, shadowBlur: 14 })

  if (mainPts.length < 6) return strands

  // ── First split: 30–55 % along the main bolt ────────────────
  const s1idx = Math.floor(mainPts.length * (0.3 + Math.random() * 0.25))
  const s1 = mainPts[Math.max(1, Math.min(s1idx, mainPts.length - 3))]
  const b1count = 2 + Math.floor(Math.random() * 2) // 2 – 3

  for (let i = 0; i < b1count; i++) {
    const b1ex = w * 1.15 + Math.random() * w * 0.4
    const b1ey = Math.random() * h
    const b1pts = makePts(s1.x, s1.y, b1ex, b1ey, base * 0.65)
    strands.push({ pts: b1pts, lineWidth: 0.9, alpha: 0.78, shadowBlur: 10 })

    if (b1pts.length < 6) continue

    // ── Second split: 35–60 % along each first-level branch ───
    const s2idx = Math.floor(b1pts.length * (0.35 + Math.random() * 0.25))
    const s2 = b1pts[Math.max(1, Math.min(s2idx, b1pts.length - 3))]
    const b2count = 2 + Math.floor(Math.random() * 3) // 2 – 4

    for (let j = 0; j < b2count; j++) {
      const b2ex = w * 1.1 + Math.random() * w * 0.5
      const b2ey = Math.random() * h
      const b2pts = makePts(s2.x, s2.y, b2ex, b2ey, base * 0.36)
      strands.push({ pts: b2pts, lineWidth: 0.55, alpha: 0.52, shadowBlur: 6 })
    }
  }

  return strands
}

export function AnimeLightning() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = ref.current
    if (!host) return

    const dpr = window.devicePixelRatio || 1
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block;'
    host.appendChild(canvas)

    let frame = 0
    let ctx: CanvasRenderingContext2D | null = null
    let prevTime = 0

    const resize = () => {
      const w = Math.max(1, host.clientWidth)
      const h = Math.max(1, host.clientHeight)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx = canvas.getContext('2d')
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const render = (time: number) => {
      if (time - prevTime >= UPDATE_MS) {
        prevTime = time
        const c = ctx
        if (c) {
          const w = host.clientWidth
          const h = host.clientHeight

          c.clearRect(0, 0, w, h)
          c.strokeStyle = BOLT_COLOR
          c.shadowColor = BOLT_COLOR
          c.lineCap = 'round'
          c.lineJoin = 'round'

          for (let b = 0; b < BOLTS_PER_FRAME; b++) {
            for (const s of makeBranchingBolt(w, h)) {
              c.globalAlpha = s.alpha
              c.lineWidth = s.lineWidth
              c.shadowBlur = s.shadowBlur
              c.beginPath()
              for (const p of s.pts) c.lineTo(p.x, p.y)
              c.stroke()
            }
          }

          c.globalAlpha = 1
        }
      }

      frame = requestAnimationFrame(render)
    }

    frame = requestAnimationFrame(render)

    const ro = new ResizeObserver(resize)
    ro.observe(host)

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      canvas.remove()
    }
  }, [])

  return <div ref={ref} style={{ position: 'absolute', inset: 0 }} />
}
