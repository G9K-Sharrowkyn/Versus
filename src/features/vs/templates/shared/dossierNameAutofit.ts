export type DossierNameAutofitConfig = {
  baseScale: number
  twoLineScale: number
  oneLineMinScale: number
  minFontPx: number
  tolerancePx?: number
}

type ApplyDossierNameAutofitArgs = {
  element: HTMLElement
  container: HTMLElement
  sourceText: string
  config: DossierNameAutofitConfig
}

const DEFAULT_TOLERANCE_PX = 0.5
const DOSSIER_NAME_LINE_HEIGHT = 0.9

const splitNameForTwoRows = (name: string): [string, string] => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length < 2) return [name.trim(), '']

  let bestIndex = 1
  let bestScore = Number.POSITIVE_INFINITY
  for (let index = 1; index < words.length; index += 1) {
    const first = words.slice(0, index).join(' ')
    const second = words.slice(index).join(' ')
    const score = Math.abs(first.length - second.length)
    if (score < bestScore) {
      bestScore = score
      bestIndex = index
    }
  }

  return [words.slice(0, bestIndex).join(' '), words.slice(bestIndex).join(' ')]
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
  } = config

  const normalizedText = sourceText.trim()
  const containerStyles = window.getComputedStyle(container)
  const paddingLeftPx = Number.parseFloat(containerStyles.paddingLeft || '0') || 0
  const paddingRightPx = Number.parseFloat(containerStyles.paddingRight || '0') || 0
  const localContainerWidthPx = container.clientWidth > 0
    ? container.clientWidth - paddingLeftPx - paddingRightPx
    : container.getBoundingClientRect().width - paddingLeftPx - paddingRightPx
  const containerWidthPx = Math.max(10, localContainerWidthPx)

  element.textContent = sourceText
  element.style.display = 'inline-block'
  element.style.width = 'auto'
  element.style.maxWidth = `${containerWidthPx}px`
  element.style.whiteSpace = 'nowrap'
  element.style.wordBreak = 'normal'
  element.style.overflowWrap = 'normal'
  element.style.lineHeight = `${DOSSIER_NAME_LINE_HEIGHT}`
  element.style.fontSize = `calc(var(--tb-type-1) * ${baseScale})`

  const baseFontPx = Number.parseFloat(window.getComputedStyle(element).fontSize)
  const targetHeightPx = Math.max(
    8,
    (Number.isFinite(baseFontPx) ? baseFontPx : minFontPx) * DOSSIER_NAME_LINE_HEIGHT,
  )
  element.style.height = `${targetHeightPx}px`
  element.style.maxHeight = `${targetHeightPx}px`
  element.style.minHeight = `${targetHeightPx}px`

  if (measureFitsBox(element, containerWidthPx, targetHeightPx, tolerancePx)) return

  const oneLineMinFontPx = Number.isFinite(baseFontPx)
    ? Math.max(minFontPx, baseFontPx * oneLineMinScale)
    : minFontPx
  shrinkElementTextToBox(element, containerWidthPx, targetHeightPx, oneLineMinFontPx, tolerancePx)
  if (measureFitsBox(element, containerWidthPx, targetHeightPx, tolerancePx)) return

  if (/\s/.test(normalizedText)) {
    const [lineA, lineB] = splitNameForTwoRows(sourceText)
    if (lineB) {
      element.textContent = `${lineA}\n${lineB}`
      element.style.whiteSpace = 'pre'
      element.style.lineHeight = `${DOSSIER_NAME_LINE_HEIGHT}`
      element.style.fontSize = `calc(var(--tb-type-1) * ${twoLineScale})`
      element.style.maxWidth = `${containerWidthPx}px`
      shrinkElementTextToBox(element, containerWidthPx, targetHeightPx, minFontPx, tolerancePx)
      return
    }
  }

  element.textContent = sourceText
  element.style.whiteSpace = 'nowrap'
  element.style.lineHeight = `${DOSSIER_NAME_LINE_HEIGHT}`
  element.style.fontSize = `calc(var(--tb-type-1) * ${baseScale})`
  element.style.maxWidth = `${containerWidthPx}px`
  shrinkElementTextToBox(element, containerWidthPx, targetHeightPx, minFontPx, tolerancePx)
}
