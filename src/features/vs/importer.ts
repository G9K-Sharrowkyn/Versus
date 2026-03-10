import type { Category, FighterFact, Language, ParsedStat, ParsedVsImport, TemplateId } from './types'
import type {
  FightLocaleJsonTemplateBlock,
  FightLocaleJsonTemplateValue,
  FightLocaleJsonV1,
  FightScansJsonV1,
  FightStatId,
} from './types'
import {
  buildFightScaffoldFightJson,
  buildFightScaffoldScansJson,
  buildFightStarterJson as buildManifestFightStarterJson,
  getFightCommonCopy,
  getFightDefaultCategories,
  getFightTemplateBlockAliases,
  getFightTemplateManifest,
  getFightTemplateRequirements,
  getFightTemplateTokenMap,
} from './fightManifest'
import { DEFAULT_CATEGORIES, TEMPLATE_ID_SET, ensureTemplateOrderHasFinal } from './presets'

const LEGACY_TEMPLATE_ID_MAP: Record<string, TemplateId> = {
  'character-card-a': 'character-dossier-a',
  'character-card-b': 'character-dossier-b',
  'powers-tools': 'character-profile',
  'raw-feats': 'crucial-feats',
  'hud-bars': 'fight-analytics',
  'radar-brief': 'parameter-comparison',
  'winner-cv': 'victory-archive',
  summary: 'final-summary',
  'fight-title': 'fight-card',
}

const clamp = (value: number) =>
  Math.max(0, Math.min(100, Number.isFinite(value) ? Math.round(value) : 0))

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const normalizeToken = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')

const normalizeTemplateId = (value: string): TemplateId | null => {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (TEMPLATE_ID_SET.has(trimmed as TemplateId)) {
    return trimmed as TemplateId
  }
  return LEGACY_TEMPLATE_ID_MAP[trimmed] || null
}

export const extractBullet = (line: string) => line.trim().replace(/^[-*?]\s*/, '').trim()

export const parseBulletItems = (lines: string[]) =>
  lines
    .map((line) => extractBullet(line))
    .filter(Boolean)

export const TEMPLATE_TOKEN_MAP: Record<string, TemplateId> = getFightTemplateTokenMap()

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

export type TemplateBlockRequirement = {
  blockPl: string
  blockEn: string
  purposePl: string
  purposeEn: string
  fields: string[]
}

export const TEMPLATE_BLOCK_REQUIREMENTS: TemplateBlockRequirement[] = getFightTemplateRequirements()

export const buildFightStarterJson = (language: Language, templateOrder?: TemplateId[]) =>
  buildManifestFightStarterJson(language, templateOrder)

export { buildFightScaffoldFightJson, buildFightScaffoldScansJson }

export const findTemplateBlockLines = (
  blocks: Record<string, string[]>,
  aliases: string[],
) => {
  const normalizedAliases = aliases.map((alias) => normalizeToken(alias))
  let bestMatch: string[] = []
  let bestScore = -1
  for (const [heading, lines] of Object.entries(blocks)) {
    const normalizedHeading = normalizeToken(heading)
    for (const alias of normalizedAliases) {
      if (!alias || !normalizedHeading) continue
      let score = -1
      if (normalizedHeading === alias) {
        score = 300 + alias.length
      } else if (normalizedHeading.startsWith(alias)) {
        score = 200 + alias.length
      } else if (alias.startsWith(normalizedHeading)) {
        score = 150 + normalizedHeading.length
      } else if (normalizedHeading.includes(alias)) {
        score = 100 + alias.length
      } else if (alias.includes(normalizedHeading)) {
        score = 50 + normalizedHeading.length
      }

      if (score > bestScore) {
        bestScore = score
        bestMatch = lines
      }
    }
  }
  return bestMatch
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
    const value = fields[normalized]
    if (!value) continue
    const trimmed = value.trim()
    const withoutColon = trimmed.replace(/:\s*$/, '')
    if (normalizeToken(withoutColon) === normalized && /:\s*$/.test(trimmed)) continue
    return value
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

const JSON_STAT_ORDER: FightStatId[] = [
  'strength',
  'speed',
  'durability',
  'battleIq',
  'hax',
  'stamina',
  'style',
  'experience',
  'skills',
]

const toString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const toStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.map((entry) => toString(entry)).filter(Boolean)
    : []

const toFiniteNumber = (value: unknown) => {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const toSnakeCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()

const toCamelCase = (value: string) =>
  value.replace(/[_-]([a-z0-9])/gi, (_, char: string) => char.toUpperCase())

const isFightLocaleJsonTemplateValue = (value: unknown): value is FightLocaleJsonTemplateValue =>
  value === null ||
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean' ||
  (Array.isArray(value) &&
    value.every((entry) => typeof entry === 'string' || typeof entry === 'number'))

const normalizeTemplateJsonBlock = (value: unknown): FightLocaleJsonTemplateBlock => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      ([key, entry]) => key.trim() && isFightLocaleJsonTemplateValue(entry),
    ),
  ) as FightLocaleJsonTemplateBlock
}

const normalizeTemplateJsonMap = (
  value: unknown,
): Partial<Record<TemplateId, FightLocaleJsonTemplateBlock>> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const output: Partial<Record<TemplateId, FightLocaleJsonTemplateBlock>> = {}
  Object.entries(value as Record<string, unknown>).forEach(([rawTemplateId, block]) => {
    const templateId = normalizeTemplateId(rawTemplateId)
    if (!templateId) return
    output[templateId] = normalizeTemplateJsonBlock(block)
  })
  return output
}

const buildParsedStatsFromJson = (
  stats: Partial<Record<FightStatId, number | null>> | undefined,
  language: Language,
) => {
  const labels = new Map(getFightDefaultCategories(language).map((category) => [category.id, category.label]))
  return JSON_STAT_ORDER.map((statId) => {
    const numeric = toFiniteNumber(stats?.[statId])
    if (numeric === null) return null
    return {
      label: labels.get(statId) || statId,
      value: clamp(numeric),
    }
  }).filter((entry): entry is ParsedStat => Boolean(entry))
}

const buildDossierFacts = (
  dossier: FightLocaleJsonV1['fighterA']['dossier'] | undefined,
  language: Language,
): FighterFact[] => {
  const common = getFightCommonCopy(language)
  return [
    { title: common.style, text: toString(dossier?.style) || '-' },
    { title: common.advantage, text: toString(dossier?.advantage) || '-' },
    { title: common.mentality, text: toString(dossier?.mentality) || '-' },
  ]
}

const buildProfileFacts = (
  profile: FightLocaleJsonV1['fighterA']['profile'] | undefined,
  language: Language,
) => {
  const powersLabel = language === 'pl' ? 'Moce' : 'Powers'
  const toolsLabel = language === 'pl' ? 'Narzędzia' : 'Tools'
  const weaknessesLabel = language === 'pl' ? 'Słabości' : 'Weaknesses'

  return [
    ...toStringArray(profile?.powers).map((text) => ({ title: powersLabel, text })),
    ...toStringArray(profile?.tools).map((text) => ({ title: toolsLabel, text })),
    ...toStringArray(profile?.weaknesses).map((text) => ({ title: weaknessesLabel, text })),
  ]
}

const buildTemplateBlockLinesFromJson = (
  templateId: TemplateId,
  language: Language,
  localeBlock: FightLocaleJsonTemplateBlock,
  scansBlock: FightLocaleJsonTemplateBlock,
  supplemental: FightLocaleJsonTemplateBlock = {},
) => {
  const manifest = getFightTemplateManifest(templateId)
  if (!manifest) return null

  const lines: string[] = []
  const mergedEntries: Array<[string, FightLocaleJsonTemplateValue]> = []

  ;[localeBlock, supplemental, scansBlock].forEach((block) => {
    Object.entries(block).forEach(([key, value]) => {
      mergedEntries.push([key, value as FightLocaleJsonTemplateValue])
    })
  })

  mergedEntries.forEach(([jsonKey, value]) => {
    const schema =
      manifest.variableFields.find((entry) => {
        const candidate = entry.jsonKey || toCamelCase(entry.key)
        return candidate === jsonKey
      }) || null

    const lineKey = schema?.key || toSnakeCase(jsonKey)
    if (schema?.valueType === 'string-array' && Array.isArray(value)) {
      value
        .map((entry) => toString(entry))
        .forEach((entry, index) => {
          if (!entry) return
          lines.push(`${lineKey}_${index + 1}: ${entry}`)
        })
      return
    }

    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const text = toString(entry)
        if (!text) return
        lines.push(`${lineKey}_${index + 1}: ${text}`)
      })
      return
    }

    if (typeof value === 'boolean') {
      lines.push(`${lineKey}: ${value ? 'true' : 'false'}`)
      return
    }

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return
      lines.push(`${lineKey}: ${value}`)
      return
    }

    const text = toString(value)
    if (!text) return
    const withoutColon = text.replace(/:\s*$/, '')
    if (normalizeToken(withoutColon) === normalizeToken(lineKey) && /:\s*$/.test(text)) return
    lines.push(`${lineKey}: ${text}`)
  })

  if (!lines.length) return null

  return {
    heading: manifest.blockName[language],
    lines,
  }
}

const buildDossierSupplementBlock = (
  templateBlock: FightLocaleJsonTemplateBlock | undefined,
  version: unknown,
  quote: unknown,
): FightLocaleJsonTemplateBlock => {
  const supplement: FightLocaleJsonTemplateBlock = {}

  if (!toString(templateBlock?.world)) {
    const fallbackWorld = toString(version)
    if (fallbackWorld) {
      supplement.world = fallbackWorld
    }
  }

  if (!toString(templateBlock?.quote)) {
    const fallbackQuote = toString(quote)
    if (fallbackQuote) {
      supplement.quote = fallbackQuote
    }
  }

  return supplement
}

const buildTemplateBlocksFromJson = (
  localeJson: FightLocaleJsonV1,
  scansJson: FightScansJsonV1,
) => {
  const templateBlocks: Record<string, string[]> = {}
  const localeTemplates = normalizeTemplateJsonMap(localeJson.templates)
  const scansTemplates = normalizeTemplateJsonMap(scansJson.templates)

  const supplementByTemplate: Partial<Record<TemplateId, FightLocaleJsonTemplateBlock>> = {
    'character-dossier-a': buildDossierSupplementBlock(
      localeTemplates['character-dossier-a'],
      localeJson.fighterA.version,
      localeJson.fighterA.dossier?.quote,
    ),
    'character-dossier-b': buildDossierSupplementBlock(
      localeTemplates['character-dossier-b'],
      localeJson.fighterB.version,
      localeJson.fighterB.dossier?.quote,
    ),
  }

  const allTemplateIds = new Set<TemplateId>([
    ...Object.keys(localeTemplates).map((templateId) => normalizeTemplateId(templateId)).filter(Boolean) as TemplateId[],
    ...Object.keys(scansTemplates).map((templateId) => normalizeTemplateId(templateId)).filter(Boolean) as TemplateId[],
    ...Object.keys(supplementByTemplate).map((templateId) => normalizeTemplateId(templateId)).filter(Boolean) as TemplateId[],
  ])

  allTemplateIds.forEach((templateId) => {
    const built = buildTemplateBlockLinesFromJson(
      templateId,
      localeJson.locale,
      localeTemplates[templateId] || {},
      scansTemplates[templateId] || {},
      supplementByTemplate[templateId] || {},
    )
    if (!built) return
    templateBlocks[built.heading] = built.lines
  })

  return templateBlocks
}

export const parseFightJsonFiles = (
  localeJson: FightLocaleJsonV1,
  scansJson: FightScansJsonV1,
): ParsedVsImport => {
  // One-way transform from canonical fight JSON to the viewer payload.
  // Do not use ParsedVsImport as a persistence or migration source of truth.
  if (!localeJson || localeJson.schemaVersion !== 1) {
    throw new Error('Import error: invalid locale fight JSON.')
  }
  if (!scansJson || scansJson.schemaVersion !== 1) {
    throw new Error('Import error: invalid scans JSON.')
  }
  if (localeJson.locale !== 'pl' && localeJson.locale !== 'en') {
    throw new Error('Import error: unsupported locale in fight JSON.')
  }

  const fighterAName = toString(localeJson.fighterA?.name) || 'Fighter A'
  const fighterBName = toString(localeJson.fighterB?.name) || 'Fighter B'
  const statsA = buildParsedStatsFromJson(localeJson.fighterA?.stats, localeJson.locale)
  const statsB = buildParsedStatsFromJson(localeJson.fighterB?.stats, localeJson.locale)

  return {
    fighterAName,
    fighterBName,
    statsA,
    statsB,
    factsA: buildDossierFacts(localeJson.fighterA?.dossier, localeJson.locale),
    factsB: buildDossierFacts(localeJson.fighterB?.dossier, localeJson.locale),
    powersA: buildProfileFacts(localeJson.fighterA?.profile, localeJson.locale),
    powersB: buildProfileFacts(localeJson.fighterB?.profile, localeJson.locale),
    crucialFeatsA: toStringArray(localeJson.fighterA?.crucialFeats),
    crucialFeatsB: toStringArray(localeJson.fighterB?.crucialFeats),
    winsA: toStringArray(localeJson.fighterA?.victories),
    winsB: toStringArray(localeJson.fighterB?.victories),
    templateOrder: ensureTemplateOrderHasFinal(
      (Array.isArray(localeJson.templateOrder) ? localeJson.templateOrder : [])
        .map((templateId) => normalizeTemplateId(String(templateId)))
        .filter((templateId): templateId is TemplateId => Boolean(templateId)),
    ),
    templateBlocks: buildTemplateBlocksFromJson(localeJson, scansJson),
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

