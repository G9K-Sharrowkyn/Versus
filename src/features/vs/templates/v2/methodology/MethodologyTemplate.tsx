import './MethodologyTemplate.scss'
import { useState, useEffect, type ReactNode } from 'react'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { LightningCanvas } from '../../../components/LightningCanvas'
import { FittedText } from '../../shared/FittedText'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'
import { AnimeLightning } from '../../../components/AnimeLightning'
import { CyberpunkMetaValue } from '../../../components/CyberpunkMetaValue'

type MethodologyTemplateProps = TemplatePreviewProps & {
  integratedToolbar?: ReactNode
}

const GLITCH_CHARS = '!@#$%^&░▓▒▌▐╠╣╦╬┼╫Ω'.split('')
const METHODOLOGY_ITEM_COUNT = 6

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

export function MethodologyTemplate({
  activeTemplateId,
  rows,
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
  integratedToolbar,
}: MethodologyTemplateProps) {
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)
  
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES.methodology || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const chrome = buildFightTemplateChrome('methodology', language, blockFields)
  const common = getFightCommonCopy('methodology', language)
  const ui = getTemplateUi('methodology', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string | number>
  
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  
  const boardHeader =
    pickTemplateField(blockFields, ['left_header', 'categories_header']) ||
    getFightTemplateDefaultField('tactical-board', 'left_header', language) || "METHODOLOGY"
    
  const realityHeader =
    pickTemplateField(tacticalBlockFields, ['right_header', 'reality_header']) ||
    getFightTemplateDefaultField('tactical-board', 'right_header', language)

  const listLabel =
    pickTemplateField(blockFields, ['list_label']) ||
    getFightTemplateDefaultField('methodology', 'list_label', language)
  const realityLabel =
    pickTemplateField(blockFields, ['reality_label']) ||
    getFightTemplateDefaultField('methodology', 'reality_label', language)
  const linearLabel =
    pickTemplateField(blockFields, ['linear_label']) ||
    getFightTemplateDefaultField('methodology', 'linear_label', language)
  const chaosLabel =
    pickTemplateField(blockFields, ['chaos_label']) ||
    getFightTemplateDefaultField('methodology', 'chaos_label', language)
  const closingLabel =
    pickTemplateField(blockFields, ['closing_label']) ||
    getFightTemplateDefaultField('methodology', 'closing_label', language)
  const rowSource = rows.length
    ? rows
    : [{ id: 'fallback', label: common.baseline, a: 50, b: 50, delta: 0, winner: 'draw' as const }]
  const safeRows = Array.from({ length: METHODOLOGY_ITEM_COUNT }, (_, index) => rowSource[index]?.label || common.emptyFieldLabel)

  const splitX = Number(layout.SPLIT_X || 60)
  const linearStartX = Number(layout.LINEAR_START_X || 10)
  const chaosEndX = Number(layout.CHAOS_END_X || 90)
  const stablePoints = `${linearStartX},50 ${splitX},50`
  const linearLabelX = Number(layout.LINEAR_LABEL_X || 35)
  const chaosLabelX = Number(layout.CHAOS_LABEL_X || 75)

  const headerTextStr = typeof headerText === 'string' ? headerText : "TACTICAL BOARD"
  const chars = headerTextStr.split('')
  const [activeGlitches, setActiveGlitches] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (chars.length === 0) return

    const MAX_CONCURRENT = 3
    const activeState = new Set<number>()
    const timeouts = new Map<number, NodeJS.Timeout>()
    let isMounted = true

    const startGlitch = () => {
      if (!isMounted) return
      if (activeState.size >= MAX_CONCURRENT) return

      const available = []
      for (let i = 0; i < chars.length; i++) {
        if (!activeState.has(i) && chars[i] !== ' ') available.push(i)
      }
      if (available.length === 0) return

      const nextIndex = available[Math.floor(Math.random() * available.length)]
      activeState.add(nextIndex)
      setActiveGlitches(new Set(activeState))

      const duration = 2000 + Math.random() * 3000

      const timeoutId = setTimeout(() => {
        if (!isMounted) return
        activeState.delete(nextIndex)
        setActiveGlitches(new Set(activeState))
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
          <SubtleCyberpunkLabel text={tacticalChrome.threatLevelLabel} />: <span style={{ color: '#ff554e', textShadow: '0 0 10px rgba(255, 85, 78, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.threatLevelValue} /></span>
        </p>
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.dataIntegrityLabel} />: <span style={{ color: '#ff554e', textShadow: '0 0 10px rgba(255, 85, 78, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.dataIntegrityValue} /></span>
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
        
        <div className={layout.BODY_CLASS as string} style={{ display: 'flex', gap: '1.5rem', flex: 1 }}>
          <div className={layout.LIST_PANEL_CLASS as string} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(2, 6, 23, 0.5)', padding: '1.5rem', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <p className={layout.LIST_HEADER_CLASS as string} style={{ color: '#38bdf8', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', borderBottom: '1px solid rgba(56,189,248,0.3)', paddingBottom: '0.5rem' }}>{listLabel}</p>
            <div className={layout.LIST_GRID_CLASS as string} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
              {safeRows.map((label, index) => (
                <div key={`method-${index}`} className={layout.LIST_ITEM_CLASS as string} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '4px', borderLeft: '2px solid #38bdf8' }}>
                  <FittedText
                    as="p"
                    slotKey={`methodology:item:${index}`}
                    spec={slots.methodologyItem}
                    text={`${index + 1}. ${label}`}
                    className={layout.LIST_ITEM_TEXT_CLASS as string}
                    style={{ color: '#e2e8f0', fontSize: '1.1rem' }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className={layout.RIGHT_COLUMN_CLASS as string} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className={layout.REALITY_PANEL_CLASS as string} style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '1.5rem', border: '1px solid rgba(148, 163, 184, 0.2)', position: 'relative' }}>
              <p className={layout.REALITY_HEADER_CLASS as string} style={{ color: '#f472b6', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', borderBottom: '1px solid rgba(244,114,182,0.3)', paddingBottom: '0.5rem' }}>{realityLabel}</p>
              <div className={layout.REALITY_VIEWPORT_CLASS as string} style={{ position: 'relative', height: '150px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div className={layout.REALITY_CANVAS_CLASS as string} style={{ position: 'absolute', inset: 0 }}>
                  <LightningCanvas
                    startRatio={{ x: splitX / 100, y: 0.5 }}
                    endRatio={{ x: Math.min(1.34, chaosEndX / 100 + Number(layout.LIGHTNING_EXTENSION || 0)), y: 0.5 }}
                  />
                  <svg viewBox={layout.SVG_VIEWBOX as string || "0 0 100 100"} className={layout.SVG_CLASS as string} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 10 }}>
                    <line x1={splitX} y1={layout.DIVIDER_Y1 as string || "10"} x2={splitX} y2={layout.DIVIDER_Y2 as string || "90"} stroke={layout.DIVIDER_STROKE as string || "rgba(255,255,255,0.2)"} strokeWidth={layout.DIVIDER_STROKE_WIDTH as string || "1"} strokeDasharray={layout.DIVIDER_DASHARRAY as string || "2,2"} />
                    <text
                      x={linearLabelX}
                      y={layout.LINEAR_LABEL_Y as string || "20"}
                      fill={layout.LINEAR_LABEL_FILL as string || "#94a3b8"}
                      fontSize={layout.LABEL_FONT_SIZE as string || "6"}
                      fontFamily={layout.LABEL_FONT_FAMILY as string || "var(--font-ui)"}
                      fontWeight={layout.LABEL_FONT_WEIGHT as string || "bold"}
                      textAnchor={layout.LABEL_TEXT_ANCHOR as 'middle' || "middle"}
                      style={{ letterSpacing: layout.LABEL_LETTER_SPACING as string || "0.1em" }}
                    >
                      {linearLabel}
                    </text>
                    <text
                      x={chaosLabelX}
                      y={layout.CHAOS_LABEL_Y as string || "20"}
                      fill={layout.CHAOS_LABEL_FILL as string || "#f472b6"}
                      fontSize={layout.LABEL_FONT_SIZE as string || "6"}
                      fontFamily={layout.LABEL_FONT_FAMILY as string || "var(--font-ui)"}
                      fontWeight={layout.LABEL_FONT_WEIGHT as string || "bold"}
                      textAnchor={layout.LABEL_TEXT_ANCHOR as 'middle' || "middle"}
                      style={{ letterSpacing: layout.LABEL_LETTER_SPACING as string || "0.1em" }}
                    >
                      {chaosLabel}
                    </text>
                    <polyline points={stablePoints} fill="none" stroke={layout.STABLE_LINE_STROKE as string || "#94a3b8"} strokeWidth={layout.STABLE_LINE_WIDTH as string || "2"} />
                    <polyline points={stablePoints} fill="none" stroke={layout.GLOW_LINE_STROKE as string || "rgba(148,163,184,0.5)"} strokeWidth={layout.GLOW_LINE_WIDTH as string || "4"} />
                  </svg>
                </div>
              </div>
            </div>

            <div className={layout.CLOSING_CARD_CLASS as string} style={{ background: 'rgba(2, 6, 23, 0.8)', padding: '1.5rem', border: '1px dashed #38bdf8', textAlign: 'center', marginTop: 'auto' }}>
              <FittedText
                as="p"
                slotKey="methodology:closing-label"
                spec={slots.methodologyClosing}
                text={closingLabel}
                className={layout.CLOSING_TEXT_CLASS as string}
                style={{ color: '#38bdf8', fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.5rem' }}
              />
              <p className={layout.CLOSING_SUBTEXT_CLASS as string} style={{ color: '#cbd5e1', fontSize: '1.1rem', fontStyle: 'italic' }}>{subText}</p>
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
