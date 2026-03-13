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
  findTemplateBlockLines,
  getPlainTemplateLines,
  parsePercentValue,
  parseTemplateFieldMap,
  pickTemplateField,
} from '../../../importer'
import type { FightScenarioId, FightScenarioLead, ScoreRow, TemplatePreviewProps } from '../../../types'
import { FittedText } from '../../shared/FittedText'
import { HighEndTemplateHeader } from '../../shared/highEnd'
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
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['fight-simulation'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome('fight-simulation', language, blockFields)
  const common = getFightCommonCopy('fight-simulation', language)
  const ui = getTemplateUi('fight-simulation', language)
  const shell = ui.highEnd as Record<string, string>
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  const categories = getFightDefaultCategories('fight-simulation', language)
  const categoryLabel = (categoryId: string, fallback: string) =>
    categories.find((entry) => entry.id === categoryId)?.label || fallback
  const line = (position: number, keys: string[], fallback = common.emptyFieldLabel) =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle
  const opening = line(0, ['opening'])
  const midFight = line(1, ['mid_fight', 'midfight'])
  const lateFight = line(2, ['late_fight', 'latefight'])
  const endCondition = line(3, ['end_condition', 'endcondition'])
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
      title: opening,
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
      title: midFight,
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
      title: lateFight,
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
    'phase_animation',
    'phaseanimation',
    'animation',
    'scenario',
    'preset',
    'simulation_animation',
    'simulationanimation',
  ])
  const globalAnimationSelection = resolveFightScenarioSelection(globalAnimationValue, phaseDefaults[0]?.animation || 'orbit-harass')
  const globalAnimationId = globalAnimationSelection.id
  const globalLeadValue = pickTemplateField(blockFields, ['phase_actor', 'phaseactor', 'actor', 'lead', 'aggressor', 'attacker'])
  const globalLead = resolveFightScenarioLead(globalLeadValue, phaseDefaults[0]?.lead || 'a')

  const phaseMode = (index: number, fallback: 'bars' | 'split' | 'animation') => {
    const token = normalizeToken(
      pickTemplateField(blockFields, [
        `phase_${index}_mode`,
        `phase${index}mode`,
        `phase_${index}_type`,
        `phase${index}type`,
      ]),
    )
    return parsePhaseMode(token || globalModeToken, fallback)
  }

  const phaseAnimation = (index: number, fallback: FightScenarioId) => {
    const phaseAnimationValue =
      pickTemplateField(blockFields, [
        `phase_${index}_animation`,
        `phase${index}animation`,
        `phase_${index}_scenario`,
        `phase${index}scenario`,
        `phase_${index}_preset`,
        `phase${index}preset`,
      ]) || globalAnimationValue
    return resolveFightScenarioSelection(phaseAnimationValue, fallback || globalAnimationId)
  }

  const phaseLead = (index: number, fallback: FightScenarioLead) =>
    resolveFightScenarioLead(
      pickTemplateField(blockFields, [
        `phase_${index}_actor`,
        `phase${index}actor`,
        `phase_${index}_lead`,
        `phase${index}lead`,
        `phase_${index}_aggressor`,
        `phase${index}aggressor`,
        `phase_${index}_attacker`,
        `phase${index}attacker`,
      ]) || globalLeadValue,
      fallback || globalLead,
    )

  const phaseData = [1, 2, 3].map((index) => {
    const defaults = phaseDefaults[index - 1]
    const animationSelection = phaseAnimation(index, defaults.animation)
    return {
      mode: phaseMode(index, defaults.mode),
      animation: animationSelection.id,
      animationVariantToken: animationSelection.variantToken,
      animationLabel:
        animationSelection.label ||
        (animationSelection.variantToken
          ? FIGHT_SCENARIO_EXTENDED_LABELS_EN[animationSelection.variantToken] ||
            humanizeScenarioToken(animationSelection.variantToken)
          : fightScenarioLabel(animationSelection.id, language)),
      lead: phaseLead(index, defaults.lead),
      title:
        pickTemplateField(blockFields, [
          `phase_${index}_title`,
          `phase${index}title`,
          `phase_${index}_headline`,
          `phase${index}headline`,
        ]) || defaults.title,
      aLabel:
        pickTemplateField(blockFields, [
          `phase_${index}_a_label`,
          `phase${index}alabel`,
          `phase_${index}_left_label`,
          `phase${index}leftlabel`,
        ]) || defaults.aLabel,
      bLabel:
        pickTemplateField(blockFields, [
          `phase_${index}_b_label`,
          `phase${index}blabel`,
          `phase_${index}_right_label`,
          `phase${index}rightlabel`,
        ]) || defaults.bLabel,
      aValue: parsePercentValue(
        pickTemplateField(blockFields, [
          `phase_${index}_a_value`,
          `phase${index}avalue`,
          `phase_${index}_left_value`,
          `phase${index}leftvalue`,
        ]),
        defaults.aValue,
      ),
      bValue: parsePercentValue(
        pickTemplateField(blockFields, [
          `phase_${index}_b_value`,
          `phase${index}bvalue`,
          `phase_${index}_right_value`,
          `phase${index}rightvalue`,
        ]),
        defaults.bValue,
      ),
      event:
        pickTemplateField(blockFields, [
          `phase_${index}_event`,
          `phase${index}event`,
          `phase_${index}_turn`,
          `phase${index}turn`,
          `phase_${index}_pivot`,
          `phase${index}pivot`,
        ]) || defaults.event,
      branchA:
        pickTemplateField(blockFields, [
          `phase_${index}_branch_a`,
          `phase${index}brancha`,
          `phase_${index}_option_a`,
          `phase${index}optiona`,
          `phase_${index}_left_option`,
          `phase${index}leftoption`,
        ]) || defaults.branchA,
      branchB:
        pickTemplateField(blockFields, [
          `phase_${index}_branch_b`,
          `phase${index}branchb`,
          `phase_${index}_option_b`,
          `phase${index}optionb`,
          `phase_${index}_right_option`,
          `phase${index}rightoption`,
        ]) || defaults.branchB,
    }
  })

  return (
    <div className={shell.HIGH_END_ROOT_CLASS}>
      <div className={shell.HIGH_END_PANEL_CLASS}>
        <div className={shell.HIGH_END_GRID_OVERLAY_CLASS} />
        <div className={layout.INNER_CLASS}>
          <HighEndTemplateHeader
            templateId="fight-simulation"
            language={language}
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />

          <div className={`${shell.HIGH_END_BODY_GAP_CLASS} ${layout.PHASES_PANEL_CLASS}`}>
            {phaseData.map((phase, index) => (
              <div key={`phase-sim-${index}-${phase.title}`} className={layout.PHASE_CARD_CLASS}>
                <div className={layout.PHASE_CARD_HEADER_CLASS}>
                  <p className={layout.PHASE_CARD_LABEL_CLASS}>{common.phaseLabel} {index + 1}</p>
                </div>
                <FittedText
                  as="p"
                  slotKey={`fight-simulation:title:${index}`}
                  spec={slots.phaseTitle}
                  text={phase.title}
                  className={layout.PHASE_TITLE_CLASS}
                />

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
                      slotKey={`fight-simulation:scenario:${index}`}
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
                      slotKey={`fight-simulation:event:${index}`}
                      spec={slots.phaseEvent}
                      text={phase.event}
                      className={layout.EVENT_TEXT_CLASS}
                    />
                    <div className={layout.BARS_STAGE_WRAP_CLASS}>
                      <div className={layout.BARS_STAGE_CLASS}>
                        {[
                          {
                            id: 'a',
                            label: phase.aLabel,
                            value: phase.aValue,
                            color: layout.BAR_A_FILL_CLASS,
                            textColor: layout.BAR_A_TEXT_CLASS,
                          },
                          {
                            id: 'b',
                            label: phase.bLabel,
                            value: phase.bValue,
                            color: layout.BAR_B_FILL_CLASS,
                            textColor: layout.BAR_B_TEXT_CLASS,
                          },
                        ].map((entry) => (
                          <div key={`phase-bar-${index}-${entry.id}`} className={layout.BAR_COLUMN_CLASS}>
                            <FittedText
                              as="p"
                              slotKey={`fight-simulation:value:${index}:${entry.id}`}
                              spec={slots.scoreValue}
                              text={String(Math.round(entry.value))}
                              className={`${layout.BAR_VALUE_BASE_CLASS} ${entry.textColor}`}
                            />
                            <div className={layout.BAR_TRACK_CLASS}>
                              <div className={`absolute bottom-0 left-0 right-0 ${entry.color}`} style={{ height: `${entry.value}%` }} />
                            </div>
                            <FittedText
                              as="p"
                              slotKey={`fight-simulation:label:${index}:${entry.id}`}
                              spec={slots.scoreLabel}
                              text={entry.label}
                              className={`${layout.BAR_LABEL_BASE_CLASS} ${entry.textColor}`}
                              style={{ width: '100%', textAlign: 'center' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={layout.SPLIT_MODE_CLASS}>
                    <FittedText
                      as="p"
                      slotKey={`fight-simulation:event:${index}`}
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
                            slotKey={`fight-simulation:branch-a:${index}`}
                            spec={slots.phaseBranch}
                            text={phase.branchA}
                          />
                        </div>
                        <div className={layout.BRANCH_B_CLASS}>
                          <FittedText
                            as="p"
                            slotKey={`fight-simulation:branch-b:${index}`}
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
              slotKey="fight-simulation:end-condition"
              spec={slots.endCondition}
              text={endCondition}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
