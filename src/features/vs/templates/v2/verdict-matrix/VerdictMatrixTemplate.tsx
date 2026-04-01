import './VerdictMatrixTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, type CSSProperties, type ReactNode, Fragment } from 'react'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplatePreset as getFightTemplatePreset,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { CyberpunkMetaValue } from '../../../components/CyberpunkMetaValue'
import { AdjustableTemplateImage } from '../../../components/AdjustableTemplateImage'

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
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
}: VerdictMatrixTemplateProps) {
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)

  const common = getFightCommonCopy('verdict-matrix', language)
  const templatePreset = getFightTemplatePreset('verdict-matrix', language)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['verdict-matrix'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)

  const headerText =
    pickTemplateField(blockFields, ['headline', 'header', 'title']) ||
    title ||
    templatePreset.title ||
    common.verdictLabel
  const subText = pickTemplateField(blockFields, ['subtitle', 'note']) || subtitle
  
  const boardHeader =
    pickTemplateField(blockFields, ['panel_header', 'matrix_header']) ||
    getFightTemplateDefaultField('verdict-matrix', 'panel_header', language) ||
    templatePreset.title ||
    common.verdictLabel

  const fighterAFallback = getFightTemplateDefaultField('verdict-matrix', 'fighter_a_fallback', language) || 'A'
  const fighterBFallback = getFightTemplateDefaultField('verdict-matrix', 'fighter_b_fallback', language) || 'B'
  const fighterAName = fighterA.name || fighterAFallback
  const fighterBName = fighterB.name || fighterBFallback

  const caseData = [
    pickTemplateField(blockFields, ['case_1', 'verdict', 'case1']) || plainLines[0] || '',
    pickTemplateField(blockFields, ['case_2', 'case2']) || plainLines[1] || '',
    pickTemplateField(blockFields, ['case_3', 'case3']) || plainLines[2] || '',
    pickTemplateField(blockFields, ['case_4', 'case4']) || plainLines[3] || '',
  ]
  const nonEmptyCaseCount = caseData.filter((entry) => entry.trim()).length

  const explicitLayoutRaw =
    pickTemplateField(blockFields, [
      'layout',
      'matrix_layout',
      'matrix_mode',
      'verdict_layout',
      'verdict_matrix_layout',
      'type',
      'format',
    ]) || ''
  const explicitLayout = explicitLayoutRaw.toLowerCase()
  const normalizedLayout = explicitLayout.replace(/\s+/g, '')
  const layoutMatch = normalizedLayout.match(/([12])x([12])/)
  const canonicalLayout = layoutMatch ? `${layoutMatch[1]}x${layoutMatch[2]}` : normalizedLayout

  const resolveExplicitLayout = () => {
    if (['2x2', 'quad', '4'].includes(canonicalLayout)) return '2x2' as const
    if (['2x1', '1x2', 'double', 'dual', '2', 'two'].includes(canonicalLayout)) return '2x1' as const
    if (['1x1', 'single', 'solo', '1', 'one'].includes(canonicalLayout)) return '1x1' as const
    return null
  }

  const explicitLayoutMode = resolveExplicitLayout()

  const layoutMode = explicitLayoutMode
    || (() => {
      if (nonEmptyCaseCount <= 1) return '1x1' as const
      if (nonEmptyCaseCount === 2) return '2x1' as const
      return '2x2' as const
    })()

  let numCols = 1
  let numRows = 1
  if (layoutMode === '2x2') {
    numCols = 2
    numRows = 2
  } else if (layoutMode === '2x1') {
    numCols = 2
    numRows = 1
  }

  const col1 = pickTemplateField(blockFields, ['col_1', 'col1'])
  const col2 = pickTemplateField(blockFields, ['col_2', 'col2'])
  const defaultCol1 =
    getFightTemplateDefaultField('verdict-matrix', 'col_left', language) ||
    `${common.parameterLabel} 1`
  const defaultCol2 =
    getFightTemplateDefaultField('verdict-matrix', 'col_right', language) ||
    `${common.parameterLabel} 2`
  const defaultRow1 =
    getFightTemplateDefaultField('verdict-matrix', 'row_top', language) ||
    common.verdictLabel
  const defaultRow2 =
    getFightTemplateDefaultField('verdict-matrix', 'row_bottom', language) ||
    common.verdictLabel
  const matrixColumns: string[] = []
  if (numCols >= 1) {
    matrixColumns.push(
      col1 ||
      (layoutMode === '2x1'
        ? pickTemplateField(blockFields, ['row_1', 'row1']) || defaultCol1
        : (numCols === 1 ? '' : defaultCol1)),
    )
  }
  if (numCols >= 2) {
    matrixColumns.push(
      col2 ||
      (layoutMode === '2x1'
        ? pickTemplateField(blockFields, ['row_2', 'row2']) || defaultCol2
        : defaultCol2),
    )
  }

  const matrixRows: string[] = []
  if (numRows >= 1) matrixRows.push(pickTemplateField(blockFields, ['row_1', 'row1']) || (numRows === 1 ? common.verdictLabel : defaultRow1))
  if (numRows >= 2) matrixRows.push(pickTemplateField(blockFields, ['row_2', 'row2']) || defaultRow2)

  const stripTrailingDot = (value: string) => value.replace(/\.\s*$/, '').trim()
  const cleanSubText = stripTrailingDot(subText || '')
  const cleanBoardHeader = stripTrailingDot(boardHeader)
  const cleanMatrixColumns = matrixColumns.map((label) => stripTrailingDot(label))
  const cleanMatrixRows = matrixRows.map((label) => stripTrailingDot(label))
  
  const isSingle = numCols === 1 && numRows === 1
  const hideColAxis = numCols === 1
  const hideRowAxis = numRows === 1

  const matrixAxisBand = 'calc(36px * var(--tb-scale))'
  const matrixAxisGap = '10px'
  const matrixAxisCellPadding = '0 0.3rem'
  const matrixDossierLabelStyle = {
    color: '#ff554e',
    fontFamily: "'Chakra Petch', sans-serif",
    fontSize: 'var(--tb-type-3)',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    textAlign: 'center' as const,
    lineHeight: 1,
    margin: 0,
  }
  const matrixDossierDescriptionStyle = {
    fontFamily: "'Chakra Petch', sans-serif",
    fontSize: 'calc(var(--tb-type-2) * 0.8)',
    fontWeight: 800,
    lineHeight: 1,
    textTransform: 'uppercase' as const,
  }

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

  const cellData = caseData

  const headerTextStr = typeof headerText === 'string' ? headerText : templatePreset.title
  const chars = headerTextStr.split('')
  const [activeGlitches, setActiveGlitches] = useState<Set<number>>(new Set())

  useEffect(() => {
    const headerChars = headerTextStr.split('')
    if (headerChars.length === 0) return

    const MAX_CONCURRENT = 3
    const activeState = new Set<number>()
    const timeouts = new Map<number, ReturnType<typeof setTimeout>>()
    let isMounted = true

    const startGlitch = () => {
      if (!isMounted) return
      if (activeState.size >= MAX_CONCURRENT) return

      const available = []
      for (let i = 0; i < headerChars.length; i++) {
        if (!activeState.has(i) && headerChars[i] !== ' ') available.push(i)
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

    for (let i = 0; i < Math.min(MAX_CONCURRENT, headerChars.length); i++) {
      setTimeout(() => startGlitch(), i * 800)
    }

    return () => {
      isMounted = false
      timeouts.forEach(clearTimeout)
    }
  }, [headerTextStr])

  const logoButtonStyle: CSSProperties & Record<'--logo-url', string> = {
    '--logo-url': `url(${tacticalChrome.brandImageSrc})`,
  }
  const panelTitleStyle: CSSProperties & Record<'--tb-reflect-2-y' | '--tb-reflect-2-blur', string> = {
    color: '#ff554e',
    '--tb-reflect-2-y': '0em',
    '--tb-reflect-2-blur': '0em',
  }

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
        <p className="vs-tactical-board25-subtitle" style={{ color: '#77e2f2' }}>{cleanSubText}</p>
      </div>

      <button
        type="button"
        className="vs-tactical-board25-logo"
        title={tacticalChrome.brandMarkTitle}
        aria-label={tacticalChrome.brandMarkAria}
        onClick={onToggleLanguage}
        style={logoButtonStyle}
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

      <section className="vs-tactical-board25-stats" style={{ width: 'calc(var(--tb-panel-width) * 2 + var(--tb-center-gap))', display: 'flex', flexDirection: 'column', height: 'var(--tb-panel-height)', padding: 0, overflow: 'hidden' }}>
        <p
          className="vs-tactical-board25-stats-title vs-panel-top-label vs-verdict-matrix-panel-title"
          style={panelTitleStyle}
        >
          <GlitchText text={cleanBoardHeader} />
        </p>
        
        <div className="vs-verdict-matrix-body" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isSingle
              ? 'minmax(0, 1fr)'
              : hideRowAxis
                ? matrixColumns.map(() => 'minmax(0, 1fr)').join(' ')
                : `${matrixAxisBand} ${matrixColumns.map(() => 'minmax(0, 1fr)').join(' ')}`,
            gridTemplateRows: isSingle 
              ? 'minmax(0, 1fr)' 
              : hideColAxis 
                ? matrixRows.map(() => 'minmax(0, 1fr)').join(' ')
                : `${matrixAxisBand} ${matrixRows.map(() => 'minmax(0, 1fr)').join(' ')}`, 
            columnGap: isSingle ? '0' : matrixAxisGap, 
            rowGap: isSingle ? '0' : matrixAxisGap, 
            height: '100%', 
            width: '100%', 
            minHeight: 0, 
            border: 'none', 
            background: isSingle ? 'transparent' : 'rgba(255, 85, 78, 1)' 
          }}>
            {!isSingle && !hideColAxis && (
              <>
                {!hideRowAxis ? <div aria-hidden="true" style={{ background: 'rgba(0, 0, 0, 0.82)' }} /> : null}
                {cleanMatrixColumns.map((columnLabel, index) => (
                  <div key={`matrix-col-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: matrixAxisCellPadding, background: 'rgba(0, 0, 0, 0.82)' }}>
                    <p style={{ ...matrixDossierLabelStyle, whiteSpace: 'nowrap' }}>
                      <GlitchText text={columnLabel} />
                    </p>
                  </div>
                ))}
              </>
            )}

            {cleanMatrixRows.map((rowLabel, rowIndex) => (
              <Fragment key={`matrix-row-${rowIndex}`}>
                {!isSingle && !hideRowAxis && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: matrixAxisCellPadding, overflow: 'hidden', background: 'rgba(0, 0, 0, 0.82)' }}>
                    <p style={{ ...matrixDossierLabelStyle, writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}>
                      <GlitchText text={rowLabel} />
                    </p>
                  </div>
                )}
                {matrixColumns.map((_, columnIndex) => {
                  const cellIndex = rowIndex * numCols + columnIndex
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
                        background: 'rgba(10, 4, 4, 0.68)',
                        border: isSingle ? '10px solid rgba(255, 85, 78, 1)' : 'none'
                      }}
                    >
                      {winnerImage ? (
                        <div style={{ position: 'absolute', inset: 0, zIndex: 2, filter: 'saturate(0.96) contrast(1.02) brightness(0.82)' }}>
                          <AdjustableTemplateImage
                            imageUrl={winnerImage}
                            alt={winnerName}
                            fallbackLabel=""
                            adjustKey={`verdict-matrix-side-${winnerSide}`}
                            legacyAdjustKeys={[`legacy-verdict-matrix-side-${winnerSide}`]}
                            adjustments={slideImageAdjustments}
                            onAdjustChange={onSlideImageAdjustChange}
                            onAdjustCommit={onSlideImageAdjustCommit}
                            plain
                          />
                        </div>
                      ) : null}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.34) 55%, rgba(0,0,0,0.74))', zIndex: 1 }} />
                      <div style={{ position: 'absolute', left: 0, right: 0, bottom: '0.45rem', textAlign: 'center', padding: '0 0.4rem', zIndex: 3 }}>
                        <p style={{ ...matrixDossierDescriptionStyle, color: winnerColor, letterSpacing: '0.05em', textShadow: '0 0 10px color-mix(in srgb, currentColor 40%, transparent)' }}>
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
