import { Crosshair, Swords, WandSparkles } from 'lucide-react'
import { buildFightTemplateChrome, getFightCommonCopy, getFightTemplateDefaultField } from '../../fightManifest'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { Fighter, IconType, TemplatePreviewProps } from '../../types'
import { FittedText } from '../shared/FittedText'
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
import { TEMPLATE_SLOT_SPECS } from '../shared/templateSlotSpecs'

const TOOLKIT_SECTION_ORDER = ['powers', 'tools', 'weaknesses'] as const

type ToolkitDefaults = {
  powers: string
  tools: string
  weaknesses: string
}

const getToolkitSectionMeta = (key: string, defaults: ToolkitDefaults) => {
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

const PROFILE_ITEM_COUNT = 2

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
  const sectionRows = TOOLKIT_SECTION_ORDER.map((sectionKey) => {
    const meta = getToolkitSectionMeta(sectionKey, toolkitDefaults)
    return {
      key: sectionKey,
      label: meta?.label || common.emptyFieldLabel,
      icon: meta?.icon || Crosshair,
      leftItems: profileA[sectionKey].slice(0, PROFILE_ITEM_COUNT),
      rightItems: profileB[sectionKey].slice(0, PROFILE_ITEM_COUNT),
    }
  })

  const renderSectionCard = (
    fighter: Fighter,
    label: string,
    Icon: IconType,
    items: string[],
    side: 'left' | 'right',
    sectionKey: string,
  ) => (
    <div className={`h-full min-h-0 ${HIGH_END_CARD_CLASS} p-3`}>
      <div className="mb-2 flex items-center gap-2">
        <Icon size={16} style={{ color: fighter.color }} />
        <p className={HIGH_END_LABEL_CLASS}>{label}</p>
      </div>
      <div className="grid h-[calc(100%-1.75rem)] grid-rows-2 gap-2">
        {Array.from({ length: PROFILE_ITEM_COUNT }, (_, index) => items[index] || common.noDataInCategory).map((item, index) => (
          <div
            key={`${sectionKey}-${side}-${index}`}
            className="rounded-md border border-slate-700/70 bg-slate-900/84 px-2 py-1.5"
          >
            <FittedText
              as="p"
              slotKey={`character-profile:${sectionKey}:${side}:${index}`}
              spec={TEMPLATE_SLOT_SPECS.factBody}
              text={item}
              className="text-slate-200"
            />
          </div>
        ))}
      </div>
    </div>
  )

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
              <HighEndFighterBanner fighter={fighterA} />
              <HighEndFighterBanner fighter={fighterB} />
            </div>
            <div className="grid min-h-0 grid-rows-3 gap-2">
              {sectionRows.map((section) => (
                <div key={section.key} className="grid min-h-0 grid-cols-2 gap-3">
                  {renderSectionCard(fighterA, section.label, section.icon, section.leftItems, 'left', section.key)}
                  {renderSectionCard(fighterB, section.label, section.icon, section.rightItems, 'right', section.key)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
