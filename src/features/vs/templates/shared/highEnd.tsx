import type { ReactNode } from 'react'
import type { Fighter, Language, TemplateId } from '../../types'
import { CyberpunkMetaValue } from '../../components/CyberpunkMetaValue'
import { FittedText } from './FittedText'
import { getTemplateStaticField } from './templateCopy'
import { getTemplateSlotSpec, getTemplateUi } from './templateUi'

type HighEndTemplateHeaderChrome = {
  threatLevelLabel: string
  threatLevelValue: string
  dataIntegrityLabel: string
  dataIntegrityValue: string
  brandMarkTitle: string
  brandMarkAria: string
  brandImageSrc: string
  brandAlt: string
}

type HighEndTemplateHeaderProps = {
  templateId?: TemplateId
  language?: Language
  chrome: HighEndTemplateHeaderChrome
  headerText: string
  subText?: string | null
  onToggleLanguage?: (() => void) | undefined
  centerSupplement?: ReactNode
  shellClassName?: string
  metaClassName?: string
  centerClassName?: string
  logoWrapClassName?: string
  titleClassName?: string
  subtitleClassName?: string
}

export function HighEndTemplateHeader({
  templateId = 'tactical-board',
  language = 'pl',
  chrome,
  headerText,
  subText,
  onToggleLanguage,
  centerSupplement,
  shellClassName,
  metaClassName,
  centerClassName,
  logoWrapClassName,
  titleClassName,
  subtitleClassName,
}: HighEndTemplateHeaderProps) {
  const ui = getTemplateUi(templateId, language)
  const shell = ui.highEnd
  const titleSlot = getTemplateSlotSpec(templateId, language, 'templateHeaderTitle')
  const subtitleSlot = getTemplateSlotSpec(templateId, language, 'templateHeaderSubtitle')
  const metaSlot = getTemplateSlotSpec(templateId, language, 'templateHeaderMeta')
  const resolvedShellClassName = shellClassName || shell.HIGH_END_TEMPLATE_HEADER_SHELL_CLASS
  const resolvedMetaClassName = metaClassName || shell.HIGH_END_TEMPLATE_HEADER_META_CLASS
  const resolvedCenterClassName = centerClassName || shell.HIGH_END_TEMPLATE_HEADER_CENTER_CLASS
  const resolvedLogoWrapClassName = logoWrapClassName || shell.HIGH_END_TEMPLATE_HEADER_LOGO_WRAP_CLASS
  const resolvedTitleClassName = titleClassName || shell.HIGH_END_HEADER_CLASS
  const resolvedSubtitleClassName = subtitleClassName || shell.HIGH_END_SUBTEXT_CLASS

  return (
    <div className={`${resolvedShellClassName} vs-highend-header`}>
      <div className={`${resolvedMetaClassName} vs-highend-header-meta`}>
        <FittedText
          as="p"
          slotKey="shared-header:threat-level"
          spec={metaSlot}
          text={`${chrome.threatLevelLabel}: ${chrome.threatLevelValue}`}
        >
          {chrome.threatLevelLabel}:{' '}
          <CyberpunkMetaValue value={chrome.threatLevelValue} />
        </FittedText>
        <FittedText
          as="p"
          slotKey="shared-header:data-integrity"
          spec={metaSlot}
          text={`${chrome.dataIntegrityLabel}: ${chrome.dataIntegrityValue}`}
        >
          {chrome.dataIntegrityLabel}:{' '}
          <CyberpunkMetaValue value={chrome.dataIntegrityValue} />
        </FittedText>
      </div>
      <div className={`${resolvedCenterClassName} glitch-heading-wrap vs-highend-header-center`}>
        <FittedText
          as="h2"
          slotKey={`shared-header:title:${headerText}`}
          spec={titleSlot}
          text={headerText}
          className={`${resolvedTitleClassName} vs-highend-title`}
          style={{ fontFamily: 'var(--font-display)' }}
        />
        {centerSupplement}
        {subText ? (
          <FittedText
            as="p"
            slotKey={`shared-header:subtitle:${subText}`}
            spec={subtitleSlot}
            text={subText}
            className={`${resolvedSubtitleClassName} vs-highend-subtitle`}
          />
        ) : null}
      </div>
      <div className={`${resolvedLogoWrapClassName} vs-highend-logo-wrap`}>
        <button
          type="button"
          className={`${shell.HIGH_END_LOGO_BUTTON_CLASS} vs-highend-logo-button`}
          title={chrome.brandMarkTitle}
          aria-label={chrome.brandMarkAria}
          onClick={onToggleLanguage}
        >
          <img
            src={chrome.brandImageSrc}
            alt={chrome.brandAlt}
            className={`${shell.HIGH_END_LOGO_IMAGE_CLASS} vs-highend-logo-image`}
            draggable={false}
          />
        </button>
      </div>
    </div>
  )
}

type HighEndFighterBannerProps = {
  templateId?: TemplateId
  language?: Language
  fighter: Fighter
  trailing?: ReactNode
}

export function HighEndFighterBanner({
  templateId = 'tactical-board',
  language = 'pl',
  fighter,
  trailing,
}: HighEndFighterBannerProps) {
  const ui = getTemplateUi(templateId, language)
  const shell = ui.highEnd
  const fighterNameSlot = getTemplateSlotSpec(templateId, language, 'fighterBannerName')
  const fighterName = fighter.name || getTemplateStaticField(templateId, 'fighter_fallback', language)
  return (
    <div className={`${shell.HIGH_END_FIGHTER_BANNER_CLASS} vs-highend-banner`}>
      <div
        className={`${shell.HIGH_END_FIGHTER_BANNER_INSET_CLASS} vs-highend-banner-inset`}
        style={{ boxShadow: `0 0 0 1px ${fighter.color}33 inset` }}
      >
        <FittedText
          as="p"
          slotKey={`shared-banner:${fighterName}`}
          spec={fighterNameSlot}
          text={fighterName}
          className={`${shell.HIGH_END_FIGHTER_NAME_CLASS} vs-highend-fighter-name`}
          style={{ color: fighter.color, fontFamily: 'var(--font-display)', width: '100%', flex: 1 }}
        />
        {trailing}
      </div>
    </div>
  )
}
