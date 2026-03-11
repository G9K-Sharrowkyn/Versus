import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { getTranslations } from './i18n'
import { FightPreviewStage } from './features/vs/components/FightPreviewStage'
import { HomeView } from './features/vs/components/HomeView'
import { PortraitEditorModal } from './features/vs/components/PortraitEditorModal'
import { SearchMorphOverlay } from './features/vs/components/SearchMorphOverlay'
import { TemplateRenderer } from './features/vs/components/TemplateRenderer'
import { buildFolderFightGroups, selectFolderFights, selectManualFights } from './features/vs/domain/fightLibrary'
import { findFightVariantByLanguage, applySharedFightVisualAdjustments } from './features/vs/domain/fightVariants'
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
  normalizePortraitAdjust,
  normalizeSlideImageAdjustments,
  stripFileExtension,
} from './features/vs/helpers'
import { buildFightScaffoldFightJson, buildFightScaffoldScansJson } from './features/vs/importer'
import { useAnimatedCursor } from './features/vs/hooks/useAnimatedCursor'
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
  TemplateId,
} from './features/vs/types'

type ApplyFightRecord = (fight: FightRecord, options?: ApplyFightRecordOptions) => void

const DEFAULT_LANGUAGE: Language = 'en'
const PREVIEW_BASE_WIDTH = 1400
const PREVIEW_BASE_HEIGHT = 787.5
const PREVIEW_MIN_SCALE = 0.62
const PREVIEW_MAX_SCALE = 1.7
const MORPH_POWER_OFF_MS = 1000
const MORPH_RING_ON_MS = 1000
const MORPH_FINAL_MS = 2000
const MORPH_OVERLAY_BUFFER_MS = 180
const INTRO_MOUNT_AT_MS = 1200
const INTRO_REVEAL_AT_MS = MORPH_POWER_OFF_MS + MORPH_RING_ON_MS + MORPH_FINAL_MS - 220
const FIGHTS_SCAN_POLL_MS = 1200
const FINAL_TEMPLATE_RETURN_DELAY_MS = 5000
const SEARCH_COLLAPSE_WATCHDOG_MS = 5000
const REVERSE_EXPLOSION_WATCHDOG_MS = 5000
const EMPTY_PROFILE_DATA: FighterProfileData = { powers: [], tools: [], weaknesses: [] }

const parseFightScaffoldMatchup = (value: string) => {
  const match = value.trim().match(/^(.+?)\s+(?:vs\.?|versus|kontra|v)\s+(.+?)$/i)
  if (!match) return null
  const fighterAName = match[1]?.trim()
  const fighterBName = match[2]?.trim()
  if (!fighterAName || !fighterBName) return null
  return { fighterAName, fighterBName }
}

function App() {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE)
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const translations = useMemo(() => getTranslations(language), [language])
  const ui = translations.ui
  const initialTemplate = localizeTemplatePreset(TEMPLATE_PRESETS[0], DEFAULT_LANGUAGE)
  const localizedTemplates = useMemo(
    () => TEMPLATE_PRESETS.map((template) => localizeTemplatePreset(template, language)),
    [language],
  )

  const [activeTemplate, setActiveTemplate] = useState<TemplateId>(initialTemplate.id)
  const [categories, setCategories] = useState<Category[]>(() => defaultCategoriesFor(DEFAULT_LANGUAGE))
  const [fighterA, setFighterA] = useState<Fighter>(() => cloneFighter(FIGHTER_A))
  const [fighterB, setFighterB] = useState<Fighter>(() => cloneFighter(FIGHTER_B))
  const [factsA, setFactsA] = useState<FighterFact[]>(() => defaultFactsFor('a', DEFAULT_LANGUAGE))
  const [factsB, setFactsB] = useState<FighterFact[]>(() => defaultFactsFor('b', DEFAULT_LANGUAGE))
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

  const previewRef = useRef<HTMLDivElement>(null)
  const previewShellRef = useRef<HTMLDivElement>(null)
  const searchTransitioningRef = useRef(false)
  const returnTransitioningRef = useRef(false)
  const applyFightRecordRef = useRef<ApplyFightRecord | null>(null)
  const [portraitEditor, setPortraitEditor] = useState<PortraitEditorState | null>(null)

  const {
    fights,
    setFights,
    folderScanWarnings,
    preferredVariantByMatchup,
    setPreferredVariantByMatchup,
    activeFightId,
    setActiveFightId,
    activeFightSignatureRef,
  } = useVsPersistence({
    applyFightRecordRef,
    searchTransitioningRef,
    returnTransitioningRef,
    fightScanPollMs: FIGHTS_SCAN_POLL_MS,
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
    searchMorphHandoff,
    searchFrameRef,
    introFrameRef,
    clearSearchTransitionQueue,
    goBackToLibrary,
    handleIntroFrameLoad,
  } = useVsTransitions({
    fights,
    preferredVariantByMatchup,
    language,
    activeTemplate,
    activeFightId,
    templateCursor,
    applyFightRecordRef,
    setActiveFightId,
    searchTransitioningRef,
    returnTransitioningRef,
    finalTemplateReturnDelayMs: FINAL_TEMPLATE_RETURN_DELAY_MS,
    morphPowerOffMs: MORPH_POWER_OFF_MS,
    morphRingOnMs: MORPH_RING_ON_MS,
    morphFinalMs: MORPH_FINAL_MS,
    morphOverlayBufferMs: MORPH_OVERLAY_BUFFER_MS,
    introMountAtMs: INTRO_MOUNT_AT_MS,
    introRevealAtMs: INTRO_REVEAL_AT_MS,
    searchCollapseWatchdogMs: SEARCH_COLLAPSE_WATCHDOG_MS,
    reverseExplosionWatchdogMs: REVERSE_EXPLOSION_WATCHDOG_MS,
  })

  useAnimatedCursor({ searchFrameRef, introFrameRef })

  const previewScale = usePreviewScale({
    shellRef: previewShellRef,
    viewMode,
    baseWidth: PREVIEW_BASE_WIDTH,
    baseHeight: PREVIEW_BASE_HEIGHT,
    minScale: PREVIEW_MIN_SCALE,
    maxScale: PREVIEW_MAX_SCALE,
  })

  const flashStatus = (text: string) => {
    void text
  }

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

  const folderFights = useMemo(() => selectFolderFights(fights), [fights])
  const manualFights = useMemo(() => selectManualFights(fights), [fights])
  const folderFightGroups = useMemo(() => buildFolderFightGroups(folderFights), [folderFights])

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
    [categories, fighterA.stats, fighterB.stats, translations.categories],
  )

  const averageA = useMemo(() => avg(rows, 'a'), [rows])
  const averageB = useMemo(() => avg(rows, 'b'), [rows])
  const maxTemplateCursor = Math.max(templateOrder.length - 1, 0)
  const canStepTemplateBackward = templateOrder.length > 0 && templateCursor > 0
  const canStepTemplateForward = templateOrder.length > 0 && templateCursor < maxTemplateCursor

  const applyTemplateById = (templateId: TemplateId, shouldFlash = true) => {
    const preset = localizedTemplates.find((template) => template.id === templateId)
    if (!preset) return
    setActiveTemplate(preset.id)
    if (shouldFlash) {
      flashStatus(`${ui.templateLoaded}: ${preset.name}`)
    }
  }

  const stepTemplateOrder = (direction: 1 | -1) => {
    if (!templateOrder.length) return
    const nextTemplateCursor = templateCursor + direction
    if (nextTemplateCursor < 0 || nextTemplateCursor >= templateOrder.length) return
    setTemplateCursor(nextTemplateCursor)
    applyTemplateById(templateOrder[nextTemplateCursor], false)
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

  const applyFightRecord: ApplyFightRecord = (fight, options) => {
    const fightLanguage = resolveFightLanguage(fight, language)
    const nextState = buildFightStudioState({
      fight,
      language: options?.targetLanguage ?? fightLanguage,
      activeTemplate,
      templateCursor,
      preserveTemplateSelection: options?.preserveTemplateSelection ?? false,
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
  }

  useEffect(() => {
    applyFightRecordRef.current = applyFightRecord
  })

  const toggleLanguage = () => {
    const nextLanguage = language === 'pl' ? 'en' : 'pl'
    setLanguage(nextLanguage)

    if (activeFightId) {
      const currentFight = fights.find((fight) => fight.id === activeFightId)
      if (currentFight) {
        const otherVariant = findFightVariantByLanguage(fights, currentFight, nextLanguage)
        if (otherVariant) {
          rememberPreferredFightVariant(otherVariant)
          applyFightRecord(otherVariant, {
            enterIntro: false,
            preserveTemplateSelection: true,
            targetLanguage: nextLanguage,
          })
          return
        }
      }
    }

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
    const fight = fights.find((item) => item.id === fightId)
    if (!fight) return
    rememberPreferredFightVariant(fight)
    applyFightRecord(fight)
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

  const currentFightLabel =
    stripFileExtension(importFileName) ||
    `${fighterA.name || tr('Postać A', 'Fighter A')} vs ${fighterB.name || tr('Postać B', 'Fighter B')}`

  const renderedTemplate = (
    <TemplateRenderer
      activeTemplateId={activeTemplate}
      language={language}
      rows={rows}
      fighterA={fighterA}
      fighterB={fighterB}
      portraitAAdjust={portraitAAdjust}
      portraitBAdjust={portraitBAdjust}
      averageA={averageA}
      averageB={averageB}
      title={activeTemplatePreset.title}
      subtitle={activeTemplatePreset.subtitle}
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
    />
  )

  const scaledPreviewWidth = Math.round(PREVIEW_BASE_WIDTH * previewScale)
  const scaledPreviewHeight = Math.round(PREVIEW_BASE_HEIGHT * previewScale)
  const isSearchView = viewMode === 'search'
  const isIntroView = viewMode === 'fight-intro'
  const isTemplateView = viewMode === 'fight'
  const isFightFlow = isIntroView || isTemplateView
  const canSwitchPortraitEditorSide = Boolean(portraitEditor?.mode === 'fight')

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
  ])

  return (
    <main
      data-reverse-stage={reverseStage}
      className={clsx(
        'text-slate-100',
        isSearchView
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
              src="/search/1.html"
              title="Fight Search"
              className="relative z-0 h-full w-full border-0"
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
                src={`/aaa.html?mode=fight-intro&flow=${introFlowMode}`}
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
            importFileName={importFileName}
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
            activeTemplate={activeTemplate}
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
    </main>
  )
}

export default App
