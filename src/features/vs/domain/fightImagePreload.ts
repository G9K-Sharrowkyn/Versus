import {
  TEMPLATE_BLOCK_ALIASES,
  buildTemplateImageEntries,
  findTemplateBlockLines,
  parseTemplateFieldMap,
  resolveFightTemplateImageUrl,
} from '../importer'
import { DEFAULT_WINNER_CV_A, DEFAULT_WINNER_CV_B } from '../presets'
import type { FightRecord } from '../types'
import { preloadImageUrls } from './imagePreloadCache'

const getTemplateBlockFields = (
  fight: FightRecord,
  templateId: 'crucial-feats' | 'victory-archive',
) => parseTemplateFieldMap(findTemplateBlockLines(fight.payload.templateBlocks, TEMPLATE_BLOCK_ALIASES[templateId] || []))

const collectTemplatePairUrls = (
  fight: FightRecord,
  templateId: 'crucial-feats' | 'victory-archive',
  pairCount: number,
  leftFallbackItems: string[],
  rightFallbackItems: string[],
) => {
  const blockFields = getTemplateBlockFields(fight, templateId)
  const leftEntries = buildTemplateImageEntries(blockFields, 'left', leftFallbackItems)
  const rightEntries = buildTemplateImageEntries(blockFields, 'right', rightFallbackItems)
  const urls: string[] = []

  for (let pairIndex = 0; pairIndex < pairCount; pairIndex += 1) {
    const leftEntry = leftEntries[pairIndex] || null
    const rightEntry = rightEntries[pairIndex] || null

    const leftUrl = leftEntry
      ? resolveFightTemplateImageUrl(fight.folderKey, leftEntry.imageFile, {
          templateId,
          side: 'left',
          slot: leftEntry.slot,
        })
      : ''
    const rightUrl = rightEntry
      ? resolveFightTemplateImageUrl(fight.folderKey, rightEntry.imageFile, {
          templateId,
          side: 'right',
          slot: rightEntry.slot,
        })
      : ''

    if (leftUrl) urls.push(leftUrl)
    if (rightUrl) urls.push(rightUrl)
  }

  return urls
}

export const collectFightCoreImageUrls = (fight: FightRecord) => {
  const urls: string[] = []

  if (fight.portraitADataUrl) urls.push(fight.portraitADataUrl)
  if (fight.portraitBDataUrl) urls.push(fight.portraitBDataUrl)

  urls.push(
    ...collectTemplatePairUrls(
      fight,
      'crucial-feats',
      2,
      fight.payload.crucialFeatsA,
      fight.payload.crucialFeatsB,
    ),
  )
  urls.push(
    ...collectTemplatePairUrls(
      fight,
      'victory-archive',
      2,
      fight.payload.winsA.length ? fight.payload.winsA : DEFAULT_WINNER_CV_A,
      fight.payload.winsB.length ? fight.payload.winsB : DEFAULT_WINNER_CV_B,
    ),
  )

  return [...new Set(urls.filter(Boolean))]
}

export const preloadFightCoreImages = async (fight: FightRecord) => {
  await preloadImageUrls(collectFightCoreImageUrls(fight))
}
