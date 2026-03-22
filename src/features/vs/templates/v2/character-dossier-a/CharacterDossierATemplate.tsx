import './CharacterDossierATemplate.scss'
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

type CharacterDossierATemplateProps = TemplatePreviewProps & {
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

export function CharacterDossierATemplate({
  activeTemplateId,
  fighterA,
  portraitAAdjust,
  title,
  factsA,
  templateBlocks,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
  onToggleLanguage,
  integratedToolbar,
}: CharacterDossierATemplateProps) {
  // New Layout base props
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)
  
  const realityHeader =
    pickTemplateField(tacticalBlockFields, ['right_header', 'reality_header']) ||
    getFightTemplateDefaultField('tactical-board', 'right_header', language)

  // Old Template logic
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['character-dossier-a'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const common = getFightCommonCopy('character-dossier-a', language)
  const ui = getTemplateUi('character-dossier-a', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  
  const fighterText = fighterA.name || getFightTemplateDefaultField('character-dossier-a', 'fighter_a_fallback', language)
  const safeFacts = factsA.length
    ? factsA
    : [
        { title: common.style, text: common.emptyFieldLabel },
        { title: common.advantage, text: common.emptyFieldLabel },
        { title: common.mentality, text: common.emptyFieldLabel },
      ]
      
  const fighterForCard = {
    ...fighterA,
    subtitle: pickTemplateField(blockFields, ['world', 'swiat', 'version']) || fighterA.subtitle,
  }
  const cardFacts = safeFacts
  const cardTitle = (pickTemplateField(blockFields, ['header', 'title', 'headline']) || title)
    .replace(/\s*(?:(?:\/\/)|[|/-])\s*(?:NIEBIESKI|CZERWONY|BLUE|RED)\s*$/i, '')
    .trim()
  const subText = common.blueCorner
  const fighterSubtitle = fighterForCard.subtitle
    .replace(/^\s*(?:NIEBIESKI|CZERWONY|BLUE|RED)\b\s*(?:(?:\/\/)|[|/-])?\s*/i, '')
    .trim()
  const dossierQuote = pickTemplateField(blockFields, ['quote', 'cytat']) || common.emptyFieldLabel
  
  const boardHeader =
    pickTemplateField(blockFields, ['left_header', 'categories_header']) ||
    getFightTemplateDefaultField('tactical-board', 'left_header', language) || "CHARACTER DOSSIER"

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
          <SubtleCyberpunkLabel text={tacticalChrome.threatLevelLabel} />: <span style={{ color: '#77e2f2', textShadow: '0 var(--tb-reflect-3-y) var(--tb-reflect-4-blur) rgba(119, 226, 242, 0.2)' }}><CyberpunkMetaValue value={tacticalChrome.threatLevelValue} /></span>
        </p>
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.dataIntegrityLabel} />: <span style={{ color: '#77e2f2', textShadow: '0 var(--tb-reflect-3-y) var(--tb-reflect-4-blur) rgba(119, 226, 242, 0.2)' }}><CyberpunkMetaValue value={tacticalChrome.dataIntegrityValue} /></span>
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

      <section className="vs-tactical-board25-stats">
        <p className="vs-tactical-board25-stats-title" style={{ color: '#77e2f2' }}>{boardHeader}</p>
        
        <div className={layout.BODY_FRAME_CLASS} style={{ background: 'transparent', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className={layout.BODY_GRID_CLASS} style={{ display: 'flex', gap: '1rem', flex: 1 }}>
            <div className={layout.PORTRAIT_FRAME_CLASS} style={{ flex: 1, position: 'relative', background: 'rgba(2, 6, 23, 0.5)', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
              <AdjustableTemplateImage
                imageUrl={fighterForCard.imageUrl}
                alt={fighterText}
                fallbackLabel={common.portraitSlot}
                hintLabel=""
                adjustKey="character-dossier-a:portrait"
                baseAdjust={portraitAAdjust}
                adjustments={slideImageAdjustments}
                onAdjustChange={onSlideImageAdjustChange}
                onAdjustCommit={onSlideImageAdjustCommit}
                plain
              />
            </div>

            <div className={layout.DETAILS_CARD_CLASS} style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '1rem', background: 'transparent' }}>
              <div className={layout.NAME_PLATE_CLASS} style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '1rem', border: `1px solid ${fighterForCard.color}40`, borderLeft: `4px solid ${fighterForCard.color}` }}>
                <FittedText
                  as="h3"
                  slotKey={`character-dossier-a:name:${fighterText}`}
                  spec={slots.heroName}
                  text={fighterText}
                  className={layout.HERO_NAME_CLASS}
                  style={{ color: fighterForCard.color, fontFamily: 'var(--font-display)', fontSize: '2rem', lineHeight: 1.2 }}
                />
                {fighterSubtitle ? (
                  <FittedText
                    as="p"
                    slotKey={`character-dossier-a:subtitle:${fighterSubtitle}`}
                    spec={slots.heroSubtitle}
                    text={fighterSubtitle}
                    className={layout.HERO_SUBTITLE_CLASS}
                    style={{ color: '#94a3b8', fontSize: '1rem' }}
                  />
                ) : null}
              </div>

              <div className={layout.FACTS_LIST_CLASS} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
                {cardFacts.map((fact, index) => (
                  <div key={`${fighterText}-${fact.title}-${index}`} className={layout.FACT_CARD_CLASS} style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.75rem', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                    <FittedText
                      as="p"
                      slotKey={`character-dossier-a:fact-title:${index}`}
                      spec={slots.factTitle}
                      text={fact.title}
                      style={{ color: fighterForCard.color, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}
                    />
                    <FittedText
                      as="p"
                      slotKey={`character-dossier-a:fact-body:${index}`}
                      spec={slots.factBody}
                      text={fact.text}
                      className={layout.FACT_BODY_CLASS}
                      style={{ color: '#e2e8f0' }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ padding: '1rem', background: 'rgba(0, 0, 0, 0.4)', borderTop: `1px dashed ${fighterForCard.color}80`, fontStyle: 'italic', color: '#cbd5e1' }}>
                <FittedText
                  as="p"
                  slotKey="character-dossier-a:quote"
                  spec={slots.quoteBody}
                  text={`"${dossierQuote}"`}
                  className={layout.QUOTE_CLASS}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="vs-tactical-board25-reality">
        <p className="vs-tactical-board25-reality-heading" style={{ color: '#77e2f2' }}>{realityHeader}</p>
        <div className="vs-tactical-board25-reality-viewport">
          <AnimeLightning />
        </div>
      </div>
    </div>
  )
}
