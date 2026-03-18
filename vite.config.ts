import { promises as fs } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import { defineConfig, type Connect, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { parseFightImageIndex } from './scripts/fightImageIndex.js'
import { parseFightJsonFiles } from './src/features/vs/importer'
import type { FightLocaleJsonV1, FightScansJsonV1, ParsedVsImport } from './src/features/vs/types'

const FIGHTS_DIR_CANDIDATES = [
  path.resolve(__dirname, 'Fights'),
  path.resolve(__dirname, '..', '..', 'Fights'),
]
const TEMPLATES_DIR = path.resolve(__dirname, 'Templates')
const IMAGE_FILE_PATTERN = /^([12])\.(jpe?g|png|webp|avif)$/i
const ANY_IMAGE_FILE_PATTERN = /\.(jpe?g|png|webp|avif)$/i
const JSON_FILE_PATTERN = /\.json(?:\s*(?:pl|en|eng|polski|english))?$/i
const SHARED_SCANS_FILE_PATTERN = /(?:^|[\s._-])scans?$/i
const MATCHUP_PREFIX_PATTERN = /^\s*\d+\s*[._ -]*/
const FIGHT_LOCALE_SUFFIX_PATTERN = /(?:^|[\s._-])(pl|en|eng|polski|english)\s*$/i
const FIGHT_VISUALS_FILE_NAME = '.fight-visuals.json'
const execFileAsync = promisify(execFile)
const LEGACY_TEMPLATE_ID_MAP: Record<string, string> = {
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

type ScanFightRecord = {
  folderKey: string
  displayName: string
  matchName: string
  matchupKey: string
  variantLocale: 'pl' | 'en' | 'unknown'
  variantLabel: string
  fileName: string
  payload: ParsedVsImport
  portraitAUrl: string
  portraitBUrl: string
  portraitAAdjust: { x: number; y: number; scale: number }
  portraitBAdjust: { x: number; y: number; scale: number }
  slideImageAdjustments: Record<string, { x: number; y: number; scale: number }>
  sortIndex: number
  warnings: string[]
}

type PersistedPortraitAdjust = { x: number; y: number; scale: number }
type PersistedFolderFightVisuals = {
  portraitAAdjust: PersistedPortraitAdjust
  portraitBAdjust: PersistedPortraitAdjust
  slideImageAdjustments: Record<string, PersistedPortraitAdjust>
}
type PersistedFightVisualsStore = {
  version: 1
  updatedAt: string
  folders: Record<string, PersistedFolderFightVisuals>
}

const toPosixPath = (value: string) => value.split(path.sep).join('/')
const normalizeFsPath = (value: string) => toPosixPath(path.resolve(value)).toLowerCase()
const sanitizeFightPathSegment = (value: string) =>
  value
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0)
      return /[<>:"/\\|?*]/.test(char) || code < 32 ? ' ' : char
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '')
const isPathInsideDirectory = (filePath: string, directoryPath: string) => {
  const relative = path.relative(directoryPath, filePath)
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative)
}

const normalizeToken = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')

const stripFileExtension = (value: string) => value.replace(/\.[^.]+$/, '').trim()
const stripFightFileDecoratorSuffix = (value: string) =>
  value.replace(/\.(?:txt|json)\s*(?:pl|en|eng|polski|english)?\s*$/i, '').trim()
const normalizeFightFileBaseName = (value: string) => stripFightFileDecoratorSuffix(stripFileExtension(value))
const isSharedScansFile = (fileName: string) => {
  if (!JSON_FILE_PATTERN.test(fileName)) return false
  const normalizedBase = normalizeFightFileBaseName(fileName).replace(MATCHUP_PREFIX_PATTERN, '').trim()
  return SHARED_SCANS_FILE_PATTERN.test(normalizedBase)
}

const splitFightNameLocaleSuffix = (value: string): { base: string; locale: 'pl' | 'en' | 'unknown' } => {
  const normalized = value.replace(/[_]+/g, ' ').trim()
  if (!normalized) return { base: '', locale: 'unknown' }
  const match = normalized.match(FIGHT_LOCALE_SUFFIX_PATTERN)
  if (!match) return { base: normalized, locale: 'unknown' }
  const suffix = normalizeToken(match[1] || '')
  const locale = suffix === 'pl' || suffix === 'polski' ? 'pl' : 'en'
  const base = normalized.slice(0, match.index ?? normalized.length).trim()
  return { base: base || normalized, locale }
}

const toMatchupDisplayNameFromFileName = (fileName: string) => {
  const raw = normalizeFightFileBaseName(fileName).replace(MATCHUP_PREFIX_PATTERN, '').trim()
  const split = splitFightNameLocaleSuffix(raw)
  return split.base || raw
}

const parseMatchupFromName = (value: string): { leftName: string; rightName: string } | null => {
  const match = value.match(/^\s*(.+?)\s+(?:vs\.?|versus|kontra|v)\s+(.+?)\s*$/i)
  if (!match) return null
  const leftName = match[1]?.trim()
  const rightName = match[2]?.trim()
  if (!leftName || !rightName) return null
  return { leftName, rightName }
}

const buildMatchupKey = (leftName: string, rightName: string) =>
  `${normalizeToken(leftName)}::${normalizeToken(rightName)}`

const extractSortIndex = (value: string) => {
  const match = value.match(/^\s*(\d+)\s*[._ -]*/)
  if (!match) return Number.MAX_SAFE_INTEGER
  const parsed = Number(match[1])
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER
}

const normalizeMatchName = (folderName: string) =>
  folderName.replace(/^\s*\d+\s*[._ -]*/, '').trim() || folderName.trim()

const asJson = (response: unknown) => JSON.stringify(response, null, 2)

const contentTypeForImage = (fileName: string) => {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.avif')) return 'image/avif'
  return 'image/jpeg'
}

const buildFileEtag = (size: number, mtimeMs: number) => `W/"${size}-${Math.round(mtimeMs)}"`
const IMAGE_CACHE_CONTROL = 'public, max-age=600'

const sendCachedImageFile = async (
  req: IncomingMessage,
  res: ServerResponse,
  filePath: string,
  fileName: string,
) => {
  const stats = await fs.stat(filePath)
  const etag = buildFileEtag(stats.size, stats.mtimeMs)
  const ifNoneMatch = req.headers['if-none-match']
  if (typeof ifNoneMatch === 'string' && ifNoneMatch === etag) {
    res.statusCode = 304
    res.setHeader('Cache-Control', IMAGE_CACHE_CONTROL)
    res.setHeader('ETag', etag)
    res.setHeader('Last-Modified', stats.mtime.toUTCString())
    res.end()
    return
  }

  const payload = await fs.readFile(filePath)
  res.statusCode = 200
  res.setHeader('Content-Type', contentTypeForImage(fileName))
  res.setHeader('Cache-Control', IMAGE_CACHE_CONTROL)
  res.setHeader('ETag', etag)
  res.setHeader('Last-Modified', stats.mtime.toUTCString())
  res.end(payload)
}

const clampPercent = (value: unknown) => {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return 50
  return Math.max(0, Math.min(100, numeric))
}

const clampScale = (value: unknown) => {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return 1
  return Math.max(0.6, Math.min(2.4, numeric))
}

const normalizePersistedPortraitAdjust = (value: unknown): PersistedPortraitAdjust => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { x: 50, y: 50, scale: 1 }
  }
  const raw = value as Record<string, unknown>
  return {
    x: clampPercent(raw.x),
    y: clampPercent(raw.y),
    scale: clampScale(raw.scale),
  }
}

const normalizePersistedSlideImageAdjustments = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const normalized: Record<string, PersistedPortraitAdjust> = {}
  Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
    const trimmed = key.trim()
    if (!trimmed) return
    const normalizedKey =
      Object.entries(LEGACY_TEMPLATE_ID_MAP).find(([legacyId]) => trimmed.startsWith(`${legacyId}:`))
        ? (() => {
            const [legacyId, canonicalId] =
              Object.entries(LEGACY_TEMPLATE_ID_MAP).find(([legacy]) => trimmed.startsWith(`${legacy}:`)) || []
            return legacyId ? `${canonicalId}:${trimmed.slice(legacyId.length + 1)}` : trimmed
          })()
        : trimmed
    if (!normalizedKey) return
    normalized[normalizedKey] = normalizePersistedPortraitAdjust(entry)
  })
  return normalized
}

const normalizePersistedFolderFightVisuals = (value: unknown): PersistedFolderFightVisuals => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {
      portraitAAdjust: normalizePersistedPortraitAdjust(null),
      portraitBAdjust: normalizePersistedPortraitAdjust(null),
      slideImageAdjustments: {},
    }
  }

  const raw = value as Record<string, unknown>
  return {
    portraitAAdjust: normalizePersistedPortraitAdjust(raw.portraitAAdjust),
    portraitBAdjust: normalizePersistedPortraitAdjust(raw.portraitBAdjust),
    slideImageAdjustments: normalizePersistedSlideImageAdjustments(raw.slideImageAdjustments),
  }
}

const readJsonBody = async (req: IncomingMessage) =>
  new Promise<unknown>((resolve, reject) => {
    const chunks: Uint8Array[] = []
    req.on('data', (chunk: Buffer | string) => {
      if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (!chunks.length) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })

const resolveIndexedFightImageFile = async (
  candidateFolder: string,
  section: string,
  entryIndex: number,
) => {
  if (entryIndex < 1) return ''

  try {
    const indexPayload = await fs.readFile(path.join(candidateFolder, 'img', 'index.md'), 'utf8')
    const indexedEntries = parseFightImageIndex(indexPayload).filter(
      (entry) => entry.section === section && entry.fileName,
    )
    if (indexedEntries[entryIndex - 1]?.fileName) {
      return indexedEntries[entryIndex - 1].fileName
    }
  } catch {
    // Fall through to filename-based inference.
  }

  const match = section.match(/^(\d+)\.(\d+)$/)
  if (!match) return ''

  try {
    const imageFiles = (await fs.readdir(path.join(candidateFolder, 'img')))
      .filter((file) => ANY_IMAGE_FILE_PATTERN.test(file))
      .filter((file) => file.includes(`_${match[1]}_${match[2]}_`))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    return imageFiles[entryIndex - 1] || ''
  } catch {
    return ''
  }
}

const listFightImageFiles = async (candidateFolder: string) => {
  try {
    return (await fs.readdir(path.join(candidateFolder, 'img')))
      .filter((file) => ANY_IMAGE_FILE_PATTERN.test(file))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
  } catch {
    return []
  }
}

const inferFightSidesFromFolder = (candidateFolder: string) => {
  const folderName = path.basename(candidateFolder).replace(/^\d+\s+/, '').trim()
  const parts = folderName.split(/\s+vs\.?\s+/i)
  if (parts.length < 2) {
    return { fighterATokens: [] as string[], fighterBTokens: [] as string[] }
  }

  const tokenize = (value: string) =>
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3)

  return {
    fighterATokens: tokenize(parts[0]),
    fighterBTokens: tokenize(parts[1]),
  }
}

const inferFightImageSide = (fileName: string, candidateFolder?: string) => {
  const normalized = fileName.toLowerCase()
  if (IMAGE_FILE_PATTERN.test(normalized)) {
    const sideToken = normalized.match(IMAGE_FILE_PATTERN)?.[1]
    if (sideToken === '1') return 'a'
    if (sideToken === '2') return 'b'
  }
  if (/_6_1_|_7_1_/.test(normalized)) return 'a'
  if (/_6_2_|_7_2_/.test(normalized)) return 'b'

  if (candidateFolder) {
    const { fighterATokens, fighterBTokens } = inferFightSidesFromFolder(candidateFolder)
    const hasA = fighterATokens.some((token) => normalized.includes(token))
    const hasB = fighterBTokens.some((token) => normalized.includes(token))
    if (hasA && !hasB) return 'a'
    if (hasB && !hasA) return 'b'
  }

  return null
}

const listFightImagesDetailed = async (candidateFolder: string) => {
  const files = await listFightImageFiles(candidateFolder)
  const indexedSideByFile = new Map<string, 'a' | 'b'>()

  try {
    const indexPayload = await fs.readFile(path.join(candidateFolder, 'img', 'index.md'), 'utf8')
    parseFightImageIndex(indexPayload).forEach((entry) => {
      const fileName = entry.fileName?.trim()
      if (!fileName) return
      if (entry.section === '6.1' || entry.section === '7.1') indexedSideByFile.set(fileName, 'a')
      if (entry.section === '6.2' || entry.section === '7.2') indexedSideByFile.set(fileName, 'b')
    })
  } catch {
    // Fallback to filename inference below.
  }

  return files.map((fileName) => ({
    fileName,
    side: indexedSideByFile.get(fileName) || inferFightImageSide(fileName, candidateFolder),
  }))
}

const pickPortraitFiles = (
  files: string[],
): { portraitAFile: string; portraitBFile: string; fallbackUsed: boolean } => {
  const portraitAFile =
    files.find((file) => IMAGE_FILE_PATTERN.test(file) && file.match(IMAGE_FILE_PATTERN)?.[1] === '1') || ''
  const portraitBFile =
    files.find((file) => IMAGE_FILE_PATTERN.test(file) && file.match(IMAGE_FILE_PATTERN)?.[1] === '2') || ''
  if (portraitAFile && portraitBFile) {
    return { portraitAFile, portraitBFile, fallbackUsed: false }
  }

  const imageCandidates = files
    .filter((file) => ANY_IMAGE_FILE_PATTERN.test(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

  if (imageCandidates.length < 2) {
    return { portraitAFile, portraitBFile, fallbackUsed: false }
  }

  const fallbackA = portraitAFile || imageCandidates[0]
  const fallbackB = portraitBFile || imageCandidates.find((file) => file !== fallbackA) || ''
  return {
    portraitAFile: fallbackA,
    portraitBFile: fallbackB,
    fallbackUsed: Boolean((!portraitAFile || !portraitBFile) && fallbackA && fallbackB),
  }
}

const resolveFightsDir = async (): Promise<string | null> => {
  for (const directory of FIGHTS_DIR_CANDIDATES) {
    try {
      await fs.access(directory)
      return directory
    } catch {
      // Try next candidate.
    }
  }
  return null
}

const resolveFightVisualsFilePath = (fightsDir: string) => path.join(fightsDir, FIGHT_VISUALS_FILE_NAME)

const readFightVisualsStore = async (fightsDir: string): Promise<PersistedFightVisualsStore> => {
  try {
    const payload = await fs.readFile(resolveFightVisualsFilePath(fightsDir), 'utf8')
    const parsed = JSON.parse(payload) as { folders?: unknown; updatedAt?: unknown }
    const normalizedFolders: Record<string, PersistedFolderFightVisuals> = {}

    if (parsed.folders && typeof parsed.folders === 'object' && !Array.isArray(parsed.folders)) {
      Object.entries(parsed.folders as Record<string, unknown>).forEach(([folderKey, visuals]) => {
        const normalizedKey = folderKey.trim()
        if (!normalizedKey) return
        normalizedFolders[normalizedKey] = normalizePersistedFolderFightVisuals(visuals)
      })
    }

    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date(0).toISOString(),
      folders: normalizedFolders,
    }
  } catch {
    return {
      version: 1,
      updatedAt: new Date(0).toISOString(),
      folders: {},
    }
  }
}

const writeFightVisualsStore = async (
  fightsDir: string,
  folders: Record<string, PersistedFolderFightVisuals>,
) => {
  const nextStore: PersistedFightVisualsStore = {
    version: 1,
    updatedAt: new Date().toISOString(),
    folders,
  }
  await fs.writeFile(resolveFightVisualsFilePath(fightsDir), `${JSON.stringify(nextStore, null, 2)}\n`, 'utf8')
}

const normalizeFightVisualsWritePayload = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const rawFolders = (value as { folders?: unknown }).folders
  if (!Array.isArray(rawFolders)) return null

  const folders: Record<string, PersistedFolderFightVisuals> = {}
  rawFolders.forEach((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return
    const raw = entry as Record<string, unknown>
    const folderKey = typeof raw.folderKey === 'string' ? raw.folderKey.trim() : ''
    if (!folderKey) return
    folders[folderKey] = normalizePersistedFolderFightVisuals(raw)
  })

  return folders
}

// Canonical fight files may only be written from schema-validated JSON payloads.
// ParsedVsImport is a lossy viewer model and must never be accepted here.
const normalizeFightScaffoldWritePayload = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const raw = value as Record<string, unknown>
  const matchName = typeof raw.matchName === 'string' ? sanitizeFightPathSegment(raw.matchName) : ''
  const englishFight = raw.englishFight as FightLocaleJsonV1 | undefined
  const polishFight = raw.polishFight as FightLocaleJsonV1 | undefined
  const scans = raw.scans as FightScansJsonV1 | undefined
  if (!matchName || !englishFight || !polishFight || !scans) return null
  if (englishFight.schemaVersion !== 1 || englishFight.locale !== 'en') return null
  if (polishFight.schemaVersion !== 1 || polishFight.locale !== 'pl') return null
  if (scans.schemaVersion !== 1) return null
  return { matchName, englishFight, polishFight, scans }
}

const readJsonFile = async <T>(filePath: string) => JSON.parse(await fs.readFile(filePath, 'utf8')) as T

const getNextFightFolderIndex = async (fightsDir: string) => {
  const entries = await fs.readdir(fightsDir, { withFileTypes: true })
  const maxIndex = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const match = entry.name.match(/^\s*(\d+)\s*[._ -]*/)
      return match ? Number(match[1]) : 0
    })
    .filter((value) => Number.isFinite(value))
    .reduce((highest, value) => Math.max(highest, value), 0)
  return maxIndex + 1
}

const scanFightsDirectory = async (): Promise<{ fights: ScanFightRecord[]; warnings: string[] }> => {
  const warnings: string[] = []
  const fights: ScanFightRecord[] = []
  const fightsDir = await resolveFightsDir()
  if (!fightsDir) {
    return { fights, warnings }
  }
  if (fightsDir !== FIGHTS_DIR_CANDIDATES[0]) {
    warnings.push(`Using fallback fights directory: ${fightsDir}`)
  }
  const fightVisualsStore = await readFightVisualsStore(fightsDir)

  const entries = await fs.readdir(fightsDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const folderName = entry.name
    const folderPath = path.join(fightsDir, folderName)
    const folderKey = toPosixPath(folderName)
    const matchName = normalizeMatchName(folderName)
    const sortIndex = extractSortIndex(folderName)
    const folderWarnings: string[] = []
    const persistedVisuals = fightVisualsStore.folders[folderKey] || normalizePersistedFolderFightVisuals(null)

    let files: string[] = []
    try {
      const childEntries = await fs.readdir(folderPath, { withFileTypes: true })
      files = childEntries.filter((item) => item.isFile()).map((item) => item.name)
    } catch {
      warnings.push(`Could not read folder "${folderName}".`)
      continue
    }

    const localeCandidates = files
      .filter((file) => JSON_FILE_PATTERN.test(file) && !isSharedScansFile(file))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    const sharedScansCandidates = files
      .filter((file) => isSharedScansFile(file))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    if (!localeCandidates.length) {
      folderWarnings.push(`Missing fight JSON in folder "${folderName}".`)
    }
    if (sharedScansCandidates.length > 1) {
      folderWarnings.push(
        `Multiple shared scans JSON files detected in folder "${folderName}"; using "${sharedScansCandidates[0]}".`,
      )
    }

    if (!localeCandidates.length) {
      warnings.push(...folderWarnings)
      continue
    }

    let sharedScansJson: FightScansJsonV1 | null = null
    let scansPortraitAFile = ''
    let scansPortraitBFile = ''
    if (sharedScansCandidates[0]) {
      try {
        const scansPayload = await readJsonFile<FightScansJsonV1>(path.join(folderPath, sharedScansCandidates[0]))
        sharedScansJson = scansPayload
        scansPortraitAFile = typeof scansPayload.portraits?.a === 'string' ? scansPayload.portraits.a.trim() : ''
        scansPortraitBFile = typeof scansPayload.portraits?.b === 'string' ? scansPayload.portraits.b.trim() : ''
      } catch {
        folderWarnings.push(`Failed to read shared scans JSON "${sharedScansCandidates[0]}" in folder "${folderName}".`)
      }
    } else {
      folderWarnings.push(`Missing shared scans JSON in folder "${folderName}".`)
    }

    if (!sharedScansJson) {
      warnings.push(...folderWarnings)
      continue
    }

    const { portraitAFile: rootPortraitAFile, portraitBFile: rootPortraitBFile, fallbackUsed } = pickPortraitFiles(files)
    const portraitAFile = scansPortraitAFile || rootPortraitAFile
    const portraitBFile = scansPortraitBFile || rootPortraitBFile
    if (!scansPortraitAFile && !scansPortraitBFile && fallbackUsed) {
      folderWarnings.push(
        `Using fallback portraits in folder "${folderName}" (first two image files; preferred names are 1.* and 2.*).`,
      )
    }

    if (!portraitAFile) folderWarnings.push(`Missing portrait A in folder "${folderName}".`)
    if (!portraitBFile) folderWarnings.push(`Missing portrait B in folder "${folderName}".`)

    const hasExplicitPlVariant = localeCandidates.some(
      (file) => splitFightNameLocaleSuffix(stripFileExtension(file)).locale === 'pl',
    )

    for (const [fileIndex, fileName] of localeCandidates.entries()) {
      let localeJson: FightLocaleJsonV1
      let payload: ParsedVsImport
      try {
        localeJson = await readJsonFile<FightLocaleJsonV1>(path.join(folderPath, fileName))
        payload = parseFightJsonFiles(localeJson, sharedScansJson)
      } catch (error) {
        warnings.push(`Failed to parse JSON "${fileName}" in folder "${folderName}": ${String(error)}`)
        continue
      }

      const fileMatchName = toMatchupDisplayNameFromFileName(fileName) || matchName
      const parsedFileMatchup = parseMatchupFromName(fileMatchName)
      const parsedFolderMatchup = parsedFileMatchup ? null : parseMatchupFromName(matchName)
      const matchupKey = parsedFileMatchup
        ? buildMatchupKey(parsedFileMatchup.leftName, parsedFileMatchup.rightName)
        : parsedFolderMatchup
          ? buildMatchupKey(parsedFolderMatchup.leftName, parsedFolderMatchup.rightName)
          : normalizeToken(fileMatchName || matchName || folderName)

      let variantLocale = splitFightNameLocaleSuffix(stripFileExtension(fileName)).locale
      if (variantLocale === 'unknown' && localeJson.locale) {
        variantLocale = localeJson.locale
      } else if (variantLocale === 'unknown' && localeCandidates.length > 1 && hasExplicitPlVariant) {
        variantLocale = 'en'
      }
      const variantLabel =
        variantLocale === 'pl'
          ? 'PL'
          : variantLocale === 'en'
            ? 'EN'
            : stripFileExtension(fileName).replace(MATCHUP_PREFIX_PATTERN, '').trim()

      fights.push({
        folderKey,
        displayName: folderName,
        matchName: fileMatchName,
        matchupKey,
        variantLocale,
        variantLabel,
        fileName,
        payload,
        portraitAUrl: portraitAFile ? `/api/fights/image?key=${encodeURIComponent(folderKey)}&file=${encodeURIComponent(portraitAFile)}` : '',
        portraitBUrl: portraitBFile ? `/api/fights/image?key=${encodeURIComponent(folderKey)}&file=${encodeURIComponent(portraitBFile)}` : '',
        portraitAAdjust: persistedVisuals.portraitAAdjust,
        portraitBAdjust: persistedVisuals.portraitBAdjust,
        slideImageAdjustments: persistedVisuals.slideImageAdjustments,
        sortIndex: sortIndex + fileIndex * 0.001,
        warnings: fileIndex === 0 ? folderWarnings : [],
      })
    }
  }

  fights.sort((a, b) => {
    if (a.sortIndex !== b.sortIndex) return a.sortIndex - b.sortIndex
    const nameOrder = a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base', numeric: true })
    if (nameOrder !== 0) return nameOrder
    return a.fileName.localeCompare(b.fileName, undefined, { sensitivity: 'base', numeric: true })
  })
  return { fights, warnings }
}

const handleFightsAssetRequest = async (req: IncomingMessage, url: URL, res: ServerResponse) => {
  const key = String(url.searchParams.get('key') || '').trim()
  const slot = String(url.searchParams.get('slot') || '').trim()
  if (!key || (slot !== '1' && slot !== '2')) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(asJson({ error: 'Invalid asset query.' }))
    return
  }

  const fightsDir = await resolveFightsDir()
  if (!fightsDir) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(asJson({ error: 'Fights directory not found.' }))
    return
  }

  const safeKey = key.replace(/\\/g, '/')
  const candidateFolder = path.resolve(fightsDir, safeKey)
  const relativeToRoot = path.relative(fightsDir, candidateFolder)
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(asJson({ error: 'Invalid folder key.' }))
    return
  }

  let files: string[] = []
  try {
    const entries = await fs.readdir(candidateFolder, { withFileTypes: true })
    files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name)
  } catch {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(asJson({ error: 'Fight folder not found.' }))
    return
  }

  const { portraitAFile, portraitBFile } = pickPortraitFiles(files)
  const assetFile = slot === '1' ? portraitAFile : portraitBFile

  if (!assetFile) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(asJson({ error: `Missing portrait ${slot}.*.` }))
    return
  }

  try {
    await sendCachedImageFile(req, res, path.join(candidateFolder, assetFile), assetFile)
  } catch {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(asJson({ error: 'Failed to read portrait file.' }))
  }
}

const createFightsApiMiddleware = (): Connect.NextHandleFunction => {
  return async (req, res, next) => {
    if (!req.url) {
      next()
      return
    }
    const requestUrl = new URL(req.url, 'http://127.0.0.1')
    if (requestUrl.pathname.startsWith('/api/nightfm-mock/')) {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.end('{}')
      return
    }

    if (!requestUrl.pathname.startsWith('/api/fights/')) {
      next()
      return
    }
    const isVisualsWriteRequest = requestUrl.pathname === '/api/fights/visuals' && req.method === 'POST'
    const isFightCreateRequest = requestUrl.pathname === '/api/fights/create' && req.method === 'POST'
    if (req.method !== 'GET' && !isVisualsWriteRequest && !isFightCreateRequest) {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(asJson({ error: 'Method not allowed.' }))
      return
    }

    if (isVisualsWriteRequest) {
      const fightsDir = await resolveFightsDir()
      if (!fightsDir) {
        res.statusCode = 404
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(asJson({ error: 'Fights directory not found.' }))
        return
      }

      try {
        const payload = await readJsonBody(req)
        const normalizedFolders = normalizeFightVisualsWritePayload(payload)
        if (!normalizedFolders) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(asJson({ error: 'Invalid visuals payload.' }))
          return
        }

        const currentStore = await readFightVisualsStore(fightsDir)
        await writeFightVisualsStore(fightsDir, {
          ...currentStore.folders,
          ...normalizedFolders,
        })
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(asJson({ ok: true }))
      } catch (error) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(asJson({ error: 'Failed to save fight visuals.', details: String(error) }))
      }
      return
    }

    if (isFightCreateRequest) {
      const fightsDir = await resolveFightsDir()
      if (!fightsDir) {
        res.statusCode = 404
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(asJson({ error: 'Fights directory not found.' }))
        return
      }

      try {
        const payload = await readJsonBody(req)
        const normalized = normalizeFightScaffoldWritePayload(payload)
        if (!normalized) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(asJson({ error: 'Invalid fight scaffold payload.' }))
          return
        }

        let nextIndex = await getNextFightFolderIndex(fightsDir)
        let folderName = `${nextIndex} ${normalized.matchName}`.trim()
        let folderPath = path.join(fightsDir, folderName)

        while (true) {
          try {
            await fs.access(folderPath)
            nextIndex += 1
            folderName = `${nextIndex} ${normalized.matchName}`.trim()
            folderPath = path.join(fightsDir, folderName)
          } catch {
            break
          }
        }

        await fs.mkdir(path.join(folderPath, 'img'), { recursive: true })

        const englishFileName = `${folderName} EN.json`
        const polishFileName = `${folderName} PL.json`
        const scansFileName = `${folderName} Scans.json`

        await fs.writeFile(
          path.join(folderPath, englishFileName),
          `${JSON.stringify(normalized.englishFight, null, 2)}\n`,
          'utf8',
        )
        await fs.writeFile(
          path.join(folderPath, polishFileName),
          `${JSON.stringify(normalized.polishFight, null, 2)}\n`,
          'utf8',
        )
        await fs.writeFile(
          path.join(folderPath, scansFileName),
          `${JSON.stringify(normalized.scans, null, 2)}\n`,
          'utf8',
        )

        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(
          asJson({
            ok: true,
            folderName,
            folderKey: toPosixPath(folderName),
            files: [englishFileName, polishFileName, scansFileName],
          }),
        )
      } catch (error) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(asJson({ error: 'Failed to create fight scaffold.', details: String(error) }))
      }
      return
    }

    if (requestUrl.pathname === '/api/fights/scan') {
      try {
        const scanned = await scanFightsDirectory()
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(asJson(scanned))
      } catch (error) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(asJson({ fights: [], warnings: ['Failed to scan Fights directory.'], error: String(error) }))
      }
      return
    }

    if (requestUrl.pathname === '/api/fights/asset') {
      await handleFightsAssetRequest(req, requestUrl, res)
      return
    }

    if (requestUrl.pathname === '/api/fights/image') {
      const key = String(requestUrl.searchParams.get('key') || '').trim()
      const fileName = String(requestUrl.searchParams.get('file') || '').trim()
      const section = String(requestUrl.searchParams.get('section') || '').trim()
      const entryIndex = Number(String(requestUrl.searchParams.get('index') || '').trim())
      if (!key || (!fileName && (!section || !Number.isInteger(entryIndex) || entryIndex < 1))) {
        res.statusCode = 400
        res.end(asJson({ error: 'Invalid parameters' }))
        return
      }
      const fightsDir = await resolveFightsDir()
      if (!fightsDir) {
        res.statusCode = 404
        res.end(asJson({ error: 'Fights dir not found' }))
        return
      }
      const normalizedKey = key.replace(/\\/g, '/')
      const candidateFolder = path.resolve(fightsDir, normalizedKey)
      const relativeFolder = path.relative(fightsDir, candidateFolder)
      if (relativeFolder.startsWith('..') || path.isAbsolute(relativeFolder)) {
        res.statusCode = 403
        res.end(asJson({ error: 'Forbidden' }))
        return
      }

      const resolvedFileName = fileName || await resolveIndexedFightImageFile(candidateFolder, section, entryIndex)
      if (!resolvedFileName) {
        res.statusCode = 404
        res.end(asJson({ error: 'Image not found' }))
        return
      }

      const candidates = [path.join(candidateFolder, 'img', resolvedFileName), path.join(candidateFolder, resolvedFileName)]
      for (const candidatePath of candidates) {
        const relativePath = path.relative(fightsDir, candidatePath)
        if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
          continue
        }
        try {
          await sendCachedImageFile(req, res, candidatePath, resolvedFileName)
          return
        } catch {
          // Try next candidate.
        }
      }

      res.statusCode = 404
      res.end(asJson({ error: 'Image not found' }))
      return
    }

    if (requestUrl.pathname === '/api/fights/images') {
      const key = String(requestUrl.searchParams.get('key') || '').trim()
      if (!key) {
        res.statusCode = 400
        res.end(asJson({ error: 'Invalid parameters' }))
        return
      }
      const fightsDir = await resolveFightsDir()
      if (!fightsDir) {
        res.statusCode = 404
        res.end(asJson({ error: 'Fights dir not found' }))
        return
      }
      const normalizedKey = key.replace(/\\/g, '/')
      const candidateFolder = path.resolve(fightsDir, normalizedKey)
      const relativeFolder = path.relative(fightsDir, candidateFolder)
      if (relativeFolder.startsWith('..') || path.isAbsolute(relativeFolder)) {
        res.statusCode = 403
        res.end(asJson({ error: 'Forbidden' }))
        return
      }

      const files = await listFightImagesDetailed(candidateFolder)
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.end(asJson({ ok: true, key: normalizedKey, files }))
      return
    }

    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(asJson({ error: 'Not found.' }))
  }
}

const fightsApiPlugin = (): Plugin => ({
  name: 'vs-fights-api',
  configureServer(server) {
    server.middlewares.use(createFightsApiMiddleware())
    const watchedDirs = FIGHTS_DIR_CANDIDATES.map((directory) => path.resolve(directory))
    const normalizedWatchedDirs = watchedDirs.map(normalizeFsPath)
    const normalizedTemplatesDir = normalizeFsPath(TEMPLATES_DIR)
    server.watcher.add(watchedDirs)
    server.watcher.add(TEMPLATES_DIR)

    let templateReloadTimer: NodeJS.Timeout | null = null
    let templateSyncInFlight = false

    const syncTemplatesIndex = async () => {
      if (templateSyncInFlight) return
      templateSyncInFlight = true
      try {
        await execFileAsync(process.execPath, ['scripts/export-template-library.mjs'], {
          cwd: __dirname,
        })
      } catch (error) {
        console.error('[vs-templates-sync] Failed to rebuild template library after change.', error)
      } finally {
        templateSyncInFlight = false
      }
    }

    const handleFightFileEvent = (eventName: string, changedPath: string) => {
      if (!changedPath || !['add', 'change', 'unlink'].includes(eventName)) return

      const normalizedChangedPath = normalizeFsPath(changedPath)
      const matchesFightsTree = normalizedWatchedDirs.some((directory) =>
        isPathInsideDirectory(normalizedChangedPath, directory),
      )
      if (!matchesFightsTree) return

      server.ws.send({
        type: 'custom',
        event: 'vs-fights-changed',
        data: {
          event: eventName,
          path: normalizedChangedPath,
        },
      })
    }

    const handleTemplateFileEvent = (eventName: string, changedPath: string) => {
      if (!changedPath || !['add', 'unlink'].includes(eventName)) return

      const normalizedChangedPath = normalizeFsPath(changedPath)
      if (!isPathInsideDirectory(normalizedChangedPath, normalizedTemplatesDir) && normalizedChangedPath !== normalizedTemplatesDir) {
        return
      }

      if (templateReloadTimer) {
        clearTimeout(templateReloadTimer)
      }
      templateReloadTimer = setTimeout(() => {
        templateReloadTimer = null
        void syncTemplatesIndex()
      }, 60)
    }

    server.watcher.on('all', handleFightFileEvent)
    server.watcher.on('all', handleTemplateFileEvent)
  },
  configurePreviewServer(server) {
    server.middlewares.use(createFightsApiMiddleware())
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), fightsApiPlugin()],
})
