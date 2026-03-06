import { BookOpen, Crosshair, Swords, WandSparkles } from 'lucide-react'
import { pickLang } from '../../presets'
import { normalizeToken } from '../../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { Fighter, FighterFact, IconType, Language, TemplatePreviewProps } from '../../types'
import {
  HIGH_END_CARD_CLASS,
  HIGH_END_FRAME_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_HEADER_CLASS,
  HIGH_END_INSET_CLASS,
  HIGH_END_LABEL_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HIGH_END_SMALL_TEXT_CLASS,
  HIGH_END_SUBTEXT_CLASS,
} from '../shared/highEnd'

const normalizeToolkitGroupKey = (title: string) => {
  const token = normalizeToken(title)
  if (!token) return 'other'
  if (token.includes('weak') || token.includes('slab')) return 'weaknesses'
  if (token.includes('tool') || token.includes('narzed')) return 'tools'
  if (token.includes('power') || token.includes('moc')) return 'powers'
  return token
}

const buildToolkitSections = (
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

export function PowersToolsTemplate({
  fighterA,
  fighterB,
  powersA,
  powersB,
  title,
  subtitle,
  templateBlocks,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['powers-tools'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const leftTitle =
    pickTemplateField(blockFields, ['left_title']) ||
    `${fighterA.name || 'Fighter A'} ${tr('profil narzedzi', 'toolkit profile')}`
  const rightTitle =
    pickTemplateField(blockFields, ['right_title']) ||
    `${fighterB.name || 'Fighter B'} ${tr('profil narzedzi', 'toolkit profile')}`
  const leftSections = buildToolkitSections(powersA, blockFields, language)
  const rightSections = buildToolkitSections(powersB, blockFields, language)

  const renderColumn = (
    fighter: Fighter,
    columnTitle: string,
    sections: ReturnType<typeof buildToolkitSections>,
  ) => (
    <div className={`${HIGH_END_FRAME_CLASS} min-h-0 p-3`}>
      <div
        className={`${HIGH_END_INSET_CLASS} px-3 py-2`}
        style={{ boxShadow: `0 0 0 1px ${fighter.color}33 inset` }}
      >
        <p className={HIGH_END_SMALL_TEXT_CLASS}>{fighter.name || 'Fighter'}</p>
        <p className="mt-1 text-[14px] uppercase tracking-[0.14em]" style={{ color: fighter.color, fontFamily: 'var(--font-display)' }}>
          {columnTitle}
        </p>
      </div>

      <div className="mt-3 grid min-h-0 flex-1 grid-rows-[repeat(3,minmax(0,1fr))] gap-2">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <div
              key={`${fighter.name}-${section.key}`}
              className={`min-h-0 ${HIGH_END_CARD_CLASS} p-3`}
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon size={16} style={{ color: fighter.color }} />
                <p className={HIGH_END_LABEL_CLASS}>{section.label}</p>
              </div>
              <div className="space-y-2 text-sm leading-snug text-slate-200">
                {section.items.map((item, index) => (
                  <div
                    key={`${section.key}-${index}-${item}`}
                    className="rounded-md border border-slate-700/70 bg-slate-900/84 px-2 py-1.5"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {!sections.length ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-cyan-300/25 bg-slate-950/60 px-3 py-4 text-center text-sm text-slate-400">
            {tr('Brak danych o mocach i slabosciach.', 'No powers / weaknesses data found.')}
          </div>
        ) : null}
      </div>
    </div>
  )

  return (
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full flex-col">
          <h2 className={HIGH_END_HEADER_CLASS} style={{ fontFamily: 'var(--font-display)' }}>{headerText}</h2>
          <p className={HIGH_END_SUBTEXT_CLASS}>{subText}</p>
          <div className="mt-3 grid min-h-0 flex-1 grid-cols-2 gap-3">
            {renderColumn(fighterA, leftTitle, leftSections)}
            {renderColumn(fighterB, rightTitle, rightSections)}
          </div>
        </div>
      </div>
    </div>
  )
}
