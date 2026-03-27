import './CharacterDossierATemplate.scss'
import { useState, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { AdjustableTemplateImage } from '../../../components/AdjustableTemplateImage'
import { GlitchText } from '../../../components/GlitchText'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { applyDossierNameAutofit } from '../../shared/dossierNameAutofit'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
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
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)
  
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['character-dossier-a'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const common = getFightCommonCopy('character-dossier-a', language)
  
  const BLUE_EKSTREMALNY = '#77e2f2'
  const RED_LINIA = '#ff554e'
  const CURRENT_FILE = 'src/features/vs/templates/v2/character-dossier-a/CharacterDossierATemplate.tsx'

  const REFLEKS_IMIENIA_POSTACI = "0 1em 0.28em rgba(119, 226, 242, 0.45)" 
  const REFLEKS_TRESCI_FAKTOW = "0 var(--tb-reflect-2-y) 0.55em rgba(119, 226, 242, 0.45)" 
  const REFLEKS_ETYKIET_FAKTOW = "0 0 8px rgba(255, 85, 78, 0.9), 0 0 16px rgba(255, 85, 78, 0.4)" 
  const REFLEKS_CYTATU = "0 var(--tb-reflect-2-y) 0.38em rgba(255, 85, 78, 0.68)"
  const POZYCJA_REFLEKSU_CZERWONEJ_LINII = "calc(var(--tb-reflect-4-y) + 230px)"

  const fighterText = fighterA.name || getFightTemplateDefaultField('character-dossier-a', 'fighter_a_fallback', language)
  const fighterNameWrapperRef = useRef<HTMLDivElement | null>(null)
  const fighterNameHeadingRef = useRef<HTMLHeadingElement | null>(null)
  const cardFacts = factsA.length ? factsA : []
  const cardTitle = (pickTemplateField(blockFields, ['header', 'title', 'headline']) || title)
    .replace(/\s*(?:(?:\/\/)|[|/-])\s*(?:NIEBIESKI|CZERWONY|BLUE|RED)\s*$/i, '')
    .trim()
  const subText = common.blueCorner
  const dossierQuote = pickTemplateField(blockFields, ['quote', 'cytat']) || common.emptyFieldLabel
  const quoteFontSize = 'calc(var(--tb-type-3) * 0.9)'
  const quoteLetterSpacing = '0.02em'
  
  const boardHeader = "PORTRET"
  const realityHeader = "OPIS POSTACI"

  const headerTextStr = typeof cardTitle === 'string' ? cardTitle : "TACTICAL BOARD"
  const chars = headerTextStr.split('')
  const [activeGlitches, setActiveGlitches] = useState<Set<number>>(new Set())

  useLayoutEffect(() => {
    const wrapperEl = fighterNameWrapperRef.current
    const headingEl = fighterNameHeadingRef.current
    if (!wrapperEl || !headingEl) return

    const applyFit = () => {
      applyDossierNameAutofit({
        element: headingEl,
        container: wrapperEl,
        sourceText: fighterText,
        config: {
          baseScale: 0.85,
          twoLineScale: 0.425,
          oneLineMinScale: 0.5,
          minFontPx: 8,
        },
      })
    }

    applyFit()
    const delayedReflows = [
      window.setTimeout(applyFit, 80),
      window.setTimeout(applyFit, 220),
      window.setTimeout(applyFit, 520),
    ]

    let disposed = false
    const fontSet = typeof document !== 'undefined' ? document.fonts : null
    const handleFontsReady = () => {
      if (disposed) return
      applyFit()
    }
    if (fontSet) {
      fontSet.ready.then(handleFontsReady).catch(() => {})
      if (typeof fontSet.addEventListener === 'function') {
        fontSet.addEventListener('loadingdone', handleFontsReady)
      }
    }

    const resizeObserver = new ResizeObserver(() => applyFit())
    resizeObserver.observe(wrapperEl)
    window.addEventListener('resize', applyFit)

    return () => {
      disposed = true
      delayedReflows.forEach((timerId) => window.clearTimeout(timerId))
      if (fontSet && typeof fontSet.removeEventListener === 'function') {
        fontSet.removeEventListener('loadingdone', handleFontsReady)
      }
      resizeObserver.disconnect()
      window.removeEventListener('resize', applyFit)
    }
  }, [fighterText])

  useEffect(() => {
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
      const t = setTimeout(() => {
        if (!isMounted) return
        active.delete(nextIndex)
        setActiveGlitches(new Set(active))
        timeouts.delete(nextIndex)
        setTimeout(() => startGlitch(), Math.random() * 500)
      }, 2000 + Math.random() * 3000)
      timeouts.set(nextIndex, t)
    }
    for (let i = 0; i < Math.min(MAX_CONCURRENT, chars.length); i++) setTimeout(() => startGlitch(), i * 800)
    return () => { isMounted = false; timeouts.forEach(clearTimeout); }
  }, [headerTextStr])

  return (
    <div className="vs-tactical-board25-surface vs-template--character-dossier-a">
      <div className="vs-tactical-board25-line" />
      {integratedToolbar ? <div className="vs-tactical-board25-toolbar">{integratedToolbar}</div> : null}

      <div className="vs-tactical-board25-meta" style={{ left: '20px' }}>
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.threatLevelLabel} />: <span style={{ color: '#77e2f2', textShadow: '0 0 12px rgba(119, 226, 242, 0.75), 0 0 22px rgba(119, 226, 242, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.threatLevelValue} /></span>
        </p>
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.dataIntegrityLabel} />: <span style={{ color: '#77e2f2', textShadow: '0 0 12px rgba(119, 226, 242, 0.75), 0 0 22px rgba(119, 226, 242, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.dataIntegrityValue} /></span>
        </p>
      </div>

      <div className="vs-tactical-board25-heading">
        <div className="vs-tb-signal-main" style={{ transform: 'none', minWidth: 'auto', maxWidth: 'none', minHeight: 'auto', padding: '0.1em 0.5em', margin: 0, background: RED_LINIA, width: '75%' }}>
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
            <div className="glow" style={{ fontSize: '3.5vw', width: '100%', textAlign: 'center', pointerEvents: 'none', textShadow: 'none' }}>{headerTextStr}</div>
          </div>
        </div>
        <p className="vs-tactical-board25-subtitle" style={{ color: BLUE_EKSTREMALNY, textShadow: `0 0 8px ${BLUE_EKSTREMALNY}E6, 0 0 16px ${BLUE_EKSTREMALNY}66`, fontWeight: 'bold', letterSpacing: '0.05em' }}><GlitchText text={subText} /></p>
      </div>

      <button type="button" className="vs-tactical-board25-logo" onClick={onToggleLanguage} style={{ '--logo-url': `url(${tacticalChrome.brandImageSrc})`, right: '20px' } as any}>
        <img src={tacticalChrome.brandImageSrc} alt={tacticalChrome.brandAlt} draggable={false} />
        <img
          className="vs-tactical-board25-logo-reflection"
          src={tacticalChrome.brandImageSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      </button>

      {/* LEWY PANEL: PORTRET */}
      <section className="vs-tactical-board25-stats">
        <p className="vs-tactical-board25-stats-title vs-panel-top-label" data-marvin-id="NAGLOWK_LEWY" data-marvin-file={CURRENT_FILE} style={{ color: RED_LINIA, zIndex: 10 }}><GlitchText text={boardHeader} /></p>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 1 }}>
          <AdjustableTemplateImage
            imageUrl={fighterA.imageUrl}
            alt={fighterA.name}
            fallbackLabel={common.portraitSlot}
            adjustKey="character-dossier-a:portrait"
            baseAdjust={portraitAAdjust}
            adjustments={slideImageAdjustments}
            onAdjustChange={onSlideImageAdjustChange}
            onAdjustCommit={onSlideImageAdjustCommit}
            plain
          />
        </div>
      </section>

      {/* PRAWY PANEL: DANE POSTACI */}
      <div className="vs-tactical-board25-reality">
        <p className="vs-tactical-board25-reality-heading vs-panel-top-label" data-marvin-id="NAGLOWK_PRAWY" data-marvin-file={CURRENT_FILE} style={{ color: RED_LINIA, zIndex: 10 }}><GlitchText text={realityHeader} /></p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', padding: '0.5rem 1rem 0.5rem 1.5rem' }}>
          
          {/* Imię Postaci */}
          <div ref={fighterNameWrapperRef} style={{ borderLeft: `4px solid ${BLUE_EKSTREMALNY}`, paddingLeft: '1.5rem', minHeight: '4.5rem' }}>
            <h3 ref={fighterNameHeadingRef} className="vs-dossier-text-1" data-marvin-id="REFLEKS_IMIENIA_POSTACI" data-marvin-file={CURRENT_FILE} data-marvin-type="const" style={{ textShadow: REFLEKS_IMIENIA_POSTACI, fontSize: 'calc(var(--tb-type-1) * 0.85)', whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'clip', maxWidth: '100%', display: 'inline-block' }}>{fighterText}</h3>
          </div>

          {/* Lista Faktów - stałe pozycje */}
          <div style={{ position: 'relative', height: '380px', flexShrink: 0 }}>
            {cardFacts.map((fact, index) => (
              <div key={`fact-${index}`} style={{ position: 'absolute', top: index === 0 ? '0px' : index === 1 ? '200px' : '400px', left: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ width: 'max-content', position: 'relative', paddingBottom: '6px' }}>
                  <p className="vs-dossier-text-3" data-marvin-id="REFLEKS_ETYKIET_FAKTOW" data-marvin-file={CURRENT_FILE} data-marvin-type="const" style={{ color: RED_LINIA, textShadow: REFLEKS_ETYKIET_FAKTOW, fontWeight: 'bold', letterSpacing: '0.05em' }}><GlitchText text={fact.title} /></p>
                  <div style={{ width: '100%', height: '2px', background: RED_LINIA, position: 'absolute', bottom: 0, left: 0, boxShadow: `0 0 10px ${RED_LINIA}66` }} />
                  <div style={{ width: '100%', height: '2px', background: RED_LINIA, position: 'absolute', bottom: '-45px', left: 0, filter: 'blur(2px)', opacity: 0.8 }} />
                </div>
                <p className="vs-dossier-text-2" data-marvin-id="REFLEKS_TRESCI_FAKTOW" data-marvin-file={CURRENT_FILE} data-marvin-type="const" style={{ textShadow: REFLEKS_TRESCI_FAKTOW }}>{fact.text}</p>
              </div>
            ))}
          </div>

          {/* Cytat i Czerwona Linia - ŚREDNIO WYSOKO */}
          <div style={{ marginTop: 'auto', position: 'relative', padding: 'calc(1.5rem + 250px) 0 0.5rem 0' }}>
            <div style={{ width: '100%', height: '2px', background: RED_LINIA, position: 'absolute', top: '220px', left: 0, boxShadow: `0 0 10px ${RED_LINIA}66` }} />
            <div style={{ width: '100%', height: '2px', background: RED_LINIA, position: 'absolute', top: `calc(${POZYCJA_REFLEKSU_CZERWONEJ_LINII} + 0px)`, left: 0, filter: 'blur(2px)', opacity: 0.8 }} data-marvin-id="POZYCJA_REFLEKSU_CZERWONEJ_LINII" data-marvin-file={CURRENT_FILE} data-marvin-type="const" />
            <div style={{ fontStyle: 'italic' }}>
              <p className="vs-dossier-text-3 vs-dossier-quote" data-marvin-id="REFLEKS_CYTATU" data-marvin-file={CURRENT_FILE} data-marvin-type="const" style={{ color: RED_LINIA, textTransform: 'none', textShadow: REFLEKS_CYTATU, fontStyle: 'italic', fontSize: quoteFontSize, letterSpacing: quoteLetterSpacing, lineHeight: 1.05, overflowWrap: 'anywhere' }}>"{dossierQuote}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
