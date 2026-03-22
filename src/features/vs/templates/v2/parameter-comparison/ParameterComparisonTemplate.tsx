import './ParameterComparisonTemplate.scss'
import { useState, useEffect, type ReactNode } from 'react'
import { iconForCategory, AVERAGE_DRAW_THRESHOLD } from '../../../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { AnimeLightning } from '../../../components/AnimeLightning'
import { CyberpunkMetaValue } from '../../../components/CyberpunkMetaValue'
import { FittedText } from '../../shared/FittedText'
import { HighEndFighterBanner } from '../../shared/highEnd'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateStaticField as getFightTemplateDefaultField,
  getTemplateCommonCopy as getFightCommonCopy
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'

type ParameterComparisonTemplateProps = TemplatePreviewProps & {
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

export function ParameterComparisonTemplate({
  activeTemplateId,
  rows,
  fighterA,
  fighterB,
  averageA,
  averageB,
  title,
  subtitle,
  templateBlocks,
  activeFightId,
  language,
  onToggleLanguage,
  integratedToolbar,
}: ParameterComparisonTemplateProps) {
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['parameter-comparison'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, blockFields)
  const boardHeader =
    pickTemplateField(blockFields, ['left_header', 'categories_header']) ||
    getFightTemplateDefaultField('tactical-board', 'left_header', language)
  const realityHeader =
    pickTemplateField(blockFields, ['right_header', 'reality_header']) ||
    getFightTemplateDefaultField('tactical-board', 'right_header', language)
    
  const common = getFightCommonCopy('parameter-comparison', language)
  const ui = getTemplateUi('parameter-comparison', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  
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
  
  const auditPrefix = `${activeFightId || 'draft'}:parameter-comparison`
  const renderAdvantageCards = (
    entries: typeof rows,
    side: 'a' | 'b' | 'draw',
    color: string,
    emptyLabel: string,
    slotPrefix: 'left' | 'right' | 'draw',
  ) => {
    if (!entries.length) {
      return (
        <div style={{ padding: '1rem', border: '1px dashed rgba(255,255,255,0.2)', textAlign: 'center', color: '#94a3b8' }}>
          <FittedText
            as="p"
            slotKey={`${auditPrefix}:${slotPrefix}-empty`}
            spec={slots.parameterAdvantageValue}
            text={emptyLabel}
            templateId="parameter-comparison"
            activeFightId={activeFightId}
            language={language}
          />
        </div>
      )
    }

    return entries.map((row) => {
      const valueText =
        side === 'draw'
          ? `${row.a} = ${row.b}`
          : side === 'a'
            ? `${row.a} > ${row.b}`
            : `${row.b} > ${row.a}`

      return (
        <div
          key={`${slotPrefix}-adv-${row.id}`}
          style={{
            borderColor: `${color}7A`,
            background: `linear-gradient(180deg, ${color}26 0%, rgba(2,6,23,0.86) 100%)`,
            boxShadow: `0 0 0 1px ${color}22 inset`,
            padding: '0.5rem',
            border: `1px solid ${color}40`
          }}
        >
          <FittedText
            as="p"
            slotKey={`${auditPrefix}:${slotPrefix}-label-${row.id}`}
            spec={slots.parameterAdvantageLabel}
            text={row.label}
            style={{ color, fontWeight: 'bold' }}
            templateId="parameter-comparison"
            activeFightId={activeFightId}
            language={language}
          />
          <FittedText
            as="p"
            slotKey={`${auditPrefix}:${slotPrefix}-value-${row.id}`}
            spec={slots.parameterAdvantageValue}
            text={valueText}
            style={{ color: '#e2e8f0', fontSize: '0.9rem' }}
            templateId="parameter-comparison"
            activeFightId={activeFightId}
            language={language}
          />
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
    const timeouts = new Map<number, NodeJS.Timeout>()
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
    <div className="vs-tactical-board25-surface">
      <div className="vs-tactical-board25-line" />
      {integratedToolbar ? <div className="vs-tactical-board25-toolbar">{integratedToolbar}</div> : null}

      <div className="vs-tactical-board25-meta">
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.threatLevelLabel} />: <span style={{ color: '#77e2f2', textShadow: '0 var(--tb-reflect-3-y) var(--tb-reflect-4-blur) rgba(119, 226, 242, 0.2)' }}><CyberpunkMetaValue value={tacticalChrome.threatLevelValue} /></span>
        </p>
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.dataIntegrityLabel} />: <span style={{ color: '#77e2f2', textShadow: '0 var(--tb-reflect-3-y) var(--tb-reflect-4-blur) rgba(119, 226, 242, 0.2)' }}><CyberpunkMetaValue value={tacticalChrome.dataIntegrityValue} /></span>
        </p>
      </div>

      <div className="vs-tactical-board25-heading">
        <div className="vs-tb-signal-main" style={{ transform: 'none', minWidth: 'auto', maxWidth: 'none', minHeight: 'auto', padding: '0.1em 0.5em', margin: 0 }}>
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
            <div className="glow" style={{ fontSize: '4.5vw', width: '100%', textAlign: 'center', pointerEvents: 'none' }}>{headerText}</div>
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

      <section className="vs-tactical-board25-stats">
        <p className="vs-tactical-board25-stats-title" style={{ color: '#77e2f2' }}>{boardHeader}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(2, 6, 23, 0.5)', padding: '1rem', border: `1px solid ${fighterA.color}40` }}>
               <HighEndFighterBanner templateId="parameter-comparison" language={language} fighter={{ ...fighterA, name: leftHeader }} />
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                 {renderAdvantageCards(leftAdvantages, 'a', fighterA.color, common.noLeftCategoryEdge, 'left')}
               </div>
             </div>
             
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ flex: 2, background: 'rgba(2, 6, 23, 0.5)', border: '1px solid rgba(148, 163, 184, 0.2)', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={rows}
                      cx="50%"
                      cy="50%"
                      outerRadius="70%"
                    >
                      <PolarGrid stroke="rgba(148,163,184,0.35)" />
                      <PolarAngleAxis dataKey="label" tick={{ fill: '#CBD5E1', fontSize: 12 }} />
                      <Radar dataKey="a" stroke={fighterA.color} fill={fighterA.color} fillOpacity={0.33} isAnimationActive={false} />
                      <Radar dataKey="b" stroke={fighterB.color} fill={fighterB.color} fillOpacity={0.28} isAnimationActive={false} />
                    </RadarChart>
                  </ResponsiveContainer>
               </div>
               <div style={{ flex: 1, background: 'rgba(2, 6, 23, 0.5)', border: '1px solid rgba(148, 163, 184, 0.2)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '1.2rem', textTransform: 'uppercase' }}>{drawHeader}</p>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                   {renderAdvantageCards(drawRows, 'draw', '#cbd5e1', common.noDrawsCurrentSetup, 'draw')}
                 </div>
               </div>
             </div>
             
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(2, 6, 23, 0.5)', padding: '1rem', border: `1px solid ${fighterB.color}40` }}>
               <HighEndFighterBanner templateId="parameter-comparison" language={language} fighter={{ ...fighterB, name: rightHeader }} />
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                 {renderAdvantageCards(rightAdvantages, 'b', fighterB.color, common.noRightCategoryEdge, 'right')}
               </div>
             </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', padding: '1rem', background: 'rgba(2, 6, 23, 0.5)', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <div style={{ padding: '0.5rem 2rem', border: `1px solid ${fighterA.color}`, background: `${fighterA.color}20` }}>
              <span style={{ color: fighterA.color, fontSize: '2rem', fontWeight: 'bold' }}>{Math.round(averageA)}</span>
            </div>
            
            <div style={{ color: '#fff', fontSize: '1.5rem', textAlign: 'center' }}>
              <div>{favoriteLabel}</div>
              <div style={{ color: favoriteSide === 'a' ? fighterA.color : favoriteSide === 'b' ? fighterB.color : '#fff', fontWeight: 'bold' }}>{favorite}</div>
            </div>
            
            <div style={{ padding: '0.5rem 2rem', border: `1px solid ${fighterB.color}`, background: `${fighterB.color}20` }}>
              <span style={{ color: fighterB.color, fontSize: '2rem', fontWeight: 'bold' }}>{Math.round(averageB)}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="vs-tactical-board25-reality">
        <p className="vs-tactical-board25-reality-heading" style={{ color: '#77e2f2' }}>{realityHeader}</p>
        <div className="vs-tactical-board25-reality-viewport">
          <AnimeLightning />
        </div>
      </div>
    </div>
  )
}