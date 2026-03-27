import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import crypto from 'node:crypto'

const ROOT = process.cwd()
const V2_SCSS_DIR = path.join(ROOT, 'src', 'features', 'vs', 'templates', 'v2')

const RULE_START_RE = /^\s*(\.[^{]+)\{\s*$/

const stripComments = (value) => value.replace(/\/\*[\s\S]*?\*\//g, '')
const normalizeCss = (value) => stripComments(value).replace(/\s+/g, ' ').trim()

const walkScssFiles = (dir, out = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkScssFiles(fullPath, out)
      continue
    }
    if (entry.isFile() && fullPath.endsWith('.scss')) {
      out.push(fullPath)
    }
  }
  return out
}

const collectRules = (filePath) => {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  const rules = new Map()

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(RULE_START_RE)
    if (!match) continue

    const selector = match[1].trim()
    let depth = 0
    let seenStart = false
    const block = []

    for (let j = i; j < lines.length; j += 1) {
      const line = lines[j]
      for (const ch of line) {
        if (ch === '{') {
          depth += 1
          seenStart = true
        } else if (ch === '}') {
          depth -= 1
        }
      }
      block.push(line)
      if (seenStart && depth === 0) {
        i = j
        break
      }
    }

    if (!rules.has(selector)) rules.set(selector, [])
    rules.get(selector).push(normalizeCss(block.join('\n')))
  }

  return rules
}

const isTemplateLocalSelector = (selector) => selector.startsWith('.vs-template--')

const main = () => {
  const files = walkScssFiles(V2_SCSS_DIR)
  const selectorMap = new Map()

  for (const filePath of files) {
    const rules = collectRules(filePath)
    for (const [selector, blocks] of rules.entries()) {
      if (isTemplateLocalSelector(selector)) continue
      const finalRule = blocks.join(' || ')
      if (!selectorMap.has(selector)) selectorMap.set(selector, [])
      selectorMap.get(selector).push({ filePath, finalRule })
    }
  }

  const issues = []

  for (const [selector, entries] of selectorMap.entries()) {
    if (entries.length < 2) continue

    const uniqueRules = new Map()
    for (const entry of entries) {
      const hash = crypto.createHash('md5').update(entry.finalRule).digest('hex').slice(0, 8)
      if (!uniqueRules.has(hash)) uniqueRules.set(hash, [])
      uniqueRules.get(hash).push(path.relative(ROOT, entry.filePath).replace(/\\/g, '/'))
    }

    if (uniqueRules.size > 1) {
      issues.push({ selector, variants: uniqueRules })
    }
  }

  if (!issues.length) {
    console.log(`[v2-style-guard] OK: ${files.length} SCSS files, shared selectors are consistent.`)
    process.exit(0)
  }

  console.error(`[v2-style-guard] FAIL: found ${issues.length} shared selectors with conflicting definitions.`)
  for (const issue of issues) {
    console.error(`\nSelector: ${issue.selector}`)
    for (const [hash, variantFiles] of issue.variants.entries()) {
      console.error(`  variant ${hash}:`)
      for (const filePath of variantFiles) {
        console.error(`    - ${filePath}`)
      }
    }
  }
  process.exit(1)
}

main()
