import fs from 'node:fs/promises'
import path from 'node:path'

const PROJECT_ROOT = process.cwd()
const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.html', '.md', '.txt', '.json', '.yml', '.yaml'])
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.vite', '.cache'])
const IGNORE_FILES = new Set(['package-lock.json'])

const MOJIBAKE_PATTERN = /[\u00C3\u00C4\u00C5\u0139\u0102\u00C2\u00E2\uFFFD]/g
const UTF8_BOM = '\uFEFF'

const shouldIgnorePath = (relativePath) => {
  const normalized = relativePath.replaceAll('\\', '/')
  if (!normalized || normalized.startsWith('.git/')) return true
  const segments = normalized.split('/')
  if (segments.some((segment) => IGNORE_DIRS.has(segment))) return true
  const baseName = segments[segments.length - 1] || ''
  if (IGNORE_FILES.has(baseName)) return true
  return false
}

const walk = async (directory, baseDirectory, output) => {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name)
    const relativePath = path.relative(baseDirectory, absolutePath)
    if (shouldIgnorePath(relativePath)) continue

    if (entry.isDirectory()) {
      await walk(absolutePath, baseDirectory, output)
      continue
    }

    if (!entry.isFile()) continue
    if (!TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue
    output.push({ absolutePath, relativePath: relativePath.replaceAll('\\', '/') })
  }
}

const collectLineMatches = (text) => {
  const lineMatches = []
  const lines = text.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (MOJIBAKE_PATTERN.test(line)) {
      lineMatches.push({ lineNumber: index + 1, preview: line.trim().slice(0, 220) })
    }
    MOJIBAKE_PATTERN.lastIndex = 0
  }
  return lineMatches
}

const run = async () => {
  const files = []
  await walk(PROJECT_ROOT, PROJECT_ROOT, files)

  const issues = []
  for (const file of files) {
    const content = await fs.readFile(file.absolutePath, 'utf8')
    const hasBom = content.startsWith(UTF8_BOM)
    const hasMojibake = MOJIBAKE_PATTERN.test(content)
    MOJIBAKE_PATTERN.lastIndex = 0
    if (!hasBom && !hasMojibake) {
      continue
    }
    const matches = collectLineMatches(content)
    issues.push({ file: file.relativePath, hasBom, matches })
  }

  if (!issues.length) {
    console.log('[i18n:audit] OK: no mojibake markers found.')
    return
  }

  console.error(`[i18n:audit] FAIL: found mojibake markers in ${issues.length} file(s).`)
  for (const issue of issues) {
    console.error(`\n- ${issue.file}`)
    if (issue.hasBom) {
      console.error('  BOM: file starts with UTF-8 BOM.')
    }
    for (const match of issue.matches.slice(0, 25)) {
      console.error(`  L${match.lineNumber}: ${match.preview}`)
    }
    if (issue.matches.length > 25) {
      console.error(`  ... and ${issue.matches.length - 25} more lines`)
    }
  }

  process.exitCode = 1
}

run().catch((error) => {
  console.error('[i18n:audit] ERROR:', error)
  process.exitCode = 1
})
