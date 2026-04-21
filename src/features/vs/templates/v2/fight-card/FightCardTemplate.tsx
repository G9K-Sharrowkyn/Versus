import './FightCardTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, useMemo, useCallback, type CSSProperties, type ReactNode } from 'react'
import { AdjustableTemplateImage } from '../../../components/AdjustableTemplateImage'
import { preloadImageUrls } from '../../../domain/imagePreloadCache'
import {
  TEMPLATE_BLOCK_ALIASES,
  findTemplateBlockLines,
  parseTemplateFieldMap,
  pickTemplateField,
  resolveFightTemplateImageUrl,
} from '../../../importer'
import type { Fighter, TemplatePreviewProps } from '../../../types'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { CyberpunkMetaValue } from '../../../components/CyberpunkMetaValue'
import { useTemplateMobileLayout } from '../../shared/useTemplateMobileLayout'

type FightCardTemplateProps = TemplatePreviewProps & {
  integratedToolbar?: ReactNode
}

const GLITCH_CHARS = '!@#$%^&░▓▒▌▐╠╣╦╬┼╫Ω'.split('')

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

export function FightCardTemplate({
  fighterA,
  fighterB,
  title,
  subtitle,
  templateBlocks,
  activeFightFolderKey,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
  onToggleLanguage,
  templateLayoutMode,
  integratedToolbar,
}: FightCardTemplateProps) {
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('fight-card', language, tacticalBlockFields)

  const common = getFightCommonCopy('fight-card', language)

  const headerText = title
  const subText = (subtitle || '').replace(/\.\s*$/, '')

  const fighterAFallback = getFightTemplateDefaultField('fight-card', 'fighter_a_fallback', language) || 'Fighter A'
  const fighterBFallback = getFightTemplateDefaultField('fight-card', 'fighter_b_fallback', language) || 'Fighter B'
  const fighterFallback = getFightTemplateDefaultField('fight-card', 'fighter_fallback', language) || common.portraitSlot
  const leftTitle = fighterA.name || fighterAFallback
  const rightTitle = fighterB.name || fighterBFallback
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['fight-card'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
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
  const autoTemplateMobileLayout = useTemplateMobileLayout()
  const isTemplateMobileLayout =
    templateLayoutMode === 'mobile' || (templateLayoutMode == null && autoTemplateMobileLayout)
  const mobileEntries = useMemo(
    () =>
      [
        { fighter: fighterA, imageUrl: leftImageUrl },
        { fighter: fighterB, imageUrl: rightImageUrl },
      ].filter((entry) => Boolean(entry.imageUrl)),
    [fighterA, fighterB, leftImageUrl, rightImageUrl],
  )
  const [mobileIndex, setMobileIndex] = useState(0)
  const safeMobileIndex = mobileEntries.length > 0 ? mobileIndex % mobileEntries.length : 0
  const activeMobileEntry = safeMobileIndex < mobileEntries.length ? mobileEntries[safeMobileIndex] : null

  const nextMobile = useCallback(() => {
    if (!isTemplateMobileLayout) return
    if (mobileEntries.length <= 1) return
    setMobileIndex((value) => (value + 1) % mobileEntries.length)
  }, [isTemplateMobileLayout, mobileEntries.length])

  useEffect(() => {
    if (!isTemplateMobileLayout) return
    if (mobileEntries.length <= 1) return

    const intervalId = window.setInterval(() => {
      nextMobile()
    }, 4000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isTemplateMobileLayout, mobileEntries.length, nextMobile])

  useEffect(() => {
    if (!isTemplateMobileLayout) return
    const urls = mobileEntries.map((entry) => entry.imageUrl).filter(Boolean)
    if (!urls.length) return
    void preloadImageUrls(urls)
  }, [isTemplateMobileLayout, mobileEntries])

  const renderColumn = (fighter: Fighter, side: 'left' | 'right', imageUrl: string, onActivate?: () => void) => {
    const adjustKey = side === 'left' ? 'fight-card:main-left' : 'fight-card:main-right'
    const legacyAdjustKeys = side === 'left' ? ['fight-card:portrait-a'] : ['fight-card:portrait-b']
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <AdjustableTemplateImage
          imageUrl={imageUrl}
          alt={fighter.name || fighterFallback}
          fallbackLabel={common.noImage || common.portraitSlot}
          hintLabel=""
          adjustKey={adjustKey}
          legacyAdjustKeys={legacyAdjustKeys}
          adjustments={slideImageAdjustments}
          onAdjustChange={onSlideImageAdjustChange}
          onAdjustCommit={onSlideImageAdjustCommit}
          onActivate={onActivate}
          plain
        />
      </div>
    )
  }

  const headerTextStr = typeof headerText === 'string' ? headerText : ''
  const chars = useMemo(() => headerTextStr.split(''), [headerTextStr])
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
  }, [chars])

  return (
    <div className={`vs-tactical-board25-surface${isTemplateMobileLayout ? ' is-template-mobile-layout' : ''}`}>
      <div className="vs-tactical-board25-line" />
      {integratedToolbar ? <div className="vs-tactical-board25-toolbar">{integratedToolbar}</div> : null}

      <div className="vs-tactical-board25-meta">
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.threatLevelLabel} />:{' '}
          <span style={{ color: '#77e2f2', textShadow: '0 0 12px rgba(119, 226, 242, 0.75), 0 0 22px rgba(119, 226, 242, 0.4)' }}>
            <CyberpunkMetaValue value={tacticalChrome.threatLevelValue} />
          </span>
        </p>
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.dataIntegrityLabel} />:{' '}
          <span style={{ color: '#77e2f2', textShadow: '0 0 12px rgba(119, 226, 242, 0.75), 0 0 22px rgba(119, 226, 242, 0.4)' }}>
            <CyberpunkMetaValue value={tacticalChrome.dataIntegrityValue} />
          </span>
        </p>
      </div>

      <div className="vs-tactical-board25-heading">
        <div className="vs-tb-signal-main" style={{ transform: 'none', minWidth: 'auto', maxWidth: 'none', minHeight: 'auto', padding: '0.1em 0.5em', margin: 0, width: '75%' }}>
          <div style={{ position: 'relative' }}>
            <div className="glitch-letter-container" style={isTemplateMobileLayout ? { animation: 'none' } : undefined}>
              {chars.map((char, i) =>
                char === ' ' ? (
                  <span key={i}>&nbsp;</span>
                ) : (
                  <div key={i} className={`glitch-letter ${activeGlitches.has(i) ? 'is-glitching' : ''}`} data-text={char}>
                    {char}
                  </div>
                ),
              )}
            </div>
            <div className="glow" style={{ fontSize: '3.5vw', width: '100%', textAlign: 'center', pointerEvents: 'none', textShadow: 'none' }}>
              {headerText}
            </div>
          </div>
        </div>
        <p className="vs-tactical-board25-subtitle" style={{ color: '#77e2f2' }}>
          {subText}
        </p>
      </div>

      <button
        type="button"
        className="vs-tactical-board25-logo"
        title={tacticalChrome.brandMarkTitle}
        aria-label={tacticalChrome.brandMarkAria}
        onClick={onToggleLanguage}
        style={{ '--logo-url': `url(${tacticalChrome.brandImageSrc})` } as CSSProperties & Record<'--logo-url', string>}
      >
        <img src={tacticalChrome.brandImageSrc} alt={tacticalChrome.brandAlt} draggable={false} />
        <img className="vs-tactical-board25-logo-reflection" src={tacticalChrome.brandImageSrc} alt="" aria-hidden="true" draggable={false} />
      </button>

      {isTemplateMobileLayout ? (
        <section
          className="vs-tactical-board25-stats"
          style={{
            height: 'var(--tb-panel-height)',
            padding: 0,
            overflow: 'hidden',
            left: '50%',
            width: '78%',
            transform: 'translateX(-50%)',
          }}
        >
          <p className="vs-tactical-board25-stats-title vs-panel-top-label" style={{ color: '#ff554e' }}>
            <GlitchText text={activeMobileEntry?.fighter.name || leftTitle} />
          </p>
          <div
            style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
            role="button"
            tabIndex={0}
            onClick={nextMobile}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                nextMobile()
              }
            }}
          >
            {mobileEntries.length ? (
              mobileEntries.map((entry, index) => (
                <img
                  key={`${entry.imageUrl}-${index}`}
                  src={entry.imageUrl}
                  alt={entry.fighter.name || fighterFallback}
                  draggable={false}
                  loading="eager"
                  decoding="async"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: '50% 50%',
                    display: index === safeMobileIndex ? 'block' : 'none',
                  }}
                />
              ))
            ) : (
              <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-slate-400">
                {common.noImage || common.portraitSlot}
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          <section className="vs-tactical-board25-stats" style={{ height: 'var(--tb-panel-height)', padding: 0, overflow: 'hidden' }}>
            <p className="vs-tactical-board25-stats-title vs-panel-top-label" style={{ color: '#ff554e' }}>
              <GlitchText text={leftTitle} />
            </p>
            {renderColumn(fighterA, 'left', leftImageUrl)}
          </section>

          <div className="vs-tactical-board25-reality" style={{ height: 'var(--tb-panel-height)', padding: 0, overflow: 'hidden' }}>
            <p className="vs-tactical-board25-reality-heading vs-panel-top-label" style={{ color: '#ff554e' }}>
              <GlitchText text={rightTitle} />
            </p>
            {renderColumn(fighterB, 'right', rightImageUrl)}
          </div>
        </>
      )}
    </div>
  )
}
