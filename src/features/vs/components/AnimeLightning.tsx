import { useEffect, useRef } from 'react'

const BOLT_COLOR_PRIMARY = '#00ffff'
const BOLT_COLOR_SECONDARY = '#ff00ff'
const BOLT_COLOR_WHITE = '#ffffff'
const UPDATE_MS = 45 
const PARTICLE_COUNT = 30

type Pt = { x: number; y: number }

interface Strand {
  pts: Pt[]
  lineWidth: number
  alpha: number
  shadowBlur: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
  color: string
}

interface Node {
  x: number
  y: number
  phase: number // For sparkling effect
}

function makePts(sx: number, sy: number, ex: number, ey: number, maxDiff: number, jitter: number): Pt[] {
  let pts: Pt[] = [{ x: sx, y: sy }, { x: ex, y: ey }]
  let segW = Math.max(1, Math.abs(ex - sx))
  let diff = maxDiff

  while (segW > 6) {
    const next: Pt[] = [pts[0]]
    for (let i = 0; i < pts.length - 1; i++) {
      const s = pts[i]
      const e = pts[i + 1]
      const isDigital = Math.random() > 0.93
      const midX = (s.x + e.x) / 2
      const midY = (s.y + e.y) / 2
      
      if (isDigital) {
        next.push({ x: midX, y: s.y }, { x: midX, y: e.y }, e)
      } else {
        next.push(
          { x: midX, y: midY + (Math.random() * 2 - 1) * diff },
          e,
        )
      }
    }
    pts = next
    diff /= jitter
    segW /= 2
  }

  return pts
}

function makeBranchingBolt(w: number, h: number, segments: Node[][]): Strand[] {
  const strands: Strand[] = []
  if (segments.length < 3) return strands
  
  const base = h / 2.5

  // ── Level 0: Main Path through Nodes ───────────────────────
  const path: Pt[] = [{ x: 0, y: h / 2 }]
  for (let i = 0; i < segments.length; i++) {
    const nodes = segments[i]
    path.push(nodes[Math.floor(Math.random() * nodes.length)])
  }

  let fullMainPts: Pt[] = []
  for (let i = 0; i < path.length - 1; i++) {
    const s = path[i], e = path[i+1]
    const segmentPts = makePts(s.x, s.y, e.x, e.y, base * (1 - i*0.2), 1.8)
    fullMainPts = fullMainPts.concat(segmentPts)
    strands.push({ pts: segmentPts, lineWidth: 2.2, alpha: 1.0, shadowBlur: 15 })
  }

  if (fullMainPts.length < 10) return strands

  // ── Level 1 & 2: Divergence ────────────────────────────────
  const branchCount = 8 + Math.floor(Math.random() * 6)
  for (let b = 0; b < branchCount; b++) {
    const startIdx = Math.floor(Math.random() * fullMainPts.length)
    const startPt = fullMainPts[startIdx]
    
    const currentSegmentIdx = Math.floor((startPt.x / Math.max(1, w)) * 3)
    const nextSegmentIdx = Math.min(currentSegmentIdx + 1, segments.length - 1)
    
    const possibleNodes = segments[nextSegmentIdx]
    const targetNode = possibleNodes[Math.floor(Math.random() * possibleNodes.length)]
    
    const bPts = makePts(startPt.x, startPt.y, targetNode.x, targetNode.y, base * 0.5, 2.0)
    strands.push({ pts: bPts, lineWidth: 1.0, alpha: 0.6, shadowBlur: 8 })
    
    // Level 3: Tiny fractal flickers from branches
    if (bPts.length > 6 && Math.random() > 0.5) {
      const sPt = bPts[Math.floor(bPts.length * 0.5)]
      const endX = sPt.x + (Math.random() * 40 + 20)
      const endY = sPt.y + (Math.random() - 0.5) * 60
      strands.push({ pts: makePts(sPt.x, sPt.y, endX, endY, 10, 2.5), lineWidth: 0.5, alpha: 0.3, shadowBlur: 4 })
    }
  }

  return strands
}

export function AnimeLightning() {
  const ref = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const nodesRef = useRef<Node[][]>([])

  useEffect(() => {
    const host = ref.current
    if (!host) return

    const dpr = window.devicePixelRatio || 1
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block;'
    host.appendChild(canvas)

    let ctx: CanvasRenderingContext2D | null = null
    let prevTime = 0
    let rafId = 0

    const initNodes = (w: number, h: number) => {
      const line1 = [] 
      for (let i = 0; i < 3; i++) line1.push({ x: w * 0.33, y: h * (0.2 + 0.6 * Math.random()), phase: Math.random() * 10 })
      const line2 = [] 
      for (let i = 0; i < 6; i++) line2.push({ x: w * 0.66, y: h * (0.1 + 0.8 * Math.random()), phase: Math.random() * 10 })
      const line3 = [] 
      for (let i = 0; i < 12; i++) line3.push({ x: w * 0.98, y: h * Math.random(), phase: Math.random() * 10 })
      nodesRef.current = [line1, line2, line3]
    }

    const resize = () => {
      const w = Math.max(1, host.clientWidth)
      const h = Math.max(1, host.clientHeight)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx = canvas.getContext('2d')
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
      initNodes(w, h)
    }
    resize()

    const drawStrands = (c: CanvasRenderingContext2D, strands: Strand[], ox: number, oy: number, color: string, alphaMult = 1) => {
      c.strokeStyle = color
      c.shadowColor = color
      for (const s of strands) {
        c.globalAlpha = s.alpha * alphaMult
        c.lineWidth = s.lineWidth
        c.shadowBlur = s.shadowBlur
        c.beginPath()
        let first = true
        for (const p of s.pts) {
          if (first) { c.moveTo(p.x + ox, p.y + oy); first = false }
          else { c.lineTo(p.x + ox, p.y + oy) }
        }
        c.stroke()
      }
    }

    const render = (time: number) => {
      const c = ctx
      if (c) {
        const w = host.clientWidth
        const h = host.clientHeight

        particlesRef.current = particlesRef.current.filter(p => {
          p.x += p.vx; p.y += p.vy; p.life -= 0.02; return p.life > 0
        })

        if (time - prevTime >= UPDATE_MS) {
          prevTime = time
          c.clearRect(0, 0, w, h)
          
          if (nodesRef.current.length > 0) {
            const bolt = makeBranchingBolt(w, h, nodesRef.current)
            c.lineCap = 'butt'
            c.lineJoin = 'miter'
            drawStrands(c, bolt, -1.2, 0, BOLT_COLOR_SECONDARY, 0.4)
            drawStrands(c, bolt, 1.2, 0, BOLT_COLOR_PRIMARY, 0.4)
            drawStrands(c, bolt, 0, 0, BOLT_COLOR_WHITE, 0.8)

            if (particlesRef.current.length < PARTICLE_COUNT) {
              const randomStrand = bolt[Math.floor(Math.random() * bolt.length)]
              if (randomStrand && randomStrand.pts.length > 2) {
                const pt = randomStrand.pts[Math.floor(Math.random() * randomStrand.pts.length)]
                particlesRef.current.push({
                  x: pt.x, y: pt.y,
                  vx: (Math.random() - 0.1) * 6 + 1, vy: (Math.random() - 0.5) * 4,
                  life: 1.0, size: Math.random() * 2 + 1,
                  color: Math.random() > 0.5 ? BOLT_COLOR_PRIMARY : BOLT_COLOR_SECONDARY
                })
              }
            }
          }
        }

        for (const line of nodesRef.current) {
          for (const n of line) {
            const sparkle = Math.abs(Math.sin(time * 0.01 + n.phase))
            const outerR = 5 + sparkle * 4
            const gap = 3
            const alpha = 0.3 + sparkle * 0.7
            c.globalAlpha = alpha
            c.strokeStyle = BOLT_COLOR_PRIMARY
            c.shadowBlur = 12
            c.shadowColor = BOLT_COLOR_PRIMARY
            c.lineWidth = 1.2
            // Outer ring
            c.beginPath()
            c.arc(n.x, n.y, outerR, 0, Math.PI * 2)
            c.stroke()
            // Crosshair lines (4 directions, with gap)
            c.beginPath()
            c.moveTo(n.x - outerR - 3, n.y); c.lineTo(n.x - gap, n.y)
            c.moveTo(n.x + gap, n.y);        c.lineTo(n.x + outerR + 3, n.y)
            c.moveTo(n.x, n.y - outerR - 3); c.lineTo(n.x, n.y - gap)
            c.moveTo(n.x, n.y + gap);        c.lineTo(n.x, n.y + outerR + 3)
            c.stroke()
            // Inner bright dot
            c.globalAlpha = alpha
            c.fillStyle = BOLT_COLOR_WHITE
            c.shadowBlur = 6
            c.shadowColor = BOLT_COLOR_WHITE
            c.beginPath()
            c.arc(n.x, n.y, 1.5, 0, Math.PI * 2)
            c.fill()
          }
        }

        c.shadowBlur = 0
        for (const p of particlesRef.current) {
          c.globalAlpha = p.life; c.fillStyle = p.color; c.beginPath()
          c.rect(p.x, p.y, p.size, p.size); c.fill()
        }
        c.globalAlpha = 1
      }
      rafId = requestAnimationFrame(render)
    }

    rafId = requestAnimationFrame(render)
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      canvas.remove()
    }
  }, [])

  return <div ref={ref} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} />
}
