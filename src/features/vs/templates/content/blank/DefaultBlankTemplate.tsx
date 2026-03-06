import { pickLang } from '../../../presets'
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

export function DefaultBlankTemplate({
  title,
  subtitle,
  templateBlocks,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['blank-template'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const renderedLines = parseBulletItems(blockLines)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle

  return (
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full flex-col">
          <h2 className={HIGH_END_HEADER_CLASS} style={{ fontFamily: 'var(--font-display)' }}>
            {headerText}
          </h2>
          <p className={HIGH_END_SUBTEXT_CLASS}>{subText}</p>
          <div className={`mt-2 flex min-h-0 flex-1 items-center justify-center ${HIGH_END_FRAME_CLASS} border-2 border-dashed`}>
            {renderedLines.length ? (
              <div className={`w-[88%] ${HIGH_END_CARD_CLASS} p-4`}>
                <p className={`text-center ${HIGH_END_LABEL_CLASS}`}>
                  {tr('Podglad bloku template', 'Template block preview')}
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
              <p className="text-[20px] uppercase tracking-[0.24em] text-slate-400">{tr('PUSTE POLE', 'EMPTY FIELD')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
