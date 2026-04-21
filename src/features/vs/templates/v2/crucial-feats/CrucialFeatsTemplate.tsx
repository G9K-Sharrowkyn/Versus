import './CrucialFeatsTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, useMemo, type CSSProperties, type ReactNode } from 'react'
import { AdjustableTemplateImage } from '../../../components/AdjustableTemplateImage'
import { preloadImageUrls } from '../../../domain/imagePreloadCache'
import { useScopedCycleIndex } from '../../../hooks/useScopedCycleIndex'
import {
  buildCanonicalLegacyTemplateImageAdjustKey,
  TEMPLATE_BLOCK_ALIASES,
  buildLegacyTemplateImageAdjustKey,
  buildTemplateImageAdjustKey,
  buildTemplateImageEntries,
  findTemplateBlockLines,
  parseTemplateFieldMap,
  resolveFightTemplateImageUrl,
  type TemplateImageEntry,
} from '../../../importer'
import type { Fighter, TemplatePreviewProps } from '../../../types'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { useTemplateMobileLayout } from '../../shared/useTemplateMobileLayout'
import { CyberpunkMetaValue } from '../../../components/CyberpunkMetaValue'

type CrucialFeatsTemplateProps = TemplatePreviewProps & {
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

export function CrucialFeatsTemplate({
  fighterA,
  fighterB,
  crucialFeatsA,
  crucialFeatsB,
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
}: CrucialFeatsTemplateProps) {
  // New Layout base props
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('crucial-feats', language, tacticalBlockFields)

  // Template logic
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['crucial-feats'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const common = getFightCommonCopy('crucial-feats', language)

  const headerText = title
  const subText = subtitle || ''

  const leftEntries = buildTemplateImageEntries(blockFields, 'left', crucialFeatsA)
  const rightEntries = buildTemplateImageEntries(blockFields, 'right', crucialFeatsB)
  const pairCount = Math.max(1, leftEntries.length, rightEntries.length)
  const pairScope = `${activeFightFolderKey || 'standalone'}:${leftEntries.length}:${rightEntries.length}`
  const [pairIndex, nextPair] = useScopedCycleIndex(pairScope, pairCount)
  const autoTemplateMobileLayout = useTemplateMobileLayout()
  const isTemplateMobileLayout =
    templateLayoutMode === 'mobile' || (templateLayoutMode == null && autoTemplateMobileLayout)

  const mobileEntries = useMemo(
    () => [
      ...leftEntries.map((entry) => ({ side: 'left' as const, fighter: fighterA, entry })),
      ...rightEntries.map((entry) => ({ side: 'right' as const, fighter: fighterB, entry })),
    ],
    [fighterA, fighterB, leftEntries, rightEntries],
  )
  const mobileCount = Math.max(1, mobileEntries.length)
  const mobileScope = `${activeFightFolderKey || 'standalone'}:mobile:${leftEntries.length}:${rightEntries.length}`
  const [mobileIndex, nextMobile] = useScopedCycleIndex(mobileScope, mobileCount)

  useEffect(() => {
    if (!isTemplateMobileLayout) return
    if (mobileCount <= 1) return

    const intervalId = window.setInterval(() => {
      nextMobile()
    }, 4000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isTemplateMobileLayout, mobileCount, nextMobile])
  
  const leftEntry = pairIndex < leftEntries.length ? leftEntries[pairIndex] : null
  const rightEntry = pairIndex < rightEntries.length ? rightEntries[pairIndex] : null
  const activeMobileEntry = mobileIndex < mobileEntries.length ? mobileEntries[mobileIndex] : null
  const activeMobileTitle = activeMobileEntry
    ? activeMobileEntry.fighter.name ||
      getFightTemplateDefaultField('crucial-feats', 'fighter_fallback', language)
    : fighterA.name || getFightTemplateDefaultField('crucial-feats', 'fighter_fallback', language)
  const mobileSinglePanelVars = isTemplateMobileLayout
    ? ({
        '--tb-panel-width': '78%',
        '--tb-stats-width': 'var(--tb-panel-width)',
        '--tb-stats-left': 'calc(50% - (var(--tb-panel-width) / 2))',
      } as CSSProperties & Record<'--tb-panel-width' | '--tb-stats-width' | '--tb-stats-left', string>)
    : undefined
  const panelFrameStyle: CSSProperties = isTemplateMobileLayout
    ? {
        top: 'clamp(116px, 18dvh, 192px)',
        bottom: 'calc(clamp(12px, 2.1dvh, 28px) + 100px)',
        height: 'auto',
        minHeight: 0,
        padding: 0,
        overflow: 'visible',
      }
    : {
        height: 'var(--tb-panel-height)',
        padding: 0,
        overflow: 'visible',
      }
  const logoStyle = {
    '--logo-url': `url(${tacticalChrome.brandImageSrc})`,
  } as CSSProperties & Record<'--logo-url', string>

  useEffect(() => {
    if (isTemplateMobileLayout) {
      const orderedMobileIndices = Array.from({ length: mobileCount }, (_, offset) => (mobileIndex + offset) % mobileCount)
      const priorityMobileIndices = orderedMobileIndices.slice(0, 4)
      const secondaryMobileIndices = orderedMobileIndices.slice(4)

      const collectUrlsForMobile = (indices: number[]) =>
        indices
          .map((index) => {
            const item = index < mobileEntries.length ? mobileEntries[index] : null
            if (!item) return ''
            return resolveFightTemplateImageUrl(activeFightFolderKey, item.entry.imageFile, {
              templateId: 'crucial-feats',
              side: item.side,
              slot: item.entry.slot,
            })
          })
          .filter(Boolean)

      const priorityUrls = collectUrlsForMobile(priorityMobileIndices)
      const secondaryUrls = collectUrlsForMobile(secondaryMobileIndices)

      if (priorityUrls.length) {
        void preloadImageUrls(priorityUrls)
      }
      if (!secondaryUrls.length || typeof window === 'undefined') return

      let cancelled = false
      const secondaryTimer = window.setTimeout(() => {
        if (cancelled) return
        void preloadImageUrls(secondaryUrls)
      }, 240)

      return () => {
        cancelled = true
        window.clearTimeout(secondaryTimer)
      }
    }

    const orderedPairIndices = Array.from({ length: pairCount }, (_, offset) => (pairIndex + offset) % pairCount)
    const priorityPairIndices = orderedPairIndices.slice(0, 4)
    const secondaryPairIndices = orderedPairIndices.slice(4)

    const collectUrlsForPairs = (indices: number[]) =>
      indices
        .flatMap((index) => {
          const leftAtIndex = index < leftEntries.length ? leftEntries[index] : null
          const rightAtIndex = index < rightEntries.length ? rightEntries[index] : null
          const leftUrl =
            leftAtIndex
              ? resolveFightTemplateImageUrl(activeFightFolderKey, leftAtIndex.imageFile, {
                  templateId: 'crucial-feats',
                  side: 'left',
                  slot: leftAtIndex.slot,
                })
              : ''
          const rightUrl =
            rightAtIndex
              ? resolveFightTemplateImageUrl(activeFightFolderKey, rightAtIndex.imageFile, {
                  templateId: 'crucial-feats',
                  side: 'right',
                  slot: rightAtIndex.slot,
                })
              : ''
          return [leftUrl, rightUrl]
        })
        .filter(Boolean)

    const priorityUrls = collectUrlsForPairs(priorityPairIndices)
    const secondaryUrls = collectUrlsForPairs(secondaryPairIndices)

    if (priorityUrls.length) {
      void preloadImageUrls(priorityUrls)
    }
    if (!secondaryUrls.length || typeof window === 'undefined') return

    let cancelled = false
    const secondaryTimer = window.setTimeout(() => {
      if (cancelled) return
      void preloadImageUrls(secondaryUrls)
    }, 240)

    return () => {
      cancelled = true
      window.clearTimeout(secondaryTimer)
    }
  }, [
    activeFightFolderKey,
    isTemplateMobileLayout,
    leftEntries,
    mobileCount,
    mobileEntries,
    mobileIndex,
    pairCount,
    pairIndex,
    rightEntries,
  ])

  const renderColumn = (
    fighter: Fighter,
    entry: TemplateImageEntry | null,
    side: 'left' | 'right',
    onActivate: () => void,
  ) => {
    const fighterFallback = getFightTemplateDefaultField('crucial-feats', 'fighter_fallback', language)
    const imageUrl = entry
      ? resolveFightTemplateImageUrl(activeFightFolderKey, entry.imageFile, {
          templateId: 'crucial-feats',
          side,
          slot: entry.slot,
        })
      : ''
    const adjustKey = buildTemplateImageAdjustKey('crucial-feats', side, entry)
    const legacyAdjustKeys = [
      buildCanonicalLegacyTemplateImageAdjustKey('crucial-feats', side, entry),
      buildLegacyTemplateImageAdjustKey('crucial-feats', side, entry),
    ]

    return (
      <div style={{ flex: 1, position: 'relative', minHeight: 0, height: '100%', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <AdjustableTemplateImage
            imageUrl={imageUrl}
            alt={entry?.text || fighter.name || fighterFallback}
            fallbackLabel={common.noImage}
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
      </div>
    )
  }

  // Glitch effect for title
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
    <div
      className="vs-tactical-board25-surface vs-template--crucial-feats"
      style={mobileSinglePanelVars}
    >
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
        <p className="vs-tactical-board25-subtitle" style={{ color: '#77e2f2' }}>{(subText || '').replace(/\.\s*$/, '')}</p>
      </div>

      <button
        type="button"
        className="vs-tactical-board25-logo"
        title={tacticalChrome.brandMarkTitle}
        aria-label={tacticalChrome.brandMarkAria}
        onClick={onToggleLanguage}
        style={logoStyle}
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

      {isTemplateMobileLayout ? (
        <>
          <section className="vs-tactical-board25-stats" style={{ display: 'flex', flexDirection: 'column', ...panelFrameStyle }}>
            <p className="vs-tactical-board25-stats-title vs-panel-top-label" style={{ color: '#ff554e' }}><GlitchText text={activeMobileTitle} /></p>
            {renderColumn(
              activeMobileEntry?.fighter || fighterA,
              activeMobileEntry?.entry || null,
              activeMobileEntry?.side || 'left',
              nextMobile,
            )}
          </section>
          <p className="vs-crucial-feats-caption vs-crucial-feats-caption--single" style={{ left: 'var(--tb-stats-left)' }}>
            {activeMobileEntry?.entry.text || '\u00A0'}
          </p>
        </>
      ) : (
        <>
          <section className="vs-tactical-board25-stats" style={{ display: 'flex', flexDirection: 'column', ...panelFrameStyle }}>
            <p className="vs-tactical-board25-stats-title vs-panel-top-label" style={{ color: '#ff554e' }}><GlitchText text={fighterA.name} /></p>
            {renderColumn(fighterA, leftEntry, 'left', nextPair)}
          </section>

          <div className="vs-tactical-board25-reality" style={{ display: 'flex', flexDirection: 'column', ...panelFrameStyle }}>
            <p className="vs-tactical-board25-reality-heading vs-panel-top-label" style={{ color: '#ff554e' }}><GlitchText text={fighterB.name} /></p>
            {renderColumn(fighterB, rightEntry, 'right', nextPair)}
          </div>

          <p className="vs-crucial-feats-caption vs-crucial-feats-caption--left">
            {leftEntry?.text || '\u00A0'}
          </p>
          <p className="vs-crucial-feats-caption vs-crucial-feats-caption--right">
            {rightEntry?.text || '\u00A0'}
          </p>
        </>
      )}
    </div>
  )
}
