import './CharacterProfileTemplate.scss'
import { useState, useEffect, type ReactNode } from 'react'
import { GlitchText } from '../../../components/GlitchText'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { CyberpunkMetaValue } from '../../../components/CyberpunkMetaValue'

type CharacterProfileTemplateProps = TemplatePreviewProps & {
  integratedToolbar?: ReactNode
}

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

const TOOLKIT_SECTION_ORDER = ['powers', 'tools', 'weaknesses'] as const

const PROFILE_ITEM_COUNT = 2
const SECTION_TOP_BY_KEY: Record<(typeof TOOLKIT_SECTION_ORDER)[number], string> = {
  powers: '0px',
  tools: '235px',
  weaknesses: '540px',
}

export function CharacterProfileTemplate({
  fighterA,
  fighterB,
  profileA,
  profileB,
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
  integratedToolbar,
}: CharacterProfileTemplateProps) {
  // New Layout base props
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)

  // Template logic
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['character-profile'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const toolkitDefaults = {
    powers: getFightTemplateDefaultField('character-profile', 'powers_label', language),
    tools: getFightTemplateDefaultField('character-profile', 'tools_label', language),
    weaknesses: getFightTemplateDefaultField('character-profile', 'weaknesses_label', language),
  }

  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle || ''

  const sectionRows = TOOLKIT_SECTION_ORDER.map((sectionKey) => {
    const label = toolkitDefaults[sectionKey]
    const leftItems = profileA[sectionKey].filter((item) => item.trim())
    const rightItems = profileB[sectionKey].filter((item) => item.trim())
    return {
      key: sectionKey,
      label,
      leftItems: leftItems.slice(0, PROFILE_ITEM_COUNT),
      rightItems: rightItems.slice(0, PROFILE_ITEM_COUNT),
    }
  }).filter((section) => section.leftItems.length > 0 || section.rightItems.length > 0)

  const BLUE_EKSTREMALNY = '#77e2f2'
  const RED_LINIA = '#ff554e'
  const REFLEKS_IMIENIA_POSTACI = "0 1em 0.28em rgba(119, 226, 242, 0.45)"
  const REFLEKS_TRESCI_FAKTOW = "0 var(--tb-reflect-2-y) 0.55em rgba(119, 226, 242, 0.45)"
  const REFLEKS_ETYKIET_FAKTOW = "0 0 8px rgba(255, 85, 78, 0.9), 0 0 16px rgba(255, 85, 78, 0.4)"

  const renderFactColumn = (side: 'left' | 'right') => {
    const entries = sectionRows
      .map((section) => ({
        key: section.key,
        label: section.label,
        items: side === 'left' ? section.leftItems : section.rightItems,
      }))
      .filter((section) => section.items.length > 0)

    return (
      <div style={{ position: 'relative', height: '380px', flexShrink: 0 }}>
        {entries.map((section) => (
          <div
            key={`${side}-${section.key}`}
            style={{ position: 'absolute', top: SECTION_TOP_BY_KEY[section.key], left: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}
          >
            <div style={{ width: 'max-content', position: 'relative', paddingBottom: '6px' }}>
              <p className="vs-dossier-text-3" style={{ color: RED_LINIA, textShadow: REFLEKS_ETYKIET_FAKTOW, fontWeight: 'bold', letterSpacing: '0.05em' }}><GlitchText text={section.label} /></p>
              <div style={{ width: '100%', height: '2px', background: RED_LINIA, position: 'absolute', bottom: 0, left: 0, boxShadow: `0 0 10px ${RED_LINIA}66` }} />
              <div style={{ width: '100%', height: '2px', background: RED_LINIA, position: 'absolute', bottom: '-45px', left: 0, filter: 'blur(2px)', opacity: 0.8 }} />
            </div>
            {section.items.map((item, itemIndex) => (
              <p key={`${side}-${section.key}-${itemIndex}`} className="vs-dossier-text-2" style={{ textShadow: REFLEKS_TRESCI_FAKTOW }}>{item}</p>
            ))}
          </div>
        ))}
      </div>
    )
  }

  // Glitch effect for title
  const headerTextStr = typeof headerText === 'string' ? headerText : "TACTICAL BOARD"
  const chars = headerTextStr.split('')
  const [activeGlitches, setActiveGlitches] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (chars.length === 0) return

    const MAX_CONCURRENT = 3
    const active = new Set<number>()
    const timeouts = new Map<number, ReturnType<typeof setTimeout>>()
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
  }, [headerTextStr])

  return (
    <div className="vs-tactical-board25-surface">
      <div className="vs-tactical-board25-line" />
      {integratedToolbar ? <div className="vs-tactical-board25-toolbar">{integratedToolbar}</div> : null}

      <div className="vs-tactical-board25-meta">
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.threatLevelLabel} />: <span style={{ color: '#77e2f2', textShadow: '0 0 12px rgba(119, 226, 242, 0.75), 0 0 22px rgba(119, 226, 242, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.threatLevelValue} /></span>
        </p>
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.dataIntegrityLabel} />: <span style={{ color: '#77e2f2', textShadow: '0 0 12px rgba(119, 226, 242, 0.75), 0 0 22px rgba(119, 226, 242, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.dataIntegrityValue} /></span>
        </p>
      </div>

      <div className="vs-tactical-board25-heading">
        <div className="vs-tb-signal-main" style={{ transform: 'none', minWidth: 'auto', maxWidth: 'none', minHeight: 'auto', padding: '0.1em 0.5em', margin: 0, width: '75%' }}>
          <div style={{ position: 'relative' }}>
            <div className="glitch-letter-container">
              {chars.map((char, i) => (
                char === ' ' ? <span key={i}>&nbsp;</span> : (
                  <div key={i} className={`glitch-letter ${activeGlitches.has(i) ? 'is-glitching' : ''}`} data-text={char}>
                    {char}
                  </div>
                )
              ))}
            </div>
            <div className="glow" style={{ fontSize: '3.5vw', width: '100%', textAlign: 'center', pointerEvents: 'none', textShadow: 'none' }}>{headerText}</div>
          </div>
        </div>
        <p className="vs-tactical-board25-subtitle" style={{ color: '#77e2f2' }}>{subText}</p>
      </div>

      <button
        type="button"
        className="vs-tactical-board25-logo"
        title={tacticalChrome.brandMarkTitle}
        aria-label={tacticalChrome.brandMarkAria}
        onClick={onToggleLanguage}
        style={{ '--logo-url': `url(${tacticalChrome.brandImageSrc})` } as any}
      >
        <img src={tacticalChrome.brandImageSrc} alt={tacticalChrome.brandAlt} draggable={false} />
        <img
          className="vs-tactical-board25-logo-reflection"
          src={tacticalChrome.brandImageSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      </button>

      <section className="vs-tactical-board25-stats" style={{ position: 'absolute', top: 'var(--tb-panel-top)', left: 'var(--tb-stats-left)', width: 'var(--tb-stats-width)', minHeight: 'var(--tb-panel-height)', display: 'flex', flexDirection: 'column', height: 'var(--tb-panel-height)' }}>
        <p className="vs-tactical-board25-stats-title vs-panel-top-label"><GlitchText text="Postać Niebieska" /></p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', padding: '0.5rem 1rem 0.5rem 1.5rem' }}>
          <div style={{ borderLeft: `4px solid ${BLUE_EKSTREMALNY}`, paddingLeft: '1.5rem', minHeight: '4.5rem' }}>
            <h3 className="vs-dossier-text-1" style={{ textShadow: REFLEKS_IMIENIA_POSTACI, fontSize: 'calc(var(--tb-type-1) * 0.85)' }}>{fighterA.name}</h3>
          </div>
          {renderFactColumn('left')}
        </div>
      </section>

      <div className="vs-tactical-board25-reality" style={{ position: 'absolute', top: 'var(--tb-panel-top)', left: 'var(--tb-reality-left)', width: 'var(--tb-reality-width)', minHeight: 'var(--tb-panel-height)', display: 'flex', flexDirection: 'column', height: 'var(--tb-panel-height)' }}>
        <p className="vs-tactical-board25-reality-heading vs-panel-top-label"><GlitchText text="Postać Czerwona" /></p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', padding: '0.5rem 1rem 0.5rem 1.5rem' }}>
          <div style={{ borderLeft: `4px solid ${BLUE_EKSTREMALNY}`, paddingLeft: '1.5rem', minHeight: '4.5rem' }}>
            <h3 className="vs-dossier-text-1" style={{ textShadow: REFLEKS_IMIENIA_POSTACI, fontSize: 'calc(var(--tb-type-1) * 0.85)' }}>{fighterB.name}</h3>
          </div>
          {renderFactColumn('right')}
        </div>
      </div>
    </div>
  )
}
