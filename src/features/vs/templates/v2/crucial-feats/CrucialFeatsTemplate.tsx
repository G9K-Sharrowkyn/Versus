import './CrucialFeatsTemplate.scss'
import { GlitchText } from '../../../components/GlitchText'
import { useState, useEffect, type ReactNode } from 'react'
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
  pickTemplateField,
  resolveFightTemplateImageUrl,
  type TemplateImageEntry,
} from '../../../importer'
import type { Fighter, TemplatePreviewProps } from '../../../types'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { CyberpunkMetaValue } from '../../../components/CyberpunkMetaValue'

type CrucialFeatsTemplateProps = TemplatePreviewProps & {
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
  integratedToolbar,
}: CrucialFeatsTemplateProps) {
  // New Layout base props
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)

  // Template logic
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['crucial-feats'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const common = getFightCommonCopy('crucial-feats', language)

  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle || ''

  const leftEntries = buildTemplateImageEntries(blockFields, 'left', crucialFeatsA)
  const rightEntries = buildTemplateImageEntries(blockFields, 'right', crucialFeatsB)
  const pairCount = Math.max(1, leftEntries.length, rightEntries.length)
  const pairScope = `${activeFightFolderKey || 'standalone'}:${leftEntries.length}:${rightEntries.length}`
  const [pairIndex, nextPair] = useScopedCycleIndex(pairScope, pairCount)
  
  const leftEntry = pairIndex < leftEntries.length ? leftEntries[pairIndex] : null
  const rightEntry = pairIndex < rightEntries.length ? rightEntries[pairIndex] : null

  useEffect(() => {
    const nextLeftEntry = leftEntries[pairIndex + 1] || null
    const nextRightEntry = rightEntries[pairIndex + 1] || null
    const preloadUrls = [
      nextLeftEntry
        ? resolveFightTemplateImageUrl(activeFightFolderKey, nextLeftEntry.imageFile, {
            templateId: 'crucial-feats',
            side: 'left',
            slot: nextLeftEntry.slot,
          })
        : '',
      nextRightEntry
        ? resolveFightTemplateImageUrl(activeFightFolderKey, nextRightEntry.imageFile, {
            templateId: 'crucial-feats',
            side: 'right',
            slot: nextRightEntry.slot,
          })
        : '',
    ].filter(Boolean)

    if (!preloadUrls.length) return
    void preloadImageUrls(preloadUrls)
  }, [activeFightFolderKey, leftEntries, pairIndex, rightEntries])

  const renderColumn = (
    fighter: Fighter,
    entry: TemplateImageEntry | null,
    side: 'left' | 'right',
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
            onActivate={nextPair}
            plain
          />
        </div>
      </div>
    )
  }

  // Glitch effect for title
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
    <div className="vs-tactical-board25-surface">
      <div className="vs-tactical-board25-line" />
      {integratedToolbar ? <div className="vs-tactical-board25-toolbar">{integratedToolbar}</div> : null}

      <div className="vs-tactical-board25-meta">
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.threatLevelLabel} />: <span style={{ color: '#ff554e', textShadow: '0 0 10px rgba(255, 85, 78, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.threatLevelValue} /></span>
        </p>
        <p>
          <SubtleCyberpunkLabel text={tacticalChrome.dataIntegrityLabel} />: <span style={{ color: '#ff554e', textShadow: '0 0 10px rgba(255, 85, 78, 0.4)' }}><CyberpunkMetaValue value={tacticalChrome.dataIntegrityValue} /></span>
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

      <section className="vs-tactical-board25-stats" style={{ display: 'flex', flexDirection: 'column', height: 'var(--tb-panel-height)', padding: 0, overflow: 'visible' }}>
        <p className="vs-tactical-board25-stats-title vs-panel-top-label" style={{ color: '#ff554e' }}><GlitchText text={fighterA.name} /></p>
        {renderColumn(fighterA, leftEntry, 'left')}
      </section>

      <div className="vs-tactical-board25-reality" style={{ display: 'flex', flexDirection: 'column', height: 'var(--tb-panel-height)', padding: 0, overflow: 'visible' }}>
        <p className="vs-tactical-board25-reality-heading vs-panel-top-label" style={{ color: '#ff554e' }}><GlitchText text={fighterB.name} /></p>
        {renderColumn(fighterB, rightEntry, 'right')}
      </div>

      <p className="vs-tactical-board25-subtitle vs-crucial-feats-caption vs-crucial-feats-caption--left">
        {leftEntry?.text || '\u00A0'}
      </p>
      <p className="vs-tactical-board25-subtitle vs-crucial-feats-caption vs-crucial-feats-caption--right">
        {rightEntry?.text || '\u00A0'}
      </p>
    </div>
  )
}
