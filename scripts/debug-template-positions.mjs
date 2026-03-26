import { spawn } from 'node:child_process'
import process from 'node:process'
import { chromium } from 'playwright'

const DEV_PORT = 4173
const DEV_HOST = '127.0.0.1'
const DEV_BASE_URL = `http://${DEV_HOST}:${DEV_PORT}`
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const TEMPLATE_ANALYTICS = 'fight-analytics'
const TEMPLATE_COMPARISON = 'parameter-comparison'

const PL_STAT_LABELS = [
  'SIŁA',
  'SZYBKOŚĆ',
  'WYTRZYMAŁOŚĆ',
  'IQ BOJOWE',
  'HAX',
  'KONDYCJA',
  'STYL WALKI',
  'DOŚWIADCZENIE',
  'UMIEJĘTNOŚCI',
]

const EN_STAT_LABELS = [
  'STRENGTH',
  'SPEED',
  'DURABILITY',
  'BATTLE IQ',
  'HAX',
  'STAMINA',
  'STYLE',
  'EXPERIENCE',
  'SKILLS',
]

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
    await sleep(300)
  }
  throw lastError || new Error(`Timed out waiting for ${url}`)
}

const startDevServer = () => {
  const baseOptions = {
    cwd: process.cwd(),
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

const buildAuditUrl = (fight, templateId) => {
  const params = new URLSearchParams({
    audit: '1',
    fight: fight.folderKey,
    lang: fight.variantLocale,
    template: templateId,
  })
  return `${DEV_BASE_URL}/?${params.toString()}`
}

const pickFight = (fights, preferredKey, preferredLocale) => {
  const normalizedLocale = preferredLocale === 'en' ? 'en' : 'pl'
  const filteredByLocale = fights.filter((fight) => fight.variantLocale === normalizedLocale)
  const candidates = filteredByLocale.length ? filteredByLocale : fights

  const withTemplates = candidates.filter((fight) => {
    const order = Array.isArray(fight?.payload?.templateOrder) ? fight.payload.templateOrder : []
    return order.includes(TEMPLATE_ANALYTICS) && order.includes(TEMPLATE_COMPARISON)
  })

  if (preferredKey) {
    const exact = withTemplates.find((fight) => fight.folderKey === preferredKey)
    if (exact) return exact
  }

  return withTemplates[0] || null
}

const run = async () => {
  const wantedFightKey = process.env.FIGHT_KEY || ''
  const wantedLocale = (process.env.LOCALE || 'pl').toLowerCase()
  const server = startDevServer()
  server.stdout.on('data', () => {})
  server.stderr.on('data', () => {})

  let browser
  try {
    await waitForServer(`${DEV_BASE_URL}/api/fights/scan`)
    const scanResponse = await fetch(`${DEV_BASE_URL}/api/fights/scan`, { cache: 'no-store' })
    const scanPayload = await scanResponse.json()
    const allFights = Array.isArray(scanPayload?.fights) ? scanPayload.fights : []
    const targetFight = pickFight(allFights, wantedFightKey, wantedLocale)
    if (!targetFight) {
      throw new Error('Nie znaleziono walki zawierającej jednocześnie fight-analytics i parameter-comparison.')
    }

    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    })

    const measureTemplate = async (templateId) => {
      const url = buildAuditUrl(targetFight, templateId)
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await page.waitForFunction(
        ([expectedTemplateId, expectedFolderKey, expectedLocale]) => {
          const stage = document.querySelector('[data-vs-stage="true"]')
          if (!stage) return false
          return (
            stage.getAttribute('data-vs-preview-ready') === 'true' &&
            stage.getAttribute('data-vs-template') === expectedTemplateId &&
            stage.getAttribute('data-vs-folder-key') === expectedFolderKey &&
            stage.getAttribute('data-vs-locale') === expectedLocale
          )
        },
        [templateId, targetFight.folderKey, targetFight.variantLocale],
        { timeout: 20_000 },
      )
      await page.waitForTimeout(200)

      const statLabels = targetFight.variantLocale === 'en' ? EN_STAT_LABELS : PL_STAT_LABELS

      const measurement = await page.evaluate(
        ({ templateId, statLabels }) => {
          const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim().toUpperCase()
          const statSet = new Set(statLabels.map((label) => normalize(label)))
          const panel = document.querySelector('.vs-tactical-board25-stats')
          if (!panel) return { templateId, error: 'Panel .vs-tactical-board25-stats nie istnieje.' }
          const panelRect = panel.getBoundingClientRect()
          const panelMidX = panelRect.left + panelRect.width / 2

          const rect = (el) => {
            if (!el) return null
            const r = el.getBoundingClientRect()
            return {
              left: Number(r.left.toFixed(2)),
              top: Number(r.top.toFixed(2)),
              width: Number(r.width.toFixed(2)),
              height: Number(r.height.toFixed(2)),
            }
          }

          const textNodes = Array.from(panel.querySelectorAll('p, span, div'))
          const findByExactText = (text, side = 'any') => {
            const wanted = normalize(text)
            const matches = textNodes
              .filter((node) => normalize(node.textContent) === wanted)
              .map((node) => ({
                node,
                rect: node.getBoundingClientRect(),
              }))
              .filter(({ rect }) => rect.width > 0 && rect.height > 0)

            if (!matches.length) return null
            if (side === 'left') {
              matches.sort((a, b) => a.rect.left - b.rect.left)
              return matches[0].node
            }
            if (side === 'right') {
              matches.sort((a, b) => b.rect.left - a.rect.left)
              return matches[0].node
            }
            return matches[0].node
          }

          const statNodes = textNodes
            .map((node) => {
              const label = normalize(node.textContent)
              if (!statSet.has(label)) return null
              const r = node.getBoundingClientRect()
              if (r.width <= 0 || r.height <= 0) return null
              return { node, label, rect: r }
            })
            .filter(Boolean)

          const leftStats = statNodes
            .filter((entry) => entry.rect.left < panelMidX)
            .sort((a, b) => a.rect.top - b.rect.top)

          const rightStats = statNodes
            .filter((entry) => entry.rect.left >= panelMidX)
            .sort((a, b) => a.rect.top - b.rect.top)

          const separatorNodes = Array.from(panel.querySelectorAll('div'))
            .filter((node) => {
              const style = window.getComputedStyle(node)
              const r = node.getBoundingClientRect()
              return (
                r.height <= 3 &&
                r.width > panelRect.width * 0.15 &&
                style.backgroundColor === 'rgb(255, 85, 78)'
              )
            })
            .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)

          return {
            templateId,
            panel: rect(panel),
            parametr: rect(findByExactText('PARAMETR', 'left')),
            przewagaLeft: rect(findByExactText('PRZEWAGA', 'left')),
            firstLeftStat: leftStats[0] ? { label: leftStats[0].label, ...rect(leftStats[0].node) } : null,
            secondLeftStat: leftStats[1] ? { label: leftStats[1].label, ...rect(leftStats[1].node) } : null,
            firstRightStat: rightStats[0] ? { label: rightStats[0].label, ...rect(rightStats[0].node) } : null,
            secondRightStat: rightStats[1] ? { label: rightStats[1].label, ...rect(rightStats[1].node) } : null,
            separatorsTop: separatorNodes.slice(0, 8).map((node) => Number(node.getBoundingClientRect().top.toFixed(2))),
          }
        },
        { templateId, statLabels },
      )

      return { url, ...measurement }
    }

    const analytics = await measureTemplate(TEMPLATE_ANALYTICS)
    const comparison = await measureTemplate(TEMPLATE_COMPARISON)

    const delta = (a, b) =>
      a == null || b == null
        ? null
        : Number((b - a).toFixed(2))

    const report = {
      fight: {
        folderKey: targetFight.folderKey,
        displayName: targetFight.displayName,
        locale: targetFight.variantLocale,
      },
      analytics,
      comparison,
      deltas: {
        przewagaTop_vs_parametrTop: delta(analytics.parametr?.top, comparison.przewagaLeft?.top),
        leftStat1Top: delta(analytics.firstLeftStat?.top, comparison.firstLeftStat?.top),
        leftStat2Top: delta(analytics.secondLeftStat?.top, comparison.secondLeftStat?.top),
        rightStat1Top: delta(analytics.firstRightStat?.top, comparison.firstRightStat?.top),
        rightStat2Top: delta(analytics.secondRightStat?.top, comparison.secondRightStat?.top),
      },
    }

    console.log(JSON.stringify(report, null, 2))
  } finally {
    if (browser) await browser.close()
    await stopProcess(server)
  }
}

await run()
