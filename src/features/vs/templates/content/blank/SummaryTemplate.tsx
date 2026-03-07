import { fighterMonogram } from '../../../helpers'
import { pickLang } from '../../../presets'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { AdjustableTemplateImage } from '../../../components/AdjustableTemplateImage'
import {
  HIGH_END_CARD_CLASS,
  HIGH_END_FRAME_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_HEADER_CLASS,
  HIGH_END_INSET_CLASS,
  HIGH_END_LABEL_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HIGH_END_SMALL_TEXT_CLASS,
  HIGH_END_SUBTEXT_CLASS,
} from '../../shared/highEnd'

export function SummaryTemplate({
  fighterA,
  fighterB,
  portraitAAdjust,
  portraitBAdjust,
  averageA,
  averageB,
  title,
  subtitle,
  templateBlocks,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES.summary || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const line = (position: number, keys: string[], fallback = '') =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const leftTopLabel = tr('Stopien zagrozenia', 'Threat level')
  const threatLevel = tr('ekstremalny', 'extreme')
  const leftBottomLabel = tr('Integralnosc danych', 'Data integrity')
  const integrity = '99.6%'
  const rightTopLabel = 'VersusVerseVault'
  const profileMode = '/assets/VS2.png'
  const rightBottomLabel = tr('Sygnatura marki', 'Brand mark')
  const scale = 'VersusVerseVault badge'
  const portraitHint = tr('LPM: przesun | PPM: skaluj', 'LMB: move | RMB: zoom')
  const winnerLabel =
    pickTemplateField(blockFields, ['winner', 'verdict']) ||
    tr('WERDYKT WARUNKOWY, BRAK ABSOLUTNEGO STOMPA', 'CONDITIONAL VERDICT, NO ABSOLUTE STOMP')
  const summaryLines = [
    line(0, ['line_1', 'line1'], tr('Tempo > obrazenia na otwarciu.', 'Tempo > damage in opening.')),
    line(1, ['line_2', 'line2'], tr('Regeneracja zmienia pozna faze starcia.', 'Regeneration changes late game.')),
    line(2, ['line_3', 'line3'], tr('Zasady walki moga odwrocic werdykt.', 'Rules can flip the verdict.')),
  ]

  return (
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full flex-col">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 border-b border-cyan-300/25 pb-3 text-[11px] text-slate-300">
            <div className="min-w-[238px] space-y-1 pt-2 text-left">
              <p className="whitespace-nowrap uppercase tracking-[0.16em]">{leftTopLabel}: {threatLevel}</p>
              <p className="whitespace-nowrap uppercase tracking-[0.16em]">{leftBottomLabel}: {integrity}</p>
            </div>
            <div className="text-center">
              <h2 className={HIGH_END_HEADER_CLASS} style={{ fontFamily: 'var(--font-display)' }}>
                {headerText}
              </h2>
              {subText ? <p className={HIGH_END_SUBTEXT_CLASS}>{subText}</p> : null}
            </div>
            <div className="flex items-start justify-end pt-1">
  <div
    className="flex h-[86px] aspect-[755/322] items-center justify-center overflow-hidden rounded-[14px] border border-cyan-300/35 bg-[linear-gradient(180deg,rgba(7,24,42,0.96),rgba(4,14,24,0.94))] p-0 shadow-[0_0_0_1px_rgba(125,211,252,0.08)_inset,0_10px_26px_rgba(2,8,23,0.45)]"
    title={rightBottomLabel}
    aria-label={scale}
  >
    <img src={profileMode} alt={rightTopLabel} className="h-full w-full object-contain drop-shadow-[0_0_14px_rgba(251,146,60,0.28)]" draggable={false} />
  </div>
</div>
          </div>

          <div className="mt-2 grid min-h-0 flex-1 grid-cols-[1.05fr_1.2fr_1.05fr] gap-3">
            <div className={`${HIGH_END_FRAME_CLASS} min-h-0 p-2`} style={{ boxShadow: `0 0 0 1px ${fighterA.color}33 inset` }}>
              <div className={`mb-2 ${HIGH_END_INSET_CLASS} px-3 py-2`}>
                <p className={HIGH_END_SMALL_TEXT_CLASS}>{tr('Niebieski naroznik', 'Blue corner')}</p>
                <p className="text-lg uppercase leading-none" style={{ color: fighterA.color, fontFamily: 'var(--font-display)' }}>
                  {fighterA.name || 'Fighter A'}
                </p>
              </div>
              <div className="relative h-[78%] overflow-hidden rounded-lg border bg-slate-950/80" style={{ borderColor: `${fighterA.color}88` }}>
                {fighterA.imageUrl ? (
                  <AdjustableTemplateImage
                    imageUrl={fighterA.imageUrl}
                    alt={fighterA.name || 'Fighter A'}
                    fallbackLabel={tr('Miejsce na portret', 'Portrait Slot')}
                    hintLabel={portraitHint}
                    adjustKey="summary:portrait-a"
                    baseAdjust={portraitAAdjust}
                    adjustments={slideImageAdjustments}
                    onAdjustChange={onSlideImageAdjustChange}
                    onAdjustCommit={onSlideImageAdjustCommit}
                    plain
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.14),transparent_45%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.9))]"
                    style={{ color: fighterA.color }}
                  >
                    <div className="text-center">
                      <p className="text-[56px] font-semibold tracking-[0.04em]">{fighterMonogram(fighterA.name || 'Fighter A')}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{tr('Miejsce na portret', 'Portrait Slot')}</p>
                    </div>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 border-[3px] border-black/35" />
                <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:28px_28px]" />
              </div>
            </div>

            <div className={`${HIGH_END_FRAME_CLASS} flex min-h-0 flex-col p-3`}>
              <div className="rounded-xl border border-amber-300/55 bg-[linear-gradient(115deg,rgba(120,53,15,0.42),rgba(251,191,36,0.35),rgba(120,53,15,0.42))] px-4 py-3 text-left">
                <p className="text-xs uppercase tracking-[0.18em] text-amber-100">{tr('Werdykt', 'Verdict')}</p>
                <p
                  className="mt-2 max-w-[20ch] text-[clamp(1.6rem,2.2vw,2.8rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-white"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {winnerLabel}
                </p>
              </div>

              <div className="mt-2 grid shrink-0 grid-cols-2 gap-2">
                <div className={`${HIGH_END_CARD_CLASS} px-3 py-1.5`} style={{ boxShadow: `0 0 0 1px ${fighterA.color}33 inset` }}>
                  <p className="text-xs uppercase tracking-[0.16em]">{fighterA.name || 'Fighter A'}</p>
                  <p className="text-[1.75rem] font-semibold leading-none" style={{ color: fighterA.color }}>
                    {Math.round(averageA)}
                  </p>
                </div>
                <div className={`${HIGH_END_CARD_CLASS} px-3 py-1.5`} style={{ boxShadow: `0 0 0 1px ${fighterB.color}33 inset` }}>
                  <p className="text-xs uppercase tracking-[0.16em]">{fighterB.name || 'Fighter B'}</p>
                  <p className="text-[1.75rem] font-semibold leading-none" style={{ color: fighterB.color }}>
                    {Math.round(averageB)}
                  </p>
                </div>
              </div>

              <div className={`mt-2 flex min-h-0 flex-1 flex-col ${HIGH_END_CARD_CLASS} p-2`}>
                <p className={HIGH_END_LABEL_CLASS}>{tr('Linie podsumowania', 'Summary lines')}</p>
                <div className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1 text-sm text-slate-100">
                  {summaryLines.map((item, index) => (
                    <div key={`summary-line-${index}-${item}`} className="rounded border border-slate-700/60 bg-black/35 px-2 py-1">
                      {index + 1}. {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`${HIGH_END_FRAME_CLASS} min-h-0 p-2`} style={{ boxShadow: `0 0 0 1px ${fighterB.color}33 inset` }}>
              <div className={`mb-2 ${HIGH_END_INSET_CLASS} px-3 py-2`}>
                <p className={HIGH_END_SMALL_TEXT_CLASS}>{tr('Czerwony naroznik', 'Red corner')}</p>
                <p className="text-lg uppercase leading-none" style={{ color: fighterB.color, fontFamily: 'var(--font-display)' }}>
                  {fighterB.name || 'Fighter B'}
                </p>
              </div>
              <div className="relative h-[78%] overflow-hidden rounded-lg border bg-slate-950/80" style={{ borderColor: `${fighterB.color}88` }}>
                {fighterB.imageUrl ? (
                  <AdjustableTemplateImage
                    imageUrl={fighterB.imageUrl}
                    alt={fighterB.name || 'Fighter B'}
                    fallbackLabel={tr('Miejsce na portret', 'Portrait Slot')}
                    hintLabel={portraitHint}
                    adjustKey="summary:portrait-b"
                    baseAdjust={portraitBAdjust}
                    adjustments={slideImageAdjustments}
                    onAdjustChange={onSlideImageAdjustChange}
                    onAdjustCommit={onSlideImageAdjustCommit}
                    plain
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.14),transparent_45%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.9))]"
                    style={{ color: fighterB.color }}
                  >
                    <div className="text-center">
                      <p className="text-[56px] font-semibold tracking-[0.04em]">{fighterMonogram(fighterB.name || 'Fighter B')}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{tr('Miejsce na portret', 'Portrait Slot')}</p>
                    </div>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 border-[3px] border-black/35" />
                <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:28px_28px]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

