import type { ReactNode, RefObject } from 'react'
import type { TranslationDictionary } from '../../../i18n/types'
import { stripFileExtension } from '../helpers'
import { HIGH_END_STAGE_CLASS, HIGH_END_STAGE_OVERLAY_CLASS } from '../templates/shared/highEnd'
import type { TemplateId } from '../types'

type FightPreviewStageProps = {
  ui: TranslationDictionary['ui']
  activeTemplateLabel: string
  templateCursor: number
  templateOrderLength: number
  importFileName: string
  fightViewVisible: boolean
  onBackToLibrary: () => void
  onStepTemplateOrder: (direction: 1 | -1) => void
  previewShellRef: RefObject<HTMLDivElement | null>
  previewRef: RefObject<HTMLDivElement | null>
  scaledPreviewWidth: number
  scaledPreviewHeight: number
  previewBaseWidth: number
  previewBaseHeight: number
  previewScale: number
  activeTemplate: TemplateId
  children: ReactNode
}

export function FightPreviewStage({
  ui,
  activeTemplateLabel,
  templateCursor,
  templateOrderLength,
  importFileName,
  fightViewVisible,
  onBackToLibrary,
  onStepTemplateOrder,
  previewShellRef,
  previewRef,
  scaledPreviewWidth,
  scaledPreviewHeight,
  previewBaseWidth,
  previewBaseHeight,
  previewScale,
  activeTemplate,
  children,
}: FightPreviewStageProps) {
  const toolbarItemClass =
    'flex h-12 min-w-0 items-center justify-center rounded-xl border px-3 text-center text-sm leading-tight'
  const buttonItemClass = `${toolbarItemClass} border-white/15 bg-white/5 text-slate-100 transition-colors hover:bg-white/10`
  const statusItemClass = `${toolbarItemClass} border-white/15 bg-transparent text-slate-200`

  return (
    <section
      className="flex h-full min-h-0 flex-col gap-3 transition-opacity duration-200 ease-out"
      style={{ opacity: fightViewVisible ? 1 : 0, pointerEvents: fightViewVisible ? 'auto' : 'none' }}
    >
      <div className="shrink-0 grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-slate-950/60 p-3 backdrop-blur-xl sm:grid-cols-2 xl:grid-cols-7">
        <span className={`${toolbarItemClass} border-cyan-300/50 bg-cyan-400/15 font-semibold text-cyan-100`} title={ui.liveMode}>
          {ui.liveMode}
        </span>
        <button className={buttonItemClass} type="button" onClick={onBackToLibrary} title={ui.backToLibrary}>
          {ui.backToLibrary}
        </button>
        <button className={buttonItemClass} type="button" onClick={() => onStepTemplateOrder(-1)} title={ui.prevTemplate}>
          {ui.prevTemplate}
        </button>
        <button className={buttonItemClass} type="button" onClick={() => onStepTemplateOrder(1)} title={ui.nextTemplate}>
          {ui.nextTemplate}
        </button>
        <span className={`${statusItemClass} flex-col`} title={`${ui.sequence} ${templateCursor + 1}/${templateOrderLength}`}>
          <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{ui.sequence}</span>
          <span className="mt-0.5">{templateCursor + 1}/{templateOrderLength}</span>
        </span>
        <span className={`${statusItemClass} flex-col`} title={`${ui.active}: ${activeTemplateLabel}`}>
          <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{ui.active}</span>
          <span className="mt-0.5 w-full truncate">{activeTemplateLabel}</span>
        </span>
        <span className={`${statusItemClass} flex-col`} title={stripFileExtension(importFileName) || ui.notLoaded}>
          <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{ui.importFile}</span>
          <span className="mt-0.5 w-full truncate">{stripFileExtension(importFileName) || ui.notLoaded}</span>
        </span>
      </div>

      <div
        ref={previewShellRef}
        className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 p-3 backdrop-blur-xl"
      >
        <div
          className="mx-auto"
          style={{
            width: `${scaledPreviewWidth}px`,
            height: `${scaledPreviewHeight}px`,
          }}
        >
          <div
            ref={previewRef}
            className={HIGH_END_STAGE_CLASS}
            style={{
              width: `${previewBaseWidth}px`,
              height: `${previewBaseHeight}px`,
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
            }}
          >
            {activeTemplate === 'fight-title' ? null : (
              <div className={HIGH_END_STAGE_OVERLAY_CLASS} />
            )}
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.14)_1px,transparent_1px)] [background-size:34px_34px]" />
            <div className="pointer-events-none absolute inset-3 rounded-[26px] border border-white/12" />
            {activeTemplate === 'fight-title' ? null : <div className="scan-sweep" />}
            <div key={activeTemplate} className="template-fade h-full">
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
