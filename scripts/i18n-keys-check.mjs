import fs from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'

const PROJECT_ROOT = process.cwd()

const loadTsObject = async (filePath, exportName) => {
  const source = await fs.readFile(filePath, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: path.basename(filePath),
  })

  const module = { exports: {} }
  const factory = new Function('module', 'exports', transpiled.outputText)
  factory(module, module.exports)

  if (!(exportName in module.exports)) {
    throw new Error(`Missing export "${exportName}" in ${filePath}`)
  }
  return module.exports[exportName]
}

const flattenKeys = (value, prefix = '') => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : []
  }

  const keys = []
  for (const [rawKey, nestedValue] of Object.entries(value)) {
    const key = prefix ? `${prefix}.${rawKey}` : rawKey
    const nested = flattenKeys(nestedValue, key)
    if (!nested.length) {
      keys.push(key)
    } else {
      keys.push(...nested)
    }
  }
  return keys
}

const run = async () => {
  const enPath = path.join(PROJECT_ROOT, 'src', 'i18n', 'en.ts')
  const plPath = path.join(PROJECT_ROOT, 'src', 'i18n', 'pl.ts')

  const en = await loadTsObject(enPath, 'translationsEn')
  const pl = await loadTsObject(plPath, 'translationsPl')

  const enKeys = new Set(flattenKeys(en).sort())
  const plKeys = new Set(flattenKeys(pl).sort())

  const missingInPl = [...enKeys].filter((key) => !plKeys.has(key))
  const missingInEn = [...plKeys].filter((key) => !enKeys.has(key))

  if (!missingInPl.length && !missingInEn.length) {
    console.log(`[i18n:keys] OK: keysets are aligned (${enKeys.size} keys).`)
    return
  }

  console.error('[i18n:keys] FAIL: translation key mismatch detected.')
  if (missingInPl.length) {
    console.error(`\nMissing in PL (${missingInPl.length}):`)
    missingInPl.forEach((key) => console.error(`- ${key}`))
  }
  if (missingInEn.length) {
    console.error(`\nMissing in EN (${missingInEn.length}):`)
    missingInEn.forEach((key) => console.error(`- ${key}`))
  }
  process.exitCode = 1
}

run().catch((error) => {
  console.error('[i18n:keys] ERROR:', error)
  process.exitCode = 1
})
