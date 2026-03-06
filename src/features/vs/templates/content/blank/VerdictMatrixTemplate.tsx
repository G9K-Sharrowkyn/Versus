import { fighterMonogram } from '../../../helpers'
import { pickTemplateField } from '../../../importer'
import type { BlankTemplateVariantProps } from './context'

export function VerdictMatrixTemplate({ fighterA, fighterB, context }: BlankTemplateVariantProps) {
  const { tr, headerText, subText, blockFields, line } = context
  const case1 = line(
    0,
    ['case_1', 'case1'],
    tr(
      `${fighterA.name || 'Fighter A'} (6/10). Szybkosc i technika koncza walke przed czasem.`,
      `${fighterA.name || 'Fighter A'} (6/10). Speed and technique finish the fight before time runs out.`,
    ),
  )
  const case2 = line(
    1,
    ['case_2', 'case2'],
    tr(
      `${fighterB.name || 'Fighter B'} (5.5/10). Trudniej o szybkie domkniecie. Regen daje przewage.`,
      `${fighterB.name || 'Fighter B'} (5.5/10). A quick closeout is harder. Regen gives the edge.`,
    ),
  )
  const case3 = line(
    2,
    ['case_3', 'case3'],
    tr(
      `${fighterA.name || 'Fighter A'} (5.5/10). Ryzyko rosnie. Jesli szybki finisher nie wejdzie, rywal wraca.`,
      `${fighterA.name || 'Fighter A'} (5.5/10). Risk rises. If the fast finisher does not land, the opponent comes back.`,
    ),
  )
  const case4 = line(
    3,
    ['case_4', 'case4'],
    tr(
      `${fighterB.name || 'Fighter B'} (6.5/10). Wojna na wyniszczenie faworyzuje regen.`,
      `${fighterB.name || 'Fighter B'} (6.5/10). Attrition war favors regen.`,
    ),
  )

  const splitCase = (value: string) => {
    const clean = value.trim()
    const normalized = clean.replace(/(\d)\s*\.\s*(\d)/g, '$1.$2')
    const match = normalized.match(/^(.+?[.!?])\s+([\p{L}].*)$/su)
    if (!match) return { lead: clean, body: '' }
    return { lead: match[1].trim(), body: match[2].trim() }
  }

  const colLeftHeader =
    pickTemplateField(blockFields, ['col_left', 'solar_flare_yes', 'solarflare_yes']) || tr('SOLAR FLARE: TAK', 'SOLAR FLARE: YES')
  const colRightHeader =
    pickTemplateField(blockFields, ['col_right', 'solar_flare_no', 'solarflare_no']) || tr('SOLAR FLARE: NIE', 'SOLAR FLARE: NO')
  const rowTopHeader = pickTemplateField(blockFields, ['row_top', 'standard', 'standard_ko']) || 'STANDARD KO'
  const rowBottomHeader = pickTemplateField(blockFields, ['row_bottom', 'deathmatch', 'kill_only']) || 'DEATHMATCH'

  const cells = [
    {
      id: 'tl',
      ...splitCase(case1),
      bg: 'bg-[linear-gradient(135deg,rgba(14,116,144,0.34),rgba(30,64,175,0.28))]',
      mark: fighterMonogram(fighterA.name || 'A'),
    },
    {
      id: 'tr',
      ...splitCase(case2),
      bg: 'bg-[linear-gradient(135deg,rgba(146,64,14,0.26),rgba(161,98,7,0.22))]',
      mark: fighterMonogram(fighterB.name || 'B'),
    },
    {
      id: 'bl',
      ...splitCase(case3),
      bg: 'bg-[linear-gradient(135deg,rgba(8,47,73,0.5),rgba(30,58,138,0.36))]',
      mark: fighterMonogram(fighterA.name || 'A'),
    },
    {
      id: 'br',
      ...splitCase(case4),
      bg: 'bg-[linear-gradient(135deg,rgba(120,53,15,0.4),rgba(133,77,14,0.3))]',
      mark: fighterMonogram(fighterB.name || 'B'),
    },
  ]

  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <div className="relative mt-1 min-h-0 flex-1 overflow-hidden rounded-xl border border-cyan-300/35 bg-[linear-gradient(180deg,#06172a_0%,#0a2036_52%,#061325_100%)] p-3">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(125,211,252,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(125,211,252,0.2)_1px,transparent_1px)] [background-size:7%_13%]" />

        <div className="relative z-10 flex h-full flex-col">
          <h2 className="text-center text-[58px] uppercase leading-none tracking-[0.02em] text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            {headerText}
          </h2>
          <p className="mt-1 text-center text-[12px] uppercase tracking-[0.16em] text-slate-300">{subText}</p>

          <div className="mt-2 grid min-h-0 flex-1 grid-cols-[96px_1fr] grid-rows-[56px_1fr]">
            <div />

            <div className="grid grid-cols-2">
              <div className="flex items-center justify-center border border-cyan-300/45 bg-slate-900/72 text-[38px] uppercase leading-none text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
                {colLeftHeader}
              </div>
              <div className="flex items-center justify-center border border-l-0 border-cyan-300/45 bg-slate-900/72 text-[38px] uppercase leading-none text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
                {colRightHeader}
              </div>
            </div>

            <div className="grid grid-rows-2">
              <div className="relative border border-r-0 border-t-0 border-cyan-300/45 bg-slate-900/72">
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[16px] uppercase tracking-[0.05em] text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
                  {rowTopHeader}
                </span>
              </div>
              <div className="relative border border-r-0 border-t-0 border-cyan-300/45 bg-slate-900/72">
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[16px] uppercase tracking-[0.05em] text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
                  {rowBottomHeader}
                </span>
              </div>
            </div>

            <div className="grid min-h-0 grid-cols-2 grid-rows-2 border border-t-0 border-cyan-300/45">
              {cells.map((cell, index) => (
                <div
                  key={`matrix-cell-${cell.id}`}
                  className={`relative overflow-hidden border-cyan-300/45 p-3 ${cell.bg} ${index % 2 === 0 ? 'border-r' : ''} ${index < 2 ? 'border-b' : ''}`}
                >
                  <p className="relative z-10 text-[clamp(1.3rem,1.45vw,2.2rem)] font-semibold uppercase leading-tight text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
                    {cell.lead}
                  </p>
                  {cell.body ? (
                    <p className="relative z-10 mt-1 text-[clamp(1.15rem,1.25vw,1.9rem)] leading-[1.08] text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
                      {cell.body}
                    </p>
                  ) : null}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[170px] font-bold text-white/10">
                    {cell.mark}
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
