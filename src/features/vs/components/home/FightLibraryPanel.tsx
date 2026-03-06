import type { TranslationDictionary } from '../../../../i18n/types'
import type { FightLibraryGroup } from '../../domain/fightLibrary'
import type { FightRecord } from '../../types'
import { FightLibraryCard } from './FightLibraryCard'

type FightLibraryPanelProps = {
  ui: TranslationDictionary['ui']
  folderFights: FightRecord[]
  manualFights: FightRecord[]
  folderFightGroups: FightLibraryGroup[]
  folderScanWarnings: string[]
  activeFightId: string | null
  preferredVariantByMatchup: Record<string, string>
  onOpenFight: (fightId: string) => void
  onRememberPreferredFightVariant: (fight: FightRecord) => void
  onOpenSavedFightPortraitEditor: (fightId: string, side: 'a' | 'b') => void
  onDeleteFight: (fightId: string) => void
}

export function FightLibraryPanel({
  ui,
  folderFights,
  manualFights,
  folderFightGroups,
  folderScanWarnings,
  activeFightId,
  preferredVariantByMatchup,
  onOpenFight,
  onRememberPreferredFightVariant,
  onOpenSavedFightPortraitEditor,
  onDeleteFight,
}: FightLibraryPanelProps) {
  return (
    <section className="panel">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-100">{ui.fightsLibrary}</h2>
      {folderFights.length || manualFights.length ? (
        <div className="mt-3 space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200/90">
              {ui.folderFightsLibrary}
            </h3>
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
                    <div className="space-y-2">
                      {group.fights.map((fight) => (
                        <FightLibraryCard
                          key={fight.id}
                          fight={fight}
                          activeFightId={activeFightId}
                          preferredVariantByMatchup={preferredVariantByMatchup}
                          ui={ui}
                          onOpenFight={onOpenFight}
                          onRememberPreferredFightVariant={onRememberPreferredFightVariant}
                          onOpenSavedFightPortraitEditor={onOpenSavedFightPortraitEditor}
                          onDeleteFight={onDeleteFight}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-400">{ui.noFolderFights}</p>
            )}
            {folderScanWarnings.length ? (
              <div className="mt-2 rounded-lg border border-amber-300/35 bg-amber-500/10 p-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200">
                  {ui.folderWarningsTitle}
                </p>
                <div className="mt-1 max-h-24 space-y-1 overflow-y-auto text-[11px] text-amber-100/90">
                  {folderScanWarnings.map((warning, index) => (
                    <p key={`${warning}-${index}`}>{warning}</p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
              {ui.manualFightsLibrary}
            </h3>
            {manualFights.length ? (
              <div className="mt-2 space-y-2">
                {manualFights.map((fight) => (
                  <FightLibraryCard
                    key={fight.id}
                    fight={fight}
                    activeFightId={activeFightId}
                    preferredVariantByMatchup={preferredVariantByMatchup}
                    ui={ui}
                    onOpenFight={onOpenFight}
                    onRememberPreferredFightVariant={onRememberPreferredFightVariant}
                    onOpenSavedFightPortraitEditor={onOpenSavedFightPortraitEditor}
                    onDeleteFight={onDeleteFight}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-400">{ui.noManualFights}</p>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-300">{ui.noFights}</p>
      )}
    </section>
  )
}
