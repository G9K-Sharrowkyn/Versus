import type { ChangeEvent, DragEvent, RefObject } from 'react'
import type { TranslationDictionary } from '../../../i18n/types'
import type { FightLibraryGroup } from '../domain/fightLibrary'
import type { FightRecord, ImportDropTarget, ParsedVsImport, PortraitAdjust, TemplateId, TemplatePreset } from '../types'
import { DraftImportPanel } from './home/DraftImportPanel'
import { FightLibraryPanel } from './home/FightLibraryPanel'
import { HomeHeader } from './home/HomeHeader'

type HomeViewProps = {
  ui: TranslationDictionary['ui']
  activeDropTarget: ImportDropTarget | null
  draftTxtInputRef: RefObject<HTMLInputElement | null>
  draftPortraitInputRefA: RefObject<HTMLInputElement | null>
  draftPortraitInputRefB: RefObject<HTMLInputElement | null>
  draftTxtFileName: string
  draftPayload: ParsedVsImport | null
  draftPortraitFileA: File | null
  draftPortraitFileB: File | null
  draftPortraitPreviewA: string
  draftPortraitPreviewB: string
  draftPortraitAdjustA: PortraitAdjust
  draftPortraitAdjustB: PortraitAdjust
  folderFights: FightRecord[]
  manualFights: FightRecord[]
  folderFightGroups: FightLibraryGroup[]
  folderScanWarnings: string[]
  fightStarterTxt: string
  availableTemplates: TemplatePreset[]
  activeFightId: string | null
  preferredVariantByMatchup: Record<string, string>
  onToggleLanguage: () => void
  onDropZoneDragEnter: (target: ImportDropTarget) => (event: DragEvent<HTMLElement>) => void
  onDropZoneDragOver: (target: ImportDropTarget) => (event: DragEvent<HTMLElement>) => void
  onDropZoneDragLeave: (target: ImportDropTarget) => (event: DragEvent<HTMLElement>) => void
  onTxtDrop: (event: DragEvent<HTMLElement>) => void
  onPortraitDrop: (side: 'a' | 'b') => (event: DragEvent<HTMLElement>) => void
  onDraftPortraitUpload: (side: 'a' | 'b') => (event: ChangeEvent<HTMLInputElement>) => void
  onDraftImportFile: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>
  onCopyImportBlueprint: () => void
  onCreateFightFromDraft: () => void
  onCreateFightScaffold: (matchName: string, templateOrder: TemplateId[]) => Promise<string>
  onOpenFight: (fightId: string) => void
  onRememberPreferredFightVariant: (fight: FightRecord) => void
  onOpenSavedFightPortraitEditor: (fightId: string, side: 'a' | 'b') => void
  onDeleteFight: (fightId: string) => void
}

export function HomeView(props: HomeViewProps) {
  const {
    ui,
    activeDropTarget,
    draftTxtInputRef,
    draftPortraitInputRefA,
    draftPortraitInputRefB,
    draftTxtFileName,
    draftPayload,
    draftPortraitFileA,
    draftPortraitFileB,
    draftPortraitPreviewA,
    draftPortraitPreviewB,
    draftPortraitAdjustA,
    draftPortraitAdjustB,
    folderFights,
    manualFights,
    folderFightGroups,
    folderScanWarnings,
    fightStarterTxt,
    availableTemplates,
    activeFightId,
    preferredVariantByMatchup,
    onToggleLanguage,
    onDropZoneDragEnter,
    onDropZoneDragOver,
    onDropZoneDragLeave,
    onTxtDrop,
    onPortraitDrop,
    onDraftPortraitUpload,
    onDraftImportFile,
    onCopyImportBlueprint,
    onCreateFightFromDraft,
    onCreateFightScaffold,
    onOpenFight,
    onRememberPreferredFightVariant,
    onOpenSavedFightPortraitEditor,
    onDeleteFight,
  } = props

  return (
    <>
      <HomeHeader ui={ui} onToggleLanguage={onToggleLanguage} />
      <div className="grid gap-4 xl:grid-cols-[1.05fr_1fr]">
        <DraftImportPanel
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
          fightStarterTxt={fightStarterTxt}
          availableTemplates={availableTemplates}
          onDropZoneDragEnter={onDropZoneDragEnter}
          onDropZoneDragOver={onDropZoneDragOver}
          onDropZoneDragLeave={onDropZoneDragLeave}
          onTxtDrop={onTxtDrop}
          onPortraitDrop={onPortraitDrop}
          onDraftPortraitUpload={onDraftPortraitUpload}
          onDraftImportFile={onDraftImportFile}
          onCopyImportBlueprint={onCopyImportBlueprint}
          onCreateFightFromDraft={onCreateFightFromDraft}
          onCreateFightScaffold={onCreateFightScaffold}
        />
        <FightLibraryPanel
          ui={ui}
          folderFights={folderFights}
          manualFights={manualFights}
          folderFightGroups={folderFightGroups}
          folderScanWarnings={folderScanWarnings}
          activeFightId={activeFightId}
          preferredVariantByMatchup={preferredVariantByMatchup}
          onOpenFight={onOpenFight}
          onRememberPreferredFightVariant={onRememberPreferredFightVariant}
          onOpenSavedFightPortraitEditor={onOpenSavedFightPortraitEditor}
          onDeleteFight={onDeleteFight}
        />
      </div>
    </>
  )
}
