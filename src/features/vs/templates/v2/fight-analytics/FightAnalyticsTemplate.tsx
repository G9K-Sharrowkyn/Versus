import './FightAnalyticsTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, type CSSProperties, type ReactNode } from 'react'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { getTemplateUi } from '../../shared/templateUi'
import { CyberpunkMetaValue } from '../../../components/CyberpunkMetaValue'

type FightAnalyticsTemplateProps = TemplatePreviewProps & {
  integratedToolbar?: ReactNode
}

const GLITCH_CHARS = '!@#$%^&░▓▒▌▐╠╣╦╬┼╫Ω'.split('')

const DOSSIER_BLUE_PANEL_TEXT_STYLE: CSSProperties = {
  color: '#77e2f2',
  fontFamily: "'Chakra Petch', sans-serif",
  fontSize: 'calc(var(--tb-type-2) * 0.8)',
  fontWeight: 800,
  letterSpacing: '0.02em',
  lineHeight: 1,
  textTransform: 'uppercase',
  margin: 0,
  textShadow: '0 var(--tb-reflect-2-y, 1.7em) 0.55em rgba(119, 226, 242, 0.45)',
}

const DOSSIER_RED_PANEL_TEXT_STYLE: CSSProperties = {
  ...DOSSIER_BLUE_PANEL_TEXT_STYLE,
  color: '#ff554e',
  textShadow: '0 var(--tb-reflect-2-y, 1.7em) 0.48em rgba(255, 85, 78, 0.62)',
}

// Alignment knobs for manual fine-tuning (edit +/- px values here).
const TRACK_ALIGNMENT_SHIFT_PX = -12
const SCALE_ALIGNMENT_SHIFT_PX = -30
const VALUE_COLUMN_WIDTH_PX = 30
const SCALE_MARKS_OFFSET_Y_PX = 24
const SCALE_MARKS_GAP_PX = 300
const PARAMETER_LABEL_SHIFT_X_PX = -4
const ANALYTICS_RIGHT_HEADER_SHIFT_X_PX = -82
const ANALYTICS_STAT_LABEL_COL_WIDTH = '30ch'
const ANALYTICS_STAT_VALUE_COL_WIDTH = '7ch'
const ANALYTICS_STAT_COL_GAP = '0.4rem'
const ANALYTICS_STAT_ROW_TEMPLATE = `${ANALYTICS_STAT_LABEL_COL_WIDTH} ${ANALYTICS_STAT_VALUE_COL_WIDTH}`
const ANALYTICS_STAT_TRACK_WIDTH = `calc(${ANALYTICS_STAT_LABEL_COL_WIDTH} + ${ANALYTICS_STAT_COL_GAP} + ${ANALYTICS_STAT_VALUE_COL_WIDTH})`
const ANALYTICS_RIGHT_LABEL_START = '0.65rem'
const ANALYTICS_ACCENT_UNDERLINE_BG = 'linear-gradient(90deg, rgba(119,226,242,0) 0%, rgba(255,85,78,0.66) 18%, rgba(255,85,78,0.66) 82%, rgba(255,85,78,0) 100%)'

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

export function FightAnalyticsTemplate({
  rows,
  fighterA,
  fighterB,
  averageA,
  averageB,
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
  integratedToolbar,
}: FightAnalyticsTemplateProps) {
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)

  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['fight-analytics'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const common = getFightCommonCopy('fight-analytics', language)
  const ui = getTemplateUi('fight-analytics', language)
  const layout = ui.template as Record<string, string>
  
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle
  
  const boardHeader =
    pickTemplateField(blockFields, ['panel_header', 'analytics_header']) ||
    getFightTemplateDefaultField('fight-analytics', 'panel_header', language) ||
    (language === 'pl' ? 'Statystyki Postaci' : 'Character Statistics')

  const averageShort =
    getFightTemplateDefaultField('fight-analytics', 'average_short', language) || common.averageShort
  const parameterLabel =
    getFightTemplateDefaultField('fight-analytics', 'parameter_label', language) || common.parameterLabel
  const scoreScaleLabel =
    getFightTemplateDefaultField('fight-analytics', 'score_scale_label', language) || common.scoreScaleLabel
  const scaleMarks = ['0', '25', '50', '75', '100']

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
    <div className="vs-tactical-board25-surface vs-fight-analytics-surface">
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

      <section className="vs-tactical-board25-stats vs-fight-analytics-merged-panel" style={{ width: 'calc(var(--tb-panel-width) * 2 + var(--tb-center-gap))', display: 'flex', flexDirection: 'column', height: 'var(--tb-panel-height)' }}>
        <p className="vs-tactical-board25-stats-title vs-panel-top-label" style={{ color: '#ff554e' }}><GlitchText text={boardHeader} /></p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '32% 36% 32%', columnGap: '0.7rem', alignItems: 'flex-start' }}>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'flex-start', gap: '0.55rem' }}>
              <span style={DOSSIER_BLUE_PANEL_TEXT_STYLE}>{fighterA.name}</span>
              <p style={{ ...DOSSIER_BLUE_PANEL_TEXT_STYLE, textAlign: 'left' }}>
                {averageShort} {averageA.toFixed(1)}
              </p>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 0.16rem)', height: '1px', background: ANALYTICS_ACCENT_UNDERLINE_BG, pointerEvents: 'none' }} />
            </div>
            <div />
            <div style={{ display: 'flex', justifyContent: 'flex-end', transform: `translateX(${ANALYTICS_RIGHT_HEADER_SHIFT_X_PX}px)` }}>
              <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: ANALYTICS_STAT_ROW_TEMPLATE, columnGap: ANALYTICS_STAT_COL_GAP, alignItems: 'baseline', width: ANALYTICS_STAT_TRACK_WIDTH, marginLeft: 'auto' }}>
                <span style={{ ...DOSSIER_RED_PANEL_TEXT_STYLE, width: ANALYTICS_STAT_LABEL_COL_WIDTH, margin: 0, whiteSpace: 'nowrap', textAlign: 'left', paddingLeft: ANALYTICS_RIGHT_LABEL_START }}>
                  {fighterB.name}
                </span>
                <p style={{ ...DOSSIER_RED_PANEL_TEXT_STYLE, width: ANALYTICS_STAT_VALUE_COL_WIDTH, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {averageShort} {averageB.toFixed(1)}
                </p>
                <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 0.16rem)', height: '1px', background: ANALYTICS_ACCENT_UNDERLINE_BG, pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          <div className={layout.CONTENT_CLASS} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className={layout.HEADER_ROW_CLASS} style={{ display: 'flex', marginBottom: '0.65rem', alignItems: 'flex-end', gap: '1.1rem' }}>
              <div style={{ width: '22%' }}>
                <p style={{ ...DOSSIER_BLUE_PANEL_TEXT_STYLE, transform: `translateX(${PARAMETER_LABEL_SHIFT_X_PX}px)` }}>{parameterLabel}</p>
              </div>
              <div className={layout.SCALE_WRAP_CLASS} style={{ flex: 1, marginLeft: `${SCALE_ALIGNMENT_SHIFT_PX}px` }}>
                <div style={{ marginBottom: '0.3rem', textAlign: 'left' }}>
                  <span style={DOSSIER_BLUE_PANEL_TEXT_STYLE}>{scoreScaleLabel}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ flex: 1, position: 'relative', minHeight: '1.35rem' }}>
                    <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: 'rgba(148, 163, 184, 0.45)', transform: 'translateY(-50%)' }} />
                    <div
                      className={layout.SCALE_MARKS_CLASS}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                        alignItems: 'center',
                        columnGap: `${SCALE_MARKS_GAP_PX}px`,
                      }}
                    >
                      {scaleMarks.map((mark) => (
                        <span
                          key={`fight-analytics-scale-${mark}`}
                          style={{ ...DOSSIER_BLUE_PANEL_TEXT_STYLE, textAlign: 'center', transform: `translateY(${SCALE_MARKS_OFFSET_Y_PX}px)` }}
                        >
                          {mark}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ width: `${VALUE_COLUMN_WIDTH_PX}px`, flex: `0 0 ${VALUE_COLUMN_WIDTH_PX}px` }} />
                </div>
              </div>
            </div>
            
            <div className={layout.ROWS_WRAP_CLASS} style={{ overflow: 'visible', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 0, paddingTop: '2rem', paddingBottom: '2rem' }}>
              {rows.map((row, index) => (
                <div
                  key={`row-${row.id}`}
                  data-analytics-row="true"
                  data-analytics-row-index={index}
                  data-analytics-row-id={row.id}
                  style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
                >
                  <div
                    className={layout.ROW_CLASS}
                    style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', animationDelay: `${index * 0.04}s`, border: 'none', background: 'transparent', boxShadow: 'none', padding: 0, overflow: 'visible' }}
                  >
                    <p className={layout.ROW_LABEL_CLASS} style={{ ...DOSSIER_BLUE_PANEL_TEXT_STYLE, width: '22%', overflowWrap: 'anywhere' }}>
                      {row.label}
                    </p>
                    <div className={layout.BAR_GROUP_CLASS} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.28rem', marginLeft: `${TRACK_ALIGNMENT_SHIFT_PX}px` }}>
                      <div className={layout.BAR_ROW_CLASS} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div className={layout.BAR_TRACK_CLASS} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', height: '14px' }}>
                          <div className={layout.BAR_FILL_CLASS} style={{ width: `${row.a}%`, backgroundColor: fighterA.color, height: '100%' }} />
                        </div>
                        <span className={layout.BAR_VALUE_CLASS} style={{ ...DOSSIER_BLUE_PANEL_TEXT_STYLE, width: `${VALUE_COLUMN_WIDTH_PX}px`, textAlign: 'right' }}>{row.a}</span>
                      </div>
                      <div className={layout.BAR_ROW_CLASS} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div className={layout.BAR_TRACK_CLASS} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', height: '14px' }}>
                          <div className={layout.BAR_FILL_CLASS} style={{ width: `${row.b}%`, backgroundColor: fighterB.color, height: '100%' }} />
                        </div>
                        <span className={layout.BAR_VALUE_CLASS} style={{ ...DOSSIER_BLUE_PANEL_TEXT_STYLE, width: `${VALUE_COLUMN_WIDTH_PX}px`, textAlign: 'right' }}>{row.b}</span>
                      </div>
                    </div>
                  </div>
                  {index < rows.length - 1 ? (
                    <div data-analytics-separator-track="true" data-analytics-separator-index={index} style={{ marginTop: '1.05rem', marginBottom: '1.05rem' }}>
                      <div data-analytics-separator-bar="true" style={{ height: '2px', background: '#ff554e' }} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
