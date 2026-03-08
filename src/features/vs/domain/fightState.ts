import {
  DEFAULT_TEMPLATE_ORDER,
  DEFAULT_WINNER_CV_A,
  DEFAULT_WINNER_CV_B,
  FIGHTER_A,
  FIGHTER_A_COLOR,
  FIGHTER_B,
  FIGHTER_B_COLOR,
  defaultFactsFor,
  injectDerivedTemplates,
} from '../presets'
import {
  cloneFighter,
  enforceFileNameSideOrder,
  normalizePortraitAdjust,
  normalizeSlideImageAdjustments,
  resolveFightVariantLocaleFromFileName,
  stripFightLocaleSuffixFromLabel,
} from '../helpers'
import { createCategoryPayload } from '../importer'
import type {
  Category,
  FightRecord,
  Fighter,
  FighterFact,
  Language,
  PortraitAdjust,
  TemplateId,
} from '../types'

export type ApplyFightRecordOptions = {
  enterIntro?: boolean
  preserveTemplateSelection?: boolean
}

export type FightStudioState = {
  targetLanguage: Language
  categories: Category[]
  fighterA: Fighter
  fighterB: Fighter
  portraitAAdjust: PortraitAdjust
  portraitBAdjust: PortraitAdjust
  slideImageAdjustments: Record<string, PortraitAdjust>
  factsA: FighterFact[]
  factsB: FighterFact[]
  powersA: FighterFact[]
  powersB: FighterFact[]
  rawFeatsA: string[]
  rawFeatsB: string[]
  winsA: string[]
  winsB: string[]
  templateBlocks: Record<string, string[]>
  templateOrder: TemplateId[]
  templateCursor: number
  nextTemplate: TemplateId
  importFileName: string
  activeFightId: string
}

export const resolveFightLanguage = (fight: FightRecord, fallback: Language): Language => {
  if (fight.variantLocale === 'pl' || fight.variantLocale === 'en') return fight.variantLocale
  const inferred = resolveFightVariantLocaleFromFileName(fight.fileName)
  if (inferred === 'pl' || inferred === 'en') return inferred
  return fallback
}

type BuildFightStudioStateOptions = {
  fight: FightRecord
  language: Language
  activeTemplate: TemplateId
  templateCursor: number
  preserveTemplateSelection: boolean
}

export const buildFightStudioState = ({
  fight,
  language,
  activeTemplate,
  templateCursor,
  preserveTemplateSelection,
}: BuildFightStudioStateOptions): FightStudioState => {
  const payload = enforceFileNameSideOrder(fight.payload, fight.fileName || fight.name)
  const targetLanguage = resolveFightLanguage(fight, language)
  const categoryPayload = createCategoryPayload(payload.statsA, payload.statsB)
  const importedOrder = injectDerivedTemplates(
    payload.templateOrder.length ? payload.templateOrder : DEFAULT_TEMPLATE_ORDER,
    payload,
  )

  let nextTemplate = importedOrder[0] || DEFAULT_TEMPLATE_ORDER[0]
  let nextTemplateCursor = 0

  if (preserveTemplateSelection && importedOrder.length) {
    const currentTemplateIndex = importedOrder.indexOf(activeTemplate)
    if (currentTemplateIndex >= 0) {
      nextTemplate = importedOrder[currentTemplateIndex]
      nextTemplateCursor = currentTemplateIndex
    } else if (templateCursor >= 0 && templateCursor < importedOrder.length) {
      nextTemplate = importedOrder[templateCursor]
      nextTemplateCursor = templateCursor
    }
  }

  return {
    targetLanguage,
    categories: categoryPayload.categories,
    fighterA: {
      ...cloneFighter(FIGHTER_A),
      name: stripFightLocaleSuffixFromLabel(payload.fighterAName),
      subtitle: FIGHTER_A.subtitle,
      color: FIGHTER_A_COLOR,
      imageUrl: fight.portraitADataUrl,
      stats: categoryPayload.statsRecordA,
    },
    fighterB: {
      ...cloneFighter(FIGHTER_B),
      name: stripFightLocaleSuffixFromLabel(payload.fighterBName),
      subtitle: FIGHTER_B.subtitle,
      color: FIGHTER_B_COLOR,
      imageUrl: fight.portraitBDataUrl,
      stats: categoryPayload.statsRecordB,
    },
    portraitAAdjust: normalizePortraitAdjust(fight.portraitAAdjust),
    portraitBAdjust: normalizePortraitAdjust(fight.portraitBAdjust),
    slideImageAdjustments: normalizeSlideImageAdjustments(fight.slideImageAdjustments),
    factsA: payload.factsA.length ? payload.factsA.slice(0, 5) : defaultFactsFor('a', targetLanguage),
    factsB: payload.factsB.length ? payload.factsB.slice(0, 5) : defaultFactsFor('b', targetLanguage),
    powersA: payload.powersA.slice(0, 8),
    powersB: payload.powersB.slice(0, 8),
    rawFeatsA: payload.rawFeatsA.slice(0, 8),
    rawFeatsB: payload.rawFeatsB.slice(0, 8),
    winsA: payload.winsA.length ? payload.winsA.slice(0, 12) : DEFAULT_WINNER_CV_A,
    winsB: payload.winsB.length ? payload.winsB.slice(0, 12) : DEFAULT_WINNER_CV_B,
    templateBlocks: payload.templateBlocks,
    templateOrder: importedOrder,
    templateCursor: nextTemplateCursor,
    nextTemplate,
    importFileName: fight.fileName,
    activeFightId: fight.id,
  }
}
