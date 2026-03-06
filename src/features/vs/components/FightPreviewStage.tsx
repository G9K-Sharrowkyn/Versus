import clsx from 'clsx'
import type { ReactNode, RefObject } from 'react'
import type { TranslationDictionary } from '../../../i18n/types'
import { stripFileExtension } from '../helpers'
import { FRAME_CLASSES, THEME_CLASSES, THEME_OVERLAYS } from '../presets'
import type { Frame, LayoutMode, TemplateId, Theme } from '../types'

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
  frame: Frame
  theme: Theme
  activeTemplate: TemplateId
  layoutMode: LayoutMode
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
  frame,
  theme,
  activeTemplate,
  layoutMode,
  children,
}: FightPreviewStageProps) {
  return (
    <section
      className="flex h-full min-h-0 flex-col gap-3 transition-opacity duration-200 ease-out"
      style={{ opacity: fightViewVisible ? 1 : 0, pointerEvents: fightViewVisible ? 'auto' : 'none' }}
    >
      <div className="shrink-0 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 p-3 backdrop-blur-xl">
        <span className="rounded-xl border border-cyan-300/50 bg-cyan-400/15 px-3 py-2 text-sm font-semibold text-cyan-100">
          {ui.liveMode}
        </span>
        <button className="button-soft" type="button" onClick={onBackToLibrary}>
          {ui.backToLibrary}
        </button>
        <button className="button-soft" type="button" onClick={() => onStepTemplateOrder(-1)}>
          {ui.prevTemplate}
        </button>
        <button className="button-soft" type="button" onClick={() => onStepTemplateOrder(1)}>
          {ui.nextTemplate}
        </button>
        <span className="rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-200">
          {ui.sequence} {templateCursor + 1}/{templateOrderLength}
        </span>
        <span className="rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-200">
          {ui.active}: {activeTemplateLabel}
        </span>
        <span className="rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-200">
          {stripFileExtension(importFileName) || ui.notLoaded}
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
            className={clsx(
              'relative overflow-hidden rounded-[34px] border p-4 sm:p-5',
              FRAME_CLASSES[frame],
              THEME_CLASSES[theme],
            )}
            style={{
              width: `${previewBaseWidth}px`,
              height: `${previewBaseHeight}px`,
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
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
