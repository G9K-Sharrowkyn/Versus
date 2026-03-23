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
  // --- KONFIGURACJA LAYOUTU ---
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)
  
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['character-dossier-b'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const common = getFightCommonCopy('character-dossier-b', language)
  const ui = getTemplateUi('character-dossier-b', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>

  const BLUE_EKSTREMALNY = '#77e2f2'
  const RED_LINIA = '#ff554e'

  // ===========================================================================
  // --- CENTRUM STEROWANIA REFLEKSAMI (EDYTUJ TUTAJ) ---
  // Format: "0 [Wysokość] [Rozmycie/Blur] [Kolor]"
  // ===========================================================================
  
  const REFLEKS_IMIENIA_POSTACI = "0 1.25em 0.2em rgba(119, 226, 242, 0.8)" 
  const REFLEKS_TRESCI_FAKTOW = "0 var(--tb-reflect-2-y) 0.4em rgba(119, 226, 242, 0.8)" 
  const REFLEKS_ETYKIET_FAKTOW = "0 var(--tb-reflect-2-y) 0.25em rgba(119, 226, 242, 0.6)" 
  const REFLEKS_NAGLOWKOW_PANELI = "0 var(--tb-reflect-2-y) 0.2em rgba(119, 226, 242, 0.3)" 
  const REFLEKS_CYTATU = "0 var(--tb-reflect-2-y) 0.2em rgba(119, 226, 242, 0.4)"
  
  const POZYCJA_REFLEKSU_CZERWONEJ_LINII = "var(--tb-reflect-4-y)" 
  // ===========================================================================

  const fighterText = fighterB.name || getFightTemplateDefaultField('character-dossier-b', 'fighter_b_fallback', language)
  const cardFacts = factsB.length ? factsB : []
  const cardTitle = (pickTemplateField(blockFields, ['header', 'title', 'headline']) || title)
    .replace(/\s*(?:(?:\/\/)|[|/-])\s*(?:NIEBIESKI|CZERWONY|BLUE|RED)\s*$/i, '')
    .trim()
  const subText = common.redCorner
  const fighterSubtitle = fighterB.subtitle || ""
  const dossierQuote = pickTemplateField(blockFields, ['quote', 'cytat']) || common.emptyFieldLabel
  
  const boardHeader = "POSTAĆ CZERWONA"
  const realityHeader = "OPIS POSTACI"

  // Glitch effect logic
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
      const timeoutId = setTimeout(() => {
        if (!isMounted) return
        active.delete(nextIndex)
        setActiveGlitches(new Set(active))
        timeouts.delete(nextIndex)
        setTimeout(() => startGlitch(), Math.random() * 500)
      }, 2000 + Math.random() * 3000)
      timeouts.set(nextIndex, timeoutId)
    }
    for (let i = 0; i < Math.min(MAX_CONCURRENT, chars.length); i++) setTimeout(() => startGlitch(), i * 800)
    return () => { isMounted = false; timeouts.forEach(clearTimeout); }
  }, [headerTextStr])

  return (
    <div className="vs-tactical-board25-surface">
      <div className="vs-tactical-board25-line" />
      {integratedToolbar ? <div className="vs-tactical-board25-toolbar">{integratedToolbar}</div> : null}

      {/* META INFO */}
      <div className="vs-tactical-board25-meta">
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.threatLevelLabel} />: <span style={{ color: BLUE_EKSTREMALNY, textShadow: '0 0 10px rgba(119, 226, 242, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.threatLevelValue} /></span>
        </p>
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.dataIntegrityLabel} />: <span style={{ color: BLUE_EKSTREMALNY, textShadow: '0 0 10px rgba(119, 226, 242, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.dataIntegrityValue} /></span>
        </p>
      </div>

      {/* MAIN HEADING */}
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
            <div className="glow" style={{ fontSize: '4.5vw', width: '100%', textAlign: 'center', pointerEvents: 'none', textShadow: REFLEKS_NAGLOWKOW_PANELI }}>{cardTitle}</div>
          </div>
        </div>
        <p className="vs-tactical-board25-subtitle" style={{ color: BLUE_EKSTREMALNY, textShadow: REFLEKS_NAGLOWKOW_PANELI }}>{subText}</p>
      </div>

      <button
        type="button"
        className="vs-tactical-board25-logo"
        title={tacticalChrome.brandMarkTitle}
        onClick={onToggleLanguage}
        style={{ '--logo-url': `url(${tacticalChrome.brandImageSrc})` } as any}
      >
        <img src={tacticalChrome.brandImageSrc} alt={tacticalChrome.brandAlt} />
        <img className="vs-tactical-board25-logo-reflection" src={tacticalChrome.brandImageSrc} alt="" aria-hidden="true" />
      </button>

      {/* LEWY PANEL: PORTRET */}
      <section className="vs-tactical-board25-stats">
        <p className="vs-tactical-board25-stats-title" style={{ color: BLUE_EKSTREMALNY, zIndex: 10, textShadow: REFLEKS_NAGLOWKOW_PANELI }}>{boardHeader}</p>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 1 }}>
          <AdjustableTemplateImage
            imageUrl={fighterB.imageUrl}
            alt={fighterB.name}
            fallbackLabel={common.portraitSlot}
            adjustKey="character-dossier-b:portrait"
            baseAdjust={portraitBAdjust}
            adjustments={slideImageAdjustments}
            onAdjustChange={onSlideImageAdjustChange}
            onAdjustCommit={onSlideImageAdjustCommit}
            plain
          />
        </div>
      </section>

      {/* PRAWY PANEL: DANE POSTACI */}
      <div className="vs-tactical-board25-reality">
        <p className="vs-tactical-board25-reality-heading" style={{ color: BLUE_EKSTREMALNY, zIndex: 10, textShadow: REFLEKS_NAGLOWKOW_PANELI }}>{realityHeader}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', padding: '0.5rem 1rem 0.5rem 1.5rem' }}>
          
          {/* Imię Postaci */}
          <div style={{ borderLeft: `4px solid ${BLUE_EKSTREMALNY}`, paddingLeft: '1.5rem' }}>
            <h3 className="vs-dossier-text-1" style={{ textShadow: REFLEKS_IMIENIA_POSTACI }}>{fighterText}</h3>
            {fighterSubtitle ? <p className="vs-dossier-text-3" style={{ color: '#94a3b8', marginTop: '0.25rem', textShadow: REFLEKS_ETYKIET_FAKTOW }}>{fighterSubtitle}</p> : null}
          </div>

          {/* Lista Faktów */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
            {cardFacts.map((fact, index) => (
              <div key={`fact-${index}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <p className="vs-dossier-text-3" style={{ textShadow: REFLEKS_ETYKIET_FAKTOW }}>{fact.title}</p>
                <p className="vs-dossier-text-2" style={{ textShadow: REFLEKS_TRESCI_FAKTOW }}>{fact.text}</p>
              </div>
            ))}
          </div>

          {/* Cytat i Czerwona Linia */}
          <div style={{ marginTop: 'auto', position: 'relative', padding: '1.5rem 0 0.5rem 0' }}>
            <div style={{ width: '100%', height: '2px', background: RED_LINIA, position: 'absolute', top: 0, left: 0, boxShadow: `0 0 10px ${RED_LINIA}66` }} />
            <div style={{ width: '100%', height: '2px', background: RED_LINIA, position: 'absolute', top: POZYCJA_REFLEKSU_CZERWONEJ_LINII, left: 0, filter: 'blur(2px)', opacity: 0.8 }} />
            <div style={{ fontStyle: 'italic' }}>
              <p className="vs-dossier-text-3" style={{ color: '#cbd5e1', textTransform: 'none', textShadow: REFLEKS_CYTATU }}>"{dossierQuote}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
