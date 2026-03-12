import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'

const REPO_ROOT = process.cwd()
const AUDIT_OUTPUT_PATH = path.join(REPO_ROOT, 'incase.md')
const DEV_PORT = 4173
const DEV_HOST = '127.0.0.1'
const DEV_BASE_URL = `http://${DEV_HOST}:${DEV_PORT}`
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const escapeMarkdown = (value) =>
  String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

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

const buildAuditUrl = (fight, templateId) => {
  const params = new URLSearchParams({
    audit: '1',
    fight: fight.folderKey,
    lang: fight.variantLocale,
    template: templateId,
  })
  return `${DEV_BASE_URL}/?${params.toString()}`
}

const compareBoxes = (left, right) => {
  if (!left || !right) return { deltaX: 0, deltaY: 0, deltaWidth: 0, deltaHeight: 0, shifted: false }
  const deltaX = Math.abs(left.x - right.x)
  const deltaY = Math.abs(left.y - right.y)
  const deltaWidth = Math.abs(left.width - right.width)
  const deltaHeight = Math.abs(left.height - right.height)
  return {
    deltaX,
    deltaY,
    deltaWidth,
    deltaHeight,
    shifted: deltaX > 0.05 || deltaY > 0.05 || deltaWidth > 0.05 || deltaHeight > 0.05,
  }
}

const formatReport = ({ generatedAt, auditedViews, shrinkWarnings, overflowWarnings, shiftWarnings }) => {
  const lines = [
    '# Layout Audit',
    '',
    `Generated: ${generatedAt}`,
    '',
    '## Summary',
    '',
    `- Audited views: ${auditedViews}`,
    `- Autofit warnings: ${shrinkWarnings.length}`,
    `- Residual overflow warnings: ${overflowWarnings.length}`,
    `- Startup shift warnings: ${shiftWarnings.length}`,
    '',
  ]

  lines.push('## Autofit Warnings', '')
  if (!shrinkWarnings.length) {
    lines.push('- None.', '')
  } else {
    shrinkWarnings.forEach((entry) => {
      lines.push(
        `- Fight: \`${escapeMarkdown(entry.fight)}\` | Locale: \`${entry.locale}\` | Template: \`${entry.template}\` | Slot: \`${escapeMarkdown(entry.slot)}\` | Base: \`${entry.baseFont}\` | Final: \`${entry.finalFont}\` | Excess chars: \`${entry.excessChars}\``,
      )
      lines.push(`  Text: \`${escapeMarkdown(entry.text)}\``)
    })
    lines.push('')
  }

  lines.push('## Residual Overflow', '')
  if (!overflowWarnings.length) {
    lines.push('- None.', '')
  } else {
    overflowWarnings.forEach((entry) => {
      lines.push(
        `- Fight: \`${escapeMarkdown(entry.fight)}\` | Locale: \`${entry.locale}\` | Template: \`${entry.template}\` | Slot: \`${escapeMarkdown(entry.slot)}\` | Base: \`${entry.baseFont}\` | Final: \`${entry.finalFont}\` | Excess chars: \`${entry.excessChars}\``,
      )
      lines.push(`  Text: \`${escapeMarkdown(entry.text)}\``)
    })
    lines.push('')
  }

  lines.push('## Startup Shift', '')
  if (!shiftWarnings.length) {
    lines.push('- None.', '')
  } else {
    shiftWarnings.forEach((entry) => {
      lines.push(
        `- Fight: \`${escapeMarkdown(entry.fight)}\` | Locale: \`${entry.locale}\` | Template: \`${entry.template}\` | Pixel change: \`${entry.pixelChanged}\` | dX: \`${entry.deltaX.toFixed(3)}\` | dY: \`${entry.deltaY.toFixed(3)}\` | dW: \`${entry.deltaWidth.toFixed(3)}\` | dH: \`${entry.deltaHeight.toFixed(3)}\``,
      )
    })
    lines.push('')
  }

  return `${lines.join('\n')}\n`
}

const collectSlotWarnings = (slotReports, fight, templateId) => {
  const shrinkWarnings = []
  const overflowWarnings = []

  slotReports.forEach((report) => {
    const record = {
      fight: fight.displayName,
      locale: fight.variantLocale,
      template: templateId,
      slot: report.slotKey,
      text: report.text,
      baseFont: report.baseFont,
      finalFont: report.finalFont,
      excessChars: report.excessChars,
    }
    if (report.finalFont + 0.01 < report.baseFont || report.overflowBase) {
      shrinkWarnings.push(record)
    }
    if (report.overflowMin) {
      overflowWarnings.push(record)
    }
  })

  return { shrinkWarnings, overflowWarnings }
}

const runAudit = async () => {
  const server = startDevServer()
  server.stdout.on('data', () => {})
  server.stderr.on('data', () => {})

  let browser
  try {
    await waitForServer(`${DEV_BASE_URL}/api/fights/scan`)
    const scanResponse = await fetch(`${DEV_BASE_URL}/api/fights/scan`, { cache: 'no-store' })
    const scanPayload = await scanResponse.json()
    const fights = Array.isArray(scanPayload?.fights)
      ? scanPayload.fights.filter((fight) => fight.variantLocale === 'pl' || fight.variantLocale === 'en')
      : []
    const totalViews = fights.reduce((count, fight) => {
      const templateOrder = Array.isArray(fight?.payload?.templateOrder) ? fight.payload.templateOrder : []
      return count + templateOrder.length
    }, 0)

    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({
      viewport: { width: 1600, height: 1100 },
      deviceScaleFactor: 1,
    })

    const shrinkWarnings = []
    const overflowWarnings = []
    const shiftWarnings = []
    let auditedViews = 0
    console.log(`[layout-audit] Starting audit for ${fights.length} locale records and ${totalViews} views.`)

    for (const fight of fights) {
      const templateOrder = Array.isArray(fight?.payload?.templateOrder) ? fight.payload.templateOrder : []
      for (const templateId of templateOrder) {
        try {
          const auditUrl = buildAuditUrl(fight, templateId)
          await page.goto(auditUrl, { waitUntil: 'domcontentloaded' })
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
            [templateId, fight.folderKey, fight.variantLocale],
            { timeout: 20_000 },
          )
          const stage = page.locator('[data-vs-stage="true"]')
          const firstBox = await stage.boundingBox()
          const firstScreenshot = await stage.screenshot()
          await page.waitForTimeout(250)
          const secondBox = await stage.boundingBox()
          const secondScreenshot = await stage.screenshot()
          const boxDiff = compareBoxes(firstBox, secondBox)
          const pixelChanged = !Buffer.from(firstScreenshot).equals(Buffer.from(secondScreenshot))

          if (pixelChanged || boxDiff.shifted) {
            shiftWarnings.push({
              fight: fight.displayName,
              locale: fight.variantLocale,
              template: templateId,
              pixelChanged,
              ...boxDiff,
            })
          }

          const slotReports = await page.$$eval('[data-vs-slot-key]', (nodes) =>
            nodes.map((node) => {
              const element = node
              return {
                slotKey: element.getAttribute('data-vs-slot-key') || '',
                baseFont: Number(element.getAttribute('data-vs-slot-base-font') || '0'),
                finalFont: Number(element.getAttribute('data-vs-slot-final-font') || '0'),
                overflowBase: element.getAttribute('data-vs-slot-overflow-base') === 'true',
                overflowMin: element.getAttribute('data-vs-slot-overflow-min') === 'true',
                excessChars: Number(element.getAttribute('data-vs-slot-excess-chars') || '0'),
                text: (element.textContent || '').replace(/\s+/g, ' ').trim(),
              }
            }),
          )

          const slotWarnings = collectSlotWarnings(slotReports, fight, templateId)
          shrinkWarnings.push(...slotWarnings.shrinkWarnings)
          overflowWarnings.push(...slotWarnings.overflowWarnings)
          auditedViews += 1
          if (auditedViews % 12 === 0 || auditedViews === totalViews) {
            console.log(`[layout-audit] Progress ${auditedViews}/${totalViews}.`)
          }
        } catch (error) {
          throw new Error(`Audit failed for ${fight.displayName} [${fight.variantLocale}] / ${templateId}: ${String(error)}`)
        }
      }
    }

    const report = formatReport({
      generatedAt: new Date().toISOString(),
      auditedViews,
      shrinkWarnings,
      overflowWarnings,
      shiftWarnings,
    })
    await writeFile(AUDIT_OUTPUT_PATH, report, 'utf8')

    console.log(`[layout-audit] Audited ${auditedViews} views.`)
    console.log(`[layout-audit] Autofit warnings: ${shrinkWarnings.length}.`)
    console.log(`[layout-audit] Residual overflow warnings: ${overflowWarnings.length}.`)
    console.log(`[layout-audit] Startup shift warnings: ${shiftWarnings.length}.`)
    console.log(`[layout-audit] Report written to ${AUDIT_OUTPUT_PATH}.`)
  } catch (error) {
    const report = [
      '# Layout Audit',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Error',
      '',
      `- ${escapeMarkdown(String(error))}`,
      '',
    ].join('\n')
    await writeFile(AUDIT_OUTPUT_PATH, `${report}\n`, 'utf8')
    console.warn('[layout-audit] Audit finished with a recoverable error.')
    console.warn(String(error))
  } finally {
    if (browser) {
      await browser.close()
    }
    await stopProcess(server)
  }
}

await runAudit()
