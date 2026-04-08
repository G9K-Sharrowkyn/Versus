import type { LucideIcon } from 'lucide-react'

export type Category = {
  id: string
  label: string
}

export type FighterFact = {
  title: string
  text: string
}

export type FighterProfileData = {
  powers: string[]
  tools: string[]
  weaknesses: string[]
}

export type Fighter = {
  name: string
  subtitle: string
  version: string
  imageUrl: string
  color: string
  stats: Record<string, number>
}

export type Language = 'pl' | 'en'
export type FightStatId =
  | 'strength'
  | 'speed'
  | 'durability'
  | 'battleIq'
  | 'hax'
  | 'stamina'
  | 'style'
  | 'experience'
  | 'skills'

export type TemplateId =
  | 'character-profile'
  | 'crucial-feats'
  | 'fight-analytics'
  | 'parameter-comparison'
  | 'tactical-board'
  | 'victory-archive'
  | 'character-dossier-a'
  | 'character-dossier-b'
  | 'final-summary'
  | 'battle-dynamics'
  | 'x-factor'
  | 'interpretation'
  | 'fight-simulation'
  | 'stat-trap'
  | 'direct-verdict'
  | 'verdict-matrix'
  | 'fight-card'
  | 'methodology'

export type TemplatePreset = {
  id: TemplateId
  name: string
  description: string
  title: string
  subtitle: string
}

export type ScoreRow = {
  id: string
  label: string
  a: number
  b: number
  delta: number
  winner: 'a' | 'b' | 'draw'
}

export type ParsedStat = {
  label: string
  value: number
}

export type FightLocaleJsonTemplateValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]

export type FightLocaleJsonTemplateBlock = Record<string, FightLocaleJsonTemplateValue>
export type FightLocaleJsonTemplateDataBlock = Record<string, unknown>

export type FightLocaleJsonFighter = {
  name: string
  version: string
  stats: Partial<Record<FightStatId, number | null>>
  dossier: {
    style: string
    advantage: string
    mentality: string
    quote: string
  }
  victories: string[]
  profile: {
    powers: string[]
    tools: string[]
    weaknesses: string[]
  }
  crucialFeats: string[]
}

export type FightLocaleJsonV1 = {
  schemaVersion: 1
  locale: Language
  fighterA: FightLocaleJsonFighter
  fighterB: FightLocaleJsonFighter
  templateOrder: TemplateId[]
  templateData?: Partial<Record<TemplateId, FightLocaleJsonTemplateDataBlock>>
  templates: Partial<Record<TemplateId, FightLocaleJsonTemplateBlock>>
}

export type FightScansJsonV1 = {
  schemaVersion: 1
  portraits: {
    a: string
    b: string
  }
  templates: Partial<Record<TemplateId, FightLocaleJsonTemplateBlock>>
}

// Lossy runtime payload used only by the viewer layer.
// Canonical fight files must always be written from FightLocaleJsonV1/FightScansJsonV1,
// never reconstructed from this parsed shape.
export type ParsedVsImport = {
  fighterAName: string
  fighterBName: string
  fighterAVersion: string
  fighterBVersion: string
  statsA: ParsedStat[]
  statsB: ParsedStat[]
  factsA: FighterFact[]
  factsB: FighterFact[]
  profileA: FighterProfileData
  profileB: FighterProfileData
  powersA: FighterFact[]
  powersB: FighterFact[]
  crucialFeatsA: string[]
  crucialFeatsB: string[]
  winsA: string[]
  winsB: string[]
  templateOrder: TemplateId[]
  templateBlocks: Record<string, string[]>
}

export type FightSource = 'manual' | 'folder'
export type FightVariantLocale = Language | 'unknown'

export type FightRecord = {
  id: string
  name: string
  fileName: string
  createdAt: number
  source: FightSource
  matchupKey: string
  variantLocale: FightVariantLocale
  variantLabel: string
  folderKey?: string
  payload: ParsedVsImport
  portraitADataUrl: string
  portraitBDataUrl: string
  portraitAAdjust: PortraitAdjust
  portraitBAdjust: PortraitAdjust
  slideImageAdjustments: Record<string, PortraitAdjust>
}

export type FightMetaRecord = {
  key: string
  value: string
}

export type TemplatePreviewProps = {
  activeTemplateId: TemplateId
  language: Language
  rows: ScoreRow[]
  fighterA: Fighter
  fighterB: Fighter
  portraitAAdjust: PortraitAdjust
  portraitBAdjust: PortraitAdjust
  averageA: number
  averageB: number
  title: string
  subtitle: string
  factsA: FighterFact[]
  factsB: FighterFact[]
  profileA: FighterProfileData
  profileB: FighterProfileData
  powersA: FighterFact[]
  powersB: FighterFact[]
  crucialFeatsA: string[]
  crucialFeatsB: string[]
  winsA: string[]
  winsB: string[]
  fightLabel: string
  templateBlocks: Record<string, string[]>
  activeFightId: string | null
  activeFightFolderKey?: string
  slideImageAdjustments: Record<string, PortraitAdjust>
  onSlideImageAdjustChange: (imageKey: string, adjust: PortraitAdjust) => void
  onSlideImageAdjustCommit: (imageKey: string, adjust: PortraitAdjust) => void
  onToggleLanguage?: () => void
}

export type IconType = LucideIcon
export type LightningPoint = { x: number; y: number }
export type FightScenarioId =
  | 'orbit-harass'
  | 'hit-and-run'
  | 'rush-ko'
  | 'one-shot'
  | 'clash-lock'
  | 'kite-zone'
  | 'teleport-burst'
  | 'feint-counter'
  | 'grapple-pin'
  | 'corner-trap'
  | 'regen-attrition'
  | 'berserk-overextend'
  | 'solar-flare'
  | 'cosmic-salvo'
  | 'void-clash'
  | 'celestial-purge'
  | 'shadow-surge'
  | 'infinite-attrition'
  | 'blade-entrapment'
  | 'ragnarok-unleashed'
  | 'abyss-corruption'
  | 'nova-cleansing'
  | 'void-absorption'
  | 'all-black-execution'
  | 'trade-chaos'
export type FightScenarioLead = 'a' | 'b'

export type SearchMorphHandoff = { x: number; y: number; width: number; height: number }
export type PortraitAdjust = { x: number; y: number; scale: number }
export type PortraitEditorState =
  | {
      mode: 'draft'
      side: 'a' | 'b'
      file: File
      previewUrl: string
      adjust: PortraitAdjust
    }
  | {
      mode: 'fight'
      fightId: string
      side: 'a' | 'b'
      previewUrl: string
      adjust: PortraitAdjust
    }
export type PointerRelaySource = 'search' | 'intro'
export type PointerRelayEvent = 'move' | 'down' | 'up' | 'leave'
export type PointerRelayPayload = {
  type: 'vvv-pointer-relay'
  source: PointerRelaySource
  event: PointerRelayEvent
  x: number
  y: number
  down?: boolean
  timestamp: number
}
export type ReverseStage = 'idle' | 'explosion' | 'morph-reverse' | 'search-expand'

export type FolderFightScanRecord = {
  folderKey: string
  displayName: string
  matchName: string
  matchupKey: string
  variantLocale: FightVariantLocale
  variantLabel: string
  fileName: string
  payload: ParsedVsImport
  portraitAUrl: string
  portraitBUrl: string
  portraitAAdjust?: PortraitAdjust
  portraitBAdjust?: PortraitAdjust
  slideImageAdjustments?: Record<string, PortraitAdjust>
  sortIndex: number
  warnings?: string[]
}

export type FolderFightsScanResponse = {
  fights?: FolderFightScanRecord[]
  warnings?: string[]
}

export type FolderFightVisualPayload = {
  folderKey: string
  portraitAAdjust: PortraitAdjust
  portraitBAdjust: PortraitAdjust
  slideImageAdjustments: Record<string, PortraitAdjust>
}
