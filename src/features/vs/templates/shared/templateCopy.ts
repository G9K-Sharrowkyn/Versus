import type { Category, FighterFact, Language, TemplateId, TemplatePreset } from '../../types'
import { TEMPLATE_LIBRARY } from './templateLibrary.generated'

const getTemplateLocaleDefinition = (templateId: TemplateId, language: Language) =>
  TEMPLATE_LIBRARY[templateId]?.[language] || null

export const getTemplateMetadata = (templateId: TemplateId, language: Language) => {
  const definition = getTemplateLocaleDefinition(templateId, language)
  return definition?.metadata || null
}

export const getTemplatePreset = (templateId: TemplateId, language: Language): TemplatePreset => {
  const metadata = getTemplateMetadata(templateId, language)
  if (!metadata) {
    return {
      id: templateId,
      name: templateId,
      description: templateId,
      title: templateId.toUpperCase(),
      subtitle: '',
    }
  }

  return {
    id: templateId,
    name: metadata.activeName,
    description: metadata.description,
    title: metadata.title,
    subtitle: metadata.subtitle,
  }
}

export const getTemplateBlockName = (templateId: TemplateId, language: Language) =>
  getTemplateMetadata(templateId, language)?.blockName || templateId

export const getTemplatePurpose = (templateId: TemplateId, language: Language) =>
  getTemplateMetadata(templateId, language)?.purpose || ''

export const getTemplateStaticField = (
  templateId: TemplateId,
  fieldKey: string,
  language: Language,
) => getTemplateLocaleDefinition(templateId, language)?.staticFields?.[fieldKey] || ''

export const getTemplateCommonCopy = (templateId: TemplateId, language: Language) =>
  getTemplateLocaleDefinition(templateId, language)?.common || {
    style: '',
    advantage: '',
    mentality: '',
    blueCorner: '',
    redCorner: '',
    noImage: '',
    portraitSlot: '',
    noDrawsCurrentSetup: '',
    baseline: '',
    toolkitProfileSuffix: '',
    noEntry: '',
    noDataInCategory: '',
    noPowersWeaknesses: '',
    noLeftCategoryEdge: '',
    noRightCategoryEdge: '',
    archiveLabel: '',
    recordPrefix: '',
    entriesUnit: '',
    averageShort: '',
    parameterLabel: '',
    scoreScaleLabel: '',
    drawZonesLabel: '',
    drawLabel: '',
    favoriteSuffix: '',
    summaryLabel: '',
    dataLabel: '',
    verdictLabel: '',
    mechanicsLabel: '',
    implicationLabel: '',
    psychologyLabel: '',
    keyQuestionLabel: '',
    templateBlockPreviewLabel: '',
    emptyFieldLabel: '',
    startLabel: '',
    fightTimeLabel: '',
    endLabel: '',
    advantageStaminaLabel: '',
    phaseLabel: '',
    phase1Label: '',
    phase2Label: '',
    phase3Label: '',
    scenarioPresetLabel: '',
  }

export const getTemplateChromeCopy = (templateId: TemplateId, language: Language) =>
  getTemplateLocaleDefinition(templateId, language)?.chrome || {
    threatLevelLabel: '',
    threatLevelValue: '',
    dataIntegrityLabel: '',
    dataIntegrityValue: '',
    brandAlt: '',
    brandMarkTitle: '',
    brandMarkAria: '',
    brandImageSrc: '/assets/VS2.png',
    portraitAdjustHint: '',
  }

export const buildTemplateChrome = (
  templateId: TemplateId,
  language: Language,
  fields: Record<string, string> = {},
) => {
  const copy = getTemplateChromeCopy(templateId, language)
  return {
    threatLevelLabel: copy.threatLevelLabel,
    threatLevelValue: fields.threatlevel || copy.threatLevelValue,
    dataIntegrityLabel: copy.dataIntegrityLabel,
    dataIntegrityValue: fields.integrity || fields.dataintegrity || copy.dataIntegrityValue,
    brandAlt: copy.brandAlt,
    brandMarkTitle: copy.brandMarkTitle,
    brandMarkAria: fields.brandmarkaria || fields.brandaria || copy.brandMarkAria,
    brandImageSrc: fields.brandimagesrc || fields.brandimage || copy.brandImageSrc,
    portraitAdjustHint: copy.portraitAdjustHint,
  }
}

export const getDefaultFightCategories = (templateId: TemplateId, language: Language): Category[] =>
  getTemplateLocaleDefinition(templateId, language)?.categories?.slice() || []

export const getDefaultProfileFacts = (side: 'a' | 'b', language: Language): FighterFact[] => {
  void side
  void language
  return []
}

export const getDefaultVictoryArchive = (side: 'a' | 'b') => {
  void side
  return []
}
