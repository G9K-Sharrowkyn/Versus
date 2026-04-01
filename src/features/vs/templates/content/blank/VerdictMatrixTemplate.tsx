import '../../shared/theme.css'
import { Fragment } from 'react'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { fighterMonogram } from '../../../helpers'
import { FittedText } from '../../shared/FittedText'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplatePreset as getFightTemplatePreset,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'

export function VerdictMatrixTemplate({
  fighterA,
  fighterB,
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const common = getFightCommonCopy('verdict-matrix', language)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['verdict-matrix'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome('verdict-matrix', language, blockFields)
  const ui = getTemplateUi('verdict-matrix', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const templatePreset = getFightTemplatePreset('verdict-matrix', language)

  const headerText =
    pickTemplateField(blockFields, ['headline', 'header', 'title']) ||
    title ||
    templatePreset.title ||
    common.verdictLabel
  const subText = pickTemplateField(blockFields, ['subtitle', 'note']) || subtitle

  const col1 =
    pickTemplateField(blockFields, ['col_1', 'col1']) ||
    getFightTemplateDefaultField('verdict-matrix', 'col_left', language)
  const col2 =
    pickTemplateField(blockFields, ['col_2', 'col2']) ||
    getFightTemplateDefaultField('verdict-matrix', 'col_right', language)
  const hasColumns = Boolean(col1 || col2)

  const rowTopFallback =
    getFightTemplateDefaultField('verdict-matrix', 'row_top', language) ||
    common.verdictLabel
  const rowBottomFallback =
    getFightTemplateDefaultField('verdict-matrix', 'row_bottom', language) ||
    common.verdictLabel
  const rowsList = [
    pickTemplateField(blockFields, ['row_1', 'row1']) || rowTopFallback,
    pickTemplateField(blockFields, ['row_2', 'row2']) || rowBottomFallback,
  ]

  const resolveWinnerSide = (text: string) => {
    if (!text) return null
    const lowerText = text.toLowerCase()
    const nameA = fighterA.name.toLowerCase()
    const nameB = fighterB.name.toLowerCase()
    const posA = lowerText.indexOf(nameA)
    const posB = lowerText.indexOf(nameB)
    if (posA !== -1 && (posB === -1 || posA < posB)) return 'a'
    if (posB !== -1 && (posA === -1 || posB < posA)) return 'b'
    return null
  }

  const cellData = [
    pickTemplateField(blockFields, ['case_1', 'verdict', 'case1']) || plainLines[0],
    pickTemplateField(blockFields, ['case_2', 'case2']) || plainLines[1],
    pickTemplateField(blockFields, ['case_3', 'case3']) || plainLines[2],
    pickTemplateField(blockFields, ['case_4', 'case4']) || plainLines[3],
  ]

  const effectiveColCount = hasColumns ? 2 : 1
  const gridColsClass = hasColumns ? 'grid-cols-[120px_1fr_1fr]' : 'grid-cols-[120px_1fr]'

  const matchupText = `${fighterA.name} VS ${fighterB.name}`
  const matchupMatch = matchupText.match(/^(.*?)(\s+VS\s+)(.*)$/i)

  return (
    <div className="vs-tpl-surface">
      <div className="vs-tpl-meta">
        <p>{chrome.threatLevelLabel}: <span>{chrome.threatLevelValue}</span></p>
        <p>{chrome.dataIntegrityLabel}: <span>{chrome.dataIntegrityValue}</span></p>
      </div>

      <div className="vs-tpl-heading">
        <h2 className="vs-tpl-title">{headerText}</h2>
        {subText ? <p className="vs-tpl-subtitle">{subText}</p> : null}
        <div className="vs-tpl-matchup">
          {matchupMatch ? (
            <>
              <span className="vs-tpl-matchup-a" style={{ color: fighterA.color }}>{matchupMatch[1].trim()}</span>
              <span className="vs-tpl-matchup-sep">{matchupMatch[2]}</span>
              <span className="vs-tpl-matchup-b" style={{ color: fighterB.color }}>{matchupMatch[3].trim()}</span>
            </>
          ) : matchupText}
        </div>
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

      <div className="vs-tpl-body" style={{ justifyContent: 'center', padding: `0 calc(1rem * var(--scale))` }}>
        <div className={`grid ${gridColsClass} overflow-hidden rounded-xl border border-cyan-300/45 bg-slate-950/40 shadow-2xl`}>
          {/* Column headers */}
          <div className="border-b border-r border-cyan-300/45 bg-slate-900/80" />
          {hasColumns ? (
            <>
              <div className="border-b border-cyan-300/45 bg-slate-900/80 p-4 text-center">
                <FittedText as="p" slotKey="verdict-matrix:col-1" spec={slots.verdictMatrixHeader} text={col1 || ''} className="font-bold text-cyan-200" />
              </div>
              <div className="border-b border-l border-cyan-300/45 bg-slate-900/80 p-4 text-center">
                <FittedText as="p" slotKey="verdict-matrix:col-2" spec={slots.verdictMatrixHeader} text={col2 || ''} className="font-bold text-cyan-200" />
              </div>
            </>
          ) : (
            <div className="border-b border-cyan-300/45 bg-slate-900/80 p-4 text-center">
              <FittedText as="p" slotKey="verdict-matrix:verdict-label" spec={slots.verdictMatrixHeader} text={common.verdictLabel} className="font-bold text-cyan-200" />
            </div>
          )}

          {rowsList.map((row, r) => (
            <Fragment key={`row-group-${r}`}>
              <div className={`relative border ${hasColumns || r > 0 ? 'border-t-0' : ''} border-cyan-300/45 bg-slate-900/72 min-h-[200px]`}>
                <div className="absolute left-1/2 top-1/2 w-[240px] -translate-x-1/2 -translate-y-1/2 -rotate-90">
                  <FittedText as="p" slotKey={`verdict-matrix:row-${r}`} spec={slots.verdictMatrixRowHeader} text={row} className="text-center text-slate-100 font-bold" />
                </div>
              </div>
              {Array.from({ length: effectiveColCount }, (_, c) => {
                const cellIdx = r * effectiveColCount + c
                const body = cellData[cellIdx]
                if (!body) return <div key={`empty-${cellIdx}`} className="border-b border-l border-cyan-300/45 bg-slate-900/20" />

                const winnerSide = resolveWinnerSide(body)
                const mark = winnerSide === 'a' ? fighterMonogram(fighterA.name) : (winnerSide === 'b' ? fighterMonogram(fighterB.name) : '')
                const accentColor = winnerSide === 'a' ? fighterA.color : (winnerSide === 'b' ? fighterB.color : 'rgba(255,255,255,0.1)')

                return (
                  <div
                    key={`cell-${cellIdx}`}
                    className="relative flex flex-col items-center justify-center border border-l-0 border-t-0 p-4 text-center transition-colors duration-500"
                    style={{
                      borderColor: winnerSide ? `${accentColor}88` : 'rgba(34,211,238,0.45)',
                      background: winnerSide
                        ? `linear-gradient(145deg, ${accentColor}44, rgba(15,23,42,0.85))`
                        : 'rgba(15,23,42,0.4)',
                      boxShadow: winnerSide ? `inset 0 0 30px ${accentColor}22` : 'none'
                    }}
                  >
                    <FittedText
                      as="p"
                      slotKey={`verdict-matrix:cell-body-${cellIdx}`}
                      spec={slots.verdictMatrixBody}
                      text={body}
                      className="relative z-10 text-slate-100 font-medium"
                    />
                    <div
                      className="pointer-events-none absolute inset-0 flex items-center justify-center text-[120px] font-bold transition-opacity duration-500"
                      style={{ color: accentColor, opacity: 0.12 }}
                    >
                      {mark}
                    </div>
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
