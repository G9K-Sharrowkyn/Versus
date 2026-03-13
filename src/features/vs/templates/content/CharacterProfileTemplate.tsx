import { Crosshair, Swords, WandSparkles } from 'lucide-react'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { Fighter, IconType, TemplatePreviewProps } from '../../types'
import { FittedText } from '../shared/FittedText'
import { HighEndFighterBanner, HighEndTemplateHeader } from '../shared/highEnd'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../shared/templateUi'

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
  const common = getFightCommonCopy('character-profile', language)
  const chrome = buildFightTemplateChrome('character-profile', language, blockFields)
  const ui = getTemplateUi('character-profile', language)
  const shell = ui.highEnd as Record<string, string>
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  const toolkitDefaults: ToolkitDefaults = {
    powers: getFightTemplateDefaultField('character-profile', 'powers_label', language),
    tools: getFightTemplateDefaultField('character-profile', 'tools_label', language),
    weaknesses: getFightTemplateDefaultField('character-profile', 'weaknesses_label', language),
  }
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle || ''
  const sectionRows = TOOLKIT_SECTION_ORDER.map((sectionKey) => {
    const meta = getToolkitSectionMeta(sectionKey, toolkitDefaults)
    const leftItems = profileA[sectionKey].filter((item) => item.trim())
    const rightItems = profileB[sectionKey].filter((item) => item.trim())
    return {
      key: sectionKey,
      label: meta?.label || common.emptyFieldLabel,
      icon: meta?.icon || Crosshair,
      leftItems: leftItems.slice(0, PROFILE_ITEM_COUNT),
      rightItems: rightItems.slice(0, PROFILE_ITEM_COUNT),
    }
  }).filter((section) => section.leftItems.length > 0 || section.rightItems.length > 0)

  const renderSectionCard = (
    fighter: Fighter,
    label: string,
    Icon: IconType,
    items: string[],
    side: 'left' | 'right',
    sectionKey: string,
  ) => {
    if (!items.length) return null

    return (
    <div className={layout.SECTION_CARD_CLASS}>
      <div className={layout.SECTION_HEADER_CLASS}>
        <Icon size={16} style={{ color: fighter.color }} />
        <p className={shell.HIGH_END_LABEL_CLASS}>{label}</p>
      </div>
      <div className={layout.SECTION_ITEMS_CLASS}>
        {items.map((item, index) => (
          <div
            key={`${sectionKey}-${side}-${index}`}
            className={layout.SECTION_ITEM_CLASS}
          >
            <FittedText
              as="p"
              slotKey={`character-profile:${sectionKey}:${side}:${index}`}
              spec={slots.factBody}
              text={item}
              className={layout.SECTION_ITEM_TEXT_CLASS}
            />
          </div>
        ))}
      </div>
    </div>
    )
  }

  return (
    <div className={shell.HIGH_END_ROOT_CLASS}>
      <div className={shell.HIGH_END_PANEL_CLASS}>
        <div className={shell.HIGH_END_GRID_OVERLAY_CLASS} />
        <div className={layout.INNER_CLASS}>
          <HighEndTemplateHeader
            templateId="character-profile"
            language={language}
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />
          <div className={`${shell.HIGH_END_BODY_GAP_CLASS} ${layout.BODY_CLASS}`}>
            <div className={layout.BANNERS_CLASS}>
              <HighEndFighterBanner templateId="character-profile" language={language} fighter={fighterA} />
              <HighEndFighterBanner templateId="character-profile" language={language} fighter={fighterB} />
            </div>
            <div className={layout.SECTIONS_WRAP_CLASS}>
              {sectionRows.map((section) => (
                <div key={section.key} className={layout.SECTION_ROW_CLASS}>
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
