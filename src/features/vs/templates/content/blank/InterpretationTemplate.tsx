import { AVERAGE_DRAW_THRESHOLD } from '../../../helpers'
import { pickTemplateField } from '../../../importer'
import type { BlankTemplateVariantProps } from './context'

export function InterpretationTemplate({
  fighterA,
  fighterB,
  averageA,
  averageB,
  rows,
  context,
}: BlankTemplateVariantProps) {
  const { tr, headerText, subText, blockFields, line } = context
  const averageGap = Math.abs(averageA - averageB)
  const isAverageDraw = averageGap < AVERAGE_DRAW_THRESHOLD
  const leaderSide: 'a' | 'b' = averageA >= averageB ? 'a' : 'b'
  const leaderName = leaderSide === 'a' ? fighterA.name || 'Fighter A' : fighterB.name || 'Fighter B'
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
        { label: 'TEMPO CONTROL', delta: 0.8 },
        { label: 'RESOURCE ECONOMY', delta: 0.7 },
        { label: 'FINISH WINDOWS', delta: 0.6 },
      ]
    : [
        { label: 'POWER WINDOW', delta: 4 },
        { label: 'PACE CONTROL', delta: 3 },
        { label: 'COMBAT IQ', delta: 2 },
      ]
  const bars = edgeRows.length ? edgeRows : fallbackEdges
  const maxDelta = bars.length ? Math.max(...bars.map((bar) => bar.delta), 1) : 1
  const formatDelta = (value: number) => (Number.isInteger(value) ? `${value}` : value.toFixed(1))
  const barGradient = isAverageDraw
    ? 'linear-gradient(90deg,#334155,#94a3b8)'
    : leaderSide === 'a'
      ? 'linear-gradient(90deg,#0b69ad,#1377b9)'
      : 'linear-gradient(90deg,#8b1e1e,#dc2626)'

  const bullet1 = line(
    0,
    ['line_1', 'line1', 'thesis'],
    isAverageDraw
      ? tr(
          'Srednie sa w progu remisu (<1 punkt), wiec bazowy odczyt to remis.',
          'Averages are inside the draw threshold (<1 point), so baseline reads as a draw.',
        )
      : tr(
          `${leaderName} ma mierzalna przewage w modelu liniowym.`,
          `${leaderName} has a measurable edge in the linear model.`,
        ),
  )
  const bullet2 = line(
    1,
    ['line_2', 'line2', 'antithesis'],
    isAverageDraw
      ? tr(
          'Brak stabilnego faworyta na papierze. O wyniku decyduja warunki i wykonanie.',
          'There is no stable paper favorite. Conditions and execution decide the winner.',
        )
      : tr(
          'Mimo przewagi statystycznej, kontrmechaniki moga odwracac pojedyncze scenariusze.',
          'Even with a stat edge, counter-mechanics can flip individual scenarios.',
        ),
  )
  const bullet3 = line(
    2,
    ['line_3', 'line3', 'conclusion'],
    isAverageDraw
      ? tr(
          'Finalny werdykt musi wynikac z matrycy warunkow, nie tylko z tabeli statystyk.',
          'Final verdict must come from condition matrix, not from stats table alone.',
        )
      : tr(
          `Bazowo ${leaderName} prowadzi, ale tylko przy utrzymaniu wlasnych warunkow walki.`,
          `Baseline favors ${leaderName}, but only while maintaining preferred fight conditions.`,
        ),
  )
  const closingQuote =
    pickTemplateField(blockFields, ['quote', 'line_4', 'line4']) ||
    (isAverageDraw
      ? tr(
          'Prawie rowne statystyki przenosza decyzje z liczb na warunki walki.',
          'Near-equal stats move decisions from numbers to fight conditions.',
        )
      : tr(
          'Statystyki daja kierunek, ale warunki walki decyduja o wyniku.',
          'Stats set direction, but fight conditions decide outcome.',
        ))

  const badgeSymbol = isAverageDraw ? '=' : 'V'

  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <div className="relative mt-1 min-h-0 flex-1 rounded-xl border border-cyan-300/35 bg-[linear-gradient(180deg,#06172a_0%,#0a2036_52%,#061325_100%)] p-3">
        <h2 className="text-center text-[52px] uppercase leading-none tracking-[0.02em] text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
          {headerText}
        </h2>
        {subText ? <p className="mt-1 text-center text-[12px] uppercase tracking-[0.16em] text-slate-300">{subText}</p> : null}

        <div className="relative mt-2 rounded-md border border-cyan-300/25 bg-slate-950/70 p-2">
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

            <div className="max-h-[286px] space-y-2 overflow-y-auto py-2 pr-1">
              {bars.map((bar, index) => {
                const width = 26 + (bar.delta / Math.max(maxDelta, 1)) * 50
                return (
                  <div key={`interp-bar-${index}-${bar.label}`} className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <div className="h-8 overflow-hidden rounded-sm border border-slate-500/70 bg-slate-900/85">
                      <div className="h-full" style={{ width: `${width}%`, background: barGradient }} />
                    </div>
                    <p className="text-[20px] font-semibold uppercase leading-none text-slate-100">
                      {isAverageDraw ? `${bar.label} (d${formatDelta(bar.delta)})` : `${bar.label} (+${formatDelta(bar.delta)})`}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-2 rounded-md border border-slate-500/70 bg-slate-900/82 px-4 py-3">
          <ul className="list-disc space-y-1 pl-6 text-[20px] leading-tight text-slate-100">
            <li>{bullet1}</li>
            <li>{bullet2}</li>
            <li>{bullet3}</li>
          </ul>
        </div>

        <div className="mt-2 rounded-md border border-cyan-300/35 bg-slate-900/82 px-3 py-2 text-center text-[18px] italic text-slate-100">
          "{closingQuote}"
        </div>
      </div>
    </div>
  )
}
