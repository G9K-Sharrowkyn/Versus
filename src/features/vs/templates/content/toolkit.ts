import { BookOpen, Crosshair, Swords, WandSparkles } from 'lucide-react'
import { pickLang } from '../../presets'
import { normalizeToken } from '../../helpers'
import { pickTemplateField } from '../../importer'
import type { FighterFact, IconType, Language } from '../../types'

export const normalizeToolkitGroupKey = (title: string) => {
  const token = normalizeToken(title)
  if (!token) return 'other'
  if (token.includes('weak') || token.includes('slab')) return 'weaknesses'
  if (token.includes('tool') || token.includes('narzed')) return 'tools'
  if (token.includes('power') || token.includes('moc')) return 'powers'
  return token
}

export const buildToolkitSections = (
  facts: FighterFact[],
  fields: Record<string, string>,
  language: Language,
) => {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const sectionMap = new Map<
    string,
    {
      key: string
      label: string
      icon: IconType
      items: string[]
    }
  >()

  const register = (key: string, fallbackLabel: string, icon: IconType, text: string) => {
    const label =
      (key === 'powers' && pickTemplateField(fields, ['powers_label'])) ||
      (key === 'tools' && pickTemplateField(fields, ['tools_label'])) ||
      (key === 'weaknesses' && pickTemplateField(fields, ['weaknesses_label'])) ||
      fallbackLabel
    const existing = sectionMap.get(key)
    if (existing) {
      existing.items.push(text)
      return
    }
    sectionMap.set(key, { key, label, icon, items: [text] })
  }

  facts.forEach((fact) => {
    const key = normalizeToolkitGroupKey(fact.title)
    if (key === 'powers') {
      register(key, tr('Moce', 'Powers'), WandSparkles, fact.text)
      return
    }
    if (key === 'tools') {
      register(key, tr('Narzedzia', 'Tools'), Swords, fact.text)
      return
    }
    if (key === 'weaknesses') {
      register(key, tr('Slabosci', 'Weaknesses'), Crosshair, fact.text)
      return
    }
    register(key, fact.title || tr('Dane', 'Data'), BookOpen, fact.text)
  })

  const orderedKeys = ['powers', 'tools', 'weaknesses']
  return [
    ...orderedKeys
      .map((key) => sectionMap.get(key))
      .filter(
        (
          section,
        ): section is {
          key: string
          label: string
          icon: IconType
          items: string[]
        } => Boolean(section),
      ),
    ...Array.from(sectionMap.values()).filter((section) => !orderedKeys.includes(section.key)),
  ]
}
