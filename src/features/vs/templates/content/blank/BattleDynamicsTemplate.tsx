import { buildCurvePolyline, parseCurveValues, pickTemplateField } from '../../../importer'
import type { BlankTemplateVariantProps } from './context'

export function BattleDynamicsTemplate({ fighterA, fighterB, context }: BlankTemplateVariantProps) {
  const { tr, headerText, subText, blockFields, line } = context
  const phase1 = line(
    0,
    ['phase_1', 'phase1'],
    tr(`${fighterA.name || 'Fighter A'} narzuca tempo szybko?ci?.`, `${fighterA.name || 'Fighter A'} sets the pace with speed.`),
  )
  const phase2 = line(
    1,
    ['phase_2', 'phase2'],
    tr(
      `${fighterB.name || 'Fighter B'} ignoruje obra?enia i skraca dystans.`,
      `${fighterB.name || 'Fighter B'} absorbs damage and closes distance.`,
    ),
  )
  const phase3 = line(
    2,
    ['phase_3', 'phase3'],
    tr(`${fighterB.name || 'Fighter B'} zyskuje przewag? kondycyjn?.`, `${fighterB.name || 'Fighter B'} gains late stamina advantage.`),
  )
  const analysisLine =
    pickTemplateField(blockFields, ['analysis', 'note', 'line_4', 'line4']) ||
    tr(
      `Analiza: ${fighterA.name || 'Fighter A'} wygrywa sprint. ${fighterB.name || 'Fighter B'} wygrywa maraton.`,
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
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <div className="relative mt-1 min-h-0 flex-1 rounded-xl border border-cyan-300/35 bg-[linear-gradient(180deg,#06172a_0%,#0a2036_52%,#061325_100%)] p-3">
        <h2 className="text-center text-[52px] uppercase leading-none tracking-[0.02em] text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
          {headerText}
        </h2>
        <p className="mt-1 text-center text-[12px] uppercase tracking-[0.16em] text-slate-300">{subText}</p>

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

            <text x="4.5" y="47.8" fontSize="2.5" fill="#e2e8f0" fontWeight="700">{tr('START', 'START')}</text>
            <text x="45" y="47.8" fontSize="2.5" fill="#e2e8f0" fontWeight="700">{tr('CZAS WALKI', 'FIGHT TIME')}</text>
            <text x="90.8" y="47.8" fontSize="2.5" fill="#e2e8f0" fontWeight="700">END</text>

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
  )
}
