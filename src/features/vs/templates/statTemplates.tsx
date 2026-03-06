import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { pickLang } from '../presets'
import { AVERAGE_DRAW_THRESHOLD, iconForCategory } from '../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../importer'
import type { TemplatePreviewProps } from '../types'
import { LightningCanvas } from '../components/LightningCanvas'

export function HudBarsTemplate({
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
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['hud-bars'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const headerText =
    pickTemplateField(blockFields, ['headline', 'header', 'title']) ||
    title ||
    tr('SZACOWANIE STATYSTYK POSTACI', 'CHARACTER STAT ESTIMATION')
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle || ''
  const threatLevel = pickTemplateField(blockFields, ['threat_level']) || tr('WYSOKI', 'HIGH')
  const integrity = pickTemplateField(blockFields, ['integrity', 'data_integrity']) || '99.9%'
  const profileMode = pickTemplateField(blockFields, ['profile_mode']) || 'VS'
  const scale = pickTemplateField(blockFields, ['scale']) || '0-100'

  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 border-b border-cyan-300/25 pb-3 text-[11px] text-slate-300">
        <div className="pt-2">
          <p className="uppercase tracking-[0.16em]">
            {tr('Poziom zagrożenia', 'Threat level')}: {threatLevel}
          </p>
          <p className="uppercase tracking-[0.16em]">
            {tr('Integralność danych', 'Data integrity')}: {integrity}
          </p>
        </div>
        <div className="text-center">
          <h2
            className="text-[36px] uppercase leading-none tracking-[0.04em] text-slate-50 sm:text-[48px]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {headerText}
          </h2>
          {subText ? (
            <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">{subText}</p>
          ) : null}
        </div>
        <div className="pt-2 text-right">
          <p className="uppercase tracking-[0.16em]">{tr('Tryb profilu', 'Profile mode')}: {profileMode}</p>
          <p className="uppercase tracking-[0.16em]">{tr('Skala', 'Scale')}: {scale}</p>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
        <div className="rounded-lg border border-white/20 bg-black/25 px-3 py-2">
          <p className="uppercase tracking-[0.16em] text-slate-300">{fighterA.name}</p>
          <p className="font-semibold" style={{ color: fighterA.color }}>
            {tr('Śr.', 'Avg')} {averageA.toFixed(1)}
          </p>
        </div>
        <div className="rounded-lg border border-white/20 bg-black/25 px-3 py-2">
          <p className="uppercase tracking-[0.16em] text-slate-300">{fighterB.name}</p>
          <p className="font-semibold" style={{ color: fighterB.color }}>
            {tr('Śr.', 'Avg')} {averageB.toFixed(1)}
          </p>
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1">
        <div className="grid grid-cols-[190px_1fr] items-center gap-4 px-1 text-[11px] uppercase tracking-[0.15em] text-slate-400">
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
        <div className="mt-2 space-y-2">
          {rows.map((row, index) => (
            <div
              key={`row-${row.id}`}
              className="grid h-[50px] grid-cols-[190px_1fr] items-center gap-4 rounded border border-slate-700/45 bg-black/22 px-2"
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              <div className="truncate text-[15px] text-slate-100">{row.label}</div>
              <div className="space-y-1">
                <div className="grid grid-cols-[1fr_30px] items-center gap-2">
                  <div className="h-3 overflow-hidden rounded border border-slate-700/70 bg-black/55">
                    <div className="h-full rounded-r transition-[width] duration-700" style={{ width: `${row.a}%`, backgroundColor: fighterA.color }} />
                  </div>
                  <span className="text-right text-sm text-slate-200">{row.a}</span>
                </div>
                <div className="grid grid-cols-[1fr_30px] items-center gap-2">
                  <div className="h-3 overflow-hidden rounded border border-slate-700/70 bg-black/55">
                    <div className="h-full rounded-r transition-[width] duration-700" style={{ width: `${row.b}%`, backgroundColor: fighterB.color }} />
                  </div>
                  <span className="text-right text-sm text-slate-200">{row.b}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
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
  const leftHeader = pickTemplateField(blockFields, ['left_header']) || tr('NIEBIESKI NAROŻNIK', 'BLUE CORNER')
  const rightHeader = pickTemplateField(blockFields, ['right_header']) || tr('CZERWONY NAROŻNIK', 'RED CORNER')
  const drawHeader = pickTemplateField(blockFields, ['draw_header']) || tr('Kategorie remisowe', 'Draw categories')
  const leftAdvantages = rows.filter((row) => row.winner === 'a')
  const rightAdvantages = rows.filter((row) => row.winner === 'b')
  const drawRows = rows.filter((row) => row.winner === 'draw')
  const fighterAText = fighterA.name || 'Fighter A'
  const fighterBText = fighterB.name || 'Fighter B'
  const averageGap = Math.abs(averageA - averageB)
  const isAverageDraw = averageGap < AVERAGE_DRAW_THRESHOLD
  const favoriteSide: 'a' | 'b' | 'draw' =
    isAverageDraw ? 'draw' : averageA > averageB ? 'a' : 'b'
  const favoriteDrawLabel =
    pickTemplateField(blockFields, ['draw_favorite', 'draw_favorite_label', 'favorite_draw']) ||
    tr('REMIS', 'DRAW')
  const favorite =
    isAverageDraw
      ? favoriteDrawLabel
      : pickTemplateField(blockFields, ['favorite_label', 'favorite']) ||
        (averageA > averageB
          ? `${fighterAText} ${tr('faworyt', 'favorite')}`
          : `${fighterBText} ${tr('faworyt', 'favorite')}`)
  // Position stamp at ~3/4 of winner panel width, not the whole row.
  const favoriteLeft = favoriteSide === 'a' ? '37.5%' : favoriteSide === 'b' ? '87.5%' : '50%'
  const favoriteRotation = favoriteSide === 'a' ? -12 : favoriteSide === 'b' ? 12 : 0

  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <h2 className="text-center text-[38px] uppercase leading-none tracking-[0.04em] text-slate-50 sm:text-[52px]" style={{ fontFamily: 'var(--font-display)' }}>
        {headerText}
      </h2>
      <p className="mt-1 text-center text-[12px] uppercase tracking-[0.16em] text-slate-300">{subText}</p>

      <div className="mt-3 grid flex-1 grid-cols-[1fr_1.3fr_1fr] gap-3">
        <div className="min-h-0 rounded-xl border border-slate-500/45 bg-black/26 p-2">
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
                  <p className="text-[12px] uppercase tracking-[0.15em]" style={{ color: fighterA.color }}>{row.label}</p>
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

        <div className="rounded-xl border border-slate-500/50 bg-black/26 p-2 select-none">
          <div className="h-[78%] pointer-events-none select-none">
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
                  <div
                    key={`draw-${row.id}`}
                    className="rounded border border-slate-500/75 bg-slate-900/75 px-2 py-2"
                  >
                    <p className="text-[11px] uppercase tracking-[0.15em] text-slate-300">{row.label}</p>
                    <p className="mt-1 text-[14px] leading-tight text-slate-100">
                      {row.a} = {row.b}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-[12px] text-slate-400">{tr('Brak remisów w bieżącym układzie.', 'No draws in current setup.')}</p>
            )}
          </div>
        </div>

        <div className="min-h-0 rounded-xl border border-slate-500/45 bg-black/26 p-2">
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
                  <p className="text-[12px] uppercase tracking-[0.15em]" style={{ color: fighterB.color }}>{row.label}</p>
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
        <div className="rounded-lg border px-4 py-3 text-center" style={{ borderColor: `${fighterA.color}88`, backgroundColor: `${fighterA.color}20` }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-slate-200">{fighterAText}</p>
          <p className="text-[42px] font-semibold leading-none" style={{ color: fighterA.color }}>
            {Math.round(averageA)}
          </p>
        </div>
        <div className="rounded-lg border px-4 py-3 text-center" style={{ borderColor: `${fighterB.color}88`, backgroundColor: `${fighterB.color}20` }}>
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
  )
}

export function TacticalBoardTemplate({
  rows,
  fighterA,
  fighterB,
  title,
  subtitle,
  templateBlocks,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const boardHeader = pickTemplateField(blockFields, ['left_header', 'categories_header']) || tr('Kategorie', 'Categories')
  const realityHeader = pickTemplateField(blockFields, ['right_header', 'reality_header']) || tr('Rzeczywistość walki', 'Combat reality')
  const linearLabel = pickTemplateField(blockFields, ['linear_label']) || tr('ODCINEK LINIOWY', 'LINEAR SEGMENT')
  const chaosLabel = pickTemplateField(blockFields, ['chaos_label']) || tr('ODCINEK CHAOSU', 'CHAOS SEGMENT')
  const tiles = rows.slice(0, 9)
  const splitX = 50
  const linearStartX = 8
  const chaosEndX = 92
  const stablePoints = `${linearStartX},50 ${splitX},50`
  const linearLabelX = 25
  const chaosLabelX = 75

  return (
    <div className="relative z-10 flex h-full min-h-0 flex-col gap-3 text-slate-100">
      <div className="border-b border-slate-300/25 pb-2">
        <h2 className="text-3xl uppercase tracking-[0.06em] text-slate-50" style={{ fontFamily: 'var(--font-display)' }}>
          {headerText}
        </h2>
        <p className="text-sm uppercase tracking-[0.16em] text-slate-300">{subText}</p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        <div className="flex min-h-0 flex-col rounded-xl border border-slate-400/35 bg-black/25 p-3">
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-slate-300">{boardHeader}</p>
          <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
            {tiles.map((row, index) => {
              const Icon = iconForCategory(row.id, index)
              const isDraw = row.winner === 'draw'
              const winnerColor = isDraw ? '#E2E8F0' : row.winner === 'a' ? fighterA.color : fighterB.color
              return (
                <div key={`tile-${row.id}`} className="relative rounded-lg border border-slate-500/45 bg-slate-900/75 p-2">
                  <div className="mb-2 flex items-center justify-center rounded-md border border-slate-600/60 bg-black/35 py-2">
                    <Icon size={31} color={winnerColor} />
                  </div>
                  <div className="flex min-h-[56px] items-center justify-center rounded-md border border-slate-600/45 bg-black/25 px-1">
                    <p className="text-center text-[18px] font-semibold uppercase leading-tight tracking-[0.04em]" style={{ color: winnerColor }}>
                      {row.label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex min-h-0 flex-col rounded-xl border border-slate-400/35 bg-black/25 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">{realityHeader}</p>
          <div className="mt-2 min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-600/55 bg-slate-950/65 p-2">
            <div className="relative -m-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] overflow-hidden rounded-lg">
              <LightningCanvas
                startRatio={{ x: splitX / 100, y: 0.5 }}
                endRatio={{ x: Math.min(1.34, chaosEndX / 100 + 0.42), y: 0.5 }}
              />
              <svg viewBox="0 0 100 100" className="relative z-10 h-full w-full">
                <line
                  x1={splitX}
                  y1="8"
                  x2={splitX}
                  y2="92"
                  stroke="rgba(148,163,184,0.35)"
                  strokeWidth="0.7"
                  strokeDasharray="2 2"
                />
                <text x={linearLabelX} y="14" fill="#67e8f9" fontSize="4" letterSpacing="0.8" textAnchor="middle">
                  {linearLabel}
                </text>
                <text x={chaosLabelX} y="14" fill="#fda4af" fontSize="4" letterSpacing="0.8" textAnchor="middle">
                  {chaosLabel}
                </text>

                <polyline points={stablePoints} fill="none" stroke="#22d3ee" strokeWidth="1.7" />
                <polyline points={stablePoints} fill="none" stroke="rgba(34,211,238,0.3)" strokeWidth="3.2" />
              </svg>
            </div>
          </div>
        </div>
      </div>


    </div>
  )
}

export function MethodologyTemplate({ rows, title, subtitle, templateBlocks, language }: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES.methodology || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const listLabel = pickTemplateField(blockFields, ['list_label']) || tr('Lista metod', 'Method list')
  const realityLabel = pickTemplateField(blockFields, ['reality_label']) || tr('Rzeczywistość walki', 'Combat reality')
  const linearLabel = pickTemplateField(blockFields, ['linear_label']) || tr('ODCINEK LINIOWY', 'LINEAR SEGMENT')
  const chaosLabel = pickTemplateField(blockFields, ['chaos_label']) || tr('ODCINEK CHAOSU', 'CHAOS SEGMENT')
  const closingLabel = pickTemplateField(blockFields, ['closing_label']) || tr('Statystyki są liniowe. Walka nie jest.', 'Stats are linear. Fight is not.')
  const safeRows = rows.length
    ? rows
    : [{ id: 'fallback', label: tr('Bazowy', 'Baseline'), a: 50, b: 50, delta: 0, winner: 'draw' as const }]

  const splitX = 50
  const linearStartX = 8
  const chaosEndX = 92
  const stablePoints = `${linearStartX},50 ${splitX},50`
  const linearLabelX = 25
  const chaosLabelX = 75

  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <div className="border-b border-slate-400/25 pb-2">
        <h2 className="text-3xl uppercase tracking-[0.08em] text-slate-50">{headerText}</h2>
        <p className="text-base text-slate-300">{subText}</p>
      </div>

      <div className="mt-3 grid flex-1 grid-cols-[1fr_1.7fr] gap-3">
        <div className="min-h-0 rounded-xl border border-slate-300/30 bg-black/28 p-3">
          <p className="mb-2 text-[12px] uppercase tracking-[0.18em] text-slate-300">{listLabel}</p>
          <div className="max-h-full space-y-1 overflow-y-auto pr-1 text-[clamp(0.9rem,1.05vw,1.22rem)] leading-tight text-slate-100">
            {safeRows.map((row, index) => (
              <div key={`method-${row.id}`} className="rounded border border-slate-700/60 bg-slate-900/72 px-2 py-0.5">
                {index + 1}. {row.label}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-rows-[1fr_auto] gap-3">
          <div className="rounded-xl border border-slate-300/30 bg-black/28 p-3">
            <p className="text-[12px] uppercase tracking-[0.18em] text-slate-300">{realityLabel}</p>
            <div className="mt-2 h-[72%] overflow-hidden rounded-lg border border-slate-600/55 bg-slate-950/65 p-2">
              <div className="relative -m-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] overflow-hidden rounded-lg">
              <LightningCanvas
                startRatio={{ x: splitX / 100, y: 0.5 }}
                endRatio={{ x: Math.min(1.34, chaosEndX / 100 + 0.42), y: 0.5 }}
              />
                <svg viewBox="0 0 100 100" className="relative z-10 h-full w-full">
                  <line
                    x1={splitX}
                    y1="8"
                    x2={splitX}
                    y2="92"
                    stroke="rgba(148,163,184,0.35)"
                    strokeWidth="0.7"
                    strokeDasharray="2 2"
                  />
                  <text x={linearLabelX} y="14" fill="#67e8f9" fontSize="4" letterSpacing="0.8" textAnchor="middle">
                    {linearLabel}
                  </text>
                  <text x={chaosLabelX} y="14" fill="#fda4af" fontSize="4" letterSpacing="0.8" textAnchor="middle">
                    {chaosLabel}
                  </text>

                  <polyline points={stablePoints} fill="none" stroke="#22d3ee" strokeWidth="1.7" />
                  <polyline points={stablePoints} fill="none" stroke="rgba(34,211,238,0.3)" strokeWidth="3.2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-300/45 bg-slate-900/85 px-4 py-3">
            <p className="text-[42px] leading-tight text-slate-50">{closingLabel}</p>
            <p className="mt-1 text-sm uppercase tracking-[0.15em] text-slate-300">{subText}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
