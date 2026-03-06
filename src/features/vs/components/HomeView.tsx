import clsx from 'clsx'
import { Crosshair, Trash2 } from 'lucide-react'
import type { ChangeEvent, DragEvent, RefObject } from 'react'
import type { TranslationDictionary } from '../../../i18n/types'
import { buildPortraitImageStyle } from '../helpers'
import { DEFAULT_TEMPLATE_ORDER, injectDerivedTemplates } from '../presets'
import type {
  FightRecord,
  ImportDropTarget,
  ParsedVsImport,
  PortraitAdjust,
} from '../types'

type FightLibraryGroup = {
  matchupKey: string
  title: string
  fights: FightRecord[]
}

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

function FightLibraryCard({
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
  importTxtBlueprint: string
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
  onOpenFight: (fightId: string) => void
  onRememberPreferredFightVariant: (fight: FightRecord) => void
  onOpenSavedFightPortraitEditor: (fightId: string, side: 'a' | 'b') => void
  onDeleteFight: (fightId: string) => void
}

export function HomeView({
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
  importTxtBlueprint,
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
  onOpenFight,
  onRememberPreferredFightVariant,
  onOpenSavedFightPortraitEditor,
  onDeleteFight,
}: HomeViewProps) {
  const draftTemplateOrder = draftPayload
    ? injectDerivedTemplates(
        draftPayload.templateOrder.length ? draftPayload.templateOrder : DEFAULT_TEMPLATE_ORDER,
        draftPayload,
      ).join(' -> ')
    : ui.notLoaded

  const draftBlocksCount = draftPayload ? Object.keys(draftPayload.templateBlocks).length : 0

  return (
    <>
      <header className="relative mb-4 overflow-hidden rounded-2xl border border-cyan-300/35 bg-slate-950/70 p-4 backdrop-blur-xl sm:mb-5">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(34,211,238,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.22)_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l-2 border-t-2 border-cyan-300/70" />
        <div className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r-2 border-t-2 border-cyan-300/70" />
        <div className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b-2 border-l-2 border-cyan-300/70" />
        <div className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b-2 border-r-2 border-cyan-300/70" />
        <div className="relative z-10 rounded-xl border border-cyan-300/30 bg-black/25 px-4 py-3">
          <button
            type="button"
            onClick={onToggleLanguage}
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
            onDragEnter={onDropZoneDragEnter('txt')}
            onDragOver={onDropZoneDragOver('txt')}
            onDragLeave={onDropZoneDragLeave('txt')}
            onDrop={onTxtDrop}
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
              onChange={onDraftImportFile}
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
              onDragEnter={onDropZoneDragEnter('a')}
              onDragOver={onDropZoneDragOver('a')}
              onDragLeave={onDropZoneDragLeave('a')}
              onDrop={onPortraitDrop('a')}
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
                onChange={onDraftPortraitUpload('a')}
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
              onDragEnter={onDropZoneDragEnter('b')}
              onDragOver={onDropZoneDragOver('b')}
              onDragLeave={onDropZoneDragLeave('b')}
              onDrop={onPortraitDrop('b')}
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
                onChange={onDraftPortraitUpload('b')}
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
              {ui.templateOrderLoaded}: {draftTemplateOrder}
            </p>
            <p className="mt-1">
              {ui.blocksDetected}: {draftBlocksCount}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="button-soft" onClick={onCopyImportBlueprint}>
              {ui.copyBlueprint}
            </button>
            <button type="button" className="button-soft" onClick={onCreateFightFromDraft}>
              {ui.createFight}
            </button>
          </div>

          <details className="mt-3 rounded-xl border border-slate-700/70 bg-slate-950/55 p-2">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
              {ui.templateRequirements}
            </summary>
            <p className="mt-2 text-xs text-slate-300">{ui.requirementsHelp}</p>
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
      </div>
    </>
  )
}
