import { buildFightTemplateChrome } from '../../../fightManifest'
import { AVERAGE_DRAW_THRESHOLD } from '../../../helpers'
import { pickLang } from '../../../presets'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import {
  HIGH_END_BODY_GAP_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HighEndTemplateHeader,
} from '../../shared/highEnd'

const INTERPRETATION_BAR_MAX_DELTA = 40
const INTERPRETATION_BAR_MIN_FILL = 18
const INTERPRETATION_BAR_FILL_RANGE = 62

export function InterpretationTemplate({
  fighterA,
  fighterB,
  averageA,
  averageB,
  rows,
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES.interpretation || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome(language, blockFields)
  const line = (position: number, keys: string[], fallback = '') =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const averageGap = Math.abs(averageA - averageB)
  const isAverageDraw = averageGap < AVERAGE_DRAW_THRESHOLD
  const leaderSide: 'a' | 'b' = averageA >= averageB ? 'a' : 'b'
  const leaderName = leaderSide === 'a' ? fighterA.name || tr('Postać A', 'Fighter A') : fighterB.name || tr('Postać B', 'Fighter B')
  const cardTitleText = isAverageDraw ? tr('REMIS', 'DRAW') : leaderName
  const leaderColor = isAverageDraw ? '#94a3b8' : leaderSide === 'a' ? '#0b69ad' : '#b91c1c'

  const edgeRows = [...rows]
    .map((row) => {
      const delta = isAverageDraw ? Math.abs(row.a - row.b) : leaderSide === 'a' ? row.a - row.b : row.b - row.a
      return { label: row.label.toUpperCase(), delta }
    })
    .filter((row) => row.delta > 0)
    .sort((left, right) => right.delta - left.delta)
    .slice(0, 5)

  const fallbackEdges = isAverageDraw
    ? [
        { label: tr('KONTROLA TEMPA', 'TEMPO CONTROL'), delta: 0.8 },
        { label: tr('EKONOMIA ZASOBÓW', 'RESOURCE ECONOMY'), delta: 0.7 },
        { label: tr('OKNA FINISZU', 'FINISH WINDOWS'), delta: 0.6 },
      ]
    : [
        { label: tr('OKNO MOCY', 'POWER WINDOW'), delta: 4 },
        { label: tr('KONTROLA TEMPA', 'PACE CONTROL'), delta: 3 },
        { label: tr('IQ BOJOWE', 'COMBAT IQ'), delta: 2 },
      ]
  const bars = edgeRows.length ? edgeRows : fallbackEdges
  const formatDelta = (value: number) => (Number.isInteger(value) ? `${value}` : value.toFixed(1))
  const barGradient = isAverageDraw
    ? 'linear-gradient(90deg,#334155,#94a3b8)'
    : leaderSide === 'a'
      ? 'linear-gradient(90deg,#0b69ad,#1377b9)'
      : 'linear-gradient(90deg,#8b1e1e,#dc2626)'
  const labelColumnWidth = '19rem'

  const bullet1 = line(
    0,
    ['line_1', 'line1', 'thesis'],
    isAverageDraw
      ? tr(
          'Średnie mieszczą się w progu remisu (<1 punkt), więc bazowy odczyt wskazuje remis.',
          'Averages are inside the draw threshold (<1 point), so baseline reads as a draw.',
        )
      : tr(
          `${leaderName} ma mierzalną przewagę w modelu liniowym.`,
          `${leaderName} has a measurable edge in the linear model.`,
        ),
  )
  const bullet2 = line(
    1,
    ['line_2', 'line2', 'antithesis'],
    isAverageDraw
      ? tr(
          'Nie ma stabilnego papierowego faworyta. O wyniku decydują warunki i wykonanie.',
          'There is no stable paper favorite. Conditions and execution decide the winner.',
        )
      : tr(
          'Nawet przy przewadze statystyk kontrmechaniki mogą odwracać poszczególne scenariusze.',
          'Even with a stat edge, counter-mechanics can flip individual scenarios.',
        ),
  )
  const bullet3 = line(
    2,
    ['line_3', 'line3', 'conclusion'],
    isAverageDraw
      ? tr(
          'Końcowy werdykt musi wynikać z matrycy warunków, a nie z samej tabeli statystyk.',
          'Final verdict must come from condition matrix, not from stats table alone.',
        )
      : tr(
          `Bazowy odczyt faworyzuje ${leaderName}, ale tylko przy utrzymaniu preferowanych warunków walki.`,
          `Baseline favors ${leaderName}, but only while maintaining preferred fight conditions.`,
        ),
  )
  const closingQuote =
    pickTemplateField(blockFields, ['quote', 'line_4', 'line4']) ||
    (isAverageDraw
      ? tr(
          'Przy niemal równych statystykach decyzja przechodzi z liczb na warunki walki.',
          'Near-equal stats move decisions from numbers to fight conditions.',
        )
      : tr(
          'Statystyki wyznaczają kierunek, ale wynik ustalają warunki walki.',
          'Stats set direction, but fight conditions decide outcome.',
        ))

  const badgeSymbol = isAverageDraw ? '=' : 'V'

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

          <div className={`relative ${HIGH_END_BODY_GAP_CLASS} rounded-md border border-cyan-300/25 bg-slate-950/70 p-2`}>
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(125,211,252,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(125,211,252,0.18)_1px,transparent_1px)] [background-size:12%_33%]" />
            <div className="relative z-10 grid grid-cols-[0.9fr_1.7fr] gap-2">
              <div className="flex min-h-[185px] items-center justify-center rounded-md border-2 p-3" style={{ borderColor: leaderColor, backgroundColor: `${leaderColor}1A` }}>
                <div className="w-full rounded-md border border-slate-500/70 bg-[linear-gradient(135deg,rgba(2,132,199,0.28),rgba(15,23,42,0.5))] p-2 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border-2 text-3xl font-bold" style={{ borderColor: leaderColor, color: leaderColor }}>
                    {badgeSymbol}
                  </div>
                  <p className="mt-3 text-[52px] uppercase leading-none" style={{ color: leaderColor, fontFamily: 'var(--font-display)' }}>
                    {cardTitleText}
                  </p>
                </div>
              </div>

              <div className="space-y-2 py-2 pr-1">
                {bars.map((bar, index) => {
                  const normalizedDelta = Math.min(bar.delta, INTERPRETATION_BAR_MAX_DELTA) / INTERPRETATION_BAR_MAX_DELTA
                  const fillWidth = INTERPRETATION_BAR_MIN_FILL + normalizedDelta * INTERPRETATION_BAR_FILL_RANGE
                  return (
                    <div
                      key={`interp-bar-${index}-${bar.label}`}
                      className="grid items-center gap-2"
                      style={{ gridTemplateColumns: `minmax(0,1fr) ${labelColumnWidth}` }}
                    >
                      <div className="h-8 overflow-hidden rounded-sm border border-slate-500/70 bg-slate-900/85">
                        <div className="h-full" style={{ width: `${fillWidth}%`, background: barGradient }} />
                      </div>
                      <p className="whitespace-nowrap text-[20px] font-semibold uppercase leading-none text-slate-100">
                        {isAverageDraw ? `${bar.label} (d${formatDelta(bar.delta)})` : `${bar.label} (+${formatDelta(bar.delta)})`}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-md border border-slate-500/70 bg-slate-900/82 px-4 py-3">
            <ul className="list-disc space-y-1 pl-6 text-[20px] leading-tight text-slate-100">
              <li>{bullet1}</li>
              <li>{bullet2}</li>
              <li>{bullet3}</li>
            </ul>
          </div>

          <div className="mt-3 rounded-md border border-cyan-300/35 bg-slate-900/82 px-3 py-2 text-center text-[18px] italic text-slate-100">
            "{closingQuote}"
          </div>
        </div>
      </div>
    </div>
  )
}
