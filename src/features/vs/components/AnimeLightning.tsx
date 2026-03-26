import { useEffect, useRef } from 'react'

type Pt = { x: number; y: number; t: number }

type Branch = {
  points: Pt[]
  depth: number
}

type Explosion = {
  x: number
  y: number
  at: number
  lifeMs: number
}

const COLOR_CORE = '#dffcff'
const COLOR_PRIMARY = '#8be9ff'
const COLOR_SECONDARY = '#ff5fe0'

const MAX_DEPTH = 4
const MAX_BRANCHES = 36
const MAX_POINTS_PER_BRANCH = 68
const BASE_SPEED_PX_PER_MS = 0.26
const RESTART_DELAY_MS = 220

const rand = (min: number, max: number) => min + Math.random() * (max - min)

function pointAtTime(points: Pt[], t: number): Pt | null {
  if (!points.length) return null
  if (t <= points[0].t) return points[0]
  if (t >= points[points.length - 1].t) return points[points.length - 1]
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]
    const next = points[i]
    if (t <= next.t) {
      const span = Math.max(1e-6, next.t - prev.t)
      const k = (t - prev.t) / span
      return {
        x: prev.x + (next.x - prev.x) * k,
        y: prev.y + (next.y - prev.y) * k,
        t,
      }
    }
  }
  return points[points.length - 1]
}

function visiblePath(points: Pt[], t: number): Pt[] {
  if (!points.length || t < points[0].t) return []
  const out: Pt[] = []
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i]
    if (p.t <= t) {
      out.push(p)
      continue
    }
    const prev = points[i - 1]
    if (prev) {
      const head = pointAtTime([prev, p], t)
      if (head) out.push(head)
    }
    break
  }
  return out
}

export function AnimeLightning() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const dpr = window.devicePixelRatio || 1
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block;'
    host.appendChild(canvas)

    let ctx: CanvasRenderingContext2D | null = null
    let rafId = 0
    let cycleStart = performance.now()

    let w = 0
    let h = 0
    let branches: Branch[] = []
    let explosions: Explosion[] = []
    let cycleDurationMs = 2400

    const resize = () => {
      w = Math.max(1, host.clientWidth)
      h = Math.max(1, host.clientHeight)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const generated = generateLightning(w, h)
      branches = generated.branches
      explosions = generated.explosions
      cycleDurationMs = generated.duration
      cycleStart = performance.now()
    }

    type Task = {
      origin: { x: number; y: number }
      angle: number
      depth: number
      startT: number
      speed: number
    }

    const generateLightning = (
      width: number,
      height: number,
    ): { branches: Branch[]; explosions: Explosion[]; duration: number } => {
      const outBranches: Branch[] = []
      const outExplosions: Explosion[] = []
      const queue: Task[] = [{
        origin: { x: -2, y: height * 0.5 },
        angle: rand(-0.09, 0.09),
        depth: 0,
        startT: 0,
        speed: BASE_SPEED_PX_PER_MS * rand(0.92, 1.08),
      }]

      let maxTime = 0

      while (queue.length > 0 && outBranches.length < MAX_BRANCHES) {
        const task = queue.shift()!
        let x = task.origin.x
        let y = task.origin.y
        let a = task.angle
        let t = task.startT
        let distFromLastSplit = 0
        let splitThreshold = rand(92, 188)

        const pts: Pt[] = [{ x, y, t }]
        for (let i = 0; i < MAX_POINTS_PER_BRANCH; i += 1) {
          const step = rand(8, 14)
          a += rand(-0.11, 0.11) * (1 + task.depth * 0.18)
          a = Math.max(-1.2, Math.min(1.2, a))

          const dx = Math.max(2.2, Math.cos(a) * step)
          const dy = Math.sin(a) * step * 0.9
          x += dx
          y += dy
          t += step / task.speed
          pts.push({ x, y, t })
          maxTime = Math.max(maxTime, t)
          distFromLastSplit += step

          if (x > width + 58 || y < -40 || y > height + 40) break

          const canSplit = task.depth < MAX_DEPTH && queue.length + outBranches.length < MAX_BRANCHES
          if (canSplit && distFromLastSplit >= splitThreshold && Math.random() < 0.7) {
            const explosionAt = t + rand(20, 56)
            outExplosions.push({ x, y, at: explosionAt, lifeMs: rand(170, 290) })

            const childCount = Math.random() < 0.65 ? 3 : 4
            const spread = rand(0.22, 0.52)
            for (let c = 0; c < childCount; c += 1) {
              if (queue.length + outBranches.length >= MAX_BRANCHES) break
              const m = c / (childCount - 1)
              const signed = (m - 0.5) * 2
              queue.push({
                origin: { x, y },
                angle: a + signed * spread + rand(-0.06, 0.06),
                depth: task.depth + 1,
                startT: explosionAt + rand(22, 110),
                speed: task.speed * rand(0.78, 0.9),
              })
            }
            distFromLastSplit = 0
            splitThreshold = rand(104, 196)
          }
        }

        if (pts.length > 1) {
          outBranches.push({ points: pts, depth: task.depth })
        }
      }
      return {
        branches: outBranches,
        explosions: outExplosions,
        duration: Math.max(1600, maxTime + 220),
      }
    }

    const drawBranch = (c: CanvasRenderingContext2D, branch: Branch, t: number) => {
      const pts = visiblePath(branch.points, t)
      if (pts.length < 2) return

      const strength = 1 - branch.depth * 0.16
      const width = Math.max(0.45, 1.6 - branch.depth * 0.24)

      // Main branch, single lightweight pass.
      c.globalAlpha = 0.78 * strength
      c.strokeStyle = COLOR_PRIMARY
      c.lineWidth = width
      c.beginPath()
      pts.forEach((pt, idx) => {
        if (idx === 0) c.moveTo(pt.x, pt.y)
        else c.lineTo(pt.x, pt.y)
      })
      c.stroke()

      // Tiny core pass.
      c.globalAlpha = 0.9 * strength
      c.strokeStyle = COLOR_CORE
      c.lineWidth = Math.max(0.35, width * 0.42)
      c.beginPath()
      pts.forEach((pt, idx) => {
        if (idx === 0) c.moveTo(pt.x, pt.y)
        else c.lineTo(pt.x, pt.y)
      })
      c.stroke()
    }

    const drawExplosions = (c: CanvasRenderingContext2D, t: number) => {
      for (const exp of explosions) {
        const dt = t - exp.at
        if (dt < 0 || dt > exp.lifeMs) continue
        const k = dt / exp.lifeMs
        const eased = 1 - k
        const r = 3 + k * 12
        const alpha = Math.max(0, eased * 0.75)

        // Lightweight "digital pop" burst.
        c.globalAlpha = alpha * 0.8
        c.strokeStyle = COLOR_SECONDARY
        c.lineWidth = 1
        c.beginPath()
        c.moveTo(exp.x - r, exp.y)
        c.lineTo(exp.x + r, exp.y)
        c.moveTo(exp.x, exp.y - r)
        c.lineTo(exp.x, exp.y + r)
        c.moveTo(exp.x - r * 0.78, exp.y - r * 0.78)
        c.lineTo(exp.x + r * 0.78, exp.y + r * 0.78)
        c.moveTo(exp.x - r * 0.78, exp.y + r * 0.78)
        c.lineTo(exp.x + r * 0.78, exp.y - r * 0.78)
        c.stroke()

        c.globalAlpha = alpha * 0.85
        c.fillStyle = COLOR_CORE
        c.fillRect(exp.x - 1.5, exp.y - 1.5, 3, 3)
      }
    }

    const render = (ts: number) => {
      const c = ctx
      if (!c) {
        rafId = requestAnimationFrame(render)
        return
      }

      const elapsed = ts - cycleStart
      if (elapsed > cycleDurationMs + RESTART_DELAY_MS) {
        const generated = generateLightning(w, h)
        branches = generated.branches
        explosions = generated.explosions
        cycleDurationMs = generated.duration
        cycleStart = ts
      }
      const revealTime = Math.min(elapsed, cycleDurationMs)

      c.clearRect(0, 0, w, h)

      c.lineCap = 'round'
      c.lineJoin = 'round'
      c.shadowBlur = 0
      c.shadowColor = 'transparent'
      branches.forEach((branch) => drawBranch(c, branch, revealTime))
      drawExplosions(c, revealTime)

      c.globalAlpha = 1
      rafId = requestAnimationFrame(render)
    }

    resize()
    rafId = requestAnimationFrame(render)

    const observer = new ResizeObserver(resize)
    observer.observe(host)

    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
      canvas.remove()
    }
  }, [])

  return <div ref={hostRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} />
}
