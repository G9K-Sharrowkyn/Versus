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
const CURRENT_FIGHT_MANIFEST_PATH = path.join(REPO_ROOT, 'src/features/vs/fightManifest.ts')
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
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')

export const trimString = (value) => (typeof value === 'string' ? value.trim() : '')

export const trimStringArray = (value) =>
  Array.isArray(value) ? value.map((entry) => trimString(entry)).filter(Boolean) : []

export const MANIFEST_OWNED_TEMPLATE_FIELDS = {
  'tactical-board': ['headline', 'left_header', 'right_header', 'linear_label', 'chaos_label'],
  'character-dossier-a': ['header', 'style', 'advantage', 'mentality'],
  'character-dossier-b': ['header', 'style', 'advantage', 'mentality'],
  'character-profile': ['headline', 'subtitle', 'powers_label', 'tools_label', 'weaknesses_label', 'left_title', 'right_title'],
  'crucial-feats': ['headline', 'subtitle', 'feat_label', 'left_title', 'right_title'],
  'fight-analytics': ['headline', 'subtitle', 'scale', 'threat_level', 'integrity', 'profile_mode', 'profileMode'],
  'parameter-comparison': ['headline', 'subtitle', 'draw_header'],
  'victory-archive': ['headline', 'subtitle', 'archive_label', 'avg_label', 'left_title', 'right_title', 'win_badge'],
  'battle-dynamics': ['headline', 'subtitle'],
  'final-summary': ['headline', 'subtitle'],
  'x-factor': ['headline', 'subtitle'],
  interpretation: ['headline', 'subtitle'],
  'fight-simulation': ['headline', 'subtitle'],
  'stat-trap': ['headline', 'subtitle'],
  'direct-verdict': ['headline', 'subtitle'],
  'verdict-matrix': ['col_left', 'col_right', 'row_top', 'row_bottom'],
  'fight-card': ['headline', 'subtitle', 'top_color_a', 'top_color_b', 'bottom_color_a', 'bottom_color_b', 'top_dark', 'bottom_dark'],
  methodology: ['headline', 'subtitle', 'list_label', 'reality_label', 'linear_label', 'chaos_label', 'closing_label'],
}

export const FIGHTER_DERIVED_TEMPLATE_FIELD_PREFIXES = {
  'crucial-feats': ['left_item_', 'right_item_'],
  'victory-archive': ['left_item_', 'right_item_'],
}

export const MANIFEST_DEFAULT_TEMPLATE_FIELDS = {
  'fight-simulation': {
    phase_1_actor: 'a',
    phase_1_mode: 'bars',
    phase_2_actor: 'b',
    phase_2_mode: 'split',
    phase_3_mode: 'split',
  },
}

const toCamelCase = (value) =>
  value.replace(/[_-]([a-z0-9])/gi, (_, char) => char.toUpperCase())

const toSnakeCase = (value) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()

const manifestOwnedFieldSet = Object.fromEntries(
  Object.entries(MANIFEST_OWNED_TEMPLATE_FIELDS).map(([templateId, keys]) => [
    templateId,
    new Set(keys.flatMap((key) => [key, toCamelCase(key)])),
  ]),
)
const fighterDerivedFieldPrefixes = Object.fromEntries(
  Object.entries(FIGHTER_DERIVED_TEMPLATE_FIELD_PREFIXES).map(([templateId, prefixes]) => [
    templateId,
    prefixes.flatMap((prefix) => [prefix, toCamelCase(prefix)]),
  ]),
)

const manifestDefaultFieldMap = Object.fromEntries(
  Object.entries(MANIFEST_DEFAULT_TEMPLATE_FIELDS).map(([templateId, defaults]) => [
    templateId,
    new Map(
      Object.entries(defaults).flatMap(([key, value]) => [
        [key, value],
        [toCamelCase(key), value],
      ]),
    ),
  ]),
)

export const stripManifestOwnedTemplateFields = (templateId, block = {}) =>
  Object.fromEntries(
    Object.entries(block).filter(([key, value]) => {
      if (manifestOwnedFieldSet[templateId]?.has(key)) return false
      if (fighterDerivedFieldPrefixes[templateId]?.some((prefix) => key.startsWith(prefix))) return false
      const defaultValue = manifestDefaultFieldMap[templateId]?.get(key)
      if (defaultValue === undefined) return true
      return JSON.stringify(value) !== JSON.stringify(defaultValue)
    }),
  )

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

export const loadCurrentFightManifest = () => {
  const module = createTsModuleLoader().loadModule(CURRENT_FIGHT_MANIFEST_PATH)
  if (!module?.fightManifest?.templates) {
    throw new Error('Failed to load fight manifest templates from src/features/vs/fightManifest.ts')
  }
  return module.fightManifest
}

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

const pickTemplateBlockValue = (block = {}, keys = []) => {
  for (const key of keys) {
    for (const candidate of [key, toCamelCase(key), toSnakeCase(key)]) {
      const text = trimString(block?.[candidate])
      if (text) return text
    }
  }
  return ''
}

const normalizeVerdictLead = (value) => {
  const text = trimString(value)
  if (!text) return ''
  const match = text.match(/^(.+?[.!?])(?:\s+|$)/u)
  return (match ? match[1] : text).replace(/[.!?]+$/u, '').trim()
}

const extractNormalizedSentences = (...values) =>
  Array.from(
    new Set(
      values
        .flatMap((value) =>
          trimString(value)
            .split(/(?<=[.!?])\s+/u)
            .map((entry) => entry.replace(/[.!?]+$/u, '').trim())
            .filter(Boolean),
        )
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
    ),
  )

const splitLeadingWinnerSentence = (value) => {
  const text = trimString(value)
  if (!text) return { winner: '', body: '' }
  const match = text.match(/^(.+?[.!?])(?:\s+|$)(.*)$/u)
  if (!match) return { winner: '', body: text }
  const winner = match[1].replace(/[.!?]+$/u, '').trim()
  const body = trimString(match[2])
  if (!body) return { winner: '', body: text }
  if (winner.split(/\s+/u).length > 6) return { winner: '', body: text }
  return { winner, body }
}

const normalizeComparableTemplateBlock = (templateId, block = {}) => {
  switch (templateId) {
    case 'x-factor':
      return {
        headline: pickTemplateBlockValue(block, ['headline']),
        factor: pickTemplateBlockValue(block, ['factor']),
        subtitle: pickTemplateBlockValue(block, ['subtitle']),
        implication: pickTemplateBlockValue(block, ['implication', 'implikacja']),
        mechanics: pickTemplateBlockValue(block, ['mechanics', 'mechanika', 'left_case', 'left_body']),
        psychology: pickTemplateBlockValue(block, ['psychology', 'psychologia', 'right_case', 'right_body']),
      }
    case 'fight-simulation':
      return {
        headline: pickTemplateBlockValue(block, ['headline']),
        phase_1_title: pickTemplateBlockValue(block, ['phase_1_title']),
        phase_1_animation: pickTemplateBlockValue(block, ['phase_1_animation', 'phase_1_anim']),
        phase_1_text: pickTemplateBlockValue(block, ['phase_1_event', 'opening', 'phase_1_desc', 'phase_1_body']),
        phase_2_title: pickTemplateBlockValue(block, ['phase_2_title']),
        phase_2_animation: pickTemplateBlockValue(block, ['phase_2_animation', 'phase_2_anim']),
        phase_2_text: pickTemplateBlockValue(block, ['phase_2_event', 'mid_fight', 'phase_2_desc', 'phase_2_body']),
        phase_3_title: pickTemplateBlockValue(block, ['phase_3_title']),
        phase_3_actor: pickTemplateBlockValue(block, ['phase_3_actor']),
        phase_3_animation: pickTemplateBlockValue(block, ['phase_3_animation', 'phase_3_anim']),
        phase_3_text: pickTemplateBlockValue(block, ['phase_3_event', 'late_fight', 'phase_3_desc', 'phase_3_body']),
      }
    case 'verdict-matrix':
      return {
        headline: pickTemplateBlockValue(block, ['headline']),
        subtitle: pickTemplateBlockValue(block, ['subtitle']),
        col_left: pickTemplateBlockValue(block, ['col_left']),
        col_right: pickTemplateBlockValue(block, ['col_right']),
        row_top: pickTemplateBlockValue(block, ['row_top']),
        row_bottom: pickTemplateBlockValue(block, ['row_bottom']),
        case_1: normalizeVerdictLead(pickTemplateBlockValue(block, ['case_1', 'case1'])),
        case_2: normalizeVerdictLead(pickTemplateBlockValue(block, ['case_2', 'case2'])),
        case_3: normalizeVerdictLead(pickTemplateBlockValue(block, ['case_3', 'case3'])),
        case_4: normalizeVerdictLead(pickTemplateBlockValue(block, ['case_4', 'case4'])),
      }
    case 'parameter-comparison':
      return {
        left_header: pickTemplateBlockValue(block, ['left_header']),
        right_header: pickTemplateBlockValue(block, ['right_header']),
        draw_favorite: pickTemplateBlockValue(block, ['draw_favorite', 'draw_favorite_label', 'favorite_draw']),
      }
    case 'interpretation':
      {
        const rawBody = pickTemplateBlockValue(block, ['body']) || [
          pickTemplateBlockValue(block, ['line_1', 'line1']),
          pickTemplateBlockValue(block, ['line_2', 'line2']),
          pickTemplateBlockValue(block, ['line_3', 'line3']),
        ].filter(Boolean).join(' ')
        const explicitWinner = pickTemplateBlockValue(block, ['quote', 'winner', 'answer'])
        const split = explicitWinner ? { winner: '', body: rawBody } : splitLeadingWinnerSentence(rawBody)
        return {
          body: split.body || rawBody,
          winner: trimString(explicitWinner || split.winner).replace(/[.!?]+$/u, ''),
        }
      }
    case 'stat-trap':
      return {
        question: pickTemplateBlockValue(block, ['question', 'trap']),
        body: pickTemplateBlockValue(block, ['body', 'example']),
      }
    case 'battle-dynamics':
      return {
        a_curve: pickTemplateBlockValue(block, ['a_curve', 'curve_a', 'left_curve']),
        b_curve: pickTemplateBlockValue(block, ['b_curve', 'curve_b', 'right_curve']),
      }
    default:
      return block
  }
}

const buildRawTemplateBlocksProjection = (localeBlocks = {}, scansBlocks = {}) => {
  const templateIds = new Set([...Object.keys(localeBlocks), ...Object.keys(scansBlocks)])
  return Object.fromEntries(
    Array.from(templateIds)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((templateId) => [
        templateId,
        normalizeTemplateBlockObject(
          normalizeComparableTemplateBlock(templateId, {
            ...stripManifestOwnedTemplateFields(templateId, localeBlocks?.[templateId] || {}),
            ...stripManifestOwnedTemplateFields(templateId, scansBlocks?.[templateId] || {}),
          }),
        ),
      ])
      .filter(([, block]) => Object.keys(block).length),
  )
}

export const buildCurrentLocaleProjection = (localeJson, scansJson, importer) => {
  const parsed = importer.parseFightJsonFiles(localeJson, scansJson)
  return {
    fighterA: {
      version: trimString(localeJson?.fighterA?.version),
      quote: trimString(localeJson?.fighterA?.dossier?.quote),
    },
    fighterB: {
      version: trimString(localeJson?.fighterB?.version),
      quote: trimString(localeJson?.fighterB?.dossier?.quote),
    },
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
    fighterA: {
      version: pickTemplateBlockValue(localeTemplateBlocks?.['character-dossier-a'], ['world']),
      quote: pickTemplateBlockValue(localeTemplateBlocks?.['character-dossier-a'], ['quote']),
    },
    fighterB: {
      version: pickTemplateBlockValue(localeTemplateBlocks?.['character-dossier-b'], ['world']),
      quote: pickTemplateBlockValue(localeTemplateBlocks?.['character-dossier-b'], ['quote']),
    },
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

  pushIfDifferent('fighterA', baseline.fighterA, current.fighterA)
  pushIfDifferent('fighterB', baseline.fighterB, current.fighterB)
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
  fighterA: projection.fighterA,
  fighterB: projection.fighterB,
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
