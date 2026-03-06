import { pickLang } from '../../presets'
import type { TemplatePreviewProps } from '../../types'
import {
  HIGH_END_CARD_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_HEADER_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HIGH_END_SUBTEXT_CLASS,
} from '../shared/highEnd'

export function HudBarsTemplate({
  rows,
  fighterA,
  fighterB,
  averageA,
  averageB,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const headerText = tr('analityka walki', 'fight analytics')
  const subText = tr('statystyki obu zawodnikow', 'stats of both fighters')
  const leftTopLabel = tr('Stopien zagrozenia', 'Threat level')
  const threatLevel = tr('ekstremalny', 'extreme')
  const leftBottomLabel = tr('Integralnosc danych', 'Data integrity')
  const integrity = '99.6%'
  const rightTopLabel = 'VersusVerseVault'
  const profileMode = '/assets/VS2.png'
  const rightBottomLabel = tr('Sygnatura marki', 'Brand mark')
  const scale = 'VersusVerseVault badge'
  const isDense = rows.length > 8
  const denseRowsStyle = isDense
    ? { gridTemplateRows: `repeat(${Math.max(rows.length, 1)}, minmax(0, 1fr))` }
    : undefined

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

          <div className={`grid grid-cols-2 gap-2 ${isDense ? 'mt-1.5 text-[11px]' : 'mt-2 text-[12px]'}`}>
            <div className={`${HIGH_END_CARD_CLASS} px-3 ${isDense ? 'py-1.5' : 'py-2'}`} style={{ boxShadow: `0 0 0 1px ${fighterA.color}33 inset` }}>
              <p className="uppercase tracking-[0.16em] text-slate-300">{fighterA.name}</p>
              <p className="font-semibold" style={{ color: fighterA.color }}>
                {tr('Sr.', 'Avg')} {averageA.toFixed(1)}
              </p>
            </div>
            <div className={`${HIGH_END_CARD_CLASS} px-3 ${isDense ? 'py-1.5' : 'py-2'}`} style={{ boxShadow: `0 0 0 1px ${fighterB.color}33 inset` }}>
              <p className="uppercase tracking-[0.16em] text-slate-300">{fighterB.name}</p>
              <p className="font-semibold" style={{ color: fighterB.color }}>
                {tr('Sr.', 'Avg')} {averageB.toFixed(1)}
              </p>
            </div>
          </div>

          <div className={`min-h-0 flex-1 ${isDense ? 'mt-2 flex flex-col' : 'mt-3'}`}>
            <div
              className={`grid items-center px-1 uppercase tracking-[0.15em] text-slate-400 ${
                isDense ? 'grid-cols-[220px_1fr] gap-3 text-[10px]' : 'grid-cols-[190px_1fr] gap-4 text-[11px]'
              }`}
            >
              <p>{tr('Parametr', 'Parameter')}</p>
              <div className="space-y-1">
                <span>{tr('Wynik (0-100)', 'Score (0-100)')}</span>
                <div className="grid grid-cols-[1fr_30px] items-start gap-2">
                  <div className="relative h-3 text-[10px] text-slate-500">
                    <span className="absolute left-0 top-0">0</span>
                    <span className="absolute left-1/4 top-0 -translate-x-1/2">25</span>
                    <span className="absolute left-1/2 top-0 -translate-x-1/2">50</span>
                    <span className="absolute left-3/4 top-0 -translate-x-1/2">75</span>
                    <span className="absolute right-0 top-0">100</span>
                  </div>
                  <div />
                </div>
              </div>
            </div>
            <div className={isDense ? 'mt-1.5 grid min-h-0 flex-1 gap-1.5' : 'mt-2 space-y-2'} style={denseRowsStyle}>
              {rows.map((row, index) => (
                <div
                  key={`row-${row.id}`}
                  className={`grid items-center rounded border border-cyan-300/15 bg-slate-950/55 px-2 ${
                    isDense ? 'min-h-0 grid-cols-[220px_1fr] gap-3 py-1.5' : 'h-[50px] grid-cols-[190px_1fr] gap-4'
                  }`}
                  style={{ animationDelay: `${index * 0.04}s` }}
                >
                  <div className={isDense ? 'pr-2 text-[13px] leading-tight text-slate-100' : 'truncate text-[15px] text-slate-100'}>
                    {row.label}
                  </div>
                  <div className={isDense ? 'flex h-full flex-col justify-center space-y-1' : 'space-y-1'}>
                    <div className="grid grid-cols-[1fr_30px] items-center gap-2">
                      <div className={isDense ? 'h-3 overflow-hidden rounded border border-slate-700/70 bg-black/55' : 'h-3 overflow-hidden rounded border border-slate-700/70 bg-black/55'}>
                        <div className="h-full rounded-r transition-[width] duration-700" style={{ width: `${row.a}%`, backgroundColor: fighterA.color }} />
                      </div>
                      <span className={isDense ? 'text-right text-[13px] text-slate-200' : 'text-right text-sm text-slate-200'}>{row.a}</span>
                    </div>
                    <div className="grid grid-cols-[1fr_30px] items-center gap-2">
                      <div className={isDense ? 'h-3 overflow-hidden rounded border border-slate-700/70 bg-black/55' : 'h-3 overflow-hidden rounded border border-slate-700/70 bg-black/55'}>
                        <div className="h-full rounded-r transition-[width] duration-700" style={{ width: `${row.b}%`, backgroundColor: fighterB.color }} />
                      </div>
                      <span className={isDense ? 'text-right text-[13px] text-slate-200' : 'text-right text-sm text-slate-200'}>{row.b}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

