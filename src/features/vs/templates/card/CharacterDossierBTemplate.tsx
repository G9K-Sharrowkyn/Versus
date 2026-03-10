import { AdjustableTemplateImage } from '../../components/AdjustableTemplateImage'
import { buildFightTemplateChrome, getFightCommonCopy, getFightTemplateDefaultField } from '../../fightManifest'
import { defaultFactsFor } from '../../presets'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { TemplatePreviewProps } from '../../types'
import {
  HIGH_END_CARD_CLASS,
  HIGH_END_FRAME_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_HEADER_CLASS,
  HIGH_END_INSET_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HIGH_END_SUBTEXT_CLASS,
} from '../shared/highEnd'

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
  const safeFacts = factsB.length ? factsB : defaultFactsFor('b', language)
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
  const subText =
    pickTemplateField(blockFields, ['corner_label']) ||
    getFightTemplateDefaultField('character-dossier-b', 'corner_label', language)
  const fighterSubtitle = fighterForCard.subtitle
    .replace(/^\s*(?:NIEBIESKI|CZERWONY|BLUE|RED)\b\s*(?:(?:\/\/)|[|/-])?\s*/i, '')
    .trim()
  const quote =
    pickTemplateField(blockFields, ['quote', 'cytat']) ||
    getFightTemplateDefaultField('character-dossier-b', 'quote', language)

  return (
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full flex-col">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 border-b border-cyan-300/25 pb-3 text-[11px] text-slate-300">
            <div className="min-w-[238px] space-y-1 pt-2 text-left">
              <p className="whitespace-nowrap uppercase tracking-[0.16em]">{chrome.threatLevelLabel}: {chrome.threatLevelValue}</p>
              <p className="whitespace-nowrap uppercase tracking-[0.16em]">{chrome.dataIntegrityLabel}: {chrome.dataIntegrityValue}</p>
            </div>
            <div className="flex min-h-[108px] flex-col items-center justify-start text-center">
              <h2 className={HIGH_END_HEADER_CLASS} style={{ fontFamily: 'var(--font-display)' }}>
                {cardTitle}
              </h2>
              {subText ? <p className={HIGH_END_SUBTEXT_CLASS}>{subText}</p> : null}
            </div>
            <div className="flex items-start justify-end pt-1">
              <button
                type="button"
                className="flex h-[86px] aspect-[755/322] items-center justify-center overflow-hidden rounded-[14px] border border-cyan-300/35 bg-[linear-gradient(180deg,rgba(7,24,42,0.96),rgba(4,14,24,0.94))] p-0 shadow-[0_0_0_1px_rgba(125,211,252,0.08)_inset,0_10px_26px_rgba(2,8,23,0.45)] cursor-pointer transition-transform active:scale-95"
                title={chrome.brandMarkTitle}
                aria-label={chrome.brandMarkAria}
                onClick={onToggleLanguage}
              >
                <img src={chrome.brandImageSrc} alt={chrome.brandAlt} className="h-full w-full object-contain drop-shadow-[0_0_14px_rgba(251,146,60,0.28)]" draggable={false} />
              </button>
            </div>
          </div>
          <div
            className={`mt-3 min-h-0 flex-1 ${HIGH_END_FRAME_CLASS} p-3`}
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
                  <h3 className="text-2xl uppercase leading-none" style={{ color: fighterForCard.color, fontFamily: 'var(--font-display)' }}>
                    {fighterText}
                  </h3>
                  {fighterSubtitle ? <p className="mt-1 text-sm text-slate-300">{fighterSubtitle}</p> : null}
                </div>

                <div className="flex-1 space-y-1.5">
                  {cardFacts.map((fact) => (
                    <div key={`${fighterText}-${fact.title}`} className="rounded-md border border-white/15 bg-black/28 px-3 py-1.5">
                      <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: fighterForCard.color }}>
                        {fact.title}
                      </p>
                      <p className="mt-0.5 text-sm leading-tight text-slate-100">{fact.text}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-2 text-lg italic leading-tight text-slate-100">"{quote}"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
