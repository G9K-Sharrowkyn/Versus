import clsx from 'clsx'
import { Fragment, useEffect, useMemo, useState } from 'react'
import type { TranslationDictionary } from '../../../../i18n/types'
import type { TemplateId, TemplatePreset } from '../../types'

type DraftImportPanelProps = {
  ui: TranslationDictionary['ui']
  availableTemplates: TemplatePreset[]
  onCreateFightScaffold: (matchName: string, templateOrder: TemplateId[]) => Promise<string>
}

const FINAL_TEMPLATE_ID: TemplateId = 'fight-card'
type TemplateSectionId = 'intro' | 'development' | 'fight-phase' | 'ending'

const DEFAULT_SCAFFOLD_TEMPLATE_ORDER: TemplateId[] = [
  'tactical-board',
  'character-dossier-a',
  'character-dossier-b',
  'character-profile',
  'crucial-feats',
  'fight-analytics',
  'parameter-comparison',
  'interpretation',
  'stat-trap',
  'x-factor',
  'victory-archive',
  'final-summary',
  'battle-dynamics',
  'fight-simulation',
  'verdict-matrix',
  'fight-card',
]

const TEMPLATE_SECTION_ORDER: TemplateSectionId[] = ['intro', 'development', 'fight-phase', 'ending']

const TEMPLATE_SECTION_BY_ID: Record<TemplateId, TemplateSectionId> = {
  'tactical-board': 'intro',
  'character-dossier-a': 'intro',
  'character-dossier-b': 'intro',
  'character-profile': 'intro',
  'crucial-feats': 'development',
  'fight-analytics': 'development',
  'parameter-comparison': 'development',
  'victory-archive': 'development',
  'final-summary': 'development',
  'battle-dynamics': 'fight-phase',
  'x-factor': 'fight-phase',
  'interpretation': 'fight-phase',
  'fight-simulation': 'fight-phase',
  'stat-trap': 'fight-phase',
  'direct-verdict': 'ending',
  'verdict-matrix': 'ending',
  methodology: 'ending',
  'fight-card': 'ending',
}

const normalizeSelectedTemplateOrder = (order: TemplateId[]) => {
  const next: TemplateId[] = []
  order.forEach((templateId) => {
    if (templateId === FINAL_TEMPLATE_ID) return
    if (!next.includes(templateId)) next.push(templateId)
  })
  next.push(FINAL_TEMPLATE_ID)
  return next
}

const parseMatchup = (value: string) => {
  const match = value.trim().match(/^(.+?)\s+(?:vs\.?|versus|kontra|v)\s+(.+?)$/i)
  if (!match) return null
  const fighterAName = match[1]?.trim()
  const fighterBName = match[2]?.trim()
  if (!fighterAName || !fighterBName) return null
  return { fighterAName, fighterBName }
}

const getTemplateSectionLabel = (ui: TranslationDictionary['ui'], sectionId: TemplateSectionId) => {
  switch (sectionId) {
    case 'intro':
      return ui.templateSectionIntro
    case 'development':
      return ui.templateSectionDevelopment
    case 'fight-phase':
      return ui.templateSectionFightPhase
    case 'ending':
      return ui.templateSectionEnding
  }
}

export function DraftImportPanel({
  ui,
  availableTemplates,
  onCreateFightScaffold,
}: DraftImportPanelProps) {
  const [matchName, setMatchName] = useState('')
  const [preparedMatchName, setPreparedMatchName] = useState('')
  const [selectedTemplateOrder, setSelectedTemplateOrder] = useState<TemplateId[]>(() =>
    normalizeSelectedTemplateOrder(DEFAULT_SCAFFOLD_TEMPLATE_ORDER),
  )
  const [draggedTemplateId, setDraggedTemplateId] = useState<TemplateId | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const templateById = useMemo(
    () => new Map(availableTemplates.map((template) => [template.id, template])),
    [availableTemplates],
  )

  useEffect(() => {
    const fallbackOrder = normalizeSelectedTemplateOrder(
      DEFAULT_SCAFFOLD_TEMPLATE_ORDER.filter((templateId) => templateById.has(templateId)),
    )
    setSelectedTemplateOrder((current) => {
      if (current.length) {
        const filtered = normalizeSelectedTemplateOrder(current.filter((templateId) => templateById.has(templateId)))
        if (filtered.length) return filtered
      }
      return fallbackOrder
    })
  }, [templateById])

  const selectedTemplates = selectedTemplateOrder
    .map((templateId) => templateById.get(templateId))
    .filter((template): template is TemplatePreset => Boolean(template))

  const availableToAdd = availableTemplates.filter(
    (template) => template.id !== FINAL_TEMPLATE_ID && !selectedTemplateOrder.includes(template.id),
  )

  const availableTemplatesBySection = TEMPLATE_SECTION_ORDER.map((sectionId) => ({
    sectionId,
    templates: availableToAdd.filter((template) => TEMPLATE_SECTION_BY_ID[template.id] === sectionId),
  })).filter((entry) => entry.templates.length)

  const preparedMatchup = parseMatchup(preparedMatchName)

  const handlePrepare = () => {
    if (!parseMatchup(matchName)) {
      setErrorMessage(ui.createFightNameError)
      setSuccessMessage('')
      return
    }
    setPreparedMatchName(matchName.trim())
    setErrorMessage('')
    setSuccessMessage('')
  }

  const addTemplate = (templateId: TemplateId) => {
    setSelectedTemplateOrder((current) => normalizeSelectedTemplateOrder([...current, templateId]))
  }

  const removeTemplate = (templateId: TemplateId) => {
    if (templateId === FINAL_TEMPLATE_ID) return
    setSelectedTemplateOrder((current) => normalizeSelectedTemplateOrder(current.filter((entry) => entry !== templateId)))
  }

  const moveTemplateBefore = (draggedId: TemplateId, targetId: TemplateId) => {
    if (draggedId === FINAL_TEMPLATE_ID || targetId === FINAL_TEMPLATE_ID && draggedId === FINAL_TEMPLATE_ID) return
    setSelectedTemplateOrder((current) => {
      const movable = current.filter((entry) => entry !== FINAL_TEMPLATE_ID)
      const draggedIndex = movable.indexOf(draggedId)
      const targetIndex = movable.indexOf(targetId)
      if (draggedIndex < 0 || targetIndex < 0) return current
      const next = movable.slice()
      next.splice(draggedIndex, 1)
      next.splice(targetIndex, 0, draggedId)
      return normalizeSelectedTemplateOrder(next)
    })
  }

  const handleCreate = async () => {
    if (!preparedMatchup) {
      setErrorMessage(ui.createFightNameError)
      return
    }

    setIsCreating(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const folderName = await onCreateFightScaffold(preparedMatchName, selectedTemplateOrder)
      setSuccessMessage(`${ui.createFightSuccess}: ${folderName}`)
      setPreparedMatchName('')
      setMatchName('')
      setSelectedTemplateOrder(normalizeSelectedTemplateOrder(DEFAULT_SCAFFOLD_TEMPLATE_ORDER))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : ui.createFightFailed)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <section className="panel">
      <h2 className="text-lg font-semibold uppercase tracking-[0.12em] text-slate-100">{ui.scaffoldTitle}</h2>
      <p className="mt-2 text-sm text-slate-300">{ui.scaffoldSubtitle}</p>

      <div className="mt-4 rounded-xl border border-slate-700/70 bg-slate-950/55 p-3">
        <label className="section-label" htmlFor="fight-scaffold-name">
          {ui.matchNameLabel}
        </label>
        <input
          id="fight-scaffold-name"
          type="text"
          value={matchName}
          onChange={(event) => setMatchName(event.target.value)}
          placeholder={ui.matchNamePlaceholder}
          className="mt-2 w-full rounded-xl border border-slate-700/80 bg-slate-950/85 px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/65"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="button-soft" onClick={handlePrepare}>
            {ui.prepareFightScaffold}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400">{ui.scaffoldHelp}</p>
      </div>

      {preparedMatchup ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 p-3 text-sm text-cyan-50">
            <p className="section-label">{ui.scaffoldReadyLabel}</p>
            <p className="mt-2">{preparedMatchName}</p>
            <p className="mt-2 text-xs text-cyan-100/80">
              {preparedMatchup.fighterAName} / {preparedMatchup.fighterBName}
            </p>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1.2fr_0.9fr]">
            <div className="rounded-xl border border-slate-700/70 bg-slate-950/55 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="section-label">{ui.selectedTemplatesLabel}</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{ui.templateDragHint}</p>
              </div>

              <div className="mt-3 space-y-2">
                {selectedTemplates.map((template, index) => {
                  const isFixedFinal = template.id === FINAL_TEMPLATE_ID
                  const sectionId = TEMPLATE_SECTION_BY_ID[template.id]
                  const previousSectionId = index > 0 ? TEMPLATE_SECTION_BY_ID[selectedTemplates[index - 1]!.id] : null
                  const showSectionHeader = sectionId !== previousSectionId
                  return (
                    <Fragment key={template.id}>
                      {showSectionHeader ? (
                        <div className="pt-2 first:pt-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100/80">
                            {getTemplateSectionLabel(ui, sectionId)}
                          </p>
                        </div>
                      ) : null}
                      <div
                        draggable={!isFixedFinal}
                        onDragStart={() => {
                          if (isFixedFinal) return
                          setDraggedTemplateId(template.id)
                        }}
                        onDragOver={(event) => {
                          if (!draggedTemplateId || draggedTemplateId === template.id) return
                          event.preventDefault()
                        }}
                        onDrop={(event) => {
                          event.preventDefault()
                          if (!draggedTemplateId || draggedTemplateId === template.id) return
                          moveTemplateBefore(draggedTemplateId, template.id)
                          setDraggedTemplateId(null)
                        }}
                        onDragEnd={() => setDraggedTemplateId(null)}
                        className={clsx(
                          'flex items-center gap-3 rounded-xl border px-3 py-3 transition',
                          isFixedFinal
                            ? 'border-amber-300/35 bg-amber-500/10'
                            : draggedTemplateId === template.id
                              ? 'border-cyan-300/70 bg-cyan-500/10'
                              : 'border-slate-700/70 bg-slate-900/75',
                        )}
                      >
                        <div className="flex w-8 shrink-0 items-center justify-center text-xs font-semibold text-slate-300">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-100">{template.name}</p>
                            <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">
                              {getTemplateSectionLabel(ui, sectionId)}
                            </span>
                          </div>
                          <p className="truncate text-xs text-slate-400">{template.id}</p>
                        </div>
                        {isFixedFinal ? (
                          <span className="rounded-full border border-amber-300/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100">
                            {ui.templateFixedLabel}
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="rounded-lg border border-rose-300/35 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-rose-100 transition hover:bg-rose-500/20"
                            onClick={() => removeTemplate(template.id)}
                          >
                            {ui.removeTemplate}
                          </button>
                        )}
                      </div>
                    </Fragment>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-700/70 bg-slate-950/55 p-3">
              <p className="section-label">{ui.availableTemplatesLabel}</p>
              <div className="mt-3 space-y-2">
                {availableToAdd.length ? (
                  availableTemplatesBySection.map(({ sectionId, templates }) => (
                    <div key={sectionId} className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100/80">
                        {getTemplateSectionLabel(ui, sectionId)}
                      </p>
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          className="flex w-full items-center justify-between rounded-xl border border-slate-700/70 bg-slate-900/75 px-3 py-3 text-left transition hover:border-cyan-300/45 hover:bg-slate-900"
                          onClick={() => addTemplate(template.id)}
                        >
                          <span>
                            <span className="block text-sm font-semibold text-slate-100">{template.name}</span>
                            <span className="block text-xs text-slate-400">{template.id}</span>
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100">{ui.addTemplate}</span>
                        </button>
                      ))}
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-slate-700/70 bg-slate-900/75 px-3 py-4 text-sm text-slate-400">
                    {ui.allTemplatesSelected}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/70 bg-slate-950/55 p-3 text-sm text-slate-300">
            <p className="section-label">{ui.generatedFilesLabel}</p>
            <p className="mt-2">{ui.generatedFilesHelp}</p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>`{ui.generatedFolderAuto}`</li>
              <li>`&lt;auto number&gt; {preparedMatchName} EN.json`</li>
              <li>`&lt;auto number&gt; {preparedMatchName} PL.json`</li>
              <li>`&lt;auto number&gt; {preparedMatchName} Scans.json`</li>
              <li>`img/`</li>
            </ul>
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-rose-300/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-xl border border-emerald-300/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
              {successMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button type="button" className="button-soft" disabled={isCreating} onClick={handleCreate}>
              {isCreating ? ui.createFightWorking : ui.createFightFolder}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
