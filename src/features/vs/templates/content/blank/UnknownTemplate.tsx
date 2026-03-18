import type { TemplatePreviewProps } from '../../../types'
import { HighEndTemplateHeader } from '../../shared/highEnd'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
} from '../../shared/templateCopy'
import { getTemplateUi } from '../../shared/templateUi'

export function UnknownTemplate({
  activeTemplateId,
  title,
  subtitle,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const chrome = buildFightTemplateChrome('tactical-board', language)
  const common = getFightCommonCopy('tactical-board', language)
  const headerText = title || activeTemplateId.toUpperCase()
  const ui = getTemplateUi('tactical-board', language)
  const shell = ui.highEnd as Record<string, string>
  const layout = ui.template as Record<string, string>

  return (
    <div className={`${shell.HIGH_END_ROOT_CLASS} vs-highend-root`}>
      <div className={`${shell.HIGH_END_PANEL_CLASS} vs-highend-panel`}>
        <div className={shell.HIGH_END_GRID_OVERLAY_CLASS} />
        <div className={layout.UNKNOWN_INNER_CLASS}>
          <HighEndTemplateHeader
            templateId="tactical-board"
            language={language}
            chrome={chrome}
            headerText={headerText}
            subText={subtitle}
            onToggleLanguage={onToggleLanguage}
          />
          <div className={`${shell.HIGH_END_BODY_GAP_CLASS} ${shell.HIGH_END_FRAME_CLASS} ${layout.UNKNOWN_BODY_CLASS}`}>
            <p className={layout.UNKNOWN_MESSAGE_CLASS}>
              {common.emptyFieldLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

