import '../shared/theme.css'
import { useEffect } from 'react'
import { AdjustableTemplateImage } from '../../components/AdjustableTemplateImage'
import { preloadImageUrls } from '../../domain/imagePreloadCache'
import { useScopedCycleIndex } from '../../hooks/useScopedCycleIndex'
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
import { HighEndFighterBanner } from '../shared/highEnd'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../shared/templateUi'

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
  const chrome = buildFightTemplateChrome('crucial-feats', language, blockFields)
  const common = getFightCommonCopy('crucial-feats', language)
  const ui = getTemplateUi('crucial-feats', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle || ''
  const leftEntries = buildTemplateImageEntries(blockFields, 'left', crucialFeatsA)
  const rightEntries = buildTemplateImageEntries(blockFields, 'right', crucialFeatsB)
  const pairCount = Math.max(1, leftEntries.length, rightEntries.length)
  const pairScope = `${activeFightFolderKey || 'standalone'}:${leftEntries.length}:${rightEntries.length}`
  const [pairIndex, nextPair] = useScopedCycleIndex(pairScope, pairCount)

  const leftEntry = pairIndex < leftEntries.length ? leftEntries[pairIndex] : null
  const rightEntry = pairIndex < rightEntries.length ? rightEntries[pairIndex] : null

  useEffect(() => {
    const nextLeftEntry = leftEntries[pairIndex + 1] || null
    const nextRightEntry = rightEntries[pairIndex + 1] || null
    const preloadUrls = [
      nextLeftEntry
        ? resolveFightTemplateImageUrl(activeFightFolderKey, nextLeftEntry.imageFile, {
            templateId: 'crucial-feats',
            side: 'left',
            slot: nextLeftEntry.slot,
          })
        : '',
      nextRightEntry
        ? resolveFightTemplateImageUrl(activeFightFolderKey, nextRightEntry.imageFile, {
            templateId: 'crucial-feats',
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
    entry: TemplateImageEntry | null,
    side: 'left' | 'right',
  ) => {
    const fighterFallback = getFightTemplateDefaultField('crucial-feats', 'fighter_fallback', language)
    const imageUrl = entry
      ? resolveFightTemplateImageUrl(activeFightFolderKey, entry.imageFile, {
          templateId: 'crucial-feats',
          side,
          slot: entry.slot,
        })
      : ''
    const adjustKey = buildTemplateImageAdjustKey('crucial-feats', side, entry)
    const legacyAdjustKeys = [
      buildCanonicalLegacyTemplateImageAdjustKey('crucial-feats', side, entry),
      buildLegacyTemplateImageAdjustKey('crucial-feats', side, entry),
    ]

    return (
      <div className={layout.COLUMN_CLASS}>
        <HighEndFighterBanner templateId="crucial-feats" language={language} fighter={fighter} />
        <div className={layout.COLUMN_BODY_CLASS}>
          <AdjustableTemplateImage
            imageUrl={imageUrl}
            alt={entry?.text || fighter.name || fighterFallback}
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
              slotKey={`crucial-feats:${side}:caption:${entry?.id || 'empty'}`}
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
    <div className="vs-tpl-surface">
      <div className="vs-tpl-meta">
        <p>{chrome.threatLevelLabel}: <span>{chrome.threatLevelValue}</span></p>
        <p>{chrome.dataIntegrityLabel}: <span>{chrome.dataIntegrityValue}</span></p>
      </div>

      <div className="vs-tpl-heading">
        <h2 className="vs-tpl-title">{headerText}</h2>
        {subText ? <p className="vs-tpl-subtitle">{subText}</p> : null}
      </div>

      <button
        type="button"
        className="vs-tpl-logo"
        title={chrome.brandMarkTitle}
        aria-label={chrome.brandMarkAria}
        onClick={onToggleLanguage}
      >
        <img src={chrome.brandImageSrc} alt={chrome.brandAlt} draggable={false} />
        <img className="vs-tpl-logo-reflection" src={chrome.brandImageSrc} alt="" aria-hidden="true" draggable={false} />
      </button>

      <div className="vs-tpl-body">
        <div className={layout.BODY_CLASS}>
          {renderColumn(fighterA, leftEntry, 'left')}
          {renderColumn(fighterB, rightEntry, 'right')}
        </div>
      </div>
    </div>
  )
}
