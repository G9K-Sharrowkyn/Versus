import { BookOpen, Crosshair, Swords, WandSparkles } from 'lucide-react'
import { buildFightTemplateChrome, getFightCommonCopy, getFightTemplateDefaultField } from '../../fightManifest'
import { normalizeToken } from '../../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { Fighter, FighterFact, IconType, TemplatePreviewProps } from '../../types'
import {
  HIGH_END_BODY_GAP_CLASS,
  HIGH_END_CARD_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_LABEL_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HighEndFighterBanner,
  HighEndTemplateHeader,
} from '../shared/highEnd'

const TOOLKIT_SECTION_ORDER = ['powers', 'tools', 'weaknesses'] as const

type ToolkitDefaults = {
  powers: string
  tools: string
  weaknesses: string
}

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
  common: ReturnType<typeof getFightCommonCopy>,
  defaults: ToolkitDefaults,
) => {
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
      register(key, defaults.powers, WandSparkles, fact.text)
      return
    }
    if (key === 'tools') {
      register(key, defaults.tools, Swords, fact.text)
      return
    }
    if (key === 'weaknesses') {
      register(key, defaults.weaknesses, Crosshair, fact.text)
      return
    }
    register(key, fact.title || common.dataLabel, BookOpen, fact.text)
  })

  return [
    ...TOOLKIT_SECTION_ORDER.map((key) => sectionMap.get(key)).filter(
      (
        section,
      ): section is {
        key: string
        label: string
        icon: IconType
        items: string[]
      } => Boolean(section),
    ),
    ...Array.from(sectionMap.values()).filter((section) => !TOOLKIT_SECTION_ORDER.includes(section.key as (typeof TOOLKIT_SECTION_ORDER)[number])),
  ]
}

const getToolkitSectionMeta = (
  key: string,
  fields: Record<string, string>,
  common: ReturnType<typeof getFightCommonCopy>,
  defaults: ToolkitDefaults,
) => {
  if (key === 'powers') {
    return {
      label: pickTemplateField(fields, ['powers_label']) || defaults.powers,
      icon: WandSparkles,
    }
  }
  if (key === 'tools') {
    return {
      label: pickTemplateField(fields, ['tools_label']) || defaults.tools,
      icon: Swords,
    }
  }
  if (key === 'weaknesses') {
    return {
      label: pickTemplateField(fields, ['weaknesses_label']) || defaults.weaknesses,
      icon: Crosshair,
    }
  }

  return {
    label: common.dataLabel,
    icon: BookOpen,
  }
}

export function CharacterProfileTemplate({
  fighterA,
  fighterB,
  powersA,
  powersB,
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['character-profile'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const common = getFightCommonCopy(language)
  const chrome = buildFightTemplateChrome(language, blockFields)
  const toolkitDefaults: ToolkitDefaults = {
    powers: getFightTemplateDefaultField('character-profile', 'powers_label', language),
    tools: getFightTemplateDefaultField('character-profile', 'tools_label', language),
    weaknesses: getFightTemplateDefaultField('character-profile', 'weaknesses_label', language),
  }
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle || ''
  const leftSections = buildToolkitSections(powersA, blockFields, common, toolkitDefaults)
  const rightSections = buildToolkitSections(powersB, blockFields, common, toolkitDefaults)
  const leftSectionMap = new Map(leftSections.map((section) => [section.key, section]))
  const rightSectionMap = new Map(rightSections.map((section) => [section.key, section]))
  const sectionRowKeys = [
    ...TOOLKIT_SECTION_ORDER.filter((key) => leftSectionMap.has(key) || rightSectionMap.has(key)),
    ...Array.from(new Set([...leftSections.map((section) => section.key), ...rightSections.map((section) => section.key)])).filter(
      (key) => !TOOLKIT_SECTION_ORDER.includes(key as (typeof TOOLKIT_SECTION_ORDER)[number]),
    ),
  ]

  const renderColumnHeader = (fighter: Fighter) => <HighEndFighterBanner fighter={fighter} />

  const renderSectionCard = (
    fighter: Fighter,
    sectionKey: string,
    section: ReturnType<typeof buildToolkitSections>[number] | undefined,
  ) => {
    const sectionMeta = section || getToolkitSectionMeta(sectionKey, blockFields, common, toolkitDefaults)
    const Icon = sectionMeta.icon

    return (
      <div className={`h-full min-h-0 ${HIGH_END_CARD_CLASS} p-3`}>
        <div className="mb-2 flex items-center gap-2">
          <Icon size={16} style={{ color: fighter.color }} />
          <p className={HIGH_END_LABEL_CLASS}>{sectionMeta.label}</p>
        </div>
        {section ? (
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
        ) : (
          <div className="flex h-[calc(100%-1.75rem)] items-center justify-center rounded-md border border-dashed border-cyan-300/20 bg-slate-950/45 px-3 text-center text-sm text-slate-500">
            {common.noDataInCategory}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full flex-col">
          <HighEndTemplateHeader
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />
          <div className={`${HIGH_END_BODY_GAP_CLASS} grid min-h-0 flex-1 grid-rows-[auto_1fr] gap-3`}>
            <div className="grid grid-cols-2 gap-3">
              {renderColumnHeader(fighterA)}
              {renderColumnHeader(fighterB)}
            </div>
            {sectionRowKeys.length ? (
              <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
                {sectionRowKeys.map((sectionKey) => (
                  <div key={sectionKey} className="grid items-stretch grid-cols-2 gap-3">
                    {renderSectionCard(fighterA, sectionKey, leftSectionMap.get(sectionKey))}
                    {renderSectionCard(fighterB, sectionKey, rightSectionMap.get(sectionKey))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-cyan-300/25 bg-slate-950/60 px-3 py-4 text-center text-sm text-slate-400">
                  {common.noPowersWeaknesses}
                </div>
                <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-cyan-300/25 bg-slate-950/60 px-3 py-4 text-center text-sm text-slate-400">
                  {common.noPowersWeaknesses}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
