import './VerdictMatrixTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, type ReactNode, Fragment } from 'react'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
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
  fighterA,
  fighterB,
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
  integratedToolbar,
}: VerdictMatrixTemplateProps) {
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)

  const common = getFightCommonCopy('verdict-matrix', language)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['verdict-matrix'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const ui = getTemplateUi('verdict-matrix', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>

  const headerText = title || 'MATRYCA WERDYKTU'
  const subText = pickTemplateField(blockFields, ['subtitle', 'note']) || subtitle
  
  const boardHeader =
    pickTemplateField(blockFields, ['panel_header', 'matrix_header']) ||
    getFightTemplateDefaultField('verdict-matrix', 'panel_header', language) || "MATRYCA WERDYKTU"

  const fighterAFallback = getFightTemplateDefaultField('verdict-matrix', 'fighter_a_fallback', language) || 'Fighter A'
  const fighterBFallback = getFightTemplateDefaultField('verdict-matrix', 'fighter_b_fallback', language) || 'Fighter B'
  const fighterAName = fighterA.name || fighterAFallback
  const fighterBName = fighterB.name || fighterBFallback

  const col1 = pickTemplateField(blockFields, ['col_1', 'col1'])
  const col2 = pickTemplateField(blockFields, ['col_2', 'col2'])
  const matrixColumns = [col1 || 'Solar Flare: NIE', col2 || 'Solar Flare: TAK']

  const matrixRows = [
    pickTemplateField(blockFields, ['row_1', 'row1']) || 'WALKA NA SMIERC',
    pickTemplateField(blockFields, ['row_2', 'row2']) || 'NOKAUT',
  ]

  const resolveWinnerSide = (text: string) => {
    if (!text) return null
    const lowerText = text.toLowerCase()
    const nameA = fighterAName.toLowerCase()
    const nameB = fighterBName.toLowerCase()
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

  const matchupText = `${fighterAName} VS ${fighterBName}`
  const matchupMatch = matchupText.match(/^(.*?)(\s+VS\s+)(.*)$/i)

  const headerTextStr = typeof headerText === 'string' ? headerText : "TACTICAL BOARD"
  const chars = headerTextStr.split('')
  const [activeGlitches, setActiveGlitches] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (chars.length === 0) return

    const MAX_CONCURRENT = 3
    const activeState = new Set<number>()
    const timeouts = new Map<number, ReturnType<typeof setTimeout>>()
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
          <SubtleCyberpunkLabel text={tacticalChrome.threatLevelLabel} />: <span style={{ color: '#77e2f2', textShadow: '0 0 12px rgba(119, 226, 242, 0.75), 0 0 22px rgba(119, 226, 242, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.threatLevelValue} /></span>
        </p>
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.dataIntegrityLabel} />: <span style={{ color: '#77e2f2', textShadow: '0 0 12px rgba(119, 226, 242, 0.75), 0 0 22px rgba(119, 226, 242, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.dataIntegrityValue} /></span>
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
        <p className="vs-tactical-board25-stats-title vs-panel-top-label" style={{ color: '#ff554e' }}><GlitchText text={boardHeader} /></p>
        
        <div className="vs-tpl-body" style={{ justifyContent: 'center', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '190px minmax(0, 1fr) minmax(0, 1fr)', gridTemplateRows: '68px minmax(0, 1fr) minmax(0, 1fr)', height: '100%', width: '100%', minHeight: 0, border: '2px solid #ff554e', background: 'rgba(0,0,0,0.25)' }}>
            <div style={{ borderRight: '2px solid rgba(255,85,78,0.7)', borderBottom: '2px solid rgba(255,85,78,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb7b1', fontFamily: 'var(--font-display)', letterSpacing: '0.07em', textTransform: 'uppercase', fontSize: '0.95rem' }}>
              WARIANT
            </div>
            {matrixColumns.map((columnLabel, index) => (
              <div key={`matrix-col-${index}`} style={{ borderBottom: '2px solid rgba(255,85,78,0.7)', borderLeft: index === 1 ? '2px solid rgba(255,85,78,0.7)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.6rem' }}>
                <FittedText as="p" slotKey={`verdict-matrix:col-${index}`} spec={slots.verdictMatrixHeader} text={columnLabel} style={{ color: '#ff554e', fontSize: '1.16rem', fontWeight: 'bold', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' }} />
              </div>
            ))}

            {matrixRows.map((rowLabel, rowIndex) => (
              <Fragment key={`matrix-row-${rowIndex}`}>
                <div style={{ borderTop: rowIndex === 1 ? '2px solid rgba(255,85,78,0.7)' : 'none', borderRight: '2px solid rgba(255,85,78,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.8rem' }}>
                  <FittedText as="p" slotKey={`verdict-matrix:row-${rowIndex}`} spec={slots.verdictMatrixRowHeader} text={rowLabel} style={{ color: '#ffd7d4', fontSize: '1.05rem', textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase' }} />
                </div>
                {matrixColumns.map((_, columnIndex) => {
                  const cellIndex = rowIndex * 2 + columnIndex
                  const cellText = cellData[cellIndex] || ''
                  const winnerSide = resolveWinnerSide(cellText)
                  const winnerName = winnerSide === 'a' ? fighterAName : winnerSide === 'b' ? fighterBName : ''
                  const winnerImage = winnerSide === 'a' ? fighterA.imageUrl : winnerSide === 'b' ? fighterB.imageUrl : ''
                  const winnerColor = winnerSide === 'a' ? fighterA.color : winnerSide === 'b' ? fighterB.color : '#cbd5e1'

                  return (
                    <div
                      key={`matrix-cell-${rowIndex}-${columnIndex}`}
                      style={{
                        position: 'relative',
                        overflow: 'hidden',
                        borderLeft: columnIndex === 1 ? '2px solid rgba(255,85,78,0.7)' : 'none',
                        borderTop: rowIndex === 1 ? '2px solid rgba(255,85,78,0.7)' : 'none',
                        background: 'rgba(10, 4, 4, 0.68)',
                      }}
                    >
                      {winnerImage ? (
                        <img
                          src={winnerImage}
                          alt={winnerName}
                          draggable={false}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: 'saturate(0.96) contrast(1.02) brightness(0.82)' }}
                        />
                      ) : null}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.34) 55%, rgba(0,0,0,0.74))' }} />
                      <div style={{ position: 'absolute', left: 0, right: 0, bottom: '0.45rem', textAlign: 'center', padding: '0 0.4rem' }}>
                        <p style={{ color: winnerColor, fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', textShadow: '0 0 10px color-mix(in srgb, currentColor 40%, transparent)' }}>
                          {winnerName || common.emptyFieldLabel}
                        </p>
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
