import { pickLang } from '../../presets'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { Fighter, TemplatePreviewProps } from '../../types'
import { buildToolkitSections } from './toolkit'

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
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">{fighter.name || 'Fighter'}</p>
        <p className="mt-1 text-[14px] uppercase tracking-[0.14em]" style={{ color: fighter.color }}>
          {columnTitle}
        </p>
      </div>

      <div className="mt-3 grid min-h-0 flex-1 grid-rows-[repeat(3,minmax(0,1fr))] gap-2">
        {sections.map((section) => {
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
        <div className="text-right text-[11px] uppercase tracking-[0.18em] text-slate-300">{subText}</div>
      </div>
      <div className="mt-3 grid min-h-0 flex-1 grid-cols-2 gap-3">
        {renderColumn(fighterA, leftTitle, leftSections)}
        {renderColumn(fighterB, rightTitle, rightSections)}
      </div>
    </div>
  )
}
