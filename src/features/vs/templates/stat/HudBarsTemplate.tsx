import { pickLang } from '../../presets'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { TemplatePreviewProps } from '../../types'
import {
  HIGH_END_CARD_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_HEADER_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
} from '../shared/highEnd'

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
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full flex-col">
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
              <h2 className={HIGH_END_HEADER_CLASS} style={{ fontFamily: 'var(--font-display)' }}>
                {headerText}
              </h2>
              {subText ? <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">{subText}</p> : null}
            </div>
            <div className="pt-2 text-right">
              <p className="uppercase tracking-[0.16em]">{tr('Tryb profilu', 'Profile mode')}: {profileMode}</p>
              <p className="uppercase tracking-[0.16em]">{tr('Skala', 'Scale')}: {scale}</p>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
            <div className={`${HIGH_END_CARD_CLASS} px-3 py-2`} style={{ boxShadow: `0 0 0 1px ${fighterA.color}33 inset` }}>
              <p className="uppercase tracking-[0.16em] text-slate-300">{fighterA.name}</p>
              <p className="font-semibold" style={{ color: fighterA.color }}>
                {tr('Śr.', 'Avg')} {averageA.toFixed(1)}
              </p>
            </div>
            <div className={`${HIGH_END_CARD_CLASS} px-3 py-2`} style={{ boxShadow: `0 0 0 1px ${fighterB.color}33 inset` }}>
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
                  className="grid h-[50px] grid-cols-[190px_1fr] items-center gap-4 rounded border border-cyan-300/15 bg-slate-950/55 px-2"
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
      </div>
    </div>
  )
}
