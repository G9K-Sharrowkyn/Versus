import './TacticalBoardTemplate.css'
import type { ReactNode } from 'react'
import { iconForCategory } from '../../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { TemplatePreviewProps } from '../../types'
import { AnimeLightning } from '../../components/AnimeLightning'
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
  const xFactorLabel = getFightTemplateDefaultField('x-factor', 'factor', language) || 'X-FACTOR'

  const tiles = [
    ...rows.slice(0, 9),
    {
      id: 'x-factor',
      label: xFactorLabel,
      a: 0,
      b: 0,
      delta: 0,
      winner: 'draw' as const,
    },
  ]

  return (
    <div className="vs-tactical-board25-surface">
      <div className="vs-tb-signal-main">[ 0.000024] all systems drift-ready</div>
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
                  style={{
                    color: winnerColor,
                    overflow: 'visible',
                    whiteSpace: 'normal',
                    overflowWrap: 'normal',
                    wordBreak: 'normal',
                    hyphens: 'none',
                  }}
                />
              </div>
            )
          })}
        </div>
      </section>

      <div className="vs-tactical-board25-reality">
        <p className="vs-tactical-board25-reality-heading">{realityHeader}</p>
        <div className="vs-tactical-board25-reality-viewport">
          <AnimeLightning />
        </div>
      </div>
    </div>
  )
}
