import './FightAnalyticsTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, type ReactNode } from 'react'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { FittedText } from '../../shared/FittedText'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'
import { CyberpunkMetaValue } from '../../../components/CyberpunkMetaValue'

type FightAnalyticsTemplateProps = TemplatePreviewProps & {
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

export function FightAnalyticsTemplate({
  rows,
  fighterA,
  fighterB,
  averageA,
  averageB,
  title,
  subtitle,
  templateBlocks,
  activeFightId,
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
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle
  
  const boardHeader =
    pickTemplateField(blockFields, ['panel_header', 'analytics_header']) ||
    getFightTemplateDefaultField('fight-analytics', 'panel_header', language) ||
    'ANALITYKA WALKI'

  const averageShort =
    getFightTemplateDefaultField('fight-analytics', 'average_short', language) || common.averageShort
  const parameterLabel =
    getFightTemplateDefaultField('fight-analytics', 'parameter_label', language) || common.parameterLabel
  const scoreScaleLabel =
    getFightTemplateDefaultField('fight-analytics', 'score_scale_label', language) || common.scoreScaleLabel
  const auditPrefix = `${activeFightId || 'draft'}:fight-analytics`
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
    <div className="vs-tactical-board25-surface">
      <div className="vs-tactical-board25-line" />
      {integratedToolbar ? <div className="vs-tactical-board25-toolbar">{integratedToolbar}</div> : null}

      <div className="vs-tactical-board25-meta">
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.threatLevelLabel} />: <span style={{ color: '#ff554e', textShadow: '0 0 12px rgba(255, 85, 78, 0.75), 0 0 22px rgba(255, 85, 78, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.threatLevelValue} /></span>
        </p>
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.dataIntegrityLabel} />: <span style={{ color: '#ff554e', textShadow: '0 0 12px rgba(255, 85, 78, 0.75), 0 0 22px rgba(255, 85, 78, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.dataIntegrityValue} /></span>
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

      <section className="vs-tactical-board25-stats" style={{ width: 'calc(var(--tb-panel-width) * 2 + var(--tb-center-gap))', display: 'flex', flexDirection: 'column', height: 'var(--tb-panel-height)' }}>
        <p className="vs-tactical-board25-stats-title vs-panel-top-label" style={{ color: '#ff554e' }}><GlitchText text={boardHeader} /></p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: fighterA.color, fontWeight: 'bold', fontSize: '1.42rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>{fighterA.name}</span>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{averageShort}</p>
                <p style={{ color: fighterA.color, fontWeight: 'bold', fontSize: '1.8rem' }}>{averageA.toFixed(1)}</p>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: fighterB.color, fontWeight: 'bold', fontSize: '1.42rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>{fighterB.name}</span>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{averageShort}</p>
                <p style={{ color: fighterB.color, fontWeight: 'bold', fontSize: '1.8rem' }}>{averageB.toFixed(1)}</p>
              </div>
            </div>
          </div>

          <div className={layout.CONTENT_CLASS} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className={layout.HEADER_ROW_CLASS} style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '1rem', marginBottom: '0.65rem', alignItems: 'flex-end' }}>
              <p>{parameterLabel}</p>
              <div className={layout.SCALE_WRAP_CLASS} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span>{scoreScaleLabel}</span>
                <div className={layout.SCALE_GRID_CLASS} style={{ width: '340px', position: 'relative', paddingBottom: '0.55rem' }}>
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: 'rgba(148, 163, 184, 0.45)', transform: 'translateY(-50%)' }} />
                  <div className={layout.SCALE_MARKS_CLASS} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', alignItems: 'center' }}>
                    {scaleMarks.map((mark) => (
                      <span key={`fight-analytics-scale-${mark}`} style={{ color: '#cbd5e1', fontSize: '0.86rem', textAlign: 'center' }}>
                        {mark}
                      </span>
                    ))}
                  </div>
                  <div />
                </div>
              </div>
            </div>
            
            <div className={layout.ROWS_WRAP_CLASS} style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.62rem', justifyContent: 'flex-end', paddingBottom: '0.25rem' }}>
              {rows.map((row, index) => (
                <div
                  key={`row-${row.id}`}
                  className={layout.ROW_CLASS}
                  style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', animationDelay: `${index * 0.04}s`, border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}
                >
                  <FittedText
                    as="div"
                    slotKey={`${auditPrefix}:row-label-${row.id}`}
                    spec={slots.parameterAdvantageValue}
                    text={row.label}
                    className={layout.ROW_LABEL_CLASS}
                    style={{ width: '22%', color: '#cbd5e1', fontSize: 'calc(var(--tb-type-3) * 0.88)', letterSpacing: '0.02em' }}
                    templateId="fight-analytics"
                    activeFightId={activeFightId}
                    language={language}
                  />
                  <div className={layout.BAR_GROUP_CLASS} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.28rem', marginLeft: '-0.75rem' }}>
                    <div className={layout.BAR_ROW_CLASS} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div className={layout.BAR_TRACK_CLASS} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', height: '14px' }}>
                        <div className={layout.BAR_FILL_CLASS} style={{ width: `${row.a}%`, backgroundColor: fighterA.color, height: '100%' }} />
                      </div>
                      <span className={layout.BAR_VALUE_CLASS} style={{ width: '34px', textAlign: 'right', color: fighterA.color, fontWeight: 'bold', fontSize: '0.95rem' }}>{row.a}</span>
                    </div>
                    <div className={layout.BAR_ROW_CLASS} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div className={layout.BAR_TRACK_CLASS} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', height: '14px' }}>
                        <div className={layout.BAR_FILL_CLASS} style={{ width: `${row.b}%`, backgroundColor: fighterB.color, height: '100%' }} />
                      </div>
                      <span className={layout.BAR_VALUE_CLASS} style={{ width: '34px', textAlign: 'right', color: fighterB.color, fontWeight: 'bold', fontSize: '0.95rem' }}>{row.b}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
