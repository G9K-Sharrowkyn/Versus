import { useScopedCycleIndex } from '../../hooks/useScopedCycleIndex'
import { pickLang } from '../../presets'
import {
  TEMPLATE_BLOCK_ALIASES,
  buildTemplateImageEntries,
  findTemplateBlockLines,
  parseTemplateFieldMap,
  pickTemplateField,
  resolveFightTemplateImageUrl,
  type TemplateImageEntry,
} from '../../importer'
import type { Fighter, TemplatePreviewProps } from '../../types'
import { AdjustableTemplateImage } from '../../components/AdjustableTemplateImage'

export function RawFeatsTemplate({
  fighterA,
  fighterB,
  rawFeatsA,
  rawFeatsB,
  title,
  subtitle,
  templateBlocks,
  activeFightFolderKey,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['raw-feats'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const leftTitle =
    pickTemplateField(blockFields, ['left_title']) || `${fighterA.name || 'Fighter A'} ${tr('featy', 'feats')}`
  const rightTitle =
    pickTemplateField(blockFields, ['right_title']) || `${fighterB.name || 'Fighter B'} ${tr('featy', 'feats')}`
  const featLabel = pickTemplateField(blockFields, ['feat_label']) || tr('Feat', 'Feat')
  const leftEntries = buildTemplateImageEntries(blockFields, 'left', rawFeatsA)
  const rightEntries = buildTemplateImageEntries(blockFields, 'right', rawFeatsB)
  const pairCount = Math.max(1, leftEntries.length, rightEntries.length)
  const pairScope = `${activeFightFolderKey || 'standalone'}:${leftEntries.length}:${rightEntries.length}`
  const [pairIndex, nextPair] = useScopedCycleIndex(pairScope, pairCount)

  const leftEntry = leftEntries.length ? leftEntries[pairIndex % leftEntries.length] : null
  const rightEntry = rightEntries.length ? rightEntries[pairIndex % rightEntries.length] : null

  const renderColumn = (
    fighter: Fighter,
    columnTitle: string,
    entry: TemplateImageEntry | null,
    side: 'left' | 'right',
  ) => {
    const imageUrl = entry ? resolveFightTemplateImageUrl(activeFightFolderKey, entry.imageFile) : ''
    const adjustKey = `raw-feats:${side}:${entry?.id || 'empty'}`

    return (
      <div className="flex h-full min-h-0 flex-col rounded-xl border border-white/20 bg-black/28 p-3">
        <div
          className="rounded-lg border px-3 py-2"
          style={{ borderColor: `${fighter.color}88`, backgroundColor: `${fighter.color}18` }}
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">{fighter.name || 'Fighter'}</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-[14px] uppercase tracking-[0.14em]" style={{ color: fighter.color }}>
              {columnTitle}
            </p>
            <span
              className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]"
              style={{ borderColor: `${fighter.color}88`, color: fighter.color }}
            >
              {pairCount} {tr('wpisow', 'entries')}
            </span>
          </div>
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2">
          <AdjustableTemplateImage
            imageUrl={imageUrl}
            alt={entry?.text || columnTitle}
            fallbackLabel={tr('Brak obrazu', 'No image')}
            hintLabel={tr('LPM: przesun | PPM: skaluj', 'LMB: move | RMB: zoom')}
            adjustKey={adjustKey}
            adjustments={slideImageAdjustments}
            onAdjustChange={onSlideImageAdjustChange}
            onAdjustCommit={onSlideImageAdjustCommit}
            onActivate={nextPair}
          />
          <div className="rounded-lg border border-slate-600/60 bg-slate-950/78 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: fighter.color }}>
                {featLabel} {String((pairIndex % pairCount) + 1).padStart(2, '0')}
              </p>
              <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                {pairCount} {tr('wpisow', 'entries')}
              </span>
            </div>
            <p className="text-sm leading-snug text-slate-200">{entry?.text || tr('Brak wpisu.', 'No entry.')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-slate-400/25 pb-2">
        <div />
        <h2 className="text-2xl uppercase tracking-[0.08em] text-slate-50">{headerText}</h2>
        <div className="text-right text-[11px] uppercase tracking-[0.18em] text-slate-300">{subText}</div>
      </div>
      <div className="mt-2 text-center text-[11px] uppercase tracking-[0.16em] text-slate-400">
        {tr('Kliknij obraz aby przejsc do kolejnej pary.', 'Click an image to switch to the next pair.')}
      </div>
      <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 gap-3">
        {renderColumn(fighterA, leftTitle, leftEntry, 'left')}
        {renderColumn(fighterB, rightTitle, rightEntry, 'right')}
      </div>
    </div>
  )
}
