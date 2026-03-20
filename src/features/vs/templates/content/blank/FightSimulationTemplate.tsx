import '../../shared/theme.css'
import { FightScenarioCanvas } from '../../../components/FightScenarioCanvas'
import {
  humanizeScenarioToken,
  normalizeToken,
  resolveFightScenarioLead,
  resolveFightScenarioSelection,
} from '../../../helpers'
import {
  FIGHT_SCENARIO_EXTENDED_LABELS_EN,
  fightScenarioLabel,
} from '../../../presets'
import {
  TEMPLATE_BLOCK_ALIASES,
  buildCurvePolyline,
  findTemplateBlockLines,
  getPlainTemplateLines,
  parsePercentValue,
  parseCurveValues,
  parseTemplateFieldMap,
  pickTemplateField,
} from '../../../importer'
import { useScopedCycleIndex } from '../../../hooks/useScopedCycleIndex'
import type { FightScenarioId, FightScenarioLead, ScoreRow, TemplatePreviewProps } from '../../../types'
import { FittedText } from '../../shared/FittedText'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getDefaultFightCategories as getFightDefaultCategories,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'

export function FightSimulationTemplate({
  fighterA,
  fighterB,
  rows,
  title,
  subtitle,
  templateBlocks,
  activeFightId,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['fight-simulation'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome('fight-simulation', language, blockFields)
  const common = getFightCommonCopy('fight-simulation', language)
  const ui = getTemplateUi('fight-simulation', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  const categories = getFightDefaultCategories('fight-simulation', language)
  const categoryLabel = (categoryId: string, fallback: string) =>
    categories.find((entry) => entry.id === categoryId)?.label || fallback
  const line = (position: number, keys: string[], fallback = common.emptyFieldLabel) =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle
  const baseOpening = line(0, ['opening'])
  const baseMidFight = line(1, ['mid_fight', 'midfight'])
  const baseLateFight = line(2, ['late_fight', 'latefight'])
  const baseEndCondition = line(3, ['end_condition', 'endcondition'])
  const fallbackRows = [rows[0], rows[1], rows[5] || rows[2]].filter(Boolean) as ScoreRow[]

  const parsePhaseMode = (
    token: string,
    fallback: 'bars' | 'split' | 'animation',
  ): 'bars' | 'split' | 'animation' => {
    if (!token) return fallback
    if (token.includes('anim') || token.includes('scenario') || token.includes('preset')) return 'animation'
    if (token.includes('split') || token.includes('branch') || token.includes('turn') || token.includes('pivot')) return 'split'
    return 'bars'
  }

  const templateDefault = (fieldKey: string, fallback = '') =>
    getFightTemplateDefaultField('fight-simulation', fieldKey, language) || fallback

  const defaultPhase1Lead = resolveFightScenarioLead(templateDefault('phase_1_actor', 'a'), 'a')
  const defaultPhase1Mode = parsePhaseMode(normalizeToken(templateDefault('phase_1_mode', 'bars')), 'bars')
  const defaultPhase2Lead = resolveFightScenarioLead(templateDefault('phase_2_actor', 'b'), 'b')
  const defaultPhase2Mode = parsePhaseMode(normalizeToken(templateDefault('phase_2_mode', 'split')), 'split')
  const defaultPhase3Mode = parsePhaseMode(normalizeToken(templateDefault('phase_3_mode', 'split')), 'split')

  const phaseDefaults = [
    {
      mode: defaultPhase1Mode,
      animation: 'orbit-harass' as FightScenarioId,
      lead: defaultPhase1Lead,
      title: baseOpening,
      aLabel: fallbackRows[0]?.label || categoryLabel('strength', 'Strength'),
      bLabel: fallbackRows[0]?.label || categoryLabel('strength', 'Strength'),
      aValue: fallbackRows[0]?.a ?? 96,
      bValue: fallbackRows[0]?.b ?? 84,
      event: common.emptyFieldLabel,
      branchA: common.emptyFieldLabel,
      branchB: common.emptyFieldLabel,
    },
    {
      mode: defaultPhase2Mode,
      animation: 'clash-lock' as FightScenarioId,
      lead: defaultPhase2Lead,
      title: baseMidFight,
      aLabel: fallbackRows[1]?.label || categoryLabel('speed', 'Speed'),
      bLabel: fallbackRows[1]?.label || categoryLabel('speed', 'Speed'),
      aValue: fallbackRows[1]?.a ?? 92,
      bValue: fallbackRows[1]?.b ?? 88,
      event: common.emptyFieldLabel,
      branchA: common.emptyFieldLabel,
      branchB: common.emptyFieldLabel,
    },
    {
      mode: defaultPhase3Mode,
      animation: 'regen-attrition' as FightScenarioId,
      lead: 'a' as FightScenarioLead,
      title: baseLateFight,
      aLabel: fallbackRows[2]?.label || categoryLabel('stamina', 'Stamina'),
      bLabel: fallbackRows[2]?.label || categoryLabel('stamina', 'Stamina'),
      aValue: fallbackRows[2]?.a ?? 90,
      bValue: fallbackRows[2]?.b ?? 93,
      event: common.emptyFieldLabel,
      branchA: common.emptyFieldLabel,
      branchB: common.emptyFieldLabel,
    },
  ]

  const globalModeToken = normalizeToken(
    pickTemplateField(blockFields, ['phase_mode', 'phasemode', 'mode', 'simulation_mode', 'simulationmode']),
  )
  const globalAnimationValue = pickTemplateField(blockFields, [
    'phase_animation', 'phaseanimation', 'animation', 'scenario', 'preset',
    'simulation_animation', 'simulationanimation',
  ])
  const globalAnimationSelection = resolveFightScenarioSelection(globalAnimationValue, phaseDefaults[0]?.animation || 'orbit-harass')
  const globalAnimationId = globalAnimationSelection.id
  const globalLeadValue = pickTemplateField(blockFields, ['phase_actor', 'phaseactor', 'actor', 'lead', 'aggressor', 'attacker'])
  const globalLead = resolveFightScenarioLead(globalLeadValue, phaseDefaults[0]?.lead || 'a')

  const buildScenarioData = (pfx: string) => {
    const pf = (keys: string[]): string => {
      if (pfx) {
        const v = pickTemplateField(blockFields, keys.map((k) => `${pfx}${k}`))
        if (v) return v
      }
      return pickTemplateField(blockFields, keys) ?? ''
    }

    const label = pfx
      ? pickTemplateField(blockFields, [`${pfx}label`]) || ''
      : pickTemplateField(blockFields, ['s1_label', 'label']) || ''
    const scenarioEndCondition = pf(['end_condition', 'endcondition']) || baseEndCondition

    const phases = [1, 2, 3].map((index) => {
      const defaults = phaseDefaults[index - 1]!
      const animValue = pf([`phase_${index}_animation`, `phase_${index}_scenario`, `phase_${index}_preset`])
        || (!pfx ? globalAnimationValue : '') || ''
      const animSelection = resolveFightScenarioSelection(animValue, defaults.animation)
      const phaseToken = normalizeToken(pf([`phase_${index}_token`, `phase_${index}_variant`]))
      const variantToken = [animSelection.variantToken, phaseToken].filter(Boolean).join(' ')
      const modeToken = normalizeToken(pf([`phase_${index}_mode`, `phase_${index}_type`]))
      const fallbackTitle = index === 1 ? baseOpening : index === 2 ? baseMidFight : baseLateFight

      return {
        mode: parsePhaseMode(modeToken || (!pfx ? globalModeToken : ''), defaults.mode),
        animation: animSelection.id,
        animationVariantToken: variantToken,
        animationLabel:
          animSelection.label ||
          (variantToken
            ? FIGHT_SCENARIO_EXTENDED_LABELS_EN[variantToken] || humanizeScenarioToken(variantToken)
            : fightScenarioLabel(animSelection.id, language)),
        lead: resolveFightScenarioLead(
          pf([`phase_${index}_actor`, `phase_${index}_lead`]) || (!pfx ? globalLeadValue : ''),
          defaults.lead || globalLead,
        ),
        title: pf([`phase_${index}_title`, `phase_${index}_headline`]) || fallbackTitle,
        aLabel: pf([`phase_${index}_a_label`, `phase_${index}_left_label`]) || defaults.aLabel,
        bLabel: pf([`phase_${index}_b_label`, `phase_${index}_right_label`]) || defaults.bLabel,
        aValue: parsePercentValue(pf([`phase_${index}_a_value`, `phase_${index}_left_value`]), defaults.aValue),
        bValue: parsePercentValue(pf([`phase_${index}_b_value`, `phase_${index}_right_value`]), defaults.bValue),
        event: pf([`phase_${index}_event`, `phase_${index}_turn`]) || defaults.event,
        branchA: pf([`phase_${index}_branch_a`, `phase_${index}_option_a`]) || defaults.branchA,
        branchB: pf([`phase_${index}_branch_b`, `phase_${index}_option_b`]) || defaults.branchB,
      }
    })

    return { label, endCondition: scenarioEndCondition, phases }
  }

  const s1 = buildScenarioData('')
  const scenarios = [s1]
  for (const n of [2, 3, 4]) {
    const pfx = `s${n}_`
    if (pickTemplateField(blockFields, [`${pfx}label`]) || pickTemplateField(blockFields, [`${pfx}phase_1_animation`])) {
      scenarios.push(buildScenarioData(pfx))
    }
  }

  const scopeKey = `${fighterA.name}::${fighterB.name}:fight-simulation`
  const [activeIndex, nextScenario] = useScopedCycleIndex(scopeKey, scenarios.length)
  const active = scenarios[activeIndex]!

  const bdLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['battle-dynamics'] || [])
  const bdFields = parseTemplateFieldMap(bdLines)
  const bdPrefix = activeIndex === 0 ? '' : `s${activeIndex + 1}_`
  const bdACurveRaw = (bdPrefix ? pickTemplateField(bdFields, [`${bdPrefix}a_curve`]) : null)
    ?? pickTemplateField(bdFields, ['a_curve', 'curve_a']) ?? ''
  const bdBCurveRaw = (bdPrefix ? pickTemplateField(bdFields, [`${bdPrefix}b_curve`]) : null)
    ?? pickTemplateField(bdFields, ['b_curve', 'curve_b']) ?? ''
  const miniCurveA = buildCurvePolyline(parseCurveValues(bdACurveRaw, [78, 64, 50, 32, 20]), 5, 96, 8, 41)
  const miniCurveB = buildCurvePolyline(parseCurveValues(bdBCurveRaw, [35, 35, 35, 35, 35]), 5, 96, 8, 41)

  return (
    <div className="vs-tpl-surface">
      <div className="vs-tpl-meta">
        <p>{chrome.threatLevelLabel}: <span>{chrome.threatLevelValue}</span></p>
        <p>{chrome.dataIntegrityLabel}: <span>{chrome.dataIntegrityValue}</span></p>
      </div>

      <div className="vs-tpl-heading">
        <h2 className="vs-tpl-title">{headerText}</h2>
        {subText ? <p className="vs-tpl-subtitle">{subText}</p> : null}
      </div>

      <button
        type="button"
        className="vs-tpl-logo"
        title={chrome.brandMarkTitle}
        aria-label={chrome.brandMarkAria}
        onClick={onToggleLanguage}
      >
        <img src={chrome.brandImageSrc} alt={chrome.brandAlt} draggable={false} />
        <img className="vs-tpl-logo-reflection" src={chrome.brandImageSrc} alt="" aria-hidden="true" draggable={false} />
      </button>

      <div className="vs-tpl-body">
        <div className="mt-1 h-6 flex items-center justify-between gap-3 px-1">
          {scenarios.length > 1 && (
            <>
              <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                {active.label}
              </p>
              <div className="flex items-center gap-1.5">
                {scenarios.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-200 ${i === activeIndex ? 'w-4 bg-cyan-300' : 'w-1.5 bg-slate-600'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className={layout.PHASES_PANEL_CLASS}>
          {active.phases.map((phase, index) => (
            <div
              key={`phase-sim-${activeIndex}-${index}-${phase.title}`}
              className={`${layout.PHASE_CARD_CLASS}${scenarios.length > 1 ? ' cursor-pointer' : ''}`}
              onClick={scenarios.length > 1 ? nextScenario : undefined}
            >
              <div className={layout.PHASE_CARD_HEADER_CLASS}>
                <p className={layout.PHASE_CARD_LABEL_CLASS}>{common.phaseLabel} {index + 1}</p>
              </div>
              <div style={{ minHeight: '2.5rem' }}>
                <FittedText
                  as="p"
                  slotKey={`fight-simulation:title:${activeIndex}:${index}`}
                  spec={slots.phaseTitle}
                  text={phase.title}
                  className={layout.PHASE_TITLE_CLASS}
                />
              </div>

              <div className={layout.SCENARIO_PANEL_CLASS}>
                <FightScenarioCanvas
                  scenario={phase.animation}
                  variantToken={phase.animationVariantToken}
                  colorA={fighterA.color}
                  colorB={fighterB.color}
                  lead={phase.lead}
                />
                <div className={layout.SCENARIO_META_CLASS}>
                  <span className={layout.SCENARIO_META_LABEL_CLASS}>{common.scenarioPresetLabel}</span>
                  <FittedText
                    as="span"
                    slotKey={`fight-simulation:scenario:${activeIndex}:${index}`}
                    spec={slots.phaseScenarioLabel}
                    text={phase.animationLabel}
                    className={layout.SCENARIO_META_VALUE_CLASS}
                    style={{ width: String(layout.SCENARIO_META_VALUE_WIDTH) }}
                  />
                </div>
              </div>

              {phase.mode === 'bars' ? (
                <div className={layout.BARS_MODE_CLASS}>
                  <FittedText
                    as="p"
                    slotKey={`fight-simulation:event:${activeIndex}:${index}`}
                    spec={slots.phaseEvent}
                    text={phase.event}
                    className={layout.EVENT_TEXT_CLASS}
                  />
                  <div className="mt-2 flex min-h-0 flex-1 overflow-hidden rounded-md border border-slate-600/70 bg-slate-950/75 p-2">
                    <svg viewBox="0 0 100 49" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                      {['10', '18', '26', '34'].map((y) => (
                        <line key={y} x1="5" y1={y} x2="96" y2={y} stroke="rgba(125,211,252,0.2)" strokeWidth="0.15" />
                      ))}
                      <line x1="5" y1="44" x2="96" y2="44" stroke="#cbd5e1" strokeWidth="0.3" />
                      <line x1="5" y1="44" x2="5" y2="5" stroke="#cbd5e1" strokeWidth="0.3" />
                      <polyline points={miniCurveA.polyline} fill="none" stroke="rgba(56,189,248,0.35)" strokeWidth="2.2" />
                      <polyline points={miniCurveA.polyline} fill="none" stroke="#0ea5e9" strokeWidth="1.2" />
                      <polyline points={miniCurveB.polyline} fill="none" stroke="rgba(244,63,94,0.4)" strokeWidth="2" />
                      <polyline points={miniCurveB.polyline} fill="none" stroke="#c81e3a" strokeWidth="1.1" />
                      {miniCurveA.points.map((pt, i) => (
                        <circle key={`a${i}`} cx={pt.x} cy={pt.y} r="0.9" fill="#0ea5e9" />
                      ))}
                      {miniCurveB.points.map((pt, i) => (
                        <circle key={`b${i}`} cx={pt.x} cy={pt.y} r="0.9" fill="#ef4444" />
                      ))}
                    </svg>
                  </div>
                </div>
              ) : (
                <div className={layout.SPLIT_MODE_CLASS}>
                  <FittedText
                    as="p"
                    slotKey={`fight-simulation:event:${activeIndex}:${index}`}
                    spec={slots.phaseEvent}
                    text={phase.event}
                    className={layout.EVENT_TEXT_CLASS}
                  />
                  <div className={layout.SPLIT_PANEL_CLASS}>
                    <svg viewBox={layout.SPLIT_SVG_VIEWBOX} className={layout.SPLIT_SVG_CLASS}>
                      <line x1={layout.SPLIT_LINE_TOP_X1} y1={layout.SPLIT_LINE_TOP_Y1} x2={layout.SPLIT_LINE_TOP_X2} y2={layout.SPLIT_LINE_TOP_Y2} stroke={layout.SPLIT_LINE_TOP_STROKE} strokeWidth={layout.SPLIT_LINE_TOP_WIDTH} />
                      <line x1={layout.SPLIT_BRANCH_A_X1} y1={layout.SPLIT_BRANCH_A_Y1} x2={layout.SPLIT_BRANCH_A_X2} y2={layout.SPLIT_BRANCH_A_Y2} stroke={layout.SPLIT_BRANCH_A_STROKE} strokeWidth={layout.SPLIT_BRANCH_A_WIDTH} />
                      <line x1={layout.SPLIT_BRANCH_B_X1} y1={layout.SPLIT_BRANCH_B_Y1} x2={layout.SPLIT_BRANCH_B_X2} y2={layout.SPLIT_BRANCH_B_Y2} stroke={layout.SPLIT_BRANCH_B_STROKE} strokeWidth={layout.SPLIT_BRANCH_B_WIDTH} />
                      <circle cx={layout.SPLIT_NODE_CX} cy={layout.SPLIT_NODE_CY} r={layout.SPLIT_NODE_R} fill={layout.SPLIT_NODE_FILL} />
                    </svg>
                    <div className={layout.BRANCH_GRID_CLASS}>
                      <div className={layout.BRANCH_A_CLASS}>
                        <FittedText
                          as="p"
                          slotKey={`fight-simulation:branch-a:${activeIndex}:${index}`}
                          spec={slots.phaseBranch}
                          text={phase.branchA}
                        />
                      </div>
                      <div className={layout.BRANCH_B_CLASS}>
                        <FittedText
                          as="p"
                          slotKey={`fight-simulation:branch-b:${activeIndex}:${index}`}
                          spec={slots.phaseBranch}
                          text={phase.branchB}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={layout.END_CONDITION_CLASS}>
          <FittedText
            as="p"
            slotKey={`fight-simulation:end-condition:${activeIndex}`}
            spec={slots.endCondition}
            text={active.endCondition}
          />
        </div>
      </div>
    </div>
  )
}
