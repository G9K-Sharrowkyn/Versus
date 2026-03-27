import './XFactorTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, type ReactNode, type MutableRefObject } from 'react'
import { Brain, Crosshair, WandSparkles } from 'lucide-react'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parsePercentValue, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { FittedText } from '../../shared/FittedText'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'
import { useSlotAutofit } from '../../shared/useSlotAutofit'
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

  const xLabel = line(0, ['factor', 'headline'])
  const headerText = title || 'X-FACTOR'
  const subText = pickTemplateField(blockFields, ['subtitle', 'note']) || subtitle
  const factorMatch = xLabel.match(/^(.*?)(\s+VS\s+)(.*)$/i)
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
  const factorFit = useSlotAutofit({
    slotKey: `${auditPrefix}:factor`,
    spec: slots.xFactorSupplement,
    text: xLabel,
    templateId: 'x-factor',
    activeFightId,
    language,
  })

  const factorSupplement = xLabel ? (
    <div
      ref={factorFit.ref as MutableRefObject<HTMLDivElement | null>}
      className={layout.FACTOR_SUPPLEMENT_CLASS as string}
      style={{
        display: 'block',
        height: `${factorFit.fixedHeightPx}px`,
        maxHeight: `${factorFit.fixedHeightPx}px`,
        overflow: 'hidden',
        fontFamily: 'var(--font-display)',
        fontSize: `${factorFit.fontPx}px`,
        lineHeight: `${slots.xFactorSupplement.lineHeight}`,
        letterSpacing: slots.xFactorSupplement.letterSpacing,
      }}
      {...factorFit.dataAttributes}
    >
      {factorMatch ? (
        <>
          <span style={{ color: fighterA.color }}>{factorMatch[1].trim()}</span>
          <span className={layout.FACTOR_SEPARATOR_CLASS as string}>{factorMatch[2]}</span>
          <span style={{ color: fighterB.color }}>{factorMatch[3].trim()}</span>
        </>
      ) : (
        xLabel
      )}
    </div>
  ) : null

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
        <div style={{ textAlign: 'center', marginTop: '0.5rem', color: '#67e8f9' }}>
          {factorSupplement}
        </div>
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
        
        <div className={layout.BODY_CLASS as string} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.72rem', border: 'none', background: 'transparent', minHeight: 0 }}>
          <div className={layout.FIGHTERS_WRAP_CLASS as string} style={{ display: 'flex', gap: '0.45rem', flexDirection: 'column' }}>
            {/* FIGHTER A METER */}
            <div style={{ flex: 1, padding: '0.15rem 0.5rem 0.28rem' }}>
              <FittedText
                as="p"
                slotKey={`${auditPrefix}:fighter-a`}
                spec={slots.fighterBannerNameLarge}
                text={fighterAName}
                className={String(tokens.X_FACTOR_FIGHTER_NAME_CLASS)}
                style={{ color: fighterA.color, fontFamily: 'var(--font-display)', fontSize: '1.78rem', marginBottom: '0.35rem' }}
                templateId="x-factor"
                activeFightId={activeFightId}
                language={language}
              />
              <div className={layout.METER_ROW_CLASS as string} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className={layout.METER_TRACK_A_CLASS as string} style={{ flex: 1, height: '18px', background: 'rgba(255,255,255,0.1)', position: 'relative', border: 'none' }}>
                  <div className={layout.METER_FILL_A_CLASS as string} style={{ width: `${Math.min(100, superPct)}%`, height: '100%', backgroundColor: fighterA.color }} />
                  {superBonusPct > 0 ? (
                    <div
                      className={layout.METER_BONUS_OVERLAY_CLASS as string}
                      style={{
                        position: 'absolute',
                        top: 0, bottom: 0, left: 0, right: 0,
                        clipPath: `inset(0% ${Math.max(0, 100 - superTotalPct)}% 0% ${Math.min(100, superPct)}%)`,
                        background: String(layout.METER_BONUS_BG_A),
                        opacity: 0.85
                      }}
                    />
                  ) : null}
                  <div className={layout.METER_PATTERN_CLASS as string} style={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(255,255,255,0.5) 50%)', backgroundSize: '10px 100%' }} />
                </div>
                <div
                  className={layout.METER_VALUE_A_CLASS as string}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '50px', border: 'none', background: 'transparent' }}
                >
                  <span className={String(tokens.X_FACTOR_VALUE_CLASS)} style={{ color: fighterA.color, fontWeight: 'bold', fontSize: '1.24rem' }}>{Math.round(superPct)}%</span>
                  <span className={layout.METER_BONUS_VALUE_A_CLASS as string} style={{ fontSize: '0.86rem', color: '#6ee7b7' }}>
                    {superBonusPct > 0 ? `+${Math.round(superBonusPct)}%` : '\u00A0'}
                  </span>
                </div>
              </div>
            </div>

            {/* FIGHTER B METER */}
            <div style={{ flex: 1, padding: '0.15rem 0.5rem 0.28rem' }}>
              <FittedText
                as="p"
                slotKey={`${auditPrefix}:fighter-b`}
                spec={slots.fighterBannerNameLarge}
                text={fighterBName}
                className={String(tokens.X_FACTOR_FIGHTER_NAME_CLASS)}
                style={{ color: fighterB.color, fontFamily: 'var(--font-display)', fontSize: '1.78rem', marginBottom: '0.35rem', textAlign: 'right' }}
                templateId="x-factor"
                activeFightId={activeFightId}
                language={language}
              />
              <div className={layout.METER_ROW_CLASS as string} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: 'row-reverse' }}>
                <div className={layout.METER_TRACK_B_CLASS as string} style={{ flex: 1, height: '18px', background: 'rgba(255,255,255,0.1)', position: 'relative', border: 'none' }}>
                  <div className={layout.METER_FILL_B_CLASS as string} style={{ position: 'absolute', right: 0, width: `${Math.min(100, hyperPct)}%`, height: '100%', backgroundColor: fighterB.color }} />
                  {hyperBonusPct > 0 ? (
                    <div
                      className={layout.METER_BONUS_OVERLAY_CLASS as string}
                      style={{
                        position: 'absolute',
                        top: 0, bottom: 0, left: 0, right: 0,
                        clipPath: `inset(0% ${Math.min(100, hyperPct)}% 0% ${Math.max(0, 100 - hyperTotalPct)}%)`,
                        background: String(layout.METER_BONUS_BG_B),
                        opacity: 0.85
                      }}
                    />
                  ) : null}
                  <div className={layout.METER_PATTERN_CLASS as string} style={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(255,255,255,0.5) 50%)', backgroundSize: '10px 100%' }} />
                </div>
                <div
                  className={layout.METER_VALUE_B_CLASS as string}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '50px', border: 'none', background: 'transparent' }}
                >
                  <span className={String(tokens.X_FACTOR_VALUE_CLASS)} style={{ color: fighterB.color, fontWeight: 'bold', fontSize: '1.24rem' }}>{Math.round(hyperPct)}%</span>
                  <span className={layout.METER_BONUS_VALUE_B_CLASS as string} style={{ fontSize: '0.86rem', color: '#6ee7b7' }}>
                    {hyperBonusPct > 0 ? `+${Math.round(hyperBonusPct)}%` : '\u00A0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={layout.INSIGHTS_GRID_CLASS as string} style={{ display: 'flex', gap: '0.55rem', flex: 1.05, minHeight: 0 }}>
            <div className={String(tokens.TEMPLATE_INSIGHT_CARD_CLASS)} style={{ flex: 1, padding: '0.34rem', border: 'none', background: 'transparent', minHeight: 0 }}>
              <div className={String(tokens.TEMPLATE_INSIGHT_ROW_CLASS)} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', height: '100%', minHeight: 0 }}>
                <div className={String(tokens.TEMPLATE_INSIGHT_ICON_WRAP_CLASS)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a78bfa', border: 'none', background: 'transparent', width: 'auto', height: 'auto', borderRadius: 0 }}>
                  <WandSparkles size={Number(tokens.TEMPLATE_INSIGHT_ICON_SIZE) || 24} strokeWidth={Number(tokens.TEMPLATE_INSIGHT_ICON_STROKE) || 1.5} />
                  <FittedText as="p" slotKey={`${auditPrefix}:mechanics-title`} spec={slots.xFactorInsightTitle} text={common.mechanicsLabel} className={String(tokens.TEMPLATE_INSIGHT_TITLE_CLASS)} style={{ fontSize: '1.02rem', textTransform: 'uppercase', letterSpacing: '0.1em' }} templateId="x-factor" activeFightId={activeFightId} language={language} />
                </div>
                <div className={layout.INSIGHT_BODY_WRAP_CLASS as string} style={{ flex: 1, overflowY: 'auto' }}>
                  <FittedText as="p" slotKey={`${auditPrefix}:mechanics`} spec={slots.xFactorInsightBody} text={mechanics} className={layout.INSIGHT_BODY_TEXT_CLASS as string} style={{ color: '#e2e8f0', fontSize: '0.88rem', lineHeight: 1.18 }} templateId="x-factor" activeFightId={activeFightId} language={language} />
                </div>
              </div>
            </div>

            <div className={String(tokens.TEMPLATE_INSIGHT_CARD_CLASS)} style={{ flex: 1, padding: '0.34rem', border: 'none', background: 'transparent', minHeight: 0 }}>
              <div className={String(tokens.TEMPLATE_INSIGHT_ROW_CLASS)} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', height: '100%', minHeight: 0 }}>
                <div className={String(tokens.TEMPLATE_INSIGHT_ICON_WRAP_CLASS)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f472b6', border: 'none', background: 'transparent', width: 'auto', height: 'auto', borderRadius: 0 }}>
                  <Crosshair size={Number(tokens.TEMPLATE_INSIGHT_ICON_SIZE) || 24} strokeWidth={Number(tokens.TEMPLATE_INSIGHT_ICON_STROKE) || 1.5} />
                  <FittedText as="p" slotKey={`${auditPrefix}:implication-title`} spec={slots.xFactorInsightTitle} text={common.implicationLabel} className={String(tokens.TEMPLATE_INSIGHT_TITLE_CLASS)} style={{ fontSize: '1.02rem', textTransform: 'uppercase', letterSpacing: '0.1em' }} templateId="x-factor" activeFightId={activeFightId} language={language} />
                </div>
                <div className={layout.INSIGHT_BODY_WRAP_CLASS as string} style={{ flex: 1, overflowY: 'auto' }}>
                  <FittedText as="p" slotKey={`${auditPrefix}:implication`} spec={slots.xFactorInsightBody} text={implication} className={layout.INSIGHT_BODY_TEXT_CLASS as string} style={{ color: '#e2e8f0', fontSize: '0.88rem', lineHeight: 1.18 }} templateId="x-factor" activeFightId={activeFightId} language={language} />
                </div>
              </div>
            </div>

            <div className={String(tokens.TEMPLATE_INSIGHT_CARD_CLASS)} style={{ flex: 1, padding: '0.34rem', border: 'none', background: 'transparent', minHeight: 0 }}>
              <div className={String(tokens.TEMPLATE_INSIGHT_ROW_CLASS)} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', height: '100%', minHeight: 0 }}>
                <div className={String(tokens.TEMPLATE_INSIGHT_ICON_WRAP_CLASS)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', border: 'none', background: 'transparent', width: 'auto', height: 'auto', borderRadius: 0 }}>
                  <Brain size={Number(tokens.TEMPLATE_INSIGHT_ICON_SIZE) || 24} strokeWidth={Number(tokens.TEMPLATE_INSIGHT_ICON_STROKE) || 1.5} />
                  <FittedText as="p" slotKey={`${auditPrefix}:psychology-title`} spec={slots.xFactorInsightTitle} text={common.psychologyLabel} className={String(tokens.TEMPLATE_INSIGHT_TITLE_CLASS)} style={{ fontSize: '1.02rem', textTransform: 'uppercase', letterSpacing: '0.1em' }} templateId="x-factor" activeFightId={activeFightId} language={language} />
                </div>
                <div className={layout.INSIGHT_BODY_WRAP_CLASS as string} style={{ flex: 1, overflowY: 'auto' }}>
                  <FittedText as="p" slotKey={`${auditPrefix}:psychology`} spec={slots.xFactorInsightBody} text={psychology} className={layout.INSIGHT_BODY_TEXT_CLASS as string} style={{ color: '#e2e8f0', fontSize: '0.88rem', lineHeight: 1.18 }} templateId="x-factor" activeFightId={activeFightId} language={language} />
                </div>
              </div>
            </div>
          </div>

          {(trapTop || trapBottom || trapExample || trapQuestion) && (
            <div style={{ padding: '0.34rem 0.5rem 0' }}>
              {(trapTop || trapBottom) && (
                <div className={statTrapLayout.HEADLINE_BAND_CLASS} style={{ textAlign: 'center', marginBottom: '0.34rem' }}>
                  <p
                    className={String(tokens.STAT_TRAP_HEADLINE_CLASS)}
                    style={{ fontFamily: 'var(--font-display)', textAlign: 'center', fontSize: '1.32rem' }}
                  >
                    {trapTop && <span style={{ color: fighterB.color }}>{trapTop} </span>}
                    {trapBottom && <span style={{ color: fighterA.color }}>{trapBottom}</span>}
                  </p>
                </div>
              )}
              {trapExample && (
                <p className="mt-2 text-[14px] leading-[1.25] text-slate-100" style={{ fontFamily: 'var(--font-ui)', color: '#e2e8f0', textAlign: 'center' }}>
                  {trapExample}
                </p>
              )}
              {trapQuestion && (
                <p className="mt-2 text-[13px] leading-[1.25] text-slate-200" style={{ fontFamily: 'var(--font-ui)', color: '#94a3b8', textAlign: 'center', marginTop: '0.5rem' }}>
                  <span className="font-bold text-cyan-300">{common.keyQuestionLabel}</span>{' '}{trapQuestion}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
