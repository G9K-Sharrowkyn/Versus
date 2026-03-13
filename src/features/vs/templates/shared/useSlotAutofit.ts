import { useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import type { TemplateSlotSpec } from './templateUi'

type SharedSlotProps = {
  slotKey: string
  spec: TemplateSlotSpec
  text: string
  templateId?: string
  activeFightId?: string | null
  language?: string
}

export type SlotFitMetrics = {
  finalFontPx: number
  overflowedAtBase: boolean
  overflowedAtMin: boolean
  excessChars: number
}

type UseSlotAutofitResult = {
  ref: MutableRefObject<HTMLElement | null>
  fontPx: number
  fixedHeightPx: number
  metrics: SlotFitMetrics
  dataAttributes: Record<string, string | number | boolean>
}

const FIT_STEP = 0.5
const SIZE_EPSILON = 0.05

const roundMetric = (value: number) => Math.round(value * 100) / 100

const applyFont = (element: HTMLElement, fontPx: number, spec: TemplateSlotSpec) => {
  element.style.fontSize = `${fontPx}px`
  element.style.lineHeight = `${spec.lineHeight}`
}

const measureOverflow = (element: HTMLElement) => {
  const width = Math.max(1, element.clientWidth)
  const height = Math.max(1, element.clientHeight)
  const overflowX = Math.max(0, element.scrollWidth - width)
  const overflowY = Math.max(0, element.scrollHeight - height)
  return {
    fits: overflowX <= 1 && overflowY <= 1,
    widthRatio: element.scrollWidth / width,
    heightRatio: element.scrollHeight / height,
  }
}

const estimateExcessChars = (text: string, ratio: number) => {
  if (!text.trim() || ratio <= 1) return 0
  return Math.max(1, Math.ceil(text.length * (ratio - 1)))
}

const buildDataAttributes = (
  slotKey: string,
  text: string,
  spec: TemplateSlotSpec,
  metrics: SlotFitMetrics,
  templateId?: string,
  activeFightId?: string | null,
  language?: string,
) => ({
  'data-vs-slot-key': slotKey,
  'data-vs-slot-base-font': spec.baseFontPx,
  'data-vs-slot-final-font': metrics.finalFontPx,
  'data-vs-slot-overflow-base': metrics.overflowedAtBase,
  'data-vs-slot-overflow-min': metrics.overflowedAtMin,
  'data-vs-slot-excess-chars': metrics.excessChars,
  'data-vs-slot-text-length': text.length,
  ...(templateId ? { 'data-vs-template-id': templateId } : {}),
  ...(activeFightId ? { 'data-vs-fight-id': activeFightId } : {}),
  ...(language ? { 'data-vs-language': language } : {}),
})

export function useSlotAutofit({
  slotKey,
  spec,
  text,
  templateId,
  activeFightId,
  language,
}: SharedSlotProps): UseSlotAutofitResult {
  const ref = useRef<HTMLElement | null>(null)
  const [fontPx, setFontPx] = useState(spec.baseFontPx)
  const [metrics, setMetrics] = useState<SlotFitMetrics>({
    finalFontPx: spec.baseFontPx,
    overflowedAtBase: false,
    overflowedAtMin: false,
    excessChars: 0,
  })

  const fixedHeightPx = useMemo(
    () => roundMetric(spec.baseFontPx * spec.lineHeight * spec.maxLines),
    [spec.baseFontPx, spec.lineHeight, spec.maxLines],
  )

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    let frameId = 0
    const fit = () => {
      const target = ref.current
      if (!target) return

      applyFont(target, spec.baseFontPx, spec)
      const baseMetrics = measureOverflow(target)

      let nextFontPx = spec.baseFontPx
      for (let candidate = spec.baseFontPx; candidate >= spec.minFontPx; candidate -= FIT_STEP) {
        applyFont(target, candidate, spec)
        if (measureOverflow(target).fits) {
          nextFontPx = roundMetric(candidate)
          break
        }
        nextFontPx = spec.minFontPx
      }

      applyFont(target, nextFontPx, spec)
      const finalMetrics = measureOverflow(target)
      const overflowRatio = Math.max(baseMetrics.widthRatio, baseMetrics.heightRatio)
      const nextMetrics: SlotFitMetrics = {
        finalFontPx: nextFontPx,
        overflowedAtBase: !baseMetrics.fits,
        overflowedAtMin: !finalMetrics.fits,
        excessChars: estimateExcessChars(text, overflowRatio),
      }

      setFontPx((current) => (Math.abs(current - nextFontPx) > SIZE_EPSILON ? nextFontPx : current))
      setMetrics((current) =>
        current.finalFontPx === nextMetrics.finalFontPx &&
        current.overflowedAtBase === nextMetrics.overflowedAtBase &&
        current.overflowedAtMin === nextMetrics.overflowedAtMin &&
        current.excessChars === nextMetrics.excessChars
          ? current
          : nextMetrics,
      )
    }

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(fit)
    })
    observer.observe(element)
    if (element.parentElement) observer.observe(element.parentElement)
    fit()

    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [spec, text])

  return {
    ref,
    fontPx,
    fixedHeightPx,
    metrics,
    dataAttributes: buildDataAttributes(slotKey, text, spec, metrics, templateId, activeFightId, language),
  }
}
