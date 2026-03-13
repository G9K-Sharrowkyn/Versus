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

export function DirectVerdictTemplate({
  fighterA,
  fighterB,
  averageA,
  averageB,
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const common = getFightCommonCopy('direct-verdict', language)
  const fighterAFallback = getFightTemplateDefaultField('direct-verdict', 'fighter_a_fallback', language)
  const fighterBFallback = getFightTemplateDefaultField('direct-verdict', 'fighter_b_fallback', language)
  const defeatsWord = getFightTemplateDefaultField('direct-verdict', 'defeats_word', language)
  const outcomeText = getFightTemplateDefaultField('direct-verdict', 'outcome_label', language)
  const confidenceText = getFightTemplateDefaultField('direct-verdict', 'confidence_label', language)
  const reasonText = getFightTemplateDefaultField('direct-verdict', 'reason_label', language)
  const fighterAName = fighterA.name || fighterAFallback
  const fighterBName = fighterB.name || fighterBFallback
  const winnerSide: 'a' | 'b' = averageA >= averageB ? 'a' : 'b'
  const defaultWinner = winnerSide === 'a' ? fighterAName : fighterBName
  const defaultLoser = winnerSide === 'a' ? fighterBName : fighterAName
  const accentColor = winnerSide === 'a' ? fighterA.color : fighterB.color

  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['direct-verdict'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome('direct-verdict', language, blockFields)
  const ui = getTemplateUi('direct-verdict', language)
  const shell = ui.highEnd as Record<string, string>
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  const line = (position: number, keys: string[], fallback = common.emptyFieldLabel) =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const winnerLabel = pickTemplateField(blockFields, ['winner', 'verdict']) || defaultWinner
  const loserLabel = pickTemplateField(blockFields, ['loser', 'opponent']) || defaultLoser
  const outcomeLabel =
    pickTemplateField(blockFields, ['outcome', 'result', 'method']) ||
    common.emptyFieldLabel
  const certaintyLabel =
    pickTemplateField(blockFields, ['certainty', 'margin', 'confidence']) ||
    common.emptyFieldLabel
  const summaryLines = [
    line(0, ['line_1', 'line1']),
    line(1, ['line_2', 'line2']),
    line(2, ['line_3', 'line3']),
  ]

  return (
    <div className={shell.HIGH_END_ROOT_CLASS}>
      <div className={shell.HIGH_END_PANEL_CLASS}>
        <div className={shell.HIGH_END_GRID_OVERLAY_CLASS} />
        <div className={layout.INNER_CLASS}>
          <HighEndTemplateHeader
            templateId="direct-verdict"
            language={language}
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />

          <div className={`${shell.HIGH_END_BODY_GAP_CLASS} ${layout.BODY_CLASS}`}>
            <div className={layout.LEFT_PANEL_CLASS} style={{ boxShadow: `0 0 0 1px ${accentColor}33 inset` }}>
              <div
                className={layout.VERDICT_PANEL_CLASS}
                style={{
                  borderColor: `${accentColor}88`,
                  background: `linear-gradient(145deg, ${accentColor}33, rgba(15,23,42,0.78))`,
                }}
              >
                <p className={layout.VERDICT_LABEL_CLASS}>
                  {common.verdictLabel}
                </p>
                <FittedText
                  as="p"
                  slotKey="direct-verdict:winner"
                  spec={slots.directVerdictWinner}
                  text={winnerLabel}
                  className={layout.WINNER_TEXT_CLASS}
                  style={{ fontFamily: 'var(--font-display)' }}
                />
                <FittedText
                  as="p"
                  slotKey="direct-verdict:subline"
                  spec={slots.directVerdictSubline}
                  text={`${defeatsWord} ${loserLabel}`}
                  className={layout.SUBLINE_TEXT_CLASS}
                />
              </div>

              <div className={layout.INFO_GRID_CLASS}>
                <div className={layout.INFO_CARD_CLASS}>
                  <p className={shell.HIGH_END_LABEL_CLASS}>{outcomeText}</p>
                  <FittedText
                    as="p"
                    slotKey="direct-verdict:outcome"
                    spec={slots.directVerdictCard}
                    text={outcomeLabel}
                    className={layout.INFO_VALUE_CLASS}
                  />
                </div>
                <div className={layout.INFO_CARD_CLASS}>
                  <p className={shell.HIGH_END_LABEL_CLASS}>{confidenceText}</p>
                  <FittedText
                    as="p"
                    slotKey="direct-verdict:certainty"
                    spec={slots.directVerdictCard}
                    text={certaintyLabel}
                    className={layout.INFO_VALUE_CLASS}
                  />
                </div>
              </div>

              <div className={layout.SCORE_GRID_CLASS}>
                <div className={layout.SCORE_CARD_CLASS}>
                  <FittedText
                    as="p"
                    slotKey={`direct-verdict:left-score-label:${fighterAName}`}
                    spec={slots.scoreLabel}
                    text={fighterAName}
                  />
                  <FittedText
                    as="p"
                    slotKey="direct-verdict:left-score"
                    spec={slots.scoreValue}
                    text={String(Math.round(averageA))}
                    className={layout.SCORE_VALUE_TEXT_CLASS}
                    style={{ color: fighterA.color }}
                  />
                </div>
                <div className={layout.SCORE_CARD_CLASS}>
                  <FittedText
                    as="p"
                    slotKey={`direct-verdict:right-score-label:${fighterBName}`}
                    spec={slots.scoreLabel}
                    text={fighterBName}
                  />
                  <FittedText
                    as="p"
                    slotKey="direct-verdict:right-score"
                    spec={slots.scoreValue}
                    text={String(Math.round(averageB))}
                    className={layout.SCORE_VALUE_TEXT_CLASS}
                    style={{ color: fighterB.color }}
                  />
                </div>
              </div>
            </div>

            <div className={layout.RIGHT_PANEL_CLASS}>
              <p className={shell.HIGH_END_LABEL_CLASS}>{reasonText}</p>
              <div className={layout.REASON_GRID_CLASS}>
                {summaryLines.map((item, index) => (
                  <div key={`direct-verdict-line-${index}-${item}`} className={layout.REASON_CARD_CLASS}>
                    <span className={layout.REASON_INDEX_CLASS} style={{ color: accentColor }}>
                      {index + 1}
                    </span>
                    <FittedText
                      as="span"
                      slotKey={`direct-verdict:line:${index}`}
                      spec={slots.directVerdictCard}
                      text={item}
                      className={layout.REASON_TEXT_CLASS}
                      style={{ flex: 1 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
