import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  BASELINE_REF,
  CANONICAL_STAT_KEYS,
  REPO_ROOT,
  buildBaselineLocaleProjection,
  buildCurrentLocaleProjection,
  buildDossierFromFacts,
  buildProfileFromFacts,
  diffSemanticProjection,
  listFightFolders,
  loadCurrentImporter,
  loadHistoricalImporter,
  parseRawKeyValueBlock,
  readFightJsonSet,
  resolveTemplateId,
  trimStringArray,
} from './lib/fight-semantic-tools.mjs'

const SHOULD_WRITE = process.argv.includes('--write')

const currentImporter = loadCurrentImporter()
const historicalImporter = loadHistoricalImporter(BASELINE_REF)

const sortObject = (value) => {
  if (Array.isArray(value)) return value.map((entry) => sortObject(entry))
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([key, entry]) => [key, sortObject(entry)]),
  )
}

const toJson = (value) => `${JSON.stringify(sortObject(value), null, 2)}\n`

const buildTemplateBlockMap = (blocks, importer) => {
  const output = {}
  for (const [heading, lines] of Object.entries(blocks)) {
    const templateId = resolveTemplateId(heading, importer)
    if (!templateId) continue
    const fieldMap = parseRawKeyValueBlock(lines)
    if (!Object.keys(fieldMap).length) continue
    output[templateId] = fieldMap
  }
  return output
}

const pickPortraits = (scansBlocks) => {
  for (const [heading, lines] of Object.entries(scansBlocks)) {
    if (heading.toLowerCase() !== 'portraits') continue
    const fields = parseRawKeyValueBlock(lines)
    return {
      a: fields.portrait_a?.trim() || '',
      b: fields.portrait_b?.trim() || '',
    }
  }
  return { a: '', b: '' }
}

const patchStats = (currentStats, baselineStats) => {
  const next = { ...(currentStats || {}) }
  for (const key of CANONICAL_STAT_KEYS) {
    next[key] = baselineStats[key] ?? null
  }
  return next
}

const patchLocaleJson = (currentLocaleJson, baselineProjection, localeTemplateBlocks) => {
  const next = structuredClone(currentLocaleJson)
  next.fighterA.stats = patchStats(currentLocaleJson?.fighterA?.stats, baselineProjection.statsA)
  next.fighterB.stats = patchStats(currentLocaleJson?.fighterB?.stats, baselineProjection.statsB)
  next.fighterA.dossier = {
    ...(currentLocaleJson?.fighterA?.dossier || {}),
    ...buildDossierFromFacts(baselineProjection.factsA),
  }
  next.fighterB.dossier = {
    ...(currentLocaleJson?.fighterB?.dossier || {}),
    ...buildDossierFromFacts(baselineProjection.factsB),
  }
  next.fighterA.profile = buildProfileFromFacts(baselineProjection.powersA)
  next.fighterB.profile = buildProfileFromFacts(baselineProjection.powersB)
  next.fighterA.crucialFeats = trimStringArray(baselineProjection.crucialFeatsA)
  next.fighterB.crucialFeats = trimStringArray(baselineProjection.crucialFeatsB)
  next.fighterA.victories = trimStringArray(baselineProjection.winsA)
  next.fighterB.victories = trimStringArray(baselineProjection.winsB)
  next.templateOrder = Array.isArray(baselineProjection.templateOrder)
    ? baselineProjection.templateOrder.slice()
    : currentLocaleJson.templateOrder
  next.templates = localeTemplateBlocks
  return next
}

const patchScansJson = (currentScansJson, baselineProjection, scansTemplateBlocks) => {
  const next = structuredClone(currentScansJson)
  next.portraits = {
    a: baselineProjection.portraits.a || currentScansJson?.portraits?.a || '',
    b: baselineProjection.portraits.b || currentScansJson?.portraits?.b || '',
  }
  next.templates = scansTemplateBlocks
  return next
}

const folders = listFightFolders()
const report = []
const errors = []

for (const folderName of folders) {
  const currentSet = readFightJsonSet(folderName)
  const baselineEn = buildBaselineLocaleProjection(folderName, 'en', historicalImporter, currentImporter, BASELINE_REF)
  const baselinePl = buildBaselineLocaleProjection(folderName, 'pl', historicalImporter, currentImporter, BASELINE_REF)

  const currentEn = buildCurrentLocaleProjection(currentSet.en, currentSet.scans, currentImporter)
  const currentPl = buildCurrentLocaleProjection(currentSet.pl, currentSet.scans, currentImporter)

  let nextEn = currentSet.en
  let nextPl = currentSet.pl
  let nextScans = currentSet.scans

  const baselineEnLocaleBlocks = buildTemplateBlockMap(baselineEn.localeBlocks, currentImporter)
  const baselinePlLocaleBlocks = buildTemplateBlockMap(baselinePl.localeBlocks, currentImporter)
  const baselineScansBlocks = buildTemplateBlockMap(baselineEn.scansBlocks, currentImporter)
  const baselinePortraits = pickPortraits(baselineEn.scansBlocks)

  const initialEnDiffs = diffSemanticProjection(baselineEn, currentEn)
  const initialPlDiffs = diffSemanticProjection(baselinePl, currentPl)

  if (SHOULD_WRITE && (initialEnDiffs.length || initialPlDiffs.length)) {
    nextEn = patchLocaleJson(currentSet.en, { ...baselineEn, portraits: baselinePortraits }, baselineEnLocaleBlocks)
    nextPl = patchLocaleJson(currentSet.pl, { ...baselinePl, portraits: baselinePortraits }, baselinePlLocaleBlocks)
    nextScans = patchScansJson(currentSet.scans, { ...baselineEn, portraits: baselinePortraits }, baselineScansBlocks)

    writeFileSync(currentSet.enPath, toJson(nextEn), 'utf8')
    writeFileSync(currentSet.plPath, toJson(nextPl), 'utf8')
    writeFileSync(currentSet.scansPath, toJson(nextScans), 'utf8')
  }

  const verifiedEn = buildCurrentLocaleProjection(nextEn, nextScans, currentImporter)
  const verifiedPl = buildCurrentLocaleProjection(nextPl, nextScans, currentImporter)
  const finalEnDiffs = diffSemanticProjection(baselineEn, verifiedEn)
  const finalPlDiffs = diffSemanticProjection(baselinePl, verifiedPl)

  if (finalEnDiffs.length) {
    errors.push(`[${folderName}] EN still differs from ${BASELINE_REF}: ${finalEnDiffs.join(', ')}`)
  }
  if (finalPlDiffs.length) {
    errors.push(`[${folderName}] PL still differs from ${BASELINE_REF}: ${finalPlDiffs.join(', ')}`)
  }

  if (initialEnDiffs.length || initialPlDiffs.length) {
    report.push({
      folder: folderName,
      en: initialEnDiffs,
      pl: initialPlDiffs,
      written: SHOULD_WRITE && (!finalEnDiffs.length || !finalPlDiffs.length),
    })
  }
}

if (report.length) {
  console.log(JSON.stringify(report, null, 2))
}

if (errors.length) {
  console.error('\nFight JSON migration audit failed:\n')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log(
  SHOULD_WRITE
    ? `Fight JSON migration restore passed for ${folders.length} folders against ${BASELINE_REF}.`
    : `Fight JSON migration audit passed for ${folders.length} folders against ${BASELINE_REF}.`,
)
