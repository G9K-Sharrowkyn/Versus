import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { fighterMonogram } from '../../../helpers'
import { FittedText } from '../../shared/FittedText'
import { HighEndTemplateHeader } from '../../shared/highEnd'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'

export function VerdictMatrixTemplate({
  fighterA,
  fighterB,
  title,
  subtitle,
  templateBlocks,
  activeFightId,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const common = getFightCommonCopy('verdict-matrix', language)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['verdict-matrix'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome('verdict-matrix', language, blockFields)
  const ui = getTemplateUi('verdict-matrix', language)
  const shell = ui.highEnd as Record<string, string>
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string | number>

  const line = (position: number, keys: string[], fallback = common.emptyFieldLabel) =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback

  const headerText = title || 'MATRYCA WERDYKTU'
  const subText = pickTemplateField(blockFields, ['subtitle', 'note']) || subtitle

  const col1 = pickTemplateField(blockFields, ['col_1', 'col1'])
  const col2 = pickTemplateField(blockFields, ['col_2', 'col2'])
  const hasColumns = Boolean(col1 || col2)

  const rowsList = [
    pickTemplateField(blockFields, ['row_1', 'row1']) || 'SCENARIUSZ A',
    pickTemplateField(blockFields, ['row_2', 'row2']) || 'SCENARIUSZ B',
  ]

  const cells = [
    { body: pickTemplateField(blockFields, ['case_1', 'verdict', 'case1']) || plainLines[0], mark: fighterMonogram(fighterA.name) },
    { body: pickTemplateField(blockFields, ['case_2', 'case2']) || plainLines[1], mark: fighterMonogram(fighterB.name) },
    { body: pickTemplateField(blockFields, ['case_3', 'case3']) || plainLines[2], mark: fighterMonogram(fighterA.name) },
    { body: pickTemplateField(blockFields, ['case_4', 'case4']) || plainLines[3], mark: fighterMonogram(fighterB.name) },
  ]

  const effectiveColCount = hasColumns ? 2 : 1
  const gridColsClass = hasColumns ? 'grid-cols-[120px_1fr_1fr]' : 'grid-cols-[120px_1fr]'

  return (
    <div className={shell.HIGH_END_ROOT_CLASS}>
      <div className={shell.HIGH_END_PANEL_CLASS}>
        <div className={shell.HIGH_END_GRID_OVERLAY_CLASS} />
        <div className={layout.INNER_CLASS as string}>
          <HighEndTemplateHeader
            templateId="verdict-matrix"
            language={language}
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />

          <div className={`${shell.HIGH_END_BODY_GAP_CLASS} flex flex-1 flex-col justify-center px-12 pb-8`}>
            <div className={`grid ${gridColsClass} overflow-hidden rounded-xl border border-cyan-300/45 bg-slate-950/40 shadow-2xl`}>
              {/* Nagłówki Kolumn */}
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
                  <FittedText as="p" slotKey="verdict-matrix:verdict-label" spec={slots.verdictMatrixHeader} text="ANALIZA WARIANTÓW" className="font-bold text-cyan-200" />
                </div>
              )}

              {/* Nagłówki Wierszy i Komórki */}
              {rowsList.map((row, r) => (
                <Fragment key={`row-group-${r}`}>
                  <div className={`relative border ${hasColumns || r > 0 ? 'border-t-0' : ''} border-cyan-300/45 bg-slate-900/72 min-h-[200px]`}>
                    <div className="absolute left-1/2 top-1/2 w-[240px] -translate-x-1/2 -translate-y-1/2 -rotate-90">
                      <FittedText as="p" slotKey={`verdict-matrix:row-${r}`} spec={slots.verdictMatrixRowHeader} text={row} className="text-center text-slate-100 font-bold" />
                    </div>
                  </div>
                  {Array.from({ length: effectiveColCount }, (_, c) => {
                    const cellIdx = r * effectiveColCount + c
                    const cell = cells[cellIdx]
                    if (!cell?.body) return <div key={`empty-${cellIdx}`} className="border-b border-l border-cyan-300/45 bg-slate-900/20" />

                    return (
                      <div
                        key={`cell-${cellIdx}`}
                        className="relative flex flex-col items-center justify-center border border-l-0 border-t-0 border-cyan-300/45 bg-slate-900/40 p-4 text-center"
                      >
                        <FittedText
                          as="p"
                          slotKey={`verdict-matrix:cell-body-${cellIdx}`}
                          spec={slots.verdictMatrixBody}
                          text={cell.body}
                          className="relative z-10 text-slate-200"
                        />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[120px] font-bold text-white/5">{cell.mark}</div>
                      </div>
                    )
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { Fragment } from 'react'
