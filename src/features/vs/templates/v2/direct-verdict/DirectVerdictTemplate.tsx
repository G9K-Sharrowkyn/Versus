import './DirectVerdictTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField, resolveFightTemplateImageUrl } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { FittedText } from '../../shared/FittedText'
import { AdjustableTemplateImage } from '../../../components/AdjustableTemplateImage'
import { applyDossierNameAutofit } from '../../shared/dossierNameAutofit'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'
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
  portraitAAdjust,
  portraitBAdjust,
  averageA,
  averageB,
  title,
  subtitle,
  templateBlocks,
  activeFightFolderKey,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
  onToggleLanguage,
  integratedToolbar,
}: DirectVerdictTemplateProps) {
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('direct-verdict', language, tacticalBlockFields)

  const common = getFightCommonCopy('direct-verdict', language)
  const BLUE_EKSTREMALNY = '#77e2f2'
  const RED_LINIA = '#ff554e'
  const REFLEKS_IMIENIA_POSTACI = '0 1em 0.28em color-mix(in srgb, currentColor 45%, transparent)'
  const REFLEKS_TRESCI_FAKTOW = '0 var(--tb-reflect-2-y) 0.55em rgba(119, 226, 242, 0.45)'
  const REFLEKS_ETYKIET_FAKTOW = '0 var(--tb-reflect-2-y) 0.55em rgba(255, 85, 78, 0.45)'
  const fighterAFallback = getFightTemplateDefaultField('direct-verdict', 'fighter_a_fallback', language)
  const fighterBFallback = getFightTemplateDefaultField('direct-verdict', 'fighter_b_fallback', language)
  const outcomeText = getFightTemplateDefaultField('direct-verdict', 'outcome_label', language)
  const confidenceText = getFightTemplateDefaultField('direct-verdict', 'confidence_label', language)
  const reasonText = getFightTemplateDefaultField('direct-verdict', 'reason_label', language)
  const fighterAName = fighterA.name || fighterAFallback
  const fighterBName = fighterB.name || fighterBFallback
  const winnerSide: 'a' | 'b' = averageA >= averageB ? 'a' : 'b'
  const defaultWinner = winnerSide === 'a' ? fighterAName : fighterBName
  const accentColor = winnerSide === 'a' ? fighterA.color : fighterB.color

  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['direct-verdict'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const ui = getTemplateUi('direct-verdict', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  
  const line = (position: number, keys: string[], fallback = common.emptyFieldLabel) =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const headerText = title
  const subText = subtitle

  const winnerLabel = pickTemplateField(blockFields, ['winner', 'verdict']) || defaultWinner
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
  const boardHeader =
    getFightTemplateDefaultField('direct-verdict', 'board_header', language) || common.verdictLabel
  const customLeftImageFile =
    pickTemplateField(blockFields, ['left_image', 'left_img', 'portrait_a', 'image_a', 'fighter_a_image']) || ''
  const customRightImageFile =
    pickTemplateField(blockFields, ['right_image', 'right_img', 'portrait_b', 'image_b', 'fighter_b_image']) || ''
  const leftImageUrl = customLeftImageFile
    ? resolveFightTemplateImageUrl(activeFightFolderKey, customLeftImageFile)
    : fighterA.imageUrl
  const rightImageUrl = customRightImageFile
    ? resolveFightTemplateImageUrl(activeFightFolderKey, customRightImageFile)
    : fighterB.imageUrl

  const winnerImage = winnerSide === 'a' ? leftImageUrl : rightImageUrl
  const winnerBaseAdjust = winnerSide === 'a' ? portraitAAdjust : portraitBAdjust
  const winnerImageKey = `direct-verdict:winner:${winnerSide}`
  const winnerNameWrapperRef = useRef<HTMLDivElement | null>(null)
  const winnerNameHeadingRef = useRef<HTMLHeadingElement | null>(null)
  const headerTextStr = typeof headerText === 'string' ? headerText : ''
  const chars = headerTextStr.split('')
  const [activeGlitches, setActiveGlitches] = useState<Set<number>>(new Set())

  useLayoutEffect(() => {
    const wrapperEl = winnerNameWrapperRef.current
    const headingEl = winnerNameHeadingRef.current
    if (!wrapperEl || !headingEl) return

    const applyFit = () => {
      applyDossierNameAutofit({
        element: headingEl,
        container: wrapperEl,
        sourceText: winnerLabel,
        config: {
          baseScale: 0.85,
          twoLineScale: 0.425,
          oneLineMinScale: 0.5,
          minFontPx: 8,
        },
      })
    }

    applyFit()
    const delayedReflows = [
      window.setTimeout(applyFit, 80),
      window.setTimeout(applyFit, 220),
      window.setTimeout(applyFit, 520),
    ]

    let disposed = false
    const fontSet = typeof document !== 'undefined' ? document.fonts : null
    const handleFontsReady = () => {
      if (disposed) return
      applyFit()
    }
    if (fontSet) {
      fontSet.ready.then(handleFontsReady).catch(() => {})
      if (typeof fontSet.addEventListener === 'function') {
        fontSet.addEventListener('loadingdone', handleFontsReady)
      }
    }

    const resizeObserver = new ResizeObserver(() => applyFit())
    resizeObserver.observe(wrapperEl)
    window.addEventListener('resize', applyFit)

    return () => {
      disposed = true
      delayedReflows.forEach((timerId) => window.clearTimeout(timerId))
      if (fontSet && typeof fontSet.removeEventListener === 'function') {
        fontSet.removeEventListener('loadingdone', handleFontsReady)
      }
      resizeObserver.disconnect()
      window.removeEventListener('resize', applyFit)
    }
  }, [winnerLabel])

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
    <div className="vs-tactical-board25-surface vs-template--direct-verdict">
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
        <div className="vs-tb-signal-main" style={{ transform: 'none', minWidth: 'auto', maxWidth: 'none', minHeight: 'auto', padding: '0.1em 0.5em', margin: '0 auto', background: '#ff554e', width: '75%' }}>
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
            <div className="glow" style={{ fontSize: '3.5vw', width: '100%', textAlign: 'center', pointerEvents: 'none', textShadow: 'none' }}>{headerTextStr}</div>
          </div>
        </div>
        <p className="vs-tactical-board25-subtitle" style={{ color: BLUE_EKSTREMALNY, textShadow: `0 0 8px ${BLUE_EKSTREMALNY}E6, 0 0 16px ${BLUE_EKSTREMALNY}66`, fontWeight: 'bold', letterSpacing: '0.05em' }}><GlitchText text={(subText || '').replace(/\.\s*$/, '')} /></p>
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

      <section
        className="vs-tactical-board25-stats"
        style={{
          border: '10px solid rgba(255, 85, 78, 1)',
          background: 'transparent',
          boxShadow: 'none',
          padding: '1.04rem 1.08rem',
        }}
      >
        <p className="vs-tactical-board25-stats-title vs-panel-top-label" style={{ color: RED_LINIA }}><GlitchText text={boardHeader} /></p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', padding: '0.5rem 1rem 0.5rem 1.5rem' }}>
          <div ref={winnerNameWrapperRef} style={{ borderLeft: `4px solid ${accentColor}`, paddingLeft: '1.5rem', minHeight: '4.5rem' }}>
            <h3 ref={winnerNameHeadingRef} className="vs-dossier-text-1" style={{ color: accentColor, textShadow: REFLEKS_IMIENIA_POSTACI, fontSize: 'calc(var(--tb-type-1) * 0.85)', whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'clip', maxWidth: '100%', display: 'inline-block' }}>{winnerLabel}</h3>
          </div>

          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ width: 'max-content', position: 'relative', paddingBottom: '6px', marginBottom: '0.6rem' }}>
                <p className="vs-dossier-text-3" style={{ color: RED_LINIA, textShadow: REFLEKS_ETYKIET_FAKTOW, fontWeight: 'bold', letterSpacing: '0.05em' }}>
                  <GlitchText text={outcomeText} />
                </p>
              <div style={{ width: '100%', height: '2px', background: RED_LINIA, position: 'absolute', bottom: 0, left: 0, boxShadow: `0 0 10px ${RED_LINIA}66` }} />
              <div style={{ width: '100%', height: '2px', background: RED_LINIA, position: 'absolute', bottom: '-45px', left: 0, filter: 'blur(2px)', opacity: 0.8 }} />
              </div>
              <p className="vs-dossier-text-2" style={{ textShadow: REFLEKS_TRESCI_FAKTOW, fontStyle: 'normal', overflowWrap: 'anywhere' }}>
                {outcomeLabel}
              </p>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ width: 'max-content', position: 'relative', paddingBottom: '6px', marginBottom: '0.6rem' }}>
                <p className="vs-dossier-text-3" style={{ color: RED_LINIA, textShadow: REFLEKS_ETYKIET_FAKTOW, fontWeight: 'bold', letterSpacing: '0.05em' }}>
                  <GlitchText text={confidenceText} />
                </p>
                <div style={{ width: '100%', height: '2px', background: RED_LINIA, position: 'absolute', bottom: 0, left: 0, boxShadow: `0 0 10px ${RED_LINIA}66` }} />
                <div style={{ width: '100%', height: '2px', background: RED_LINIA, position: 'absolute', bottom: '-45px', left: 0, filter: 'blur(2px)', opacity: 0.8 }} />
              </div>
              <p className="vs-dossier-text-2" style={{ textShadow: REFLEKS_TRESCI_FAKTOW, fontStyle: 'normal', overflowWrap: 'anywhere' }}>
                {certaintyLabel}
              </p>
            </div>
          </div>

          <div>
            <div style={{ width: 'max-content', position: 'relative', paddingBottom: '6px', marginBottom: '0.8rem' }}>
              <p className="vs-dossier-text-3" style={{ color: RED_LINIA, textShadow: REFLEKS_ETYKIET_FAKTOW, fontWeight: 'bold', letterSpacing: '0.05em' }}>
                <GlitchText text={reasonText} />
              </p>
              <div style={{ width: '100%', height: '2px', background: RED_LINIA, position: 'absolute', bottom: 0, left: 0, boxShadow: `0 0 10px ${RED_LINIA}66` }} />
              <div style={{ width: '100%', height: '2px', background: RED_LINIA, position: 'absolute', bottom: '-45px', left: 0, filter: 'blur(2px)', opacity: 0.8 }} />
            </div>
            {summaryLines.map((item, index) => (
              <div key={`direct-verdict-line-${index}-${item}`} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: index === summaryLines.length - 1 ? 0 : '0.95rem' }}>
                <span style={{ color: accentColor, fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                  {index + 1}
                </span>
                <p className="vs-dossier-text-2" style={{ flex: 1, textShadow: REFLEKS_TRESCI_FAKTOW, fontStyle: 'normal', margin: 0, paddingBottom: '0.48rem', overflow: 'visible', overflowWrap: 'anywhere' }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="vs-tactical-board25-reality">
        <p className="vs-tactical-board25-reality-heading vs-panel-top-label" style={{ color: RED_LINIA }}><GlitchText text={winnerLabel} /></p>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 1 }}>
          <AdjustableTemplateImage
            imageUrl={winnerImage}
            alt={winnerLabel}
            fallbackLabel={common.portraitSlot}
            adjustKey={winnerImageKey}
            baseAdjust={winnerBaseAdjust}
            adjustments={slideImageAdjustments}
            onAdjustChange={onSlideImageAdjustChange}
            onAdjustCommit={onSlideImageAdjustCommit}
            plain
          />
        </div>
      </div>
    </div>
  )
}
