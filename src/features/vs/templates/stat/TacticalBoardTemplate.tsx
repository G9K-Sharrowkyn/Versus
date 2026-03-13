import { iconForCategory } from '../../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { TemplatePreviewProps } from '../../types'
import { LightningCanvas } from '../../components/LightningCanvas'
import { FittedText } from '../shared/FittedText'
import { HighEndTemplateHeader } from '../shared/highEnd'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../shared/templateUi'

type TacticalBoardLayout = {
  MATCHUP_SUPPLEMENT_CLASS: string
  MATCHUP_SUPPLEMENT_STYLE: {
    fontFamily: string
  }
  MATCHUP_SEPARATOR_CLASS: string
  INNER_CLASS: string
  BODY_CLASS: string
  BOARD_PANEL_CLASS: string
  BOARD_HEADER_CLASS: string
  BOARD_GRID_CLASS: string
  TILE_CLASS: string
  TILE_ICON_WRAP_CLASS: string
  TILE_LABEL_WRAP_CLASS: string
  TILE_TEXT_CLASS: string
  TILE_ICON_SIZE: number
  REALITY_PANEL_CLASS: string
  REALITY_HEADER_CLASS: string
  REALITY_VIEWPORT_CLASS: string
  REALITY_CANVAS_CLASS: string
  SVG_VIEWBOX: string
  SVG_CLASS: string
  SPLIT_X: number
  LINEAR_START_X: number
  CHAOS_END_X: number
  LIGHTNING_EXTENSION: number
  LINEAR_LABEL_X: number
  CHAOS_LABEL_X: number
  DIVIDER: {
    y1: number
    y2: number
    stroke: string
    strokeWidth: number
    strokeDasharray: string
  }
  LINEAR_LABEL: {
    y: number
    fill: string
    fontSize: string
    fontFamily: string
    fontWeight: string
    textAnchor: string
    letterSpacing: string
  }
  CHAOS_LABEL: {
    y: number
    fill: string
    fontSize: string
    fontFamily: string
    fontWeight: string
    textAnchor: string
    letterSpacing: string
  }
  STABLE_LINE: {
    stroke: string
    strokeWidth: number
  }
  GLOW_LINE: {
    stroke: string
    strokeWidth: number
  }
}

export function TacticalBoardTemplate({
  activeTemplateId,
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
  const chrome = buildFightTemplateChrome('tactical-board', language, blockFields)
  const ui = getTemplateUi(activeTemplateId, language)
  const shell = ui.highEnd as Record<string, string>
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as unknown as TacticalBoardLayout
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
  const fallbackMatchup = `${fighterA.name || getFightTemplateDefaultField('tactical-board', 'fighter_a_fallback', language)} VS ${fighterB.name || getFightTemplateDefaultField('tactical-board', 'fighter_b_fallback', language)}`
  const matchupText = pickTemplateField(blockFields, ['matchup', 'fighters', 'fight']) || fallbackMatchup
  const matchupMatch = matchupText.match(/^(.*?)(\s+VS\s+)(.*)$/i)
  const tiles = rows.slice(0, 9)
  const splitX = layout.SPLIT_X
  const linearStartX = layout.LINEAR_START_X
  const chaosEndX = layout.CHAOS_END_X
  const stablePoints = `${linearStartX},50 ${splitX},50`
  const linearLabelX = layout.LINEAR_LABEL_X
  const chaosLabelX = layout.CHAOS_LABEL_X
  const matchupSupplement = matchupText ? (
    <FittedText
      as="p"
      slotKey={`tactical-board:matchup:${matchupText}`}
      spec={slots.matchupSupplement}
      text={matchupText}
      className={layout.MATCHUP_SUPPLEMENT_CLASS}
      style={layout.MATCHUP_SUPPLEMENT_STYLE}
    >
      {matchupMatch ? (
        <>
          <span style={{ color: fighterA.color }}>{matchupMatch[1].trim()}</span>
          <span className={layout.MATCHUP_SEPARATOR_CLASS}>{matchupMatch[2]}</span>
          <span style={{ color: fighterB.color }}>{matchupMatch[3].trim()}</span>
        </>
      ) : (
        matchupText
      )}
    </FittedText>
  ) : null

  return (
    <div className={shell.HIGH_END_ROOT_CLASS}>
      <div className={shell.HIGH_END_PANEL_CLASS}>
        <div className={shell.HIGH_END_GRID_OVERLAY_CLASS} />
        <div className={layout.INNER_CLASS}>
          <HighEndTemplateHeader
            templateId={activeTemplateId}
            language={language}
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            centerSupplement={matchupSupplement}
            onToggleLanguage={onToggleLanguage}
          />

          <div className={layout.BODY_CLASS}>
            <div className={layout.BOARD_PANEL_CLASS}>
              <p className={layout.BOARD_HEADER_CLASS}>{boardHeader}</p>
              <div className={layout.BOARD_GRID_CLASS}>
                {tiles.map((row, index) => {
                  const Icon = iconForCategory(row.id, index)
                  const isDraw = row.winner === 'draw'
                  const winnerColor = isDraw ? '#E2E8F0' : row.winner === 'a' ? fighterA.color : fighterB.color

                  return (
                    <div key={`tile-${row.id}`} className={layout.TILE_CLASS}>
                      <div className={layout.TILE_ICON_WRAP_CLASS}>
                        <Icon size={layout.TILE_ICON_SIZE} color={winnerColor} />
                      </div>
                      <div className={layout.TILE_LABEL_WRAP_CLASS}>
                        <FittedText
                          as="p"
                          slotKey={`tactical-board:tile:${row.id}`}
                          spec={slots.tacticalBoardTile}
                          text={row.label}
                          className={layout.TILE_TEXT_CLASS}
                          style={{ color: winnerColor }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className={layout.REALITY_PANEL_CLASS}>
              <p className={layout.REALITY_HEADER_CLASS}>{realityHeader}</p>
              <div className={layout.REALITY_VIEWPORT_CLASS}>
                <div className={layout.REALITY_CANVAS_CLASS}>
                  <LightningCanvas
                    startRatio={{ x: splitX / 100, y: 0.5 }}
                    endRatio={{ x: Math.min(1.34, chaosEndX / 100 + layout.LIGHTNING_EXTENSION), y: 0.5 }}
                  />
                  <svg viewBox={layout.SVG_VIEWBOX} className={layout.SVG_CLASS}>
                    <line
                      x1={splitX}
                      y1={layout.DIVIDER.y1}
                      x2={splitX}
                      y2={layout.DIVIDER.y2}
                      stroke={layout.DIVIDER.stroke}
                      strokeWidth={layout.DIVIDER.strokeWidth}
                      strokeDasharray={layout.DIVIDER.strokeDasharray}
                    />
                    <text
                      x={linearLabelX}
                      y={layout.LINEAR_LABEL.y}
                      fill={layout.LINEAR_LABEL.fill}
                      fontSize={layout.LINEAR_LABEL.fontSize}
                      fontFamily={layout.LINEAR_LABEL.fontFamily}
                      fontWeight={layout.LINEAR_LABEL.fontWeight}
                      textAnchor={layout.LINEAR_LABEL.textAnchor as 'middle'}
                      style={{ letterSpacing: layout.LINEAR_LABEL.letterSpacing }}
                    >
                      {linearLabel}
                    </text>
                    <text
                      x={chaosLabelX}
                      y={layout.CHAOS_LABEL.y}
                      fill={layout.CHAOS_LABEL.fill}
                      fontSize={layout.CHAOS_LABEL.fontSize}
                      fontFamily={layout.CHAOS_LABEL.fontFamily}
                      fontWeight={layout.CHAOS_LABEL.fontWeight}
                      textAnchor={layout.CHAOS_LABEL.textAnchor as 'middle'}
                      style={{ letterSpacing: layout.CHAOS_LABEL.letterSpacing }}
                    >
                      {chaosLabel}
                    </text>
                    <polyline
                      points={stablePoints}
                      fill="none"
                      stroke={layout.STABLE_LINE.stroke}
                      strokeWidth={layout.STABLE_LINE.strokeWidth}
                    />
                    <polyline
                      points={stablePoints}
                      fill="none"
                      stroke={layout.GLOW_LINE.stroke}
                      strokeWidth={layout.GLOW_LINE.strokeWidth}
                    />
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
