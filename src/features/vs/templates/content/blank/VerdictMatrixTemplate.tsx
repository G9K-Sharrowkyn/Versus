import { buildFightTemplateChrome, getFightCommonCopy, getFightTemplateDefaultField } from '../../../fightManifest'
import { pickLang } from '../../../presets'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { fighterMonogram } from '../../../helpers'
import { FittedText } from '../../shared/FittedText'
import {
  HIGH_END_BODY_GAP_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HighEndTemplateHeader,
} from '../../shared/highEnd'
import { TEMPLATE_SLOT_SPECS } from '../../shared/templateSlotSpecs'

export function VerdictMatrixTemplate({
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
  const fighterAName = fighterA.name || tr('Postac A', 'Fighter A')
  const fighterBName = fighterB.name || tr('Postac B', 'Fighter B')
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['verdict-matrix'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome(language, blockFields)
  const line = (position: number, keys: string[], fallback = common.emptyFieldLabel) =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle

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
    pickTemplateField(blockFields, ['col_left', 'solar_flare_yes', 'solarflare_yes']) ||
    getFightTemplateDefaultField('verdict-matrix', 'col_left', language)
  const colRightHeader =
    pickTemplateField(blockFields, ['col_right', 'solar_flare_no', 'solarflare_no']) ||
    getFightTemplateDefaultField('verdict-matrix', 'col_right', language)
  const rowTopHeader =
    pickTemplateField(blockFields, ['row_top', 'standard', 'standard_ko']) ||
    getFightTemplateDefaultField('verdict-matrix', 'row_top', language)
  const rowBottomHeader =
    pickTemplateField(blockFields, ['row_bottom', 'deathmatch', 'kill_only']) ||
    getFightTemplateDefaultField('verdict-matrix', 'row_bottom', language)

  const case1 = line(0, ['case_1', 'case1'])
  const case2 = line(1, ['case_2', 'case2'])
  const case3 = line(2, ['case_3', 'case3'])
  const case4 = line(3, ['case_4', 'case4'])

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
          <HighEndTemplateHeader
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />

          <div className={`${HIGH_END_BODY_GAP_CLASS} grid min-h-0 flex-1 grid-cols-[96px_1fr] grid-rows-[56px_1fr]`}>
            <div />

            <div className="grid grid-cols-2">
              <div className="flex items-center justify-center border border-cyan-300/45 bg-slate-900/72 px-2 text-slate-100">
                <FittedText
                  as="p"
                  slotKey="verdict-matrix:col-left"
                  spec={TEMPLATE_SLOT_SPECS.verdictMatrixHeader}
                  text={colLeftHeader}
                  style={{ fontFamily: 'var(--font-ui)', width: '100%' }}
                />
              </div>
              <div className="flex items-center justify-center border border-l-0 border-cyan-300/45 bg-slate-900/72 px-2 text-slate-100">
                <FittedText
                  as="p"
                  slotKey="verdict-matrix:col-right"
                  spec={TEMPLATE_SLOT_SPECS.verdictMatrixHeader}
                  text={colRightHeader}
                  style={{ fontFamily: 'var(--font-ui)', width: '100%' }}
                />
              </div>
            </div>

            <div className="grid grid-rows-2">
              <div className="relative border border-r-0 border-t-0 border-cyan-300/45 bg-slate-900/72">
                <div className="absolute left-1/2 top-1/2 w-[150px] -translate-x-1/2 -translate-y-1/2 -rotate-90">
                  <FittedText
                    as="p"
                    slotKey="verdict-matrix:row-top"
                    spec={TEMPLATE_SLOT_SPECS.verdictMatrixRowHeader}
                    text={rowTopHeader}
                    className="text-slate-100"
                    style={{ fontFamily: 'var(--font-ui)', width: '150px' }}
                  />
                </div>
              </div>
              <div className="relative border border-r-0 border-t-0 border-cyan-300/45 bg-slate-900/72">
                <div className="absolute left-1/2 top-1/2 w-[150px] -translate-x-1/2 -translate-y-1/2 -rotate-90">
                  <FittedText
                    as="p"
                    slotKey="verdict-matrix:row-bottom"
                    spec={TEMPLATE_SLOT_SPECS.verdictMatrixRowHeader}
                    text={rowBottomHeader}
                    className="text-slate-100"
                    style={{ fontFamily: 'var(--font-ui)', width: '150px' }}
                  />
                </div>
              </div>
            </div>

            <div className="grid min-h-0 grid-cols-2 grid-rows-2 border border-t-0 border-cyan-300/45">
              {cells.map((cell, index) => (
                <div
                  key={`matrix-cell-${cell.id}`}
                  className={`relative overflow-hidden border-cyan-300/45 p-3 ${cell.bg} ${index % 2 === 0 ? 'border-r' : ''} ${index < 2 ? 'border-b' : ''}`}
                >
                  <FittedText
                    as="p"
                    slotKey={`verdict-matrix:lead:${cell.id}`}
                    spec={TEMPLATE_SLOT_SPECS.verdictMatrixLead}
                    text={cell.lead}
                    className="relative z-10 font-semibold text-slate-100"
                    style={{ fontFamily: 'var(--font-display)' }}
                  />
                  {cell.body ? (
                    <FittedText
                      as="p"
                      slotKey={`verdict-matrix:body:${cell.id}`}
                      spec={TEMPLATE_SLOT_SPECS.verdictMatrixBody}
                      text={cell.body}
                      className="relative z-10 mt-1 text-slate-100"
                      style={{ fontFamily: 'var(--font-ui)' }}
                    />
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
