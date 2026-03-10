import { AdjustableTemplateImage } from '../../../components/AdjustableTemplateImage'
import { buildFightTemplateChrome, getFightCommonCopy, getFightTemplateDefaultField } from '../../../fightManifest'
import { fighterMonogram } from '../../../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import {
  HIGH_END_BODY_GAP_CLASS,
  HIGH_END_CARD_CLASS,
  HIGH_END_FRAME_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_INSET_CLASS,
  HIGH_END_LABEL_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HIGH_END_SMALL_TEXT_CLASS,
  HighEndTemplateHeader,
} from '../../shared/highEnd'

export function SummaryTemplate({
  fighterA,
  fighterB,
  portraitAAdjust,
  portraitBAdjust,
  averageA,
  averageB,
  title,
  subtitle,
  templateBlocks,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['final-summary'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome(language, blockFields)
  const common = getFightCommonCopy(language)
  const line = (position: number, keys: string[], fallback = '') =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const portraitHint = chrome.portraitAdjustHint
  const winnerLabel =
    pickTemplateField(blockFields, ['winner', 'verdict']) ||
    getFightTemplateDefaultField('final-summary', 'winner', language)
  const summaryLines = [
    line(0, ['line_1', 'line1'], getFightTemplateDefaultField('final-summary', 'line_1', language)),
    line(1, ['line_2', 'line2'], getFightTemplateDefaultField('final-summary', 'line_2', language)),
    line(2, ['line_3', 'line3'], getFightTemplateDefaultField('final-summary', 'line_3', language)),
  ]

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

          <div className={`${HIGH_END_BODY_GAP_CLASS} grid min-h-0 flex-1 grid-cols-[1.05fr_1.2fr_1.05fr] gap-3`}>
            <div className={`${HIGH_END_FRAME_CLASS} min-h-0 p-2`} style={{ boxShadow: `0 0 0 1px ${fighterA.color}33 inset` }}>
              <div className={`mb-2 ${HIGH_END_INSET_CLASS} px-3 py-2`}>
                <p className={HIGH_END_SMALL_TEXT_CLASS}>{common.blueCorner}</p>
                <p className="text-lg uppercase leading-none" style={{ color: fighterA.color, fontFamily: 'var(--font-display)' }}>
                  {fighterA.name || 'Fighter A'}
                </p>
              </div>
              <div className="relative h-[78%] overflow-hidden rounded-lg border bg-slate-950/80" style={{ borderColor: `${fighterA.color}88` }}>
                {fighterA.imageUrl ? (
                  <AdjustableTemplateImage
                    imageUrl={fighterA.imageUrl}
                    alt={fighterA.name || 'Fighter A'}
                    fallbackLabel={common.portraitSlot}
                    hintLabel={portraitHint}
                    adjustKey="final-summary:portrait-a"
                    baseAdjust={portraitAAdjust}
                    adjustments={slideImageAdjustments}
                    onAdjustChange={onSlideImageAdjustChange}
                    onAdjustCommit={onSlideImageAdjustCommit}
                    plain
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.14),transparent_45%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.9))]"
                    style={{ color: fighterA.color }}
                  >
                    <div className="text-center">
                      <p className="text-[56px] font-semibold tracking-[0.04em]">{fighterMonogram(fighterA.name || 'Fighter A')}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{common.portraitSlot}</p>
                    </div>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 border-[3px] border-black/35" />
                <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:28px_28px]" />
              </div>
            </div>

            <div className={`${HIGH_END_FRAME_CLASS} flex min-h-0 flex-col p-3`}>
              <div className="rounded-xl border border-amber-300/55 bg-[linear-gradient(115deg,rgba(120,53,15,0.42),rgba(251,191,36,0.35),rgba(120,53,15,0.42))] px-4 py-3 text-left">
                <p className="text-xs uppercase tracking-[0.18em] text-amber-100">{common.verdictLabel}</p>
                <p
                  className="mt-2 max-w-[20ch] text-[clamp(1.6rem,2.2vw,2.8rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-white"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {winnerLabel}
                </p>
              </div>

              <div className="mt-2 grid shrink-0 grid-cols-2 gap-2">
                <div className={`${HIGH_END_CARD_CLASS} px-3 py-1.5`} style={{ boxShadow: `0 0 0 1px ${fighterA.color}33 inset` }}>
                  <p className="text-xs uppercase tracking-[0.16em]">{fighterA.name || 'Fighter A'}</p>
                  <p className="text-[1.75rem] font-semibold leading-none" style={{ color: fighterA.color }}>
                    {Math.round(averageA)}
                  </p>
                </div>
                <div className={`${HIGH_END_CARD_CLASS} px-3 py-1.5`} style={{ boxShadow: `0 0 0 1px ${fighterB.color}33 inset` }}>
                  <p className="text-xs uppercase tracking-[0.16em]">{fighterB.name || 'Fighter B'}</p>
                  <p className="text-[1.75rem] font-semibold leading-none" style={{ color: fighterB.color }}>
                    {Math.round(averageB)}
                  </p>
                </div>
              </div>

              <div className={`mt-2 shrink-0 ${HIGH_END_CARD_CLASS} p-2`}>
                <p className={HIGH_END_LABEL_CLASS}>{common.summaryLabel}</p>
                <div className="mt-2 space-y-1.5 text-[0.92rem] leading-[1.18] text-slate-100">
                  {summaryLines.map((item, index) => (
                    <div key={`summary-line-${index}-${item}`} className="rounded border border-slate-700/60 bg-black/35 px-2 py-1">
                      {index + 1}. {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`${HIGH_END_FRAME_CLASS} min-h-0 p-2`} style={{ boxShadow: `0 0 0 1px ${fighterB.color}33 inset` }}>
              <div className={`mb-2 ${HIGH_END_INSET_CLASS} px-3 py-2`}>
                <p className={HIGH_END_SMALL_TEXT_CLASS}>{common.redCorner}</p>
                <p className="text-lg uppercase leading-none" style={{ color: fighterB.color, fontFamily: 'var(--font-display)' }}>
                  {fighterB.name || 'Fighter B'}
                </p>
              </div>
              <div className="relative h-[78%] overflow-hidden rounded-lg border bg-slate-950/80" style={{ borderColor: `${fighterB.color}88` }}>
                {fighterB.imageUrl ? (
                  <AdjustableTemplateImage
                    imageUrl={fighterB.imageUrl}
                    alt={fighterB.name || 'Fighter B'}
                    fallbackLabel={common.portraitSlot}
                    hintLabel={portraitHint}
                    adjustKey="final-summary:portrait-b"
                    baseAdjust={portraitBAdjust}
                    adjustments={slideImageAdjustments}
                    onAdjustChange={onSlideImageAdjustChange}
                    onAdjustCommit={onSlideImageAdjustCommit}
                    plain
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.14),transparent_45%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.9))]"
                    style={{ color: fighterB.color }}
                  >
                    <div className="text-center">
                      <p className="text-[56px] font-semibold tracking-[0.04em]">{fighterMonogram(fighterB.name || 'Fighter B')}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{common.portraitSlot}</p>
                    </div>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 border-[3px] border-black/35" />
                <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:28px_28px]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
