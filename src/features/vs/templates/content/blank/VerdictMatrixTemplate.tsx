import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { fighterMonogram } from '../../../helpers'
import { FittedText } from '../../shared/FittedText'
import { HighEndTemplateHeader } from '../../shared/highEnd'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
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
  const fighterAName = fighterA.name || getFightTemplateDefaultField('verdict-matrix', 'fighter_a_fallback', language)
  const fighterBName = fighterB.name || getFightTemplateDefaultField('verdict-matrix', 'fighter_b_fallback', language)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['verdict-matrix'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome('verdict-matrix', language, blockFields)
  const ui = getTemplateUi('verdict-matrix', language)
  const shell = ui.highEnd as Record<string, string>
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle

  // Dynamiczne zbieranie nagłówków i przypadków
  const columns = [
    pickTemplateField(blockFields, ['col_1', 'col_left', 'column_1']),
    pickTemplateField(blockFields, ['col_2', 'col_right', 'column_2']),
    pickTemplateField(blockFields, ['col_3', 'column_3']),
  ].filter(Boolean) as string[]

  const rowsList = [
    pickTemplateField(blockFields, ['row_1', 'row_top', 'row_1']),
    pickTemplateField(blockFields, ['row_2', 'row_bottom', 'row_2']),
    pickTemplateField(blockFields, ['row_3', 'row_3']),
  ].filter(Boolean) as string[]

  const singleVerdict = pickTemplateField(blockFields, ['verdict', 'final_verdict', 'single_case'])

  const normalizeName = (value: string) =>
    value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase().trim()
  
  const fighterAKey = normalizeName(fighterAName)
  const fighterBKey = normalizeName(fighterBName)
  const winnerBlueBackground = String(layout.WINNER_A_BG_CLASS)
  const winnerRedBackground = String(layout.WINNER_B_BG_CLASS)

  const resolveWinnerSide = (value: string, fallback: 'a' | 'b') => {
    const normalized = normalizeName(value)
    if (fighterAKey && normalized.startsWith(fighterAKey)) return 'a'
    if (fighterBKey && normalized.startsWith(fighterBKey)) return 'b'
    return fallback
  }

  const resolveCell = (caseText: string, defaultSide: 'a' | 'b') => {
    const side = resolveWinnerSide(caseText, defaultSide)
    const normalized = caseText.trim().replace(/(\d)\s*\.\s*(\d)/g, '$1.$2')
    const match = normalized.match(/^(.+?\/\d{1,2}[.!?])\s+([\p{L}].*)$/su)
    return {
      lead: match ? match[1].trim() : caseText,
      body: match ? match[2].trim() : '',
      bg: side === 'a' ? winnerBlueBackground : winnerRedBackground,
      mark: side === 'a' ? fighterMonogram(fighterAName) : fighterMonogram(fighterBName)
    }
  }

  // Jeśli mamy Single Verdict Mode
  if (singleVerdict) {
    const cell = resolveCell(singleVerdict, 'a')
    return (
      <div className={shell.HIGH_END_ROOT_CLASS}>
        <div className={shell.HIGH_END_PANEL_CLASS}>
          <div className={shell.HIGH_END_GRID_OVERLAY_CLASS} />
          <div className={layout.INNER_CLASS}>
            <HighEndTemplateHeader templateId="verdict-matrix" language={language} chrome={chrome} headerText={headerText} subText={subText} onToggleLanguage={onToggleLanguage} />
            <div className="mt-8 flex flex-1 flex-col items-center justify-center px-12">
              <div className={`relative w-full max-w-3xl overflow-hidden rounded-2xl border border-cyan-300/45 p-10 text-center ${cell.bg}`}>
                <FittedText as="p" slotKey="verdict-matrix:single:lead" spec={slots.directVerdictWinner} text={cell.lead} className="font-bold text-slate-100" />
                {cell.body && <FittedText as="p" slotKey="verdict-matrix:single:body" spec={slots.directVerdictSubline} text={cell.body} className="mt-4 text-slate-200" />}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[240px] font-bold text-white/5">{cell.mark}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Tryb Matrycy (Dynamic Grid)
  const colCount = columns.length
  const hasColumns = colCount > 0
  const rowCount = Math.max(1, rowsList.length)
  
  // Jeśli nie ma kolumn, traktujemy to jako 1-kolumnowy layout z nagłówkami wierszy
  const effectiveColCount = hasColumns ? colCount : 1
  const totalCells = effectiveColCount * rowCount
  const cases = Array.from({ length: totalCells }, (_, i) => 
    pickTemplateField(blockFields, [`case_${i + 1}`, `case${i + 1}`]) || plainLines[i] || ''
  )

  return (
    <div className={shell.HIGH_END_ROOT_CLASS}>
      <div className={shell.HIGH_END_PANEL_CLASS}>
        <div className={shell.HIGH_END_GRID_OVERLAY_CLASS} />
        <div className={layout.INNER_CLASS}>
          <HighEndTemplateHeader templateId="verdict-matrix" language={language} chrome={chrome} headerText={headerText} subText={subText} onToggleLanguage={onToggleLanguage} />
          
          <div className="flex flex-1 items-center justify-center p-4">
            <div className={`${shell.HIGH_END_BODY_GAP_CLASS} grid w-full max-w-5xl`} 
                 style={{
                   gridTemplateColumns: `120px repeat(${effectiveColCount}, 1fr)`,
                   gridTemplateRows: hasColumns ? `56px repeat(${rowCount}, 1fr)` : `repeat(${rowCount}, 1fr)`
                 }}>
              
              {/* Lewy Górny Narożnik - tylko jeśli są kolumny */}
              {hasColumns && <div className="border border-cyan-300/45 bg-slate-900/72" />}
              
              {/* Nagłówki Kolumn */}
              {hasColumns && columns.map((col, i) => (
                <div key={`col-${i}`} className="flex items-center justify-center border border-l-0 border-cyan-300/45 bg-slate-900/72 px-2">
                  <FittedText as="p" slotKey={`verdict-matrix:col-${i}`} spec={slots.verdictMatrixHeader} text={col} className="w-full text-center" />
                </div>
              ))}

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
                    const cell = resolveCell(cases[cellIdx], c % 2 === 0 ? 'a' : 'b')
                    return (
                      <div key={`cell-${cellIdx}`} className={`relative overflow-hidden border border-l-0 ${hasColumns || r > 0 ? 'border-t-0' : ''} border-cyan-300/45 p-6 flex flex-col justify-center ${cell.bg}`}>
                        <FittedText as="p" slotKey={`verdict-matrix:lead:${cellIdx}`} spec={slots.verdictMatrixLead} text={cell.lead} className="relative z-10 font-bold text-slate-100 mb-2" />
                        {cell.body && <FittedText as="p" slotKey={`verdict-matrix:body:${cellIdx}`} spec={slots.verdictMatrixBody} text={cell.body} className="relative z-10 text-slate-200 leading-relaxed" />}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[160px] font-bold text-white/5">{cell.mark}</div>
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
