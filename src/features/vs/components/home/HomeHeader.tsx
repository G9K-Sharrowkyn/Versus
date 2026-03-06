import type { TranslationDictionary } from '../../../../i18n/types'

type HomeHeaderProps = {
  ui: TranslationDictionary['ui']
  onToggleLanguage: () => void
}

export function HomeHeader({ ui, onToggleLanguage }: HomeHeaderProps) {
  return (
    <header className="relative mb-4 overflow-hidden rounded-2xl border border-cyan-300/35 bg-slate-950/70 p-4 backdrop-blur-xl sm:mb-5">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(34,211,238,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.22)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l-2 border-t-2 border-cyan-300/70" />
      <div className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r-2 border-t-2 border-cyan-300/70" />
      <div className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b-2 border-l-2 border-cyan-300/70" />
      <div className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b-2 border-r-2 border-cyan-300/70" />
      <div className="relative z-10 rounded-xl border border-cyan-300/30 bg-black/25 px-4 py-3">
        <button
          type="button"
          onClick={onToggleLanguage}
          className="mx-auto flex items-center gap-3 rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-4 py-2 transition hover:bg-cyan-300/20"
          title={ui.languageHint}
        >
          <h1
            className="text-center text-3xl uppercase tracking-[0.08em] text-cyan-100 sm:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            VersusVerseVault
          </h1>
          <span className="rounded border border-cyan-200/55 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
            {ui.languageBadge}
          </span>
        </button>
      </div>
    </header>
  )
}
