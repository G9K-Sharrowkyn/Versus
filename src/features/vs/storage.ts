import type {
  FightMetaRecord,
  FightRecord,
  FightSource,
  TemplateLayoutMode,
  FightVariantLocale,
  FolderFightScanRecord,
  FolderFightVisualPayload,
  FolderFightsScanResponse,
  ParsedStat,
  ParsedVsImport,
  FighterProfileData,
  FighterFact,
} from './types'
import { FIGHTS_DB_NAME, FIGHTS_DB_VERSION, FIGHTS_STORE_NAME, FOLDER_FIGHT_ID_PREFIX, META_ACTIVE_FIGHT_KEY, META_STORE_NAME } from './presets'
import { PORTRAIT_ADJUST_DEFAULT, buildMatchupKeyFromNames, clamp, enforceFileNameSideOrder, normalizePortraitAdjust, normalizeSlideImageAdjustments, normalizeToken, parseMatchupFromFileName, resolveFightVariantLabel, resolveFightVariantLocaleFromFileName, stripFileExtension, toMatchupDisplayNameFromFileName } from './helpers'
import { parseTemplateOrderTokens } from './importer'
import { resolveSharedFightVisualAdjustments } from './domain/fightVariants'

const isDefaultPortraitAdjust = (value: ReturnType<typeof normalizePortraitAdjust>) =>
  value.x === PORTRAIT_ADJUST_DEFAULT.x &&
  value.y === PORTRAIT_ADJUST_DEFAULT.y &&
  value.scale === PORTRAIT_ADJUST_DEFAULT.scale

const mergeFightVisualState = (persisted: FightRecord, scanned: FightRecord) => {
  const persistedPortraitA = normalizePortraitAdjust(persisted.portraitAAdjust)
  const persistedPortraitB = normalizePortraitAdjust(persisted.portraitBAdjust)
  const scannedPortraitA = normalizePortraitAdjust(scanned.portraitAAdjust)
  const scannedPortraitB = normalizePortraitAdjust(scanned.portraitBAdjust)

  return {
    portraitAAdjust: isDefaultPortraitAdjust(persistedPortraitA) ? scannedPortraitA : persistedPortraitA,
    portraitBAdjust: isDefaultPortraitAdjust(persistedPortraitB) ? scannedPortraitB : persistedPortraitB,
    slideImageAdjustments: {
      ...normalizeSlideImageAdjustments(scanned.slideImageAdjustments),
      ...normalizeSlideImageAdjustments(persisted.slideImageAdjustments),
    },
  }
}

export const normalizeFolderScanRecord = (value: unknown): FolderFightScanRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const raw = value as Record<string, unknown>
  const folderKey = typeof raw.folderKey === 'string' ? raw.folderKey.trim() : ''
  const displayName = typeof raw.displayName === 'string' ? raw.displayName.trim() : ''
  const matchName = typeof raw.matchName === 'string' ? raw.matchName.trim() : ''
  const matchupKeyRaw = typeof raw.matchupKey === 'string' ? raw.matchupKey.trim() : ''
  const variantLocaleRaw = typeof raw.variantLocale === 'string' ? normalizeToken(raw.variantLocale) : ''
  const variantLocale: FightVariantLocale =
    variantLocaleRaw === 'pl' ? 'pl' : variantLocaleRaw === 'en' || variantLocaleRaw === 'eng' ? 'en' : 'unknown'
  const variantLabel = typeof raw.variantLabel === 'string' ? raw.variantLabel.trim() : ''
  const fileName = typeof raw.fileName === 'string' ? raw.fileName.trim() : ''
  const payload = raw.payload as ParsedVsImport | undefined
  const portraitAUrl = typeof raw.portraitAUrl === 'string' ? raw.portraitAUrl.trim() : ''
  const portraitBUrl = typeof raw.portraitBUrl === 'string' ? raw.portraitBUrl.trim() : ''
  const portraitAAdjust = normalizePortraitAdjust(raw.portraitAAdjust)
  const portraitBAdjust = normalizePortraitAdjust(raw.portraitBAdjust)
  const slideImageAdjustments = normalizeSlideImageAdjustments(raw.slideImageAdjustments)
  const sortIndexRaw = typeof raw.sortIndex === 'number' ? raw.sortIndex : Number(raw.sortIndex)
  const sortIndex = Number.isFinite(sortIndexRaw) ? sortIndexRaw : Number.MAX_SAFE_INTEGER
  const warnings = Array.isArray(raw.warnings)
    ? raw.warnings.filter((item): item is string => typeof item === 'string')
    : []

  if (!folderKey || !fileName || !payload) return null

  const fallbackMatchup = parseMatchupFromFileName(fileName)
  const matchupKey =
    matchupKeyRaw ||
    (fallbackMatchup
      ? buildMatchupKeyFromNames(fallbackMatchup.leftName, fallbackMatchup.rightName)
      : normalizeToken(matchName || toMatchupDisplayNameFromFileName(fileName)))

  return {
    folderKey,
    displayName,
    matchName,
    matchupKey,
    variantLocale,
    variantLabel,
    fileName,
    payload,
    portraitAUrl,
    portraitBUrl,
    portraitAAdjust,
    portraitBAdjust,
    slideImageAdjustments,
    sortIndex,
    warnings,
  }
}

export const fetchFolderFightsFromApi = async (
  layoutMode: TemplateLayoutMode = 'normal',
): Promise<{ fights: FightRecord[]; warnings: string[] }> => {
  if (typeof window === 'undefined') return { fights: [], warnings: [] }

  const response = await fetch(`/api/fights/scan?layout=${layoutMode}`, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Folder scan failed (${response.status})`)
  }

  const payload = (await response.json()) as FolderFightsScanResponse
  const records = Array.isArray(payload.fights) ? payload.fights.map(normalizeFolderScanRecord).filter(Boolean) : []
  const warnings = Array.isArray(payload.warnings)
    ? payload.warnings.filter((item): item is string => typeof item === 'string')
    : []
  const fights: FightRecord[] = []

  records.forEach((record, index) => {
    if (!record) return
    if (record.warnings?.length) {
      warnings.push(...record.warnings.map((item) => `[${record.displayName || record.folderKey}] ${item}`))
    }
    const normalizedPayload = normalizePersistedImport(record.payload)
    if (!normalizedPayload) {
      warnings.push(`[${record.displayName || record.folderKey}] Invalid JSON payload.`)
      return
    }

    const payloadOrdered = enforceFileNameSideOrder(normalizedPayload, record.fileName)
    const fileMatchup = parseMatchupFromFileName(record.fileName)
    const fallbackMatchName = fileMatchup
      ? `${fileMatchup.leftName} vs ${fileMatchup.rightName}`
      : toMatchupDisplayNameFromFileName(record.fileName)
    const name =
      record.matchName ||
      fallbackMatchName ||
      stripFileExtension(record.fileName) ||
      record.displayName ||
      `${payloadOrdered.fighterAName} vs ${payloadOrdered.fighterBName}`
    const matchupKey =
      record.matchupKey ||
      buildMatchupKeyFromNames(payloadOrdered.fighterAName, payloadOrdered.fighterBName)
    const variantLocale =
      record.variantLocale !== 'unknown'
        ? record.variantLocale
        : resolveFightVariantLocaleFromFileName(record.fileName)
    const variantLabel =
      record.variantLabel || resolveFightVariantLabel(record.fileName, variantLocale)

    fights.push({
      id: `${FOLDER_FIGHT_ID_PREFIX}${record.folderKey}::${normalizeToken(record.fileName)}`,
      name,
      fileName: record.fileName,
      createdAt: Date.now() - index,
      source: 'folder',
      matchupKey,
      variantLocale,
      variantLabel,
      folderKey: record.folderKey,
      payload: payloadOrdered,
      portraitADataUrl: record.portraitAUrl,
      portraitBDataUrl: record.portraitBUrl,
      portraitAAdjust: normalizePortraitAdjust(record.portraitAAdjust),
      portraitBAdjust: normalizePortraitAdjust(record.portraitBAdjust),
      slideImageAdjustments: normalizeSlideImageAdjustments(record.slideImageAdjustments),
    })
  })

  return { fights, warnings }
}

export const mergeScannedFolderFights = (existingFights: FightRecord[], scannedFolderFights: FightRecord[]) => {
  const persistedById = new Map(existingFights.map((fight) => [fight.id, fight]))
  const persistedFolderBySignature = new Map(
    existingFights
      .filter((fight) => fight.source === 'folder' && fight.folderKey)
      .map((fight) => [`${fight.folderKey}::${normalizeToken(fight.fileName)}`, fight]),
  )
  const persistedFolderByMatchup = new Map(
    existingFights
      .filter((fight) => fight.source === 'folder' && fight.folderKey)
      .map((fight) => [`${fight.folderKey}::${fight.matchupKey}`, fight]),
  )

  const mergedFolderFights = scannedFolderFights.map((fight) => {
    const persisted =
      persistedById.get(fight.id) ||
      persistedFolderBySignature.get(`${fight.folderKey || ''}::${normalizeToken(fight.fileName)}`) ||
      persistedFolderByMatchup.get(`${fight.folderKey || ''}::${fight.matchupKey}`)
    if (!persisted) return fight
    const mergedVisuals = mergeFightVisualState(persisted, fight)
    return {
      ...fight,
      createdAt: persisted.createdAt,
      portraitAAdjust: mergedVisuals.portraitAAdjust,
      portraitBAdjust: mergedVisuals.portraitBAdjust,
      slideImageAdjustments: mergedVisuals.slideImageAdjustments,
    }
  })

  const manualFights = existingFights.filter((fight) => fight.source !== 'folder')
  return [...mergedFolderFights, ...manualFights]
}

export const sanitizePreferredVariantPrefs = (
  fights: FightRecord[],
  prefs: Record<string, string>,
): Record<string, string> => {
  const existingById = new Set(fights.map((fight) => fight.id))
  const existingMatchups = new Set(fights.map((fight) => fight.matchupKey))
  const sanitized: Record<string, string> = {}
  Object.entries(prefs).forEach(([matchupKey, fightId]) => {
    if (!existingMatchups.has(matchupKey)) return
    if (!existingById.has(fightId)) return
    sanitized[matchupKey] = fightId
  })
  return sanitized
}

export const buildFightRefreshSignature = (fight: FightRecord | null) =>
  fight
    ? JSON.stringify({
        id: fight.id,
        name: fight.name,
        fileName: fight.fileName,
        source: fight.source,
        folderKey: fight.folderKey || '',
        matchupKey: fight.matchupKey,
        variantLocale: fight.variantLocale,
        variantLabel: fight.variantLabel,
        portraitADataUrl: fight.portraitADataUrl,
        portraitBDataUrl: fight.portraitBDataUrl,
        payload: fight.payload,
        portraitAAdjust: normalizePortraitAdjust(fight.portraitAAdjust),
        portraitBAdjust: normalizePortraitAdjust(fight.portraitBAdjust),
        slideImageAdjustments: normalizeSlideImageAdjustments(fight.slideImageAdjustments),
      })
    : ''

export const collectPersistableFolderFightVisuals = (fights: FightRecord[]): FolderFightVisualPayload[] => {
  const folderKeys = new Set<string>()
  const payloads: FolderFightVisualPayload[] = []

  fights.forEach((fight) => {
    const folderKey = fight.folderKey?.trim()
    if (!folderKey || folderKeys.has(folderKey) || fight.source !== 'folder') return
    folderKeys.add(folderKey)

    const shared = resolveSharedFightVisualAdjustments(fights, fight)
    payloads.push({
      folderKey,
      portraitAAdjust: shared.portraitAAdjust,
      portraitBAdjust: shared.portraitBAdjust,
      slideImageAdjustments: shared.slideImageAdjustments,
    })
  })

  payloads.sort((left, right) => left.folderKey.localeCompare(right.folderKey, undefined, { numeric: true, sensitivity: 'base' }))
  return payloads
}

export const saveFolderFightVisualsToApi = async (payloads: FolderFightVisualPayload[]) => {
  if (typeof window === 'undefined' || !payloads.length) return

  const response = await fetch('/api/fights/visuals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ folders: payloads }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Folder visuals save failed (${response.status})`)
  }
}

export const toStringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

export const toFactArray = (value: unknown): FighterFact[] =>
  Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== 'object') return null
          const title = typeof (item as { title?: unknown }).title === 'string' ? (item as { title: string }).title : ''
          const text = typeof (item as { text?: unknown }).text === 'string' ? (item as { text: string }).text : ''
          if (!title && !text) return null
          return { title: title || 'Fact', text: text || '-' }
        })
        .filter((item): item is FighterFact => Boolean(item))
    : []

const EMPTY_PROFILE_DATA: FighterProfileData = {
  powers: [],
  tools: [],
  weaknesses: [],
}

const PROFILE_SECTION_KEY_BY_TITLE: Record<string, keyof FighterProfileData> = {
  powers: 'powers',
  moce: 'powers',
  tools: 'tools',
  'narzędzia': 'tools',
  weaknesses: 'weaknesses',
  'słabości': 'weaknesses',
}

const normalizeProfileSectionTitle = (value: string) =>
  value.trim().replace(/:\s*$/, '').toLocaleLowerCase('pl-PL')

const buildProfileDataFromLegacyFacts = (facts: FighterFact[]): FighterProfileData => {
  const profile: FighterProfileData = {
    powers: [],
    tools: [],
    weaknesses: [],
  }

  facts.forEach((fact) => {
    const sectionKey = PROFILE_SECTION_KEY_BY_TITLE[normalizeProfileSectionTitle(fact.title)]
    if (!sectionKey || !fact.text.trim()) return
    profile[sectionKey].push(fact.text.trim())
  })

  return profile
}

const toProfileData = (value: unknown, legacyFacts: FighterFact[]): FighterProfileData => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const raw = value as Record<string, unknown>
    const profile: FighterProfileData = {
      powers: toStringArray(raw.powers),
      tools: toStringArray(raw.tools),
      weaknesses: toStringArray(raw.weaknesses),
    }
    if (profile.powers.length || profile.tools.length || profile.weaknesses.length) {
      return profile
    }
  }

  if (legacyFacts.length) {
    return buildProfileDataFromLegacyFacts(legacyFacts)
  }

  return { ...EMPTY_PROFILE_DATA }
}

export const toParsedStatArray = (value: unknown): ParsedStat[] =>
  Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== 'object') return null
          const label = typeof (item as { label?: unknown }).label === 'string' ? (item as { label: string }).label : ''
          const rawValue = (item as { value?: unknown }).value
          const numeric = typeof rawValue === 'number' ? rawValue : Number(rawValue)
          if (!label || !Number.isFinite(numeric)) return null
          return { label, value: clamp(numeric) }
        })
        .filter((item): item is ParsedStat => Boolean(item))
    : []

export const toTemplateBlocks = (value: unknown): Record<string, string[]> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const output: Record<string, string[]> = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!key.trim()) continue
    output[key] = toStringArray(entry)
  }
  return output
}

export const normalizePersistedImport = (value: unknown): ParsedVsImport | null => {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const fighterAName = typeof raw.fighterAName === 'string' ? raw.fighterAName : ''
  const fighterBName = typeof raw.fighterBName === 'string' ? raw.fighterBName : ''
  const fighterAVersion = typeof raw.fighterAVersion === 'string' ? raw.fighterAVersion : ''
  const fighterBVersion = typeof raw.fighterBVersion === 'string' ? raw.fighterBVersion : ''
  const statsA = toParsedStatArray(raw.statsA)
  const statsB = toParsedStatArray(raw.statsB)
  const factsA = toFactArray(raw.factsA)
  const factsB = toFactArray(raw.factsB)
  const powersA = toFactArray(raw.powersA)
  const powersB = toFactArray(raw.powersB)
  const profileA = toProfileData(raw.profileA, powersA)
  const profileB = toProfileData(raw.profileB, powersB)
  const crucialFeatsA = toStringArray(raw.crucialFeatsA ?? raw.rawFeatsA)
  const crucialFeatsB = toStringArray(raw.crucialFeatsB ?? raw.rawFeatsB)
  const winsA = toStringArray(raw.winsA)
  const winsB = toStringArray(raw.winsB)
  const templateOrder = parseTemplateOrderTokens(toStringArray(raw.templateOrder))
  const templateBlocks = toTemplateBlocks(raw.templateBlocks)

  if (!fighterAName || !fighterBName) return null

  return {
    fighterAName,
    fighterBName,
    fighterAVersion,
    fighterBVersion,
    statsA,
    statsB,
    factsA,
    factsB,
    profileA,
    profileB,
    powersA,
    powersB,
    crucialFeatsA,
    crucialFeatsB,
    winsA,
    winsB,
    templateOrder,
    templateBlocks,
  }
}

export const normalizePersistedFight = (value: unknown, index: number): FightRecord | null => {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const payload = normalizePersistedImport(raw.payload)
  if (!payload) return null

  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id
      : `fight-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name : `${payload.fighterAName} vs ${payload.fighterBName}`
  const fileName = typeof raw.fileName === 'string' && raw.fileName.trim() ? raw.fileName : `${name}.json`
  const createdAtRaw = typeof raw.createdAt === 'number' ? raw.createdAt : Number(raw.createdAt)
  const createdAt = Number.isFinite(createdAtRaw) ? createdAtRaw : Date.now()
  const portraitADataUrl = typeof raw.portraitADataUrl === 'string' ? raw.portraitADataUrl : ''
  const portraitBDataUrl = typeof raw.portraitBDataUrl === 'string' ? raw.portraitBDataUrl : ''
  const portraitAAdjust = normalizePortraitAdjust(raw.portraitAAdjust)
  const portraitBAdjust = normalizePortraitAdjust(raw.portraitBAdjust)
  const slideImageAdjustments = normalizeSlideImageAdjustments(raw.slideImageAdjustments)
  const source: FightSource = raw.source === 'folder' ? 'folder' : 'manual'
  const rawFolderKey = typeof raw.folderKey === 'string' && raw.folderKey.trim() ? raw.folderKey.trim() : ''
  const folderKey =
    source === 'folder'
      ? rawFolderKey ||
        (id.startsWith(FOLDER_FIGHT_ID_PREFIX)
          ? id
              .slice(FOLDER_FIGHT_ID_PREFIX.length)
              .split('::')
              .filter(Boolean)[0] || ''
          : '')
      : ''
  const rawMatchupKey = typeof raw.matchupKey === 'string' ? raw.matchupKey.trim() : ''
  const inferredMatchup = parseMatchupFromFileName(fileName) || {
    leftName: payload.fighterAName,
    rightName: payload.fighterBName,
  }
  const matchupKey =
    rawMatchupKey || buildMatchupKeyFromNames(inferredMatchup.leftName || payload.fighterAName, inferredMatchup.rightName || payload.fighterBName)
  const variantLocaleRaw = typeof raw.variantLocale === 'string' ? normalizeToken(raw.variantLocale) : ''
  const variantLocale: FightVariantLocale =
    variantLocaleRaw === 'pl'
      ? 'pl'
      : variantLocaleRaw === 'en' || variantLocaleRaw === 'eng'
        ? 'en'
        : resolveFightVariantLocaleFromFileName(fileName)
  const variantLabelRaw = typeof raw.variantLabel === 'string' ? raw.variantLabel.trim() : ''
  const variantLabel = variantLabelRaw || resolveFightVariantLabel(fileName, variantLocale)

  return {
    id,
    name,
    fileName,
    createdAt,
    source,
    matchupKey,
    variantLocale,
    variantLabel,
    folderKey: source === 'folder' ? folderKey || undefined : undefined,
    payload,
    portraitADataUrl,
    portraitBDataUrl,
    portraitAAdjust,
    portraitBAdjust,
    slideImageAdjustments,
  }
}

export const openFightDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available'))
      return
    }

    const request = window.indexedDB.open(FIGHTS_DB_NAME, FIGHTS_DB_VERSION)
    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open IndexedDB'))
    }
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(FIGHTS_STORE_NAME)) {
        db.createObjectStore(FIGHTS_STORE_NAME, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(META_STORE_NAME)) {
        db.createObjectStore(META_STORE_NAME, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => {
      resolve(request.result)
    }
  })

export const waitForTransaction = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'))
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
  })

export const idbReadAllFights = async (): Promise<FightRecord[]> => {
  const db = await openFightDatabase()
  try {
    const transaction = db.transaction(FIGHTS_STORE_NAME, 'readonly')
    const store = transaction.objectStore(FIGHTS_STORE_NAME)
    const request = store.getAll()
    const payload = await new Promise<unknown[]>((resolve, reject) => {
      request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : [])
      request.onerror = () => reject(request.error ?? new Error('Failed to read fights from IndexedDB'))
    })
    await waitForTransaction(transaction)
    return payload
      .map((item, index) => normalizePersistedFight(item, index))
      .filter((item): item is FightRecord => Boolean(item))
      .sort((a, b) => b.createdAt - a.createdAt)
  } finally {
    db.close()
  }
}

export const idbSaveAllFights = async (fights: FightRecord[]) => {
  const db = await openFightDatabase()
  try {
    const transaction = db.transaction(FIGHTS_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(FIGHTS_STORE_NAME)
    store.clear()
    for (const fight of fights) {
      store.put(fight)
    }
    await waitForTransaction(transaction)
  } finally {
    db.close()
  }
}

export const idbGetActiveFightId = async (): Promise<string | null> => {
  const db = await openFightDatabase()
  try {
    const transaction = db.transaction(META_STORE_NAME, 'readonly')
    const store = transaction.objectStore(META_STORE_NAME)
    const request = store.get(META_ACTIVE_FIGHT_KEY)
    const payload = await new Promise<unknown>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Failed to read active fight id from IndexedDB'))
    })
    await waitForTransaction(transaction)
    if (payload && typeof payload === 'object') {
      const value = (payload as Partial<FightMetaRecord>).value
      return typeof value === 'string' && value.trim() ? value : null
    }
    return typeof payload === 'string' && payload.trim() ? payload : null
  } finally {
    db.close()
  }
}

export const idbSetActiveFightId = async (fightId: string | null) => {
  const db = await openFightDatabase()
  try {
    const transaction = db.transaction(META_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(META_STORE_NAME)
    if (fightId && fightId.trim()) {
      const payload: FightMetaRecord = { key: META_ACTIVE_FIGHT_KEY, value: fightId }
      store.put(payload)
    } else {
      store.delete(META_ACTIVE_FIGHT_KEY)
    }
    await waitForTransaction(transaction)
  } finally {
    db.close()
  }
}

export const idbGetMetaString = async (key: string): Promise<string | null> => {
  const db = await openFightDatabase()
  try {
    const transaction = db.transaction(META_STORE_NAME, 'readonly')
    const store = transaction.objectStore(META_STORE_NAME)
    const request = store.get(key)
    const payload = await new Promise<unknown>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error(`Failed to read meta key "${key}" from IndexedDB`))
    })
    await waitForTransaction(transaction)
    if (payload && typeof payload === 'object') {
      const value = (payload as Partial<FightMetaRecord>).value
      return typeof value === 'string' && value.trim() ? value : null
    }
    return typeof payload === 'string' && payload.trim() ? payload : null
  } finally {
    db.close()
  }
}

export const idbSetMetaString = async (key: string, value: string | null) => {
  const db = await openFightDatabase()
  try {
    const transaction = db.transaction(META_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(META_STORE_NAME)
    if (value && value.trim()) {
      const payload: FightMetaRecord = { key, value }
      store.put(payload)
    } else {
      store.delete(key)
    }
    await waitForTransaction(transaction)
  } finally {
    db.close()
  }
}

export const normalizeVariantPrefsMap = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const next: Record<string, string> = {}
  Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
    const matchupKey = key.trim()
    const fightId = typeof entry === 'string' ? entry.trim() : ''
    if (!matchupKey || !fightId) return
    next[matchupKey] = fightId
  })
  return next
}
