import './XFactorTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, type ReactNode, type CSSProperties } from 'react'
import { Brain, Crosshair, WandSparkles } from 'lucide-react'
import { LightningCanvas } from '../../../components/LightningCanvas'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parsePercentValue, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { FittedText } from '../../shared/FittedText'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'
import { CyberpunkMetaValue } from '../../../components/CyberpunkMetaValue'

type XFactorTemplateProps = TemplatePreviewProps & {
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

export function XFactorTemplate({
  fighterA,
  fighterB,
  title,
  subtitle,
  templateBlocks,
  activeFightId,
  averageA,
  averageB,
  language,
  onToggleLanguage,
  integratedToolbar,
}: XFactorTemplateProps) {
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)

  const common = getFightCommonCopy('x-factor', language)
  const fighterAFallback = getFightTemplateDefaultField('x-factor', 'fighter_a_fallback', language)
  const fighterBFallback = getFightTemplateDefaultField('x-factor', 'fighter_b_fallback', language)
  const fighterAName = fighterA.name || fighterAFallback
  const fighterBName = fighterB.name || fighterBFallback
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['x-factor'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const ui = getTemplateUi('x-factor', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const tokens = ui.tokens as Record<string, string | number>
  const layout = ui.template as Record<string, string | number>
  const statTrapLayout = getTemplateUi('stat-trap', language).template as Record<string, string>
  const RED_LINIA = '#ff554e'
  const REFLEKS_TRESCI_FAKTOW = '0 var(--tb-reflect-2-y) 0.55em rgba(119, 226, 242, 0.45)'
  const REFLEKS_ETYKIET_FAKTOW = '0 0 7px rgba(255, 85, 78, 0.82), 0 0 14px rgba(255, 85, 78, 0.35)'
  const REFLEKS_PODTYTULOW_W_DOL = '0 var(--tb-reflect-2-y) 0.28em rgba(255, 85, 78, 0.36)'
  const REFLEKS_IMION_POSTACI = '0 0 14px currentColor, 0 0 24px currentColor, 0 1.72em 0.56em currentColor'
  const REFLEKS_WARTOSCI_PROCENT = '0 0 10px color-mix(in srgb, currentColor 54%, transparent), 0 var(--tb-reflect-2-y) 0.5em color-mix(in srgb, currentColor 34%, transparent)'
  const REFLEKS_BONUSU_PROCENT = '0 0 10px rgba(110, 231, 183, 0.62), 0 2.75em 0.58em rgba(110, 231, 183, 0.46)'
  const REFLEKS_KLUCZOWE_PYTANIE = `${REFLEKS_ETYKIET_FAKTOW}, 0 var(--tb-reflect-2-y) 0.55em rgba(255, 85, 78, 0.45)`
  const REFLEKS_EMOTEK = 'drop-shadow(0 0 8px color-mix(in srgb, currentColor 62%, transparent)) drop-shadow(0 calc(var(--tb-reflect-2-y) * 0.95) 0.52em color-mix(in srgb, currentColor 42%, transparent))'
  const INSIGHT_ICON_SIZE = (Number(tokens.TEMPLATE_INSIGHT_ICON_SIZE) || 24) * 2.2
  const INSIGHT_ICON_STROKE = (Number(tokens.TEMPLATE_INSIGHT_ICON_STROKE) || 1.5) * 0.95
  const DOSSIER_NAGLOWEK_FAKTU_STYLE: CSSProperties = {
    color: RED_LINIA,
    fontFamily: 'Chakra Petch, sans-serif',
    fontSize: 'var(--tb-type-3)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    textShadow: `${REFLEKS_ETYKIET_FAKTOW}, ${REFLEKS_PODTYTULOW_W_DOL}`,
    lineHeight: 1,
    margin: 0,
  }
  const DOSSIER_OPIS_FAKTU_STYLE: CSSProperties = {
    color: '#77e2f2',
    fontFamily: 'Chakra Petch, sans-serif',
    fontSize: 'calc(var(--tb-type-2) * 0.8)',
    fontWeight: 800,
    textTransform: 'uppercase',
    lineHeight: 1,
    letterSpacing: '0.01em',
    textShadow: REFLEKS_TRESCI_FAKTOW,
    margin: 0,
  }
  const DOSSIER_DOLNY_TEKST_STYLE: CSSProperties = {
    ...DOSSIER_OPIS_FAKTU_STYLE,
    textAlign: 'center',
    lineHeight: 1.06,
  }

  const line = (position: number, keys: string[], fallback = common.emptyFieldLabel) =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback

  const superPct = averageA ?? parsePercentValue(
    pickTemplateField(blockFields, ['a_value', 'super_value', 'left_value']),
    0,
  )
  const hyperPct = averageB ?? parsePercentValue(
    pickTemplateField(blockFields, ['b_value', 'hyper_value', 'right_value']),
    0,
  )
  const superBonusPct = parsePercentValue(
    pickTemplateField(blockFields, ['a_bonus', 'super_bonus', 'left_bonus']),
    0,
  )
  const hyperBonusPct = parsePercentValue(
    pickTemplateField(blockFields, ['b_bonus', 'hyper_bonus', 'right_bonus']),
    0,
  )

  const superTotalPct = superPct + superBonusPct
  const hyperTotalPct = hyperPct + hyperBonusPct
  const clampMeterPercent = (value: number) => Math.max(0, Math.min(100, value))
  const superBasePct = clampMeterPercent(superPct)
  const hyperBasePct = clampMeterPercent(hyperPct)
  const superTotalVisualPct = clampMeterPercent(superTotalPct)
  const hyperTotalVisualPct = clampMeterPercent(hyperTotalPct)
  const superBonusVisualPct = Math.max(0, superTotalVisualPct - superBasePct)
  const hyperBonusVisualPct = Math.max(0, hyperTotalVisualPct - hyperBasePct)
  const superRestPct = Math.max(0, 100 - superTotalVisualPct)
  const hyperRestPct = Math.max(0, 100 - hyperTotalVisualPct)
  const isSuperOvercharge = superTotalPct > 100
  const isHyperOvercharge = hyperTotalPct > 100

  const headerText = title || 'X-FACTOR'
  const subText = pickTemplateField(blockFields, ['subtitle', 'note']) || subtitle
  const mechanics = line(1, ['mechanika', 'mechanics'])
  const implication = line(2, ['implikacja', 'implication'])
  const psychology = line(3, ['psychologia', 'psychology'])
  const trapTop = pickTemplateField(blockFields, ['trap_top', 'top'])
  const trapBottom = pickTemplateField(blockFields, ['trap_bottom', 'bottom'])
  const trapExample = pickTemplateField(blockFields, ['example'])
  const trapQuestion = pickTemplateField(blockFields, ['question'])
  const boardHeader =
    pickTemplateField(blockFields, ['panel_header', 'x_factor_header']) ||
    getFightTemplateDefaultField('x-factor', 'panel_header', language) || "X-FACTOR"

  const auditPrefix = `${activeFightId || 'draft'}:x-factor`

  // Glitch effect for title
  const headerTextStr = typeof headerText === 'string' ? headerText : "TACTICAL BOARD"
  const chars = headerTextStr.split('')
  const [activeGlitches, setActiveGlitches] = useState<Set<number>>(new Set())

  useEffect(() => {
    const headerChars = headerTextStr.split('')
    if (headerChars.length === 0) return

    const MAX_CONCURRENT = 3
    const active = new Set<number>()
    const timeouts = new Map<number, ReturnType<typeof setTimeout>>()
    let isMounted = true

    const startGlitch = () => {
      if (!isMounted) return
      if (active.size >= MAX_CONCURRENT) return

      const available = []
      for (let i = 0; i < headerChars.length; i++) {
        if (!active.has(i) && headerChars[i] !== ' ') available.push(i)
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

    for (let i = 0; i < Math.min(MAX_CONCURRENT, headerChars.length); i++) {
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

      <section className="vs-tactical-board25-stats" style={{ width: 'calc(var(--tb-panel-width) * 2 + var(--tb-center-gap))', display: 'flex', flexDirection: 'column', height: 'var(--tb-panel-height)' }}>
        <p className="vs-tactical-board25-stats-title vs-panel-top-label" style={{ color: '#ff554e' }}><GlitchText text={boardHeader} /></p>
        
        <div
          className={layout.BODY_CLASS as string}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.78rem',
            border: 'none',
            background: 'transparent',
            boxShadow: 'none',
            padding: '0.34rem 0.45rem 0',
            minHeight: 0,
          }}
        >
          <div className={layout.FIGHTERS_WRAP_CLASS as string} style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
            {/* FIGHTER A METER */}
            <div style={{ flex: 1, padding: '0.1rem 0.26rem 0.18rem' }}>
              <FittedText
                as="p"
                slotKey={`${auditPrefix}:fighter-a`}
                spec={slots.fighterBannerNameLarge}
                text={fighterAName}
                className={String(tokens.X_FACTOR_FIGHTER_NAME_CLASS)}
                style={{ color: fighterA.color, fontFamily: 'var(--font-display)', fontSize: '1.82rem', marginBottom: '0.26rem', textShadow: REFLEKS_IMION_POSTACI, overflow: 'visible', position: 'relative', zIndex: 4 }}
                templateId="x-factor"
                activeFightId={activeFightId}
                language={language}
              />
              <div className={layout.METER_ROW_CLASS as string} style={{ marginTop: '0.24rem' }}>
                <div
                  className={`${layout.METER_TRACK_A_CLASS as string} vs-xfactor-meter-track`}
                  style={{
                    '--xf-color-light': fighterA.color,
                  } as CSSProperties}
                >
                  {superBasePct > 0 ? (
                    <div
                      className="vs-xfactor-meter-layer vs-xfactor-meter-layer--main"
                      style={{
                        clipPath: `inset(0% calc(${Math.max(0, 100 - superBasePct)}% - 0.6px) 0% 0%)`,
                      }}
                    />
                  ) : null}
                  {superBonusVisualPct > 0 ? (
                    <div
                      className="vs-xfactor-meter-layer vs-xfactor-meter-layer--bonus"
                      style={{
                        clipPath: `inset(0% calc(${Math.max(0, 100 - superTotalVisualPct)}% - 0.6px) 0% calc(${superBasePct}% - 0.6px))`,
                      } as CSSProperties}
                    />
                  ) : null}
                  {superRestPct > 0 ? (
                    <div
                      className="vs-xfactor-meter-layer vs-xfactor-meter-layer--rest"
                      style={{
                        clipPath: `inset(0% 0% 0% calc(${superTotalVisualPct}% - 0.6px))`,
                      }}
                    />
                  ) : null}
                  {isSuperOvercharge && (
                    <div
                      className="vs-xfactor-overcharge"
                      style={{
                        '--xf-overcharge-color': fighterA.color,
                        '--xf-overcharge-x': `${superTotalVisualPct}%`,
                      } as CSSProperties}
                    >
                      <div className="vs-xfactor-overcharge-arc vs-xfactor-overcharge-arc--1">
                        <LightningCanvas startRatio={{ x: 0.04, y: 0.22 }} endRatio={{ x: 1.28, y: 0.52 }} />
                      </div>
                      <div className="vs-xfactor-overcharge-arc vs-xfactor-overcharge-arc--2">
                        <LightningCanvas startRatio={{ x: 0.12, y: 0.78 }} endRatio={{ x: 1.24, y: 0.34 }} />
                      </div>
                      <div className="vs-xfactor-overcharge-arc vs-xfactor-overcharge-arc--3">
                        <LightningCanvas startRatio={{ x: 0.28, y: 0.48 }} endRatio={{ x: 1.36, y: 0.62 }} />
                      </div>
                      <div className="vs-xfactor-overcharge-arc vs-xfactor-overcharge-arc--4">
                        <LightningCanvas startRatio={{ x: 0.08, y: 0.56 }} endRatio={{ x: 1.18, y: 0.8 }} />
                      </div>
                      <div className="vs-xfactor-overcharge-arc vs-xfactor-overcharge-arc--5">
                        <LightningCanvas startRatio={{ x: 0.2, y: 0.3 }} endRatio={{ x: 1.4, y: 0.42 }} />
                      </div>
                      <div className="vs-xfactor-overcharge-arc vs-xfactor-overcharge-arc--6">
                        <LightningCanvas startRatio={{ x: 0.34, y: 0.68 }} endRatio={{ x: 1.32, y: 0.7 }} />
                      </div>
                    </div>
                  )}
                </div>
                <div
                  className={layout.METER_VALUE_A_CLASS as string}
                  style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
                >
                  <span className={String(tokens.X_FACTOR_VALUE_CLASS)} style={{ color: fighterA.color, fontWeight: 'bold', fontSize: '2.28rem', lineHeight: 1, textShadow: REFLEKS_WARTOSCI_PROCENT }}>
                    {Math.round(superPct)}%
                  </span>
                  <span className={layout.METER_BONUS_VALUE_A_CLASS as string} style={{ fontSize: '1.24rem', color: '#6ee7b7', lineHeight: 1, textShadow: REFLEKS_BONUSU_PROCENT }}>
                    {superBonusPct > 0 ? `+${Math.round(superBonusPct)}%` : '\u00A0'}
                  </span>
                </div>
              </div>
            </div>

            {/* FIGHTER B METER */}
            <div style={{ flex: 1, padding: '0.1rem 0.26rem 0.18rem' }}>
              <FittedText
                as="p"
                slotKey={`${auditPrefix}:fighter-b`}
                spec={slots.fighterBannerNameLarge}
                text={fighterBName}
                className={String(tokens.X_FACTOR_FIGHTER_NAME_CLASS)}
                style={{ color: fighterB.color, fontFamily: 'var(--font-display)', fontSize: '1.82rem', marginBottom: '0.26rem', textShadow: REFLEKS_IMION_POSTACI, overflow: 'visible', position: 'relative', zIndex: 4 }}
                templateId="x-factor"
                activeFightId={activeFightId}
                language={language}
              />
              <div className={layout.METER_ROW_CLASS as string} style={{ marginTop: '0.24rem' }}>
                <div
                  className={`${layout.METER_TRACK_B_CLASS as string} vs-xfactor-meter-track`}
                  style={{
                    '--xf-color-light': fighterB.color,
                  } as CSSProperties}
                >
                  {hyperBasePct > 0 ? (
                    <div
                      className="vs-xfactor-meter-layer vs-xfactor-meter-layer--main"
                      style={{
                        clipPath: `inset(0% calc(${Math.max(0, 100 - hyperBasePct)}% - 0.6px) 0% 0%)`,
                      }}
                    />
                  ) : null}
                  {hyperBonusVisualPct > 0 ? (
                    <div
                      className="vs-xfactor-meter-layer vs-xfactor-meter-layer--bonus"
                      style={{
                        clipPath: `inset(0% calc(${Math.max(0, 100 - hyperTotalVisualPct)}% - 0.6px) 0% calc(${hyperBasePct}% - 0.6px))`,
                      } as CSSProperties}
                    />
                  ) : null}
                  {hyperRestPct > 0 ? (
                    <div
                      className="vs-xfactor-meter-layer vs-xfactor-meter-layer--rest"
                      style={{
                        clipPath: `inset(0% 0% 0% calc(${hyperTotalVisualPct}% - 0.6px))`,
                      }}
                    />
                  ) : null}
                  {isHyperOvercharge && (
                    <div
                      className="vs-xfactor-overcharge"
                      style={{
                        '--xf-overcharge-color': fighterB.color,
                        '--xf-overcharge-x': `${hyperTotalVisualPct}%`,
                      } as CSSProperties}
                    >
                      <div className="vs-xfactor-overcharge-arc vs-xfactor-overcharge-arc--1">
                        <LightningCanvas startRatio={{ x: 0.04, y: 0.22 }} endRatio={{ x: 1.28, y: 0.52 }} />
                      </div>
                      <div className="vs-xfactor-overcharge-arc vs-xfactor-overcharge-arc--2">
                        <LightningCanvas startRatio={{ x: 0.12, y: 0.78 }} endRatio={{ x: 1.24, y: 0.34 }} />
                      </div>
                      <div className="vs-xfactor-overcharge-arc vs-xfactor-overcharge-arc--3">
                        <LightningCanvas startRatio={{ x: 0.28, y: 0.48 }} endRatio={{ x: 1.36, y: 0.62 }} />
                      </div>
                      <div className="vs-xfactor-overcharge-arc vs-xfactor-overcharge-arc--4">
                        <LightningCanvas startRatio={{ x: 0.08, y: 0.56 }} endRatio={{ x: 1.18, y: 0.8 }} />
                      </div>
                      <div className="vs-xfactor-overcharge-arc vs-xfactor-overcharge-arc--5">
                        <LightningCanvas startRatio={{ x: 0.2, y: 0.3 }} endRatio={{ x: 1.4, y: 0.42 }} />
                      </div>
                      <div className="vs-xfactor-overcharge-arc vs-xfactor-overcharge-arc--6">
                        <LightningCanvas startRatio={{ x: 0.34, y: 0.68 }} endRatio={{ x: 1.32, y: 0.7 }} />
                      </div>
                    </div>
                  )}
                </div>
                <div
                  className={layout.METER_VALUE_B_CLASS as string}
                  style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
                >
                  <span className={String(tokens.X_FACTOR_VALUE_CLASS)} style={{ color: fighterB.color, fontWeight: 'bold', fontSize: '2.28rem', lineHeight: 1, textShadow: REFLEKS_WARTOSCI_PROCENT }}>
                    {Math.round(hyperPct)}%
                  </span>
                  <span className={layout.METER_BONUS_VALUE_B_CLASS as string} style={{ fontSize: '1.24rem', color: '#6ee7b7', lineHeight: 1, textShadow: REFLEKS_BONUSU_PROCENT }}>
                    {hyperBonusPct > 0 ? `+${Math.round(hyperBonusPct)}%` : '\u00A0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={layout.INSIGHTS_GRID_CLASS as string} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.56rem', flex: 1.08, minHeight: 0 }}>
            <div className={String(tokens.TEMPLATE_INSIGHT_CARD_CLASS)} style={{ padding: '0.34rem 0.2rem', border: 'none', background: 'transparent', minHeight: 0, boxShadow: 'none' }}>
              <div className={String(tokens.TEMPLATE_INSIGHT_ROW_CLASS)} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.38rem', minHeight: 0 }}>
                <div className={String(tokens.TEMPLATE_INSIGHT_ICON_WRAP_CLASS)} style={{ color: '#a78bfa', border: 'none', background: 'transparent', width: 'auto', height: 'auto', borderRadius: 0 }}>
                  <WandSparkles size={INSIGHT_ICON_SIZE} strokeWidth={INSIGHT_ICON_STROKE} style={{ filter: REFLEKS_EMOTEK }} />
                </div>
                <div className={layout.INSIGHT_BODY_WRAP_CLASS as string} style={{ minWidth: 0, flex: 1 }}>
                  <p className="vs-dossier-text-3" style={DOSSIER_NAGLOWEK_FAKTU_STYLE}>
                    <GlitchText text={common.mechanicsLabel} />
                  </p>
                  <p className="vs-dossier-text-2" style={DOSSIER_OPIS_FAKTU_STYLE}>
                    {mechanics}
                  </p>
                </div>
              </div>
            </div>

            <div className={String(tokens.TEMPLATE_INSIGHT_CARD_CLASS)} style={{ padding: '0.34rem 0.2rem', border: 'none', background: 'transparent', minHeight: 0, boxShadow: 'none' }}>
              <div className={String(tokens.TEMPLATE_INSIGHT_ROW_CLASS)} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.38rem', minHeight: 0 }}>
                <div className={String(tokens.TEMPLATE_INSIGHT_ICON_WRAP_CLASS)} style={{ color: '#f472b6', border: 'none', background: 'transparent', width: 'auto', height: 'auto', borderRadius: 0 }}>
                  <Crosshair size={INSIGHT_ICON_SIZE} strokeWidth={INSIGHT_ICON_STROKE} style={{ filter: REFLEKS_EMOTEK }} />
                </div>
                <div className={layout.INSIGHT_BODY_WRAP_CLASS as string} style={{ minWidth: 0, flex: 1 }}>
                  <p className="vs-dossier-text-3" style={DOSSIER_NAGLOWEK_FAKTU_STYLE}>
                    <GlitchText text={common.implicationLabel} />
                  </p>
                  <p className="vs-dossier-text-2" style={DOSSIER_OPIS_FAKTU_STYLE}>
                    {implication}
                  </p>
                </div>
              </div>
            </div>

            <div className={String(tokens.TEMPLATE_INSIGHT_CARD_CLASS)} style={{ padding: '0.34rem 0.2rem', border: 'none', background: 'transparent', minHeight: 0, boxShadow: 'none' }}>
              <div className={String(tokens.TEMPLATE_INSIGHT_ROW_CLASS)} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.38rem', minHeight: 0 }}>
                <div className={String(tokens.TEMPLATE_INSIGHT_ICON_WRAP_CLASS)} style={{ color: '#38bdf8', border: 'none', background: 'transparent', width: 'auto', height: 'auto', borderRadius: 0 }}>
                  <Brain size={INSIGHT_ICON_SIZE} strokeWidth={INSIGHT_ICON_STROKE} style={{ filter: REFLEKS_EMOTEK }} />
                </div>
                <div className={layout.INSIGHT_BODY_WRAP_CLASS as string} style={{ minWidth: 0, flex: 1 }}>
                  <p className="vs-dossier-text-3" style={DOSSIER_NAGLOWEK_FAKTU_STYLE}>
                    <GlitchText text={common.psychologyLabel} />
                  </p>
                  <p className="vs-dossier-text-2" style={DOSSIER_OPIS_FAKTU_STYLE}>
                    {psychology}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {(trapTop || trapBottom || trapExample || trapQuestion) && (
            <div style={{ padding: '0.26rem 0.2rem 0' }}>
              {(trapTop || trapBottom) && (
                <div className={statTrapLayout.HEADLINE_BAND_CLASS} style={{ textAlign: 'center', marginBottom: '0.34rem' }}>
                  <p
                    className={String(tokens.STAT_TRAP_HEADLINE_CLASS)}
                    style={{ fontFamily: 'var(--font-display)', textAlign: 'center', fontSize: '1.42rem' }}
                  >
                    {trapTop && <span style={{ color: fighterB.color }}>{trapTop} </span>}
                    {trapBottom && <span style={{ color: fighterA.color }}>{trapBottom}</span>}
                  </p>
                </div>
              )}
              {trapExample && (
                <p
                  className="vs-dossier-text-2"
                  style={{
                    ...DOSSIER_DOLNY_TEKST_STYLE,
                    marginTop: '0.48rem',
                  }}
                >
                  {trapExample}
                </p>
              )}
              {trapQuestion && (
                <p
                  className="vs-dossier-text-2"
                  style={{
                    ...DOSSIER_DOLNY_TEKST_STYLE,
                    marginTop: '0.32rem',
                  }}
                >
                  <span style={{ color: RED_LINIA, textShadow: REFLEKS_KLUCZOWE_PYTANIE, fontWeight: 700 }}>{common.keyQuestionLabel}</span>{' '}{trapQuestion}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
