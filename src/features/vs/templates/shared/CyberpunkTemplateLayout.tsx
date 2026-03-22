import { useState, useEffect, type ReactNode } from 'react'
import { AnimeLightning } from '../../components/AnimeLightning'
import { CyberpunkMetaValue } from '../../components/CyberpunkMetaValue'
import './CyberpunkTemplate.scss'

const GLITCH_CHARS = '!@#$%^&░▓▒▌▐╠╣╦╬┼╫Ω'.split('')

function SubtleCyberpunkLabel({ text }: { text: string }) {
  const [display, setDisplay] = useState(text)
  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement.dataset.vsAudit === 'true') return
    const timer = setInterval(() => {
      if (Math.random() > 0.92) {
        const chars = text.split('')
        const i = Math.floor(Math.random() * chars.length)
        if (chars[i] === ' ') return
        chars[i] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
        setDisplay(chars.join(''))
        setTimeout(() => setDisplay(text), 60 + Math.random() * 80)
      }
    }, 2500)
    return () => clearInterval(timer)
  }, [text])
  return <>{display}</>
}

type CyberpunkTemplateLayoutProps = {
  headerText: string
  subText?: string
  threatLevelLabel: string
  threatLevelValue: string
  dataIntegrityLabel: string
  dataIntegrityValue: string
  brandMarkTitle: string
  brandMarkAria: string
  brandImageSrc: string
  brandAlt: string
  onToggleLanguage: () => void
  integratedToolbar?: ReactNode
  children: ReactNode
}

export function CyberpunkTemplateLayout({
  headerText,
  subText,
  threatLevelLabel,
  threatLevelValue,
  dataIntegrityLabel,
  dataIntegrityValue,
  brandMarkTitle,
  brandMarkAria,
  brandImageSrc,
  brandAlt,
  onToggleLanguage,
  integratedToolbar,
  children,
}: CyberpunkTemplateLayoutProps) {
  const chars = headerText.split('')
  const [activeGlitches, setActiveGlitches] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (chars.length === 0) return

    const MAX_CONCURRENT = 3
    const active = new Set<number>()
    const timeouts = new Map<number, NodeJS.Timeout>()
    let isMounted = true

    const startGlitch = () => {
      if (!isMounted) return
      if (active.size >= MAX_CONCURRENT) return

      const available = []
      for (let i = 0; i < chars.length; i++) {
        if (!active.has(i) && chars[i] !== ' ') available.push(i)
      }
      if (available.length === 0) return

      const nextIndex = available[Math.floor(Math.random() * available.length)]
      active.add(nextIndex)
      setActiveGlitches(new Set(active))

      const duration = 2000 + Math.random() * 3000

      const timeoutId = setTimeout(() => {
        if (!isMounted) return
        active.delete(nextIndex)
        setActiveGlitches(new Set(active))
        timeouts.delete(nextIndex)
        
        setTimeout(() => startGlitch(), Math.random() * 500)
      }, duration)

      timeouts.set(nextIndex, timeoutId)
    }

    for (let i = 0; i < Math.min(MAX_CONCURRENT, chars.length); i++) {
      setTimeout(() => startGlitch(), i * 800)
    }

    return () => {
      isMounted = false
      timeouts.forEach(clearTimeout)
    }
  }, [headerText])

  return (
    <div className="vs-cyber-surface">
      {integratedToolbar ? <div className="vs-tactical-board25-toolbar">{integratedToolbar}</div> : null}

      <div className="vs-cyber-meta">
        <p>
          <SubtleCyberpunkLabel text={threatLevelLabel} />: <span style={{ color: '#77e2f2', textShadow: '0 var(--tb-reflect-3-y) var(--tb-reflect-4-blur) rgba(119, 226, 242, 0.2)' }}><CyberpunkMetaValue value={threatLevelValue} /></span>
        </p>
        <p>
          <SubtleCyberpunkLabel text={dataIntegrityLabel} />: <span style={{ color: '#77e2f2', textShadow: '0 var(--tb-reflect-3-y) var(--tb-reflect-4-blur) rgba(119, 226, 242, 0.2)' }}><CyberpunkMetaValue value={dataIntegrityValue} /></span>
        </p>
      </div>

      <div className="vs-cyber-heading">
        <div className="vs-cyber-signal-main">
          <div style={{ position: 'relative' }}>
            <div className="vs-cyber-glitch-container">
              {chars.map((char, i) => (
                char === ' ' ? <span key={i}>&nbsp;</span> : (
                  <div key={i} className={`vs-cyber-glitch-letter ${activeGlitches.has(i) ? 'is-glitching' : ''}`} data-text={char}>
                    {char}
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
        {subText ? <p className="vs-cyber-subtitle">{subText}</p> : null}
      </div>

      <button
        type="button"
        className="vs-cyber-logo"
        title={brandMarkTitle}
        aria-label={brandMarkAria}
        onClick={onToggleLanguage}
        style={{ '--logo-url': `url(${brandImageSrc})` } as any}
      >
        <img src={brandImageSrc} alt={brandAlt} draggable={false} />
        <img
          className="vs-cyber-logo-reflection"
          src={brandImageSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      </button>

      {children}

      <div className="vs-cyber-reality-viewport">
        <AnimeLightning />
      </div>
    </div>
  )
}
