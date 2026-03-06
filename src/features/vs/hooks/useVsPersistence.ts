import { useEffect, useRef, useState, type MutableRefObject, type RefObject } from 'react'
import {
  LEGACY_ACTIVE_FIGHT_STORAGE_KEY,
  LEGACY_FIGHTS_STORAGE_KEY,
  LEGACY_MATCHUP_VARIANT_PREFS_KEY,
  META_MATCHUP_VARIANT_PREFS_KEY,
} from '../presets'
import {
  buildFightRefreshSignature,
  fetchFolderFightsFromApi,
  idbGetActiveFightId,
  idbGetMetaString,
  idbReadAllFights,
  idbSaveAllFights,
  idbSetActiveFightId,
  idbSetMetaString,
  mergeScannedFolderFights,
  normalizePersistedFight,
  normalizeVariantPrefsMap,
  sanitizePreferredVariantPrefs,
} from '../storage'
import type { FightRecord } from '../types'

type ApplyFightRecord = (
  fight: FightRecord,
  options?: { enterIntro?: boolean; preserveTemplateSelection?: boolean },
) => void

type UseVsPersistenceOptions = {
  applyFightRecordRef: RefObject<ApplyFightRecord | null>
  searchTransitioningRef: MutableRefObject<boolean>
  returnTransitioningRef: MutableRefObject<boolean>
  fightScanPollMs: number
}

export function useVsPersistence({
  applyFightRecordRef,
  searchTransitioningRef,
  returnTransitioningRef,
  fightScanPollMs,
}: UseVsPersistenceOptions) {
  const [fights, setFights] = useState<FightRecord[]>([])
  const [folderScanWarnings, setFolderScanWarnings] = useState<string[]>([])
  const [preferredVariantByMatchup, setPreferredVariantByMatchup] = useState<Record<string, string>>({})
  const [activeFightId, setActiveFightId] = useState<string | null>(null)
  const [storageReady, setStorageReady] = useState(false)

  const fightsRef = useRef<FightRecord[]>([])
  const activeFightIdRef = useRef<string | null>(null)
  const preferredVariantByMatchupRef = useRef<Record<string, string>>({})
  const folderScanWarningsRef = useRef<string[]>([])
  const activeFightSignatureRef = useRef('')

  useEffect(() => {
    fightsRef.current = fights
  }, [fights])

  useEffect(() => {
    activeFightIdRef.current = activeFightId
    if (!activeFightId) {
      activeFightSignatureRef.current = ''
    }
  }, [activeFightId])

  useEffect(() => {
    preferredVariantByMatchupRef.current = preferredVariantByMatchup
  }, [preferredVariantByMatchup])

  useEffect(() => {
    folderScanWarningsRef.current = folderScanWarnings
  }, [folderScanWarnings])

  useEffect(() => {
    const validById = new Set(fights.map((fight) => fight.id))
    const validMatchups = new Set(fights.map((fight) => fight.matchupKey))

    setPreferredVariantByMatchup((current) => {
      let changed = false
      const next: Record<string, string> = {}

      Object.entries(current).forEach(([matchupKey, fightId]) => {
        if (!validMatchups.has(matchupKey)) {
          changed = true
          return
        }
        if (!validById.has(fightId)) {
          changed = true
          return
        }
        next[matchupKey] = fightId
      })

      return changed ? next : current
    })
  }, [fights])

  useEffect(() => {
    let mounted = true

    const restorePersistedFights = async () => {
      let restoredFights: FightRecord[] = []
      let restoredActiveFightId: string | null = null
      let restoredVariantPrefs: Record<string, string> = {}
      let idbAvailable = typeof window !== 'undefined' && 'indexedDB' in window

      if (idbAvailable) {
        try {
          restoredFights = await idbReadAllFights()
          restoredActiveFightId = await idbGetActiveFightId()
          const rawVariantPrefs = await idbGetMetaString(META_MATCHUP_VARIANT_PREFS_KEY)
          if (rawVariantPrefs) {
            try {
              restoredVariantPrefs = normalizeVariantPrefsMap(JSON.parse(rawVariantPrefs))
            } catch {
              restoredVariantPrefs = {}
            }
          }
        } catch {
          idbAvailable = false
        }
      }

      if (!restoredFights.length) {
        try {
          const serialized = localStorage.getItem(LEGACY_FIGHTS_STORAGE_KEY)
          if (serialized) {
            const parsed = JSON.parse(serialized)
            if (Array.isArray(parsed)) {
              restoredFights = parsed
                .map((item, index) => normalizePersistedFight(item, index))
                .filter((item): item is FightRecord => Boolean(item))
            }
          }

          const savedActiveFightId = localStorage.getItem(LEGACY_ACTIVE_FIGHT_STORAGE_KEY)
          if (savedActiveFightId && restoredFights.some((fight) => fight.id === savedActiveFightId)) {
            restoredActiveFightId = savedActiveFightId
          }

          const savedVariantPrefs = localStorage.getItem(LEGACY_MATCHUP_VARIANT_PREFS_KEY)
          if (savedVariantPrefs) {
            restoredVariantPrefs = normalizeVariantPrefsMap(JSON.parse(savedVariantPrefs))
          }
        } catch {
          // Ignore invalid legacy storage payloads.
        }

        if (idbAvailable && restoredFights.length) {
          try {
            await idbSaveAllFights(restoredFights)
            await idbSetActiveFightId(restoredActiveFightId)
            await idbSetMetaString(
              META_MATCHUP_VARIANT_PREFS_KEY,
              Object.keys(restoredVariantPrefs).length ? JSON.stringify(restoredVariantPrefs) : null,
            )
            localStorage.removeItem(LEGACY_FIGHTS_STORAGE_KEY)
            localStorage.removeItem(LEGACY_ACTIVE_FIGHT_STORAGE_KEY)
            localStorage.removeItem(LEGACY_MATCHUP_VARIANT_PREFS_KEY)
          } catch {
            // Ignore migration write failures.
          }
        }
      }

      if (restoredActiveFightId && !restoredFights.some((fight) => fight.id === restoredActiveFightId)) {
        restoredActiveFightId = null
      }

      let mergedFights = restoredFights
      let scanWarnings: string[] = []
      try {
        const scanned = await fetchFolderFightsFromApi()
        scanWarnings = scanned.warnings
        if (scanWarnings.length) console.warn('[vs-fights-scan]', scanWarnings)
        mergedFights = mergeScannedFolderFights(restoredFights, scanned.fights)
      } catch (error) {
        scanWarnings = [String(error)]
        console.warn('[vs-fights-scan] Folder scan failed, using persisted fights.', error)
      }

      if (restoredActiveFightId && !mergedFights.some((fight) => fight.id === restoredActiveFightId)) {
        restoredActiveFightId = null
      }

      const sanitizedVariantPrefs = sanitizePreferredVariantPrefs(mergedFights, restoredVariantPrefs)

      if (!mounted) return

      setFights(mergedFights)
      setFolderScanWarnings(scanWarnings)
      setPreferredVariantByMatchup(sanitizedVariantPrefs)
      setActiveFightId(restoredActiveFightId)

      const restoredActiveFight = restoredActiveFightId
        ? mergedFights.find((fight) => fight.id === restoredActiveFightId) || null
        : null

      if (restoredActiveFight) {
        applyFightRecordRef.current?.(restoredActiveFight, { enterIntro: false })
      }

      setStorageReady(true)
    }

    void restorePersistedFights()

    return () => {
      mounted = false
    }
  }, [applyFightRecordRef])

  useEffect(() => {
    if (!storageReady || typeof window === 'undefined') return

    let disposed = false
    let inFlight = false

    const refreshFolderFights = async () => {
      if (disposed || inFlight || searchTransitioningRef.current || returnTransitioningRef.current) return

      inFlight = true
      try {
        const scanned = await fetchFolderFightsFromApi()
        if (disposed) return

        const currentFights = fightsRef.current
        const mergedFights = mergeScannedFolderFights(currentFights, scanned.fights)
        const nextWarnings = scanned.warnings
        const currentWarningsSignature = JSON.stringify(folderScanWarningsRef.current)
        const nextWarningsSignature = JSON.stringify(nextWarnings)
        const currentFolderSignature = JSON.stringify(
          currentFights.filter((fight) => fight.source === 'folder').map(buildFightRefreshSignature),
        )
        const nextFolderSignature = JSON.stringify(
          mergedFights.filter((fight) => fight.source === 'folder').map(buildFightRefreshSignature),
        )
        const sanitizedPrefs = sanitizePreferredVariantPrefs(
          mergedFights,
          preferredVariantByMatchupRef.current,
        )
        const currentPrefsSignature = JSON.stringify(preferredVariantByMatchupRef.current)
        const nextPrefsSignature = JSON.stringify(sanitizedPrefs)

        if (currentFolderSignature !== nextFolderSignature) {
          setFights(mergedFights)
        }
        if (currentWarningsSignature !== nextWarningsSignature) {
          setFolderScanWarnings(nextWarnings)
        }
        if (currentPrefsSignature !== nextPrefsSignature) {
          setPreferredVariantByMatchup(sanitizedPrefs)
        }

        const currentFightId = activeFightIdRef.current
        const nextActiveFight = currentFightId ? mergedFights.find((fight) => fight.id === currentFightId) || null : null
        const nextActiveSignature = buildFightRefreshSignature(nextActiveFight)

        if (
          nextActiveFight &&
          nextActiveFight.source === 'folder' &&
          activeFightSignatureRef.current !== nextActiveSignature
        ) {
          activeFightSignatureRef.current = nextActiveSignature
          applyFightRecordRef.current?.(nextActiveFight, {
            enterIntro: false,
            preserveTemplateSelection: true,
          })
        }
      } catch (error) {
        if (!disposed) {
          console.warn('[vs-fights-live-refresh] Folder scan failed.', error)
        }
      } finally {
        inFlight = false
      }
    }

    void refreshFolderFights()
    const intervalId = window.setInterval(refreshFolderFights, fightScanPollMs)

    return () => {
      disposed = true
      window.clearInterval(intervalId)
    }
  }, [applyFightRecordRef, fightScanPollMs, returnTransitioningRef, searchTransitioningRef, storageReady])

  useEffect(() => {
    if (!storageReady) return

    const persistFights = async () => {
      if (typeof window === 'undefined') return
      if ('indexedDB' in window) {
        try {
          await idbSaveAllFights(fights)
          return
        } catch {
          // Fall back to legacy storage.
        }
      }
      try {
        localStorage.setItem(LEGACY_FIGHTS_STORAGE_KEY, JSON.stringify(fights))
      } catch {
        // Ignore storage write failures.
      }
    }

    void persistFights()
  }, [fights, storageReady])

  useEffect(() => {
    if (!storageReady) return

    const persistActiveFight = async () => {
      if (typeof window === 'undefined') return
      if ('indexedDB' in window) {
        try {
          await idbSetActiveFightId(activeFightId)
          return
        } catch {
          // Fall back to legacy storage.
        }
      }

      try {
        if (activeFightId) {
          localStorage.setItem(LEGACY_ACTIVE_FIGHT_STORAGE_KEY, activeFightId)
          return
        }
        localStorage.removeItem(LEGACY_ACTIVE_FIGHT_STORAGE_KEY)
      } catch {
        // Ignore storage write failures.
      }
    }

    void persistActiveFight()
  }, [activeFightId, storageReady])

  useEffect(() => {
    if (!storageReady) return

    const persistVariantPrefs = async () => {
      if (typeof window === 'undefined') return
      const serialized =
        Object.keys(preferredVariantByMatchup).length ? JSON.stringify(preferredVariantByMatchup) : null

      if ('indexedDB' in window) {
        try {
          await idbSetMetaString(META_MATCHUP_VARIANT_PREFS_KEY, serialized)
          return
        } catch {
          // Fall back to legacy storage.
        }
      }

      try {
        if (serialized) {
          localStorage.setItem(LEGACY_MATCHUP_VARIANT_PREFS_KEY, serialized)
          return
        }
        localStorage.removeItem(LEGACY_MATCHUP_VARIANT_PREFS_KEY)
      } catch {
        // Ignore storage write failures.
      }
    }

    void persistVariantPrefs()
  }, [preferredVariantByMatchup, storageReady])

  return {
    fights,
    setFights,
    folderScanWarnings,
    setFolderScanWarnings,
    preferredVariantByMatchup,
    setPreferredVariantByMatchup,
    activeFightId,
    setActiveFightId,
    storageReady,
    fightsRef,
    activeFightIdRef,
    preferredVariantByMatchupRef,
    folderScanWarningsRef,
    activeFightSignatureRef,
  }
}
