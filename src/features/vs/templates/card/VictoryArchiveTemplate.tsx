import { AdjustableTemplateImage } from '../../components/AdjustableTemplateImage'
import { buildFightTemplateChrome, getFightCommonCopy, getFightTemplateDefaultField } from '../../fightManifest'
import { useScopedCycleIndex } from '../../hooks/useScopedCycleIndex'
import { DEFAULT_WINNER_CV_A, DEFAULT_WINNER_CV_B } from '../../presets'
import {
  TEMPLATE_BLOCK_ALIASES,
  buildLegacyTemplateImageAdjustKey,
  buildTemplateImageAdjustKey,
  buildTemplateImageEntries,
  findTemplateBlockLines,
  parseTemplateFieldMap,
  pickTemplateField,
  resolveFightTemplateImageUrl,
  type TemplateImageEntry,
} from '../../importer'
import type { Fighter, TemplatePreviewProps } from '../../types'
import {
  HIGH_END_CARD_CLASS,
  HIGH_END_FRAME_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_HEADER_CLASS,
  HIGH_END_INSET_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HIGH_END_SUBTEXT_CLASS,
} from '../shared/highEnd'

export function VictoryArchiveTemplate({
  fighterA,
  fighterB,
  title,
  subtitle,
  winsA,
  winsB,
  templateBlocks,
  activeFightFolderKey,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['victory-archive'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const chrome = buildFightTemplateChrome(language, blockFields)
  const common = getFightCommonCopy(language)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const archiveLabel =
    pickTemplateField(blockFields, ['archive_label']) ||
    getFightTemplateDefaultField('victory-archive', 'archive_label', language)
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle || archiveLabel
  const fighterAText = fighterA.name || 'Fighter A'
  const fighterBText = fighterB.name || 'Fighter B'
  const leftTitle =
    pickTemplateField(blockFields, ['left_title']) ||
    `${getFightTemplateDefaultField('victory-archive', 'left_title_prefix', language)} ${fighterAText}`
  const rightTitle =
    pickTemplateField(blockFields, ['right_title']) ||
    `${getFightTemplateDefaultField('victory-archive', 'right_title_prefix', language)} ${fighterBText}`
  const leftWins = winsA.length ? winsA : DEFAULT_WINNER_CV_A
  const rightWins = winsB.length ? winsB : DEFAULT_WINNER_CV_B
  const leftEntries = buildTemplateImageEntries(blockFields, 'left', leftWins)
  const rightEntries = buildTemplateImageEntries(blockFields, 'right', rightWins)
  const pairCount = Math.max(1, leftEntries.length, rightEntries.length)
  const pairScope = `${activeFightFolderKey || 'standalone'}:${leftEntries.length}:${rightEntries.length}`
  const [pairIndex, nextPair] = useScopedCycleIndex(pairScope, pairCount)

  const leftEntry = leftEntries.length ? leftEntries[pairIndex % leftEntries.length] : null
  const rightEntry = rightEntries.length ? rightEntries[pairIndex % rightEntries.length] : null
  const entriesUnit =
    pickTemplateField(blockFields, ['entries_unit']) ||
    getFightTemplateDefaultField('victory-archive', 'entries_unit', language) ||
    common.entriesUnit

  const renderColumn = (
    fighter: Fighter,
    columnTitle: string,
    entry: TemplateImageEntry | null,
    side: 'left' | 'right',
  ) => {
    const imageUrl = entry
      ? resolveFightTemplateImageUrl(activeFightFolderKey, entry.imageFile, {
          templateId: 'victory-archive',
          side,
          slot: entry.slot,
        })
      : ''
    const adjustKey = buildTemplateImageAdjustKey('victory-archive', side, entry)
    const legacyAdjustKeys = [buildLegacyTemplateImageAdjustKey('victory-archive', side, entry)]

    return (
      <div className={`flex h-full min-h-0 flex-col ${HIGH_END_FRAME_CLASS} p-3`}>
        <div className={`${HIGH_END_INSET_CLASS} px-3 py-2`} style={{ boxShadow: `0 0 0 1px ${fighter.color}33 inset` }}>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-[28px] uppercase leading-none tracking-[0.03em]" style={{ color: fighter.color, fontFamily: 'var(--font-display)' }}>
              {fighter.name || 'Fighter'}
            </p>
            <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]" style={{ borderColor: `${fighter.color}88`, color: fighter.color }}>
              {pairCount} {entriesUnit}
            </span>
          </div>
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2">
          <AdjustableTemplateImage
            imageUrl={imageUrl}
            alt={entry?.text || columnTitle}
            fallbackLabel={common.noImage}
            hintLabel=""
            adjustKey={adjustKey}
            legacyAdjustKeys={legacyAdjustKeys}
            adjustments={slideImageAdjustments}
            onAdjustChange={onSlideImageAdjustChange}
            onAdjustCommit={onSlideImageAdjustCommit}
            onActivate={nextPair}
          />
          <div className={`${HIGH_END_CARD_CLASS} flex h-[18px] items-start overflow-hidden px-3 pt-[3px]`}>
            <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-[11px] leading-[1.1] text-slate-200">
              {entry?.text || common.noEntry}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full flex-col">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 border-b border-cyan-300/25 pb-3 text-[11px] text-slate-300">
            <div className="min-w-[238px] space-y-1 pt-2 text-left">
              <p className="whitespace-nowrap uppercase tracking-[0.16em]">{chrome.threatLevelLabel}: {chrome.threatLevelValue}</p>
              <p className="whitespace-nowrap uppercase tracking-[0.16em]">{chrome.dataIntegrityLabel}: {chrome.dataIntegrityValue}</p>
            </div>
            <div className="text-center">
              <h2 className={HIGH_END_HEADER_CLASS} style={{ fontFamily: 'var(--font-display)' }}>{headerText}</h2>
              {subText ? <p className={HIGH_END_SUBTEXT_CLASS}>{subText}</p> : null}
            </div>
            <div className="flex items-start justify-end pt-1">
              <button
                type="button"
                className="flex h-[86px] aspect-[755/322] items-center justify-center overflow-hidden rounded-[14px] border border-cyan-300/35 bg-[linear-gradient(180deg,rgba(7,24,42,0.96),rgba(4,14,24,0.94))] p-0 shadow-[0_0_0_1px_rgba(125,211,252,0.08)_inset,0_10px_26px_rgba(2,8,23,0.45)] cursor-pointer transition-transform active:scale-95"
                title={chrome.brandMarkTitle}
                aria-label={chrome.brandMarkAria}
                onClick={onToggleLanguage}
              >
                <img src={chrome.brandImageSrc} alt={chrome.brandAlt} className="h-full w-full object-contain drop-shadow-[0_0_14px_rgba(251,146,60,0.28)]" draggable={false} />
              </button>
            </div>
          </div>
          <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 gap-3">
            {renderColumn(fighterA, leftTitle, leftEntry, 'left')}
            {renderColumn(fighterB, rightTitle, rightEntry, 'right')}
          </div>
        </div>
      </div>
    </div>
  )
}
