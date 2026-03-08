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
  const leftTopLabel = tr('Stopien zagrozenia', 'Threat level')
  const threatLevel = tr('ekstremalny', 'extreme')
  const leftBottomLabel = tr('Integralnosc danych', 'Data integrity')
  const integrity = '99.6%'
  const rightTopLabel = 'VersusVerseVault'
  const profileMode = '/assets/VS2.png'
  const rightBottomLabel = tr('Sygnatura marki', 'Brand mark')
  const scale = 'VersusVerseVault badge'
  const trapTop =
    pickTemplateField(blockFields, ['trap_top', 'top', 'line_1']) || tr('REGENERACJA I BRUTALNOSC >', 'REGEN AND BRUTALITY >')
  const trapBottom =
    pickTemplateField(blockFields, ['trap_bottom', 'bottom', 'line_2']) || tr('TECHNIKA W DLUGIEJ WALCE', 'TECHNIQUE IN A LONG FIGHT')
  const example =
    pickTemplateField(blockFields, ['example', 'line_3']) ||
    tr(
      'Przewaga umiejetnosci o 2-3 punkty znika, gdy przeciwnik od razu leczy kazde trafienie.',
      'A 2-3 point skill edge disappears when the opponent heals immediately after each hit.',
    )
  const questionLine =
    pickTemplateField(blockFields, ['question', 'line_4', 'trap']) ||
    tr(
      'Kluczowe pytanie: W zasadach "tylko zabicie" regeneracja przeciwnika znaczy wiecej niz ogolny profil statystyk.',
      "KEY QUESTION: In 'Kill-Only' rules, opponent regeneration matters more than all-around stats.",
    )

  const questionMatch = questionLine.match(/^([^:]+:)\s*(.*)$/)
  const questionLead = questionMatch?.[1] || tr('Kluczowe pytanie:', 'KEY QUESTION:')
  const questionBody = questionMatch?.[2] || questionLine

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

          <div className={`mt-2 flex min-h-0 flex-1 flex-col ${HIGH_END_FRAME_CLASS} p-3`}>
            <div className="border-y border-cyan-300/25 py-2">
              <div className="mx-auto flex max-w-[92%] flex-col items-center gap-1 text-center" style={{ fontFamily: 'var(--font-display)' }}>
                <p className="text-[clamp(1rem,1.28vw,1.55rem)] uppercase leading-none text-[#b10f24]">{trapTop}</p>
                <p className="text-[clamp(1rem,1.28vw,1.55rem)] uppercase leading-none text-[#c4951a]">{trapBottom}</p>
              </div>
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

            <p className="mt-auto text-[clamp(1.2rem,1.35vw,1.95rem)] leading-[1.14] text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
              <span className="font-bold">{questionLead}</span> {questionBody}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

