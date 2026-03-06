import { useEffect, useState, type RefObject } from 'react'

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
  const [previewScale, setPreviewScale] = useState(1)

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return

    const updateScale = () => {
      const availableWidth = Math.max(320, shell.clientWidth - 24)
      const availableHeight = Math.max(320, shell.clientHeight - 24)
      const scaleFromWidth = availableWidth / baseWidth
      const scaleFromHeight = availableHeight / baseHeight
      const boundedScale = Math.min(scaleFromWidth, scaleFromHeight)
      const nextScale = Math.max(minScale, Math.min(maxScale, boundedScale))
      setPreviewScale((previous) => (Math.abs(previous - nextScale) > 0.001 ? nextScale : previous))
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

  return previewScale
}
