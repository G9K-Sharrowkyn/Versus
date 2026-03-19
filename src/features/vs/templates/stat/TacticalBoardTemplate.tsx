import type { ReactNode } from 'react'
import { iconForCategory } from '../../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { TemplatePreviewProps } from '../../types'
import { LightningCanvas } from '../../components/LightningCanvas'
import { FittedText } from '../shared/FittedText'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../shared/templateUi'

const BOARD_COLUMN_TITLES = ['FORCE VECTOR', 'TACTIC ARRAY', 'ENDURANCE GRID']

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

const parseMetricPercent = (value: string, fallback: number) => {
  const match = String(value || '')
    .replace(',', '.')
    .match(/-?\d+(?:\.\d+)?/)
  if (!match) return clampPercent(fallback)
  return clampPercent(Number.parseFloat(match[0]))
}

type TacticalBoardTemplateProps = TemplatePreviewProps & {
  integratedToolbar?: ReactNode
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
  integratedToolbar,
}: TacticalBoardTemplateProps) {
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const chrome = buildFightTemplateChrome('tactical-board', language, blockFields)
  const ui = getTemplateUi(activeTemplateId, language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>

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

  const fighterAFallback = getFightTemplateDefaultField('tactical-board', 'fighter_a_fallback', language)
  const fighterBFallback = getFightTemplateDefaultField('tactical-board', 'fighter_b_fallback', language)
  const matchupText =
    pickTemplateField(blockFields, ['matchup', 'fighters', 'fight']) ||
    `${fighterA.name || fighterAFallback} VS ${fighterB.name || fighterBFallback}`

  const tiles = rows.slice(0, 9)
  const tileColumns = [
    tiles.slice(0, 3),
    tiles.slice(3, 6),
    tiles.slice(6, 9),
  ]

  const linearSplitX = 52
  const chaosEndX = 90
  const stablePoints = `14,52 ${linearSplitX},52`

  const averageA = clampPercent((tiles.reduce((sum, row) => sum + row.a, 0) / Math.max(tiles.length, 1)) * 10)
  const averageB = clampPercent((tiles.reduce((sum, row) => sum + row.b, 0) / Math.max(tiles.length, 1)) * 10)
  const threatPercent = parseMetricPercent(chrome.threatLevelValue, Math.max(averageA, averageB))
  const integrityPercent = parseMetricPercent(chrome.dataIntegrityValue, 100)

  const boardMetrics = [
    {
      key: 'fighter-a',
      label: fighterA.name || fighterAFallback,
      value: averageA,
      color: fighterA.color,
    },
    {
      key: 'threat',
      label: chrome.threatLevelLabel,
      value: threatPercent,
      color: '#ff8a7e',
    },
    {
      key: 'fighter-b',
      label: fighterB.name || fighterBFallback,
      value: averageB,
      color: fighterB.color,
    },
    {
      key: 'integrity',
      label: chrome.dataIntegrityLabel,
      value: integrityPercent,
      color: '#abe47d',
    },
  ]

  const matchupMatch = matchupText.match(/^(.*?)(\s+VS\s+)(.*)$/i)

  return (
    <div className="vs-tactical-board25-surface">
      <div className="vs-tactical-board25-topline" />
      {integratedToolbar}
      <div className="vs-tactical-board25-header">
        <div className="vs-tactical-board25-meta">
          <p>
            {chrome.threatLevelLabel}: <span>{chrome.threatLevelValue}</span>
          </p>
          <p>
            {chrome.dataIntegrityLabel}: <span>{chrome.dataIntegrityValue}</span>
          </p>
        </div>

        <div className="vs-tactical-board25-heading">
          <h2 className="vs-tactical-board25-title">{headerText}</h2>
          <p className="vs-tactical-board25-subtitle">{subText}</p>
          <div className="vs-tactical-board25-matchup">
            {matchupMatch ? (
              <>
                <span style={{ color: fighterA.color }}>{matchupMatch[1].trim()}</span>
                <span className="vs-tactical-board25-matchup-separator">{matchupMatch[2]}</span>
                <span style={{ color: fighterB.color }}>{matchupMatch[3].trim()}</span>
              </>
            ) : (
              matchupText
            )}
          </div>
        </div>

        <button
          type="button"
          className="vs-tactical-board25-logo"
          title={chrome.brandMarkTitle}
          aria-label={chrome.brandMarkAria}
          onClick={onToggleLanguage}
        >
          <img src={chrome.brandImageSrc} alt={chrome.brandAlt} draggable={false} />
        </button>
      </div>

      <div className="vs-tactical-board25-body">
        <section className="vs-tactical-board25-left">
          <div className="vs-tactical-board25-list-grid">
            {tileColumns.map((column, columnIndex) => (
              <div key={`column-${BOARD_COLUMN_TITLES[columnIndex]}`} className="vs-tactical-board25-list">
                <p className="vs-tactical-board25-list-title">{BOARD_COLUMN_TITLES[columnIndex]}</p>
                <div className="vs-tactical-board25-list-items">
                  {column.map((row, index) => {
                    const Icon = iconForCategory(row.id, columnIndex * 3 + index)
                    const isDraw = row.winner === 'draw'
                    const winnerColor = isDraw ? '#f0e8e1' : row.winner === 'a' ? fighterA.color : fighterB.color

                    return (
                      <div key={row.id} className="vs-tactical-board25-item" style={{ ['--item-accent' as string]: winnerColor }}>
                        <div className="vs-tactical-board25-item-icon">
                          <Icon size={22} color={winnerColor} />
                        </div>
                        <FittedText
                          as="p"
                          slotKey={`tactical-board:tile:${row.id}`}
                          spec={slots.tacticalBoardTile}
                          text={row.label}
                          className="vs-tactical-board25-item-label"
                          style={{ color: winnerColor }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="vs-tactical-board25-right">
          <div className="vs-tactical-board25-metrics">
            {boardMetrics.map((metric) => (
              <div key={metric.key} className="vs-tactical-board25-gauge-card">
                <div
                  className="vs-tactical-board25-gauge"
                  style={{
                    ['--gauge-color' as string]: metric.color,
                    ['--gauge-value' as string]: `${metric.value}%`,
                  }}
                >
                  <div className="vs-tactical-board25-gauge-core">
                    <strong>{metric.value}%</strong>
                  </div>
                </div>
                <p className="vs-tactical-board25-gauge-label">{metric.label}</p>
              </div>
            ))}
          </div>

          <div className="vs-tactical-board25-reality">
            <div className="vs-tactical-board25-reality-heading">
              <span>{realityHeader}</span>
            </div>
            <div className="vs-tactical-board25-reality-viewport">
              <LightningCanvas
                startRatio={{ x: linearSplitX / 100, y: 0.52 }}
                endRatio={{ x: 1.08, y: 0.52 }}
              />
              <svg viewBox="0 0 100 100" className="vs-tactical-board25-reality-svg">
                <line
                  x1={linearSplitX}
                  y1="10"
                  x2={linearSplitX}
                  y2="92"
                  stroke="rgba(255, 132, 118, 0.55)"
                  strokeWidth="0.8"
                  strokeDasharray="2.5 2.5"
                />
                <text
                  x="26"
                  y="18"
                  fill="#77e2f2"
                  fontSize="5.8"
                  fontFamily="'Chakra Petch', sans-serif"
                  fontWeight="700"
                  textAnchor="middle"
                  style={{ letterSpacing: '0.08em' }}
                >
                  {linearLabel}
                </text>
                <text
                  x="77"
                  y="18"
                  fill="#ff8a7e"
                  fontSize="5.8"
                  fontFamily="'Chakra Petch', sans-serif"
                  fontWeight="700"
                  textAnchor="middle"
                  style={{ letterSpacing: '0.08em' }}
                >
                  {chaosLabel}
                </text>
                <polyline
                  points={stablePoints}
                  fill="none"
                  stroke="#77e2f2"
                  strokeWidth="2.4"
                />
                <polyline
                  points={stablePoints}
                  fill="none"
                  stroke="rgba(119, 226, 242, 0.3)"
                  strokeWidth="4.6"
                />
                <line
                  x1={linearSplitX}
                  y1="52"
                  x2={chaosEndX}
                  y2="52"
                  stroke="rgba(255, 85, 78, 0.14)"
                  strokeWidth="1.3"
                />
              </svg>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
