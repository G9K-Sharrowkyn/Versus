import { useEffect, useState } from 'react'

const MOBILE_TEMPLATE_QUERY = '(max-width: 900px) and (orientation: portrait), (max-width: 700px)'

const getInitialMatch = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia(MOBILE_TEMPLATE_QUERY).matches
}

export const useTemplateMobileLayout = () => {
  const [isTemplateMobileLayout, setIsTemplateMobileLayout] = useState<boolean>(() => getInitialMatch())

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const query = window.matchMedia(MOBILE_TEMPLATE_QUERY)
    const update = () => setIsTemplateMobileLayout(query.matches)
    update()

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', update)
      return () => query.removeEventListener('change', update)
    }

    query.addListener(update)
    return () => query.removeListener(update)
  }, [])

  return isTemplateMobileLayout
}
