import { useEffect, useRef, useState } from 'react'

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
      if (Math.random() > 0.3) return char
      const lookalike = LOOKALIKES[char]
      if (lookalike && Math.random() > 0.35) return lookalike
      if (char === ' ') return char
      return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
    })
    .join('')
}

type Props = {
  text: string
}

export function GlitchText({ text }: Props) {
  const [displayed, setDisplayed] = useState(text)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    setDisplayed(text)
    if (typeof document !== 'undefined' && document.documentElement.dataset.vsAudit === 'true') {
      return
    }

    let cancelled = false

    const runBurst = () => {
      if (cancelled) return
      const maxFrames = Math.floor(Math.random() * 4) + 2
      let frame = 0
      const id = window.setInterval(() => {
        if (cancelled) { window.clearInterval(id); return }
        setDisplayed(glitchifyText(text))
        frame++
        if (frame >= maxFrames) {
          window.clearInterval(id)
          setDisplayed(text)
          timerRef.current = window.setTimeout(runBurst, Math.random() * 800 + 400) // Slightly less frequent than meta values to not be overwhelming
        }
      }, 55)
    }

    timerRef.current = window.setTimeout(runBurst, Math.random() * 1000 + 200)

    return () => {
      cancelled = true
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [text])

  return <>{displayed}</>
}
