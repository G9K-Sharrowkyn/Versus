import { spawn } from 'node:child_process'
import process from 'node:process'
import { chromium } from 'playwright'

const REPO_ROOT = process.cwd()
const DEV_PORT = 4188
const DEV_HOST = '127.0.0.1'
const DEV_BASE_URL = `http://${DEV_HOST}:${DEV_PORT}`
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const waitForServer = async (url, timeoutMs = 30000) => {
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
    await sleep(300)
  }
  throw lastError || new Error(`Timed out waiting for ${url}`)
}

const startDevServer = () => {
  const baseOptions = { cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, BROWSER: 'none' } }
  if (process.platform === 'win32') {
    return spawn(`${npmCommand} run dev -- --host ${DEV_HOST} --port ${DEV_PORT} --strictPort`, { ...baseOptions, shell: true, windowsHide: true })
  }
  return spawn(npmCommand, ['run', 'dev', '--', '--host', DEV_HOST, '--port', String(DEV_PORT), '--strictPort'], baseOptions)
}

const stopProcess = async (child) => {
  if (!child || child.killed) return
  child.kill('SIGTERM')
  await Promise.race([new Promise((resolve) => child.once('exit', resolve)), sleep(2000).then(() => { if (!child.killed) child.kill('SIGKILL') })])
}

const run = async () => {
  let server
  let browser
  try {
    server = startDevServer()
    await waitForServer(`${DEV_BASE_URL}/api/fights/scan`)
    const scanRes = await fetch(`${DEV_BASE_URL}/api/fights/scan`, { cache: 'no-store' })
    const payload = await scanRes.json()
    const fights = Array.isArray(payload?.fights) ? payload.fights : []
    const fight = fights.find((f) => f.displayName === '4 Darth Vader vs Thanos' && f.variantLocale === 'pl')
    if (!fight) return

    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 1 })

    const params = new URLSearchParams({ audit: '1', fight: fight.folderKey, lang: fight.variantLocale, template: 'crucial-feats' })
    await page.goto(`${DEV_BASE_URL}/?${params.toString()}`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(
      ([expectedFolderKey, expectedLocale]) => {
        const stage = document.querySelector('[data-vs-stage="true"]')
        if (!stage) return false
        return stage.getAttribute('data-vs-preview-ready') === 'true' && stage.getAttribute('data-vs-template') === 'crucial-feats' && stage.getAttribute('data-vs-folder-key') === expectedFolderKey && stage.getAttribute('data-vs-locale') === expectedLocale
      },
      [fight.folderKey, fight.variantLocale],
      { timeout: 20000 },
    )

    const t0 = Date.now()
    let firstVisibleMs = null
    const relTops = []
    for (let i = 0; i < 30; i += 1) {
      await page.waitForTimeout(50)
      const sample = await page.evaluate(() => {
        const panel = document.querySelector('.vs-tactical-board25-reality')
        const img = panel?.querySelector('img[draggable="false"]:not(.vs-tactical-board25-logo-reflection)')
        if (!(panel instanceof HTMLElement) || !(img instanceof HTMLImageElement)) return null
        const panelRect = panel.getBoundingClientRect()
        const imgRect = img.getBoundingClientRect()
        const opacity = Number.parseFloat(getComputedStyle(img).opacity || '0')
        return {
          relTop: Number((imgRect.top - panelRect.top).toFixed(3)),
          opacity,
        }
      })
      if (!sample) continue
      relTops.push(sample.relTop)
      if (firstVisibleMs === null && sample.opacity > 0.9) {
        firstVisibleMs = Date.now() - t0
      }
    }

    const minRel = Math.min(...relTops)
    const maxRel = Math.max(...relTops)
    console.log(JSON.stringify({ firstVisibleMs, relDelta: Number((maxRel - minRel).toFixed(3)), minRel, maxRel }, null, 2))
  } finally {
    if (browser) await browser.close()
    await stopProcess(server)
  }
}

await run()
