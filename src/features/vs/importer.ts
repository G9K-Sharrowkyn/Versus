import type { Category, FighterFact, Language, ParsedStat, ParsedVsImport, TemplateId } from './types'
import {
  buildFightStarterTxt as buildManifestFightStarterTxt,
  getFightCommonCopy,
  getFightTemplateBlockAliases,
  getFightTemplateRequirements,
  getFightTemplateTokenMap,
} from './fightManifest'
import { DEFAULT_CATEGORIES, DEFAULT_TEMPLATE_ORDER, TEMPLATE_ID_SET, ensureTemplateOrderHasFinal } from './presets'
import { clamp, normalizeTemplateId, normalizeToken, slug } from './helpers'

export const extractBullet = (line: string) => line.trim().replace(/^[-*?]\s*/, '').trim()

export const parseBulletItems = (lines: string[]) =>
  lines
    .map((line) => extractBullet(line))
    .filter(Boolean)

export const trimSectionAtTemplateBlock = (lines: string[]) => {
  const templateStart = lines.findIndex((line) => /^\s*Template\b/i.test(line.trim()))
  return templateStart >= 0 ? lines.slice(0, templateStart) : lines
}

export const parseStatItems = (lines: string[]): ParsedStat[] => {
  const stats: ParsedStat[] = []
  for (const item of parseBulletItems(lines)) {
    const direct = item.match(/^(.+?)\s*[:=]\s*(-?\d+(?:\.\d+)?)$/)
    const spaced = item.match(/^(.+?)\s+(-?\d+(?:\.\d+)?)$/)
    const match = direct ?? spaced
    if (!match) continue
    const label = match[1].trim()
    const value = clamp(Number(match[2]))
    if (!label) continue
    stats.push({ label, value })
  }
  return stats
}

export const factDefaults = ['Style', 'Advantage', 'Mentality']

export const parseFactItems = (lines: string[]): FighterFact[] =>
  parseBulletItems(lines).map((item, index) => {
    const parts = item.split(':')
    if (parts.length >= 2) {
      const title = parts.shift()?.trim() || factDefaults[index] || `Feat ${index + 1}`
      const text = parts.join(':').trim()
      return { title, text: text || '-' }
    }
    return {
      title: factDefaults[index] || `Feat ${index + 1}`,
      text: item,
    }
  })

export const pickNameFromSection = (
  sectionTitle: string,
  sectionLines: string[],
  fallback: string,
) => {
  const title = sectionTitle.trim().replace(/^\((.*)\)$/, '$1').trim()
  const placeholder = normalizeToken(title)
  const looksLikePlaceholder =
    !placeholder ||
    placeholder.includes('nazwapostaci') ||
    placeholder.includes('name') ||
    placeholder.includes('fighter') ||
    placeholder.includes('character')
  if (title && !looksLikePlaceholder) return title

  const fromList = parseBulletItems(sectionLines)[0]
  if (fromList) return fromList

  const fromPlain = sectionLines.map((line) => line.trim()).find(Boolean)
  return fromPlain || fallback
}

export const TEMPLATE_TOKEN_MAP: Record<string, TemplateId> = getFightTemplateTokenMap()

export const parseTemplateOrder = (lines: string[]) => {
  const ids: TemplateId[] = []
  for (const line of parseBulletItems(lines)) {
    const normalized = normalizeToken(line)
    if (!normalized) continue
    const mapped = TEMPLATE_TOKEN_MAP[normalized]
    if (mapped) ids.push(mapped)
  }
  return ensureTemplateOrderHasFinal(ids.length ? ids : DEFAULT_TEMPLATE_ORDER)
}

export const parseTemplateOrderTokens = (tokens: string[]) => {
  const ids: TemplateId[] = []
  for (const item of tokens) {
    const normalized = normalizeToken(item)
    if (!normalized) continue
    const mapped = TEMPLATE_TOKEN_MAP[normalized]
    if (mapped) {
      ids.push(mapped)
      continue
    }
    const direct = normalizeTemplateId(item)
    if (direct && TEMPLATE_ID_SET.has(direct)) {
      ids.push(direct)
    }
  }
  return ids
}

export const parseTemplateBlocks = (raw: string) => {
  const blocks: Record<string, string[]> = {}
  let active: string | null = null
  for (const line of raw.replace(/\r/g, '').split('\n')) {
    const trimmed = line.trim()
    const heading = trimmed.match(/^template\s+(.+?)\s*:?$/i)
    if (heading) {
      active = heading[1].trim()
      if (!blocks[active]) blocks[active] = []
      continue
    }
    if (!active) continue
    if (/^\d+\.\s*/.test(trimmed)) {
      active = null
      continue
    }
    const item = extractBullet(trimmed)
    if (item) blocks[active].push(item)
  }
  return blocks
}

export type TemplateBlockRequirement = {
  blockPl: string
  blockEn: string
  purposePl: string
  purposeEn: string
  fields: string[]
}

export const TEMPLATE_BLOCK_REQUIREMENTS: TemplateBlockRequirement[] = getFightTemplateRequirements()

export const buildFightStarterTxt = (language: Language, templateOrder?: TemplateId[]) =>
  buildManifestFightStarterTxt(language, templateOrder)

export const findTemplateBlockLines = (
  blocks: Record<string, string[]>,
  aliases: string[],
) => {
  const normalizedAliases = aliases.map((alias) => normalizeToken(alias))
  let latestMatch: string[] = []
  for (const [heading, lines] of Object.entries(blocks)) {
    const normalizedHeading = normalizeToken(heading)
    if (
      normalizedAliases.some(
        (alias) =>
          normalizedHeading === alias ||
          normalizedHeading.includes(alias) ||
          alias.includes(normalizedHeading),
      )
    ) {
      latestMatch = lines
    }
  }
  return latestMatch
}

export const parseTemplateFieldMap = (lines: string[]) => {
  const fields: Record<string, string> = {}
  for (const item of parseBulletItems(lines)) {
    const match = item.match(/^([^:=]+)\s*[:=]\s*(.+)$/)
    if (!match) continue
    const key = normalizeToken(match[1])
    const value = match[2].trim()
    if (!key || !value) continue
    fields[key] = value
  }
  return fields
}

export const pickTemplateField = (fields: Record<string, string>, keys: string[]) => {
  for (const key of keys) {
    const normalized = normalizeToken(key)
    if (fields[normalized]) return fields[normalized]
  }
  return ''
}

const STAT_CATEGORY_ID_BY_TOKEN: Record<string, string> = {
  strength: 'strength',
  sila: 'strength',
  speed: 'speed',
  szybkosc: 'speed',
  durability: 'durability',
  wytrzymalosc: 'durability',
  combatiq: 'battleIq',
  battleiq: 'battleIq',
  iqbojowe: 'battleIq',
  iq: 'battleIq',
  hax: 'hax',
  stamina: 'stamina',
  kondycja: 'stamina',
  style: 'style',
  styl: 'style',
  stylwalki: 'style',
  fightingstyle: 'style',
  experience: 'experience',
  doswiadczenie: 'experience',
  skills: 'skills',
  combatskills: 'skills',
  fightingskills: 'skills',
  umiejetnosci: 'skills',
  umiejetnoscibojowe: 'skills',
}

const resolveStatCategoryKey = (label: string) => {
  const normalized = normalizeToken(label)
  return STAT_CATEGORY_ID_BY_TOKEN[normalized] || normalized
}

export const buildCardFacts = (fallbackFacts: FighterFact[], fields: Record<string, string>, language: Language) => {
  const common = getFightCommonCopy(language)
  const styleDefault = fallbackFacts[0]?.text || '-'
  const atutDefault = fallbackFacts[1]?.text || '-'
  const mentalDefault = fallbackFacts[2]?.text || '-'

  return [
    { title: common.style, text: pickTemplateField(fields, ['style']) || styleDefault },
    { title: common.advantage, text: pickTemplateField(fields, ['atut', 'advantage']) || atutDefault },
    {
      title: common.mentality,
      text: pickTemplateField(fields, ['mentalnosc', 'mentality']) || mentalDefault,
    },
  ]
}

export const parseCurveValues = (raw: string, fallback: number[]) => {
  const tokens = raw
    .split(/[,;|\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item.replace('%', '')))
    .filter((value) => Number.isFinite(value))

  if (!tokens.length) return fallback

  return tokens.map((value) => {
    // Allow both 0..1 and 0..100 input domains.
    const scaled = value <= 1 ? value * 100 : value
    return Math.max(0, Math.min(100, scaled))
  })
}

export const parsePercentValue = (raw: string, fallback: number) => {
  const value = Number(raw.replace('%', '').trim())
  if (!Number.isFinite(value)) return fallback
  const scaled = value <= 1 ? value * 100 : value
  return Math.max(0, Math.min(100, scaled))
}

export const buildCurvePolyline = (
  values: number[],
  xStart: number,
  xEnd: number,
  yTop: number,
  yBottom: number,
) => {
  const safe = values.length ? values : [50, 50]
  const range = yBottom - yTop
  const points = safe.map((value, index) => {
    const t = safe.length === 1 ? 0 : index / (safe.length - 1)
    const x = xStart + (xEnd - xStart) * t
    const y = yBottom - (value / 100) * range
    return { x, y }
  })
  return {
    points,
    polyline: points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' '),
  }
}

export const KEY_VALUE_BULLET_RE = /^[^:=]+\s*[:=]\s*.+$/

export const getPlainTemplateLines = (lines: string[]) =>
  parseBulletItems(lines).filter((item) => !KEY_VALUE_BULLET_RE.test(item))

export const TEMPLATE_BLOCK_ALIASES: Partial<Record<TemplateId, string[]>> = getFightTemplateBlockAliases()

export const createCategoryPayload = (statsA: ParsedStat[], statsB: ParsedStat[]) => {
  const orderedKeys: string[] = []
  const firstLabelByKey = new Map<string, string>()

  const register = (label: string) => {
    const key = resolveStatCategoryKey(label)
    if (!key || firstLabelByKey.has(key)) return
    orderedKeys.push(key)
    firstLabelByKey.set(key, label)
  }

  statsA.forEach((stat) => register(stat.label))
  statsB.forEach((stat) => register(stat.label))

  if (!orderedKeys.length) {
    const categories = [...DEFAULT_CATEGORIES]
    const statsRecordA = Object.fromEntries(categories.map((category) => [category.id, 50]))
    const statsRecordB = Object.fromEntries(categories.map((category) => [category.id, 50]))
    return { categories, statsRecordA, statsRecordB }
  }

  const usedIds = new Set<string>()
  const categories: Category[] = orderedKeys.map((key, index) => {
    const label = firstLabelByKey.get(key) || `Stat ${index + 1}`
    const baseId = DEFAULT_CATEGORIES.some((category) => category.id === key) ? key : slug(label) || `stat-${index + 1}`
    let id = baseId
    let suffix = 2
    while (usedIds.has(id)) {
      id = `${baseId}-${suffix}`
      suffix += 1
    }
    usedIds.add(id)
    return { id, label }
  })

  const keyToId = new Map<string, string>()
  orderedKeys.forEach((key, index) => keyToId.set(key, categories[index].id))

  const statsRecordA = Object.fromEntries(categories.map((category) => [category.id, 50]))
  const statsRecordB = Object.fromEntries(categories.map((category) => [category.id, 50]))

  statsA.forEach((stat) => {
    const id = keyToId.get(resolveStatCategoryKey(stat.label))
    if (id) statsRecordA[id] = clamp(stat.value)
  })

  statsB.forEach((stat) => {
    const id = keyToId.get(resolveStatCategoryKey(stat.label))
    if (id) statsRecordB[id] = clamp(stat.value)
  })

  return { categories, statsRecordA, statsRecordB }
}

export const parseVsImportText = (raw: string): { ok: true; data: ParsedVsImport } | { ok: false; error: string } => {
  const sanitized = raw.replace(/\r/g, '')
  const lines = sanitized.split('\n')

  const sections = new Map<number, { title: string; lines: string[] }>()
  let activeSection: number | null = null
  for (const line of lines) {
    const heading = line.match(/^\s*(\d+)\.\s*(.*)\s*$/)
    if (heading) {
      activeSection = Number(heading[1])
      sections.set(activeSection, { title: heading[2].trim(), lines: [] })
      continue
    }
    if (activeSection !== null) {
      sections.get(activeSection)?.lines.push(line)
    }
  }

  for (const required of [1, 2, 3, 4, 5, 6, 7, 8]) {
    if (!sections.has(required)) {
      return {
        ok: false,
        error: `Import error: missing section ${required}.`,
      }
    }
  }

  const section1 = sections.get(1)!
  const section2 = sections.get(2)!
  const section3 = sections.get(3)!
  const section4 = sections.get(4)!
  const section5 = sections.get(5)!
  const section6 = sections.get(6)!
  const section7 = sections.get(7)!
  const section8 = sections.get(8)!
  const section9 = sections.get(9)
  const section10 = sections.get(10)
  const section11 = sections.get(11)
  const section12 = sections.get(12)
  const section13 = sections.get(13)

  const fighterAName = pickNameFromSection(section1.title, section1.lines, 'Fighter A')
  const fighterBName = pickNameFromSection(section5.title, section5.lines, 'Fighter B')

  const statsA = parseStatItems(section2.lines)
  const statsB = parseStatItems(section6.lines)
  if (!statsA.length || !statsB.length) {
    return {
      ok: false,
      error: 'Import error: sections 2 and 6 need stat lines like "- Strength: 96".',
    }
  }

  let winsBLines = section8.lines
  let templateLinesFromEight: string[] = []
  const templateMarkerIndex = section8.lines.findIndex((line) =>
    /template|uklad|kolejnosc/i.test(line.trim()),
  )
  if (templateMarkerIndex >= 0) {
    winsBLines = section8.lines.slice(0, templateMarkerIndex)
    templateLinesFromEight = section8.lines.slice(templateMarkerIndex + 1)
  }

  const templateOrder = parseTemplateOrder([
    ...templateLinesFromEight,
    ...(section9?.lines || []),
  ])

  const factsA = parseFactItems(section3.lines)
  const factsB = parseFactItems(section7.lines)
  const powersA = section10 ? parseFactItems(trimSectionAtTemplateBlock(section10.lines)) : []
  const crucialFeatsA = section11 ? parseBulletItems(trimSectionAtTemplateBlock(section11.lines)) : []
  const powersB = section12 ? parseFactItems(trimSectionAtTemplateBlock(section12.lines)) : []
  const crucialFeatsB = section13 ? parseBulletItems(trimSectionAtTemplateBlock(section13.lines)) : []
  const winsA = parseBulletItems(section4.lines)
  const winsB = parseBulletItems(winsBLines)

  return {
    ok: true,
    data: {
      fighterAName,
      fighterBName,
      statsA,
      statsB,
      factsA,
      factsB,
      powersA,
      powersB,
      crucialFeatsA,
      crucialFeatsB,
      winsA,
      winsB,
      templateOrder,
      templateBlocks: parseTemplateBlocks(sanitized),
    },
  }
}


export type TemplateImageEntry = {
  id: string
  slot: number
  text: string
  imageFile: string
}

const toTemplateImageAdjustIdentity = (entry: TemplateImageEntry | null) => {
  if (!entry) return 'empty'
  const imageFile = entry.imageFile.trim()
  if (imageFile) return `file:${imageFile.toLowerCase()}`
  return `slot:${entry.slot}`
}

export const buildTemplateImageAdjustKey = (
  templateId: 'crucial-feats' | 'victory-archive',
  side: 'left' | 'right',
  entry: TemplateImageEntry | null,
) => `${templateId}:${side}:${toTemplateImageAdjustIdentity(entry)}`

export const buildLegacyTemplateImageAdjustKey = (
  templateId: 'crucial-feats' | 'victory-archive',
  side: 'left' | 'right',
  entry: TemplateImageEntry | null,
) => {
  const legacyTemplateId = templateId === 'crucial-feats' ? 'raw-feats' : 'winner-cv'
  return `${legacyTemplateId}:${side}:${entry?.id || 'empty'}`
}

export type AutoTemplateImageRequest = {
  templateId: 'crucial-feats' | 'victory-archive'
  side: 'left' | 'right'
  slot: number
}

const resolveAutoTemplateImageSection = (
  request: AutoTemplateImageRequest,
): string => {
  if (request.templateId === 'crucial-feats') {
    return request.side === 'left' ? '6.1' : '6.2'
  }
  return request.side === 'left' ? '7.1' : '7.2'
}

export const resolveFightTemplateImageUrl = (
  folderKey: string | undefined,
  imageFile: string,
  autoRequest?: AutoTemplateImageRequest,
) => {
  if (!folderKey) return ''
  const trimmed = imageFile.trim()
  if (trimmed) {
    return `/api/fights/image?key=${encodeURIComponent(folderKey)}&file=${encodeURIComponent(trimmed)}`
  }
  if (!autoRequest || autoRequest.slot < 1) return ''
  return `/api/fights/image?key=${encodeURIComponent(folderKey)}&section=${encodeURIComponent(resolveAutoTemplateImageSection(autoRequest))}&index=${encodeURIComponent(String(autoRequest.slot))}`
}

export const buildTemplateImageEntries = (
  blockFields: Record<string, string>,
  side: 'left' | 'right',
  fallbackItems: string[],
) => {
  const entries: TemplateImageEntry[] = []
  const maxItems = Math.max(20, fallbackItems.length)

  for (let index = 1; index <= maxItems; index += 1) {
    const itemText = pickTemplateField(blockFields, [`${side}_item_${index}`]) || fallbackItems[index - 1] || ''
    const imageFile =
      pickTemplateField(blockFields, [
        `${side}_image_${index}`,
        `${side}_img_${index}`,
        `${side}_picture_${index}`,
      ]) || ''

    if (!itemText.trim() && !imageFile.trim()) continue
    entries.push({
      id: `${side}-${index}`,
      slot: index,
      text: itemText.trim(),
      imageFile: imageFile.trim(),
    })
  }

  if (!entries.length && fallbackItems.length) {
    fallbackItems.forEach((item, index) => {
      if (!item.trim()) return
      entries.push({
        id: `${side}-fallback-${index + 1}`,
        slot: index + 1,
        text: item.trim(),
        imageFile: '',
      })
    })
  }

  return entries
}

