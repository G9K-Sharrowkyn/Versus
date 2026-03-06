import { AdjustableTemplateImage } from '../../components/AdjustableTemplateImage'
import { useScopedCycleIndex } from '../../hooks/useScopedCycleIndex'
import { DEFAULT_WINNER_CV_A, DEFAULT_WINNER_CV_B, pickLang } from '../../presets'
import {
  TEMPLATE_BLOCK_ALIASES,
  buildTemplateImageEntries,
  findTemplateBlockLines,
  parseTemplateFieldMap,
  pickTemplateField,
  resolveFightTemplateImageUrl,
  type TemplateImageEntry,
} from '../../importer'
import type { Fighter, TemplatePreviewProps } from '../../types'
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
} from '../shared/highEnd'

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
  const leftTitle = pickTemplateField(blockFields, ['left_title']) || `${tr('REKORD', 'RECORD')} ${fighterAText}`
  const rightTitle = pickTemplateField(blockFields, ['right_title']) || `${tr('REKORD', 'RECORD')} ${fighterBText}`
  const leftWins = winsA.length ? winsA : DEFAULT_WINNER_CV_A
  const rightWins = winsB.length ? winsB : DEFAULT_WINNER_CV_B
  const leftEntries = buildTemplateImageEntries(blockFields, 'left', leftWins)
  const rightEntries = buildTemplateImageEntries(blockFields, 'right', rightWins)
  const pairCount = Math.max(1, leftEntries.length, rightEntries.length)
  const pairScope = `${activeFightFolderKey || 'standalone'}:${leftEntries.length}:${rightEntries.length}`
  const [pairIndex, nextPair] = useScopedCycleIndex(pairScope, pairCount)

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
      <div className={`flex h-full min-h-0 flex-col ${HIGH_END_FRAME_CLASS} p-3`}>
        <div className={`${HIGH_END_INSET_CLASS} px-3 py-2`} style={{ boxShadow: `0 0 0 1px ${fighter.color}33 inset` }}>
          <p className={HIGH_END_SMALL_TEXT_CLASS}>{fighter.name || 'Fighter'}</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-[14px] uppercase tracking-[0.14em]" style={{ color: fighter.color, fontFamily: 'var(--font-display)' }}>
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
          <div className={`${HIGH_END_CARD_CLASS} p-3`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className={HIGH_END_LABEL_CLASS} style={{ color: fighter.color }}>
                {winBadge} {String((pairIndex % pairCount) + 1).padStart(2, '0')}
              </p>
              <span className={HIGH_END_SMALL_TEXT_CLASS}>
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
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full flex-col">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-cyan-300/25 pb-2">
            <div className={HIGH_END_LABEL_CLASS}>{archiveLabel}</div>
            <h2 className={HIGH_END_HEADER_CLASS} style={{ fontFamily: 'var(--font-display)' }}>{headerText}</h2>
            <div className={`text-right ${HIGH_END_LABEL_CLASS}`}>{subText}</div>
          </div>

          <div className="mt-2 text-center text-[11px] uppercase tracking-[0.16em] text-slate-400">
            {tr('Kliknij obraz aby przejsc do kolejnej pary.', 'Click an image to switch to the next pair.')}
          </div>

          <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 gap-3">
            {renderColumn(fighterA, leftTitle, leftEntry, 'left')}
            {renderColumn(fighterB, rightTitle, rightEntry, 'right')}
          </div>
        </div>
      </div>
    </div>
  )
}
