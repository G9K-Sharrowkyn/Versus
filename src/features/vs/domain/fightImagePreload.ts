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

const folderImageUrlsCache = new Map<string, string[]>()

const getTemplateBlockFields = (
  fight: FightRecord,
  templateId: 'crucial-feats' | 'victory-archive',
) => parseTemplateFieldMap(findTemplateBlockLines(fight.payload.templateBlocks, TEMPLATE_BLOCK_ALIASES[templateId] || []))

const collectTemplatePairUrls = (
  fight: FightRecord,
  templateId: 'crucial-feats' | 'victory-archive',
  leftFallbackItems: string[],
  rightFallbackItems: string[],
) => {
  const blockFields = getTemplateBlockFields(fight, templateId)
  const leftEntries = buildTemplateImageEntries(blockFields, 'left', leftFallbackItems)
  const rightEntries = buildTemplateImageEntries(blockFields, 'right', rightFallbackItems)
  const pairCount = Math.max(leftEntries.length, rightEntries.length)
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
      fight.payload.crucialFeatsA,
      fight.payload.crucialFeatsB,
    ),
  )
  urls.push(
    ...collectTemplatePairUrls(
      fight,
      'victory-archive',
      fight.payload.winsA.length ? fight.payload.winsA : DEFAULT_WINNER_CV_A,
      fight.payload.winsB.length ? fight.payload.winsB : DEFAULT_WINNER_CV_B,
    ),
  )

  return [...new Set(urls.filter(Boolean))]
}

export const preloadFightCoreImages = async (fight: FightRecord) => {
  await preloadImageUrls(collectFightCoreImageUrls(fight))
}

export const collectAllFightsCoreImageUrls = (fights: FightRecord[]) => {
  const urls: string[] = []
  fights.forEach((fight) => {
    urls.push(...collectFightCoreImageUrls(fight))
  })
  return [...new Set(urls.filter(Boolean))]
}

type FightImagesApiResponse = {
  files?: Array<{ fileName?: string }>
}

const collectFightFolderImageUrls = async (
  folderKey: string,
  signal?: AbortSignal,
) => {
  if (typeof window === 'undefined') return []
  const cached = folderImageUrlsCache.get(folderKey)
  if (cached) return cached
  const response = await fetch(`/api/fights/images?key=${encodeURIComponent(folderKey)}`, {
    cache: 'force-cache',
    signal,
  })
  if (!response.ok) return []
  const payload = (await response.json().catch(() => null)) as FightImagesApiResponse | null
  const files = Array.isArray(payload?.files) ? payload.files : []

  const urls = files
    .map((entry) => (typeof entry?.fileName === 'string' ? entry.fileName.trim() : ''))
    .filter(Boolean)
    .map((fileName) => `/api/fights/image?key=${encodeURIComponent(folderKey)}&file=${encodeURIComponent(fileName)}`)
  folderImageUrlsCache.set(folderKey, urls)
  return urls
}

export const collectAllFightFolderImageUrls = async (
  fights: FightRecord[],
  signal?: AbortSignal,
) => {
  const folderKeys = [...new Set(fights.map((fight) => (fight.folderKey || '').trim()).filter(Boolean))]
  if (!folderKeys.length) return []

  const groupedUrls = await Promise.all(
    folderKeys.map(async (folderKey) => {
      if (signal?.aborted) return []
      try {
        return await collectFightFolderImageUrls(folderKey, signal)
      } catch {
        return []
      }
    }),
  )

  return [...new Set(groupedUrls.flat().filter(Boolean))]
}

export const preloadAllKnownFightImages = async (
  fights: FightRecord[],
  options: { signal?: AbortSignal; batchSize?: number; yieldMs?: number } = {},
) => {
  const coreUrls = collectAllFightsCoreImageUrls(fights)
  const folderUrls = await collectAllFightFolderImageUrls(fights, options.signal)
  if (options.signal?.aborted) return
  const urls = [...new Set([...coreUrls, ...folderUrls].filter(Boolean))]
  await preloadFightImageUrlsInBatches(urls, {
    signal: options.signal,
    batchSize: options.batchSize || 20,
    yieldMs: options.yieldMs || 16,
  })
}

export const preloadFightImageUrlsInBatches = async (
  urls: string[],
  options: { batchSize?: number; signal?: AbortSignal; yieldMs?: number } = {},
) => {
  const uniqueUrls = [...new Set(urls.map((url) => url.trim()).filter(Boolean))]
  if (!uniqueUrls.length) return

  const batchSize = Math.max(1, Math.floor(options.batchSize || 24))
  const yieldMs = Math.max(0, Math.floor(options.yieldMs || 0))

  for (let index = 0; index < uniqueUrls.length; index += batchSize) {
    if (options.signal?.aborted) return
    const batch = uniqueUrls.slice(index, index + batchSize)
    await preloadImageUrls(batch)
    if (options.signal?.aborted) return
    if (yieldMs > 0 && typeof window !== 'undefined') {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, yieldMs)
      })
    }
  }
}

export const preloadAllFightsCoreImages = async (
  fights: FightRecord[],
  options: { batchSize?: number; signal?: AbortSignal; yieldMs?: number } = {},
) => {
  await preloadFightImageUrlsInBatches(collectAllFightsCoreImageUrls(fights), options)
}
