import { pickLang } from '../../../presets'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import {
  HIGH_END_FRAME_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_HEADER_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HIGH_END_SUBTEXT_CLASS,
} from '../../shared/highEnd'

export function StatTrapTemplate({
  title,
  subtitle,
  templateBlocks,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['stat-trap'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const trapTop =
    pickTemplateField(blockFields, ['trap_top', 'top', 'line_1']) || tr('REGEN AND BRUTALITY >', 'REGEN AND BRUTALITY >')
  const trapBottom =
    pickTemplateField(blockFields, ['trap_bottom', 'bottom', 'line_2']) || tr('TECHNIQUE IN A LONG FIGHT', 'TECHNIQUE IN A LONG FIGHT')
  const example =
    pickTemplateField(blockFields, ['example', 'line_3']) ||
    tr(
      'A 2-3 point skill edge disappears when the opponent heals immediately after each hit.',
      'A 2-3 point skill edge disappears when the opponent heals immediately after each hit.',
    )
  const questionLine =
    pickTemplateField(blockFields, ['question', 'line_4', 'trap']) ||
    tr(
      "KEY QUESTION: In 'Kill-Only' rules, opponent regeneration matters more than all-around stats.",
      "KEY QUESTION: In 'Kill-Only' rules, opponent regeneration matters more than all-around stats.",
    )

  const questionMatch = questionLine.match(/^([^:]+:)\s*(.*)$/)
  const questionLead = questionMatch?.[1] || tr('KEY QUESTION:', 'KEY QUESTION:')
  const questionBody = questionMatch?.[2] || questionLine

  return (
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />

        <div className="relative z-10 flex h-full flex-col">
          <h2 className={HIGH_END_HEADER_CLASS} style={{ fontFamily: 'var(--font-display)' }}>
            {headerText}
          </h2>
          <p className={HIGH_END_SUBTEXT_CLASS}>{subText}</p>

          <div className={`mt-2 flex min-h-0 flex-1 flex-col ${HIGH_END_FRAME_CLASS} p-3`}>
            <div className="border-y border-cyan-300/25 py-2">
              <p
                className="flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap text-center text-[clamp(1.15rem,1.5vw,1.9rem)] uppercase leading-none"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <span className="shrink-0 text-[#b10f24]">{trapTop}</span>
                <span className="shrink-0 text-[#c4951a]">{trapBottom}</span>
              </p>
            </div>

            <p className="mt-2 whitespace-pre-line text-[clamp(1.8rem,1.95vw,2.95rem)] leading-[1.08] text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
              {example}
            </p>

            <div className="mb-[-8px] mt-[clamp(12px,1.4vh,22px)] flex items-center justify-center">
              <svg
                viewBox="0 0 100 92"
                className="h-[clamp(156px,16.8vw,252px)] w-[clamp(178px,19vw,286px)] drop-shadow-[0_0_16px_rgba(255,45,63,0.52)]"
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

            <p className="mt-auto text-[clamp(1.6rem,1.75vw,2.6rem)] leading-[1.08] text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
              <span className="font-bold">{questionLead}</span> {questionBody}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
