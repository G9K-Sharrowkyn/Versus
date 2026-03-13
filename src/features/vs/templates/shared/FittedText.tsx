import clsx from 'clsx'
import {
  createElement,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react'
import type { TemplateSlotSpec } from './templateUi'
import { useSlotAutofit } from './useSlotAutofit'

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
    overflow: 'hidden',
    whiteSpace: (spec.whiteSpace || 'normal') as CSSProperties['whiteSpace'],
    textAlign: spec.textAlign as CSSProperties['textAlign'],
    textTransform: spec.textTransform as CSSProperties['textTransform'],
    overflowWrap: (spec.overflowWrap || 'anywhere') as CSSProperties['overflowWrap'],
    wordBreak: (spec.wordBreak || 'break-word') as CSSProperties['wordBreak'],
    letterSpacing: spec.letterSpacing as CSSProperties['letterSpacing'],
    fontSize: `${fontPx}px`,
    lineHeight: `${spec.lineHeight}`,
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
