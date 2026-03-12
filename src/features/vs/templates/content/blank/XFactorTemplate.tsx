import { Brain, Crosshair, WandSparkles } from 'lucide-react'
import type { MutableRefObject } from 'react'
import { buildFightTemplateChrome, getFightCommonCopy } from '../../../fightManifest'
import { pickLang } from '../../../presets'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parsePercentValue, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import {
  HIGH_END_BODY_GAP_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HighEndTemplateHeader,
} from '../../shared/highEnd'
import { FittedText } from '../../shared/FittedText'
import {
  TEMPLATE_INSIGHT_CARD_CLASS,
  TEMPLATE_INSIGHT_ICON_SIZE,
  TEMPLATE_INSIGHT_ICON_STROKE,
  TEMPLATE_INSIGHT_ICON_WRAP_CLASS,
  TEMPLATE_INSIGHT_ROW_CLASS,
  TEMPLATE_INSIGHT_TITLE_CLASS,
  X_FACTOR_FIGHTER_NAME_CLASS,
  X_FACTOR_VALUE_BONUS_CLASS,
  X_FACTOR_VALUE_CLASS,
} from '../../shared/layoutTokens'
import { TEMPLATE_SLOT_SPECS } from '../../shared/templateSlotSpecs'
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
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const common = getFightCommonCopy(language)
  const fighterAName = fighterA.name || tr('Postac A', 'Fighter A')
  const fighterBName = fighterB.name || tr('Postac B', 'Fighter B')
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['x-factor'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome(language, blockFields)
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
  const auditPrefix = `${activeFightId || 'draft'}:x-factor`
  const factorFit = useSlotAutofit({
    slotKey: `${auditPrefix}:factor`,
    spec: TEMPLATE_SLOT_SPECS.xFactorSupplement,
    text: xLabel,
    templateId: 'x-factor',
    activeFightId,
    language,
  })

  const factorSupplement = xLabel ? (
    <div
      ref={factorFit.ref as MutableRefObject<HTMLDivElement | null>}
      className="mt-1 text-center uppercase text-cyan-100"
      style={{
        display: 'block',
        height: `${factorFit.fixedHeightPx}px`,
        maxHeight: `${factorFit.fixedHeightPx}px`,
        overflow: 'hidden',
        fontFamily: 'var(--font-display)',
        fontSize: `${factorFit.fontPx}px`,
        lineHeight: `${TEMPLATE_SLOT_SPECS.xFactorSupplement.lineHeight}`,
        letterSpacing: TEMPLATE_SLOT_SPECS.xFactorSupplement.letterSpacing,
      }}
      {...factorFit.dataAttributes}
    >
      {factorMatch ? (
        <>
          <span style={{ color: fighterA.color }}>{factorMatch[1].trim()}</span>
          <span className="text-slate-200">{factorMatch[2]}</span>
          <span style={{ color: fighterB.color }}>{factorMatch[3].trim()}</span>
        </>
      ) : (
        xLabel
      )}
    </div>
  ) : null

  return (
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full flex-col">
          <HighEndTemplateHeader
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            centerSupplement={factorSupplement}
            onToggleLanguage={onToggleLanguage}
          />

          <div className={`${HIGH_END_BODY_GAP_CLASS} min-h-0 flex-1 rounded-md border border-cyan-300/25 bg-slate-950/65 p-3`}>
            <div className="space-y-6">
              <div>
                <FittedText
                  as="p"
                  slotKey={`${auditPrefix}:fighter-a`}
                  spec={TEMPLATE_SLOT_SPECS.fighterBannerNameLarge}
                  text={fighterAName}
                  className={X_FACTOR_FIGHTER_NAME_CLASS}
                  style={{ color: '#38bdf8', fontFamily: 'var(--font-display)' }}
                  templateId="x-factor"
                  activeFightId={activeFightId}
                  language={language}
                />
                <div className="mt-2 grid grid-cols-[1fr_168px] items-center gap-2">
                  <div className="relative h-14 overflow-hidden rounded-md border-2 border-slate-500/70 bg-slate-900/85 shadow-[0_0_0_1px_rgba(125,211,252,0.12)]">
                    <div className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,#0ea5e9,#1d4ed8)]" style={{ width: `${superPct}%` }} />
                    {superBonusPct > 0 ? (
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          clipPath: `inset(5% ${Math.max(0, 100 - superTotalPct)}% 5% ${Math.max(0, Math.min(100, superPct))}%)`,
                          background:
                            'repeating-linear-gradient(135deg, rgba(56,189,248,0.75) 0px, rgba(56,189,248,0.75) 8px, rgba(15,23,42,0) 8px, rgba(15,23,42,0) 16px)',
                        }}
                      />
                    ) : null}
                    <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(226,232,240,0.08)_0px,rgba(226,232,240,0.08)_8px,rgba(15,23,42,0)_8px,rgba(15,23,42,0)_16px)]" />
                  </div>
                  <div className="flex h-14 w-[168px] flex-col items-center justify-center rounded-md border-2 border-cyan-300/55 bg-slate-950/92 px-3 leading-none text-sky-300">
                    <span className={X_FACTOR_VALUE_CLASS}>{Math.round(superPct)}%</span>
                    <span className={`${X_FACTOR_VALUE_BONUS_CLASS} text-cyan-100`}>
                      {superBonusPct > 0 ? `+${Math.round(superBonusPct)}%` : '\u00A0'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <FittedText
                  as="p"
                  slotKey={`${auditPrefix}:fighter-b`}
                  spec={TEMPLATE_SLOT_SPECS.fighterBannerNameLarge}
                  text={fighterBName}
                  className={X_FACTOR_FIGHTER_NAME_CLASS}
                  style={{ color: '#f87171', fontFamily: 'var(--font-display)' }}
                  templateId="x-factor"
                  activeFightId={activeFightId}
                  language={language}
                />
                <div className="mt-2 grid grid-cols-[1fr_168px] items-center gap-2">
                  <div className="relative h-14 overflow-hidden rounded-md border-2 border-slate-500/70 bg-slate-900/85 shadow-[0_0_0_1px_rgba(248,113,113,0.12)]">
                    <div className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,#ef4444,#b91c1c)]" style={{ width: `${hyperPct}%` }} />
                    {hyperBonusPct > 0 ? (
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          clipPath: `inset(5% ${Math.max(0, 100 - hyperTotalPct)}% 5% ${Math.max(0, Math.min(100, hyperPct))}%)`,
                          background:
                            'repeating-linear-gradient(135deg, rgba(248,113,113,0.75) 0px, rgba(248,113,113,0.75) 8px, rgba(15,23,42,0) 8px, rgba(15,23,42,0) 16px)',
                        }}
                      />
                    ) : null}
                    <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(226,232,240,0.08)_0px,rgba(226,232,240,0.08)_8px,rgba(15,23,42,0)_8px,rgba(15,23,42,0)_16px)]" />
                  </div>
                  <div className="flex h-14 w-[168px] flex-col items-center justify-center rounded-md border-2 border-rose-300/55 bg-slate-950/92 px-3 leading-none text-rose-200">
                    <span className={X_FACTOR_VALUE_CLASS}>{Math.round(hyperPct)}%</span>
                    <span className={`${X_FACTOR_VALUE_BONUS_CLASS} text-rose-100`}>
                      {hyperBonusPct > 0 ? `+${Math.round(hyperBonusPct)}%` : '\u00A0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className={TEMPLATE_INSIGHT_CARD_CLASS}>
                <div className={TEMPLATE_INSIGHT_ROW_CLASS}>
                  <div className={TEMPLATE_INSIGHT_ICON_WRAP_CLASS}>
                    <WandSparkles size={TEMPLATE_INSIGHT_ICON_SIZE} strokeWidth={TEMPLATE_INSIGHT_ICON_STROKE} />
                  </div>
                  <div className="min-w-0">
                    <FittedText
                      as="p"
                      slotKey={`${auditPrefix}:mechanics-title`}
                      spec={TEMPLATE_SLOT_SPECS.xFactorInsightTitle}
                      text={common.mechanicsLabel}
                      className={TEMPLATE_INSIGHT_TITLE_CLASS}
                      templateId="x-factor"
                      activeFightId={activeFightId}
                      language={language}
                    />
                    <FittedText
                      as="p"
                      slotKey={`${auditPrefix}:mechanics`}
                      spec={TEMPLATE_SLOT_SPECS.xFactorInsightBody}
                      text={mechanics}
                      className="mt-1 text-slate-200"
                      templateId="x-factor"
                      activeFightId={activeFightId}
                      language={language}
                    />
                  </div>
                </div>
              </div>

              <div className={TEMPLATE_INSIGHT_CARD_CLASS}>
                <div className={TEMPLATE_INSIGHT_ROW_CLASS}>
                  <div className={TEMPLATE_INSIGHT_ICON_WRAP_CLASS}>
                    <Crosshair size={TEMPLATE_INSIGHT_ICON_SIZE} strokeWidth={TEMPLATE_INSIGHT_ICON_STROKE} />
                  </div>
                  <div className="min-w-0">
                    <FittedText
                      as="p"
                      slotKey={`${auditPrefix}:implication-title`}
                      spec={TEMPLATE_SLOT_SPECS.xFactorInsightTitle}
                      text={common.implicationLabel}
                      className={TEMPLATE_INSIGHT_TITLE_CLASS}
                      templateId="x-factor"
                      activeFightId={activeFightId}
                      language={language}
                    />
                    <FittedText
                      as="p"
                      slotKey={`${auditPrefix}:implication`}
                      spec={TEMPLATE_SLOT_SPECS.xFactorInsightBody}
                      text={implication}
                      className="mt-1 text-slate-200"
                      templateId="x-factor"
                      activeFightId={activeFightId}
                      language={language}
                    />
                  </div>
                </div>
              </div>

              <div className={TEMPLATE_INSIGHT_CARD_CLASS}>
                <div className={TEMPLATE_INSIGHT_ROW_CLASS}>
                  <div className={TEMPLATE_INSIGHT_ICON_WRAP_CLASS}>
                    <Brain size={TEMPLATE_INSIGHT_ICON_SIZE} strokeWidth={TEMPLATE_INSIGHT_ICON_STROKE} />
                  </div>
                  <div className="min-w-0">
                    <FittedText
                      as="p"
                      slotKey={`${auditPrefix}:psychology-title`}
                      spec={TEMPLATE_SLOT_SPECS.xFactorInsightTitle}
                      text={common.psychologyLabel}
                      className={TEMPLATE_INSIGHT_TITLE_CLASS}
                      templateId="x-factor"
                      activeFightId={activeFightId}
                      language={language}
                    />
                    <FittedText
                      as="p"
                      slotKey={`${auditPrefix}:psychology`}
                      spec={TEMPLATE_SLOT_SPECS.xFactorInsightBody}
                      text={psychology}
                      className="mt-1 text-slate-200"
                      templateId="x-factor"
                      activeFightId={activeFightId}
                      language={language}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
