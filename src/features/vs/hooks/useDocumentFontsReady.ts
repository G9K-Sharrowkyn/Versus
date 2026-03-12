import { useEffect, useState } from 'react'

export function useDocumentFontsReady() {
  const [fontsReady, setFontsReady] = useState(() => {
    if (typeof document === 'undefined') return true
    return !('fonts' in document) || document.fonts.status === 'loaded'
  })

  useEffect(() => {
    if (typeof document === 'undefined' || !('fonts' in document)) return

    let cancelled = false
    const fontSet = document.fonts

    if (fontSet.status === 'loaded') return
    void fontSet.ready
      .then(() => {
        if (!cancelled) setFontsReady(true)
      })
      .catch(() => {
        if (!cancelled) setFontsReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return fontsReady
}
