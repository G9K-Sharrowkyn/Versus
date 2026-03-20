import '../../shared/theme.css'
import type { TemplatePreviewProps } from '../../../types'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
} from '../../shared/templateCopy'

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

  return (
    <div className="vs-tpl-surface">
      <div className="vs-tpl-meta">
        <p>{chrome.threatLevelLabel}: <span>{chrome.threatLevelValue}</span></p>
        <p>{chrome.dataIntegrityLabel}: <span>{chrome.dataIntegrityValue}</span></p>
      </div>

      <div className="vs-tpl-heading">
        <h2 className="vs-tpl-title">{headerText}</h2>
        {subtitle ? <p className="vs-tpl-subtitle">{subtitle}</p> : null}
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

      <div className="vs-tpl-body" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{
          color: 'rgba(255, 174, 160, 0.6)',
          fontFamily: 'var(--font-label)',
          fontSize: 'calc(1.1rem * var(--scale))',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {common.emptyFieldLabel}
        </p>
      </div>
    </div>
  )
}
