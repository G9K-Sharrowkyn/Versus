import { useEffect, useRef } from 'react'
import type { LightningPoint } from '../types'

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
const clampLightningXRatio = (value: number) => Math.max(-0.2, Math.min(1.45, value))

type LightningOptions = {
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

const LIGHTNING_BASE_OPTIONS = {
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

const buildLightningBolt = (
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

const buildReferenceLightningBolt = (
  start: LightningPoint,
  end: LightningPoint,
  maxDifference: number,
  minSegmentLength: number,
  roughness = 2,
) => {
  let points: LightningPoint[] = [start, end]
  let segmentLength = Math.hypot(end.x - start.x, end.y - start.y)
  let difference = maxDifference

  while (segmentLength > minSegmentLength) {
    const next: LightningPoint[] = []
    for (let index = 0; index < points.length - 1; index += 1) {
      const current = points[index]
      const target = points[index + 1]
      const dx = target.x - current.x
      const dy = target.y - current.y
      const length = Math.hypot(dx, dy) || 1
      const normalX = -dy / length
      const normalY = dx / length
      const midX = (current.x + target.x) / 2
      const midY = (current.y + target.y) / 2
      const offset = (Math.random() * 2 - 1) * difference

      next.push(current, {
        x: midX + normalX * offset,
        y: midY + normalY * offset,
      })
    }

    next.push(points[points.length - 1])
    points = next
    difference /= roughness
    segmentLength /= 2
  }

  return points
}

const varyBoltPoints = (points: LightningPoint[], intensity: number) =>
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

const buildSplitStrands = (
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

const extendStrandsTowardRightEdge = (
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

const extendStrandsTowardLeftEdge = (
  strands: LightningPoint[][],
  leftStart: number,
  leftEnd: number,
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
    const targetX = leftEnd + Math.random() * Math.max(2, leftStart - leftEnd)

    if (last.x <= targetX + 2) {
      if (last.x > leftEnd) {
        const endY = Math.max(
          minY,
          Math.min(
            maxY,
            last.y * 0.32 + desiredY * 0.68 + (Math.random() * 2 - 1) * verticalJitter * 0.2,
          ),
        )
        out.push({
          x: leftEnd,
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

const buildChaosImpactSlots = (
  width: number,
  height: number,
  endBaseX: number,
  endJitterX: number,
): LightningPoint[] => {
  const xFactors = [0.03, 0.07, 0.11, 0.15, 0.19, 0.05, 0.09, 0.13, 0.17, 0.22]
  const yFactors = [0.2, 0.28, 0.36, 0.44, 0.52, 0.24, 0.32, 0.4, 0.48, 0.58]

  return xFactors.map((xFactor, slotIndex) => {
    const yBase = height * yFactors[slotIndex]
    return {
      x: endBaseX + width * xFactor + (Math.random() * 2 - 1) * endJitterX * 0.22,
      y: yBase + (Math.random() * 2 - 1) * Math.max(4, height * 0.06),
    }
  })
}

const shuffleIndexes = (size: number) => {
  const indexes = Array.from({ length: size }, (_, index) => index)
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const tmp = indexes[index]
    indexes[index] = indexes[swapIndex]
    indexes[swapIndex] = tmp
  }
  return indexes
}

const drawLightningBolt = (
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
  detailMode = 'full',
  frameIntervalMs,
  branchDirection = 'right',
  allowCompactLeftBranches = false,
  lockAnimeSource = false,
}: {
  startRatio?: LightningPoint
  endRatio?: LightningPoint
  detailMode?: 'full' | 'compact'
  frameIntervalMs?: number
  branchDirection?: 'right' | 'left'
  allowCompactLeftBranches?: boolean
  lockAnimeSource?: boolean
}) {
  const lightningRef = useRef<HTMLDivElement | null>(null)
  const compactMode = detailMode === 'compact'

  useEffect(() => {
    const host = lightningRef.current
    if (!host) return

    const auditMode = typeof document !== 'undefined' && document.documentElement.dataset.vsAudit === 'true'
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
        if (!auditMode) {
          frame = requestAnimationFrame(render)
        }
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
        lineWidth: compactMode ? 1.45 : LIGHTNING_BASE_OPTIONS.lineWidth,
        Dgth5ybnq: compactMode ? 18 : LIGHTNING_BASE_OPTIONS.Dgth5ybnq,
        Nfetiw324b: compactMode ? 0.82 : LIGHTNING_BASE_OPTIONS.Nfetiw324b,
        Hfgr49fuaq: compactMode ? 7.8 : LIGHTNING_BASE_OPTIONS.Hfgr49fuaq,
        Korifhgnv89: compactMode ? 0.5 : LIGHTNING_BASE_OPTIONS.Korifhgnv89,
        wr32nvjgtUUU: Math.max(
          12,
          Math.min(100, typeof frameIntervalMs === 'number' ? frameIntervalMs : LIGHTNING_BASE_OPTIONS.wr32nvjgtUUU),
        ),
        Cfg420ogHr: compactMode ? 7 : LIGHTNING_BASE_OPTIONS.Cfg420ogHr,
        numBolts: compactMode ? 1 : LIGHTNING_BASE_OPTIONS.numBolts,
        euygwebfBBbbf: compactMode ? 2 : LIGHTNING_BASE_OPTIONS.euygwebfBBbbf,
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

        const animeReferenceMode =
          compactMode && branchDirection === 'left' && !allowCompactLeftBranches
        if (animeReferenceMode) {
          const sourcePoint = options.points[1]
          const targetPoint = options.points[0]
          const sourceJitterX = lockAnimeSource ? 0 : Math.max(2.8, width * 0.024)
          const sourceJitterY = lockAnimeSource ? 0 : Math.max(4.8, height * 0.2)
          const targetJitterX = Math.max(1.2, width * 0.01)
          const targetJitterY = Math.max(2.6, height * 0.12)
          const start = {
            x: sourcePoint.x + (Math.random() * 2 - 1) * sourceJitterX,
            y: sourcePoint.y + (Math.random() * 2 - 1) * sourceJitterY,
          }
          const end = {
            x: targetPoint.x + (Math.random() * 2 - 1) * targetJitterX,
            y: targetPoint.y + (Math.random() * 2 - 1) * targetJitterY,
          }
          const segmentLength = Math.max(16, Math.hypot(end.x - start.x, end.y - start.y))
          const points = buildReferenceLightningBolt(
            start,
            end,
            Math.max(8, segmentLength / 5),
            Math.max(3.8, segmentLength / 28),
            2,
          )
          const glow = Math.max(9, options.Hfgr49fuaq * 1.04)
          const lineWidth = Math.max(
            1.45,
            options.lineWidth * 1.2 + (Math.random() * 0.18 - 0.05),
          )

          drawLightningBolt(ctx, points, lineWidth, 'hsla(188, 100%, 76%, 0.92)', glow)
          drawLightningBolt(
            ctx,
            points,
            Math.max(0.76, lineWidth * 0.42),
            'hsla(190, 100%, 94%, 0.9)',
            0,
          )
        }

        const chaosMode = compactMode && branchDirection === 'left'
        if (!animeReferenceMode) {
        const roughness = Math.max(1.7, 1.38 + options.Nfetiw324b * 0.72)
        const minSegmentLength = Math.max(
          2.1,
          Math.min(width, height) * Math.max(0.015, options.Nfetiw324bKkekf * 0.5),
        )
        const endJitterX = options.Cfg420ogHr * 0.24 * (chaosMode ? 2.1 : 1)
        const endJitterY = options.Cfg420ogHr * 0.08 * (chaosMode ? 3.2 : 1)
        const startJitterX = Math.max(0.2, options.euygwebfBBbbf * 0.12) * (chaosMode ? 1.5 : 1)
        const startJitterY = options.euygwebfBBbbf * 0.18 * (chaosMode ? 2.2 : 1)
        const boltCount = chaosMode ? 2 : Math.max(1, options.numBolts)
        const secondaryOffsetY = -Math.max(0.65, options.Cfg420ogHr * 0.04)
        const chaosImpactSlots = chaosMode
          ? buildChaosImpactSlots(width, height, options.points[1].x, endJitterX)
          : []
        const chaosImpactOrder = chaosMode ? shuffleIndexes(chaosImpactSlots.length) : []

        for (let index = 0; index < boltCount; index += 1) {
          const isPrimaryBolt = index === 0
          const laneOffsetY = isPrimaryBolt
            ? 0
            : chaosMode
              ? (index - (boltCount - 1) / 2) * Math.max(3.2, options.Cfg420ogHr * 0.26)
              : secondaryOffsetY + (index - 1) * Math.max(0.45, options.Cfg420ogHr * 0.02)
          const chaosEndYOffset = chaosMode
            ? (Math.random() * 2 - 1) * Math.max(5, height * 0.08)
            : 0
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
          const chaosSlot =
            chaosMode && chaosImpactSlots.length > 0
              ? chaosImpactSlots[
                  chaosImpactOrder[
                    (index + Math.floor(Math.random() * Math.min(4, chaosImpactOrder.length))) %
                      chaosImpactOrder.length
                  ]
                ]
              : null
          const end = chaosSlot
            ? {
                x: chaosSlot.x + (Math.random() * 2 - 1) * Math.max(2, endJitterX * 0.42),
                y: chaosSlot.y + (Math.random() * 2 - 1) * Math.max(3, height * 0.045),
              }
            : {
                x: options.points[1].x + (Math.random() * 2 - 1) * (endJitterX + index * (chaosMode ? 4.2 : 2.2)),
                y: isPrimaryBolt
                  ? options.points[1].y +
                    chaosEndYOffset +
                    (Math.random() * 2 - 1) * Math.max(0.12, endJitterY * (chaosMode ? 0.58 : 0.2))
                  : options.points[1].y +
                    chaosEndYOffset +
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
          const darkPasses = chaosMode ? 0 : compactMode ? 1 : 2 + (Math.random() < 0.65 ? 1 : 0)
          const splitBase = Math.max(5.5, Math.min(width, height) * 0.024)
          const totalSpanX = Math.max(1, Math.abs(end.x - start.x))
          const visibleForwardEdgeX = Math.min(width - 2, Math.max(start.x + 2, end.x))
          const visibleSpanX = Math.max(1, Math.abs(visibleForwardEdgeX - start.x))
          // Keep split points at ~1/3 and ~2/3 of the *visible* segment, even if beam extends beyond frame.
          const splitRatioOneThirdRaw = clamp01((visibleSpanX / 3) / totalSpanX)
          const splitRatioTwoThirdsRaw = clamp01(((visibleSpanX * 2) / 3) / totalSpanX)
          const splitRatioOneThird =
            branchDirection === 'left' ? clamp01(1 - splitRatioTwoThirdsRaw) : splitRatioOneThirdRaw
          const splitRatioTwoThirds =
            branchDirection === 'left' ? clamp01(1 - splitRatioOneThirdRaw) : splitRatioTwoThirdsRaw
          const rightReachStart = Math.max(width * 0.995, options.points[1].x + 12)
          const rightReachEnd = Math.max(width * 1.08, rightReachStart + 12)
          const leftReachStart = Math.min(width * 0.005, options.points[1].x - 12)
          const leftReachEnd = Math.min(width * -0.08, leftReachStart - 12)
          const branchMinY = Math.max(4, height * 0.14)
          const branchMaxY = Math.min(height - 4, height * 0.86)
          const spreadBoost = 0.82
          const oneThirdSpread = Math.max(splitBase * 1.45, height * 0.032) * spreadBoost
          const twoThirdSpread = Math.max(splitBase * 2.35, height * 0.052) * spreadBoost
          const suppressAuxStrands =
            compactMode && branchDirection === 'left' && !allowCompactLeftBranches
          const splitOneThirdStrands = suppressAuxStrands ? 0 : compactMode ? 2 : 3
          const splitTwoThirdsStrands = suppressAuxStrands ? 0 : compactMode ? 6 : 12
          const splitOneThirdBase = suppressAuxStrands
            ? []
            : buildSplitStrands(
                points,
                splitRatioOneThird,
                splitOneThirdStrands,
                oneThirdSpread,
                splitBase * 0.52 * spreadBoost,
              )
          const splitTwoThirdsBase = suppressAuxStrands
            ? []
            : buildSplitStrands(
                points,
                splitRatioTwoThirds,
                splitTwoThirdsStrands,
                twoThirdSpread,
                splitBase * 0.86 * spreadBoost,
              )
          const splitOneThird =
            branchDirection === 'left'
              ? extendStrandsTowardLeftEdge(
                  splitOneThirdBase,
                  leftReachStart,
                  leftReachEnd,
                  splitBase * 1.1 * spreadBoost,
                  height * 0.09 * spreadBoost,
                  options.points[1].y,
                  branchMinY,
                  branchMaxY,
                )
              : extendStrandsTowardRightEdge(
                  splitOneThirdBase,
                  rightReachStart,
                  rightReachEnd,
                  splitBase * 1.1 * spreadBoost,
                  height * 0.09 * spreadBoost,
                  options.points[1].y,
                  branchMinY,
                  branchMaxY,
                )
          const splitTwoThirds =
            branchDirection === 'left'
              ? extendStrandsTowardLeftEdge(
                  splitTwoThirdsBase,
                  leftReachStart,
                  leftReachEnd,
                  splitBase * 1.44 * spreadBoost,
                  height * 0.14 * spreadBoost,
                  options.points[1].y,
                  branchMinY,
                  branchMaxY,
                )
              : extendStrandsTowardRightEdge(
                  splitTwoThirdsBase,
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
              darkIndex % 2 === 0 ? 'rgba(0, 48, 72, 0.62)' : 'rgba(12, 68, 96, 0.52)',
              glow * (0.24 + darkIndex * 0.06),
            )
          }

          splitOneThird.forEach((strand, strandIndex) => {
            const bright = strandIndex === 1 || strandIndex === 3
            drawLightningBolt(
              ctx,
              strand,
              Math.max(0.72, lineWidth * (0.52 + (strandIndex % 3 === 0 ? 0.08 : 0))),
              bright ? 'rgba(152, 238, 250, 0.88)' : strandIndex % 2 === 0 ? 'rgba(64, 196, 220, 0.84)' : 'rgba(48, 172, 200, 0.8)',
              glow * (bright ? 0.36 : 0.28),
            )
            if (bright) {
              drawLightningBolt(
                ctx,
                strand,
                Math.max(0.36, lineWidth * 0.24),
                'rgba(220, 252, 255, 0.62)',
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
              bright ? 'rgba(80, 210, 230, 0.74)' : strandIndex % 2 === 0 ? 'rgba(40, 168, 196, 0.68)' : 'rgba(28, 140, 168, 0.62)',
              glow * (bright ? 0.30 : 0.22),
            )
            if (bright) {
              drawLightningBolt(
                ctx,
                strand,
                Math.max(0.32, lineWidth * 0.22),
                'rgba(190, 248, 255, 0.48)',
                0,
              )
            }
          })

          ctx.restore()

          drawLightningBolt(ctx, points, lineWidth * 1.08, 'rgba(119, 226, 242, 0.92)', glow * 0.52)
          if (Math.random() < 0.55) {
            drawLightningBolt(
              ctx,
              points,
              Math.max(0.65, lineWidth * 0.38),
              'rgba(230, 252, 255, 0.80)',
              0,
            )
          }
        }
        }
      }

      if (!auditMode) {
        frame = requestAnimationFrame(render)
      }
    }

    if (auditMode) {
      render(0)
    } else {
      frame = requestAnimationFrame(render)
    }
    const resizeObserver = new ResizeObserver(() => ensureCanvas())
    resizeObserver.observe(host)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      if (canvas && canvas.parentNode === host) {
        host.removeChild(canvas)
      }
    }
  }, [
    allowCompactLeftBranches,
    branchDirection,
    compactMode,
    endRatio.x,
    endRatio.y,
    frameIntervalMs,
    lockAnimeSource,
    startRatio.x,
    startRatio.y,
  ])

  return (
    <div className="lightning-wrapper">
      <div ref={lightningRef} className="lightning" />
    </div>
  )
}
