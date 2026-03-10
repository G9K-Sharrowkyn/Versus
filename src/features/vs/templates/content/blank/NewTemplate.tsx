import { buildFightTemplateChrome, getFightCommonCopy } from '../../../fightManifest'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseBulletItems, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import {
  HIGH_END_CARD_CLASS,
  HIGH_END_FRAME_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_HEADER_CLASS,
  HIGH_END_LABEL_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HIGH_END_SUBTEXT_CLASS,
} from '../../shared/highEnd'

export function NewTemplate({
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['new-template'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const renderedLines = parseBulletItems(blockLines)
  const chrome = buildFightTemplateChrome(language, blockFields)
  const common = getFightCommonCopy(language)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle

  return (
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full flex-col">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 border-b border-cyan-300/25 pb-3 text-[11px] text-slate-300">
            <div className="min-w-[238px] space-y-1 pt-2 text-left">
              <p className="whitespace-nowrap uppercase tracking-[0.16em]">{chrome.threatLevelLabel}: {chrome.threatLevelValue}</p>
              <p className="whitespace-nowrap uppercase tracking-[0.16em]">{chrome.dataIntegrityLabel}: {chrome.dataIntegrityValue}</p>
            </div>
            <div className="text-center">
              <h2 className={HIGH_END_HEADER_CLASS} style={{ fontFamily: 'var(--font-display)' }}>
                {headerText}
              </h2>
              {subText ? <p className={HIGH_END_SUBTEXT_CLASS}>{subText}</p> : null}
            </div>
            <div className="flex items-start justify-end pt-1">
              <button
                type="button"
                className="flex h-[86px] aspect-[755/322] items-center justify-center overflow-hidden rounded-[14px] border border-cyan-300/35 bg-[linear-gradient(180deg,rgba(7,24,42,0.96),rgba(4,14,24,0.94))] p-0 shadow-[0_0_0_1px_rgba(125,211,252,0.08)_inset,0_10px_26px_rgba(2,8,23,0.45)] cursor-pointer transition-transform active:scale-95"
                title={chrome.brandMarkTitle}
                aria-label={chrome.brandMarkAria}
                onClick={onToggleLanguage}
              >
                <img src={chrome.brandImageSrc} alt={chrome.brandAlt} className="h-full w-full object-contain drop-shadow-[0_0_14px_rgba(251,146,60,0.28)]" draggable={false} />
              </button>
            </div>
          </div>
          <div className={`mt-2 flex min-h-0 flex-1 items-center justify-center ${HIGH_END_FRAME_CLASS} border-2 border-dashed`}>
            {renderedLines.length ? (
              <div className={`w-[88%] ${HIGH_END_CARD_CLASS} p-4`}>
                <p className={`text-center ${HIGH_END_LABEL_CLASS}`}>
                  {common.templateBlockPreviewLabel}
                </p>
                <div className="mt-3 max-h-[320px] space-y-1 overflow-y-auto pr-1 text-sm text-slate-100">
                  {renderedLines.map((line, index) => (
                    <div key={`blank-line-${index}-${line}`} className="rounded border border-slate-700/55 bg-black/35 px-2 py-1">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[20px] uppercase tracking-[0.24em] text-slate-400">{common.emptyFieldLabel}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
