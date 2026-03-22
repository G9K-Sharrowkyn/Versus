import './CharacterProfileTemplate.scss'
import { useState, useEffect, type ReactNode } from 'react'
import { Crosshair, Swords, WandSparkles } from 'lucide-react'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { Fighter, IconType, TemplatePreviewProps } from '../../../types'
import { FittedText } from '../../shared/FittedText'
import { HighEndFighterBanner } from '../../shared/highEnd'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'
import { AnimeLightning } from '../../../components/AnimeLightning'
import { CyberpunkMetaValue } from '../../../components/CyberpunkMetaValue'

type CharacterProfileTemplateProps = TemplatePreviewProps & {
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

const TOOLKIT_SECTION_ORDER = ['powers', 'tools', 'weaknesses'] as const

type ToolkitDefaults = {
  powers: string
  tools: string
  weaknesses: string
}

const getToolkitSectionMeta = (key: string, defaults: ToolkitDefaults) => {
  if (key === 'powers') {
    return {
      label: defaults.powers,
      icon: WandSparkles,
    }
  }
  if (key === 'tools') {
    return {
      label: defaults.tools,
      icon: Swords,
    }
  }
  if (key === 'weaknesses') {
    return {
      label: defaults.weaknesses,
      icon: Crosshair,
    }
  }
  return null
}

const PROFILE_ITEM_COUNT = 2

export function CharacterProfileTemplate({
  activeTemplateId,
  fighterA,
  fighterB,
  profileA,
  profileB,
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
  integratedToolbar,
}: CharacterProfileTemplateProps) {
  // New Layout base props
  const tacticalBlockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const tacticalBlockFields = parseTemplateFieldMap(tacticalBlockLines)
  const tacticalChrome = buildFightTemplateChrome('tactical-board', language, tacticalBlockFields)
  
  const realityHeader =
    pickTemplateField(tacticalBlockFields, ['right_header', 'reality_header']) ||
    getFightTemplateDefaultField('tactical-board', 'right_header', language)

  // Old Template logic
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['character-profile'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const common = getFightCommonCopy('character-profile', language)
  const ui = getTemplateUi('character-profile', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  const toolkitDefaults: ToolkitDefaults = {
    powers: getFightTemplateDefaultField('character-profile', 'powers_label', language),
    tools: getFightTemplateDefaultField('character-profile', 'tools_label', language),
    weaknesses: getFightTemplateDefaultField('character-profile', 'weaknesses_label', language),
  }
  
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle || ''
  
  const boardHeader =
    pickTemplateField(blockFields, ['left_header', 'categories_header']) ||
    getFightTemplateDefaultField('tactical-board', 'left_header', language) || "CHARACTER PROFILE"

  const sectionRows = TOOLKIT_SECTION_ORDER.map((sectionKey) => {
    const meta = getToolkitSectionMeta(sectionKey, toolkitDefaults)
    const leftItems = profileA[sectionKey].filter((item) => item.trim())
    const rightItems = profileB[sectionKey].filter((item) => item.trim())
    return {
      key: sectionKey,
      label: meta?.label || common.emptyFieldLabel,
      icon: meta?.icon || Crosshair,
      leftItems: leftItems.slice(0, PROFILE_ITEM_COUNT),
      rightItems: rightItems.slice(0, PROFILE_ITEM_COUNT),
    }
  }).filter((section) => section.leftItems.length > 0 || section.rightItems.length > 0)
  
  const frameStyle = {
    minHeight: 0,
    flex: 1,
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '0.375rem',
    background: 'rgba(2, 6, 23, 0.5)',
    padding: '0.75rem',
    boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.06), 0 10px 18px rgba(0, 0, 0, 0.18)',
    display: 'flex',
    flexDirection: 'column' as const,
  }

  const renderSectionCard = (
    fighter: Fighter,
    label: string,
    Icon: IconType,
    items: string[],
    side: 'left' | 'right',
    sectionKey: string,
  ) => {
    if (!items.length) return null

    return (
      <div className={layout.SECTION_CARD_CLASS} style={{ flex: 1, background: 'rgba(0,0,0,0.4)', padding: '0.5rem', border: `1px solid ${fighter.color}40` }}>
        <div className={layout.SECTION_HEADER_CLASS} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Icon size={16} style={{ color: fighter.color }} />
          <p className="text-[10px] uppercase tracking-widest text-slate-400">{label}</p>
        </div>
        <div className={layout.SECTION_ITEMS_CLASS} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {items.map((item, index) => (
            <div
              key={`${sectionKey}-${side}-${index}`}
              className={layout.SECTION_ITEM_CLASS}
            >
              <FittedText
                as="p"
                slotKey={`character-profile:${sectionKey}:${side}:${index}`}
                spec={slots.factBody}
                text={item}
                className={layout.SECTION_ITEM_TEXT_CLASS}
                style={{ color: '#e2e8f0' }}
              />
            </div>
          ))}
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
        
        <div style={frameStyle}>
          <div className={layout.BODY_CLASS} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <div className={layout.BANNERS_CLASS} style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}><HighEndFighterBanner templateId="character-profile" language={language} fighter={fighterA} /></div>
              <div style={{ flex: 1 }}><HighEndFighterBanner templateId="character-profile" language={language} fighter={fighterB} /></div>
            </div>
            <div className={layout.SECTIONS_WRAP_CLASS} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
              {sectionRows.map((section) => (
                <div key={section.key} className={layout.SECTION_ROW_CLASS} style={{ display: 'flex', gap: '1rem' }}>
                  {renderSectionCard(fighterA, section.label, section.icon, section.leftItems, 'left', section.key)}
                  {renderSectionCard(fighterB, section.label, section.icon, section.rightItems, 'right', section.key)}
                </div>
              ))}
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
