/**
 * CyberpunkMetaValue – renders a metadata value with continuous cyberpunk glitch.
 * - Text values (e.g. "ekstremalny"): random character substitution, letter flicker
 * - Numeric values (e.g. "99.6%"): number oscillation + occasional corruption
 * Disabled automatically in audit (screenshot) mode.
 */
import { useEffect, useRef, useState } from 'react'

// ── Glitch character lookup ──────────────────────────────────────────────────

const GLITCH_CHARS = '!@#$%^&░▓▒▌▐╠╣╦╬┼╫Ω'.split('')

const LOOKALIKES: Record<string, string> = {
  e: '3', E: '3',
  a: '4', A: '4',
  i: '1', I: '!',
  o: '0', O: '0',
  l: '1', L: '|',
  s: '$', S: '$',
  t: '7', T: '7',
  r: 'Я', R: 'Я',
  n: 'η', N: 'Π',
  m: 'Ш', M: 'Ш',
  y: 'γ', Y: 'γ',
  k: 'Ж', K: 'Ж',
  x: '×', X: '×',
  z: '2', Z: '2',
  g: '9', G: '6',
}

function glitchifyText(text: string): string {
  return text
    .split('')
    .map((char) => {
      if (Math.random() > 0.3) return char // 70% keep original
      const lookalike = LOOKALIKES[char]
      if (lookalike && Math.random() > 0.35) return lookalike
      if (char === ' ') return char
      return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
    })
    .join('')
}

function glitchifyNumber(text: string): string {
  return text.replace(/\d+\.?\d*/g, (match) => {
    const base = parseFloat(match)
    const hasDecimal = match.includes('.')
    // 20% chance of "corruption" – big jump
    if (Math.random() < 0.2) {
      const corrupt = Math.max(0, base + (Math.random() - 0.5) * 30)
      return corrupt.toFixed(hasDecimal ? 1 : 0)
    }
    // Normal oscillation ±1.5
    const delta = (Math.random() - 0.5) * 3
    return Math.max(0, base + delta).toFixed(hasDecimal ? 1 : 0)
  })
}

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

// ── Component ────────────────────────────────────────────────────────────────

type Props = {
  value: string
}

export function CyberpunkMetaValue({ value }: Props) {
  const isNumeric = /^\d+(\.\d+)?%$/.test(value.trim())
  const [displayed, setDisplayed] = useState(value)
  const [hot, setHot] = useState(false)
  const timerRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    setDisplayed(value)
    setHot(false)
  }, [value])

  useEffect(() => {
    // Disabled in audit / screenshot mode
    if (typeof document !== 'undefined' && document.documentElement.dataset.vsAudit === 'true') {
      return
    }

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    let cancelled = false

    if (isNumeric) {
      let center = randomRange(90, 99.99)
      let spread = randomRange(0.05, 1.6)
      let phaseEndsAt = Date.now() + randomRange(8000, 36000)

      const tick = () => {
        if (cancelled) return
        const now = Date.now()

        if (now >= phaseEndsAt) {
          center = randomRange(90, 99.99)
          spread = randomRange(0.05, 1.6)
          phaseEndsAt = now + randomRange(8000, 36000)
        }

        const burstChance = Math.random()
        const burstFactor = burstChance < 0.12 ? randomRange(2.1, 5.2) : 1
        const drift = (Math.random() * 2 - 1) * spread * burstFactor
        const nextValue = clamp(center + drift, 90, 99.99)

        setDisplayed(formatPercent(nextValue))
        setHot(burstFactor > 1 || Math.abs(drift) > spread * 1.5)

        timerRef.current = window.setTimeout(tick, randomRange(70, 260))
      }

      setDisplayed(formatPercent(center))
      timerRef.current = window.setTimeout(tick, randomRange(70, 260))

      return () => {
        cancelled = true
        if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      }
    }

    const runBurst = () => {
      if (cancelled) return
      setHot(true)
      // 2–5 rapid glitch frames at ~55ms each
      const maxFrames = Math.floor(Math.random() * 4) + 2
      let frame = 0
      const id = window.setInterval(() => {
        if (cancelled) { window.clearInterval(id); return }
        setDisplayed(isNumeric ? glitchifyNumber(value) : glitchifyText(value))
        frame++
        if (frame >= maxFrames) {
          window.clearInterval(id)
          setDisplayed(value)
          setHot(false)
          // Rest 120–520ms then burst again
          timerRef.current = window.setTimeout(runBurst, Math.random() * 400 + 120)
        }
      }, 55)
      intervalRef.current = id
    }

    // Initial random delay so multiple meta lines don't sync
    timerRef.current = window.setTimeout(runBurst, Math.random() * 600 + 100)

    return () => {
      cancelled = true
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    }
  }, [value, isNumeric])

  return (
    <span
      className="vs-cyberpunk-meta-value"
      style={{
        position: 'relative',
        display: 'inline-block',
        color: 'inherit',
        fontFamily: "'Chakra Petch', 'JetBrains Mono', monospace",
        fontSize: '1.25em',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        transition: 'all 0.1s ease-out',
      }}
    >
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          textShadow: hot ? '0 0 8px currentColor, 0 0 18px currentColor' : '0 0 6px currentColor',
        }}
      >
        {displayed}
      </span>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: 'translateY(var(--tb-reflect-3-y, 1.9em))',
          filter: 'blur(var(--tb-reflect-3-blur, 0.2em))',
          opacity: hot ? 0.36 : 0.3,
          pointerEvents: 'none',
          color: 'currentColor',
          whiteSpace: 'pre',
        }}
      >
        {displayed}
      </span>
    </span>
  )
}
