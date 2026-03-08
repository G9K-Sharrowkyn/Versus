import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { AVERAGE_DRAW_THRESHOLD } from '../../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import { pickLang } from '../../presets'
import type { TemplatePreviewProps } from '../../types'
import {
  HIGH_END_CARD_CLASS,
  HIGH_END_FRAME_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_HEADER_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HIGH_END_SUBTEXT_CLASS,
} from '../shared/highEnd'

export function RadarBriefTemplate({
  rows,
  fighterA,
  fighterB,
  averageA,
  averageB,
  title,
  subtitle,
  templateBlocks,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['radar-brief'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
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
  const leftHeader = pickTemplateField(blockFields, ['left_header']) || tr('NIEBIESKI NAROZNIK', 'BLUE CORNER')
  const rightHeader = pickTemplateField(blockFields, ['right_header']) || tr('CZERWONY NAROZNIK', 'RED CORNER')
  const drawHeader = pickTemplateField(blockFields, ['draw_header']) || tr('Kategorie remisowe', 'Draw categories')
  const leftAdvantages = rows.filter((row) => row.winner === 'a')
  const rightAdvantages = rows.filter((row) => row.winner === 'b')
  const drawRows = rows.filter((row) => row.winner === 'draw')
  const fighterAText = fighterA.name || 'Fighter A'
  const fighterBText = fighterB.name || 'Fighter B'
  const averageGap = Math.abs(averageA - averageB)
  const isAverageDraw = averageGap < AVERAGE_DRAW_THRESHOLD
  const favoriteSide: 'a' | 'b' | 'draw' = isAverageDraw ? 'draw' : averageA > averageB ? 'a' : 'b'
  const favoriteDrawLabel =
    pickTemplateField(blockFields, ['draw_favorite', 'draw_favorite_label', 'favorite_draw']) || tr('REMIS', 'DRAW')
  const favorite =
    isAverageDraw
      ? favoriteDrawLabel
      : pickTemplateField(blockFields, ['favorite_label', 'favorite']) ||
        (averageA > averageB ? `${fighterAText} ${tr('faworyt', 'favorite')}` : `${fighterBText} ${tr('faworyt', 'favorite')}`)
  const favoriteLeft = favoriteSide === 'a' ? '37.5%' : favoriteSide === 'b' ? '87.5%' : '50%'
  const favoriteRotation = favoriteSide === 'a' ? -12 : favoriteSide === 'b' ? 12 : 0

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

          <div className="mt-3 grid flex-1 grid-cols-[1fr_1.3fr_1fr] gap-3">
            <div className={`${HIGH_END_FRAME_CLASS} min-h-0 p-2`}>
              <p className="text-[12px] uppercase tracking-[0.16em]" style={{ color: fighterA.color }}>
                {leftHeader} // {fighterAText}
              </p>
              <div className="mt-2 max-h-full space-y-2 overflow-y-auto pr-1">
                {leftAdvantages.length ? (
                  leftAdvantages.map((row) => (
                    <div
                      key={`left-adv-${row.id}`}
                      className="rounded border px-2 py-2"
                      style={{ borderColor: `${fighterA.color}66`, backgroundColor: `${fighterA.color}18` }}
                    >
                      <p className="text-[12px] uppercase tracking-[0.15em]" style={{ color: fighterA.color }}>
                        {row.label}
                      </p>
                      <p className="mt-1 text-[16px] leading-tight text-slate-100">
                        {row.a} &gt; {row.b}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded border border-slate-600/55 bg-black/28 px-2 py-2 text-sm text-slate-300">
                    {tr('Brak przewagi kategorii po lewej stronie.', 'No category edge for the left side.')}
                  </div>
                )}
              </div>
            </div>

            <div className={`${HIGH_END_FRAME_CLASS} select-none p-2`}>
              <div className="pointer-events-none h-[78%] select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={rows} cx="50%" cy="44%" outerRadius="74%" margin={{ top: 12, right: 28, bottom: 38, left: 28 }}>
                    <PolarGrid stroke="rgba(148,163,184,0.35)" />
                    <PolarAngleAxis dataKey="label" tick={{ fill: '#CBD5E1', fontSize: 12 }} />
                    <Radar dataKey="a" stroke={fighterA.color} fill={fighterA.color} fillOpacity={0.33} />
                    <Radar dataKey="b" stroke={fighterB.color} fill={fighterB.color} fillOpacity={0.28} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 rounded-lg border border-slate-600/60 bg-black/35 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">{drawHeader}</p>
                {drawRows.length ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {drawRows.map((row) => (
                      <div key={`draw-${row.id}`} className="rounded border border-slate-500/75 bg-slate-900/75 px-2 py-2">
                        <p className="text-[11px] uppercase tracking-[0.15em] text-slate-300">{row.label}</p>
                        <p className="mt-1 text-[14px] leading-tight text-slate-100">
                          {row.a} = {row.b}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-[12px] text-slate-400">{tr('Brak remisow w biezacym ukladzie.', 'No draws in current setup.')}</p>
                )}
              </div>
            </div>

            <div className={`${HIGH_END_FRAME_CLASS} min-h-0 p-2`}>
              <p className="text-[12px] uppercase tracking-[0.16em]" style={{ color: fighterB.color }}>
                {rightHeader} // {fighterBText}
              </p>
              <div className="mt-2 max-h-full space-y-2 overflow-y-auto pr-1">
                {rightAdvantages.length ? (
                  rightAdvantages.map((row) => (
                    <div
                      key={`right-adv-${row.id}`}
                      className="rounded border px-2 py-2"
                      style={{ borderColor: `${fighterB.color}66`, backgroundColor: `${fighterB.color}18` }}
                    >
                      <p className="text-[12px] uppercase tracking-[0.15em]" style={{ color: fighterB.color }}>
                        {row.label}
                      </p>
                      <p className="mt-1 text-[16px] leading-tight text-slate-100">
                        {row.b} &gt; {row.a}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded border border-slate-600/55 bg-black/28 px-2 py-2 text-sm text-slate-300">
                    {tr('Brak przewagi kategorii po prawej stronie.', 'No category edge for the right side.')}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className={`${HIGH_END_CARD_CLASS} px-4 py-3 text-center`} style={{ boxShadow: `0 0 0 1px ${fighterA.color}33 inset` }}>
              <p className="text-[12px] uppercase tracking-[0.16em] text-slate-200">{fighterAText}</p>
              <p className="text-[42px] font-semibold leading-none" style={{ color: fighterA.color }}>
                {Math.round(averageA)}
              </p>
            </div>
            <div className={`${HIGH_END_CARD_CLASS} px-4 py-3 text-center`} style={{ boxShadow: `0 0 0 1px ${fighterB.color}33 inset` }}>
              <p className="text-[12px] uppercase tracking-[0.16em] text-slate-200">{fighterBText}</p>
              <p className="text-[42px] font-semibold leading-none" style={{ color: fighterB.color }}>
                {Math.round(averageB)}
              </p>
            </div>
          </div>

          <div
            className="favorite-stamp absolute bottom-4 -translate-x-1/2 px-4 py-2 text-lg uppercase tracking-[0.04em]"
            style={{
              left: favoriteLeft,
              transform: `translateX(-50%) rotate(${favoriteRotation}deg)`,
            }}
          >
            {favorite}
          </div>
        </div>
      </div>
    </div>
  )
}

