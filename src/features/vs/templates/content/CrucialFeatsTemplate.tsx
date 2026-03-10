import { AdjustableTemplateImage } from '../../components/AdjustableTemplateImage'
import { buildFightTemplateChrome, getFightCommonCopy } from '../../fightManifest'
import { useScopedCycleIndex } from '../../hooks/useScopedCycleIndex'
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

export function CrucialFeatsTemplate({
  fighterA,
  fighterB,
  crucialFeatsA,
  crucialFeatsB,
  title,
  subtitle,
  templateBlocks,
  activeFightFolderKey,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['crucial-feats'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const chrome = buildFightTemplateChrome(language, blockFields)
  const common = getFightCommonCopy(language)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle || ''
  const leftEntries = buildTemplateImageEntries(blockFields, 'left', crucialFeatsA)
  const rightEntries = buildTemplateImageEntries(blockFields, 'right', crucialFeatsB)
  const pairCount = Math.max(1, leftEntries.length, rightEntries.length)
  const pairScope = `${activeFightFolderKey || 'standalone'}:${leftEntries.length}:${rightEntries.length}`
  const [pairIndex, nextPair] = useScopedCycleIndex(pairScope, pairCount)

  const leftEntry = leftEntries.length ? leftEntries[pairIndex % leftEntries.length] : null
  const rightEntry = rightEntries.length ? rightEntries[pairIndex % rightEntries.length] : null

  const renderColumn = (
    fighter: Fighter,
    entry: TemplateImageEntry | null,
    side: 'left' | 'right',
  ) => {
    const imageUrl = entry
      ? resolveFightTemplateImageUrl(activeFightFolderKey, entry.imageFile, {
          templateId: 'crucial-feats',
          side,
          slot: entry.slot,
        })
      : ''
    const adjustKey = buildTemplateImageAdjustKey('crucial-feats', side, entry)
    const legacyAdjustKeys = [buildLegacyTemplateImageAdjustKey('crucial-feats', side, entry)]

    return (
      <div className="flex h-full min-h-0 flex-col">
        <HighEndFighterBanner fighter={fighter} />
        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-1">
          <AdjustableTemplateImage
            imageUrl={imageUrl}
            alt={entry?.text || fighter.name || 'Fighter'}
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
            {renderColumn(fighterA, leftEntry, 'left')}
            {renderColumn(fighterB, rightEntry, 'right')}
          </div>
        </div>
      </div>
    </div>
  )
}
