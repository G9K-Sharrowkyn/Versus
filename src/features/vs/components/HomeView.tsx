import type { TranslationDictionary } from '../../../i18n/types'
import type { FightLibraryGroup } from '../domain/fightLibrary'
import type { FightRecord, TemplateId, TemplatePreset } from '../types'
import { DraftImportPanel } from './home/DraftImportPanel'
import { FightLibraryPanel } from './home/FightLibraryPanel'
import { HomeHeader } from './home/HomeHeader'

type HomeViewProps = {
  ui: TranslationDictionary['ui']
  folderFights: FightRecord[]
  manualFights: FightRecord[]
  folderFightGroups: FightLibraryGroup[]
  folderScanWarnings: string[]
  availableTemplates: TemplatePreset[]
  activeFightId: string | null
  preferredVariantByMatchup: Record<string, string>
  onToggleLanguage: () => void
  onCreateFightScaffold: (matchName: string, templateOrder: TemplateId[]) => Promise<string>
  onOpenFight: (fightId: string) => void
  onRememberPreferredFightVariant: (fight: FightRecord) => void
  onOpenSavedFightPortraitEditor: (fightId: string, side: 'a' | 'b') => void
  onDeleteFight: (fightId: string) => void
}

export function HomeView(props: HomeViewProps) {
  const {
    ui,
    folderFights,
    manualFights,
    folderFightGroups,
    folderScanWarnings,
    availableTemplates,
    activeFightId,
    preferredVariantByMatchup,
    onToggleLanguage,
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
          availableTemplates={availableTemplates}
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
