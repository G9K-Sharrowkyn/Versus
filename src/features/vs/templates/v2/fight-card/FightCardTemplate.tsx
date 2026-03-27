import './FightCardTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, type ReactNode, type CSSProperties } from 'react'
import clsx from 'clsx'
import { AdjustableTemplateImage } from '../../../components/AdjustableTemplateImage'
import {
  type FightCardPalette,
  fighterMonogram,
  normalizeHexColor,
  resolveFightCardPalette,
  stripFightLocaleSuffixFromLabel,
} from '../../../helpers'
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

type FightCardTemplateProps = TemplatePreviewProps & {
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

export function FightCardTemplate({
  fighterA,
  fighterB,
  portraitAAdjust,
  portraitBAdjust,
  fightLabel,
  title,
  subtitle,
  templateBlocks,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
  onToggleLanguage,
  integratedToolbar,
}: FightCardTemplateProps) {
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)

  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['fight-card'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome('fight-card', language, blockFields)
  const common = getFightCommonCopy('fight-card', language)
  const ui = getTemplateUi('fight-card', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  
  const boardHeader =
    pickTemplateField(blockFields, ['panel_header', 'fight_card_header']) ||
    getFightTemplateDefaultField('fight-card', 'panel_header', language) || "KARTA WALKI"

  const line = (position: number, keys: string[], fallback = '') =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const fighterAFallback = getFightTemplateDefaultField('fight-card', 'fighter_a_fallback', language)
  const fighterBFallback = getFightTemplateDefaultField('fight-card', 'fighter_b_fallback', language)
  const fighterFallback = getFightTemplateDefaultField('fight-card', 'fighter_fallback', language)
  const finalLabelRaw = line(
    0,
    ['fight_title', 'match_title', 'title_text', 'line_1', 'line1'],
    fightLabel || `${fighterA.name || fighterAFallback} vs ${fighterB.name || fighterBFallback}`,
  )
  const normalizedLabel = finalLabelRaw.replace(/\s+/g, ' ').trim()
  const subText = subtitle || ''
  const isAuditMode = typeof document !== 'undefined' && document.documentElement.dataset.vsAudit === 'true'
  const parsedLabel = normalizedLabel.match(/^\s*(.+?)\s+(?:vs\.?|versus|kontra|v)\s+(.+?)\s*$/i)
  const topName = stripFightLocaleSuffixFromLabel((parsedLabel?.[1] || fighterA.name || fighterAFallback).trim())
  const bottomName = stripFightLocaleSuffixFromLabel((parsedLabel?.[2] || fighterB.name || fighterBFallback).trim())
  const topBasePalette = resolveFightCardPalette(topName, 'a')
  const bottomBasePalette = resolveFightCardPalette(bottomName, 'b')
  const topPalette: FightCardPalette = {
    colorA:
      normalizeHexColor(getFightTemplateDefaultField('fight-card', 'top_color_a', language)) || topBasePalette.colorA,
    colorB:
      normalizeHexColor(getFightTemplateDefaultField('fight-card', 'top_color_b', language)) || topBasePalette.colorB,
    dark: topBasePalette.dark,
  }
  const bottomPalette: FightCardPalette = {
    colorA:
      normalizeHexColor(getFightTemplateDefaultField('fight-card', 'bottom_color_a', language)) || bottomBasePalette.colorA,
    colorB:
      normalizeHexColor(getFightTemplateDefaultField('fight-card', 'bottom_color_b', language)) || bottomBasePalette.colorB,
    dark: bottomBasePalette.dark,
  }

  const renderStaticLine = (text: string, palette: FightCardPalette) => {
    return (
      <FittedText
        as="span"
        slotKey={`fight-card:name:${text}`}
        spec={slots.fightCardName}
        text={text}
        className={layout.WORDMARK_CLASS}
        style={
          {
            color: 'transparent',
            width: '100%',
            fontFamily: 'var(--font-display)',
            fontSize: '4rem',
            textAlign: 'center',
            textTransform: 'uppercase',
            textShadow: '0 0 18px rgba(0,0,0,0.9)',
            backgroundImage: `repeating-linear-gradient(-35deg, ${palette.colorA} 0 26px, ${palette.colorB} 26px 52px)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            letterSpacing: '0.06em',
          } as CSSProperties
        }
      />
    )
  }

  const renderFightCardPortrait = (
    fighter: typeof fighterA,
    nameText: string,
    palette: FightCardPalette,
    side: 'left' | 'right',
  ) => {
    const fighterAdjust = side === 'left' ? portraitAAdjust : portraitBAdjust
    const adjustKey = side === 'left' ? 'fight-card:portrait-a' : 'fight-card:portrait-b'

    return (
      <div
        className={clsx(
          layout.PORTRAIT_CLASS,
          side === 'left' ? layout.PORTRAIT_LEFT_CLASS : layout.PORTRAIT_RIGHT_CLASS,
        )}
        style={
          {
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            border: `8px solid ${fighter.color}`,
            boxShadow: `0 0 0 1px ${fighter.color}40 inset`,
          } as CSSProperties
        }
      >
        <div style={{ position: 'absolute', inset: 0 }}>
          {fighter.imageUrl ? (
            <AdjustableTemplateImage
              imageUrl={fighter.imageUrl}
              alt={fighter.name || fighterFallback}
              fallbackLabel={common.portraitSlot}
              hintLabel={chrome.portraitAdjustHint}
              adjustKey={adjustKey}
              baseAdjust={fighterAdjust}
              adjustments={slideImageAdjustments}
              onAdjustChange={onSlideImageAdjustChange}
              onAdjustCommit={onSlideImageAdjustCommit}
              plain
            />
          ) : (
            <div
              className={layout.FALLBACK_CLASS}
              style={{ color: fighter.color, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'rgba(0,0,0,0.5)' }}
            >
              <div className={layout.FALLBACK_INNER_CLASS} style={{ textAlign: 'center' }}>
                <p className={layout.FALLBACK_MONOGRAM_CLASS} style={{ fontSize: '6rem', opacity: 0.2 }}>{fighterMonogram(fighter.name || fighterFallback)}</p>
                <p className={layout.FALLBACK_LABEL_CLASS}>{common.portraitSlot}</p>
              </div>
            </div>
          )}
          <div className={layout.PORTRAIT_NAME_CLASS} style={{ position: 'absolute', bottom: '9%', left: 0, right: 0, zIndex: 10, padding: '0 0.65rem' }}>{renderStaticLine(nameText, palette)}</div>
          <div className={layout.PORTRAIT_NAME_FADE_CLASS} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '44%', background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)' }} />
        </div>
      </div>
    )
  }

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

      <div className="vs-tactical-board25-meta" style={{ left: '20px' }}>
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
        <p className="vs-tactical-board25-subtitle" style={{ color: '#77e2f2', fontWeight: 'bold', letterSpacing: '0.07em', textShadow: '0 0 8px rgba(119, 226, 242, 0.65), 0 0 18px rgba(119, 226, 242, 0.3)' }}>{subText}</p>
      </div>

      <button
        type="button"
        className="vs-tactical-board25-logo"
        title={tacticalChrome.brandMarkTitle}
        aria-label={tacticalChrome.brandMarkAria}
        onClick={onToggleLanguage}
        style={{ '--logo-url': `url(${tacticalChrome.brandImageSrc})`, right: '20px' } as any}
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

      {!isAuditMode ? (
        <svg className={layout.SVG_DEFS_CLASS} aria-hidden="true" style={{ width: 0, height: 0, position: 'absolute' }}>
          <defs>
            <filter id={layout.FILTER_ID} colorInterpolationFilters="sRGB" x={layout.FILTER_X} y={layout.FILTER_Y} width={layout.FILTER_WIDTH} height={layout.FILTER_HEIGHT}>
              <feTurbulence type={layout.TURBULENCE_TYPE as "fractalNoise"} baseFrequency={layout.TURBULENCE_BASE_1} numOctaves={Number(layout.TURBULENCE_OCTAVES_1)} />
              <feColorMatrix type="hueRotate" result="pt1">
                <animate attributeName="values" values={layout.HUE_VALUES_1} dur={layout.HUE_DURATION_1} repeatCount="indefinite" calcMode="paced" />
              </feColorMatrix>
              <feComposite />
              <feTurbulence type={layout.TURBULENCE_TYPE as "fractalNoise"} baseFrequency={layout.TURBULENCE_BASE_2} numOctaves={Number(layout.TURBULENCE_OCTAVES_2)} seed={Number(layout.TURBULENCE_SEED_2)} />
              <feColorMatrix type="hueRotate" result="pt2">
                <animate attributeName="values" values={layout.HUE_VALUES_2} dur={layout.HUE_DURATION_2} repeatCount="indefinite" calcMode="paced" />
              </feColorMatrix>
              <feBlend in="pt1" in2="pt2" mode="normal" result="combinedNoise" />
              <feDisplacementMap in="SourceGraphic" scale={Number(layout.DISPLACEMENT_SCALE)} xChannelSelector={layout.DISPLACEMENT_X as "R"} yChannelSelector={layout.DISPLACEMENT_Y as "G"} />
            </filter>
          </defs>
        </svg>
      ) : null}

      <section className="vs-tactical-board25-stats" style={{ padding: '0', background: 'transparent', border: 'none', boxShadow: 'none', width: 'calc(var(--tb-panel-width) * 2 + var(--tb-center-gap))', display: 'flex', flexDirection: 'column', height: 'var(--tb-panel-height)' }}>
        <p className="vs-tactical-board25-stats-title vs-panel-top-label" style={{ color: '#ff554e', padding: '0 1rem' }}><GlitchText text={boardHeader} /></p>

        <div className={layout.SPLIT_CLASS} style={{ flex: 1, display: 'flex', position: 'relative', marginTop: '1rem' }}>
          {renderFightCardPortrait(fighterA, topName, topPalette, 'left')}
          {renderFightCardPortrait(fighterB, bottomName, bottomPalette, 'right')}
        </div>
      </section>

    </div>
  )
}
