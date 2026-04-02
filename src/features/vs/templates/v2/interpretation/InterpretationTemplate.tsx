import './InterpretationTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, type ReactNode, type CSSProperties } from 'react'
import { AVERAGE_DRAW_THRESHOLD } from '../../../helpers'
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

type InterpretationTemplateProps = TemplatePreviewProps & {
  integratedToolbar?: ReactNode
}

const GLITCH_CHARS = '!@#$%^&Ă˘â€“â€Ă˘â€“â€śĂ˘â€“â€™Ă˘â€“ĹšĂ˘â€“ÂĂ˘â€˘Â Ă˘â€˘ĹĂ˘â€˘Â¦Ă˘â€˘Â¬Ă˘â€ťÄ˝Ă˘â€˘Â«ĂŽÂ©'.split('')

function SubtleCyberpunkLabel({ text }: { text: string }) {
  const [display, setDisplay] = useState(text)
  useEffect(() => {
    setDisplay(text)
  }, [text])
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

export function InterpretationTemplate({
  fighterA,
  fighterB,
  averageA,
  averageB,
  rows,
  title,
  subtitle,
  templateBlocks,
  activeFightId,
  language,
  onToggleLanguage,
  integratedToolbar,
}: InterpretationTemplateProps) {
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('interpretation', language, tacticalBlockFields)
  
  const realityHeader =
    getFightTemplateDefaultField('tactical-board', 'right_header', language)

  const common = getFightCommonCopy('interpretation', language)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES.interpretation || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const ui = getTemplateUi('interpretation', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const tokens = ui.tokens as Record<string, string>
  const layout = ui.template as Record<string, string | number>
  
  const line = (position: number, keys: string[], fallback = common.emptyFieldLabel) =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
    
  const headerText = title
  const subText = subtitle
  
  const boardHeader =
    getFightTemplateDefaultField('tactical-board', 'left_header', language) || common.emptyFieldLabel

  const fighterAFallback = getFightTemplateDefaultField('interpretation', 'fighter_a_fallback', language)
  const fighterBFallback = getFightTemplateDefaultField('interpretation', 'fighter_b_fallback', language)
  const drawBadgeLabel = getFightTemplateDefaultField('interpretation', 'draw_badge_label', language)
  const averageGap = Math.abs(averageA - averageB)
  const isAverageDraw = averageGap < AVERAGE_DRAW_THRESHOLD
  const leaderSide: 'a' | 'b' = averageA >= averageB ? 'a' : 'b'
  const leaderName = leaderSide === 'a' ? fighterA.name || fighterAFallback : fighterB.name || fighterBFallback
  const cardTitleText = isAverageDraw ? drawBadgeLabel : leaderName
  const leaderColor = isAverageDraw ? '#94a3b8' : leaderSide === 'a' ? fighterA.color : fighterB.color

  const edgeRows = [...rows]
    .map((row) => {
      const delta = isAverageDraw ? Math.abs(row.a - row.b) : leaderSide === 'a' ? row.a - row.b : row.b - row.a
      return { label: row.label.toUpperCase(), delta }
    })
    .filter((row) => row.delta > 0)
    .sort((left, right) => right.delta - left.delta)
    .slice(0, 5)

  const fallbackEdges = isAverageDraw
    ? [
        { label: getFightTemplateDefaultField('interpretation', 'fallback_draw_edge_1', language), delta: 0.8 },
        { label: getFightTemplateDefaultField('interpretation', 'fallback_draw_edge_2', language), delta: 0.7 },
        { label: getFightTemplateDefaultField('interpretation', 'fallback_draw_edge_3', language), delta: 0.6 },
      ]
    : [
        { label: getFightTemplateDefaultField('interpretation', 'fallback_lead_edge_1', language), delta: 4 },
        { label: getFightTemplateDefaultField('interpretation', 'fallback_lead_edge_2', language), delta: 3 },
        { label: getFightTemplateDefaultField('interpretation', 'fallback_lead_edge_3', language), delta: 2 },
      ]
  const bars = edgeRows.length ? edgeRows : fallbackEdges
  const formatDelta = (value: number) => (Number.isInteger(value) ? `${value}` : value.toFixed(1))
  const barGradient = isAverageDraw
    ? String(layout.BAR_GRADIENT_DRAW || 'linear-gradient(90deg, transparent, #94a3b8)')
    : leaderSide === 'a'
      ? String(layout.BAR_GRADIENT_A || `linear-gradient(90deg, transparent, ${fighterA.color})`)
      : String(layout.BAR_GRADIENT_B || `linear-gradient(90deg, transparent, ${fighterB.color})`)
      
  const auditPrefix = `${activeFightId || 'draft'}:interpretation`
  const maxDelta = Number(layout.BAR_MAX_DELTA || 20)
  const minFill = Number(layout.BAR_MIN_FILL || 20)
  const fillRange = Number(layout.BAR_FILL_RANGE || 80)

  const bullet1 = line(0, ['line_1', 'line1', 'thesis'])
  const bullet2 = line(1, ['line_2', 'line2', 'antithesis'])
  const bullet3 = line(2, ['line_3', 'line3', 'conclusion'])
  const closingQuote = pickTemplateField(blockFields, ['quote', 'line_4', 'line4']) || common.emptyFieldLabel
  const badgeSymbol = isAverageDraw ? '=' : 'V'

  // Glitch effect for title
  const headerTextStr = typeof headerText === 'string' ? headerText : ''
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

      <section className="vs-tactical-board25-stats">
        <p className="vs-tactical-board25-stats-title vs-panel-top-label" style={{ color: '#77e2f2' }}><GlitchText text={boardHeader} /></p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          <div className={`${layout.EDGE_PANEL_CLASS as string} flex-1`} style={{ display: 'flex', gap: '1rem', background: 'rgba(2, 6, 23, 0.5)', padding: '1rem', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <div className={layout.EDGE_PANEL_OVERLAY_CLASS as string} />
            <div className={layout.EDGE_PANEL_GRID_CLASS as string} style={{ display: 'flex', flex: 1, gap: '2rem', alignItems: 'center' }}>
              <div className={layout.BADGE_SHELL_CLASS as string} style={{ flex: '0 0 auto', padding: '1.5rem', border: `2px solid ${leaderColor}`, backgroundColor: `${leaderColor}1A`, textAlign: 'center', minWidth: '200px' }}>
                <div className={layout.BADGE_CARD_CLASS as string}>
                  <div className={layout.BADGE_SYMBOL_WRAP_CLASS as string} style={{ borderBottom: `1px solid ${leaderColor}`, color: leaderColor, fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {badgeSymbol}
                  </div>
                  <div className={layout.BADGE_TITLE_WRAP_CLASS as string}>
                    <FittedText
                      as="p"
                      slotKey={`${auditPrefix}:badge-title`}
                      spec={slots.interpretationBadge}
                      text={cardTitleText}
                      className={layout.BADGE_TITLE_CLASS as string}
                      style={{ color: leaderColor, fontFamily: 'var(--font-display)', fontSize: '1.5rem', textTransform: 'uppercase' }}
                      templateId="interpretation"
                      activeFightId={activeFightId}
                      language={language}
                    />
                  </div>
                </div>
              </div>

              <div className={layout.BAR_LIST_CLASS as string} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {bars.map((bar, index) => {
                  const normalizedDelta = Math.min(bar.delta, maxDelta) / maxDelta
                  const fillWidth = minFill + normalizedDelta * fillRange
                  const labelText = isAverageDraw ? `${bar.label} (d${formatDelta(bar.delta)})` : `${bar.label} (+${formatDelta(bar.delta)})`
                  return (
                    <div
                      key={`interp-bar-${index}-${bar.label}`}
                      className={layout.BAR_ROW_CLASS as string}
                      style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                    >
                      <div className={layout.BAR_TRACK_CLASS as string} style={{ flex: 1, height: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
                        <div className={layout.BAR_FILL_CLASS as string} style={{ width: `${fillWidth}%`, height: '100%', background: barGradient }} />
                      </div>
                      <FittedText
                        as="p"
                        slotKey={`${auditPrefix}:bar-${index}`}
                        spec={slots.interpretationBarLabel}
                        text={labelText}
                        className={tokens.INTERPRETATION_BAR_LABEL_CLASS}
                        style={{ width: '200px', color: '#e2e8f0', fontSize: '0.9rem' }}
                        templateId="interpretation"
                        activeFightId={activeFightId}
                        language={language}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className={layout.BULLET_PANEL_CLASS as string} style={{ background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderLeft: `4px solid ${leaderColor}`, border: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <ul className={tokens.INTERPRETATION_BULLET_LIST_CLASS} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ display: 'flex', gap: '1rem' }}>
                <span style={{ color: leaderColor }}>Ă˘â€“Ĺź</span>
                <FittedText
                  as="span"
                  slotKey={`${auditPrefix}:bullet-1`}
                  spec={slots.interpretationBullet}
                  text={bullet1}
                  style={{ color: '#f1f5f9', lineHeight: 1.5 }}
                  templateId="interpretation"
                  activeFightId={activeFightId}
                  language={language}
                />
              </li>
              <li style={{ display: 'flex', gap: '1rem' }}>
                <span style={{ color: leaderColor }}>Ă˘â€“Ĺź</span>
                <FittedText
                  as="span"
                  slotKey={`${auditPrefix}:bullet-2`}
                  spec={slots.interpretationBullet}
                  text={bullet2}
                  style={{ color: '#f1f5f9', lineHeight: 1.5 }}
                  templateId="interpretation"
                  activeFightId={activeFightId}
                  language={language}
                />
              </li>
              <li style={{ display: 'flex', gap: '1rem' }}>
                <span style={{ color: leaderColor }}>Ă˘â€“Ĺź</span>
                <FittedText
                  as="span"
                  slotKey={`${auditPrefix}:bullet-3`}
                  spec={slots.interpretationBullet}
                  text={bullet3}
                  style={{ color: '#f1f5f9', lineHeight: 1.5 }}
                  templateId="interpretation"
                  activeFightId={activeFightId}
                  language={language}
                />
              </li>
            </ul>
          </div>

          {closingQuote && closingQuote !== common.emptyFieldLabel && (
            <div className={tokens.INTERPRETATION_QUOTE_CLASS} style={{ padding: '1rem', fontStyle: 'italic', color: '#94a3b8', textAlign: 'center', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
              <FittedText
                as="p"
                slotKey={`${auditPrefix}:quote`}
                spec={slots.interpretationQuote}
                text={`"${closingQuote}"`}
                templateId="interpretation"
                activeFightId={activeFightId}
                language={language}
              />
            </div>
          )}
        </div>
      </section>

      <div className="vs-tactical-board25-reality">
        <p className="vs-tactical-board25-reality-heading vs-panel-top-label" style={{ color: '#77e2f2' }}><GlitchText text={realityHeader} /></p>
        <div className="vs-tactical-board25-reality-viewport">
          <AnimeLightning />
        </div>
      </div>
    </div>
  )
}
