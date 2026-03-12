import { useLayoutEffect, useState, type RefObject } from 'react'

type UsePreviewScaleOptions = {
  shellRef: RefObject<HTMLDivElement | null>
  viewMode: string
  baseWidth: number
  baseHeight: number
  minScale: number
  maxScale: number
}

export function usePreviewScale({
  shellRef,
  viewMode,
  baseWidth,
  baseHeight,
  minScale,
  maxScale,
}: UsePreviewScaleOptions) {
  const quantizeScale = (value: number) => Math.round(value * 1000) / 1000
  const [previewScale, setPreviewScale] = useState(quantizeScale(minScale))
  const [previewScaleReady, setPreviewScaleReady] = useState(false)

  useLayoutEffect(() => {
    const shell = shellRef.current
    if (!shell) return

    const updateScale = () => {
      const availableWidth = Math.max(320, shell.clientWidth - 24)
      const availableHeight = Math.max(320, shell.clientHeight - 24)
      const scaleFromWidth = availableWidth / baseWidth
      const scaleFromHeight = availableHeight / baseHeight
      const boundedScale = Math.min(scaleFromWidth, scaleFromHeight)
      const nextScale = quantizeScale(Math.max(minScale, Math.min(maxScale, boundedScale)))
      setPreviewScale((previous) => (Math.abs(previous - nextScale) > 0.001 ? nextScale : previous))
      setPreviewScaleReady(true)
    }

    updateScale()

    const observer = new ResizeObserver(updateScale)
    observer.observe(shell)
    window.addEventListener('resize', updateScale)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateScale)
    }
  }, [baseHeight, baseWidth, maxScale, minScale, shellRef, viewMode])

  return {
    previewScale,
    previewScaleReady,
  }
}
