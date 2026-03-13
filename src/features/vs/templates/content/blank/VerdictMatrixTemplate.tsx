import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { fighterMonogram } from '../../../helpers'
import { FittedText } from '../../shared/FittedText'
import { HighEndTemplateHeader } from '../../shared/highEnd'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'

export function VerdictMatrixTemplate({
  fighterA,
  fighterB,
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const common = getFightCommonCopy('verdict-matrix', language)
  const fighterAName = fighterA.name || getFightTemplateDefaultField('verdict-matrix', 'fighter_a_fallback', language)
  const fighterBName = fighterB.name || getFightTemplateDefaultField('verdict-matrix', 'fighter_b_fallback', language)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['verdict-matrix'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome('verdict-matrix', language, blockFields)
  const ui = getTemplateUi('verdict-matrix', language)
  const shell = ui.highEnd as Record<string, string>
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
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
  const winnerBlueBackground = String(layout.WINNER_A_BG_CLASS)
  const winnerRedBackground = String(layout.WINNER_B_BG_CLASS)
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
    <div className={shell.HIGH_END_ROOT_CLASS}>
      <div className={shell.HIGH_END_PANEL_CLASS}>
        <div className={shell.HIGH_END_GRID_OVERLAY_CLASS} />

        <div className={layout.INNER_CLASS}>
          <HighEndTemplateHeader
            templateId="verdict-matrix"
            language={language}
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />

          <div className={`${shell.HIGH_END_BODY_GAP_CLASS} ${layout.MATRIX_SHELL_CLASS}`}>
            <div />

            <div className={layout.COLUMN_HEADERS_CLASS}>
              <div className={layout.COLUMN_HEADER_CELL_CLASS}>
                <FittedText
                  as="p"
                  slotKey="verdict-matrix:col-left"
                  spec={slots.verdictMatrixHeader}
                  text={colLeftHeader}
                  style={{ fontFamily: 'var(--font-ui)', width: '100%' }}
                />
              </div>
              <div className={layout.COLUMN_HEADER_CELL_RIGHT_CLASS}>
                <FittedText
                  as="p"
                  slotKey="verdict-matrix:col-right"
                  spec={slots.verdictMatrixHeader}
                  text={colRightHeader}
                  style={{ fontFamily: 'var(--font-ui)', width: '100%' }}
                />
              </div>
            </div>

            <div className={layout.ROW_HEADERS_CLASS}>
              <div className={layout.ROW_HEADER_CELL_CLASS}>
                <div className={layout.ROW_HEADER_TEXT_WRAP_CLASS}>
                  <FittedText
                    as="p"
                    slotKey="verdict-matrix:row-top"
                    spec={slots.verdictMatrixRowHeader}
                    text={rowTopHeader}
                    className={layout.ROW_HEADER_TEXT_CLASS as string}
                    style={{ fontFamily: 'var(--font-ui)', width: String(layout.ROW_HEADER_WIDTH) }}
                  />
                </div>
              </div>
              <div className={layout.ROW_HEADER_CELL_CLASS}>
                <div className={layout.ROW_HEADER_TEXT_WRAP_CLASS}>
                  <FittedText
                    as="p"
                    slotKey="verdict-matrix:row-bottom"
                    spec={slots.verdictMatrixRowHeader}
                    text={rowBottomHeader}
                    className={layout.ROW_HEADER_TEXT_CLASS as string}
                    style={{ fontFamily: 'var(--font-ui)', width: String(layout.ROW_HEADER_WIDTH) }}
                  />
                </div>
              </div>
            </div>

            <div className={layout.CELLS_GRID_CLASS}>
              {cells.map((cell, index) => (
                <div
                  key={`matrix-cell-${cell.id}`}
                  className={`${layout.CELL_CLASS} ${cell.bg} ${index % 2 === 0 ? layout.CELL_RIGHT_BORDER_CLASS : ''} ${index < 2 ? layout.CELL_BOTTOM_BORDER_CLASS : ''}`}
                >
                  <FittedText
                    as="p"
                    slotKey={`verdict-matrix:lead:${cell.id}`}
                    spec={slots.verdictMatrixLead}
                    text={cell.lead}
                    className={layout.CELL_LEAD_CLASS as string}
                    style={{ fontFamily: 'var(--font-display)' }}
                  />
                  {cell.body ? (
                    <FittedText
                      as="p"
                      slotKey={`verdict-matrix:body:${cell.id}`}
                      spec={slots.verdictMatrixBody}
                      text={cell.body}
                      className={layout.CELL_BODY_CLASS as string}
                      style={{ fontFamily: 'var(--font-ui)' }}
                    />
                  ) : null}
                  <div className={layout.CELL_MARK_CLASS}>
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
