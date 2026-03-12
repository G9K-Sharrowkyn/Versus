import { buildFightTemplateChrome, getFightTemplateDefaultField } from '../../fightManifest'
import { iconForCategory } from '../../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { TemplatePreviewProps } from '../../types'
import { LightningCanvas } from '../../components/LightningCanvas'
import { FittedText } from '../shared/FittedText'
import {
  HIGH_END_BODY_GAP_CLASS,
  HIGH_END_FRAME_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_LABEL_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HighEndTemplateHeader,
} from '../shared/highEnd'
import { TEMPLATE_SLOT_SPECS } from '../shared/templateSlotSpecs'

export function TacticalBoardTemplate({
  rows,
  fighterA,
  fighterB,
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const chrome = buildFightTemplateChrome(language, blockFields)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const boardHeader =
    pickTemplateField(blockFields, ['left_header', 'categories_header']) ||
    getFightTemplateDefaultField('tactical-board', 'left_header', language)
  const realityHeader =
    pickTemplateField(blockFields, ['right_header', 'reality_header']) ||
    getFightTemplateDefaultField('tactical-board', 'right_header', language)
  const linearLabel =
    pickTemplateField(blockFields, ['linear_label']) ||
    getFightTemplateDefaultField('tactical-board', 'linear_label', language)
  const chaosLabel =
    pickTemplateField(blockFields, ['chaos_label']) ||
    getFightTemplateDefaultField('tactical-board', 'chaos_label', language)
  const fallbackMatchup = `${fighterA.name || 'Fighter A'} VS ${fighterB.name || 'Fighter B'}`
  const matchupText = pickTemplateField(blockFields, ['matchup', 'fighters', 'fight']) || fallbackMatchup
  const tiles = rows.slice(0, 9)
  const splitX = 50
  const linearStartX = 8
  const chaosEndX = 92
  const stablePoints = `${linearStartX},50 ${splitX},50`
  const linearLabelX = 25
  const chaosLabelX = 75
  const matchupSupplement = matchupText ? (
    <FittedText
      as="p"
      slotKey={`tactical-board:matchup:${matchupText}`}
      spec={TEMPLATE_SLOT_SPECS.matchupSupplement}
      text={matchupText}
      className="mt-1 text-cyan-100"
      style={{ fontFamily: 'var(--font-display)' }}
    />
  ) : null

  return (
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full min-h-0 flex-col">
          <HighEndTemplateHeader
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            centerSupplement={matchupSupplement}
            onToggleLanguage={onToggleLanguage}
          />

          <div className={`${HIGH_END_BODY_GAP_CLASS} grid min-h-0 flex-1 grid-cols-2 gap-3`}>
            <div className={`flex min-h-0 flex-col ${HIGH_END_FRAME_CLASS} p-3`}>
              <p className={`mb-2 ${HIGH_END_LABEL_CLASS}`}>{boardHeader}</p>
              <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
                {tiles.map((row, index) => {
                  const Icon = iconForCategory(row.id, index)
                  const isDraw = row.winner === 'draw'
                  const winnerColor = isDraw ? '#E2E8F0' : row.winner === 'a' ? fighterA.color : fighterB.color

                  return (
                    <div key={`tile-${row.id}`} className="relative rounded-lg border border-slate-500/45 bg-slate-900/75 p-2">
                      <div className="mb-2 flex items-center justify-center rounded-md border border-slate-600/60 bg-black/35 py-2">
                        <Icon size={31} color={winnerColor} />
                      </div>
                      <div className="flex min-h-[56px] items-center justify-center rounded-md border border-slate-600/45 bg-black/25 px-1">
                        <FittedText
                          as="p"
                          slotKey={`tactical-board:tile:${row.id}`}
                          spec={TEMPLATE_SLOT_SPECS.tacticalBoardTile}
                          text={row.label}
                          className="font-semibold tracking-[0.04em]"
                          style={{ color: winnerColor, width: '100%' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className={`flex min-h-0 flex-col ${HIGH_END_FRAME_CLASS} p-3`}>
              <p className={HIGH_END_LABEL_CLASS}>{realityHeader}</p>
              <div className="mt-2 min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-600/55 bg-slate-950/65 p-2">
                <div className="relative -m-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] overflow-hidden rounded-lg">
                  <LightningCanvas
                    startRatio={{ x: splitX / 100, y: 0.5 }}
                    endRatio={{ x: Math.min(1.34, chaosEndX / 100 + 0.42), y: 0.5 }}
                  />
                  <svg viewBox="0 0 100 100" className="relative z-10 h-full w-full">
                    <line x1={splitX} y1="8" x2={splitX} y2="92" stroke="rgba(148,163,184,0.35)" strokeWidth="0.7" strokeDasharray="2 2" />
                    <text
                      x={linearLabelX}
                      y="14"
                      fill="#67e8f9"
                      fontSize="4"
                      fontFamily="var(--font-ui)"
                      fontWeight="600"
                      textAnchor="middle"
                      style={{ letterSpacing: '0.04em' }}
                    >
                      {linearLabel}
                    </text>
                    <text
                      x={chaosLabelX}
                      y="14"
                      fill="#fda4af"
                      fontSize="4"
                      fontFamily="var(--font-ui)"
                      fontWeight="600"
                      textAnchor="middle"
                      style={{ letterSpacing: '0.04em' }}
                    >
                      {chaosLabel}
                    </text>
                    <polyline points={stablePoints} fill="none" stroke="#22d3ee" strokeWidth="1.7" />
                    <polyline points={stablePoints} fill="none" stroke="rgba(34,211,238,0.3)" strokeWidth="3.2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
