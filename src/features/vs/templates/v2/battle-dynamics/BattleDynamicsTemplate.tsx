import './BattleDynamicsTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, type ReactNode } from 'react'
import { buildCurvePolyline, findTemplateBlockLines, getPlainTemplateLines, parseCurveValues, parseTemplateFieldMap, pickTemplateField, TEMPLATE_BLOCK_ALIASES } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { FittedText } from '../../shared/FittedText'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'
import { useScopedCycleIndex } from '../../../hooks/useScopedCycleIndex'
import { CyberpunkMetaValue } from '../../../components/CyberpunkMetaValue'

type BattleDynamicsTemplateProps = TemplatePreviewProps & {
  integratedToolbar?: ReactNode
}

type ScenarioData = {
  label: string
  aCurveValues: number[]
  bCurveValues: number[]
  yellowWaveValues: number[]
  phase1: string
  phase2: string
  phase3: string
  analysis: string
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

export function BattleDynamicsTemplate({
  title,
  subtitle,
  templateBlocks,
  activeFightId,
  language,
  onToggleLanguage,
  integratedToolbar,
}: BattleDynamicsTemplateProps) {
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)

  const common = getFightCommonCopy('battle-dynamics', language)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['battle-dynamics'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const ui = getTemplateUi('battle-dynamics', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string | number>
  
  const line = (position: number, keys: string[], fallback = common.emptyFieldLabel) =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
    
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle
  
  const boardHeader =
    pickTemplateField(blockFields, ['panel_header', 'dynamics_header']) ||
    getFightTemplateDefaultField('battle-dynamics', 'panel_header', language) || "DYNAMIKA WALKI"

  const defaultACurve = [78, 64, 50, 32, 20]
  const defaultBCurve = [35, 35, 35, 35, 35]
  const defaultYellow = [34, 36, 33, 35, 34, 36, 33, 35]

  const basePhase1 = line(0, ['phase_1', 'phase1'])
  const basePhase2 = line(1, ['phase_2', 'phase2'])
  const basePhase3 = line(2, ['phase_3', 'phase3'])
  const baseAnalysis = pickTemplateField(blockFields, ['analysis', 'note', 'line_4', 'line4']) || common.emptyFieldLabel

  const scenario1: ScenarioData = {
    label: pickTemplateField(blockFields, ['s1_label']) || '',
    aCurveValues: parseCurveValues(pickTemplateField(blockFields, ['a_curve', 'curve_a', 'blue_curve', 'left_curve']), defaultACurve),
    bCurveValues: parseCurveValues(pickTemplateField(blockFields, ['b_curve', 'curve_b', 'red_curve', 'right_curve']), defaultBCurve),
    yellowWaveValues: parseCurveValues(pickTemplateField(blockFields, ['yellow_wave', 'wave', 'chaos_wave']), defaultYellow),
    phase1: basePhase1,
    phase2: basePhase2,
    phase3: basePhase3,
    analysis: baseAnalysis,
  }

  const buildScenarioN = (n: number): ScenarioData | null => {
    const p = `s${n}_`
    const aCurveRaw = pickTemplateField(blockFields, [`${p}a_curve`])
    const label = pickTemplateField(blockFields, [`${p}label`]) || ''
    if (!aCurveRaw && !label) return null
    return {
      label,
      aCurveValues: parseCurveValues(aCurveRaw, defaultACurve),
      bCurveValues: parseCurveValues(pickTemplateField(blockFields, [`${p}b_curve`]), defaultBCurve),
      yellowWaveValues: parseCurveValues(pickTemplateField(blockFields, [`${p}yellow_wave`]), defaultYellow),
      phase1: pickTemplateField(blockFields, [`${p}phase_1`]) || basePhase1,
      phase2: pickTemplateField(blockFields, [`${p}phase_2`]) || basePhase2,
      phase3: pickTemplateField(blockFields, [`${p}phase_3`]) || basePhase3,
      analysis: pickTemplateField(blockFields, [`${p}analysis`]) || baseAnalysis,
    }
  }

  const scenarios: ScenarioData[] = [
    scenario1,
    ...[2, 3, 4].map(buildScenarioN).filter((s): s is ScenarioData => s !== null),
  ]

  const scopeKey = `${activeFightId || 'draft'}:battle-dynamics`
  const [activeIndex, nextScenario] = useScopedCycleIndex(scopeKey, scenarios.length)
  const active = scenarios[activeIndex]!

  const curveA = buildCurvePolyline(active.aCurveValues, 5, 96, 8, 41)
  const curveB = buildCurvePolyline(active.bCurveValues, 5, 96, 8, 41)

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

        <div className={`${layout.CHART_PANEL_CLASS as string} flex-1 flex flex-col`} style={{ padding: '0.5rem', position: 'relative', border: 'none', background: 'transparent', boxShadow: 'none' }}>
          <svg
            viewBox={layout.SVG_VIEWBOX as string}
            className={`${(layout.SVG_CLASS as string).replace('h-[300px]', 'h-[380px]')}${scenarios.length > 1 ? ' cursor-pointer' : ''}`}
            onClick={scenarios.length > 1 ? nextScenario : undefined}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height: 'auto' }}
          >
            <defs>
              <marker id={layout.ARROW_MARKER_ID as string} markerWidth={layout.ARROW_MARKER_WIDTH as string} markerHeight={layout.ARROW_MARKER_HEIGHT as string} refX={layout.ARROW_REF_X as string} refY={layout.ARROW_REF_Y as string} orient="auto">
                <path d={layout.ARROW_MARKER_PATH as string} fill={layout.ARROW_FILL as string} />
              </marker>
            </defs>

            {String(layout.GRID_Y_VALUES).split(',').map((y) => (
              <line key={`grid-y-${y}`} x1={layout.GRID_X1 as string} y1={y} x2={layout.GRID_X2 as string} y2={y} stroke={layout.GRID_STROKE as string} strokeWidth={layout.GRID_STROKE_WIDTH as string} />
            ))}
            {String(layout.GRID_X_VALUES).split(',').map((x) => (
              <line key={`grid-x-${x}`} x1={x} y1={layout.GRID_Y1 as string} x2={x} y2={layout.GRID_Y2 as string} stroke={layout.GRID_STROKE as string} strokeWidth={layout.GRID_STROKE_WIDTH as string} />
            ))}

            <line x1={layout.AXIS_X1 as string} y1={layout.AXIS_Y_BOTTOM as string} x2={layout.AXIS_X2 as string} y2={layout.AXIS_Y_BOTTOM as string} stroke={layout.AXIS_STROKE as string} strokeWidth={layout.AXIS_STROKE_WIDTH as string} markerEnd={`url(#${String(layout.ARROW_MARKER_ID)})`} />
            <line x1={layout.AXIS_X1 as string} y1={layout.AXIS_Y_BOTTOM as string} x2={layout.AXIS_X1 as string} y2={layout.AXIS_Y_TOP as string} stroke={layout.AXIS_STROKE as string} strokeWidth={layout.AXIS_STROKE_WIDTH as string} markerEnd={`url(#${String(layout.ARROW_MARKER_ID)})`} />

            <text x={layout.START_LABEL_X as string} y={layout.LABEL_Y as string} fontSize={layout.LABEL_FONT_SIZE as string} fill={layout.LABEL_FILL as string} fontWeight={layout.LABEL_WEIGHT as string}>
              {common.startLabel}
            </text>
            <text x={layout.MID_LABEL_X as string} y={layout.LABEL_Y as string} fontSize={layout.LABEL_FONT_SIZE as string} fill={layout.LABEL_FILL as string} fontWeight={layout.LABEL_WEIGHT as string}>
              {common.fightTimeLabel}
            </text>
            <text x={layout.END_LABEL_X as string} y={layout.LABEL_Y as string} fontSize={layout.LABEL_FONT_SIZE as string} fill={layout.LABEL_FILL as string} fontWeight={layout.LABEL_WEIGHT as string}>
              {common.endLabel}
            </text>

            <text x="7" y="24" fontSize={layout.ADVANTAGE_LABEL_FONT_SIZE as string} fill={layout.LABEL_FILL as string} fontWeight={layout.LABEL_WEIGHT as string}>
              {common.advantageStaminaLabel}
            </text>

            <line x1={layout.MIDLINE_X as string} y1={layout.GRID_Y1 as string} x2={layout.MIDLINE_X as string} y2={layout.GRID_Y2 as string} stroke={layout.MIDLINE_STROKE as string} strokeWidth={layout.MIDLINE_STROKE_WIDTH as string} strokeDasharray={layout.MIDLINE_DASHARRAY as string} />
            <polyline points={curveA.polyline} fill="none" stroke={layout.CURVE_A_GLOW as string} strokeWidth={layout.CURVE_A_GLOW_WIDTH as string} />
            <polyline points={curveA.polyline} fill="none" stroke={layout.CURVE_A_STROKE as string} strokeWidth={layout.CURVE_A_STROKE_WIDTH as string} />
            <polyline points={curveB.polyline} fill="none" stroke={layout.CURVE_B_GLOW as string} strokeWidth={layout.CURVE_B_GLOW_WIDTH as string} />
            <polyline points={curveB.polyline} fill="none" stroke={layout.CURVE_B_STROKE as string} strokeWidth={layout.CURVE_B_STROKE_WIDTH as string} />
            {curveB.points.map((point, index) => (
              <circle key={`r-${index}-${point.x}`} cx={point.x} cy={point.y} r={layout.CURVE_POINT_R as string} fill={layout.CURVE_B_POINT_FILL as string} stroke={layout.CURVE_B_POINT_STROKE as string} strokeWidth={layout.CURVE_POINT_STROKE_WIDTH as string} />
            ))}
            {curveA.points.map((point, index) => (
              <circle key={`b-${index}-${point.x}`} cx={point.x} cy={point.y} r={layout.CURVE_POINT_R as string} fill={layout.CURVE_A_POINT_FILL as string} stroke={layout.CURVE_A_POINT_STROKE as string} strokeWidth={layout.CURVE_POINT_STROKE_WIDTH as string} />
            ))}
          </svg>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className={layout.ANALYSIS_PANEL_CLASS as string} style={{ minHeight: '94px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0.5rem', border: 'none', background: 'transparent' }}>
              <p className="mb-1 min-h-[1.25rem] text-center text-[13px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                {scenarios.length > 1 && active.label ? active.label : ''}
              </p>
              <FittedText
                as="p"
                slotKey={`battle-dynamics:analysis:${activeIndex}`}
                spec={slots.battleDynamicsAnalysis}
                text={active.analysis}
                className={layout.ANALYSIS_TEXT_CLASS as string}
                style={{ textAlign: 'center', color: '#e2e8f0' }}
              />
              <div className="mt-1.5 h-[6px] flex justify-center gap-1.5" style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
                {scenarios.length > 1 && scenarios.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-200 ${i === activeIndex ? 'w-4 bg-cyan-300' : 'w-1.5 bg-slate-600'}`}
                    style={{ height: '6px', borderRadius: '9999px', width: i === activeIndex ? '16px' : '6px', backgroundColor: i === activeIndex ? '#67e8f9' : '#475569' }}
                  />
                ))}
              </div>
            </div>

            <div className={layout.PHASE_GRID_CLASS as string} style={{ display: 'flex', gap: '0.5rem' }}>
              <div className={layout.PHASE_CARD_A_CLASS as string} style={{ flex: 1, padding: '0.5rem', border: 'none', background: 'transparent' }}>
                <p className={layout.PHASE_LABEL_CLASS as string} style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#38bdf8', marginBottom: '0.25rem' }}>{common.phase1Label}</p>
                <FittedText
                  as="p"
                  slotKey={`battle-dynamics:phase-1:${activeIndex}`}
                  spec={slots.battleDynamicsPhase}
                  text={active.phase1}
                  style={{ fontSize: '1.05rem', color: '#e2e8f0' }}
                />
              </div>
              <div className={layout.PHASE_CARD_MID_CLASS as string} style={{ flex: 1, padding: '0.5rem', border: 'none', background: 'transparent' }}>
                <p className={layout.PHASE_LABEL_CLASS as string} style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.25rem' }}>{common.phase2Label}</p>
                <FittedText
                  as="p"
                  slotKey={`battle-dynamics:phase-2:${activeIndex}`}
                  spec={slots.battleDynamicsPhase}
                  text={active.phase2}
                  style={{ fontSize: '1.05rem', color: '#e2e8f0' }}
                />
              </div>
              <div className={layout.PHASE_CARD_B_CLASS as string} style={{ flex: 1, padding: '0.5rem', border: 'none', background: 'transparent' }}>
                <p className={layout.PHASE_LABEL_CLASS as string} style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#f87171', marginBottom: '0.25rem' }}>{common.phase3Label}</p>
                <FittedText
                  as="p"
                  slotKey={`battle-dynamics:phase-3:${activeIndex}`}
                  spec={slots.battleDynamicsPhase}
                  text={active.phase3}
                  style={{ fontSize: '1.05rem', color: '#e2e8f0' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
