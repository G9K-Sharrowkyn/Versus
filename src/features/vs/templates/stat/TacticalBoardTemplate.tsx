import './TacticalBoardTemplate.css'
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

  const linearSplitX = 52
  const chaosEndX = 90
  const stablePoints = `14,52 ${linearSplitX},52`

  const matchupMatch = matchupText.match(/^(.*?)(\s+VS\s+)(.*)$/i)

  return (
    <div className="vs-tactical-board25-surface">
      <div className="vs-tactical-board25-line" />
      {integratedToolbar ? <div className="vs-tactical-board25-toolbar">{integratedToolbar}</div> : null}

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
              <span className="vs-tactical-board25-matchup-a" style={{ color: fighterA.color }}>
                {matchupMatch[1].trim()}
              </span>
              <span className="vs-tactical-board25-matchup-separator">{matchupMatch[2]}</span>
              <span className="vs-tactical-board25-matchup-b" style={{ color: fighterB.color }}>
                {matchupMatch[3].trim()}
              </span>
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
        <img
          className="vs-tactical-board25-logo-reflection"
          src={chrome.brandImageSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      </button>

      <section className="vs-tactical-board25-stats">
        <p className="vs-tactical-board25-stats-title">{boardHeader}</p>
        <div className="vs-tactical-board25-stats-grid">
          {tiles.map((row, index) => {
            const Icon = iconForCategory(row.id, index)
            const isDraw = row.winner === 'draw'
            const winnerColor = isDraw ? '#f0e8e1' : row.winner === 'a' ? fighterA.color : fighterB.color

            return (
              <div key={row.id} className="vs-tactical-board25-item" style={{ ['--item-accent' as string]: winnerColor }}>
                <div className="vs-tactical-board25-item-icon">
                  <Icon size={28} color={winnerColor} />
                  <div className="vs-tactical-board25-item-icon-reflection" aria-hidden="true">
                    <Icon size={28} color={winnerColor} />
                  </div>
                </div>
                <FittedText
                  as="p"
                  slotKey={`tactical-board:tile:${row.id}`}
                  spec={slots.tacticalBoardTile}
                  text={row.label}
                  className="vs-tactical-board25-item-label"
                  style={{ color: winnerColor, overflow: 'visible' }}
                />
              </div>
            )
          })}
        </div>
      </section>

      <div className="vs-tactical-board25-reality">
        <div className="vs-tactical-board25-reality-heading">
          <span>{realityHeader}</span>
        </div>
        <div className="vs-tactical-board25-reality-labels" aria-hidden="true">
          <span className="vs-tactical-board25-reality-label vs-tactical-board25-reality-label--linear">
            {linearLabel}
          </span>
          <span className="vs-tactical-board25-reality-label vs-tactical-board25-reality-label--chaos">
            {chaosLabel}
          </span>
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
    </div>
  )
}
