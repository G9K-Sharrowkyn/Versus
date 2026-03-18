import { AdjustableTemplateImage } from '../../components/AdjustableTemplateImage'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { TemplatePreviewProps } from '../../types'
import { FittedText } from '../shared/FittedText'
import { HighEndTemplateHeader } from '../shared/highEnd'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../shared/templateUi'

export function CharacterDossierATemplate({
  fighterA,
  portraitAAdjust,
  title,
  factsA,
  templateBlocks,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const common = getFightCommonCopy('character-dossier-a', language)
  const fighterText = fighterA.name || getFightTemplateDefaultField('character-dossier-a', 'fighter_a_fallback', language)
  const safeFacts = factsA.length
    ? factsA
    : [
        { title: common.style, text: common.emptyFieldLabel },
        { title: common.advantage, text: common.emptyFieldLabel },
        { title: common.mentality, text: common.emptyFieldLabel },
      ]
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['character-dossier-a'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const chrome = buildFightTemplateChrome('character-dossier-a', language, blockFields)
  const ui = getTemplateUi('character-dossier-a', language)
  const shell = ui.highEnd as Record<string, string>
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  const fighterForCard = {
    ...fighterA,
    subtitle: pickTemplateField(blockFields, ['world', 'swiat', 'version']) || fighterA.subtitle,
  }
  const cardFacts = safeFacts
  const cardTitle = (pickTemplateField(blockFields, ['header', 'title', 'headline']) || title)
    .replace(/\s*(?:(?:\/\/)|[|/-])\s*(?:NIEBIESKI|CZERWONY|BLUE|RED)\s*$/i, '')
    .trim()
  const subText = common.blueCorner
  const fighterSubtitle = fighterForCard.subtitle
    .replace(/^\s*(?:NIEBIESKI|CZERWONY|BLUE|RED)\b\s*(?:(?:\/\/)|[|/-])?\s*/i, '')
    .trim()
  const dossierQuote = pickTemplateField(blockFields, ['quote', 'cytat']) || common.emptyFieldLabel

  return (
    <div className={`${shell.HIGH_END_ROOT_CLASS} vs-highend-root`}>
      <div className={`${shell.HIGH_END_PANEL_CLASS} vs-highend-panel`}>
        <div className={shell.HIGH_END_GRID_OVERLAY_CLASS} />
        <div className={layout.INNER_CLASS}>
          <HighEndTemplateHeader
            templateId="character-dossier-a"
            language={language}
            chrome={chrome}
            headerText={cardTitle}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />
          <div
            className={`${shell.HIGH_END_BODY_GAP_CLASS} ${layout.BODY_FRAME_CLASS}`}
            style={{ boxShadow: `0 0 0 1px ${fighterForCard.color}33 inset` }}
          >
            <div className={layout.BODY_GRID_CLASS}>
              <div className={layout.PORTRAIT_FRAME_CLASS} style={{ borderColor: `${fighterForCard.color}88` }}>
                <AdjustableTemplateImage
                  imageUrl={fighterForCard.imageUrl}
                  alt={fighterText}
                  fallbackLabel={common.portraitSlot}
                  hintLabel={chrome.portraitAdjustHint}
                  adjustKey="character-dossier-a:portrait"
                  baseAdjust={portraitAAdjust}
                  adjustments={slideImageAdjustments}
                  onAdjustChange={onSlideImageAdjustChange}
                  onAdjustCommit={onSlideImageAdjustCommit}
                  plain
                />
                <div className={layout.PORTRAIT_BORDER_CLASS} />
                <div className={layout.PORTRAIT_GRID_CLASS} />
                <div className={layout.CORNER_TL_CLASS} style={{ borderColor: `${fighterForCard.color}AA` }} />
                <div className={layout.CORNER_TR_CLASS} style={{ borderColor: `${fighterForCard.color}AA` }} />
                <div className={layout.CORNER_BL_CLASS} style={{ borderColor: `${fighterForCard.color}AA` }} />
                <div className={layout.CORNER_BR_CLASS} style={{ borderColor: `${fighterForCard.color}AA` }} />
              </div>

              <div className={layout.DETAILS_CARD_CLASS}>
                <div className={layout.NAME_PLATE_CLASS}>
                  <FittedText
                    as="h3"
                    slotKey={`character-dossier-a:name:${fighterText}`}
                    spec={slots.heroName}
                    text={fighterText}
                    className={layout.HERO_NAME_CLASS}
                    style={{ color: fighterForCard.color, fontFamily: 'var(--font-display)' }}
                  />
                  {fighterSubtitle ? (
                    <FittedText
                      as="p"
                      slotKey={`character-dossier-a:subtitle:${fighterSubtitle}`}
                      spec={slots.heroSubtitle}
                      text={fighterSubtitle}
                      className={layout.HERO_SUBTITLE_CLASS}
                    />
                  ) : null}
                </div>

                <div className={layout.FACTS_LIST_CLASS}>
                  {cardFacts.map((fact, index) => (
                    <div key={`${fighterText}-${fact.title}-${index}`} className={layout.FACT_CARD_CLASS}>
                      <FittedText
                        as="p"
                        slotKey={`character-dossier-a:fact-title:${index}`}
                        spec={slots.factTitle}
                        text={fact.title}
                        style={{ color: fighterForCard.color }}
                      />
                      <FittedText
                        as="p"
                        slotKey={`character-dossier-a:fact-body:${index}`}
                        spec={slots.factBody}
                        text={fact.text}
                        className={layout.FACT_BODY_CLASS}
                      />
                    </div>
                  ))}
                </div>

                <FittedText
                  as="p"
                  slotKey="character-dossier-a:quote"
                  spec={slots.quoteBody}
                  text={`"${dossierQuote}"`}
                  className={layout.QUOTE_CLASS}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

