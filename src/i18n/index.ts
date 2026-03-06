import { translationsEn } from './en'
import { translationsPl } from './pl'

export { translationsEn, translationsPl }
export type Language = 'pl' | 'en'

export const i18nByLanguage = {
  pl: translationsPl,
  en: translationsEn,
} as const

export const getTranslations = (language: Language) => i18nByLanguage[language]
