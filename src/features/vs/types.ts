import type { LucideIcon } from 'lucide-react'

export type Category = {
  id: string
  label: string
}

export type FighterFact = {
  title: string
  text: string
}

export type Fighter = {
  name: string
  subtitle: string
  imageUrl: string
  color: string
  stats: Record<string, number>
}

export type Frame = 'neon' | 'gold' | 'tech'
export type Theme = 'cosmic' | 'ember' | 'steel'
export type LayoutMode =
  | 'hudBars'
  | 'radarBrief'
  | 'tacticalBoard'
  | 'winnerCv'
  | 'characterCardA'
  | 'characterCardB'
  | 'blankTemplate'
  | 'methodology'
export type Language = 'pl' | 'en'
export type TemplateId =
  | 'powers-tools'
  | 'raw-feats'
  | 'hud-bars'
  | 'radar-brief'
  | 'tactical-board'
  | 'winner-cv'
  | 'character-card-a'
  | 'character-card-b'
  | 'summary'
  | 'battle-dynamics'
  | 'x-factor'
  | 'interpretation'
  | 'fight-simulation'
  | 'stat-trap'
  | 'verdict-matrix'
  | 'blank-template'
  | 'fight-title'
  | 'methodology'

export type TemplatePreset = {
  id: TemplateId
  name: string
  description: string
  layout: LayoutMode
  frame: Frame
  theme: Theme
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

export type ParsedVsImport = {
  fighterAName: string
  fighterBName: string
  statsA: ParsedStat[]
  statsB: ParsedStat[]
  factsA: FighterFact[]
  factsB: FighterFact[]
  powersA: FighterFact[]
  powersB: FighterFact[]
  rawFeatsA: string[]
  rawFeatsB: string[]
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
  powersA: FighterFact[]
  powersB: FighterFact[]
  rawFeatsA: string[]
  rawFeatsB: string[]
  winsA: string[]
  winsB: string[]
  fightLabel: string
  templateBlocks: Record<string, string[]>
  activeFightId: string | null
  activeFightFolderKey?: string
  slideImageAdjustments: Record<string, PortraitAdjust>
  onSlideImageAdjustChange: (imageKey: string, adjust: PortraitAdjust) => void
  onSlideImageAdjustCommit: (imageKey: string, adjust: PortraitAdjust) => void
}

export type IconType = LucideIcon
export type LightningPoint = { x: number; y: number }
export type FightScenarioId =
  | 'orbit-harass'
  | 'hit-and-run'
  | 'rush-ko'
  | 'clash-lock'
  | 'kite-zone'
  | 'teleport-burst'
  | 'feint-counter'
  | 'grapple-pin'
  | 'corner-trap'
  | 'regen-attrition'
  | 'berserk-overextend'
  | 'trade-chaos'
export type FightScenarioLead = 'a' | 'b'

export type ImportDropTarget = 'txt' | 'a' | 'b'
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
  txtFileName: string
  txtContent: string
  portraitAUrl: string
  portraitBUrl: string
  sortIndex: number
  warnings?: string[]
}

export type FolderFightsScanResponse = {
  fights?: FolderFightScanRecord[]
  warnings?: string[]
}
