import { startTransition, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { getTranslations } from './i18n'
import { FightPreviewStage } from './features/vs/components/FightPreviewStage'
import { HomeView } from './features/vs/components/HomeView'
import { PortraitEditorModal } from './features/vs/components/PortraitEditorModal'
import { SearchMorphOverlay } from './features/vs/components/SearchMorphOverlay'
import { TemplateRenderer } from './features/vs/components/TemplateRenderer'
import { MarvinEditor } from './features/vs/components/MarvinEditor'
import { buildFolderFightGroups, selectFolderFights, selectManualFights } from './features/vs/domain/fightLibrary'
import { findFightVariantByLanguage, applySharedFightVisualAdjustments } from './features/vs/domain/fightVariants'
import { preloadAllKnownFightImages, preloadFightCoreImages } from './features/vs/domain/fightImagePreload'
import { markPerformance, measurePerformance } from './features/vs/domain/performanceTrace'
import { buildFightStudioState, resolveFightLanguage, type ApplyFightRecordOptions } from './features/vs/domain/fightState'
import {
  DEFAULT_TEMPLATE_ORDER,
  DEFAULT_WINNER_CV_A,
  DEFAULT_WINNER_CV_B,
  FIGHTER_A,
  FIGHTER_B,
  TEMPLATE_PRESETS,
  defaultCategoriesFor,
  defaultFactsFor,
  localizeTemplatePreset,
  pickLang,
} from './features/vs/presets'
import {
  PORTRAIT_ADJUST_DEFAULT,
  avg,
  clamp,
  cloneFighter,
  normalizeTemplateId,
  normalizePortraitAdjust,
  normalizeSlideImageAdjustments,
  stripFileExtension,
} from './features/vs/helpers'
import { buildFightScaffoldFightJson, buildFightScaffoldScansJson } from './features/vs/importer'
import { useAnimatedCursor } from './features/vs/hooks/useAnimatedCursor'
import { useDocumentFontsReady } from './features/vs/hooks/useDocumentFontsReady'
import { usePreviewScale } from './features/vs/hooks/usePreviewScale'
import { useVsPersistence } from './features/vs/hooks/useVsPersistence'
import { useVsTransitions } from './features/vs/hooks/useVsTransitions'
import { buildFightRefreshSignature, collectPersistableFolderFightVisuals, saveFolderFightVisualsToApi } from './features/vs/storage'
import type {
  Category,
  Fighter,
  FighterFact,
  FighterProfileData,
  FightLocaleJsonV1,
  FightRecord,
  FightScansJsonV1,
  Language,
  PortraitAdjust,
  PortraitEditorState,
  ScoreRow,
  TemplateLayoutMode,
  TemplateId,
} from './features/vs/types'

type ApplyFightRecord = (fight: FightRecord, options?: ApplyFightRecordOptions) => void
type RequestFightApply = (
  fight: FightRecord,
  options?: ApplyFightRecordOptions,
  reason?: PendingFightSelectionReason,
) => void
type PendingFightSelectionReason = 'open-fight' | 'search-transition' | 'search-shortcut' | 'language-switch'
type PendingFightSelection = {
  requestId: number
  fight: FightRecord
  options?: ApplyFightRecordOptions
  reason: PendingFightSelectionReason
}
type TemplateTransitionPhase = 'idle' | 'exit' | 'enter'
type BootFlashBand = {
  id: string
  top: string
  height: string
  background: string
  opacity: number
}
type AuditRequest = {
  fightKey: string
  templateId: TemplateId | null
  language: Language | null
}

const DEFAULT_LANGUAGE: Language = 'en'
const APP_LANGUAGE_STORAGE_KEY = 'vvv-app-language-v1'
const TEMPLATE_LAYOUT_MODE_STORAGE_KEY = 'vvv-template-layout-mode-v1'
const DEFAULT_TEMPLATE_LAYOUT_MODE: TemplateLayoutMode = 'normal'
const PREVIEW_BASE_WIDTH = 1400
const PREVIEW_BASE_HEIGHT = 787.5
const PREVIEW_MIN_SCALE = 0.62
const PREVIEW_MAX_SCALE = 1.7
const MORPH_POWER_OFF_MS = 0
const MORPH_RING_ON_MS = 0
const MORPH_FINAL_MS = 0
const MORPH_OVERLAY_BUFFER_MS = 180
const INTRO_MOUNT_AT_MS = 0
const INTRO_REVEAL_AT_MS = MORPH_POWER_OFF_MS + MORPH_RING_ON_MS + MORPH_FINAL_MS - 220
const FIGHTS_SCAN_POLL_MS = 1200
const SEARCH_COLLAPSE_WATCHDOG_MS = 5000
const REVERSE_EXPLOSION_WATCHDOG_MS = 30000
const TEMPLATE_RAIL_TRANSITION_MS = 1200
const TEMPLATE_RAIL_TRANSITION_SWAP_MS = 50
const TEMPLATE_PANEL_SWITCH_LASER_MS = 1200
const STARTUP_GLITCH_FRAMES = 14
const STARTUP_GLITCH_INTERVAL_MS = 40
const SEARCH_IFRAME_VERSION = 42
const INTRO_IFRAME_VERSION = 19
const EMPTY_PROFILE_DATA: FighterProfileData = { powers: [], tools: [], weaknesses: [] }
const FIGHT_SHORTCUT_KEYS = ['5', '6', '7', '8', '9', '0', '-', '='] as const
type FightShortcutKey = (typeof FIGHT_SHORTCUT_KEYS)[number]

const FIGHT_SHORTCUT_ORDINAL: Record<FightShortcutKey, number> = {
  '5': 1,
  '6': 2,
  '7': 3,
  '8': 4,
  '9': 5,
  '0': 6,
  '-': 7,
  '=': 8,
}

const normalizeFightShortcutKey = (value: string): FightShortcutKey | null => {
  const normalized = value === '+' ? '=' : value === '_' ? '-' : value
  if (FIGHT_SHORTCUT_KEYS.includes(normalized as FightShortcutKey)) {
    return normalized as FightShortcutKey
  }

  switch (value) {
    case 'Digit5':
      return '5'
    case 'Digit6':
      return '6'
    case 'Digit7':
      return '7'
    case 'Digit8':
      return '8'
    case 'Digit9':
      return '9'
    case 'Digit0':
      return '0'
    case 'Minus':
      return '-'
    case 'Equal':
      return '='
    default:
      return null
  }
}

const parseFightScaffoldMatchup = (value: string) => {
  const match = value.trim().match(/^(.+?)\s+(?:vs\.?|versus|kontra|v)\s+(.+?)$/i)
  if (!match) return null
  const fighterAName = match[1]?.trim()
  const fighterBName = match[2]?.trim()
  if (!fighterAName || !fighterBName) return null
  return { fighterAName, fighterBName }
}

const readLanguageFromUrl = (): Language | null => {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const raw = (params.get('lang') || params.get('locale') || '').trim().toLowerCase()
  return raw === 'pl' || raw === 'en' ? raw : null
}

const readStoredLanguage = (): Language => {
  const fromUrl = readLanguageFromUrl()
  if (fromUrl) return fromUrl
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE
  try {
    const raw = localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)?.trim().toLowerCase()
    return raw === 'pl' || raw === 'en' ? raw : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

const persistLanguage = (language: Language) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Ignore storage write failures.
  }
  try {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('lang', language)
    currentUrl.searchParams.delete('locale')
    const nextUrl = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
    window.history.replaceState(window.history.state, '', nextUrl)
  } catch {
    // Ignore URL sync failures.
  }
  document.documentElement.lang = language
}

const readStoredTemplateLayoutMode = (): TemplateLayoutMode => {
  if (typeof window === 'undefined') return DEFAULT_TEMPLATE_LAYOUT_MODE
  try {
    const raw = localStorage.getItem(TEMPLATE_LAYOUT_MODE_STORAGE_KEY)?.trim().toLowerCase()
    return raw === 'mobile' ? 'mobile' : 'normal'
  } catch {
    return DEFAULT_TEMPLATE_LAYOUT_MODE
  }
}

const persistTemplateLayoutMode = (mode: TemplateLayoutMode) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(TEMPLATE_LAYOUT_MODE_STORAGE_KEY, mode)
  } catch {
    // Ignore storage write failures.
  }
}

function App() {
  const [language, setLanguage] = useState<Language>(() => readStoredLanguage())
  const [templateLayoutMode, setTemplateLayoutMode] = useState<TemplateLayoutMode>(() => readStoredTemplateLayoutMode())
  const [templateMobilePanelSide, setTemplateMobilePanelSide] = useState<'left' | 'right'>('left')
  const [templateMobilePanelSwitchTo, setTemplateMobilePanelSwitchTo] = useState<'left' | 'right' | null>(null)
  const [templateMobilePanelLaserVisible, setTemplateMobilePanelLaserVisible] = useState(false)
  const [templateMobilePanelLaserNonce, setTemplateMobilePanelLaserNonce] = useState(0)
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const translations = useMemo(() => getTranslations(language), [language])
  const ui = translations.ui
  const initialTemplate = localizeTemplatePreset(TEMPLATE_PRESETS[0], language)
  const localizedTemplates = useMemo(
    () => TEMPLATE_PRESETS.map((template) => localizeTemplatePreset(template, language)),
    [language],
  )
  const auditRequest = useMemo<AuditRequest | null>(() => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    if (params.get('audit') !== '1') return null
    const fightKey = (params.get('fight') || params.get('folder') || params.get('id') || '').trim()
    const templateValue = (params.get('template') || '').trim()
    const localeValue = (params.get('lang') || params.get('locale') || '').trim().toLowerCase()
    const requestedLanguage: Language | null = localeValue === 'pl' || localeValue === 'en' ? localeValue : null
    return {
      fightKey,
      templateId: normalizeTemplateId(templateValue),
      language: requestedLanguage,
    }
  }, [])

  const [activeTemplate, setActiveTemplate] = useState<TemplateId>(initialTemplate.id)
  const [categories, setCategories] = useState<Category[]>(() => defaultCategoriesFor(language))
  const [fighterA, setFighterA] = useState<Fighter>(() => cloneFighter(FIGHTER_A))
  const [fighterB, setFighterB] = useState<Fighter>(() => cloneFighter(FIGHTER_B))
  const [factsA, setFactsA] = useState<FighterFact[]>(() => defaultFactsFor('a', language))
  const [factsB, setFactsB] = useState<FighterFact[]>(() => defaultFactsFor('b', language))
  const [profileA, setProfileA] = useState<FighterProfileData>(EMPTY_PROFILE_DATA)
  const [profileB, setProfileB] = useState<FighterProfileData>(EMPTY_PROFILE_DATA)
  const [powersA, setPowersA] = useState<FighterFact[]>([])
  const [powersB, setPowersB] = useState<FighterFact[]>([])
  const [crucialFeatsA, setCrucialFeatsA] = useState<string[]>([])
  const [crucialFeatsB, setCrucialFeatsB] = useState<string[]>([])
  const [winsA, setWinsA] = useState<string[]>(DEFAULT_WINNER_CV_A)
  const [winsB, setWinsB] = useState<string[]>(DEFAULT_WINNER_CV_B)
  const [templateOrder, setTemplateOrder] = useState<TemplateId[]>(DEFAULT_TEMPLATE_ORDER)
  const [templateCursor, setTemplateCursor] = useState(0)
  const [templateBlocks, setTemplateBlocks] = useState<Record<string, string[]>>({})
  const [importFileName, setImportFileName] = useState('')
  const [portraitAAdjust, setPortraitAAdjust] = useState<PortraitAdjust>({ ...PORTRAIT_ADJUST_DEFAULT })
  const [portraitBAdjust, setPortraitBAdjust] = useState<PortraitAdjust>({ ...PORTRAIT_ADJUST_DEFAULT })
  const [slideImageAdjustments, setSlideImageAdjustments] = useState<Record<string, PortraitAdjust>>({})
  const [templateTransitionPhase, setTemplateTransitionPhase] = useState<TemplateTransitionPhase>('idle')
  const [incomingTemplateId, setIncomingTemplateId] = useState<TemplateId | null>(null)
  const [incomingTemplateCursor, setIncomingTemplateCursor] = useState<number | null>(null)

  const previewRef = useRef<HTMLDivElement>(null)
  const previewShellRef = useRef<HTMLDivElement>(null)
  const searchTransitioningRef = useRef(false)
  const returnTransitioningRef = useRef(false)
  const applyFightRecordRef = useRef<ApplyFightRecord | null>(null)
  const requestFightApplyRef = useRef<RequestFightApply | null>(null)
  const auditAppliedRef = useRef(false)
  const pendingAuditTemplateRef = useRef<TemplateId | null>(null)
  const pendingPaintPerfRef = useRef<{
    requestId: number
    fightId: string
    language: Language
    reason: PendingFightSelectionReason
  } | null>(null)
  const activeFightIdRef = useRef<string | null>(null)
  const activeTemplateRef = useRef<TemplateId>(initialTemplate.id)
  const templateCursorRef = useRef(0)
  const templateTransitionPhaseRef = useRef<TemplateTransitionPhase>('idle')
  const languageRef = useRef<Language>(language)
  const pendingFightRequestIdRef = useRef(0)
  const globalPreloadPromiseRef = useRef<Promise<void> | null>(null)
  const globalPreloadAbortRef = useRef<AbortController | null>(null)
  const pendingSearchStageJumpRef = useRef<number | null>(null)
  const templateTransitionTimeoutsRef = useRef<number[]>([])
  const templateTransitionRafsRef = useRef<number[]>([])
  const startupGlitchIntervalRef = useRef<number | null>(null)
  const templateMobilePanelLaserTimeoutRef = useRef<number | null>(null)
  const startupGlitchFrameRef = useRef(0)
  const clearFinalTemplateAutoReturnTimeoutFnRef = useRef<() => void>(() => {})
  const scheduleFinalTemplateAutoReturnFnRef = useRef<(delayMs?: number) => void>(() => {})
  const [portraitEditor, setPortraitEditor] = useState<PortraitEditorState | null>(null)
  const [pendingFightSelection, setPendingFightSelection] = useState<PendingFightSelection | null>(null)
  const [pendingLocaleSwitch, setPendingLocaleSwitch] = useState<Language | null>(null)
  const [startupGlitchActive, setStartupGlitchActive] = useState(false)
  const [bootGateActive, setBootGateActive] = useState(true)
  const [startupFlashBands, setStartupFlashBands] = useState<BootFlashBand[]>([])
  const [startupFlashTransform, setStartupFlashTransform] = useState('')

  const {
    fights,
    setFights,
    folderScanWarnings,
    preferredVariantByMatchup,
    setPreferredVariantByMatchup,
    activeFightId,
    setActiveFightId,
    storageReady,
    activeFightSignatureRef,
  } = useVsPersistence({
    applyFightRecordRef,
    searchTransitioningRef,
    returnTransitioningRef,
    fightScanPollMs: FIGHTS_SCAN_POLL_MS,
    templateLayoutMode,
  })

  const {
    viewMode,
    setViewMode,
    introVisible,
    setIntroVisible,
    fightViewVisible,
    searchMorphVisible,
    searchMorphDirection,
    reverseStage,
    introFlowMode,
    searchFlowMode,
    searchMorphHandoff,
    searchFrameRef,
    introFrameRef,
    clearSearchTransitionQueue,
    clearFinalTemplateAutoReturnTimeout,
    scheduleFinalTemplateAutoReturn,
    openFightImmediately,
    goBackToLibrary,
    showSearchImmediately,
    handleSearchFrameLoad: handleSearchFrameTransitionLoad,
    handleIntroFrameLoad,
  } = useVsTransitions({
    fights,
    preferredVariantByMatchup,
    language,
    requestFightApplyRef,
    setActiveFightId,
    searchTransitioningRef,
    returnTransitioningRef,
    morphPowerOffMs: MORPH_POWER_OFF_MS,
    morphRingOnMs: MORPH_RING_ON_MS,
    morphFinalMs: MORPH_FINAL_MS,
    morphOverlayBufferMs: MORPH_OVERLAY_BUFFER_MS,
    introMountAtMs: INTRO_MOUNT_AT_MS,
    introRevealAtMs: INTRO_REVEAL_AT_MS,
    searchCollapseWatchdogMs: SEARCH_COLLAPSE_WATCHDOG_MS,
    reverseExplosionWatchdogMs: REVERSE_EXPLOSION_WATCHDOG_MS,
  })

  useLayoutEffect(() => {
    activeFightIdRef.current = activeFightId
    activeTemplateRef.current = activeTemplate
    templateCursorRef.current = templateCursor
    templateTransitionPhaseRef.current = templateTransitionPhase
    languageRef.current = language
  }, [activeFightId, activeTemplate, language, templateCursor, templateTransitionPhase])

  useEffect(() => {
    persistLanguage(language)
  }, [language])

  useEffect(() => {
    persistTemplateLayoutMode(templateLayoutMode)
  }, [templateLayoutMode])

  useEffect(() => {
    if (templateLayoutMode !== 'mobile') {
      setTemplateMobilePanelSide('left')
      setTemplateMobilePanelSwitchTo(null)
      setTemplateMobilePanelLaserVisible(false)
      if (templateMobilePanelLaserTimeoutRef.current !== null) {
        window.clearTimeout(templateMobilePanelLaserTimeoutRef.current)
        templateMobilePanelLaserTimeoutRef.current = null
      }
    }
  }, [templateLayoutMode])

  useEffect(() => {
    if (templateLayoutMode === 'mobile') {
      setTemplateMobilePanelSide('left')
      setTemplateMobilePanelSwitchTo(null)
      setTemplateMobilePanelLaserVisible(false)
      if (templateMobilePanelLaserTimeoutRef.current !== null) {
        window.clearTimeout(templateMobilePanelLaserTimeoutRef.current)
        templateMobilePanelLaserTimeoutRef.current = null
      }
    }
  }, [activeTemplate, templateLayoutMode])

  useEffect(
    () => () => {
      if (templateMobilePanelLaserTimeoutRef.current !== null) {
        window.clearTimeout(templateMobilePanelLaserTimeoutRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.dataset.vsTemplateLayout = templateLayoutMode
    return () => {
      delete document.documentElement.dataset.vsTemplateLayout
    }
  }, [templateLayoutMode])

  useLayoutEffect(() => {
    clearFinalTemplateAutoReturnTimeoutFnRef.current = clearFinalTemplateAutoReturnTimeout
    scheduleFinalTemplateAutoReturnFnRef.current = scheduleFinalTemplateAutoReturn
  }, [clearFinalTemplateAutoReturnTimeout, scheduleFinalTemplateAutoReturn])

  useAnimatedCursor({ searchFrameRef, introFrameRef })

  const fontsReady = useDocumentFontsReady()
  const { previewScale, previewScaleReady } = usePreviewScale({
    shellRef: previewShellRef,
    viewMode,
    baseWidth: PREVIEW_BASE_WIDTH,
    baseHeight: PREVIEW_BASE_HEIGHT,
    minScale: PREVIEW_MIN_SCALE,
    maxScale: PREVIEW_MAX_SCALE,
  })
  const previewReady = fontsReady && previewScaleReady

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (auditRequest) {
      document.documentElement.dataset.vsAudit = 'true'
      return () => {
        delete document.documentElement.dataset.vsAudit
      }
    }
    delete document.documentElement.dataset.vsAudit
    return undefined
  }, [auditRequest])

  const flashStatus = useCallback((text: string) => {
    void text
  }, [])

  const rememberPreferredFightVariant = useCallback((fight: FightRecord) => {
    if (!fight.matchupKey) return
    setPreferredVariantByMatchup((current) => {
      if (current[fight.matchupKey] === fight.id) return current
      return {
        ...current,
        [fight.matchupKey]: fight.id,
      }
    })
  }, [setPreferredVariantByMatchup])

  const closePortraitEditor = () => {
    setPortraitEditor((current) => {
      if (current?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(current.previewUrl)
      }
      return null
    })
  }

  const openSavedFightPortraitEditor = (fightId: string, side: 'a' | 'b') => {
    const match = fights.find((fight) => fight.id === fightId)
    if (!match) return
    const previewUrl = side === 'a' ? match.portraitADataUrl : match.portraitBDataUrl
    if (!previewUrl) return
    const baseAdjust = side === 'a' ? match.portraitAAdjust : match.portraitBAdjust

    setPortraitEditor((current) => {
      if (current?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(current.previewUrl)
      }
      return {
        mode: 'fight',
        fightId: match.id,
        side,
        previewUrl,
        adjust: normalizePortraitAdjust(baseAdjust),
      }
    })
  }

  const updatePortraitEditorAdjust = (patch: Partial<PortraitAdjust>) => {
    setPortraitEditor((current) => {
      if (!current) return current
      return {
        ...current,
        adjust: normalizePortraitAdjust({
          ...current.adjust,
          ...patch,
        }),
      }
    })
  }

  const resetPortraitEditorAdjust = () => {
    updatePortraitEditorAdjust(PORTRAIT_ADJUST_DEFAULT)
  }

  const togglePortraitEditorSide = () => {
    setPortraitEditor((current) => {
      if (!current || current.mode !== 'fight') return current
      const nextSide = current.side === 'a' ? 'b' : 'a'
      const match = fights.find((fight) => fight.id === current.fightId)
      if (!match) return current
      const nextPreviewUrl = nextSide === 'a' ? match.portraitADataUrl : match.portraitBDataUrl
      if (!nextPreviewUrl) return current
      const nextAdjust = nextSide === 'a' ? match.portraitAAdjust : match.portraitBAdjust
      return {
        ...current,
        side: nextSide,
        previewUrl: nextPreviewUrl,
        adjust: normalizePortraitAdjust(nextAdjust),
      }
    })
  }

  const applyPortraitEditor = () => {
    if (!portraitEditor || portraitEditor.mode !== 'fight') return

    const nextAdjust = normalizePortraitAdjust(portraitEditor.adjust)
    let nextFightsSnapshot: FightRecord[] | null = null
    setFights((current) => {
      const referenceFight = current.find((fight) => fight.id === portraitEditor.fightId)
      if (!referenceFight) return current
      const nextFights = applySharedFightVisualAdjustments(
        current,
        referenceFight,
        portraitEditor.side === 'a'
          ? { portraitAAdjust: nextAdjust }
          : { portraitBAdjust: nextAdjust },
      )
      nextFightsSnapshot = nextFights
      return nextFights
    })

    if (nextFightsSnapshot) {
      void saveFolderFightVisualsToApi(collectPersistableFolderFightVisuals(nextFightsSnapshot)).catch((error) => {
        console.warn('[vs-fights-visuals] Failed to save portrait adjustments.', error)
      })
    }

    if (activeFightId === portraitEditor.fightId) {
      if (portraitEditor.side === 'a') setPortraitAAdjust(nextAdjust)
      if (portraitEditor.side === 'b') setPortraitBAdjust(nextAdjust)
    }

    closePortraitEditor()
  }

  const activeTemplatePreset =
    localizedTemplates.find((template) => template.id === activeTemplate) || localizedTemplates[0] || initialTemplate
  const activeTemplateLabel = activeTemplatePreset.name || activeTemplate
  const templatePresetById = useMemo(() => {
    const byId = new Map<TemplateId, (typeof localizedTemplates)[number]>()
    for (const template of localizedTemplates) {
      byId.set(template.id, template)
    }
    return byId
  }, [localizedTemplates])

  const folderFights = useMemo(() => selectFolderFights(fights), [fights])
  const manualFights = useMemo(() => selectManualFights(fights), [fights])
  const folderFightGroups = useMemo(() => buildFolderFightGroups(folderFights), [folderFights])
  const fightPreloadSignature = useMemo(
    () => fights.map((fight) => buildFightRefreshSignature(fight)).join('\n'),
    [fights],
  )
  const fightsForPreload = useMemo(() => fights, [fightPreloadSignature])

  const rows = useMemo<ScoreRow[]>(
    () =>
      categories.map((category) => {
        const a = clamp(fighterA.stats[category.id] ?? 0)
        const b = clamp(fighterB.stats[category.id] ?? 0)
        const delta = a - b
        const localizedLabel = translations.categories[category.id as keyof typeof translations.categories] || category.label
        return {
          id: category.id,
          label: localizedLabel,
          a,
          b,
          delta,
          winner: delta === 0 ? 'draw' : delta > 0 ? 'a' : 'b',
        }
      }),
    [categories, fighterA.stats, fighterB.stats, translations],
  )

  const averageA = useMemo(() => avg(rows, 'a'), [rows])
  const averageB = useMemo(() => avg(rows, 'b'), [rows])
  const isTemplateTransitioning = templateTransitionPhase !== 'idle'
  const maxTemplateCursor = Math.max(templateOrder.length - 1, 0)
  const canStepTemplateBackward = !isTemplateTransitioning && templateOrder.length > 0 && templateCursor > 0
  const canStepTemplateForward = !isTemplateTransitioning && templateOrder.length > 0 && templateCursor < maxTemplateCursor

  const applyTemplateById = useCallback((templateId: TemplateId, shouldFlash = true) => {
    const preset = localizedTemplates.find((template) => template.id === templateId)
    if (!preset) return
    setActiveTemplate(preset.id)
    if (shouldFlash) {
      flashStatus(`${ui.templateLoaded}: ${preset.name}`)
    }
  }, [flashStatus, localizedTemplates, ui.templateLoaded])

  const clearTemplateTransitionQueue = useCallback(() => {
    for (const timeoutId of templateTransitionTimeoutsRef.current) {
      window.clearTimeout(timeoutId)
    }
    for (const rafId of templateTransitionRafsRef.current) {
      window.cancelAnimationFrame(rafId)
    }
    templateTransitionTimeoutsRef.current = []
    templateTransitionRafsRef.current = []
    templateTransitionPhaseRef.current = 'idle'
    setTemplateTransitionPhase('idle')
    setIncomingTemplateId(null)
    setIncomingTemplateCursor(null)
  }, [])

  const stepTemplateOrder = useCallback((direction: 1 | -1) => {
    if (templateTransitionPhaseRef.current !== 'idle') return
    if (!templateOrder.length) return
    const nextTemplateCursor = templateCursor + direction
    if (nextTemplateCursor < 0 || nextTemplateCursor >= templateOrder.length) return
    const nextTemplateId = templateOrder[nextTemplateCursor]

    clearTemplateTransitionQueue()
    setIncomingTemplateId(nextTemplateId)
    setIncomingTemplateCursor(nextTemplateCursor)
    templateTransitionPhaseRef.current = 'exit'
    setTemplateTransitionPhase('exit')

    const swapTimeout = window.setTimeout(() => {
      templateTransitionPhaseRef.current = 'enter'
      setTemplateTransitionPhase('enter')
    }, TEMPLATE_RAIL_TRANSITION_SWAP_MS)

    const settleTimeout = window.setTimeout(() => {
      // Step 1: Update the cursor and active template
      setTemplateCursor(nextTemplateCursor)
      applyTemplateById(nextTemplateId, false)
      
      // Step 2: Immediately clear incoming to avoid key collisions
      setIncomingTemplateId(null)
      setIncomingTemplateCursor(null)

      // Wait two frames so the new main template mounts before the transition layer disappears
      const raf1 = window.requestAnimationFrame(() => {
        const raf2 = window.requestAnimationFrame(() => {
          templateTransitionPhaseRef.current = 'idle'
          setTemplateTransitionPhase('idle')
          templateTransitionTimeoutsRef.current = []
          templateTransitionRafsRef.current = []
        })
        templateTransitionRafsRef.current = [raf2]
      })
      templateTransitionRafsRef.current = [raf1]
    }, TEMPLATE_RAIL_TRANSITION_MS)

    templateTransitionTimeoutsRef.current.push(swapTimeout, settleTimeout)
  }, [applyTemplateById, clearTemplateTransitionQueue, templateCursor, templateOrder])

  const handleSlideImageAdjustChange = (imageKey: string, adjust: PortraitAdjust) => {
    const normalizedKey = imageKey.trim()
    if (!normalizedKey) return
    setSlideImageAdjustments((current) => ({
      ...current,
      [normalizedKey]: normalizePortraitAdjust(adjust),
    }))
  }

  const handleSlideImageAdjustCommit = (imageKey: string, adjust: PortraitAdjust) => {
    const normalizedKey = imageKey.trim()
    if (!normalizedKey) return

    const normalizedAdjust = normalizePortraitAdjust(adjust)
    const nextSlideImageAdjustments = {
      ...normalizeSlideImageAdjustments(slideImageAdjustments),
      [normalizedKey]: normalizedAdjust,
    }

    setSlideImageAdjustments((current) => ({
      ...current,
      [normalizedKey]: normalizedAdjust,
    }))

    if (!activeFightId) return
    let nextFightsSnapshot: FightRecord[] | null = null
    setFights((current) => {
      const activeFight = current.find((fight) => fight.id === activeFightId)
      if (!activeFight) return current
      const nextFights = applySharedFightVisualAdjustments(current, activeFight, {
        slideImageAdjustments: nextSlideImageAdjustments,
      })
      nextFightsSnapshot = nextFights
      return nextFights
    })
    if (nextFightsSnapshot) {
      void saveFolderFightVisualsToApi(collectPersistableFolderFightVisuals(nextFightsSnapshot)).catch((error) => {
        console.warn('[vs-fights-visuals] Failed to save image adjustments.', error)
      })
    }
  }

  const applyFightRecord = useCallback<ApplyFightRecord>((fight, options) => {
    const currentLanguage = languageRef.current
    const currentActiveTemplate = activeTemplateRef.current
    const currentTemplateCursor = templateCursorRef.current
    const isSameFight = activeFightIdRef.current === fight.id
    const preserveTemplateSelection = options?.preserveTemplateSelection ?? isSameFight
    const nextState = buildFightStudioState({
      fight,
      language: options?.targetLanguage ?? currentLanguage,
      activeTemplate: currentActiveTemplate,
      templateCursor: currentTemplateCursor,
      preserveTemplateSelection,
    })

    setCategories(nextState.categories)
    setFighterA(nextState.fighterA)
    setFighterB(nextState.fighterB)
    setPortraitAAdjust(nextState.portraitAAdjust)
    setPortraitBAdjust(nextState.portraitBAdjust)
    setSlideImageAdjustments(nextState.slideImageAdjustments)
    setLanguage(nextState.targetLanguage)
    setFactsA(nextState.factsA)
    setFactsB(nextState.factsB)
    setProfileA(nextState.profileA)
    setProfileB(nextState.profileB)
    setPowersA(nextState.powersA)
    setPowersB(nextState.powersB)
    setCrucialFeatsA(nextState.crucialFeatsA)
    setCrucialFeatsB(nextState.crucialFeatsB)
    setWinsA(nextState.winsA)
    setWinsB(nextState.winsB)
    setTemplateBlocks(nextState.templateBlocks)
    setTemplateOrder(nextState.templateOrder)
    setTemplateCursor(nextState.templateCursor)
    setImportFileName(nextState.importFileName)
    setActiveFightId(nextState.activeFightId)
    activeFightSignatureRef.current = buildFightRefreshSignature(fight)

    if (options?.enterIntro ?? true) {
      clearSearchTransitionQueue()
      setIntroVisible(true)
      setViewMode('fight-intro')
    }

    applyTemplateById(nextState.nextTemplate, false)
  }, [
    activeFightSignatureRef,
    applyTemplateById,
    clearSearchTransitionQueue,
    setActiveFightId,
    setIntroVisible,
    setViewMode,
  ])

  useEffect(() => {
    applyFightRecordRef.current = applyFightRecord
  }, [applyFightRecord])

  const requestFightApply = useCallback<RequestFightApply>((fight, options, reason = 'open-fight') => {
    const requestId = pendingFightRequestIdRef.current + 1
    pendingFightRequestIdRef.current = requestId
    const targetLanguage = options?.targetLanguage ?? language
    if (reason !== 'language-switch' && pendingLocaleSwitch !== null) {
      setPendingLocaleSwitch(null)
    }
    markPerformance(`vs-request:${requestId}:click`)
    pendingPaintPerfRef.current = {
      requestId,
      fightId: fight.id,
      language: targetLanguage,
      reason,
    }
    const nextPendingSelection: PendingFightSelection = {
      requestId,
      fight,
      options,
      reason,
    }
    void (async () => {
      try {
        await globalPreloadPromiseRef.current
      } catch {
        // Continue regardless - we still preload selected fight below.
      }
      try {
        await preloadFightCoreImages(fight)
      } catch {
        // Fallback to normal flow even if preload fails.
      }
      if (pendingFightRequestIdRef.current !== requestId) return
      setPendingFightSelection(nextPendingSelection)
    })()
  }, [language, pendingLocaleSwitch])

  useEffect(() => {
    requestFightApplyRef.current = requestFightApply
  }, [requestFightApply])

  useEffect(() => {
    if (!pendingFightSelection) return

    const currentRequest = pendingFightSelection
    const applyStartMark = `vs-request:${currentRequest.requestId}:apply-start`
    const applyEndMark = `vs-request:${currentRequest.requestId}:apply-end`
    let cancelled = false

    const frameId = window.requestAnimationFrame(() => {
      if (cancelled) return
      markPerformance(applyStartMark)
      startTransition(() => {
        applyFightRecord(currentRequest.fight, currentRequest.options)
        markPerformance(applyEndMark)
        measurePerformance(
          `fight:${currentRequest.reason}:apply:${currentRequest.requestId}`,
          applyStartMark,
          applyEndMark,
        )
        setPendingFightSelection((active) =>
          active?.requestId === currentRequest.requestId ? null : active,
        )
        if (currentRequest.reason === 'language-switch') {
          setPendingLocaleSwitch(null)
        }
      })
    })

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frameId)
    }
  }, [applyFightRecord, pendingFightSelection])

  useEffect(() => {
    if (bootGateActive) return
    if (!auditRequest?.fightKey || !storageReady || auditAppliedRef.current || !fights.length) return

    const requestedLocale = auditRequest.language
    const targetFight = fights.find((fight) => {
      const matchesFight =
        fight.id === auditRequest.fightKey ||
        fight.folderKey === auditRequest.fightKey ||
        fight.matchupKey === auditRequest.fightKey ||
        fight.fileName === auditRequest.fightKey ||
        fight.name === auditRequest.fightKey
      if (!matchesFight) return false
      if (!requestedLocale) return true
      return resolveFightLanguage(fight, requestedLocale) === requestedLocale || fight.variantLocale === requestedLocale
    })

    if (!targetFight) {
      console.warn('[vs-audit] Could not resolve audit fight request.', auditRequest)
      auditAppliedRef.current = true
      return
    }

    auditAppliedRef.current = true
    const targetLanguage = auditRequest.language ?? language
    const timeoutId = window.setTimeout(() => {
      rememberPreferredFightVariant(targetFight)
      applyFightRecordRef.current?.(targetFight, {
        enterIntro: false,
        preserveTemplateSelection: true,
        targetLanguage,
      })
      pendingAuditTemplateRef.current = auditRequest.templateId
      clearFinalTemplateAutoReturnTimeout()
      setIntroVisible(true)
      setViewMode('fight')
    })

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [
    auditRequest,
    clearFinalTemplateAutoReturnTimeout,
    fights,
    language,
    rememberPreferredFightVariant,
    setIntroVisible,
    setViewMode,
    storageReady,
    bootGateActive,
  ])

  useEffect(() => {
    if (bootGateActive) return
    const pendingTemplate = pendingAuditTemplateRef.current
    if (!pendingTemplate || !templateOrder.length) return
    const nextTemplateCursor = templateOrder.indexOf(pendingTemplate)
    if (nextTemplateCursor === -1) return
    setTemplateCursor(nextTemplateCursor)
    applyTemplateById(pendingTemplate, false)
    clearFinalTemplateAutoReturnTimeout()
    setIntroVisible(true)
    setViewMode('fight')
    pendingAuditTemplateRef.current = null
  }, [applyTemplateById, clearFinalTemplateAutoReturnTimeout, setIntroVisible, setViewMode, templateOrder, bootGateActive])

  const toggleLanguage = () => {
    const nextLanguage = language === 'pl' ? 'en' : 'pl'
    persistLanguage(nextLanguage)
    setLanguage(nextLanguage)

    if (activeFightId) {
      const currentFight = fights.find((fight) => fight.id === activeFightId)
      if (currentFight) {
        const otherVariant = findFightVariantByLanguage(fights, currentFight, nextLanguage)
        if (otherVariant) {
          rememberPreferredFightVariant(otherVariant)
          setPendingLocaleSwitch(nextLanguage)
          requestFightApply(otherVariant, {
            enterIntro: false,
            preserveTemplateSelection: true,
            targetLanguage: nextLanguage,
          }, 'language-switch')
          return
        }
      }
    }

    markPerformance(`vs-language-switch:fallback:${nextLanguage}:click`)
    startTransition(() => {
      if (!importFileName && !Object.keys(templateBlocks).length) {
        setCategories(defaultCategoriesFor(nextLanguage))
        setFactsA(defaultFactsFor('a', nextLanguage))
        setFactsB(defaultFactsFor('b', nextLanguage))
        setPowersA([])
        setPowersB([])
        setCrucialFeatsA([])
        setCrucialFeatsB([])
        setSlideImageAdjustments({})
      }
      markPerformance(`vs-language-switch:fallback:${nextLanguage}:end`)
      measurePerformance(
        `language-switch:fallback:${nextLanguage}`,
        `vs-language-switch:fallback:${nextLanguage}:click`,
        `vs-language-switch:fallback:${nextLanguage}:end`,
      )
    })
  }

  const toggleTemplateLayoutMode = useCallback(() => {
    setTemplateLayoutMode((current) => (current === 'mobile' ? 'normal' : 'mobile'))
  }, [])

  const toggleTemplateMobilePanelSide = useCallback(() => {
    if (templateLayoutMode !== 'mobile' || templateMobilePanelSwitchTo) return
    const nextSide = templateMobilePanelSide === 'left' ? 'right' : 'left'
    setTemplateMobilePanelSwitchTo(nextSide)
    setTemplateMobilePanelLaserVisible(true)
    setTemplateMobilePanelLaserNonce((current) => current + 1)
    if (templateMobilePanelLaserTimeoutRef.current !== null) {
      window.clearTimeout(templateMobilePanelLaserTimeoutRef.current)
    }
    templateMobilePanelLaserTimeoutRef.current = window.setTimeout(() => {
      setTemplateMobilePanelSide(nextSide)
      setTemplateMobilePanelSwitchTo(null)
      setTemplateMobilePanelLaserVisible(false)
      templateMobilePanelLaserTimeoutRef.current = null
    }, TEMPLATE_PANEL_SWITCH_LASER_MS)
  }, [templateLayoutMode, templateMobilePanelSide, templateMobilePanelSwitchTo])

  const openFight = (fightId: string) => {
    const fight = fights.find((item) => item.id === fightId)
    if (!fight) return
    rememberPreferredFightVariant(fight)
    clearFinalTemplateAutoReturnTimeout()
    clearSearchTransitionQueue()
    setIntroVisible(true)
    setViewMode('fight-intro')
    requestFightApply(fight, { enterIntro: false }, 'open-fight')
  }

  const deleteFight = (fightId: string) => {
    const fight = fights.find((item) => item.id === fightId)
    if (!fight || fight.source === 'folder') return

    const confirmed = window.confirm(`${ui.deleteFightConfirm}\n\n${fight.name}`)
    if (!confirmed) return

    setFights((current) => current.filter((item) => item.id !== fightId))
    if (activeFightId === fightId) {
      goBackToLibrary()
    }
  }

  const createFightScaffold = async (matchName: string, selectedTemplateOrder: TemplateId[]) => {
    const parsedMatchup = parseFightScaffoldMatchup(matchName)
    if (!parsedMatchup) {
      throw new Error(ui.createFightNameError)
    }

    const englishFight: FightLocaleJsonV1 = buildFightScaffoldFightJson(
      'en',
      parsedMatchup.fighterAName,
      parsedMatchup.fighterBName,
      selectedTemplateOrder,
    )
    const polishFight: FightLocaleJsonV1 = buildFightScaffoldFightJson(
      'pl',
      parsedMatchup.fighterAName,
      parsedMatchup.fighterBName,
      selectedTemplateOrder,
    )
    const scans: FightScansJsonV1 = buildFightScaffoldScansJson(selectedTemplateOrder)

    const response = await fetch('/api/fights/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchName,
        englishFight,
        polishFight,
        scans,
      }),
    })

    const payload = await response.json().catch(() => null) as { folderName?: string; error?: string } | null
    if (!response.ok) {
      throw new Error(payload?.error || ui.createFightFailed)
    }

    if (payload?.folderName) {
      flashStatus(`${ui.createFightSuccess}: ${payload.folderName}`)
      return payload.folderName
    }

    throw new Error(ui.createFightFailed)
  }

  const activeFightRecord = useMemo(
    () => fights.find((fight) => fight.id === activeFightId) || null,
    [activeFightId, fights],
  )

  useEffect(() => {
    if (!activeFightRecord) return
    void preloadFightCoreImages(activeFightRecord)
  }, [activeFightRecord])

  useEffect(() => {
    if (!storageReady || !fightsForPreload.length) return

    globalPreloadAbortRef.current?.abort()
    const abortController = new AbortController()
    globalPreloadAbortRef.current = abortController
    const preloadPromise = preloadAllKnownFightImages(fightsForPreload, {
      signal: abortController.signal,
      batchSize: 20,
      yieldMs: 16,
    }).catch(() => undefined)
    globalPreloadPromiseRef.current = preloadPromise

    return () => {
      abortController.abort()
      if (globalPreloadAbortRef.current === abortController) {
        globalPreloadAbortRef.current = null
      }
    }
  }, [fightsForPreload, storageReady])

  useEffect(() => {
    const pendingPaint = pendingPaintPerfRef.current
    if (!pendingPaint) return
    if (!previewReady || viewMode !== 'fight') return
    if (activeFightId !== pendingPaint.fightId || language !== pendingPaint.language) return

    const paintMark = `vs-request:${pendingPaint.requestId}:paint`
    markPerformance(paintMark)
    measurePerformance(
      `fight:${pendingPaint.reason}:click-to-paint:${pendingPaint.requestId}`,
      `vs-request:${pendingPaint.requestId}:click`,
      paintMark,
    )
    pendingPaintPerfRef.current = null
  }, [activeFightId, language, previewReady, viewMode])

  useEffect(() => {
    clearFinalTemplateAutoReturnTimeoutFnRef.current()
    if (viewMode !== 'fight' || !fightViewVisible) return
    if (activeTemplate !== 'fight-card') return
    if (portraitEditor) return

    scheduleFinalTemplateAutoReturnFnRef.current(10_000)
    return () => clearFinalTemplateAutoReturnTimeoutFnRef.current()
  }, [
    activeTemplate,
    fightViewVisible,
    portraitEditor,
    viewMode,
  ])

  useEffect(() => {
    if (viewMode === 'fight') return
    clearTemplateTransitionQueue()
  }, [clearTemplateTransitionQueue, viewMode])

  useEffect(
    () => () => {
      clearTemplateTransitionQueue()
    },
    [clearTemplateTransitionQueue],
  )

  const currentFightLabel =
    stripFileExtension(importFileName) ||
    `${fighterA.name || tr('Postać A', 'Fighter A')} vs ${fighterB.name || tr('Postać B', 'Fighter B')}`

  const renderTemplate = (templateId: TemplateId, key: string) => (
    <TemplateRenderer
      key={key}
      activeTemplateId={templateId}
      language={language}
      rows={rows}
      fighterA={fighterA}
      fighterB={fighterB}
      portraitAAdjust={portraitAAdjust}
      portraitBAdjust={portraitBAdjust}
      averageA={averageA}
      averageB={averageB}
      title={(templatePresetById.get(templateId) || activeTemplatePreset).title}
      subtitle={(templatePresetById.get(templateId) || activeTemplatePreset).subtitle}
      factsA={factsA}
      factsB={factsB}
      profileA={profileA}
      profileB={profileB}
      powersA={powersA}
      powersB={powersB}
      crucialFeatsA={crucialFeatsA}
      crucialFeatsB={crucialFeatsB}
      winsA={winsA}
      winsB={winsB}
      fightLabel={currentFightLabel}
      templateBlocks={templateBlocks}
      activeFightId={activeFightId}
      activeFightFolderKey={activeFightRecord?.folderKey}
      slideImageAdjustments={slideImageAdjustments}
      onSlideImageAdjustChange={handleSlideImageAdjustChange}
      onSlideImageAdjustCommit={handleSlideImageAdjustCommit}
      onToggleLanguage={toggleLanguage}
      templateLayoutMode={templateLayoutMode}
    />
  )
  const renderedTemplate = renderTemplate(activeTemplate, `tpl-idx-${templateCursor}`)
  const renderedIncomingTemplate = (incomingTemplateId !== null && incomingTemplateCursor !== null)
    ? renderTemplate(incomingTemplateId, `tpl-idx-${incomingTemplateCursor}`)
    : null

  const scaledPreviewWidth = Math.round(PREVIEW_BASE_WIDTH * previewScale)
  const scaledPreviewHeight = Math.round(PREVIEW_BASE_HEIGHT * previewScale)
  const isBootView = bootGateActive || viewMode === 'boot'
  const isSearchView = viewMode === 'search'
  const isIntroView = viewMode === 'fight-intro'
  const isTemplateView = viewMode === 'fight'
  const isFightFlow = isIntroView || isTemplateView
  const canSwitchPortraitEditorSide = Boolean(portraitEditor?.mode === 'fight')

  const advanceStartupChromaticFlash = useCallback(() => {
    const colors = ['rgba(255,85,78,1)', '#77e2f2', '#ff0', '#fff', '#0cf', '#f80']
    const bandCount = 5 + Math.floor(Math.random() * 7)
    const nextBands: BootFlashBand[] = Array.from({ length: bandCount }, (_, index) => ({
      id: `boot-band-${startupGlitchFrameRef.current}-${index}`,
      top: `${Math.random() * 100}%`,
      height: `${1 + Math.random() * 14}%`,
      background: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.45 + Math.random() * 0.55,
    }))
    const translateX = (Math.random() - 0.5) * 35
    const skewX = (Math.random() - 0.5) * 6
    setStartupFlashBands(nextBands)
    setStartupFlashTransform(`translateX(${translateX}px) skewX(${skewX}deg)`)
  }, [])

  useEffect(() => {
    if (!bootGateActive) {
      if (startupGlitchIntervalRef.current !== null) {
        window.clearInterval(startupGlitchIntervalRef.current)
        startupGlitchIntervalRef.current = null
      }
      if (startupGlitchActive) {
        setStartupGlitchActive(false)
      }
      if (startupFlashBands.length) {
        setStartupFlashBands([])
      }
      if (startupFlashTransform) {
        setStartupFlashTransform('')
      }
      return
    }

    const isTypingTarget = (target: EventTarget | null) =>
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable)

    const handleBootKeydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
      if (isTypingTarget(event.target)) return
      if (event.key !== ' ' && event.code !== 'Space') return
      if (startupGlitchActive) return

      event.preventDefault()
      setStartupGlitchActive(true)
      startupGlitchFrameRef.current = 0
      advanceStartupChromaticFlash()
      if (startupGlitchIntervalRef.current !== null) {
        window.clearInterval(startupGlitchIntervalRef.current)
      }
      startupGlitchIntervalRef.current = window.setInterval(() => {
        startupGlitchFrameRef.current += 1
        if (startupGlitchFrameRef.current >= STARTUP_GLITCH_FRAMES) {
          if (startupGlitchIntervalRef.current !== null) {
            window.clearInterval(startupGlitchIntervalRef.current)
            startupGlitchIntervalRef.current = null
          }
          setStartupFlashBands([])
          setStartupFlashTransform('')
          setBootGateActive(false)
          showSearchImmediately()
          setStartupGlitchActive(false)
          return
        }
        advanceStartupChromaticFlash()
      }, STARTUP_GLITCH_INTERVAL_MS)
    }

    window.addEventListener('keydown', handleBootKeydown)
    return () => window.removeEventListener('keydown', handleBootKeydown)
  }, [
    advanceStartupChromaticFlash,
    bootGateActive,
    showSearchImmediately,
    startupFlashBands.length,
    startupFlashTransform,
    startupGlitchActive,
  ])

  useEffect(
    () => () => {
      if (startupGlitchIntervalRef.current !== null) {
        window.clearInterval(startupGlitchIntervalRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    if (!isTemplateView || !fightViewVisible || portraitEditor) return

    const isTypingTarget = (target: EventTarget | null) =>
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable)

    const handleTemplateKeydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
      if (isTypingTarget(event.target)) return

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        if (canStepTemplateBackward) {
          stepTemplateOrder(-1)
        }
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        if (canStepTemplateForward) {
          stepTemplateOrder(1)
        }
        return
      }

      if (templateLayoutMode === 'mobile' && (event.key === ' ' || event.code === 'Space')) {
        event.preventDefault()
        toggleTemplateMobilePanelSide()
      }
    }

    window.addEventListener('keydown', handleTemplateKeydown)
    return () => window.removeEventListener('keydown', handleTemplateKeydown)
  }, [
    canStepTemplateBackward,
    canStepTemplateForward,
    fightViewVisible,
    isTemplateView,
    portraitEditor,
    stepTemplateOrder,
    templateLayoutMode,
    toggleTemplateMobilePanelSide,
  ])

  useEffect(() => {
    if (!isTemplateView || !fightViewVisible || portraitEditor) return

    const handleMetaThreatClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) return
      const threatMetaLine = target.closest('.vs-tactical-board25-meta p:first-child')
      if (!threatMetaLine) return

      event.preventDefault()
      toggleTemplateLayoutMode()
    }

    window.addEventListener('click', handleMetaThreatClick)
    return () => window.removeEventListener('click', handleMetaThreatClick)
  }, [fightViewVisible, isTemplateView, portraitEditor, toggleTemplateLayoutMode])

  const dispatchSearchStageJump = useCallback(
    (stage: number) => {
      pendingSearchStageJumpRef.current = stage

      const frameWindow = searchFrameRef.current?.contentWindow
      if (viewMode === 'search' && frameWindow) {
        frameWindow.postMessage(
          { type: 'vvv-dev-jump-stage', stage },
          window.location.origin,
        )
        pendingSearchStageJumpRef.current = null
        return
      }

      showSearchImmediately()
    },
    [searchFrameRef, showSearchImmediately, viewMode],
  )

  const openFightByShortcutKey = useCallback(
    (shortcutKey: string) => {
      const normalizedShortcut = normalizeFightShortcutKey(shortcutKey)
      if (!normalizedShortcut) return false

      const shortcutOrdinal = FIGHT_SHORTCUT_ORDINAL[normalizedShortcut]
      const numberedPrefix = `${shortcutOrdinal} `
      const groupByNumber =
        folderFightGroups.find((group) =>
          group.fights.some((fight) => {
            const folder = (fight.folderKey || '').trim()
            const name = (fight.name || '').trim()
            const fileName = (fight.fileName || '').trim()
            return folder.startsWith(numberedPrefix) || name.startsWith(numberedPrefix) || fileName.startsWith(numberedPrefix)
          }),
        ) || null

      const group = groupByNumber || folderFightGroups[shortcutOrdinal - 1]
      if (!group) return false

      const targetFight =
        group.fights.find((fight) => fight.variantLocale === language) ||
        group.fights.find((fight) => preferredVariantByMatchup[group.matchupKey] === fight.id) ||
        group.fights[0] ||
        null

      if (!targetFight) return false

      rememberPreferredFightVariant(targetFight)
      clearFinalTemplateAutoReturnTimeout()
      openFightImmediately(targetFight)
      return true
    },
    [
      clearFinalTemplateAutoReturnTimeout,
      folderFightGroups,
      language,
      openFightImmediately,
      preferredVariantByMatchup,
      rememberPreferredFightVariant,
    ],
  )

  useEffect(() => {
    if (viewMode === 'boot') return

    const isTypingTarget = (target: EventTarget | null) =>
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable)

    const handleSearchStageJumpKeydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
      if (isTypingTarget(event.target)) return
      if (/^[1-4]$/.test(event.key)) {
        event.preventDefault()
        dispatchSearchStageJump(Number(event.key))
        return
      }

      const shortcutKey = normalizeFightShortcutKey(event.key) || normalizeFightShortcutKey(event.code)
      if (!shortcutKey) return

      if (!openFightByShortcutKey(shortcutKey)) return
      event.preventDefault()
    }

    window.addEventListener('keydown', handleSearchStageJumpKeydown)
    return () => window.removeEventListener('keydown', handleSearchStageJumpKeydown)
  }, [dispatchSearchStageJump, openFightByShortcutKey, viewMode])

  useEffect(() => {
    const handleSearchStageJumpMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const payload = event.data
      if (!payload || typeof payload !== 'object') return

      const typed = payload as { type?: unknown; stage?: unknown }
      if (typed.type !== 'vvv-dev-jump-stage-request') return
      if (!Number.isInteger(typed.stage)) return
      if (typed.stage < 1 || typed.stage > 5) return

      dispatchSearchStageJump(typed.stage)
    }

    window.addEventListener('message', handleSearchStageJumpMessage)
    return () => window.removeEventListener('message', handleSearchStageJumpMessage)
  }, [dispatchSearchStageJump])

  useEffect(() => {
    const handleFightShortcutMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const payload = event.data
      if (!payload || typeof payload !== 'object') return

      const typed = payload as { type?: unknown; key?: unknown; code?: unknown }
      if (typed.type !== 'vvv-dev-open-fight-shortcut-request') return
      const shortcutKey =
        (typeof typed.key === 'string' ? typed.key : null) ||
        (typeof typed.code === 'string' ? typed.code : null)
      if (!shortcutKey) return

      openFightByShortcutKey(shortcutKey)
    }

    window.addEventListener('message', handleFightShortcutMessage)
    return () => window.removeEventListener('message', handleFightShortcutMessage)
  }, [openFightByShortcutKey])

  const handleSearchFrameLoad = useCallback(() => {
    handleSearchFrameTransitionLoad()

    const stage = pendingSearchStageJumpRef.current
    if (!stage) return

    const frameWindow = searchFrameRef.current?.contentWindow
    if (!frameWindow) return

    frameWindow.postMessage(
      { type: 'vvv-dev-jump-stage', stage },
      window.location.origin,
    )
    pendingSearchStageJumpRef.current = null
  }, [handleSearchFrameTransitionLoad, searchFrameRef])

  if (isBootView) {
    return (
      <main
        data-vs-audit={auditRequest ? 'true' : 'false'}
        data-reverse-stage={reverseStage}
        data-vs-template-layout={templateLayoutMode}
        data-vs-mobile-panel={templateMobilePanelSide}
        data-vs-mobile-panel-switch={templateMobilePanelSwitchTo || 'none'}
        className="h-screen overflow-hidden bg-black p-0 text-slate-100"
      >
        <section className="vs-boot-screen">
          <div className="vs-boot-screen__repeater" aria-hidden="true">
            <div className="vs-boot-screen__repeater-content">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="vs-boot-screen__repeater-row">
                  <div className="vs-boot-screen__repeater-track">
                    {Array.from({ length: 20 }).map((_, j) => (
                      <span key={j}>Darkseid is.</span>
                    ))}
                    {/* Duplicate for seamless horizontal loop */}
                    {Array.from({ length: 20 }).map((_, j) => (
                      <span key={`dup-${j}`}>Darkseid is.</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="vs-boot-screen__flash" style={{ transform: startupFlashTransform }} aria-hidden="true">
            {startupFlashBands.map((band) => (
              <span
                key={band.id}
                className="vs-boot-screen__flash-band"
                style={{
                  top: band.top,
                  height: band.height,
                  background: band.background,
                  opacity: band.opacity,
                }}
              />
            ))}
          </div>
        </section>
      </main>
    )
  }

  return (
    <main
      data-vs-audit={auditRequest ? 'true' : 'false'}
      data-reverse-stage={reverseStage}
      data-vs-template-layout={templateLayoutMode}
      data-vs-mobile-panel={templateMobilePanelSide}
      data-vs-mobile-panel-switch={templateMobilePanelSwitchTo || 'none'}
      className={clsx(
        isTemplateView && 'vs-template-mode',
        'text-slate-100',
        isBootView
          ? 'h-screen overflow-hidden p-0'
          : isSearchView
          ? 'h-screen overflow-visible p-0'
          : isIntroView
            ? 'h-screen overflow-hidden p-0'
            : isTemplateView
            ? 'h-screen overflow-hidden px-2 py-2 sm:px-3 sm:py-3'
            : 'min-h-screen px-3 py-4 sm:px-4 sm:py-6',
      )}
    >
      <div className={clsx('max-w-none', isFightFlow || isSearchView ? 'flex h-full min-h-0 flex-col' : '')}>
        {viewMode === 'home' ? (
          <HomeView
            ui={ui}
            folderFights={folderFights}
            manualFights={manualFights}
            folderFightGroups={folderFightGroups}
            folderScanWarnings={folderScanWarnings}
            availableTemplates={localizedTemplates}
            activeFightId={activeFightId}
            preferredVariantByMatchup={preferredVariantByMatchup}
            onToggleLanguage={toggleLanguage}
            onCreateFightScaffold={createFightScaffold}
            onOpenFight={openFight}
            onRememberPreferredFightVariant={rememberPreferredFightVariant}
            onOpenSavedFightPortraitEditor={openSavedFightPortraitEditor}
            onDeleteFight={deleteFight}
          />
        ) : null}

        {viewMode === 'search' ? (
          <section className="relative z-0 h-full min-h-0 overflow-visible bg-[#111418]">
            <iframe
              ref={searchFrameRef}
              src={`/search/1.html?v=${SEARCH_IFRAME_VERSION}&flow=${encodeURIComponent(searchFlowMode)}&lang=${encodeURIComponent(language)}`}
              title="Fight Search"
              className="relative z-0 h-full w-full border-0"
              onLoad={handleSearchFrameLoad}
            />
          </section>
        ) : viewMode === 'home' ? null : viewMode === 'fight-intro' ? (
          <section className="relative z-0 h-full min-h-0 overflow-hidden bg-[#111418]">
            <div
              className="relative z-0 h-full w-full transition-opacity duration-[1200ms] ease-out"
              style={{
                opacity: introVisible ? 1 : 0,
                pointerEvents: introVisible ? 'auto' : 'none',
              }}
            >
              <iframe
                ref={introFrameRef}
                key={`${activeFightId || importFileName || 'intro'}-${introFlowMode}`}
                src={`/hyper-scroll-fight/index.html?v=${INTRO_IFRAME_VERSION}&flow=${encodeURIComponent(introFlowMode)}&lang=${encodeURIComponent(language)}&a=${encodeURIComponent(fighterA?.name || '')}&b=${encodeURIComponent(fighterB?.name || '')}&folder=${encodeURIComponent(activeFightRecord?.folderKey || '')}`}
                title="Fight Intro"
                className="relative z-0 h-full w-full border-0"
                style={{ pointerEvents: introVisible ? 'auto' : 'none' }}
                onLoad={handleIntroFrameLoad}
              />
            </div>
          </section>
        ) : (
          <FightPreviewStage
            ui={ui}
            activeTemplateLabel={activeTemplateLabel}
            templateCursor={templateCursor}
            templateOrderLength={templateOrder.length}
            canStepTemplateBackward={canStepTemplateBackward}
            canStepTemplateForward={canStepTemplateForward}
            fightViewVisible={fightViewVisible}
            onBackToLibrary={goBackToLibrary}
            onStepTemplateOrder={stepTemplateOrder}
            previewShellRef={previewShellRef}
            previewRef={previewRef}
            scaledPreviewWidth={scaledPreviewWidth}
            scaledPreviewHeight={scaledPreviewHeight}
            previewBaseWidth={PREVIEW_BASE_WIDTH}
            previewBaseHeight={PREVIEW_BASE_HEIGHT}
            previewScale={previewScale}
            previewReady={previewReady}
            activeTemplate={activeTemplate}
            activeFightFolderKey={activeFightRecord?.folderKey || ''}
            activeFightLocale={activeFightRecord?.variantLocale || language}
            templateTransitionPhase={templateTransitionPhase}
            panelSwitchLaserVisible={templateMobilePanelLaserVisible}
            panelSwitchLaserNonce={templateMobilePanelLaserNonce}
            incomingTemplate={renderedIncomingTemplate}
          >
            {renderedTemplate}
          </FightPreviewStage>
        )}
      </div>
      <PortraitEditorModal
        portraitEditor={portraitEditor}
        ui={ui}
        canSwitchSide={canSwitchPortraitEditorSide}
        onToggleSide={togglePortraitEditorSide}
        onUpdateAdjust={updatePortraitEditorAdjust}
        onResetAdjust={resetPortraitEditorAdjust}
        onClose={closePortraitEditor}
        onApply={applyPortraitEditor}
      />
      <SearchMorphOverlay
        visible={searchMorphVisible}
        direction={searchMorphDirection}
        handoff={searchMorphHandoff}
      />
      <MarvinEditor activeTemplateId={activeTemplate} />
    </main>
  )
}

export default App
