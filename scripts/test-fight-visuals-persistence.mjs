import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const REPO_ROOT = process.cwd()
const DEV_PORT = 4174
const DEV_HOST = '127.0.0.1'
const DEV_BASE_URL = `http://${DEV_HOST}:${DEV_PORT}`
const FIGHT_VISUALS_PATH = path.join(REPO_ROOT, 'Fights', '.fight-visuals.json')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const waitForServer = async (url, timeoutMs = 30_000) => {
  const startedAt = Date.now()
  let lastError = null
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { cache: 'no-store' })
      if (response.ok) return
      lastError = new Error(`Unexpected status ${response.status}`)
    } catch (error) {
      lastError = error
    }
    await sleep(350)
  }
  throw lastError || new Error(`Timed out waiting for ${url}`)
}

const startDevServer = () => {
  const baseOptions = {
    cwd: REPO_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      BROWSER: 'none',
    },
  }

  if (process.platform === 'win32') {
    return spawn(
      `${npmCommand} run dev -- --host ${DEV_HOST} --port ${DEV_PORT} --strictPort`,
      {
        ...baseOptions,
        shell: true,
        windowsHide: true,
      },
    )
  }

  return spawn(
    npmCommand,
    ['run', 'dev', '--', '--host', DEV_HOST, '--port', String(DEV_PORT), '--strictPort'],
    baseOptions,
  )
}

const stopProcess = async (child) => {
  if (!child || child.killed) return
  child.kill('SIGTERM')
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    sleep(2_000).then(() => {
      if (!child.killed) child.kill('SIGKILL')
    }),
  ])
}

const readStoreFile = async () => {
  try {
    const payload = await fs.readFile(FIGHT_VISUALS_PATH, 'utf8')
    return payload
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return null
    throw error
  }
}

const restoreStoreFile = async (backup) => {
  if (backup === null) {
    await fs.rm(FIGHT_VISUALS_PATH, { force: true })
    return
  }
  await fs.writeFile(FIGHT_VISUALS_PATH, backup, 'utf8')
}

const parseStore = (payload) => {
  if (!payload) return { folders: {}, updatedAt: null }
  const parsed = JSON.parse(payload)
  return {
    folders: parsed?.folders && typeof parsed.folders === 'object' && !Array.isArray(parsed.folders) ? parsed.folders : {},
    updatedAt: typeof parsed?.updatedAt === 'string' ? parsed.updatedAt : null,
  }
}

const getScanPayload = async () => {
  const response = await fetch(`${DEV_BASE_URL}/api/fights/scan`, { cache: 'no-store' })
  if (!response.ok) throw new Error(`Scan failed (${response.status})`)
  return response.json()
}

const postVisuals = async (folders) => {
  const response = await fetch(`${DEV_BASE_URL}/api/fights/visuals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ folders }),
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`Visual write failed (${response.status})`)
  }
}

const approxEqual = (left, right) => Math.abs(left - right) <= 0.0001

const assertFolderVisuals = (fights, folderKey, expected) => {
  const matches = fights.filter((fight) => fight.folderKey === folderKey)
  if (!matches.length) throw new Error(`Folder "${folderKey}" was not returned after restart.`)
  matches.forEach((fight) => {
    const portraitA = fight?.portraitAAdjust || {}
    const portraitB = fight?.portraitBAdjust || {}
    if (
      !approxEqual(Number(portraitA.x || 0), expected.portraitAAdjust.x) ||
      !approxEqual(Number(portraitA.y || 0), expected.portraitAAdjust.y) ||
      !approxEqual(Number(portraitA.scale || 0), expected.portraitAAdjust.scale) ||
      !approxEqual(Number(portraitB.x || 0), expected.portraitBAdjust.x) ||
      !approxEqual(Number(portraitB.y || 0), expected.portraitBAdjust.y) ||
      !approxEqual(Number(portraitB.scale || 0), expected.portraitBAdjust.scale)
    ) {
      throw new Error(`Folder "${folderKey}" did not keep saved portrait adjustments after restart.`)
    }
  })
}

const runTest = async () => {
  const backup = await readStoreFile()
  const originalStore = parseStore(backup)
  let server = null

  try {
    server = startDevServer()
    server.stdout.on('data', () => {})
    server.stderr.on('data', () => {})
    await waitForServer(`${DEV_BASE_URL}/api/fights/scan`)

    const scanPayload = await getScanPayload()
    const fights = Array.isArray(scanPayload?.fights) ? scanPayload.fights : []
    const folderKeys = [...new Set(fights.map((fight) => String(fight.folderKey || '').trim()).filter(Boolean))]
    if (folderKeys.length < 2) {
      throw new Error('Need at least two folder fights to run visuals persistence test.')
    }

    const targetKeys = folderKeys.slice(0, 2)
    const untouchedKeys = Object.keys(originalStore.folders).filter((folderKey) => !targetKeys.includes(folderKey))
    const expectedFolders = targetKeys.map((folderKey, index) => ({
      folderKey,
      portraitAAdjust: {
        x: 21 + index * 17,
        y: 34 + index * 11,
        scale: 1.12 + index * 0.09,
      },
      portraitBAdjust: {
        x: 68 - index * 9,
        y: 63 - index * 7,
        scale: 0.94 + index * 0.08,
      },
      slideImageAdjustments: {},
    }))

    await postVisuals(expectedFolders)
    await stopProcess(server)
    server = null

    const writtenStore = parseStore(await readStoreFile())
    const writtenKeys = Object.keys(writtenStore.folders)
    targetKeys.forEach((folderKey) => {
      if (!writtenKeys.includes(folderKey)) {
        throw new Error(`Store write did not persist target folder "${folderKey}".`)
      }
    })
    untouchedKeys.forEach((folderKey) => {
      if (!writtenKeys.includes(folderKey)) {
        throw new Error(`Store write dropped existing folder "${folderKey}".`)
      }
    })

    server = startDevServer()
    server.stdout.on('data', () => {})
    server.stderr.on('data', () => {})
    await waitForServer(`${DEV_BASE_URL}/api/fights/scan`)
    const restartedPayload = await getScanPayload()
    const restartedFights = Array.isArray(restartedPayload?.fights) ? restartedPayload.fights : []

    expectedFolders.forEach((entry) => {
      assertFolderVisuals(restartedFights, entry.folderKey, entry)
    })

    const reloadedStore = parseStore(await readStoreFile())
    targetKeys.forEach((folderKey) => {
      if (!(folderKey in reloadedStore.folders)) {
        throw new Error(`Reloaded store no longer includes "${folderKey}".`)
      }
    })

    console.log(`[visuals-persistence] Verified ${targetKeys.length} folder overrides across a full dev-server restart.`)
    console.log(`[visuals-persistence] Untouched store entries preserved: ${untouchedKeys.length}.`)
  } finally {
    await stopProcess(server)
    await restoreStoreFile(backup)
  }
}

await runTest()
