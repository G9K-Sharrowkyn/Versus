import './FinalSummaryTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, type ReactNode, type CSSProperties } from 'react'
import { AdjustableTemplateImage } from '../../../components/AdjustableTemplateImage'
import { fighterMonogram } from '../../../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { FittedText } from '../../shared/FittedText'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'
import { CyberpunkMetaValue } from '../../../components/CyberpunkMetaValue'

type FinalSummaryTemplateProps = TemplatePreviewProps & {
  integratedToolbar?: ReactNode
}

const GLITCH_CHARS = '!@#$%^&Ă˘â€“â€Ă˘â€“â€śĂ˘â€“â€™Ă˘â€“ĹšĂ˘â€“ÂĂ˘â€˘Â Ă˘â€˘ĹĂ˘â€˘Â¦Ă˘â€˘Â¬Ă˘â€ťÄ˝Ă˘â€˘Â«ĂŽÂ©'.split('')

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

export function FinalSummaryTemplate({
  fighterA,
  fighterB,
  portraitAAdjust,
  portraitBAdjust,
  title,
  subtitle,
  templateBlocks,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
  onToggleLanguage,
  integratedToolbar,
}: FinalSummaryTemplateProps) {
  // New Layout base props
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)

  // Old Template logic
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['final-summary'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const common = getFightCommonCopy('final-summary', language)
  const ui = getTemplateUi('final-summary', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  
  const line = (position: number, keys: string[], fallback = '') =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
    
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle
  

  const fighterAFallback = getFightTemplateDefaultField('final-summary', 'fighter_a_fallback', language)
  const fighterBFallback = getFightTemplateDefaultField('final-summary', 'fighter_b_fallback', language)
  const fighterAName = fighterA.name || fighterAFallback
  const fighterBName = fighterB.name || fighterBFallback
  const winnerLabel = pickTemplateField(blockFields, ['winner', 'verdict']) || common.emptyFieldLabel
  const quoteText = pickTemplateField(blockFields, ['quote'])
  const portraitAKey = 'final-summary:portrait-a'
  const portraitBKey = 'final-summary:portrait-b'
  const portraitAFallbackAdjust = portraitAAdjust || { x: 50, y: 50, scale: 1 }
  const portraitBFallbackAdjust = portraitBAdjust || { x: 50, y: 50, scale: 1 }
  const portraitABaseAdjust = slideImageAdjustments[portraitAKey] || { ...portraitAFallbackAdjust, x: 0 }
  const portraitBBaseAdjust = slideImageAdjustments[portraitBKey] || { ...portraitBFallbackAdjust, x: 100 }
  const summaryLines = [
    line(0, ['line_1', 'line1'], common.emptyFieldLabel),
    line(1, ['line_2', 'line2'], common.emptyFieldLabel),
    line(2, ['line_3', 'line3'], common.emptyFieldLabel),
  ]
  const DOSSIER_NAME_COLOR = '#77e2f2'
  const BLUE_TEXT_REFLECTION = '0 var(--tb-reflect-2-y) 0.55em rgba(119, 226, 242, 0.45)'
  const RED_SECTION_COLOR = '#ff554e'
  const RED_SECTION_REFLECTION = '0 var(--tb-reflect-2-y) 0.55em rgba(255, 85, 78, 0.45)'
  const RED_QUOTE_REFLECTION = '0 var(--tb-reflect-2-y) 0.38em rgba(255, 85, 78, 0.68)'
  const CONCLUSION_TITLE_FONT_SIZE = 'var(--tb-type-3)'
  const CONCLUSION_ROW_GAP = '0.52rem'
  const summaryWinnerSpec: TemplateSlotSpec = {
    ...slots.summaryWinner,
    baseFontPx: 100,
    minFontPx: Math.max(slots.summaryWinner.minFontPx, 24),
    lineHeight: 0.9,
    textAlign: 'center',
    fitMode: 'shrink',
  }
  const summaryLineSpec: TemplateSlotSpec = {
    ...slots.summaryLine,
    baseFontPx: 32,
    minFontPx: Math.max(slots.summaryLine.minFontPx, 16),
    lineHeight: 1.16,
    maxLines: Math.max(slots.summaryLine.maxLines, 4),
    fitMode: 'shrink',
  }
  const quoteSpec: TemplateSlotSpec = {
    ...slots.interpretationQuote,
    baseFontPx: 34,
    minFontPx: Math.max(slots.interpretationQuote.minFontPx, 18),
    lineHeight: 1.1,
    maxLines: Math.max(slots.interpretationQuote.maxLines, 2),
    textAlign: 'center',
    fitMode: 'shrink',
  }

  // Glitch effect for title
  const headerTextStr = typeof headerText === 'string' ? headerText : "TACTICAL BOARD"
  const chars = headerTextStr.split('')
  const [activeGlitches, setActiveGlitches] = useState<Set<number>>(new Set())

  useEffect(() => {
    const headerChars = headerTextStr.split('')
    if (headerChars.length === 0) return

    const MAX_CONCURRENT = 3
    const active = new Set<number>()
    const timeouts = new Map<number, ReturnType<typeof setTimeout>>()
    let isMounted = true

    const startGlitch = () => {
      if (!isMounted) return
      if (active.size >= MAX_CONCURRENT) return

      const available = []
      for (let i = 0; i < headerChars.length; i++) {
        if (!active.has(i) && headerChars[i] !== ' ') available.push(i)
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

    for (let i = 0; i < Math.min(MAX_CONCURRENT, headerChars.length); i++) {
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
        <p className="vs-tactical-board25-subtitle" style={{ color: '#77e2f2' }}>{(subText || '').replace(/\.\s*$/, '')}</p>
      </div>

      <button
        type="button"
        className="vs-tactical-board25-logo"
        title={tacticalChrome.brandMarkTitle}
        aria-label={tacticalChrome.brandMarkAria}
        onClick={onToggleLanguage}
        style={{ '--logo-url': `url(${tacticalChrome.brandImageSrc})` } as CSSProperties}
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

      <section className="vs-tactical-board25-stats" style={{ width: 'calc(var(--tb-panel-width) * 2 + var(--tb-center-gap))', display: 'flex', flexDirection: 'column', height: 'var(--tb-panel-height)', padding: 0 }}>
        <p
          className="vs-tactical-board25-stats-title vs-panel-top-label"
          style={{
            left: 'calc(18px * var(--tb-scale))',
            maxWidth: 'calc(33.333333% - (26px * var(--tb-scale)))',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: '#ff554e',
            zIndex: 13,
          }}
        >
          <GlitchText text={fighterAName} />
        </p>
        <p
          className="vs-tactical-board25-reality-heading vs-panel-top-label"
          style={{
            left: 'calc(66.666666% + (18px * var(--tb-scale)))',
            maxWidth: 'calc(33.333333% - (26px * var(--tb-scale)))',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: '#ff554e',
            zIndex: 13,
          }}
        >
          <GlitchText text={fighterBName} />
        </p>
        <div aria-hidden="true" style={{ position: 'absolute', top: '-10px', bottom: '-10px', left: 'calc(33.333333% - 5px)', width: '10px', background: 'rgba(255, 85, 78, 1)', pointerEvents: 'none', zIndex: 12 }} />
        <div aria-hidden="true" style={{ position: 'absolute', top: '-10px', bottom: '-10px', left: 'calc(66.666666% - 5px)', width: '10px', background: 'rgba(255, 85, 78, 1)', pointerEvents: 'none', zIndex: 12 }} />
        
        <div className={layout.BODY_CLASS} style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gridTemplateRows: 'minmax(0, 1fr)', alignItems: 'stretch', gap: 0, background: 'transparent', padding: 0, margin: 0, overflow: 'hidden' }}>
          <div className={layout.SIDE_FRAME_CLASS} style={{ position: 'relative', height: '100%', border: 'none', background: 'transparent', minWidth: 0, minHeight: 0, margin: 0, padding: 0, borderRadius: 0, overflow: 'hidden' }}>
            <div className="vs-final-summary-portrait-pane" style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent', borderRadius: 0, overflow: 'hidden' }}>
              {fighterA.imageUrl ? (
                <AdjustableTemplateImage
                  imageUrl={fighterA.imageUrl}
                  alt={fighterAName}
                  fallbackLabel={common.portraitSlot}
                  hintLabel=""
                  adjustKey={portraitAKey}
                  baseAdjust={portraitABaseAdjust}
                  adjustments={slideImageAdjustments}
                  onAdjustChange={onSlideImageAdjustChange}
                  onAdjustCommit={onSlideImageAdjustCommit}
                  plain
                />
              ) : (
                <div
                  className={layout.FALLBACK_PORTRAIT_CLASS}
                  style={{ color: fighterA.color, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
                >
                  <div className={layout.FALLBACK_INNER_CLASS} style={{ textAlign: 'center' }}>
                    <p className={layout.FALLBACK_MONOGRAM_CLASS} style={{ fontSize: '4rem', opacity: 0.2 }}>{fighterMonogram(fighterAName)}</p>
                    <p className={layout.FALLBACK_LABEL_CLASS}>{common.portraitSlot}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={layout.CENTER_FRAME_CLASS} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', border: 'none', background: 'transparent', minHeight: 0, minWidth: 0, padding: '0.28rem 0.34rem 0.3rem', borderRadius: 0, overflow: 'hidden' }}>
            <div className={layout.VERDICT_PANEL_CLASS} style={{ padding: '0.55rem 0.8rem', textAlign: 'center', border: 'none', background: 'transparent', overflow: 'visible' }}>
              <FittedText
                as="p"
                slotKey="final-summary:winner"
                spec={summaryWinnerSpec}
                text={winnerLabel}
                className={layout.VERDICT_WINNER_CLASS}
                style={{
                  fontFamily: "'Chakra Petch', sans-serif",
                  fontWeight: 900,
                  color: DOSSIER_NAME_COLOR,
                  letterSpacing: '0.02em',
                  lineHeight: 0.9,
                  textAlign: 'center',
                  textShadow: BLUE_TEXT_REFLECTION,
                  textTransform: 'uppercase',
                  maxWidth: '100%',
                  width: '100%',
                  margin: 0,
                  overflow: 'visible',
                }}
              />
            </div>

            <div className={layout.SUMMARY_PANEL_CLASS} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0.28rem 0.5rem 0.36rem', border: 'none', background: 'transparent', minHeight: 0, overflow: 'visible' }}>
              <div className={layout.SUMMARY_LIST_CLASS} style={{ display: 'grid', gridTemplateRows: 'repeat(3, minmax(0, 1fr))', gap: CONCLUSION_ROW_GAP, flex: 1, minHeight: 0, overflow: 'visible', padding: '0 0.14rem' }}>
                {summaryLines.map((item, index) => (
                  <div key={`summary-line-${index}-${item}`} className={layout.SUMMARY_ITEM_CLASS} style={{ padding: '0.08rem 0.1rem', border: 'none', background: 'transparent', minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                    <div style={{ width: 'max-content', position: 'relative', paddingBottom: '0.2rem', marginBottom: '0.22rem' }}>
                      <p
                        style={{
                          margin: 0,
                          color: RED_SECTION_COLOR,
                          fontFamily: "'Chakra Petch', sans-serif",
                          fontWeight: 700,
                          fontSize: CONCLUSION_TITLE_FONT_SIZE,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          textShadow: RED_SECTION_REFLECTION,
                          lineHeight: 1,
                        }}
                      >
                        <GlitchText text={`CONCLUSION ${index + 1}`} />
                      </p>
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          bottom: 0,
                          width: '100%',
                          height: '2px',
                          background: RED_SECTION_COLOR,
                          boxShadow: '0 0 10px rgba(255, 85, 78, 0.42)',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          bottom: '-3px',
                          width: '100%',
                          height: '2px',
                          background: RED_SECTION_COLOR,
                          filter: 'blur(2px)',
                          opacity: 0.8,
                        }}
                      />
                    </div>
                    <FittedText
                      as="p"
                      slotKey={`final-summary:line:${index}`}
                      spec={summaryLineSpec}
                      text={`${index + 1}. ${item}`}
                      className={layout.SUMMARY_LINE_TEXT_CLASS}
                      style={{
                        color: '#77e2f2',
                        fontFamily: "'Chakra Petch', sans-serif",
                        fontWeight: 700,
                        letterSpacing: '0.01em',
                        lineHeight: 1.16,
                        textShadow: BLUE_TEXT_REFLECTION,
                        textAlign: 'left',
                        overflow: 'visible',
                        boxSizing: 'border-box',
                        paddingInline: '0.06em',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {quoteText && (
              <FittedText
                as="p"
                slotKey="final-summary:quote"
                spec={quoteSpec}
                text={quoteText}
                className="vs-final-summary-quote"
                style={{
                  marginTop: '0.08rem',
                  padding: '0.18rem 0.1rem 0',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 0,
                  boxShadow: 'none',
                  fontStyle: 'italic',
                  fontFamily: "'Chakra Petch', sans-serif",
                  fontWeight: 700,
                  color: '#ff554e',
                  textAlign: 'center',
                  textShadow: RED_QUOTE_REFLECTION,
                  textTransform: 'none',
                  letterSpacing: '0.02em',
                  lineHeight: 1.1,
                  overflow: 'visible',
                  boxSizing: 'border-box',
                  paddingInline: '0.08em',
                }}
              />
            )}
          </div>

          <div className={layout.SIDE_FRAME_CLASS} style={{ position: 'relative', height: '100%', border: 'none', background: 'transparent', minWidth: 0, minHeight: 0, margin: 0, padding: 0, borderRadius: 0, overflow: 'hidden' }}>
            <div className="vs-final-summary-portrait-pane" style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent', borderRadius: 0, overflow: 'hidden' }}>
              {fighterB.imageUrl ? (
                <AdjustableTemplateImage
                  imageUrl={fighterB.imageUrl}
                  alt={fighterBName}
                  fallbackLabel={common.portraitSlot}
                  hintLabel=""
                  adjustKey={portraitBKey}
                  baseAdjust={portraitBBaseAdjust}
                  adjustments={slideImageAdjustments}
                  onAdjustChange={onSlideImageAdjustChange}
                  onAdjustCommit={onSlideImageAdjustCommit}
                  plain
                />
              ) : (
                <div
                  className={layout.FALLBACK_PORTRAIT_CLASS}
                  style={{ color: fighterB.color, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
                >
                  <div className={layout.FALLBACK_INNER_CLASS} style={{ textAlign: 'center' }}>
                    <p className={layout.FALLBACK_MONOGRAM_CLASS} style={{ fontSize: '4rem', opacity: 0.2 }}>{fighterMonogram(fighterBName)}</p>
                    <p className={layout.FALLBACK_LABEL_CLASS}>{common.portraitSlot}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
