import type { CSSProperties } from 'react'

export const TEMPLATE_INSIGHT_CARD_CLASS = 'rounded-md border border-slate-500/70 bg-slate-900/85 p-2'
export const TEMPLATE_INSIGHT_ROW_CLASS = 'flex items-start gap-2'
export const TEMPLATE_INSIGHT_ICON_WRAP_CLASS =
  'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-cyan-300/25 bg-slate-950/78 text-cyan-200'
export const TEMPLATE_INSIGHT_TITLE_CLASS = 'text-[16px] font-semibold uppercase leading-none text-slate-100'
export const TEMPLATE_INSIGHT_BODY_CLASS = 'mt-1 text-[15px] leading-tight text-slate-200'
export const TEMPLATE_INSIGHT_ICON_SIZE = 18
export const TEMPLATE_INSIGHT_ICON_STROKE = 2.15

export const TEMPLATE_QUOTE_PANEL_CLASS =
  'mt-3 rounded-md border border-cyan-300/35 bg-slate-900/82 px-3 py-2 text-center text-[18px] text-slate-100'

export const INTERPRETATION_BULLET_LIST_CLASS = 'list-disc space-y-1 pl-6 text-[20px] leading-tight text-slate-100'
export const INTERPRETATION_QUOTE_CLASS = `${TEMPLATE_QUOTE_PANEL_CLASS} italic`
export const INTERPRETATION_BAR_LABEL_CLASS = 'text-[20px] font-semibold uppercase leading-none text-slate-100'

export const STAT_TRAP_HEADLINE_CLASS = 'text-[24px] uppercase leading-none'
export const STAT_TRAP_EXAMPLE_STYLE: CSSProperties = {
  fontSize: '20px',
  lineHeight: 1.08,
}
export const STAT_TRAP_QUESTION_STYLE: CSSProperties = {
  fontSize: '18px',
  lineHeight: 1.1,
}
export const STAT_TRAP_WARNING_ICON_CLASS = 'h-[152px] w-[176px]'

export const X_FACTOR_SUPPLEMENT_CLASS =
  'mt-1 text-center text-[18px] uppercase leading-[1.05] tracking-[0.18em] text-cyan-100'
export const X_FACTOR_FIGHTER_NAME_CLASS = 'text-[58px] font-semibold uppercase leading-none tracking-[0.01em]'
export const X_FACTOR_VALUE_CLASS = 'text-[34px]'
export const X_FACTOR_VALUE_BONUS_CLASS = 'min-h-[14px] text-[14px] uppercase tracking-[0.08em]'
