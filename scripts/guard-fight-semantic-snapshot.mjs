import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  REPO_ROOT,
  buildCurrentLocaleProjection,
  buildSnapshotRecord,
  listFightFolders,
  loadCurrentImporter,
  readFightJsonSet,
} from './lib/fight-semantic-tools.mjs'

const UPDATE = process.argv.includes('--update')
const SNAPSHOT_PATH = path.join(REPO_ROOT, 'Fights/.fight-semantic-snapshot.json')

const currentImporter = loadCurrentImporter()

const sortObject = (value) => {
  if (Array.isArray(value)) return value.map((entry) => sortObject(entry))
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([key, entry]) => [key, sortObject(entry)]),
  )
}

const buildSnapshotPayload = () => {
  const fights = []
  for (const folderName of listFightFolders()) {
    const currentSet = readFightJsonSet(folderName)
    fights.push(
      buildSnapshotRecord(
        folderName,
        'en',
        buildCurrentLocaleProjection(currentSet.en, currentSet.scans, currentImporter),
      ),
      buildSnapshotRecord(
        folderName,
        'pl',
        buildCurrentLocaleProjection(currentSet.pl, currentSet.scans, currentImporter),
      ),
    )
  }

  return {
    schemaVersion: 1,
    fights: fights.sort((a, b) => {
      const byFolder = a.folder.localeCompare(b.folder, undefined, { numeric: true })
      return byFolder || a.locale.localeCompare(b.locale)
    }),
  }
}

const nextSnapshot = sortObject(buildSnapshotPayload())

if (UPDATE) {
  writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(nextSnapshot, null, 2)}\n`, 'utf8')
  console.log(`Updated fight semantic snapshot for ${nextSnapshot.fights.length} locale records.`)
  process.exit(0)
}

let currentSnapshot = null
try {
  currentSnapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'))
} catch (error) {
  console.error(`Fight semantic snapshot is missing or invalid: ${String(error)}`)
  process.exit(1)
}

if (JSON.stringify(sortObject(currentSnapshot)) !== JSON.stringify(nextSnapshot)) {
  console.error('Fight semantic snapshot mismatch. Run `npm run fights:snapshot:update` after an intentional content change.')
  process.exit(1)
}

console.log(`Fight semantic snapshot guard passed for ${nextSnapshot.fights.length} locale records.`)
