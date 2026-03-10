import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

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
