import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import type { TranslationDictionary } from '../../../i18n/types'
import { stripFileExtension } from '../helpers'
import { getTemplateUi } from '../templates/shared/templateUi'
import type { TemplateId } from '../types'
import { HeroLogoBadge } from './HeroLogoBadge'

type FightPreviewStageProps = {
  ui: TranslationDictionary['ui']
  activeTemplateLabel: string
  templateCursor: number
  templateOrderLength: number
  canStepTemplateBackward: boolean
  canStepTemplateForward: boolean
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
  previewReady: boolean
  activeTemplate: TemplateId
  activeFightFolderKey: string
  activeFightLocale: string
  children: ReactNode
}

export function FightPreviewStage({
  ui,
  activeTemplateLabel,
  templateCursor,
  templateOrderLength,
  canStepTemplateBackward,
  canStepTemplateForward,
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
  previewReady,
  activeTemplate,
  activeFightFolderKey,
  activeFightLocale,
  children,
}: FightPreviewStageProps) {
  const stageShell = getTemplateUi(activeTemplate, activeFightLocale === 'en' ? 'en' : 'pl').highEnd as Record<string, string>

  // ── Hue-shift toolbar on mouse move ──────────────────────────────────────
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const hue = Math.round((e.clientX / window.innerWidth) * 300 + 150)
      toolbarRef.current?.style.setProperty('--vs-mouse-hue', String(hue))
    }
    window.addEventListener('mousemove', handleMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  // ── Class builders ────────────────────────────────────────────────────────
  const toolbarItemClass =
    'flex h-12 min-w-0 items-center justify-center rounded-xl border px-3 text-center text-sm leading-tight'
  const buttonHueClass = `${toolbarItemClass} btn-hue-shift`
  const statusItemClass = `${toolbarItemClass} border-white/15 bg-transparent text-slate-200`

  return (
    <section
      className="flex h-full min-h-0 flex-col gap-3 transition-opacity duration-200 ease-out"
      style={{ opacity: fightViewVisible ? 1 : 0, pointerEvents: fightViewVisible ? 'auto' : 'none' }}
    >
      {/* ── Toolbar ── */}
      <div
        ref={toolbarRef}
        style={{ '--vs-mouse-hue': '180' } as React.CSSProperties}
        className="shrink-0 grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-slate-950/60 p-3 backdrop-blur-xl sm:grid-cols-2 xl:grid-cols-7"
      >
        <span
          className={`${toolbarItemClass} border-cyan-300/50 bg-cyan-400/15 font-semibold text-cyan-100`}
          title={ui.liveMode}
        >
          {ui.liveMode}
        </span>
        <button className={buttonHueClass} type="button" onClick={onBackToLibrary} title={ui.backToLibrary}>
          {ui.backToLibrary}
        </button>
        <button
          className={buttonHueClass}
          type="button"
          onClick={() => onStepTemplateOrder(-1)}
          title={ui.prevTemplate}
          disabled={!canStepTemplateBackward}
        >
          {ui.prevTemplate}
        </button>
        <button
          className={buttonHueClass}
          type="button"
          onClick={() => onStepTemplateOrder(1)}
          title={ui.nextTemplate}
          disabled={!canStepTemplateForward}
        >
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

      {/* ── Preview shell ── */}
      <div
        ref={previewShellRef}
        data-vs-preview-shell="true"
        className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 p-3 backdrop-blur-xl"
      >
        <div
          className="mx-auto"
          style={{ width: `${scaledPreviewWidth}px`, height: `${scaledPreviewHeight}px` }}
        >
          <div
            ref={previewRef}
            data-vs-stage="true"
            data-vs-preview-ready={previewReady ? 'true' : 'false'}
            data-vs-preview-scale={previewScale}
            data-vs-template={activeTemplate}
            data-vs-folder-key={activeFightFolderKey}
            data-vs-locale={activeFightLocale}
            className={stageShell.HIGH_END_STAGE_CLASS}
            style={{
              width: `${previewBaseWidth}px`,
              height: `${previewBaseHeight}px`,
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
              opacity: previewReady ? 1 : 0,
            }}
            aria-busy={!previewReady}
          >
            <div className={stageShell.HIGH_END_STAGE_OVERLAY_CLASS} />
            <div className={stageShell.HIGH_END_STAGE_GRID_CLASS} />
            <div className={stageShell.HIGH_END_STAGE_FRAME_CLASS} />
            <div className="scan-sweep" />

            {/* ── Template content ── */}
            <div key={activeTemplate} className="template-fade h-full">
              {children}
            </div>


            {/* ── Cycling DC hero logo badge ── */}
            <HeroLogoBadge />
          </div>
        </div>
      </div>
    </section>
  )
}
