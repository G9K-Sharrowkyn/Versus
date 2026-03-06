import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import clsx from 'clsx'
import { getTranslations } from './i18n'
import { decodeImportTextBytes, INVALID_TEXT_ENCODING_ERROR } from './shared/textDecoding'
import { createPortal } from 'react-dom'
import { Crosshair, Trash2 } from 'lucide-react'
import type {
  Category,
  Fighter,
  FighterFact,
  FightRecord,
  FightVariantLocale,
  Frame,
  ImportDropTarget,
  Language,
  LayoutMode,
  ParsedVsImport,
  PointerRelayPayload,
  PointerRelaySource,
  PortraitAdjust,
  PortraitEditorState,
  ReverseStage,
  ScoreRow,
  SearchMorphHandoff,
  TemplateId,
  TemplatePreviewProps,
  Theme,
} from './features/vs/types'
import {
  DEFAULT_MORPH_SIZE,
  DEFAULT_TEMPLATE_ORDER,
  DEFAULT_WINNER_CV_A,
  DEFAULT_WINNER_CV_B,
  FIGHTER_A,
  FIGHTER_A_COLOR,
  FIGHTER_B,
  FIGHTER_B_COLOR,
  FINAL_TEMPLATE_ID,
  FRAME_CLASSES,
  LEGACY_ACTIVE_FIGHT_STORAGE_KEY,
  LEGACY_FIGHTS_STORAGE_KEY,
  LEGACY_MATCHUP_VARIANT_PREFS_KEY,
  META_MATCHUP_VARIANT_PREFS_KEY,
  MORPH_ORIGIN_SIZE_SHRINK_PX,
  TEMPLATE_PRESETS,
  THEME_CLASSES,
  THEME_OVERLAYS,
  defaultCategoriesFor,
  defaultFactsFor,
  injectDerivedTemplates,
  localizeTemplatePreset,
  pickLang,
} from './features/vs/presets'
import {
  FIGHT_TITLE_PORTRAIT_ASPECT,
  PORTRAIT_ADJUST_DEFAULT,
  PORTRAIT_SCALE_MAX,
  PORTRAIT_SCALE_MIN,
  avg,
  buildMatchupKeyFromNames,
  buildPortraitImageStyle,
  clamp,
  cloneFighter,
  enforceFileNameSideOrder,
  findFightByQuery,
  getViewportCenterHandoff,
  normalizePointerRelayPayload,
  normalizePortraitAdjust,
  normalizeSearchMorphHandoff,
  normalizeSlideImageAdjustments,
  normalizeToken,
  parseMatchupFromFileName,
  readFileAsDataUrl,
  resolveFightVariantLabel,
  resolveFightVariantLocaleFromFileName,
  stripFightLocaleSuffixFromLabel,
  stripFileExtension,
} from './features/vs/helpers'
import { buildImportTxtBlueprint, createCategoryPayload, parseVsImportText } from './features/vs/importer'
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
} from './features/vs/storage'
import { HudBarsTemplate, MethodologyTemplate, RadarBriefTemplate, TacticalBoardTemplate } from './features/vs/templates/statTemplates'
import { CharacterCardATemplate, CharacterCardBTemplate, WinnerCvTemplate } from './features/vs/templates/cardTemplates'
import { BlankTemplate, PowersToolsTemplate, RawFeatsTemplate } from './features/vs/templates/contentTemplates'

function App() {
  const defaultLanguage: Language = 'en'
  const [language, setLanguage] = useState<Language>(defaultLanguage)
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const translations = useMemo(() => getTranslations(language), [language])
  const initialTemplate = localizeTemplatePreset(TEMPLATE_PRESETS[0], defaultLanguage)
  const localizedTemplates = useMemo(
    () => TEMPLATE_PRESETS.map((template) => localizeTemplatePreset(template, language)),
    [language],
  )
  const importTxtBlueprint = useMemo(() => buildImportTxtBlueprint(language), [language])
  const ui = translations.ui

  const [activeTemplate, setActiveTemplate] = useState<TemplateId>(initialTemplate.id)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(initialTemplate.layout)
  const [title, setTitle] = useState(initialTemplate.title)
  const [subtitle, setSubtitle] = useState(initialTemplate.subtitle)
  const [categories, setCategories] = useState<Category[]>(() => defaultCategoriesFor(defaultLanguage))
  const [fighterA, setFighterA] = useState<Fighter>(() => cloneFighter(FIGHTER_A))
  const [fighterB, setFighterB] = useState<Fighter>(() => cloneFighter(FIGHTER_B))
  const [factsA, setFactsA] = useState<FighterFact[]>(() => defaultFactsFor('a', defaultLanguage))
  const [factsB, setFactsB] = useState<FighterFact[]>(() => defaultFactsFor('b', defaultLanguage))
  const [powersA, setPowersA] = useState<FighterFact[]>([])
  const [powersB, setPowersB] = useState<FighterFact[]>([])
  const [rawFeatsA, setRawFeatsA] = useState<string[]>([])
  const [rawFeatsB, setRawFeatsB] = useState<string[]>([])
  const [winsA, setWinsA] = useState<string[]>(DEFAULT_WINNER_CV_A)
  const [winsB, setWinsB] = useState<string[]>(DEFAULT_WINNER_CV_B)
  const [templateOrder, setTemplateOrder] = useState<TemplateId[]>(DEFAULT_TEMPLATE_ORDER)
  const [templateCursor, setTemplateCursor] = useState(0)
  const [templateBlocks, setTemplateBlocks] = useState<Record<string, string[]>>({})
  const [importFileName, setImportFileName] = useState('')
  const [viewMode, setViewMode] = useState<'search' | 'home' | 'fight-intro' | 'fight'>('search')
  const [introVisible, setIntroVisible] = useState(true)
  const [fightViewVisible, setFightViewVisible] = useState(true)
  const [searchMorphVisible, setSearchMorphVisible] = useState(false)
  const [searchMorphDirection, setSearchMorphDirection] = useState<'forward' | 'reverse'>('forward')
  const [reverseStage, setReverseStage] = useState<ReverseStage>('idle')
  const [introFlowMode, setIntroFlowMode] = useState<'forward' | 'reverse'>('forward')
  const [searchMorphHandoff, setSearchMorphHandoff] = useState<SearchMorphHandoff | null>(null)
  const [fights, setFights] = useState<FightRecord[]>([])
  const [folderScanWarnings, setFolderScanWarnings] = useState<string[]>([])
  const activeTemplateLabel =
    localizedTemplates.find((item) => item.id === activeTemplate)?.name || activeTemplate
  const [preferredVariantByMatchup, setPreferredVariantByMatchup] = useState<Record<string, string>>({})
  const [activeFightId, setActiveFightId] = useState<string | null>(null)
  const [storageReady, setStorageReady] = useState(false)
  const [draftPayload, setDraftPayload] = useState<ParsedVsImport | null>(null)
  const [draftTxtFileName, setDraftTxtFileName] = useState('')
  const [draftPortraitFileA, setDraftPortraitFileA] = useState<File | null>(null)
  const [draftPortraitFileB, setDraftPortraitFileB] = useState<File | null>(null)
  const [draftPortraitPreviewA, setDraftPortraitPreviewA] = useState('')
  const [draftPortraitPreviewB, setDraftPortraitPreviewB] = useState('')
  const [draftPortraitAdjustA, setDraftPortraitAdjustA] = useState<PortraitAdjust>({ ...PORTRAIT_ADJUST_DEFAULT })
  const [draftPortraitAdjustB, setDraftPortraitAdjustB] = useState<PortraitAdjust>({ ...PORTRAIT_ADJUST_DEFAULT })
  const [portraitEditor, setPortraitEditor] = useState<PortraitEditorState | null>(null)
  const [portraitAAdjust, setPortraitAAdjust] = useState<PortraitAdjust>({ ...PORTRAIT_ADJUST_DEFAULT })
  const [portraitBAdjust, setPortraitBAdjust] = useState<PortraitAdjust>({ ...PORTRAIT_ADJUST_DEFAULT })
  const [slideImageAdjustments, setSlideImageAdjustments] = useState<Record<string, PortraitAdjust>>({})
  const [activeDropTarget, setActiveDropTarget] = useState<ImportDropTarget | null>(null)
  const [frame, setFrame] = useState<Frame>(initialTemplate.frame)
  const [theme, setTheme] = useState<Theme>(initialTemplate.theme)
  const previewRef = useRef<HTMLDivElement>(null)
  const previewShellRef = useRef<HTMLDivElement>(null)
  const searchTransitionTimeoutsRef = useRef<number[]>([])
  const reverseTransitionTimeoutsRef = useRef<number[]>([])
  const finalTemplateAutoReturnTimeoutRef = useRef<number | null>(null)
  const searchTransitioningRef = useRef(false)
  const returnTransitioningRef = useRef(false)
  const searchCollapseAckedRef = useRef(false)
  const fightsRef = useRef<FightRecord[]>([])
  const activeFightIdRef = useRef<string | null>(null)
  const preferredVariantByMatchupRef = useRef<Record<string, string>>({})
  const folderScanWarningsRef = useRef<string[]>([])
  const activeFightSignatureRef = useRef('')
  const applyFightRecordRef = useRef<
    ((fight: FightRecord, options?: { enterIntro?: boolean; preserveTemplateSelection?: boolean }) => void) | null
  >(null)
  const introFrameReadyRef = useRef(false)
  const introBridgeReadyRef = useRef(false)
  const searchBridgeReadyRef = useRef(false)
  const reverseExplosionDispatchPendingRef = useRef(false)
  const reversePrimePendingRef = useRef(false)
  const introRevealPendingRef = useRef(false)
  const searchFrameRef = useRef<HTMLIFrameElement>(null)
  const introFrameRef = useRef<HTMLIFrameElement>(null)
  const draftTxtInputRef = useRef<HTMLInputElement>(null)
  const draftPortraitInputRefA = useRef<HTMLInputElement>(null)
  const draftPortraitInputRefB = useRef<HTMLInputElement>(null)
  const draftPortraitPreviewRef = useRef<{ a: string | null; b: string | null }>({ a: null, b: null })
  const portraitEditorPreviewRef = useRef<string | null>(null)
  const fightViewRevealTimeoutRef = useRef<number | null>(null)
  const reverseStageRef = useRef<ReverseStage>('idle')
  const [previewScale, setPreviewScale] = useState(1)
  const PREVIEW_BASE_WIDTH = 1400
  const PREVIEW_BASE_HEIGHT = 787.5
  const PREVIEW_MIN_SCALE = 0.62
  const PREVIEW_MAX_SCALE = 1.7
  const MORPH_POWER_OFF_MS = 1000
  const MORPH_RING_ON_MS = 1000
  const MORPH_FINAL_MS = 2000
  const MORPH_TOTAL_MS = MORPH_POWER_OFF_MS + MORPH_RING_ON_MS + MORPH_FINAL_MS
  const MORPH_OVERLAY_BUFFER_MS = 180
  const INTRO_MOUNT_AT_MS = 1200
  const INTRO_REVEAL_AT_MS = MORPH_TOTAL_MS - 220
  const SEARCH_COLLAPSE_WATCHDOG_MS = 5000
  const FIGHTS_SCAN_POLL_MS = 1200
  const FINAL_TEMPLATE_RETURN_DELAY_MS = 5000
  const REVERSE_EXPLOSION_WATCHDOG_MS = 5000

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
  }, [])

  const rows = useMemo<ScoreRow[]>(
    () =>
      categories.map((category) => {
        const a = clamp(fighterA.stats[category.id] ?? 0)
        const b = clamp(fighterB.stats[category.id] ?? 0)
        const delta = a - b
        return {
          id: category.id,
          label: category.label,
          a,
          b,
          delta,
          winner: delta === 0 ? 'draw' : delta > 0 ? 'a' : 'b',
        }
      }),
    [categories, fighterA.stats, fighterB.stats],
  )

  const averageA = useMemo(() => avg(rows, 'a'), [rows])
  const averageB = useMemo(() => avg(rows, 'b'), [rows])
  const folderFights = useMemo(() => fights.filter((fight) => fight.source === 'folder'), [fights])
  const manualFights = useMemo(() => fights.filter((fight) => fight.source !== 'folder'), [fights])
  const folderFightGroups = useMemo(() => {
    const map = new Map<
      string,
      { matchupKey: string; title: string; sortIndex: number; fights: FightRecord[] }
    >()
    folderFights.forEach((fight, index) => {
      const key = fight.matchupKey || normalizeToken(fight.name)
      const current = map.get(key)
      if (!current) {
        map.set(key, {
          matchupKey: key,
          title: stripFileExtension(fight.name) || stripFileExtension(fight.fileName),
          sortIndex: index,
          fights: [fight],
        })
        return
      }
      current.fights.push(fight)
      current.sortIndex = Math.min(current.sortIndex, index)
    })

    return Array.from(map.values())
      .map((group) => ({
        ...group,
        fights: [...group.fights].sort((left, right) => {
          const rank = (value: FightVariantLocale) => (value === 'pl' ? 0 : value === 'en' ? 1 : 2)
          const localeRank = rank(left.variantLocale) - rank(right.variantLocale)
          if (localeRank !== 0) return localeRank
          return left.fileName.localeCompare(right.fileName, undefined, {
            numeric: true,
            sensitivity: 'base',
          })
        }),
      }))
      .sort((left, right) => {
        if (left.sortIndex !== right.sortIndex) return left.sortIndex - right.sortIndex
        return left.title.localeCompare(right.title, undefined, { numeric: true, sensitivity: 'base' })
      })
  }, [folderFights])

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

  const flashStatus = (text: string) => {
    void text
  }

  const localizeImportError = (error: string) => {
    if (language === 'en') return error
    const missingSection = error.match(/missing section\s+(\d+)/i)
    if (missingSection?.[1]) {
      return translations.errors.importMissingSection.replace('{section}', missingSection[1])
    }
    if (/need stat lines/i.test(error)) {
      return translations.errors.importNeedStatLines
    }
    return error
  }

  const applyTemplateById = (templateId: TemplateId, shouldFlash = true) => {
    const preset = localizedTemplates.find((item) => item.id === templateId)
    if (!preset) return
    setActiveTemplate(preset.id)
    setLayoutMode(preset.layout)
    setFrame(preset.frame)
    setTheme(preset.theme)
    setTitle(preset.title)
    setSubtitle(preset.subtitle)
    if (shouldFlash) {
      flashStatus(`${ui.templateLoaded}: ${preset.name}`)
    }
  }

  const stepTemplateOrder = (direction: 1 | -1) => {
    if (!templateOrder.length) return
    const next = (templateCursor + direction + templateOrder.length) % templateOrder.length
    setTemplateCursor(next)
    applyTemplateById(templateOrder[next], false)
  }

  const closePortraitEditor = (options?: { revokePreview?: boolean }) => {
    const revokePreview = options?.revokePreview ?? true
    setPortraitEditor((current) => {
      if (current?.previewUrl && revokePreview && current.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(current.previewUrl)
      }
      return null
    })
  }

  const commitDraftPortrait = (side: 'a' | 'b', file: File, previewUrl: string, adjust: PortraitAdjust) => {
    const previous = draftPortraitPreviewRef.current[side]
    if (previous && previous !== previewUrl) URL.revokeObjectURL(previous)
    draftPortraitPreviewRef.current[side] = previewUrl

    const normalizedAdjust = normalizePortraitAdjust(adjust)
    if (side === 'a') {
      setDraftPortraitFileA(file)
      setDraftPortraitPreviewA(previewUrl)
      setDraftPortraitAdjustA(normalizedAdjust)
      return
    }

    setDraftPortraitFileB(file)
    setDraftPortraitPreviewB(previewUrl)
    setDraftPortraitAdjustB(normalizedAdjust)
  }

  const openDraftPortraitEditor = (side: 'a' | 'b', file: File) => {
    const previewUrl = URL.createObjectURL(file)
    const baseAdjust = side === 'a' ? draftPortraitAdjustA : draftPortraitAdjustB
    setPortraitEditor((current) => {
      if (current?.previewUrl && current.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(current.previewUrl)
      }
      return {
        mode: 'draft',
        side,
        file,
        previewUrl,
        adjust: normalizePortraitAdjust(baseAdjust),
      }
    })
  }

  const openSavedFightPortraitEditor = (fightId: string, side: 'a' | 'b') => {
    const match = fights.find((fight) => fight.id === fightId)
    if (!match) return
    const previewUrl = side === 'a' ? match.portraitADataUrl : match.portraitBDataUrl
    if (!previewUrl) return
    const baseAdjust = side === 'a' ? match.portraitAAdjust : match.portraitBAdjust
    setPortraitEditor((current) => {
      if (current?.previewUrl && current.previewUrl.startsWith('blob:')) {
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

  const applyPortraitEditor = () => {
    if (!portraitEditor) return
    if (portraitEditor.mode === 'draft') {
      commitDraftPortrait(
        portraitEditor.side,
        portraitEditor.file,
        portraitEditor.previewUrl,
        portraitEditor.adjust,
      )
      closePortraitEditor({ revokePreview: false })
      return
    }

    const nextAdjust = normalizePortraitAdjust(portraitEditor.adjust)
    setFights((current) =>
      current.map((fight) => {
        if (fight.id !== portraitEditor.fightId) return fight
        if (portraitEditor.side === 'a') {
          return {
            ...fight,
            portraitAAdjust: nextAdjust,
          }
        }
        return {
          ...fight,
          portraitBAdjust: nextAdjust,
        }
      }),
    )

    if (activeFightId === portraitEditor.fightId) {
      if (portraitEditor.side === 'a') setPortraitAAdjust(nextAdjust)
      if (portraitEditor.side === 'b') setPortraitBAdjust(nextAdjust)
    }

    closePortraitEditor({ revokePreview: false })
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

    setSlideImageAdjustments((current) => ({
      ...current,
      [normalizedKey]: normalizedAdjust,
    }))

    if (!activeFightId) return
    setFights((current) =>
      current.map((fight) => {
        if (fight.id !== activeFightId) return fight
        return {
          ...fight,
          slideImageAdjustments: {
            ...normalizeSlideImageAdjustments(fight.slideImageAdjustments),
            [normalizedKey]: normalizedAdjust,
          },
        }
      }),
    )
  }

  const togglePortraitEditorSide = () => {
    setPortraitEditor((current) => {
      if (!current) return current
      const nextSide = current.side === 'a' ? 'b' : 'a'

      if (current.mode === 'draft') {
        const nextFile = nextSide === 'a' ? draftPortraitFileA : draftPortraitFileB
        if (!nextFile) return current
        const nextPreviewUrl = URL.createObjectURL(nextFile)
        if (current.previewUrl.startsWith('blob:') && current.previewUrl !== nextPreviewUrl) {
          URL.revokeObjectURL(current.previewUrl)
        }
        const nextAdjust = nextSide === 'a' ? draftPortraitAdjustA : draftPortraitAdjustB
        return {
          mode: 'draft',
          side: nextSide,
          file: nextFile,
          previewUrl: nextPreviewUrl,
          adjust: normalizePortraitAdjust(nextAdjust),
        }
      }

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

  const clearDraftPortraits = () => {
    closePortraitEditor()
    const oldA = draftPortraitPreviewRef.current.a
    const oldB = draftPortraitPreviewRef.current.b
    if (oldA) URL.revokeObjectURL(oldA)
    if (oldB) URL.revokeObjectURL(oldB)
    draftPortraitPreviewRef.current = { a: null, b: null }
    setDraftPortraitFileA(null)
    setDraftPortraitFileB(null)
    setDraftPortraitPreviewA('')
    setDraftPortraitPreviewB('')
    setDraftPortraitAdjustA({ ...PORTRAIT_ADJUST_DEFAULT })
    setDraftPortraitAdjustB({ ...PORTRAIT_ADJUST_DEFAULT })
  }

  const isImportTxtFile = (file: File) => {
    const name = file.name.toLowerCase()
    return name.endsWith('.txt') || file.type === 'text/plain'
  }

  const isImportImageFile = (file: File) => {
    const name = file.name.toLowerCase()
    return file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i.test(name)
  }

  const parseDraftImportFromFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer()
      const raw = decodeImportTextBytes(new Uint8Array(buffer))
      const parsed = parseVsImportText(raw)
      if (!parsed.ok) {
        flashStatus(localizeImportError(parsed.error))
        return
      }

      const payload = enforceFileNameSideOrder(parsed.data, file.name)
      setDraftPayload(payload)
      setDraftTxtFileName(file.name)
    } catch (error) {
      if (error instanceof Error && error.message === INVALID_TEXT_ENCODING_ERROR) {
        flashStatus(translations.encoding.invalidEncoding)
        return
      }
      flashStatus(ui.importFailed)
    }
  }

  const handleDropZoneDragEnter =
    (target: ImportDropTarget) => (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setActiveDropTarget(target)
    }

  const handleDropZoneDragOver =
    (target: ImportDropTarget) => (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      event.dataTransfer.dropEffect = 'copy'
      if (activeDropTarget !== target) {
        setActiveDropTarget(target)
      }
    }

  const handleDropZoneDragLeave =
    (target: ImportDropTarget) => (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const nextTarget = event.relatedTarget as Node | null
      if (nextTarget && event.currentTarget.contains(nextTarget)) return
      setActiveDropTarget((current) => (current === target ? null : current))
    }

  const handleTxtDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setActiveDropTarget((current) => (current === 'txt' ? null : current))
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    if (!isImportTxtFile(file)) {
      flashStatus(ui.invalidTxtType)
      return
    }
    void parseDraftImportFromFile(file)
  }

  const handlePortraitDrop =
    (side: 'a' | 'b') => (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const target = side === 'a' ? 'a' : 'b'
      setActiveDropTarget((current) => (current === target ? null : current))
      const file = event.dataTransfer.files?.[0]
      if (!file) return
      if (!isImportImageFile(file)) {
        flashStatus(ui.invalidImageType)
        return
      }
      openDraftPortraitEditor(side, file)
    }

  const handleDraftPortraitUpload =
    (side: 'a' | 'b') => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return
      if (!isImportImageFile(file)) {
        flashStatus(ui.invalidImageType)
        event.target.value = ''
        return
      }
      openDraftPortraitEditor(side, file)
      event.target.value = ''
    }

  const handleDraftImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!isImportTxtFile(file)) {
      flashStatus(ui.invalidTxtType)
      event.target.value = ''
      return
    }

    await parseDraftImportFromFile(file)
    event.target.value = ''
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

  const clearFinalTemplateAutoReturnTimeout = () => {
    if (finalTemplateAutoReturnTimeoutRef.current !== null) {
      window.clearTimeout(finalTemplateAutoReturnTimeoutRef.current)
      finalTemplateAutoReturnTimeoutRef.current = null
    }
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

  const resolveFightLanguage = (fight: FightRecord, fallback: Language): Language => {
    if (fight.variantLocale === 'pl' || fight.variantLocale === 'en') return fight.variantLocale
    const inferred = resolveFightVariantLocaleFromFileName(fight.fileName)
    if (inferred === 'pl' || inferred === 'en') return inferred
    return fallback
  }

  const applyFightRecord = (
    fight: FightRecord,
    options?: { enterIntro?: boolean; preserveTemplateSelection?: boolean },
  ) => {
    const payload = enforceFileNameSideOrder(fight.payload, fight.fileName || fight.name)
    const targetLanguage = resolveFightLanguage(fight, language)
    const categoryPayload = createCategoryPayload(payload.statsA, payload.statsB)
    const importedOrder = injectDerivedTemplates(
      payload.templateOrder.length ? payload.templateOrder : DEFAULT_TEMPLATE_ORDER,
      payload,
    )
    let nextTemplate = importedOrder[0] || DEFAULT_TEMPLATE_ORDER[0]
    let nextTemplateCursor = 0

    if (options?.preserveTemplateSelection && importedOrder.length) {
      const currentTemplateIndex = importedOrder.indexOf(activeTemplate)
      if (currentTemplateIndex >= 0) {
        nextTemplate = importedOrder[currentTemplateIndex]
        nextTemplateCursor = currentTemplateIndex
      } else if (templateCursor >= 0 && templateCursor < importedOrder.length) {
        nextTemplate = importedOrder[templateCursor]
        nextTemplateCursor = templateCursor
      }
    }

    setCategories(categoryPayload.categories)
    setFighterA({
      ...cloneFighter(FIGHTER_A),
      name: stripFightLocaleSuffixFromLabel(payload.fighterAName),
      subtitle: FIGHTER_A.subtitle,
      color: FIGHTER_A_COLOR,
      imageUrl: fight.portraitADataUrl,
      stats: categoryPayload.statsRecordA,
    })
    setFighterB({
      ...cloneFighter(FIGHTER_B),
      name: stripFightLocaleSuffixFromLabel(payload.fighterBName),
      subtitle: FIGHTER_B.subtitle,
      color: FIGHTER_B_COLOR,
      imageUrl: fight.portraitBDataUrl,
      stats: categoryPayload.statsRecordB,
    })
    setPortraitAAdjust(normalizePortraitAdjust(fight.portraitAAdjust))
    setPortraitBAdjust(normalizePortraitAdjust(fight.portraitBAdjust))
    setSlideImageAdjustments(normalizeSlideImageAdjustments(fight.slideImageAdjustments))

    setLanguage(targetLanguage)
    setFactsA(payload.factsA.length ? payload.factsA.slice(0, 5) : defaultFactsFor('a', targetLanguage))
    setFactsB(payload.factsB.length ? payload.factsB.slice(0, 5) : defaultFactsFor('b', targetLanguage))
    setPowersA(payload.powersA.slice(0, 8))
    setPowersB(payload.powersB.slice(0, 8))
    setRawFeatsA(payload.rawFeatsA.slice(0, 8))
    setRawFeatsB(payload.rawFeatsB.slice(0, 8))
    setWinsA(payload.winsA.length ? payload.winsA.slice(0, 12) : DEFAULT_WINNER_CV_A)
    setWinsB(payload.winsB.length ? payload.winsB.slice(0, 12) : DEFAULT_WINNER_CV_B)
    setTemplateBlocks(payload.templateBlocks)
    setTemplateOrder(importedOrder)
    setTemplateCursor(nextTemplateCursor)
    setImportFileName(fight.fileName)
    setActiveFightId(fight.id)
    activeFightSignatureRef.current = buildFightRefreshSignature(fight)
    if (options?.enterIntro ?? true) {
      clearSearchTransitionQueue()
      setIntroVisible(true)
      setViewMode('fight-intro')
    }
    applyTemplateById(nextTemplate, false)
  }

  useEffect(() => {
    applyFightRecordRef.current = applyFightRecord
  }, [applyFightRecord])

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
    }, INTRO_MOUNT_AT_MS)

    const introRevealTimeout = window.setTimeout(() => {
      if (introFrameReadyRef.current) {
        setIntroVisible(true)
      } else {
        introRevealPendingRef.current = true
      }
    }, INTRO_REVEAL_AT_MS)

    const hideMorphTimeout = window.setTimeout(() => {
      setSearchMorphVisible(false)
      setSearchMorphDirection('forward')
      searchTransitioningRef.current = false
      searchCollapseAckedRef.current = false
    }, MORPH_TOTAL_MS + MORPH_OVERLAY_BUFFER_MS)

    searchTransitionTimeoutsRef.current.push(introMountTimeout, introRevealTimeout, hideMorphTimeout)
  }

  const startSearchFightTransition = (fight: FightRecord) => {
    if (searchTransitioningRef.current) return
    clearReturnTransitionQueue()
    clearSearchTransitionQueue()
    searchTransitioningRef.current = true
    applyFightRecord(fight, { enterIntro: false })
    postMessageToSearchFrame({ type: 'vvv-search-collapse' })
    introFrameReadyRef.current = false
    introRevealPendingRef.current = false
    setIntroFlowMode('forward')
    setIntroVisible(false)

    const collapseWatchdogTimeout = window.setTimeout(() => {
      runSearchMorphSequence(null)
    }, SEARCH_COLLAPSE_WATCHDOG_MS)

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

    const hideMorphDelayMs = MORPH_TOTAL_MS + MORPH_OVERLAY_BUFFER_MS

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
      const sent = postMessageToSearchFrame({ type: 'vvv-search-prime-collapsed' })
      if (!sent) return
    }, 1200)

    const primeWatchdogTimeout = window.setTimeout(() => {
      if (!returnTransitioningRef.current) return
      completeReverseMorphToSearch(null)
    }, SEARCH_COLLAPSE_WATCHDOG_MS)

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
    const sent = postMessageToSearchFrame({ type: 'vvv-search-prime-collapsed' })
    if (!sent) return
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
    }, REVERSE_EXPLOSION_WATCHDOG_MS)

    reverseTransitionTimeoutsRef.current.push(reverseDispatchTimeout, reverseDispatchPump, reverseExplosionWatchdog)
  }

  const createFightFromDraft = async () => {
    if (!draftPayload) {
      flashStatus(ui.draftNeedTxt)
      return
    }
    if (!draftPortraitFileA || !draftPortraitFileB) {
      flashStatus(ui.draftNeedPortraits)
      return
    }

    try {
      const [portraitADataUrl, portraitBDataUrl] = await Promise.all([
        readFileAsDataUrl(draftPortraitFileA),
        readFileAsDataUrl(draftPortraitFileB),
      ])

      const fallbackName = `${draftPayload.fighterAName} vs ${draftPayload.fighterBName}`.trim()
      const derivedName = stripFileExtension(draftTxtFileName) || fallbackName || tr('Nowa Walka', 'New Fight')
      const fileMatchup = parseMatchupFromFileName(draftTxtFileName)
      const matchupKey = buildMatchupKeyFromNames(
        fileMatchup?.leftName || draftPayload.fighterAName,
        fileMatchup?.rightName || draftPayload.fighterBName,
      )
      const variantLocale = resolveFightVariantLocaleFromFileName(draftTxtFileName)
      const variantLabel = resolveFightVariantLabel(draftTxtFileName || `${derivedName}.txt`, variantLocale)
      const fight: FightRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: derivedName,
        fileName: draftTxtFileName || `${derivedName}.txt`,
        createdAt: Date.now(),
        source: 'manual',
        matchupKey,
        variantLocale,
        variantLabel,
        payload: draftPayload,
        portraitADataUrl,
        portraitBDataUrl,
        portraitAAdjust: normalizePortraitAdjust(draftPortraitAdjustA),
        portraitBAdjust: normalizePortraitAdjust(draftPortraitAdjustB),
        slideImageAdjustments: {},
      }

      setFights((current) => {
        const folderOnly = current.filter((item) => item.source === 'folder')
        const manualOnly = current.filter((item) => item.source !== 'folder')
        return [...folderOnly, fight, ...manualOnly]
      })
      setDraftPayload(null)
      setDraftTxtFileName('')
      clearDraftPortraits()
      flashStatus(`${ui.fightAdded}: ${fight.name}`)
    } catch {
      flashStatus(ui.importFailed)
    }
  }

  const rememberPreferredFightVariant = (fight: FightRecord) => {
    if (!fight.matchupKey) return
    setPreferredVariantByMatchup((current) => {
      if (current[fight.matchupKey] === fight.id) return current
      return {
        ...current,
        [fight.matchupKey]: fight.id,
      }
    })
  }

  const openFight = (fightId: string) => {
    const match = fights.find((item) => item.id === fightId)
    if (!match) return
    rememberPreferredFightVariant(match)
    applyFightRecord(match)
  }

  const deleteFight = (fightId: string) => {
    const match = fights.find((item) => item.id === fightId)
    if (!match) return
    if (match.source === 'folder') return
    const confirmed = window.confirm(`${ui.deleteFightConfirm}\n\n${match.name}`)
    if (!confirmed) return

    setFights((current) => current.filter((item) => item.id !== fightId))
    if (activeFightId === fightId) {
      setActiveFightId(null)
      setViewMode('home')
    }
  }

  const goBackToLibrary = () => {
    clearReturnTransitionQueue()
    clearSearchTransitionQueue()
    clearFightViewRevealTimeout()
    setFightViewVisible(true)
    setViewMode('home')
    setActiveFightId(null)
  }

  const copyImportBlueprint = async () => {
    try {
      await navigator.clipboard.writeText(importTxtBlueprint)
      flashStatus(ui.blueprintCopied)
    } catch {
      flashStatus(ui.clipboardBlocked)
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

  useEffect(() => {
    const localizedActive = localizedTemplates.find((item) => item.id === activeTemplate)
    if (!localizedActive) return
    setTitle(localizedActive.title)
    setSubtitle(localizedActive.subtitle)
  }, [activeTemplate, language, localizedTemplates])

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
        applyFightRecord(restoredActiveFight, { enterIntro: false })
      }

      setStorageReady(true)
    }

    void restorePersistedFights()

    return () => {
      mounted = false
    }
  }, [])

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
        const currentWarnings = folderScanWarningsRef.current
        const currentWarningsSignature = JSON.stringify(currentWarnings)
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

        const currentActiveFightId = activeFightIdRef.current
        const nextActiveFight = currentActiveFightId
          ? mergedFights.find((fight) => fight.id === currentActiveFightId) || null
          : null
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
    const intervalId = window.setInterval(refreshFolderFights, FIGHTS_SCAN_POLL_MS)
    return () => {
      disposed = true
      window.clearInterval(intervalId)
    }
  }, [FIGHTS_SCAN_POLL_MS, storageReady])

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
        // Ignore storage write failures (quota/private mode).
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

  useEffect(() => {
    if (importFileName || Object.keys(templateBlocks).length) return
    setCategories(defaultCategoriesFor(language))
    setFactsA(defaultFactsFor('a', language))
    setFactsB(defaultFactsFor('b', language))
    setPowersA([])
    setPowersB([])
    setRawFeatsA([])
    setRawFeatsB([])
    setSlideImageAdjustments({})
  }, [importFileName, language, templateBlocks])

  const activeFightRecord = useMemo(
    () => fights.find((fight) => fight.id === activeFightId) || null,
    [fights, activeFightId],
  )

  const renderTemplate = () => {
    const currentFightLabel =
      stripFileExtension(importFileName) ||
      `${fighterA.name || tr('Postac A', 'Fighter A')} vs ${fighterB.name || tr('Postac B', 'Fighter B')}`
    const commonProps: TemplatePreviewProps = {
      activeTemplateId: activeTemplate,
      language,
      rows,
      fighterA,
      fighterB,
      portraitAAdjust,
      portraitBAdjust,
      averageA,
      averageB,
      title,
      subtitle,
      factsA,
      factsB,
      powersA,
      powersB,
      rawFeatsA,
      rawFeatsB,
      winsA,
      winsB,
      fightLabel: currentFightLabel,
      templateBlocks,
      activeFightId,
      activeFightFolderKey: activeFightRecord?.folderKey,
      slideImageAdjustments,
      onSlideImageAdjustChange: handleSlideImageAdjustChange,
      onSlideImageAdjustCommit: handleSlideImageAdjustCommit,
    }
    if (activeTemplate === 'powers-tools') {
      return <PowersToolsTemplate {...commonProps} />
    }
    if (activeTemplate === 'raw-feats') {
      return <RawFeatsTemplate {...commonProps} />
    }
    switch (layoutMode) {
      case 'radarBrief':
        return <RadarBriefTemplate {...commonProps} />
      case 'tacticalBoard':
        return <TacticalBoardTemplate {...commonProps} />
      case 'winnerCv':
        return <WinnerCvTemplate {...commonProps} />
      case 'characterCardA':
        return <CharacterCardATemplate {...commonProps} />
      case 'characterCardB':
        return <CharacterCardBTemplate {...commonProps} />
      case 'blankTemplate':
        return <BlankTemplate {...commonProps} />
      case 'methodology':
        return <MethodologyTemplate {...commonProps} />
      default:
        return <HudBarsTemplate {...commonProps} />
    }
  }

  useEffect(() => {
    const shell = previewShellRef.current
    if (!shell) return

    const updateScale = () => {
      const availableWidth = Math.max(320, shell.clientWidth - 24)
      const availableHeight = Math.max(320, shell.clientHeight - 24)
      const scaleFromWidth = availableWidth / PREVIEW_BASE_WIDTH
      const scaleFromHeight = availableHeight / PREVIEW_BASE_HEIGHT
      const boundedScale = Math.min(scaleFromWidth, scaleFromHeight)
      const nextScale = Math.max(PREVIEW_MIN_SCALE, Math.min(PREVIEW_MAX_SCALE, boundedScale))
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
  }, [PREVIEW_BASE_HEIGHT, PREVIEW_BASE_WIDTH, PREVIEW_MAX_SCALE, PREVIEW_MIN_SCALE, viewMode])

  useEffect(
    () => () => {
      const oldA = draftPortraitPreviewRef.current.a
      const oldB = draftPortraitPreviewRef.current.b
      if (oldA) URL.revokeObjectURL(oldA)
      if (oldB) URL.revokeObjectURL(oldB)
      const editorPreview = portraitEditorPreviewRef.current
      if (editorPreview && editorPreview.startsWith('blob:')) URL.revokeObjectURL(editorPreview)
    },
    [],
  )

  useEffect(() => {
    portraitEditorPreviewRef.current = portraitEditor?.previewUrl || null
  }, [portraitEditor])

  useEffect(
    () => () => {
      clearSearchTransitionQueue()
      clearReturnTransitionQueue()
    },
    [],
  )

  useEffect(() => {
    clearFinalTemplateAutoReturnTimeout()
    if (viewMode !== 'fight' || activeTemplate !== FINAL_TEMPLATE_ID) return
    if (returnTransitioningRef.current) return

    finalTemplateAutoReturnTimeoutRef.current = window.setTimeout(() => {
      startFightReturnTransition()
    }, FINAL_TEMPLATE_RETURN_DELAY_MS)

    return () => {
      clearFinalTemplateAutoReturnTimeout()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTemplate, viewMode, activeFightId, templateCursor])

  const scaledPreviewWidth = Math.round(PREVIEW_BASE_WIDTH * previewScale)
  const scaledPreviewHeight = Math.round(PREVIEW_BASE_HEIGHT * previewScale)
  const isSearchView = viewMode === 'search'
  const isIntroView = viewMode === 'fight-intro'
  const isTemplateView = viewMode === 'fight'
  const isFightFlow = isIntroView || isTemplateView
  const isEmbeddedFullscreenView = isSearchView || isIntroView
  const morphHandoff = searchMorphHandoff ?? getViewportCenterHandoff()
  const morphOriginSize = Math.max(
    28,
    Math.min(
      120,
      ((morphHandoff.width + morphHandoff.height) / 2 || DEFAULT_MORPH_SIZE) - MORPH_ORIGIN_SIZE_SHRINK_PX,
    ),
  )
  const searchMorphAnchorStyle = {
    '--vvv-origin-x': `${morphHandoff.x}px`,
    '--vvv-origin-y': `${morphHandoff.y}px`,
    '--vvv-origin-size': `${morphOriginSize}px`,
  } as Record<string, string>

  const renderFightLibraryCard = (fight: FightRecord) => (
    (() => {
      const isActive = activeFightId === fight.id
      const isPreferred = preferredVariantByMatchup[fight.matchupKey] === fight.id
      const localeLabel =
        fight.variantLocale === 'pl' ? ui.variantPl : fight.variantLocale === 'en' ? ui.variantEn : ui.variantUnknown

      return (
        <div
          key={fight.id}
          className={clsx(
            'flex items-stretch gap-2 rounded-xl border p-2 transition',
            isActive
              ? 'border-cyan-300/55 bg-cyan-500/16'
              : 'border-slate-600/70 bg-slate-900/60 hover:border-slate-400',
          )}
        >
          <button type="button" onClick={() => openFight(fight.id)} className="min-w-0 flex-1 rounded-lg px-2 py-1 text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-100">{fight.name}</p>
                <p className="mt-1 truncate text-xs text-slate-300">
                  {fight.payload.fighterAName} vs {fight.payload.fighterBName}
                </p>
                <p className="mt-1 truncate text-[11px] text-slate-400">{fight.fileName}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="rounded-xl border border-slate-500/65 bg-slate-800/70 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-100">
                  {localeLabel}
                </span>
                <span className="rounded-xl border border-cyan-300/45 bg-cyan-400/15 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-cyan-100">
                  {ui.openFight}
                </span>
              </div>
            </div>
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => rememberPreferredFightVariant(fight)}
              className={clsx(
                'flex h-10 items-center justify-center rounded-lg border px-3 text-[11px] font-semibold uppercase tracking-[0.12em] transition',
                isPreferred
                  ? 'border-emerald-300/50 bg-emerald-500/18 text-emerald-100 hover:bg-emerald-500/24'
                  : 'border-emerald-300/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/18',
              )}
              title={ui.selectVariant}
            >
              {isPreferred ? ui.selectedVariant : ui.selectVariant}
            </button>
            <button
              type="button"
              onClick={() => openSavedFightPortraitEditor(fight.id, 'a')}
              className="flex h-10 items-center justify-center rounded-lg border border-sky-300/45 bg-sky-500/12 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-100 transition hover:bg-sky-500/24"
              aria-label={ui.adjustPortraitsAria}
              title={ui.adjustPortraits}
            >
              <Crosshair size={14} className="mr-1" />
              {ui.adjustPortraits}
            </button>
            {fight.source === 'manual' ? (
              <button
                type="button"
                onClick={() => deleteFight(fight.id)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-300/45 bg-rose-500/12 text-rose-200 transition hover:bg-rose-500/24"
                aria-label={ui.deleteFightAria}
                title={ui.deleteFight}
              >
                <Trash2 size={16} />
              </button>
            ) : null}
          </div>
        </div>
      )
    })()
  )

  const searchMorphOverlay =
    searchMorphVisible && typeof document !== 'undefined'
      ? createPortal(
          <div
            className={clsx(
              'vvv-morph-stage is-running pointer-events-none fixed inset-0 z-[2147483647]',
              searchMorphDirection === 'reverse' && 'is-reverse',
            )}
          >
            <div className="vvv-logo-morph-anchor" style={searchMorphAnchorStyle}>
              <div
                className={clsx('vvv-logo-morph is-running', searchMorphDirection === 'reverse' && 'is-reverse')}
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
      : null

  const portraitEditorOverlay =
    portraitEditor && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-[2147483646] flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-2xl border border-cyan-300/35 bg-slate-950/96 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.62)]">
              <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-700/70 pb-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-100">{ui.portraitEditorTitle}</p>
                  <p className="mt-1 text-xs text-slate-300">{ui.portraitEditorHint}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      'rounded-md border px-2 py-1 text-[11px] uppercase tracking-[0.14em]',
                      portraitEditor.side === 'a'
                        ? 'border-sky-300/55 bg-sky-500/15 text-sky-200'
                        : 'border-rose-300/55 bg-rose-500/15 text-rose-200',
                    )}
                  >
                    {portraitEditor.side === 'a' ? ui.portraitA : ui.portraitB}
                  </span>
                  {(portraitEditor.mode === 'fight' || (draftPortraitFileA && draftPortraitFileB)) ? (
                    <button type="button" className="button-soft" onClick={togglePortraitEditorSide}>
                      {ui.portraitSwitchSide}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
                <div className="rounded-xl border border-slate-700/80 bg-black/55 p-3">
                  <div
                    className="relative mx-auto w-full max-w-[430px] overflow-hidden rounded-lg border border-slate-600/70 bg-slate-900/80"
                    style={{ aspectRatio: `${FIGHT_TITLE_PORTRAIT_ASPECT}` }}
                  >
                    <img
                      src={portraitEditor.previewUrl}
                      alt="portrait-editor-preview"
                      className="h-full w-full object-cover"
                      style={buildPortraitImageStyle(portraitEditor.adjust)}
                    />
                    <div className="pointer-events-none absolute inset-0 border-2 border-white/15" />
                    <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:28px_28px]" />
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
                  <label className="block">
                    <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-slate-300">
                      {ui.portraitPosX}: {Math.round(portraitEditor.adjust.x)}%
                    </p>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={portraitEditor.adjust.x}
                      onChange={(event) => updatePortraitEditorAdjust({ x: Number(event.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </label>

                  <label className="block">
                    <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-slate-300">
                      {ui.portraitPosY}: {Math.round(portraitEditor.adjust.y)}%
                    </p>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={portraitEditor.adjust.y}
                      onChange={(event) => updatePortraitEditorAdjust({ y: Number(event.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </label>

                  <label className="block">
                    <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-slate-300">
                      {ui.portraitZoom}: {portraitEditor.adjust.scale.toFixed(2)}x
                    </p>
                    <input
                      type="range"
                      min={PORTRAIT_SCALE_MIN}
                      max={PORTRAIT_SCALE_MAX}
                      step={0.01}
                      value={portraitEditor.adjust.scale}
                      onChange={(event) => updatePortraitEditorAdjust({ scale: Number(event.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </label>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button type="button" className="button-soft" onClick={resetPortraitEditorAdjust}>
                      {ui.portraitReset}
                    </button>
                    <button type="button" className="button-soft" onClick={() => closePortraitEditor()}>
                      {ui.portraitCancel}
                    </button>
                    <button type="button" className="button-soft" onClick={applyPortraitEditor}>
                      {ui.portraitApply}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <main
      data-reverse-stage={reverseStage}
      className={clsx(
        'text-slate-100',
        isEmbeddedFullscreenView
          ? 'h-screen overflow-hidden p-0'
          : isTemplateView
            ? 'h-screen overflow-hidden px-2 py-2 sm:px-3 sm:py-3'
            : 'min-h-screen px-3 py-4 sm:px-4 sm:py-6',
      )}
    >
      <div className={clsx('max-w-none', isFightFlow || isSearchView ? 'flex h-full min-h-0 flex-col' : '')}>
        {viewMode === 'home' ? (
          <header className="relative mb-4 overflow-hidden rounded-2xl border border-cyan-300/35 bg-slate-950/70 p-4 backdrop-blur-xl sm:mb-5">
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(34,211,238,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.22)_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l-2 border-t-2 border-cyan-300/70" />
            <div className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r-2 border-t-2 border-cyan-300/70" />
            <div className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b-2 border-l-2 border-cyan-300/70" />
            <div className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b-2 border-r-2 border-cyan-300/70" />
            <div className="relative z-10 rounded-xl border border-cyan-300/30 bg-black/25 px-4 py-3">
              <button
                type="button"
                onClick={() => setLanguage((current) => (current === 'pl' ? 'en' : 'pl'))}
                className="mx-auto flex items-center gap-3 rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-4 py-2 transition hover:bg-cyan-300/20"
                title={ui.languageHint}
              >
                <h1
                  className="text-center text-3xl uppercase tracking-[0.08em] text-cyan-100 sm:text-4xl"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  VersusVerseVault
                </h1>
                <span className="rounded border border-cyan-200/55 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                  {ui.languageBadge}
                </span>
              </button>
            </div>
          </header>
        ) : null}

        {viewMode === 'search' ? (
          <section className="relative z-0 h-full min-h-0 overflow-hidden bg-[#111418]">
            <iframe
              ref={searchFrameRef}
              src="/search/1.html"
              title="Fight Search"
              className="relative z-0 h-full w-full border-0"
            />
          </section>
        ) : viewMode === 'home' ? (
          <div className="grid gap-4 xl:grid-cols-[1.05fr_1fr]">
            <section className="panel">
              <h2 className="text-lg font-semibold uppercase tracking-[0.12em] text-slate-100">{ui.homeTitle}</h2>
              <p className="mt-2 text-sm text-slate-300">{ui.homeSubtitle}</p>
              <p className="mt-2 text-sm text-slate-300">{ui.uploadHelp}</p>

              <label
                className={clsx(
                  'mt-3 block rounded-xl border p-3 transition-colors',
                  activeDropTarget === 'txt'
                    ? 'border-cyan-300/70 bg-cyan-500/14'
                    : 'border-slate-700/70 bg-slate-950/55',
                )}
                onDragEnter={handleDropZoneDragEnter('txt')}
                onDragOver={handleDropZoneDragOver('txt')}
                onDragLeave={handleDropZoneDragLeave('txt')}
                onDrop={handleTxtDrop}
              >
                <span className="section-label">{ui.matchTxt}</span>
                <p className="mt-1 text-xs text-slate-300">{ui.dropTxtHint}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-cyan-300/45 bg-cyan-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-100 transition hover:bg-cyan-300/28"
                    onClick={(event) => {
                      event.preventDefault()
                      draftTxtInputRef.current?.click()
                    }}
                  >
                    {ui.pickTxtButton}
                  </button>
                  <span className="truncate text-xs text-slate-300">{draftTxtFileName || ui.noFileSelected}</span>
                </div>
                <input
                  ref={draftTxtInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  className="hidden"
                  onChange={handleDraftImportFile}
                />
                <p className={clsx('mt-2 text-xs', draftTxtFileName ? 'text-emerald-200' : 'text-slate-400')}>
                  {draftTxtFileName ? `${ui.txtLoadedLabel}: ${draftTxtFileName}` : ui.txtNotLoadedLabel}
                </p>
              </label>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label
                  className={clsx(
                    'rounded-xl border p-2 transition-colors',
                    activeDropTarget === 'a'
                      ? 'border-sky-300/70 bg-sky-500/12'
                      : 'border-slate-700/70 bg-slate-950/55',
                  )}
                  onDragEnter={handleDropZoneDragEnter('a')}
                  onDragOver={handleDropZoneDragOver('a')}
                  onDragLeave={handleDropZoneDragLeave('a')}
                  onDrop={handlePortraitDrop('a')}
                >
                  <span className="section-label">{ui.portraitA}</span>
                  <p className="mt-1 text-xs text-slate-300">{ui.dropImageHint}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-sky-300/45 bg-sky-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-sky-100 transition hover:bg-sky-300/28"
                      onClick={(event) => {
                        event.preventDefault()
                        draftPortraitInputRefA.current?.click()
                      }}
                    >
                      {ui.pickImageButton}
                    </button>
                    <span className="truncate text-xs text-slate-300">{draftPortraitFileA?.name || ui.noFileSelected}</span>
                  </div>
                  <input
                    ref={draftPortraitInputRefA}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleDraftPortraitUpload('a')}
                  />
                  {draftPortraitPreviewA ? (
                    <img
                      src={draftPortraitPreviewA}
                      alt="portrait-a-preview"
                      className="mt-2 h-20 w-full rounded-md object-cover"
                      style={buildPortraitImageStyle(draftPortraitAdjustA)}
                    />
                  ) : null}
                </label>
                <label
                  className={clsx(
                    'rounded-xl border p-2 transition-colors',
                    activeDropTarget === 'b'
                      ? 'border-rose-300/70 bg-rose-500/12'
                      : 'border-slate-700/70 bg-slate-950/55',
                  )}
                  onDragEnter={handleDropZoneDragEnter('b')}
                  onDragOver={handleDropZoneDragOver('b')}
                  onDragLeave={handleDropZoneDragLeave('b')}
                  onDrop={handlePortraitDrop('b')}
                >
                  <span className="section-label">{ui.portraitB}</span>
                  <p className="mt-1 text-xs text-slate-300">{ui.dropImageHint}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-rose-300/45 bg-rose-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-rose-100 transition hover:bg-rose-300/28"
                      onClick={(event) => {
                        event.preventDefault()
                        draftPortraitInputRefB.current?.click()
                      }}
                    >
                      {ui.pickImageButton}
                    </button>
                    <span className="truncate text-xs text-slate-300">{draftPortraitFileB?.name || ui.noFileSelected}</span>
                  </div>
                  <input
                    ref={draftPortraitInputRefB}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleDraftPortraitUpload('b')}
                  />
                  {draftPortraitPreviewB ? (
                    <img
                      src={draftPortraitPreviewB}
                      alt="portrait-b-preview"
                      className="mt-2 h-20 w-full rounded-md object-cover"
                      style={buildPortraitImageStyle(draftPortraitAdjustB)}
                    />
                  ) : null}
                </label>
              </div>

              <div className="mt-3 rounded-xl border border-slate-700/70 bg-slate-950/55 p-2 text-xs text-slate-300">
                <p>{ui.importFile}: {draftTxtFileName || ui.notLoaded}</p>
                <p className="mt-1">
                  {ui.templateOrderLoaded}:{' '}
                  {draftPayload
                    ? injectDerivedTemplates(
                        draftPayload.templateOrder.length ? draftPayload.templateOrder : DEFAULT_TEMPLATE_ORDER,
                        draftPayload,
                      ).join(' -> ')
                    : ui.notLoaded}
                </p>
                <p className="mt-1">{ui.blocksDetected}: {draftPayload ? Object.keys(draftPayload.templateBlocks).length : 0}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="button-soft" onClick={copyImportBlueprint}>
                  {ui.copyBlueprint}
                </button>
                <button type="button" className="button-soft" onClick={createFightFromDraft}>
                  {ui.createFight}
                </button>
              </div>

              <details className="mt-3 rounded-xl border border-slate-700/70 bg-slate-950/55 p-2">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
                  {ui.templateRequirements}
                </summary>
                <p className="mt-2 text-xs text-slate-300">
                  {ui.requirementsHelp}
                </p>
                <textarea
                  readOnly
                  value={importTxtBlueprint}
                  className="mt-2 h-56 w-full rounded-lg border border-slate-700/80 bg-slate-950/85 px-3 py-2 font-mono text-[11px] text-slate-100"
                />
              </details>
            </section>

            <section className="panel">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-100">{ui.fightsLibrary}</h2>
              {folderFights.length || manualFights.length ? (
                <div className="mt-3 space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200/90">{ui.folderFightsLibrary}</h3>
                    {folderFightGroups.length ? (
                      <div className="mt-2 space-y-3">
                        {folderFightGroups.map((group) => (
                          <div
                            key={`folder-group-${group.matchupKey}`}
                            className="rounded-xl border border-cyan-300/25 bg-cyan-500/8 p-2.5"
                          >
                            <div className="mb-2 flex items-center justify-between gap-2 border-b border-cyan-300/20 pb-2">
                              <p className="min-w-0 truncate text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">
                                {group.title}
                              </p>
                              <span className="rounded-lg border border-cyan-300/35 bg-cyan-500/12 px-2 py-1 text-[10px] uppercase tracking-[0.13em] text-cyan-100">
                                {ui.bilingualGroup}: {group.fights.length}
                              </span>
                            </div>
                            <div className="space-y-2">{group.fights.map((fight) => renderFightLibraryCard(fight))}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400">{ui.noFolderFights}</p>
                    )}
                    {folderScanWarnings.length ? (
                      <div className="mt-2 rounded-lg border border-amber-300/35 bg-amber-500/10 p-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200">{ui.folderWarningsTitle}</p>
                        <div className="mt-1 max-h-24 overflow-y-auto space-y-1 text-[11px] text-amber-100/90">
                          {folderScanWarnings.map((warning, index) => (
                            <p key={`${warning}-${index}`}>{warning}</p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">{ui.manualFightsLibrary}</h3>
                    {manualFights.length ? (
                      <div className="mt-2 space-y-2">{manualFights.map((fight) => renderFightLibraryCard(fight))}</div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400">{ui.noManualFights}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-300">{ui.noFights}</p>
              )}
            </section>
          </div>
        ) : viewMode === 'fight-intro' ? (
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
                src={`/aaa.html?mode=fight-intro&flow=${introFlowMode}`}
                title="Fight Intro"
                className="relative z-0 h-full w-full border-0"
                style={{ pointerEvents: introVisible ? 'auto' : 'none' }}
                onLoad={() => {
                  introFrameReadyRef.current = true
                  if (returnTransitioningRef.current && reverseStageRef.current === 'explosion') {
                    tryDispatchReverseExplosion()
                    return
                  }
                  if (introRevealPendingRef.current) {
                    introRevealPendingRef.current = false
                    setIntroVisible(true)
                  }
                }}
              />
            </div>
          </section>
        ) : (
          <section
            className="flex h-full min-h-0 flex-col gap-3 transition-opacity duration-200 ease-out"
            style={{ opacity: fightViewVisible ? 1 : 0, pointerEvents: fightViewVisible ? 'auto' : 'none' }}
          >
            <div className="shrink-0 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 p-3 backdrop-blur-xl">
              <span className="rounded-xl border border-cyan-300/50 bg-cyan-400/15 px-3 py-2 text-sm font-semibold text-cyan-100">
                {ui.liveMode}
              </span>
              <button className="button-soft" type="button" onClick={goBackToLibrary}>
                {ui.backToLibrary}
              </button>
              <button className="button-soft" type="button" onClick={() => stepTemplateOrder(-1)}>
                {ui.prevTemplate}
              </button>
              <button className="button-soft" type="button" onClick={() => stepTemplateOrder(1)}>
                {ui.nextTemplate}
              </button>
              <span className="rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-200">
                {ui.sequence} {templateCursor + 1}/{templateOrder.length}
              </span>
              <span className="rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-200">
                {ui.active}: {activeTemplateLabel}
              </span>
              <span className="rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-200">
                {stripFileExtension(importFileName) || ui.notLoaded}
              </span>
            </div>

            <div ref={previewShellRef} className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 p-3 backdrop-blur-xl">
              <div
                className="mx-auto"
                style={{
                  width: `${scaledPreviewWidth}px`,
                  height: `${scaledPreviewHeight}px`,
                }}
              >
                <div
                  ref={previewRef}
                  className={clsx(
                    'relative overflow-hidden rounded-[34px] border p-4 sm:p-5',
                    FRAME_CLASSES[frame],
                    THEME_CLASSES[theme],
                  )}
                  style={{
                    width: `${PREVIEW_BASE_WIDTH}px`,
                    height: `${PREVIEW_BASE_HEIGHT}px`,
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                  }}
                >
                  {activeTemplate === 'fight-title' ? null : (
                    <div className={clsx('pointer-events-none absolute inset-0', THEME_OVERLAYS[theme])} />
                  )}
                  <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.14)_1px,transparent_1px)] [background-size:34px_34px]" />
                  <div className="pointer-events-none absolute inset-3 rounded-[26px] border border-white/12" />
                  {activeTemplate === 'fight-title' ? null : <div className="scan-sweep" />}
                  <div key={layoutMode} className="template-fade h-full">
                    {renderTemplate()}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
      {portraitEditorOverlay}
      {searchMorphOverlay}
    </main>
  )
}

export default App
