import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const templatesRoot = path.join(repoRoot, 'Templates')
const typesPath = path.join(repoRoot, 'src/features/vs/types.ts')

const errors = []

const typesSource = readFileSync(typesPath, 'utf8')
const templateIdSectionMatch = typesSource.match(
  /export type TemplateId =([\s\S]*?)\n\nexport type TemplatePreset/,
)

if (!templateIdSectionMatch) {
  throw new Error('Cannot read TemplateId union from src/features/vs/types.ts')
}

const templateIds = [...templateIdSectionMatch[1].matchAll(/\|\s'([^']+)'/g)].map((match) => match[1]).sort()
const templateIdSet = new Set(templateIds)
const locales = ['pl', 'en']

const templateDirs = readdirSync(templatesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

const unexpectedDirs = templateDirs.filter((dir) => !templateIdSet.has(dir))
const missingDirs = templateIds.filter((templateId) => !templateDirs.includes(templateId))

if (unexpectedDirs.length) {
  errors.push(`Unexpected template folders: ${unexpectedDirs.join(', ')}`)
}

if (missingDirs.length) {
  errors.push(`Missing template folders: ${missingDirs.join(', ')}`)
}

const compareKeySets = (label, leftKeys, rightKeys) => {
  const leftOnly = leftKeys.filter((key) => !rightKeys.includes(key))
  const rightOnly = rightKeys.filter((key) => !leftKeys.includes(key))
  if (leftOnly.length) {
    errors.push(`${label} has keys only in PL: ${leftOnly.join(', ')}`)
  }
  if (rightOnly.length) {
    errors.push(`${label} has keys only in EN: ${rightOnly.join(', ')}`)
  }
}

const normalizeJson = (value) => JSON.stringify(value, null, 2)

let canonicalChromeKeys = null
let canonicalCommonKeys = null
let canonicalCategoryIds = null

for (const templateId of templateIds) {
  const parsedByLocale = {}

  for (const locale of locales) {
    const filePath = path.join(templatesRoot, templateId, `Template ${locale.toUpperCase()}.json`)
    if (!statSync(filePath, { throwIfNoEntry: false })?.isFile()) {
      errors.push(`Missing template locale file: ${path.relative(repoRoot, filePath)}`)
      continue
    }

    const parsed = JSON.parse(readFileSync(filePath, 'utf8'))
    parsedByLocale[locale] = parsed

    if (parsed.id !== templateId) {
      errors.push(`${path.relative(repoRoot, filePath)} has mismatched id: ${parsed.id}`)
    }

    if (parsed.locale !== locale) {
      errors.push(`${path.relative(repoRoot, filePath)} has mismatched locale: ${parsed.locale}`)
    }
  }

  if (!parsedByLocale.pl || !parsedByLocale.en) continue

  compareKeySets(
    `${templateId}.metadata`,
    Object.keys(parsedByLocale.pl.metadata || {}),
    Object.keys(parsedByLocale.en.metadata || {}),
  )
  compareKeySets(
    `${templateId}.chrome`,
    Object.keys(parsedByLocale.pl.chrome || {}),
    Object.keys(parsedByLocale.en.chrome || {}),
  )
  compareKeySets(
    `${templateId}.common`,
    Object.keys(parsedByLocale.pl.common || {}),
    Object.keys(parsedByLocale.en.common || {}),
  )
  compareKeySets(
    `${templateId}.staticFields`,
    Object.keys(parsedByLocale.pl.staticFields || {}),
    Object.keys(parsedByLocale.en.staticFields || {}),
  )
  compareKeySets(
    `${templateId}.layout`,
    Object.keys(parsedByLocale.pl.layout || {}),
    Object.keys(parsedByLocale.en.layout || {}),
  )
  compareKeySets(
    `${templateId}.slots`,
    Object.keys(parsedByLocale.pl.slots || {}),
    Object.keys(parsedByLocale.en.slots || {}),
  )

  const categoryIdsPl = Array.isArray(parsedByLocale.pl.categories)
    ? parsedByLocale.pl.categories.map((entry) => entry.id)
    : []
  const categoryIdsEn = Array.isArray(parsedByLocale.en.categories)
    ? parsedByLocale.en.categories.map((entry) => entry.id)
    : []

  if (JSON.stringify(categoryIdsPl) !== JSON.stringify(categoryIdsEn)) {
    errors.push(`${templateId}.categories use different ids/order between PL and EN`)
  }

  if (!canonicalChromeKeys) canonicalChromeKeys = Object.keys(parsedByLocale.pl.chrome || {}).sort()
  if (!canonicalCommonKeys) canonicalCommonKeys = Object.keys(parsedByLocale.pl.common || {}).sort()
  if (!canonicalCategoryIds) canonicalCategoryIds = categoryIdsPl

  if (JSON.stringify(Object.keys(parsedByLocale.pl.chrome || {}).sort()) !== JSON.stringify(canonicalChromeKeys)) {
    errors.push(`${templateId}.chrome differs from canonical chrome key set`)
  }
  if (JSON.stringify(Object.keys(parsedByLocale.pl.common || {}).sort()) !== JSON.stringify(canonicalCommonKeys)) {
    errors.push(`${templateId}.common differs from canonical common key set`)
  }
  if (JSON.stringify(categoryIdsPl) !== JSON.stringify(canonicalCategoryIds)) {
    errors.push(`${templateId}.categories differ from canonical category order`)
  }

  if (normalizeJson(parsedByLocale.pl.layout || {}) !== normalizeJson(parsedByLocale.en.layout || {})) {
    errors.push(`${templateId}.layout differs between PL and EN`)
  }
  if (normalizeJson(parsedByLocale.pl.slots || {}) !== normalizeJson(parsedByLocale.en.slots || {})) {
    errors.push(`${templateId}.slots differ between PL and EN`)
  }
}

if (errors.length) {
  console.error('[templates:guard] FAIL:')
  errors.forEach((error) => console.error(`- ${error}`))
  process.exitCode = 1
} else {
  console.log(`[templates:guard] OK: ${templateIds.length} template folders with PL/EN definitions.`)
}
