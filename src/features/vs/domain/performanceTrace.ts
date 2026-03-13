const canTracePerformance =
  typeof window !== 'undefined' &&
  typeof performance !== 'undefined' &&
  Boolean(import.meta.env.DEV)

export const markPerformance = (name: string) => {
  if (!canTracePerformance) return
  performance.mark(name)
}

export const measurePerformance = (label: string, startMark: string, endMark: string) => {
  if (!canTracePerformance) return
  try {
    performance.measure(label, startMark, endMark)
    const entries = performance.getEntriesByName(label, 'measure')
    const latest = entries[entries.length - 1]
    if (latest) {
      console.info(`[vs-perf] ${label}: ${latest.duration.toFixed(1)}ms`)
    }
  } catch {
    return
  } finally {
    performance.clearMeasures(label)
    performance.clearMarks(startMark)
    performance.clearMarks(endMark)
  }
}
