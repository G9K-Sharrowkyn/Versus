import './FightSimulationTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, type ReactNode, type CSSProperties } from 'react'
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
  fighterA,
  fighterB,
  rows,
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
  integratedToolbar,
}: FightSimulationTemplateProps) {
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)

  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['fight-simulation'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const common = getFightCommonCopy('fight-simulation', language)
  const ui = getTemplateUi('fight-simulation', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  
  const boardHeader = 'standard rules, odinforce cleansing'

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
  const variantLabel = active.label || (activeIndex === 0 ? 'Standardowe Zasady' : 'Solar Flare')
  const BLUE_TEXT_COLOR = '#77e2f2'
  const RED_LABEL_COLOR = '#ff554e'
  const BLUE_TEXT_REFLECTION = '0 var(--tb-reflect-2-y) 0.55em rgba(119, 226, 242, 0.45)'
  const RED_LABEL_REFLECTION = '0 var(--tb-reflect-2-y) 0.55em rgba(255, 85, 78, 0.45)'
  const slotPhaseTitle: TemplateSlotSpec = {
    ...slots.phaseTitle,
    baseFontPx: Math.max(slots.phaseTitle.baseFontPx, 32),
    minFontPx: Math.max(slots.phaseTitle.minFontPx, 16),
    lineHeight: 1.06,
    maxLines: Math.max(slots.phaseTitle.maxLines, 3),
    fitMode: 'shrink',
  }
  const slotPhaseEvent: TemplateSlotSpec = {
    ...slots.phaseEvent,
    baseFontPx: Math.max(slots.phaseEvent.baseFontPx, 28),
    minFontPx: Math.max(slots.phaseEvent.minFontPx, 14),
    lineHeight: 1.08,
    maxLines: Math.max(slots.phaseEvent.maxLines, 4),
    fitMode: 'shrink',
  }
  const slotPhaseScenarioLabel: TemplateSlotSpec = {
    ...slots.phaseScenarioLabel,
    baseFontPx: Math.max(slots.phaseScenarioLabel.baseFontPx, 18),
    minFontPx: Math.max(slots.phaseScenarioLabel.minFontPx, 10),
    lineHeight: 1,
    maxLines: Math.max(slots.phaseScenarioLabel.maxLines, 2),
    fitMode: 'shrink',
  }
  const slotEndCondition: TemplateSlotSpec = {
    ...slots.endCondition,
    baseFontPx: Math.max(slots.endCondition.baseFontPx, 38),
    minFontPx: Math.max(slots.endCondition.minFontPx, 18),
    lineHeight: 1.14,
    maxLines: Math.max(slots.endCondition.maxLines, 2),
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
  const phaseTitleStyle: CSSProperties = {
    ...phaseTextBaseStyle,
  }
  const phaseEventStyle: CSSProperties = {
    ...phaseTextBaseStyle,
    marginBottom: '0.5rem',
    flex: 1,
  }
  const bdLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['battle-dynamics'] || [])
  const bdFields = parseTemplateFieldMap(bdLines)
  const bdPrefix = activeIndex === 0 ? '' : `s${activeIndex + 1}_`
  const bdACurveRaw = (bdPrefix ? pickTemplateField(bdFields, [`${bdPrefix}a_curve`]) : null)
    ?? pickTemplateField(bdFields, ['a_curve', 'curve_a']) ?? ''
  const bdBCurveRaw = (bdPrefix ? pickTemplateField(bdFields, [`${bdPrefix}b_curve`]) : null)
    ?? pickTemplateField(bdFields, ['b_curve', 'curve_b']) ?? ''
  const BD_CURVE_POINT_COUNT = 4
  const normalizeBdCurvePointCount = (values: number[], fallback: number[]) => {
    if (values.length > BD_CURVE_POINT_COUNT) {
      const maxIndex = values.length - 1
      return Array.from({ length: BD_CURVE_POINT_COUNT }, (_, i) => {
        const sampleIndex = Math.round((i * maxIndex) / (BD_CURVE_POINT_COUNT - 1))
        return values[sampleIndex]!
      })
    }
    const sliced = values.slice(0, BD_CURVE_POINT_COUNT)
    if (sliced.length === BD_CURVE_POINT_COUNT) return sliced
    const padValue = sliced.length ? sliced[sliced.length - 1]! : (fallback[fallback.length - 1] ?? 50)
    while (sliced.length < BD_CURVE_POINT_COUNT) sliced.push(padValue)
    return sliced
  }
  const miniCurveA = buildCurvePolyline(
    normalizeBdCurvePointCount(parseCurveValues(bdACurveRaw, [78, 64, 50, 32]), [78, 64, 50, 32]),
    5,
    96,
    8,
    41,
  )
  const miniCurveB = buildCurvePolyline(
    normalizeBdCurvePointCount(parseCurveValues(bdBCurveRaw, [35, 35, 35, 35]), [35, 35, 35, 35]),
    5,
    96,
    8,
    41,
  )

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

      <section className="vs-tactical-board25-stats vs-fight-simulation-panel" style={{ width: 'calc(var(--tb-panel-width) * 2 + var(--tb-center-gap))', display: 'flex', flexDirection: 'column', height: 'var(--tb-panel-height)' }}>
        <p className="vs-tactical-board25-stats-title vs-panel-top-label" style={{ color: '#ff554e' }}><GlitchText text={boardHeader} /></p>
        
        <div className="vs-fight-simulation-inner">
          <div className="vs-fight-simulation-top-row">
            <p className="vs-fight-simulation-variant-label">
              <GlitchText text={variantLabel} />
            </p>
            {scenarios.length > 1 && (
              <div className="vs-fight-simulation-scenario-controls">
                <p className="vs-fight-simulation-scenario-label">
                  <GlitchText text={active.label} />
                </p>
                <div className="vs-fight-simulation-indicators">
                  {scenarios.map((_, i) => (
                    <div
                      key={i}
                      className={`vs-fight-simulation-indicator${i === activeIndex ? ' is-active' : ''}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={`${layout.PHASES_PANEL_CLASS as string} vs-fight-simulation-phases`} style={{ display: 'flex', gap: '0.65rem', flex: 1, border: 'none', background: 'transparent', boxShadow: 'none', padding: 0, minHeight: 0 }}>
            {active.phases.map((phase, index) => {
              const visiblePoints = Math.max(2, Math.min(index + 2, miniCurveA.points.length, miniCurveB.points.length))
              const partialPointsA = miniCurveA.points.slice(0, visiblePoints)
              const partialPointsB = miniCurveB.points.slice(0, visiblePoints)
              const partialPolylineA = partialPointsA.map((pt) => `${pt.x},${pt.y}`).join(' ')
              const partialPolylineB = partialPointsB.map((pt) => `${pt.x},${pt.y}`).join(' ')
              return (
              <div
                key={`phase-sim-${activeIndex}-${index}-${phase.title}`}
                className={`${layout.PHASE_CARD_CLASS as string} vs-fight-simulation-phase-card vs-fight-simulation-phase-card--${index === 0 ? 'a' : index === 1 ? 'mid' : 'b'}${scenarios.length > 1 ? ' cursor-pointer' : ''}`}
                onClick={scenarios.length > 1 ? nextScenario : undefined}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0.48rem 0.34rem 0.36rem', position: 'relative', border: 'none', background: 'transparent', boxShadow: 'none', minHeight: 0 }}
              >
                <div className={`${layout.PHASE_CARD_HEADER_CLASS as string} vs-fight-simulation-phase-heading`}>
                  <p
                    className={layout.PHASE_CARD_LABEL_CLASS as string}
                    style={{
                      fontFamily: "'Chakra Petch', sans-serif",
                      fontSize: 'var(--tb-type-3)',
                      textTransform: 'uppercase',
                      color: RED_LABEL_COLOR,
                      marginBottom: '0.24rem',
                      textShadow: RED_LABEL_REFLECTION,
                      letterSpacing: '0.05em',
                      lineHeight: 1,
                    }}
                  >
                    <GlitchText text={`${common.phaseLabel} ${index + 1}`} />
                  </p>
                  <div className="vs-fight-simulation-phase-underline" />
                </div>
                <div style={{ minHeight: '3rem', marginBottom: '0.5rem' }}>
                  <FittedText
                    as="p"
                    slotKey={`fight-simulation:title:${activeIndex}:${index}`}
                    spec={slotPhaseTitle}
                    text={phase.title}
                    className={`${layout.PHASE_TITLE_CLASS as string} vs-fight-simulation-phase-title`}
                    style={phaseTitleStyle}
                  />
                </div>

                <div className="vs-fight-simulation-scenario-wrap" style={{ position: 'relative', height: '140px', marginBottom: '0.65rem', border: 'none', background: 'transparent', boxShadow: 'none' }}>
                  <FightScenarioCanvas
                    scenario={phase.animation}
                    variantToken={phase.animationVariantToken}
                    colorA={fighterA.color}
                    colorB={fighterB.color}
                    lead={phase.lead}
                  />
                  <div className={`${layout.SCENARIO_META_CLASS as string} vs-fight-simulation-scenario-meta`} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.2rem 0.15rem', background: 'transparent', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 85, 78, 0.4)' }}>
                    <span
                      className={`${layout.SCENARIO_META_LABEL_CLASS as string} vs-fight-simulation-scenario-meta-label`}
                      style={{
                        color: RED_LABEL_COLOR,
                        fontFamily: "'Chakra Petch', sans-serif",
                        fontSize: 'var(--tb-type-5)',
                        fontWeight: 700,
                        lineHeight: 1,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        textShadow: RED_LABEL_REFLECTION,
                      }}
                    >
                      <GlitchText text={common.scenarioPresetLabel} />
                    </span>
                    <FittedText
                      as="span"
                      slotKey={`fight-simulation:scenario:${activeIndex}:${index}`}
                      spec={slotPhaseScenarioLabel}
                      text={phase.animationLabel}
                      className={`${layout.SCENARIO_META_VALUE_CLASS as string} vs-fight-simulation-scenario-meta-value`}
                      style={{ ...phaseTextBaseStyle, maxWidth: '60%', textAlign: 'right' }}
                    />
                  </div>
                </div>

                <div className={`${layout.BARS_MODE_CLASS as string} vs-fight-simulation-bars-mode`} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <FittedText
                    as="p"
                    slotKey={`fight-simulation:event:${activeIndex}:${index}`}
                    spec={slotPhaseEvent}
                    text={phase.event}
                    className={`${layout.EVENT_TEXT_CLASS as string} vs-fight-simulation-event`}
                    style={phaseEventStyle}
                  />
                  <div className="vs-fight-simulation-bars-chart-wrap mt-2 flex min-h-0 overflow-hidden p-2" style={{ height: '290px' }}>
                    <svg viewBox="0 0 100 49" className="vs-fight-simulation-bars-chart w-full h-full" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
                      {['10', '18', '26', '34'].map((y) => (
                        <line key={y} x1="5" y1={y} x2="96" y2={y} stroke="rgba(125,211,252,0.2)" strokeWidth="0.15" />
                      ))}
                      <line x1="5" y1="44" x2="96" y2="44" stroke="#cbd5e1" strokeWidth="0.3" />
                      <line x1="5" y1="44" x2="5" y2="5" stroke="#cbd5e1" strokeWidth="0.3" />
                      <polyline className="vs-fight-simulation-mini-curve vs-fight-simulation-mini-curve--a-glow" points={partialPolylineA} fill="none" stroke="rgba(56,189,248,0.35)" strokeWidth="2.2" />
                      <polyline className="vs-fight-simulation-mini-curve vs-fight-simulation-mini-curve--a" points={partialPolylineA} fill="none" stroke="#0ea5e9" strokeWidth="1.2" />
                      <polyline className="vs-fight-simulation-mini-curve vs-fight-simulation-mini-curve--b-glow" points={partialPolylineB} fill="none" stroke="rgba(244,63,94,0.4)" strokeWidth="2" />
                      <polyline className="vs-fight-simulation-mini-curve vs-fight-simulation-mini-curve--b" points={partialPolylineB} fill="none" stroke="#c81e3a" strokeWidth="1.1" />
                      {partialPointsA.map((pt, i) => (
                        <circle className="vs-fight-simulation-mini-point vs-fight-simulation-mini-point--a" key={`a${index}-${i}`} cx={pt.x} cy={pt.y} r="0.9" fill="#0ea5e9" />
                      ))}
                      {partialPointsB.map((pt, i) => (
                        <circle className="vs-fight-simulation-mini-point vs-fight-simulation-mini-point--b" key={`b${index}-${i}`} cx={pt.x} cy={pt.y} r="0.9" fill="#ef4444" />
                      ))}
                    </svg>
                  </div>
                </div>
              </div>
              )
            })}
          </div>

          <div className={`${layout.END_CONDITION_CLASS as string} vs-fight-simulation-end`} style={{ marginTop: '0.55rem', padding: '0.55rem 0.4rem 0.2rem', border: 'none', background: 'transparent', textAlign: 'center', color: '#cffafe', fontStyle: 'italic' }}>
            <FittedText
              as="p"
              slotKey={`fight-simulation:end-condition:${activeIndex}`}
              spec={slotEndCondition}
              text={active.endCondition}
              style={{
                color: RED_LABEL_COLOR,
                textShadow: RED_LABEL_REFLECTION,
                fontStyle: 'italic',
                fontFamily: "'Chakra Petch', sans-serif",
                fontWeight: 700,
                letterSpacing: '0.01em',
                overflow: 'visible',
                paddingInline: '0.08em',
              }}
            />
          </div>
        </div>
      </section>

    </div>
  )
}
