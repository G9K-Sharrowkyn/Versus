import { useState } from 'react'

export function useScopedCycleIndex(scopeKey: string, itemCount: number) {
  const [indexByScope, setIndexByScope] = useState<Record<string, number>>({})

  const activeIndex = itemCount > 0 ? (indexByScope[scopeKey] ?? 0) % itemCount : 0

  const goToNext = () => {
    if (itemCount <= 1) return
    setIndexByScope((current) => ({
      ...current,
      [scopeKey]: ((current[scopeKey] ?? 0) + 1) % itemCount,
    }))
  }

  return [activeIndex, goToNext] as const
}
