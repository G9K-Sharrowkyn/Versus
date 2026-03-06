import { pickLang } from '../../presets'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { TemplatePreviewProps } from '../../types'
import { LightningCanvas } from '../../components/LightningCanvas'
import {
  HIGH_END_CARD_CLASS,
  HIGH_END_FRAME_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_HEADER_CLASS,
  HIGH_END_LABEL_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HIGH_END_SUBTEXT_CLASS,
} from '../shared/highEnd'

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
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full flex-col text-slate-100">
          <div className="border-b border-cyan-300/25 pb-2">
            <h2 className={HIGH_END_HEADER_CLASS} style={{ fontFamily: 'var(--font-display)' }}>{headerText}</h2>
            <p className={HIGH_END_SUBTEXT_CLASS}>{subText}</p>
          </div>

          <div className="mt-3 grid flex-1 grid-cols-[1fr_1.7fr] gap-3">
            <div className={`min-h-0 ${HIGH_END_FRAME_CLASS} p-3`}>
              <p className={`mb-2 ${HIGH_END_LABEL_CLASS}`}>{listLabel}</p>
              <div className="max-h-full space-y-1 overflow-y-auto pr-1 text-[clamp(0.9rem,1.05vw,1.22rem)] leading-tight text-slate-100">
                {safeRows.map((row, index) => (
                  <div key={`method-${row.id}`} className="rounded border border-slate-700/60 bg-slate-900/72 px-2 py-0.5">
                    {index + 1}. {row.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-rows-[1fr_auto] gap-3">
              <div className={`${HIGH_END_FRAME_CLASS} p-3`}>
                <p className={HIGH_END_LABEL_CLASS}>{realityLabel}</p>
                <div className="mt-2 h-[72%] overflow-hidden rounded-lg border border-slate-600/55 bg-slate-950/65 p-2">
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

              <div className={`${HIGH_END_CARD_CLASS} px-4 py-3`}>
                <p className="text-[42px] leading-tight text-slate-50">{closingLabel}</p>
                <p className="mt-1 text-sm uppercase tracking-[0.15em] text-slate-300">{subText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
