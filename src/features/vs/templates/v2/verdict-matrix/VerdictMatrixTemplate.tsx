import './VerdictMatrixTemplate.scss'
import { useState, useEffect, type ReactNode, Fragment } from 'react'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { fighterMonogram } from '../../../helpers'
import { FittedText } from '../../shared/FittedText'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'
import { CyberpunkMetaValue } from '../../../components/CyberpunkMetaValue'

type VerdictMatrixTemplateProps = TemplatePreviewProps & {
  integratedToolbar?: ReactNode
}

const GLITCH_CHARS = '!@#$%^&░▓▒▌▐╠╣╦╬┼╫Ω'.split('')

function SubtleCyberpunkLabel({ text }: { text: string }) {
  const [display, setDisplay] = useState(text)
  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement.dataset.vsAudit === 'true') return
    const timer = setInterval(() => {
      if (Math.random() > 0.92) {
        const chars = text.split('')
        const i = Math.floor(Math.random() * chars.length)
        if (chars[i] === ' ') return
        chars[i] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
        setDisplay(chars.join(''))
        setTimeout(() => setDisplay(text), 60 + Math.random() * 80)
      }
    }, 2500)
    return () => clearInterval(timer)
  }, [text])
  return <>{display}</>
}

export function VerdictMatrixTemplate({
  activeTemplateId,
  fighterA,
  fighterB,
  title,
  subtitle,
  templateBlocks,
  activeFightId,
  language,
  onToggleLanguage,
  integratedToolbar,
}: VerdictMatrixTemplateProps) {
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)
  
  const realityHeader =
    pickTemplateField(tacticalBlockFields, ['right_header', 'reality_header']) ||
    getFightTemplateDefaultField('tactical-board', 'right_header', language)

  const common = getFightCommonCopy('verdict-matrix', language)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['verdict-matrix'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome('verdict-matrix', language, blockFields)
  const ui = getTemplateUi('verdict-matrix', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string | number>

  const headerText = title || 'MATRYCA WERDYKTU'
  const subText = pickTemplateField(blockFields, ['subtitle', 'note']) || subtitle
  
  const boardHeader =
    pickTemplateField(blockFields, ['left_header', 'categories_header']) ||
    getFightTemplateDefaultField('tactical-board', 'left_header', language) || "VERDICT MATRIX"

  const col1 = pickTemplateField(blockFields, ['col_1', 'col1'])
  const col2 = pickTemplateField(blockFields, ['col_2', 'col2'])
  const hasColumns = Boolean(col1 || col2)

  const rowsList = [
    pickTemplateField(blockFields, ['row_1', 'row1']) || 'SCENARIUSZ A',
    pickTemplateField(blockFields, ['row_2', 'row2']) || 'SCENARIUSZ B',
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

  const headerTextStr = typeof headerText === 'string' ? headerText : "TACTICAL BOARD"
  const chars = headerTextStr.split('')
  const [activeGlitches, setActiveGlitches] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (chars.length === 0) return

    const MAX_CONCURRENT = 3
    const activeState = new Set<number>()
    const timeouts = new Map<number, NodeJS.Timeout>()
    let isMounted = true

    const startGlitch = () => {
      if (!isMounted) return
      if (activeState.size >= MAX_CONCURRENT) return

      const available = []
      for (let i = 0; i < chars.length; i++) {
        if (!activeState.has(i) && chars[i] !== ' ') available.push(i)
      }
      if (available.length === 0) return

      const nextIndex = available[Math.floor(Math.random() * available.length)]
      activeState.add(nextIndex)
      setActiveGlitches(new Set(activeState))

      const duration = 2000 + Math.random() * 3000

      const timeoutId = setTimeout(() => {
        if (!isMounted) return
        activeState.delete(nextIndex)
        setActiveGlitches(new Set(activeState))
        timeouts.delete(nextIndex)
        
        setTimeout(() => startGlitch(), Math.random() * 500)
      }, duration)

      timeouts.set(nextIndex, timeoutId)
    }

    for (let i = 0; i < Math.min(MAX_CONCURRENT, chars.length); i++) {
      setTimeout(() => startGlitch(), i * 800)
    }

    return () => {
      isMounted = false
      timeouts.forEach(clearTimeout)
    }
  }, [headerTextStr])

  return (
    <div className="vs-tactical-board25-surface">
      <div className="vs-tactical-board25-line" />
      {integratedToolbar ? <div className="vs-tactical-board25-toolbar">{integratedToolbar}</div> : null}

      <div className="vs-tactical-board25-meta">
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.threatLevelLabel} />: <span style={{ color: '#ff554e', textShadow: '0 0 10px rgba(255, 85, 78, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.threatLevelValue} /></span>
        </p>
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.dataIntegrityLabel} />: <span style={{ color: '#ff554e', textShadow: '0 0 10px rgba(255, 85, 78, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.dataIntegrityValue} /></span>
        </p>
      </div>

      <div className="vs-tactical-board25-heading">
        <div className="vs-tb-signal-main" style={{ transform: 'none', minWidth: 'auto', maxWidth: 'none', minHeight: 'auto', padding: '0.1em 0.5em', margin: 0, width: '75%' }}>
          <div style={{ position: 'relative' }}>
            <div className="glitch-letter-container">
              {chars.map((char, i) => (
                char === ' ' ? <span key={i}>&nbsp;</span> : (
                  <div key={i} className={`glitch-letter ${activeGlitches.has(i) ? 'is-glitching' : ''}`} data-text={char}>
                    {char}
                  </div>
                )
              ))}
            </div>
            <div className="glow" style={{ fontSize: '3.5vw', width: '100%', textAlign: 'center', pointerEvents: 'none', textShadow: 'none' }}>{headerText}</div>
          </div>
        </div>
        <p className="vs-tactical-board25-subtitle" style={{ color: '#77e2f2' }}>{subText}</p>
        <div className="vs-tpl-matchup" style={{ textAlign: 'center', marginTop: '0.5rem', fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#cbd5e1' }}>
          {matchupMatch ? (
            <>
              <span className="vs-tpl-matchup-a" style={{ color: fighterA.color }}>{matchupMatch[1].trim()}</span>
              <span className="vs-tpl-matchup-sep" style={{ margin: '0 0.5rem', opacity: 0.5 }}>{matchupMatch[2]}</span>
              <span className="vs-tpl-matchup-b" style={{ color: fighterB.color }}>{matchupMatch[3].trim()}</span>
            </>
          ) : matchupText}
        </div>
      </div>

      <button
        type="button"
        className="vs-tactical-board25-logo"
        title={tacticalChrome.brandMarkTitle}
        aria-label={tacticalChrome.brandMarkAria}
        onClick={onToggleLanguage}
        style={{ '--logo-url': `url(${tacticalChrome.brandImageSrc})` } as any}
      >
        <img src={tacticalChrome.brandImageSrc} alt={tacticalChrome.brandAlt} draggable={false} />
        <img
          className="vs-tactical-board25-logo-reflection"
          src={tacticalChrome.brandImageSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      </button>

      <section className="vs-tactical-board25-stats" style={{ width: 'calc(var(--tb-panel-width) * 2 + var(--tb-center-gap))', display: 'flex', flexDirection: 'column', height: 'var(--tb-panel-height)' }}>
        <p className="vs-tactical-board25-stats-title" style={{ color: '#ff554e' }}>{boardHeader}</p>
        
        <div className="vs-tpl-body" style={{ justifyContent: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className={`grid ${gridColsClass} overflow-hidden rounded-xl border border-cyan-300/45 bg-slate-950/40 shadow-2xl`} style={{ flex: 1 }}>
            {/* Column headers */}
            <div className="border-b border-r border-cyan-300/45 bg-slate-900/80" />
            {hasColumns ? (
              <>
                <div className="border-b border-cyan-300/45 bg-slate-900/80 p-4 text-center flex items-center justify-center">
                  <FittedText as="p" slotKey="verdict-matrix:col-1" spec={slots.verdictMatrixHeader} text={col1 || ''} className="font-bold text-cyan-200" style={{ fontSize: '1.4rem', textTransform: 'uppercase' }} />
                </div>
                <div className="border-b border-l border-cyan-300/45 bg-slate-900/80 p-4 text-center flex items-center justify-center">
                  <FittedText as="p" slotKey="verdict-matrix:col-2" spec={slots.verdictMatrixHeader} text={col2 || ''} className="font-bold text-cyan-200" style={{ fontSize: '1.4rem', textTransform: 'uppercase' }} />
                </div>
              </>
            ) : (
              <div className="border-b border-cyan-300/45 bg-slate-900/80 p-4 text-center flex items-center justify-center">
                <FittedText as="p" slotKey="verdict-matrix:verdict-label" spec={slots.verdictMatrixHeader} text={common.verdictLabel} className="font-bold text-cyan-200" style={{ fontSize: '1.4rem', textTransform: 'uppercase' }} />
              </div>
            )}

            {rowsList.map((row, r) => (
              <Fragment key={`row-group-${r}`}>
                <div className={`relative border ${hasColumns || r > 0 ? 'border-t-0' : ''} border-cyan-300/45 bg-slate-900/72 min-h-[150px] flex items-center justify-center`}>
                  <div className="absolute left-1/2 top-1/2 w-[200px] -translate-x-1/2 -translate-y-1/2 -rotate-90">
                    <FittedText as="p" slotKey={`verdict-matrix:row-${r}`} spec={slots.verdictMatrixRowHeader} text={row} className="text-center text-slate-100 font-bold" style={{ fontSize: '1.25rem', letterSpacing: '0.1em' }} />
                  </div>
                </div>
                {Array.from({ length: effectiveColCount }, (_, c) => {
                  const cellIdx = r * effectiveColCount + c
                  const body = cellData[cellIdx]
                  if (!body) return <div key={`empty-${cellIdx}`} className="border-b border-l border-cyan-300/45 bg-slate-900/20" />

                  const cellWinnerSide = resolveWinnerSide(body)
                  const mark = cellWinnerSide === 'a' ? fighterMonogram(fighterA.name) : (cellWinnerSide === 'b' ? fighterMonogram(fighterB.name) : '')
                  const cellAccentColor = cellWinnerSide === 'a' ? fighterA.color : (cellWinnerSide === 'b' ? fighterB.color : 'rgba(255,255,255,0.1)')

                  return (
                    <div
                      key={`cell-${cellIdx}`}
                      className="relative flex flex-col items-center justify-center border border-l-0 border-t-0 p-4 text-center transition-colors duration-500"
                      style={{
                        borderColor: cellWinnerSide ? `${cellAccentColor}88` : 'rgba(34,211,238,0.45)',
                        background: cellWinnerSide
                          ? `linear-gradient(145deg, ${cellAccentColor}44, rgba(15,23,42,0.85))`
                          : 'rgba(15,23,42,0.4)',
                        boxShadow: cellWinnerSide ? `inset 0 0 30px ${cellAccentColor}22` : 'none',
                        minHeight: '150px'
                      }}
                    >
                      <FittedText
                        as="p"
                        slotKey={`verdict-matrix:cell-body-${cellIdx}`}
                        spec={slots.verdictMatrixBody}
                        text={body}
                        className="relative z-10 text-slate-100 font-medium"
                        style={{ fontSize: '1.25rem', lineHeight: 1.5 }}
                      />
                      <div
                        className="pointer-events-none absolute inset-0 flex items-center justify-center font-bold transition-opacity duration-500"
                        style={{ color: cellAccentColor, opacity: 0.12, fontSize: '100px', fontFamily: 'var(--font-display)' }}
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
      </section>

    </div>
  )
}
