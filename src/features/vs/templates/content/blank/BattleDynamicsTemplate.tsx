import { buildFightTemplateChrome, getFightCommonCopy } from '../../../fightManifest'
import { buildCurvePolyline, findTemplateBlockLines, getPlainTemplateLines, parseCurveValues, parseTemplateFieldMap, pickTemplateField, TEMPLATE_BLOCK_ALIASES } from '../../../importer'
import { pickLang } from '../../../presets'
import type { TemplatePreviewProps } from '../../../types'
import {
  HIGH_END_BODY_GAP_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HighEndTemplateHeader,
} from '../../shared/highEnd'

export function BattleDynamicsTemplate({
  fighterA,
  fighterB,
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const common = getFightCommonCopy(language)
  const fighterAName = fighterA.name || tr('Postać A', 'Fighter A')
  const fighterBName = fighterB.name || tr('Postać B', 'Fighter B')
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['battle-dynamics'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome(language, blockFields)
  const line = (position: number, keys: string[], fallback = '') =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle
  const phase1 = line(
    0,
    ['phase_1', 'phase1'],
    tr(`${fighterAName} narzuca tempo dzięki szybkości.`, `${fighterAName} sets the pace with speed.`),
  )
  const phase2 = line(
    1,
    ['phase_2', 'phase2'],
    tr(
      `${fighterBName} przyjmuje obrażenia i skraca dystans.`,
      `${fighterBName} absorbs damage and closes distance.`,
    ),
  )
  const phase3 = line(
    2,
    ['phase_3', 'phase3'],
    tr(`${fighterBName} zyskuje przewagę kondycyjną w końcówce.`, `${fighterBName} gains late stamina advantage.`),
  )
  const analysisLine =
    pickTemplateField(blockFields, ['analysis', 'note', 'line_4', 'line4']) ||
    tr(
      `Analiza: ${fighterAName} wygrywa sprint. ${fighterBName} wygrywa maraton.`,
      `Analysis: ${fighterAName} wins the sprint. ${fighterBName} wins the marathon.`,
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
          <HighEndTemplateHeader
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />

          <div className={`relative ${HIGH_END_BODY_GAP_CLASS} min-h-0 rounded-md border border-cyan-300/30 bg-slate-950/65 p-2`}>
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
                {common.startLabel}
              </text>
              <text x="45" y="47.8" fontSize="2.5" fill="#e2e8f0" fontWeight="700">
                {common.fightTimeLabel}
              </text>
              <text x="90.8" y="47.8" fontSize="2.5" fill="#e2e8f0" fontWeight="700">
                {common.endLabel}
              </text>

              <text x="3" y="30" fontSize="2.7" fill="#e2e8f0" fontWeight="700" transform="rotate(-90 3 30)">
                {common.advantageStaminaLabel}
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
                <p className="font-semibold">{common.phase1Label}</p>
                <p>{phase1}</p>
              </div>
              <div className="rounded-sm border-[3px] border-[#64748b] bg-[#111827]/95 p-2 text-[16px] leading-tight text-slate-100 shadow-[4px_4px_0_rgba(71,85,105,0.45)]">
                <p className="font-semibold">{common.phase2Label}</p>
                <p>{phase2}</p>
              </div>
              <div className="rounded-sm border-[3px] border-[#f43f5e] bg-[#2b101b]/95 p-2 text-[16px] leading-tight text-slate-100 shadow-[4px_4px_0_rgba(244,63,94,0.45)]">
                <p className="font-semibold">{common.phase3Label}</p>
                <p>{phase3}</p>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-md border border-cyan-300/35 bg-slate-900/78 px-3 py-1 text-center text-[20px] font-semibold text-slate-100">
            {analysisLine}
          </div>
        </div>
      </div>
    </div>
  )
}
