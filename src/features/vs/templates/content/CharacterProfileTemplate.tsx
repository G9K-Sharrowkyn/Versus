import { Crosshair, Swords, WandSparkles } from 'lucide-react'
import { buildFightTemplateChrome, getFightCommonCopy, getFightTemplateDefaultField } from '../../fightManifest'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { Fighter, IconType, TemplatePreviewProps } from '../../types'
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

const getToolkitSectionMeta = (
  key: string,
  defaults: ToolkitDefaults,
) => {
  if (key === 'powers') {
    return {
      label: defaults.powers,
      icon: WandSparkles,
    }
  }
  if (key === 'tools') {
    return {
      label: defaults.tools,
      icon: Swords,
    }
  }
  if (key === 'weaknesses') {
    return {
      label: defaults.weaknesses,
      icon: Crosshair,
    }
  }
  return null
}

export function CharacterProfileTemplate({
  fighterA,
  fighterB,
  profileA,
  profileB,
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
  const subText = subtitle || ''
  const sectionRows = TOOLKIT_SECTION_ORDER.flatMap((sectionKey) => {
    const meta = getToolkitSectionMeta(sectionKey, toolkitDefaults)
    if (!meta) return []

    const section = {
      key: sectionKey,
      label: meta.label,
      icon: meta.icon,
      leftItems: profileA[sectionKey],
      rightItems: profileB[sectionKey],
    }

    return section.leftItems.length || section.rightItems.length ? [section] : []
  })

  const renderColumnHeader = (fighter: Fighter) => <HighEndFighterBanner fighter={fighter} />

  const renderSectionCard = (
    fighter: Fighter,
    label: string,
    Icon: IconType,
    items: string[],
  ) => {
    return (
      <div className={`h-full min-h-0 ${HIGH_END_CARD_CLASS} p-3`}>
        <div className="mb-2 flex items-center gap-2">
          <Icon size={16} style={{ color: fighter.color }} />
          <p className={HIGH_END_LABEL_CLASS}>{label}</p>
        </div>
        {items.length ? (
          <div className="space-y-2 text-sm leading-snug text-slate-200">
            {items.map((item, index) => (
              <div
                key={`${label}-${index}-${item}`}
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
            {sectionRows.length ? (
              <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
                {sectionRows.map((section) => (
                  <div key={section.key} className="grid items-stretch grid-cols-2 gap-3">
                    {renderSectionCard(fighterA, section.label, section.icon, section.leftItems)}
                    {renderSectionCard(fighterB, section.label, section.icon, section.rightItems)}
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
