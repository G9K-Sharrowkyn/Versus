import { buildFightTemplateChrome, getFightTemplateDefaultField } from '../../../fightManifest'
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

export function StatTrapTemplate({
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['stat-trap'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const chrome = buildFightTemplateChrome(language, blockFields)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle
  const trapTop =
    pickTemplateField(blockFields, ['trap_top', 'top', 'line_1']) ||
    getFightTemplateDefaultField('stat-trap', 'trap_top', language)
  const trapBottom =
    pickTemplateField(blockFields, ['trap_bottom', 'bottom', 'line_2']) ||
    getFightTemplateDefaultField('stat-trap', 'trap_bottom', language)
  const example =
    pickTemplateField(blockFields, ['example', 'line_3']) ||
    getFightTemplateDefaultField('stat-trap', 'example', language)
  const questionLine =
    pickTemplateField(blockFields, ['question', 'line_4', 'trap']) ||
    getFightTemplateDefaultField('stat-trap', 'question', language)

  const questionMatch = questionLine.match(/^([^:]+:)\s*(.*)$/)
  const questionLead = questionMatch?.[1] || ''
  const questionBody = questionMatch?.[2] || questionLine
  const exampleLength = example.length
  const questionLength = questionLine.length

  const exampleTypography =
    exampleLength > 260
      ? {
          fontSize: 'clamp(1.18rem,1.35vw,1.9rem)',
          lineHeight: 1.06,
        }
      : exampleLength > 185
        ? {
            fontSize: 'clamp(1.42rem,1.62vw,2.35rem)',
            lineHeight: 1.07,
          }
        : {
            fontSize: 'clamp(1.8rem,1.95vw,2.95rem)',
            lineHeight: 1.08,
          }

  const questionTypography =
    questionLength > 120
      ? {
          fontSize: 'clamp(1rem,1.1vw,1.45rem)',
          lineHeight: 1.1,
        }
      : {
          fontSize: 'clamp(1.2rem,1.35vw,1.95rem)',
          lineHeight: 1.14,
        }

  const warningIconSizeClass =
    exampleLength > 260
      ? 'h-[clamp(112px,12vw,176px)] w-[clamp(128px,13.8vw,196px)]'
      : exampleLength > 185
        ? 'h-[clamp(132px,13.8vw,214px)] w-[clamp(150px,15vw,238px)]'
        : 'h-[clamp(156px,16.8vw,252px)] w-[clamp(178px,19vw,286px)]'

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
                <p className="text-[clamp(1rem,1.28vw,1.55rem)] uppercase leading-none text-[#b10f24]">{trapTop}</p>
                <p className="text-[clamp(1rem,1.28vw,1.55rem)] uppercase leading-none text-[#c4951a]">{trapBottom}</p>
              </div>
            </div>

            <div className="mt-2 flex min-h-0 flex-1 items-start">
              <p
                className="whitespace-pre-line text-slate-100"
                style={{ fontFamily: 'var(--font-ui)', ...exampleTypography }}
              >
                {example}
              </p>
            </div>

            <div className="mt-[clamp(8px,1vh,16px)] flex items-center justify-center">
              <svg
                viewBox="0 0 100 92"
                className={`${warningIconSizeClass} drop-shadow-[0_0_16px_rgba(255,45,63,0.52)]`}
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

            <p className="mt-[clamp(8px,1vh,14px)] text-slate-100" style={{ fontFamily: 'var(--font-ui)', ...questionTypography }}>
              {questionLead ? <span className="font-bold">{questionLead}</span> : null} {questionBody}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
