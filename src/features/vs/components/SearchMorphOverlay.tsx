import clsx from 'clsx'
import { createPortal } from 'react-dom'
import { getViewportCenterHandoff } from '../helpers'
import { DEFAULT_MORPH_SIZE, MORPH_ORIGIN_SIZE_SHRINK_PX } from '../presets'
import type { SearchMorphHandoff } from '../types'

type SearchMorphOverlayProps = {
  visible: boolean
  direction: 'forward' | 'reverse'
  handoff?: SearchMorphHandoff | null
}

export function SearchMorphOverlay({
  visible,
  direction,
  handoff,
}: SearchMorphOverlayProps) {
  if (!visible || typeof document === 'undefined') return null

  const morphHandoff = handoff ?? getViewportCenterHandoff()
  const morphOriginSize = Math.max(
    28,
    Math.min(
      120,
      ((morphHandoff.width + morphHandoff.height) / 2 || DEFAULT_MORPH_SIZE) - MORPH_ORIGIN_SIZE_SHRINK_PX,
    ),
  )
  const anchorStyle = {
    '--vvv-origin-x': `${morphHandoff.x}px`,
    '--vvv-origin-y': `${morphHandoff.y}px`,
    '--vvv-origin-size': `${morphOriginSize}px`,
  } as Record<string, string>

  return createPortal(
    <div
      className={clsx(
        'vvv-morph-stage is-running pointer-events-none fixed inset-0 z-[2147483647]',
        direction === 'reverse' && 'is-reverse',
      )}
    >
      <div className="vvv-logo-morph-anchor" style={anchorStyle}>
        <div
          className={clsx('vvv-logo-morph is-running', direction === 'reverse' && 'is-reverse')}
          aria-hidden="true"
        >
          <div className="vvv-logo-morph__electric" />
          <div className="vvv-logo-morph__ring" />
          <div className="vvv-logo-morph__core" />
          <div className="vvv-logo-morph__logo" />
        </div>
      </div>
    </div>,
    document.body,
  )
}
