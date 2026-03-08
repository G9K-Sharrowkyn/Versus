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
  pickLang,
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
import {
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_HEADER_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HIGH_END_SUBTEXT_CLASS,
} from '../../shared/highEnd'

export function FightSimulationTemplate({
  fighterA,
  fighterB,
  rows,
  title,
  subtitle,
  templateBlocks,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['fight-simulation'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const line = (position: number, keys: string[], fallback = '') =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const leftTopLabel = tr('Stopien zagrozenia', 'Threat level')
  const threatLevel = tr('ekstremalny', 'extreme')
  const leftBottomLabel = tr('Integralnosc danych', 'Data integrity')
  const integrity = '99.6%'
  const rightTopLabel = 'VersusVerseVault'
  const profileMode = '/assets/VS2.png'
  const rightBottomLabel = tr('Sygnatura marki', 'Brand mark')
  const scale = 'VersusVerseVault badge'
  const opening = line(0, ['opening'], tr('Opening: fast range control.', 'Opening: fast range control.'))
  const midFight = line(
    1,
    ['mid_fight', 'midfight'],
    tr('Mid fight: pressure and recovery loops.', 'Mid fight: pressure and recovery loops.'),
  )
  const lateFight = line(2, ['late_fight', 'latefight'], tr('Late fight: attrition checks.', 'Late fight: attrition checks.'))
  const endCondition = line(
    3,
    ['end_condition', 'endcondition'],
    tr('End condition: KO/BFR vs kill-only.', 'End condition: KO/BFR vs kill-only.'),
  )
  const fallbackRows = [rows[0], rows[1], rows[5] || rows[2]].filter(Boolean) as ScoreRow[]

  const phaseDefaults = [
    {
      mode: 'bars' as const,
      animation: 'orbit-harass' as FightScenarioId,
      lead: 'a' as FightScenarioLead,
      title: opening,
      aLabel: fallbackRows[0]?.label || 'Strength',
      bLabel: fallbackRows[0]?.label || 'Strength',
      aValue: fallbackRows[0]?.a ?? 96,
      bValue: fallbackRows[0]?.b ?? 84,
      event: tr(`${fighterA.name || 'Fighter A'} sets the pace.`, `${fighterA.name || 'Fighter A'} sets the pace.`),
      branchA: tr(`${fighterA.name || 'Fighter A'} keeps range control.`, `${fighterA.name || 'Fighter A'} keeps range control.`),
      branchB: tr(`${fighterB.name || 'Fighter B'} breaks the distance.`, `${fighterB.name || 'Fighter B'} breaks the distance.`),
    },
    {
      mode: 'split' as const,
      animation: 'clash-lock' as FightScenarioId,
      lead: 'a' as FightScenarioLead,
      title: midFight,
      aLabel: fallbackRows[1]?.label || 'Speed',
      bLabel: fallbackRows[1]?.label || 'Speed',
      aValue: fallbackRows[1]?.a ?? 92,
      bValue: fallbackRows[1]?.b ?? 88,
      event: tr('Turning point: first exchange shifts the conditions.', 'Turning point: first exchange shifts the conditions.'),
      branchA: tr(`${fighterA.name || 'Fighter A'} builds advantage with technique.`, `${fighterA.name || 'Fighter A'} builds advantage with technique.`),
      branchB: tr(`${fighterB.name || 'Fighter B'} forces chaos and attrition.`, `${fighterB.name || 'Fighter B'} forces chaos and attrition.`),
    },
    {
      mode: 'bars' as const,
      animation: 'regen-attrition' as FightScenarioId,
      lead: 'a' as FightScenarioLead,
      title: lateFight,
      aLabel: fallbackRows[2]?.label || 'Stamina',
      bLabel: fallbackRows[2]?.label || 'Stamina',
      aValue: fallbackRows[2]?.a ?? 90,
      bValue: fallbackRows[2]?.b ?? 93,
      event: tr('Final turning point.', 'Final turning point.'),
      branchA: tr(`${fighterA.name || 'Fighter A'} closes the fight by decision.`, `${fighterA.name || 'Fighter A'} closes the fight by decision.`),
      branchB: tr(`${fighterB.name || 'Fighter B'} breaks the rival late.`, `${fighterB.name || 'Fighter B'} breaks the rival late.`),
    },
  ]

  const globalModeToken = normalizeToken(
    pickTemplateField(blockFields, ['phase_mode', 'phasemode', 'mode', 'simulation_mode', 'simulationmode']),
  )

  const parsePhaseMode = (
    token: string,
    fallback: 'bars' | 'split' | 'animation',
  ): 'bars' | 'split' | 'animation' => {
    if (!token) return fallback
    if (token.includes('anim') || token.includes('scenario') || token.includes('preset')) return 'animation'
    if (token.includes('split') || token.includes('branch') || token.includes('turn') || token.includes('pivot')) return 'split'
    return 'bars'
  }

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
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 border-b border-cyan-300/25 pb-3 text-[11px] text-slate-300">
            <div className="min-w-[238px] space-y-1 pt-2 text-left">
              <p className="whitespace-nowrap uppercase tracking-[0.16em]">{leftTopLabel}: {threatLevel}</p>
              <p className="whitespace-nowrap uppercase tracking-[0.16em]">{leftBottomLabel}: {integrity}</p>
            </div>
            <div className="text-center">
              <h2 className={HIGH_END_HEADER_CLASS} style={{ fontFamily: 'var(--font-display)' }}>
                {headerText}
              </h2>
              {subText ? <p className={HIGH_END_SUBTEXT_CLASS}>{subText}</p> : null}
            </div>
            <div className="flex items-start justify-end pt-1">
  <div
    className="flex h-[86px] aspect-[755/322] items-center justify-center overflow-hidden rounded-[14px] border border-cyan-300/35 bg-[linear-gradient(180deg,rgba(7,24,42,0.96),rgba(4,14,24,0.94))] p-0 shadow-[0_0_0_1px_rgba(125,211,252,0.08)_inset,0_10px_26px_rgba(2,8,23,0.45)]"
    title={rightBottomLabel}
    aria-label={scale}
  >
    <img src={profileMode} alt={rightTopLabel} className="h-full w-full object-contain drop-shadow-[0_0_14px_rgba(251,146,60,0.28)]" draggable={false} />
  </div>
</div>
          </div>

          <div className="mt-2 grid min-h-0 flex-1 grid-cols-3 items-stretch gap-3 rounded-md border border-cyan-300/25 bg-slate-950/68 p-3">
            {phaseData.map((phase, index) => (
              <div key={`phase-sim-${index}-${phase.title}`} className="flex min-h-[430px] min-w-0 flex-col overflow-hidden rounded-lg border border-slate-500/70 bg-slate-900/84 p-3">
                <div className="mb-2 flex items-center">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">{tr('Faza', 'Phase')} {index + 1}</p>
                </div>
                <p className="text-[20px] font-semibold leading-tight text-slate-100">{phase.title}</p>

                <div className="mt-2 rounded-md border border-slate-600/70 bg-slate-950/75 p-2">
                  <FightScenarioCanvas
                    scenario={phase.animation}
                    variantToken={phase.animationVariantToken}
                    colorA={fighterA.color}
                    colorB={fighterB.color}
                    lead={phase.lead}
                  />
                  <div className="mt-1 flex items-center justify-between rounded border border-slate-700/70 bg-slate-900/72 px-2 py-1">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{tr('Preset scenariusza', 'Scenario preset')}</span>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-cyan-100">{phase.animationLabel}</span>
                  </div>
                </div>

                {phase.mode === 'bars' ? (
                  <div className="mt-2 flex min-h-0 flex-1 flex-col">
                    <p className="text-[13px] leading-snug text-slate-200">{phase.event}</p>
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
                            <p className={`mb-1 text-[15px] font-semibold leading-none ${entry.textColor}`}>{Math.round(entry.value)}</p>
                            <div className="relative h-[132px] w-12 overflow-hidden rounded border border-slate-500/75 bg-slate-900/95">
                              <div className={`absolute bottom-0 left-0 right-0 ${entry.color}`} style={{ height: `${entry.value}%` }} />
                            </div>
                            <p className={`mt-1 text-center text-[10px] uppercase leading-tight tracking-[0.1em] ${entry.textColor}`}>
                              {entry.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-1 flex-col">
                    <p className="text-sm leading-tight text-slate-200">{phase.event}</p>
                    <div className="mt-2 flex flex-1 flex-col rounded-md border border-slate-600/70 bg-slate-950/75 p-2">
                      <svg viewBox="0 0 100 40" className="h-20 w-full">
                        <line x1="50" y1="2" x2="50" y2="14" stroke="#94a3b8" strokeWidth="1.1" />
                        <line x1="50" y1="14" x2="22" y2="37" stroke="#22d3ee" strokeWidth="1.2" />
                        <line x1="50" y1="14" x2="78" y2="37" stroke="#fb7185" strokeWidth="1.2" />
                        <circle cx="50" cy="14" r="2.2" fill="#e2e8f0" />
                      </svg>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="rounded border border-cyan-300/45 bg-cyan-500/12 px-2 py-1.5 text-xs leading-tight text-cyan-100">{phase.branchA}</div>
                        <div className="rounded border border-rose-300/45 bg-rose-500/12 px-2 py-1.5 text-xs leading-tight text-rose-100">{phase.branchB}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-2 rounded-md border border-cyan-300/35 bg-slate-900/82 px-3 py-2 text-center text-[18px] text-slate-100">
            {endCondition}
          </div>
        </div>
      </div>
    </div>
  )
}

