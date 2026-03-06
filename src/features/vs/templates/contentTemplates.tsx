import { useEffect, useState, type CSSProperties } from 'react'
import clsx from 'clsx'
import { BookOpen, Brain, Crosshair, Swords, WandSparkles } from 'lucide-react'
import { FIGHT_SCENARIO_EXTENDED_LABELS_EN, fightScenarioLabel, pickLang } from '../presets'
import { AVERAGE_DRAW_THRESHOLD, type FightTitlePalette, buildPortraitImageStyle, fighterMonogram, humanizeScenarioToken, normalizeHexColor, normalizeToken, parseBooleanFlag, resolveFightScenarioLead, resolveFightScenarioSelection, resolveFightTitleNameFontRem, resolveFightTitlePalette, resolveFightTitleStripeStyle, stripFightLocaleSuffixFromLabel } from '../helpers'
import { TEMPLATE_BLOCK_ALIASES, buildCurvePolyline, buildTemplateImageEntries, findTemplateBlockLines, getPlainTemplateLines, parseBulletItems, parseCurveValues, parsePercentValue, parseTemplateFieldMap, pickTemplateField, resolveFightTemplateImageUrl, type TemplateImageEntry } from '../importer'
import type { FightScenarioId, FightScenarioLead, Fighter, FighterFact, IconType, Language, ScoreRow, TemplatePreviewProps } from '../types'
import { AdjustableTemplateImage } from '../components/AdjustableTemplateImage'
import { FightScenarioCanvas } from '../components/FightScenarioCanvas'

export const normalizeToolkitGroupKey = (title: string) => {
  const token = normalizeToken(title)
  if (!token) return 'other'
  if (token.includes('weak') || token.includes('slab')) return 'weaknesses'
  if (token.includes('tool') || token.includes('narzed')) return 'tools'
  if (token.includes('power') || token.includes('moc')) return 'powers'
  return token
}

export const buildToolkitSections = (
  facts: FighterFact[],
  fields: Record<string, string>,
  language: Language,
) => {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const sectionMap = new Map<
    string,
    {
      key: string
      label: string
      icon: IconType
      items: string[]
    }
  >()

  const register = (key: string, fallbackLabel: string, icon: IconType, text: string) => {
    const label =
      (key === 'powers' && pickTemplateField(fields, ['powers_label'])) ||
      (key === 'tools' && pickTemplateField(fields, ['tools_label'])) ||
      (key === 'weaknesses' && pickTemplateField(fields, ['weaknesses_label'])) ||
      fallbackLabel
    const existing = sectionMap.get(key)
    if (existing) {
      existing.items.push(text)
      return
    }
    sectionMap.set(key, { key, label, icon, items: [text] })
  }

  facts.forEach((fact) => {
    const key = normalizeToolkitGroupKey(fact.title)
    if (key === 'powers') {
      register(key, tr('Moce', 'Powers'), WandSparkles, fact.text)
      return
    }
    if (key === 'tools') {
      register(key, tr('Narzedzia', 'Tools'), Swords, fact.text)
      return
    }
    if (key === 'weaknesses') {
      register(key, tr('Slabosci', 'Weaknesses'), Crosshair, fact.text)
      return
    }
    register(key, fact.title || tr('Dane', 'Data'), BookOpen, fact.text)
  })

  const orderedKeys = ['powers', 'tools', 'weaknesses']
  const ordered = [
    ...orderedKeys
      .map((key) => sectionMap.get(key))
      .filter(
        (
          section,
        ): section is {
          key: string
          label: string
          icon: IconType
          items: string[]
        } => Boolean(section),
      ),
    ...Array.from(sectionMap.values()).filter((section) => !orderedKeys.includes(section.key)),
  ]

  return ordered
}

export function PowersToolsTemplate({
  fighterA,
  fighterB,
  powersA,
  powersB,
  title,
  subtitle,
  templateBlocks,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['powers-tools'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const leftTitle =
    pickTemplateField(blockFields, ['left_title']) ||
    `${fighterA.name || 'Fighter A'} ${tr('profil narzedzi', 'toolkit profile')}`
  const rightTitle =
    pickTemplateField(blockFields, ['right_title']) ||
    `${fighterB.name || 'Fighter B'} ${tr('profil narzedzi', 'toolkit profile')}`
  const leftSections = buildToolkitSections(powersA, blockFields, language)
  const rightSections = buildToolkitSections(powersB, blockFields, language)

  const renderColumn = (
    fighter: Fighter,
    columnTitle: string,
    sections: ReturnType<typeof buildToolkitSections>,
  ) => (
    <div className="min-h-0 rounded-xl border border-white/20 bg-black/28 p-3">
      <div
        className="rounded-lg border px-3 py-2"
        style={{ borderColor: `${fighter.color}88`, backgroundColor: `${fighter.color}18` }}
      >
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
          {fighter.name || 'Fighter'}
        </p>
        <p className="mt-1 text-[14px] uppercase tracking-[0.14em]" style={{ color: fighter.color }}>
          {columnTitle}
        </p>
      </div>

      <div className="mt-3 grid min-h-0 flex-1 grid-rows-[repeat(3,minmax(0,1fr))] gap-2">
        {(sections.length ? sections : []).map((section) => {
          const Icon = section.icon
          return (
            <div
              key={`${fighter.name}-${section.key}`}
              className="min-h-0 rounded-lg border border-slate-600/55 bg-slate-950/72 p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon size={16} style={{ color: fighter.color }} />
                <p className="text-[12px] uppercase tracking-[0.18em] text-slate-100">{section.label}</p>
              </div>
              <div className="space-y-2 text-sm leading-snug text-slate-200">
                {section.items.map((item, index) => (
                  <div
                    key={`${section.key}-${index}-${item}`}
                    className="rounded-md border border-slate-700/70 bg-slate-900/84 px-2 py-1.5"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {!sections.length ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-600/55 bg-slate-950/60 px-3 py-4 text-center text-sm text-slate-400">
            {tr('Brak danych o mocach i slabosciach.', 'No powers / weaknesses data found.')}
          </div>
        ) : null}
      </div>
    </div>
  )

  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-slate-400/25 pb-2">
        <div />
        <h2 className="text-2xl uppercase tracking-[0.08em] text-slate-50">{headerText}</h2>
        <div className="text-right text-[11px] uppercase tracking-[0.18em] text-slate-300">
          {subText}
        </div>
      </div>
      <div className="mt-3 grid min-h-0 flex-1 grid-cols-2 gap-3">
        {renderColumn(fighterA, leftTitle, leftSections)}
        {renderColumn(fighterB, rightTitle, rightSections)}
      </div>
    </div>
  )
}

export function RawFeatsTemplate({
  fighterA,
  fighterB,
  rawFeatsA,
  rawFeatsB,
  title,
  subtitle,
  templateBlocks,
  activeFightFolderKey,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['raw-feats'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const leftTitle =
    pickTemplateField(blockFields, ['left_title']) ||
    `${fighterA.name || 'Fighter A'} ${tr('featy', 'feats')}`
  const rightTitle =
    pickTemplateField(blockFields, ['right_title']) ||
    `${fighterB.name || 'Fighter B'} ${tr('featy', 'feats')}`
  const featLabel = pickTemplateField(blockFields, ['feat_label']) || tr('Feat', 'Feat')
  const leftEntries = buildTemplateImageEntries(blockFields, 'left', rawFeatsA)
  const rightEntries = buildTemplateImageEntries(blockFields, 'right', rawFeatsB)
  const pairCount = Math.max(1, leftEntries.length, rightEntries.length)
  const [pairIndex, setPairIndex] = useState(0)

  useEffect(() => {
    setPairIndex(0)
  }, [leftEntries.length, rightEntries.length, activeFightFolderKey])

  const nextPair = () => {
    if (pairCount <= 1) return
    setPairIndex((current) => (current + 1) % pairCount)
  }

  const leftEntry = leftEntries.length ? leftEntries[pairIndex % leftEntries.length] : null
  const rightEntry = rightEntries.length ? rightEntries[pairIndex % rightEntries.length] : null

  const renderColumn = (
    fighter: Fighter,
    columnTitle: string,
    entry: TemplateImageEntry | null,
    side: 'left' | 'right',
  ) => {
    const imageUrl = entry ? resolveFightTemplateImageUrl(activeFightFolderKey, entry.imageFile) : ''
    const adjustKey = `raw-feats:${side}:${entry?.id || 'empty'}`
    return (
      <div className="flex h-full min-h-0 flex-col rounded-xl border border-white/20 bg-black/28 p-3">
        <div
          className="rounded-lg border px-3 py-2"
          style={{ borderColor: `${fighter.color}88`, backgroundColor: `${fighter.color}18` }}
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">{fighter.name || 'Fighter'}</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-[14px] uppercase tracking-[0.14em]" style={{ color: fighter.color }}>
              {columnTitle}
            </p>
            <span
              className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]"
              style={{ borderColor: `${fighter.color}88`, color: fighter.color }}
            >
              {pairCount} {tr('wpisow', 'entries')}
            </span>
          </div>
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2">
          <AdjustableTemplateImage
            imageUrl={imageUrl}
            alt={entry?.text || columnTitle}
            fallbackLabel={tr('Brak obrazu', 'No image')}
            hintLabel={tr('LPM: przesun | PPM: skaluj', 'LMB: move | RMB: zoom')}
            adjustKey={adjustKey}
            adjustments={slideImageAdjustments}
            onAdjustChange={onSlideImageAdjustChange}
            onAdjustCommit={onSlideImageAdjustCommit}
            onActivate={nextPair}
          />
          <div className="rounded-lg border border-slate-600/60 bg-slate-950/78 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: fighter.color }}>
                {featLabel} {String((pairIndex % pairCount) + 1).padStart(2, '0')}
              </p>
              <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                {pairCount} {tr('wpisow', 'entries')}
              </span>
            </div>
            <p className="text-sm leading-snug text-slate-200">{entry?.text || tr('Brak wpisu.', 'No entry.')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-slate-400/25 pb-2">
        <div />
        <h2 className="text-2xl uppercase tracking-[0.08em] text-slate-50">{headerText}</h2>
        <div className="text-right text-[11px] uppercase tracking-[0.18em] text-slate-300">
          {subText}
        </div>
      </div>
      <div className="mt-2 text-center text-[11px] uppercase tracking-[0.16em] text-slate-400">
        {tr('Kliknij obraz aby przejsc do kolejnej pary.', 'Click an image to switch to the next pair.')}
      </div>
      <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 gap-3">
        {renderColumn(fighterA, leftTitle, leftEntry, 'left')}
        {renderColumn(fighterB, rightTitle, rightEntry, 'right')}
      </div>
    </div>
  )
}

export function BlankTemplate({
  title,
  subtitle,
  activeTemplateId,
  templateBlocks,
  fighterA,
  fighterB,
  portraitAAdjust,
  portraitBAdjust,
  averageA,
  averageB,
  rows,
  fightLabel,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const aliases = TEMPLATE_BLOCK_ALIASES[activeTemplateId] || []
  const blockLines = findTemplateBlockLines(templateBlocks, aliases)
  const renderedLines = parseBulletItems(blockLines)
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)

  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const line = (position: number, keys: string[], fallback = '') =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback

  const winnerLabel =
    pickTemplateField(blockFields, ['winner', 'verdict']) ||
    tr('WERDYKT WARUNKOWY, BRAK ABSOLUTNEGO STOMPA', 'CONDITIONAL VERDICT, NO ABSOLUTE STOMP')

  if (activeTemplateId === 'fight-title') {
    const finalLabelRaw = line(
      0,
      ['fight_title', 'match_title', 'title_text', 'line_1', 'line1'],
      fightLabel || `${fighterA.name || 'Fighter A'} vs ${fighterB.name || 'Fighter B'}`,
    )
    const normalizedLabel = finalLabelRaw.replace(/\s+/g, ' ').trim()
    const parsedLabel = normalizedLabel.match(/^\s*(.+?)\s+(?:vs\.?|versus|kontra|v)\s+(.+?)\s*$/i)
    const topName = stripFightLocaleSuffixFromLabel((parsedLabel?.[1] || fighterA.name || 'Fighter A').trim())
    const bottomName = stripFightLocaleSuffixFromLabel((parsedLabel?.[2] || fighterB.name || 'Fighter B').trim())
    const topBasePalette = resolveFightTitlePalette(topName, 'a')
    const bottomBasePalette = resolveFightTitlePalette(bottomName, 'b')
    const topPalette: FightTitlePalette = {
      colorA:
        normalizeHexColor(
          pickTemplateField(blockFields, ['top_color_a', 'top_primary', 'fighter_a_color_a', 'fighter_a_primary']),
        ) || topBasePalette.colorA,
      colorB:
        normalizeHexColor(
          pickTemplateField(blockFields, ['top_color_b', 'top_secondary', 'fighter_a_color_b', 'fighter_a_secondary']),
        ) || topBasePalette.colorB,
      dark: parseBooleanFlag(
        pickTemplateField(blockFields, ['top_dark', 'fighter_a_dark']),
        topBasePalette.dark,
      ),
    }
    const bottomPalette: FightTitlePalette = {
      colorA:
        normalizeHexColor(
          pickTemplateField(blockFields, ['bottom_color_a', 'bottom_primary', 'fighter_b_color_a', 'fighter_b_primary']),
        ) || bottomBasePalette.colorA,
      colorB:
        normalizeHexColor(
          pickTemplateField(blockFields, ['bottom_color_b', 'bottom_secondary', 'fighter_b_color_b', 'fighter_b_secondary']),
        ) || bottomBasePalette.colorB,
      dark: parseBooleanFlag(
        pickTemplateField(blockFields, ['bottom_dark', 'fighter_b_dark']),
        bottomBasePalette.dark,
      ),
    }
    const renderAnimatedLine = (text: string, palette: FightTitlePalette) => (
      (() => {
        const stripeStyle = resolveFightTitleStripeStyle(palette)
        const fontSizeRem = resolveFightTitleNameFontRem(text)
        return (
          <span
            data-text={text}
            className="vvv-fight-title-outro__wordmark"
            style={
              {
                color: palette.colorA,
                fontSize: `${fontSizeRem}rem`,
                '--vvv-stripe-image': stripeStyle.textureUrl,
                '--vvv-stripe-filter': stripeStyle.textureFilter,
              } as CSSProperties
            }
          >
            {text}
          </span>
        )
      })()
    )
    const renderFightTitlePortrait = (
      fighter: Fighter,
      nameText: string,
      palette: FightTitlePalette,
      side: 'left' | 'right',
    ) => (
      <div
        className={clsx('vvv-fight-title-portrait', side === 'left' ? 'vvv-fight-title-portrait--left' : 'vvv-fight-title-portrait--right')}
        style={
          {
            '--vvv-portrait-color': fighter.color,
            '--f': 'url(#vvv-electric-flow-hue)',
            '--electric-y-offset': '-3px',
            '--electric-border-color': 'DodgerBlue',
            '--electric-light-color': 'oklch(from var(--electric-border-color) l c h)',
          } as CSSProperties
        }
      >
        <div className="vvv-fight-title-portrait__inner-container">
          <div className="vvv-fight-title-portrait__border-outer">
            <div className="vvv-fight-title-portrait__inner">
              {fighter.imageUrl ? (
                <img
                  src={fighter.imageUrl}
                  alt={fighter.name || 'Fighter'}
                  className="h-full w-full object-cover"
                  style={buildPortraitImageStyle(side === 'left' ? portraitAAdjust : portraitBAdjust)}
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.16),transparent_45%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.9))]"
                  style={{ color: fighter.color }}
                >
                  <div className="text-center">
                    <p className="text-[62px] font-semibold tracking-[0.04em]">{fighterMonogram(fighter.name || 'Fighter')}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{tr('Miejsce na portret', 'Portrait Slot')}</p>
                  </div>
                </div>
              )}
              <div className="vvv-fight-title-portrait__name">
                {renderAnimatedLine(nameText, palette)}
              </div>
              <div className="vvv-fight-title-portrait__name-fade" />
              <div className="vvv-fight-title-portrait__scan" />
            </div>
          </div>
          <div className="vvv-fight-title-portrait__glow-layer-1" />
          <div className="vvv-fight-title-portrait__glow-layer-2" />
        </div>
      </div>
    )
    return (
      <div className="relative z-10 flex h-full min-h-0 overflow-visible rounded-[20px] border border-cyan-300/25 bg-[linear-gradient(180deg,#051224_0%,#0a1f36_50%,#051022_100%)] px-2 py-2 text-center text-slate-200">
        <svg className="vvv-fight-title-svg-defs" aria-hidden="true">
          <defs>
            <filter id="vvv-electric-flow-hue" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="7" />
              <feColorMatrix type="hueRotate" result="pt1">
                <animate attributeName="values" values="0;360;" dur=".6s" repeatCount="indefinite" calcMode="paced" />
              </feColorMatrix>
              <feComposite />
              <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="7" seed="5" />
              <feColorMatrix type="hueRotate" result="pt2">
                <animate attributeName="values" values="0;333;199;286;64;168;256;157;360;" dur="5s" repeatCount="indefinite" calcMode="paced" />
              </feColorMatrix>
              <feBlend in="pt1" in2="pt2" mode="normal" result="combinedNoise" />
              <feDisplacementMap in="SourceGraphic" scale="30" xChannelSelector="R" yChannelSelector="B" />
            </filter>
          </defs>
        </svg>
        <div className="vvv-fight-title-split relative z-10 h-full w-full overflow-visible">
          {renderFightTitlePortrait(fighterA, topName, topPalette, 'left')}
          {renderFightTitlePortrait(fighterB, bottomName, bottomPalette, 'right')}
          <span className="vvv-fight-title-split__vs">
            <img
              src="/assets/VS.png"
              alt="VS"
              className="vvv-fight-title-outro__vs-image"
              draggable={false}
            />
          </span>
        </div>
      </div>
    )
  }

  if (activeTemplateId === 'summary') {
    const summaryLines = [
      line(0, ['line_1', 'line1'], tr('Tempo > obrażenia na otwarciu.', 'Tempo > damage in opening.')),
      line(1, ['line_2', 'line2'], tr('Regeneracja zmienia późną fazę starcia.', 'Regeneration changes late game.')),
      line(2, ['line_3', 'line3'], tr('Zasady walki mogą odwrócić werdykt.', 'Rules can flip the verdict.')),
    ]

    return (
      <div className="relative z-10 flex h-full flex-col text-slate-100">
        <h2 className="text-center text-3xl uppercase tracking-[0.08em] text-slate-50">{headerText}</h2>
        {subText ? <p className="mt-1 text-center text-sm uppercase tracking-[0.16em] text-slate-300">{subText}</p> : null}

        <div className="mt-3 grid min-h-0 flex-1 grid-cols-[1.05fr_1.2fr_1.05fr] gap-3">
          <div className="min-h-0 rounded-xl border p-2" style={{ borderColor: `${fighterA.color}88`, backgroundColor: `${fighterA.color}10` }}>
            <div className="mb-2 rounded-md border border-white/20 bg-black/35 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300">{tr('Niebieski narożnik', 'Blue corner')}</p>
              <p className="text-lg uppercase leading-none" style={{ color: fighterA.color }}>
                {fighterA.name || 'Fighter A'}
              </p>
            </div>
            <div className="relative h-[78%] overflow-hidden rounded-lg border bg-black/45" style={{ borderColor: `${fighterA.color}88` }}>
              {fighterA.imageUrl ? (
                <img
                  src={fighterA.imageUrl}
                  alt={fighterA.name || 'Fighter A'}
                  className="h-full w-full object-cover"
                  style={buildPortraitImageStyle(portraitAAdjust)}
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.14),transparent_45%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.9))]"
                  style={{ color: fighterA.color }}
                >
                  <div className="text-center">
                    <p className="text-[56px] font-semibold tracking-[0.04em]">{fighterMonogram(fighterA.name || 'Fighter A')}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{tr('Miejsce na portret', 'Portrait Slot')}</p>
                  </div>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 border-[3px] border-black/35" />
              <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:28px_28px]" />
            </div>
          </div>

          <div className="min-h-0 rounded-xl border border-slate-500/45 bg-black/30 p-3">
            <div className="rounded-xl border border-amber-300/55 bg-[linear-gradient(115deg,rgba(120,53,15,0.42),rgba(251,191,36,0.35),rgba(120,53,15,0.42))] px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-100">{tr('Werdykt', 'Verdict')}</p>
              <p className="mt-1 text-4xl uppercase leading-none text-white">{winnerLabel}</p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border px-3 py-2" style={{ borderColor: `${fighterA.color}88`, backgroundColor: `${fighterA.color}20` }}>
                <p className="text-xs uppercase tracking-[0.16em]">{fighterA.name || 'Fighter A'}</p>
                <p className="text-2xl font-semibold" style={{ color: fighterA.color }}>
                  {Math.round(averageA)}
                </p>
              </div>
              <div className="rounded-lg border px-3 py-2" style={{ borderColor: `${fighterB.color}88`, backgroundColor: `${fighterB.color}20` }}>
                <p className="text-xs uppercase tracking-[0.16em]">{fighterB.name || 'Fighter B'}</p>
                <p className="text-2xl font-semibold" style={{ color: fighterB.color }}>
                  {Math.round(averageB)}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-700/60 bg-slate-900/72 p-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">{tr('Linie podsumowania', 'Summary lines')}</p>
              <div className="mt-2 max-h-[220px] space-y-1.5 overflow-y-auto pr-1 text-sm text-slate-100">
                {summaryLines.map((item, index) => (
                  <div key={`summary-line-${index}-${item}`} className="rounded border border-slate-700/60 bg-black/35 px-2 py-1">
                    {index + 1}. {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="min-h-0 rounded-xl border p-2" style={{ borderColor: `${fighterB.color}88`, backgroundColor: `${fighterB.color}10` }}>
            <div className="mb-2 rounded-md border border-white/20 bg-black/35 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300">{tr('Czerwony narożnik', 'Red corner')}</p>
              <p className="text-lg uppercase leading-none" style={{ color: fighterB.color }}>
                {fighterB.name || 'Fighter B'}
              </p>
            </div>
            <div className="relative h-[78%] overflow-hidden rounded-lg border bg-black/45" style={{ borderColor: `${fighterB.color}88` }}>
              {fighterB.imageUrl ? (
                <img
                  src={fighterB.imageUrl}
                  alt={fighterB.name || 'Fighter B'}
                  className="h-full w-full object-cover"
                  style={buildPortraitImageStyle(portraitBAdjust)}
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.14),transparent_45%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.9))]"
                  style={{ color: fighterB.color }}
                >
                  <div className="text-center">
                    <p className="text-[56px] font-semibold tracking-[0.04em]">{fighterMonogram(fighterB.name || 'Fighter B')}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{tr('Miejsce na portret', 'Portrait Slot')}</p>
                  </div>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 border-[3px] border-black/35" />
              <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:28px_28px]" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeTemplateId === 'battle-dynamics') {
    const phase1 = line(
      0,
      ['phase_1', 'phase1'],
      tr(
        `${fighterA.name || 'Fighter A'} narzuca tempo szybko?ci?.`,
        `${fighterA.name || 'Fighter A'} sets the pace with speed.`,
      ),
    )
    const phase2 = line(
      1,
      ['phase_2', 'phase2'],
      tr(
        `${fighterB.name || 'Fighter B'} ignoruje obra?enia i skraca dystans.`,
        `${fighterB.name || 'Fighter B'} absorbs damage and closes distance.`,
      ),
    )
    const phase3 = line(
      2,
      ['phase_3', 'phase3'],
      tr(
        `${fighterB.name || 'Fighter B'} zyskuje przewag? kondycyjn?.`,
        `${fighterB.name || 'Fighter B'} gains late stamina advantage.`,
      ),
    )
    const analysisLine =
      pickTemplateField(blockFields, ['analysis', 'note', 'line_4', 'line4']) ||
      tr(
        `Analiza: ${fighterA.name || 'Fighter A'} wygrywa sprint. ${fighterB.name || 'Fighter B'} wygrywa maraton.`,
        `Analysis: ${fighterA.name || 'Fighter A'} wins the sprint. ${fighterB.name || 'Fighter B'} wins the marathon.`,
      )
    const curveAValues = parseCurveValues(
      pickTemplateField(blockFields, ['a_curve', 'curve_a', 'blue_curve', 'left_curve']),
      [78, 64, 50, 32, 20],
    )
    const curveBValues = parseCurveValues(
      pickTemplateField(blockFields, ['b_curve', 'curve_b', 'red_curve', 'right_curve']),
      [35, 35, 35, 35, 35],
    )
    const yellowWaveValues = parseCurveValues(
      pickTemplateField(blockFields, ['yellow_wave', 'wave', 'chaos_wave']),
      [34, 36, 33, 35, 34, 36, 33, 35],
    )
    const curveA = buildCurvePolyline(curveAValues, 5, 96, 8, 41)
    const curveB = buildCurvePolyline(curveBValues, 5, 96, 8, 41)
    const yellowWave = buildCurvePolyline(yellowWaveValues, 5, 96, 8, 41)

    return (
      <div className="relative z-10 flex h-full flex-col text-slate-100">
        <div className="relative mt-1 min-h-0 flex-1 rounded-xl border border-cyan-300/35 bg-[linear-gradient(180deg,#06172a_0%,#0a2036_52%,#061325_100%)] p-3">
          <h2 className="text-center text-[52px] uppercase leading-none tracking-[0.02em] text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            {headerText}
          </h2>
          <p className="mt-1 text-center text-[12px] uppercase tracking-[0.16em] text-slate-300">{subText}</p>

          <div className="relative mt-2 min-h-0 rounded-md border border-cyan-300/30 bg-slate-950/65 p-2">
            <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(125,211,252,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(125,211,252,0.18)_1px,transparent_1px)] [background-size:10%_20%]" />
            <svg viewBox="0 0 100 49" className="relative z-10 h-[300px] w-full">
              <defs>
                <marker id="arrow-dark" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 z" fill="#cbd5e1" />
                </marker>
              </defs>

              {[10, 18, 26, 34].map((y) => (
                <line key={`grid-y-${y}`} x1="5" y1={y} x2="96" y2={y} stroke="rgba(125,211,252,0.35)" strokeWidth="0.12" />
              ))}
              {[14, 23, 32, 41, 50, 59, 68, 77, 86].map((x) => (
                <line key={`grid-x-${x}`} x1={x} y1="8" x2={x} y2="44" stroke="rgba(125,211,252,0.35)" strokeWidth="0.12" />
              ))}

              <line x1="5" y1="44" x2="96" y2="44" stroke="#cbd5e1" strokeWidth="0.35" markerEnd="url(#arrow-dark)" />
              <line x1="5" y1="44" x2="5" y2="5" stroke="#cbd5e1" strokeWidth="0.35" markerEnd="url(#arrow-dark)" />

              <text x="4.5" y="47.8" fontSize="2.5" fill="#e2e8f0" fontWeight="700">{tr('START', 'START')}</text>
              <text x="45" y="47.8" fontSize="2.5" fill="#e2e8f0" fontWeight="700">{tr('CZAS WALKI', 'FIGHT TIME')}</text>
              <text x="90.8" y="47.8" fontSize="2.5" fill="#e2e8f0" fontWeight="700">END</text>

              <text x="3" y="30" fontSize="2.7" fill="#e2e8f0" fontWeight="700" transform="rotate(-90 3 30)">
                {tr('PRZEWAGA / KONDYCJA', 'ADVANTAGE / STAMINA')}
              </text>

              <line x1="50.5" y1="8" x2="50.5" y2="44" stroke="#64748b" strokeWidth="0.25" strokeDasharray="1.1 0.9" />
              <polyline points={curveA.polyline} fill="none" stroke="rgba(56,189,248,0.35)" strokeWidth="2.3" />
              <polyline points={curveA.polyline} fill="none" stroke="#0ea5e9" strokeWidth="1.3" />
              <polyline points={curveB.polyline} fill="none" stroke="rgba(244,63,94,0.45)" strokeWidth="2.1" />
              <polyline points={curveB.polyline} fill="none" stroke="#c81e3a" strokeWidth="1.2" />
              <polyline points={yellowWave.polyline} fill="none" stroke="#eab308" strokeWidth="0.4" opacity="0.9" />

              {curveB.points.map((point, index) => (
                <circle key={`r-${index}-${point.x}`} cx={point.x} cy={point.y} r="0.56" fill="#ef4444" stroke="#7f1d1d" strokeWidth="0.2" />
              ))}
              {curveA.points.map((point, index) => (
                <circle key={`b-${index}-${point.x}`} cx={point.x} cy={point.y} r="0.56" fill="#0ea5e9" stroke="#0c4a6e" strokeWidth="0.2" />
              ))}
            </svg>

            <div className="relative z-10 mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-sm border-[3px] border-[#0ea5e9] bg-[#071b31]/95 p-2 text-[16px] leading-tight text-slate-100 shadow-[4px_4px_0_rgba(14,165,233,0.45)]">
                <p className="font-semibold">{tr('Faza 1: Otwarcie.', 'Phase 1: Opening.')}</p>
                <p>{phase1}</p>
              </div>
              <div className="rounded-sm border-[3px] border-[#64748b] bg-[#111827]/95 p-2 text-[16px] leading-tight text-slate-100 shadow-[4px_4px_0_rgba(71,85,105,0.45)]">
                <p className="font-semibold">{tr('Faza 2: Mid-Fight.', 'Phase 2: Mid-Fight.')}</p>
                <p>{phase2}</p>
              </div>
              <div className="rounded-sm border-[3px] border-[#f43f5e] bg-[#2b101b]/95 p-2 text-[16px] leading-tight text-slate-100 shadow-[4px_4px_0_rgba(244,63,94,0.45)]">
                <p className="font-semibold">{tr('Faza 3: Attrition.', 'Phase 3: Attrition.')}</p>
                <p>{phase3}</p>
              </div>
            </div>
          </div>

          <div className="mt-2 rounded-md border border-cyan-300/35 bg-slate-900/78 px-3 py-1 text-center text-[20px] font-semibold text-slate-100">
            {analysisLine}
          </div>
        </div>
      </div>
    )
  }

  if (activeTemplateId === 'x-factor') {
    const superPct = parsePercentValue(
      pickTemplateField(blockFields, ['a_value', 'super_value', 'superman', 'left_value']),
      40,
    )
    const hyperPct = parsePercentValue(
      pickTemplateField(blockFields, ['b_value', 'hyper_value', 'hyperion', 'right_value']),
      40,
    )
    const superBonusPct = parsePercentValue(
      pickTemplateField(blockFields, ['a_bonus', 'super_bonus', 'left_bonus']),
      0,
    )
    const hyperBonusPct = parsePercentValue(
      pickTemplateField(blockFields, ['b_bonus', 'hyper_bonus', 'right_bonus']),
      0,
    )
    const superTotalPct = Math.max(0, Math.min(100, superPct + superBonusPct))
    const hyperTotalPct = Math.max(0, Math.min(100, hyperPct + hyperBonusPct))
    const xLabel = line(0, ['factor', 'headline'], tr('REGENERACJA I PRZETRWANIE', 'REGENERATION AND SURVIVAL'))
    const xTitle =
      pickTemplateField(blockFields, ['headline', 'header', 'title']) ||
      `X-FACTOR: ${xLabel}`
    const xSubtitle =
      pickTemplateField(blockFields, ['subtitle', 'note']) || subText
    const mechanics = line(
      1,
      ['mechanika', 'mechanics'],
      tr(
        `${fighterB.name || 'Fighter B'} posiada pot??ny czynnik regeneracyjny.`,
        `${fighterB.name || 'Fighter B'} has a major regeneration factor.`,
      ),
    )
    const implication = line(
      2,
      ['implikacja', 'implication'],
      tr(
        `${fighterB.name || 'Fighter B'} nie musi wygra? ka?dej wymiany. Wystarczy, ?e przetrwa.`,
        `${fighterB.name || 'Fighter B'} does not need to win every exchange. Surviving is enough.`,
      ),
    )
    const psychology = line(
      3,
      ['psychologia', 'psychology'],
      tr('Styl survival i walka na wyniszczenie zwiększają jego szanse.', 'Survival mindset and attrition fighting raise his odds.'),
    )
    const superBonusLabel = pickTemplateField(blockFields, ['a_bonus_label', 'left_bonus_label']) || '+ BOOST'
    const regenLabel = pickTemplateField(blockFields, ['regen', 'regen_label']) || '+ REGEN'

    return (
      <div className="relative z-10 flex h-full flex-col text-slate-100">
        <div className="relative mt-1 min-h-0 flex-1 rounded-xl border border-cyan-300/35 bg-[linear-gradient(180deg,#06172a_0%,#0a2036_52%,#061325_100%)] p-3">
          <h2 className="text-center text-[52px] uppercase leading-none tracking-[0.02em] text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            {xTitle}
          </h2>
          <p className="mt-1 text-center text-[12px] uppercase tracking-[0.16em] text-slate-300">{xSubtitle}</p>

          <div className="mt-2 min-h-0 flex-1 rounded-md border border-cyan-300/25 bg-slate-950/65 p-3">
            <div className="space-y-6">
              <div>
                <p className="text-[58px] font-semibold uppercase leading-none tracking-[0.01em]" style={{ color: '#38bdf8', fontFamily: 'var(--font-display)' }}>
                  {fighterA.name || 'Fighter A'}
                </p>
                <div className="mt-2 grid grid-cols-[1fr_168px] items-center gap-2">
                  <div className="relative h-14 overflow-hidden rounded-md border-2 border-slate-500/70 bg-slate-900/85 shadow-[0_0_0_1px_rgba(125,211,252,0.12)]">
                    <div className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,#0ea5e9,#1d4ed8)]" style={{ width: `${superPct}%` }} />
                    {superBonusPct > 0 ? (
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          clipPath: `inset(5% ${Math.max(0, 100 - superTotalPct)}% 5% ${Math.max(0, Math.min(100, superPct))}%)`,
                          background:
                            'repeating-linear-gradient(135deg, rgba(56,189,248,0.75) 0px, rgba(56,189,248,0.75) 8px, rgba(15,23,42,0) 8px, rgba(15,23,42,0) 16px)',
                        }}
                      />
                    ) : null}
                    <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(226,232,240,0.08)_0px,rgba(226,232,240,0.08)_8px,rgba(15,23,42,0)_8px,rgba(15,23,42,0)_16px)]" />
                  </div>
                  <div className="flex h-14 w-[168px] flex-col items-center justify-center rounded-md border-2 border-cyan-300/55 bg-slate-950/92 px-3 leading-none text-sky-300">
                    <span className={superBonusPct > 0 ? 'text-[34px]' : 'text-[42px]'}>{Math.round(superPct)}%</span>
                    {superBonusPct > 0 ? (
                      <span className="text-[12px] uppercase tracking-[0.1em] text-cyan-100">
                        +{Math.round(superBonusPct)}% {superBonusLabel}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[58px] font-semibold uppercase leading-none tracking-[0.01em]" style={{ color: '#f87171', fontFamily: 'var(--font-display)' }}>
                  {fighterB.name || 'Fighter B'}
                </p>
                <div className="mt-2 grid grid-cols-[1fr_168px] items-center gap-2">
                  <div className="relative h-14 overflow-hidden rounded-md border-2 border-slate-500/70 bg-slate-900/85 shadow-[0_0_0_1px_rgba(248,113,113,0.12)]">
                    <div className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,#ef4444,#b91c1c)]" style={{ width: `${hyperPct}%` }} />
                    {hyperBonusPct > 0 ? (
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          clipPath: `inset(5% ${Math.max(0, 100 - hyperTotalPct)}% 5% ${Math.max(0, Math.min(100, hyperPct))}%)`,
                          background:
                            'repeating-linear-gradient(135deg, rgba(248,113,113,0.75) 0px, rgba(248,113,113,0.75) 8px, rgba(15,23,42,0) 8px, rgba(15,23,42,0) 16px)',
                        }}
                      />
                    ) : null}
                    <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(226,232,240,0.08)_0px,rgba(226,232,240,0.08)_8px,rgba(15,23,42,0)_8px,rgba(15,23,42,0)_16px)]" />
                  </div>
                  <div className="flex h-14 w-[168px] flex-col items-center justify-center rounded-md border-2 border-rose-300/55 bg-slate-950/92 px-3 leading-none text-rose-200">
                    <span className={hyperBonusPct > 0 ? 'text-[34px]' : 'text-[36px]'}>{Math.round(hyperPct)}%</span>
                    {hyperBonusPct > 0 ? (
                      <span className="text-[12px] uppercase tracking-[0.1em] text-rose-100">
                        +{Math.round(hyperBonusPct)}% {regenLabel}
                      </span>
                    ) : (
                      <span className="text-[13px] uppercase tracking-[0.12em] text-rose-100">{regenLabel}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-md border border-slate-500/70 bg-slate-900/85 p-2">
                <div className="flex items-start gap-2">
                  <WandSparkles size={20} className="mt-1 text-cyan-200" />
                  <div>
                    <p className="text-[16px] font-semibold uppercase leading-none text-slate-100">{tr('Mechanika:', 'Mechanics:')}</p>
                    <p className="mt-1 text-[15px] leading-tight text-slate-200">{mechanics}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-slate-500/70 bg-slate-900/85 p-2">
                <div className="flex items-start gap-2">
                  <Crosshair size={20} className="mt-1 text-cyan-200" />
                  <div>
                    <p className="text-[16px] font-semibold uppercase leading-none text-slate-100">{tr('Implikacja:', 'Implication:')}</p>
                    <p className="mt-1 text-[15px] leading-tight text-slate-200">{implication}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-slate-500/70 bg-slate-900/85 p-2">
                <div className="flex items-start gap-2">
                  <Brain size={20} className="mt-1 text-cyan-200" />
                  <div>
                    <p className="text-[16px] font-semibold uppercase leading-none text-slate-100">{tr('Psychologia:', 'Psychology:')}</p>
                    <p className="mt-1 text-[15px] leading-tight text-slate-200">{psychology}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeTemplateId === 'interpretation') {
    const averageGap = Math.abs(averageA - averageB)
    const isAverageDraw = averageGap < AVERAGE_DRAW_THRESHOLD
    const leaderSide: 'a' | 'b' = averageA >= averageB ? 'a' : 'b'
    const leaderName = leaderSide === 'a' ? fighterA.name || 'Fighter A' : fighterB.name || 'Fighter B'
    const cardTitleText = isAverageDraw ? tr('REMIS', 'DRAW') : leaderName
    const leaderColor = isAverageDraw ? '#94a3b8' : leaderSide === 'a' ? '#0b69ad' : '#b91c1c'

    const edgeRows = [...rows]
      .map((row) => {
        const delta = isAverageDraw
          ? Math.abs(row.a - row.b)
          : leaderSide === 'a'
            ? row.a - row.b
            : row.b - row.a
        return { label: row.label.toUpperCase(), delta }
      })
      .filter((row) => row.delta > 0)
      .sort((left, right) => right.delta - left.delta)
      .slice(0, 5)

    const fallbackEdges = isAverageDraw
      ? [
          { label: 'TEMPO CONTROL', delta: 0.8 },
          { label: 'RESOURCE ECONOMY', delta: 0.7 },
          { label: 'FINISH WINDOWS', delta: 0.6 },
        ]
      : [
          { label: 'POWER WINDOW', delta: 4 },
          { label: 'PACE CONTROL', delta: 3 },
          { label: 'COMBAT IQ', delta: 2 },
        ]
    const bars = edgeRows.length ? edgeRows : fallbackEdges
    const maxDelta = bars.length ? Math.max(...bars.map((bar) => bar.delta), 1) : 1
    const formatDelta = (value: number) => (Number.isInteger(value) ? `${value}` : value.toFixed(1))
    const barGradient = isAverageDraw
      ? 'linear-gradient(90deg,#334155,#94a3b8)'
      : leaderSide === 'a'
        ? 'linear-gradient(90deg,#0b69ad,#1377b9)'
        : 'linear-gradient(90deg,#8b1e1e,#dc2626)'

    const bullet1 = line(
      0,
      ['line_1', 'line1', 'thesis'],
      isAverageDraw
        ? tr(
            'Srednie sa w progu remisu (<1 punkt), wiec bazowy odczyt to remis.',
            'Averages are inside the draw threshold (<1 point), so baseline reads as a draw.',
          )
        : tr(
            `${leaderName} ma mierzalna przewage w modelu liniowym.`,
            `${leaderName} has a measurable edge in the linear model.`,
          ),
    )
    const bullet2 = line(
      1,
      ['line_2', 'line2', 'antithesis'],
      isAverageDraw
        ? tr(
            'Brak stabilnego faworyta na papierze. O wyniku decyduja warunki i wykonanie.',
            'There is no stable paper favorite. Conditions and execution decide the winner.',
          )
        : tr(
            'Mimo przewagi statystycznej, kontrmechaniki moga odwracac pojedyncze scenariusze.',
            'Even with a stat edge, counter-mechanics can flip individual scenarios.',
          ),
    )
    const bullet3 = line(
      2,
      ['line_3', 'line3', 'conclusion'],
      isAverageDraw
        ? tr(
            'Finalny werdykt musi wynikac z matrycy warunkow, nie tylko z tabeli statystyk.',
            'Final verdict must come from condition matrix, not from stats table alone.',
          )
        : tr(
            `Bazowo ${leaderName} prowadzi, ale tylko przy utrzymaniu wlasnych warunkow walki.`,
            `Baseline favors ${leaderName}, but only while maintaining preferred fight conditions.`,
          ),
    )
    const closingQuote =
      pickTemplateField(blockFields, ['quote', 'line_4', 'line4']) ||
      (isAverageDraw
        ? tr(
            'Prawie rowne statystyki przenosza decyzje z liczb na warunki walki.',
            'Near-equal stats move decisions from numbers to fight conditions.',
          )
        : tr(
            'Statystyki daja kierunek, ale warunki walki decyduja o wyniku.',
            'Stats set direction, but fight conditions decide outcome.',
          ))

    const badgeSymbol = isAverageDraw ? '=' : 'V'

    return (
      <div className="relative z-10 flex h-full flex-col text-slate-100">
        <div className="relative mt-1 min-h-0 flex-1 rounded-xl border border-cyan-300/35 bg-[linear-gradient(180deg,#06172a_0%,#0a2036_52%,#061325_100%)] p-3">
          <h2 className="text-center text-[52px] uppercase leading-none tracking-[0.02em] text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            {headerText}
          </h2>
          {subText ? <p className="mt-1 text-center text-[12px] uppercase tracking-[0.16em] text-slate-300">{subText}</p> : null}

          <div className="relative mt-2 rounded-md border border-cyan-300/25 bg-slate-950/70 p-2">
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(125,211,252,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(125,211,252,0.18)_1px,transparent_1px)] [background-size:12%_33%]" />
            <div className="relative z-10 grid grid-cols-[0.9fr_1.7fr] gap-2">
              <div className="flex min-h-[185px] items-center justify-center rounded-md border-2 p-3" style={{ borderColor: leaderColor, backgroundColor: `${leaderColor}1A` }}>
                <div className="w-full rounded-md border border-slate-500/70 bg-[linear-gradient(135deg,rgba(2,132,199,0.28),rgba(15,23,42,0.5))] p-2 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border-2 text-3xl font-bold" style={{ borderColor: leaderColor, color: leaderColor }}>
                    {badgeSymbol}
                  </div>
                  <p className="mt-3 text-[52px] uppercase leading-none" style={{ color: leaderColor, fontFamily: 'var(--font-display)' }}>
                    {cardTitleText}
                  </p>
                </div>
              </div>

              <div className="max-h-[286px] space-y-2 overflow-y-auto py-2 pr-1">
                {bars.map((bar, index) => {
                  const width = 26 + (bar.delta / Math.max(maxDelta, 1)) * 50
                  return (
                    <div key={`interp-bar-${index}-${bar.label}`} className="grid grid-cols-[1fr_auto] items-center gap-2">
                      <div className="h-8 overflow-hidden rounded-sm border border-slate-500/70 bg-slate-900/85">
                        <div className="h-full" style={{ width: `${width}%`, background: barGradient }} />
                      </div>
                      <p className="text-[20px] font-semibold uppercase leading-none text-slate-100">
                        {isAverageDraw ? `${bar.label} (d${formatDelta(bar.delta)})` : `${bar.label} (+${formatDelta(bar.delta)})`}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-2 rounded-md border border-slate-500/70 bg-slate-900/82 px-4 py-3">
            <ul className="list-disc space-y-1 pl-6 text-[20px] leading-tight text-slate-100">
              <li>{bullet1}</li>
              <li>{bullet2}</li>
              <li>{bullet3}</li>
            </ul>
          </div>

          <div className="mt-2 rounded-md border border-cyan-300/35 bg-slate-900/82 px-3 py-2 text-center text-[18px] italic text-slate-100">
            "{closingQuote}"
          </div>
        </div>
      </div>
    )
  }

  if (activeTemplateId === 'fight-simulation') {
    const opening = line(0, ['opening'], tr('Otwarcie: szybka kontrola dystansu.', 'Opening: fast range control.'))
    const midFight = line(1, ['mid_fight', 'midfight'], tr('Środek walki: presja i pętle regeneracji.', 'Mid fight: pressure and recovery loops.'))
    const lateFight = line(2, ['late_fight', 'latefight'], tr('Końcowa faza: test wyniszczenia.', 'Late fight: attrition checks.'))
    const endCondition = line(3, ['end_condition', 'endcondition'], tr('Warunek końca: KO/BFR kontra kill-only.', 'End condition: KO/BFR vs kill-only.'))
    const fallbackRows = [rows[0], rows[1], rows[5] || rows[2]].filter(Boolean) as ScoreRow[]

    const phaseDefaults = [
      {
        mode: 'bars' as const,
        animation: 'orbit-harass' as FightScenarioId,
        lead: 'a' as FightScenarioLead,
        title: opening,
        aLabel: fallbackRows[0]?.label || 'Strength',
        bLabel: fallbackRows[0]?.label || 'Strength',
        aValue: fallbackRows[0]?.a ?? 96,
        bValue: fallbackRows[0]?.b ?? 84,
        event: tr(`${fighterA.name || 'Fighter A'} narzuca tempo.`, `${fighterA.name || 'Fighter A'} sets the pace.`),
        branchA: tr(`${fighterA.name || 'Fighter A'} utrzymuje kontrol? dystansu.`, `${fighterA.name || 'Fighter A'} keeps range control.`),
        branchB: tr(`${fighterB.name || 'Fighter B'} prze?amuje dystans.`, `${fighterB.name || 'Fighter B'} breaks the distance.`),
      },
      {
        mode: 'split' as const,
        animation: 'clash-lock' as FightScenarioId,
        lead: 'a' as FightScenarioLead,
        title: midFight,
        aLabel: fallbackRows[1]?.label || 'Speed',
        bLabel: fallbackRows[1]?.label || 'Speed',
        aValue: fallbackRows[1]?.a ?? 92,
        bValue: fallbackRows[1]?.b ?? 88,
        event: tr('Punkt zwrotny: pierwsza wymiana zmienia warunki starcia.', 'Turning point: first exchange shifts the conditions.'),
        branchA: tr(`${fighterA.name || 'Fighter A'} buduje przewag? technik?.`, `${fighterA.name || 'Fighter A'} builds advantage with technique.`),
        branchB: tr(`${fighterB.name || 'Fighter B'} wymusza chaos i wyniszczenie.`, `${fighterB.name || 'Fighter B'} forces chaos and attrition.`),
      },
      {
        mode: 'bars' as const,
        animation: 'regen-attrition' as FightScenarioId,
        lead: 'a' as FightScenarioLead,
        title: lateFight,
        aLabel: fallbackRows[2]?.label || 'Stamina',
        bLabel: fallbackRows[2]?.label || 'Stamina',
        aValue: fallbackRows[2]?.a ?? 90,
        bValue: fallbackRows[2]?.b ?? 93,
        event: tr('Końcowy punkt zwrotny.', 'Final turning point.'),
        branchA: tr(`${fighterA.name || 'Fighter A'} domyka walk? decyzj?.`, `${fighterA.name || 'Fighter A'} closes the fight by decision.`),
        branchB: tr(`${fighterB.name || 'Fighter B'} prze?amuje rywala p??no.`, `${fighterB.name || 'Fighter B'} breaks the rival late.`),
      },
    ]

    const globalModeToken = normalizeToken(
      pickTemplateField(blockFields, ['phase_mode', 'phasemode', 'mode', 'simulation_mode', 'simulationmode']),
    )

    const parsePhaseMode = (
      token: string,
      fallback: 'bars' | 'split' | 'animation',
    ): 'bars' | 'split' | 'animation' => {
      if (!token) return fallback
      if (token.includes('anim') || token.includes('scenario') || token.includes('preset')) return 'animation'
      if (token.includes('split') || token.includes('branch') || token.includes('turn') || token.includes('pivot')) return 'split'
      return 'bars'
    }

    const globalAnimationValue = pickTemplateField(blockFields, [
      'phase_animation',
      'phaseanimation',
      'animation',
      'scenario',
      'preset',
      'simulation_animation',
      'simulationanimation',
    ])

    const globalAnimationSelection = resolveFightScenarioSelection(
      globalAnimationValue,
      phaseDefaults[0]?.animation || 'orbit-harass',
    )
    const globalAnimationId = globalAnimationSelection.id
    const globalLeadValue = pickTemplateField(blockFields, ['phase_actor', 'phaseactor', 'actor', 'lead', 'aggressor', 'attacker'])
    const globalLead = resolveFightScenarioLead(globalLeadValue, phaseDefaults[0]?.lead || 'a')

    const phaseMode = (index: number, fallback: 'bars' | 'split' | 'animation') => {
      const token = normalizeToken(
        pickTemplateField(blockFields, [
          `phase_${index}_mode`,
          `phase${index}mode`,
          `phase_${index}_type`,
          `phase${index}type`,
        ]),
      )
      return parsePhaseMode(token || globalModeToken, fallback)
    }

    const phaseAnimation = (index: number, fallback: FightScenarioId) => {
      const phaseAnimationValue =
        pickTemplateField(blockFields, [
          `phase_${index}_animation`,
          `phase${index}animation`,
          `phase_${index}_scenario`,
          `phase${index}scenario`,
          `phase_${index}_preset`,
          `phase${index}preset`,
        ]) || globalAnimationValue
      return resolveFightScenarioSelection(phaseAnimationValue, fallback || globalAnimationId)
    }

    const phaseLead = (index: number, fallback: FightScenarioLead) =>
      resolveFightScenarioLead(
        pickTemplateField(blockFields, [
          `phase_${index}_actor`,
          `phase${index}actor`,
          `phase_${index}_lead`,
          `phase${index}lead`,
          `phase_${index}_aggressor`,
          `phase${index}aggressor`,
          `phase_${index}_attacker`,
          `phase${index}attacker`,
        ]) || globalLeadValue,
        fallback || globalLead,
      )

    const phaseData = [1, 2, 3].map((index) => {
      const defaults = phaseDefaults[index - 1]
      const animationSelection = phaseAnimation(index, defaults.animation)
      return {
        mode: phaseMode(index, defaults.mode),
        animation: animationSelection.id,
        animationVariantToken: animationSelection.variantToken,
        animationLabel:
          animationSelection.label ||
          (animationSelection.variantToken
            ? FIGHT_SCENARIO_EXTENDED_LABELS_EN[animationSelection.variantToken] || humanizeScenarioToken(animationSelection.variantToken)
            : fightScenarioLabel(animationSelection.id, language)),
        lead: phaseLead(index, defaults.lead),
        title:
          pickTemplateField(blockFields, [
            `phase_${index}_title`,
            `phase${index}title`,
            `phase_${index}_headline`,
            `phase${index}headline`,
          ]) || defaults.title,
        aLabel:
          pickTemplateField(blockFields, [
            `phase_${index}_a_label`,
            `phase${index}alabel`,
            `phase_${index}_left_label`,
            `phase${index}leftlabel`,
          ]) || defaults.aLabel,
        bLabel:
          pickTemplateField(blockFields, [
            `phase_${index}_b_label`,
            `phase${index}blabel`,
            `phase_${index}_right_label`,
            `phase${index}rightlabel`,
          ]) || defaults.bLabel,
        aValue: parsePercentValue(
          pickTemplateField(blockFields, [
            `phase_${index}_a_value`,
            `phase${index}avalue`,
            `phase_${index}_left_value`,
            `phase${index}leftvalue`,
          ]),
          defaults.aValue,
        ),
        bValue: parsePercentValue(
          pickTemplateField(blockFields, [
            `phase_${index}_b_value`,
            `phase${index}bvalue`,
            `phase_${index}_right_value`,
            `phase${index}rightvalue`,
          ]),
          defaults.bValue,
        ),
        event:
          pickTemplateField(blockFields, [
            `phase_${index}_event`,
            `phase${index}event`,
            `phase_${index}_turn`,
            `phase${index}turn`,
            `phase_${index}_pivot`,
            `phase${index}pivot`,
          ]) || defaults.event,
        branchA:
          pickTemplateField(blockFields, [
            `phase_${index}_branch_a`,
            `phase${index}brancha`,
            `phase_${index}_option_a`,
            `phase${index}optiona`,
            `phase_${index}_left_option`,
            `phase${index}leftoption`,
          ]) || defaults.branchA,
        branchB:
          pickTemplateField(blockFields, [
            `phase_${index}_branch_b`,
            `phase${index}branchb`,
            `phase_${index}_option_b`,
            `phase${index}optionb`,
            `phase_${index}_right_option`,
            `phase${index}rightoption`,
          ]) || defaults.branchB,
      }
    })

    return (
      <div className="relative z-10 flex h-full flex-col text-slate-100">
        <div className="relative mt-1 min-h-0 flex-1 rounded-xl border border-cyan-300/35 bg-[linear-gradient(180deg,#06172a_0%,#0a2036_52%,#061325_100%)] p-3">
          <h2 className="text-center text-[48px] uppercase leading-none tracking-[0.03em] text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            {headerText}
          </h2>
          <p className="mt-1 text-center text-[12px] uppercase tracking-[0.16em] text-slate-300">{subText}</p>

          <div className="mt-2 grid min-h-0 flex-1 grid-cols-3 items-stretch gap-3 rounded-md border border-cyan-300/25 bg-slate-950/68 p-3">
            {phaseData.map((phase, index) => (
              <div key={`phase-sim-${index}-${phase.title}`} className="flex min-h-[430px] flex-col rounded-lg border border-slate-500/70 bg-slate-900/84 p-3">
                <div className="mb-2 flex items-center">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">{tr('Faza', 'Phase')} {index + 1}</p>
                </div>
                <p className="text-[20px] font-semibold leading-tight text-slate-100">{phase.title}</p>

                <div className="mt-2 rounded-md border border-slate-600/70 bg-slate-950/75 p-2">
                  <FightScenarioCanvas
                    scenario={phase.animation}
                    variantToken={phase.animationVariantToken}
                    colorA={fighterA.color}
                    colorB={fighterB.color}
                    lead={phase.lead}
                  />
                  <div className="mt-1 flex items-center justify-between rounded border border-slate-700/70 bg-slate-900/72 px-2 py-1">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{tr('Preset scenariusza', 'Scenario preset')}</span>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-cyan-100">{phase.animationLabel}</span>
                  </div>
                </div>

                {phase.mode === 'bars' ? (
                  <div className="mt-2 flex flex-1 items-stretch">
                    <div className="flex w-full items-end justify-center gap-10 rounded-md border border-slate-600/70 bg-slate-950/75 p-3">
                      {[
                        {
                          id: 'a',
                          label: phase.aLabel,
                          value: phase.aValue,
                          color: 'bg-[linear-gradient(180deg,#22d3ee,#1d4ed8)]',
                          textColor: 'text-sky-200',
                        },
                        {
                          id: 'b',
                          label: phase.bLabel,
                          value: phase.bValue,
                          color: 'bg-[linear-gradient(180deg,#fb7185,#b91c1c)]',
                          textColor: 'text-rose-200',
                        },
                      ].map((entry) => (
                        <div key={`phase-bar-${index}-${entry.id}`} className="flex h-full w-[44%] flex-col items-center justify-end">
                          <p className={`mb-2 text-[18px] font-semibold leading-none ${entry.textColor}`}>{Math.round(entry.value)}</p>
                          <div className="relative h-[170px] w-14 overflow-hidden rounded border border-slate-500/75 bg-slate-900/95">
                            <div className={`absolute bottom-0 left-0 right-0 ${entry.color}`} style={{ height: `${entry.value}%` }} />
                          </div>
                          <p className={`mt-2 text-center text-[11px] uppercase leading-tight tracking-[0.12em] ${entry.textColor}`}>
                            {entry.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-1 flex-col">
                    <p className="text-sm leading-tight text-slate-200">{phase.event}</p>
                    <div className="mt-2 flex flex-1 flex-col rounded-md border border-slate-600/70 bg-slate-950/75 p-2">
                      <svg viewBox="0 0 100 40" className="h-20 w-full">
                        <line x1="50" y1="2" x2="50" y2="14" stroke="#94a3b8" strokeWidth="1.1" />
                        <line x1="50" y1="14" x2="22" y2="37" stroke="#22d3ee" strokeWidth="1.2" />
                        <line x1="50" y1="14" x2="78" y2="37" stroke="#fb7185" strokeWidth="1.2" />
                        <circle cx="50" cy="14" r="2.2" fill="#e2e8f0" />
                      </svg>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="rounded border border-cyan-300/45 bg-cyan-500/12 px-2 py-1.5 text-xs leading-tight text-cyan-100">{phase.branchA}</div>
                        <div className="rounded border border-rose-300/45 bg-rose-500/12 px-2 py-1.5 text-xs leading-tight text-rose-100">{phase.branchB}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-2 rounded-md border border-cyan-300/35 bg-slate-900/82 px-3 py-2 text-center text-[18px] text-slate-100">
            {endCondition}
          </div>
        </div>
      </div>
    )
  }

  if (activeTemplateId === 'stat-trap') {
    const trapTop =
      pickTemplateField(blockFields, ['trap_top', 'top', 'line_1']) ||
      tr('REGEN I BRUTALNOŚĆ >', 'REGEN AND BRUTALITY >')
    const trapBottom =
      pickTemplateField(blockFields, ['trap_bottom', 'bottom', 'line_2']) ||
      tr('TECHNIKA W DŁUGIEJ WALCE', 'TECHNIQUE IN A LONG FIGHT')
    const example =
      pickTemplateField(blockFields, ['example', 'line_3']) ||
      tr(
        'Różnica 2-3 punktów w umiejętnościach zanika, gdy przeciwnik leczy się natychmiastowo po każdym ciosie.',
        'A 2-3 point skill edge disappears when the opponent heals immediately after each hit.',
      )
    const questionLine =
      pickTemplateField(blockFields, ['question', 'line_4', 'trap']) ||
      tr(
        "KLUCZOWE PYTANIE: W trybie 'Kill-Only' regeneracja przeciwnika waży więcej niż statystyki all-around.",
        "KEY QUESTION: In 'Kill-Only' rules, opponent regeneration matters more than all-around stats.",
      )

    const questionMatch = questionLine.match(/^([^:]+:)\s*(.*)$/)
    const questionLead = questionMatch?.[1] || tr('KLUCZOWE PYTANIE:', 'KEY QUESTION:')
    const questionBody = questionMatch?.[2] || questionLine

    return (
      <div className="relative z-10 flex h-full flex-col text-slate-100">
        <div className="relative mt-1 min-h-0 flex-1 overflow-hidden rounded-xl border border-cyan-300/35 bg-[linear-gradient(180deg,#06172a_0%,#0a2036_52%,#061325_100%)] p-3">
          <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(125,211,252,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(125,211,252,0.18)_1px,transparent_1px)] [background-size:7%_13%]" />

          <div className="relative z-10 flex h-full flex-col">
            <h2 className="text-center text-[72px] uppercase leading-none tracking-[0.02em] text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
              {headerText}
            </h2>
            <p className="mt-1 text-center text-[12px] uppercase tracking-[0.16em] text-slate-300">{subText}</p>

            <div className="mt-2 border-y border-cyan-300/25 py-2">
              <p
                className="flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap text-center text-[clamp(1.15rem,1.5vw,1.9rem)] uppercase leading-none"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <span className="shrink-0 text-[#b10f24]">{trapTop}</span>
                <span className="shrink-0 text-[#c4951a]">{trapBottom}</span>
              </p>
            </div>

            <p className="mt-2 whitespace-pre-line text-[clamp(1.8rem,1.95vw,2.95rem)] leading-[1.08] text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
              {example}
            </p>

            <div className="mt-[clamp(12px,1.4vh,22px)] mb-[-8px] flex items-center justify-center">
              <svg
                viewBox="0 0 100 92"
                className="h-[clamp(156px,16.8vw,252px)] w-[clamp(178px,19vw,286px)] drop-shadow-[0_0_16px_rgba(255,45,63,0.52)]"
                aria-hidden="true"
              >
                <polygon
                  points="50,6 95,84 5,84"
                  fill="rgba(255,255,255,0.96)"
                  stroke="#ff2d3f"
                  strokeWidth="6"
                  strokeLinejoin="round"
                />
                <line x1="50" y1="30" x2="50" y2="56" stroke="#ff2d3f" strokeWidth="8" strokeLinecap="round" />
                <circle cx="50" cy="69" r="4.8" fill="#ff2d3f" />
              </svg>
            </div>

            <p className="mt-auto text-[clamp(1.6rem,1.75vw,2.6rem)] leading-[1.08] text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
              <span className="font-bold">{questionLead}</span> {questionBody}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (activeTemplateId === 'verdict-matrix') {
    const case1 = line(
      0,
      ['case_1', 'case1'],
      tr(
        `${fighterA.name || 'Fighter A'} (6/10). Szybkość i technika kończą walkę przed czasem.`,
        `${fighterA.name || 'Fighter A'} (6/10). Speed and technique finish the fight before time runs out.`,
      ),
    )
    const case2 = line(
      1,
      ['case_2', 'case2'],
      tr(
        `${fighterB.name || 'Fighter B'} (5.5/10). Trudniej o szybkie domknięcie. Regen daje przewagę.`,
        `${fighterB.name || 'Fighter B'} (5.5/10). A quick closeout is harder. Regen gives the edge.`,
      ),
    )
    const case3 = line(
      2,
      ['case_3', 'case3'],
      tr(
        `${fighterA.name || 'Fighter A'} (5.5/10). Ryzyko rośnie. Jeśli szybki finisher nie wejdzie, rywal wraca.`,
        `${fighterA.name || 'Fighter A'} (5.5/10). Risk rises. If the fast finisher does not land, the opponent comes back.`,
      ),
    )
    const case4 = line(
      3,
      ['case_4', 'case4'],
      tr(
        `${fighterB.name || 'Fighter B'} (6.5/10). Wojna na wyniszczenie faworyzuje regen.`,
        `${fighterB.name || 'Fighter B'} (6.5/10). Attrition war favors regen.`,
      ),
    )

    const splitCase = (value: string) => {
      const clean = value.trim()
      const normalized = clean.replace(/(\d)\s*\.\s*(\d)/g, '$1.$2')
      const match = normalized.match(/^(.+?[.!?])\s+([\p{L}].*)$/su)
      if (!match) return { lead: clean, body: '' }
      return { lead: match[1].trim(), body: match[2].trim() }
    }

    const colLeftHeader =
      pickTemplateField(blockFields, ['col_left', 'solar_flare_yes', 'solarflare_yes']) || tr('SOLAR FLARE: TAK', 'SOLAR FLARE: YES')
    const colRightHeader =
      pickTemplateField(blockFields, ['col_right', 'solar_flare_no', 'solarflare_no']) || tr('SOLAR FLARE: NIE', 'SOLAR FLARE: NO')
    const rowTopHeader =
      pickTemplateField(blockFields, ['row_top', 'standard', 'standard_ko']) || 'STANDARD KO'
    const rowBottomHeader =
      pickTemplateField(blockFields, ['row_bottom', 'deathmatch', 'kill_only']) || 'DEATHMATCH'

    const cells = [
      {
        id: 'tl',
        ...splitCase(case1),
        bg: 'bg-[linear-gradient(135deg,rgba(14,116,144,0.34),rgba(30,64,175,0.28))]',
        mark: fighterMonogram(fighterA.name || 'A'),
      },
      {
        id: 'tr',
        ...splitCase(case2),
        bg: 'bg-[linear-gradient(135deg,rgba(146,64,14,0.26),rgba(161,98,7,0.22))]',
        mark: fighterMonogram(fighterB.name || 'B'),
      },
      {
        id: 'bl',
        ...splitCase(case3),
        bg: 'bg-[linear-gradient(135deg,rgba(8,47,73,0.5),rgba(30,58,138,0.36))]',
        mark: fighterMonogram(fighterA.name || 'A'),
      },
      {
        id: 'br',
        ...splitCase(case4),
        bg: 'bg-[linear-gradient(135deg,rgba(120,53,15,0.4),rgba(133,77,14,0.3))]',
        mark: fighterMonogram(fighterB.name || 'B'),
      },
    ]

    return (
      <div className="relative z-10 flex h-full flex-col text-slate-100">
        <div className="relative mt-1 min-h-0 flex-1 overflow-hidden rounded-xl border border-cyan-300/35 bg-[linear-gradient(180deg,#06172a_0%,#0a2036_52%,#061325_100%)] p-3">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(125,211,252,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(125,211,252,0.2)_1px,transparent_1px)] [background-size:7%_13%]" />

          <div className="relative z-10 flex h-full flex-col">
            <h2 className="text-center text-[58px] uppercase leading-none tracking-[0.02em] text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
              {headerText}
            </h2>
            <p className="mt-1 text-center text-[12px] uppercase tracking-[0.16em] text-slate-300">{subText}</p>

            <div className="mt-2 grid min-h-0 flex-1 grid-cols-[96px_1fr] grid-rows-[56px_1fr]">
              <div />

              <div className="grid grid-cols-2">
                <div className="flex items-center justify-center border border-cyan-300/45 bg-slate-900/72 text-[38px] uppercase leading-none text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
                  {colLeftHeader}
                </div>
                <div className="flex items-center justify-center border border-l-0 border-cyan-300/45 bg-slate-900/72 text-[38px] uppercase leading-none text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
                  {colRightHeader}
                </div>
              </div>

              <div className="grid grid-rows-2">
                <div className="relative border border-r-0 border-t-0 border-cyan-300/45 bg-slate-900/72">
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[16px] uppercase tracking-[0.05em] text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
                    {rowTopHeader}
                  </span>
                </div>
                <div className="relative border border-r-0 border-t-0 border-cyan-300/45 bg-slate-900/72">
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[16px] uppercase tracking-[0.05em] text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
                    {rowBottomHeader}
                  </span>
                </div>
              </div>

              <div className="grid min-h-0 grid-cols-2 grid-rows-2 border border-t-0 border-cyan-300/45">
                {cells.map((cell, index) => (
                  <div
                    key={`matrix-cell-${cell.id}`}
                    className={`relative overflow-hidden border-cyan-300/45 p-3 ${cell.bg} ${index % 2 === 0 ? 'border-r' : ''} ${index < 2 ? 'border-b' : ''}`}
                  >
                    <p className="relative z-10 text-[clamp(1.3rem,1.45vw,2.2rem)] font-semibold uppercase leading-tight text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
                      {cell.lead}
                    </p>
                    {cell.body ? (
                      <p className="relative z-10 mt-1 text-[clamp(1.15rem,1.25vw,1.9rem)] leading-[1.08] text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
                        {cell.body}
                      </p>
                    ) : null}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[170px] font-bold text-white/10">
                      {cell.mark}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <h2 className="text-center text-3xl uppercase tracking-[0.08em] text-slate-50">{headerText}</h2>
      <p className="mt-1 text-center text-sm uppercase tracking-[0.16em] text-slate-300">{subText}</p>
      <div className="mt-3 flex min-h-0 flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-400/45 bg-black/26">
        {renderedLines.length ? (
          <div className="w-[88%] rounded-xl border border-slate-500/45 bg-slate-950/60 p-4">
            <p className="text-center text-xs uppercase tracking-[0.18em] text-slate-300">{tr('Podgląd bloku template', 'Template block preview')}</p>
            <div className="mt-3 max-h-[320px] space-y-1 overflow-y-auto pr-1 text-sm text-slate-100">
              {renderedLines.map((line, index) => (
                <div key={`blank-line-${index}-${line}`} className="rounded border border-slate-700/55 bg-black/35 px-2 py-1">
                  {line}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[20px] uppercase tracking-[0.24em] text-slate-400">{tr('PUSTE POLE', 'EMPTY FIELD')}</p>
        )}
      </div>
    </div>
  )
}
