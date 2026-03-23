import { useState, useEffect } from 'react'

export function useMarvin() {
  const [active, setActive] = useState(false)
  const [buffer, setBuffer] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const char = e.key.toLowerCase()
      if (char.length !== 1) return

      setBuffer(prev => {
        const next = (prev + char).slice(-6)
        if (next === 'marvin') {
          setActive(curr => !curr)
          console.log('--- MARVIN MODE TOGGLED ---', !active)
          return ''
        }
        return next
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [active])

  return active
}
