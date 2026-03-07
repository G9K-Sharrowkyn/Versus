import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import clsx from 'clsx'
import type { PortraitAdjust } from '../types'
import { PORTRAIT_ADJUST_DEFAULT, buildAdjustableTemplateImageStyle, getTemplateImageGeometry, normalizePortraitAdjust, normalizeTemplateImageAdjust } from '../helpers'

export function AdjustableTemplateImage({
  imageUrl,
  alt,
  fallbackLabel,
  hintLabel,
  adjustKey,
  baseAdjust,
  adjustments,
  onAdjustChange,
  onAdjustCommit,
  onActivate,
  plain,
}: {
  imageUrl: string
  alt: string
  fallbackLabel: string
  hintLabel?: string
  adjustKey: string
  baseAdjust?: PortraitAdjust
  adjustments: Record<string, PortraitAdjust>
  onAdjustChange: (key: string, adjust: PortraitAdjust) => void
  onAdjustCommit: (key: string, adjust: PortraitAdjust) => void
  onActivate?: () => void
  plain?: boolean
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const imageMetricsRef = useRef({ width: 0, height: 0 })
  const dragRef = useRef<{
    pointerId: number
    mode: 'pan' | 'zoom'
    startX: number
    startY: number
    base: PortraitAdjust
    moved: boolean
  } | null>(null)
  const latestAdjustRef = useRef<PortraitAdjust>(PORTRAIT_ADJUST_DEFAULT)
  const isDraggingRef = useRef(false)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [imageNaturalSizeState, setImageNaturalSizeState] = useState({ key: '', width: 0, height: 0 })
  const [isImageReady, setIsImageReady] = useState(false)
  const imageNaturalSize = useMemo(
    () =>
      imageNaturalSizeState.key === imageUrl
        ? { width: imageNaturalSizeState.width, height: imageNaturalSizeState.height }
        : { width: 0, height: 0 },
    [imageNaturalSizeState.height, imageNaturalSizeState.key, imageNaturalSizeState.width, imageUrl],
  )

  const committedAdjust = normalizeTemplateImageAdjust(
    normalizePortraitAdjust(adjustments[adjustKey] ?? baseAdjust ?? PORTRAIT_ADJUST_DEFAULT),
  )
  const [liveAdjust, setLiveAdjust] = useState<PortraitAdjust>(committedAdjust)
  const imageGeometry = useMemo(
    () =>
      getTemplateImageGeometry(
        containerSize.width,
        containerSize.height,
        imageNaturalSize.width,
        imageNaturalSize.height,
        liveAdjust.scale,
      ),
    [containerSize.height, containerSize.width, imageNaturalSize.height, imageNaturalSize.width, liveAdjust.scale],
  )

  useEffect(() => {
    latestAdjustRef.current = liveAdjust
  }, [liveAdjust])

  useEffect(() => {
    if (isDraggingRef.current) return
    setLiveAdjust(committedAdjust)
    latestAdjustRef.current = committedAdjust
  }, [adjustKey, committedAdjust.scale, committedAdjust.x, committedAdjust.y])

  useEffect(() => {
    imageMetricsRef.current = imageNaturalSize
  }, [imageNaturalSize])

  useEffect(() => {
    imageMetricsRef.current = { width: 0, height: 0 }
    setImageNaturalSizeState({ key: '', width: 0, height: 0 })
    setIsImageReady(false)
  }, [imageUrl])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      })
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const commitAdjust = (nextAdjust: PortraitAdjust) => {
    const normalized = normalizeTemplateImageAdjust(normalizePortraitAdjust(nextAdjust))
    latestAdjustRef.current = normalized
    setLiveAdjust(normalized)
    onAdjustChange(adjustKey, normalized)
    onAdjustCommit(adjustKey, normalized)
    return normalized
  }

  const updateAdjust = (nextAdjust: PortraitAdjust) => {
    const normalized = normalizeTemplateImageAdjust(normalizePortraitAdjust(nextAdjust))
    latestAdjustRef.current = normalized
    setLiveAdjust(normalized)
    return normalized
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.button !== 2) return
    const container = containerRef.current
    if (!container) return
    event.preventDefault()
    event.stopPropagation()

    dragRef.current = {
      pointerId: event.pointerId,
      mode: event.button === 2 ? 'zoom' : 'pan',
      startX: event.clientX,
      startY: event.clientY,
      base: latestAdjustRef.current,
      moved: false,
    }
    isDraggingRef.current = true
    container.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const container = containerRef.current
    if (!drag || drag.pointerId !== event.pointerId || !container) return
    event.preventDefault()
    event.stopPropagation()

    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true

    const rect = container.getBoundingClientRect()
    const scaleX = rect.width > 0 && container.clientWidth > 0 ? rect.width / container.clientWidth : 1
    const scaleY = rect.height > 0 && container.clientHeight > 0 ? rect.height / container.clientHeight : 1
    const localDx = dx / Math.max(scaleX, 0.0001)
    const localDy = dy / Math.max(scaleY, 0.0001)

    if (drag.mode === 'pan') {
      const geometry = getTemplateImageGeometry(
        container.clientWidth,
        container.clientHeight,
        imageMetricsRef.current.width,
        imageMetricsRef.current.height,
        drag.base.scale,
      )
      const nextX =
        geometry && geometry.overflowX > 0
          ? drag.base.x - (localDx / geometry.overflowX) * 100
          : drag.base.x
      const nextY =
        geometry && geometry.overflowY > 0
          ? drag.base.y - (localDy / geometry.overflowY) * 100
          : drag.base.y
      const normalized = updateAdjust({ x: nextX, y: nextY, scale: drag.base.scale })
      drag.base = normalized
      drag.startX = event.clientX
      drag.startY = event.clientY
      return
    }

    const zoomDelta = (-localDy / Math.max(1, container.clientHeight)) * 1.6
    const normalized = updateAdjust({ x: drag.base.x, y: drag.base.y, scale: drag.base.scale + zoomDelta })
    drag.base = normalized
    drag.startX = event.clientX
    drag.startY = event.clientY
  }

  const finalizePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const container = containerRef.current
    if (!drag || drag.pointerId !== event.pointerId || !container) return
    event.preventDefault()
    event.stopPropagation()
    if (container.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
    isDraggingRef.current = false
    commitAdjust(latestAdjustRef.current)
    if (!drag.moved && drag.mode === 'pan') {
      onActivate?.()
    }
  }

  const handleContextMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  return (
    <div
      ref={containerRef}
      className={clsx(
        'group relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden select-none active:cursor-grabbing',
        plain ? 'h-full w-full' : 'rounded-lg border border-slate-500/50 bg-slate-950/70',
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finalizePointer}
      onPointerCancel={finalizePointer}
      onContextMenu={handleContextMenu}
      role="button"
      tabIndex={0}
      onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onActivate?.()
        }
      }}
    >
      {imageUrl ? (
        <img
          key={imageUrl}
          src={imageUrl}
          alt={alt}
          className="absolute block select-none"
          draggable={false}
          style={{
            ...buildAdjustableTemplateImageStyle(liveAdjust, imageGeometry),
            opacity: isImageReady ? 1 : 0,
          }}
          onLoad={(event) => {
            const target = event.currentTarget
            const nextMetrics = {
              width: target.naturalWidth,
              height: target.naturalHeight,
            }
            imageMetricsRef.current = nextMetrics
            setImageNaturalSizeState({
              key: imageUrl,
              ...nextMetrics,
            })
            setIsImageReady(true)
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-slate-400">
          {fallbackLabel}
        </div>
      )}
      {plain ? null : <div className="pointer-events-none absolute inset-0 border-[2px] border-black/35" />}
      {plain ? null : (
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.75))]" />
      )}
      {plain ? null : (
        hintLabel ? (
          <div className="pointer-events-none absolute bottom-2 left-2 rounded border border-cyan-300/35 bg-black/50 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-cyan-100 opacity-0 transition-opacity group-hover:opacity-100">
            {hintLabel}
          </div>
        ) : null
      )}
    </div>
  )
}
