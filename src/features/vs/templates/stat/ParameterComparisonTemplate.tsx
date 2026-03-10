import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { buildFightTemplateChrome, getFightCommonCopy, getFightTemplateDefaultField } from '../../fightManifest'
import { AVERAGE_DRAW_THRESHOLD } from '../../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { TemplatePreviewProps } from '../../types'
import {
  HIGH_END_BODY_GAP_CLASS,
  HIGH_END_CARD_CLASS,
  HIGH_END_FRAME_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HighEndTemplateHeader,
} from '../shared/highEnd'

export function ParameterComparisonTemplate({
  rows,
  fighterA,
  fighterB,
  averageA,
  averageB,
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['parameter-comparison'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const chrome = buildFightTemplateChrome(language, blockFields)
  const common = getFightCommonCopy(language)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const customLeftHeader = pickTemplateField(blockFields, ['left_header'])
  const customRightHeader = pickTemplateField(blockFields, ['right_header'])
  const leftHeader = customLeftHeader || getFightTemplateDefaultField('parameter-comparison', 'left_header', language)
  const rightHeader = customRightHeader || getFightTemplateDefaultField('parameter-comparison', 'right_header', language)
  const drawHeader =
    pickTemplateField(blockFields, ['draw_header']) ||
    getFightTemplateDefaultField('parameter-comparison', 'draw_header', language) ||
    common.drawZonesLabel
  const leftAdvantages = rows.filter((row) => row.winner === 'a')
  const rightAdvantages = rows.filter((row) => row.winner === 'b')
  const drawRows = rows.filter((row) => row.winner === 'draw')
  const fighterAText = fighterA.name || 'Fighter A'
  const fighterBText = fighterB.name || 'Fighter B'
  const averageGap = Math.abs(averageA - averageB)
  const isAverageDraw = averageGap < AVERAGE_DRAW_THRESHOLD
  const favoriteSide: 'a' | 'b' | 'draw' = isAverageDraw ? 'draw' : averageA > averageB ? 'a' : 'b'
  const favoriteDrawLabel =
    pickTemplateField(blockFields, ['draw_favorite', 'draw_favorite_label', 'favorite_draw']) ||
    getFightTemplateDefaultField('parameter-comparison', 'draw_favorite', language) ||
    common.drawLabel
  const favorite =
    isAverageDraw
      ? favoriteDrawLabel
      : pickTemplateField(blockFields, ['favorite_label', 'favorite']) ||
        (averageA > averageB ? `${fighterAText} ${common.favoriteSuffix}` : `${fighterBText} ${common.favoriteSuffix}`)
  const favoriteLeft = favoriteSide === 'a' ? '37.5%' : favoriteSide === 'b' ? '87.5%' : '50%'
  const favoriteRotation = favoriteSide === 'a' ? -12 : favoriteSide === 'b' ? 12 : 0

  return (
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full flex-col">
          <HighEndTemplateHeader
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />

          <div className={`${HIGH_END_BODY_GAP_CLASS} grid flex-1 grid-cols-[1fr_1.3fr_1fr] gap-3`}>
            <div className={`${HIGH_END_FRAME_CLASS} min-h-0 p-2`}>
              <p className="text-[12px] uppercase tracking-[0.16em]" style={{ color: fighterA.color }}>
                {customLeftHeader ? leftHeader : `${leftHeader} // ${fighterAText}`}
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
                    {common.noLeftCategoryEdge}
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
                  <p className="mt-1 text-[12px] text-slate-400">{common.noDrawsCurrentSetup}</p>
                )}
              </div>
            </div>

            <div className={`${HIGH_END_FRAME_CLASS} min-h-0 p-2`}>
              <p className="text-[12px] uppercase tracking-[0.16em]" style={{ color: fighterB.color }}>
                {customRightHeader ? rightHeader : `${rightHeader} // ${fighterBText}`}
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
                    {common.noRightCategoryEdge}
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
