import { AVERAGE_DRAW_THRESHOLD } from '../../../helpers'
import { pickLang } from '../../../presets'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import {
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_HEADER_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HIGH_END_SUBTEXT_CLASS,
} from '../../shared/highEnd'

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
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES.interpretation || [])
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
          'Averages are inside the draw threshold (<1 point), so baseline reads as a draw.',
          'Averages are inside the draw threshold (<1 point), so baseline reads as a draw.',
        )
      : tr(
          `${leaderName} has a measurable edge in the linear model.`,
          `${leaderName} has a measurable edge in the linear model.`,
        ),
  )
  const bullet2 = line(
    1,
    ['line_2', 'line2', 'antithesis'],
    isAverageDraw
      ? tr(
          'There is no stable paper favorite. Conditions and execution decide the winner.',
          'There is no stable paper favorite. Conditions and execution decide the winner.',
        )
      : tr(
          'Even with a stat edge, counter-mechanics can flip individual scenarios.',
          'Even with a stat edge, counter-mechanics can flip individual scenarios.',
        ),
  )
  const bullet3 = line(
    2,
    ['line_3', 'line3', 'conclusion'],
    isAverageDraw
      ? tr(
          'Final verdict must come from condition matrix, not from stats table alone.',
          'Final verdict must come from condition matrix, not from stats table alone.',
        )
      : tr(
          `Baseline favors ${leaderName}, but only while maintaining preferred fight conditions.`,
          `Baseline favors ${leaderName}, but only while maintaining preferred fight conditions.`,
        ),
  )
  const closingQuote =
    pickTemplateField(blockFields, ['quote', 'line_4', 'line4']) ||
    (isAverageDraw
      ? tr(
          'Near-equal stats move decisions from numbers to fight conditions.',
          'Near-equal stats move decisions from numbers to fight conditions.',
        )
      : tr(
          'Stats set direction, but fight conditions decide outcome.',
          'Stats set direction, but fight conditions decide outcome.',
        ))

  const badgeSymbol = isAverageDraw ? '=' : 'V'

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
    </div>
  )
}

