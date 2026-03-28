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

export function FinalSummaryTemplate({
  fighterA,
  fighterB,
  portraitAAdjust,
  portraitBAdjust,
  averageA,
  averageB,
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
  const tokens = ui.tokens as Record<string, string>
  
  const line = (position: number, keys: string[], fallback = '') =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
    
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle
  
  const boardHeader =
    pickTemplateField(blockFields, ['panel_header', 'summary_header']) ||
    getFightTemplateDefaultField('final-summary', 'panel_header', language) ||
    (language === 'pl' ? 'Kto powinien wygrać?' : 'Who Should Win?')

  const fighterAFallback = getFightTemplateDefaultField('final-summary', 'fighter_a_fallback', language)
  const fighterBFallback = getFightTemplateDefaultField('final-summary', 'fighter_b_fallback', language)
  const fighterAName = fighterA.name || fighterAFallback
  const fighterBName = fighterB.name || fighterBFallback
  const winnerLabel = pickTemplateField(blockFields, ['winner', 'verdict']) || common.emptyFieldLabel
  const quoteText = pickTemplateField(blockFields, ['quote'])
  const averageShort = getFightTemplateDefaultField('fight-analytics', 'average_short', language) || 'avg.'
  const summaryLines = [
    line(0, ['line_1', 'line1'], common.emptyFieldLabel),
    line(1, ['line_2', 'line2'], common.emptyFieldLabel),
    line(2, ['line_3', 'line3'], common.emptyFieldLabel),
  ]

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
        <p className="vs-tactical-board25-subtitle" style={{ color: '#77e2f2' }}>{subText}</p>
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

      <section className="vs-tactical-board25-stats" style={{ width: 'calc(var(--tb-panel-width) * 2 + var(--tb-center-gap))', display: 'flex', flexDirection: 'column', height: 'var(--tb-panel-height)' }}>
        <p className="vs-tactical-board25-stats-title vs-panel-top-label" style={{ color: '#ff554e' }}><GlitchText text={boardHeader} /></p>
        
        <div className={layout.BODY_CLASS} style={{ display: 'flex', gap: '0.8rem', flex: 1, minHeight: 0 }}>
          <div className={layout.SIDE_FRAME_CLASS} style={{ flex: 1.08, display: 'flex', flexDirection: 'column', border: 'none', background: 'transparent' }}>
            <div className={layout.PORTRAIT_FRAME_CLASS} style={{ flex: 1, position: 'relative', border: 'none', background: 'transparent', height: '100%' }}>
              {fighterA.imageUrl ? (
                <AdjustableTemplateImage
                  imageUrl={fighterA.imageUrl}
                  alt={fighterAName}
                  fallbackLabel={common.portraitSlot}
                  hintLabel=""
                  adjustKey="final-summary:portrait-a"
                  baseAdjust={portraitAAdjust}
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

          <div className={layout.CENTER_FRAME_CLASS} style={{ flex: 1.35, display: 'flex', flexDirection: 'column', gap: '0.65rem', border: 'none', background: 'transparent', minHeight: 0 }}>
            <div className={layout.VERDICT_PANEL_CLASS} style={{ padding: '0.55rem 0.8rem', textAlign: 'center', border: 'none', background: 'transparent' }}>
              <FittedText
                as="p"
                slotKey="final-summary:winner"
                spec={slots.summaryWinner}
                text={winnerLabel}
                className={layout.VERDICT_WINNER_CLASS}
                style={{ fontFamily: 'var(--font-display)', fontSize: '2.08rem', color: '#fff', lineHeight: 1.08 }}
              />
            </div>

            <div className={layout.SCORE_GRID_CLASS} style={{ display: 'flex', gap: '0.6rem' }}>
              <div className={layout.SCORE_CARD_CLASS} style={{ flex: 1, padding: '0.5rem 0.45rem', textAlign: 'center', border: 'none', background: 'transparent' }}>
                <p style={{ width: '100%', color: fighterA.color, fontSize: '1.58rem', fontWeight: 'bold', fontFamily: 'var(--font-display)', textTransform: 'uppercase', textShadow: '0 0 10px color-mix(in srgb, currentColor 34%, transparent)', lineHeight: 1.06 }}>
                  {fighterAName} {averageShort} {Math.round(averageA)}
                </p>
              </div>
              <div className={layout.SCORE_CARD_CLASS} style={{ flex: 1, padding: '0.5rem 0.45rem', textAlign: 'center', border: 'none', background: 'transparent' }}>
                <p style={{ width: '100%', color: fighterB.color, fontSize: '1.58rem', fontWeight: 'bold', fontFamily: 'var(--font-display)', textTransform: 'uppercase', textShadow: '0 0 10px color-mix(in srgb, currentColor 34%, transparent)', lineHeight: 1.06 }}>
                  {fighterBName} {averageShort} {Math.round(averageB)}
                </p>
              </div>
            </div>

            <div className={layout.SUMMARY_PANEL_CLASS} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0.28rem 0.5rem 0.36rem', border: 'none', background: 'transparent', minHeight: 0, overflow: 'hidden' }}>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2" style={{ marginBottom: '0.35rem' }}>{common.summaryLabel}</p>
              <div className={layout.SUMMARY_LIST_CLASS} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '0.1rem' }}>
                {summaryLines.map((item, index) => (
                  <div key={`summary-line-${index}-${item}`} className={layout.SUMMARY_ITEM_CLASS} style={{ padding: '0.08rem 0', border: 'none', background: 'transparent' }}>
                    <FittedText
                      as="p"
                      slotKey={`final-summary:line:${index}`}
                      spec={slots.summaryLine}
                      text={`${index + 1}. ${item}`}
                      className={layout.SUMMARY_LINE_TEXT_CLASS}
                      style={{ color: '#e2e8f0', fontSize: '0.93rem', lineHeight: 1.24, textShadow: 'none' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {quoteText && (
              <p
                className={`${tokens.INTERPRETATION_QUOTE_CLASS} vs-dossier-quote`}
                style={{ padding: '0.18rem 0.1rem 0', background: 'transparent', borderLeft: 'none', fontStyle: 'italic', color: '#ff554e', textShadow: '0 0 10px rgba(255, 85, 78, 0.42)', textTransform: 'none', letterSpacing: '0.02em', lineHeight: 1.22 }}
              >
                {quoteText}
              </p>
            )}
          </div>

          <div className={layout.SIDE_FRAME_CLASS} style={{ flex: 1.08, display: 'flex', flexDirection: 'column', border: 'none', background: 'transparent' }}>
            <div className={layout.PORTRAIT_FRAME_CLASS} style={{ flex: 1, position: 'relative', border: 'none', background: 'transparent', height: '100%' }}>
              {fighterB.imageUrl ? (
                <AdjustableTemplateImage
                  imageUrl={fighterB.imageUrl}
                  alt={fighterBName}
                  fallbackLabel={common.portraitSlot}
                  hintLabel=""
                  adjustKey="final-summary:portrait-b"
                  baseAdjust={portraitBAdjust}
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
