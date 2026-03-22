import './FightSimulationTemplate.scss'
import { useState, useEffect, type ReactNode } from 'react'
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
import { AnimeLightning } from '../../../components/AnimeLightning'
import { CyberpunkMetaValue } from '../../../components/CyberpunkMetaValue'

type FightSimulationTemplateProps = TemplatePreviewProps & {
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

export function FightSimulationTemplate({
  activeTemplateId,
  fighterA,
  fighterB,
  rows,
  title,
  subtitle,
  templateBlocks,
  activeFightId,
  language,
  onToggleLanguage,
  integratedToolbar,
}: FightSimulationTemplateProps) {
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)
  
  const realityHeader =
    pickTemplateField(tacticalBlockFields, ['right_header', 'reality_header']) ||
    getFightTemplateDefaultField('tactical-board', 'right_header', language)

  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['fight-simulation'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome('fight-simulation', language, blockFields)
  const common = getFightCommonCopy('fight-simulation', language)
  const ui = getTemplateUi('fight-simulation', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  
  const boardHeader =
    pickTemplateField(blockFields, ['left_header', 'categories_header']) ||
    getFightTemplateDefaultField('tactical-board', 'left_header', language) || "FIGHT SIMULATION"

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

  const headerTextStr = typeof headerText === 'string' ? headerText : "TACTICAL BOARD"
  const chars = headerTextStr.split('')
  const [activeGlitches, setActiveGlitches] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (chars.length === 0) return

    const MAX_CONCURRENT = 3
    const activeState = new Set<number>()
    const timeouts = new Map<number, NodeJS.Timeout>()
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
          <SubtleCyberpunkLabel text={tacticalChrome.threatLevelLabel} />: <span style={{ color: '#77e2f2', textShadow: '0 var(--tb-reflect-3-y) var(--tb-reflect-4-blur) rgba(119, 226, 242, 0.2)' }}><CyberpunkMetaValue value={tacticalChrome.threatLevelValue} /></span>
        </p>
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.dataIntegrityLabel} />: <span style={{ color: '#77e2f2', textShadow: '0 var(--tb-reflect-3-y) var(--tb-reflect-4-blur) rgba(119, 226, 242, 0.2)' }}><CyberpunkMetaValue value={tacticalChrome.dataIntegrityValue} /></span>
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

      <section className="vs-tactical-board25-stats">
        <p className="vs-tactical-board25-stats-title" style={{ color: '#77e2f2' }}>{boardHeader}</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="mt-1 h-6 flex items-center justify-between gap-3 px-1" style={{ marginBottom: '1rem' }}>
            {scenarios.length > 1 && (
              <>
                <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  {active.label}
                </p>
                <div className="flex items-center gap-1.5" style={{ display: 'flex', gap: '0.5rem' }}>
                  {scenarios.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-200 ${i === activeIndex ? 'w-4 bg-cyan-300' : 'w-1.5 bg-slate-600'}`}
                      style={{ height: '6px', borderRadius: '9999px', width: i === activeIndex ? '16px' : '6px', backgroundColor: i === activeIndex ? '#67e8f9' : '#475569' }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className={layout.PHASES_PANEL_CLASS} style={{ display: 'flex', gap: '1rem', flex: 1 }}>
            {active.phases.map((phase, index) => (
              <div
                key={`phase-sim-${activeIndex}-${index}-${phase.title}`}
                className={`${layout.PHASE_CARD_CLASS}${scenarios.length > 1 ? ' cursor-pointer' : ''}`}
                onClick={scenarios.length > 1 ? nextScenario : undefined}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(2, 6, 23, 0.5)', border: '1px solid rgba(148, 163, 184, 0.2)', padding: '0.75rem', position: 'relative' }}
              >
                <div className={layout.PHASE_CARD_HEADER_CLASS} style={{ borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                  <p className={layout.PHASE_CARD_LABEL_CLASS} style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>{common.phaseLabel} {index + 1}</p>
                </div>
                <div style={{ minHeight: '3rem', marginBottom: '0.5rem' }}>
                  <FittedText
                    as="p"
                    slotKey={`fight-simulation:title:${activeIndex}:${index}`}
                    spec={slots.phaseTitle}
                    text={phase.title}
                    className={layout.PHASE_TITLE_CLASS}
                    style={{ fontSize: '1.2rem', color: '#fff', fontFamily: 'var(--font-display)' }}
                  />
                </div>

                <div className={layout.SCENARIO_PANEL_CLASS} style={{ position: 'relative', height: '140px', background: 'rgba(0,0,0,0.5)', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <FightScenarioCanvas
                    scenario={phase.animation}
                    variantToken={phase.animationVariantToken}
                    colorA={fighterA.color}
                    colorB={fighterB.color}
                    lead={phase.lead}
                  />
                  <div className={layout.SCENARIO_META_CLASS} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.25rem', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span className={layout.SCENARIO_META_LABEL_CLASS} style={{ color: '#94a3b8' }}>{common.scenarioPresetLabel}</span>
                    <FittedText
                      as="span"
                      slotKey={`fight-simulation:scenario:${activeIndex}:${index}`}
                      spec={slots.phaseScenarioLabel}
                      text={phase.animationLabel}
                      className={layout.SCENARIO_META_VALUE_CLASS}
                      style={{ color: '#38bdf8', maxWidth: '60%', textAlign: 'right' }}
                    />
                  </div>
                </div>

                {phase.mode === 'bars' ? (
                  <div className={layout.BARS_MODE_CLASS} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <FittedText
                      as="p"
                      slotKey={`fight-simulation:event:${activeIndex}:${index}`}
                      spec={slots.phaseEvent}
                      text={phase.event}
                      className={layout.EVENT_TEXT_CLASS}
                      style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '0.5rem', flex: 1 }}
                    />
                    <div className="mt-2 flex min-h-0 overflow-hidden rounded-md border border-slate-600/70 bg-slate-950/75 p-2" style={{ height: '80px', border: '1px solid rgba(148, 163, 184, 0.2)', background: 'rgba(2, 6, 23, 0.8)' }}>
                      <svg viewBox="0 0 100 49" className="w-full h-full" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
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
                  <div className={layout.SPLIT_MODE_CLASS} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <FittedText
                      as="p"
                      slotKey={`fight-simulation:event:${activeIndex}:${index}`}
                      spec={slots.phaseEvent}
                      text={phase.event}
                      className={layout.EVENT_TEXT_CLASS}
                      style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '0.5rem', flex: 1 }}
                    />
                    <div className={layout.SPLIT_PANEL_CLASS} style={{ position: 'relative', marginTop: 'auto', border: '1px solid rgba(148, 163, 184, 0.2)', background: 'rgba(2, 6, 23, 0.8)', padding: '0.5rem' }}>
                      <svg viewBox={layout.SPLIT_SVG_VIEWBOX || "0 0 200 80"} className={layout.SPLIT_SVG_CLASS} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}>
                        <line x1={layout.SPLIT_LINE_TOP_X1 || "100"} y1={layout.SPLIT_LINE_TOP_Y1 || "0"} x2={layout.SPLIT_LINE_TOP_X2 || "100"} y2={layout.SPLIT_LINE_TOP_Y2 || "20"} stroke={layout.SPLIT_LINE_TOP_STROKE || "rgba(255,255,255,0.2)"} strokeWidth={layout.SPLIT_LINE_TOP_WIDTH || "2"} />
                        <line x1={layout.SPLIT_BRANCH_A_X1 || "100"} y1={layout.SPLIT_BRANCH_A_Y1 || "20"} x2={layout.SPLIT_BRANCH_A_X2 || "50"} y2={layout.SPLIT_BRANCH_A_Y2 || "80"} stroke={layout.SPLIT_BRANCH_A_STROKE || "rgba(56,189,248,0.5)"} strokeWidth={layout.SPLIT_BRANCH_A_WIDTH || "2"} />
                        <line x1={layout.SPLIT_BRANCH_B_X1 || "100"} y1={layout.SPLIT_BRANCH_B_Y1 || "20"} x2={layout.SPLIT_BRANCH_B_X2 || "150"} y2={layout.SPLIT_BRANCH_B_Y2 || "80"} stroke={layout.SPLIT_BRANCH_B_STROKE || "rgba(244,63,94,0.5)"} strokeWidth={layout.SPLIT_BRANCH_B_WIDTH || "2"} />
                        <circle cx={layout.SPLIT_NODE_CX || "100"} cy={layout.SPLIT_NODE_CY || "20"} r={layout.SPLIT_NODE_R || "4"} fill={layout.SPLIT_NODE_FILL || "#fff"} />
                      </svg>
                      <div className={layout.BRANCH_GRID_CLASS} style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                        <div className={layout.BRANCH_A_CLASS} style={{ width: '45%', padding: '0.5rem', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', color: '#e0f2fe', fontSize: '0.8rem', textAlign: 'center' }}>
                          <FittedText
                            as="p"
                            slotKey={`fight-simulation:branch-a:${activeIndex}:${index}`}
                            spec={slots.phaseBranch}
                            text={phase.branchA}
                          />
                        </div>
                        <div className={layout.BRANCH_B_CLASS} style={{ width: '45%', padding: '0.5rem', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#ffe4e6', fontSize: '0.8rem', textAlign: 'center' }}>
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

          <div className={layout.END_CONDITION_CLASS} style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.5)', border: '1px dashed #67e8f9', textAlign: 'center', color: '#cffafe', fontStyle: 'italic' }}>
            <FittedText
              as="p"
              slotKey={`fight-simulation:end-condition:${activeIndex}`}
              spec={slots.endCondition}
              text={active.endCondition}
            />
          </div>
        </div>
      </section>

      <div className="vs-tactical-board25-reality">
        <p className="vs-tactical-board25-reality-heading" style={{ color: '#77e2f2' }}>{realityHeader}</p>
        <div className="vs-tactical-board25-reality-viewport">
          <AnimeLightning />
        </div>
      </div>
    </div>
  )
}
