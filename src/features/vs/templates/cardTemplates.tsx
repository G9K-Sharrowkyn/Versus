import { useEffect, useState } from 'react'
import { DEFAULT_WINNER_CV_A, DEFAULT_WINNER_CV_B, defaultFactsFor, pickLang } from '../presets'
import { TEMPLATE_BLOCK_ALIASES, buildCardFacts, buildTemplateImageEntries, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField, resolveFightTemplateImageUrl, type TemplateImageEntry } from '../importer'
import type { Fighter, Language, PortraitAdjust, TemplatePreviewProps } from '../types'
import { AdjustableTemplateImage } from '../components/AdjustableTemplateImage'

export function WinnerCvTemplate({
  fighterA,
  fighterB,
  averageA,
  averageB,
  title,
  subtitle,
  winsA,
  winsB,
  templateBlocks,
  activeFightFolderKey,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['winner-cv'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const archiveLabel = pickTemplateField(blockFields, ['archive_label']) || tr('ARCHIWUM', 'ARCHIVE')
  const avgLabel = pickTemplateField(blockFields, ['avg_label']) || tr('Średni wynik', 'Avg score')
  const winBadge = pickTemplateField(blockFields, ['win_badge']) || 'W'
  const fighterAText = fighterA.name || 'Fighter A'
  const fighterBText = fighterB.name || 'Fighter B'
  const leftTitle =
    pickTemplateField(blockFields, ['left_title']) ||
    `${tr('REKORD', 'RECORD')} ${fighterAText}`
  const rightTitle =
    pickTemplateField(blockFields, ['right_title']) ||
    `${tr('REKORD', 'RECORD')} ${fighterBText}`
  const leftWins = winsA.length ? winsA : DEFAULT_WINNER_CV_A
  const rightWins = winsB.length ? winsB : DEFAULT_WINNER_CV_B
  const leftEntries = buildTemplateImageEntries(blockFields, 'left', leftWins)
  const rightEntries = buildTemplateImageEntries(blockFields, 'right', rightWins)
  const pairCount = Math.max(1, leftEntries.length, rightEntries.length)
  const [pairIndex, setPairIndex] = useState(0)

  useEffect(() => {
    setPairIndex(0)
  }, [leftEntries.length, rightEntries.length, activeFightFolderKey])

  const nextPair = () => {
    if (pairCount <= 1) return
    setPairIndex((current) => (current + 1) % pairCount)
  }

  const leftEntry = leftEntries.length ? leftEntries[pairIndex % leftEntries.length] : null
  const rightEntry = rightEntries.length ? rightEntries[pairIndex % rightEntries.length] : null

  const renderColumn = (
    fighter: Fighter,
    columnTitle: string,
    entry: TemplateImageEntry | null,
    side: 'left' | 'right',
  ) => {
    const imageUrl = entry ? resolveFightTemplateImageUrl(activeFightFolderKey, entry.imageFile) : ''
    const adjustKey = `winner-cv:${side}:${entry?.id || 'empty'}`
    return (
      <div className="flex h-full min-h-0 flex-col rounded-xl border border-white/20 bg-black/28 p-3">
        <div
          className="rounded-lg border px-3 py-2"
          style={{ borderColor: `${fighter.color}88`, backgroundColor: `${fighter.color}18` }}
        >
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">{fighter.name || 'Fighter'}</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-[14px] uppercase tracking-[0.14em]" style={{ color: fighter.color }}>
              {columnTitle}
            </p>
            <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]" style={{ borderColor: `${fighter.color}88`, color: fighter.color }}>
              {pairCount} {tr('wpisow', 'entries')}
            </span>
          </div>
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2">
          <AdjustableTemplateImage
            imageUrl={imageUrl}
            alt={entry?.text || columnTitle}
            fallbackLabel={tr('Brak obrazu', 'No image')}
            hintLabel={tr('LPM: przesun | PPM: skaluj', 'LMB: move | RMB: zoom')}
            adjustKey={adjustKey}
            adjustments={slideImageAdjustments}
            onAdjustChange={onSlideImageAdjustChange}
            onAdjustCommit={onSlideImageAdjustCommit}
            onActivate={nextPair}
          />
          <div className="rounded-lg border border-slate-600/60 bg-slate-950/78 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: fighter.color }}>
                {winBadge} {String((pairIndex % pairCount) + 1).padStart(2, '0')}
              </p>
              <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                {avgLabel}: {(fighter === fighterA ? averageA : averageB).toFixed(1)}
              </span>
            </div>
            <p className="text-sm leading-snug text-slate-200">{entry?.text || tr('Brak wpisu.', 'No entry.')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-slate-400/25 pb-2">
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-300">{archiveLabel}</div>
        <h2 className="text-2xl uppercase tracking-[0.08em] text-slate-50">{headerText}</h2>
        <div className="text-right text-[11px] uppercase tracking-[0.18em] text-slate-300">{subText}</div>
      </div>

      <div className="mt-2 text-center text-[11px] uppercase tracking-[0.16em] text-slate-400">
        {tr('Kliknij obraz aby przejsc do kolejnej pary.', 'Click an image to switch to the next pair.')}
      </div>

      <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 gap-3">
        {renderColumn(fighterA, leftTitle, leftEntry, 'left')}
        {renderColumn(fighterB, rightTitle, rightEntry, 'right')}
      </div>
    </div>
  )
}

export function CharacterCardTemplate({
  title,
  fighter,
  portraitAdjust,
  portraitAdjustKey,
  fighterText,
  corner,
  facts,
  quote,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
}: {
  title: string
  fighter: Fighter
  portraitAdjust: PortraitAdjust
  portraitAdjustKey: string
  fighterText: string
  corner: string
  facts: ReadonlyArray<{ title: string; text: string }>
  quote: string
  slideImageAdjustments: Record<string, PortraitAdjust>
  onSlideImageAdjustChange: (imageKey: string, adjust: PortraitAdjust) => void
  onSlideImageAdjustCommit: (imageKey: string, adjust: PortraitAdjust) => void
  language: Language
}) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <h2 className="text-center text-[28px] uppercase tracking-[0.08em] text-slate-50 sm:text-[34px]">{title}</h2>
      <div
        className="mt-3 min-h-0 flex-1 rounded-xl border p-3"
        style={{ borderColor: `${fighter.color}88`, backgroundColor: `${fighter.color}14` }}
      >
        <div className="grid h-full grid-cols-[1.06fr_1.4fr] gap-3">
          <div className="relative overflow-hidden rounded-lg border bg-black/45" style={{ borderColor: `${fighter.color}88` }}>
            <AdjustableTemplateImage
              imageUrl={fighter.imageUrl}
              alt={fighterText}
              fallbackLabel={tr('Miejsce na portret', 'Portrait Slot')}
              hintLabel={tr('LPM: przesun | PPM: skaluj', 'LMB: move | RMB: zoom')}
              adjustKey={portraitAdjustKey}
              baseAdjust={portraitAdjust}
              adjustments={slideImageAdjustments}
              onAdjustChange={onSlideImageAdjustChange}
              onAdjustCommit={onSlideImageAdjustCommit}
              plain
            />
            <div className="pointer-events-none absolute inset-0 border-[3px] border-black/35" />
            <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:28px_28px]" />
            <div className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2" style={{ borderColor: `${fighter.color}AA` }} />
            <div className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2" style={{ borderColor: `${fighter.color}AA` }} />
            <div className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2" style={{ borderColor: `${fighter.color}AA` }} />
            <div className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2" style={{ borderColor: `${fighter.color}AA` }} />
          </div>

          <div className="flex h-full flex-col rounded-lg border border-white/20 bg-black/35 p-3">
            <div className="mb-2 rounded-md border border-white/20 bg-black/38 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300">{corner}</p>
              <h3 className="text-2xl uppercase leading-none" style={{ color: fighter.color }}>{fighterText}</h3>
              <p className="mt-1 text-sm text-slate-300">{fighter.subtitle}</p>
            </div>

            <div className="flex-1 space-y-1.5">
              {facts.map((fact) => (
                <div key={`${fighterText}-${fact.title}`} className="rounded-md border border-white/15 bg-black/28 px-3 py-1.5">
                  <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: fighter.color }}>{fact.title}</p>
                  <p className="mt-0.5 text-sm leading-tight text-slate-100">{fact.text}</p>
                </div>
              ))}
            </div>

            <p className="mt-2 text-lg italic leading-tight text-slate-100">"{quote}"</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CharacterCardATemplate({
  fighterA,
  portraitAAdjust,
  title,
  factsA,
  templateBlocks,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const fighterAText = fighterA.name || 'Fighter A'
  const safeFacts = factsA.length ? factsA : defaultFactsFor('a', language)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['character-card-a'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const fighterForCard = {
    ...fighterA,
    subtitle: pickTemplateField(blockFields, ['world', 'swiat', 'version']) || fighterA.subtitle,
  }
  const cardFacts = buildCardFacts(safeFacts, blockFields, language)
  const cardTitle = pickTemplateField(blockFields, ['header', 'title', 'headline']) || title
  const quote =
    pickTemplateField(blockFields, ['quote', 'cytat']) ||
    tr('Zawodnik kontrolujący tempo i dystans.', 'Fighter who controls pace and distance.')
  return (
    <CharacterCardTemplate
      title={cardTitle}
      fighter={fighterForCard}
      portraitAdjust={portraitAAdjust}
      portraitAdjustKey="character-card-a:portrait"
      fighterText={fighterAText}
      corner={tr('Niebieski narożnik', 'Blue corner')}
      facts={cardFacts}
      quote={quote}
      slideImageAdjustments={slideImageAdjustments}
      onSlideImageAdjustChange={onSlideImageAdjustChange}
      onSlideImageAdjustCommit={onSlideImageAdjustCommit}
      language={language}
    />
  )
}

export function CharacterCardBTemplate({
  fighterB,
  portraitBAdjust,
  title,
  factsB,
  templateBlocks,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const fighterBText = fighterB.name || 'Fighter B'
  const safeFacts = factsB.length ? factsB : defaultFactsFor('b', language)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['character-card-b'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const fighterForCard = {
    ...fighterB,
    subtitle: pickTemplateField(blockFields, ['world', 'swiat', 'version']) || fighterB.subtitle,
  }
  const cardFacts = buildCardFacts(safeFacts, blockFields, language)
  const cardTitle = pickTemplateField(blockFields, ['header', 'title', 'headline']) || title
  const quote =
    pickTemplateField(blockFields, ['quote', 'cytat']) ||
    tr('On nie szuka czystej walki. On szuka drogi do zniszczenia.', 'He does not seek a clean fight. He seeks destruction.')
  return (
    <CharacterCardTemplate
      title={cardTitle}
      fighter={fighterForCard}
      portraitAdjust={portraitBAdjust}
      portraitAdjustKey="character-card-b:portrait"
      fighterText={fighterBText}
      corner={tr('Czerwony narożnik', 'Red corner')}
      facts={cardFacts}
      quote={quote}
      slideImageAdjustments={slideImageAdjustments}
      onSlideImageAdjustChange={onSlideImageAdjustChange}
      onSlideImageAdjustCommit={onSlideImageAdjustCommit}
      language={language}
    />
  )
}
