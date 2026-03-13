import { buildCurvePolyline, findTemplateBlockLines, getPlainTemplateLines, parseCurveValues, parseTemplateFieldMap, pickTemplateField, TEMPLATE_BLOCK_ALIASES } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { FittedText } from '../../shared/FittedText'
import { HighEndTemplateHeader } from '../../shared/highEnd'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'

export function BattleDynamicsTemplate({
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const common = getFightCommonCopy('battle-dynamics', language)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['battle-dynamics'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome('battle-dynamics', language, blockFields)
  const ui = getTemplateUi('battle-dynamics', language)
  const shell = ui.highEnd as Record<string, string>
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string | number>
  const line = (position: number, keys: string[], fallback = common.emptyFieldLabel) =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle
  const phase1 = line(0, ['phase_1', 'phase1'])
  const phase2 = line(1, ['phase_2', 'phase2'])
  const phase3 = line(2, ['phase_3', 'phase3'])
  const analysisLine =
    pickTemplateField(blockFields, ['analysis', 'note', 'line_4', 'line4']) ||
    common.emptyFieldLabel
  const curveAValues = parseCurveValues(
    pickTemplateField(blockFields, ['a_curve', 'curve_a', 'blue_curve', 'left_curve']),
    [78, 64, 50, 32, 20],
  )
  const curveBValues = parseCurveValues(
    pickTemplateField(blockFields, ['b_curve', 'curve_b', 'red_curve', 'right_curve']),
    [35, 35, 35, 35, 35],
  )
  const yellowWaveValues = parseCurveValues(
    pickTemplateField(blockFields, ['yellow_wave', 'wave', 'chaos_wave']),
    [34, 36, 33, 35, 34, 36, 33, 35],
  )
  const curveA = buildCurvePolyline(curveAValues, 5, 96, 8, 41)
  const curveB = buildCurvePolyline(curveBValues, 5, 96, 8, 41)
  const yellowWave = buildCurvePolyline(yellowWaveValues, 5, 96, 8, 41)

  return (
    <div className={shell.HIGH_END_ROOT_CLASS}>
      <div className={shell.HIGH_END_PANEL_CLASS}>
        <div className={shell.HIGH_END_GRID_OVERLAY_CLASS} />
        <div className={layout.INNER_CLASS as string}>
          <HighEndTemplateHeader
            templateId="battle-dynamics"
            language={language}
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />

          <div className={`${layout.CHART_PANEL_CLASS as string} ${shell.HIGH_END_BODY_GAP_CLASS}`}>
            <div className={layout.CHART_OVERLAY_CLASS as string} />
            <svg viewBox={layout.SVG_VIEWBOX as string} className={layout.SVG_CLASS as string}>
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

              <text x={layout.ADVANTAGE_LABEL_X as string} y={layout.ADVANTAGE_LABEL_Y as string} fontSize={layout.ADVANTAGE_LABEL_FONT_SIZE as string} fill={layout.LABEL_FILL as string} fontWeight={layout.LABEL_WEIGHT as string} transform={layout.ADVANTAGE_LABEL_TRANSFORM as string}>
                {common.advantageStaminaLabel}
              </text>

              <line x1={layout.MIDLINE_X as string} y1={layout.GRID_Y1 as string} x2={layout.MIDLINE_X as string} y2={layout.GRID_Y2 as string} stroke={layout.MIDLINE_STROKE as string} strokeWidth={layout.MIDLINE_STROKE_WIDTH as string} strokeDasharray={layout.MIDLINE_DASHARRAY as string} />
              <polyline points={curveA.polyline} fill="none" stroke={layout.CURVE_A_GLOW as string} strokeWidth={layout.CURVE_A_GLOW_WIDTH as string} />
              <polyline points={curveA.polyline} fill="none" stroke={layout.CURVE_A_STROKE as string} strokeWidth={layout.CURVE_A_STROKE_WIDTH as string} />
              <polyline points={curveB.polyline} fill="none" stroke={layout.CURVE_B_GLOW as string} strokeWidth={layout.CURVE_B_GLOW_WIDTH as string} />
              <polyline points={curveB.polyline} fill="none" stroke={layout.CURVE_B_STROKE as string} strokeWidth={layout.CURVE_B_STROKE_WIDTH as string} />
              <polyline points={yellowWave.polyline} fill="none" stroke={layout.WAVE_STROKE as string} strokeWidth={layout.WAVE_STROKE_WIDTH as string} opacity={layout.WAVE_OPACITY as string} />

              {curveB.points.map((point, index) => (
                <circle key={`r-${index}-${point.x}`} cx={point.x} cy={point.y} r={layout.CURVE_POINT_R as string} fill={layout.CURVE_B_POINT_FILL as string} stroke={layout.CURVE_B_POINT_STROKE as string} strokeWidth={layout.CURVE_POINT_STROKE_WIDTH as string} />
              ))}
              {curveA.points.map((point, index) => (
                <circle key={`b-${index}-${point.x}`} cx={point.x} cy={point.y} r={layout.CURVE_POINT_R as string} fill={layout.CURVE_A_POINT_FILL as string} stroke={layout.CURVE_A_POINT_STROKE as string} strokeWidth={layout.CURVE_POINT_STROKE_WIDTH as string} />
              ))}
            </svg>

            <div className={layout.PHASE_GRID_CLASS as string}>
              <div className={layout.PHASE_CARD_A_CLASS as string}>
                <p className={layout.PHASE_LABEL_CLASS as string}>{common.phase1Label}</p>
                <FittedText
                  as="p"
                  slotKey="battle-dynamics:phase-1"
                  spec={slots.battleDynamicsPhase}
                  text={phase1}
                />
              </div>
              <div className={layout.PHASE_CARD_MID_CLASS as string}>
                <p className={layout.PHASE_LABEL_CLASS as string}>{common.phase2Label}</p>
                <FittedText
                  as="p"
                  slotKey="battle-dynamics:phase-2"
                  spec={slots.battleDynamicsPhase}
                  text={phase2}
                />
              </div>
              <div className={layout.PHASE_CARD_B_CLASS as string}>
                <p className={layout.PHASE_LABEL_CLASS as string}>{common.phase3Label}</p>
                <FittedText
                  as="p"
                  slotKey="battle-dynamics:phase-3"
                  spec={slots.battleDynamicsPhase}
                  text={phase3}
                />
              </div>
            </div>
          </div>

          <div className={layout.ANALYSIS_PANEL_CLASS as string}>
            <FittedText
              as="p"
              slotKey="battle-dynamics:analysis"
              spec={slots.battleDynamicsAnalysis}
              text={analysisLine}
              className={layout.ANALYSIS_TEXT_CLASS as string}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
