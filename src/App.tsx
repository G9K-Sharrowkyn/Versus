import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { getTranslations } from './i18n'
import { FightPreviewStage } from './features/vs/components/FightPreviewStage'
import { HomeView } from './features/vs/components/HomeView'
import { PortraitEditorModal } from './features/vs/components/PortraitEditorModal'
import { SearchMorphOverlay } from './features/vs/components/SearchMorphOverlay'
import { TemplateRenderer } from './features/vs/components/TemplateRenderer'
import { buildFolderFightGroups, selectFolderFights, selectManualFights } from './features/vs/domain/fightLibrary'
import { buildFightStudioState, type ApplyFightRecordOptions } from './features/vs/domain/fightState'
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
import { buildImportTxtBlueprint } from './features/vs/importer'
import { useAnimatedCursor } from './features/vs/hooks/useAnimatedCursor'
import { usePreviewScale } from './features/vs/hooks/usePreviewScale'
import { useVsDraftImport } from './features/vs/hooks/useVsDraftImport'
import { useVsPersistence } from './features/vs/hooks/useVsPersistence'
import { useVsTransitions } from './features/vs/hooks/useVsTransitions'
import { buildFightRefreshSignature } from './features/vs/storage'
import type {
  Category,
  Fighter,
  FighterFact,
  FightRecord,
  Language,
  PortraitAdjust,
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
  const importTxtBlueprint = useMemo(() => buildImportTxtBlueprint(language), [language])

  const [activeTemplate, setActiveTemplate] = useState<TemplateId>(initialTemplate.id)
  const [categories, setCategories] = useState<Category[]>(() => defaultCategoriesFor(DEFAULT_LANGUAGE))
  const [fighterA, setFighterA] = useState<Fighter>(() => cloneFighter(FIGHTER_A))
  const [fighterB, setFighterB] = useState<Fighter>(() => cloneFighter(FIGHTER_B))
  const [factsA, setFactsA] = useState<FighterFact[]>(() => defaultFactsFor('a', DEFAULT_LANGUAGE))
  const [factsB, setFactsB] = useState<FighterFact[]>(() => defaultFactsFor('b', DEFAULT_LANGUAGE))
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
  const [portraitAAdjust, setPortraitAAdjust] = useState<PortraitAdjust>({ ...PORTRAIT_ADJUST_DEFAULT })
  const [portraitBAdjust, setPortraitBAdjust] = useState<PortraitAdjust>({ ...PORTRAIT_ADJUST_DEFAULT })
  const [slideImageAdjustments, setSlideImageAdjustments] = useState<Record<string, PortraitAdjust>>({})

  const previewRef = useRef<HTMLDivElement>(null)
  const previewShellRef = useRef<HTMLDivElement>(null)
  const searchTransitioningRef = useRef(false)
  const returnTransitioningRef = useRef(false)
  const applyFightRecordRef = useRef<ApplyFightRecord | null>(null)

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

  const {
    draftPayload,
    draftTxtFileName,
    draftPortraitFileA,
    draftPortraitFileB,
    draftPortraitPreviewA,
    draftPortraitPreviewB,
    draftPortraitAdjustA,
    draftPortraitAdjustB,
    portraitEditor,
    activeDropTarget,
    draftTxtInputRef,
    draftPortraitInputRefA,
    draftPortraitInputRefB,
    closePortraitEditor,
    openSavedFightPortraitEditor,
    applyPortraitEditor,
    updatePortraitEditorAdjust,
    resetPortraitEditorAdjust,
    togglePortraitEditorSide,
    handleDropZoneDragEnter,
    handleDropZoneDragOver,
    handleDropZoneDragLeave,
    handleTxtDrop,
    handlePortraitDrop,
    handleDraftPortraitUpload,
    handleDraftImportFile,
    createFightFromDraft,
  } = useVsDraftImport({
    language,
    translations,
    tr,
    fights,
    activeFightId,
    setFights,
    setPortraitAAdjust,
    setPortraitBAdjust,
    flashStatus,
  })

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

  const applyFightRecord: ApplyFightRecord = (fight, options) => {
    const nextState = buildFightStudioState({
      fight,
      language,
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
    setPowersA(nextState.powersA)
    setPowersB(nextState.powersB)
    setRawFeatsA(nextState.rawFeatsA)
    setRawFeatsB(nextState.rawFeatsB)
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
    setLanguage((current) => {
      const nextLanguage = current === 'pl' ? 'en' : 'pl'
      if (!importFileName && !Object.keys(templateBlocks).length) {
        setCategories(defaultCategoriesFor(nextLanguage))
        setFactsA(defaultFactsFor('a', nextLanguage))
        setFactsB(defaultFactsFor('b', nextLanguage))
        setPowersA([])
        setPowersB([])
        setRawFeatsA([])
        setRawFeatsB([])
        setSlideImageAdjustments({})
      }
      return nextLanguage
    })
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

  const copyImportBlueprint = async () => {
    try {
      await navigator.clipboard.writeText(importTxtBlueprint)
      flashStatus(ui.blueprintCopied)
    } catch {
      flashStatus(ui.clipboardBlocked)
    }
  }

  const activeFightRecord = useMemo(
    () => fights.find((fight) => fight.id === activeFightId) || null,
    [activeFightId, fights],
  )

  const currentFightLabel =
    stripFileExtension(importFileName) ||
    `${fighterA.name || tr('Postac A', 'Fighter A')} vs ${fighterB.name || tr('Postac B', 'Fighter B')}`

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
      powersA={powersA}
      powersB={powersB}
      rawFeatsA={rawFeatsA}
      rawFeatsB={rawFeatsB}
      winsA={winsA}
      winsB={winsB}
      fightLabel={currentFightLabel}
      templateBlocks={templateBlocks}
      activeFightId={activeFightId}
      activeFightFolderKey={activeFightRecord?.folderKey}
      slideImageAdjustments={slideImageAdjustments}
      onSlideImageAdjustChange={handleSlideImageAdjustChange}
      onSlideImageAdjustCommit={handleSlideImageAdjustCommit}
    />
  )

  const scaledPreviewWidth = Math.round(PREVIEW_BASE_WIDTH * previewScale)
  const scaledPreviewHeight = Math.round(PREVIEW_BASE_HEIGHT * previewScale)
  const isSearchView = viewMode === 'search'
  const isIntroView = viewMode === 'fight-intro'
  const isTemplateView = viewMode === 'fight'
  const isFightFlow = isIntroView || isTemplateView
  const isEmbeddedFullscreenView = isSearchView || isIntroView
  const canSwitchPortraitEditorSide = Boolean(
    portraitEditor?.mode === 'fight' || (draftPortraitFileA && draftPortraitFileB),
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
        isEmbeddedFullscreenView
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
            activeDropTarget={activeDropTarget}
            draftTxtInputRef={draftTxtInputRef}
            draftPortraitInputRefA={draftPortraitInputRefA}
            draftPortraitInputRefB={draftPortraitInputRefB}
            draftTxtFileName={draftTxtFileName}
            draftPayload={draftPayload}
            draftPortraitFileA={draftPortraitFileA}
            draftPortraitFileB={draftPortraitFileB}
            draftPortraitPreviewA={draftPortraitPreviewA}
            draftPortraitPreviewB={draftPortraitPreviewB}
            draftPortraitAdjustA={draftPortraitAdjustA}
            draftPortraitAdjustB={draftPortraitAdjustB}
            folderFights={folderFights}
            manualFights={manualFights}
            folderFightGroups={folderFightGroups}
            folderScanWarnings={folderScanWarnings}
            importTxtBlueprint={importTxtBlueprint}
            activeFightId={activeFightId}
            preferredVariantByMatchup={preferredVariantByMatchup}
            onToggleLanguage={toggleLanguage}
            onDropZoneDragEnter={handleDropZoneDragEnter}
            onDropZoneDragOver={handleDropZoneDragOver}
            onDropZoneDragLeave={handleDropZoneDragLeave}
            onTxtDrop={handleTxtDrop}
            onPortraitDrop={handlePortraitDrop}
            onDraftPortraitUpload={handleDraftPortraitUpload}
            onDraftImportFile={handleDraftImportFile}
            onCopyImportBlueprint={() => {
              void copyImportBlueprint()
            }}
            onCreateFightFromDraft={() => {
              void createFightFromDraft()
            }}
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
