import { translationsEn } from './en'
import { translationsPl } from './pl'

export type TranslationDictionary = typeof translationsEn | typeof translationsPl
export type TranslationKey = keyof typeof translationsEn
