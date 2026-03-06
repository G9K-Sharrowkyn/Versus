export const MOJIBAKE_PATTERN = /[\u00C3\u00C4\u00C5\u0139\u0102\u00C2\u00E2\uFFFD]/g
export const POLISH_CHAR_PATTERN = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g
export const INVALID_TEXT_ENCODING_ERROR = 'INVALID_TEXT_ENCODING'

const decodeBytes = (bytes: Uint8Array, label: string, fatal = false) => {
  try {
    return new TextDecoder(label, fatal ? { fatal: true } : undefined).decode(bytes)
  } catch {
    return ''
  }
}

export const scoreDecodedImportText = (value: string) => {
  const polish = (value.match(POLISH_CHAR_PATTERN) || []).length
  const bad = (value.match(MOJIBAKE_PATTERN) || []).length
  return polish * 2 - bad * 3
}

export const normalizeDecodedText = (value: string) => value.replace(/\r\n?/g, '\n').normalize('NFC')

export const decodeImportTextBytes = (bytes: Uint8Array) => {
  const candidates = [
    decodeBytes(bytes, 'utf-8', true),
    decodeBytes(bytes, 'windows-1250'),
    decodeBytes(bytes, 'utf-8'),
  ].filter(Boolean)

  if (!candidates.length) {
    throw new Error(INVALID_TEXT_ENCODING_ERROR)
  }

  let best = candidates[0] || ''
  let bestScore = scoreDecodedImportText(best)

  for (let index = 1; index < candidates.length; index += 1) {
    const candidate = candidates[index] || ''
    const score = scoreDecodedImportText(candidate)
    if (score > bestScore) {
      best = candidate
      bestScore = score
    }
  }

  const normalized = normalizeDecodedText(best)
  const badCount = (normalized.match(MOJIBAKE_PATTERN) || []).length
  if (badCount > 0 && bestScore < 0) {
    throw new Error(INVALID_TEXT_ENCODING_ERROR)
  }

  return normalized
}
