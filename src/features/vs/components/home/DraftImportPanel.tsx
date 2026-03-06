import clsx from 'clsx'
import type { ChangeEvent, DragEvent, RefObject } from 'react'
import type { TranslationDictionary } from '../../../../i18n/types'
import { buildPortraitImageStyle } from '../../helpers'
import { DEFAULT_TEMPLATE_ORDER, injectDerivedTemplates } from '../../presets'
import type { ImportDropTarget, ParsedVsImport, PortraitAdjust } from '../../types'

type DraftImportPanelProps = {
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
  importTxtBlueprint: string
  onDropZoneDragEnter: (target: ImportDropTarget) => (event: DragEvent<HTMLElement>) => void
  onDropZoneDragOver: (target: ImportDropTarget) => (event: DragEvent<HTMLElement>) => void
  onDropZoneDragLeave: (target: ImportDropTarget) => (event: DragEvent<HTMLElement>) => void
  onTxtDrop: (event: DragEvent<HTMLElement>) => void
  onPortraitDrop: (side: 'a' | 'b') => (event: DragEvent<HTMLElement>) => void
  onDraftPortraitUpload: (side: 'a' | 'b') => (event: ChangeEvent<HTMLInputElement>) => void
  onDraftImportFile: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>
  onCopyImportBlueprint: () => void
  onCreateFightFromDraft: () => void
}

export function DraftImportPanel({
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
  importTxtBlueprint,
  onDropZoneDragEnter,
  onDropZoneDragOver,
  onDropZoneDragLeave,
  onTxtDrop,
  onPortraitDrop,
  onDraftPortraitUpload,
  onDraftImportFile,
  onCopyImportBlueprint,
  onCreateFightFromDraft,
}: DraftImportPanelProps) {
  const draftTemplateOrder = draftPayload
    ? injectDerivedTemplates(
        draftPayload.templateOrder.length ? draftPayload.templateOrder : DEFAULT_TEMPLATE_ORDER,
        draftPayload,
      ).join(' -> ')
    : ui.notLoaded

  const draftBlocksCount = draftPayload ? Object.keys(draftPayload.templateBlocks).length : 0

  return (
    <section className="panel">
      <h2 className="text-lg font-semibold uppercase tracking-[0.12em] text-slate-100">{ui.homeTitle}</h2>
      <p className="mt-2 text-sm text-slate-300">{ui.homeSubtitle}</p>
      <p className="mt-2 text-sm text-slate-300">{ui.uploadHelp}</p>

      <label
        className={clsx(
          'mt-3 block rounded-xl border p-3 transition-colors',
          activeDropTarget === 'txt' ? 'border-cyan-300/70 bg-cyan-500/14' : 'border-slate-700/70 bg-slate-950/55',
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
            activeDropTarget === 'a' ? 'border-sky-300/70 bg-sky-500/12' : 'border-slate-700/70 bg-slate-950/55',
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
            activeDropTarget === 'b' ? 'border-rose-300/70 bg-rose-500/12' : 'border-slate-700/70 bg-slate-950/55',
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
        <p>
          {ui.importFile}: {draftTxtFileName || ui.notLoaded}
        </p>
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
  )
}
