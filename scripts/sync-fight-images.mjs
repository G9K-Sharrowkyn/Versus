import { promises as fs } from 'node:fs'
import path from 'node:path'
import { parseFightImageIndex } from './fightImageIndex.js'

const FIGHTS_DIR = path.resolve(process.cwd(), 'Fights')
const IMAGE_FILE_RE = /\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i

const normalizeHtmlEntity = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&#x2F;/gi, '/')
    .replace(/&quot;/g, '"')

const normalizeImageUrl = (value) => {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  return trimmed.replace(/\.gifv(?=($|[?#]))/i, '.jpg')
}

const isImgurAlbumUrl = (value) => {
  try {
    const url = new URL(String(value ?? '').trim())
    return /(^|\.)imgur\.com$/i.test(url.hostname) && (/^\/a\//i.test(url.pathname) || /^\/gallery\//i.test(url.pathname))
  } catch {
    return false
  }
}

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'vs-graphic-studio image sync',
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.text()
}

const resolveImageUrlFromHtml = (html) => {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      return normalizeImageUrl(normalizeHtmlEntity(match[1]))
    }
  }
  return ''
}

const resolveDownloadUrl = async (entry) => {
  if (isImgurAlbumUrl(entry.originalUrl)) return ''
  const preferred = normalizeImageUrl(entry.sourceUrl)
  if (!preferred) return ''
  if (IMAGE_FILE_RE.test(preferred)) return preferred
  const html = await fetchText(preferred)
  return resolveImageUrlFromHtml(html)
}

const downloadImage = async (url, destinationPath) => {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'vs-graphic-studio image sync',
      referer: 'https://imgur.com/',
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  await fs.writeFile(destinationPath, buffer)
  return buffer.length
}

const syncFightFolder = async (fightFolderPath) => {
  const indexPath = path.join(fightFolderPath, 'img', 'index.md')
  try {
    await fs.access(indexPath)
  } catch {
    return { fightName: path.basename(fightFolderPath), downloaded: [], skipped: [] }
  }

  const rawIndex = await fs.readFile(indexPath, 'utf8')
  const uniqueEntries = new Map()
  for (const entry of parseFightImageIndex(rawIndex)) {
    if (!entry.fileName || uniqueEntries.has(entry.fileName)) continue
    uniqueEntries.set(entry.fileName, entry)
  }

  const downloaded = []
  const skipped = []
  for (const entry of uniqueEntries.values()) {
    const destinationPath = path.join(fightFolderPath, 'img', entry.fileName)
    try {
      await fs.access(destinationPath)
      skipped.push({ fileName: entry.fileName, reason: 'exists' })
      continue
    } catch {
      // Missing file; continue below.
    }

    const sourceUrl = await resolveDownloadUrl(entry)
    if (!sourceUrl) {
      skipped.push({ fileName: entry.fileName, reason: 'unresolved' })
      continue
    }

    const size = await downloadImage(sourceUrl, destinationPath)
    downloaded.push({
      fileName: entry.fileName,
      sourceUrl,
      size,
    })
  }

  return {
    fightName: path.basename(fightFolderPath),
    downloaded,
    skipped,
  }
}

const main = async () => {
  const fightFolders = (await fs.readdir(FIGHTS_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(FIGHTS_DIR, entry.name))

  const results = []
  for (const fightFolderPath of fightFolders) {
    results.push(await syncFightFolder(fightFolderPath))
  }

  for (const result of results) {
    if (!result.downloaded.length) continue
    console.log(`Downloaded ${result.downloaded.length} image(s) for ${result.fightName}:`)
    for (const item of result.downloaded) {
      console.log(`- ${item.fileName} (${item.size} bytes) <- ${item.sourceUrl}`)
    }
  }

  const unresolved = results.flatMap((result) =>
    result.skipped
      .filter((item) => item.reason === 'unresolved')
      .map((item) => `${result.fightName}: ${item.fileName}`),
  )
  if (unresolved.length) {
    console.log('Unresolved files:')
    for (const item of unresolved) {
      console.log(`- ${item}`)
    }
  }
}

await main()
