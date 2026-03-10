import { buildFightTemplateChrome, getFightCommonCopy } from '../../../fightManifest'
import type { TemplatePreviewProps } from '../../../types'
import {
  HIGH_END_BODY_GAP_CLASS,
  HIGH_END_FRAME_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HighEndTemplateHeader,
} from '../../shared/highEnd'

export function UnknownTemplate({
  activeTemplateId,
  title,
  subtitle,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const chrome = buildFightTemplateChrome(language)
  const common = getFightCommonCopy(language)
  const headerText = title || activeTemplateId.toUpperCase()

  return (
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full flex-col">
          <HighEndTemplateHeader
            chrome={chrome}
            headerText={headerText}
            subText={subtitle}
            onToggleLanguage={onToggleLanguage}
          />
          <div className={`${HIGH_END_BODY_GAP_CLASS} flex min-h-0 flex-1 items-center justify-center ${HIGH_END_FRAME_CLASS} border-2 border-dashed`}>
            <p className="text-center text-[20px] uppercase tracking-[0.24em] text-slate-400">
              {common.emptyFieldLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
