import './BattleDynamicsTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, type CSSProperties, type ReactNode } from 'react'
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

export function BattleDynamicsTemplate({
  title,
  subtitle,
  templateBlocks,
  fighterA,
  fighterB,
  activeFightId,
  activeFightFolderKey,
  language,
  onToggleLanguage,
  integratedToolbar,
}: BattleDynamicsTemplateProps) {
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('battle-dynamics', language, tacticalBlockFields)

  const common = getFightCommonCopy('battle-dynamics', language)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['battle-dynamics'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const ui = getTemplateUi('battle-dynamics', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string | number>
  
  const line = (position: number, keys: string[], fallback = common.emptyFieldLabel) =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
    
  const headerText = title
  const subText = subtitle
  
  const boardHeaderDefault =
    getFightTemplateDefaultField('battle-dynamics', 'panel_header', language) ||
    common.emptyFieldLabel

  const CURVE_POINT_COUNT = 4
  const defaultACurve = [78, 64, 50, 32]
  const defaultBCurve = [35, 35, 35, 35]
  const defaultYellow = [34, 36, 33, 35, 34, 36, 33, 35]
  const preserveCurvePoints = pickTemplateField(blockFields, ['preserve_curve_points', 'dense_curve', 'raw_curve_points']) === 'true'
  const normalizeCurvePointCount = (values: number[], fallback: number[]) => {
    if (preserveCurvePoints && values.length >= 2) return values
    if (values.length > CURVE_POINT_COUNT) {
      const maxIndex = values.length - 1
      return Array.from({ length: CURVE_POINT_COUNT }, (_, i) => {
        const sampleIndex = Math.round((i * maxIndex) / (CURVE_POINT_COUNT - 1))
        return values[sampleIndex]!
      })
    }
    const sliced = values.slice(0, CURVE_POINT_COUNT)
    if (sliced.length === CURVE_POINT_COUNT) return sliced
    const padValue = sliced.length ? sliced[sliced.length - 1]! : (fallback[fallback.length - 1] ?? 50)
    while (sliced.length < CURVE_POINT_COUNT) sliced.push(padValue)
    return sliced
  }
  const parseScenarioCurve = (raw: string, fallback: number[]) =>
    normalizeCurvePointCount(parseCurveValues(raw, fallback), fallback)

  const buildImmediateDropPolyline = (
    values: number[],
    xStart: number,
    xEnd: number,
    yTop: number,
    yBottom: number,
  ) => {
    const [first, ...rest] = values
    const hasImmediateDrop = Number.isFinite(first) && first > 0 && rest.length > 0 && rest.every((value) => value === 0)
    if (!hasImmediateDrop) return null
    const range = yBottom - yTop
    const startY = yBottom - ((first ?? 0) / 100) * range
    const dropX = xStart + (xEnd - xStart) * 0.02
    const polylinePoints = [
      { x: xStart, y: startY },
      { x: dropX, y: yBottom + 3 },
    ]
    return {
      points: [{ x: xStart, y: startY }],
      polyline: polylinePoints.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' '),
    }
  }

  const basePhase1 = line(0, ['phase_1', 'phase1'])
  const basePhase2 = line(1, ['phase_2', 'phase2'])
  const basePhase3 = line(2, ['phase_3', 'phase3'])
  const baseAnalysis = pickTemplateField(blockFields, ['analysis', 'note', 'line_4', 'line4']) || common.emptyFieldLabel

  const scenario1: ScenarioData = {
    label: pickTemplateField(blockFields, ['label', 's1_label']) || '',
    aCurveValues: parseScenarioCurve(pickTemplateField(blockFields, ['a_curve', 'curve_a', 'blue_curve', 'left_curve']), defaultACurve),
    bCurveValues: parseScenarioCurve(pickTemplateField(blockFields, ['b_curve', 'curve_b', 'red_curve', 'right_curve']), defaultBCurve),
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
      aCurveValues: parseScenarioCurve(aCurveRaw, defaultACurve),
      bCurveValues: parseScenarioCurve(pickTemplateField(blockFields, [`${p}b_curve`]), defaultBCurve),
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

  const stableScenarioScope =
    activeFightFolderKey?.trim() ||
    [fighterA.name, fighterB.name].map((value) => value.trim()).filter(Boolean).join('::') ||
    activeFightId ||
    'draft'
  const scopeKey = `${stableScenarioScope}:battle-dynamics`
  const [activeIndex, nextScenario] = useScopedCycleIndex(scopeKey, scenarios.length)
  const active = scenarios[activeIndex]!
  const panelHeaderRaw = active.label || boardHeaderDefault
  const panelSeparatorPattern = /\s*(?:\u00C2?\u00B7|,|\/|\|)\s*/g
  const panelHeader = panelHeaderRaw
    .replace(panelSeparatorPattern, ' - ')
    .replace(/\s*-\s*/g, ' - ')
    .trim()
  const stripTrailingPhaseDot = (label: string) => label.replace(/\.\s*$/, '')
  const phase1Label = stripTrailingPhaseDot(common.phase1Label)
  const phase2Label = stripTrailingPhaseDot(common.phase2Label)
  const phase3Label = stripTrailingPhaseDot(common.phase3Label)

  const curveA = buildImmediateDropPolyline(active.aCurveValues, 5, 96, 8, 41) || buildCurvePolyline(active.aCurveValues, 5, 96, 8, 41)
  const curveB = buildImmediateDropPolyline(active.bCurveValues, 5, 96, 8, 41) || buildCurvePolyline(active.bCurveValues, 5, 96, 8, 41)
  const axisX1 = Number(layout.AXIS_X1 as string) || 5
  const axisX2 = Number(layout.AXIS_X2 as string) || 96
  const axisYTop = Number(layout.AXIS_Y_TOP as string) || 8
  const axisYBottom = Number(layout.AXIS_Y_BOTTOM as string) || 41
  const chartClipId = `battle-dynamics-clip-${scopeKey.replace(/[^a-zA-Z0-9_-]/g, '-')}`
  const BLUE_TEXT_COLOR = '#77e2f2'
  const RED_LABEL_COLOR = '#ff554e'
  const BLUE_TEXT_REFLECTION = '0 var(--tb-reflect-2-y) 0.55em rgba(119, 226, 242, 0.45)'
  const RED_LABEL_REFLECTION = '0 var(--tb-reflect-2-y) 0.55em rgba(255, 85, 78, 0.45)'
  const slotAnalysis: TemplateSlotSpec = {
    ...slots.battleDynamicsAnalysis,
    baseFontPx: Math.max(slots.battleDynamicsAnalysis.baseFontPx, 36),
    minFontPx: Math.max(slots.battleDynamicsAnalysis.minFontPx, 19),
    lineHeight: 1.08,
    maxLines: Math.max(slots.battleDynamicsAnalysis.maxLines, 3),
    fitMode: 'shrink',
  }
  const slotPhase: TemplateSlotSpec = {
    ...slots.battleDynamicsPhase,
    baseFontPx: Math.max(slots.battleDynamicsPhase.baseFontPx, 32),
    minFontPx: Math.max(slots.battleDynamicsPhase.minFontPx, 16),
    lineHeight: 1.08,
    maxLines: Math.max(slots.battleDynamicsPhase.maxLines, 5),
    fitMode: 'shrink',
  }
  const phaseTextBaseStyle: CSSProperties = {
    color: BLUE_TEXT_COLOR,
    fontFamily: "'Chakra Petch', sans-serif",
    fontWeight: 700,
    letterSpacing: '0.01em',
    textShadow: BLUE_TEXT_REFLECTION,
    overflow: 'visible',
    paddingInline: '0.06em',
  }
  const analysisTextStyle: CSSProperties = {
    ...phaseTextBaseStyle,
    textAlign: 'center',
    paddingInline: '0.08em',
  }
  const basePointRadius = Number(layout.CURVE_POINT_R as string) || 0.56
  const pulsePointRadius = (basePointRadius * 1.45).toFixed(3)
  const pointRevealProgress = (index: number, total: number) => {
    if (total <= 1) return 0
    return (index / (total - 1)) * 0.96
  }

  // Glitch effect for title
  const headerTextStr = typeof headerText === 'string' ? headerText : ''
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

      <section className="vs-tactical-board25-stats vs-battle-dynamics-panel" style={{ width: 'calc(var(--tb-panel-width) * 2 + var(--tb-center-gap))', display: 'flex', flexDirection: 'column', height: 'var(--tb-panel-height)' }}>
        <p className="vs-tactical-board25-stats-title vs-panel-top-label" style={{ color: '#ff554e' }}><GlitchText text={panelHeader} /></p>

        <div className={`${layout.CHART_PANEL_CLASS as string} vs-battle-dynamics-chart-shell flex-1 flex flex-col`} style={{ padding: '0.2rem 0.5rem 0.5rem', position: 'relative', border: 'none', background: 'transparent', boxShadow: 'none' }}>
          {scenarios.length > 1 ? (
            <div className="vs-battle-dynamics-indicators vs-battle-dynamics-indicators--top-right">
              <p className="vs-battle-dynamics-indicators-ghost-label" aria-hidden="true">
                {panelHeader}
              </p>
              <div className="vs-battle-dynamics-indicators-dots">
                {scenarios.map((_, i) => (
                  <div
                    key={i}
                    className={`vs-battle-dynamics-indicator${i === activeIndex ? ' is-active' : ''}`}
                  />
                ))}
              </div>
            </div>
          ) : null}
          <svg
            viewBox={layout.SVG_VIEWBOX as string}
            className={`${(layout.SVG_CLASS as string).replace('h-[300px]', 'h-[380px]')} vs-battle-dynamics-chart${scenarios.length > 1 ? ' cursor-pointer' : ''}`}
            onClick={scenarios.length > 1 ? nextScenario : undefined}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '90%', height: 'auto', marginTop: '-5rem', marginInline: 'auto' }}
          >
            <defs>
              <marker id={layout.ARROW_MARKER_ID as string} markerWidth={layout.ARROW_MARKER_WIDTH as string} markerHeight={layout.ARROW_MARKER_HEIGHT as string} refX={layout.ARROW_REF_X as string} refY={layout.ARROW_REF_Y as string} orient="auto">
                <path d={layout.ARROW_MARKER_PATH as string} fill={layout.ARROW_FILL as string} />
              </marker>
              <clipPath id={chartClipId}>
                <rect x="0" y="0" width="100" height={axisYBottom} />
              </clipPath>
            </defs>

            {String(layout.GRID_Y_VALUES).split(',').map((y) => (
              <line key={`grid-y-${y}`} x1={layout.GRID_X1 as string} y1={y} x2={layout.GRID_X2 as string} y2={y} stroke={layout.GRID_STROKE as string} strokeWidth={layout.GRID_STROKE_WIDTH as string} />
            ))}
            {String(layout.GRID_X_VALUES).split(',').map((x) => (
              <line key={`grid-x-${x}`} x1={x} y1={layout.GRID_Y1 as string} x2={x} y2={layout.GRID_Y2 as string} stroke={layout.GRID_STROKE as string} strokeWidth={layout.GRID_STROKE_WIDTH as string} />
            ))}
            <g clipPath={`url(#${chartClipId})`}>
              <polyline className="vs-battle-dynamics-curve vs-battle-dynamics-curve--a-glow" points={curveA.polyline} fill="none" stroke={layout.CURVE_A_GLOW as string} strokeWidth={layout.CURVE_A_GLOW_WIDTH as string} pathLength={100} />
              <polyline className="vs-battle-dynamics-curve vs-battle-dynamics-curve--a" points={curveA.polyline} fill="none" stroke={layout.CURVE_A_STROKE as string} strokeWidth={layout.CURVE_A_STROKE_WIDTH as string} pathLength={100} />
              <polyline className="vs-battle-dynamics-curve vs-battle-dynamics-curve--b-glow" points={curveB.polyline} fill="none" stroke={layout.CURVE_B_GLOW as string} strokeWidth={layout.CURVE_B_GLOW_WIDTH as string} pathLength={100} />
              <polyline className="vs-battle-dynamics-curve vs-battle-dynamics-curve--b" points={curveB.polyline} fill="none" stroke={layout.CURVE_B_STROKE as string} strokeWidth={layout.CURVE_B_STROKE_WIDTH as string} pathLength={100} />
              {curveB.points.map((point, index) => (
                <circle
                  className="vs-battle-dynamics-point vs-battle-dynamics-point--b"
                  key={`r-${index}-${point.x}`}
                  cx={point.x}
                  cy={point.y}
                  r={layout.CURVE_POINT_R as string}
                  fill={layout.CURVE_B_POINT_FILL as string}
                  stroke={layout.CURVE_B_POINT_STROKE as string}
                  strokeWidth={layout.CURVE_POINT_STROKE_WIDTH as string}
                  opacity="0"
                >
                  <animate
                    attributeName="opacity"
                    dur="5s"
                    repeatCount="indefinite"
                    values="0;0;1;1;0"
                    keyTimes={`0;${pointRevealProgress(index, curveB.points.length).toFixed(4)};${Math.min(pointRevealProgress(index, curveB.points.length) + 0.002, 0.997).toFixed(4)};0.994;1`}
                  />
                  <animate
                    attributeName="r"
                    dur="5s"
                    repeatCount="indefinite"
                    values={`${basePointRadius};${basePointRadius};${pulsePointRadius};${basePointRadius};${basePointRadius}`}
                    keyTimes={`0;${pointRevealProgress(index, curveB.points.length).toFixed(4)};${Math.min(pointRevealProgress(index, curveB.points.length) + 0.028, 0.996).toFixed(4)};${Math.min(pointRevealProgress(index, curveB.points.length) + 0.07, 0.998).toFixed(4)};1`}
                  />
                </circle>
              ))}
              {curveA.points.map((point, index) => (
                <circle
                  className="vs-battle-dynamics-point vs-battle-dynamics-point--a"
                  key={`b-${index}-${point.x}`}
                  cx={point.x}
                  cy={point.y}
                  r={layout.CURVE_POINT_R as string}
                  fill={layout.CURVE_A_POINT_FILL as string}
                  stroke={layout.CURVE_A_POINT_STROKE as string}
                  strokeWidth={layout.CURVE_POINT_STROKE_WIDTH as string}
                  opacity="0"
                >
                  <animate
                    attributeName="opacity"
                    dur="5s"
                    repeatCount="indefinite"
                    values="0;0;1;1;0"
                    keyTimes={`0;${pointRevealProgress(index, curveA.points.length).toFixed(4)};${Math.min(pointRevealProgress(index, curveA.points.length) + 0.002, 0.997).toFixed(4)};0.994;1`}
                  />
                  <animate
                    attributeName="r"
                    dur="5s"
                    repeatCount="indefinite"
                    values={`${basePointRadius};${basePointRadius};${pulsePointRadius};${basePointRadius};${basePointRadius}`}
                    keyTimes={`0;${pointRevealProgress(index, curveA.points.length).toFixed(4)};${Math.min(pointRevealProgress(index, curveA.points.length) + 0.028, 0.996).toFixed(4)};${Math.min(pointRevealProgress(index, curveA.points.length) + 0.07, 0.998).toFixed(4)};1`}
                  />
                </circle>
              ))}
            </g>

            <line x1={axisX1} y1={axisYBottom} x2={axisX2} y2={axisYBottom} stroke={layout.AXIS_STROKE as string} strokeWidth={layout.AXIS_STROKE_WIDTH as string} markerEnd={`url(#${String(layout.ARROW_MARKER_ID)})`} />
            <line x1={axisX1} y1={axisYBottom} x2={axisX1} y2={axisYTop} stroke={layout.AXIS_STROKE as string} strokeWidth={layout.AXIS_STROKE_WIDTH as string} markerEnd={`url(#${String(layout.ARROW_MARKER_ID)})`} />
          </svg>

          <div className="vs-battle-dynamics-phase-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '0.28rem', marginTop: '-6rem' }}>
            <div className={`${layout.PHASE_GRID_CLASS as string} vs-battle-dynamics-phase-grid`} style={{ display: 'flex', gap: '0.56rem' }}>
              <div className={`${layout.PHASE_CARD_A_CLASS as string} vs-battle-dynamics-phase-card vs-battle-dynamics-phase-card--a`} style={{ flex: 1, padding: '0.5rem 0.46rem 0.42rem', border: 'none', background: 'transparent' }}>
                <div className="vs-battle-dynamics-phase-heading">
                  <p className={layout.PHASE_LABEL_CLASS as string} style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: 'var(--tb-type-3)', textTransform: 'uppercase', color: RED_LABEL_COLOR, marginBottom: '0.24rem', textShadow: RED_LABEL_REFLECTION, letterSpacing: '0.05em', lineHeight: 1 }}><GlitchText text={phase1Label} /></p>
                  <div className="vs-battle-dynamics-phase-underline" />
                </div>
                <FittedText
                  as="p"
                  slotKey={`battle-dynamics:phase-1:${activeIndex}`}
                  spec={slotPhase}
                  text={active.phase1}
                  style={phaseTextBaseStyle}
                />
              </div>
              <div className={`${layout.PHASE_CARD_MID_CLASS as string} vs-battle-dynamics-phase-card vs-battle-dynamics-phase-card--mid`} style={{ flex: 1, padding: '0.5rem 0.46rem 0.42rem', border: 'none', background: 'transparent' }}>
                <div className="vs-battle-dynamics-phase-heading">
                  <p className={layout.PHASE_LABEL_CLASS as string} style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: 'var(--tb-type-3)', textTransform: 'uppercase', color: RED_LABEL_COLOR, marginBottom: '0.24rem', textShadow: RED_LABEL_REFLECTION, letterSpacing: '0.05em', lineHeight: 1 }}><GlitchText text={phase2Label} /></p>
                  <div className="vs-battle-dynamics-phase-underline" />
                </div>
                <FittedText
                  as="p"
                  slotKey={`battle-dynamics:phase-2:${activeIndex}`}
                  spec={slotPhase}
                  text={active.phase2}
                  style={phaseTextBaseStyle}
                />
              </div>
              <div className={`${layout.PHASE_CARD_B_CLASS as string} vs-battle-dynamics-phase-card vs-battle-dynamics-phase-card--b`} style={{ flex: 1, padding: '0.5rem 0.46rem 0.42rem', border: 'none', background: 'transparent' }}>
                <div className="vs-battle-dynamics-phase-heading">
                  <p className={layout.PHASE_LABEL_CLASS as string} style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: 'var(--tb-type-3)', textTransform: 'uppercase', color: RED_LABEL_COLOR, marginBottom: '0.24rem', textShadow: RED_LABEL_REFLECTION, letterSpacing: '0.05em', lineHeight: 1 }}><GlitchText text={phase3Label} /></p>
                  <div className="vs-battle-dynamics-phase-underline" />
                </div>
                <FittedText
                  as="p"
                  slotKey={`battle-dynamics:phase-3:${activeIndex}`}
                  spec={slotPhase}
                  text={active.phase3}
                  style={phaseTextBaseStyle}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="vs-battle-dynamics-analysis-outside">
        <div className={`${layout.ANALYSIS_PANEL_CLASS as string} vs-battle-dynamics-analysis`} style={{ margin: 0, minHeight: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0.56rem 0.48rem 0.44rem', border: 'none', background: 'transparent' }}>
          <FittedText
            as="p"
            slotKey={`battle-dynamics:analysis:${activeIndex}`}
            spec={slotAnalysis}
            text={active.analysis}
            className={layout.ANALYSIS_TEXT_CLASS as string}
            style={analysisTextStyle}
          />
        </div>
      </div>

    </div>
  )
}
