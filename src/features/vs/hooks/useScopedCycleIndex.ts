import { useCallback, useState } from 'react'

const globalIndexStore: Record<string, number> = {}

export function useScopedCycleIndex(scopeKey: string, itemCount: number) {
  const [, setLocalTick] = useState(0)

  const activeIndex = itemCount > 0 ? (globalIndexStore[scopeKey] ?? 0) % itemCount : 0

  const goToNext = useCallback(() => {
    if (itemCount <= 1) return
    const nextValue = ((globalIndexStore[scopeKey] ?? 0) + 1) % itemCount
    globalIndexStore[scopeKey] = nextValue
    setLocalTick((t) => t + 1)
  }, [itemCount, scopeKey])

  return [activeIndex, goToNext] as const
}
