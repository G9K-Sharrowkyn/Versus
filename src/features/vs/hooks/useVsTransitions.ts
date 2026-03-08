import { useEffect, useRef, useState, type MutableRefObject, type RefObject } from 'react'
import { FINAL_TEMPLATE_ID } from '../presets'
import { findFightByQuery, getViewportCenterHandoff, normalizeSearchMorphHandoff, normalizeToken } from '../helpers'
import type { FightRecord, ReverseStage, SearchMorphHandoff, TemplateId } from '../types'

type ApplyFightRecord = (
  fight: FightRecord,
  options?: { enterIntro?: boolean; preserveTemplateSelection?: boolean },
) => void

type ViewMode = 'search' | 'home' | 'fight-intro' | 'fight'

type UseVsTransitionsOptions = {
  fights: FightRecord[]
  preferredVariantByMatchup: Record<string, string>
  activeTemplate: TemplateId
  activeFightId: string | null
  templateCursor: number
  applyFightRecordRef: RefObject<ApplyFightRecord | null>
  setActiveFightId: (fightId: string | null) => void
  searchTransitioningRef: MutableRefObject<boolean>
  returnTransitioningRef: MutableRefObject<boolean>
  finalTemplateReturnDelayMs: number
  morphPowerOffMs: number
  morphRingOnMs: number
  morphFinalMs: number
  morphOverlayBufferMs: number
  introMountAtMs: number
  introRevealAtMs: number
  searchCollapseWatchdogMs: number
  reverseExplosionWatchdogMs: number
}

export function useVsTransitions({
  fights,
  preferredVariantByMatchup,
  activeTemplate,
  activeFightId,
  templateCursor,
  applyFightRecordRef,
  setActiveFightId,
  searchTransitioningRef,
  returnTransitioningRef,
  finalTemplateReturnDelayMs,
  morphPowerOffMs,
  morphRingOnMs,
  morphFinalMs,
  morphOverlayBufferMs,
  introMountAtMs,
  introRevealAtMs,
  searchCollapseWatchdogMs,
  reverseExplosionWatchdogMs,
}: UseVsTransitionsOptions) {
  const [viewMode, setViewMode] = useState<ViewMode>('search')
  const [introVisible, setIntroVisible] = useState(true)
  const [fightViewVisible, setFightViewVisible] = useState(true)
  const [searchMorphVisible, setSearchMorphVisible] = useState(false)
  const [searchMorphDirection, setSearchMorphDirection] = useState<'forward' | 'reverse'>('forward')
  const [reverseStage, setReverseStage] = useState<ReverseStage>('idle')
  const [introFlowMode, setIntroFlowMode] = useState<'forward' | 'reverse'>('forward')
  const [searchMorphHandoff, setSearchMorphHandoff] = useState<SearchMorphHandoff | null>(null)

  const searchFrameRef = useRef<HTMLIFrameElement>(null)
  const introFrameRef = useRef<HTMLIFrameElement>(null)
  const searchTransitionTimeoutsRef = useRef<number[]>([])
  const reverseTransitionTimeoutsRef = useRef<number[]>([])
  const finalTemplateAutoReturnTimeoutRef = useRef<number | null>(null)
  const searchCollapseAckedRef = useRef(false)
  const introFrameReadyRef = useRef(false)
  const introBridgeReadyRef = useRef(false)
  const searchBridgeReadyRef = useRef(false)
  const reverseExplosionDispatchPendingRef = useRef(false)
  const reversePrimePendingRef = useRef(false)
  const introRevealPendingRef = useRef(false)
  const fightViewRevealTimeoutRef = useRef<number | null>(null)
  const reverseStageRef = useRef<ReverseStage>('idle')

  const morphTotalMs = morphPowerOffMs + morphRingOnMs + morphFinalMs

  const clearFinalTemplateAutoReturnTimeout = () => {
    if (finalTemplateAutoReturnTimeoutRef.current !== null) {
      window.clearTimeout(finalTemplateAutoReturnTimeoutRef.current)
      finalTemplateAutoReturnTimeoutRef.current = null
    }
  }

  const clearSearchTransitionQueue = () => {
    for (const timeoutId of searchTransitionTimeoutsRef.current) {
      window.clearTimeout(timeoutId)
      window.clearInterval(timeoutId)
    }
    searchTransitionTimeoutsRef.current = []
    searchTransitioningRef.current = false
    searchCollapseAckedRef.current = false
    introFrameReadyRef.current = false
    introBridgeReadyRef.current = false
    searchBridgeReadyRef.current = false
    reverseExplosionDispatchPendingRef.current = false
    reversePrimePendingRef.current = false
    introRevealPendingRef.current = false
    setSearchMorphVisible(false)
    setSearchMorphDirection('forward')
    setSearchMorphHandoff(null)
  }

  const clearReturnTransitionQueue = () => {
    clearFinalTemplateAutoReturnTimeout()
    for (const timeoutId of reverseTransitionTimeoutsRef.current) {
      window.clearTimeout(timeoutId)
      window.clearInterval(timeoutId)
    }
    reverseTransitionTimeoutsRef.current = []
    returnTransitioningRef.current = false
    reverseStageRef.current = 'idle'
    introBridgeReadyRef.current = false
    searchBridgeReadyRef.current = false
    reverseExplosionDispatchPendingRef.current = false
    reversePrimePendingRef.current = false
    setReverseStage('idle')
    setIntroFlowMode('forward')
    setSearchMorphVisible(false)
    setSearchMorphDirection('forward')
    setSearchMorphHandoff(null)
  }

  const clearFightViewRevealTimeout = () => {
    if (fightViewRevealTimeoutRef.current !== null) {
      window.clearTimeout(fightViewRevealTimeoutRef.current)
      fightViewRevealTimeoutRef.current = null
    }
  }

  const triggerFightViewFadeIn = () => {
    clearFightViewRevealTimeout()
    setFightViewVisible(false)
    fightViewRevealTimeoutRef.current = window.setTimeout(() => {
      setFightViewVisible(true)
      fightViewRevealTimeoutRef.current = null
    }, 24)
  }

  const postMessageToSearchFrame = (payload: { type: string }) => {
    const target = searchFrameRef.current?.contentWindow
    if (!target || typeof window === 'undefined') return false
    target.postMessage(payload, window.location.origin)
    return true
  }

  const postMessageToIntroFrame = (payload: { type: string }) => {
    const target = introFrameRef.current?.contentWindow
    if (!target || typeof window === 'undefined') return false
    target.postMessage(payload, window.location.origin)
    return true
  }

  const runSearchMorphSequence = (handoff?: SearchMorphHandoff | null) => {
    if (!searchTransitioningRef.current || searchCollapseAckedRef.current) return
    searchCollapseAckedRef.current = true

    setSearchMorphHandoff(handoff ?? getViewportCenterHandoff())
    setSearchMorphDirection('forward')
    setSearchMorphVisible(true)
    reverseStageRef.current = 'idle'
    setReverseStage('idle')

    const introMountTimeout = window.setTimeout(() => {
      setIntroFlowMode('forward')
      setViewMode('fight-intro')
      setIntroVisible(false)
      introFrameReadyRef.current = false
      introRevealPendingRef.current = false
    }, introMountAtMs)

    const introRevealTimeout = window.setTimeout(() => {
      if (introFrameReadyRef.current) {
        setIntroVisible(true)
      } else {
        introRevealPendingRef.current = true
      }
    }, introRevealAtMs)

    const hideMorphTimeout = window.setTimeout(() => {
      setSearchMorphVisible(false)
      setSearchMorphDirection('forward')
      searchTransitioningRef.current = false
      searchCollapseAckedRef.current = false
    }, morphTotalMs + morphOverlayBufferMs)

    searchTransitionTimeoutsRef.current.push(introMountTimeout, introRevealTimeout, hideMorphTimeout)
  }

  const startSearchFightTransition = (fight: FightRecord) => {
    if (searchTransitioningRef.current) return
    clearReturnTransitionQueue()
    clearSearchTransitionQueue()
    searchTransitioningRef.current = true
    applyFightRecordRef.current?.(fight, { enterIntro: false })
    postMessageToSearchFrame({ type: 'vvv-search-collapse' })
    introFrameReadyRef.current = false
    introRevealPendingRef.current = false
    setIntroFlowMode('forward')
    setIntroVisible(false)

    const collapseWatchdogTimeout = window.setTimeout(() => {
      runSearchMorphSequence(null)
    }, searchCollapseWatchdogMs)

    searchTransitionTimeoutsRef.current.push(collapseWatchdogTimeout)
  }

  const completeReverseMorphToSearch = (handoff?: SearchMorphHandoff | null) => {
    if (!returnTransitioningRef.current || reverseStageRef.current !== 'morph-reverse') return

    if (handoff) {
      setSearchMorphHandoff(handoff)
    }
    reversePrimePendingRef.current = false
    reverseStageRef.current = 'search-expand'
    setReverseStage('search-expand')

    const hideMorphDelayMs = morphTotalMs + morphOverlayBufferMs

    const hideMorphTimeout = window.setTimeout(() => {
      if (!returnTransitioningRef.current) return
      setSearchMorphVisible(false)
      setSearchMorphDirection('forward')
      setSearchMorphHandoff(null)
    }, hideMorphDelayMs)

    const expandSearchTimeout = window.setTimeout(() => {
      if (!returnTransitioningRef.current) return
      window.requestAnimationFrame(() => {
        if (!returnTransitioningRef.current) return
        postMessageToSearchFrame({ type: 'vvv-search-expand' })
      })
    }, hideMorphDelayMs)

    const finalizeReverseTimeout = window.setTimeout(() => {
      if (!returnTransitioningRef.current) return
      reverseStageRef.current = 'idle'
      setReverseStage('idle')
      returnTransitioningRef.current = false
      reverseTransitionTimeoutsRef.current = []
      setFightViewVisible(true)
    }, hideMorphDelayMs + 180)

    reverseTransitionTimeoutsRef.current.push(hideMorphTimeout, expandSearchTimeout, finalizeReverseTimeout)
  }

  const startReverseMorphToSearch = () => {
    if (!returnTransitioningRef.current || reverseStageRef.current !== 'explosion') return
    reverseExplosionDispatchPendingRef.current = false
    reverseStageRef.current = 'morph-reverse'
    setReverseStage('morph-reverse')
    setSearchMorphDirection('reverse')
    setSearchMorphHandoff(getViewportCenterHandoff())
    setSearchMorphVisible(true)
    searchBridgeReadyRef.current = false
    reversePrimePendingRef.current = true
    setViewMode('search')
    setIntroVisible(true)

    const primeReadyWatchdogTimeout = window.setTimeout(() => {
      if (!returnTransitioningRef.current) return
      if (reverseStageRef.current !== 'morph-reverse') return
      if (!reversePrimePendingRef.current) return
      postMessageToSearchFrame({ type: 'vvv-search-prime-collapsed' })
    }, 1200)

    const primeWatchdogTimeout = window.setTimeout(() => {
      if (!returnTransitioningRef.current) return
      completeReverseMorphToSearch(null)
    }, searchCollapseWatchdogMs)

    reverseTransitionTimeoutsRef.current.push(primeReadyWatchdogTimeout, primeWatchdogTimeout)
  }

  const tryDispatchReverseExplosion = () => {
    if (!returnTransitioningRef.current) return
    if (reverseStageRef.current !== 'explosion') return
    if (!reverseExplosionDispatchPendingRef.current) return
    const sent = postMessageToIntroFrame({ type: 'vvv-aaa-play-reverse-explosion' })
    if (!sent) return
    setIntroVisible(true)
  }

  const tryDispatchReversePrime = () => {
    if (!returnTransitioningRef.current) return
    if (reverseStageRef.current !== 'morph-reverse') return
    if (!reversePrimePendingRef.current) return
    postMessageToSearchFrame({ type: 'vvv-search-prime-collapsed' })
  }

  const startFightReturnTransition = () => {
    if (returnTransitioningRef.current) return
    clearSearchTransitionQueue()
    clearReturnTransitionQueue()
    returnTransitioningRef.current = true
    reverseStageRef.current = 'explosion'
    setReverseStage('explosion')
    setFightViewVisible(false)
    setIntroFlowMode('reverse')
    setIntroVisible(false)
    introFrameReadyRef.current = false
    introBridgeReadyRef.current = false
    reverseExplosionDispatchPendingRef.current = true
    introRevealPendingRef.current = false
    setViewMode('fight-intro')

    const reverseDispatchTimeout = window.setTimeout(() => {
      tryDispatchReverseExplosion()
    }, 50)
    const reverseDispatchPump = window.setInterval(() => {
      if (!returnTransitioningRef.current || reverseStageRef.current !== 'explosion') return
      if (!reverseExplosionDispatchPendingRef.current) return
      tryDispatchReverseExplosion()
    }, 180)
    const reverseExplosionWatchdog = window.setTimeout(() => {
      if (!returnTransitioningRef.current || reverseStageRef.current !== 'explosion') return
      reverseExplosionDispatchPendingRef.current = false
      startReverseMorphToSearch()
    }, reverseExplosionWatchdogMs)

    reverseTransitionTimeoutsRef.current.push(
      reverseDispatchTimeout,
      reverseDispatchPump,
      reverseExplosionWatchdog,
    )
  }

  const goBackToLibrary = () => {
    clearReturnTransitionQueue()
    clearSearchTransitionQueue()
    clearFightViewRevealTimeout()
    setFightViewVisible(true)
    setViewMode('home')
    setActiveFightId(null)
  }

  const handleIntroFrameLoad = () => {
    introFrameReadyRef.current = true

    if (returnTransitioningRef.current && reverseStageRef.current === 'explosion') {
      tryDispatchReverseExplosion()
      return
    }

    if (introRevealPendingRef.current) {
      introRevealPendingRef.current = false
      setIntroVisible(true)
    }
  }

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (typeof window === 'undefined') return
      if (event.origin !== window.location.origin) return
      const payload = event.data
      if (!payload || typeof payload !== 'object') return

      const typed = payload as { type?: unknown; query?: unknown; handoff?: unknown }

      if (typed.type === 'vvv-aaa-ready') {
        introBridgeReadyRef.current = true
        if (returnTransitioningRef.current && reverseStageRef.current === 'explosion') {
          tryDispatchReverseExplosion()
        }
        return
      }

      if (typed.type === 'vvv-aaa-complete') {
        if (returnTransitioningRef.current) return
        clearSearchTransitionQueue()
        triggerFightViewFadeIn()
        setViewMode('fight')
        return
      }

      if (typed.type === 'vvv-aaa-reverse-explosion-done') {
        if (!returnTransitioningRef.current || reverseStageRef.current !== 'explosion') return
        reverseExplosionDispatchPendingRef.current = false
        startReverseMorphToSearch()
        return
      }

      if (typed.type === 'vvv-search-collapsed') {
        if (returnTransitioningRef.current) return
        runSearchMorphSequence(normalizeSearchMorphHandoff(typed.handoff))
        return
      }

      if (typed.type === 'vvv-search-ready') {
        searchBridgeReadyRef.current = true
        if (returnTransitioningRef.current && reverseStageRef.current === 'morph-reverse') {
          tryDispatchReversePrime()
        }
        return
      }

      if (typed.type === 'vvv-search-primed') {
        if (!returnTransitioningRef.current || reverseStageRef.current !== 'morph-reverse') return
        reversePrimePendingRef.current = false
        completeReverseMorphToSearch(normalizeSearchMorphHandoff(typed.handoff))
        return
      }

      if (typed.type !== 'vvv-search-submit' || typeof typed.query !== 'string') return
      const rawQuery = typed.query.trim()
      if (!rawQuery) return

      const token = normalizeToken(rawQuery)
      if (token === 'add' || token === 'dodaj') {
        clearSearchTransitionQueue()
        setIntroVisible(true)
        setViewMode('home')
        setActiveFightId(null)
        return
      }

      const match = findFightByQuery(fights, rawQuery, preferredVariantByMatchup)
      if (!match) return
      startSearchFightTransition(match)
    }

    window.addEventListener('message', onMessage)

    return () => {
      window.removeEventListener('message', onMessage)
      clearFightViewRevealTimeout()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fights, preferredVariantByMatchup])

  useEffect(
    () => () => {
      clearSearchTransitionQueue()
      clearReturnTransitionQueue()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useEffect(() => {
    clearFinalTemplateAutoReturnTimeout()
    if (viewMode !== 'fight' || activeTemplate !== FINAL_TEMPLATE_ID) return
    if (returnTransitioningRef.current) return

    finalTemplateAutoReturnTimeoutRef.current = window.setTimeout(() => {
      startFightReturnTransition()
    }, finalTemplateReturnDelayMs)

    return () => {
      clearFinalTemplateAutoReturnTimeout()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTemplate, activeFightId, templateCursor, viewMode, finalTemplateReturnDelayMs])

  return {
    viewMode,
    setViewMode,
    introVisible,
    setIntroVisible,
    fightViewVisible,
    searchMorphVisible,
    searchMorphDirection,
    reverseStage,
    introFlowMode,
    searchMorphHandoff,
    searchFrameRef,
    introFrameRef,
    clearSearchTransitionQueue,
    clearFinalTemplateAutoReturnTimeout,
    clearReturnTransitionQueue,
    clearFightViewRevealTimeout,
    startFightReturnTransition,
    goBackToLibrary,
    handleIntroFrameLoad,
  }
}
