import clsx from 'clsx'
import {
  createElement,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react'
import type { TemplateSlotSpec } from './templateSlotSpecs'
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
    whiteSpace: spec.whiteSpace || 'normal',
    textAlign: spec.textAlign,
    textTransform: spec.textTransform,
    overflowWrap: spec.overflowWrap || 'anywhere',
    wordBreak: spec.wordBreak || 'break-word',
    letterSpacing: spec.letterSpacing,
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
