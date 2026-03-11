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
  HIGH_END_BODY_GAP_CLASS,
  HIGH_END_CARD_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HighEndFighterBanner,
  HighEndTemplateHeader,
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
  const archiveLabel = getFightTemplateDefaultField('victory-archive', 'archive_label', language)
  const subText = subtitle || archiveLabel
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

  const leftEntry = pairIndex < leftEntries.length ? leftEntries[pairIndex] : null
  const rightEntry = pairIndex < rightEntries.length ? rightEntries[pairIndex] : null
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
    const entryBadge = (
      <span
        className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]"
        style={{ borderColor: `${fighter.color}88`, color: fighter.color }}
      >
        {pairCount} {entriesUnit}
      </span>
    )

    return (
      <div className="flex h-full min-h-0 flex-col">
        <HighEndFighterBanner fighter={fighter} trailing={entryBadge} />
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
          <HighEndTemplateHeader
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />
          <div className={`${HIGH_END_BODY_GAP_CLASS} grid min-h-0 flex-1 grid-cols-2 gap-3`}>
            {renderColumn(fighterA, leftTitle, leftEntry, 'left')}
            {renderColumn(fighterB, rightTitle, rightEntry, 'right')}
          </div>
        </div>
      </div>
    </div>
  )
}
