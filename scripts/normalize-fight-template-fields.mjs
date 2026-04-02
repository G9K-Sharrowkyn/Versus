import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  FIGHTS_ROOT,
  MANIFEST_DEFAULT_TEMPLATE_FIELDS,
  MANIFEST_OWNED_TEMPLATE_FIELDS,
  loadCurrentFightManifest,
  normalizeToken,
  stripBom,
} from './lib/fight-semantic-tools.mjs'

const toCamelCase = (value) =>
  value.replace(/[_-]([a-z0-9])/gi, (_, char) => char.toUpperCase())

const TEMPLATE_FIELD_INDEX_MARKER = 'vsindexmarker'
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const normalizeTemplateFieldSeed = (value) =>
  normalizeToken(String(value || '').replace(/<N>/gi, TEMPLATE_FIELD_INDEX_MARKER))

const buildTemplateFieldPattern = (value) => {
  const normalized = normalizeTemplateFieldSeed(value)
  if (!normalized) return null
  const pattern = escapeRegex(normalized).replace(TEMPLATE_FIELD_INDEX_MARKER, '(\\d+)')
  return new RegExp(`^${pattern}$`)
}

const splitScenarioPrefix = (normalizedKey) => {
  const match = normalizedKey.match(/^s(\d+)(.+)$/)
  if (!match) return null
  const [, scenarioIndex, body] = match
  if (!body) return null
  return {
    prefix: `s${scenarioIndex}_`,
    body,
  }
}

const manifest = loadCurrentFightManifest()
const variableMatchers = Object.fromEntries(
  manifest.templates.map((template) => [
    template.id,
    (template.variableFields || []).map((entry) => {
      const seeds = Array.from(
        new Set([
          entry.key,
          entry.jsonKey || '',
          ...(entry.aliases || []),
        ].filter(Boolean)),
      )
      return {
        key: entry.key,
        allowScenarioPrefix: Boolean(entry.allowScenarioPrefix),
        patterns: seeds
          .map((seed) => buildTemplateFieldPattern(seed))
          .filter((pattern) => Boolean(pattern)),
      }
    }),
  ]),
)

const manifestOwnedFieldSet = Object.fromEntries(
  Object.entries(MANIFEST_OWNED_TEMPLATE_FIELDS).map(([templateId, keys]) => [
    templateId,
    new Set(keys.flatMap((key) => [key, toCamelCase(key)])),
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

const resolveTemplateSchemaField = (templateId, jsonKey) => {
  const normalizedKey = normalizeToken(jsonKey)
  if (!normalizedKey) return null
  const matchers = variableMatchers[templateId] || []
  for (const matcher of matchers) {
    const tryMatch = (candidate) => {
      for (const pattern of matcher.patterns) {
        const match = candidate.match(pattern)
        if (!match) continue
        const rawIndex = match[1]
        const lineKey = rawIndex
          ? matcher.key.replace(/<N>/gi, rawIndex)
          : matcher.key
        return lineKey
      }
      return null
    }

    const direct = tryMatch(normalizedKey)
    if (direct) return direct
    if (!matcher.allowScenarioPrefix) continue
    const scenarioMatch = splitScenarioPrefix(normalizedKey)
    if (!scenarioMatch) continue
    const scenarioField = tryMatch(scenarioMatch.body)
    if (!scenarioField) continue
    return `${scenarioMatch.prefix}${scenarioField}`
  }
  return null
}

const numberedFightDirs = readdirSync(FIGHTS_ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^\d+\s/.test(entry.name))
  .map((entry) => path.join(FIGHTS_ROOT, entry.name))

let changedFiles = 0

for (const dir of numberedFightDirs) {
  const files = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && / (EN|PL)\.json$/i.test(entry.name))
    .map((entry) => path.join(dir, entry.name))

  for (const filePath of files) {
    const rawText = readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(stripBom(rawText))
    if (!parsed?.templates || typeof parsed.templates !== 'object' || Array.isArray(parsed.templates)) continue

    const normalizedTemplates = {}
    for (const [templateId, block] of Object.entries(parsed.templates)) {
      if (!block || typeof block !== 'object' || Array.isArray(block)) {
        normalizedTemplates[templateId] = block
        continue
      }

      const normalizedBlock = {}
      const disallowedKeys = manifestOwnedFieldSet[templateId] || new Set()
      const defaultFieldMap = manifestDefaultFieldMap[templateId]

      for (const [rawKey, value] of Object.entries(block)) {
        if (disallowedKeys.has(rawKey)) continue

        const canonicalKey = resolveTemplateSchemaField(templateId, rawKey)
        if (!canonicalKey) continue

        if (disallowedKeys.has(canonicalKey) || disallowedKeys.has(toCamelCase(canonicalKey))) continue

        if (defaultFieldMap) {
          const defaultValue = defaultFieldMap.get(canonicalKey) ?? defaultFieldMap.get(toCamelCase(canonicalKey))
          if (defaultValue !== undefined && JSON.stringify(value) === JSON.stringify(defaultValue)) {
            continue
          }
        }

        normalizedBlock[canonicalKey] = value
      }

      normalizedTemplates[templateId] = normalizedBlock
    }

    parsed.templates = normalizedTemplates
    const outputText = `${JSON.stringify(parsed, null, 2)}\n`
    const normalizedInput = `${JSON.stringify(JSON.parse(stripBom(rawText)), null, 2)}\n`
    if (outputText !== normalizedInput) {
      writeFileSync(filePath, outputText, 'utf8')
      changedFiles += 1
    }
  }
}

console.log(`Normalized template fields in ${changedFiles} locale fight JSON files.`)
