export type DossierNameAutofitConfig = {
  baseScale: number
  twoLineScale: number
  oneLineMinScale: number
  minFontPx: number
  tolerancePx?: number
  allowTwoRows?: boolean
  minRows?: number
  maxRows?: number
  targetHeightPx?: number
}

type ApplyDossierNameAutofitArgs = {
  element: HTMLElement
  container: HTMLElement
  sourceText: string
  config: DossierNameAutofitConfig
}

const DEFAULT_TOLERANCE_PX = 0.5
const DOSSIER_NAME_LINE_HEIGHT = 0.9

const createLinesFromBreaks = (words: string[], breakpoints: number[]) => {
  const lines: string[] = []
  let start = 0
  for (const breakpoint of breakpoints) {
    lines.push(words.slice(start, breakpoint).join(' '))
    start = breakpoint
  }
  lines.push(words.slice(start).join(' '))
  return lines.filter(Boolean)
}

const chooseBestRowsSplit = (name: string, rows: number): string[] => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return ['']
  if (rows <= 1 || words.length === 1) return [words.join(' ')]

  const targetRows = Math.min(Math.max(2, rows), words.length)
  const breakCount = targetRows - 1
  const maxBreakpoint = words.length - 1

  let best: string[] | null = null
  let bestScore = Number.POSITIVE_INFINITY

  const evaluate = (breakpoints: number[]) => {
    const lines = createLinesFromBreaks(words, breakpoints)
    if (lines.length !== targetRows) return
    const lengths = lines.map((line) => line.length)
    const maxLen = Math.max(...lengths)
    const minLen = Math.min(...lengths)
    const avg = lengths.reduce((sum, value) => sum + value, 0) / lengths.length
    const variance = lengths.reduce((sum, value) => sum + (value - avg) ** 2, 0) / lengths.length
    const score = maxLen * 100 + (maxLen - minLen) * 10 + variance
    if (score < bestScore) {
      bestScore = score
      best = lines
    }
  }

  const stack: number[] = []
  const walk = (nextBreakpointStart: number) => {
    if (stack.length === breakCount) {
      evaluate(stack)
      return
    }

    const remainingBreaks = breakCount - stack.length
    for (let point = nextBreakpointStart; point <= maxBreakpoint - remainingBreaks + 1; point += 1) {
      stack.push(point)
      walk(point + 1)
      stack.pop()
    }
  }

  walk(1)
  return best ?? [words.join(' ')]
}

const measureFitsBox = (
  element: HTMLElement,
  maxWidthPx: number,
  maxHeightPx: number,
  tolerancePx: number,
) =>
  element.scrollWidth <= maxWidthPx + tolerancePx &&
  element.scrollHeight <= maxHeightPx + tolerancePx

const shrinkElementTextToBox = (
  element: HTMLElement,
  maxWidthPx: number,
  maxHeightPx: number,
  minFontPx: number,
  tolerancePx: number,
) => {
  if (maxWidthPx <= 0 || maxHeightPx <= 0) return

  let currentFontPx = Number.parseFloat(window.getComputedStyle(element).fontSize)
  if (!Number.isFinite(currentFontPx) || currentFontPx <= 0) return

  let safety = 0
  while (!measureFitsBox(element, maxWidthPx, maxHeightPx, tolerancePx) && currentFontPx > minFontPx && safety < 20) {
    const widthRatio = maxWidthPx / Math.max(element.scrollWidth, 1)
    const heightRatio = maxHeightPx / Math.max(element.scrollHeight, 1)
    const fitRatio = Math.min(widthRatio, heightRatio)
    const nextFontPx = Math.max(
      minFontPx,
      currentFontPx * Math.min(0.95, Math.max(0.6, fitRatio)),
    )
    if (Math.abs(nextFontPx - currentFontPx) < 0.05) break
    currentFontPx = nextFontPx
    element.style.fontSize = `${currentFontPx}px`
    safety += 1
  }
}

const setupElementBase = (element: HTMLElement, maxWidthPx: number, targetHeightPx: number) => {
  element.style.display = 'inline-block'
  element.style.width = 'auto'
  element.style.maxWidth = `${maxWidthPx}px`
  element.style.wordBreak = 'normal'
  element.style.overflowWrap = 'normal'
  element.style.lineHeight = `${DOSSIER_NAME_LINE_HEIGHT}`
  element.style.height = `${targetHeightPx}px`
  element.style.maxHeight = `${targetHeightPx}px`
  element.style.minHeight = `${targetHeightPx}px`
}

const applyLines = (element: HTMLElement, lines: string[]) => {
  element.textContent = lines.join('\n')
  element.style.whiteSpace = lines.length > 1 ? 'pre' : 'nowrap'
}

export const applyDossierNameAutofit = ({
  element,
  container,
  sourceText,
  config,
}: ApplyDossierNameAutofitArgs) => {
  const {
    baseScale,
    twoLineScale,
    oneLineMinScale,
    minFontPx,
    tolerancePx = DEFAULT_TOLERANCE_PX,
    allowTwoRows = true,
    minRows = 1,
    maxRows,
    targetHeightPx,
  } = config

  const normalizedText = sourceText.trim()
  if (!normalizedText) {
    element.textContent = ''
    return
  }
  const containerStyles = window.getComputedStyle(container)
  const paddingLeftPx = Number.parseFloat(containerStyles.paddingLeft || '0') || 0
  const paddingRightPx = Number.parseFloat(containerStyles.paddingRight || '0') || 0
  const localContainerWidthPx = container.clientWidth > 0
    ? container.clientWidth - paddingLeftPx - paddingRightPx
    : container.getBoundingClientRect().width - paddingLeftPx - paddingRightPx
  const containerWidthPx = Math.max(10, localContainerWidthPx)

  applyLines(element, [normalizedText])
  setupElementBase(element, containerWidthPx, 8)
  element.style.fontSize = `calc(var(--tb-type-1) * ${baseScale})`

  const baseFontPx = Number.parseFloat(window.getComputedStyle(element).fontSize)
  const resolvedTargetHeightPx = Math.max(
    8,
    Number.isFinite(targetHeightPx)
      ? (targetHeightPx as number)
      : (Number.isFinite(baseFontPx) ? baseFontPx : minFontPx) * DOSSIER_NAME_LINE_HEIGHT,
  )
  const oneLineMinFontPx = Number.isFinite(baseFontPx)
    ? Math.max(minFontPx, baseFontPx * oneLineMinScale)
    : minFontPx

  const variants: Array<{
    lines: string[]
    initialScale: number
    minFont: number
  }> = []

  if (minRows <= 1) {
    variants.push({
      lines: [normalizedText],
      initialScale: baseScale,
      minFont: oneLineMinFontPx,
    })
  }

  const canUseMultiLine = allowTwoRows && /\s/.test(normalizedText)
  if (canUseMultiLine) {
    const rowsFloor = Math.max(2, Math.min(6, Math.floor(minRows)))
    const rowsCap = Math.max(rowsFloor, Math.min(6, Math.floor(maxRows || 2)))
    for (let rows = rowsFloor; rows <= rowsCap; rows += 1) {
      const lines = chooseBestRowsSplit(normalizedText, rows)
      if (lines.length < 2) continue
      variants.push({
        lines,
        initialScale: Math.max(twoLineScale, baseScale * 0.75),
        minFont: minFontPx,
      })
    }
  }

  let bestVariant: { lines: string[]; fontPx: number } | null = null

  for (const variant of variants) {
    applyLines(element, variant.lines)
    setupElementBase(element, containerWidthPx, resolvedTargetHeightPx)
    element.style.fontSize = `calc(var(--tb-type-1) * ${variant.initialScale})`
    shrinkElementTextToBox(element, containerWidthPx, resolvedTargetHeightPx, variant.minFont, tolerancePx)

    if (!measureFitsBox(element, containerWidthPx, resolvedTargetHeightPx, tolerancePx)) continue

    const resolvedFontPx = Number.parseFloat(window.getComputedStyle(element).fontSize)
    const fontPx = Number.isFinite(resolvedFontPx) ? resolvedFontPx : variant.minFont

    if (!bestVariant || fontPx > bestVariant.fontPx + 0.05) {
      bestVariant = { lines: variant.lines, fontPx }
    }
  }

  if (bestVariant) {
    applyLines(element, bestVariant.lines)
    setupElementBase(element, containerWidthPx, resolvedTargetHeightPx)
    element.style.fontSize = `${bestVariant.fontPx}px`
    return
  }

  applyLines(element, [normalizedText])
  setupElementBase(element, containerWidthPx, resolvedTargetHeightPx)
  element.style.fontSize = `calc(var(--tb-type-1) * ${baseScale})`
  shrinkElementTextToBox(element, containerWidthPx, resolvedTargetHeightPx, minFontPx, tolerancePx)
}
