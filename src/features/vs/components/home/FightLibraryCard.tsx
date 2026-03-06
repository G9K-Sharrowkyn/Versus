import clsx from 'clsx'
import { Crosshair, Trash2 } from 'lucide-react'
import type { TranslationDictionary } from '../../../../i18n/types'
import type { FightRecord } from '../../types'

type FightLibraryCardProps = {
  fight: FightRecord
  activeFightId: string | null
  preferredVariantByMatchup: Record<string, string>
  ui: TranslationDictionary['ui']
  onOpenFight: (fightId: string) => void
  onRememberPreferredFightVariant: (fight: FightRecord) => void
  onOpenSavedFightPortraitEditor: (fightId: string, side: 'a' | 'b') => void
  onDeleteFight: (fightId: string) => void
}

export function FightLibraryCard({
  fight,
  activeFightId,
  preferredVariantByMatchup,
  ui,
  onOpenFight,
  onRememberPreferredFightVariant,
  onOpenSavedFightPortraitEditor,
  onDeleteFight,
}: FightLibraryCardProps) {
  const isActive = activeFightId === fight.id
  const isPreferred = preferredVariantByMatchup[fight.matchupKey] === fight.id
  const localeLabel =
    fight.variantLocale === 'pl' ? ui.variantPl : fight.variantLocale === 'en' ? ui.variantEn : ui.variantUnknown

  return (
    <div
      className={clsx(
        'flex items-stretch gap-2 rounded-xl border p-2 transition',
        isActive
          ? 'border-cyan-300/55 bg-cyan-500/16'
          : 'border-slate-600/70 bg-slate-900/60 hover:border-slate-400',
      )}
    >
      <button
        type="button"
        onClick={() => onOpenFight(fight.id)}
        className="min-w-0 flex-1 rounded-lg px-2 py-1 text-left"
      >
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
          onClick={() => onRememberPreferredFightVariant(fight)}
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
          onClick={() => onOpenSavedFightPortraitEditor(fight.id, 'a')}
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
            onClick={() => onDeleteFight(fight.id)}
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
}
