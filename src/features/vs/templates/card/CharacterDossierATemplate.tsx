import '../shared/theme.css'
import { AdjustableTemplateImage } from '../../components/AdjustableTemplateImage'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { TemplatePreviewProps } from '../../types'
import { FittedText } from '../shared/FittedText'
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
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  const fighterForCard = {
    ...fighterA,
    subtitle: fighterA.version || pickTemplateField(blockFields, ['world', 'swiat', 'version']) || fighterA.subtitle,
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
  const bodyStyle = {
    top: 'calc(200px * var(--scale))',
    left: '9.9%',
    right: '9.9%',
    bottom: 'auto',
    height: 'calc(484px * var(--scale))',
  } as const

  return (
    <div className="vs-tpl-surface">
      <div className="vs-tpl-meta">
        <p>{chrome.threatLevelLabel}: <span>{chrome.threatLevelValue}</span></p>
        <p>{chrome.dataIntegrityLabel}: <span>{chrome.dataIntegrityValue}</span></p>
      </div>

      <div className="vs-tpl-heading">
        <h2 className="vs-tpl-title">{cardTitle}</h2>
        {subText ? <p className="vs-tpl-subtitle">{subText}</p> : null}
      </div>

      <button
        type="button"
        className="vs-tpl-logo"
        title={chrome.brandMarkTitle}
        aria-label={chrome.brandMarkAria}
        onClick={onToggleLanguage}
      >
        <img src={chrome.brandImageSrc} alt={chrome.brandAlt} draggable={false} />
        <img className="vs-tpl-logo-reflection" src={chrome.brandImageSrc} alt="" aria-hidden="true" draggable={false} />
      </button>

      <div className="vs-tpl-body" style={bodyStyle}>
        <div
          className={layout.BODY_FRAME_CLASS}
          style={{ background: 'transparent', borderColor: 'var(--color-panel-border)', boxShadow: 'inset 0 0 0 1px rgba(255, 85, 78, 0.06), 0 10px 18px rgba(0, 0, 0, 0.18)' }}
        >
          <div className={layout.BODY_GRID_CLASS}>
            <div className={layout.PORTRAIT_FRAME_CLASS} style={{ background: 'transparent', borderColor: 'var(--color-panel-border)' }}>
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
            </div>

            <div className={layout.DETAILS_CARD_CLASS} style={{ background: 'transparent', borderColor: 'var(--color-panel-border)' }}>
              <div className={layout.NAME_PLATE_CLASS} style={{ background: 'transparent', borderColor: 'var(--color-panel-border)' }}>
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
                  <div key={`${fighterText}-${fact.title}-${index}`} className={layout.FACT_CARD_CLASS} style={{ background: 'rgba(255, 85, 78, 0.04)', borderColor: 'var(--color-panel-border)' }}>
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
  )
}
