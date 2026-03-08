import { LightningCanvas } from '../../components/LightningCanvas'
import { iconForCategory } from '../../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import { pickLang } from '../../presets'
import type { TemplatePreviewProps } from '../../types'
import {
  HIGH_END_FRAME_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_HEADER_CLASS,
  HIGH_END_LABEL_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HIGH_END_SUBTEXT_CLASS,
} from '../shared/highEnd'

const MATCHUP_SEPARATOR_RE = /^(.*?)(?:\s*\/\/\s*|\s+\|\s+|\s+-\s+)(.+\b(?:vs\.?|versus|kontra|v)\b.+)$/i

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
  const realityHeader = pickTemplateField(blockFields, ['right_header', 'reality_header']) || tr('Rzeczywistosc walki', 'Combat reality')
  const linearLabel = pickTemplateField(blockFields, ['linear_label']) || tr('ODCINEK LINIOWY', 'LINEAR SEGMENT')
  const chaosLabel = pickTemplateField(blockFields, ['chaos_label']) || tr('ODCINEK CHAOSU', 'CHAOS SEGMENT')
  const leftTopLabel = tr('Stopien zagrozenia', 'Threat level')
  const threatLevel = tr('ekstremalny', 'extreme')
  const leftBottomLabel = tr('Integralnosc danych', 'Data integrity')
  const integrity = '99.6%'
  const rightTopLabel = 'VersusVerseVault'
  const profileMode = '/assets/VS2.png'
  const rightBottomLabel = tr('Sygnatura marki', 'Brand mark')
  const scale = 'VersusVerseVault badge'
  const fallbackMatchup = `${fighterA.name || 'Fighter A'} VS ${fighterB.name || 'Fighter B'}`
  const parsedHeader = headerText.trim().match(MATCHUP_SEPARATOR_RE)
  const mainHeaderText = parsedHeader?.[1]?.trim() || headerText
  const matchupText = pickTemplateField(blockFields, ['matchup', 'fighters', 'fight']) || parsedHeader?.[2]?.trim() || ''
  const tiles = rows.slice(0, 9)
  const splitX = 50
  const linearStartX = 8
  const chaosEndX = 92
  const stablePoints = `${linearStartX},50 ${splitX},50`
  const linearLabelX = 25
  const chaosLabelX = 75

  return (
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full min-h-0 flex-col gap-3">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 border-b border-cyan-300/25 pb-3 text-[11px] text-slate-300">
            <div className="min-w-[238px] space-y-1 pt-2 text-left">
              <p className="whitespace-nowrap uppercase tracking-[0.16em]">{leftTopLabel}: {threatLevel}</p>
              <p className="whitespace-nowrap uppercase tracking-[0.16em]">{leftBottomLabel}: {integrity}</p>
            </div>
            <div className="text-center">
              <h2 className={HIGH_END_HEADER_CLASS} style={{ fontFamily: 'var(--font-display)' }}>
                {mainHeaderText}
              </h2>
              {matchupText ? (
                <p
                  className="mt-1 text-center text-[18px] uppercase tracking-[0.18em] text-cyan-100"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {matchupText}
                </p>
              ) : headerText === fallbackMatchup ? (
                <p
                  className="mt-1 text-center text-[18px] uppercase tracking-[0.18em] text-cyan-100"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {fallbackMatchup}
                </p>
              ) : null}
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

          <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
            <div className={`flex min-h-0 flex-col ${HIGH_END_FRAME_CLASS} p-3`}>
              <p className={`mb-2 ${HIGH_END_LABEL_CLASS}`}>{boardHeader}</p>
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

            <div className={`flex min-h-0 flex-col ${HIGH_END_FRAME_CLASS} p-3`}>
              <p className={HIGH_END_LABEL_CLASS}>{realityHeader}</p>
              <div className="mt-2 min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-600/55 bg-slate-950/65 p-2">
                <div className="relative -m-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] overflow-hidden rounded-lg">
                  <LightningCanvas
                    startRatio={{ x: splitX / 100, y: 0.5 }}
                    endRatio={{ x: Math.min(1.34, chaosEndX / 100 + 0.42), y: 0.5 }}
                  />
                  <svg viewBox="0 0 100 100" className="relative z-10 h-full w-full">
                    <line x1={splitX} y1="8" x2={splitX} y2="92" stroke="rgba(148,163,184,0.35)" strokeWidth="0.7" strokeDasharray="2 2" />
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
      </div>
    </div>
  )
}

