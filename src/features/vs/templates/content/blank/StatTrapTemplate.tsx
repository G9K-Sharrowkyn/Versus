import '../../shared/theme.css'
import type { CSSProperties } from 'react'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { FittedText } from '../../shared/FittedText'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'

export function StatTrapTemplate({
  title,
  subtitle,
  templateBlocks,
  activeFightId,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['stat-trap'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const common = getFightCommonCopy('stat-trap', language)
  const chrome = buildFightTemplateChrome('stat-trap', language, blockFields)
  const ui = getTemplateUi('stat-trap', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const tokens = ui.tokens as Record<string, string | CSSProperties>
  const layout = ui.template as Record<string, string>
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle
  const trapTop = pickTemplateField(blockFields, ['trap_top', 'top', 'line_1']) || common.emptyFieldLabel
  const trapBottom = pickTemplateField(blockFields, ['trap_bottom', 'bottom', 'line_2']) || common.emptyFieldLabel
  const example = pickTemplateField(blockFields, ['example', 'line_3']) || common.emptyFieldLabel
  const questionLine = pickTemplateField(blockFields, ['question', 'line_4', 'trap']) || common.emptyFieldLabel
  const auditPrefix = `${activeFightId || 'draft'}:stat-trap`

  return (
    <div className="vs-tpl-surface">
      <div className="vs-tpl-meta">
        <p>{chrome.threatLevelLabel}: <span>{chrome.threatLevelValue}</span></p>
        <p>{chrome.dataIntegrityLabel}: <span>{chrome.dataIntegrityValue}</span></p>
      </div>

      <div className="vs-tpl-heading">
        <h2 className="vs-tpl-title">{headerText}</h2>
        {subText ? <p className="vs-tpl-subtitle">{subText}</p> : null}
      </div>

      <button
        type="button"
        className="vs-tpl-logo"
        title={chrome.brandMarkTitle}
        aria-label={chrome.brandMarkAria}
        onClick={onToggleLanguage}
      >
        <img src={chrome.brandImageSrc} alt={chrome.brandAlt} draggable={false} />
        <img className="vs-tpl-logo-reflection" src={chrome.brandImageSrc} alt="" aria-hidden="true" draggable={false} />
      </button>

      <div className="vs-tpl-body">
        <div className={layout.FRAME_CLASS}>
          <div className={layout.HEADLINE_BAND_CLASS}>
            <div className={layout.HEADLINE_WRAP_CLASS} style={{ fontFamily: 'var(--font-display)' }}>
              <FittedText
                as="p"
                slotKey={`${auditPrefix}:top`}
                spec={slots.statTrapHeadline}
                text={trapTop}
                className={`${String(tokens.STAT_TRAP_HEADLINE_CLASS)} text-[#b10f24]`}
                templateId="stat-trap"
                activeFightId={activeFightId}
                language={language}
              />
              <FittedText
                as="p"
                slotKey={`${auditPrefix}:bottom`}
                spec={slots.statTrapHeadline}
                text={trapBottom}
                className={`${String(tokens.STAT_TRAP_HEADLINE_CLASS)} text-[#c4951a]`}
                templateId="stat-trap"
                activeFightId={activeFightId}
                language={language}
              />
            </div>
          </div>

          <div className={layout.EXAMPLE_WRAP_CLASS}>
            <FittedText
              as="p"
              slotKey={`${auditPrefix}:example`}
              spec={slots.statTrapExample}
              text={example}
              className={layout.EXAMPLE_TEXT_CLASS as string}
              style={{ fontFamily: 'var(--font-ui)', ...(tokens.STAT_TRAP_EXAMPLE_STYLE as CSSProperties) }}
              templateId="stat-trap"
              activeFightId={activeFightId}
              language={language}
            />
          </div>

          <div className={layout.ICON_WRAP_CLASS}>
            <svg
              viewBox={layout.ICON_VIEWBOX}
              className={`${String(tokens.STAT_TRAP_WARNING_ICON_CLASS)} ${layout.ICON_CLASS}`}
              aria-hidden="true"
            >
              <polygon
                points={layout.ICON_POLYGON_POINTS}
                fill={layout.ICON_POLYGON_FILL}
                stroke={layout.ICON_STROKE}
                strokeWidth={layout.ICON_STROKE_WIDTH}
                strokeLinejoin={layout.ICON_STROKE_JOIN as 'round'}
              />
              <line
                x1={layout.ICON_LINE_X1}
                y1={layout.ICON_LINE_Y1}
                x2={layout.ICON_LINE_X2}
                y2={layout.ICON_LINE_Y2}
                stroke={layout.ICON_STROKE}
                strokeWidth={layout.ICON_LINE_WIDTH}
                strokeLinecap={layout.ICON_LINE_CAP as 'round'}
              />
              <circle cx={layout.ICON_CIRCLE_CX} cy={layout.ICON_CIRCLE_CY} r={layout.ICON_CIRCLE_R} fill={layout.ICON_STROKE} />
            </svg>
          </div>

          <div className={layout.QUESTION_ROW_CLASS}>
            <span className={layout.QUESTION_LABEL_CLASS}>{common.keyQuestionLabel}</span>{' '}
            <FittedText
              as="span"
              slotKey={`${auditPrefix}:question`}
              spec={slots.statTrapQuestion}
              text={questionLine}
              style={{ fontFamily: 'var(--font-ui)', ...(tokens.STAT_TRAP_QUESTION_STYLE as CSSProperties) }}
              templateId="stat-trap"
              activeFightId={activeFightId}
              language={language}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
