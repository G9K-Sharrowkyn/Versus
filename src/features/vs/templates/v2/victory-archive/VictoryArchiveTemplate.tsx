import './VictoryArchiveTemplate.scss'
import { useState, useEffect, type ReactNode } from 'react'
import { AdjustableTemplateImage } from '../../../components/AdjustableTemplateImage'
import { preloadImageUrls } from '../../../domain/imagePreloadCache'
import { useScopedCycleIndex } from '../../../hooks/useScopedCycleIndex'
import { DEFAULT_WINNER_CV_A, DEFAULT_WINNER_CV_B } from '../../../presets'
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
import { HighEndFighterBanner } from '../../shared/highEnd'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { CyberpunkMetaValue } from '../../../components/CyberpunkMetaValue'

type VictoryArchiveTemplateProps = TemplatePreviewProps & {
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

export function VictoryArchiveTemplate({
  activeTemplateId,
  fighterA,
  fighterB,
  title,
  subtitle,
  winsA,
  winsB,
  templateBlocks,
  activeFightFolderKey,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
  onToggleLanguage,
  integratedToolbar,
}: VictoryArchiveTemplateProps) {
  // New Layout base props
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)
  
  const realityHeader =
    pickTemplateField(tacticalBlockFields, ['right_header', 'reality_header']) ||
    getFightTemplateDefaultField('tactical-board', 'right_header', language)

  // Template logic
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['victory-archive'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const common = getFightCommonCopy('victory-archive', language)

  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const archiveLabel = getFightTemplateDefaultField('victory-archive', 'archive_label', language)
  const subText = subtitle || archiveLabel
  
  const boardHeader =
    pickTemplateField(blockFields, ['left_header', 'categories_header']) ||
    getFightTemplateDefaultField('tactical-board', 'left_header', language) || "VICTORY ARCHIVE"

  const fighterAText = fighterA.name || getFightTemplateDefaultField('victory-archive', 'fighter_a_fallback', language)
  const fighterBText = fighterB.name || getFightTemplateDefaultField('victory-archive', 'fighter_b_fallback', language)
  const leftTitle =
    pickTemplateField(blockFields, ['left_title']) ||
    `${getFightTemplateDefaultField('victory-archive', 'left_title_prefix', language)} ${fighterAText}`
  const rightTitle =
    pickTemplateField(blockFields, ['right_title']) ||
    `${getFightTemplateDefaultField('victory-archive', 'right_title_prefix', language)} ${fighterBText}`
    
  const leftWins = winsA.length ? winsA : DEFAULT_WINNER_CV_A
  const rightWins = winsB.length ? winsB : DEFAULT_WINNER_CV_B
  const leftEntries = buildTemplateImageEntries(blockFields, 'left', leftWins)
  const rightEntries = buildTemplateImageEntries(blockFields, 'right', rightWins)
  const pairCount = Math.max(1, leftEntries.length, rightEntries.length)
  const pairScope = `${activeFightFolderKey || 'standalone'}:${leftEntries.length}:${rightEntries.length}`
  const [pairIndex, nextPair] = useScopedCycleIndex(pairScope, pairCount)
  
  const leftEntry = pairIndex < leftEntries.length ? leftEntries[pairIndex] : null
  const rightEntry = pairIndex < rightEntries.length ? rightEntries[pairIndex] : null
  const entriesUnit =
    pickTemplateField(blockFields, ['entries_unit']) ||
    getFightTemplateDefaultField('victory-archive', 'entries_unit', language) ||
    common.entriesUnit

  useEffect(() => {
    const nextLeftEntry = leftEntries[pairIndex + 1] || null
    const nextRightEntry = rightEntries[pairIndex + 1] || null
    const preloadUrls = [
      nextLeftEntry
        ? resolveFightTemplateImageUrl(activeFightFolderKey, nextLeftEntry.imageFile, {
            templateId: 'victory-archive',
            side: 'left',
            slot: nextLeftEntry.slot,
          })
        : '',
      nextRightEntry
        ? resolveFightTemplateImageUrl(activeFightFolderKey, nextRightEntry.imageFile, {
            templateId: 'victory-archive',
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
    columnTitle: string,
    entry: TemplateImageEntry | null,
    side: 'left' | 'right',
  ) => {
    const imageUrl = entry
      ? resolveFightTemplateImageUrl(activeFightFolderKey, entry.imageFile, {
          templateId: 'victory-archive',
          side,
          slot: entry.slot,
        })
      : ''
    const adjustKey = buildTemplateImageAdjustKey('victory-archive', side, entry)
    const legacyAdjustKeys = [
      buildCanonicalLegacyTemplateImageAdjustKey('victory-archive', side, entry),
      buildLegacyTemplateImageAdjustKey('victory-archive', side, entry),
    ]
    const entryBadge = (
      <span style={{ borderColor: `${fighter.color}88`, color: fighter.color, padding: '0.25rem 0.5rem', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', border: '1px solid' }}>
        {pairCount} {entriesUnit}
      </span>
    )

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <HighEndFighterBanner templateId="victory-archive" language={language} fighter={fighter} trailing={entryBadge} />
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <AdjustableTemplateImage
            imageUrl={imageUrl}
            alt={entry?.text || columnTitle}
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
        {entry?.text && (
          <p style={{ color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center', padding: '0 0.5rem' }}>{entry.text}</p>
        )}
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

      <section className="vs-tactical-board25-stats" style={{ display: 'flex', flexDirection: 'column', height: 'var(--tb-panel-height)' }}>
        <p className="vs-tactical-board25-stats-title" style={{ color: '#ff554e' }}>{boardHeader}</p>
        {renderColumn(fighterA, leftTitle, leftEntry, 'left')}
      </section>

      <div className="vs-tactical-board25-reality" style={{ display: 'flex', flexDirection: 'column', height: 'var(--tb-panel-height)' }}>
        <p className="vs-tactical-board25-reality-heading" style={{ color: '#ff554e' }}>{realityHeader}</p>
        {renderColumn(fighterB, rightTitle, rightEntry, 'right')}
      </div>
    </div>
  )
}
