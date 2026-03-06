import { useEffect, useRef } from 'react'
import type { FightScenarioId, FightScenarioLead, LightningPoint } from '../types'

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

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

export const mixNumber = (from: number, to: number, t: number) => from + (to - from) * clamp01(t)

export const mixPoint = (from: LightningPoint, to: LightningPoint, t: number): LightningPoint => ({
  x: mixNumber(from.x, to.x, t),
  y: mixNumber(from.y, to.y, t),
})

export const smoothStep = (value: number) => {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}

export const wrap01 = (value: number) => value - Math.floor(value)

export const pulse01 = (seconds: number, frequency: number) =>
  (Math.sin(seconds * Math.PI * 2 * frequency) + 1) / 2

export const pointDistance = (left: LightningPoint, right: LightningPoint) =>
  Math.hypot(right.x - left.x, right.y - left.y)

export const clampFightPoint = (point: LightningPoint): LightningPoint => ({
  x: Math.max(0.06, Math.min(0.94, point.x)),
  y: Math.max(0.12, Math.min(0.88, point.y)),
})

export const clampFightFrame = (frame: FightScenarioFrame): FightScenarioFrame => {
  const a = clampFightPoint(frame.a)
  const b = clampFightPoint(frame.b)
  const naturalImpact = Math.max(0, (0.16 - pointDistance(a, b)) / 0.16)
  const ghostsA = frame.ghostsA?.map((point) => clampFightPoint(point))
  const ghostsB = frame.ghostsB?.map((point) => clampFightPoint(point))

  return {
    ...frame,
    a,
    b,
    impact: clamp01(Math.max(frame.impact, naturalImpact)),
    beam: clamp01(frame.beam),
    pulseA: clamp01(frame.pulseA),
    pulseB: clamp01(frame.pulseB),
    ghostsA,
    ghostsB,
  }
}

export const orientFightScenarioFrame = (
  frame: FightScenarioFrame,
  lead: FightScenarioLead,
): FightScenarioFrame => {
  if (lead === 'a') return frame
  return {
    ...frame,
    a: frame.b,
    b: frame.a,
    pulseA: frame.pulseB,
    pulseB: frame.pulseA,
    ghostsA: frame.ghostsB,
    ghostsB: frame.ghostsA,
  }
}

export const rgbaFromHex = (value: string, alpha: number) => {
  const normalized = value.trim().toLowerCase()
  const short = normalized.match(/^#([0-9a-f]{3})$/i)
  if (short) {
    const token = short[1]
    const r = Number.parseInt(`${token[0]}${token[0]}`, 16)
    const g = Number.parseInt(`${token[1]}${token[1]}`, 16)
    const b = Number.parseInt(`${token[2]}${token[2]}`, 16)
    return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha)})`
  }
  const full = normalized.match(/^#([0-9a-f]{6})$/i)
  if (full) {
    const token = full[1]
    const r = Number.parseInt(token.slice(0, 2), 16)
    const g = Number.parseInt(token.slice(2, 4), 16)
    const b = Number.parseInt(token.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha)})`
  }
  return `rgba(226, 232, 240, ${clamp01(alpha)})`
}

export const scenarioTokenHasAny = (token: string | null | undefined, parts: string[]) =>
  Boolean(token && parts.some((part) => token.includes(part)))

export const applyFightScenarioVariant = (
  frame: FightScenarioFrame,
  variantToken: string | null,
  p: number,
  seconds: number,
): FightScenarioFrame => {
  if (!variantToken) return frame

  const next: FightScenarioFrame = {
    ...frame,
    a: { ...frame.a },
    b: { ...frame.b },
    ghostsA: frame.ghostsA ? frame.ghostsA.map((point) => ({ ...point })) : undefined,
    ghostsB: frame.ghostsB ? frame.ghostsB.map((point) => ({ ...point })) : undefined,
  }

  if (scenarioTokenHasAny(variantToken, ['vortex', 'orbit', 'hover'])) {
    const angle = seconds * 4.8
    const radiusX = 0.24 + Math.sin(seconds * 0.8) * 0.05
    const radiusY = 0.2 + Math.cos(seconds * 0.9) * 0.04
    next.a.x = next.b.x + Math.cos(angle) * radiusX
    next.a.y = next.b.y + Math.sin(angle) * radiusY
    next.ghostsA = [
      { x: next.b.x + Math.cos(angle - 0.65) * radiusX, y: next.b.y + Math.sin(angle - 0.65) * radiusY },
      { x: next.b.x + Math.cos(angle - 1.25) * radiusX, y: next.b.y + Math.sin(angle - 1.25) * radiusY },
      { x: next.b.x + Math.cos(angle - 1.85) * radiusX, y: next.b.y + Math.sin(angle - 1.85) * radiusY },
    ]
    next.beam = Math.max(next.beam, 0.45 + pulse01(seconds, 4.5) * 0.35)
    next.impact = Math.max(next.impact, pulse01(seconds * 1.2, 5.4) * 0.45)
  }

  if (scenarioTokenHasAny(variantToken, ['teleport', 'flicker', 'attosecond', 'temporal', 'portal', 'astral', 'rewind'])) {
    const jitterX = (Math.random() - 0.5) * 0.07
    const jitterY = (Math.random() - 0.5) * 0.05
    next.a.x += jitterX
    next.a.y += jitterY
    next.ghostsA = [
      { x: next.a.x - 0.05, y: next.a.y - 0.03 },
      { x: next.a.x + 0.05, y: next.a.y + 0.03 },
      { x: next.a.x - 0.08, y: next.a.y + 0.02 },
      { x: next.a.x + 0.08, y: next.a.y - 0.02 },
    ]
    next.beam = Math.max(next.beam, 0.5)
    next.pulseA = Math.max(next.pulseA, 0.62 + pulse01(seconds, 10.2) * 0.25)
  }

  if (scenarioTokenHasAny(variantToken, ['beam', 'laser', 'volley', 'sniper', 'missile', 'orbital', 'siphon', 'suppression'])) {
    next.beam = Math.max(next.beam, 0.66 + pulse01(seconds, 7.3) * 0.26)
    next.impact = Math.max(next.impact, pulse01(seconds, 9.6) * 0.5)
    next.a.x = Math.min(next.a.x, 0.44)
    next.b.x = Math.max(next.b.x, 0.65)
  }

  if (scenarioTokenHasAny(variantToken, ['grapple', 'pin', 'hug', 'throw', 'launcher', 'levitation', 'lasso', 'pounce', 'grip'])) {
    const centerX = mixNumber(next.a.x, next.b.x, 0.5)
    const centerY = mixNumber(next.a.y, next.b.y, 0.5)
    next.a.x = mixNumber(next.a.x, centerX - 0.03, 0.7)
    next.a.y = mixNumber(next.a.y, centerY, 0.7)
    next.b.x = mixNumber(next.b.x, centerX + 0.03, 0.7)
    next.b.y = mixNumber(next.b.y, centerY, 0.7)
    next.impact = Math.max(next.impact, 0.7 + pulse01(seconds, 8.5) * 0.25)
    next.beam = Math.max(next.beam, 0.58)
  }

  if (scenarioTokenHasAny(variantToken, ['corner', 'trap', 'cage', 'anchor', 'singularity', 'crush', 'stun'])) {
    next.b.x = mixNumber(next.b.x, 0.9, 0.5)
    next.b.y = mixNumber(next.b.y, 0.26 + Math.sin(seconds * 1.7) * 0.08, 0.5)
    next.a.x = mixNumber(next.a.x, 0.74, 0.3)
    next.a.y = mixNumber(next.a.y, 0.45 + Math.sin(seconds * 2.1) * 0.1, 0.3)
    next.impact = Math.max(next.impact, 0.55)
  }

  if (scenarioTokenHasAny(variantToken, ['regen', 'repair', 'healing', 'defiance', 'stall', 'monologue', 'attrition'])) {
    next.pulseB = Math.max(next.pulseB, 0.6 + pulse01(seconds, 3.1) * 0.36)
    next.impact = Math.max(0.12, next.impact * 0.72)
    next.ghostsB = [
      { x: next.b.x - 0.018, y: next.b.y - 0.015 },
      { x: next.b.x + 0.018, y: next.b.y + 0.015 },
      { x: next.b.x, y: next.b.y - 0.026 },
    ]
  }

  if (scenarioTokenHasAny(variantToken, ['berserk', 'blitz', 'chaos', 'wild', 'overload', 'desperation'])) {
    next.a.x += (Math.random() - 0.5) * 0.05
    next.a.y += (Math.random() - 0.5) * 0.05
    next.b.x += (Math.random() - 0.5) * 0.03
    next.b.y += (Math.random() - 0.5) * 0.03
    next.impact = Math.max(next.impact, pulse01(seconds * 1.1, 12) * 0.95)
    next.beam = Math.max(next.beam, 0.52 + pulse01(seconds, 12) * 0.25)
  }

  if (scenarioTokenHasAny(variantToken, ['smoke', 'stealth', 'afterimage', 'decoy', 'illusion', 'ambush', 'feint'])) {
    next.ghostsA = [
      { x: next.a.x - 0.09, y: next.a.y },
      { x: next.a.x + 0.09, y: next.a.y },
      { x: next.a.x, y: next.a.y - 0.07 },
      { x: next.a.x, y: next.a.y + 0.07 },
    ]
    next.pulseA = Math.max(next.pulseA, 0.56 + pulse01(seconds, 6.2) * 0.28)
  }

  if (variantToken === 'dominancedisplay') {
    next.a.x = 0.36
    next.a.y = 0.5
    next.b.x = 0.7 + Math.sin(seconds * 7.8) * 0.02
    next.b.y = 0.5 + Math.cos(seconds * 8.3) * 0.03
    next.impact = Math.max(next.impact, pulse01(seconds, 10.5) * 0.35)
    next.beam = Math.min(next.beam, 0.2)
  }

  if (variantToken === 'mutualrespectclash') {
    next.a.x = mixNumber(next.a.x, 0.43, 0.7)
    next.b.x = mixNumber(next.b.x, 0.57, 0.7)
    next.a.y = mixNumber(next.a.y, 0.5, 0.7)
    next.b.y = mixNumber(next.b.y, 0.5, 0.7)
    next.impact = Math.max(0.14, next.impact * 0.35)
    next.beam = Math.max(0.12, next.beam * 0.4)
  }

  if (variantToken === 'villainousmonologuestall') {
    next.a.x = 0.34
    next.a.y = 0.5
    next.b.x = 0.66
    next.b.y = 0.5
    next.impact = 0
    next.beam = 0
    next.pulseA = 0.2 + pulse01(seconds, 1.6) * 0.1
    next.pulseB = 0.26 + pulse01(seconds, 1.3) * 0.16
  }

  if (scenarioTokenHasAny(variantToken, ['boomb', 'thunderclap', 'shatter', 'slam'])) {
    const quake = Math.sin(seconds * 22) * 0.012
    next.a.y += quake
    next.b.y -= quake * 0.7
    next.impact = Math.max(next.impact, pulse01(seconds, 14) * 0.82)
  }

  if (scenarioTokenHasAny(variantToken, ['mirror', 'loop'])) {
    const wrapX = wrap01((p * 1.8 + seconds * 0.08) % 1)
    next.a.x = wrapX
    next.b.x = 1 - wrapX
    next.beam = Math.max(next.beam, 0.44)
  }

  return clampFightFrame(next)
}

export const buildFightScenarioFrame = (
  scenario: FightScenarioId,
  t: number,
  seconds: number,
  variantToken: string | null,
): FightScenarioFrame => {
  const p = clamp01(t)
  const finishScenarioFrame = (frame: FightScenarioFrame) =>
    applyFightScenarioVariant(clampFightFrame(frame), variantToken, p, seconds)

  if (scenario === 'orbit-harass') {
    const center = { x: 0.74, y: 0.5 }
    const angle = seconds * 11.2
    const orbit = {
      x: center.x + Math.cos(angle) * 0.2,
      y: center.y + Math.sin(angle) * 0.16,
    }
    const strike = { x: center.x - 0.03, y: center.y + Math.sin(angle * 0.5) * 0.02 }
    const cycle = wrap01(p * 4)
    let a = orbit
    let impact = 0
    if (cycle < 0.24) {
      const k = smoothStep(cycle / 0.24)
      a = mixPoint(orbit, strike, k)
      impact = Math.max(0, (k - 0.55) / 0.45)
    } else if (cycle < 0.42) {
      const k = smoothStep((cycle - 0.24) / 0.18)
      a = mixPoint(strike, orbit, k)
    }

    return finishScenarioFrame({
      a,
      b: {
        x: center.x + Math.sin(seconds * 2.2) * 0.01,
        y: center.y + Math.cos(seconds * 2.7) * 0.012,
      },
      impact,
      beam: impact * 0.82,
      pulseA: 0.42 + pulse01(seconds, 5.5) * 0.35,
      pulseB: 0.32 + pulse01(seconds, 1.3) * 0.18,
      ghostsA: [
        orbit,
        {
          x: center.x + Math.cos(angle - 0.9) * 0.2,
          y: center.y + Math.sin(angle - 0.9) * 0.16,
        },
      ],
    })
  }

  if (scenario === 'hit-and-run') {
    const cycle = wrap01(p * 2)
    const forward = cycle < 0.42
    const k = forward ? smoothStep(cycle / 0.42) : smoothStep((cycle - 0.42) / 0.58)
    const a = forward
      ? { x: mixNumber(0.16, 0.66, k), y: mixNumber(0.63, 0.48, k) }
      : { x: mixNumber(0.66, 0.22, k), y: mixNumber(0.48, 0.36, k) }
    const b = forward
      ? { x: mixNumber(0.72, 0.83, k), y: mixNumber(0.48, 0.56, k) }
      : { x: mixNumber(0.83, 0.7, k), y: mixNumber(0.56, 0.52, k) }

    return finishScenarioFrame({
      a,
      b,
      impact: forward ? Math.max(0, 1 - Math.abs(cycle - 0.36) / 0.08) : 0,
      beam: forward ? Math.max(0, 1 - Math.abs(cycle - 0.36) / 0.1) * 0.55 : 0,
      pulseA: 0.35 + pulse01(seconds, 4.3) * 0.3,
      pulseB: 0.28 + pulse01(seconds, 1.4) * 0.16,
    })
  }

  if (scenario === 'rush-ko') {
    const rush = smoothStep(Math.min(1, p * 2.5))
    const a = {
      x: mixNumber(0.1, 0.79, rush),
      y: 0.5 + Math.sin(seconds * 8.5) * 0.008 * (1 - rush),
    }
    const recoil = p > 0.34 ? smoothStep((p - 0.34) / 0.66) : 0
    const b = {
      x: mixNumber(0.79, 0.92, recoil),
      y: mixNumber(0.5, 0.66, recoil),
    }

    return finishScenarioFrame({
      a,
      b,
      impact: Math.max(0, 1 - Math.abs(p - 0.34) / 0.07),
      beam: Math.max(0, 1 - Math.abs(p - 0.34) / 0.08),
      pulseA: 0.5 + pulse01(seconds, 6.2) * 0.36,
      pulseB: 0.2 + (1 - recoil) * 0.28,
    })
  }

  if (scenario === 'clash-lock') {
    if (p < 0.35) {
      const k = smoothStep(p / 0.35)
      return finishScenarioFrame({
        a: { x: mixNumber(0.15, 0.48, k), y: mixNumber(0.52, 0.5, k) },
        b: { x: mixNumber(0.85, 0.52, k), y: mixNumber(0.48, 0.5, k) },
        impact: 0,
        beam: 0,
        pulseA: 0.32 + k * 0.25,
        pulseB: 0.32 + k * 0.25,
      })
    }

    const centerX = 0.5 + Math.sin(seconds * 1.2) * 0.02
    return finishScenarioFrame({
      a: {
        x: centerX - 0.05 + Math.sin(seconds * 7.5) * 0.012,
        y: 0.5 + Math.sin(seconds * 4.2) * 0.04,
      },
      b: {
        x: centerX + 0.05 - Math.sin(seconds * 7) * 0.012,
        y: 0.5 - Math.sin(seconds * 4.2) * 0.04,
      },
      impact: 0.6 + pulse01(seconds, 7.8) * 0.4,
      beam: 0.75,
      pulseA: 0.44 + pulse01(seconds, 4.8) * 0.3,
      pulseB: 0.44 + pulse01(seconds, 4.8) * 0.3,
    })
  }

  if (scenario === 'kite-zone') {
    const a = {
      x: 0.24 + Math.sin(seconds * 0.7) * 0.08 + Math.sin(seconds * 2.2) * 0.09,
      y: 0.5 + Math.sin(seconds * 1.3) * 0.17,
    }
    const chaseTarget = {
      x: a.x + 0.22,
      y: a.y + Math.sin(seconds * 2) * 0.03,
    }
    const b = {
      x: mixNumber(0.64, chaseTarget.x, 0.7),
      y: mixNumber(0.52, chaseTarget.y, 0.7),
    }
    const dist = pointDistance(a, b)
    const impact = dist < 0.15 ? (0.15 - dist) / 0.15 : 0

    return finishScenarioFrame({
      a,
      b,
      impact,
      beam: impact * 0.35,
      pulseA: 0.38 + pulse01(seconds, 3.8) * 0.28,
      pulseB: 0.3 + pulse01(seconds, 2.1) * 0.18,
    })
  }

  if (scenario === 'teleport-burst') {
    const nodes: LightningPoint[] = [
      { x: 0.27, y: 0.2 },
      { x: 0.4, y: 0.74 },
      { x: 0.63, y: 0.24 },
      { x: 0.34, y: 0.6 },
      { x: 0.67, y: 0.65 },
      { x: 0.42, y: 0.28 },
    ]
    const strike = { x: 0.72, y: 0.5 }
    const position = p * nodes.length
    const step = Math.floor(position) % nodes.length
    const local = position - Math.floor(position)
    const next = (step + 1) % nodes.length

    let a = nodes[step]
    let impact = 0
    if (local < 0.24) {
      const k = smoothStep(local / 0.24)
      a = mixPoint(nodes[step], strike, k)
      impact = 1 - k * 0.2
    } else {
      const k = smoothStep((local - 0.24) / 0.76)
      a = mixPoint(strike, nodes[next], k)
    }

    return finishScenarioFrame({
      a,
      b: {
        x: strike.x + Math.sin(seconds * 3.6) * 0.012,
        y: strike.y + Math.cos(seconds * 2.4) * 0.015,
      },
      impact,
      beam: impact * 0.86,
      pulseA: 0.58 + pulse01(seconds, 9) * 0.3,
      pulseB: 0.32 + pulse01(seconds, 1.4) * 0.15,
      ghostsA: [nodes[step], nodes[(step + nodes.length - 1) % nodes.length], nodes[(step + nodes.length - 2) % nodes.length]],
    })
  }

  if (scenario === 'feint-counter') {
    let a: LightningPoint
    let b: LightningPoint
    if (p < 0.3) {
      const k = smoothStep(p / 0.3)
      a = mixPoint({ x: 0.18, y: 0.55 }, { x: 0.5, y: 0.49 }, k)
      b = { x: 0.76, y: 0.5 }
    } else if (p < 0.52) {
      const k = smoothStep((p - 0.3) / 0.22)
      a = mixPoint({ x: 0.5, y: 0.49 }, { x: 0.34, y: 0.6 }, k)
      b = mixPoint({ x: 0.76, y: 0.5 }, { x: 0.58, y: 0.46 }, k)
    } else if (p < 0.78) {
      const k = smoothStep((p - 0.52) / 0.26)
      a = mixPoint({ x: 0.34, y: 0.6 }, { x: 0.69, y: 0.45 }, k)
      b = mixPoint({ x: 0.58, y: 0.46 }, { x: 0.47, y: 0.62 }, k)
    } else {
      const k = smoothStep((p - 0.78) / 0.22)
      a = mixPoint({ x: 0.69, y: 0.45 }, { x: 0.26, y: 0.52 }, k)
      b = mixPoint({ x: 0.47, y: 0.62 }, { x: 0.76, y: 0.5 }, k)
    }

    return finishScenarioFrame({
      a,
      b,
      impact: Math.max(0, 1 - Math.abs(p - 0.68) / 0.09),
      beam: Math.max(0, 1 - Math.abs(p - 0.68) / 0.13) * 0.62,
      pulseA: 0.4 + pulse01(seconds, 4.1) * 0.26,
      pulseB: 0.3 + pulse01(seconds, 2.5) * 0.2,
    })
  }

  if (scenario === 'grapple-pin') {
    if (p < 0.32) {
      const k = smoothStep(p / 0.32)
      return finishScenarioFrame({
        a: mixPoint({ x: 0.16, y: 0.54 }, { x: 0.6, y: 0.52 }, k),
        b: mixPoint({ x: 0.8, y: 0.5 }, { x: 0.72, y: 0.52 }, k),
        impact: k * 0.45,
        beam: k * 0.22,
        pulseA: 0.34 + k * 0.18,
        pulseB: 0.3 + k * 0.14,
      })
    }
    if (p < 0.6) {
      return finishScenarioFrame({
        a: { x: 0.64 + Math.sin(seconds * 5) * 0.018, y: 0.49 + Math.sin(seconds * 6) * 0.05 },
        b: { x: 0.68 - Math.sin(seconds * 5) * 0.012, y: 0.51 - Math.sin(seconds * 6) * 0.05 },
        impact: 0.76 + pulse01(seconds, 9) * 0.24,
        beam: 0.68,
        pulseA: 0.48 + pulse01(seconds, 5.2) * 0.22,
        pulseB: 0.48 + pulse01(seconds, 5.2) * 0.22,
      })
    }

    const k = smoothStep((p - 0.6) / 0.4)
    return finishScenarioFrame({
      a: mixPoint({ x: 0.64, y: 0.49 }, { x: 0.83, y: 0.58 }, k),
      b: mixPoint({ x: 0.68, y: 0.51 }, { x: 0.9, y: 0.67 }, k),
      impact: 0.42 + (1 - k) * 0.26,
      beam: 0.38 + (1 - k) * 0.16,
      pulseA: 0.44 + pulse01(seconds, 4.2) * 0.2,
      pulseB: 0.4 + pulse01(seconds, 3.4) * 0.18,
    })
  }

  if (scenario === 'corner-trap') {
    if (p < 0.55) {
      const k = smoothStep(p / 0.55)
      return finishScenarioFrame({
        a: mixPoint({ x: 0.24, y: 0.52 }, { x: 0.74, y: 0.38 }, k),
        b: mixPoint({ x: 0.7, y: 0.5 }, { x: 0.9, y: 0.22 }, k),
        impact: k * 0.5,
        beam: k * 0.26,
        pulseA: 0.36 + k * 0.2,
        pulseB: 0.28 + (1 - k) * 0.15,
      })
    }
    const angle = seconds * 8
    return finishScenarioFrame({
      a: {
        x: 0.84 + Math.cos(angle) * 0.08,
        y: 0.28 + Math.sin(angle) * 0.06,
      },
      b: {
        x: 0.9 + Math.sin(seconds * 4.6) * 0.012,
        y: 0.22 + Math.cos(seconds * 5.2) * 0.012,
      },
      impact: Math.max(0, Math.sin(seconds * 8) * 0.5 + 0.5),
      beam: 0.46,
      pulseA: 0.46 + pulse01(seconds, 5) * 0.25,
      pulseB: 0.24 + pulse01(seconds, 2) * 0.14,
    })
  }

  if (scenario === 'regen-attrition') {
    const strikeWave = Math.abs(Math.sin(seconds * 5.2))
    const b = {
      x: 0.77 + Math.sin(seconds * 1.1) * 0.012,
      y: 0.5 + Math.sin(seconds * 2.4) * 0.03,
    }
    return finishScenarioFrame({
      a: {
        x: 0.28 + strikeWave * 0.42,
        y: 0.5 + Math.sin(seconds * 3.1) * 0.08,
      },
      b,
      impact: strikeWave > 0.75 ? (strikeWave - 0.75) / 0.25 : 0,
      beam: strikeWave > 0.75 ? (strikeWave - 0.75) / 0.25 : 0,
      pulseA: 0.36 + pulse01(seconds, 4.8) * 0.2,
      pulseB: 0.48 + pulse01(seconds, 2.4) * 0.5,
      ghostsB: [
        { x: b.x - 0.014, y: b.y - 0.02 },
        { x: b.x + 0.016, y: b.y + 0.018 },
      ],
    })
  }

  if (scenario === 'berserk-overextend') {
    let a: LightningPoint
    let b: LightningPoint
    if (p < 0.46) {
      const k = smoothStep(p / 0.46)
      a = mixPoint({ x: 0.2, y: 0.56 }, { x: 0.28, y: 0.62 }, k)
      b = mixPoint({ x: 0.84, y: 0.44 }, { x: 0.34, y: 0.5 }, k)
    } else if (p < 0.68) {
      const k = smoothStep((p - 0.46) / 0.22)
      a = mixPoint({ x: 0.28, y: 0.62 }, { x: 0.24, y: 0.38 }, k)
      b = mixPoint({ x: 0.34, y: 0.5 }, { x: 0.42, y: 0.74 }, k)
    } else {
      const k = smoothStep((p - 0.68) / 0.32)
      a = mixPoint({ x: 0.24, y: 0.38 }, { x: 0.66, y: 0.48 }, k)
      b = mixPoint({ x: 0.42, y: 0.74 }, { x: 0.84, y: 0.5 }, k)
    }

    return finishScenarioFrame({
      a,
      b,
      impact: Math.max(0, 1 - Math.abs(p - 0.76) / 0.08),
      beam: Math.max(0, 1 - Math.abs(p - 0.76) / 0.1) * 0.74,
      pulseA: 0.44 + pulse01(seconds, 4.2) * 0.28,
      pulseB: 0.3 + pulse01(seconds, 2.6) * 0.18,
    })
  }

  const a = {
    x: 0.34 + Math.sin(seconds * 1.7) * 0.22 + Math.sin(seconds * 7.8) * 0.05,
    y: 0.5 + Math.sin(seconds * 2.4) * 0.18,
  }
  const b = {
    x: 0.66 + Math.sin(seconds * 1.9 + 1.2) * 0.22 + Math.sin(seconds * 8.3 + 0.2) * 0.05,
    y: 0.5 + Math.sin(seconds * 2.6 + 0.7) * 0.18,
  }
  const dist = pointDistance(a, b)
  const impact = dist < 0.2 ? (0.2 - dist) / 0.2 : 0

  return finishScenarioFrame({
    a,
    b,
    impact,
    beam: impact * 0.55,
    pulseA: 0.38 + pulse01(seconds, 6.2) * 0.3,
    pulseB: 0.38 + pulse01(seconds, 6.8) * 0.3,
  })
}

export function FightScenarioCanvas({
  scenario,
  variantToken,
  colorA,
  colorB,
  lead = 'a',
}: {
  scenario: FightScenarioId
  variantToken?: string | null
  colorA: string
  colorB: string
  lead?: FightScenarioLead
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let frame = 0
    let startTime = 0
    let canvas: HTMLCanvasElement | null = null
    let context: CanvasRenderingContext2D | null = null
    let width = 0
    let height = 0
    const dpr = window.devicePixelRatio || 1
    const trailA: LightningPoint[] = []
    const trailB: LightningPoint[] = []

    const ensureCanvas = () => {
      if (!canvas) {
        canvas = document.createElement('canvas')
        canvas.className = 'lightning-canvas'
        host.appendChild(canvas)
      }

      width = Math.max(180, Math.floor(host.clientWidth))
      height = Math.max(92, Math.floor(host.clientHeight))
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context = canvas.getContext('2d')
      if (context) {
        context.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
    }

    const toPixels = (point: LightningPoint): LightningPoint => ({
      x: point.x * width,
      y: point.y * height,
    })

    const pushTrail = (trail: LightningPoint[], point: LightningPoint) => {
      trail.push(point)
      if (trail.length > 24) trail.shift()
    }

    const drawTrail = (
      ctx: CanvasRenderingContext2D,
      trail: LightningPoint[],
      color: string,
      widthBase: number,
    ) => {
      if (trail.length < 2) return
      for (let index = 1; index < trail.length; index += 1) {
        const ratio = index / trail.length
        const previous = trail[index - 1]
        const current = trail[index]
        ctx.beginPath()
        ctx.moveTo(previous.x, previous.y)
        ctx.lineTo(current.x, current.y)
        ctx.lineWidth = Math.max(0.8, widthBase * ratio)
        ctx.lineCap = 'round'
        ctx.strokeStyle = rgbaFromHex(color, 0.07 + ratio * 0.35)
        ctx.shadowColor = rgbaFromHex(color, 0.35)
        ctx.shadowBlur = 6 + ratio * 8
        ctx.stroke()
      }
    }

    const drawGhosts = (
      ctx: CanvasRenderingContext2D,
      ghosts: LightningPoint[] | undefined,
      color: string,
    ) => {
      if (!ghosts?.length) return
      ghosts.forEach((ghost, index) => {
        const point = toPixels(ghost)
        const alpha = 0.12 - index * 0.025
        if (alpha <= 0) return
        ctx.beginPath()
        ctx.arc(point.x, point.y, 4 + (ghosts.length - index) * 0.8, 0, Math.PI * 2)
        ctx.fillStyle = rgbaFromHex(color, alpha)
        ctx.fill()
      })
    }

    const drawFighter = (
      ctx: CanvasRenderingContext2D,
      point: LightningPoint,
      color: string,
      baseRadius: number,
      pulse: number,
    ) => {
      const radius = baseRadius + pulse * 2.4
      ctx.beginPath()
      ctx.arc(point.x, point.y, radius * 2.35, 0, Math.PI * 2)
      ctx.fillStyle = rgbaFromHex(color, 0.08 + pulse * 0.12)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = rgbaFromHex(color, 0.95)
      ctx.shadowColor = rgbaFromHex(color, 0.85)
      ctx.shadowBlur = 14 + pulse * 12
      ctx.fill()
      ctx.shadowBlur = 0
    }

    ensureCanvas()

    const render = (time: number) => {
      if (!context) {
        frame = requestAnimationFrame(render)
        return
      }
      if (startTime === 0) startTime = time
      const elapsedSeconds = (time - startTime) / 1000
      const cycle = wrap01(elapsedSeconds / 3.6)
      const scenarioFrame = orientFightScenarioFrame(
        buildFightScenarioFrame(scenario, cycle, elapsedSeconds, variantToken || null),
        lead,
      )
      const pointA = toPixels(scenarioFrame.a)
      const pointB = toPixels(scenarioFrame.b)
      pushTrail(trailA, pointA)
      pushTrail(trailB, pointB)

      const ctx = context
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = 'rgba(2, 6, 23, 0.88)'
      ctx.fillRect(0, 0, width, height)

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, height * 0.5)
      ctx.lineTo(width, height * 0.5)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)'
      ctx.beginPath()
      ctx.moveTo(width * 0.333, 0)
      ctx.lineTo(width * 0.333, height)
      ctx.moveTo(width * 0.666, 0)
      ctx.lineTo(width * 0.666, height)
      ctx.stroke()

      drawTrail(ctx, trailB, colorB, 3.6)
      drawTrail(ctx, trailA, colorA, 3.6)
      drawGhosts(ctx, scenarioFrame.ghostsA, colorA)
      drawGhosts(ctx, scenarioFrame.ghostsB, colorB)

      if (scenarioFrame.beam > 0.02) {
        ctx.beginPath()
        ctx.moveTo(pointA.x, pointA.y)
        ctx.lineTo(pointB.x, pointB.y)
        ctx.lineWidth = 1.5 + scenarioFrame.beam * 2.6
        ctx.strokeStyle = `rgba(248, 250, 252, ${0.1 + scenarioFrame.beam * 0.34})`
        ctx.shadowColor = `rgba(248, 113, 113, ${0.25 + scenarioFrame.beam * 0.35})`
        ctx.shadowBlur = 10 + scenarioFrame.beam * 14
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      if (scenarioFrame.impact > 0.03) {
        const center = {
          x: (pointA.x + pointB.x) / 2,
          y: (pointA.y + pointB.y) / 2,
        }
        const radius = 7 + scenarioFrame.impact * 17
        ctx.beginPath()
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(248, 250, 252, ${0.15 + scenarioFrame.impact * 0.48})`
        ctx.lineWidth = 1.2 + scenarioFrame.impact * 1.8
        ctx.stroke()
      }

      drawFighter(ctx, pointB, colorB, 5.2, scenarioFrame.pulseB)
      drawFighter(ctx, pointA, colorA, 5.2, scenarioFrame.pulseA)
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
  }, [colorA, colorB, lead, scenario, variantToken])

  return <div ref={hostRef} className="relative h-36 w-full overflow-hidden rounded-md border border-slate-600/70 bg-slate-950/90" />
}

export const DEFAULT_WINNER_CV_A = [
  'Doomsday',
  'Brainiac',
  "Mongul",
  'Pariah',
  "H'el",
  'Rogol Zaar',
  'Ulysses',
  'Wraith',
]

export const DEFAULT_WINNER_CV_B = [
  'Thor',
  'Hulk',
  'Blue Marvel',
  'Juggernaut',
  'Namora',
  'Winter Guard',
  'Rogue',
  'Gambit',
]
