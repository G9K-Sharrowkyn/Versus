import type { ReactNode } from 'react'
import type { Fighter } from '../../types'
import { FittedText } from './FittedText'
import { TEMPLATE_SLOT_SPECS } from './templateSlotSpecs'

export const HIGH_END_ROOT_CLASS = 'relative z-10 flex h-full flex-col text-slate-100'

export const HIGH_END_BACKGROUND_CLASS =
  'border border-cyan-300/35 bg-[linear-gradient(180deg,#06172a_0%,#0a2036_52%,#061325_100%)]'

export const HIGH_END_STAGE_CLASS =
  `relative overflow-hidden rounded-[34px] border p-5 shadow-[0_0_0_1px_rgba(125,211,252,0.24),0_0_36px_rgba(3,18,33,0.72)] ${HIGH_END_BACKGROUND_CLASS}`

export const HIGH_END_STAGE_OVERLAY_CLASS =
  'pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_86%_88%,rgba(59,130,246,0.16),transparent_35%)]'

export const HIGH_END_PANEL_CLASS = `relative mt-1 min-h-0 flex-1 overflow-hidden rounded-xl p-3 ${HIGH_END_BACKGROUND_CLASS}`

export const HIGH_END_GRID_OVERLAY_CLASS =
  'pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(125,211,252,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(125,211,252,0.18)_1px,transparent_1px)] [background-size:7%_13%]'

export const HIGH_END_HEADER_CLASS = 'text-center text-[40px] uppercase leading-[0.98] tracking-[0.02em] text-slate-100'

export const HIGH_END_SUBTEXT_CLASS = 'mt-0.5 text-center text-[11px] uppercase leading-[1.08] tracking-[0.16em] text-slate-300'

export const HIGH_END_TEMPLATE_HEADER_SHELL_CLASS =
  'grid grid-cols-[1fr_auto_1fr] items-start gap-4 border-b border-cyan-300/25 pb-1 text-[11px] text-slate-300'

export const HIGH_END_TEMPLATE_HEADER_META_CLASS = 'min-w-[238px] space-y-1 pt-0.5 text-left'

export const HIGH_END_TEMPLATE_HEADER_CENTER_CLASS =
  'flex h-[92px] min-h-[92px] max-h-[92px] flex-col items-center justify-start px-3 pt-0.5 text-center'

export const HIGH_END_TEMPLATE_HEADER_LOGO_WRAP_CLASS = 'flex items-start justify-end pt-0'

export const HIGH_END_FRAME_CLASS =
  'rounded-md border border-cyan-300/25 bg-[linear-gradient(180deg,rgba(5,19,34,0.94),rgba(8,28,49,0.9))]'

export const HIGH_END_CARD_CLASS =
  'rounded-lg border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(4,16,29,0.95),rgba(7,24,42,0.9))]'

export const HIGH_END_SOFT_CARD_CLASS =
  'rounded-lg border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(8,29,48,0.88),rgba(10,35,58,0.82))]'

export const HIGH_END_INSET_CLASS =
  'rounded-lg border border-cyan-300/25 bg-[linear-gradient(180deg,rgba(6,21,37,0.9),rgba(9,31,53,0.84))]'

export const HIGH_END_FIGHTER_BANNER_CLASS = `${HIGH_END_FRAME_CLASS} h-[80px] min-h-[80px] p-3`

export const HIGH_END_FIGHTER_BANNER_INSET_CLASS = `${HIGH_END_INSET_CLASS} flex h-full items-center justify-between gap-3 px-3 py-2`

export const HIGH_END_BODY_GAP_CLASS = 'mt-1'

export const HIGH_END_LABEL_CLASS = 'text-[11px] uppercase tracking-[0.18em] text-slate-300'

export const HIGH_END_SMALL_TEXT_CLASS = 'text-[10px] uppercase tracking-[0.16em] text-slate-400'

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
  chrome,
  headerText,
  subText,
  onToggleLanguage,
  centerSupplement,
  shellClassName = HIGH_END_TEMPLATE_HEADER_SHELL_CLASS,
  metaClassName = HIGH_END_TEMPLATE_HEADER_META_CLASS,
  centerClassName = HIGH_END_TEMPLATE_HEADER_CENTER_CLASS,
  logoWrapClassName = HIGH_END_TEMPLATE_HEADER_LOGO_WRAP_CLASS,
  titleClassName = HIGH_END_HEADER_CLASS,
  subtitleClassName = HIGH_END_SUBTEXT_CLASS,
}: HighEndTemplateHeaderProps) {
  return (
    <div className={shellClassName}>
      <div className={metaClassName}>
        <FittedText
          as="p"
          slotKey="shared-header:threat-level"
          spec={TEMPLATE_SLOT_SPECS.templateHeaderMeta}
          text={`${chrome.threatLevelLabel}: ${chrome.threatLevelValue}`}
        />
        <FittedText
          as="p"
          slotKey="shared-header:data-integrity"
          spec={TEMPLATE_SLOT_SPECS.templateHeaderMeta}
          text={`${chrome.dataIntegrityLabel}: ${chrome.dataIntegrityValue}`}
        />
      </div>
      <div className={centerClassName}>
        <FittedText
          as="h2"
          slotKey={`shared-header:title:${headerText}`}
          spec={TEMPLATE_SLOT_SPECS.templateHeaderTitle}
          text={headerText}
          className={titleClassName}
          style={{ fontFamily: 'var(--font-display)' }}
        />
        {centerSupplement}
        {subText ? (
          <FittedText
            as="p"
            slotKey={`shared-header:subtitle:${subText}`}
            spec={TEMPLATE_SLOT_SPECS.templateHeaderSubtitle}
            text={subText}
            className={subtitleClassName}
          />
        ) : null}
      </div>
      <div className={logoWrapClassName}>
        <button
          type="button"
          className="flex h-[86px] aspect-[755/322] items-center justify-center overflow-hidden rounded-[14px] border border-cyan-300/35 bg-[linear-gradient(180deg,rgba(7,24,42,0.96),rgba(4,14,24,0.94))] p-0 shadow-[0_0_0_1px_rgba(125,211,252,0.08)_inset,0_10px_26px_rgba(2,8,23,0.45)] cursor-pointer transition-transform active:scale-95"
          title={chrome.brandMarkTitle}
          aria-label={chrome.brandMarkAria}
          onClick={onToggleLanguage}
        >
          <img
            src={chrome.brandImageSrc}
            alt={chrome.brandAlt}
            className="h-full w-full object-contain drop-shadow-[0_0_14px_rgba(251,146,60,0.28)]"
            draggable={false}
          />
        </button>
      </div>
    </div>
  )
}

type HighEndFighterBannerProps = {
  fighter: Fighter
  trailing?: ReactNode
}

export function HighEndFighterBanner({ fighter, trailing }: HighEndFighterBannerProps) {
  const fighterName = fighter.name || 'Fighter'
  return (
    <div className={HIGH_END_FIGHTER_BANNER_CLASS}>
      <div
        className={HIGH_END_FIGHTER_BANNER_INSET_CLASS}
        style={{ boxShadow: `0 0 0 1px ${fighter.color}33 inset` }}
      >
        <FittedText
          as="p"
          slotKey={`shared-banner:${fighterName}`}
          spec={TEMPLATE_SLOT_SPECS.fighterBannerName}
          text={fighterName}
          className="tracking-[0.03em]"
          style={{ color: fighter.color, fontFamily: 'var(--font-display)', width: '100%', flex: 1 }}
        />
        {trailing}
      </div>
    </div>
  )
}
