import { pickLang } from '../../../presets'
import {
  TEMPLATE_BLOCK_ALIASES,
  findTemplateBlockLines,
  getPlainTemplateLines,
  parseBulletItems,
  parseTemplateFieldMap,
  pickTemplateField,
} from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'

export type BlankTemplateContext = {
  tr: (pl: string, en: string) => string
  blockFields: Record<string, string>
  renderedLines: string[]
  headerText: string
  subText: string
  winnerLabel: string
  line: (position: number, keys: string[], fallback?: string) => string
}

export type BlankTemplateVariantProps = TemplatePreviewProps & {
  context: BlankTemplateContext
}

export function createBlankTemplateContext({
  title,
  subtitle,
  activeTemplateId,
  templateBlocks,
  language,
}: TemplatePreviewProps): BlankTemplateContext {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const aliases = TEMPLATE_BLOCK_ALIASES[activeTemplateId] || []
  const blockLines = findTemplateBlockLines(templateBlocks, aliases)
  const renderedLines = parseBulletItems(blockLines)
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const winnerLabel =
    pickTemplateField(blockFields, ['winner', 'verdict']) ||
    tr('WERDYKT WARUNKOWY, BRAK ABSOLUTNEGO STOMPA', 'CONDITIONAL VERDICT, NO ABSOLUTE STOMP')

  return {
    tr,
    blockFields,
    renderedLines,
    headerText,
    subText,
    winnerLabel,
    line: (position: number, keys: string[], fallback = '') =>
      pickTemplateField(blockFields, keys) || plainLines[position] || fallback,
  }
}
