import { useEffect } from 'react'
import { AdjustableTemplateImage } from '../../components/AdjustableTemplateImage'
import { preloadImageUrls } from '../../domain/imagePreloadCache'
import { useScopedCycleIndex } from '../../hooks/useScopedCycleIndex'
import { DEFAULT_WINNER_CV_A, DEFAULT_WINNER_CV_B } from '../../presets'
import {
  buildCanonicalLegacyTemplateImageAdjustKey,
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
import { FittedText } from '../shared/FittedText'
import { HighEndFighterBanner, HighEndTemplateHeader } from '../shared/highEnd'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../shared/templateUi'

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
  const chrome = buildFightTemplateChrome('victory-archive', language, blockFields)
  const common = getFightCommonCopy('victory-archive', language)
  const ui = getTemplateUi('victory-archive', language)
  const shell = ui.highEnd as Record<string, string>
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const archiveLabel = getFightTemplateDefaultField('victory-archive', 'archive_label', language)
  const subText = subtitle || archiveLabel
  const fighterAText = fighterA.name || getFightTemplateDefaultField('victory-archive', 'fighter_a_fallback', language)
  const fighterBText = fighterB.name || getFightTemplateDefaultField('victory-archive', 'fighter_b_fallback', language)
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

  useEffect(() => {
    const nextLeftEntry = leftEntries[pairIndex + 1] || null
    const nextRightEntry = rightEntries[pairIndex + 1] || null
    const preloadUrls = [
      nextLeftEntry
        ? resolveFightTemplateImageUrl(activeFightFolderKey, nextLeftEntry.imageFile, {
            templateId: 'victory-archive',
            side: 'left',
            slot: nextLeftEntry.slot,
          })
        : '',
      nextRightEntry
        ? resolveFightTemplateImageUrl(activeFightFolderKey, nextRightEntry.imageFile, {
            templateId: 'victory-archive',
            side: 'right',
            slot: nextRightEntry.slot,
          })
        : '',
    ].filter(Boolean)

    if (!preloadUrls.length) return
    void preloadImageUrls(preloadUrls)
  }, [activeFightFolderKey, leftEntries, pairIndex, rightEntries])

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
    const legacyAdjustKeys = [
      buildCanonicalLegacyTemplateImageAdjustKey('victory-archive', side, entry),
      buildLegacyTemplateImageAdjustKey('victory-archive', side, entry),
    ]
    const entryBadge = (
      <span
        className={layout.ENTRY_BADGE_CLASS}
        style={{ borderColor: `${fighter.color}88`, color: fighter.color }}
      >
        {pairCount} {entriesUnit}
      </span>
    )

    return (
      <div className={layout.COLUMN_CLASS}>
        <HighEndFighterBanner templateId="victory-archive" language={language} fighter={fighter} trailing={entryBadge} />
        <div className={layout.COLUMN_BODY_CLASS}>
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
          <div className={layout.CAPTION_CARD_CLASS}>
            <FittedText
              as="p"
              slotKey={`victory-archive:${side}:caption:${entry?.id || 'empty'}`}
              spec={slots.imageCaption}
              text={entry?.text || common.noEntry}
              className={layout.CAPTION_TEXT_CLASS}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={shell.HIGH_END_ROOT_CLASS}>
      <div className={shell.HIGH_END_PANEL_CLASS}>
        <div className={shell.HIGH_END_GRID_OVERLAY_CLASS} />
        <div className={layout.INNER_CLASS}>
          <HighEndTemplateHeader
            templateId="victory-archive"
            language={language}
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />
          <div className={`${shell.HIGH_END_BODY_GAP_CLASS} ${layout.BODY_CLASS}`}>
            {renderColumn(fighterA, leftTitle, leftEntry, 'left')}
            {renderColumn(fighterB, rightTitle, rightEntry, 'right')}
          </div>
        </div>
      </div>
    </div>
  )
}
