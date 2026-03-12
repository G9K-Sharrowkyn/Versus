import { AdjustableTemplateImage } from '../../components/AdjustableTemplateImage'
import { buildFightTemplateChrome, getFightCommonCopy } from '../../fightManifest'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { TemplatePreviewProps } from '../../types'
import { FittedText } from '../shared/FittedText'
import {
  HIGH_END_BODY_GAP_CLASS,
  HIGH_END_CARD_CLASS,
  HIGH_END_FRAME_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_INSET_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HighEndTemplateHeader,
} from '../shared/highEnd'
import { TEMPLATE_SLOT_SPECS } from '../shared/templateSlotSpecs'

export function CharacterDossierBTemplate({
  fighterB,
  portraitBAdjust,
  title,
  factsB,
  templateBlocks,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const common = getFightCommonCopy(language)
  const fighterText = fighterB.name || 'Fighter B'
  const safeFacts = factsB.length
    ? factsB
    : [
        { title: common.style, text: common.emptyFieldLabel },
        { title: common.advantage, text: common.emptyFieldLabel },
        { title: common.mentality, text: common.emptyFieldLabel },
      ]
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['character-dossier-b'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const chrome = buildFightTemplateChrome(language, blockFields)
  const fighterForCard = {
    ...fighterB,
    subtitle: pickTemplateField(blockFields, ['world', 'swiat', 'version']) || fighterB.subtitle,
  }
  const cardFacts = safeFacts
  const cardTitle = (pickTemplateField(blockFields, ['header', 'title', 'headline']) || title)
    .replace(/\s*(?:(?:\/\/)|[|/-])\s*(?:NIEBIESKI|CZERWONY|BLUE|RED)\s*$/i, '')
    .trim()
  const subText = common.redCorner
  const fighterSubtitle = fighterForCard.subtitle
    .replace(/^\s*(?:NIEBIESKI|CZERWONY|BLUE|RED)\b\s*(?:(?:\/\/)|[|/-])?\s*/i, '')
    .trim()
  const quote = pickTemplateField(blockFields, ['quote', 'cytat']) || common.emptyFieldLabel

  return (
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full flex-col">
          <HighEndTemplateHeader
            chrome={chrome}
            headerText={cardTitle}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />
          <div
            className={`${HIGH_END_BODY_GAP_CLASS} min-h-0 flex-1 ${HIGH_END_FRAME_CLASS} p-3`}
            style={{ boxShadow: `0 0 0 1px ${fighterForCard.color}33 inset` }}
          >
            <div className="grid h-full grid-cols-[1.06fr_1.4fr] gap-3">
              <div className="relative overflow-hidden rounded-lg border bg-slate-950/80" style={{ borderColor: `${fighterForCard.color}88` }}>
                <AdjustableTemplateImage
                  imageUrl={fighterForCard.imageUrl}
                  alt={fighterText}
                  fallbackLabel={common.portraitSlot}
                  hintLabel={chrome.portraitAdjustHint}
                  adjustKey="character-dossier-b:portrait"
                  baseAdjust={portraitBAdjust}
                  adjustments={slideImageAdjustments}
                  onAdjustChange={onSlideImageAdjustChange}
                  onAdjustCommit={onSlideImageAdjustCommit}
                  plain
                />
                <div className="pointer-events-none absolute inset-0 border-[3px] border-black/35" />
                <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:28px_28px]" />
                <div className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2" style={{ borderColor: `${fighterForCard.color}AA` }} />
                <div className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2" style={{ borderColor: `${fighterForCard.color}AA` }} />
                <div className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2" style={{ borderColor: `${fighterForCard.color}AA` }} />
                <div className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2" style={{ borderColor: `${fighterForCard.color}AA` }} />
              </div>

              <div className={`flex h-full flex-col ${HIGH_END_CARD_CLASS} p-3`}>
                <div className={`mb-2 ${HIGH_END_INSET_CLASS} px-3 py-2`}>
                  <FittedText
                    as="h3"
                    slotKey={`character-dossier-b:name:${fighterText}`}
                    spec={TEMPLATE_SLOT_SPECS.heroName}
                    text={fighterText}
                    className="tracking-[0.02em]"
                    style={{ color: fighterForCard.color, fontFamily: 'var(--font-display)' }}
                  />
                  {fighterSubtitle ? (
                    <FittedText
                      as="p"
                      slotKey={`character-dossier-b:subtitle:${fighterSubtitle}`}
                      spec={TEMPLATE_SLOT_SPECS.heroSubtitle}
                      text={fighterSubtitle}
                      className="mt-1 text-slate-300"
                    />
                  ) : null}
                </div>

                <div className="flex-1 space-y-1.5">
                  {cardFacts.map((fact, index) => (
                    <div key={`${fighterText}-${fact.title}-${index}`} className="rounded-md border border-white/15 bg-black/28 px-3 py-1.5">
                      <FittedText
                        as="p"
                        slotKey={`character-dossier-b:fact-title:${index}`}
                        spec={TEMPLATE_SLOT_SPECS.factTitle}
                        text={fact.title}
                        style={{ color: fighterForCard.color }}
                      />
                      <FittedText
                        as="p"
                        slotKey={`character-dossier-b:fact-body:${index}`}
                        spec={TEMPLATE_SLOT_SPECS.factBody}
                        text={fact.text}
                        className="mt-0.5 text-slate-100"
                      />
                    </div>
                  ))}
                </div>

                <FittedText
                  as="p"
                  slotKey="character-dossier-b:quote"
                  spec={TEMPLATE_SLOT_SPECS.quoteBody}
                  text={`"${quote}"`}
                  className="mt-2 italic text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
