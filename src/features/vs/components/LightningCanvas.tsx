import { useEffect, useRef } from 'react'
import type { LightningPoint } from '../types'

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
export const clampLightningXRatio = (value: number) => Math.max(-0.2, Math.min(1.45, value))

export type LightningOptions = {
  points: LightningPoint[]
  Hh835tKjwqe: 'fade' | 'none'
  fadeDelay: number
  Betwjg67687: boolean
  lineWidth: number
  Dgth5ybnq: number
  Nfetiw324b: number
  Nfetiw324bKkekf: number
  Hfgr49fuaq: number
  Korifhgnv89: number
  wr32nvjgtUUU: number
  Cfg420ogHr: number
  numBolts: number
  euygwebfBBbbf: number
  width: number
  height: number
  canvasStyle: Partial<CSSStyleDeclaration>
}

export const LIGHTNING_BASE_OPTIONS = {
  Hh835tKjwqe: 'none',
  fadeDelay: 900,
  Betwjg67687: false,
  lineWidth: 1.9,
  Dgth5ybnq: 26,
  Nfetiw324b: 0.9,
  Nfetiw324bKkekf: 0.05,
  Hfgr49fuaq: 10,
  Korifhgnv89: 0.42,
  wr32nvjgtUUU: 42,
  Cfg420ogHr: 10,
  numBolts: 2,
  euygwebfBBbbf: 3,
} as const

export const buildLightningBolt = (
  start: LightningPoint,
  end: LightningPoint,
  maxDifference: number,
  roughness: number,
  minSegmentLength: number,
) => {
  let points: LightningPoint[] = [start, end]
  let segmentLength = Math.hypot(end.x - start.x, end.y - start.y)
  let difference = maxDifference

  while (segmentLength > minSegmentLength) {
    const next: LightningPoint[] = [points[0]]
    for (let index = 0; index < points.length - 1; index += 1) {
      const current = points[index]
      const target = points[index + 1]
      const dx = target.x - current.x
      const dy = target.y - current.y
      const length = Math.hypot(dx, dy) || 1
      const perpendicularX = -dy / length
      const perpendicularY = dx / length
      const midX = (current.x + target.x) / 2
      const midY = (current.y + target.y) / 2
      const offset = (Math.random() * 2 - 1) * difference

      next.push({
        x: midX + perpendicularX * offset,
        y: midY + perpendicularY * offset,
      })
      next.push(target)
    }
    points = next
    difference /= roughness
    segmentLength /= 2
  }

  // Add a very light jagged pass: around +10% roughness over baseline.
  return points.map((point, index) => {
    if (index === 0 || index === points.length - 1) return point
    const prev = points[index - 1]
    const next = points[index + 1]
    const dx = next.x - prev.x
    const dy = next.y - prev.y
    const length = Math.hypot(dx, dy) || 1
    const nx = -dy / length
    const ny = dx / length
    const micro = (Math.random() * 2 - 1) * maxDifference * 0.035
    const burst =
      Math.random() < 0.06
        ? (Math.random() < 0.5 ? -1 : 1) * maxDifference * (0.06 + Math.random() * 0.12)
        : 0

    return {
      x: point.x + nx * (micro + burst),
      y: point.y + ny * (micro + burst),
    }
  })
}

export const varyBoltPoints = (points: LightningPoint[], intensity: number) =>
  points.map((point, index) => {
    if (index === 0 || index === points.length - 1) return point
    const prev = points[index - 1]
    const next = points[index + 1]
    const dx = next.x - prev.x
    const dy = next.y - prev.y
    const length = Math.hypot(dx, dy) || 1
    const tangentX = dx / length
    const tangentY = dy / length
    const normalX = -tangentY
    const normalY = tangentX
    const normalOffset = (Math.random() * 2 - 1) * intensity
    const alongOffset = (Math.random() * 2 - 1) * intensity * 0.36

    return {
      x: point.x + normalX * normalOffset + tangentX * alongOffset,
      y: point.y + normalY * normalOffset + tangentY * alongOffset,
    }
  })

export const buildSplitStrands = (
  points: LightningPoint[],
  splitRatio: number,
  strandCount: number,
  spread: number,
  jitter: number,
) => {
  if (points.length < 6 || strandCount < 2) return []
  const pivotIndex = Math.max(
    1,
    Math.min(points.length - 3, Math.floor((points.length - 1) * clamp01(splitRatio))),
  )
  const tail = points.slice(pivotIndex)
  if (tail.length < 3) return []
  const pivotPoint = points[pivotIndex]

  const before = points[pivotIndex - 1]
  const after = points[pivotIndex + 1]
  const dx = after.x - before.x
  const dy = after.y - before.y
  const length = Math.hypot(dx, dy) || 1
  const tangentX = dx / length
  const tangentY = dy / length
  const normalX = -tangentY
  const normalY = tangentX
  const center = (strandCount - 1) / 2

  return Array.from({ length: strandCount }, (_, strandIndex) => {
    const lane = strandIndex - center
    const strand = tail.map((point, index) => {
      // Force exact attachment to the main stream at split origin.
      if (index === 0) {
        return {
          x: pivotPoint.x,
          y: pivotPoint.y,
        }
      }
      const tRaw = tail.length === 1 ? 1 : index / (tail.length - 1)
      const t = Math.max(0, Math.min(1, tRaw))
      const divergenceRamp = t * (0.92 + t * 1.38)
      const divergence = lane * spread * divergenceRamp
      const lateralNoise = (Math.random() * 2 - 1) * jitter * (t * (0.28 + t * 0.94))
      const alongNoise = (Math.random() * 2 - 1) * jitter * (0.06 + t * 0.2)

      return {
        x: point.x + normalX * (divergence + lateralNoise) + tangentX * alongNoise,
        y: point.y + normalY * (divergence + lateralNoise) + tangentY * alongNoise,
      }
    })

    return strand
  })
}

export const extendStrandsTowardRightEdge = (
  strands: LightningPoint[][],
  rightStart: number,
  rightEnd: number,
  verticalJitter: number,
  fanSpread: number,
  centerY: number,
  minY: number,
  maxY: number,
) =>
  strands.map((strand, strandIndex) => {
    if (strand.length < 2) return strand
    const out = [...strand]
    const last = out[out.length - 1]
    const center = (strands.length - 1) / 2
    const lane = strandIndex - center
    const desiredYRaw = centerY + lane * fanSpread + (Math.random() * 2 - 1) * verticalJitter
    const desiredY = Math.max(minY, Math.min(maxY, desiredYRaw))
    const targetX = rightStart + Math.random() * Math.max(2, rightEnd - rightStart)

    if (last.x >= targetX - 2) {
      if (last.x < rightEnd) {
        const endY = Math.max(
          minY,
          Math.min(
            maxY,
            last.y * 0.32 + desiredY * 0.68 + (Math.random() * 2 - 1) * verticalJitter * 0.2,
          ),
        )
        out.push({
          x: rightEnd,
          y: endY,
        })
      }
      return out
    }

    const midX = (last.x + targetX) / 2
    const midY = Math.max(
      minY,
      Math.min(
        maxY,
        last.y +
          (desiredY - last.y) * (0.52 + Math.random() * 0.2) +
          (Math.random() * 2 - 1) * verticalJitter * 0.24,
      ),
    )
    out.push({
      x: midX,
      y: midY,
    })
    out.push({
      x: targetX,
      y: Math.max(
        minY,
        Math.min(maxY, desiredY + (Math.random() * 2 - 1) * verticalJitter * 0.35),
      ),
    })
    return out
  })

export const drawLightningBolt = (
  context: CanvasRenderingContext2D,
  points: LightningPoint[],
  lineWidth: number,
  color: string,
  glow: number,
) => {
  if (points.length < 2) return
  context.beginPath()
  context.moveTo(points[0].x, points[0].y)
  for (let index = 1; index < points.length; index += 1) {
    context.lineTo(points[index].x, points[index].y)
  }
  context.lineWidth = lineWidth
  context.strokeStyle = color
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.shadowColor = color
  context.shadowBlur = glow
  context.stroke()
}

export function LightningCanvas({
  startRatio = { x: 0.5, y: 0.5 },
  endRatio = { x: 0.92, y: 0.5 },
}: {
  startRatio?: LightningPoint
  endRatio?: LightningPoint
}) {
  const lightningRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = lightningRef.current
    if (!host) return

    let frame = 0
    let previous = 0
    let context: CanvasRenderingContext2D | null = null
    let canvas: HTMLCanvasElement | null = null
    const dpr = window.devicePixelRatio || 1

    const ensureCanvas = () => {
      if (!canvas) {
        canvas = document.createElement('canvas')
        canvas.className = 'lightning-canvas'
        host.appendChild(canvas)
      }

      const width = Math.max(220, Math.floor(host.clientWidth))
      const height = Math.max(120, Math.floor(host.clientHeight))
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context = canvas.getContext('2d')
      if (context) {
        context.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
    }

    ensureCanvas()

    const render = (time: number) => {
      if (!context) {
        frame = requestAnimationFrame(render)
        return
      }

      const width = Math.max(1, Math.floor(host.clientWidth))
      const height = Math.max(1, Math.floor(host.clientHeight))
      const options: LightningOptions = {
        points: [
          {
            x: width * clamp01(startRatio.x),
            y: height * clamp01(startRatio.y),
          },
          {
            x: width * clampLightningXRatio(endRatio.x),
            y: height * clamp01(endRatio.y),
          },
        ],
        ...LIGHTNING_BASE_OPTIONS,
        width,
        height,
        canvasStyle: {
          zIndex: '0',
        },
      }
      if (canvas) {
        Object.assign(canvas.style, options.canvasStyle)
      }

      if (time - previous >= Math.max(16, options.wr32nvjgtUUU)) {
        previous = time
        const ctx = context
        const fadeMode = options.Hh835tKjwqe === 'fade' && options.Betwjg67687
        const fadeAmount = Math.min(0.22, Math.max(0.04, options.wr32nvjgtUUU / options.fadeDelay))

        ctx.save()
        ctx.globalCompositeOperation = 'source-over'
        if (fadeMode) {
          ctx.fillStyle = `rgba(0, 0, 0, ${fadeAmount.toFixed(3)})`
          ctx.fillRect(0, 0, width, height)
        } else {
          ctx.clearRect(0, 0, width, height)
        }
        ctx.restore()

        ctx.globalCompositeOperation = 'lighter'
        ctx.globalAlpha = Math.max(0.5, Math.min(1, options.Korifhgnv89 + 0.4))

        const roughness = Math.max(1.7, 1.38 + options.Nfetiw324b * 0.72)
        const minSegmentLength = Math.max(
          2.1,
          Math.min(width, height) * Math.max(0.015, options.Nfetiw324bKkekf * 0.5),
        )
        const endJitterX = options.Cfg420ogHr * 0.24
        const endJitterY = options.Cfg420ogHr * 0.08
        const startJitterX = Math.max(0.2, options.euygwebfBBbbf * 0.12)
        const startJitterY = options.euygwebfBBbbf * 0.18
        const boltCount = Math.max(1, options.numBolts)
        const secondaryOffsetY = -Math.max(0.65, options.Cfg420ogHr * 0.04)

        for (let index = 0; index < boltCount; index += 1) {
          const isPrimaryBolt = index === 0
          const laneOffsetY = isPrimaryBolt
            ? 0
            : secondaryOffsetY + (index - 1) * Math.max(0.45, options.Cfg420ogHr * 0.02)
          const start = {
            x: isPrimaryBolt
              ? options.points[0].x
              : options.points[0].x + (Math.random() * 2 - 1) * (startJitterX + index * 0.28),
            y: isPrimaryBolt
              ? options.points[0].y
              : options.points[0].y +
                laneOffsetY +
                (Math.random() * 2 - 1) * (startJitterY + index * 0.18),
          }
          const end = {
            x: options.points[1].x + (Math.random() * 2 - 1) * (endJitterX + index * 2.2),
            y: isPrimaryBolt
              ? options.points[1].y + (Math.random() * 2 - 1) * Math.max(0.12, endJitterY * 0.2)
              : options.points[1].y +
                laneOffsetY +
                (Math.random() * 2 - 1) * (endJitterY + index * 0.32),
          }
          const points = buildLightningBolt(
            start,
            end,
            Math.max(4, options.Dgth5ybnq),
            roughness,
            minSegmentLength,
          )

          const lineWidth = Math.max(1.15, options.lineWidth + (Math.random() * 0.5 - 0.18))
          const glow = Math.max(5, options.Hfgr49fuaq * 0.65)
          const darkPasses = 2 + (Math.random() < 0.65 ? 1 : 0)
          const splitBase = Math.max(5.5, Math.min(width, height) * 0.024)
          const totalSpanX = Math.max(1, end.x - start.x)
          const visibleRightEdgeX = Math.min(width - 2, Math.max(start.x + 2, end.x))
          const visibleSpanX = Math.max(1, visibleRightEdgeX - start.x)
          // Keep split points at ~1/3 and ~2/3 of the *visible* segment, even if beam extends beyond frame.
          const splitRatioOneThird = clamp01((visibleSpanX / 3) / totalSpanX)
          const splitRatioTwoThirds = clamp01(((visibleSpanX * 2) / 3) / totalSpanX)
          const rightReachStart = Math.max(width * 0.995, options.points[1].x + 12)
          const rightReachEnd = Math.max(width * 1.08, rightReachStart + 12)
          const branchMinY = Math.max(4, height * 0.04)
          const branchMaxY = Math.min(height - 4, height * 0.96)
          const spreadBoost = 1.6
          const oneThirdSpread = Math.max(splitBase * 1.45, height * 0.032) * spreadBoost
          const twoThirdSpread = Math.max(splitBase * 2.35, height * 0.052) * spreadBoost
          const splitOneThird = extendStrandsTowardRightEdge(
            buildSplitStrands(points, splitRatioOneThird, 3, oneThirdSpread, splitBase * 0.52 * spreadBoost),
            rightReachStart,
            rightReachEnd,
            splitBase * 1.1 * spreadBoost,
            height * 0.09 * spreadBoost,
            options.points[1].y,
            branchMinY,
            branchMaxY,
          )
          const splitTwoThirds = extendStrandsTowardRightEdge(
            buildSplitStrands(points, splitRatioTwoThirds, 12, twoThirdSpread, splitBase * 0.86 * spreadBoost),
            rightReachStart,
            rightReachEnd,
            splitBase * 1.44 * spreadBoost,
            height * 0.14 * spreadBoost,
            options.points[1].y,
            branchMinY,
            branchMaxY,
          )

          ctx.save()
          ctx.globalCompositeOperation = 'source-over'
          for (let darkIndex = 0; darkIndex < darkPasses; darkIndex += 1) {
            const varied = varyBoltPoints(points, 0.6 + darkIndex * 0.38 + Math.random() * 0.35)
            drawLightningBolt(
              ctx,
              varied,
              lineWidth * (1.2 + darkIndex * 0.22),
              darkIndex % 2 === 0 ? 'rgba(118, 12, 12, 0.58)' : 'rgba(145, 20, 20, 0.48)',
              glow * (0.24 + darkIndex * 0.06),
            )
          }

          splitOneThird.forEach((strand, strandIndex) => {
            const bright = strandIndex === 1 || strandIndex === 3
            drawLightningBolt(
              ctx,
              strand,
              Math.max(0.72, lineWidth * (0.52 + (strandIndex % 3 === 0 ? 0.08 : 0))),
              bright ? 'rgba(220, 52, 52, 0.86)' : strandIndex % 2 === 0 ? 'rgba(136, 18, 18, 0.84)' : 'rgba(112, 14, 14, 0.8)',
              glow * (bright ? 0.34 : 0.26),
            )
            if (bright) {
              drawLightningBolt(
                ctx,
                strand,
                Math.max(0.36, lineWidth * 0.24),
                'rgba(255, 210, 210, 0.55)',
                0,
              )
            }
          })

          splitTwoThirds.forEach((strand, strandIndex) => {
            const bright = strandIndex === 1 || strandIndex === 4 || strandIndex === 7
            drawLightningBolt(
              ctx,
              strand,
              Math.max(0.62, lineWidth * (0.4 + (strandIndex % 4 === 0 ? 0.05 : 0))),
              bright ? 'rgba(205, 46, 46, 0.84)' : strandIndex % 2 === 0 ? 'rgba(128, 16, 16, 0.82)' : 'rgba(96, 12, 12, 0.78)',
              glow * (bright ? 0.32 : 0.24),
            )
            if (bright) {
              drawLightningBolt(
                ctx,
                strand,
                Math.max(0.32, lineWidth * 0.22),
                'rgba(255, 205, 205, 0.5)',
                0,
              )
            }
          })

          ctx.restore()

          drawLightningBolt(ctx, points, lineWidth * 1.08, 'rgba(228, 62, 62, 0.82)', glow * 0.42)
          if (Math.random() < 0.55) {
            drawLightningBolt(
              ctx,
              points,
              Math.max(0.65, lineWidth * 0.4),
              'rgba(255, 235, 235, 0.72)',
              0,
            )
          }
        }
      }

      frame = requestAnimationFrame(render)
    }

    frame = requestAnimationFrame(render)
    const resizeObserver = new ResizeObserver(() => ensureCanvas())
    resizeObserver.observe(host)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      if (canvas && canvas.parentNode === host) {
        host.removeChild(canvas)
      }
    }
  }, [startRatio.x, startRatio.y, endRatio.x, endRatio.y])

  return (
    <div className="lightning-wrapper">
      <div ref={lightningRef} className="lightning" />
    </div>
  )
}

export type FightScenarioFrame = {
  a: LightningPoint
  b: LightningPoint
  impact: number
  beam: number
  pulseA: number
  pulseB: number
  ghostsA?: LightningPoint[]
  ghostsB?: LightningPoint[]
}
