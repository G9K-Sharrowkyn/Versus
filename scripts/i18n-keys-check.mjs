import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import ts from 'typescript'

const PROJECT_ROOT = process.cwd()
const moduleCache = new Map()
const nodeRequire = createRequire(import.meta.url)

const resolveLocalModulePathSync = (fromFilePath, specifier) => {
  const basePath = path.resolve(path.dirname(fromFilePath), specifier)
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.mjs'),
  ]

  for (const candidate of candidates) {
    if (fsSync.existsSync(candidate)) {
      return candidate
    }
  }

  throw new Error(`Cannot resolve module "${specifier}" from ${fromFilePath}`)
}

const loadTsModuleSync = (filePath) => {
  const normalizedPath = path.resolve(filePath)
  if (moduleCache.has(normalizedPath)) {
    return moduleCache.get(normalizedPath)
  }

  const source = fsSync.readFileSync(normalizedPath, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: path.basename(normalizedPath),
  })

  const module = { exports: {} }
  moduleCache.set(normalizedPath, module.exports)

  const localRequire = (specifier) => {
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
      return nodeRequire(specifier)
    }

    const resolved = resolveLocalModulePathSync(normalizedPath, specifier)
    return loadTsModuleSync(resolved)
  }

  const factory = new Function('module', 'exports', 'require', transpiled.outputText)
  factory(module, module.exports, localRequire)
  moduleCache.set(normalizedPath, module.exports)
  return module.exports
}

const loadTsObject = async (filePath, exportName) => {
  const exportsObject = loadTsModuleSync(filePath)
  if (!(exportName in exportsObject)) {
    throw new Error(`Missing export "${exportName}" in ${filePath}`)
  }
  return exportsObject[exportName]
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
