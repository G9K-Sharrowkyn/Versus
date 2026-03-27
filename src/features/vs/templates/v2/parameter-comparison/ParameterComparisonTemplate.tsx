import './ParameterComparisonTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { AVERAGE_DRAW_THRESHOLD } from '../../../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { CyberpunkMetaValue } from '../../../components/CyberpunkMetaValue'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateStaticField as getFightTemplateDefaultField,
  getTemplateCommonCopy as getFightCommonCopy
} from '../../shared/templateCopy'

type ParameterComparisonTemplateProps = TemplatePreviewProps & {
  integratedToolbar?: ReactNode
}

const GLITCH_CHARS = '!@#$%^&░▓▒▌▐╠╣╦╬┼╫Ω'.split('')

const DOSSIER_PANEL_TEXT_BASE_STYLE: CSSProperties = {
  fontFamily: "'Chakra Petch', sans-serif",
  fontSize: 'calc(var(--tb-type-2) * 0.8)',
  fontWeight: 800,
  letterSpacing: '0.02em',
  lineHeight: 1,
  textTransform: 'uppercase',
  margin: 0,
}

const DOSSIER_BLUE_COLOR = '#77e2f2'
const DOSSIER_RED_COLOR = '#ff554e'
const DOSSIER_DRAW_COLOR = '#cbd5e1'

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

const parseHexColor = (hex: string): [number, number, number] => {
  const trimmed = hex.trim().replace('#', '')
  const normalized = trimmed.length === 3
    ? trimmed.split('').map((char) => `${char}${char}`).join('')
    : trimmed
  if (normalized.length !== 6) return [119, 226, 242]
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return [119, 226, 242]
  return [r, g, b]
}

const buildReflectionShadow = (hex: string, reflectStrength = 42): string => {
  const [r, g, b] = parseHexColor(hex)
  const reflectAlpha = clamp01(reflectStrength / 100)
  const reflectionAlpha = clamp01(Math.max(0.55, reflectAlpha))
  const glowAlpha = clamp01(Math.max(0.32, reflectionAlpha * 0.62))
  return `0 0 10px rgba(${r}, ${g}, ${b}, ${glowAlpha.toFixed(3)}), 0 var(--tb-reflect-2-y, 1.7em) 0.62em rgba(${r}, ${g}, ${b}, ${reflectionAlpha.toFixed(3)})`
}

const buildPanelTextStyle = (color: string, reflectStrength = 42): CSSProperties => ({
  ...DOSSIER_PANEL_TEXT_BASE_STYLE,
  color,
  WebkitTextFillColor: color,
  textShadow: buildReflectionShadow(color, reflectStrength),
})

const splitNameForTwoRows = (name: string): [string, string] => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length < 2) return [name.trim(), '']

  let bestIndex = 1
  let bestScore = Number.POSITIVE_INFINITY
  for (let index = 1; index < words.length; index += 1) {
    const first = words.slice(0, index).join(' ')
    const second = words.slice(index).join(' ')
    const score = Math.abs(first.length - second.length)
    if (score < bestScore) {
      bestScore = score
      bestIndex = index
    }
  }

  return [words.slice(0, bestIndex).join(' '), words.slice(bestIndex).join(' ')]
}

const shrinkElementTextToWidth = (el: HTMLElement, maxWidthPx: number, minFontPx = COMPARISON_BOTTOM_NAME_MIN_FONT_PX) => {
  if (maxWidthPx <= 0) return
  let currentFontPx = Number.parseFloat(window.getComputedStyle(el).fontSize)
  if (!Number.isFinite(currentFontPx) || currentFontPx <= 0) return

  let safety = 0
  while (el.scrollWidth > maxWidthPx + 0.5 && currentFontPx > minFontPx && safety < 20) {
    const widthRatio = maxWidthPx / Math.max(el.scrollWidth, 1)
    const nextFontPx = Math.max(
      minFontPx,
      currentFontPx * Math.min(0.95, Math.max(0.65, widthRatio)),
    )
    if (Math.abs(nextFontPx - currentFontPx) < 0.05) break
    currentFontPx = nextFontPx
    el.style.fontSize = `${currentFontPx}px`
    safety += 1
  }

  return currentFontPx
}

const STAT_LABEL_COL_WIDTH = '30ch'
const STAT_VALUE_COL_WIDTH = '7ch'
const STAT_COL_GAP = '0.4rem'
const STAT_ROW_TEMPLATE = `${STAT_LABEL_COL_WIDTH} ${STAT_VALUE_COL_WIDTH}`
const STAT_TRACK_WIDTH = `calc(${STAT_LABEL_COL_WIDTH} + ${STAT_COL_GAP} + ${STAT_VALUE_COL_WIDTH})`
const RIGHT_LABEL_START = '0.65rem'
const COMPARISON_SEPARATOR_MARGIN = '1.0579rem'
const COMPARISON_HEADER_TOP_TUNE = '26.397px'
const COMPARISON_ROWS_TOP_TUNE = '2rem'
const COMPARISON_ROW_DRIFT_FIX_PX = 0
const COMPARISON_TEXT_OFFSET_Y_PX = 0
const COMPARISON_SIDE_ROWS_TOP_EXTRA_PX = 11.034
const COMPARISON_SIDE_ROW_STEP_EXTRA_PX = 17.5
const COMPARISON_SIDE_ROWS_TOP_TUNE = `calc(${COMPARISON_ROWS_TOP_TUNE} + ${COMPARISON_SIDE_ROWS_TOP_EXTRA_PX}px)`
const COMPARISON_SECOND_ROW_Y_TUNE_PX = 0.9
const COMPARISON_SEPARATOR_Y_TUNE_PX = 6.4
const COMPARISON_SEPARATOR_WIDTH = '66.667%'
const COMPARISON_RIGHT_COLUMN_SHIFT_X_PX = -82
const COMPARISON_BOTTOM_NAME_INSET_X_PX = 72
const COMPARISON_BOTTOM_NAME_DROP_Y_PX = 10
const COMPARISON_FAVORITE_STAMP_BOTTOM_PX = 8
const COMPARISON_FAVORITE_STAMP_WIDTH_REM = 15
const COMPARISON_FAVORITE_STAMP_MIN_HEIGHT_REM = 3
const COMPARISON_FAVORITE_STAMP_LEFT_POS = '37.5%'
const COMPARISON_FAVORITE_STAMP_RIGHT_POS = '87.5%'
const COMPARISON_FAVORITE_STAMP_DRAW_POS = '50%'
const COMPARISON_FAVORITE_STAMP_LEFT_ROTATION_DEG = -24
const COMPARISON_FAVORITE_STAMP_RIGHT_ROTATION_DEG = 24
const COMPARISON_ACCENT_UNDERLINE_BG = 'linear-gradient(90deg, rgba(119,226,242,0) 0%, rgba(255,85,78,0.66) 18%, rgba(255,85,78,0.66) 82%, rgba(255,85,78,0) 100%)'
const COMPARISON_BOTTOM_LEFT_NAME_SHADOW = buildReflectionShadow(DOSSIER_BLUE_COLOR, 74)
const COMPARISON_BOTTOM_RIGHT_NAME_SHADOW = buildReflectionShadow(DOSSIER_RED_COLOR, 78)
const COMPARISON_BOTTOM_NAME_BASE_MULTIPLIER = 2.625
const COMPARISON_BOTTOM_NAME_TWO_LINE_MULTIPLIER = COMPARISON_BOTTOM_NAME_BASE_MULTIPLIER * 0.5
const COMPARISON_BOTTOM_NAME_MIN_FONT_PX = 8
const COMPARISON_BOTTOM_NAME_BOUNDARY_INSET_PX = 0

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

export function ParameterComparisonTemplate({
  rows,
  fighterA,
  fighterB,
  averageA,
  averageB,
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
  integratedToolbar,
}: ParameterComparisonTemplateProps) {
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['parameter-comparison'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, blockFields)
  const boardHeader =
    pickTemplateField(blockFields, ['panel_header', 'comparison_header']) ||
    getFightTemplateDefaultField('parameter-comparison', 'panel_header', language) ||
    'PORÓWNANIE PARAMETRÓW'
    
  const common = getFightCommonCopy('parameter-comparison', language)
  const averageShort = common.averageShort || 'Śr.'
  
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  
  const fighterAFallback = getFightTemplateDefaultField('parameter-comparison', 'fighter_a_fallback', language)
  const fighterBFallback = getFightTemplateDefaultField('parameter-comparison', 'fighter_b_fallback', language)
  const leftHeader = fighterA.name || fighterAFallback
  const rightHeader = fighterB.name || fighterBFallback
  
  const drawHeader =
    pickTemplateField(blockFields, ['draw_header']) ||
    getFightTemplateDefaultField('parameter-comparison', 'draw_header', language) ||
    common.drawZonesLabel
  const advantageHeader =
    pickTemplateField(blockFields, ['advantage_header', 'advantage_label']) ||
    (language === 'pl' ? 'PRZEWAGA' : 'ADVANTAGE')
  const leftAdvantages = rows.filter((row) => row.winner === 'a')
  const rightAdvantages = rows.filter((row) => row.winner === 'b')
  const drawRows = rows.filter((row) => row.winner === 'draw')
  const drawRowsBottomAnchored = [...drawRows].reverse()
  const fighterAText = fighterA.name || fighterAFallback
  const fighterBText = fighterB.name || fighterBFallback
  const leftPanelTextStyle = buildPanelTextStyle(DOSSIER_BLUE_COLOR, 42)
  const rightPanelTextStyle = buildPanelTextStyle(DOSSIER_RED_COLOR, 42)
  const drawPanelTextStyle = buildPanelTextStyle(DOSSIER_DRAW_COLOR, 34)
  
  const averageGap = Math.abs(averageA - averageB)
  const isAverageDraw = averageGap < AVERAGE_DRAW_THRESHOLD
  const favoriteSide: 'a' | 'b' | 'draw' = isAverageDraw ? 'draw' : averageA > averageB ? 'a' : 'b'
  const favoriteDrawLabel =
    pickTemplateField(blockFields, ['draw_favorite', 'draw_favorite_label', 'favorite_draw']) ||
    getFightTemplateDefaultField('parameter-comparison', 'draw_favorite', language) ||
    common.drawLabel
  const favoriteLabel =
    pickTemplateField(blockFields, ['favorite_label', 'favorite']) ||
    getFightTemplateDefaultField('parameter-comparison', 'favorite_label', language)
  const favoriteBadgeText =
    isAverageDraw
      ? favoriteDrawLabel
      : favoriteLabel || (language === 'pl' ? 'Faworyt według statystyk' : 'Stat-based favorite')

  const favoriteStampLeft =
    favoriteSide === 'a'
      ? COMPARISON_FAVORITE_STAMP_LEFT_POS
      : favoriteSide === 'b'
        ? COMPARISON_FAVORITE_STAMP_RIGHT_POS
        : COMPARISON_FAVORITE_STAMP_DRAW_POS
  const favoriteStampRotationDeg =
    favoriteSide === 'a'
      ? COMPARISON_FAVORITE_STAMP_LEFT_ROTATION_DEG
      : favoriteSide === 'b'
        ? COMPARISON_FAVORITE_STAMP_RIGHT_ROTATION_DEG
        : 0
  const bottomNamesRowRef = useRef<HTMLDivElement | null>(null)
  const leftBottomNameRef = useRef<HTMLParagraphElement | null>(null)
  const rightBottomNameRef = useRef<HTMLParagraphElement | null>(null)
  const drawHeaderAnchorRef = useRef<HTMLParagraphElement | null>(null)
  const favoriteStampRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const rowEl = bottomNamesRowRef.current
    const drawHeaderEl = drawHeaderAnchorRef.current
    const leftNameEl = leftBottomNameRef.current
    const rightNameEl = rightBottomNameRef.current
    const stampEl = favoriteStampRef.current
    if (!stampEl || !rowEl || !drawHeaderEl || !leftNameEl || !rightNameEl) {
      return
    }

    const applyBottomNameLayout = (params: {
      el: HTMLParagraphElement
      side: 'left' | 'right'
      sourceText: string
      boundaryPx: number
      rowRect: DOMRect
    }) => {
      const { el, side, sourceText, boundaryPx, rowRect } = params
      const trimmedText = sourceText.trim()

      el.textContent = sourceText
      el.style.fontSize = `calc(var(--tb-type-2) * ${COMPARISON_BOTTOM_NAME_BASE_MULTIPLIER})`
      el.style.lineHeight = '0.9'
      el.style.whiteSpace = 'nowrap'
      el.style.maxWidth = 'none'
      el.style.width = 'auto'
      el.style.display = 'inline-block'
      el.style.wordBreak = 'normal'
      el.style.overflowWrap = 'normal'
      el.style.textAlign = side === 'right' ? 'right' : 'left'
      const baseFontPx = Number.parseFloat(window.getComputedStyle(el).fontSize)

      const nameRect = el.getBoundingClientRect()
      const availableWidthPx = side === 'left'
        ? boundaryPx - (nameRect.left - rowRect.left) - COMPARISON_BOTTOM_NAME_BOUNDARY_INSET_PX
        : (nameRect.right - rowRect.left) - boundaryPx - COMPARISON_BOTTOM_NAME_BOUNDARY_INSET_PX
      const clampedWidthPx = Math.max(10, availableWidthPx)

      el.style.maxWidth = `${clampedWidthPx}px`

      if (el.scrollWidth <= clampedWidthPx + 0.5) return

      const hasSpaces = /\s/.test(trimmedText)
      if (hasSpaces) {
        const oneLineMinFontPx = Number.isFinite(baseFontPx)
          ? Math.max(COMPARISON_BOTTOM_NAME_MIN_FONT_PX, baseFontPx * 0.5)
          : COMPARISON_BOTTOM_NAME_MIN_FONT_PX

        shrinkElementTextToWidth(el, clampedWidthPx, oneLineMinFontPx)
        if (el.scrollWidth <= clampedWidthPx + 0.5) return

        const [lineA, lineB] = splitNameForTwoRows(sourceText)
        if (lineB) {
          el.textContent = `${lineA}\n${lineB}`
          el.style.whiteSpace = 'pre'
          el.style.fontSize = `calc(var(--tb-type-2) * ${COMPARISON_BOTTOM_NAME_TWO_LINE_MULTIPLIER})`
          el.style.lineHeight = '0.92'
          el.style.maxWidth = `${clampedWidthPx}px`
          shrinkElementTextToWidth(el, clampedWidthPx)
          return
        }
      }

      el.textContent = sourceText
      el.style.whiteSpace = 'nowrap'
      el.style.fontSize = `calc(var(--tb-type-2) * ${COMPARISON_BOTTOM_NAME_BASE_MULTIPLIER})`
      el.style.maxWidth = `${clampedWidthPx}px`
      shrinkElementTextToWidth(el, clampedWidthPx)
    }

    const updateLayout = () => {
      const rowRect = rowEl.getBoundingClientRect()
      const drawHeaderRect = drawHeaderEl.getBoundingClientRect()
      const drawLeftBoundaryPx = drawHeaderRect.left - rowRect.left
      const drawRightBoundaryPx = drawHeaderRect.right - rowRect.left

      applyBottomNameLayout({
        el: leftNameEl,
        side: 'left',
        sourceText: fighterAText,
        boundaryPx: drawLeftBoundaryPx,
        rowRect,
      })
      applyBottomNameLayout({
        el: rightNameEl,
        side: 'right',
        sourceText: fighterBText,
        boundaryPx: drawRightBoundaryPx,
        rowRect,
      })

      if (favoriteSide === 'draw') {
        stampEl.style.left = COMPARISON_FAVORITE_STAMP_DRAW_POS
        return
      }

      const targetNameEl = favoriteSide === 'a' ? leftNameEl : rightNameEl
      const nameRect = targetNameEl.getBoundingClientRect()
      const anchorPx = nameRect.left - rowRect.left + nameRect.width * (2 / 3)
      stampEl.style.left = `${anchorPx}px`
    }

    updateLayout()
    const resizeObserver = new ResizeObserver(() => updateLayout())
    resizeObserver.observe(rowEl)
    resizeObserver.observe(drawHeaderEl)
    window.addEventListener('resize', updateLayout)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateLayout)
    }
  }, [favoriteSide, fighterAText, fighterBText])

  const [radarClock, setRadarClock] = useState(0)
  useEffect(() => {
    const startedAt = performance.now()
    const timer = window.setInterval(() => {
      setRadarClock(performance.now() - startedAt)
    }, 70)
    return () => window.clearInterval(timer)
  }, [])

  const radarSlotCount = Math.max(1, rows.length)
  const radarSlot = Math.floor(radarClock / 3000) % radarSlotCount
  const radarProgress = (radarClock % 3000) / 3000
  const animatedRows = rows.map((row, index) => {
    if (index !== radarSlot) return row
    return {
      ...row,
      a: Math.round(row.a * radarProgress),
      b: Math.round(row.b * radarProgress),
    }
  })
  
  const buildRowValue = (row: (typeof rows)[number], side: 'a' | 'b' | 'draw') => {
    if (side === 'draw') return `${row.a} = ${row.b}`
    if (side === 'a') return `${row.a} > ${row.b}`
    return `${row.b} > ${row.a}`
  }

  const renderComparisonCell = (row: (typeof rows)[number], side: 'a' | 'b' | 'draw') => {
    const isVisible = side === 'draw' ? row.winner === 'draw' : row.winner === side
    if (!isVisible) return null

    const labelStyle = side === 'b'
      ? rightPanelTextStyle
      : side === 'draw'
        ? drawPanelTextStyle
        : leftPanelTextStyle
    const valueStyle: CSSProperties = {
      ...labelStyle,
      opacity: 0.95,
      display: 'inline-block',
      whiteSpace: 'nowrap',
      lineHeight: 1,
      fontSize: 'calc(var(--tb-type-2) * 0.8)',
      letterSpacing: '0.02em',
      width: STAT_VALUE_COL_WIDTH,
      textAlign: side === 'b' ? 'right' : 'left',
    }

    const rowTrackStyle: CSSProperties = {
      display: 'grid',
      gridTemplateColumns: STAT_ROW_TEMPLATE,
      alignItems: 'baseline',
      columnGap: STAT_COL_GAP,
      minHeight: 'calc(var(--tb-type-2) * 0.92)',
      width: STAT_TRACK_WIDTH,
      marginLeft: side === 'b' || side === 'draw' ? 'auto' : 0,
      marginRight: side === 'a' || side === 'draw' ? 'auto' : 0,
      transform: `translate(0px, ${COMPARISON_TEXT_OFFSET_Y_PX}px)`,
    }

    return (
      <div style={rowTrackStyle}>
        <p
          style={{
            ...labelStyle,
            width: STAT_LABEL_COL_WIDTH,
            minWidth: STAT_LABEL_COL_WIDTH,
            whiteSpace: 'nowrap',
            textAlign: side === 'draw' ? 'left' : 'left',
            lineHeight: 1,
            paddingLeft: side === 'b' ? RIGHT_LABEL_START : 0,
          }}
        >
          {row.label}
        </p>
        <p style={valueStyle}>{buildRowValue(row, side)}</p>
      </div>
    )
  }

  const headerTextStr = typeof headerText === 'string' ? headerText : "TACTICAL BOARD"
  const chars = headerTextStr.split('')
  const [activeGlitches, setActiveGlitches] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (chars.length === 0) return

    const MAX_CONCURRENT = 3
    const active = new Set<number>()
    const timeouts = new Map<number, ReturnType<typeof setTimeout>>()
    let isMounted = true

    const startGlitch = () => {
      if (!isMounted) return
      if (active.size >= MAX_CONCURRENT) return

      const available = []
      for (let i = 0; i < chars.length; i++) {
        if (!active.has(i) && chars[i] !== ' ') available.push(i)
      }
      if (available.length === 0) return

      const nextIndex = available[Math.floor(Math.random() * available.length)]
      active.add(nextIndex)
      setActiveGlitches(new Set(active))

      const duration = 2000 + Math.random() * 3000

      const timeoutId = setTimeout(() => {
        if (!isMounted) return
        active.delete(nextIndex)
        setActiveGlitches(new Set(active))
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
    <div className="vs-tactical-board25-surface vs-parameter-comparison-surface">
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '32% 36% 32%', columnGap: '0.7rem', alignItems: 'flex-start' }}>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'flex-start', gap: '0.55rem' }}>
              <span style={leftPanelTextStyle}>{leftHeader}</span>
              <p style={{ ...leftPanelTextStyle, textAlign: 'left' }}>
                {averageShort} {averageA.toFixed(1)}
              </p>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 0.16rem)', height: '1px', background: COMPARISON_ACCENT_UNDERLINE_BG, pointerEvents: 'none' }} />
            </div>
            <div />
            <div style={{ display: 'flex', justifyContent: 'flex-end', transform: `translateX(${COMPARISON_RIGHT_COLUMN_SHIFT_X_PX}px)` }}>
              <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: STAT_ROW_TEMPLATE, columnGap: STAT_COL_GAP, alignItems: 'baseline', width: STAT_TRACK_WIDTH, marginLeft: 'auto' }}>
                <p style={{ ...rightPanelTextStyle, width: STAT_LABEL_COL_WIDTH, margin: 0, whiteSpace: 'nowrap', textAlign: 'left', paddingLeft: RIGHT_LABEL_START }}>
                  {rightHeader}
                </p>
                <p style={{ ...rightPanelTextStyle, width: STAT_VALUE_COL_WIDTH, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {averageShort} {averageB.toFixed(1)}
                </p>
                <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 0.16rem)', height: '1px', background: COMPARISON_ACCENT_UNDERLINE_BG, pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, marginTop: '7px', transform: 'translateY(-12px)' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '32% 36% 32%',
                columnGap: '0.7rem',
                marginBottom: '0.65rem',
                alignItems: 'flex-end',
                paddingTop: COMPARISON_HEADER_TOP_TUNE,
                paddingLeft: 0,
                paddingRight: 0,
              }}
            >
              <div>
                <p style={leftPanelTextStyle}>{advantageHeader}</p>
              </div>
              <div />
              <div style={{ display: 'flex', justifyContent: 'flex-end', transform: `translateX(${COMPARISON_RIGHT_COLUMN_SHIFT_X_PX}px)` }}>
                <div style={{ display: 'grid', gridTemplateColumns: STAT_ROW_TEMPLATE, columnGap: STAT_COL_GAP, width: STAT_TRACK_WIDTH, marginLeft: 'auto' }}>
                  <p style={{ ...rightPanelTextStyle, width: STAT_LABEL_COL_WIDTH, textAlign: 'left', whiteSpace: 'nowrap', paddingLeft: RIGHT_LABEL_START }}>
                    {advantageHeader}
                  </p>
                  <span style={{ width: STAT_VALUE_COL_WIDTH }} aria-hidden="true" />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '32% 36% 32%', columnGap: '0.7rem', flex: 1, minHeight: 0, marginTop: '0.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ overflow: 'visible', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 0, paddingTop: COMPARISON_SIDE_ROWS_TOP_TUNE, paddingBottom: '2rem' }}>
                  {leftAdvantages.map((row, index) => (
                    <div
                      key={`comparison-left-row-${row.id}`}
                      data-comp-row="true"
                      data-comp-side="left"
                      data-comp-row-index={index}
                      data-comp-row-id={row.id}
                      style={{ display: 'flex', flexDirection: 'column', minHeight: 0, marginTop: index > 0 ? `${COMPARISON_SIDE_ROW_STEP_EXTRA_PX}px` : 0 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', transform: index === 1 ? `translateY(${COMPARISON_SECOND_ROW_Y_TUNE_PX}px)` : undefined }}>
                        {renderComparisonCell(row, 'a')}
                      </div>
                      {index < leftAdvantages.length - 1 ? (
                        <div
                          data-comp-separator-track="true"
                          data-comp-side="left"
                          data-comp-separator-index={index}
                          style={{ marginTop: COMPARISON_SEPARATOR_MARGIN, marginBottom: COMPARISON_SEPARATOR_MARGIN, transform: `translateY(${COMPARISON_SEPARATOR_Y_TUNE_PX + COMPARISON_SECOND_ROW_Y_TUNE_PX / 2}px)`, display: 'flex', justifyContent: 'flex-start' }}
                        >
                          <div data-comp-separator-bar="true" style={{ height: '2px', width: COMPARISON_SEPARATOR_WIDTH, background: '#ff554e' }} />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ flex: 2.4, position: 'relative', minHeight: '340px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={animatedRows}
                      cx="50%"
                      cy="50%"
                      outerRadius="88%"
                    >
                      <PolarGrid stroke="rgba(148,163,184,0.35)" />
                      <PolarAngleAxis dataKey="label" tick={{ fill: '#CBD5E1', fontSize: 16 }} />
                      <Radar dataKey="a" stroke={fighterA.color} fill={fighterA.color} fillOpacity={0.33} isAnimationActive />
                      <Radar dataKey="b" stroke={fighterB.color} fill={fighterB.color} fillOpacity={0.28} isAnimationActive />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', minHeight: 0, marginTop: '0.35rem', marginBottom: 0 }}>
                  <div style={{ overflow: 'visible', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 0, paddingTop: 0, paddingBottom: '0.12rem' }}>
                    <p ref={drawHeaderAnchorRef} style={{ ...drawPanelTextStyle, textAlign: 'center', marginBottom: '0.34rem' }}>{drawHeader}</p>
                    {drawRowsBottomAnchored.map((row, index) => (
                      <div
                        key={`comparison-draw-row-${row.id}`}
                        data-comp-row="true"
                        data-comp-side="center"
                        data-comp-row-index={index}
                        data-comp-row-id={row.id}
                        style={{ display: 'flex', flexDirection: 'column', minHeight: 0, marginTop: index > 0 ? `${COMPARISON_ROW_DRIFT_FIX_PX}px` : 0 }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {renderComparisonCell(row, 'draw')}
                        </div>
                        {index < drawRowsBottomAnchored.length - 1 ? (
                          <div
                            data-comp-separator-track="true"
                            data-comp-side="center"
                            data-comp-separator-index={index}
                            style={{ marginTop: COMPARISON_SEPARATOR_MARGIN, marginBottom: COMPARISON_SEPARATOR_MARGIN, display: 'flex', justifyContent: 'center' }}
                          >
                            <div data-comp-separator-bar="true" style={{ height: '2px', width: COMPARISON_SEPARATOR_WIDTH, background: '#ff554e' }} />
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ overflow: 'visible', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 0, paddingTop: COMPARISON_SIDE_ROWS_TOP_TUNE, paddingBottom: '2rem' }}>
                  {rightAdvantages.map((row, index) => (
                    <div
                      key={`comparison-right-row-${row.id}`}
                      data-comp-row="true"
                      data-comp-side="right"
                      data-comp-row-index={index}
                      data-comp-row-id={row.id}
                      style={{ display: 'flex', flexDirection: 'column', minHeight: 0, marginTop: index > 0 ? `${COMPARISON_SIDE_ROW_STEP_EXTRA_PX}px` : 0 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', transform: index === 1 ? `translate(${COMPARISON_RIGHT_COLUMN_SHIFT_X_PX}px, ${COMPARISON_SECOND_ROW_Y_TUNE_PX}px)` : `translateX(${COMPARISON_RIGHT_COLUMN_SHIFT_X_PX}px)` }}>
                        {renderComparisonCell(row, 'b')}
                      </div>
                      {index < rightAdvantages.length - 1 ? (
                        <div
                          data-comp-separator-track="true"
                          data-comp-side="right"
                          data-comp-separator-index={index}
                          style={{ marginTop: COMPARISON_SEPARATOR_MARGIN, marginBottom: COMPARISON_SEPARATOR_MARGIN, transform: `translateY(${COMPARISON_SEPARATOR_Y_TUNE_PX + COMPARISON_SECOND_ROW_Y_TUNE_PX / 2}px)`, display: 'flex', justifyContent: 'flex-end' }}
                        >
                          <div data-comp-separator-bar="true" style={{ height: '2px', width: COMPARISON_SEPARATOR_WIDTH, background: '#ff554e' }} />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.1rem', padding: '0.58rem 0.2rem 0.18rem' }}>
            <div style={{ height: '1px', marginBottom: '0.42rem', background: COMPARISON_ACCENT_UNDERLINE_BG }} />
            <div ref={bottomNamesRowRef} style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', alignItems: 'end', columnGap: '1.1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.08rem', transform: `translate(${COMPARISON_BOTTOM_NAME_INSET_X_PX}px, ${COMPARISON_BOTTOM_NAME_DROP_Y_PX}px)` }}>
                <p ref={leftBottomNameRef} style={{ ...leftPanelTextStyle, fontSize: `calc(var(--tb-type-2) * ${COMPARISON_BOTTOM_NAME_BASE_MULTIPLIER})`, lineHeight: 0.9, letterSpacing: '0.012em', whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'clip', maxWidth: '100%', opacity: 1, textShadow: COMPARISON_BOTTOM_LEFT_NAME_SHADOW, marginBottom: '0.12rem' }}>
                  {fighterAText}
                </p>
              </div>
              <div style={{ width: '1px', minHeight: '1px' }} aria-hidden="true" />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.08rem', transform: `translate(${COMPARISON_RIGHT_COLUMN_SHIFT_X_PX - COMPARISON_BOTTOM_NAME_INSET_X_PX}px, ${COMPARISON_BOTTOM_NAME_DROP_Y_PX}px)` }}>
                <p ref={rightBottomNameRef} style={{ ...rightPanelTextStyle, fontSize: `calc(var(--tb-type-2) * ${COMPARISON_BOTTOM_NAME_BASE_MULTIPLIER})`, lineHeight: 0.9, letterSpacing: '0.012em', whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'clip', maxWidth: '100%', opacity: 1, textShadow: COMPARISON_BOTTOM_RIGHT_NAME_SHADOW, marginBottom: '0.12rem' }}>
                  {fighterBText}
                </p>
              </div>
              <div
                ref={favoriteStampRef}
                className="vs-parameter-favorite-stamp"
                style={{
                  position: 'absolute',
                  left: favoriteStampLeft,
                  bottom: `calc(0.14rem + ${COMPARISON_FAVORITE_STAMP_BOTTOM_PX}px)`,
                  transform: `translateX(-50%) rotate(${favoriteStampRotationDeg}deg)`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: `${COMPARISON_FAVORITE_STAMP_WIDTH_REM}rem`,
                  maxWidth: 'calc(100% - 24px)',
                  minHeight: `${COMPARISON_FAVORITE_STAMP_MIN_HEIGHT_REM}rem`,
                  border: '1px solid rgba(251, 191, 36, 1)',
                  borderRadius: '10px',
                  background:
                    'linear-gradient(118deg, rgba(80, 28, 4, 1) 0%, rgba(145, 86, 8, 1) 24%, rgba(230, 145, 10, 1) 49%, rgba(145, 86, 8, 1) 74%, rgba(80, 28, 4, 1) 100%)',
                  backgroundSize: '240% 240%',
                  boxShadow:
                    '0 12px 28px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(120, 53, 15, 0.9) inset, 0 0 16px rgba(251, 191, 36, 0.28)',
                  animation: 'none',
                  textShadow: 'none',
                  pointerEvents: 'none',
                  zIndex: 3,
                }}
              >
                <p className="vs-parameter-favorite-stamp-text" style={{ margin: 0, padding: '0.12rem 0.72rem', fontFamily: "'Chakra Petch', sans-serif", fontSize: 'calc(var(--tb-type-2) * 0.64)', fontWeight: 800, lineHeight: 0.96, letterSpacing: '0.03em', textTransform: 'uppercase', whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip', display: 'block', color: '#7fe9ff', WebkitTextFillColor: '#7fe9ff', textShadow: 'none' }}>
                  {favoriteBadgeText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
