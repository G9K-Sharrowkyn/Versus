import clsx from 'clsx'
import {
  createElement,
  useMemo,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react'
import type { TemplateSlotSpec } from './templateUi'
import { buildStaticSlotDataAttributes, useSlotAutofit } from './useSlotAutofit'

type FittedTextProps<T extends ElementType = 'p'> = {
  slotKey: string
  spec: TemplateSlotSpec
  text: string
  templateId?: string
  activeFightId?: string | null
  language?: string
  as?: T
  className?: string
  style?: CSSProperties
  title?: string
  children?: ReactNode
}

const defaultElementText = (text: string, children: ReactNode) => (children === undefined ? text : children)

export function FittedText<T extends ElementType = 'p'>({
  spec,
  ...props
}: FittedTextProps<T>) {
  if ((spec.fitMode || 'none') === 'shrink') {
    return <ShrinkFittedText spec={spec} {...props} />
  }
  return <StaticFittedText spec={spec} {...props} />
}

function StaticFittedText<T extends ElementType = 'p'>({
  as,
  slotKey,
  spec,
  text,
  className,
  style,
  templateId,
  activeFightId,
  language,
  title,
  children,
}: FittedTextProps<T>) {
  const Component = (as || 'p') as ElementType
  const fixedHeightPx = useMemo(
    () => Math.round(spec.baseFontPx * spec.lineHeight * spec.maxLines * 100) / 100,
    [spec.baseFontPx, spec.lineHeight, spec.maxLines],
  )
  const dataAttributes = buildStaticSlotDataAttributes({
    slotKey,
    spec,
    text,
    templateId,
    activeFightId,
    language,
  })

  const resolvedStyle: CSSProperties = {
    display: style?.display || 'block',
    ...style,
    height: `${fixedHeightPx}px`,
    maxHeight: `${fixedHeightPx}px`,
    overflow: style?.overflow || 'hidden',
    whiteSpace: (style?.whiteSpace || spec.whiteSpace || 'normal') as CSSProperties['whiteSpace'],
    textAlign: (style?.textAlign || spec.textAlign) as CSSProperties['textAlign'],
    textTransform: (style?.textTransform || spec.textTransform) as CSSProperties['textTransform'],
    overflowWrap: (style?.overflowWrap || spec.overflowWrap || 'anywhere') as CSSProperties['overflowWrap'],
    wordBreak: (style?.wordBreak || spec.wordBreak || 'break-word') as CSSProperties['wordBreak'],
    letterSpacing: (style?.letterSpacing || spec.letterSpacing) as CSSProperties['letterSpacing'],
    fontSize: `${spec.baseFontPx}px`,
    lineHeight: `${style?.lineHeight || spec.lineHeight}`,
  }

  return createElement(
    Component,
    {
      className: clsx(className, 'min-w-0'),
      style: resolvedStyle,
      title,
      ...dataAttributes,
    },
    defaultElementText(text, children),
  )
}

function ShrinkFittedText<T extends ElementType = 'p'>({
  as,
  slotKey,
  spec,
  text,
  className,
  style,
  templateId,
  activeFightId,
  language,
  title,
  children,
}: FittedTextProps<T>) {
  const Component = (as || 'p') as ElementType
  const { ref, fontPx, fixedHeightPx, dataAttributes } = useSlotAutofit({
    slotKey,
    spec,
    text,
    templateId,
    activeFightId,
    language,
  })

  const resolvedStyle: CSSProperties = {
    display: style?.display || 'block',
    ...style,
    height: `${fixedHeightPx}px`,
    maxHeight: `${fixedHeightPx}px`,
    overflow: style?.overflow || 'hidden',
    whiteSpace: (style?.whiteSpace || spec.whiteSpace || 'normal') as CSSProperties['whiteSpace'],
    textAlign: (style?.textAlign || spec.textAlign) as CSSProperties['textAlign'],
    textTransform: (style?.textTransform || spec.textTransform) as CSSProperties['textTransform'],
    overflowWrap: (style?.overflowWrap || spec.overflowWrap || 'anywhere') as CSSProperties['overflowWrap'],
    wordBreak: (style?.wordBreak || spec.wordBreak || 'break-word') as CSSProperties['wordBreak'],
    letterSpacing: (style?.letterSpacing || spec.letterSpacing) as CSSProperties['letterSpacing'],
    fontSize: `${fontPx}px`,
    lineHeight: `${style?.lineHeight || spec.lineHeight}`,
  }

  return createElement(
    Component,
    {
      ref,
      className: clsx(className, 'min-w-0'),
      style: resolvedStyle,
      title,
      ...dataAttributes,
    },
    defaultElementText(text, children),
  )
}
