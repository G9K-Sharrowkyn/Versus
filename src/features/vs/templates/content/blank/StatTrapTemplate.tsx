import { buildFightTemplateChrome, getFightCommonCopy } from '../../../fightManifest'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import {
  HIGH_END_BODY_GAP_CLASS,
  HIGH_END_FRAME_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HighEndTemplateHeader,
} from '../../shared/highEnd'
import { FittedText } from '../../shared/FittedText'
import {
  STAT_TRAP_EXAMPLE_STYLE,
  STAT_TRAP_HEADLINE_CLASS,
  STAT_TRAP_QUESTION_STYLE,
  STAT_TRAP_WARNING_ICON_CLASS,
} from '../../shared/layoutTokens'
import { TEMPLATE_SLOT_SPECS } from '../../shared/templateSlotSpecs'

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
  const common = getFightCommonCopy(language)
  const chrome = buildFightTemplateChrome(language, blockFields)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle
  const trapTop = pickTemplateField(blockFields, ['trap_top', 'top', 'line_1']) || common.emptyFieldLabel
  const trapBottom = pickTemplateField(blockFields, ['trap_bottom', 'bottom', 'line_2']) || common.emptyFieldLabel
  const example = pickTemplateField(blockFields, ['example', 'line_3']) || common.emptyFieldLabel
  const questionLine = pickTemplateField(blockFields, ['question', 'line_4', 'trap']) || common.emptyFieldLabel
  const auditPrefix = `${activeFightId || 'draft'}:stat-trap`

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

          <div className={`${HIGH_END_BODY_GAP_CLASS} flex min-h-0 flex-1 flex-col ${HIGH_END_FRAME_CLASS} p-3`}>
            <div className="border-y border-cyan-300/25 py-2">
              <div className="mx-auto flex max-w-[92%] flex-col items-center gap-1 text-center" style={{ fontFamily: 'var(--font-display)' }}>
                <FittedText
                  as="p"
                  slotKey={`${auditPrefix}:top`}
                  spec={TEMPLATE_SLOT_SPECS.statTrapHeadline}
                  text={trapTop}
                  className={`${STAT_TRAP_HEADLINE_CLASS} text-[#b10f24]`}
                  templateId="stat-trap"
                  activeFightId={activeFightId}
                  language={language}
                />
                <FittedText
                  as="p"
                  slotKey={`${auditPrefix}:bottom`}
                  spec={TEMPLATE_SLOT_SPECS.statTrapHeadline}
                  text={trapBottom}
                  className={`${STAT_TRAP_HEADLINE_CLASS} text-[#c4951a]`}
                  templateId="stat-trap"
                  activeFightId={activeFightId}
                  language={language}
                />
              </div>
            </div>

            <div className="mt-2 flex min-h-0 flex-1 items-start">
              <FittedText
                as="p"
                slotKey={`${auditPrefix}:example`}
                spec={TEMPLATE_SLOT_SPECS.statTrapExample}
                text={example}
                className="w-full whitespace-pre-line text-slate-100"
                style={{ fontFamily: 'var(--font-ui)', ...STAT_TRAP_EXAMPLE_STYLE }}
                templateId="stat-trap"
                activeFightId={activeFightId}
                language={language}
              />
            </div>

            <div className="mt-3 flex items-center justify-center">
              <svg
                viewBox="0 0 100 92"
                className={`${STAT_TRAP_WARNING_ICON_CLASS} drop-shadow-[0_0_16px_rgba(255,45,63,0.52)]`}
                aria-hidden="true"
              >
                <polygon
                  points="50,6 95,84 5,84"
                  fill="rgba(255,255,255,0.96)"
                  stroke="#ff2d3f"
                  strokeWidth="6"
                  strokeLinejoin="round"
                />
                <line x1="50" y1="30" x2="50" y2="56" stroke="#ff2d3f" strokeWidth="8" strokeLinecap="round" />
                <circle cx="50" cy="69" r="4.8" fill="#ff2d3f" />
              </svg>
            </div>

            <div className="mt-3 text-slate-100">
              <span className="font-bold">{common.keyQuestionLabel}</span>{' '}
              <FittedText
                as="span"
                slotKey={`${auditPrefix}:question`}
                spec={TEMPLATE_SLOT_SPECS.statTrapQuestion}
                text={questionLine}
                style={{ fontFamily: 'var(--font-ui)', ...STAT_TRAP_QUESTION_STYLE }}
                templateId="stat-trap"
                activeFightId={activeFightId}
                language={language}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
