import { buildPortraitImageStyle, fighterMonogram } from '../../../helpers'
import type { BlankTemplateVariantProps } from './context'

export function SummaryTemplate({
  fighterA,
  fighterB,
  portraitAAdjust,
  portraitBAdjust,
  averageA,
  averageB,
  context,
}: BlankTemplateVariantProps) {
  const { tr, headerText, subText, line, winnerLabel } = context
  const summaryLines = [
    line(0, ['line_1', 'line1'], tr('Tempo > obrazenia na otwarciu.', 'Tempo > damage in opening.')),
    line(1, ['line_2', 'line2'], tr('Regeneracja zmienia pozna faze starcia.', 'Regeneration changes late game.')),
    line(2, ['line_3', 'line3'], tr('Zasady walki moga odwrocic werdykt.', 'Rules can flip the verdict.')),
  ]

  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <h2 className="text-center text-3xl uppercase tracking-[0.08em] text-slate-50">{headerText}</h2>
      {subText ? <p className="mt-1 text-center text-sm uppercase tracking-[0.16em] text-slate-300">{subText}</p> : null}

      <div className="mt-3 grid min-h-0 flex-1 grid-cols-[1.05fr_1.2fr_1.05fr] gap-3">
        <div className="min-h-0 rounded-xl border p-2" style={{ borderColor: `${fighterA.color}88`, backgroundColor: `${fighterA.color}10` }}>
          <div className="mb-2 rounded-md border border-white/20 bg-black/35 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300">{tr('Niebieski naroznik', 'Blue corner')}</p>
            <p className="text-lg uppercase leading-none" style={{ color: fighterA.color }}>
              {fighterA.name || 'Fighter A'}
            </p>
          </div>
          <div className="relative h-[78%] overflow-hidden rounded-lg border bg-black/45" style={{ borderColor: `${fighterA.color}88` }}>
            {fighterA.imageUrl ? (
              <img
                src={fighterA.imageUrl}
                alt={fighterA.name || 'Fighter A'}
                className="h-full w-full object-cover"
                style={buildPortraitImageStyle(portraitAAdjust)}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.14),transparent_45%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.9))]"
                style={{ color: fighterA.color }}
              >
                <div className="text-center">
                  <p className="text-[56px] font-semibold tracking-[0.04em]">{fighterMonogram(fighterA.name || 'Fighter A')}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{tr('Miejsce na portret', 'Portrait Slot')}</p>
                </div>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 border-[3px] border-black/35" />
            <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:28px_28px]" />
          </div>
        </div>

        <div className="min-h-0 rounded-xl border border-slate-500/45 bg-black/30 p-3">
          <div className="rounded-xl border border-amber-300/55 bg-[linear-gradient(115deg,rgba(120,53,15,0.42),rgba(251,191,36,0.35),rgba(120,53,15,0.42))] px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-100">{tr('Werdykt', 'Verdict')}</p>
            <p className="mt-1 text-4xl uppercase leading-none text-white">{winnerLabel}</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border px-3 py-2" style={{ borderColor: `${fighterA.color}88`, backgroundColor: `${fighterA.color}20` }}>
              <p className="text-xs uppercase tracking-[0.16em]">{fighterA.name || 'Fighter A'}</p>
              <p className="text-2xl font-semibold" style={{ color: fighterA.color }}>
                {Math.round(averageA)}
              </p>
            </div>
            <div className="rounded-lg border px-3 py-2" style={{ borderColor: `${fighterB.color}88`, backgroundColor: `${fighterB.color}20` }}>
              <p className="text-xs uppercase tracking-[0.16em]">{fighterB.name || 'Fighter B'}</p>
              <p className="text-2xl font-semibold" style={{ color: fighterB.color }}>
                {Math.round(averageB)}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-slate-700/60 bg-slate-900/72 p-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">{tr('Linie podsumowania', 'Summary lines')}</p>
            <div className="mt-2 max-h-[220px] space-y-1.5 overflow-y-auto pr-1 text-sm text-slate-100">
              {summaryLines.map((item, index) => (
                <div key={`summary-line-${index}-${item}`} className="rounded border border-slate-700/60 bg-black/35 px-2 py-1">
                  {index + 1}. {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="min-h-0 rounded-xl border p-2" style={{ borderColor: `${fighterB.color}88`, backgroundColor: `${fighterB.color}10` }}>
          <div className="mb-2 rounded-md border border-white/20 bg-black/35 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300">{tr('Czerwony naroznik', 'Red corner')}</p>
            <p className="text-lg uppercase leading-none" style={{ color: fighterB.color }}>
              {fighterB.name || 'Fighter B'}
            </p>
          </div>
          <div className="relative h-[78%] overflow-hidden rounded-lg border bg-black/45" style={{ borderColor: `${fighterB.color}88` }}>
            {fighterB.imageUrl ? (
              <img
                src={fighterB.imageUrl}
                alt={fighterB.name || 'Fighter B'}
                className="h-full w-full object-cover"
                style={buildPortraitImageStyle(portraitBAdjust)}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.14),transparent_45%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.9))]"
                style={{ color: fighterB.color }}
              >
                <div className="text-center">
                  <p className="text-[56px] font-semibold tracking-[0.04em]">{fighterMonogram(fighterB.name || 'Fighter B')}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{tr('Miejsce na portret', 'Portrait Slot')}</p>
                </div>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 border-[3px] border-black/35" />
            <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:28px_28px]" />
          </div>
        </div>
      </div>
    </div>
  )
}
