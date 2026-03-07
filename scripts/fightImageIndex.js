const cleanFightImageIndexValue = (value) =>
  String(value ?? '')
    .trim()
    .replace(/^`+|`+$/g, '')
    .trim()

const inferFightImageSectionFromFileName = (fileName) => {
  const match = cleanFightImageIndexValue(fileName).match(/_(\d+)_(\d+)_/)
  return match ? `${Number(match[1])}.${Number(match[2])}` : ''
}

const hasFightImageIndexDraftData = (draft) =>
  Boolean(draft.heading || draft.title || draft.section || draft.fileName || draft.originalUrl || draft.resolvedImageUrl)

const createEmptyFightImageIndexDraft = () => ({
  heading: '',
  title: '',
  section: '',
  fileName: '',
  originalUrl: '',
  resolvedImageUrl: '',
})

export const parseFightImageIndex = (raw) => {
  const entries = []
  const lines = String(raw ?? '').replace(/\r/g, '').split('\n')
  let draft = createEmptyFightImageIndexDraft()

  const flushDraft = () => {
    if (!hasFightImageIndexDraftData(draft)) return

    const fileName = cleanFightImageIndexValue(draft.fileName)
    const originalUrl = cleanFightImageIndexValue(draft.originalUrl)
    const resolvedImageUrl = cleanFightImageIndexValue(draft.resolvedImageUrl)
    const section = cleanFightImageIndexValue(draft.section) || inferFightImageSectionFromFileName(fileName)
    const title =
      cleanFightImageIndexValue(draft.title) ||
      cleanFightImageIndexValue(draft.heading).replace(/^([0-9]+(?:\.[0-9]+)?\s*-\s*)/, '')

    if (fileName || section || title || resolvedImageUrl || originalUrl) {
      entries.push({
        section,
        title,
        fileName,
        originalUrl,
        resolvedImageUrl,
        sourceUrl: resolvedImageUrl || originalUrl,
      })
    }

    draft = createEmptyFightImageIndexDraft()
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    let match = line.match(/^##\s+(.+)$/)
    if (match) {
      flushDraft()
      draft.heading = match[1]
      continue
    }

    match = line.match(/^\d+\.\s*\*\*(.+?)\*\*\s*$/)
    if (match) {
      flushDraft()
      draft.title = match[1]
      continue
    }

    match =
      line.match(/^[-*]\s*Section:\s*`?([0-9]+(?:\.[0-9]+)?)(?:[^`]*)`?\s*$/i) ||
      line.match(/^[-*]\s*section:\s*`?([0-9]+(?:\.[0-9]+)?)(?:[^`]*)`?\s*$/i)
    if (match) {
      if (draft.section || draft.fileName || draft.originalUrl || draft.resolvedImageUrl || draft.title) {
        flushDraft()
      }
      draft.section = match[1]
      continue
    }

    match =
      line.match(/^Title:\s*(.+?)\s*$/i) ||
      line.match(/^[-*]\s*title:\s*`?(.+?)`?\s*$/i)
    if (match) {
      draft.title = match[1]
      continue
    }

    match =
      line.match(/^[-*]\s*Local filename:\s*`?(.+?)`?\s*$/i) ||
      line.match(/^[-*]\s*Local file:\s*`?(.+?)`?\s*$/i) ||
      line.match(/^[-*]\s*local_filename:\s*`?(.+?)`?\s*$/i) ||
      line.match(/^Local filename:\s*`?(.+?)`?\s*$/i)
    if (match) {
      draft.fileName = match[1]
      continue
    }

    match =
      line.match(/^[-*]\s*Resolved image:\s*`?(.+?)`?\s*$/i) ||
      line.match(/^Resolved image:\s*`?(.+?)`?\s*$/i)
    if (match) {
      draft.resolvedImageUrl = match[1]
      continue
    }

    match =
      line.match(/^[-*]\s*Original link:\s*`?(.+?)`?\s*$/i) ||
      line.match(/^[-*]\s*original_link:\s*`?(.+?)`?\s*$/i) ||
      line.match(/^Original link:\s*`?(.+?)`?\s*$/i)
    if (match) {
      draft.originalUrl = match[1]
    }
  }

  flushDraft()
  return entries
}

export { cleanFightImageIndexValue, inferFightImageSectionFromFileName }
