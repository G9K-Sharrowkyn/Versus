import './ParameterComparisonTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, type CSSProperties, type ReactNode } from 'react'
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

const DOSSIER_BLUE_PANEL_TEXT_STYLE: CSSProperties = {
  color: '#77e2f2',
  fontFamily: "'Chakra Petch', sans-serif",
  fontSize: 'calc(var(--tb-type-2) * 0.8)',
  fontWeight: 800,
  lineHeight: 1,
  textTransform: 'uppercase',
  margin: 0,
  textShadow: '0 var(--tb-reflect-2-y, 1.7em) 0.55em rgba(119, 226, 242, 0.45)',
}

const DOSSIER_RED_PANEL_TEXT_STYLE: CSSProperties = {
  ...DOSSIER_BLUE_PANEL_TEXT_STYLE,
  color: '#ff554e',
  textShadow: '0 var(--tb-reflect-2-y, 1.7em) 0.48em rgba(255, 85, 78, 0.62)',
}

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
  const fighterAText = fighterA.name || fighterAFallback
  const fighterBText = fighterB.name || fighterBFallback
  
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
  const favorite =
    isAverageDraw
      ? favoriteDrawLabel
      : favoriteLabel || (averageA > averageB ? `${fighterAText} ${common.favoriteSuffix}` : `${fighterBText} ${common.favoriteSuffix}`)
  const favoriteStamp = isAverageDraw ? favoriteDrawLabel : `PRZEWAGA: ${averageA > averageB ? fighterAText : fighterBText}`

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
  
  const renderAdvantageCards = (
    entries: typeof rows,
    side: 'a' | 'b' | 'draw',
    emptyLabel: string,
  ) => {
    const labelStyle =
      side === 'b'
        ? DOSSIER_RED_PANEL_TEXT_STYLE
        : DOSSIER_BLUE_PANEL_TEXT_STYLE

    const valueForRow = (row: (typeof rows)[number]) => {
      if (side === 'draw') return row.winner === 'draw' ? `${row.a} = ${row.b}` : '—'
      if (side === 'a') return row.winner === 'a' ? `${row.a} > ${row.b}` : '—'
      return row.winner === 'b' ? `${row.b} > ${row.a}` : '—'
    }

    const valueStyle: CSSProperties = {
      ...labelStyle,
      opacity: 0.95,
      whiteSpace: 'nowrap',
      fontSize: 'calc(var(--tb-type-2) * 0.8)',
      letterSpacing: '0.03em',
    }

    if (!entries.length) {
      return (
        <div style={{ padding: '0.75rem 0.4rem', border: '1px dashed rgba(255,85,78,0.35)', textAlign: 'center' }}>
          <p style={DOSSIER_BLUE_PANEL_TEXT_STYLE}>{emptyLabel}</p>
        </div>
      )
    }

    return entries.map((row, index) => {
      return (
        <div key={`${side}-adv-${row.id}`} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.62rem', minHeight: 'calc(var(--tb-type-2) * 0.92)' }}>
            <p
              style={{
                ...labelStyle,
                flex: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {row.label}
            </p>
            <p style={valueStyle}>{valueForRow(row)}</p>
          </div>
          {index < entries.length - 1 ? (
            <div style={{ marginTop: '1.05rem', marginBottom: '1.05rem' }}>
              <div style={{ height: '2px', background: '#ff554e' }} />
            </div>
          ) : null}
        </div>
      )
    })
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
          <SubtleCyberpunkLabel text={tacticalChrome.threatLevelLabel} />: <span style={{ color: '#ff554e', textShadow: '0 0 12px rgba(255, 85, 78, 0.75), 0 0 22px rgba(255, 85, 78, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.threatLevelValue} /></span>
        </p>
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.dataIntegrityLabel} />: <span style={{ color: '#ff554e', textShadow: '0 0 12px rgba(255, 85, 78, 0.75), 0 0 22px rgba(255, 85, 78, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.dataIntegrityValue} /></span>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem' }}>
              <span style={DOSSIER_BLUE_PANEL_TEXT_STYLE}>{leftHeader}</span>
              <p style={{ ...DOSSIER_BLUE_PANEL_TEXT_STYLE, textAlign: 'left' }}>
                {averageShort} {averageA.toFixed(1)}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem' }}>
              <span style={DOSSIER_RED_PANEL_TEXT_STYLE}>{rightHeader}</span>
              <p style={{ ...DOSSIER_BLUE_PANEL_TEXT_STYLE, textAlign: 'right' }}>
                {averageShort} {averageB.toFixed(1)}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', marginBottom: '0.65rem', alignItems: 'flex-end', gap: '1.1rem' }}>
            <div style={{ flex: '0 0 30%' }}>
              <p style={DOSSIER_BLUE_PANEL_TEXT_STYLE}>{advantageHeader}</p>
            </div>
            <div style={{ flex: '0 0 40%', textAlign: 'center' }}>
              <p style={{ ...DOSSIER_BLUE_PANEL_TEXT_STYLE, textAlign: 'center' }}>{drawHeader}</p>
            </div>
            <div style={{ flex: '0 0 30%', textAlign: 'right' }}>
              <p style={{ ...DOSSIER_RED_PANEL_TEXT_STYLE, textAlign: 'right' }}>{advantageHeader}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.7rem', flex: 1, minHeight: 0 }}>
             <div style={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', gap: '0.4rem', minHeight: 0 }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'visible', minHeight: 0, paddingTop: '2rem', paddingBottom: '2rem' }}>
                 {renderAdvantageCards(leftAdvantages, 'a', common.noLeftCategoryEdge)}
               </div>
             </div>

             <div style={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column', gap: '0.56rem', minHeight: 0 }}>
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
               <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', gap: '0.42rem', minHeight: 0 }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'visible', minHeight: 0, paddingTop: '2rem', paddingBottom: '2rem' }}>
                   {renderAdvantageCards(drawRows, 'draw', common.noDrawsCurrentSetup)}
                 </div>
               </div>
             </div>

             <div style={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', gap: '0.4rem', minHeight: 0 }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'visible', minHeight: 0, paddingTop: '2rem', paddingBottom: '2rem' }}>
                 {renderAdvantageCards(rightAdvantages, 'b', common.noRightCategoryEdge)}
               </div>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', alignItems: 'center', padding: '0.58rem 0.9rem 0.42rem', position: 'relative' }}>
            <div style={{ padding: '0.5rem 2rem', border: '1px solid rgba(255,85,78,0.6)', background: 'rgba(15, 6, 6, 0.72)' }}>
              <span style={DOSSIER_BLUE_PANEL_TEXT_STYLE}>{Math.round(averageA)}</span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={DOSSIER_BLUE_PANEL_TEXT_STYLE}>{favoriteLabel}</div>
              <div style={favoriteSide === 'b' ? DOSSIER_RED_PANEL_TEXT_STYLE : DOSSIER_BLUE_PANEL_TEXT_STYLE}>{favorite}</div>
            </div>

            <div style={{ padding: '0.5rem 2rem', border: '1px solid rgba(255,85,78,0.6)', background: 'rgba(15, 6, 6, 0.72)' }}>
              <span style={DOSSIER_RED_PANEL_TEXT_STYLE}>{Math.round(averageB)}</span>
            </div>
          </div>
          <div style={{ marginTop: '0.02rem', alignSelf: 'center', padding: '0.34rem 1.22rem', border: '1px solid rgba(255,85,78,0.55)', background: 'linear-gradient(180deg, rgba(15,6,6,0.72), rgba(5,2,2,0.92))', color: favoriteSide === 'b' ? '#ff554e' : '#77e2f2', fontFamily: "'Chakra Petch', sans-serif", fontSize: 'calc(var(--tb-type-2) * 0.72)', fontWeight: 800, lineHeight: 1, letterSpacing: '0.04em', textTransform: 'uppercase', boxShadow: `0 0 0 1px ${favoriteSide === 'b' ? 'rgba(255,85,78,0.35)' : 'rgba(119,226,242,0.35)'} inset` }}>
            {favoriteStamp}
          </div>
        </div>
      </section>

    </div>
  )
}
