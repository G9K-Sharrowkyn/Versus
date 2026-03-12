import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  FIGHTER_DERIVED_TEMPLATE_FIELD_PREFIXES,
  MANIFEST_DEFAULT_TEMPLATE_FIELDS,
  MANIFEST_OWNED_TEMPLATE_FIELDS,
} from './lib/fight-semantic-tools.mjs'

const repoRoot = process.cwd()
const fightsRoot = path.join(repoRoot, 'Fights')
const allowedBridgeFiles = new Set([
  path.normalize('src/features/vs/types.ts'),
  path.normalize('src/features/vs/importer.ts'),
  path.normalize('vite.config.ts'),
  path.normalize('scripts/guard-fight-json-integrity.mjs'),
])
const allowedParsedPayloadFiles = new Set([
  path.normalize('src/features/vs/types.ts'),
  path.normalize('src/features/vs/importer.ts'),
  path.normalize('src/features/vs/helpers.ts'),
  path.normalize('src/features/vs/presets.ts'),
  path.normalize('src/features/vs/storage.ts'),
  path.normalize('vite.config.ts'),
  path.normalize('scripts/guard-fight-json-integrity.mjs'),
])

const errors = []
const REQUIRED_STAT_KEYS = ['strength', 'speed', 'durability', 'battleIq', 'hax', 'stamina', 'style', 'experience', 'skills']
const toCamelCase = (value) =>
  value.replace(/[_-]([a-z0-9])/gi, (_, char) => char.toUpperCase())
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
const REQUIRED_TEMPLATE_FIELDS = {
  'battle-dynamics': ['a_curve', 'b_curve', 'yellow_wave', 'phase_1', 'phase_2', 'phase_3', 'analysis'],
  'x-factor': ['factor', 'a_value', 'a_bonus', 'a_bonus_label', 'b_value', 'b_bonus', 'regen', 'mechanics', 'implication', 'psychology'],
  'stat-trap': ['trap_top', 'trap_bottom', 'example', 'question'],
  'fight-simulation': [
    'opening',
    'mid_fight',
    'late_fight',
    'end_condition',
    'phase_1_title',
    'phase_1_animation',
    'phase_1_event',
    'phase_1_a_label',
    'phase_1_a_value',
    'phase_1_b_label',
    'phase_1_b_value',
    'phase_2_title',
    'phase_2_animation',
    'phase_2_event',
    'phase_2_branch_a',
    'phase_2_branch_b',
    'phase_3_title',
    'phase_3_actor',
    'phase_3_animation',
    'phase_3_event',
    'phase_3_branch_a',
    'phase_3_branch_b',
  ],
  'verdict-matrix': ['case_1', 'case_2', 'case_3', 'case_4'],
}
const LEGACY_TEMPLATE_FIELDS = {
  'x-factor': ['left_case', 'right_case', 'left_title', 'right_title', 'left_body', 'right_body'],
  'fight-simulation': [
    'phase_1_anim',
    'phase_2_anim',
    'phase_3_anim',
    'phase_1_desc',
    'phase_2_desc',
    'phase_3_desc',
    'phase_1_body',
    'phase_2_body',
    'phase_3_body',
  ],
  interpretation: ['body', 'winner', 'question', 'answer'],
  'stat-trap': ['body'],
  'battle-dynamics': [
    'left_curve',
    'right_curve',
    'left_note',
    'right_note',
    'left_curve_body',
    'right_curve_body',
    'left_curve_label',
    'right_curve_label',
    'notes',
  ],
  'parameter-comparison': [
    'left_avg',
    'left_avg_round',
    'right_avg',
    'right_avg_round',
    'left_average',
    'right_average',
    'left_notes',
    'right_notes',
    'left_summary',
    'right_summary',
    'draw_notes',
    'draw_summary',
    'favorite',
  ],
}
const VERDICT_CASE_BODY_RE = /[.!?]\s+\S/u
const STAT_TRAP_QUESTION_PREFIX_RE = /^(kluczowe pytanie|key question)\s*:/i
const X_FACTOR_HEADLINE_RE = /\sVS\s/i
const requiredTemplateBlockSet = new Set(Object.keys(REQUIRED_TEMPLATE_FIELDS))

const templateFieldCandidates = (key) => [key, toCamelCase(key)]
const hasTemplateField = (block, key) => templateFieldCandidates(key).some((candidate) => candidate in (block || {}))
const presentTemplateFields = (block, keys) =>
  keys.filter((key) => templateFieldCandidates(key).some((candidate) => candidate in (block || {})))

const validateLocaleTemplateBlocks = (dirName, fileName, parsed) => {
  const templateOrder = Array.isArray(parsed?.templateOrder) ? parsed.templateOrder : []
  const templates = parsed?.templates || {}

  for (const [templateId, block] of Object.entries(templates)) {
    const disallowedKeys = manifestOwnedFieldSet[templateId]
    const defaultFieldMap = manifestDefaultFieldMap[templateId]
    if ((!disallowedKeys && !fighterDerivedFieldPrefixes[templateId]) || !block || typeof block !== 'object' || Array.isArray(block)) continue
    const present = Object.keys(block).filter((key) => disallowedKeys?.has(key))
    if (present.length) {
      errors.push(
        `[${dirName}] ${fileName} contains manifest-owned fields in ${templateId}: ${present.join(', ')}.`,
      )
    }
    const prefixed = Object.keys(block).filter((key) =>
      fighterDerivedFieldPrefixes[templateId]?.some((prefix) => key.startsWith(prefix)),
    )
    if (prefixed.length) {
      errors.push(
        `[${dirName}] ${fileName} contains fighter-derived duplicate fields in ${templateId}: ${prefixed.join(', ')}.`,
      )
    }
    if (defaultFieldMap) {
      const redundantDefaults = Object.entries(block)
        .filter(([key, value]) => defaultFieldMap.get(key) !== undefined && JSON.stringify(value) === JSON.stringify(defaultFieldMap.get(key)))
        .map(([key]) => key)
      if (redundantDefaults.length) {
        errors.push(
          `[${dirName}] ${fileName} contains redundant default-valued fields in ${templateId}: ${redundantDefaults.join(', ')}.`,
        )
      }
    }
  }

  for (const [templateId, legacyKeys] of Object.entries(LEGACY_TEMPLATE_FIELDS)) {
    if (!templateOrder.includes(templateId)) continue
    const block = templates?.[templateId]
    if (!block || typeof block !== 'object' || Array.isArray(block)) {
      if (requiredTemplateBlockSet.has(templateId)) {
        errors.push(`[${dirName}] ${fileName} is missing template block ${templateId}.`)
      }
      continue
    }
    const presentLegacy = presentTemplateFields(block, legacyKeys)
    if (presentLegacy.length) {
      errors.push(`[${dirName}] ${fileName} contains legacy fields in ${templateId}: ${presentLegacy.join(', ')}.`)
    }
  }

  for (const [templateId, requiredKeys] of Object.entries(REQUIRED_TEMPLATE_FIELDS)) {
    if (!templateOrder.includes(templateId)) continue
    const block = templates?.[templateId]
    if (!block || typeof block !== 'object' || Array.isArray(block)) {
      errors.push(`[${dirName}] ${fileName} is missing template block ${templateId}.`)
      continue
    }
    const missing = requiredKeys.filter((key) => !hasTemplateField(block, key))
    if (missing.length) {
      errors.push(`[${dirName}] ${fileName} is missing required fields in ${templateId}: ${missing.join(', ')}.`)
    }
    if (templateId === 'verdict-matrix') {
      for (const key of ['case_1', 'case_2', 'case_3', 'case_4']) {
        const value = templateFieldCandidates(key).map((candidate) => block?.[candidate]).find((entry) => typeof entry === 'string') || ''
        if (typeof value !== 'string' || !VERDICT_CASE_BODY_RE.test(value.trim())) {
          errors.push(`[${dirName}] ${fileName} requires descriptive ${key} text in verdict-matrix, not only a short winner label.`)
        }
      }
    }
    if (templateId === 'x-factor') {
      const factorValue =
        templateFieldCandidates('factor').map((candidate) => block?.[candidate]).find((entry) => typeof entry === 'string') || ''
      if (typeof factorValue !== 'string' || !X_FACTOR_HEADLINE_RE.test(factorValue.trim())) {
        errors.push(`[${dirName}] ${fileName} requires an x-factor headline in the "A VS B" format.`)
      }
    }
    if (templateId === 'stat-trap') {
      const questionValue =
        templateFieldCandidates('question').map((candidate) => block?.[candidate]).find((entry) => typeof entry === 'string') || ''
      const trapTopValue =
        templateFieldCandidates('trap_top').map((candidate) => block?.[candidate]).find((entry) => typeof entry === 'string') || ''
      if (typeof questionValue === 'string' && STAT_TRAP_QUESTION_PREFIX_RE.test(questionValue.trim())) {
        errors.push(`[${dirName}] ${fileName} must keep the stat-trap question body without the "Key question" prefix.`)
      }
      if (typeof trapTopValue !== 'string' || !trapTopValue.includes('>')) {
        errors.push(`[${dirName}] ${fileName} requires a stat-trap top line in the "A >" format.`)
      }
    }
  }
}

const walk = (root, callback) => {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const nextPath = path.join(root, entry.name)
    if (entry.isDirectory()) {
      walk(nextPath, callback)
      continue
    }
    callback(nextPath)
  }
}

const relativePath = (targetPath) => path.relative(repoRoot, targetPath)

const numberedFightDirs = readdirSync(fightsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^\d+\s/.test(entry.name))
  .map((entry) => path.join(fightsRoot, entry.name))

for (const dir of numberedFightDirs) {
  const dirName = path.basename(dir)
  const files = readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => entry.name)

  const enFiles = files.filter((file) => / EN\.json$/i.test(file))
  const plFiles = files.filter((file) => / PL\.json$/i.test(file))
  const scansFiles = files.filter((file) => / Scans\.json$/i.test(file))
  const txtFiles = files.filter((file) => /\.txt$/i.test(file))

  if (enFiles.length !== 1) {
    errors.push(`[${dirName}] Expected exactly 1 EN.json file, found ${enFiles.length}.`)
  }
  if (plFiles.length !== 1) {
    errors.push(`[${dirName}] Expected exactly 1 PL.json file, found ${plFiles.length}.`)
  }
  if (scansFiles.length !== 1) {
    errors.push(`[${dirName}] Expected exactly 1 Scans.json file, found ${scansFiles.length}.`)
  }
  if (txtFiles.length) {
    errors.push(`[${dirName}] Legacy .txt fight files are not allowed: ${txtFiles.join(', ')}.`)
  }

  for (const fileName of [...enFiles, ...plFiles, ...scansFiles]) {
    const filePath = path.join(dir, fileName)
    try {
      const parsed = JSON.parse(readFileSync(filePath, 'utf8'))
      if (/ EN\.json$/i.test(fileName)) {
        if (parsed?.schemaVersion !== 1 || parsed?.locale !== 'en') {
          errors.push(`[${dirName}] ${fileName} must have schemaVersion=1 and locale="en".`)
        }
        for (const fighterKey of ['fighterA', 'fighterB']) {
          const stats = parsed?.[fighterKey]?.stats
          const missingKeys = REQUIRED_STAT_KEYS.filter((key) => !(key in (stats || {})))
          if (missingKeys.length) {
            errors.push(`[${dirName}] ${fileName} is missing stat keys for ${fighterKey}: ${missingKeys.join(', ')}.`)
          }
        }
        validateLocaleTemplateBlocks(dirName, fileName, parsed)
      } else if (/ PL\.json$/i.test(fileName)) {
        if (parsed?.schemaVersion !== 1 || parsed?.locale !== 'pl') {
          errors.push(`[${dirName}] ${fileName} must have schemaVersion=1 and locale="pl".`)
        }
        for (const fighterKey of ['fighterA', 'fighterB']) {
          const stats = parsed?.[fighterKey]?.stats
          const missingKeys = REQUIRED_STAT_KEYS.filter((key) => !(key in (stats || {})))
          if (missingKeys.length) {
            errors.push(`[${dirName}] ${fileName} is missing stat keys for ${fighterKey}: ${missingKeys.join(', ')}.`)
          }
        }
        validateLocaleTemplateBlocks(dirName, fileName, parsed)
      } else if (/ Scans\.json$/i.test(fileName)) {
        if (parsed?.schemaVersion !== 1) {
          errors.push(`[${dirName}] ${fileName} must have schemaVersion=1.`)
        }
      }
    } catch (error) {
      errors.push(`[${dirName}] Failed to parse ${fileName}: ${String(error)}`)
    }
  }
}

const sourceFiles = []
for (const entry of ['src', 'scripts']) {
  const absolute = path.join(repoRoot, entry)
  if (statSync(absolute, { throwIfNoEntry: false })?.isDirectory()) {
    walk(absolute, (filePath) => {
      if (/\.(ts|tsx|js|mjs)$/.test(filePath)) {
        sourceFiles.push(filePath)
      }
    })
  }
}
sourceFiles.push(path.join(repoRoot, 'vite.config.ts'))

for (const filePath of sourceFiles) {
  const content = readFileSync(filePath, 'utf8')
  const hasParsedPayload = content.includes('ParsedVsImport')
  const hasCanonicalJson = content.includes('FightLocaleJsonV1') || content.includes('FightScansJsonV1')
  const rel = path.normalize(relativePath(filePath))

  if (hasParsedPayload && !allowedParsedPayloadFiles.has(rel)) {
    errors.push(
      `[${rel}] uses ParsedVsImport outside the approved render-only/runtime files. Do not use the lossy payload in scripts, migration code, or canonical fight JSON writers.`,
    )
  }

  if (!hasParsedPayload || !hasCanonicalJson) continue

  if (!allowedBridgeFiles.has(rel)) {
    errors.push(
      `[${rel}] mixes ParsedVsImport with canonical fight JSON types. This bridge is only allowed in importer/types/vite config.`,
    )
  }
}

if (errors.length) {
  console.error('Fight JSON guard failed:\n')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log(`Fight JSON guard passed for ${numberedFightDirs.length} fight folders.`)
