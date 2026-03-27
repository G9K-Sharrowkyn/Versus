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
          const rootRemPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

          const round3 = (value) => Number(value.toFixed(3))
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

          const toPx = (cssValue) => {
            if (!cssValue) return 0
            const parsed = Number.parseFloat(cssValue)
            return Number.isFinite(parsed) ? parsed : 0
          }

          const parseTranslate = (transformValue) => {
            if (!transformValue || transformValue === 'none') {
              return { tx: 0, ty: 0, raw: transformValue || 'none' }
            }
            if (transformValue.startsWith('matrix3d(')) {
              const values = transformValue
                .slice('matrix3d('.length, -1)
                .split(',')
                .map((entry) => Number.parseFloat(entry.trim()))
              return {
                tx: Number.isFinite(values[12]) ? values[12] : 0,
                ty: Number.isFinite(values[13]) ? values[13] : 0,
                raw: transformValue,
              }
            }
            if (transformValue.startsWith('matrix(')) {
              const values = transformValue
                .slice('matrix('.length, -1)
                .split(',')
                .map((entry) => Number.parseFloat(entry.trim()))
              return {
                tx: Number.isFinite(values[4]) ? values[4] : 0,
                ty: Number.isFinite(values[5]) ? values[5] : 0,
                raw: transformValue,
              }
            }
            return { tx: 0, ty: 0, raw: transformValue }
          }

          const describeNode = (node) => {
            if (!node) return '(null)'
            const tag = node.tagName ? node.tagName.toLowerCase() : 'node'
            const classes =
              typeof node.className === 'string'
                ? node.className
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('.')
                : ''
            return classes ? `${tag}.${classes}` : tag
          }

          const collectAncestorTransforms = (fromNode, stopNode) => {
            const result = []
            let current = fromNode?.parentElement || null
            while (current && current !== stopNode) {
              const style = getComputedStyle(current)
              if (style.transform && style.transform !== 'none') {
                const parsed = parseTranslate(style.transform)
                result.push({
                  node: describeNode(current),
                  transform: style.transform,
                  translateX: round3(parsed.tx),
                  translateY: round3(parsed.ty),
                })
              }
              current = current.parentElement
            }
            return result
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

          const fallbackSeparatorBars = Array.from(panel.querySelectorAll('div'))
            .filter((node) => {
              const style = window.getComputedStyle(node)
              const r = node.getBoundingClientRect()
              return r.height <= 3 && r.width > panelRect.width * 0.15 && style.backgroundColor === 'rgb(255, 85, 78)'
            })

          const separatorBars =
            templateId === 'parameter-comparison'
              ? Array.from(panel.querySelectorAll('[data-comp-separator-bar="true"]'))
              : templateId === 'fight-analytics'
                ? Array.from(panel.querySelectorAll('[data-analytics-separator-bar="true"]'))
                : fallbackSeparatorBars

          const separatorBreakdown = separatorBars
            .map((barNode, fallbackIndex) => {
              const bar = barNode
              const track = bar.parentElement
              const row = track?.parentElement || null
              const cell = row?.firstElementChild || null
              const column = row?.parentElement || null
              const barRect = bar.getBoundingClientRect()
              const trackRect = track?.getBoundingClientRect?.() || null
              const rowRect = row?.getBoundingClientRect?.() || null
              const cellRect = cell?.getBoundingClientRect?.() || null
              const columnRect = column?.getBoundingClientRect?.() || null

              const rowStyle = row ? getComputedStyle(row) : null
              const cellStyle = cell ? getComputedStyle(cell) : null
              const trackStyle = track ? getComputedStyle(track) : null
              const columnStyle = column ? getComputedStyle(column) : null

              const rowTransform = parseTranslate(rowStyle?.transform || 'none')
              const cellTransform = parseTranslate(cellStyle?.transform || 'none')
              const trackTransform = parseTranslate(trackStyle?.transform || 'none')

              const rowTopRelativePanelPx = rowRect ? rowRect.top - panelRect.top : 0
              const columnTopRelativePanelPx = columnRect ? columnRect.top - panelRect.top : 0
              const cellHeightPx = cellRect ? cellRect.height : 0
              const separatorMarginTopPx = toPx(trackStyle?.marginTop || '')
              const separatorMarginBottomPx = toPx(trackStyle?.marginBottom || '')
              const rowMarginTopPx = toPx(rowStyle?.marginTop || '')
              const columnPaddingTopPx = toPx(columnStyle?.paddingTop || '')
              const barTopRelativeTrackPx = trackRect ? barRect.top - trackRect.top : 0
              const topPx = barRect.top - panelRect.top

              const reconstructedTopPx =
                rowTopRelativePanelPx +
                cellHeightPx +
                separatorMarginTopPx +
                trackTransform.ty +
                barTopRelativeTrackPx

              const side =
                templateId === 'parameter-comparison'
                  ? track?.getAttribute('data-comp-side') ||
                    (barRect.left + barRect.width / 2 < panelMidX ? 'left' : 'right')
                  : 'main'

              const separatorIndexAttr =
                templateId === 'parameter-comparison'
                  ? track?.getAttribute('data-comp-separator-index')
                  : track?.getAttribute('data-analytics-separator-index')

              const rowIndexAttr =
                templateId === 'parameter-comparison'
                  ? row?.getAttribute('data-comp-row-index')
                  : row?.getAttribute('data-analytics-row-index')

              return {
                side,
                separatorIndex: Number.parseInt(separatorIndexAttr || `${fallbackIndex}`, 10),
                rowIndex: Number.parseInt(rowIndexAttr || `${fallbackIndex}`, 10),
                topPx: round3(topPx),
                leftPx: round3(barRect.left - panelRect.left),
                widthPx: round3(barRect.width),
                heightPx: round3(barRect.height),
                rowTopRelativePanelPx: round3(rowTopRelativePanelPx),
                columnTopRelativePanelPx: round3(columnTopRelativePanelPx),
                columnPaddingTopPx: round3(columnPaddingTopPx),
                rowMarginTopPx: round3(rowMarginTopPx),
                rowTransformYPx: round3(rowTransform.ty),
                cellHeightPx: round3(cellHeightPx),
                cellTransformYPx: round3(cellTransform.ty),
                separatorMarginTopPx: round3(separatorMarginTopPx),
                separatorMarginBottomPx: round3(separatorMarginBottomPx),
                separatorTransformYPx: round3(trackTransform.ty),
                barTopRelativeTrackPx: round3(barTopRelativeTrackPx),
                reconstructedTopPx: round3(reconstructedTopPx),
                reconstructionDeltaPx: round3(topPx - reconstructedTopPx),
                rootRemPx: round3(rootRemPx),
                inlineStyles: {
                  rowMarginTop: row?.style?.marginTop || '',
                  rowTransform: row?.style?.transform || '',
                  cellTransform: cell?.style?.transform || '',
                  separatorMarginTop: track?.style?.marginTop || '',
                  separatorMarginBottom: track?.style?.marginBottom || '',
                  separatorTransform: track?.style?.transform || '',
                  columnPaddingTop: column?.style?.paddingTop || '',
                },
                ancestorTransforms: collectAncestorTransforms(bar, panel),
              }
            })
            .sort((a, b) => a.topPx - b.topPx || a.leftPx - b.leftPx)

          return {
            templateId,
            panel: rect(panel),
            parametr: rect(findByExactText('PARAMETR', 'left')),
            przewagaLeft: rect(findByExactText('PRZEWAGA', 'left')),
            firstLeftStat: leftStats[0] ? { label: leftStats[0].label, ...rect(leftStats[0].node) } : null,
            secondLeftStat: leftStats[1] ? { label: leftStats[1].label, ...rect(leftStats[1].node) } : null,
            firstRightStat: rightStats[0] ? { label: rightStats[0].label, ...rect(rightStats[0].node) } : null,
            secondRightStat: rightStats[1] ? { label: rightStats[1].label, ...rect(rightStats[1].node) } : null,
            separatorsTop: separatorBreakdown.slice(0, 12).map((entry) => Number(entry.topPx.toFixed(2))),
            separatorBreakdown,
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

    const analyticsSeparators = Array.isArray(analytics.separatorBreakdown)
      ? analytics.separatorBreakdown.slice().sort((a, b) => a.topPx - b.topPx)
      : []
    const comparisonSeparators = Array.isArray(comparison.separatorBreakdown)
      ? comparison.separatorBreakdown.slice().sort((a, b) => a.topPx - b.topPx)
      : []
    const comparisonLeftSeparators = comparisonSeparators.filter((entry) => entry.side === 'left')
    const comparisonRightSeparators = comparisonSeparators.filter((entry) => entry.side === 'right')
    const comparisonCenterSeparators = comparisonSeparators.filter((entry) => entry.side === 'center')

    const pairSeparatorDeltas = (reference, target) =>
      target.map((entry, index) => ({
        line: index + 1,
        comparisonTopPx: entry.topPx,
        analyticsTopPx: reference[index]?.topPx ?? null,
        deltaPx: reference[index] ? Number((entry.topPx - reference[index].topPx).toFixed(3)) : null,
      }))

    const leftVsAnalytics = pairSeparatorDeltas(analyticsSeparators, comparisonLeftSeparators)
    const rightVsAnalytics = pairSeparatorDeltas(analyticsSeparators, comparisonRightSeparators)

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
      separatorDeltas: {
        leftVsAnalytics,
        rightVsAnalytics,
      },
    }

    const printSeparatorLines = (title, lines, referenceLines = []) => {
      console.log(`\n${title}`)
      if (!lines.length) {
        console.log('  (brak linii)')
        return
      }
      lines.forEach((line, index) => {
        const ref = referenceLines[index]
        const deltaVsRef = ref ? Number((line.topPx - ref.topPx).toFixed(3)) : null
        const ancestorInfo = line.ancestorTransforms.length
          ? line.ancestorTransforms
              .map(
                (entry) =>
                  `${entry.node}: tx=${entry.translateX}px ty=${entry.translateY}px`,
              )
              .join(' | ')
          : 'brak'
        console.log(
          `linia ${index + 1}: top=${line.topPx}px ` +
            `(left=${line.leftPx}px, rowTop=${line.rowTopRelativePanelPx}px, rowMarginTop=${line.rowMarginTopPx}px, ` +
            `rowTransformY=${line.rowTransformYPx}px, cellHeight=${line.cellHeightPx}px, cellTransformY=${line.cellTransformYPx}px, ` +
            `sepMarginTop=${line.separatorMarginTopPx}px, sepMarginBottom=${line.separatorMarginBottomPx}px, ` +
            `sepTransformY=${line.separatorTransformYPx}px, barTopInTrack=${line.barTopRelativeTrackPx}px, ` +
            `columnTop=${line.columnTopRelativePanelPx}px, columnPaddingTop=${line.columnPaddingTopPx}px, rem=${line.rootRemPx}px, ` +
            `reconTop=${line.reconstructedTopPx}px, reconDelta=${line.reconstructionDeltaPx}px` +
            `${deltaVsRef == null ? '' : `, deltaVsAnalityka=${deltaVsRef}px`}` +
            `; inline=[row.marginTop:${line.inlineStyles.rowMarginTop || '0'}, row.transform:${line.inlineStyles.rowTransform || 'none'}, ` +
            `cell.transform:${line.inlineStyles.cellTransform || 'none'}, sep.marginTop:${line.inlineStyles.separatorMarginTop || '0'}, ` +
            `sep.marginBottom:${line.inlineStyles.separatorMarginBottom || '0'}, sep.transform:${line.inlineStyles.separatorTransform || 'none'}, ` +
            `column.paddingTop:${line.inlineStyles.columnPaddingTop || '0'}], ancestors=[${ancestorInfo}])`,
        )
      })
    }

    printSeparatorLines('ANALITYKA WALKI - czerwone linie', analyticsSeparators)
    printSeparatorLines('POROWNANIE PARAMETROW - lewa strona', comparisonLeftSeparators, analyticsSeparators)
    printSeparatorLines('POROWNANIE PARAMETROW - prawa strona', comparisonRightSeparators, analyticsSeparators)
    if (comparisonCenterSeparators.length) {
      printSeparatorLines('POROWNANIE PARAMETROW - srodek (remisy)', comparisonCenterSeparators)
    }

    console.log(JSON.stringify(report, null, 2))
  } finally {
    if (browser) await browser.close()
    await stopProcess(server)
  }
}

await run()
