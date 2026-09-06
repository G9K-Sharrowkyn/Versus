import { useState, useRef } from 'react'
import { StudioMenuButton } from './StartScreen'
import { GifExportButton } from './GifExportButton'
import { WebmExportButton } from './WebmExportButton'
import type { TranslationDictionary } from '../../../i18n/types'

type SimpleEditorProps = {
  ui: TranslationDictionary['ui']
  onBack: () => void
  onOpenAdvanced: () => void
}

export function SimpleEditor({ ui, onBack, onOpenAdvanced }: SimpleEditorProps) {
  const [imageA, setImageA] = useState<string | null>(null)
  const [imageB, setImageB] = useState<string | null>(null)
  const [nameA, setNameA] = useState<string | null>(null)
  const [nameB, setNameB] = useState<string | null>(null)
  const fileInputARef = useRef<HTMLInputElement>(null)
  const fileInputBRef = useRef<HTMLInputElement>(null)
  const exportRootRef = useRef<HTMLElement>(null)

  const handleFileChange = (side: 'a' | 'b', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, '')

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (side === 'a') {
        setImageA(result)
        setNameA(fileNameWithoutExtension)
      } else {
        setImageB(result)
        setNameB(fileNameWithoutExtension)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <section ref={exportRootRef} data-gif-export-root="simple" className="fixed inset-0 z-[9999] bg-[#05060a] overflow-hidden select-none">
      <StudioMenuButton language={ui.languageBadge.toLowerCase() === 'pl' ? 'pl' : 'en'} onClick={onBack} />
      <button type="button" onClick={onOpenAdvanced} className="vs-simple-editor-advanced fixed right-4 top-4 z-[10001] rounded-lg border border-amber-300/40 bg-slate-950/90 px-4 py-2 text-sm text-amber-100 hover:bg-slate-800">Advanced</button>
      <GifExportButton targetRef={exportRootRef} filename="versus-verse-simple" className="fixed right-4 top-[4.25rem] z-[10001]" />
      <WebmExportButton targetRef={exportRootRef} filename="versus-verse-simple" className="fixed right-4 top-[7.5rem] z-[10001]" />
      {/* Layer 1: Deep Space Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1b26_0%,_#05060a_100%)]" />

      {/* Layer 2: Animated Starfield (Banger) */}
      <div className="absolute inset-0 vs-simple-editor-sparkly pointer-events-none z-0" />

      {/* Layer 3: Content UI */}
      <div data-gif-export-foreground="simple" className="relative z-10 w-full h-full flex items-center justify-between gap-8 px-12 sm:px-32 py-8 overflow-hidden">

        {/* Fighter A */}
        <div className="flex flex-col items-center gap-6 h-[85vh] flex-1">
          <div
            onClick={() => fileInputARef.current?.click()}
            className="vs-simple-editor-frame flex-1 min-h-0 aspect-[9/16] cursor-pointer group"
          >
            {imageA ? (
              <img src={imageA} alt="Fighter A" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/30 rounded-[1.2em] border border-white/5 italic text-slate-500 text-lg p-8 text-center group-hover:bg-slate-900/50 transition-colors">
                <span className="text-4xl mb-4 opacity-20">👤</span>
                Drop Fighter A
              </div>
            )}
          </div>

          {!imageA ? (
            <button
              onClick={() => fileInputARef.current?.click()}
              className="vs-simple-editor-upload group relative px-8 py-3 overflow-hidden rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-[0.25em] transition-all hover:bg-cyan-500/20 hover:border-cyan-400"
            >
              Upload Left
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            </button>
          ) : (
            <div className="px-4 py-2 text-cyan-50 text-2xl sm:text-3xl font-black uppercase tracking-[0.1em] text-center drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] truncate max-w-full">
              {nameA}
            </div>
          )}
        </div>

        {/* VS Divider */}
        <div className="vs-simple-editor-vs-divider shrink-0 scale-125 sm:scale-[1.8]">
          <div className="vs-simple-editor-vs-text">VS</div>
        </div>

        {/* Fighter B */}
        <div className="flex flex-col items-center gap-6 h-[85vh] flex-1">
          <div
            onClick={() => fileInputBRef.current?.click()}
            className="vs-simple-editor-frame flex-1 min-h-0 aspect-[9/16] cursor-pointer group"
          >
            {imageB ? (
              <img src={imageB} alt="Fighter B" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/30 rounded-[1.2em] border border-white/5 italic text-slate-500 text-lg p-8 text-center group-hover:bg-slate-900/50 transition-colors">
                <span className="text-4xl mb-4 opacity-20">👤</span>
                Drop Fighter B
              </div>
            )}
          </div>

          {!imageB ? (
            <button
              onClick={() => fileInputBRef.current?.click()}
              className="vs-simple-editor-upload group relative px-8 py-3 overflow-hidden rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-[0.25em] transition-all hover:bg-rose-500/20 hover:border-rose-400"
            >
              Upload Right
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            </button>
          ) : (
            <div className="px-4 py-2 text-rose-50 text-2xl sm:text-3xl font-black uppercase tracking-[0.1em] text-center drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] truncate max-w-full">
              {nameB}
            </div>
          )}
        </div>

      </div>

      {/* Hidden Inputs */}
      <input type="file" accept="image/*" ref={fileInputARef} onChange={(e) => handleFileChange('a', e)} className="hidden" />
      <input type="file" accept="image/*" ref={fileInputBRef} onChange={(e) => handleFileChange('b', e)} className="hidden" />

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  )
}
