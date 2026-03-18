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

    // SVG blade cursor:
    // - Left spine: vertical line x=3 from tip (3,3) down to (3,30)
    // - V-tail: (3,30)→(8,38)→(16,30)→(24,38)
    // - Shoulder crossing line: (24,38)→(16,16)→(30,16) ← visible horizontal "seam"
    // - Z closes: (30,16)→(3,3) = the top diagonal outer edge
    // Two paths: dark fill body + animated cyan stroke (only stroke pulses)
    layer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
  <path class="vvv-cursor-body"
    d="M3,3 L3,30 L8,38 L16,30 L24,38 L16,16 L30,16 Z"
    fill="#070a10" stroke="none"/>
  <path class="vvv-cursor-stroke"
    d="M3,3 L3,30 L8,38 L16,30 L24,38 L16,16 L30,16 Z"
    fill="none" stroke="#00e5ff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
</svg>`

    document.body.appendChild(layer)

    let targetX = window.innerWidth * 0.5
    let targetY = window.innerHeight * 0.5
    let activeRelaySource: PointerRelaySource | null = null
    let relayPriorityUntil = 0
    layer.style.transform = `translate3d(${targetX - 3}px, ${targetY - 3}px, 0)`
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
      layer.style.transform = `translate3d(${x - 3}px, ${y - 3}px, 0)`
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
