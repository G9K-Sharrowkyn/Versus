import type { CSSProperties } from 'react'
import type { FightRecord, FightScenarioId, FightScenarioLead, FightVariantLocale, Fighter, ParsedVsImport, PointerRelayPayload, PortraitAdjust, ScoreRow, SearchMorphHandoff } from './types'
import { DEFAULT_MORPH_SIZE, FALLBACK_ICONS, FIGHT_SCENARIO_ALIAS_TO_ID, FIGHT_SCENARIO_CANONICAL_TOKEN_TO_ID, FIGHT_SCENARIO_EXTENDED_LABELS_EN, ICON_BY_CATEGORY } from './presets'

export const clamp = (value: number) =>
  Math.max(0, Math.min(100, Number.isFinite(value) ? Math.round(value) : 0))

export const PORTRAIT_ADJUST_DEFAULT: PortraitAdjust = { x: 50, y: 50, scale: 1 }
export const PORTRAIT_SCALE_MIN = 0.6
export const PORTRAIT_SCALE_MAX = 2.4
export const FIGHT_TITLE_PORTRAIT_ASPECT = 695 / 787.5

export const clampPortraitPosition = (value: number) =>
  Math.max(0, Math.min(100, Number.isFinite(value) ? value : 50))

export const clampPortraitScale = (value: number) =>
  Math.max(PORTRAIT_SCALE_MIN, Math.min(PORTRAIT_SCALE_MAX, Number.isFinite(value) ? value : 1))

export const normalizePortraitAdjust = (value: unknown): PortraitAdjust => {
  if (!value || typeof value !== 'object') return { ...PORTRAIT_ADJUST_DEFAULT }
  const raw = value as Record<string, unknown>
  const x = typeof raw.x === 'number' ? raw.x : Number(raw.x)
  const y = typeof raw.y === 'number' ? raw.y : Number(raw.y)
  const scale = typeof raw.scale === 'number' ? raw.scale : Number(raw.scale)
  return {
    x: clampPortraitPosition(x),
    y: clampPortraitPosition(y),
    scale: clampPortraitScale(scale),
  }
}

export const normalizeSlideImageAdjustments = (value: unknown): Record<string, PortraitAdjust> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const normalized: Record<string, PortraitAdjust> = {}
  Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
    const normalizedKey = key.trim()
    if (!normalizedKey) return
    normalized[normalizedKey] = normalizePortraitAdjust(entry)
  })
  return normalized
}

export const buildPortraitImageStyle = (adjust: PortraitAdjust): CSSProperties => ({
  objectPosition: `${clampPortraitPosition(adjust.x)}% ${clampPortraitPosition(adjust.y)}%`,
  transform: `scale(${clampPortraitScale(adjust.scale)})`,
  transformOrigin: 'center center',
})

export const clampTemplateImageScale = (value: number) =>
  Math.max(1, Math.min(PORTRAIT_SCALE_MAX, Number.isFinite(value) ? value : 1))

export const normalizeTemplateImageAdjust = (value: PortraitAdjust): PortraitAdjust => ({
  x: clampPortraitPosition(value.x),
  y: clampPortraitPosition(value.y),
  scale: clampTemplateImageScale(value.scale),
})

export const getTemplateImageGeometry = (
  containerWidth: number,
  containerHeight: number,
  naturalWidth: number,
  naturalHeight: number,
  scale: number,
) => {
  if (
    !Number.isFinite(containerWidth) ||
    !Number.isFinite(containerHeight) ||
    !Number.isFinite(naturalWidth) ||
    !Number.isFinite(naturalHeight) ||
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    naturalWidth <= 0 ||
    naturalHeight <= 0
  ) {
    return null
  }

  const coverScale = Math.max(containerWidth / naturalWidth, containerHeight / naturalHeight)
  const width = naturalWidth * coverScale * clampTemplateImageScale(scale)
  const height = naturalHeight * coverScale * clampTemplateImageScale(scale)
  return {
    width,
    height,
    overflowX: Math.max(0, width - containerWidth),
    overflowY: Math.max(0, height - containerHeight),
  }
}

export const buildAdjustableTemplateImageStyle = (
  adjust: PortraitAdjust,
  geometry: ReturnType<typeof getTemplateImageGeometry>,
): CSSProperties => {
  const x = clampPortraitPosition(adjust.x)
  const y = clampPortraitPosition(adjust.y)
  if (geometry) {
    const translateX = (-geometry.overflowX * x) / 100
    const translateY = (-geometry.overflowY * y) / 100
    return {
      left: 0,
      top: 0,
      width: `${geometry.width}px`,
      height: `${geometry.height}px`,
      maxWidth: 'none',
      maxHeight: 'none',
      transform: `translate3d(${translateX}px, ${translateY}px, 0)`,
      willChange: 'transform, width, height',
    }
  }

  const scale = clampTemplateImageScale(adjust.scale)
  return {
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: `${x}% ${y}%`,
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
    willChange: 'transform, object-position',
  }
}

export const normalizeSearchMorphHandoff = (value: unknown): SearchMorphHandoff | null => {
  if (!value || typeof value !== 'object') return null
  const payload = value as Record<string, unknown>
  const readFinite = (input: unknown) =>
    typeof input === 'number' && Number.isFinite(input) ? input : null
  const x = readFinite(payload.x)
  const y = readFinite(payload.y)
  const width = readFinite(payload.width)
  const height = readFinite(payload.height)
  if (x === null || y === null || width === null || height === null) return null

  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: Math.max(28, Math.min(220, width)),
    height: Math.max(28, Math.min(220, height)),
  }
}

export const normalizePointerRelayPayload = (value: unknown): PointerRelayPayload | null => {
  if (!value || typeof value !== 'object') return null
  const payload = value as Record<string, unknown>
  if (payload.type !== 'vvv-pointer-relay') return null

  const source = payload.source
  const eventType = payload.event
  if (source !== 'search' && source !== 'intro') return null
  if (eventType !== 'move' && eventType !== 'down' && eventType !== 'up' && eventType !== 'leave') return null
  if (typeof payload.x !== 'number' || !Number.isFinite(payload.x)) return null
  if (typeof payload.y !== 'number' || !Number.isFinite(payload.y)) return null

  const timestamp =
    typeof payload.timestamp === 'number' && Number.isFinite(payload.timestamp)
      ? payload.timestamp
      : Date.now()
  const down = typeof payload.down === 'boolean' ? payload.down : undefined

  return {
    type: 'vvv-pointer-relay',
    source,
    event: eventType,
    x: payload.x,
    y: payload.y,
    down,
    timestamp,
  }
}

export const getViewportCenterHandoff = (): SearchMorphHandoff => {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0, width: DEFAULT_MORPH_SIZE, height: DEFAULT_MORPH_SIZE }
  }
  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    width: DEFAULT_MORPH_SIZE,
    height: DEFAULT_MORPH_SIZE,
  }
}

export const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const normalizeToken = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')

export const buildScenarioAliasCandidates = (value: string) => {
  const raw = value.trim()
  if (!raw) return []

  const seedVariants = [
    raw,
    raw.replace(/^\s*\d+\s*\.\s*\d+\s*/, '').trim(),
    raw.replace(/^\s*\d+\s*[.)]\s*/, '').trim(),
  ]

  const textVariants = new Set<string>()
  seedVariants.forEach((variant) => {
    if (!variant) return
    textVariants.add(variant)
    const tabCut = variant.split('\t')[0]?.trim()
    if (tabCut) textVariants.add(tabCut)
    const colonCut = variant.split(':')[0]?.trim()
    if (colonCut) textVariants.add(colonCut)
    const dashCut = variant.split(' - ')[0]?.trim()
    if (dashCut) textVariants.add(dashCut)
  })

  return Array.from(new Set(Array.from(textVariants).map(normalizeToken).filter(Boolean)))
}

export const extractScenarioLabelText = (value: string) => {
  const raw = value.trim()
  if (!raw) return ''
  const noNumber = raw.replace(/^\s*\d+\s*\.\s*\d+\s*/, '').replace(/^\s*\d+\s*[.)]\s*/, '').trim()
  if (!noNumber) return ''
  const tabCut = noNumber.split('\t')[0]?.trim() || ''
  const colonCut = tabCut.split(':')[0]?.trim() || ''
  const dashCut = colonCut.split(' - ')[0]?.trim() || ''
  return dashCut
}

export const humanizeScenarioToken = (token: string) =>
  token
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())

export const resolveFightScenarioSelection = (
  value: string | undefined,
  fallback: FightScenarioId,
): { id: FightScenarioId; variantToken: string | null; label: string | null } => {
  if (!value) return { id: fallback, variantToken: null, label: null }
  const candidates = buildScenarioAliasCandidates(value)
  const inputLabel = extractScenarioLabelText(value)

  for (const token of candidates) {
    const resolved = FIGHT_SCENARIO_ALIAS_TO_ID[token]
    if (!resolved) continue
    const isCanonical = FIGHT_SCENARIO_CANONICAL_TOKEN_TO_ID[token] === resolved
    const isExtended = Boolean(FIGHT_SCENARIO_EXTENDED_LABELS_EN[token])
    const variantToken = isExtended && !isCanonical ? token : null
    const fallbackLabel = isExtended ? FIGHT_SCENARIO_EXTENDED_LABELS_EN[token] : null
    const preferFallbackLabel = Boolean(fallbackLabel && normalizeToken(inputLabel) === token)
    const label = preferFallbackLabel ? fallbackLabel : inputLabel || fallbackLabel
    return { id: resolved, variantToken, label: label || null }
  }

  return { id: fallback, variantToken: null, label: inputLabel || null }
}

export const AVERAGE_DRAW_THRESHOLD = 1

export const stripFileExtension = (value: string) => value.replace(/\.[^.]+$/, '').trim()
export const MATCHUP_PREFIX_PATTERN = /^\s*\d+\s*[._ -]*/
export const FIGHT_LOCALE_SUFFIX_PATTERN = /(?:^|[\s._-])(pl|en|eng|polski|english)\s*$/i
export const stripTxtDecoratorSuffix = (value: string) =>
  value.replace(/\.txt\s*(?:pl|en|eng|polski|english)?\s*$/i, '').trim()
export const normalizeFightFileBaseName = (value: string) => stripTxtDecoratorSuffix(stripFileExtension(value))

export const splitFightNameLocaleSuffix = (value: string): { base: string; locale: FightVariantLocale } => {
  const normalized = value.replace(/[_]+/g, ' ').trim()
  if (!normalized) return { base: '', locale: 'unknown' }
  const match = normalized.match(FIGHT_LOCALE_SUFFIX_PATTERN)
  if (!match) return { base: normalized, locale: 'unknown' }
  const suffix = normalizeToken(match[1] || '')
  const locale: FightVariantLocale = suffix === 'pl' || suffix === 'polski' ? 'pl' : 'en'
  const base = normalized.slice(0, match.index ?? normalized.length).trim()
  return { base: base || normalized, locale }
}

export const toMatchupDisplayNameFromFileName = (fileName: string) => {
  const raw = normalizeFightFileBaseName(fileName).replace(MATCHUP_PREFIX_PATTERN, '').trim()
  const split = splitFightNameLocaleSuffix(raw)
  return split.base || raw
}

export const stripFightLocaleSuffixFromLabel = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  const split = splitFightNameLocaleSuffix(trimmed)
  return split.base || trimmed
}

export const resolveFightVariantLocaleFromFileName = (fileName: string): FightVariantLocale =>
  splitFightNameLocaleSuffix(normalizeFightFileBaseName(fileName)).locale

export const resolveFightVariantLabel = (fileName: string, locale: FightVariantLocale) => {
  const normalizedBase = normalizeFightFileBaseName(fileName)
  const split = splitFightNameLocaleSuffix(normalizedBase)
  if (split.base && split.base !== normalizedBase) {
    const suffix = split.locale === 'pl' ? 'PL' : split.locale === 'en' ? 'EN' : split.locale.toUpperCase()
    return suffix || normalizedBase
  }
  if (locale === 'pl') return 'PL'
  if (locale === 'en') return 'EN'
  return normalizedBase
}

export const buildMatchupKeyFromNames = (leftName: string, rightName: string) =>
  `${normalizeToken(leftName)}::${normalizeToken(rightName)}`

export const parseMatchupFromFileName = (fileName: string): { leftName: string; rightName: string } | null => {
  const base = toMatchupDisplayNameFromFileName(fileName)
  const match = base.match(/^\s*(.+?)\s+(?:vs\.?|versus|kontra|v)\s+(.+?)\s*$/i)
  if (!match) return null
  const leftName = stripFightLocaleSuffixFromLabel(match[1]?.trim() || '')
  const rightName = stripFightLocaleSuffixFromLabel(match[2]?.trim() || '')
  if (!leftName || !rightName) return null
  return { leftName, rightName }
}

export type FightTitlePalette = {
  colorA: string
  colorB: string
  dark: boolean
}

export const normalizeHexColor = (value: string) => {
  const raw = value.trim()
  const short = raw.match(/^#([0-9a-f]{3})$/i)
  if (short) {
    const token = short[1].toLowerCase()
    return `#${token[0]}${token[0]}${token[1]}${token[1]}${token[2]}${token[2]}`
  }
  const full = raw.match(/^#([0-9a-f]{6})$/i)
  if (full) return `#${full[1].toLowerCase()}`
  return ''
}

export const parseHexRgb = (value: string) => {
  const normalized = normalizeHexColor(value)
  if (!normalized) return null
  const intValue = Number.parseInt(normalized.slice(1), 16)
  if (!Number.isFinite(intValue)) return null
  return {
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255,
  }
}

export type FightTitleColorToken = 'red' | 'blue' | 'gold' | 'dark' | 'neutral'

export const classifyFightTitleColor = (hexColor: string, dark: boolean): FightTitleColorToken => {
  if (dark) return 'dark'
  const rgb = parseHexRgb(hexColor)
  if (!rgb) return 'neutral'

  const { r, g, b } = rgb
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const value = max / 255
  const saturation = max === 0 ? 0 : delta / max

  if (value < 0.16 || (value < 0.24 && saturation < 0.2)) return 'dark'

  let hue = 0
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6
    else if (max === g) hue = (b - r) / delta + 2
    else hue = (r - g) / delta + 4
    hue *= 60
    if (hue < 0) hue += 360
  }

  if (hue >= 335 || hue <= 22) return 'red'
  if (hue >= 182 && hue <= 248) return 'blue'
  if (hue >= 35 && hue <= 68) return 'gold'
  return 'neutral'
}

export const resolveFightTitleStripeStyle = (palette: FightTitlePalette) => {
  const tokenA = classifyFightTitleColor(palette.colorA, palette.dark)
  const tokenB = classifyFightTitleColor(palette.colorB, false)
  const has = (token: FightTitleColorToken) => tokenA === token || tokenB === token

  let textureUrl = "url('/assets/blue-red.png')"
  if (has('dark') && has('red')) textureUrl = "url('/assets/black-red.png')"
  else if (has('gold') && has('blue')) textureUrl = "url('/assets/blue-gold.png')"
  else if (has('gold') && has('red')) textureUrl = "url('/assets/gold-red.png')"
  else if (has('blue') && has('red')) textureUrl = "url('/assets/blue-red.png')"

  // Keep original texture colors exactly as provided.
  const textureFilter = 'none'

  return { textureUrl, textureFilter }
}

export const resolveFightTitleNameFontRem = (text: string) => {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return 6
  const visualLength = normalized.split('').reduce((acc, char) => acc + (char === ' ' ? 0.55 : 1), 0)
  const estimated = 8.2 - visualLength * 0.23
  return Math.max(3.35, Math.min(6.8, estimated))
}

export const parseBooleanFlag = (value: string, fallback: boolean) => {
  const token = normalizeToken(value)
  if (!token) return fallback
  if (['1', 'true', 'yes', 'on'].includes(token)) return true
  if (['0', 'false', 'no', 'off'].includes(token)) return false
  return fallback
}

export const resolveFightTitlePalette = (name: string, side: 'a' | 'b'): FightTitlePalette => {
  const token = normalizeToken(name)
  if (token.includes('knull')) {
    return { colorA: '#08090c', colorB: '#b91c1c', dark: true }
  }
  if (token.includes('odin')) {
    return { colorA: '#c9a227', colorB: '#4f6f96', dark: false }
  }
  if (token.includes('superman')) {
    return { colorA: '#f11712', colorB: '#0099f7', dark: false }
  }
  if (token.includes('kinghyperion') || token.includes('hyperion')) {
    return { colorA: '#08090c', colorB: '#b91c1c', dark: true }
  }
  return side === 'a'
    ? { colorA: '#f11712', colorB: '#0099f7', dark: false }
    : { colorA: '#08090c', colorB: '#b91c1c', dark: true }
}

export const swapImportSides = (payload: ParsedVsImport): ParsedVsImport => ({
  ...payload,
  fighterAName: payload.fighterBName,
  fighterBName: payload.fighterAName,
  statsA: payload.statsB,
  statsB: payload.statsA,
  factsA: payload.factsB,
  factsB: payload.factsA,
  powersA: payload.powersB,
  powersB: payload.powersA,
  rawFeatsA: payload.rawFeatsB,
  rawFeatsB: payload.rawFeatsA,
  winsA: payload.winsB,
  winsB: payload.winsA,
})

export const enforceFileNameSideOrder = (payload: ParsedVsImport, fileName: string): ParsedVsImport => {
  const matchup = parseMatchupFromFileName(fileName)
  if (!matchup) return payload

  const leftToken = normalizeToken(matchup.leftName)
  const rightToken = normalizeToken(matchup.rightName)
  const aToken = normalizeToken(payload.fighterAName)
  const bToken = normalizeToken(payload.fighterBName)

  let ordered = payload
  if (leftToken && rightToken && leftToken === bToken && rightToken === aToken) {
    ordered = swapImportSides(payload)
  }

  return {
    ...ordered,
    fighterAName: stripFightLocaleSuffixFromLabel(matchup.leftName),
    fighterBName: stripFightLocaleSuffixFromLabel(matchup.rightName),
  }
}

export const findFightByQuery = (
  fights: FightRecord[],
  query: string,
  preferredVariantByMatchup: Record<string, string>,
): FightRecord | null => {
  const cleaned = stripFileExtension(query).trim()
  if (!cleaned) return null
  const token = normalizeToken(cleaned)
  if (!token) return null

  const candidates = fights.filter((fight) => {
    const matchupFromFile = normalizeToken(toMatchupDisplayNameFromFileName(fight.fileName))
    return (
      normalizeToken(stripFileExtension(fight.name)) === token ||
      matchupFromFile === token ||
      normalizeToken(stripFileExtension(fight.fileName)) === token
    )
  })

  if (!candidates.length) return null
  if (candidates.length === 1) return candidates[0]

  const preferredCandidate =
    candidates.find((fight) => preferredVariantByMatchup[fight.matchupKey] === fight.id) || null
  if (preferredCandidate) return preferredCandidate

  return candidates[0]
}

export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })

export const resolveFightScenarioLead = (
  value: string | undefined,
  fallback: FightScenarioLead,
): FightScenarioLead => {
  if (!value) return fallback
  const token = normalizeToken(value)
  if (
    token === 'a' ||
    token === '1' ||
    token === 'fighter1' ||
    token === 'character1' ||
    token === 'char1' ||
    token === 'postac1' ||
    token === 'pojedynkowicz1' ||
    token === 'left' ||
    token === 'blue' ||
    token === 'fightera' ||
    token === 'charactera' ||
    token === 'cornera' ||
    token === 'aggressora' ||
    token === 'attackera' ||
    token === 'leada'
  ) {
    return 'a'
  }
  if (
    token === 'b' ||
    token === '2' ||
    token === 'fighter2' ||
    token === 'character2' ||
    token === 'char2' ||
    token === 'postac2' ||
    token === 'pojedynkowicz2' ||
    token === 'right' ||
    token === 'red' ||
    token === 'fighterb' ||
    token === 'characterb' ||
    token === 'cornerb' ||
    token === 'aggressorb' ||
    token === 'attackerb' ||
    token === 'leadb'
  ) {
    return 'b'
  }
  return fallback
}

export const cloneFighter = (fighter: Fighter): Fighter => ({
  ...fighter,
  stats: { ...fighter.stats },
})

export const avg = (rows: ScoreRow[], key: 'a' | 'b') =>
  rows.length ? rows.reduce((sum, row) => sum + row[key], 0) / rows.length : 0

export const iconForCategory = (id: string, index: number) =>
  ICON_BY_CATEGORY[id] ?? FALLBACK_ICONS[index % FALLBACK_ICONS.length]

export const fighterMonogram = (name: string) => {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
  if (!parts.length) return 'VS'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
