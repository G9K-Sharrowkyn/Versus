import { promises as fs } from 'node:fs'
import type { ServerResponse } from 'node:http'
import path from 'node:path'
import { defineConfig, type Connect, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const FIGHTS_DIR_CANDIDATES = [
  path.resolve(__dirname, 'Fights'),
  path.resolve(__dirname, '..', '..', 'Fights'),
]
const IMAGE_FILE_PATTERN = /^([12])\.(jpe?g|png|webp|avif)$/i
const ANY_IMAGE_FILE_PATTERN = /\.(jpe?g|png|webp|avif)$/i
const TXT_FILE_PATTERN = /\.txt$/i

type ScanFightRecord = {
  folderKey: string
  displayName: string
  matchName: string
  txtFileName: string
  txtContent: string
  portraitAUrl: string
  portraitBUrl: string
  sortIndex: number
  warnings: string[]
}

const toPosixPath = (value: string) => value.split(path.sep).join('/')

const extractSortIndex = (value: string) => {
  const match = value.match(/^\s*(\d+)\s*[\.\-_ ]*/)
  if (!match) return Number.MAX_SAFE_INTEGER
  const parsed = Number(match[1])
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER
}

const normalizeMatchName = (folderName: string) =>
  folderName.replace(/^\s*\d+\s*[\.\-_ ]*/, '').trim() || folderName.trim()

const asJson = (response: unknown) => JSON.stringify(response, null, 2)

const contentTypeForImage = (fileName: string) => {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.avif')) return 'image/avif'
  return 'image/jpeg'
}

const pickPortraitFiles = (
  files: string[],
): { portraitAFile: string; portraitBFile: string; fallbackUsed: boolean } => {
  const portraitAFile =
    files.find((file) => IMAGE_FILE_PATTERN.test(file) && file.match(IMAGE_FILE_PATTERN)?.[1] === '1') || ''
  const portraitBFile =
    files.find((file) => IMAGE_FILE_PATTERN.test(file) && file.match(IMAGE_FILE_PATTERN)?.[1] === '2') || ''
  if (portraitAFile && portraitBFile) {
    return { portraitAFile, portraitBFile, fallbackUsed: false }
  }

  const imageCandidates = files
    .filter((file) => ANY_IMAGE_FILE_PATTERN.test(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

  if (imageCandidates.length < 2) {
    return { portraitAFile, portraitBFile, fallbackUsed: false }
  }

  const fallbackA = portraitAFile || imageCandidates[0]
  const fallbackB = portraitBFile || imageCandidates.find((file) => file !== fallbackA) || ''
  return {
    portraitAFile: fallbackA,
    portraitBFile: fallbackB,
    fallbackUsed: Boolean((!portraitAFile || !portraitBFile) && fallbackA && fallbackB),
  }
}

const resolveFightsDir = async (): Promise<string | null> => {
  for (const directory of FIGHTS_DIR_CANDIDATES) {
    try {
      await fs.access(directory)
      return directory
    } catch {
      // Try next candidate.
    }
  }
  return null
}

const scanFightsDirectory = async (): Promise<{ fights: ScanFightRecord[]; warnings: string[] }> => {
  const warnings: string[] = []
  const fights: ScanFightRecord[] = []
  const fightsDir = await resolveFightsDir()
  if (!fightsDir) {
    return { fights, warnings }
  }
  if (fightsDir !== FIGHTS_DIR_CANDIDATES[0]) {
    warnings.push(`Using fallback fights directory: ${fightsDir}`)
  }

  const entries = await fs.readdir(fightsDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const folderName = entry.name
    const folderPath = path.join(fightsDir, folderName)
    const folderKey = toPosixPath(folderName)
    const matchName = normalizeMatchName(folderName)
    const sortIndex = extractSortIndex(folderName)
    const folderWarnings: string[] = []

    let files: string[] = []
    try {
      const childEntries = await fs.readdir(folderPath, { withFileTypes: true })
      files = childEntries.filter((item) => item.isFile()).map((item) => item.name)
    } catch {
      warnings.push(`Could not read folder "${folderName}".`)
      continue
    }

    const txtCandidates = files.filter((file) => TXT_FILE_PATTERN.test(file))
    const preferredTxt = `${matchName}.txt`.toLowerCase()
    let txtFileName =
      txtCandidates.find((file) => file.toLowerCase() === preferredTxt) ||
      (txtCandidates.length === 1 ? txtCandidates[0] : '')

    if (!txtFileName) {
      folderWarnings.push(
        txtCandidates.length
          ? `Missing preferred TXT (${matchName}.txt) in folder "${folderName}".`
          : `Missing TXT file in folder "${folderName}".`,
      )
    }

    const { portraitAFile, portraitBFile, fallbackUsed } = pickPortraitFiles(files)
    if (fallbackUsed) {
      folderWarnings.push(
        `Using fallback portraits in folder "${folderName}" (first two image files; preferred names are 1.* and 2.*).`,
      )
    }

    if (!portraitAFile) folderWarnings.push(`Missing portrait "1.*" in folder "${folderName}".`)
    if (!portraitBFile) folderWarnings.push(`Missing portrait "2.*" in folder "${folderName}".`)

    if (!txtFileName || !portraitAFile || !portraitBFile) {
      warnings.push(...folderWarnings)
      continue
    }

    let txtContent = ''
    try {
      txtContent = await fs.readFile(path.join(folderPath, txtFileName), 'utf8')
    } catch {
      warnings.push(`Failed to read TXT "${txtFileName}" in folder "${folderName}".`)
      continue
    }

    fights.push({
      folderKey,
      displayName: folderName,
      matchName,
      txtFileName,
      txtContent,
      portraitAUrl: `/api/fights/asset?key=${encodeURIComponent(folderKey)}&slot=1`,
      portraitBUrl: `/api/fights/asset?key=${encodeURIComponent(folderKey)}&slot=2`,
      sortIndex,
      warnings: folderWarnings,
    })
  }

  fights.sort((a, b) => {
    if (a.sortIndex !== b.sortIndex) return a.sortIndex - b.sortIndex
    return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base', numeric: true })
  })
  return { fights, warnings }
}

const handleFightsAssetRequest = async (url: URL, res: ServerResponse) => {
  const key = String(url.searchParams.get('key') || '').trim()
  const slot = String(url.searchParams.get('slot') || '').trim()
  if (!key || (slot !== '1' && slot !== '2')) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(asJson({ error: 'Invalid asset query.' }))
    return
  }

  const fightsDir = await resolveFightsDir()
  if (!fightsDir) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(asJson({ error: 'Fights directory not found.' }))
    return
  }

  const safeKey = key.replace(/\\/g, '/')
  const candidateFolder = path.resolve(fightsDir, safeKey)
  const relativeToRoot = path.relative(fightsDir, candidateFolder)
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(asJson({ error: 'Invalid folder key.' }))
    return
  }

  let files: string[] = []
  try {
    const entries = await fs.readdir(candidateFolder, { withFileTypes: true })
    files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name)
  } catch {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(asJson({ error: 'Fight folder not found.' }))
    return
  }

  const { portraitAFile, portraitBFile } = pickPortraitFiles(files)
  const assetFile = slot === '1' ? portraitAFile : portraitBFile

  if (!assetFile) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(asJson({ error: `Missing portrait ${slot}.*.` }))
    return
  }

  try {
    const payload = await fs.readFile(path.join(candidateFolder, assetFile))
    res.statusCode = 200
    res.setHeader('Content-Type', contentTypeForImage(assetFile))
    res.setHeader('Cache-Control', 'no-store')
    res.end(payload)
  } catch {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(asJson({ error: 'Failed to read portrait file.' }))
  }
}

const createFightsApiMiddleware = (): Connect.NextHandleFunction => {
  return async (req, res, next) => {
    if (!req.url) {
      next()
      return
    }
    const requestUrl = new URL(req.url, 'http://127.0.0.1')
    if (!requestUrl.pathname.startsWith('/api/fights/')) {
      next()
      return
    }
    if (req.method !== 'GET') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(asJson({ error: 'Method not allowed.' }))
      return
    }

    if (requestUrl.pathname === '/api/fights/scan') {
      try {
        const scanned = await scanFightsDirectory()
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(asJson(scanned))
      } catch (error) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(asJson({ fights: [], warnings: ['Failed to scan Fights directory.'], error: String(error) }))
      }
      return
    }

    if (requestUrl.pathname === '/api/fights/asset') {
      await handleFightsAssetRequest(requestUrl, res)
      return
    }

    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(asJson({ error: 'Not found.' }))
  }
}

const fightsApiPlugin = (): Plugin => ({
  name: 'vs-fights-api',
  configureServer(server) {
    server.middlewares.use(createFightsApiMiddleware())
  },
  configurePreviewServer(server) {
    server.middlewares.use(createFightsApiMiddleware())
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), fightsApiPlugin()],
})
