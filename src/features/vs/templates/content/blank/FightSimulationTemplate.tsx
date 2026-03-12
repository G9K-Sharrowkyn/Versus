import { FightScenarioCanvas } from '../../../components/FightScenarioCanvas'
import { buildFightTemplateChrome, getFightCommonCopy, getFightDefaultCategories, getFightTemplateDefaultField } from '../../../fightManifest'
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
import {
  HIGH_END_BODY_GAP_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HighEndTemplateHeader,
} from '../../shared/highEnd'
import { TEMPLATE_SLOT_SPECS } from '../../shared/templateSlotSpecs'

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
  const chrome = buildFightTemplateChrome(language, blockFields)
  const common = getFightCommonCopy(language)
  const categories = getFightDefaultCategories(language)
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
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full flex-col">
          <HighEndTemplateHeader
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />

          <div className={`${HIGH_END_BODY_GAP_CLASS} grid min-h-0 flex-1 grid-cols-3 items-stretch gap-3 rounded-md border border-cyan-300/25 bg-slate-950/68 p-3`}>
            {phaseData.map((phase, index) => (
              <div key={`phase-sim-${index}-${phase.title}`} className="flex min-h-[430px] min-w-0 flex-col overflow-hidden rounded-lg border border-slate-500/70 bg-slate-900/84 p-3">
                <div className="mb-2 flex items-center">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">{common.phaseLabel} {index + 1}</p>
                </div>
                <FittedText
                  as="p"
                  slotKey={`fight-simulation:title:${index}`}
                  spec={TEMPLATE_SLOT_SPECS.phaseTitle}
                  text={phase.title}
                  className="font-semibold text-slate-100"
                />

                <div className="mt-2 rounded-md border border-slate-600/70 bg-slate-950/75 p-2">
                  <FightScenarioCanvas
                    scenario={phase.animation}
                    variantToken={phase.animationVariantToken}
                    colorA={fighterA.color}
                    colorB={fighterB.color}
                    lead={phase.lead}
                  />
                  <div className="mt-1 flex items-center justify-between gap-2 rounded border border-slate-700/70 bg-slate-900/72 px-2 py-1">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{common.scenarioPresetLabel}</span>
                    <FittedText
                      as="span"
                      slotKey={`fight-simulation:scenario:${index}`}
                      spec={TEMPLATE_SLOT_SPECS.phaseScenarioLabel}
                      text={phase.animationLabel}
                      className="text-cyan-100"
                      style={{ width: '140px' }}
                    />
                  </div>
                </div>

                {phase.mode === 'bars' ? (
                  <div className="mt-2 flex min-h-0 flex-1 flex-col">
                    <FittedText
                      as="p"
                      slotKey={`fight-simulation:event:${index}`}
                      spec={TEMPLATE_SLOT_SPECS.phaseEvent}
                      text={phase.event}
                      className="text-slate-200"
                    />
                    <div className="mt-2 flex min-h-0 flex-1 items-stretch overflow-hidden">
                      <div className="flex w-full items-end justify-center gap-6 overflow-hidden rounded-md border border-slate-600/70 bg-slate-950/75 px-3 py-2">
                        {[
                          {
                            id: 'a',
                            label: phase.aLabel,
                            value: phase.aValue,
                            color: 'bg-[linear-gradient(180deg,#22d3ee,#1d4ed8)]',
                            textColor: 'text-sky-200',
                          },
                          {
                            id: 'b',
                            label: phase.bLabel,
                            value: phase.bValue,
                            color: 'bg-[linear-gradient(180deg,#fb7185,#b91c1c)]',
                            textColor: 'text-rose-200',
                          },
                        ].map((entry) => (
                          <div key={`phase-bar-${index}-${entry.id}`} className="flex h-full w-[42%] min-h-0 flex-col items-center justify-end overflow-hidden">
                            <FittedText
                              as="p"
                              slotKey={`fight-simulation:value:${index}:${entry.id}`}
                              spec={TEMPLATE_SLOT_SPECS.scoreValue}
                              text={String(Math.round(entry.value))}
                              className={`mb-1 font-semibold leading-none ${entry.textColor}`}
                            />
                            <div className="relative h-[132px] w-12 overflow-hidden rounded border border-slate-500/75 bg-slate-900/95">
                              <div className={`absolute bottom-0 left-0 right-0 ${entry.color}`} style={{ height: `${entry.value}%` }} />
                            </div>
                            <FittedText
                              as="p"
                              slotKey={`fight-simulation:label:${index}:${entry.id}`}
                              spec={TEMPLATE_SLOT_SPECS.scoreLabel}
                              text={entry.label}
                              className={`mt-1 ${entry.textColor}`}
                              style={{ width: '100%', textAlign: 'center' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-1 flex-col">
                    <FittedText
                      as="p"
                      slotKey={`fight-simulation:event:${index}`}
                      spec={TEMPLATE_SLOT_SPECS.phaseEvent}
                      text={phase.event}
                      className="text-slate-200"
                    />
                    <div className="mt-2 flex flex-1 flex-col rounded-md border border-slate-600/70 bg-slate-950/75 p-2">
                      <svg viewBox="0 0 100 40" className="h-20 w-full">
                        <line x1="50" y1="2" x2="50" y2="14" stroke="#94a3b8" strokeWidth="1.1" />
                        <line x1="50" y1="14" x2="22" y2="37" stroke="#22d3ee" strokeWidth="1.2" />
                        <line x1="50" y1="14" x2="78" y2="37" stroke="#fb7185" strokeWidth="1.2" />
                        <circle cx="50" cy="14" r="2.2" fill="#e2e8f0" />
                      </svg>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="rounded border border-cyan-300/45 bg-cyan-500/12 px-2 py-1.5 text-cyan-100">
                          <FittedText
                            as="p"
                            slotKey={`fight-simulation:branch-a:${index}`}
                            spec={TEMPLATE_SLOT_SPECS.phaseBranch}
                            text={phase.branchA}
                          />
                        </div>
                        <div className="rounded border border-rose-300/45 bg-rose-500/12 px-2 py-1.5 text-rose-100">
                          <FittedText
                            as="p"
                            slotKey={`fight-simulation:branch-b:${index}`}
                            spec={TEMPLATE_SLOT_SPECS.phaseBranch}
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

          <div className="mt-3 rounded-md border border-cyan-300/35 bg-slate-900/82 px-3 py-2 text-center text-slate-100">
            <FittedText
              as="p"
              slotKey="fight-simulation:end-condition"
              spec={TEMPLATE_SLOT_SPECS.endCondition}
              text={endCondition}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
