import { useEffect, type RefObject } from 'react'
import { normalizePointerRelayPayload } from '../helpers'
import type { PointerRelayPayload, PointerRelaySource } from '../types'

type UseAnimatedCursorOptions = {
  searchFrameRef: RefObject<HTMLIFrameElement | null>
  introFrameRef: RefObject<HTMLIFrameElement | null>
}

export function useAnimatedCursor({ searchFrameRef, introFrameRef }: UseAnimatedCursorOptions) {
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return

    const root = document.documentElement
    root.classList.add('vvv-animated-cursor')

    const layer = document.createElement('div')
    layer.className = 'vvv-animated-cursor-layer'
    layer.setAttribute('aria-hidden', 'true')

    // Cursor path from cursor.css (24×24 viewBox, classic arrow with rounded corners)
    // Hotspot at tip ≈ (5.5, 3) → displayed at 36×36 → offset (-8, -4)
    const d = 'M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z'
    layer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
  <path class="vvv-cursor-body" d="${d}" fill="#070a10" stroke="none"/>
  <path class="vvv-cursor-stroke" d="${d}" fill="none" stroke="#00e5ff" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
</svg>`

    document.body.appendChild(layer)

    let targetX = window.innerWidth * 0.5
    let targetY = window.innerHeight * 0.5
    let activeRelaySource: PointerRelaySource | null = null
    let relayPriorityUntil = 0
    layer.style.transform = `translate3d(${targetX - 8}px, ${targetY - 4}px, 0)`
    layer.classList.add('is-visible')

    const resolveRelayFrame = (source: PointerRelaySource): HTMLIFrameElement | null => {
      if (source === 'search') return searchFrameRef.current
      return introFrameRef.current
    }

    const mapRelayPosition = (relay: PointerRelayPayload): { x: number; y: number } | null => {
      const frame = resolveRelayFrame(relay.source)
      if (!frame) return null
      const rect = frame.getBoundingClientRect()
      return {
        x: rect.left + relay.x,
        y: rect.top + relay.y,
      }
    }

    const syncPosition = (x: number, y: number) => {
      layer.style.transform = `translate3d(${x - 8}px, ${y - 4}px, 0)`
    }

    const applyTarget = (x: number, y: number, source?: PointerRelaySource) => {
      targetX = x
      targetY = y
      layer.classList.add('is-visible')
      if (source) {
        activeRelaySource = source
        relayPriorityUntil = performance.now() + 48
      }
      syncPosition(x, y)
    }

    const onPointerMove = (event: PointerEvent) => {
      const now = performance.now()
      if (activeRelaySource && now < relayPriorityUntil) return
      activeRelaySource = null
      relayPriorityUntil = 0
      applyTarget(event.clientX, event.clientY)
    }

    const onPointerRelayMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const relay = normalizePointerRelayPayload(event.data)
      if (!relay) return
      const mapped = mapRelayPosition(relay)
      if (!mapped) return

      applyTarget(mapped.x, mapped.y, relay.source)
      if (relay.event === 'down' || relay.down === true) {
        layer.classList.add('is-down')
        return
      }
      if (relay.event === 'up' || relay.event === 'leave' || relay.down === false) {
        layer.classList.remove('is-down')
      }
    }

    const onPointerDown = () => {
      layer.classList.add('is-visible')
      layer.classList.add('is-down')
    }

    const onPointerUp = () => layer.classList.remove('is-down')

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
    window.addEventListener('pointercancel', onPointerUp, { passive: true })
    window.addEventListener('message', onPointerRelayMessage)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      window.removeEventListener('message', onPointerRelayMessage)
      layer.remove()
      root.classList.remove('vvv-animated-cursor')
    }
  }, [introFrameRef, searchFrameRef])
}
