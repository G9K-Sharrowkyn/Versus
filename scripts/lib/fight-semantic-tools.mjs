import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)

export const REPO_ROOT = process.cwd()
export const FIGHTS_ROOT = path.join(REPO_ROOT, 'Fights')
export const BASELINE_REF = '2c356c7^'
export const CANONICAL_STAT_KEYS = ['strength', 'speed', 'durability', 'battleIq', 'hax', 'stamina', 'style', 'experience', 'skills']

const CURRENT_IMPORTER_PATH = path.join(REPO_ROOT, 'src/features/vs/importer.ts')
const BASELINE_IMPORTER_PATH = path.join(REPO_ROOT, 'src/features/vs/.baseline-importer.ts')
const BASELINE_TS_FILES = [
  'src/features/vs/importer.ts',
  'src/features/vs/fightManifest.ts',
  'src/features/vs/presets.ts',
  'src/features/vs/types.ts',
]

export const stripBom = (value) => value.replace(/^\uFEFF/, '')

export const normalizeToken = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')

export const trimString = (value) => (typeof value === 'string' ? value.trim() : '')

export const trimStringArray = (value) =>
  Array.isArray(value) ? value.map((entry) => trimString(entry)).filter(Boolean) : []

const transpileTs = (source, fileName) =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      resolveJsonModule: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName,
  }).outputText

const resolveLocalModule = (fromFile, specifier, overrides) => {
  const basePath = specifier.startsWith('/')
    ? specifier
    : path.resolve(path.dirname(fromFile), specifier)

  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    `${basePath}.json`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.mjs'),
    path.join(basePath, 'index.json'),
  ]

  for (const candidate of candidates) {
    if (overrides.has(candidate)) return candidate
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }

  throw new Error(`Cannot resolve module "${specifier}" from ${fromFile}`)
}

const createTsModuleLoader = (overrides = new Map()) => {
  const cache = new Map()

  const loadModule = (modulePath) => {
    if (cache.has(modulePath)) return cache.get(modulePath).exports

    if (modulePath.endsWith('.json')) {
      const jsonText = overrides.has(modulePath)
        ? overrides.get(modulePath)
        : readFileSync(modulePath, 'utf8')
      return JSON.parse(stripBom(jsonText))
    }

    if (!/\.(ts|tsx|js|mjs)$/i.test(modulePath)) {
      return require(modulePath)
    }

    const source = overrides.has(modulePath)
      ? overrides.get(modulePath)
      : readFileSync(modulePath, 'utf8')

    const compiled = /\.(ts|tsx)$/i.test(modulePath)
      ? transpileTs(source, modulePath)
      : source

    const module = { exports: {} }
    cache.set(modulePath, module)

    const localRequire = (specifier) => {
      if (specifier.startsWith('.') || specifier.startsWith('/')) {
        const resolved = resolveLocalModule(modulePath, specifier, overrides)
        return loadModule(resolved)
      }
      return require(specifier)
    }

    new Function('require', 'module', 'exports', '__filename', '__dirname', compiled)(
      localRequire,
      module,
      module.exports,
      modulePath,
      path.dirname(modulePath),
    )

    return module.exports
  }

  return { loadModule }
}

const gitShow = (ref, relativePath) =>
  execFileSync('git', ['show', `${ref}:${relativePath}`], { encoding: 'utf8' })

export const loadCurrentImporter = () => createTsModuleLoader().loadModule(CURRENT_IMPORTER_PATH)

export const loadHistoricalImporter = (ref = BASELINE_REF) => {
  const overrides = new Map()
  for (const relativePath of BASELINE_TS_FILES) {
    const absolutePath =
      relativePath === 'src/features/vs/importer.ts'
        ? BASELINE_IMPORTER_PATH
        : path.join(REPO_ROOT, relativePath)
    overrides.set(absolutePath, gitShow(ref, relativePath))
  }
  return createTsModuleLoader(overrides).loadModule(BASELINE_IMPORTER_PATH)
}

export const listFightFolders = () =>
  readdirSync(FIGHTS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+\s/.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

export const readFightJsonSet = (folderName) => {
  const folderPath = path.join(FIGHTS_ROOT, folderName)
  return {
    folderPath,
    enPath: path.join(folderPath, `${folderName} EN.json`),
    plPath: path.join(folderPath, `${folderName} PL.json`),
    scansPath: path.join(folderPath, `${folderName} Scans.json`),
    en: JSON.parse(readFileSync(path.join(folderPath, `${folderName} EN.json`), 'utf8')),
    pl: JSON.parse(readFileSync(path.join(folderPath, `${folderName} PL.json`), 'utf8')),
    scans: JSON.parse(readFileSync(path.join(folderPath, `${folderName} Scans.json`), 'utf8')),
  }
}

export const readBaselineFightTexts = (folderName, ref = BASELINE_REF) => {
  const relativeRoot = `Fights/${folderName}`
  return {
    enTxt: stripBom(gitShow(ref, `${relativeRoot}/${folderName}.txt`)),
    plTxt: stripBom(gitShow(ref, `${relativeRoot}/${folderName} PL.txt`)),
    scansTxt: stripBom(gitShow(ref, `${relativeRoot}/${folderName} Scans.txt`)),
  }
}

export const parseTemplateBlocks = (text) => {
  const lines = stripBom(String(text || '')).replace(/\r\n/g, '\n').split('\n')
  const blocks = {}
  let currentHeading = null
  let currentLines = []

  const flush = () => {
    if (!currentHeading) return
    blocks[currentHeading] = currentLines
      .map((line) => line.trimEnd())
      .filter((line) => line.trim().length)
    currentHeading = null
    currentLines = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    const headingMatch = line.match(/^Template\s+(.+?)\s*:\s*$/i)
    if (headingMatch) {
      flush()
      currentHeading = headingMatch[1].trim()
      continue
    }
    if (!currentHeading) continue
    currentLines.push(rawLine)
  }

  flush()
  return blocks
}

export const parseRawKeyValueBlock = (lines) => {
  const entries = {}
  for (const rawLine of lines || []) {
    const bullet = String(rawLine).trim().replace(/^[-*?]\s*/, '')
    const match = bullet.match(/^([^:=]+?)\s*[:=]\s*(.*)$/)
    if (!match) continue
    const key = match[1].trim()
    const value = match[2].trim()
    if (!key) continue
    entries[key] = value
  }
  return entries
}

export const resolveTemplateId = (heading, importer) => {
  const [resolved] = importer.parseTemplateOrderTokens([heading])
  return resolved || null
}

const buildTemplateBlocksFromLegacyBlocks = (blocks, importer) =>
  Object.fromEntries(
    Object.entries(blocks)
      .map(([heading, lines]) => [resolveTemplateId(heading, importer), parseRawKeyValueBlock(lines)])
      .filter(([templateId, block]) => templateId && Object.keys(block).length)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })),
  )

const STAT_TOKEN_KEY_MAP = {
  strength: 'strength',
  sila: 'strength',
  speed: 'speed',
  szybkosc: 'speed',
  durability: 'durability',
  wytrzymalosc: 'durability',
  combatiq: 'battleIq',
  battleiq: 'battleIq',
  iqbojowe: 'battleIq',
  hax: 'hax',
  stamina: 'stamina',
  kondycja: 'stamina',
  style: 'style',
  stylwalki: 'style',
  fightingstyle: 'style',
  experience: 'experience',
  doswiadczenie: 'experience',
  skills: 'skills',
  combatskills: 'skills',
  umiejetnoscibojowe: 'skills',
  umiejetnosci: 'skills',
}

export const buildStatsRecordFromParsedStats = (stats = []) => {
  const output = Object.fromEntries(CANONICAL_STAT_KEYS.map((key) => [key, null]))
  for (const stat of stats) {
    const statId = STAT_TOKEN_KEY_MAP[normalizeToken(stat?.label)]
    if (!statId) continue
    const numeric = typeof stat?.value === 'number' ? stat.value : Number(stat?.value)
    output[statId] = Number.isFinite(numeric) ? Math.round(numeric) : null
  }
  return output
}

const DOSSIER_TITLE_KEY_MAP = {
  style: 'style',
  styl: 'style',
  advantage: 'advantage',
  atut: 'advantage',
  mentality: 'mentality',
  mentalnosc: 'mentality',
}

const PROFILE_TITLE_KEY_MAP = {
  powers: 'powers',
  moce: 'powers',
  tools: 'tools',
  narzedzia: 'tools',
  weaknesses: 'weaknesses',
  slabosci: 'weaknesses',
}

export const buildDossierFromFacts = (facts = []) => {
  const output = { style: '', advantage: '', mentality: '', quote: '' }
  for (const fact of facts) {
    const key = DOSSIER_TITLE_KEY_MAP[normalizeToken(fact?.title)]
    if (!key) continue
    output[key] = trimString(fact?.text)
  }
  return output
}

export const buildProfileFromFacts = (facts = []) => {
  const output = { powers: [], tools: [], weaknesses: [] }
  for (const fact of facts) {
    const key = PROFILE_TITLE_KEY_MAP[normalizeToken(fact?.title)]
    if (!key) continue
    const text = trimString(fact?.text)
    if (!text) continue
    output[key].push(text)
  }
  return output
}

const normalizeTemplateBlockValue = (value) => {
  if (Array.isArray(value)) return value.map((entry) => trimString(entry)).filter(Boolean)
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'boolean') return value
  return ''
}

const normalizeTemplateBlockObject = (block = {}) =>
  Object.fromEntries(
    Object.entries(block)
      .map(([key, value]) => [trimString(key), normalizeTemplateBlockValue(value)])
      .filter(([key, value]) => {
        if (!key) return false
        if (Array.isArray(value)) return value.length > 0
        if (typeof value === 'string') return value.length > 0
        return value !== ''
      })
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })),
  )

const buildRawTemplateBlocksProjection = (localeBlocks = {}, scansBlocks = {}) => {
  const templateIds = new Set([...Object.keys(localeBlocks), ...Object.keys(scansBlocks)])
  return Object.fromEntries(
    Array.from(templateIds)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((templateId) => [
        templateId,
        normalizeTemplateBlockObject({
          ...(localeBlocks?.[templateId] || {}),
          ...(scansBlocks?.[templateId] || {}),
        }),
      ])
      .filter(([, block]) => Object.keys(block).length),
  )
}

export const buildCurrentLocaleProjection = (localeJson, scansJson, importer) => {
  const parsed = importer.parseFightJsonFiles(localeJson, scansJson)
  return {
    statsA: Object.fromEntries(CANONICAL_STAT_KEYS.map((key) => [key, localeJson?.fighterA?.stats?.[key] ?? null])),
    statsB: Object.fromEntries(CANONICAL_STAT_KEYS.map((key) => [key, localeJson?.fighterB?.stats?.[key] ?? null])),
    factsA: (parsed.factsA || []).map((fact) => ({ title: trimString(fact?.title), text: trimString(fact?.text) })),
    factsB: (parsed.factsB || []).map((fact) => ({ title: trimString(fact?.title), text: trimString(fact?.text) })),
    powersA: (parsed.powersA || []).map((fact) => ({ title: trimString(fact?.title), text: trimString(fact?.text) })),
    powersB: (parsed.powersB || []).map((fact) => ({ title: trimString(fact?.title), text: trimString(fact?.text) })),
    crucialFeatsA: trimStringArray(parsed.crucialFeatsA),
    crucialFeatsB: trimStringArray(parsed.crucialFeatsB),
    winsA: trimStringArray(parsed.winsA),
    winsB: trimStringArray(parsed.winsB),
    templateOrder: Array.isArray(localeJson?.templateOrder) ? localeJson.templateOrder.map((item) => trimString(item)).filter(Boolean) : [],
    templateBlocks: buildRawTemplateBlocksProjection(localeJson?.templates, scansJson?.templates),
    portraits: {
      a: trimString(scansJson?.portraits?.a),
      b: trimString(scansJson?.portraits?.b),
    },
  }
}

export const buildBaselineLocaleProjection = (folderName, language, historicalImporter, currentImporter, ref = BASELINE_REF) => {
  const texts = readBaselineFightTexts(folderName, ref)
  const localeTxt = language === 'pl' ? texts.plTxt : texts.enTxt
  const parsedResult = historicalImporter.parseVsImportText(`${localeTxt}\n\n${texts.scansTxt}`)
  const parsed = parsedResult?.data || {}
  const localeBlocks = parseTemplateBlocks(localeTxt)
  const scansBlocks = parseTemplateBlocks(texts.scansTxt)

  const portraitFields = parseRawKeyValueBlock(
    Object.entries(scansBlocks)
      .filter(([heading]) => normalizeToken(heading) === 'portraits')
      .flatMap(([, lines]) => lines),
  )

  const localeTemplateBlocks = buildTemplateBlocksFromLegacyBlocks(localeBlocks, currentImporter)
  const scansTemplateBlocks = buildTemplateBlocksFromLegacyBlocks(scansBlocks, currentImporter)

  return {
    statsA: buildStatsRecordFromParsedStats(parsed?.statsA || []),
    statsB: buildStatsRecordFromParsedStats(parsed?.statsB || []),
    factsA: (parsed?.factsA || []).map((fact) => ({ title: trimString(fact?.title), text: trimString(fact?.text) })),
    factsB: (parsed?.factsB || []).map((fact) => ({ title: trimString(fact?.title), text: trimString(fact?.text) })),
    powersA: (parsed?.powersA || []).map((fact) => ({ title: trimString(fact?.title), text: trimString(fact?.text) })),
    powersB: (parsed?.powersB || []).map((fact) => ({ title: trimString(fact?.title), text: trimString(fact?.text) })),
    crucialFeatsA: trimStringArray(parsed?.crucialFeatsA),
    crucialFeatsB: trimStringArray(parsed?.crucialFeatsB),
    winsA: trimStringArray(parsed?.winsA),
    winsB: trimStringArray(parsed?.winsB),
    templateOrder: Array.isArray(parsed?.templateOrder) ? parsed.templateOrder.map((item) => trimString(item)).filter(Boolean) : [],
    templateBlocks: buildRawTemplateBlocksProjection(localeTemplateBlocks, scansTemplateBlocks),
    portraits: {
      a: trimString(portraitFields.portrait_a),
      b: trimString(portraitFields.portrait_b),
    },
    parsed,
    localeBlocks,
    scansBlocks,
  }
}

export const diffSemanticProjection = (baseline, current) => {
  const diffs = []

  const pushIfDifferent = (label, a, b) => {
    if (JSON.stringify(a) !== JSON.stringify(b)) diffs.push(label)
  }

  pushIfDifferent('statsA', baseline.statsA, current.statsA)
  pushIfDifferent('statsB', baseline.statsB, current.statsB)
  pushIfDifferent('dossierA', baseline.factsA, current.factsA)
  pushIfDifferent('dossierB', baseline.factsB, current.factsB)
  pushIfDifferent('profileA', baseline.powersA, current.powersA)
  pushIfDifferent('profileB', baseline.powersB, current.powersB)
  pushIfDifferent('crucialFeatsA', baseline.crucialFeatsA, current.crucialFeatsA)
  pushIfDifferent('crucialFeatsB', baseline.crucialFeatsB, current.crucialFeatsB)
  pushIfDifferent('winsA', baseline.winsA, current.winsA)
  pushIfDifferent('winsB', baseline.winsB, current.winsB)
  pushIfDifferent('templateOrder', baseline.templateOrder, current.templateOrder)
  pushIfDifferent('templateBlocks', baseline.templateBlocks, current.templateBlocks)
  pushIfDifferent('portraits', baseline.portraits, current.portraits)

  return diffs
}

export const buildSnapshotRecord = (folderName, locale, projection) => ({
  folder: folderName,
  locale,
  statsA: projection.statsA,
  statsB: projection.statsB,
  dossierA: projection.factsA,
  dossierB: projection.factsB,
  profileA: projection.powersA,
  profileB: projection.powersB,
  crucialFeatsA: projection.crucialFeatsA,
  crucialFeatsB: projection.crucialFeatsB,
  winsA: projection.winsA,
  winsB: projection.winsB,
  templateOrder: projection.templateOrder,
  templateBlocks: projection.templateBlocks,
  portraits: projection.portraits,
})
