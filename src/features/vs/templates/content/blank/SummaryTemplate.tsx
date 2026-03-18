import { AdjustableTemplateImage } from '../../../components/AdjustableTemplateImage'
import { fighterMonogram } from '../../../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { FittedText } from '../../shared/FittedText'
import { HighEndTemplateHeader } from '../../shared/highEnd'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'

export function SummaryTemplate({
  fighterA,
  fighterB,
  portraitAAdjust,
  portraitBAdjust,
  averageA,
  averageB,
  title,
  subtitle,
  templateBlocks,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['final-summary'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome('final-summary', language, blockFields)
  const common = getFightCommonCopy('final-summary', language)
  const ui = getTemplateUi('final-summary', language)
  const shell = ui.highEnd as Record<string, string>
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  const tokens = ui.tokens as Record<string, string>
  const line = (position: number, keys: string[], fallback = '') =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle
  const portraitHint = chrome.portraitAdjustHint
  const fighterAFallback = getFightTemplateDefaultField('final-summary', 'fighter_a_fallback', language)
  const fighterBFallback = getFightTemplateDefaultField('final-summary', 'fighter_b_fallback', language)
  const fighterAName = fighterA.name || fighterAFallback
  const fighterBName = fighterB.name || fighterBFallback
  const winnerLabel = pickTemplateField(blockFields, ['winner', 'verdict']) || common.emptyFieldLabel
  const quoteText = pickTemplateField(blockFields, ['quote'])
  const summaryLines = [
    line(0, ['line_1', 'line1'], common.emptyFieldLabel),
    line(1, ['line_2', 'line2'], common.emptyFieldLabel),
    line(2, ['line_3', 'line3'], common.emptyFieldLabel),
  ]

  return (
    <div className={`${shell.HIGH_END_ROOT_CLASS} vs-highend-root`}>
      <div className={`${shell.HIGH_END_PANEL_CLASS} vs-highend-panel`}>
        <div className={shell.HIGH_END_GRID_OVERLAY_CLASS} />
        <div className={layout.INNER_CLASS}>
          <HighEndTemplateHeader
            templateId="final-summary"
            language={language}
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />

          <div className={`${shell.HIGH_END_BODY_GAP_CLASS} ${layout.BODY_CLASS}`}>
            <div className={layout.SIDE_FRAME_CLASS} style={{ boxShadow: `0 0 0 1px ${fighterA.color}33 inset` }}>
              <div className={layout.SIDE_NAME_PLATE_CLASS}>
                <p className={shell.HIGH_END_SMALL_TEXT_CLASS}>{common.blueCorner}</p>
                <FittedText
                  as="p"
                  slotKey={`final-summary:left-name:${fighterAName}`}
                  spec={slots.heroName}
                  text={fighterAName}
                  className={layout.SIDE_NAME_TEXT_CLASS}
                  style={{ color: fighterA.color, fontFamily: 'var(--font-display)', width: '100%' }}
                />
              </div>
              <div className={layout.PORTRAIT_FRAME_CLASS} style={{ borderColor: `${fighterA.color}88` }}>
                {fighterA.imageUrl ? (
                  <AdjustableTemplateImage
                    imageUrl={fighterA.imageUrl}
                    alt={fighterAName}
                    fallbackLabel={common.portraitSlot}
                    hintLabel={portraitHint}
                    adjustKey="final-summary:portrait-a"
                    baseAdjust={portraitAAdjust}
                    adjustments={slideImageAdjustments}
                    onAdjustChange={onSlideImageAdjustChange}
                    onAdjustCommit={onSlideImageAdjustCommit}
                    plain
                  />
                ) : (
                  <div
                    className={layout.FALLBACK_PORTRAIT_CLASS}
                    style={{ color: fighterA.color }}
                  >
                    <div className={layout.FALLBACK_INNER_CLASS}>
                      <p className={layout.FALLBACK_MONOGRAM_CLASS}>{fighterMonogram(fighterAName)}</p>
                      <p className={layout.FALLBACK_LABEL_CLASS}>{common.portraitSlot}</p>
                    </div>
                  </div>
                )}
                <div className={layout.PORTRAIT_OVERLAY_BORDER_CLASS} />
                <div className={layout.PORTRAIT_OVERLAY_GRID_CLASS} />
              </div>
            </div>

            <div className={layout.CENTER_FRAME_CLASS}>
              <div className={layout.VERDICT_PANEL_CLASS}>
                <p className={layout.VERDICT_LABEL_CLASS}>{common.verdictLabel}</p>
                <FittedText
                  as="p"
                  slotKey="final-summary:winner"
                  spec={slots.summaryWinner}
                  text={winnerLabel}
                  className={layout.VERDICT_WINNER_CLASS}
                  style={{ fontFamily: 'var(--font-display)' }}
                />
              </div>

              <div className={layout.SCORE_GRID_CLASS}>
                <div className={layout.SCORE_CARD_CLASS} style={{ boxShadow: `0 0 0 1px ${fighterA.color}33 inset` }}>
                  <FittedText
                    as="p"
                    slotKey={`final-summary:left-score-label:${fighterAName}`}
                    spec={slots.scoreLabel}
                    text={fighterAName}
                    className={layout.SIDE_NAME_TEXT_CLASS}
                    style={{ width: '100%' }}
                  />
                  <FittedText
                    as="p"
                    slotKey="final-summary:left-score"
                    spec={slots.scoreValue}
                    text={String(Math.round(averageA))}
                    className={layout.SCORE_VALUE_TEXT_CLASS}
                    style={{ color: fighterA.color }}
                  />
                </div>
                <div className={layout.SCORE_CARD_CLASS} style={{ boxShadow: `0 0 0 1px ${fighterB.color}33 inset` }}>
                <FittedText
                  as="p"
                  slotKey={`final-summary:right-score-label:${fighterBName}`}
                  spec={slots.scoreLabel}
                  text={fighterBName}
                  className={layout.SIDE_NAME_TEXT_CLASS}
                  style={{ width: '100%' }}
                />
                  <FittedText
                    as="p"
                    slotKey="final-summary:right-score"
                    spec={slots.scoreValue}
                    text={String(Math.round(averageB))}
                    className={layout.SCORE_VALUE_TEXT_CLASS}
                    style={{ color: fighterB.color }}
                  />
                </div>
              </div>

              <div className={layout.SUMMARY_PANEL_CLASS}>
                <p className={shell.HIGH_END_LABEL_CLASS}>{common.summaryLabel}</p>
                <div className={layout.SUMMARY_LIST_CLASS}>
                  {summaryLines.map((item, index) => (
                    <div key={`summary-line-${index}-${item}`} className={layout.SUMMARY_ITEM_CLASS}>
                      <FittedText
                        as="p"
                        slotKey={`final-summary:line:${index}`}
                        spec={slots.summaryLine}
                        text={`${index + 1}. ${item}`}
                        className={layout.SUMMARY_LINE_TEXT_CLASS}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {quoteText && (
                <div className={tokens.INTERPRETATION_QUOTE_CLASS}>
                  <FittedText
                    as="p"
                    slotKey="final-summary:quote"
                    spec={slots.interpretationQuote}
                    text={quoteText}
                  />
                </div>
              )}
            </div>

            <div className={layout.SIDE_FRAME_CLASS} style={{ boxShadow: `0 0 0 1px ${fighterB.color}33 inset` }}>
              <div className={layout.SIDE_NAME_PLATE_CLASS}>
                <p className={shell.HIGH_END_SMALL_TEXT_CLASS}>{common.redCorner}</p>
                <FittedText
                  as="p"
                  slotKey={`final-summary:right-name:${fighterBName}`}
                  spec={slots.heroName}
                  text={fighterBName}
                  className={layout.SIDE_NAME_TEXT_CLASS}
                  style={{ color: fighterB.color, fontFamily: 'var(--font-display)', width: '100%' }}
                />
              </div>
              <div className={layout.PORTRAIT_FRAME_CLASS} style={{ borderColor: `${fighterB.color}88` }}>
                {fighterB.imageUrl ? (
                  <AdjustableTemplateImage
                    imageUrl={fighterB.imageUrl}
                    alt={fighterBName}
                    fallbackLabel={common.portraitSlot}
                    hintLabel={portraitHint}
                    adjustKey="final-summary:portrait-b"
                    baseAdjust={portraitBAdjust}
                    adjustments={slideImageAdjustments}
                    onAdjustChange={onSlideImageAdjustChange}
                    onAdjustCommit={onSlideImageAdjustCommit}
                    plain
                  />
                ) : (
                  <div
                    className={layout.FALLBACK_PORTRAIT_CLASS}
                    style={{ color: fighterB.color }}
                  >
                    <div className={layout.FALLBACK_INNER_CLASS}>
                      <p className={layout.FALLBACK_MONOGRAM_CLASS}>{fighterMonogram(fighterBName)}</p>
                      <p className={layout.FALLBACK_LABEL_CLASS}>{common.portraitSlot}</p>
                    </div>
                  </div>
                )}
                <div className={layout.PORTRAIT_OVERLAY_BORDER_CLASS} />
                <div className={layout.PORTRAIT_OVERLAY_GRID_CLASS} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

