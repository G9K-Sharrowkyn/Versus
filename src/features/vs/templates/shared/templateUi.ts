import type { Language, TemplateId } from '../../types'
import { TEMPLATE_LIBRARY, type TemplateLayoutValue, type TemplateSlotSpec } from './templateLibrary.generated'

export type { TemplateSlotSpec } from './templateLibrary.generated'

type TemplateUiSection = Record<string, TemplateLayoutValue>
const getTemplateDefinition = (templateId: TemplateId, language: Language) => {
  const definition = TEMPLATE_LIBRARY[templateId]?.[language]
  if (!definition) {
    throw new Error(`Missing template definition for ${templateId}:${language}`)
  }
  return definition
}

const readLayoutSection = (templateId: TemplateId, language: Language, key: string): TemplateUiSection => {
  const definition = getTemplateDefinition(templateId, language)
  const section = definition.layout?.[key]
  if (section && typeof section === 'object' && !Array.isArray(section)) {
    return section as TemplateUiSection
  }
  return {}
}

export const getTemplateUi = (templateId: TemplateId, language: Language) => ({
  highEnd: readLayoutSection(templateId, language, 'HIGH_END') as Record<string, string>,
  tokens: readLayoutSection(templateId, language, 'TOKENS'),
  template: readLayoutSection(templateId, language, 'TEMPLATE'),
  slots: getTemplateSlotSpecs(templateId, language),
})

export const getTemplateSlotSpecs = (templateId: TemplateId, language: Language): Record<string, TemplateSlotSpec> => {
  const definition = getTemplateDefinition(templateId, language)
  return definition.slots || {}
}

export const getTemplateSlotSpec = (
  templateId: TemplateId,
  language: Language,
  slotId: string,
): TemplateSlotSpec => {
  const specs = getTemplateSlotSpecs(templateId, language)
  const slot = specs[slotId]
  if (!slot) {
    throw new Error(`Missing slot definition for ${templateId}:${language}:${slotId}`)
  }
  return slot
}
