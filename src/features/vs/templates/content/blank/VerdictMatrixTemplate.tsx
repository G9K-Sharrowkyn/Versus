import { fighterMonogram } from '../../../helpers'
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

export function VerdictMatrixTemplate({
  fighterA,
  fighterB,
  title,
  subtitle,
  templateBlocks,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['verdict-matrix'] || [])
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
  const case1 = line(
    0,
    ['case_1', 'case1'],
    tr(
      `${fighterA.name || 'Fighter A'} (6/10). Speed and technique finish the fight before time runs out.`,
      `${fighterA.name || 'Fighter A'} (6/10). Speed and technique finish the fight before time runs out.`,
    ),
  )
  const case2 = line(
    1,
    ['case_2', 'case2'],
    tr(
      `${fighterB.name || 'Fighter B'} (5.5/10). A quick closeout is harder. Regen gives the edge.`,
      `${fighterB.name || 'Fighter B'} (5.5/10). A quick closeout is harder. Regen gives the edge.`,
    ),
  )
  const case3 = line(
    2,
    ['case_3', 'case3'],
    tr(
      `${fighterA.name || 'Fighter A'} (5.5/10). Risk rises. If the fast finisher does not land, the opponent comes back.`,
      `${fighterA.name || 'Fighter A'} (5.5/10). Risk rises. If the fast finisher does not land, the opponent comes back.`,
    ),
  )
  const case4 = line(
    3,
    ['case_4', 'case4'],
    tr(
      `${fighterB.name || 'Fighter B'} (6.5/10). Attrition war favors regen.`,
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
  const normalizeName = (value: string) =>
    value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLocaleLowerCase()
      .trim()
  const fighterAName = fighterA.name || 'Fighter A'
  const fighterBName = fighterB.name || 'Fighter B'
  const fighterAKey = normalizeName(fighterAName)
  const fighterBKey = normalizeName(fighterBName)
  const winnerBlueBackground = 'bg-[linear-gradient(135deg,rgba(14,116,144,0.34),rgba(30,64,175,0.3))]'
  const winnerRedBackground = 'bg-[linear-gradient(135deg,rgba(220,38,38,0.34),rgba(127,29,29,0.3))]'
  const resolveWinnerSide = (value: string, fallback: 'a' | 'b') => {
    const normalized = normalizeName(value)
    if (fighterAKey && normalized.startsWith(fighterAKey)) return 'a'
    if (fighterBKey && normalized.startsWith(fighterBKey)) return 'b'
    return fallback
  }
  const resolveWinnerMark = (value: string, fallback: 'a' | 'b') => {
    const winnerSide = resolveWinnerSide(value, fallback)
    return winnerSide === 'a' ? fighterMonogram(fighterAName) : fighterMonogram(fighterBName)
  }
  const winnerBackground = (value: string, fallback: 'a' | 'b') => {
    const winnerSide = resolveWinnerSide(value, fallback)
    return winnerSide === 'a' ? winnerBlueBackground : winnerRedBackground
  }

  const colLeftHeader =
    pickTemplateField(blockFields, ['col_left', 'solar_flare_yes', 'solarflare_yes']) || tr('SOLAR FLARE: YES', 'SOLAR FLARE: YES')
  const colRightHeader =
    pickTemplateField(blockFields, ['col_right', 'solar_flare_no', 'solarflare_no']) || tr('SOLAR FLARE: NO', 'SOLAR FLARE: NO')
  const rowTopHeader = pickTemplateField(blockFields, ['row_top', 'standard', 'standard_ko']) || 'STANDARD KO'
  const rowBottomHeader = pickTemplateField(blockFields, ['row_bottom', 'deathmatch', 'kill_only']) || 'DEATHMATCH'

  const cells = [
    {
      id: 'tl',
      ...splitCase(case1),
      bg: winnerBackground(case1, 'a'),
      mark: resolveWinnerMark(case1, 'a'),
    },
    {
      id: 'tr',
      ...splitCase(case2),
      bg: winnerBackground(case2, 'b'),
      mark: resolveWinnerMark(case2, 'b'),
    },
    {
      id: 'bl',
      ...splitCase(case3),
      bg: winnerBackground(case3, 'a'),
      mark: resolveWinnerMark(case3, 'a'),
    },
    {
      id: 'br',
      ...splitCase(case4),
      bg: winnerBackground(case4, 'b'),
      mark: resolveWinnerMark(case4, 'b'),
    },
  ]

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

