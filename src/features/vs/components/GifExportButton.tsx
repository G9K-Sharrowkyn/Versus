import { Download, LoaderCircle } from 'lucide-react'
import { useRef, useState, type RefObject } from 'react'
import {
  exportElementAsGif,
  GIF_EXPORT_DURATION_MS,
  GIF_EXPORT_LONG_EDGE,
  type GifExportProgress,
} from '../export/gifExport'

type GifExportButtonProps = {
  targetRef: RefObject<HTMLElement | null>
  filename: string
  label?: string
  className?: string
}

const nextPaint = () => new Promise<void>((resolve) => {
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))
})

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
    .replace(/[<>:"/\\|?*]/g, '-')
    .split('')
    .map((character) => character.charCodeAt(0) < 32 ? '-' : character)
    .join('')
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

const setExportLayout = (target: HTMLElement, exporting: boolean) => {
  const workspace = target.closest<HTMLElement>('.vs-advanced__workspace')
  if (!workspace) return
  if (exporting) workspace.dataset.gifExporting = 'true'
  else delete workspace.dataset.gifExporting
}

export function GifExportButton({ targetRef, filename, label = 'GIF 4K', className = '' }: GifExportButtonProps) {
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState<GifExportProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const exportIdRef = useRef(0)

  const handleExport = async () => {
    const target = targetRef.current
    if (!target || exporting) return

    const exportId = exportIdRef.current + 1
    exportIdRef.current = exportId
    setExporting(true)
    setProgress(null)
    setError(null)
    target.dataset.gifExporting = 'true'
    setExportLayout(target, true)

    try {
      await nextPaint()
      const result = await exportElementAsGif(target, {
        durationMs: GIF_EXPORT_DURATION_MS,
        longEdge: GIF_EXPORT_LONG_EDGE,
        onProgress: (nextProgress) => {
          if (exportIdRef.current === exportId) setProgress(nextProgress)
        },
      })
      if (exportIdRef.current !== exportId) return
      downloadBlob(result.blob, `${filename}-4k.gif`)
    } catch (cause) {
      if (exportIdRef.current !== exportId) return
      const message = cause instanceof Error ? cause.message : 'Nie udało się wygenerować GIF-a.'
      setError(message)
    } finally {
      delete target.dataset.gifExporting
      setExportLayout(target, false)
      if (exportIdRef.current === exportId) setExporting(false)
    }
  }

  return (
    <div className={`vs-gif-export ${className}`}>
      <button
        type="button"
        className="vs-gif-export-button"
        onClick={() => void handleExport()}
        disabled={exporting}
        aria-busy={exporting}
        title="Eksportuje 2 sekundy widoku w rozdzielczości 4K przy 60 FPS"
      >
        {exporting ? <LoaderCircle size={16} className="vs-gif-export-spinner" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
        {exporting ? `GIF ${progress?.percent ?? 0}%` : label}
      </button>
      {error && <span className="vs-gif-export-error" role="alert">{error}</span>}
    </div>
  )
}
