import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const roots = [
  path.join(repoRoot, 'src/features/vs/templates/v2'),
  path.join(repoRoot, 'anime'),
]

const findings = []

const rules = [
  {
    id: 'sass-import',
    description: 'Deprecated Sass @import rule',
    test: (line) => /^\s*@import\b/.test(line),
  },
  {
    id: 'global-random',
    description: 'Deprecated global random() usage (use math.random)',
    test: (line) => /(^|[^.\w-])random\s*\(/.test(line),
  },
  {
    id: 'global-percentage',
    description: 'Deprecated global percentage() usage (use math.percentage)',
    test: (line) => /(^|[^.\w-])percentage\s*\(/.test(line),
  },
  {
    id: 'slash-div-steps',
    description: 'Deprecated slash division with $steps (use math.div)',
    test: (line) => /\/\s*\$steps\b/.test(line),
  },
]

const walkScssFiles = (dir) => {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return []
  const entries = readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkScssFiles(fullPath))
      continue
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.scss')) {
      files.push(fullPath)
    }
  }
  return files
}

const scssFiles = roots.flatMap((root) => walkScssFiles(root))

for (const filePath of scssFiles) {
  const source = readFileSync(filePath, 'utf8')
  const lines = source.split(/\r?\n/)
  lines.forEach((line, lineIndex) => {
    rules.forEach((rule) => {
      if (!rule.test(line)) return
      findings.push({
        filePath,
        lineNumber: lineIndex + 1,
        ruleId: rule.id,
        description: rule.description,
        line: line.trim(),
      })
    })
  })
}

if (findings.length) {
  console.error('[sass:guard] FAIL:')
  findings.forEach((entry) => {
    const relativePath = path.relative(repoRoot, entry.filePath)
    console.error(
      `- ${relativePath}:${entry.lineNumber} [${entry.ruleId}] ${entry.description}\n  ${entry.line}`,
    )
  })
  process.exitCode = 1
} else {
  console.log(`[sass:guard] OK: scanned ${scssFiles.length} SCSS files; no deprecated Sass patterns found.`)
}
