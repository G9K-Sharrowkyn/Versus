import './DirectVerdictTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, type ReactNode } from 'react'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { FittedText } from '../../shared/FittedText'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'
import { AnimeLightning } from '../../../components/AnimeLightning'
import { CyberpunkMetaValue } from '../../../components/CyberpunkMetaValue'

type DirectVerdictTemplateProps = TemplatePreviewProps & {
  integratedToolbar?: ReactNode
}

const GLITCH_CHARS = '!@#$%^&Ă˘â€“â€Ă˘â€“â€śĂ˘â€“â€™Ă˘â€“ĹšĂ˘â€“ÂĂ˘â€˘Â Ă˘â€˘ĹĂ˘â€˘Â¦Ă˘â€˘Â¬Ă˘â€ťÄ˝Ă˘â€˘Â«ĂŽÂ©'.split('')

function SubtleCyberpunkLabel({ text }: { text: string }) {
  const [display, setDisplay] = useState(text)
  useEffect(() => {
    setDisplay(text)
  }, [text])
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

export function DirectVerdictTemplate({
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
}: DirectVerdictTemplateProps) {
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('direct-verdict', language, tacticalBlockFields)
  
  const realityHeader =
    getFightTemplateDefaultField('tactical-board', 'right_header', language)

  const common = getFightCommonCopy('direct-verdict', language)
  const fighterAFallback = getFightTemplateDefaultField('direct-verdict', 'fighter_a_fallback', language)
  const fighterBFallback = getFightTemplateDefaultField('direct-verdict', 'fighter_b_fallback', language)
  const defeatsWord = getFightTemplateDefaultField('direct-verdict', 'defeats_word', language)
  const outcomeText = getFightTemplateDefaultField('direct-verdict', 'outcome_label', language)
  const confidenceText = getFightTemplateDefaultField('direct-verdict', 'confidence_label', language)
  const reasonText = getFightTemplateDefaultField('direct-verdict', 'reason_label', language)
  const fighterAName = fighterA.name || fighterAFallback
  const fighterBName = fighterB.name || fighterBFallback
  const winnerSide: 'a' | 'b' = averageA >= averageB ? 'a' : 'b'
  const defaultWinner = winnerSide === 'a' ? fighterAName : fighterBName
  const defaultLoser = winnerSide === 'a' ? fighterBName : fighterAName
  const accentColor = winnerSide === 'a' ? fighterA.color : fighterB.color

  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['direct-verdict'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const ui = getTemplateUi('direct-verdict', language)
  const shell = ui.highEnd as Record<string, string>
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  
  const line = (position: number, keys: string[], fallback = common.emptyFieldLabel) =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
    
  const headerText = title
  const subText = subtitle
  
  const boardHeader =
    getFightTemplateDefaultField('tactical-board', 'left_header', language) || common.emptyFieldLabel

  const winnerLabel = pickTemplateField(blockFields, ['winner', 'verdict']) || defaultWinner
  const loserLabel = pickTemplateField(blockFields, ['loser', 'opponent']) || defaultLoser
  const outcomeLabel =
    pickTemplateField(blockFields, ['outcome', 'result', 'method']) ||
    common.emptyFieldLabel
  const certaintyLabel =
    pickTemplateField(blockFields, ['certainty', 'margin', 'confidence']) ||
    common.emptyFieldLabel
  const summaryLines = [
    line(0, ['line_1', 'line1']),
    line(1, ['line_2', 'line2']),
    line(2, ['line_3', 'line3']),
  ]

  const matchupText = `${fighterAName} VS ${fighterBName}`
  const matchupMatch = matchupText.match(/^(.*?)(\s+VS\s+)(.*)$/i)

  const headerTextStr = typeof headerText === 'string' ? headerText : ''
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
        <p className="vs-tactical-board25-subtitle" style={{ color: '#77e2f2' }}>{(subText || '').replace(/\.\s*$/, '')}</p>
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

      <section className="vs-tactical-board25-stats">
        <p className="vs-tactical-board25-stats-title vs-panel-top-label" style={{ color: '#77e2f2' }}><GlitchText text={boardHeader} /></p>
        
        <div className={layout.BODY_CLASS} style={{ display: 'flex', gap: '1rem', flex: 1 }}>
          <div className={layout.LEFT_PANEL_CLASS} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(2, 6, 23, 0.5)', padding: '1rem', border: `1px solid ${accentColor}40`, boxShadow: `0 0 0 1px ${accentColor}33 inset` }}>
            <div
              className={layout.VERDICT_PANEL_CLASS}
              style={{
                border: `1px solid ${accentColor}88`,
                background: `linear-gradient(145deg, ${accentColor}33, rgba(15,23,42,0.78))`,
                padding: '1.5rem',
                textAlign: 'center',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <p className={layout.VERDICT_LABEL_CLASS} style={{ color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                {common.verdictLabel}
              </p>
              <FittedText
                as="p"
                slotKey="direct-verdict:winner"
                spec={slots.directVerdictWinner}
                text={winnerLabel}
                className={layout.WINNER_TEXT_CLASS}
                style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: accentColor, lineHeight: 1.1 }}
              />
              <FittedText
                as="p"
                slotKey="direct-verdict:subline"
                spec={slots.directVerdictSubline}
                text={`${defeatsWord} ${loserLabel}`}
                className={layout.SUBLINE_TEXT_CLASS}
                style={{ color: '#94a3b8', fontSize: '1.2rem', marginTop: '0.5rem' }}
              />
            </div>

            <div className={layout.INFO_GRID_CLASS} style={{ display: 'flex', gap: '1rem' }}>
              <div className={layout.INFO_CARD_CLASS} style={{ flex: 1, background: 'rgba(0,0,0,0.4)', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className={shell.HIGH_END_LABEL_CLASS} style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>{outcomeText}</p>
                <FittedText
                  as="p"
                  slotKey="direct-verdict:outcome"
                  spec={slots.directVerdictCard}
                  text={outcomeLabel}
                  className={layout.INFO_VALUE_CLASS}
                  style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}
                />
              </div>
              <div className={layout.INFO_CARD_CLASS} style={{ flex: 1, background: 'rgba(0,0,0,0.4)', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className={shell.HIGH_END_LABEL_CLASS} style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>{confidenceText}</p>
                <FittedText
                  as="p"
                  slotKey="direct-verdict:certainty"
                  spec={slots.directVerdictCard}
                  text={certaintyLabel}
                  className={layout.INFO_VALUE_CLASS}
                  style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}
                />
              </div>
            </div>

            <div className={layout.SCORE_GRID_CLASS} style={{ display: 'flex', gap: '1rem' }}>
              <div className={layout.SCORE_CARD_CLASS} style={{ flex: 1, background: 'rgba(0,0,0,0.4)', padding: '0.5rem', border: `1px solid ${fighterA.color}40`, textAlign: 'center' }}>
                <FittedText
                  as="p"
                  slotKey={`direct-verdict:left-score-label:${fighterAName}`}
                  spec={slots.scoreLabel}
                  text={fighterAName}
                  style={{ color: '#94a3b8', fontSize: '0.8rem' }}
                />
                <FittedText
                  as="p"
                  slotKey="direct-verdict:left-score"
                  spec={slots.scoreValue}
                  text={String(Math.round(averageA))}
                  className={layout.SCORE_VALUE_TEXT_CLASS}
                  style={{ color: fighterA.color, fontSize: '2rem', fontWeight: 'bold' }}
                />
              </div>
              <div className={layout.SCORE_CARD_CLASS} style={{ flex: 1, background: 'rgba(0,0,0,0.4)', padding: '0.5rem', border: `1px solid ${fighterB.color}40`, textAlign: 'center' }}>
                <FittedText
                  as="p"
                  slotKey={`direct-verdict:right-score-label:${fighterBName}`}
                  spec={slots.scoreLabel}
                  text={fighterBName}
                  style={{ color: '#94a3b8', fontSize: '0.8rem' }}
                />
                <FittedText
                  as="p"
                  slotKey="direct-verdict:right-score"
                  spec={slots.scoreValue}
                  text={String(Math.round(averageB))}
                  className={layout.SCORE_VALUE_TEXT_CLASS}
                  style={{ color: fighterB.color, fontSize: '2rem', fontWeight: 'bold' }}
                />
              </div>
            </div>
          </div>

          <div className={layout.RIGHT_PANEL_CLASS} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(2, 6, 23, 0.5)', padding: '1.5rem', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <p className={shell.HIGH_END_LABEL_CLASS} style={{ color: '#38bdf8', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', borderBottom: '1px solid rgba(56,189,248,0.3)', paddingBottom: '0.5rem' }}>{reasonText}</p>
            <div className={layout.REASON_GRID_CLASS} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
              {summaryLines.map((item, index) => (
                <div key={`direct-verdict-line-${index}-${item}`} className={layout.REASON_CARD_CLASS} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '4px' }}>
                  <span className={layout.REASON_INDEX_CLASS} style={{ color: accentColor, fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                    {index + 1}
                  </span>
                  <FittedText
                    as="span"
                    slotKey={`direct-verdict:line:${index}`}
                    spec={slots.directVerdictCard}
                    text={item}
                    className={layout.REASON_TEXT_CLASS}
                    style={{ flex: 1, color: '#e2e8f0', fontSize: '1.1rem', lineHeight: 1.5 }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="vs-tactical-board25-reality">
        <p className="vs-tactical-board25-reality-heading vs-panel-top-label" style={{ color: '#77e2f2' }}><GlitchText text={realityHeader} /></p>
        <div className="vs-tactical-board25-reality-viewport">
          <AnimeLightning />
        </div>
      </div>
    </div>
  )
}
