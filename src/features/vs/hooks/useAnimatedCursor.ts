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

    const glow = document.createElement('span')
    glow.className = 'vvv-animated-cursor-glow'
    const core = document.createElement('span')
    core.className = 'vvv-animated-cursor-core'
    layer.append(glow, core)
    document.body.appendChild(layer)

    let targetX = window.innerWidth * 0.5
    let targetY = window.innerHeight * 0.5
    let currentX = targetX
    let currentY = targetY
    let rafId = 0
    let relayRafId = 0
    let queuedRelay: PointerRelayPayload | null = null
    let activeRelaySource: PointerRelaySource | null = null
    let relayPriorityUntil = 0
    layer.style.transform = `translate3d(${currentX - 2}px, ${currentY - 2}px, 0)`
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

    const render = () => {
      currentX += (targetX - currentX) * 0.42
      currentY += (targetY - currentY) * 0.42
      layer.style.transform = `translate3d(${currentX - 2}px, ${currentY - 2}px, 0)`

      if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
        rafId = window.requestAnimationFrame(render)
      } else {
        rafId = 0
      }
    }

    const schedule = () => {
      if (!rafId) rafId = window.requestAnimationFrame(render)
    }

    const applyTarget = (x: number, y: number, source?: PointerRelaySource) => {
      targetX = x
      targetY = y
      layer.classList.add('is-visible')
      if (source) {
        activeRelaySource = source
        relayPriorityUntil = performance.now() + 96
      }
      schedule()
    }

    const flushRelay = () => {
      relayRafId = 0
      const relay = queuedRelay
      queuedRelay = null
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
      queuedRelay = relay
      if (!relayRafId) relayRafId = window.requestAnimationFrame(flushRelay)
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
      if (rafId) window.cancelAnimationFrame(rafId)
      if (relayRafId) window.cancelAnimationFrame(relayRafId)
      layer.remove()
      root.classList.remove('vvv-animated-cursor')
    }
  }, [introFrameRef, searchFrameRef])
}
