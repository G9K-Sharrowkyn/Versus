import type { BlankTemplateVariantProps } from './context'

export function DefaultBlankTemplate({ context }: BlankTemplateVariantProps) {
  const { headerText, subText, renderedLines, tr } = context

  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <h2 className="text-center text-3xl uppercase tracking-[0.08em] text-slate-50">{headerText}</h2>
      <p className="mt-1 text-center text-sm uppercase tracking-[0.16em] text-slate-300">{subText}</p>
      <div className="mt-3 flex min-h-0 flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-400/45 bg-black/26">
        {renderedLines.length ? (
          <div className="w-[88%] rounded-xl border border-slate-500/45 bg-slate-950/60 p-4">
            <p className="text-center text-xs uppercase tracking-[0.18em] text-slate-300">
              {tr('Podglad bloku template', 'Template block preview')}
            </p>
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
