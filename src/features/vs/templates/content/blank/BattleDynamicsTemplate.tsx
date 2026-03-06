import { pickLang } from '../../../presets'
import { TEMPLATE_BLOCK_ALIASES, buildCurvePolyline, findTemplateBlockLines, getPlainTemplateLines, parseCurveValues, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import {
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_HEADER_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HIGH_END_SUBTEXT_CLASS,
} from '../../shared/highEnd'

export function BattleDynamicsTemplate({
  fighterA,
  fighterB,
  title,
  subtitle,
  templateBlocks,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['battle-dynamics'] || [])
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
  const phase1 = line(
    0,
    ['phase_1', 'phase1'],
    tr(`${fighterA.name || 'Fighter A'} sets the pace with speed.`, `${fighterA.name || 'Fighter A'} sets the pace with speed.`),
  )
  const phase2 = line(
    1,
    ['phase_2', 'phase2'],
    tr(
      `${fighterB.name || 'Fighter B'} absorbs damage and closes distance.`,
      `${fighterB.name || 'Fighter B'} absorbs damage and closes distance.`,
    ),
  )
  const phase3 = line(
    2,
    ['phase_3', 'phase3'],
    tr(`${fighterB.name || 'Fighter B'} gains late stamina advantage.`, `${fighterB.name || 'Fighter B'} gains late stamina advantage.`),
  )
  const analysisLine =
    pickTemplateField(blockFields, ['analysis', 'note', 'line_4', 'line4']) ||
    tr(
      `Analysis: ${fighterA.name || 'Fighter A'} wins the sprint. ${fighterB.name || 'Fighter B'} wins the marathon.`,
      `Analysis: ${fighterA.name || 'Fighter A'} wins the sprint. ${fighterB.name || 'Fighter B'} wins the marathon.`,
    )
  const curveAValues = parseCurveValues(
    pickTemplateField(blockFields, ['a_curve', 'curve_a', 'blue_curve', 'left_curve']),
    [78, 64, 50, 32, 20],
  )
  const curveBValues = parseCurveValues(
    pickTemplateField(blockFields, ['b_curve', 'curve_b', 'red_curve', 'right_curve']),
    [35, 35, 35, 35, 35],
  )
  const yellowWaveValues = parseCurveValues(
    pickTemplateField(blockFields, ['yellow_wave', 'wave', 'chaos_wave']),
    [34, 36, 33, 35, 34, 36, 33, 35],
  )
  const curveA = buildCurvePolyline(curveAValues, 5, 96, 8, 41)
  const curveB = buildCurvePolyline(curveBValues, 5, 96, 8, 41)
  const yellowWave = buildCurvePolyline(yellowWaveValues, 5, 96, 8, 41)

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

          <div className="relative mt-2 min-h-0 rounded-md border border-cyan-300/30 bg-slate-950/65 p-2">
            <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(125,211,252,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(125,211,252,0.18)_1px,transparent_1px)] [background-size:10%_20%]" />
            <svg viewBox="0 0 100 49" className="relative z-10 h-[300px] w-full">
              <defs>
                <marker id="arrow-dark" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 z" fill="#cbd5e1" />
                </marker>
              </defs>

              {[10, 18, 26, 34].map((y) => (
                <line key={`grid-y-${y}`} x1="5" y1={y} x2="96" y2={y} stroke="rgba(125,211,252,0.35)" strokeWidth="0.12" />
              ))}
              {[14, 23, 32, 41, 50, 59, 68, 77, 86].map((x) => (
                <line key={`grid-x-${x}`} x1={x} y1="8" x2={x} y2="44" stroke="rgba(125,211,252,0.35)" strokeWidth="0.12" />
              ))}

              <line x1="5" y1="44" x2="96" y2="44" stroke="#cbd5e1" strokeWidth="0.35" markerEnd="url(#arrow-dark)" />
              <line x1="5" y1="44" x2="5" y2="5" stroke="#cbd5e1" strokeWidth="0.35" markerEnd="url(#arrow-dark)" />

              <text x="4.5" y="47.8" fontSize="2.5" fill="#e2e8f0" fontWeight="700">
                {tr('START', 'START')}
              </text>
              <text x="45" y="47.8" fontSize="2.5" fill="#e2e8f0" fontWeight="700">
                {tr('CZAS WALKI', 'FIGHT TIME')}
              </text>
              <text x="90.8" y="47.8" fontSize="2.5" fill="#e2e8f0" fontWeight="700">
                END
              </text>

              <text x="3" y="30" fontSize="2.7" fill="#e2e8f0" fontWeight="700" transform="rotate(-90 3 30)">
                {tr('PRZEWAGA / KONDYCJA', 'ADVANTAGE / STAMINA')}
              </text>

              <line x1="50.5" y1="8" x2="50.5" y2="44" stroke="#64748b" strokeWidth="0.25" strokeDasharray="1.1 0.9" />
              <polyline points={curveA.polyline} fill="none" stroke="rgba(56,189,248,0.35)" strokeWidth="2.3" />
              <polyline points={curveA.polyline} fill="none" stroke="#0ea5e9" strokeWidth="1.3" />
              <polyline points={curveB.polyline} fill="none" stroke="rgba(244,63,94,0.45)" strokeWidth="2.1" />
              <polyline points={curveB.polyline} fill="none" stroke="#c81e3a" strokeWidth="1.2" />
              <polyline points={yellowWave.polyline} fill="none" stroke="#eab308" strokeWidth="0.4" opacity="0.9" />

              {curveB.points.map((point, index) => (
                <circle key={`r-${index}-${point.x}`} cx={point.x} cy={point.y} r="0.56" fill="#ef4444" stroke="#7f1d1d" strokeWidth="0.2" />
              ))}
              {curveA.points.map((point, index) => (
                <circle key={`b-${index}-${point.x}`} cx={point.x} cy={point.y} r="0.56" fill="#0ea5e9" stroke="#0c4a6e" strokeWidth="0.2" />
              ))}
            </svg>

            <div className="relative z-10 mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-sm border-[3px] border-[#0ea5e9] bg-[#071b31]/95 p-2 text-[16px] leading-tight text-slate-100 shadow-[4px_4px_0_rgba(14,165,233,0.45)]">
                <p className="font-semibold">{tr('Faza 1: Otwarcie.', 'Phase 1: Opening.')}</p>
                <p>{phase1}</p>
              </div>
              <div className="rounded-sm border-[3px] border-[#64748b] bg-[#111827]/95 p-2 text-[16px] leading-tight text-slate-100 shadow-[4px_4px_0_rgba(71,85,105,0.45)]">
                <p className="font-semibold">{tr('Faza 2: Mid-Fight.', 'Phase 2: Mid-Fight.')}</p>
                <p>{phase2}</p>
              </div>
              <div className="rounded-sm border-[3px] border-[#f43f5e] bg-[#2b101b]/95 p-2 text-[16px] leading-tight text-slate-100 shadow-[4px_4px_0_rgba(244,63,94,0.45)]">
                <p className="font-semibold">{tr('Faza 3: Attrition.', 'Phase 3: Attrition.')}</p>
                <p>{phase3}</p>
              </div>
            </div>
          </div>

          <div className="mt-2 rounded-md border border-cyan-300/35 bg-slate-900/78 px-3 py-1 text-center text-[20px] font-semibold text-slate-100">
            {analysisLine}
          </div>
        </div>
      </div>
    </div>
  )
}

