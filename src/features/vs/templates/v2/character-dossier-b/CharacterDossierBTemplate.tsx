import './CharacterDossierBTemplate.scss'
import { useState, useEffect, type ReactNode } from 'react'
import { AdjustableTemplateImage } from '../../../components/AdjustableTemplateImage'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { FittedText } from '../../shared/FittedText'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'
import { AnimeLightning } from '../../../components/AnimeLightning'
import { CyberpunkMetaValue } from '../../../components/CyberpunkMetaValue'

type CharacterDossierBTemplateProps = TemplatePreviewProps & {
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

export function CharacterDossierBTemplate({
  activeTemplateId,
  fighterB,
  portraitBAdjust,
  title,
  factsB,
  templateBlocks,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
  onToggleLanguage,
  integratedToolbar,
}: CharacterDossierBTemplateProps) {
  // New Layout base props
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)
  
  // Old Template logic
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['character-dossier-b'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const common = getFightCommonCopy('character-dossier-b', language)
  const ui = getTemplateUi('character-dossier-b', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  
  const fighterText = fighterB.name || getFightTemplateDefaultField('character-dossier-b', 'fighter_b_fallback', language)
  const safeFacts = factsB.length
    ? factsB
    : [
        { title: common.style, text: common.emptyFieldLabel },
        { title: common.advantage, text: common.emptyFieldLabel },
        { title: common.mentality, text: common.emptyFieldLabel },
      ]
      
  const fighterForCard = {
    ...fighterB,
    subtitle: pickTemplateField(blockFields, ['world', 'swiat', 'version']) || fighterB.subtitle,
  }
  const cardFacts = safeFacts
  const cardTitle = (pickTemplateField(blockFields, ['header', 'title', 'headline']) || title)
    .replace(/\s*(?:(?:\/\/)|[|/-])\s*(?:NIEBIESKI|CZERWONY|BLUE|RED)\s*$/i, '')
    .trim()
  const subText = common.redCorner
  const fighterSubtitle = fighterForCard.subtitle
    .replace(/^\s*(?:NIEBIESKI|CZERWONY|BLUE|RED)\b\s*(?:(?:\/\/)|[|/-])?\s*/i, '')
    .trim()
  const dossierQuote = pickTemplateField(blockFields, ['quote', 'cytat']) || common.emptyFieldLabel
  
  const boardHeader =
    pickTemplateField(blockFields, ['left_header', 'categories_header', 'dossier_header']) ||
    getFightTemplateDefaultField('tactical-board', 'left_header', language) || "CHARACTER DOSSIER"
    
  const realityHeader =
    pickTemplateField(blockFields, ['right_header', 'reality_header', 'visual_header']) ||
    "VISUAL DATA SCAN"

  const BLUE_EKSTREMALNY = '#77e2f2'

  // Glitch effect for title
  const headerTextStr = typeof cardTitle === 'string' ? cardTitle : "TACTICAL BOARD"
  const chars = headerTextStr.split('')
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
  }, [headerTextStr])

  return (
    <div className="vs-tactical-board25-surface">
      <div className="vs-tactical-board25-line" />
      {integratedToolbar ? <div className="vs-tactical-board25-toolbar">{integratedToolbar}</div> : null}

      <div className="vs-tactical-board25-meta">
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.threatLevelLabel} />: <span style={{ color: BLUE_EKSTREMALNY, textShadow: '0 0 10px rgba(119, 226, 242, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.threatLevelValue} /></span>
        </p>
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.dataIntegrityLabel} />: <span style={{ color: BLUE_EKSTREMALNY, textShadow: '0 0 10px rgba(119, 226, 242, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.dataIntegrityValue} /></span>
        </p>
      </div>

      <div className="vs-tactical-board25-heading">
        <div className="vs-tb-signal-main" style={{ transform: 'none', minWidth: 'auto', maxWidth: 'none', minHeight: 'auto', padding: '0.1em 0.5em', margin: 0 }}>
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
            <div className="glow" style={{ fontSize: '4.5vw', width: '100%', textAlign: 'center', pointerEvents: 'none' }}>{cardTitle}</div>
          </div>
        </div>
        <p className="vs-tactical-board25-subtitle" style={{ color: BLUE_EKSTREMALNY }}>{subText}</p>
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

      {/* LEFT PANEL: TEXT DATA ONLY (EKSTREMALNY STYLE) */}
      <section className="vs-tactical-board25-stats">
        <p className="vs-tactical-board25-stats-title" style={{ color: BLUE_EKSTREMALNY, zIndex: 10 }}>{boardHeader}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'transparent', height: '100%', padding: '0.5rem' }}>
          {/* Header Data */}
          <div style={{ borderRight: `4px solid ${fighterForCard.color}`, paddingRight: '1.5rem', marginBottom: '0.5rem', textAlign: 'right' }}>
            <FittedText
              as="h3"
              slotKey={`character-dossier-b:name:${fighterText}`}
              spec={slots.heroName}
              text={fighterText}
              className={layout.HERO_NAME_CLASS}
              style={{ 
                color: BLUE_EKSTREMALNY, 
                fontFamily: "'Chakra Petch', 'JetBrains Mono', monospace", 
                fontSize: '2.8rem', 
                lineHeight: 1, 
                textTransform: 'uppercase',
                fontWeight: 800,
                textShadow: `0 0 12px rgba(119, 226, 242, 0.5)`
              }}
            />
            {fighterSubtitle ? (
              <FittedText
                as="p"
                slotKey={`character-dossier-b:subtitle:${fighterSubtitle}`}
                spec={slots.heroSubtitle}
                text={fighterSubtitle}
                style={{ color: '#94a3b8', fontSize: '1.2rem', marginTop: '0.4rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}
              />
            ) : null}
          </div>

          {/* Facts List - EKSTREMALNY STYLE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, overflowY: 'auto' }}>
            {cardFacts.map((fact, index) => (
              <div key={`${fighterText}-${fact.title}-${index}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', textAlign: 'right' }}>
                <FittedText
                  as="p"
                  slotKey={`character-dossier-b:fact-title:${index}`}
                  spec={slots.factTitle}
                  text={fact.title}
                  style={{ color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.7 }}
                />
                <FittedText
                  as="p"
                  slotKey={`character-dossier-b:fact-body:${index}`}
                  spec={slots.factBody}
                  text={fact.text}
                  style={{ 
                    color: BLUE_EKSTREMALNY, 
                    fontFamily: "'Chakra Petch', 'JetBrains Mono', monospace",
                    fontSize: '1.8rem', 
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    lineHeight: 1.1,
                    textShadow: `0 0 10px rgba(119, 226, 242, 0.4)`
                  }}
                />
              </div>
            ))}
          </div>

          {/* Quote Section */}
          <div style={{ padding: '1rem 0', borderTop: '1px solid rgba(255,255,255,0.1)', fontStyle: 'italic', textAlign: 'right' }}>
            <FittedText
              as="p"
              slotKey="character-dossier-b:quote"
              spec={slots.quoteBody}
              text={`"${dossierQuote}"`}
              style={{ color: '#cbd5e1', fontSize: '1.2rem', lineHeight: 1.4, opacity: 0.8 }}
            />
          </div>
        </div>
      </section>

      {/* RIGHT PANEL: PORTRAIT ONLY */}
      <div className="vs-tactical-board25-reality">
        <p className="vs-tactical-board25-reality-heading" style={{ color: BLUE_EKSTREMALNY, zIndex: 10 }}>{realityHeader}</p>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 1 }}>
          <AdjustableTemplateImage
            imageUrl={fighterB.imageUrl}
            alt={fighterB.name}
            fallbackLabel={common.portraitSlot}
            hintLabel=""
            adjustKey="character-dossier-b:portrait"
            baseAdjust={portraitBAdjust}
            adjustments={slideImageAdjustments}
            onAdjustChange={onSlideImageAdjustChange}
            onAdjustCommit={onSlideImageAdjustCommit}
            plain
          />
        </div>
      </div>
    </div>
  )
}
