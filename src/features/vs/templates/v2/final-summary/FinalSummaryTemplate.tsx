import './FinalSummaryTemplate.scss'
import { useState, useEffect, type ReactNode } from 'react'
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
import { AnimeLightning } from '../../../components/AnimeLightning'
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
  activeTemplateId,
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
  
  const realityHeader =
    pickTemplateField(tacticalBlockFields, ['right_header', 'reality_header']) ||
    getFightTemplateDefaultField('tactical-board', 'right_header', language)

  // Old Template logic
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['final-summary'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome('final-summary', language, blockFields)
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
    pickTemplateField(blockFields, ['left_header', 'categories_header']) ||
    getFightTemplateDefaultField('tactical-board', 'left_header', language) || "FINAL SUMMARY"

  const portraitHint = chrome.portraitAdjustHint
  const fighterAFallback = getFightTemplateDefaultField('final-summary', 'fighter_a_fallback', language)
  const fighterBFallback = getFightTemplateDefaultField('final-summary', 'fighter_b_fallback', language)
  const fighterAName = fighterA.name || fighterAFallback
  const fighterBName = fighterB.name || fighterBFallback
  const winnerLabel = pickTemplateField(blockFields, ['winner', 'verdict']) || common.emptyFieldLabel
  const quoteText = pickTemplateField(blockFields, ['quote'])
  const summaryLines = [
    line(0, ['line_1', 'line1'], common.emptyFieldLabel),
    line(1, ['line_2', 'line2'], common.emptyFieldLabel),
    line(2, ['line_3', 'line3'], common.emptyFieldLabel),
  ]

  const matchupText = `${fighterAName} VS ${fighterBName}`
  const matchupMatch = matchupText.match(/^(.*?)(\s+VS\s+)(.*)$/i)

  // Glitch effect for title
  const headerTextStr = typeof headerText === 'string' ? headerText : "TACTICAL BOARD"
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
            <div className="glow" style={{ fontSize: '4.5vw', width: '100%', textAlign: 'center', pointerEvents: 'none' }}>{headerText}</div>
          </div>
        </div>
        <p className="vs-tactical-board25-subtitle" style={{ color: '#77e2f2' }}>{subText}</p>
        <div className="vs-tpl-matchup" style={{ textAlign: 'center', marginTop: '0.5rem', fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#cbd5e1' }}>
          {matchupMatch ? (
            <>
              <span className="vs-tpl-matchup-a" style={{ color: fighterA.color }}>{matchupMatch[1].trim()}</span>
              <span className="vs-tpl-matchup-sep" style={{ margin: '0 0.5rem', opacity: 0.5 }}>{matchupMatch[2]}</span>
              <span className="vs-tpl-matchup-b" style={{ color: fighterB.color }}>{matchupMatch[3].trim()}</span>
            </>
          ) : matchupText}
        </div>
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
        
        <div className={layout.BODY_CLASS} style={{ display: 'flex', gap: '1rem', flex: 1 }}>
          <div className={layout.SIDE_FRAME_CLASS} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(2, 6, 23, 0.5)', border: '1px solid rgba(148, 163, 184, 0.2)', boxShadow: `0 0 0 1px ${fighterA.color}33 inset` }}>
            <div className={layout.SIDE_NAME_PLATE_CLASS} style={{ padding: '0.5rem', borderBottom: `1px solid ${fighterA.color}40`, background: `linear-gradient(90deg, ${fighterA.color}22, transparent)` }}>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">{common.blueCorner}</p>
              <FittedText
                as="p"
                slotKey={`final-summary:left-name:${fighterAName}`}
                spec={slots.heroName}
                text={fighterAName}
                className={layout.SIDE_NAME_TEXT_CLASS}
                style={{ color: fighterA.color, fontFamily: 'var(--font-display)', width: '100%', fontSize: '1.5rem' }}
              />
            </div>
            <div className={layout.PORTRAIT_FRAME_CLASS} style={{ flex: 1, position: 'relative' }}>
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

          <div className={layout.CENTER_FRAME_CLASS} style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={layout.VERDICT_PANEL_CLASS} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
              <p className={layout.VERDICT_LABEL_CLASS} style={{ color: '#94a3b8', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{common.verdictLabel}</p>
              <FittedText
                as="p"
                slotKey="final-summary:winner"
                spec={slots.summaryWinner}
                text={winnerLabel}
                className={layout.VERDICT_WINNER_CLASS}
                style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: '#fff' }}
              />
            </div>

            <div className={layout.SCORE_GRID_CLASS} style={{ display: 'flex', gap: '1rem' }}>
              <div className={layout.SCORE_CARD_CLASS} style={{ flex: 1, padding: '1rem', background: 'rgba(0,0,0,0.4)', border: `1px solid ${fighterA.color}40`, boxShadow: `0 0 0 1px ${fighterA.color}33 inset`, textAlign: 'center' }}>
                <FittedText
                  as="p"
                  slotKey={`final-summary:left-score-label:${fighterAName}`}
                  spec={slots.scoreLabel}
                  text={fighterAName}
                  className={layout.SIDE_NAME_TEXT_CLASS}
                  style={{ width: '100%', color: '#94a3b8', fontSize: '0.875rem' }}
                />
                <FittedText
                  as="p"
                  slotKey="final-summary:left-score"
                  spec={slots.scoreValue}
                  text={String(Math.round(averageA))}
                  className={layout.SCORE_VALUE_TEXT_CLASS}
                  style={{ color: fighterA.color, fontSize: '3rem', fontWeight: 'bold' }}
                />
              </div>
              <div className={layout.SCORE_CARD_CLASS} style={{ flex: 1, padding: '1rem', background: 'rgba(0,0,0,0.4)', border: `1px solid ${fighterB.color}40`, boxShadow: `0 0 0 1px ${fighterB.color}33 inset`, textAlign: 'center' }}>
                <FittedText
                  as="p"
                  slotKey={`final-summary:right-score-label:${fighterBName}`}
                  spec={slots.scoreLabel}
                  text={fighterBName}
                  className={layout.SIDE_NAME_TEXT_CLASS}
                  style={{ width: '100%', color: '#94a3b8', fontSize: '0.875rem' }}
                />
                <FittedText
                  as="p"
                  slotKey="final-summary:right-score"
                  spec={slots.scoreValue}
                  text={String(Math.round(averageB))}
                  className={layout.SCORE_VALUE_TEXT_CLASS}
                  style={{ color: fighterB.color, fontSize: '3rem', fontWeight: 'bold' }}
                />
              </div>
            </div>

            <div className={layout.SUMMARY_PANEL_CLASS} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(2, 6, 23, 0.5)', padding: '1rem', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">{common.summaryLabel}</p>
              <div className={layout.SUMMARY_LIST_CLASS} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                {summaryLines.map((item, index) => (
                  <div key={`summary-line-${index}-${item}`} className={layout.SUMMARY_ITEM_CLASS} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem' }}>
                    <FittedText
                      as="p"
                      slotKey={`final-summary:line:${index}`}
                      spec={slots.summaryLine}
                      text={`${index + 1}. ${item}`}
                      className={layout.SUMMARY_LINE_TEXT_CLASS}
                      style={{ color: '#e2e8f0', fontSize: '0.95rem' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {quoteText && (
              <div className={tokens.INTERPRETATION_QUOTE_CLASS} style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.5)', borderLeft: '4px solid #38bdf8', fontStyle: 'italic', color: '#cbd5e1' }}>
                <FittedText
                  as="p"
                  slotKey="final-summary:quote"
                  spec={slots.interpretationQuote}
                  text={quoteText}
                />
              </div>
            )}
          </div>

          <div className={layout.SIDE_FRAME_CLASS} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(2, 6, 23, 0.5)', border: '1px solid rgba(148, 163, 184, 0.2)', boxShadow: `0 0 0 1px ${fighterB.color}33 inset` }}>
            <div className={layout.SIDE_NAME_PLATE_CLASS} style={{ padding: '0.5rem', borderBottom: `1px solid ${fighterB.color}40`, background: `linear-gradient(-90deg, ${fighterB.color}22, transparent)`, textAlign: 'right' }}>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">{common.redCorner}</p>
              <FittedText
                as="p"
                slotKey={`final-summary:right-name:${fighterBName}`}
                spec={slots.heroName}
                text={fighterBName}
                className={layout.SIDE_NAME_TEXT_CLASS}
                style={{ color: fighterB.color, fontFamily: 'var(--font-display)', width: '100%', fontSize: '1.5rem' }}
              />
            </div>
            <div className={layout.PORTRAIT_FRAME_CLASS} style={{ flex: 1, position: 'relative' }}>
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

      <div className="vs-tactical-board25-reality">
        <p className="vs-tactical-board25-reality-heading" style={{ color: '#77e2f2' }}>{realityHeader}</p>
        <div className="vs-tactical-board25-reality-viewport">
          <AnimeLightning />
        </div>
      </div>
    </div>
  )
}
