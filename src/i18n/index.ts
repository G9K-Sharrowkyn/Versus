import { translationsEn } from './en'
import { translationsPl } from './pl'

export { translationsEn, translationsPl }
export type Language = 'pl' | 'en'

type TranslationDictionary = Record<string, unknown>

export const i18nByLanguage: Record<Language, TranslationDictionary> = {
  pl: translationsPl,
  en: translationsEn,
}

export const tI18n = (language: Language, key: keyof typeof translationsEn) =>
  i18nByLanguage[language][key as string]
