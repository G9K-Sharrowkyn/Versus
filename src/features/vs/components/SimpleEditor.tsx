import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { ArrowLeft, Download, FileText, ImagePlus, Languages, RefreshCw } from 'lucide-react'
import type { TranslationDictionary } from '../../../i18n/types'

type SimpleEditorProps = {
  ui: TranslationDictionary['ui']
  onBack: () => void
}

type TranslationResponse = {
  ok?: boolean
  text?: string
  model?: string
  error?: string
}

const TEXT_FILE_ACCEPT = '.txt,.md,text/plain,text/markdown'

const prepareTextForTranslation = (value: string) =>
  value
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/?p[^>]*>/gi, '')
    .replace(/<\s*(strong|b)\b[^>]*>/gi, '**')
    .replace(/<\s*\/\s*(strong|b)\s*>/gi, '**')
    .replace(/\[\/?b\]/gi, '**')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

const getDownloadFileName = (sourceFileName: string) => {
  const baseName = sourceFileName
    .replace(/\.[^.]+$/, '')
    .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return `${baseName || 'translated-draft'} PL.md`
}

const downloadTextFile = (text: string, fileName: string) => {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function SimpleEditor({ ui, onBack }: SimpleEditorProps) {
  const [imageA, setImageA] = useState<string | null>(null)
  const [imageB, setImageB] = useState<string | null>(null)
  const [sourceText, setSourceText] = useState('')
  const [sourceFileName, setSourceFileName] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const fileInputARef = useRef<HTMLInputElement>(null)
  const fileInputBRef = useRef<HTMLInputElement>(null)
  const textFileInputRef = useRef<HTMLInputElement>(null)

  const preparedText = useMemo(() => prepareTextForTranslation(sourceText), [sourceText])

  const handleFileChange = (side: 'a' | 'b', event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (readerEvent) => {
      const result = readerEvent.target?.result as string
      if (side === 'a') setImageA(result)
      else setImageB(result)
    }
    reader.readAsDataURL(file)
  }

  const handleTextFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (readerEvent) => {
      const result = typeof readerEvent.target?.result === 'string' ? readerEvent.target.result : ''
      setSourceText(result)
      setSourceFileName(file.name)
      setTranslatedText('')
      setStatusMessage('')
      setErrorMessage('')
    }
    reader.readAsText(file)
  }

  const handleTranslateAndDownload = async () => {
    if (!preparedText) {
      setErrorMessage('Wklej albo wczytaj tekst do tlumaczenia.')
      setStatusMessage('')
      return
    }

    setIsTranslating(true)
    setErrorMessage('')
    setStatusMessage('Tlumaczenie...')

    try {
      const response = await fetch('/api/fights/translate-pl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: preparedText }),
      })
      const payload = await response.json().catch(() => null) as TranslationResponse | null

      if (!response.ok || !payload?.text) {
        throw new Error(payload?.error || 'Nie udalo sie przetlumaczyc tekstu.')
      }

      setTranslatedText(payload.text)
      downloadTextFile(payload.text, getDownloadFileName(sourceFileName))
      setStatusMessage(`Pobrano PL${payload.model ? ` (${payload.model})` : ''}.`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nie udalo sie przetlumaczyc tekstu.')
      setStatusMessage('')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleDownloadPrepared = () => {
    if (!preparedText) {
      setErrorMessage('Wklej albo wczytaj tekst do pobrania.')
      setStatusMessage('')
      return
    }
    downloadTextFile(preparedText, getDownloadFileName(sourceFileName).replace(' PL.md', ' EN.md'))
    setStatusMessage('Pobrano przygotowany tekst.')
    setErrorMessage('')
  }

  return (
    <section className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#05060a] text-slate-100">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-slate-950/92 px-4">
        <button type="button" className="button-soft h-10" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          {ui.backToLibrary}
        </button>
        <div className="min-w-0 text-right">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Simple</p>
          {statusMessage || errorMessage ? (
            <p className={errorMessage ? 'truncate text-xs text-rose-200' : 'truncate text-xs text-emerald-200'}>
              {errorMessage || statusMessage}
            </p>
          ) : null}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_470px]">
        <div className="relative flex min-h-0 items-center justify-center bg-[radial-gradient(circle_at_center,_#1a1b26_0%,_#05060a_100%)] p-4">
          <div className="vs-simple-editor-sparkly flex h-full w-full max-w-none items-center justify-between gap-6 overflow-hidden border-none px-6 py-6 shadow-none sm:px-14">
            <div className="flex h-[72vh] min-w-0 flex-1 flex-col items-center gap-5">
              <div
                onClick={() => fileInputARef.current?.click()}
                className="vs-simple-editor-frame h-full aspect-[9/16] cursor-pointer group"
              >
                {imageA ? (
                  <img src={imageA} alt="Fighter A" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-[1.2em] border border-white/5 bg-slate-900/30 p-8 text-center text-lg italic text-slate-500 transition-colors group-hover:bg-slate-900/50">
                    <ImagePlus className="mb-4 opacity-30" size={42} aria-hidden="true" />
                    Drop Fighter A
                  </div>
                )}
              </div>

              {!imageA ? (
                <button
                  type="button"
                  onClick={() => fileInputARef.current?.click()}
                  className="group relative overflow-hidden rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-8 py-3 text-xs font-bold uppercase tracking-[0.25em] text-cyan-400 transition-all hover:border-cyan-400 hover:bg-cyan-500/20"
                >
                  Upload Left
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                </button>
              ) : null}
            </div>

            <div className="vs-simple-editor-vs-divider shrink-0 scale-110 sm:scale-[1.45]">
              <div className="vs-simple-editor-vs-text">VS</div>
            </div>

            <div className="flex h-[72vh] min-w-0 flex-1 flex-col items-center gap-5">
              <div
                onClick={() => fileInputBRef.current?.click()}
                className="vs-simple-editor-frame h-full aspect-[9/16] cursor-pointer group"
              >
                {imageB ? (
                  <img src={imageB} alt="Fighter B" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-[1.2em] border border-white/5 bg-slate-900/30 p-8 text-center text-lg italic text-slate-500 transition-colors group-hover:bg-slate-900/50">
                    <ImagePlus className="mb-4 opacity-30" size={42} aria-hidden="true" />
                    Drop Fighter B
                  </div>
                )}
              </div>

              {!imageB ? (
                <button
                  type="button"
                  onClick={() => fileInputBRef.current?.click()}
                  className="group relative overflow-hidden rounded-xl border border-rose-500/30 bg-rose-500/10 px-8 py-3 text-xs font-bold uppercase tracking-[0.25em] text-rose-400 transition-all hover:border-rose-400 hover:bg-rose-500/20"
                >
                  Upload Right
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col border-l border-cyan-300/15 bg-slate-950/94 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="section-label">Tekst</p>
              <p className="truncate text-xs text-slate-400">{sourceFileName || 'draft.md'}</p>
            </div>
            <button type="button" className="button-soft h-10" onClick={() => textFileInputRef.current?.click()}>
              <FileText size={16} aria-hidden="true" />
              Plik
            </button>
          </div>

          <label className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400" htmlFor="simple-source-text">
            Input
          </label>
          <textarea
            id="simple-source-text"
            value={sourceText}
            onChange={(event) => {
              setSourceText(event.target.value)
              setTranslatedText('')
              setStatusMessage('')
              setErrorMessage('')
            }}
            placeholder="Wklej tekst EN..."
            className="mt-2 h-[24%] min-h-[120px] resize-none rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-3 font-mono text-xs leading-relaxed text-slate-100 outline-none transition focus:border-cyan-300/65"
          />

          <label className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400" htmlFor="simple-prepared-text">
            Gotowe pod tlumaczenie
          </label>
          <textarea
            id="simple-prepared-text"
            value={preparedText}
            readOnly
            className="mt-2 h-[22%] min-h-[110px] resize-none rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-3 font-mono text-xs leading-relaxed text-slate-200 outline-none"
          />

          <label className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400" htmlFor="simple-translated-text">
            PL
          </label>
          <textarea
            id="simple-translated-text"
            value={translatedText}
            readOnly
            className="mt-2 min-h-[130px] flex-1 resize-none rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-3 font-mono text-xs leading-relaxed text-slate-100 outline-none"
          />

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button type="button" className="button-soft h-11" onClick={handleDownloadPrepared}>
              <Download size={16} aria-hidden="true" />
              Pobierz EN
            </button>
            <button
              type="button"
              className="button-soft h-11 border-emerald-300/45 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
              disabled={isTranslating}
              onClick={handleTranslateAndDownload}
            >
              {isTranslating ? <RefreshCw className="animate-spin" size={16} aria-hidden="true" /> : <Languages size={16} aria-hidden="true" />}
              {isTranslating ? 'Tlumacze...' : 'Tlumacz PL'}
            </button>
          </div>
        </aside>
      </div>

      <input type="file" accept="image/*" ref={fileInputARef} onChange={(event) => handleFileChange('a', event)} className="hidden" />
      <input type="file" accept="image/*" ref={fileInputBRef} onChange={(event) => handleFileChange('b', event)} className="hidden" />
      <input type="file" accept={TEXT_FILE_ACCEPT} ref={textFileInputRef} onChange={handleTextFileChange} className="hidden" />

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  )
}
