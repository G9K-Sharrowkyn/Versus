import clsx from 'clsx'
import { createPortal } from 'react-dom'
import type { TranslationDictionary } from '../../../i18n/types'
import {
  FIGHT_TITLE_PORTRAIT_ASPECT,
  PORTRAIT_SCALE_MAX,
  PORTRAIT_SCALE_MIN,
  buildPortraitImageStyle,
} from '../helpers'
import type { PortraitAdjust, PortraitEditorState } from '../types'

type PortraitEditorModalProps = {
  portraitEditor: PortraitEditorState | null
  ui: TranslationDictionary['ui']
  canSwitchSide: boolean
  onToggleSide: () => void
  onUpdateAdjust: (patch: Partial<PortraitAdjust>) => void
  onResetAdjust: () => void
  onClose: () => void
  onApply: () => void
}

export function PortraitEditorModal({
  portraitEditor,
  ui,
  canSwitchSide,
  onToggleSide,
  onUpdateAdjust,
  onResetAdjust,
  onClose,
  onApply,
}: PortraitEditorModalProps) {
  if (!portraitEditor || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[2147483646] flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-cyan-300/35 bg-slate-950/96 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.62)]">
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-700/70 pb-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-100">{ui.portraitEditorTitle}</p>
            <p className="mt-1 text-xs text-slate-300">{ui.portraitEditorHint}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                'rounded-md border px-2 py-1 text-[11px] uppercase tracking-[0.14em]',
                portraitEditor.side === 'a'
                  ? 'border-sky-300/55 bg-sky-500/15 text-sky-200'
                  : 'border-rose-300/55 bg-rose-500/15 text-rose-200',
              )}
            >
              {portraitEditor.side === 'a' ? ui.portraitA : ui.portraitB}
            </span>
            {canSwitchSide ? (
              <button type="button" className="button-soft" onClick={onToggleSide}>
                {ui.portraitSwitchSide}
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <div className="rounded-xl border border-slate-700/80 bg-black/55 p-3">
            <div
              className="relative mx-auto w-full max-w-[430px] overflow-hidden rounded-lg border border-slate-600/70 bg-slate-900/80"
              style={{ aspectRatio: `${FIGHT_TITLE_PORTRAIT_ASPECT}` }}
            >
              <img
                src={portraitEditor.previewUrl}
                alt="portrait-editor-preview"
                className="h-full w-full object-cover"
                style={buildPortraitImageStyle(portraitEditor.adjust)}
              />
              <div className="pointer-events-none absolute inset-0 border-2 border-white/15" />
              <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:28px_28px]" />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
            <label className="block">
              <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-slate-300">
                {ui.portraitPosX}: {Math.round(portraitEditor.adjust.x)}%
              </p>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={portraitEditor.adjust.x}
                onChange={(event) => onUpdateAdjust({ x: Number(event.target.value) })}
                className="w-full accent-cyan-400"
              />
            </label>

            <label className="block">
              <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-slate-300">
                {ui.portraitPosY}: {Math.round(portraitEditor.adjust.y)}%
              </p>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={portraitEditor.adjust.y}
                onChange={(event) => onUpdateAdjust({ y: Number(event.target.value) })}
                className="w-full accent-cyan-400"
              />
            </label>

            <label className="block">
              <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-slate-300">
                {ui.portraitZoom}: {portraitEditor.adjust.scale.toFixed(2)}x
              </p>
              <input
                type="range"
                min={PORTRAIT_SCALE_MIN}
                max={PORTRAIT_SCALE_MAX}
                step={0.01}
                value={portraitEditor.adjust.scale}
                onChange={(event) => onUpdateAdjust({ scale: Number(event.target.value) })}
                className="w-full accent-cyan-400"
              />
            </label>

            <div className="flex flex-wrap gap-2 pt-2">
              <button type="button" className="button-soft" onClick={onResetAdjust}>
                {ui.portraitReset}
              </button>
              <button type="button" className="button-soft" onClick={onClose}>
                {ui.portraitCancel}
              </button>
              <button type="button" className="button-soft" onClick={onApply}>
                {ui.portraitApply}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
