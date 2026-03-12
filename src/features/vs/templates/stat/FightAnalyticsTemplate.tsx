import { buildFightTemplateChrome, getFightCommonCopy, getFightTemplateDefaultField } from '../../fightManifest'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { TemplatePreviewProps } from '../../types'
import {
  HIGH_END_BODY_GAP_CLASS,
  HIGH_END_CARD_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HighEndTemplateHeader,
} from '../shared/highEnd'
import { FittedText } from '../shared/FittedText'
import { TEMPLATE_SLOT_SPECS } from '../shared/templateSlotSpecs'

export function FightAnalyticsTemplate({
  rows,
  fighterA,
  fighterB,
  averageA,
  averageB,
  title,
  subtitle,
  templateBlocks,
  activeFightId,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['fight-analytics'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const chrome = buildFightTemplateChrome(language, blockFields)
  const common = getFightCommonCopy(language)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle
  const averageShort =
    getFightTemplateDefaultField('fight-analytics', 'average_short', language) || common.averageShort
  const parameterLabel =
    getFightTemplateDefaultField('fight-analytics', 'parameter_label', language) || common.parameterLabel
  const scoreScaleLabel =
    getFightTemplateDefaultField('fight-analytics', 'score_scale_label', language) || common.scoreScaleLabel
  const auditPrefix = `${activeFightId || 'draft'}:fight-analytics`

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

          <div className={`${HIGH_END_BODY_GAP_CLASS} grid grid-cols-2 gap-2 text-[12px]`}>
            <div className={`${HIGH_END_CARD_CLASS} px-3 py-2`} style={{ boxShadow: `0 0 0 1px ${fighterA.color}33 inset` }}>
              <FittedText
                as="p"
                slotKey={`${auditPrefix}:fighter-a`}
                spec={TEMPLATE_SLOT_SPECS.fighterBannerName}
                text={fighterA.name}
                className="uppercase tracking-[0.16em] text-slate-300"
                templateId="fight-analytics"
                activeFightId={activeFightId}
                language={language}
              />
              <p className="font-semibold" style={{ color: fighterA.color }}>
                {averageShort} {averageA.toFixed(1)}
              </p>
            </div>
            <div className={`${HIGH_END_CARD_CLASS} px-3 py-2`} style={{ boxShadow: `0 0 0 1px ${fighterB.color}33 inset` }}>
              <FittedText
                as="p"
                slotKey={`${auditPrefix}:fighter-b`}
                spec={TEMPLATE_SLOT_SPECS.fighterBannerName}
                text={fighterB.name}
                className="uppercase tracking-[0.16em] text-slate-300"
                templateId="fight-analytics"
                activeFightId={activeFightId}
                language={language}
              />
              <p className="font-semibold" style={{ color: fighterB.color }}>
                {averageShort} {averageB.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="mt-3 min-h-0 flex-1">
            <div className="grid grid-cols-[190px_1fr] items-center gap-4 px-1 text-[11px] uppercase tracking-[0.15em] text-slate-400">
              <p>{parameterLabel}</p>
              <div className="space-y-1">
                <span>{scoreScaleLabel}</span>
                <div className="grid grid-cols-[1fr_30px] items-start gap-2">
                  <div className="relative h-3 text-[10px] text-slate-500">
                    <span className="absolute left-0 top-0">0</span>
                    <span className="absolute left-1/4 top-0 -translate-x-1/2">25</span>
                    <span className="absolute left-1/2 top-0 -translate-x-1/2">50</span>
                    <span className="absolute left-3/4 top-0 -translate-x-1/2">75</span>
                    <span className="absolute right-0 top-0">100</span>
                  </div>
                  <div />
                </div>
              </div>
            </div>
            <div className="mt-2 grid min-h-0 flex-1 gap-2">
              {rows.map((row, index) => (
                <div
                  key={`row-${row.id}`}
                  className="grid h-[50px] grid-cols-[190px_1fr] items-center gap-4 rounded border border-cyan-300/15 bg-slate-950/55 px-2"
                  style={{ animationDelay: `${index * 0.04}s` }}
                >
                  <FittedText
                    as="div"
                    slotKey={`${auditPrefix}:row-label-${row.id}`}
                    spec={TEMPLATE_SLOT_SPECS.parameterAdvantageValue}
                    text={row.label}
                    className="pr-2 text-slate-100"
                    templateId="fight-analytics"
                    activeFightId={activeFightId}
                    language={language}
                  />
                  <div className="space-y-1">
                    <div className="grid grid-cols-[1fr_30px] items-center gap-2">
                      <div className="h-3 overflow-hidden rounded border border-slate-700/70 bg-black/55">
                        <div className="h-full rounded-r transition-[width] duration-700" style={{ width: `${row.a}%`, backgroundColor: fighterA.color }} />
                      </div>
                      <span className="text-right text-sm text-slate-200">{row.a}</span>
                    </div>
                    <div className="grid grid-cols-[1fr_30px] items-center gap-2">
                      <div className="h-3 overflow-hidden rounded border border-slate-700/70 bg-black/55">
                        <div className="h-full rounded-r transition-[width] duration-700" style={{ width: `${row.b}%`, backgroundColor: fighterB.color }} />
                      </div>
                      <span className="text-right text-sm text-slate-200">{row.b}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
