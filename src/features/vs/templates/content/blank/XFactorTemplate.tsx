import { Brain, Crosshair, WandSparkles } from 'lucide-react'
import type { CSSProperties, MutableRefObject } from 'react'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parsePercentValue, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { HighEndTemplateHeader } from '../../shared/highEnd'
import { FittedText } from '../../shared/FittedText'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'
import { useSlotAutofit } from '../../shared/useSlotAutofit'

export function XFactorTemplate({
  fighterA,
  fighterB,
  title,
  subtitle,
  templateBlocks,
  activeFightId,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const common = getFightCommonCopy('x-factor', language)
  const fighterAFallback = getFightTemplateDefaultField('x-factor', 'fighter_a_fallback', language)
  const fighterBFallback = getFightTemplateDefaultField('x-factor', 'fighter_b_fallback', language)
  const fighterAName = fighterA.name || fighterAFallback
  const fighterBName = fighterB.name || fighterBFallback
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['x-factor'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome('x-factor', language, blockFields)
  const ui = getTemplateUi('x-factor', language)
  const shell = ui.highEnd as Record<string, string>
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const tokens = ui.tokens as Record<string, string | number>
  const layout = ui.template as Record<string, string | number>
  const statTrapLayout = getTemplateUi('stat-trap', language).template as Record<string, string>
  const line = (position: number, keys: string[], fallback = common.emptyFieldLabel) =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const superPct = parsePercentValue(
    pickTemplateField(blockFields, ['a_value', 'super_value', 'superman', 'left_value']),
    0,
  )
  const hyperPct = parsePercentValue(
    pickTemplateField(blockFields, ['b_value', 'hyper_value', 'hyperion', 'right_value']),
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
  const superTotalPct = Math.max(0, Math.min(100, superPct + superBonusPct))
  const hyperTotalPct = Math.max(0, Math.min(100, hyperPct + hyperBonusPct))
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

  return (
    <div className={shell.HIGH_END_ROOT_CLASS}>
      <div className={shell.HIGH_END_PANEL_CLASS}>
        <div className={shell.HIGH_END_GRID_OVERLAY_CLASS} />
        <div className={layout.INNER_CLASS as string}>
          <HighEndTemplateHeader
            templateId="x-factor"
            language={language}
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            centerSupplement={factorSupplement}
            onToggleLanguage={onToggleLanguage}
          />

          <div className={`${shell.HIGH_END_BODY_GAP_CLASS} ${layout.BODY_CLASS as string}`}>
            <div className={layout.FIGHTERS_WRAP_CLASS as string}>
              <div>
                <FittedText
                  as="p"
                  slotKey={`${auditPrefix}:fighter-a`}
                  spec={slots.fighterBannerNameLarge}
                  text={fighterAName}
                  className={String(tokens.X_FACTOR_FIGHTER_NAME_CLASS)}
                  style={{ color: '#38bdf8', fontFamily: 'var(--font-display)' }}
                  templateId="x-factor"
                  activeFightId={activeFightId}
                  language={language}
                />
                <div className={layout.METER_ROW_CLASS as string}>
                  <div className={layout.METER_TRACK_A_CLASS as string}>
                    <div className={layout.METER_FILL_A_CLASS as string} style={{ width: `${superPct}%` }} />
                    {superBonusPct > 0 ? (
                      <div
                        className={layout.METER_BONUS_OVERLAY_CLASS as string}
                        style={{
                          clipPath: `inset(5% ${Math.max(0, 100 - superTotalPct)}% 5% ${Math.max(0, Math.min(100, superPct))}%)`,
                          background: String(layout.METER_BONUS_BG_A),
                        }}
                      />
                    ) : null}
                    <div className={layout.METER_PATTERN_CLASS as string} />
                  </div>
                  <div
                    className={layout.METER_VALUE_A_CLASS as string}
                    style={{ backgroundImage: String(layout.METER_BONUS_BG_A), backgroundClip: 'padding-box' }}
                  >
                    <span className={String(tokens.X_FACTOR_VALUE_CLASS)}>{Math.round(superPct)}%</span>
                    <span className={layout.METER_BONUS_VALUE_A_CLASS as string}>
                      {superBonusPct > 0 ? `+${Math.round(superBonusPct)}%` : '\u00A0'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <FittedText
                  as="p"
                  slotKey={`${auditPrefix}:fighter-b`}
                  spec={slots.fighterBannerNameLarge}
                  text={fighterBName}
                  className={String(tokens.X_FACTOR_FIGHTER_NAME_CLASS)}
                  style={{ color: '#f87171', fontFamily: 'var(--font-display)' }}
                  templateId="x-factor"
                  activeFightId={activeFightId}
                  language={language}
                />
                <div className={layout.METER_ROW_CLASS as string}>
                  <div className={layout.METER_TRACK_B_CLASS as string}>
                    <div className={layout.METER_FILL_B_CLASS as string} style={{ width: `${hyperPct}%` }} />
                    {hyperBonusPct > 0 ? (
                      <div
                        className={layout.METER_BONUS_OVERLAY_CLASS as string}
                        style={{
                          clipPath: `inset(5% ${Math.max(0, 100 - hyperTotalPct)}% 5% ${Math.max(0, Math.min(100, hyperPct))}%)`,
                          background: String(layout.METER_BONUS_BG_B),
                        }}
                      />
                    ) : null}
                    <div className={layout.METER_PATTERN_CLASS as string} />
                  </div>
                  <div
                    className={layout.METER_VALUE_B_CLASS as string}
                    style={{ backgroundImage: String(layout.METER_BONUS_BG_B), backgroundClip: 'padding-box' }}
                  >
                    <span className={String(tokens.X_FACTOR_VALUE_CLASS)}>{Math.round(hyperPct)}%</span>
                    <span className={layout.METER_BONUS_VALUE_B_CLASS as string}>
                      {hyperBonusPct > 0 ? `+${Math.round(hyperBonusPct)}%` : '\u00A0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={layout.INSIGHTS_GRID_CLASS as string}>
              <div className={String(tokens.TEMPLATE_INSIGHT_CARD_CLASS)}>
                <div className={String(tokens.TEMPLATE_INSIGHT_ROW_CLASS)}>
                  <div className={String(tokens.TEMPLATE_INSIGHT_ICON_WRAP_CLASS)}>
                    <WandSparkles size={Number(tokens.TEMPLATE_INSIGHT_ICON_SIZE)} strokeWidth={Number(tokens.TEMPLATE_INSIGHT_ICON_STROKE)} />
                  </div>
                  <div className={layout.INSIGHT_BODY_WRAP_CLASS as string}>
                    <FittedText
                      as="p"
                      slotKey={`${auditPrefix}:mechanics-title`}
                      spec={slots.xFactorInsightTitle}
                      text={common.mechanicsLabel}
                      className={String(tokens.TEMPLATE_INSIGHT_TITLE_CLASS)}
                      templateId="x-factor"
                      activeFightId={activeFightId}
                      language={language}
                    />
                    <FittedText
                      as="p"
                      slotKey={`${auditPrefix}:mechanics`}
                      spec={slots.xFactorInsightBody}
                      text={mechanics}
                      className={layout.INSIGHT_BODY_TEXT_CLASS as string}
                      templateId="x-factor"
                      activeFightId={activeFightId}
                      language={language}
                    />
                  </div>
                </div>
              </div>

              <div className={String(tokens.TEMPLATE_INSIGHT_CARD_CLASS)}>
                <div className={String(tokens.TEMPLATE_INSIGHT_ROW_CLASS)}>
                  <div className={String(tokens.TEMPLATE_INSIGHT_ICON_WRAP_CLASS)}>
                    <Crosshair size={Number(tokens.TEMPLATE_INSIGHT_ICON_SIZE)} strokeWidth={Number(tokens.TEMPLATE_INSIGHT_ICON_STROKE)} />
                  </div>
                  <div className={layout.INSIGHT_BODY_WRAP_CLASS as string}>
                    <FittedText
                      as="p"
                      slotKey={`${auditPrefix}:implication-title`}
                      spec={slots.xFactorInsightTitle}
                      text={common.implicationLabel}
                      className={String(tokens.TEMPLATE_INSIGHT_TITLE_CLASS)}
                      templateId="x-factor"
                      activeFightId={activeFightId}
                      language={language}
                    />
                    <FittedText
                      as="p"
                      slotKey={`${auditPrefix}:implication`}
                      spec={slots.xFactorInsightBody}
                      text={implication}
                      className={layout.INSIGHT_BODY_TEXT_CLASS as string}
                      templateId="x-factor"
                      activeFightId={activeFightId}
                      language={language}
                    />
                  </div>
                </div>
              </div>

              <div className={String(tokens.TEMPLATE_INSIGHT_CARD_CLASS)}>
                <div className={String(tokens.TEMPLATE_INSIGHT_ROW_CLASS)}>
                  <div className={String(tokens.TEMPLATE_INSIGHT_ICON_WRAP_CLASS)}>
                    <Brain size={Number(tokens.TEMPLATE_INSIGHT_ICON_SIZE)} strokeWidth={Number(tokens.TEMPLATE_INSIGHT_ICON_STROKE)} />
                  </div>
                  <div className={layout.INSIGHT_BODY_WRAP_CLASS as string}>
                    <FittedText
                      as="p"
                      slotKey={`${auditPrefix}:psychology-title`}
                      spec={slots.xFactorInsightTitle}
                      text={common.psychologyLabel}
                      className={String(tokens.TEMPLATE_INSIGHT_TITLE_CLASS)}
                      templateId="x-factor"
                      activeFightId={activeFightId}
                      language={language}
                    />
                    <FittedText
                      as="p"
                      slotKey={`${auditPrefix}:psychology`}
                      spec={slots.xFactorInsightBody}
                      text={psychology}
                      className={layout.INSIGHT_BODY_TEXT_CLASS as string}
                      templateId="x-factor"
                      activeFightId={activeFightId}
                      language={language}
                    />
                  </div>
                </div>
              </div>
            </div>

            {(trapTop || trapBottom || trapExample || trapQuestion) && (
              <div className="mt-4 rounded-md border border-cyan-300/25 bg-[linear-gradient(180deg,rgba(5,19,34,0.94),rgba(8,28,49,0.9))] p-3">
                {(trapTop || trapBottom) && (
                  <div className={statTrapLayout.HEADLINE_BAND_CLASS}>
                    <p
                      className={String(tokens.STAT_TRAP_HEADLINE_CLASS)}
                      style={{ fontFamily: 'var(--font-display)', textAlign: 'center' }}
                    >
                      {trapTop && <span style={{ color: fighterB.color }}>{trapTop} </span>}
                      {trapBottom && <span style={{ color: fighterA.color }}>{trapBottom}</span>}
                    </p>
                  </div>
                )}
                {trapExample && (
                  <p className="mt-2 text-[14px] leading-[1.25] text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
                    {trapExample}
                  </p>
                )}
                {trapQuestion && (
                  <p className="mt-2 text-[13px] leading-[1.25] text-slate-200" style={{ fontFamily: 'var(--font-ui)' }}>
                    <span className="font-bold">{common.keyQuestionLabel}</span>{' '}{trapQuestion}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
