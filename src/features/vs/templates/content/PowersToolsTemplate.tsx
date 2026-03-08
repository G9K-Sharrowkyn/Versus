import { BookOpen, Crosshair, Swords, WandSparkles } from 'lucide-react'
import { pickLang } from '../../presets'
import { normalizeToken } from '../../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { Fighter, FighterFact, IconType, Language, TemplatePreviewProps } from '../../types'
import {
  HIGH_END_CARD_CLASS,
  HIGH_END_FRAME_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_HEADER_CLASS,
  HIGH_END_INSET_CLASS,
  HIGH_END_LABEL_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HIGH_END_SMALL_TEXT_CLASS,
  HIGH_END_SUBTEXT_CLASS,
} from '../shared/highEnd'

const TOOLKIT_SECTION_ORDER = ['powers', 'tools', 'weaknesses'] as const

const normalizeToolkitGroupKey = (title: string) => {
  const token = normalizeToken(title)
  if (!token) return 'other'
  if (token.includes('weak') || token.includes('slab')) return 'weaknesses'
  if (token.includes('tool') || token.includes('narzed')) return 'tools'
  if (token.includes('power') || token.includes('moc')) return 'powers'
  return token
}

const buildToolkitSections = (
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
  return [
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
}

const getToolkitSectionMeta = (
  key: string,
  fields: Record<string, string>,
  language: Language,
) => {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)

  if (key === 'powers') {
    return {
      label: pickTemplateField(fields, ['powers_label']) || tr('Moce', 'Powers'),
      icon: WandSparkles,
    }
  }
  if (key === 'tools') {
    return {
      label: pickTemplateField(fields, ['tools_label']) || tr('Narzedzia', 'Tools'),
      icon: Swords,
    }
  }
  if (key === 'weaknesses') {
    return {
      label: pickTemplateField(fields, ['weaknesses_label']) || tr('Slabosci', 'Weaknesses'),
      icon: Crosshair,
    }
  }

  return {
    label: tr('Dane', 'Data'),
    icon: BookOpen,
  }
}

export function PowersToolsTemplate({
  fighterA,
  fighterB,
  powersA,
  powersB,
  title,
  templateBlocks,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['powers-tools'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = ''
  const leftTopLabel = tr('Stopien zagrozenia', 'Threat level')
  const threatLevel = tr('ekstremalny', 'extreme')
  const leftBottomLabel = tr('Integralnosc danych', 'Data integrity')
  const integrity = '99.6%'
  const rightTopLabel = 'VersusVerseVault'
  const profileMode = '/assets/VS2.png'
  const rightBottomLabel = tr('Sygnatura marki', 'Brand mark')
  const scale = 'VersusVerseVault badge'
  const leftTitle =
    pickTemplateField(blockFields, ['left_title']) ||
    `${fighterA.name || 'Fighter A'} ${tr('profil narzedzi', 'toolkit profile')}`
  const rightTitle =
    pickTemplateField(blockFields, ['right_title']) ||
    `${fighterB.name || 'Fighter B'} ${tr('profil narzedzi', 'toolkit profile')}`
  const leftSections = buildToolkitSections(powersA, blockFields, language)
  const rightSections = buildToolkitSections(powersB, blockFields, language)
  const leftSectionMap = new Map(leftSections.map((section) => [section.key, section]))
  const rightSectionMap = new Map(rightSections.map((section) => [section.key, section]))
  const sectionRowKeys = [
    ...TOOLKIT_SECTION_ORDER.filter((key) => leftSectionMap.has(key) || rightSectionMap.has(key)),
    ...Array.from(new Set([...leftSections.map((section) => section.key), ...rightSections.map((section) => section.key)])).filter(
      (key) => !TOOLKIT_SECTION_ORDER.includes(key as (typeof TOOLKIT_SECTION_ORDER)[number]),
    ),
  ]

  const renderColumnHeader = (
    fighter: Fighter,
    columnTitle: string,
  ) => (
    <div className={`${HIGH_END_FRAME_CLASS} min-h-0 p-3`}>
      <div
        className={`${HIGH_END_INSET_CLASS} px-3 py-2`}
        style={{ boxShadow: `0 0 0 1px ${fighter.color}33 inset` }}
      >
        <p className={HIGH_END_SMALL_TEXT_CLASS}>{fighter.name || 'Fighter'}</p>
        <p className="mt-1 text-[14px] uppercase tracking-[0.14em]" style={{ color: fighter.color, fontFamily: 'var(--font-display)' }}>
          {columnTitle}
        </p>
      </div>
    </div>
  )

  const renderSectionCard = (
    fighter: Fighter,
    sectionKey: string,
    section: ReturnType<typeof buildToolkitSections>[number] | undefined,
  ) => {
    const sectionMeta = section || getToolkitSectionMeta(sectionKey, blockFields, language)
    const Icon = sectionMeta.icon

    return (
      <div className={`h-full min-h-0 ${HIGH_END_CARD_CLASS} p-3`}>
        <div className="mb-2 flex items-center gap-2">
          <Icon size={16} style={{ color: fighter.color }} />
          <p className={HIGH_END_LABEL_CLASS}>{sectionMeta.label}</p>
        </div>
        {section ? (
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
        ) : (
          <div className="flex h-[calc(100%-1.75rem)] items-center justify-center rounded-md border border-dashed border-cyan-300/20 bg-slate-950/45 px-3 text-center text-sm text-slate-500">
            {tr('Brak danych w tej kategorii.', 'No data in this category.')}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full flex-col">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 border-b border-cyan-300/25 pb-3 text-[11px] text-slate-300">
            <div className="min-w-[238px] space-y-1 pt-2 text-left">
              <p className="whitespace-nowrap uppercase tracking-[0.16em]">{leftTopLabel}: {threatLevel}</p>
              <p className="whitespace-nowrap uppercase tracking-[0.16em]">{leftBottomLabel}: {integrity}</p>
            </div>
            <div className="text-center">
              <h2 className={HIGH_END_HEADER_CLASS} style={{ fontFamily: 'var(--font-display)' }}>{headerText}</h2>
              {subText ? <p className={HIGH_END_SUBTEXT_CLASS}>{subText}</p> : null}
            </div>
            <div className="flex items-start justify-end pt-1">
  <div
    className="flex h-[86px] aspect-[755/322] items-center justify-center overflow-hidden rounded-[14px] border border-cyan-300/35 bg-[linear-gradient(180deg,rgba(7,24,42,0.96),rgba(4,14,24,0.94))] p-0 shadow-[0_0_0_1px_rgba(125,211,252,0.08)_inset,0_10px_26px_rgba(2,8,23,0.45)]"
    title={rightBottomLabel}
    aria-label={scale}
  >
    <img src={profileMode} alt={rightTopLabel} className="h-full w-full object-contain drop-shadow-[0_0_14px_rgba(251,146,60,0.28)]" draggable={false} />
  </div>
</div>
          </div>
          <div className="mt-3 grid min-h-0 flex-1 grid-rows-[auto_1fr] gap-3">
            <div className="grid grid-cols-2 gap-3">
              {renderColumnHeader(fighterA, leftTitle)}
              {renderColumnHeader(fighterB, rightTitle)}
            </div>
            {sectionRowKeys.length ? (
              <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
                {sectionRowKeys.map((sectionKey) => (
                  <div key={sectionKey} className="grid items-stretch grid-cols-2 gap-3">
                    {renderSectionCard(fighterA, sectionKey, leftSectionMap.get(sectionKey))}
                    {renderSectionCard(fighterB, sectionKey, rightSectionMap.get(sectionKey))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-cyan-300/25 bg-slate-950/60 px-3 py-4 text-center text-sm text-slate-400">
                  {tr('Brak danych o mocach i slabosciach.', 'No powers / weaknesses data found.')}
                </div>
                <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-cyan-300/25 bg-slate-950/60 px-3 py-4 text-center text-sm text-slate-400">
                  {tr('Brak danych o mocach i slabosciach.', 'No powers / weaknesses data found.')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

