import './StatTrapTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, type ReactNode, type CSSProperties } from 'react'
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

type StatTrapTemplateProps = TemplatePreviewProps & {
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

export function StatTrapTemplate({
  title,
  subtitle,
  templateBlocks,
  activeFightId,
  language,
  onToggleLanguage,
  integratedToolbar,
}: StatTrapTemplateProps) {
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)
  
  const realityHeader =
    pickTemplateField(tacticalBlockFields, ['right_header', 'reality_header']) ||
    getFightTemplateDefaultField('tactical-board', 'right_header', language)

  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['stat-trap'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const common = getFightCommonCopy('stat-trap', language)
  const ui = getTemplateUi('stat-trap', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const tokens = ui.tokens as Record<string, string | CSSProperties>
  const layout = ui.template as Record<string, string>
  
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle
  
  const boardHeader =
    pickTemplateField(blockFields, ['left_header', 'categories_header']) ||
    getFightTemplateDefaultField('tactical-board', 'left_header', language) || "STAT TRAP"

  const trapTop = pickTemplateField(blockFields, ['trap_top', 'top', 'line_1']) || common.emptyFieldLabel
  const trapBottom = pickTemplateField(blockFields, ['trap_bottom', 'bottom', 'line_2']) || common.emptyFieldLabel
  const example = pickTemplateField(blockFields, ['example', 'line_3']) || common.emptyFieldLabel
  const questionLine = pickTemplateField(blockFields, ['question', 'line_4', 'trap']) || common.emptyFieldLabel
  const auditPrefix = `${activeFightId || 'draft'}:stat-trap`

  const headerTextStr = typeof headerText === 'string' ? headerText : "TACTICAL BOARD"
  const chars = headerTextStr.split('')
  const [activeGlitches, setActiveGlitches] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (chars.length === 0) return

    const MAX_CONCURRENT = 3
    const activeState = new Set<number>()
    const timeouts = new Map<number, ReturnType<typeof setTimeout>>()
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
        <p className="vs-tactical-board25-stats-title vs-panel-top-label" style={{ color: '#77e2f2' }}><GlitchText text={boardHeader} /></p>
        
        <div className={layout.FRAME_CLASS} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(2, 6, 23, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', padding: '2rem', position: 'relative' }}>
          <div className={layout.HEADLINE_BAND_CLASS} style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', borderTop: '2px solid #ef4444', borderBottom: '2px solid #eab308', marginBottom: '2rem' }}>
            <div className={layout.HEADLINE_WRAP_CLASS} style={{ fontFamily: 'var(--font-display)', textAlign: 'center', fontSize: '2.5rem', lineHeight: 1.2 }}>
              <FittedText
                as="p"
                slotKey={`${auditPrefix}:top`}
                spec={slots.statTrapHeadline}
                text={trapTop}
                className={`${String(tokens.STAT_TRAP_HEADLINE_CLASS)} text-[#ef4444]`}
                templateId="stat-trap"
                activeFightId={activeFightId}
                language={language}
              />
              <FittedText
                as="p"
                slotKey={`${auditPrefix}:bottom`}
                spec={slots.statTrapHeadline}
                text={trapBottom}
                className={`${String(tokens.STAT_TRAP_HEADLINE_CLASS)} text-[#eab308]`}
                templateId="stat-trap"
                activeFightId={activeFightId}
                language={language}
              />
            </div>
          </div>

          <div className={layout.EXAMPLE_WRAP_CLASS} style={{ flex: 1, textAlign: 'center', padding: '0 2rem' }}>
            <FittedText
              as="p"
              slotKey={`${auditPrefix}:example`}
              spec={slots.statTrapExample}
              text={example}
              className={layout.EXAMPLE_TEXT_CLASS as string}
              style={{ fontFamily: 'var(--font-ui)', color: '#cbd5e1', fontSize: '1.2rem', lineHeight: 1.6, ...(tokens.STAT_TRAP_EXAMPLE_STYLE as CSSProperties) }}
              templateId="stat-trap"
              activeFightId={activeFightId}
              language={language}
            />
          </div>

          <div className={layout.ICON_WRAP_CLASS} style={{ position: 'absolute', opacity: 0.1, right: '2rem', bottom: '2rem', pointerEvents: 'none' }}>
            <svg
              viewBox={layout.ICON_VIEWBOX || "0 0 100 100"}
              className={`${String(tokens.STAT_TRAP_WARNING_ICON_CLASS)} ${layout.ICON_CLASS}`}
              aria-hidden="true"
              style={{ width: '150px', height: '150px' }}
            >
              <polygon
                points={layout.ICON_POLYGON_POINTS || "50,5 95,90 5,90"}
                fill={layout.ICON_POLYGON_FILL || "none"}
                stroke={layout.ICON_STROKE || "#fff"}
                strokeWidth={layout.ICON_STROKE_WIDTH || "4"}
                strokeLinejoin={layout.ICON_STROKE_JOIN as 'round' || "round"}
              />
              <line
                x1={layout.ICON_LINE_X1 || "50"}
                y1={layout.ICON_LINE_Y1 || "30"}
                x2={layout.ICON_LINE_X2 || "50"}
                y2={layout.ICON_LINE_Y2 || "65"}
                stroke={layout.ICON_STROKE || "#fff"}
                strokeWidth={layout.ICON_LINE_WIDTH || "6"}
                strokeLinecap={layout.ICON_LINE_CAP as 'round' || "round"}
              />
              <circle cx={layout.ICON_CIRCLE_CX || "50"} cy={layout.ICON_CIRCLE_CY || "80"} r={layout.ICON_CIRCLE_R || "4"} fill={layout.ICON_STROKE || "#fff"} />
            </svg>
          </div>

          <div className={layout.QUESTION_ROW_CLASS} style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderLeft: '4px solid #38bdf8', fontSize: '1.1rem' }}>
            <span className={layout.QUESTION_LABEL_CLASS} style={{ color: '#38bdf8', fontWeight: 'bold', marginRight: '0.5rem' }}>{common.keyQuestionLabel}</span>{' '}
            <FittedText
              as="span"
              slotKey={`${auditPrefix}:question`}
              spec={slots.statTrapQuestion}
              text={questionLine}
              style={{ fontFamily: 'var(--font-ui)', color: '#f8fafc', ...(tokens.STAT_TRAP_QUESTION_STYLE as CSSProperties) }}
              templateId="stat-trap"
              activeFightId={activeFightId}
              language={language}
            />
          </div>
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
