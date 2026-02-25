import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import clsx from 'clsx'
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { createPortal } from 'react-dom'
import {
  Award,
  BookOpen,
  Brain,
  Clock3,
  Crosshair,
  Dumbbell,
  Flame,
  Gauge,
  Sparkles,
  Swords,
  Trash2,
  WandSparkles,
  Zap,
} from 'lucide-react'

type Category = {
  id: string
  label: string
}

type FighterFact = {
  title: string
  text: string
}

type Fighter = {
  name: string
  subtitle: string
  imageUrl: string
  color: string
  stats: Record<string, number>
}

type Frame = 'neon' | 'gold' | 'tech'
type Theme = 'cosmic' | 'ember' | 'steel'
type LayoutMode =
  | 'hudBars'
  | 'radarBrief'
  | 'tacticalBoard'
  | 'winnerCv'
  | 'characterCardA'
  | 'characterCardB'
  | 'blankTemplate'
  | 'methodology'
type Language = 'pl' | 'en'
type TemplateId =
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
  | 'methodology'

type TemplatePreset = {
  id: TemplateId
  name: string
  description: string
  layout: LayoutMode
  frame: Frame
  theme: Theme
  title: string
  subtitle: string
}

type LocalizedTemplateCopy = {
  name: string
  description: string
  title: string
  subtitle: string
}

type ScoreRow = {
  id: string
  label: string
  a: number
  b: number
  delta: number
  winner: 'a' | 'b' | 'draw'
}

type ParsedStat = {
  label: string
  value: number
}

type ParsedVsImport = {
  fighterAName: string
  fighterBName: string
  statsA: ParsedStat[]
  statsB: ParsedStat[]
  factsA: FighterFact[]
  factsB: FighterFact[]
  winsA: string[]
  winsB: string[]
  templateOrder: TemplateId[]
  templateBlocks: Record<string, string[]>
}

type FightRecord = {
  id: string
  name: string
  fileName: string
  createdAt: number
  payload: ParsedVsImport
  portraitADataUrl: string
  portraitBDataUrl: string
}

type FightMetaRecord = {
  key: string
  value: string
}

type TemplatePreviewProps = {
  activeTemplateId: TemplateId
  language: Language
  rows: ScoreRow[]
  fighterA: Fighter
  fighterB: Fighter
  averageA: number
  averageB: number
  title: string
  subtitle: string
  factsA: FighterFact[]
  factsB: FighterFact[]
  winsA: string[]
  winsB: string[]
  templateBlocks: Record<string, string[]>
}

type IconType = typeof Sparkles
type LightningPoint = { x: number; y: number }
type FightScenarioId =
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
type FightScenarioLead = 'a' | 'b'

type ImportDropTarget = 'txt' | 'a' | 'b'
type SearchMorphHandoff = { x: number; y: number; width: number; height: number }
type PointerRelaySource = 'search' | 'intro'
type PointerRelayEvent = 'move' | 'down' | 'up' | 'leave'
type PointerRelayPayload = {
  type: 'vvv-pointer-relay'
  source: PointerRelaySource
  event: PointerRelayEvent
  x: number
  y: number
  down?: boolean
  timestamp: number
}

const FIGHTER_A_COLOR = '#3FC3CF'
const FIGHTER_B_COLOR = '#EF5D5D'

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'strength', label: 'Strength' },
  { id: 'speed', label: 'Speed' },
  { id: 'durability', label: 'Durability' },
  { id: 'battleIq', label: 'Combat IQ' },
  { id: 'hax', label: 'Hax' },
  { id: 'stamina', label: 'Stamina' },
  { id: 'style', label: 'Fighting Style' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Combat Skills' },
]

const DEFAULT_CATEGORIES_PL: Category[] = [
  { id: 'strength', label: 'SiĹ‚a' },
  { id: 'speed', label: 'SzybkoĹ›Ä‡' },
  { id: 'durability', label: 'WytrzymaĹ‚oĹ›Ä‡' },
  { id: 'battleIq', label: 'IQ Bojowe' },
  { id: 'hax', label: 'Hax' },
  { id: 'stamina', label: 'Kondycja' },
  { id: 'style', label: 'Styl Walki' },
  { id: 'experience', label: 'DoĹ›wiadczenie' },
  { id: 'skills', label: 'UmiejÄ™tnoĹ›ci' },
]

const defaultCategoriesFor = (language: Language): Category[] =>
  (language === 'pl' ? DEFAULT_CATEGORIES_PL : DEFAULT_CATEGORIES).map((item) => ({ ...item }))

const FIGHTER_A: Fighter = {
  name: 'Superman',
  subtitle: 'New 52',
  imageUrl: '',
  color: FIGHTER_A_COLOR,
  stats: {
    strength: 96,
    speed: 96,
    durability: 95,
    battleIq: 92,
    hax: 80,
    stamina: 94,
    style: 89,
    experience: 90,
    skills: 91,
  },
}

const FIGHTER_B: Fighter = {
  name: 'King Hyperion',
  subtitle: 'Earth-4023',
  imageUrl: '',
  color: FIGHTER_B_COLOR,
  stats: {
    strength: 92,
    speed: 84,
    durability: 95,
    battleIq: 84,
    hax: 83,
    stamina: 94,
    style: 83,
    experience: 92,
    skills: 83,
  },
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'tactical-board',
    name: 'Tactical Board / Methodology',
    description: 'Half category board, half combat-reality lightning screen.',
    layout: 'tacticalBoard',
    frame: 'gold',
    theme: 'steel',
    title: 'TACTICAL BOARD // METHODOLOGY',
    subtitle: 'Category table and non-linear combat reality',
  },
  {
    id: 'character-card-a',
    name: 'Character Card A',
    description: 'Single full card for fighter A (more portrait space).',
    layout: 'characterCardA',
    frame: 'neon',
    theme: 'cosmic',
    title: 'CHARACTER DOSSIER // BLUE',
    subtitle: 'Archetype, style and tactical profile',
  },
  {
    id: 'character-card-b',
    name: 'Character Card B',
    description: 'Single full card for fighter B (more portrait space).',
    layout: 'characterCardB',
    frame: 'neon',
    theme: 'cosmic',
    title: 'CHARACTER DOSSIER // RED',
    subtitle: 'Archetype, style and tactical profile',
  },
  {
    id: 'hud-bars',
    name: 'HUD Bars',
    description: 'Military HUD look with long horizontal bars like output (1).',
    layout: 'hudBars',
    frame: 'tech',
    theme: 'cosmic',
    title: 'HIGH-END COMBAT ANALYTICS',
    subtitle: 'SUBJECTS: SUPERMAN // KING HYPERION',
  },
  {
    id: 'radar-brief',
    name: 'Radar Brief',
    description: 'Center radar, side winner notes, bottom score strip.',
    layout: 'radarBrief',
    frame: 'neon',
    theme: 'cosmic',
    title: 'PARAMETER COMPARISON',
    subtitle: 'Tactical summary with radial profile',
  },
  {
    id: 'winner-cv',
    name: 'Winner CV',
    description: 'List of top beaten opponents for both fighters.',
    layout: 'winnerCv',
    frame: 'tech',
    theme: 'cosmic',
    title: 'WINNERS CV REPORT',
    subtitle: 'Defeated opponents archive',
  },
  {
    id: 'summary',
    name: 'Podsumowanie',
    description: 'Summary card placeholder from imported template block.',
    layout: 'blankTemplate',
    frame: 'tech',
    theme: 'cosmic',
    title: 'PODSUMOWANIE',
    subtitle: 'Final summary block',
  },
  {
    id: 'battle-dynamics',
    name: 'Dynamika Starcia',
    description: 'Battle dynamics placeholder for custom data.',
    layout: 'blankTemplate',
    frame: 'tech',
    theme: 'steel',
    title: 'DYNAMIKA STARCIA',
    subtitle: 'Tempo, momentum and pressure',
  },
  {
    id: 'x-factor',
    name: 'X-Factor',
    description: 'Critical variable placeholder panel.',
    layout: 'blankTemplate',
    frame: 'tech',
    theme: 'cosmic',
    title: 'X-FACTOR',
    subtitle: 'Single variable with highest impact',
  },
  {
    id: 'interpretation',
    name: 'Interpretacja',
    description: 'Interpretation placeholder for narrative readout.',
    layout: 'blankTemplate',
    frame: 'tech',
    theme: 'steel',
    title: 'INTERPRETACJA',
    subtitle: 'Meaning behind raw stats',
  },
  {
    id: 'fight-simulation',
    name: 'Symulacja Walki',
    description: 'Simulation placeholder for phase-by-phase scenario.',
    layout: 'blankTemplate',
    frame: 'tech',
    theme: 'cosmic',
    title: 'SYMULACJA WALKI',
    subtitle: 'Scenario timeline',
  },
  {
    id: 'stat-trap',
    name: 'PuĹ‚apka Statystyk',
    description: 'Non-linear trap placeholder.',
    layout: 'blankTemplate',
    frame: 'tech',
    theme: 'steel',
    title: 'PUĹAPKA STATYSTYK',
    subtitle: 'Why numbers can mislead',
  },
  {
    id: 'verdict-matrix',
    name: 'Matryca Werdyktu',
    description: 'Decision matrix placeholder.',
    layout: 'blankTemplate',
    frame: 'tech',
    theme: 'cosmic',
    title: 'MATRYCA WERDYKTU',
    subtitle: 'Condition-based verdict grid',
  },
  {
    id: 'blank-template',
    name: 'New Template',
    description: 'Empty placeholder field for the next layout.',
    layout: 'blankTemplate',
    frame: 'tech',
    theme: 'cosmic',
    title: 'NEW TEMPLATE',
    subtitle: 'Placeholder area',
  },
]

const pickLang = (language: Language, pl: string, en: string) => (language === 'pl' ? pl : en)

const TEMPLATE_LOCALIZED_COPY: Record<TemplateId, Record<Language, LocalizedTemplateCopy>> = {
  'tactical-board': {
    pl: {
      name: 'Tablica Taktyczna / Metodologia',
      description: 'PĂłĹ‚ planszy kategorii i pĂłĹ‚ panelu nieliniowoĹ›ci walki.',
      title: 'TABLICA TAKTYCZNA // METODOLOGIA',
      subtitle: 'Tabela kategorii i nieliniowa rzeczywistoĹ›Ä‡ starcia',
    },
    en: {
      name: 'Tactical Board / Methodology',
      description: 'Half category board, half combat-reality lightning screen.',
      title: 'TACTICAL BOARD // METHODOLOGY',
      subtitle: 'Category table and non-linear combat reality',
    },
  },
  'character-card-a': {
    pl: {
      name: 'Karta Postaci A',
      description: 'PeĹ‚na karta lewej postaci z wiÄ™kszym miejscem na portret.',
      title: 'DOSSIER POSTACI // NIEBIESKI',
      subtitle: 'Archetyp, styl i profil taktyczny',
    },
    en: {
      name: 'Character Card A',
      description: 'Single full card for fighter A (more portrait space).',
      title: 'CHARACTER DOSSIER // BLUE',
      subtitle: 'Archetype, style and tactical profile',
    },
  },
  'character-card-b': {
    pl: {
      name: 'Karta Postaci B',
      description: 'PeĹ‚na karta prawej postaci z wiÄ™kszym miejscem na portret.',
      title: 'DOSSIER POSTACI // CZERWONY',
      subtitle: 'Archetyp, styl i profil taktyczny',
    },
    en: {
      name: 'Character Card B',
      description: 'Single full card for fighter B (more portrait space).',
      title: 'CHARACTER DOSSIER // RED',
      subtitle: 'Archetype, style and tactical profile',
    },
  },
  'hud-bars': {
    pl: {
      name: 'Paski HUD',
      description: 'Militarna plansza z poziomymi paskami statystyk.',
      title: 'WYSOKOPOZIOMOWA ANALITYKA STARCIA',
      subtitle: 'OBIEKTY: SUPERMAN // KING HYPERION',
    },
    en: {
      name: 'HUD Bars',
      description: 'Military HUD look with long horizontal bars like output (1).',
      title: 'HIGH-END COMBAT ANALYTICS',
      subtitle: 'SUBJECTS: SUPERMAN // KING HYPERION',
    },
  },
  'radar-brief': {
    pl: {
      name: 'Raport Radarowy',
      description: 'Radar w centrum, przewagi po bokach, pasek wyniku na dole.',
      title: 'PORĂ“WNANIE PARAMETRĂ“W',
      subtitle: 'Podsumowanie taktyczne z profilem radialnym',
    },
    en: {
      name: 'Radar Brief',
      description: 'Center radar, side winner notes, bottom score strip.',
      title: 'PARAMETER COMPARISON',
      subtitle: 'Tactical summary with radial profile',
    },
  },
  'winner-cv': {
    pl: {
      name: 'CV ZwyciÄ™zcĂłw',
      description: 'Lista najwaĹĽniejszych pokonanych rywali po obu stronach.',
      title: 'RAPORT CV ZWYCIÄZCĂ“W',
      subtitle: 'Archiwum pokonanych przeciwnikĂłw',
    },
    en: {
      name: 'Winner CV',
      description: 'List of top beaten opponents for both fighters.',
      title: 'WINNERS CV REPORT',
      subtitle: 'Defeated opponents archive',
    },
  },
  summary: {
    pl: {
      name: 'Podsumowanie',
      description: 'Blok koĹ„cowego podsumowania z danych importu.',
      title: 'PODSUMOWANIE',
      subtitle: 'KoĹ„cowy blok syntezy',
    },
    en: {
      name: 'Summary',
      description: 'Summary card placeholder from imported template block.',
      title: 'SUMMARY',
      subtitle: 'Final summary block',
    },
  },
  'battle-dynamics': {
    pl: {
      name: 'Dynamika Starcia',
      description: 'Tempo, momentum i presja w czasie.',
      title: 'DYNAMIKA STARCIA',
      subtitle: 'Tempo, momentum i presja',
    },
    en: {
      name: 'Battle Dynamics',
      description: 'Battle dynamics placeholder for custom data.',
      title: 'BATTLE DYNAMICS',
      subtitle: 'Tempo, momentum and pressure',
    },
  },
  'x-factor': {
    pl: {
      name: 'X-Factor',
      description: 'Najbardziej krytyczna zmienna pojedynku.',
      title: 'X-FACTOR',
      subtitle: 'Jedna zmienna o najwyĹĽszym wpĹ‚ywie',
    },
    en: {
      name: 'X-Factor',
      description: 'Critical variable placeholder panel.',
      title: 'X-FACTOR',
      subtitle: 'Single variable with highest impact',
    },
  },
  interpretation: {
    pl: {
      name: 'Interpretacja',
      description: 'Ekspercka interpretacja samych statystyk.',
      title: 'INTERPRETACJA',
      subtitle: 'Znaczenie surowych danych',
    },
    en: {
      name: 'Interpretation',
      description: 'Interpretation placeholder for narrative readout.',
      title: 'INTERPRETATION',
      subtitle: 'Meaning behind raw stats',
    },
  },
  'fight-simulation': {
    pl: {
      name: 'Symulacja Walki',
      description: 'Symulacja przebiegu starcia faza po fazie.',
      title: 'SYMULACJA WALKI',
      subtitle: 'OĹ› scenariusza',
    },
    en: {
      name: 'Fight Simulation',
      description: 'Simulation placeholder for phase-by-phase scenario.',
      title: 'FIGHT SIMULATION',
      subtitle: 'Scenario timeline',
    },
  },
  'stat-trap': {
    pl: {
      name: 'PuĹ‚apka Statystyk',
      description: 'Nieliniowa puĹ‚apka interpretacji liczb.',
      title: 'PUĹAPKA STATYSTYK',
      subtitle: 'Dlaczego liczby potrafiÄ… zmyliÄ‡',
    },
    en: {
      name: 'Stat Trap',
      description: 'Non-linear trap placeholder.',
      title: 'STAT TRAP',
      subtitle: 'Why numbers can mislead',
    },
  },
  'verdict-matrix': {
    pl: {
      name: 'Matryca Werdyktu',
      description: 'Werdykt zaleĹĽny od warunkĂłw walki.',
      title: 'MATRYCA WERDYKTU',
      subtitle: 'Siatka werdyktu zaleĹĽna od warunkĂłw',
    },
    en: {
      name: 'Verdict Matrix',
      description: 'Decision matrix placeholder.',
      title: 'VERDICT MATRIX',
      subtitle: 'Condition-based verdict grid',
    },
  },
  'blank-template': {
    pl: {
      name: 'Nowy Template',
      description: 'Puste pole pod kolejny layout.',
      title: 'NOWY TEMPLATE',
      subtitle: 'Pole placeholder',
    },
    en: {
      name: 'New Template',
      description: 'Empty placeholder field for the next layout.',
      title: 'NEW TEMPLATE',
      subtitle: 'Placeholder area',
    },
  },
  methodology: {
    pl: {
      name: 'Metodologia',
      description: 'Plansza metodologii i nieliniowoĹ›ci.',
      title: 'METODOLOGIA STARCIA',
      subtitle: 'Analiza ĹşrĂłdeĹ‚ i dynamiki',
    },
    en: {
      name: 'Methodology',
      description: 'Methodology board and non-linear combat card.',
      title: 'METHODOLOGY',
      subtitle: 'Data source and combat dynamics',
    },
  },
}

const localizeTemplatePreset = (preset: TemplatePreset, language: Language): TemplatePreset => {
  const copy = TEMPLATE_LOCALIZED_COPY[preset.id][language]
  return {
    ...preset,
    name: copy.name,
    description: copy.description,
    title: copy.title,
    subtitle: copy.subtitle,
  }
}

const FRAME_CLASSES: Record<Frame, string> = {
  neon:
    'border-cyan-300/70 shadow-[0_0_0_1px_rgba(125,211,252,0.4),0_0_42px_rgba(34,211,238,0.3)]',
  gold:
    'border-amber-300/70 shadow-[0_0_0_1px_rgba(251,191,36,0.45),inset_0_0_0_1px_rgba(251,191,36,0.2)]',
  tech: 'border-slate-300/60 shadow-[0_0_0_1px_rgba(148,163,184,0.45),0_0_36px_rgba(15,23,42,0.8)]',
}

const THEME_CLASSES: Record<Theme, string> = {
  cosmic: 'bg-[linear-gradient(145deg,#020617_0%,#0f172a_55%,#172554_100%)]',
  ember: 'bg-[linear-gradient(145deg,#1f0805_0%,#451a03_55%,#111827_100%)]',
  steel: 'bg-[linear-gradient(145deg,#0f172a_0%,#1e293b_55%,#0f172a_100%)]',
}

const LEGACY_FIGHTS_STORAGE_KEY = 'versus-verse-vault:fights:v1'
const LEGACY_ACTIVE_FIGHT_STORAGE_KEY = 'versus-verse-vault:active-fight-id:v1'
const FIGHTS_DB_NAME = 'versus-verse-vault-db'
const FIGHTS_DB_VERSION = 1
const FIGHTS_STORE_NAME = 'fights'
const META_STORE_NAME = 'meta'
const META_ACTIVE_FIGHT_KEY = 'activeFightId'

const TEMPLATE_ID_SET = new Set<TemplateId>(TEMPLATE_PRESETS.map((template) => template.id))

const THEME_OVERLAYS: Record<Theme, string> = {
  cosmic:
    'bg-[radial-gradient(circle_at_8%_10%,rgba(56,189,248,0.24),transparent_35%),radial-gradient(circle_at_86%_88%,rgba(59,130,246,0.20),transparent_35%)]',
  ember:
    'bg-[radial-gradient(circle_at_8%_10%,rgba(249,115,22,0.3),transparent_35%),radial-gradient(circle_at_86%_88%,rgba(244,63,94,0.22),transparent_35%)]',
  steel:
    'bg-[radial-gradient(circle_at_8%_10%,rgba(148,163,184,0.2),transparent_35%),radial-gradient(circle_at_86%_88%,rgba(34,211,238,0.18),transparent_35%)]',
}

const ICON_BY_CATEGORY: Record<string, IconType> = {
  strength: Dumbbell,
  speed: Zap,
  durability: Flame,
  battleIq: Brain,
  hax: WandSparkles,
  stamina: Gauge,
  style: Swords,
  experience: Clock3,
  skills: Crosshair,
}

const FALLBACK_ICONS: IconType[] = [Sparkles, Award, BookOpen, Gauge]
const DEFAULT_TEMPLATE_ORDER: TemplateId[] = TEMPLATE_PRESETS.map((template) => template.id)
const DEFAULT_MORPH_SIZE = 66
const MORPH_ORIGIN_SIZE_SHRINK_PX = 0

const FIGHT_SCENARIO_LABELS: Record<FightScenarioId, Record<Language, string>> = {
  'orbit-harass': { pl: 'Orbita i nÄ™kanie', en: 'Orbit Harass' },
  'hit-and-run': { pl: 'Uderz i odejdĹş', en: 'Hit and Run' },
  'rush-ko': { pl: 'Szturm KO', en: 'Rush KO' },
  'clash-lock': { pl: 'Ĺ»elazny klincz', en: 'Clash Lock' },
  'kite-zone': { pl: 'Kiting i strefa', en: 'Kite Zone' },
  'teleport-burst': { pl: 'Teleport i zryw', en: 'Teleport Burst' },
  'feint-counter': { pl: 'ZwĂłd i kontra', en: 'Feint Counter' },
  'grapple-pin': { pl: 'Chwyt i dociĹ›niÄ™cie', en: 'Grapple Pin' },
  'corner-trap': { pl: 'PuĹ‚apka naroĹĽna', en: 'Corner Trap' },
  'regen-attrition': { pl: 'Regen i wyniszczenie', en: 'Regen Attrition' },
  'berserk-overextend': { pl: 'Berserk i przestrzaĹ‚', en: 'Berserk Overextend' },
  'trade-chaos': { pl: 'Chaotyczna wymiana', en: 'Trade Chaos' },
}

const fightScenarioLabel = (scenario: FightScenarioId, language: Language) =>
  FIGHT_SCENARIO_LABELS[scenario][language]

const FIGHT_SCENARIO_ALIAS_TO_ID: Record<string, FightScenarioId> = {
  orbitharass: 'orbit-harass',
  orbit: 'orbit-harass',
  spinrush: 'orbit-harass',
  hitandrun: 'hit-and-run',
  hitrun: 'hit-and-run',
  rushko: 'rush-ko',
  speedblitz: 'rush-ko',
  clashlock: 'clash-lock',
  lock: 'clash-lock',
  kitezone: 'kite-zone',
  kite: 'kite-zone',
  teleportburst: 'teleport-burst',
  teleport: 'teleport-burst',
  feintcounter: 'feint-counter',
  feint: 'feint-counter',
  grapplepin: 'grapple-pin',
  grapple: 'grapple-pin',
  cornertrap: 'corner-trap',
  corner: 'corner-trap',
  regenattrition: 'regen-attrition',
  regen: 'regen-attrition',
  berserkoverextend: 'berserk-overextend',
  overextend: 'berserk-overextend',
  tradechaos: 'trade-chaos',
  chaos: 'trade-chaos',
}

const clamp = (value: number) =>
  Math.max(0, Math.min(100, Number.isFinite(value) ? Math.round(value) : 0))

const normalizeSearchMorphHandoff = (value: unknown): SearchMorphHandoff | null => {
  if (!value || typeof value !== 'object') return null
  const payload = value as Record<string, unknown>
  const readFinite = (input: unknown) =>
    typeof input === 'number' && Number.isFinite(input) ? input : null
  const x = readFinite(payload.x)
  const y = readFinite(payload.y)
  const width = readFinite(payload.width)
  const height = readFinite(payload.height)
  if (x === null || y === null || width === null || height === null) return null

  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: Math.max(28, Math.min(220, width)),
    height: Math.max(28, Math.min(220, height)),
  }
}

const normalizePointerRelayPayload = (value: unknown): PointerRelayPayload | null => {
  if (!value || typeof value !== 'object') return null
  const payload = value as Record<string, unknown>
  if (payload.type !== 'vvv-pointer-relay') return null

  const source = payload.source
  const eventType = payload.event
  if (source !== 'search' && source !== 'intro') return null
  if (eventType !== 'move' && eventType !== 'down' && eventType !== 'up' && eventType !== 'leave') return null
  if (typeof payload.x !== 'number' || !Number.isFinite(payload.x)) return null
  if (typeof payload.y !== 'number' || !Number.isFinite(payload.y)) return null

  const timestamp =
    typeof payload.timestamp === 'number' && Number.isFinite(payload.timestamp)
      ? payload.timestamp
      : Date.now()
  const down = typeof payload.down === 'boolean' ? payload.down : undefined

  return {
    type: 'vvv-pointer-relay',
    source,
    event: eventType,
    x: payload.x,
    y: payload.y,
    down,
    timestamp,
  }
}

const getViewportCenterHandoff = (): SearchMorphHandoff => {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0, width: DEFAULT_MORPH_SIZE, height: DEFAULT_MORPH_SIZE }
  }
  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    width: DEFAULT_MORPH_SIZE,
    height: DEFAULT_MORPH_SIZE,
  }
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const normalizeToken = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')

const stripFileExtension = (value: string) => value.replace(/\.[^.]+$/, '').trim()

const parseMatchupFromFileName = (fileName: string): { leftName: string; rightName: string } | null => {
  const base = stripFileExtension(fileName).replace(/[_]+/g, ' ').trim()
  const match = base.match(/^\s*(.+?)\s+(?:vs\.?|versus|kontra|v)\s+(.+?)\s*$/i)
  if (!match) return null
  const leftName = match[1]?.trim()
  const rightName = match[2]?.trim()
  if (!leftName || !rightName) return null
  return { leftName, rightName }
}

const swapImportSides = (payload: ParsedVsImport): ParsedVsImport => ({
  ...payload,
  fighterAName: payload.fighterBName,
  fighterBName: payload.fighterAName,
  statsA: payload.statsB,
  statsB: payload.statsA,
  factsA: payload.factsB,
  factsB: payload.factsA,
  winsA: payload.winsB,
  winsB: payload.winsA,
})

const enforceFileNameSideOrder = (payload: ParsedVsImport, fileName: string): ParsedVsImport => {
  const matchup = parseMatchupFromFileName(fileName)
  if (!matchup) return payload

  const leftToken = normalizeToken(matchup.leftName)
  const rightToken = normalizeToken(matchup.rightName)
  const aToken = normalizeToken(payload.fighterAName)
  const bToken = normalizeToken(payload.fighterBName)

  let ordered = payload
  if (leftToken && rightToken && leftToken === bToken && rightToken === aToken) {
    ordered = swapImportSides(payload)
  }

  return {
    ...ordered,
    fighterAName: matchup.leftName,
    fighterBName: matchup.rightName,
  }
}

const findFightByQuery = (fights: FightRecord[], query: string): FightRecord | null => {
  const cleaned = stripFileExtension(query).trim()
  if (!cleaned) return null
  const token = normalizeToken(cleaned)
  if (!token) return null

  return (
    fights.find(
      (fight) =>
        normalizeToken(stripFileExtension(fight.name)) === token ||
        normalizeToken(stripFileExtension(fight.fileName)) === token,
    ) || null
  )
}

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })

const resolveFightScenarioId = (
  value: string | undefined,
  fallback: FightScenarioId,
): FightScenarioId => {
  if (!value) return fallback
  const token = normalizeToken(value)
  return FIGHT_SCENARIO_ALIAS_TO_ID[token] || fallback
}

const resolveFightScenarioLead = (
  value: string | undefined,
  fallback: FightScenarioLead,
): FightScenarioLead => {
  if (!value) return fallback
  const token = normalizeToken(value)
  if (
    token === 'a' ||
    token === '1' ||
    token === 'fighter1' ||
    token === 'character1' ||
    token === 'char1' ||
    token === 'postac1' ||
    token === 'pojedynkowicz1' ||
    token === 'left' ||
    token === 'blue' ||
    token === 'fightera' ||
    token === 'charactera' ||
    token === 'cornera' ||
    token === 'aggressora' ||
    token === 'attackera' ||
    token === 'leada'
  ) {
    return 'a'
  }
  if (
    token === 'b' ||
    token === '2' ||
    token === 'fighter2' ||
    token === 'character2' ||
    token === 'char2' ||
    token === 'postac2' ||
    token === 'pojedynkowicz2' ||
    token === 'right' ||
    token === 'red' ||
    token === 'fighterb' ||
    token === 'characterb' ||
    token === 'cornerb' ||
    token === 'aggressorb' ||
    token === 'attackerb' ||
    token === 'leadb'
  ) {
    return 'b'
  }
  return fallback
}

const cloneFighter = (fighter: Fighter): Fighter => ({
  ...fighter,
  stats: { ...fighter.stats },
})

const avg = (rows: ScoreRow[], key: 'a' | 'b') =>
  rows.length ? rows.reduce((sum, row) => sum + row[key], 0) / rows.length : 0

const iconForCategory = (id: string, index: number) =>
  ICON_BY_CATEGORY[id] ?? FALLBACK_ICONS[index % FALLBACK_ICONS.length]

const fighterMonogram = (name: string) => {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
  if (!parts.length) return 'VS'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

const extractBullet = (line: string) => line.trim().replace(/^[-*â€˘]\s*/, '').trim()

const parseBulletItems = (lines: string[]) =>
  lines
    .map((line) => extractBullet(line))
    .filter(Boolean)

const parseStatItems = (lines: string[]): ParsedStat[] => {
  const stats: ParsedStat[] = []
  for (const item of parseBulletItems(lines)) {
    const direct = item.match(/^(.+?)\s*[:=]\s*(-?\d+(?:\.\d+)?)$/)
    const spaced = item.match(/^(.+?)\s+(-?\d+(?:\.\d+)?)$/)
    const match = direct ?? spaced
    if (!match) continue
    const label = match[1].trim()
    const value = clamp(Number(match[2]))
    if (!label) continue
    stats.push({ label, value })
  }
  return stats
}

const factDefaults = ['Style', 'Advantage', 'Mentality']

const parseFactItems = (lines: string[]): FighterFact[] =>
  parseBulletItems(lines).map((item, index) => {
    const parts = item.split(':')
    if (parts.length >= 2) {
      const title = parts.shift()?.trim() || factDefaults[index] || `Feat ${index + 1}`
      const text = parts.join(':').trim()
      return { title, text: text || '-' }
    }
    return {
      title: factDefaults[index] || `Feat ${index + 1}`,
      text: item,
    }
  })

const pickNameFromSection = (
  sectionTitle: string,
  sectionLines: string[],
  fallback: string,
) => {
  const title = sectionTitle.trim().replace(/^\((.*)\)$/, '$1').trim()
  const placeholder = normalizeToken(title)
  const looksLikePlaceholder =
    !placeholder ||
    placeholder.includes('nazwapostaci') ||
    placeholder.includes('name') ||
    placeholder.includes('fighter') ||
    placeholder.includes('character')
  if (title && !looksLikePlaceholder) return title

  const fromList = parseBulletItems(sectionLines)[0]
  if (fromList) return fromList

  const fromPlain = sectionLines.map((line) => line.trim()).find(Boolean)
  return fromPlain || fallback
}

const TEMPLATE_TOKEN_MAP: Record<string, TemplateId> = {
  hudbars: 'hud-bars',
  hudbar: 'hud-bars',
  parametercomparison: 'radar-brief',
  radarbrief: 'radar-brief',
  tacticalboard: 'tactical-board',
  tacticalboardmethodology: 'tactical-board',
  methodology: 'methodology',
  metodologia: 'methodology',
  winnercv: 'winner-cv',
  cvwinners: 'winner-cv',
  cvzwyciezcow: 'winner-cv',
  charactercarda: 'character-card-a',
  charactera: 'character-card-a',
  carda: 'character-card-a',
  charactercardb: 'character-card-b',
  characterb: 'character-card-b',
  cardb: 'character-card-b',
  podsumowanie: 'summary',
  summary: 'summary',
  dynamikastarcia: 'battle-dynamics',
  battledynamics: 'battle-dynamics',
  xfactor: 'x-factor',
  interpretacja: 'interpretation',
  interpretation: 'interpretation',
  symulacjawalki: 'fight-simulation',
  fightsimulation: 'fight-simulation',
  pulapkastatystyk: 'stat-trap',
  stattrap: 'stat-trap',
  matrycawerdyktu: 'verdict-matrix',
  verdictmatrix: 'verdict-matrix',
  newtemplate: 'blank-template',
  blanktemplate: 'blank-template',
  emptyfield: 'blank-template',
}

const parseTemplateOrder = (lines: string[]) => {
  const ids: TemplateId[] = []
  for (const line of parseBulletItems(lines)) {
    const normalized = normalizeToken(line)
    if (!normalized) continue
    const mapped = TEMPLATE_TOKEN_MAP[normalized]
    if (mapped) ids.push(mapped)
  }
  return ids.length ? ids : DEFAULT_TEMPLATE_ORDER
}

const parseTemplateOrderTokens = (tokens: string[]) => {
  const ids: TemplateId[] = []
  for (const item of tokens) {
    const normalized = normalizeToken(item)
    if (!normalized) continue
    const mapped = TEMPLATE_TOKEN_MAP[normalized]
    if (mapped) {
      ids.push(mapped)
      continue
    }
    if (TEMPLATE_ID_SET.has(item as TemplateId)) {
      ids.push(item as TemplateId)
    }
  }
  return ids
}

const parseTemplateBlocks = (raw: string) => {
  const blocks: Record<string, string[]> = {}
  let active: string | null = null
  for (const line of raw.replace(/\r/g, '').split('\n')) {
    const trimmed = line.trim()
    const heading = trimmed.match(/^template\s+(.+?)\s*:?$/i)
    if (heading) {
      active = heading[1].trim()
      if (!blocks[active]) blocks[active] = []
      continue
    }
    if (!active) continue
    if (/^\d+\.\s*/.test(trimmed)) {
      active = null
      continue
    }
    const item = extractBullet(trimmed)
    if (item) blocks[active].push(item)
  }
  return blocks
}

type TemplateBlockRequirement = {
  blockPl: string
  blockEn: string
  purposePl: string
  purposeEn: string
  fields: string[]
}

const TEMPLATE_BLOCK_REQUIREMENTS: TemplateBlockRequirement[] = [
  {
    blockPl: 'PostaÄ‡ A',
    blockEn: 'Character A',
    purposePl: 'Karta lewej postaci (niebieski naroĹĽnik).',
    purposeEn: 'Card for the left fighter (blue corner).',
    fields: [
      'header | title | headline',
      'world | swiat | version',
      'style',
      'atut | advantage',
      'mentalnosc | mentality',
      'quote | cytat',
    ],
  },
  {
    blockPl: 'PostaÄ‡ B',
    blockEn: 'Character B',
    purposePl: 'Karta prawej postaci (czerwony naroĹĽnik).',
    purposeEn: 'Card for the right fighter (red corner).',
    fields: [
      'header | title | headline',
      'world | swiat | version',
      'style',
      'atut | advantage',
      'mentalnosc | mentality',
      'quote | cytat',
    ],
  },
  {
    blockPl: 'Tablica Taktyczna',
    blockEn: 'Tactical Board',
    purposePl: 'Plansza kategorii + panel chaosu.',
    purposeEn: 'Category board + chaos panel.',
    fields: [
      'headline | header | title',
      'subtitle | purpose | note',
      'left_header | categories_header',
      'right_header | reality_header',
      'linear_label',
      'chaos_label',
      'lane | line_1 | line1',
    ],
  },
  {
    blockPl: 'Paski HUD',
    blockEn: 'HUD Bars',
    purposePl: 'DĹ‚ugi panel statystyk poziomych.',
    purposeEn: 'Long horizontal statistics panel.',
    fields: [
      'headline | header | title',
      'subtitle | purpose | note',
      'threat_level',
      'integrity | data_integrity',
      'profile_mode',
      'scale',
    ],
  },
  {
    blockPl: 'Raport Radarowy',
    blockEn: 'Radar Brief',
    purposePl: 'Radar + przewagi lewej i prawej strony.',
    purposeEn: 'Radar + left/right side advantages.',
    fields: [
      'headline | header | title',
      'subtitle | purpose | note',
      'left_header',
      'right_header',
      'draw_header',
      'favorite_label | favorite',
    ],
  },
  {
    blockPl: 'CV ZwyciÄ™zcĂłw',
    blockEn: 'Winner CV',
    purposePl: 'Lista pokonanych przeciwnikĂłw.',
    purposeEn: 'List of defeated opponents.',
    fields: [
      'headline | header | title',
      'subtitle | purpose | note',
      'archive_label',
      'avg_label',
      'left_title',
      'right_title',
      'win_badge',
    ],
  },
  {
    blockPl: 'Podsumowanie',
    blockEn: 'Summary',
    purposePl: 'KoĹ„cowe streszczenie starcia.',
    purposeEn: 'Final fight summary.',
    fields: [
      'headline | header | title',
      'subtitle | purpose | note',
      'winner | verdict',
      'line_1 | line1',
      'line_2 | line2',
      'line_3 | line3',
    ],
  },
  {
    blockPl: 'Dynamika Starcia',
    blockEn: 'Battle Dynamics',
    purposePl: 'Tempo walki i presja w czasie.',
    purposeEn: 'Fight tempo and pressure over time.',
    fields: [
      'headline | header | title',
      'subtitle | purpose | note',
      'a_curve | curve_a | blue_curve | left_curve',
      'b_curve | curve_b | red_curve | right_curve',
      'yellow_wave | wave | chaos_wave',
      'phase_1 | phase1',
      'phase_2 | phase2',
      'phase_3 | phase3',
      'analysis | note | line_4 | line4',
    ],
  },
  {
    blockPl: 'X-Factor',
    blockEn: 'X-Factor',
    purposePl: 'NajwaĹĽniejsza zmienna decydujÄ…ca.',
    purposeEn: 'Most decisive variable.',
    fields: [
      'headline | header | title',
      'subtitle | note',
      'factor | headline',
      'a_value | super_value | superman | left_value',
      'a_bonus | super_bonus | left_bonus',
      'a_bonus_label | left_bonus_label',
      'b_value | hyper_value | hyperion | right_value',
      'b_bonus | hyper_bonus | right_bonus',
      'regen | regen_label',
      'mechanika | mechanics',
      'implikacja | implication',
      'psychologia | psychology',
    ],
  },
  {
    blockPl: 'Interpretacja',
    blockEn: 'Interpretation',
    purposePl: 'Komentarz ekspercki do danych.',
    purposeEn: 'Expert readout of the data.',
    fields: [
      'headline | header | title',
      'subtitle | purpose | note',
      'line_1 | line1 | thesis',
      'line_2 | line2 | antithesis',
      'line_3 | line3 | conclusion',
      'quote | line_4 | line4',
    ],
  },
  {
    blockPl: 'Symulacja Walki',
    blockEn: 'Fight Simulation',
    purposePl: 'Symulacja etapĂłw walki.',
    purposeEn: 'Three-phase simulation board.',
    fields: [
      'headline | header | title',
      'subtitle | purpose | note',
      'opening',
      'mid_fight | midfight',
      'late_fight | latefight',
      'end_condition | endcondition',
      'phase_mode | phasemode | mode | simulation_mode | simulationmode',
      'phase_animation | phaseanimation | animation | scenario | preset | simulation_animation | simulationanimation',
      'phase_actor | phaseactor | actor | lead | aggressor | attacker',
      'phase_<N>_mode | phase<N>mode | phase_<N>_type | phase<N>type',
      'phase_<N>_animation | phase<N>animation | phase_<N>_scenario | phase<N>scenario | phase_<N>_preset | phase<N>preset',
      'phase_<N>_actor | phase<N>actor | phase_<N>_lead | phase<N>lead | phase_<N>_aggressor | phase<N>aggressor | phase_<N>_attacker | phase<N>attacker',
      'phase_<N>_title | phase<N>title | phase_<N>_headline | phase<N>headline',
      'phase_<N>_a_label | phase<N>alabel | phase_<N>_left_label | phase<N>leftlabel',
      'phase_<N>_b_label | phase<N>blabel | phase_<N>_right_label | phase<N>rightlabel',
      'phase_<N>_a_value | phase<N>avalue | phase_<N>_left_value | phase<N>leftvalue',
      'phase_<N>_b_value | phase<N>bvalue | phase_<N>_right_value | phase<N>rightvalue',
      'phase_<N>_event | phase<N>event | phase_<N>_turn | phase<N>turn | phase_<N>_pivot | phase<N>pivot',
      'phase_<N>_branch_a | phase<N>brancha | phase_<N>_option_a | phase<N>optiona | phase_<N>_left_option | phase<N>leftoption',
      'phase_<N>_branch_b | phase<N>branchb | phase_<N>_option_b | phase<N>optionb | phase_<N>_right_option | phase<N>rightoption',
    ],
  },
  {
    blockPl: 'PuĹ‚apka Statystyk',
    blockEn: 'Stat Trap',
    purposePl: 'WyjaĹ›nienie nieliniowoĹ›ci starcia.',
    purposeEn: 'Explains non-linear outcome mechanics.',
    fields: [
      'headline | header | title',
      'subtitle | purpose | note',
      'trap_top | top | line_1',
      'trap_bottom | bottom | line_2',
      'example | line_3',
      'question | line_4 | trap',
    ],
  },
  {
    blockPl: 'Matryca Werdyktu',
    blockEn: 'Verdict Matrix',
    purposePl: 'Werdykt zaleĹĽny od warunkĂłw.',
    purposeEn: 'Condition-based verdict matrix.',
    fields: [
      'headline | header | title',
      'subtitle | purpose | note',
      'col_left | solar_flare_yes | solarflare_yes',
      'col_right | solar_flare_no | solarflare_no',
      'row_top | standard | standard_ko',
      'row_bottom | deathmatch | kill_only',
      'case_1 | case1',
      'case_2 | case2',
      'case_3 | case3',
      'case_4 | case4',
    ],
  },
  {
    blockPl: 'Nowy Template',
    blockEn: 'Blank Template',
    purposePl: 'Puste pole robocze pod kolejny layout.',
    purposeEn: 'Working blank field for the next layout.',
    fields: ['headline | header | title', 'subtitle | purpose | note', 'line_1 | line1', 'line_2 | line2', 'line_3 | line3'],
  },
  {
    blockPl: 'Metodologia',
    blockEn: 'Methodology',
    purposePl: 'Plansza metodologii i nieliniowoĹ›ci walki.',
    purposeEn: 'Method board and non-linear combat panel.',
    fields: [
      'headline | header | title',
      'subtitle | purpose | note',
      'list_label',
      'reality_label',
      'linear_label',
      'chaos_label',
      'closing_label',
    ],
  },
]

const buildImportTxtBlueprint = (language: Language) => {
  const lines: string[] = []
  lines.push(pickLang(language, '1. (Nazwa Postaci A)', '1. (Character A Name)'))
  lines.push(pickLang(language, '2. (Staty Postaci A)', '2. (Character A Stats)'))
  lines.push(pickLang(language, '- SiĹ‚a: 96', '- Strength: 96'))
  lines.push(pickLang(language, '- SzybkoĹ›Ä‡: 95', '- Speed: 95'))
  lines.push(pickLang(language, '- WytrzymaĹ‚oĹ›Ä‡: 94', '- Durability: 94'))
  lines.push(pickLang(language, '3. (Featy Postaci A)', '3. (Character A Feats)'))
  lines.push(pickLang(language, '- Styl: Kontrola dystansu i tempa', '- Style: Range control and pace control'))
  lines.push(pickLang(language, '- Atut: Dyscyplina taktyczna', '- Advantage: Tactical discipline'))
  lines.push(pickLang(language, '- Mentalnosc: WygraÄ‡ decyzjÄ…, uniknÄ…Ä‡ zniszczeĹ„', '- Mentality: Win by decision, avoid collateral damage'))
  lines.push(pickLang(language, '4. (Pokonani przez PostaÄ‡ A)', '4. (Defeated by Character A)'))
  lines.push('- Doomsday')
  lines.push('- Brainiac')
  lines.push(pickLang(language, '5. (Nazwa Postaci B)', '5. (Character B Name)'))
  lines.push(pickLang(language, '6. (Staty Postaci B)', '6. (Character B Stats)'))
  lines.push(pickLang(language, '- SiĹ‚a: 92', '- Strength: 92'))
  lines.push(pickLang(language, '- SzybkoĹ›Ä‡: 84', '- Speed: 84'))
  lines.push(pickLang(language, '- WytrzymaĹ‚oĹ›Ä‡: 95', '- Durability: 95'))
  lines.push(pickLang(language, '7. (Featy Postaci B)', '7. (Character B Feats)'))
  lines.push(pickLang(language, '- Styl: Agresywne skracanie dystansu', '- Style: Aggressive distance closing'))
  lines.push(pickLang(language, '- Atut: Nieludzka regeneracja', '- Advantage: Extreme regeneration'))
  lines.push(pickLang(language, '- Mentalnosc: ZĹ‚amaÄ‡ przeciwnika za wszelkÄ… cenÄ™', '- Mentality: Break the opponent at any cost'))
  lines.push(pickLang(language, '8. (Pokonani przez PostaÄ‡ B)', '8. (Defeated by Character B)'))
  lines.push('- Thor')
  lines.push('- Hulk')
  lines.push(pickLang(language, '9. (KolejnoĹ›Ä‡ templatek uĹĽytych w tej walce)', '9. (Template Order Used In This Fight)'))
  TEMPLATE_PRESETS.forEach((template) => {
    lines.push(`- ${template.id}`)
  })
  lines.push('')
  lines.push(pickLang(language, '# Template blocks (opcjonalne / rozszerzone)', '# Template blocks (optional / extended)'))
  TEMPLATE_BLOCK_REQUIREMENTS.forEach((item) => {
    const blockName = pickLang(language, item.blockPl, item.blockEn)
    const purpose = pickLang(language, item.purposePl, item.purposeEn)
    lines.push(`Template ${blockName}:`)
    lines.push(`- purpose: ${purpose}`)
    item.fields.forEach((field) => lines.push(`- ${field}:`))
    lines.push('')
  })
  return lines.join('\n')
}

const findTemplateBlockLines = (
  blocks: Record<string, string[]>,
  aliases: string[],
) => {
  const normalizedAliases = aliases.map((alias) => normalizeToken(alias))
  for (const [heading, lines] of Object.entries(blocks)) {
    const normalizedHeading = normalizeToken(heading)
    if (
      normalizedAliases.some(
        (alias) =>
          normalizedHeading === alias ||
          normalizedHeading.includes(alias) ||
          alias.includes(normalizedHeading),
      )
    ) {
      return lines
    }
  }
  return []
}

const parseTemplateFieldMap = (lines: string[]) => {
  const fields: Record<string, string> = {}
  for (const item of parseBulletItems(lines)) {
    const match = item.match(/^([^:=]+)\s*[:=]\s*(.+)$/)
    if (!match) continue
    const key = normalizeToken(match[1])
    const value = match[2].trim()
    if (!key || !value) continue
    fields[key] = value
  }
  return fields
}

const pickTemplateField = (fields: Record<string, string>, keys: string[]) => {
  for (const key of keys) {
    const normalized = normalizeToken(key)
    if (fields[normalized]) return fields[normalized]
  }
  return ''
}

const buildCardFacts = (fallbackFacts: FighterFact[], fields: Record<string, string>, language: Language) => {
  const styleDefault = fallbackFacts[0]?.text || '-'
  const atutDefault = fallbackFacts[1]?.text || '-'
  const mentalDefault = fallbackFacts[2]?.text || '-'

  return [
    { title: pickLang(language, 'Styl', 'Style'), text: pickTemplateField(fields, ['style']) || styleDefault },
    { title: pickLang(language, 'Atut', 'Advantage'), text: pickTemplateField(fields, ['atut', 'advantage']) || atutDefault },
    {
      title: pickLang(language, 'MentalnoĹ›Ä‡', 'Mentality'),
      text: pickTemplateField(fields, ['mentalnosc', 'mentality']) || mentalDefault,
    },
  ]
}

const parseCurveValues = (raw: string, fallback: number[]) => {
  const tokens = raw
    .split(/[,;|\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item.replace('%', '')))
    .filter((value) => Number.isFinite(value))

  if (!tokens.length) return fallback

  return tokens.map((value) => {
    // Allow both 0..1 and 0..100 input domains.
    const scaled = value <= 1 ? value * 100 : value
    return Math.max(0, Math.min(100, scaled))
  })
}

const parsePercentValue = (raw: string, fallback: number) => {
  const value = Number(raw.replace('%', '').trim())
  if (!Number.isFinite(value)) return fallback
  const scaled = value <= 1 ? value * 100 : value
  return Math.max(0, Math.min(100, scaled))
}

const buildCurvePolyline = (
  values: number[],
  xStart: number,
  xEnd: number,
  yTop: number,
  yBottom: number,
) => {
  const safe = values.length ? values : [50, 50]
  const range = yBottom - yTop
  const points = safe.map((value, index) => {
    const t = safe.length === 1 ? 0 : index / (safe.length - 1)
    const x = xStart + (xEnd - xStart) * t
    const y = yBottom - (value / 100) * range
    return { x, y }
  })
  return {
    points,
    polyline: points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' '),
  }
}

const KEY_VALUE_BULLET_RE = /^[^:=]+\s*[:=]\s*.+$/

const getPlainTemplateLines = (lines: string[]) =>
  parseBulletItems(lines).filter((item) => !KEY_VALUE_BULLET_RE.test(item))

const TEMPLATE_BLOCK_ALIASES: Partial<Record<TemplateId, string[]>> = {
  'character-card-a': ['character a', 'character card a', 'card a', 'postac a', 'karta postaci a'],
  'character-card-b': ['character b', 'character card b', 'card b', 'postac b', 'karta postaci b'],
  'tactical-board': ['tactical board', 'methodology', 'tablica taktyczna', 'metodologia'],
  'hud-bars': ['hud bars', 'paski hud'],
  'radar-brief': ['radar brief', 'parameter comparison', 'raport radarowy', 'porownanie parametrow'],
  'winner-cv': ['winner cv', 'cv zwyciezcow', 'cv zwyciezcĂłw', 'zwyciezcy cv'],
  summary: ['podsumowanie', 'summary'],
  'battle-dynamics': ['dynamika starcia', 'battle dynamics'],
  'x-factor': ['x-factor', 'xfactor'],
  interpretation: ['interpretacja', 'interpretation'],
  'fight-simulation': ['symulacja walki', 'fight simulation'],
  'stat-trap': ['pulapka statystyk', 'puĹ‚apka statystyk', 'stat trap'],
  'verdict-matrix': ['matryca werdyktu', 'verdict matrix'],
  'blank-template': ['new template', 'blank template', 'nowy template'],
  methodology: ['methodology', 'metodologia'],
}

const createCategoryPayload = (statsA: ParsedStat[], statsB: ParsedStat[]) => {
  const orderedKeys: string[] = []
  const firstLabelByKey = new Map<string, string>()

  const register = (label: string) => {
    const key = normalizeToken(label)
    if (!key || firstLabelByKey.has(key)) return
    orderedKeys.push(key)
    firstLabelByKey.set(key, label)
  }

  statsA.forEach((stat) => register(stat.label))
  statsB.forEach((stat) => register(stat.label))

  if (!orderedKeys.length) {
    const categories = [...DEFAULT_CATEGORIES]
    const statsRecordA = Object.fromEntries(categories.map((category) => [category.id, 50]))
    const statsRecordB = Object.fromEntries(categories.map((category) => [category.id, 50]))
    return { categories, statsRecordA, statsRecordB }
  }

  const usedIds = new Set<string>()
  const categories: Category[] = orderedKeys.map((key, index) => {
    const label = firstLabelByKey.get(key) || `Stat ${index + 1}`
    const baseId = slug(label) || `stat-${index + 1}`
    let id = baseId
    let suffix = 2
    while (usedIds.has(id)) {
      id = `${baseId}-${suffix}`
      suffix += 1
    }
    usedIds.add(id)
    return { id, label }
  })

  const keyToId = new Map<string, string>()
  orderedKeys.forEach((key, index) => keyToId.set(key, categories[index].id))

  const statsRecordA = Object.fromEntries(categories.map((category) => [category.id, 50]))
  const statsRecordB = Object.fromEntries(categories.map((category) => [category.id, 50]))

  statsA.forEach((stat) => {
    const id = keyToId.get(normalizeToken(stat.label))
    if (id) statsRecordA[id] = clamp(stat.value)
  })

  statsB.forEach((stat) => {
    const id = keyToId.get(normalizeToken(stat.label))
    if (id) statsRecordB[id] = clamp(stat.value)
  })

  return { categories, statsRecordA, statsRecordB }
}

const parseVsImportText = (raw: string): { ok: true; data: ParsedVsImport } | { ok: false; error: string } => {
  const sanitized = raw.replace(/\r/g, '')
  const lines = sanitized.split('\n')

  const sections = new Map<number, { title: string; lines: string[] }>()
  let activeSection: number | null = null
  for (const line of lines) {
    const heading = line.match(/^\s*(\d+)\.\s*(.*)\s*$/)
    if (heading) {
      activeSection = Number(heading[1])
      sections.set(activeSection, { title: heading[2].trim(), lines: [] })
      continue
    }
    if (activeSection !== null) {
      sections.get(activeSection)?.lines.push(line)
    }
  }

  for (const required of [1, 2, 3, 4, 5, 6, 7, 8]) {
    if (!sections.has(required)) {
      return {
        ok: false,
        error: `Import error: missing section ${required}.`,
      }
    }
  }

  const section1 = sections.get(1)!
  const section2 = sections.get(2)!
  const section3 = sections.get(3)!
  const section4 = sections.get(4)!
  const section5 = sections.get(5)!
  const section6 = sections.get(6)!
  const section7 = sections.get(7)!
  const section8 = sections.get(8)!
  const section9 = sections.get(9)

  const fighterAName = pickNameFromSection(section1.title, section1.lines, 'Fighter A')
  const fighterBName = pickNameFromSection(section5.title, section5.lines, 'Fighter B')

  const statsA = parseStatItems(section2.lines)
  const statsB = parseStatItems(section6.lines)
  if (!statsA.length || !statsB.length) {
    return {
      ok: false,
      error: 'Import error: sections 2 and 6 need stat lines like "- Strength: 96".',
    }
  }

  let winsBLines = section8.lines
  let templateLinesFromEight: string[] = []
  const templateMarkerIndex = section8.lines.findIndex((line) =>
    /template|uklad|kolejnosc/i.test(line.trim()),
  )
  if (templateMarkerIndex >= 0) {
    winsBLines = section8.lines.slice(0, templateMarkerIndex)
    templateLinesFromEight = section8.lines.slice(templateMarkerIndex + 1)
  }

  const templateOrder = parseTemplateOrder([
    ...templateLinesFromEight,
    ...(section9?.lines || []),
  ])

  const factsA = parseFactItems(section3.lines)
  const factsB = parseFactItems(section7.lines)
  const winsA = parseBulletItems(section4.lines)
  const winsB = parseBulletItems(winsBLines)

  return {
    ok: true,
    data: {
      fighterAName,
      fighterBName,
      statsA,
      statsB,
      factsA,
      factsB,
      winsA,
      winsB,
      templateOrder,
      templateBlocks: parseTemplateBlocks(sanitized),
    },
  }
}

const toStringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const toFactArray = (value: unknown): FighterFact[] =>
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

const toParsedStatArray = (value: unknown): ParsedStat[] =>
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

const toTemplateBlocks = (value: unknown): Record<string, string[]> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const output: Record<string, string[]> = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!key.trim()) continue
    output[key] = toStringArray(entry)
  }
  return output
}

const normalizePersistedImport = (value: unknown): ParsedVsImport | null => {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const fighterAName = typeof raw.fighterAName === 'string' ? raw.fighterAName : ''
  const fighterBName = typeof raw.fighterBName === 'string' ? raw.fighterBName : ''
  const statsA = toParsedStatArray(raw.statsA)
  const statsB = toParsedStatArray(raw.statsB)
  const factsA = toFactArray(raw.factsA)
  const factsB = toFactArray(raw.factsB)
  const winsA = toStringArray(raw.winsA)
  const winsB = toStringArray(raw.winsB)
  const templateOrder = parseTemplateOrderTokens(toStringArray(raw.templateOrder))
  const templateBlocks = toTemplateBlocks(raw.templateBlocks)

  if (!fighterAName || !fighterBName) return null

  return {
    fighterAName,
    fighterBName,
    statsA,
    statsB,
    factsA,
    factsB,
    winsA,
    winsB,
    templateOrder,
    templateBlocks,
  }
}

const normalizePersistedFight = (value: unknown, index: number): FightRecord | null => {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const payload = normalizePersistedImport(raw.payload)
  if (!payload) return null

  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id
      : `fight-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name : `${payload.fighterAName} vs ${payload.fighterBName}`
  const fileName = typeof raw.fileName === 'string' && raw.fileName.trim() ? raw.fileName : `${name}.txt`
  const createdAtRaw = typeof raw.createdAt === 'number' ? raw.createdAt : Number(raw.createdAt)
  const createdAt = Number.isFinite(createdAtRaw) ? createdAtRaw : Date.now()
  const portraitADataUrl = typeof raw.portraitADataUrl === 'string' ? raw.portraitADataUrl : ''
  const portraitBDataUrl = typeof raw.portraitBDataUrl === 'string' ? raw.portraitBDataUrl : ''

  if (!portraitADataUrl || !portraitBDataUrl) return null

  return {
    id,
    name,
    fileName,
    createdAt,
    payload,
    portraitADataUrl,
    portraitBDataUrl,
  }
}

const openFightDatabase = () =>
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

const waitForTransaction = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'))
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
  })

const idbReadAllFights = async (): Promise<FightRecord[]> => {
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

const idbSaveAllFights = async (fights: FightRecord[]) => {
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

const idbGetActiveFightId = async (): Promise<string | null> => {
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

const idbSetActiveFightId = async (fightId: string | null) => {
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

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

type LightningOptions = {
  points: LightningPoint[]
  Hh835tKjwqe: 'fade' | 'none'
  fadeDelay: number
  Betwjg67687: boolean
  lineWidth: number
  Dgth5ybnq: number
  Nfetiw324b: number
  Nfetiw324bKkekf: number
  Hfgr49fuaq: number
  Korifhgnv89: number
  wr32nvjgtUUU: number
  Cfg420ogHr: number
  numBolts: number
  euygwebfBBbbf: number
  width: number
  height: number
  canvasStyle: Partial<CSSStyleDeclaration>
}

const LIGHTNING_BASE_OPTIONS = {
  Hh835tKjwqe: 'none',
  fadeDelay: 900,
  Betwjg67687: false,
  lineWidth: 1.9,
  Dgth5ybnq: 26,
  Nfetiw324b: 0.9,
  Nfetiw324bKkekf: 0.05,
  Hfgr49fuaq: 10,
  Korifhgnv89: 0.42,
  wr32nvjgtUUU: 42,
  Cfg420ogHr: 10,
  numBolts: 2,
  euygwebfBBbbf: 3,
} as const

const buildLightningBolt = (
  start: LightningPoint,
  end: LightningPoint,
  maxDifference: number,
  roughness: number,
  minSegmentLength: number,
) => {
  let points: LightningPoint[] = [start, end]
  let segmentLength = Math.hypot(end.x - start.x, end.y - start.y)
  let difference = maxDifference

  while (segmentLength > minSegmentLength) {
    const next: LightningPoint[] = [points[0]]
    for (let index = 0; index < points.length - 1; index += 1) {
      const current = points[index]
      const target = points[index + 1]
      const dx = target.x - current.x
      const dy = target.y - current.y
      const length = Math.hypot(dx, dy) || 1
      const perpendicularX = -dy / length
      const perpendicularY = dx / length
      const midX = (current.x + target.x) / 2
      const midY = (current.y + target.y) / 2
      const offset = (Math.random() * 2 - 1) * difference

      next.push({
        x: midX + perpendicularX * offset,
        y: midY + perpendicularY * offset,
      })
      next.push(target)
    }
    points = next
    difference /= roughness
    segmentLength /= 2
  }

  // Add a very light jagged pass: around +10% roughness over baseline.
  return points.map((point, index) => {
    if (index === 0 || index === points.length - 1) return point
    const prev = points[index - 1]
    const next = points[index + 1]
    const dx = next.x - prev.x
    const dy = next.y - prev.y
    const length = Math.hypot(dx, dy) || 1
    const nx = -dy / length
    const ny = dx / length
    const micro = (Math.random() * 2 - 1) * maxDifference * 0.035
    const burst =
      Math.random() < 0.06
        ? (Math.random() < 0.5 ? -1 : 1) * maxDifference * (0.06 + Math.random() * 0.12)
        : 0

    return {
      x: point.x + nx * (micro + burst),
      y: point.y + ny * (micro + burst),
    }
  })
}

const varyBoltPoints = (points: LightningPoint[], intensity: number) =>
  points.map((point, index) => {
    if (index === 0 || index === points.length - 1) return point
    const prev = points[index - 1]
    const next = points[index + 1]
    const dx = next.x - prev.x
    const dy = next.y - prev.y
    const length = Math.hypot(dx, dy) || 1
    const tangentX = dx / length
    const tangentY = dy / length
    const normalX = -tangentY
    const normalY = tangentX
    const normalOffset = (Math.random() * 2 - 1) * intensity
    const alongOffset = (Math.random() * 2 - 1) * intensity * 0.36

    return {
      x: point.x + normalX * normalOffset + tangentX * alongOffset,
      y: point.y + normalY * normalOffset + tangentY * alongOffset,
    }
  })

const buildSplitStrands = (
  points: LightningPoint[],
  splitRatio: number,
  strandCount: number,
  spread: number,
  jitter: number,
) => {
  if (points.length < 6 || strandCount < 2) return []
  const pivotIndex = Math.max(
    1,
    Math.min(points.length - 3, Math.floor((points.length - 1) * clamp01(splitRatio))),
  )
  const tail = points.slice(pivotIndex)
  if (tail.length < 3) return []

  const before = points[pivotIndex - 1]
  const after = points[pivotIndex + 1]
  const dx = after.x - before.x
  const dy = after.y - before.y
  const length = Math.hypot(dx, dy) || 1
  const tangentX = dx / length
  const tangentY = dy / length
  const normalX = -tangentY
  const normalY = tangentX
  const center = (strandCount - 1) / 2

  return Array.from({ length: strandCount }, (_, strandIndex) => {
    const lane = strandIndex - center
    return tail.map((point, index) => {
      const t = tail.length === 1 ? 1 : index / (tail.length - 1)
      const divergence = lane * spread * (0.18 + t * 1.2)
      const lateralNoise = (Math.random() * 2 - 1) * jitter * (0.28 + t * 0.92)
      const alongNoise = (Math.random() * 2 - 1) * jitter * 0.16

      return {
        x: point.x + normalX * (divergence + lateralNoise) + tangentX * alongNoise,
        y: point.y + normalY * (divergence + lateralNoise) + tangentY * alongNoise,
      }
    })
  })
}

const drawLightningBolt = (
  context: CanvasRenderingContext2D,
  points: LightningPoint[],
  lineWidth: number,
  color: string,
  glow: number,
) => {
  if (points.length < 2) return
  context.beginPath()
  context.moveTo(points[0].x, points[0].y)
  for (let index = 1; index < points.length; index += 1) {
    context.lineTo(points[index].x, points[index].y)
  }
  context.lineWidth = lineWidth
  context.strokeStyle = color
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.shadowColor = color
  context.shadowBlur = glow
  context.stroke()
}

function LightningCanvas({
  startRatio = { x: 0.5, y: 0.5 },
  endRatio = { x: 0.92, y: 0.5 },
}: {
  startRatio?: LightningPoint
  endRatio?: LightningPoint
}) {
  const lightningRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = lightningRef.current
    if (!host) return

    let frame = 0
    let previous = 0
    let context: CanvasRenderingContext2D | null = null
    let canvas: HTMLCanvasElement | null = null
    const dpr = window.devicePixelRatio || 1

    const ensureCanvas = () => {
      if (!canvas) {
        canvas = document.createElement('canvas')
        canvas.className = 'lightning-canvas'
        host.appendChild(canvas)
      }

      const width = Math.max(220, Math.floor(host.clientWidth))
      const height = Math.max(120, Math.floor(host.clientHeight))
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context = canvas.getContext('2d')
      if (context) {
        context.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
    }

    ensureCanvas()

    const render = (time: number) => {
      if (!context) {
        frame = requestAnimationFrame(render)
        return
      }

      const width = Math.max(1, Math.floor(host.clientWidth))
      const height = Math.max(1, Math.floor(host.clientHeight))
      const options: LightningOptions = {
        points: [
          {
            x: width * clamp01(startRatio.x),
            y: height * clamp01(startRatio.y),
          },
          {
            x: width * clamp01(endRatio.x),
            y: height * clamp01(endRatio.y),
          },
        ],
        ...LIGHTNING_BASE_OPTIONS,
        width,
        height,
        canvasStyle: {
          zIndex: '0',
        },
      }
      if (canvas) {
        Object.assign(canvas.style, options.canvasStyle)
      }

      if (time - previous >= Math.max(16, options.wr32nvjgtUUU)) {
        previous = time
        const ctx = context
        const fadeMode = options.Hh835tKjwqe === 'fade' && options.Betwjg67687
        const fadeAmount = Math.min(0.22, Math.max(0.04, options.wr32nvjgtUUU / options.fadeDelay))

        ctx.save()
        ctx.globalCompositeOperation = 'source-over'
        if (fadeMode) {
          ctx.fillStyle = `rgba(0, 0, 0, ${fadeAmount.toFixed(3)})`
          ctx.fillRect(0, 0, width, height)
        } else {
          ctx.clearRect(0, 0, width, height)
        }
        ctx.restore()

        ctx.globalCompositeOperation = 'lighter'
        ctx.globalAlpha = Math.max(0.5, Math.min(1, options.Korifhgnv89 + 0.4))

        const roughness = Math.max(1.7, 1.38 + options.Nfetiw324b * 0.72)
        const minSegmentLength = Math.max(
          2.1,
          Math.min(width, height) * Math.max(0.015, options.Nfetiw324bKkekf * 0.5),
        )
        const endJitterX = options.Cfg420ogHr * 0.24
        const endJitterY = options.Cfg420ogHr * 0.08
        const startJitterX = Math.max(0.2, options.euygwebfBBbbf * 0.12)
        const startJitterY = options.euygwebfBBbbf * 0.18
        const boltCount = Math.max(1, options.numBolts)
        const secondaryOffsetY = -Math.max(0.65, options.Cfg420ogHr * 0.04)

        for (let index = 0; index < boltCount; index += 1) {
          const isPrimaryBolt = index === 0
          const laneOffsetY = isPrimaryBolt
            ? 0
            : secondaryOffsetY + (index - 1) * Math.max(0.45, options.Cfg420ogHr * 0.02)
          const start = {
            x: isPrimaryBolt
              ? options.points[0].x
              : options.points[0].x + (Math.random() * 2 - 1) * (startJitterX + index * 0.28),
            y: isPrimaryBolt
              ? options.points[0].y
              : options.points[0].y +
                laneOffsetY +
                (Math.random() * 2 - 1) * (startJitterY + index * 0.18),
          }
          const end = {
            x: options.points[1].x + (Math.random() * 2 - 1) * (endJitterX + index * 2.2),
            y: isPrimaryBolt
              ? options.points[1].y + (Math.random() * 2 - 1) * Math.max(0.12, endJitterY * 0.2)
              : options.points[1].y +
                laneOffsetY +
                (Math.random() * 2 - 1) * (endJitterY + index * 0.32),
          }
          const points = buildLightningBolt(
            start,
            end,
            Math.max(4, options.Dgth5ybnq),
            roughness,
            minSegmentLength,
          )

          const lineWidth = Math.max(1.15, options.lineWidth + (Math.random() * 0.5 - 0.18))
          const glow = Math.max(5, options.Hfgr49fuaq * 0.65)
          const darkPasses = 2 + (Math.random() < 0.65 ? 1 : 0)
          const splitBase = Math.max(5.5, Math.min(width, height) * 0.024)
          const splitOneThird = buildSplitStrands(
            points,
            0.34,
            5,
            splitBase * 0.9,
            splitBase * 0.34,
          )
          const splitTwoThirds = buildSplitStrands(
            points,
            0.67,
            9,
            splitBase * 1.34,
            splitBase * 0.46,
          )

          ctx.save()
          ctx.globalCompositeOperation = 'source-over'
          for (let darkIndex = 0; darkIndex < darkPasses; darkIndex += 1) {
            const varied = varyBoltPoints(points, 0.6 + darkIndex * 0.38 + Math.random() * 0.35)
            drawLightningBolt(
              ctx,
              varied,
              lineWidth * (1.2 + darkIndex * 0.22),
              darkIndex % 2 === 0 ? 'rgba(118, 12, 12, 0.58)' : 'rgba(145, 20, 20, 0.48)',
              glow * (0.24 + darkIndex * 0.06),
            )
          }

          splitOneThird.forEach((strand, strandIndex) => {
            const bright = strandIndex === 1 || strandIndex === 3
            drawLightningBolt(
              ctx,
              strand,
              Math.max(0.72, lineWidth * (0.52 + (strandIndex % 3 === 0 ? 0.08 : 0))),
              bright ? 'rgba(220, 52, 52, 0.86)' : strandIndex % 2 === 0 ? 'rgba(136, 18, 18, 0.84)' : 'rgba(112, 14, 14, 0.8)',
              glow * (bright ? 0.34 : 0.26),
            )
            if (bright) {
              drawLightningBolt(
                ctx,
                strand,
                Math.max(0.36, lineWidth * 0.24),
                'rgba(255, 210, 210, 0.55)',
                0,
              )
            }
          })

          splitTwoThirds.forEach((strand, strandIndex) => {
            const bright = strandIndex === 1 || strandIndex === 4 || strandIndex === 7
            drawLightningBolt(
              ctx,
              strand,
              Math.max(0.62, lineWidth * (0.4 + (strandIndex % 4 === 0 ? 0.05 : 0))),
              bright ? 'rgba(205, 46, 46, 0.84)' : strandIndex % 2 === 0 ? 'rgba(128, 16, 16, 0.82)' : 'rgba(96, 12, 12, 0.78)',
              glow * (bright ? 0.32 : 0.24),
            )
            if (bright) {
              drawLightningBolt(
                ctx,
                strand,
                Math.max(0.32, lineWidth * 0.22),
                'rgba(255, 205, 205, 0.5)',
                0,
              )
            }
          })

          ctx.restore()

          drawLightningBolt(ctx, points, lineWidth * 1.08, 'rgba(228, 62, 62, 0.82)', glow * 0.42)
          if (Math.random() < 0.55) {
            drawLightningBolt(
              ctx,
              points,
              Math.max(0.65, lineWidth * 0.4),
              'rgba(255, 235, 235, 0.72)',
              0,
            )
          }
        }
      }

      frame = requestAnimationFrame(render)
    }

    frame = requestAnimationFrame(render)
    const resizeObserver = new ResizeObserver(() => ensureCanvas())
    resizeObserver.observe(host)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      if (canvas && canvas.parentNode === host) {
        host.removeChild(canvas)
      }
    }
  }, [startRatio.x, startRatio.y, endRatio.x, endRatio.y])

  return (
    <div className="lightning-wrapper">
      <div ref={lightningRef} className="lightning" />
    </div>
  )
}

type FightScenarioFrame = {
  a: LightningPoint
  b: LightningPoint
  impact: number
  beam: number
  pulseA: number
  pulseB: number
  ghostsA?: LightningPoint[]
  ghostsB?: LightningPoint[]
}

const mixNumber = (from: number, to: number, t: number) => from + (to - from) * clamp01(t)

const mixPoint = (from: LightningPoint, to: LightningPoint, t: number): LightningPoint => ({
  x: mixNumber(from.x, to.x, t),
  y: mixNumber(from.y, to.y, t),
})

const smoothStep = (value: number) => {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}

const wrap01 = (value: number) => value - Math.floor(value)

const pulse01 = (seconds: number, frequency: number) =>
  (Math.sin(seconds * Math.PI * 2 * frequency) + 1) / 2

const pointDistance = (left: LightningPoint, right: LightningPoint) =>
  Math.hypot(right.x - left.x, right.y - left.y)

const clampFightPoint = (point: LightningPoint): LightningPoint => ({
  x: Math.max(0.06, Math.min(0.94, point.x)),
  y: Math.max(0.12, Math.min(0.88, point.y)),
})

const clampFightFrame = (frame: FightScenarioFrame): FightScenarioFrame => {
  const a = clampFightPoint(frame.a)
  const b = clampFightPoint(frame.b)
  const naturalImpact = Math.max(0, (0.16 - pointDistance(a, b)) / 0.16)
  const ghostsA = frame.ghostsA?.map((point) => clampFightPoint(point))
  const ghostsB = frame.ghostsB?.map((point) => clampFightPoint(point))

  return {
    ...frame,
    a,
    b,
    impact: clamp01(Math.max(frame.impact, naturalImpact)),
    beam: clamp01(frame.beam),
    pulseA: clamp01(frame.pulseA),
    pulseB: clamp01(frame.pulseB),
    ghostsA,
    ghostsB,
  }
}

const orientFightScenarioFrame = (
  frame: FightScenarioFrame,
  lead: FightScenarioLead,
): FightScenarioFrame => {
  if (lead === 'a') return frame
  return {
    ...frame,
    a: frame.b,
    b: frame.a,
    pulseA: frame.pulseB,
    pulseB: frame.pulseA,
    ghostsA: frame.ghostsB,
    ghostsB: frame.ghostsA,
  }
}

const rgbaFromHex = (value: string, alpha: number) => {
  const normalized = value.trim().toLowerCase()
  const short = normalized.match(/^#([0-9a-f]{3})$/i)
  if (short) {
    const token = short[1]
    const r = Number.parseInt(`${token[0]}${token[0]}`, 16)
    const g = Number.parseInt(`${token[1]}${token[1]}`, 16)
    const b = Number.parseInt(`${token[2]}${token[2]}`, 16)
    return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha)})`
  }
  const full = normalized.match(/^#([0-9a-f]{6})$/i)
  if (full) {
    const token = full[1]
    const r = Number.parseInt(token.slice(0, 2), 16)
    const g = Number.parseInt(token.slice(2, 4), 16)
    const b = Number.parseInt(token.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha)})`
  }
  return `rgba(226, 232, 240, ${clamp01(alpha)})`
}

const buildFightScenarioFrame = (
  scenario: FightScenarioId,
  t: number,
  seconds: number,
): FightScenarioFrame => {
  const p = clamp01(t)

  if (scenario === 'orbit-harass') {
    const center = { x: 0.74, y: 0.5 }
    const angle = seconds * 11.2
    const orbit = {
      x: center.x + Math.cos(angle) * 0.2,
      y: center.y + Math.sin(angle) * 0.16,
    }
    const strike = { x: center.x - 0.03, y: center.y + Math.sin(angle * 0.5) * 0.02 }
    const cycle = wrap01(p * 4)
    let a = orbit
    let impact = 0
    if (cycle < 0.24) {
      const k = smoothStep(cycle / 0.24)
      a = mixPoint(orbit, strike, k)
      impact = Math.max(0, (k - 0.55) / 0.45)
    } else if (cycle < 0.42) {
      const k = smoothStep((cycle - 0.24) / 0.18)
      a = mixPoint(strike, orbit, k)
    }

    return clampFightFrame({
      a,
      b: {
        x: center.x + Math.sin(seconds * 2.2) * 0.01,
        y: center.y + Math.cos(seconds * 2.7) * 0.012,
      },
      impact,
      beam: impact * 0.82,
      pulseA: 0.42 + pulse01(seconds, 5.5) * 0.35,
      pulseB: 0.32 + pulse01(seconds, 1.3) * 0.18,
      ghostsA: [
        orbit,
        {
          x: center.x + Math.cos(angle - 0.9) * 0.2,
          y: center.y + Math.sin(angle - 0.9) * 0.16,
        },
      ],
    })
  }

  if (scenario === 'hit-and-run') {
    const cycle = wrap01(p * 2)
    const forward = cycle < 0.42
    const k = forward ? smoothStep(cycle / 0.42) : smoothStep((cycle - 0.42) / 0.58)
    const a = forward
      ? { x: mixNumber(0.16, 0.66, k), y: mixNumber(0.63, 0.48, k) }
      : { x: mixNumber(0.66, 0.22, k), y: mixNumber(0.48, 0.36, k) }
    const b = forward
      ? { x: mixNumber(0.72, 0.83, k), y: mixNumber(0.48, 0.56, k) }
      : { x: mixNumber(0.83, 0.7, k), y: mixNumber(0.56, 0.52, k) }

    return clampFightFrame({
      a,
      b,
      impact: forward ? Math.max(0, 1 - Math.abs(cycle - 0.36) / 0.08) : 0,
      beam: forward ? Math.max(0, 1 - Math.abs(cycle - 0.36) / 0.1) * 0.55 : 0,
      pulseA: 0.35 + pulse01(seconds, 4.3) * 0.3,
      pulseB: 0.28 + pulse01(seconds, 1.4) * 0.16,
    })
  }

  if (scenario === 'rush-ko') {
    const rush = smoothStep(Math.min(1, p * 2.5))
    const a = {
      x: mixNumber(0.1, 0.79, rush),
      y: 0.5 + Math.sin(seconds * 8.5) * 0.008 * (1 - rush),
    }
    const recoil = p > 0.34 ? smoothStep((p - 0.34) / 0.66) : 0
    const b = {
      x: mixNumber(0.79, 0.92, recoil),
      y: mixNumber(0.5, 0.66, recoil),
    }

    return clampFightFrame({
      a,
      b,
      impact: Math.max(0, 1 - Math.abs(p - 0.34) / 0.07),
      beam: Math.max(0, 1 - Math.abs(p - 0.34) / 0.08),
      pulseA: 0.5 + pulse01(seconds, 6.2) * 0.36,
      pulseB: 0.2 + (1 - recoil) * 0.28,
    })
  }

  if (scenario === 'clash-lock') {
    if (p < 0.35) {
      const k = smoothStep(p / 0.35)
      return clampFightFrame({
        a: { x: mixNumber(0.15, 0.48, k), y: mixNumber(0.52, 0.5, k) },
        b: { x: mixNumber(0.85, 0.52, k), y: mixNumber(0.48, 0.5, k) },
        impact: 0,
        beam: 0,
        pulseA: 0.32 + k * 0.25,
        pulseB: 0.32 + k * 0.25,
      })
    }

    const centerX = 0.5 + Math.sin(seconds * 1.2) * 0.02
    return clampFightFrame({
      a: {
        x: centerX - 0.05 + Math.sin(seconds * 7.5) * 0.012,
        y: 0.5 + Math.sin(seconds * 4.2) * 0.04,
      },
      b: {
        x: centerX + 0.05 - Math.sin(seconds * 7) * 0.012,
        y: 0.5 - Math.sin(seconds * 4.2) * 0.04,
      },
      impact: 0.6 + pulse01(seconds, 7.8) * 0.4,
      beam: 0.75,
      pulseA: 0.44 + pulse01(seconds, 4.8) * 0.3,
      pulseB: 0.44 + pulse01(seconds, 4.8) * 0.3,
    })
  }

  if (scenario === 'kite-zone') {
    const a = {
      x: 0.24 + Math.sin(seconds * 0.7) * 0.08 + Math.sin(seconds * 2.2) * 0.09,
      y: 0.5 + Math.sin(seconds * 1.3) * 0.17,
    }
    const chaseTarget = {
      x: a.x + 0.22,
      y: a.y + Math.sin(seconds * 2) * 0.03,
    }
    const b = {
      x: mixNumber(0.64, chaseTarget.x, 0.7),
      y: mixNumber(0.52, chaseTarget.y, 0.7),
    }
    const dist = pointDistance(a, b)
    const impact = dist < 0.15 ? (0.15 - dist) / 0.15 : 0

    return clampFightFrame({
      a,
      b,
      impact,
      beam: impact * 0.35,
      pulseA: 0.38 + pulse01(seconds, 3.8) * 0.28,
      pulseB: 0.3 + pulse01(seconds, 2.1) * 0.18,
    })
  }

  if (scenario === 'teleport-burst') {
    const nodes: LightningPoint[] = [
      { x: 0.27, y: 0.2 },
      { x: 0.4, y: 0.74 },
      { x: 0.63, y: 0.24 },
      { x: 0.34, y: 0.6 },
      { x: 0.67, y: 0.65 },
      { x: 0.42, y: 0.28 },
    ]
    const strike = { x: 0.72, y: 0.5 }
    const position = p * nodes.length
    const step = Math.floor(position) % nodes.length
    const local = position - Math.floor(position)
    const next = (step + 1) % nodes.length

    let a = nodes[step]
    let impact = 0
    if (local < 0.24) {
      const k = smoothStep(local / 0.24)
      a = mixPoint(nodes[step], strike, k)
      impact = 1 - k * 0.2
    } else {
      const k = smoothStep((local - 0.24) / 0.76)
      a = mixPoint(strike, nodes[next], k)
    }

    return clampFightFrame({
      a,
      b: {
        x: strike.x + Math.sin(seconds * 3.6) * 0.012,
        y: strike.y + Math.cos(seconds * 2.4) * 0.015,
      },
      impact,
      beam: impact * 0.86,
      pulseA: 0.58 + pulse01(seconds, 9) * 0.3,
      pulseB: 0.32 + pulse01(seconds, 1.4) * 0.15,
      ghostsA: [nodes[step], nodes[(step + nodes.length - 1) % nodes.length], nodes[(step + nodes.length - 2) % nodes.length]],
    })
  }

  if (scenario === 'feint-counter') {
    let a: LightningPoint
    let b: LightningPoint
    if (p < 0.3) {
      const k = smoothStep(p / 0.3)
      a = mixPoint({ x: 0.18, y: 0.55 }, { x: 0.5, y: 0.49 }, k)
      b = { x: 0.76, y: 0.5 }
    } else if (p < 0.52) {
      const k = smoothStep((p - 0.3) / 0.22)
      a = mixPoint({ x: 0.5, y: 0.49 }, { x: 0.34, y: 0.6 }, k)
      b = mixPoint({ x: 0.76, y: 0.5 }, { x: 0.58, y: 0.46 }, k)
    } else if (p < 0.78) {
      const k = smoothStep((p - 0.52) / 0.26)
      a = mixPoint({ x: 0.34, y: 0.6 }, { x: 0.69, y: 0.45 }, k)
      b = mixPoint({ x: 0.58, y: 0.46 }, { x: 0.47, y: 0.62 }, k)
    } else {
      const k = smoothStep((p - 0.78) / 0.22)
      a = mixPoint({ x: 0.69, y: 0.45 }, { x: 0.26, y: 0.52 }, k)
      b = mixPoint({ x: 0.47, y: 0.62 }, { x: 0.76, y: 0.5 }, k)
    }

    return clampFightFrame({
      a,
      b,
      impact: Math.max(0, 1 - Math.abs(p - 0.68) / 0.09),
      beam: Math.max(0, 1 - Math.abs(p - 0.68) / 0.13) * 0.62,
      pulseA: 0.4 + pulse01(seconds, 4.1) * 0.26,
      pulseB: 0.3 + pulse01(seconds, 2.5) * 0.2,
    })
  }

  if (scenario === 'grapple-pin') {
    if (p < 0.32) {
      const k = smoothStep(p / 0.32)
      return clampFightFrame({
        a: mixPoint({ x: 0.16, y: 0.54 }, { x: 0.6, y: 0.52 }, k),
        b: mixPoint({ x: 0.8, y: 0.5 }, { x: 0.72, y: 0.52 }, k),
        impact: k * 0.45,
        beam: k * 0.22,
        pulseA: 0.34 + k * 0.18,
        pulseB: 0.3 + k * 0.14,
      })
    }
    if (p < 0.6) {
      return clampFightFrame({
        a: { x: 0.64 + Math.sin(seconds * 5) * 0.018, y: 0.49 + Math.sin(seconds * 6) * 0.05 },
        b: { x: 0.68 - Math.sin(seconds * 5) * 0.012, y: 0.51 - Math.sin(seconds * 6) * 0.05 },
        impact: 0.76 + pulse01(seconds, 9) * 0.24,
        beam: 0.68,
        pulseA: 0.48 + pulse01(seconds, 5.2) * 0.22,
        pulseB: 0.48 + pulse01(seconds, 5.2) * 0.22,
      })
    }

    const k = smoothStep((p - 0.6) / 0.4)
    return clampFightFrame({
      a: mixPoint({ x: 0.64, y: 0.49 }, { x: 0.83, y: 0.58 }, k),
      b: mixPoint({ x: 0.68, y: 0.51 }, { x: 0.9, y: 0.67 }, k),
      impact: 0.42 + (1 - k) * 0.26,
      beam: 0.38 + (1 - k) * 0.16,
      pulseA: 0.44 + pulse01(seconds, 4.2) * 0.2,
      pulseB: 0.4 + pulse01(seconds, 3.4) * 0.18,
    })
  }

  if (scenario === 'corner-trap') {
    if (p < 0.55) {
      const k = smoothStep(p / 0.55)
      return clampFightFrame({
        a: mixPoint({ x: 0.24, y: 0.52 }, { x: 0.74, y: 0.38 }, k),
        b: mixPoint({ x: 0.7, y: 0.5 }, { x: 0.9, y: 0.22 }, k),
        impact: k * 0.5,
        beam: k * 0.26,
        pulseA: 0.36 + k * 0.2,
        pulseB: 0.28 + (1 - k) * 0.15,
      })
    }
    const angle = seconds * 8
    return clampFightFrame({
      a: {
        x: 0.84 + Math.cos(angle) * 0.08,
        y: 0.28 + Math.sin(angle) * 0.06,
      },
      b: {
        x: 0.9 + Math.sin(seconds * 4.6) * 0.012,
        y: 0.22 + Math.cos(seconds * 5.2) * 0.012,
      },
      impact: Math.max(0, Math.sin(seconds * 8) * 0.5 + 0.5),
      beam: 0.46,
      pulseA: 0.46 + pulse01(seconds, 5) * 0.25,
      pulseB: 0.24 + pulse01(seconds, 2) * 0.14,
    })
  }

  if (scenario === 'regen-attrition') {
    const strikeWave = Math.abs(Math.sin(seconds * 5.2))
    const b = {
      x: 0.77 + Math.sin(seconds * 1.1) * 0.012,
      y: 0.5 + Math.sin(seconds * 2.4) * 0.03,
    }
    return clampFightFrame({
      a: {
        x: 0.28 + strikeWave * 0.42,
        y: 0.5 + Math.sin(seconds * 3.1) * 0.08,
      },
      b,
      impact: strikeWave > 0.75 ? (strikeWave - 0.75) / 0.25 : 0,
      beam: strikeWave > 0.75 ? (strikeWave - 0.75) / 0.25 : 0,
      pulseA: 0.36 + pulse01(seconds, 4.8) * 0.2,
      pulseB: 0.48 + pulse01(seconds, 2.4) * 0.5,
      ghostsB: [
        { x: b.x - 0.014, y: b.y - 0.02 },
        { x: b.x + 0.016, y: b.y + 0.018 },
      ],
    })
  }

  if (scenario === 'berserk-overextend') {
    let a: LightningPoint
    let b: LightningPoint
    if (p < 0.46) {
      const k = smoothStep(p / 0.46)
      a = mixPoint({ x: 0.2, y: 0.56 }, { x: 0.28, y: 0.62 }, k)
      b = mixPoint({ x: 0.84, y: 0.44 }, { x: 0.34, y: 0.5 }, k)
    } else if (p < 0.68) {
      const k = smoothStep((p - 0.46) / 0.22)
      a = mixPoint({ x: 0.28, y: 0.62 }, { x: 0.24, y: 0.38 }, k)
      b = mixPoint({ x: 0.34, y: 0.5 }, { x: 0.42, y: 0.74 }, k)
    } else {
      const k = smoothStep((p - 0.68) / 0.32)
      a = mixPoint({ x: 0.24, y: 0.38 }, { x: 0.66, y: 0.48 }, k)
      b = mixPoint({ x: 0.42, y: 0.74 }, { x: 0.84, y: 0.5 }, k)
    }

    return clampFightFrame({
      a,
      b,
      impact: Math.max(0, 1 - Math.abs(p - 0.76) / 0.08),
      beam: Math.max(0, 1 - Math.abs(p - 0.76) / 0.1) * 0.74,
      pulseA: 0.44 + pulse01(seconds, 4.2) * 0.28,
      pulseB: 0.3 + pulse01(seconds, 2.6) * 0.18,
    })
  }

  const a = {
    x: 0.34 + Math.sin(seconds * 1.7) * 0.22 + Math.sin(seconds * 7.8) * 0.05,
    y: 0.5 + Math.sin(seconds * 2.4) * 0.18,
  }
  const b = {
    x: 0.66 + Math.sin(seconds * 1.9 + 1.2) * 0.22 + Math.sin(seconds * 8.3 + 0.2) * 0.05,
    y: 0.5 + Math.sin(seconds * 2.6 + 0.7) * 0.18,
  }
  const dist = pointDistance(a, b)
  const impact = dist < 0.2 ? (0.2 - dist) / 0.2 : 0

  return clampFightFrame({
    a,
    b,
    impact,
    beam: impact * 0.55,
    pulseA: 0.38 + pulse01(seconds, 6.2) * 0.3,
    pulseB: 0.38 + pulse01(seconds, 6.8) * 0.3,
  })
}

function FightScenarioCanvas({
  scenario,
  colorA,
  colorB,
  lead = 'a',
}: {
  scenario: FightScenarioId
  colorA: string
  colorB: string
  lead?: FightScenarioLead
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let frame = 0
    let startTime = 0
    let canvas: HTMLCanvasElement | null = null
    let context: CanvasRenderingContext2D | null = null
    let width = 0
    let height = 0
    const dpr = window.devicePixelRatio || 1
    const trailA: LightningPoint[] = []
    const trailB: LightningPoint[] = []

    const ensureCanvas = () => {
      if (!canvas) {
        canvas = document.createElement('canvas')
        canvas.className = 'lightning-canvas'
        host.appendChild(canvas)
      }

      width = Math.max(180, Math.floor(host.clientWidth))
      height = Math.max(92, Math.floor(host.clientHeight))
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context = canvas.getContext('2d')
      if (context) {
        context.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
    }

    const toPixels = (point: LightningPoint): LightningPoint => ({
      x: point.x * width,
      y: point.y * height,
    })

    const pushTrail = (trail: LightningPoint[], point: LightningPoint) => {
      trail.push(point)
      if (trail.length > 24) trail.shift()
    }

    const drawTrail = (
      ctx: CanvasRenderingContext2D,
      trail: LightningPoint[],
      color: string,
      widthBase: number,
    ) => {
      if (trail.length < 2) return
      for (let index = 1; index < trail.length; index += 1) {
        const ratio = index / trail.length
        const previous = trail[index - 1]
        const current = trail[index]
        ctx.beginPath()
        ctx.moveTo(previous.x, previous.y)
        ctx.lineTo(current.x, current.y)
        ctx.lineWidth = Math.max(0.8, widthBase * ratio)
        ctx.lineCap = 'round'
        ctx.strokeStyle = rgbaFromHex(color, 0.07 + ratio * 0.35)
        ctx.shadowColor = rgbaFromHex(color, 0.35)
        ctx.shadowBlur = 6 + ratio * 8
        ctx.stroke()
      }
    }

    const drawGhosts = (
      ctx: CanvasRenderingContext2D,
      ghosts: LightningPoint[] | undefined,
      color: string,
    ) => {
      if (!ghosts?.length) return
      ghosts.forEach((ghost, index) => {
        const point = toPixels(ghost)
        const alpha = 0.12 - index * 0.025
        if (alpha <= 0) return
        ctx.beginPath()
        ctx.arc(point.x, point.y, 4 + (ghosts.length - index) * 0.8, 0, Math.PI * 2)
        ctx.fillStyle = rgbaFromHex(color, alpha)
        ctx.fill()
      })
    }

    const drawFighter = (
      ctx: CanvasRenderingContext2D,
      point: LightningPoint,
      color: string,
      baseRadius: number,
      pulse: number,
    ) => {
      const radius = baseRadius + pulse * 2.4
      ctx.beginPath()
      ctx.arc(point.x, point.y, radius * 2.35, 0, Math.PI * 2)
      ctx.fillStyle = rgbaFromHex(color, 0.08 + pulse * 0.12)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = rgbaFromHex(color, 0.95)
      ctx.shadowColor = rgbaFromHex(color, 0.85)
      ctx.shadowBlur = 14 + pulse * 12
      ctx.fill()
      ctx.shadowBlur = 0
    }

    ensureCanvas()

    const render = (time: number) => {
      if (!context) {
        frame = requestAnimationFrame(render)
        return
      }
      if (startTime === 0) startTime = time
      const elapsedSeconds = (time - startTime) / 1000
      const cycle = wrap01(elapsedSeconds / 3.6)
      const scenarioFrame = orientFightScenarioFrame(
        buildFightScenarioFrame(scenario, cycle, elapsedSeconds),
        lead,
      )
      const pointA = toPixels(scenarioFrame.a)
      const pointB = toPixels(scenarioFrame.b)
      pushTrail(trailA, pointA)
      pushTrail(trailB, pointB)

      const ctx = context
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = 'rgba(2, 6, 23, 0.88)'
      ctx.fillRect(0, 0, width, height)

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, height * 0.5)
      ctx.lineTo(width, height * 0.5)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)'
      ctx.beginPath()
      ctx.moveTo(width * 0.333, 0)
      ctx.lineTo(width * 0.333, height)
      ctx.moveTo(width * 0.666, 0)
      ctx.lineTo(width * 0.666, height)
      ctx.stroke()

      drawTrail(ctx, trailB, colorB, 3.6)
      drawTrail(ctx, trailA, colorA, 3.6)
      drawGhosts(ctx, scenarioFrame.ghostsA, colorA)
      drawGhosts(ctx, scenarioFrame.ghostsB, colorB)

      if (scenarioFrame.beam > 0.02) {
        ctx.beginPath()
        ctx.moveTo(pointA.x, pointA.y)
        ctx.lineTo(pointB.x, pointB.y)
        ctx.lineWidth = 1.5 + scenarioFrame.beam * 2.6
        ctx.strokeStyle = `rgba(248, 250, 252, ${0.1 + scenarioFrame.beam * 0.34})`
        ctx.shadowColor = `rgba(248, 113, 113, ${0.25 + scenarioFrame.beam * 0.35})`
        ctx.shadowBlur = 10 + scenarioFrame.beam * 14
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      if (scenarioFrame.impact > 0.03) {
        const center = {
          x: (pointA.x + pointB.x) / 2,
          y: (pointA.y + pointB.y) / 2,
        }
        const radius = 7 + scenarioFrame.impact * 17
        ctx.beginPath()
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(248, 250, 252, ${0.15 + scenarioFrame.impact * 0.48})`
        ctx.lineWidth = 1.2 + scenarioFrame.impact * 1.8
        ctx.stroke()
      }

      drawFighter(ctx, pointB, colorB, 5.2, scenarioFrame.pulseB)
      drawFighter(ctx, pointA, colorA, 5.2, scenarioFrame.pulseA)
      frame = requestAnimationFrame(render)
    }

    frame = requestAnimationFrame(render)
    const resizeObserver = new ResizeObserver(() => ensureCanvas())
    resizeObserver.observe(host)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      if (canvas && canvas.parentNode === host) {
        host.removeChild(canvas)
      }
    }
  }, [colorA, colorB, lead, scenario])

  return <div ref={hostRef} className="relative h-36 w-full overflow-hidden rounded-md border border-slate-600/70 bg-slate-950/90" />
}

const DEFAULT_WINNER_CV_A = [
  'Doomsday',
  'Brainiac',
  "Mongul",
  'Pariah',
  "H'el",
  'Rogol Zaar',
  'Ulysses',
  'Wraith',
]

const DEFAULT_WINNER_CV_B = [
  'Thor',
  'Hulk',
  'Blue Marvel',
  'Juggernaut',
  'Namora',
  'Winter Guard',
  'Rogue',
  'Gambit',
]

const DEFAULT_PROFILE_FACTS_A: FighterFact[] = [
  { title: 'Style', text: 'Range control and pace control' },
  { title: 'Advantage', text: 'Tactical discipline' },
  { title: 'Mentality', text: 'Win by decision, avoid collateral damage' },
]

const DEFAULT_PROFILE_FACTS_B: FighterFact[] = [
  { title: 'Style', text: 'Aggressive distance closing' },
  { title: 'Advantage', text: 'Extreme regeneration' },
  { title: 'Mentality', text: 'Break the opponent at any cost' },
]

const DEFAULT_PROFILE_FACTS_A_PL: FighterFact[] = [
  { title: 'Styl', text: 'Kontrola dystansu i tempa' },
  { title: 'Atut', text: 'Dyscyplina taktyczna' },
  { title: 'MentalnoĹ›Ä‡', text: 'WygraÄ‡ decyzjÄ…, uniknÄ…Ä‡ zniszczeĹ„' },
]

const DEFAULT_PROFILE_FACTS_B_PL: FighterFact[] = [
  { title: 'Styl', text: 'Agresywne skracanie dystansu' },
  { title: 'Atut', text: 'Nieludzka regeneracja' },
  { title: 'MentalnoĹ›Ä‡', text: 'ZĹ‚amaÄ‡ przeciwnika za wszelkÄ… cenÄ™' },
]

const defaultFactsFor = (side: 'a' | 'b', language: Language): FighterFact[] => {
  const source =
    language === 'pl'
      ? side === 'a'
        ? DEFAULT_PROFILE_FACTS_A_PL
        : DEFAULT_PROFILE_FACTS_B_PL
      : side === 'a'
        ? DEFAULT_PROFILE_FACTS_A
        : DEFAULT_PROFILE_FACTS_B
  return source.map((item) => ({ ...item }))
}

function HudBarsTemplate({
  rows,
  fighterA,
  fighterB,
  averageA,
  averageB,
  title,
  subtitle,
  templateBlocks,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['hud-bars'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const threatLevel = pickTemplateField(blockFields, ['threat_level']) || tr('WYSOKI', 'HIGH')
  const integrity = pickTemplateField(blockFields, ['integrity', 'data_integrity']) || '99.9%'
  const profileMode = pickTemplateField(blockFields, ['profile_mode']) || 'VS'
  const scale = pickTemplateField(blockFields, ['scale']) || '0-100'

  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 border-b border-cyan-300/25 pb-2 text-[11px] text-slate-300">
        <div>
          <p className="uppercase tracking-[0.16em]">{tr('Poziom zagroĹĽenia', 'Threat level')}: {threatLevel}</p>
          <p className="uppercase tracking-[0.16em]">{tr('IntegralnoĹ›Ä‡ danych', 'Data integrity')}: {integrity}</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{headerText}</p>
          <h2 className="text-xl uppercase tracking-[0.08em] text-slate-50">{subText}</h2>
        </div>
        <div className="text-right">
          <p className="uppercase tracking-[0.16em]">{tr('Tryb profilu', 'Profile mode')}: {profileMode}</p>
          <p className="uppercase tracking-[0.16em]">{tr('Skala', 'Scale')}: {scale}</p>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
        <div className="rounded-lg border border-white/20 bg-black/25 px-3 py-2">
          <p className="uppercase tracking-[0.16em] text-slate-300">{fighterA.name}</p>
          <p className="font-semibold" style={{ color: fighterA.color }}>
            {tr('Ĺšr.', 'Avg')} {averageA.toFixed(1)}
          </p>
        </div>
        <div className="rounded-lg border border-white/20 bg-black/25 px-3 py-2">
          <p className="uppercase tracking-[0.16em] text-slate-300">{fighterB.name}</p>
          <p className="font-semibold" style={{ color: fighterB.color }}>
            {tr('Ĺšr.', 'Avg')} {averageB.toFixed(1)}
          </p>
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1">
        <div className="grid grid-cols-[190px_1fr] items-center gap-4 px-1 text-[11px] uppercase tracking-[0.15em] text-slate-400">
          <p>{tr('Parametr', 'Parameter')}</p>
          <div className="flex items-center justify-between">
            <span>{tr('Wynik (0-100)', 'Score (0-100)')}</span>
            <span className="text-[10px]">25 50 75 100</span>
          </div>
        </div>
        <div className="mt-2 space-y-2">
          {rows.map((row, index) => (
            <div
              key={`row-${row.id}`}
              className="grid h-[50px] grid-cols-[190px_1fr] items-center gap-4 rounded border border-slate-700/45 bg-black/22 px-2"
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              <div className="truncate text-[15px] text-slate-100">{row.label}</div>
              <div className="space-y-1">
                <div className="grid grid-cols-[1fr_30px] items-center gap-2">
                  <div className="h-3 overflow-hidden rounded border border-slate-700/70 bg-black/55">
                    <div className="h-full rounded-r transition-[width] duration-700" style={{ width: `${row.a}%`, backgroundColor: fighterA.color }} />
                  </div>
                  <span className="text-right text-sm text-slate-200">{row.a}</span>
                </div>
                <div className="grid grid-cols-[1fr_30px] items-center gap-2">
                  <div className="h-3 overflow-hidden rounded border border-slate-700/70 bg-black/55">
                    <div className="h-full rounded-r transition-[width] duration-700" style={{ width: `${row.b}%`, backgroundColor: fighterB.color }} />
                  </div>
                  <span className="text-right text-sm text-slate-200">{row.b}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RadarBriefTemplate({
  rows,
  fighterA,
  fighterB,
  averageA,
  averageB,
  title,
  subtitle,
  templateBlocks,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['radar-brief'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const leftHeader = pickTemplateField(blockFields, ['left_header']) || tr('NIEBIESKI NAROĹ»NIK', 'BLUE CORNER')
  const rightHeader = pickTemplateField(blockFields, ['right_header']) || tr('CZERWONY NAROĹ»NIK', 'RED CORNER')
  const drawHeader = pickTemplateField(blockFields, ['draw_header']) || tr('Kategorie remisowe', 'Draw categories')
  const leftAdvantages = rows.filter((row) => row.winner === 'a')
  const rightAdvantages = rows.filter((row) => row.winner === 'b')
  const drawRows = rows.filter((row) => row.winner === 'draw')
  const fighterAText = fighterA.name || 'Fighter A'
  const fighterBText = fighterB.name || 'Fighter B'
  const favoriteSide: 'a' | 'b' | 'draw' =
    averageA === averageB ? 'draw' : averageA > averageB ? 'a' : 'b'
  const favorite =
    pickTemplateField(blockFields, ['favorite_label', 'favorite']) ||
    (averageA === averageB
      ? tr('Remis', 'Draw')
      : averageA > averageB
        ? `${fighterAText} ${tr('faworyt', 'favorite')}`
        : `${fighterBText} ${tr('faworyt', 'favorite')}`)
  // Position stamp at ~3/4 of winner panel width, not the whole row.
  const favoriteLeft = favoriteSide === 'a' ? '37.5%' : favoriteSide === 'b' ? '87.5%' : '50%'
  const favoriteRotation = favoriteSide === 'a' ? -12 : favoriteSide === 'b' ? 12 : 0

  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <h2 className="text-center text-[38px] uppercase leading-none tracking-[0.04em] text-slate-50 sm:text-[52px]" style={{ fontFamily: 'var(--font-display)' }}>
        {headerText}
      </h2>
      <p className="mt-1 text-center text-[12px] uppercase tracking-[0.16em] text-slate-300">{subText}</p>

      <div className="mt-3 grid flex-1 grid-cols-[1fr_1.3fr_1fr] gap-3">
        <div className="min-h-0 rounded-xl border border-slate-500/45 bg-black/26 p-2">
          <p className="text-[12px] uppercase tracking-[0.16em]" style={{ color: fighterA.color }}>
            {leftHeader} // {fighterAText}
          </p>
          <div className="mt-2 max-h-full space-y-2 overflow-y-auto pr-1">
            {leftAdvantages.length ? (
              leftAdvantages.map((row) => (
                <div
                  key={`left-adv-${row.id}`}
                  className="rounded border px-2 py-2"
                  style={{ borderColor: `${fighterA.color}66`, backgroundColor: `${fighterA.color}18` }}
                >
                  <p className="text-[12px] uppercase tracking-[0.15em]" style={{ color: fighterA.color }}>{row.label}</p>
                  <p className="mt-1 text-[16px] leading-tight text-slate-100">
                    {row.a} &gt; {row.b}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded border border-slate-600/55 bg-black/28 px-2 py-2 text-sm text-slate-300">
                {tr('Brak przewagi kategorii po lewej stronie.', 'No category edge for the left side.')}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-500/50 bg-black/26 p-2">
          <div className="h-[78%]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={rows} cx="50%" cy="44%" outerRadius="74%" margin={{ top: 12, right: 28, bottom: 38, left: 28 }}>
                <PolarGrid stroke="rgba(148,163,184,0.35)" />
                <PolarAngleAxis dataKey="label" tick={{ fill: '#CBD5E1', fontSize: 12 }} />
                <Radar dataKey="a" stroke={fighterA.color} fill={fighterA.color} fillOpacity={0.33} />
                <Radar dataKey="b" stroke={fighterB.color} fill={fighterB.color} fillOpacity={0.28} />
                <Tooltip
                  contentStyle={{
                    border: '1px solid rgba(148,163,184,0.4)',
                    borderRadius: '12px',
                    background: 'rgba(2,6,23,0.92)',
                    color: '#F1F5F9',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 rounded-lg border border-slate-600/60 bg-black/35 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">{drawHeader}</p>
            {drawRows.length ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {drawRows.map((row) => (
                  <div
                    key={`draw-${row.id}`}
                    className="rounded border border-slate-500/75 bg-slate-900/75 px-2 py-2"
                  >
                    <p className="text-[11px] uppercase tracking-[0.15em] text-slate-300">{row.label}</p>
                    <p className="mt-1 text-[14px] leading-tight text-slate-100">
                      {row.a} = {row.b}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-[12px] text-slate-400">{tr('Brak remisĂłw w bieĹĽÄ…cym ukĹ‚adzie.', 'No draws in current setup.')}</p>
            )}
          </div>
        </div>

        <div className="min-h-0 rounded-xl border border-slate-500/45 bg-black/26 p-2">
          <p className="text-[12px] uppercase tracking-[0.16em]" style={{ color: fighterB.color }}>
            {rightHeader} // {fighterBText}
          </p>
          <div className="mt-2 max-h-full space-y-2 overflow-y-auto pr-1">
            {rightAdvantages.length ? (
              rightAdvantages.map((row) => (
                <div
                  key={`right-adv-${row.id}`}
                  className="rounded border px-2 py-2"
                  style={{ borderColor: `${fighterB.color}66`, backgroundColor: `${fighterB.color}18` }}
                >
                  <p className="text-[12px] uppercase tracking-[0.15em]" style={{ color: fighterB.color }}>{row.label}</p>
                  <p className="mt-1 text-[16px] leading-tight text-slate-100">
                    {row.b} &gt; {row.a}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded border border-slate-600/55 bg-black/28 px-2 py-2 text-sm text-slate-300">
                {tr('Brak przewagi kategorii po prawej stronie.', 'No category edge for the right side.')}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg border px-4 py-3 text-center" style={{ borderColor: `${fighterA.color}88`, backgroundColor: `${fighterA.color}20` }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-slate-200">{fighterAText}</p>
          <p className="text-[42px] font-semibold leading-none" style={{ color: fighterA.color }}>
            {Math.round(averageA)}
          </p>
        </div>
        <div className="rounded-lg border px-4 py-3 text-center" style={{ borderColor: `${fighterB.color}88`, backgroundColor: `${fighterB.color}20` }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-slate-200">{fighterBText}</p>
          <p className="text-[42px] font-semibold leading-none" style={{ color: fighterB.color }}>
            {Math.round(averageB)}
          </p>
        </div>
      </div>

      <div
        className="favorite-stamp absolute bottom-4 -translate-x-1/2 px-4 py-2 text-lg uppercase tracking-[0.04em]"
        style={{
          left: favoriteLeft,
          transform: `translateX(-50%) rotate(${favoriteRotation}deg)`,
        }}
      >
        {favorite}
      </div>
    </div>
  )
}

function TacticalBoardTemplate({
  rows,
  fighterA,
  fighterB,
  title,
  subtitle,
  templateBlocks,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['tactical-board'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const boardHeader = pickTemplateField(blockFields, ['left_header', 'categories_header']) || tr('Kategorie', 'Categories')
  const realityHeader = pickTemplateField(blockFields, ['right_header', 'reality_header']) || tr('RzeczywistoĹ›Ä‡ walki', 'Combat reality')
  const linearLabel = pickTemplateField(blockFields, ['linear_label']) || tr('ODCINEK LINIOWY', 'LINEAR SEGMENT')
  const chaosLabel = pickTemplateField(blockFields, ['chaos_label']) || tr('ODCINEK CHAOSU', 'CHAOS SEGMENT')
  const laneLabel = pickTemplateField(blockFields, ['lane', 'line_1', 'line1']) || tr('Aktywna linia taktyczna', 'Tactical lane active')
  const tiles = rows.slice(0, 9)
  const splitX = 50
  const linearStartX = 8
  const chaosEndX = 92
  const stablePoints = `${linearStartX},50 ${splitX},50`
  const linearLabelX = 25
  const chaosLabelX = 75

  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <div className="border-b border-slate-300/25 pb-2">
        <h2 className="text-3xl uppercase tracking-[0.06em] text-slate-50" style={{ fontFamily: 'var(--font-display)' }}>
          {headerText}
        </h2>
        <p className="text-sm uppercase tracking-[0.16em] text-slate-300">{subText}</p>
      </div>

      <div className="mt-3 grid min-h-0 flex-1 grid-cols-2 gap-3">
        <div className="min-h-0 rounded-xl border border-slate-400/35 bg-black/25 p-3">
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-slate-300">{boardHeader}</p>
          <div className="grid h-full grid-cols-3 gap-2">
            {tiles.map((row, index) => {
              const Icon = iconForCategory(row.id, index)
              const isDraw = row.winner === 'draw'
              const winnerColor = isDraw ? '#E2E8F0' : row.winner === 'a' ? fighterA.color : fighterB.color
              return (
                <div key={`tile-${row.id}`} className="relative rounded-lg border border-slate-500/45 bg-slate-900/75 p-2">
                  <div className="mb-2 flex items-center justify-center rounded-md border border-slate-600/60 bg-black/35 py-2">
                    <Icon size={31} color={winnerColor} />
                  </div>
                  <div className="flex min-h-[56px] items-center justify-center rounded-md border border-slate-600/45 bg-black/25 px-1">
                    <p className="text-center text-[18px] font-semibold uppercase leading-tight tracking-[0.04em]" style={{ color: winnerColor }}>
                      {row.label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="min-h-0 rounded-xl border border-slate-400/35 bg-black/25 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">{realityHeader}</p>
          <div className="mt-2 h-[92%] rounded-lg border border-slate-600/55 bg-slate-950/65 p-2">
            <div className="relative h-full w-full overflow-hidden rounded-md">
              <LightningCanvas
                startRatio={{ x: splitX / 100, y: 0.5 }}
                endRatio={{ x: chaosEndX / 100, y: 0.5 }}
              />
              <svg viewBox="0 0 100 100" className="relative z-10 h-full w-full">
                <line
                  x1={splitX}
                  y1="8"
                  x2={splitX}
                  y2="92"
                  stroke="rgba(148,163,184,0.35)"
                  strokeWidth="0.7"
                  strokeDasharray="2 2"
                />
                <text x={linearLabelX} y="14" fill="#67e8f9" fontSize="4" letterSpacing="0.8" textAnchor="middle">
                  {linearLabel}
                </text>
                <text x={chaosLabelX} y="14" fill="#fda4af" fontSize="4" letterSpacing="0.8" textAnchor="middle">
                  {chaosLabel}
                </text>

                <polyline points={stablePoints} fill="none" stroke="#22d3ee" strokeWidth="1.7" />
                <polyline points={stablePoints} fill="none" stroke="rgba(34,211,238,0.3)" strokeWidth="3.2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 h-9 rounded border border-amber-300/45 bg-[linear-gradient(90deg,rgba(234,179,8,0.14),rgba(234,179,8,0.45),rgba(234,179,8,0.14))] px-4 py-2 text-center text-sm uppercase tracking-[0.22em] text-amber-100">
        {laneLabel}
      </div>
    </div>
  )
}

function App() {
  const defaultLanguage: Language = 'en'
  const [language, setLanguage] = useState<Language>(defaultLanguage)
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const initialTemplate = localizeTemplatePreset(TEMPLATE_PRESETS[0], defaultLanguage)
  const localizedTemplates = useMemo(
    () => TEMPLATE_PRESETS.map((template) => localizeTemplatePreset(template, language)),
    [language],
  )
  const importTxtBlueprint = useMemo(() => buildImportTxtBlueprint(language), [language])
  const ui = useMemo(() => {
    const t = (pl: string, en: string) => pickLang(language, pl, en)
    return {
      readyTemplates: t('Gotowe Templaty', 'Ready Templates'),
      title: t('TytuĹ‚', 'Title'),
      subtitle: t('PodtytuĹ‚', 'Subtitle'),
      frame: t('Ramka', 'Frame'),
      theme: t('Motyw', 'Theme'),
      dataSource: t('ĹąrĂłdĹ‚o Danych', 'Data Source'),
      homeTitle: t('Panel Walk', 'Fight Hub'),
      homeSubtitle: t('Wgraj dane walki, zatwierdĹş i wybierz pojedynek z listy.', 'Upload fight data, confirm, then pick a matchup from the list.'),
      fightsLibrary: t('Lista Walk', 'Fight List'),
      noFights: t('Brak zapisanych walk. Dodaj pierwszÄ… poniĹĽej.', 'No saved fights yet. Add your first one below.'),
      createFight: t('ZatwierdĹş i dodaj walkÄ™', 'Confirm and add fight'),
      openFight: t('OtwĂłrz walkÄ™', 'Open fight'),
      deleteFight: t('UsuĹ„', 'Delete'),
      deleteFightAria: t('UsuĹ„ walkÄ™', 'Delete fight'),
      deleteFightConfirm: t('Czy na pewno usunÄ…Ä‡ tÄ™ walkÄ™?', 'Are you sure you want to delete this fight?'),
      backToLibrary: t('PowrĂłt do listy walk', 'Back to fight list'),
      draftNeedTxt: t('Najpierw wgraj poprawny plik TXT.', 'Upload a valid TXT file first.'),
      draftNeedPortraits: t('Dodaj oba portrety (A i B), potem zatwierdĹş.', 'Add both portraits (A and B) before confirming.'),
      fightAdded: t('Walka dodana do listy.', 'Fight added to the list.'),
      fightLoaded: t('Walka zaĹ‚adowana.', 'Fight loaded.'),
      uploadHelp: t(
        'Wgraj jeden plik `.txt` (sekcje 1-8 + opcjonalna 9 kolejnoĹ›Ä‡ templatek) oraz dwa portrety poniĹĽej.',
        'Upload one `.txt` with sections 1-8 (+ optional 9 template order) and two portraits below.',
      ),
      matchTxt: t('Plik Walki TXT', 'Match TXT'),
      portraitA: t('Portret A (lewy)', 'Portrait A (left)'),
      portraitB: t('Portret B (prawy)', 'Portrait B (right)'),
      dropTxtHint: t('PrzeciÄ…gnij plik TXT tutaj lub kliknij, aby wybraÄ‡.', 'Drag a TXT file here or click to browse.'),
      dropImageHint: t('PrzeciÄ…gnij obraz tutaj lub kliknij, aby wybraÄ‡.', 'Drag an image here or click to browse.'),
      invalidTxtType: t('Niepoprawny plik. Wymagany format .txt.', 'Invalid file. A .txt file is required.'),
      invalidImageType: t('Niepoprawny plik obrazu. Wymagany format graficzny.', 'Invalid image file. A graphic format is required.'),
      txtLoadedLabel: t('Plik zaĹ‚adowany', 'File loaded'),
      txtNotLoadedLabel: t('Plik jeszcze niezaĹ‚adowany', 'No file loaded yet'),
      pickTxtButton: t('Wybierz TXT', 'Choose TXT'),
      pickImageButton: t('Wybierz obraz', 'Choose image'),
      noFileSelected: t('Brak wybranego pliku', 'No file selected'),
      importFile: t('Plik importu', 'Import file'),
      notLoaded: t('jeszcze nie wczytano', 'not loaded yet'),
      templateOrderLoaded: t('Wczytana kolejnoĹ›Ä‡ templatek', 'Template order loaded'),
      blocksDetected: t('Wykryte bloki templatek', 'Template blocks detected'),
      copyBlueprint: t('Kopiuj blueprint', 'Copy blueprint'),
      templateRequirements: t('Wymagania danych templatek', 'Template data requirements'),
      requirementsHelp: t(
        'To jest wzĂłr blokĂłw `Template ...`. WypeĹ‚nij tylko te bloki, ktĂłre wystÄ™pujÄ… w sekcji 9.',
        'Use this as a master template for `Template ...` blocks. Fill only blocks used in section 9 order.',
      ),
      liveMode: t('Tryb prezentacji live', 'Live presentation mode'),
      prevTemplate: t('Poprzedni template', 'Previous template'),
      nextTemplate: t('NastÄ™pny template', 'Next template'),
      sequence: t('Sekwencja', 'Sequence'),
      active: t('Aktywny', 'Active'),
      resetStarter: t('Reset startera', 'Reset starter'),
      languageBadge: t('PL', 'EN'),
      languageHint: t('Kliknij aby zmieniÄ‡ jÄ™zyk', 'Click to change language'),
      templateLoaded: t('Template zaĹ‚adowany', 'Template loaded'),
      templateStep: t('Krok templatek', 'Template step'),
      portraitLoaded: t('Portret', 'Portrait'),
      importLoaded: t('Import wczytany', 'Import loaded'),
      importFailed: t('Import nieudany: nie moĹĽna odczytaÄ‡ pliku.', 'Import failed: could not read file.'),
      blueprintCopied: t('Blueprint importu skopiowany.', 'Import blueprint copied.'),
      clipboardBlocked: t('Schowek zablokowany. Skopiuj rÄ™cznie z pola poniĹĽej.', 'Clipboard blocked. Copy manually from guide box.'),
      starterRestored: t('PrzywrĂłcono preset startowy.', 'Starter preset restored.'),
      neon: t('Neon', 'Neon'),
      gold: t('ZĹ‚oto', 'Gold'),
      tech: t('Tech', 'Tech'),
      cosmic: t('Kosmiczny', 'Cosmic'),
      ember: t('Ĺ»ar', 'Ember'),
      steel: t('Stal', 'Steel'),
    }
  }, [language])

  const [activeTemplate, setActiveTemplate] = useState<TemplateId>(initialTemplate.id)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(initialTemplate.layout)
  const [title, setTitle] = useState(initialTemplate.title)
  const [subtitle, setSubtitle] = useState(initialTemplate.subtitle)
  const [categories, setCategories] = useState<Category[]>(() => defaultCategoriesFor(defaultLanguage))
  const [fighterA, setFighterA] = useState<Fighter>(() => cloneFighter(FIGHTER_A))
  const [fighterB, setFighterB] = useState<Fighter>(() => cloneFighter(FIGHTER_B))
  const [factsA, setFactsA] = useState<FighterFact[]>(() => defaultFactsFor('a', defaultLanguage))
  const [factsB, setFactsB] = useState<FighterFact[]>(() => defaultFactsFor('b', defaultLanguage))
  const [winsA, setWinsA] = useState<string[]>(DEFAULT_WINNER_CV_A)
  const [winsB, setWinsB] = useState<string[]>(DEFAULT_WINNER_CV_B)
  const [templateOrder, setTemplateOrder] = useState<TemplateId[]>(DEFAULT_TEMPLATE_ORDER)
  const [templateCursor, setTemplateCursor] = useState(0)
  const [templateBlocks, setTemplateBlocks] = useState<Record<string, string[]>>({})
  const [importFileName, setImportFileName] = useState('')
  const [viewMode, setViewMode] = useState<'search' | 'home' | 'fight-intro' | 'fight'>('search')
  const [introVisible, setIntroVisible] = useState(true)
  const [fightViewVisible, setFightViewVisible] = useState(true)
  const [searchMorphVisible, setSearchMorphVisible] = useState(false)
  const [searchMorphHandoff, setSearchMorphHandoff] = useState<SearchMorphHandoff | null>(null)
  const [fights, setFights] = useState<FightRecord[]>([])
  const [activeFightId, setActiveFightId] = useState<string | null>(null)
  const [storageReady, setStorageReady] = useState(false)
  const [draftPayload, setDraftPayload] = useState<ParsedVsImport | null>(null)
  const [draftTxtFileName, setDraftTxtFileName] = useState('')
  const [draftPortraitFileA, setDraftPortraitFileA] = useState<File | null>(null)
  const [draftPortraitFileB, setDraftPortraitFileB] = useState<File | null>(null)
  const [draftPortraitPreviewA, setDraftPortraitPreviewA] = useState('')
  const [draftPortraitPreviewB, setDraftPortraitPreviewB] = useState('')
  const [activeDropTarget, setActiveDropTarget] = useState<ImportDropTarget | null>(null)
  const [frame, setFrame] = useState<Frame>(initialTemplate.frame)
  const [theme, setTheme] = useState<Theme>(initialTemplate.theme)
  const previewRef = useRef<HTMLDivElement>(null)
  const previewShellRef = useRef<HTMLDivElement>(null)
  const searchTransitionTimeoutsRef = useRef<number[]>([])
  const searchTransitioningRef = useRef(false)
  const searchCollapseAckedRef = useRef(false)
  const introFrameReadyRef = useRef(false)
  const introRevealPendingRef = useRef(false)
  const searchFrameRef = useRef<HTMLIFrameElement>(null)
  const introFrameRef = useRef<HTMLIFrameElement>(null)
  const draftTxtInputRef = useRef<HTMLInputElement>(null)
  const draftPortraitInputRefA = useRef<HTMLInputElement>(null)
  const draftPortraitInputRefB = useRef<HTMLInputElement>(null)
  const draftPortraitPreviewRef = useRef<{ a: string | null; b: string | null }>({ a: null, b: null })
  const fightViewRevealTimeoutRef = useRef<number | null>(null)
  const [previewScale, setPreviewScale] = useState(1)
  const PREVIEW_BASE_WIDTH = 1400
  const PREVIEW_BASE_HEIGHT = 787.5
  const PREVIEW_MIN_SCALE = 0.62
  const PREVIEW_MAX_SCALE = 1.7
  const MORPH_POWER_OFF_MS = 1000
  const MORPH_RING_ON_MS = 1000
  const MORPH_FINAL_MS = 2000
  const MORPH_TOTAL_MS = MORPH_POWER_OFF_MS + MORPH_RING_ON_MS + MORPH_FINAL_MS
  const MORPH_OVERLAY_BUFFER_MS = 180
  const INTRO_MOUNT_AT_MS = 1200
  const INTRO_REVEAL_AT_MS = MORPH_TOTAL_MS - 220
  const SEARCH_COLLAPSE_WATCHDOG_MS = 5000

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return

    const root = document.documentElement
    root.classList.add('vvv-animated-cursor')

    const layer = document.createElement('div')
    layer.className = 'vvv-animated-cursor-layer'
    layer.setAttribute('aria-hidden', 'true')

    const glow = document.createElement('span')
    glow.className = 'vvv-animated-cursor-glow'
    const core = document.createElement('span')
    core.className = 'vvv-animated-cursor-core'
    layer.append(glow, core)
    document.body.appendChild(layer)

    let targetX = window.innerWidth * 0.5
    let targetY = window.innerHeight * 0.5
    let currentX = targetX
    let currentY = targetY
    let rafId = 0
    let relayRafId = 0
    let queuedRelay: PointerRelayPayload | null = null
    let activeRelaySource: PointerRelaySource | null = null
    let relayPriorityUntil = 0
    layer.style.transform = `translate3d(${currentX - 2}px, ${currentY - 2}px, 0)`
    layer.classList.add('is-visible')

    const resolveRelayFrame = (source: PointerRelaySource): HTMLIFrameElement | null => {
      if (source === 'search') return searchFrameRef.current
      return introFrameRef.current
    }

    const mapRelayPosition = (relay: PointerRelayPayload): { x: number; y: number } | null => {
      const frame = resolveRelayFrame(relay.source)
      if (!frame) return null
      const rect = frame.getBoundingClientRect()
      return {
        x: rect.left + relay.x,
        y: rect.top + relay.y,
      }
    }

    const render = () => {
      currentX += (targetX - currentX) * 0.42
      currentY += (targetY - currentY) * 0.42
      layer.style.transform = `translate3d(${currentX - 2}px, ${currentY - 2}px, 0)`

      if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
        rafId = window.requestAnimationFrame(render)
      } else {
        rafId = 0
      }
    }

    const schedule = () => {
      if (!rafId) rafId = window.requestAnimationFrame(render)
    }

    const applyTarget = (x: number, y: number, source?: PointerRelaySource) => {
      targetX = x
      targetY = y
      layer.classList.add('is-visible')
      if (source) {
        activeRelaySource = source
        relayPriorityUntil = performance.now() + 96
      }
      schedule()
    }

    const flushRelay = () => {
      relayRafId = 0
      const relay = queuedRelay
      queuedRelay = null
      if (!relay) return
      const mapped = mapRelayPosition(relay)
      if (!mapped) return

      applyTarget(mapped.x, mapped.y, relay.source)
      if (relay.event === 'down' || relay.down === true) {
        layer.classList.add('is-down')
        return
      }
      if (relay.event === 'up' || relay.event === 'leave' || relay.down === false) {
        layer.classList.remove('is-down')
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      const now = performance.now()
      if (activeRelaySource && now < relayPriorityUntil) return
      activeRelaySource = null
      relayPriorityUntil = 0
      applyTarget(event.clientX, event.clientY)
    }

    const onPointerRelayMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const relay = normalizePointerRelayPayload(event.data)
      if (!relay) return
      queuedRelay = relay
      if (!relayRafId) relayRafId = window.requestAnimationFrame(flushRelay)
    }

    const onPointerDown = () => {
      layer.classList.add('is-visible')
      layer.classList.add('is-down')
    }
    const onPointerUp = () => layer.classList.remove('is-down')

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
    window.addEventListener('pointercancel', onPointerUp, { passive: true })
    window.addEventListener('message', onPointerRelayMessage)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      window.removeEventListener('message', onPointerRelayMessage)
      if (rafId) window.cancelAnimationFrame(rafId)
      if (relayRafId) window.cancelAnimationFrame(relayRafId)
      layer.remove()
      root.classList.remove('vvv-animated-cursor')
    }
  }, [])

  const rows = useMemo<ScoreRow[]>(
    () =>
      categories.map((category) => {
        const a = clamp(fighterA.stats[category.id] ?? 0)
        const b = clamp(fighterB.stats[category.id] ?? 0)
        const delta = a - b
        return {
          id: category.id,
          label: category.label,
          a,
          b,
          delta,
          winner: delta === 0 ? 'draw' : delta > 0 ? 'a' : 'b',
        }
      }),
    [categories, fighterA.stats, fighterB.stats],
  )

  const averageA = useMemo(() => avg(rows, 'a'), [rows])
  const averageB = useMemo(() => avg(rows, 'b'), [rows])

  const flashStatus = (text: string) => {
    void text
  }

  const localizeImportError = (error: string) => {
    if (language === 'en') return error
    const missingSection = error.match(/missing section\s+(\d+)/i)
    if (missingSection?.[1]) {
      return `BĹ‚Ä…d importu: brak sekcji ${missingSection[1]}.`
    }
    if (/need stat lines/i.test(error)) {
      return 'BĹ‚Ä…d importu: sekcje 2 i 6 muszÄ… zawieraÄ‡ linie statystyk, np. "- Strength: 96".'
    }
    return error
  }

  const applyTemplateById = (templateId: TemplateId, shouldFlash = true) => {
    const preset = localizedTemplates.find((item) => item.id === templateId)
    if (!preset) return
    setActiveTemplate(preset.id)
    setLayoutMode(preset.layout)
    setFrame(preset.frame)
    setTheme(preset.theme)
    setTitle(preset.title)
    setSubtitle(preset.subtitle)
    if (shouldFlash) {
      flashStatus(`${ui.templateLoaded}: ${preset.name}`)
    }
  }

  const stepTemplateOrder = (direction: 1 | -1) => {
    if (!templateOrder.length) return
    const next = (templateCursor + direction + templateOrder.length) % templateOrder.length
    setTemplateCursor(next)
    applyTemplateById(templateOrder[next], false)
  }

  const setDraftPortraitFromFile = (side: 'a' | 'b', file: File) => {
    const url = URL.createObjectURL(file)
    const previous = draftPortraitPreviewRef.current[side]
    if (previous) URL.revokeObjectURL(previous)
    draftPortraitPreviewRef.current[side] = url

    if (side === 'a') {
      setDraftPortraitFileA(file)
      setDraftPortraitPreviewA(url)
      return
    }

    setDraftPortraitFileB(file)
    setDraftPortraitPreviewB(url)
  }

  const clearDraftPortraits = () => {
    const oldA = draftPortraitPreviewRef.current.a
    const oldB = draftPortraitPreviewRef.current.b
    if (oldA) URL.revokeObjectURL(oldA)
    if (oldB) URL.revokeObjectURL(oldB)
    draftPortraitPreviewRef.current = { a: null, b: null }
    setDraftPortraitFileA(null)
    setDraftPortraitFileB(null)
    setDraftPortraitPreviewA('')
    setDraftPortraitPreviewB('')
  }

  const isImportTxtFile = (file: File) => {
    const name = file.name.toLowerCase()
    return name.endsWith('.txt') || file.type === 'text/plain'
  }

  const isImportImageFile = (file: File) => {
    const name = file.name.toLowerCase()
    return file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i.test(name)
  }

  const parseDraftImportFromFile = async (file: File) => {
    try {
      const raw = await file.text()
      const parsed = parseVsImportText(raw)
      if (!parsed.ok) {
        flashStatus(localizeImportError(parsed.error))
        return
      }

      const payload = enforceFileNameSideOrder(parsed.data, file.name)
      setDraftPayload(payload)
      setDraftTxtFileName(file.name)
    } catch {
      flashStatus(ui.importFailed)
    }
  }

  const handleDropZoneDragEnter =
    (target: ImportDropTarget) => (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setActiveDropTarget(target)
    }

  const handleDropZoneDragOver =
    (target: ImportDropTarget) => (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      event.dataTransfer.dropEffect = 'copy'
      if (activeDropTarget !== target) {
        setActiveDropTarget(target)
      }
    }

  const handleDropZoneDragLeave =
    (target: ImportDropTarget) => (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const nextTarget = event.relatedTarget as Node | null
      if (nextTarget && event.currentTarget.contains(nextTarget)) return
      setActiveDropTarget((current) => (current === target ? null : current))
    }

  const handleTxtDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setActiveDropTarget((current) => (current === 'txt' ? null : current))
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    if (!isImportTxtFile(file)) {
      flashStatus(ui.invalidTxtType)
      return
    }
    void parseDraftImportFromFile(file)
  }

  const handlePortraitDrop =
    (side: 'a' | 'b') => (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const target = side === 'a' ? 'a' : 'b'
      setActiveDropTarget((current) => (current === target ? null : current))
      const file = event.dataTransfer.files?.[0]
      if (!file) return
      if (!isImportImageFile(file)) {
        flashStatus(ui.invalidImageType)
        return
      }
      setDraftPortraitFromFile(side, file)
    }

  const handleDraftPortraitUpload =
    (side: 'a' | 'b') => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return
      if (!isImportImageFile(file)) {
        flashStatus(ui.invalidImageType)
        event.target.value = ''
        return
      }
      setDraftPortraitFromFile(side, file)
      event.target.value = ''
    }

  const handleDraftImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!isImportTxtFile(file)) {
      flashStatus(ui.invalidTxtType)
      event.target.value = ''
      return
    }

    await parseDraftImportFromFile(file)
    event.target.value = ''
  }

  const clearSearchTransitionQueue = () => {
    for (const timeoutId of searchTransitionTimeoutsRef.current) {
      window.clearTimeout(timeoutId)
    }
    searchTransitionTimeoutsRef.current = []
    searchTransitioningRef.current = false
    searchCollapseAckedRef.current = false
    introFrameReadyRef.current = false
    introRevealPendingRef.current = false
    setSearchMorphVisible(false)
    setSearchMorphHandoff(null)
  }

  const clearFightViewRevealTimeout = () => {
    if (fightViewRevealTimeoutRef.current !== null) {
      window.clearTimeout(fightViewRevealTimeoutRef.current)
      fightViewRevealTimeoutRef.current = null
    }
  }

  const triggerFightViewFadeIn = () => {
    clearFightViewRevealTimeout()
    setFightViewVisible(false)
    fightViewRevealTimeoutRef.current = window.setTimeout(() => {
      setFightViewVisible(true)
      fightViewRevealTimeoutRef.current = null
    }, 24)
  }

  const postMessageToSearchFrame = (payload: { type: string }) => {
    const target = searchFrameRef.current?.contentWindow
    if (!target || typeof window === 'undefined') return
    target.postMessage(payload, window.location.origin)
  }

  const applyFightRecord = (fight: FightRecord, options?: { enterIntro?: boolean }) => {
    const payload = enforceFileNameSideOrder(fight.payload, fight.fileName || fight.name)
    const categoryPayload = createCategoryPayload(payload.statsA, payload.statsB)
    const importedOrder = payload.templateOrder.length ? payload.templateOrder : DEFAULT_TEMPLATE_ORDER
    const firstTemplate = importedOrder[0] || DEFAULT_TEMPLATE_ORDER[0]

    setCategories(categoryPayload.categories)
    setFighterA({
      ...cloneFighter(FIGHTER_A),
      name: payload.fighterAName,
      subtitle: FIGHTER_A.subtitle,
      color: FIGHTER_A_COLOR,
      imageUrl: fight.portraitADataUrl,
      stats: categoryPayload.statsRecordA,
    })
    setFighterB({
      ...cloneFighter(FIGHTER_B),
      name: payload.fighterBName,
      subtitle: FIGHTER_B.subtitle,
      color: FIGHTER_B_COLOR,
      imageUrl: fight.portraitBDataUrl,
      stats: categoryPayload.statsRecordB,
    })

    setFactsA(payload.factsA.length ? payload.factsA.slice(0, 5) : defaultFactsFor('a', language))
    setFactsB(payload.factsB.length ? payload.factsB.slice(0, 5) : defaultFactsFor('b', language))
    setWinsA(payload.winsA.length ? payload.winsA.slice(0, 12) : DEFAULT_WINNER_CV_A)
    setWinsB(payload.winsB.length ? payload.winsB.slice(0, 12) : DEFAULT_WINNER_CV_B)
    setTemplateBlocks(payload.templateBlocks)
    setTemplateOrder(importedOrder)
    setTemplateCursor(0)
    setImportFileName(fight.fileName)
    setActiveFightId(fight.id)
    if (options?.enterIntro ?? true) {
      clearSearchTransitionQueue()
      setIntroVisible(true)
      setViewMode('fight-intro')
    }
    applyTemplateById(firstTemplate, false)
  }

  const runSearchMorphSequence = (handoff?: SearchMorphHandoff | null) => {
    if (!searchTransitioningRef.current || searchCollapseAckedRef.current) return
    searchCollapseAckedRef.current = true

    setSearchMorphHandoff(handoff ?? getViewportCenterHandoff())
    setSearchMorphVisible(true)

    const introMountTimeout = window.setTimeout(() => {
      setViewMode('fight-intro')
      setIntroVisible(false)
      introFrameReadyRef.current = false
      introRevealPendingRef.current = false
    }, INTRO_MOUNT_AT_MS)

    const introRevealTimeout = window.setTimeout(() => {
      if (introFrameReadyRef.current) {
        setIntroVisible(true)
      } else {
        introRevealPendingRef.current = true
      }
    }, INTRO_REVEAL_AT_MS)

    const hideMorphTimeout = window.setTimeout(() => {
      setSearchMorphVisible(false)
      searchTransitioningRef.current = false
      searchCollapseAckedRef.current = false
    }, MORPH_TOTAL_MS + MORPH_OVERLAY_BUFFER_MS)

    searchTransitionTimeoutsRef.current.push(introMountTimeout, introRevealTimeout, hideMorphTimeout)
  }

  const startSearchFightTransition = (fight: FightRecord) => {
    if (searchTransitioningRef.current) return
    clearSearchTransitionQueue()
    searchTransitioningRef.current = true
    applyFightRecord(fight, { enterIntro: false })
    postMessageToSearchFrame({ type: 'vvv-search-collapse' })
    introFrameReadyRef.current = false
    introRevealPendingRef.current = false
    setIntroVisible(false)

    const collapseWatchdogTimeout = window.setTimeout(() => {
      runSearchMorphSequence(null)
    }, SEARCH_COLLAPSE_WATCHDOG_MS)

    searchTransitionTimeoutsRef.current.push(collapseWatchdogTimeout)
  }

  const createFightFromDraft = async () => {
    if (!draftPayload) {
      flashStatus(ui.draftNeedTxt)
      return
    }
    if (!draftPortraitFileA || !draftPortraitFileB) {
      flashStatus(ui.draftNeedPortraits)
      return
    }

    try {
      const [portraitADataUrl, portraitBDataUrl] = await Promise.all([
        readFileAsDataUrl(draftPortraitFileA),
        readFileAsDataUrl(draftPortraitFileB),
      ])

      const fallbackName = `${draftPayload.fighterAName} vs ${draftPayload.fighterBName}`.trim()
      const derivedName = stripFileExtension(draftTxtFileName) || fallbackName || tr('Nowa Walka', 'New Fight')
      const fight: FightRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: derivedName,
        fileName: draftTxtFileName || `${derivedName}.txt`,
        createdAt: Date.now(),
        payload: draftPayload,
        portraitADataUrl,
        portraitBDataUrl,
      }

      setFights((current) => [fight, ...current])
      setDraftPayload(null)
      setDraftTxtFileName('')
      clearDraftPortraits()
      flashStatus(`${ui.fightAdded}: ${fight.name}`)
    } catch {
      flashStatus(ui.importFailed)
    }
  }

  const openFight = (fightId: string) => {
    const match = fights.find((item) => item.id === fightId)
    if (!match) return
    applyFightRecord(match)
  }

  const deleteFight = (fightId: string) => {
    const match = fights.find((item) => item.id === fightId)
    if (!match) return
    const confirmed = window.confirm(`${ui.deleteFightConfirm}\n\n${match.name}`)
    if (!confirmed) return

    setFights((current) => current.filter((item) => item.id !== fightId))
    if (activeFightId === fightId) {
      setActiveFightId(null)
      setViewMode('home')
    }
  }

  const goBackToLibrary = () => {
    clearSearchTransitionQueue()
    clearFightViewRevealTimeout()
    setFightViewVisible(true)
    setViewMode('home')
    setActiveFightId(null)
  }

  const copyImportBlueprint = async () => {
    try {
      await navigator.clipboard.writeText(importTxtBlueprint)
      flashStatus(ui.blueprintCopied)
    } catch {
      flashStatus(ui.clipboardBlocked)
    }
  }

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (typeof window === 'undefined') return
      if (event.origin !== window.location.origin) return
      const payload = event.data
      if (!payload || typeof payload !== 'object') return

      const typed = payload as { type?: unknown; query?: unknown; handoff?: unknown }
      if (typed.type === 'vvv-aaa-complete') {
        clearSearchTransitionQueue()
        triggerFightViewFadeIn()
        setViewMode('fight')
        return
      }

      if (typed.type === 'vvv-search-collapsed') {
        runSearchMorphSequence(normalizeSearchMorphHandoff(typed.handoff))
        return
      }

      if (typed.type !== 'vvv-search-submit' || typeof typed.query !== 'string') return
      const rawQuery = typed.query.trim()
      if (!rawQuery) return

      const token = normalizeToken(rawQuery)
      if (token === 'add' || token === 'dodaj') {
        clearSearchTransitionQueue()
        setIntroVisible(true)
        setViewMode('home')
        setActiveFightId(null)
        return
      }

      const match = findFightByQuery(fights, rawQuery)
      if (!match) return
      startSearchFightTransition(match)
    }

    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
      clearFightViewRevealTimeout()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fights])

  useEffect(() => {
    const localizedActive = localizedTemplates.find((item) => item.id === activeTemplate)
    if (!localizedActive) return
    setTitle(localizedActive.title)
    setSubtitle(localizedActive.subtitle)
  }, [activeTemplate, language, localizedTemplates])

  useEffect(() => {
    let mounted = true

    const restorePersistedFights = async () => {
      let restoredFights: FightRecord[] = []
      let restoredActiveFightId: string | null = null
      let idbAvailable = typeof window !== 'undefined' && 'indexedDB' in window

      if (idbAvailable) {
        try {
          restoredFights = await idbReadAllFights()
          restoredActiveFightId = await idbGetActiveFightId()
        } catch {
          idbAvailable = false
        }
      }

      if (!restoredFights.length) {
        try {
          const serialized = localStorage.getItem(LEGACY_FIGHTS_STORAGE_KEY)
          if (serialized) {
            const parsed = JSON.parse(serialized)
            if (Array.isArray(parsed)) {
              restoredFights = parsed
                .map((item, index) => normalizePersistedFight(item, index))
                .filter((item): item is FightRecord => Boolean(item))
            }
          }
          const savedActiveFightId = localStorage.getItem(LEGACY_ACTIVE_FIGHT_STORAGE_KEY)
          if (savedActiveFightId && restoredFights.some((fight) => fight.id === savedActiveFightId)) {
            restoredActiveFightId = savedActiveFightId
          }
        } catch {
          // Ignore invalid legacy storage payloads.
        }

        if (idbAvailable && restoredFights.length) {
          try {
            await idbSaveAllFights(restoredFights)
            await idbSetActiveFightId(restoredActiveFightId)
            localStorage.removeItem(LEGACY_FIGHTS_STORAGE_KEY)
            localStorage.removeItem(LEGACY_ACTIVE_FIGHT_STORAGE_KEY)
          } catch {
            // Ignore migration write failures.
          }
        }
      }

      if (restoredActiveFightId && !restoredFights.some((fight) => fight.id === restoredActiveFightId)) {
        restoredActiveFightId = null
      }

      if (!mounted) return
      setFights(restoredFights)
      setActiveFightId(restoredActiveFightId)
      setStorageReady(true)
    }

    void restorePersistedFights()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!storageReady) return

    const persistFights = async () => {
      if (typeof window === 'undefined') return
      if ('indexedDB' in window) {
        try {
          await idbSaveAllFights(fights)
          return
        } catch {
          // Fall back to legacy storage.
        }
      }
      try {
        localStorage.setItem(LEGACY_FIGHTS_STORAGE_KEY, JSON.stringify(fights))
      } catch {
        // Ignore storage write failures (quota/private mode).
      }
    }

    void persistFights()
  }, [fights, storageReady])

  useEffect(() => {
    if (!storageReady) return

    const persistActiveFight = async () => {
      if (typeof window === 'undefined') return
      if ('indexedDB' in window) {
        try {
          await idbSetActiveFightId(activeFightId)
          return
        } catch {
          // Fall back to legacy storage.
        }
      }
      try {
        if (activeFightId) {
          localStorage.setItem(LEGACY_ACTIVE_FIGHT_STORAGE_KEY, activeFightId)
          return
        }
        localStorage.removeItem(LEGACY_ACTIVE_FIGHT_STORAGE_KEY)
      } catch {
        // Ignore storage write failures.
      }
    }

    void persistActiveFight()
  }, [activeFightId, storageReady])

  useEffect(() => {
    if (importFileName || Object.keys(templateBlocks).length) return
    setCategories(defaultCategoriesFor(language))
    setFactsA(defaultFactsFor('a', language))
    setFactsB(defaultFactsFor('b', language))
  }, [importFileName, language, templateBlocks])

  const renderTemplate = () => {
    const commonProps: TemplatePreviewProps = {
      activeTemplateId: activeTemplate,
      language,
      rows,
      fighterA,
      fighterB,
      averageA,
      averageB,
      title,
      subtitle,
      factsA,
      factsB,
      winsA,
      winsB,
      templateBlocks,
    }
    switch (layoutMode) {
      case 'radarBrief':
        return <RadarBriefTemplate {...commonProps} />
      case 'tacticalBoard':
        return <TacticalBoardTemplate {...commonProps} />
      case 'winnerCv':
        return <WinnerCvTemplate {...commonProps} />
      case 'characterCardA':
        return <CharacterCardATemplate {...commonProps} />
      case 'characterCardB':
        return <CharacterCardBTemplate {...commonProps} />
      case 'blankTemplate':
        return <BlankTemplate {...commonProps} />
      case 'methodology':
        return <MethodologyTemplate {...commonProps} />
      default:
        return <HudBarsTemplate {...commonProps} />
    }
  }

  useEffect(() => {
    const shell = previewShellRef.current
    if (!shell) return

    const updateScale = () => {
      const availableWidth = Math.max(320, shell.clientWidth - 24)
      const availableHeight = Math.max(320, shell.clientHeight - 24)
      const scaleFromWidth = availableWidth / PREVIEW_BASE_WIDTH
      const scaleFromHeight = availableHeight / PREVIEW_BASE_HEIGHT
      const boundedScale = Math.min(scaleFromWidth, scaleFromHeight)
      const nextScale = Math.max(PREVIEW_MIN_SCALE, Math.min(PREVIEW_MAX_SCALE, boundedScale))
      setPreviewScale((previous) => (Math.abs(previous - nextScale) > 0.001 ? nextScale : previous))
    }

    updateScale()

    const observer = new ResizeObserver(updateScale)
    observer.observe(shell)
    window.addEventListener('resize', updateScale)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateScale)
    }
  }, [PREVIEW_BASE_HEIGHT, PREVIEW_BASE_WIDTH, PREVIEW_MAX_SCALE, PREVIEW_MIN_SCALE, viewMode])

  useEffect(
    () => () => {
      const oldA = draftPortraitPreviewRef.current.a
      const oldB = draftPortraitPreviewRef.current.b
      if (oldA) URL.revokeObjectURL(oldA)
      if (oldB) URL.revokeObjectURL(oldB)
    },
    [],
  )

  useEffect(
    () => () => {
      clearSearchTransitionQueue()
    },
    [],
  )

  const scaledPreviewWidth = Math.round(PREVIEW_BASE_WIDTH * previewScale)
  const scaledPreviewHeight = Math.round(PREVIEW_BASE_HEIGHT * previewScale)
  const isSearchView = viewMode === 'search'
  const isIntroView = viewMode === 'fight-intro'
  const isTemplateView = viewMode === 'fight'
  const isFightFlow = isIntroView || isTemplateView
  const isEmbeddedFullscreenView = isSearchView || isIntroView
  const morphHandoff = searchMorphHandoff ?? getViewportCenterHandoff()
  const morphOriginSize = Math.max(
    28,
    Math.min(
      120,
      ((morphHandoff.width + morphHandoff.height) / 2 || DEFAULT_MORPH_SIZE) - MORPH_ORIGIN_SIZE_SHRINK_PX,
    ),
  )
  const searchMorphAnchorStyle = {
    '--vvv-origin-x': `${morphHandoff.x}px`,
    '--vvv-origin-y': `${morphHandoff.y}px`,
    '--vvv-origin-size': `${morphOriginSize}px`,
  } as Record<string, string>
  const searchMorphOverlay =
    searchMorphVisible && typeof document !== 'undefined'
      ? createPortal(
          <div className="vvv-morph-stage is-running pointer-events-none fixed inset-0 z-[2147483647]">
            <div className="vvv-logo-morph-anchor" style={searchMorphAnchorStyle}>
              <div className="vvv-logo-morph is-running" aria-hidden="true">
                <div className="vvv-logo-morph__electric" />
                <div className="vvv-logo-morph__ring" />
                <div className="vvv-logo-morph__core" />
                <div className="vvv-logo-morph__logo" />
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <main
      className={clsx(
        'text-slate-100',
        isEmbeddedFullscreenView
          ? 'h-screen overflow-hidden p-0'
          : isTemplateView
            ? 'h-screen overflow-hidden px-2 py-2 sm:px-3 sm:py-3'
            : 'min-h-screen px-3 py-4 sm:px-4 sm:py-6',
      )}
    >
      <div className={clsx('max-w-none', isFightFlow || isSearchView ? 'flex h-full min-h-0 flex-col' : '')}>
        {viewMode === 'home' ? (
          <header className="relative mb-4 overflow-hidden rounded-2xl border border-cyan-300/35 bg-slate-950/70 p-4 backdrop-blur-xl sm:mb-5">
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(34,211,238,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.22)_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l-2 border-t-2 border-cyan-300/70" />
            <div className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r-2 border-t-2 border-cyan-300/70" />
            <div className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b-2 border-l-2 border-cyan-300/70" />
            <div className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b-2 border-r-2 border-cyan-300/70" />
            <div className="relative z-10 rounded-xl border border-cyan-300/30 bg-black/25 px-4 py-3">
              <button
                type="button"
                onClick={() => setLanguage((current) => (current === 'pl' ? 'en' : 'pl'))}
                className="mx-auto flex items-center gap-3 rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-4 py-2 transition hover:bg-cyan-300/20"
                title={ui.languageHint}
              >
                <h1
                  className="text-center text-3xl uppercase tracking-[0.08em] text-cyan-100 sm:text-4xl"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  VersusVerseVault
                </h1>
                <span className="rounded border border-cyan-200/55 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                  {ui.languageBadge}
                </span>
              </button>
            </div>
          </header>
        ) : null}

        {viewMode === 'search' ? (
          <section className="relative z-0 h-full min-h-0 overflow-hidden bg-[#111418]">
            <iframe
              ref={searchFrameRef}
              src="/search/1.html"
              title="Fight Search"
              className="relative z-0 h-full w-full border-0"
              onLoad={() => {
                postMessageToSearchFrame({ type: 'vvv-search-reset' })
              }}
            />
          </section>
        ) : viewMode === 'home' ? (
          <div className="grid gap-4 xl:grid-cols-[1.05fr_1fr]">
            <section className="panel">
              <h2 className="text-lg font-semibold uppercase tracking-[0.12em] text-slate-100">{ui.homeTitle}</h2>
              <p className="mt-2 text-sm text-slate-300">{ui.homeSubtitle}</p>
              <p className="mt-2 text-sm text-slate-300">{ui.uploadHelp}</p>

              <label
                className={clsx(
                  'mt-3 block rounded-xl border p-3 transition-colors',
                  activeDropTarget === 'txt'
                    ? 'border-cyan-300/70 bg-cyan-500/14'
                    : 'border-slate-700/70 bg-slate-950/55',
                )}
                onDragEnter={handleDropZoneDragEnter('txt')}
                onDragOver={handleDropZoneDragOver('txt')}
                onDragLeave={handleDropZoneDragLeave('txt')}
                onDrop={handleTxtDrop}
              >
                <span className="section-label">{ui.matchTxt}</span>
                <p className="mt-1 text-xs text-slate-300">{ui.dropTxtHint}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-cyan-300/45 bg-cyan-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-100 transition hover:bg-cyan-300/28"
                    onClick={(event) => {
                      event.preventDefault()
                      draftTxtInputRef.current?.click()
                    }}
                  >
                    {ui.pickTxtButton}
                  </button>
                  <span className="truncate text-xs text-slate-300">{draftTxtFileName || ui.noFileSelected}</span>
                </div>
                <input
                  ref={draftTxtInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  className="hidden"
                  onChange={handleDraftImportFile}
                />
                <p className={clsx('mt-2 text-xs', draftTxtFileName ? 'text-emerald-200' : 'text-slate-400')}>
                  {draftTxtFileName ? `${ui.txtLoadedLabel}: ${draftTxtFileName}` : ui.txtNotLoadedLabel}
                </p>
              </label>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label
                  className={clsx(
                    'rounded-xl border p-2 transition-colors',
                    activeDropTarget === 'a'
                      ? 'border-sky-300/70 bg-sky-500/12'
                      : 'border-slate-700/70 bg-slate-950/55',
                  )}
                  onDragEnter={handleDropZoneDragEnter('a')}
                  onDragOver={handleDropZoneDragOver('a')}
                  onDragLeave={handleDropZoneDragLeave('a')}
                  onDrop={handlePortraitDrop('a')}
                >
                  <span className="section-label">{ui.portraitA}</span>
                  <p className="mt-1 text-xs text-slate-300">{ui.dropImageHint}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-sky-300/45 bg-sky-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-sky-100 transition hover:bg-sky-300/28"
                      onClick={(event) => {
                        event.preventDefault()
                        draftPortraitInputRefA.current?.click()
                      }}
                    >
                      {ui.pickImageButton}
                    </button>
                    <span className="truncate text-xs text-slate-300">{draftPortraitFileA?.name || ui.noFileSelected}</span>
                  </div>
                  <input
                    ref={draftPortraitInputRefA}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleDraftPortraitUpload('a')}
                  />
                  {draftPortraitPreviewA ? <img src={draftPortraitPreviewA} alt="portrait-a-preview" className="mt-2 h-20 w-full rounded-md object-cover" /> : null}
                </label>
                <label
                  className={clsx(
                    'rounded-xl border p-2 transition-colors',
                    activeDropTarget === 'b'
                      ? 'border-rose-300/70 bg-rose-500/12'
                      : 'border-slate-700/70 bg-slate-950/55',
                  )}
                  onDragEnter={handleDropZoneDragEnter('b')}
                  onDragOver={handleDropZoneDragOver('b')}
                  onDragLeave={handleDropZoneDragLeave('b')}
                  onDrop={handlePortraitDrop('b')}
                >
                  <span className="section-label">{ui.portraitB}</span>
                  <p className="mt-1 text-xs text-slate-300">{ui.dropImageHint}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-rose-300/45 bg-rose-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-rose-100 transition hover:bg-rose-300/28"
                      onClick={(event) => {
                        event.preventDefault()
                        draftPortraitInputRefB.current?.click()
                      }}
                    >
                      {ui.pickImageButton}
                    </button>
                    <span className="truncate text-xs text-slate-300">{draftPortraitFileB?.name || ui.noFileSelected}</span>
                  </div>
                  <input
                    ref={draftPortraitInputRefB}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleDraftPortraitUpload('b')}
                  />
                  {draftPortraitPreviewB ? <img src={draftPortraitPreviewB} alt="portrait-b-preview" className="mt-2 h-20 w-full rounded-md object-cover" /> : null}
                </label>
              </div>

              <div className="mt-3 rounded-xl border border-slate-700/70 bg-slate-950/55 p-2 text-xs text-slate-300">
                <p>{ui.importFile}: {draftTxtFileName || ui.notLoaded}</p>
                <p className="mt-1">{ui.templateOrderLoaded}: {draftPayload ? (draftPayload.templateOrder.length ? draftPayload.templateOrder.join(' -> ') : DEFAULT_TEMPLATE_ORDER.join(' -> ')) : ui.notLoaded}</p>
                <p className="mt-1">{ui.blocksDetected}: {draftPayload ? Object.keys(draftPayload.templateBlocks).length : 0}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="button-soft" onClick={copyImportBlueprint}>
                  {ui.copyBlueprint}
                </button>
                <button type="button" className="button-soft" onClick={createFightFromDraft}>
                  {ui.createFight}
                </button>
              </div>

              <details className="mt-3 rounded-xl border border-slate-700/70 bg-slate-950/55 p-2">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
                  {ui.templateRequirements}
                </summary>
                <p className="mt-2 text-xs text-slate-300">
                  {ui.requirementsHelp}
                </p>
                <textarea
                  readOnly
                  value={importTxtBlueprint}
                  className="mt-2 h-56 w-full rounded-lg border border-slate-700/80 bg-slate-950/85 px-3 py-2 font-mono text-[11px] text-slate-100"
                />
              </details>
            </section>

            <section className="panel">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-100">{ui.fightsLibrary}</h2>
              {fights.length ? (
                <div className="mt-3 space-y-2">
                  {fights.map((fight) => (
                    <div
                      key={fight.id}
                      className={clsx(
                        'flex items-stretch gap-2 rounded-xl border p-2 transition',
                        activeFightId === fight.id
                          ? 'border-cyan-300/55 bg-cyan-500/16'
                          : 'border-slate-600/70 bg-slate-900/60 hover:border-slate-400',
                      )}
                    >
                      <button type="button" onClick={() => openFight(fight.id)} className="min-w-0 flex-1 rounded-lg px-2 py-1 text-left">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-100">{fight.name}</p>
                            <p className="mt-1 truncate text-xs text-slate-300">
                              {fight.payload.fighterAName} vs {fight.payload.fighterBName}
                            </p>
                            <p className="mt-1 truncate text-[11px] text-slate-400">{fight.fileName}</p>
                          </div>
                          <span className="rounded-xl border border-cyan-300/45 bg-cyan-400/15 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-cyan-100">
                            {ui.openFight}
                          </span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteFight(fight.id)}
                        className="flex w-10 shrink-0 items-center justify-center rounded-lg border border-rose-300/45 bg-rose-500/12 text-rose-200 transition hover:bg-rose-500/24"
                        aria-label={ui.deleteFightAria}
                        title={ui.deleteFight}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-300">{ui.noFights}</p>
              )}
            </section>
          </div>
        ) : viewMode === 'fight-intro' ? (
          <section className="relative z-0 h-full min-h-0 overflow-hidden bg-[#111418]">
            <div
              className="relative z-0 h-full w-full transition-opacity duration-[1200ms] ease-out"
              style={{
                opacity: introVisible ? 1 : 0,
                pointerEvents: introVisible ? 'auto' : 'none',
              }}
            >
              <iframe
                ref={introFrameRef}
                key={activeFightId || importFileName || 'intro'}
                src="/aaa.html?mode=fight-intro"
                title="Fight Intro"
                className="relative z-0 h-full w-full border-0"
                style={{ pointerEvents: introVisible ? 'auto' : 'none' }}
                onLoad={() => {
                  introFrameReadyRef.current = true
                  if (introRevealPendingRef.current) {
                    introRevealPendingRef.current = false
                    setIntroVisible(true)
                  }
                }}
              />
            </div>
          </section>
        ) : (
          <section
            className="flex h-full min-h-0 flex-col gap-3 transition-opacity duration-200 ease-out"
            style={{ opacity: fightViewVisible ? 1 : 0, pointerEvents: fightViewVisible ? 'auto' : 'none' }}
          >
            <div className="shrink-0 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 p-3 backdrop-blur-xl">
              <span className="rounded-xl border border-cyan-300/50 bg-cyan-400/15 px-3 py-2 text-sm font-semibold text-cyan-100">
                {ui.liveMode}
              </span>
              <button className="button-soft" type="button" onClick={goBackToLibrary}>
                {ui.backToLibrary}
              </button>
              <button className="button-soft" type="button" onClick={() => stepTemplateOrder(-1)}>
                {ui.prevTemplate}
              </button>
              <button className="button-soft" type="button" onClick={() => stepTemplateOrder(1)}>
                {ui.nextTemplate}
              </button>
              <span className="rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-200">
                {ui.sequence} {templateCursor + 1}/{templateOrder.length}
              </span>
              <span className="rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-200">
                {ui.active}: {activeTemplate}
              </span>
              <span className="rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-200">
                {stripFileExtension(importFileName) || ui.notLoaded}
              </span>
            </div>

            <div ref={previewShellRef} className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 p-3 backdrop-blur-xl">
              <div
                className="mx-auto"
                style={{
                  width: `${scaledPreviewWidth}px`,
                  height: `${scaledPreviewHeight}px`,
                }}
              >
                <div
                  ref={previewRef}
                  className={clsx(
                    'relative overflow-hidden rounded-[34px] border p-4 sm:p-5',
                    FRAME_CLASSES[frame],
                    THEME_CLASSES[theme],
                  )}
                  style={{
                    width: `${PREVIEW_BASE_WIDTH}px`,
                    height: `${PREVIEW_BASE_HEIGHT}px`,
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                  }}
                >
                  <div className={clsx('pointer-events-none absolute inset-0', THEME_OVERLAYS[theme])} />
                  <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.14)_1px,transparent_1px)] [background-size:34px_34px]" />
                  <div className="pointer-events-none absolute inset-3 rounded-[26px] border border-white/12" />
                  <div className="scan-sweep" />
                  <div key={layoutMode} className="template-fade h-full">
                    {renderTemplate()}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
      {searchMorphOverlay}
    </main>
  )
}

function WinnerCvTemplate({
  fighterA,
  fighterB,
  averageA,
  averageB,
  title,
  subtitle,
  winsA,
  winsB,
  templateBlocks,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['winner-cv'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const archiveLabel = pickTemplateField(blockFields, ['archive_label']) || tr('Archiwum CV', 'CV Archive')
  const avgLabel = pickTemplateField(blockFields, ['avg_label']) || tr('Ĺšredni wynik', 'Avg score')
  const winBadge = pickTemplateField(blockFields, ['win_badge']) || 'W'
  const fighterAText = fighterA.name || 'Fighter A'
  const fighterBText = fighterB.name || 'Fighter B'
  const leftTitle =
    pickTemplateField(blockFields, ['left_title']) ||
    `${tr('NajwaĹĽniejsze wygrane', 'Top wins')}: ${fighterAText}`
  const rightTitle =
    pickTemplateField(blockFields, ['right_title']) ||
    `${tr('NajwaĹĽniejsze wygrane', 'Top wins')}: ${fighterBText}`
  const leftWins = winsA.length ? winsA : DEFAULT_WINNER_CV_A
  const rightWins = winsB.length ? winsB : DEFAULT_WINNER_CV_B

  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-slate-400/25 pb-2">
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-300">{archiveLabel}</div>
        <h2 className="text-2xl uppercase tracking-[0.08em] text-slate-50">{headerText}</h2>
        <div className="text-right text-[11px] uppercase tracking-[0.18em] text-slate-300">{subText}</div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg border px-3 py-2" style={{ borderColor: `${fighterA.color}88`, backgroundColor: `${fighterA.color}20` }}>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-200">{fighterAText}</p>
          <p className="text-sm font-semibold" style={{ color: fighterA.color }}>
            {avgLabel}: {averageA.toFixed(1)}
          </p>
        </div>
        <div className="rounded-lg border px-3 py-2" style={{ borderColor: `${fighterB.color}88`, backgroundColor: `${fighterB.color}20` }}>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-200">{fighterBText}</p>
          <p className="text-sm font-semibold" style={{ color: fighterB.color }}>
            {avgLabel}: {averageB.toFixed(1)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid flex-1 grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/20 bg-black/28 p-3">
          <p className="text-[12px] uppercase tracking-[0.18em] text-slate-300">{leftTitle}</p>
          <div className="mt-2 space-y-1.5">
            {leftWins.map((name, index) => (
              <div
                key={`cv-a-${index}-${name}`}
                className="flex items-center justify-between rounded-md border border-slate-600/60 bg-slate-900/75 px-2 py-1.5 text-sm"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <span className="truncate">{index + 1}. {name}</span>
                <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase" style={{ borderColor: `${fighterA.color}88`, color: fighterA.color }}>
                  {winBadge}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/20 bg-black/28 p-3">
          <p className="text-[12px] uppercase tracking-[0.18em] text-slate-300">{rightTitle}</p>
          <div className="mt-2 space-y-1.5">
            {rightWins.map((name, index) => (
              <div
                key={`cv-b-${index}-${name}`}
                className="flex items-center justify-between rounded-md border border-slate-600/60 bg-slate-900/75 px-2 py-1.5 text-sm"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <span className="truncate">{index + 1}. {name}</span>
                <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase" style={{ borderColor: `${fighterB.color}88`, color: fighterB.color }}>
                  {winBadge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CharacterCardTemplate({
  title,
  fighter,
  fighterText,
  corner,
  facts,
  quote,
  language,
}: {
  title: string
  fighter: Fighter
  fighterText: string
  corner: string
  facts: ReadonlyArray<{ title: string; text: string }>
  quote: string
  language: Language
}) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <h2 className="text-center text-[28px] uppercase tracking-[0.08em] text-slate-50 sm:text-[34px]">{title}</h2>
      <div
        className="mt-3 min-h-0 flex-1 rounded-xl border p-3"
        style={{ borderColor: `${fighter.color}88`, backgroundColor: `${fighter.color}14` }}
      >
        <div className="grid h-full grid-cols-[1.06fr_1.4fr] gap-3">
          <div className="relative overflow-hidden rounded-lg border bg-black/45" style={{ borderColor: `${fighter.color}88` }}>
            {fighter.imageUrl ? (
              <img src={fighter.imageUrl} alt={fighterText} className="h-full w-full object-cover object-center" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.14),transparent_45%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.9))]"
                style={{ color: fighter.color }}
              >
                <div className="text-center">
                  <p className="text-[62px] font-semibold tracking-[0.04em]">{fighterMonogram(fighterText)}</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-300">{tr('Miejsce na portret', 'Portrait Slot')}</p>
                </div>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 border-[3px] border-black/35" />
            <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:28px_28px]" />
            <div className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2" style={{ borderColor: `${fighter.color}AA` }} />
            <div className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2" style={{ borderColor: `${fighter.color}AA` }} />
            <div className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2" style={{ borderColor: `${fighter.color}AA` }} />
            <div className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2" style={{ borderColor: `${fighter.color}AA` }} />
          </div>

          <div className="flex h-full flex-col rounded-lg border border-white/20 bg-black/35 p-3">
            <div className="mb-2 rounded-md border border-white/20 bg-black/38 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300">{corner}</p>
              <h3 className="text-2xl uppercase leading-none" style={{ color: fighter.color }}>{fighterText}</h3>
              <p className="mt-1 text-sm text-slate-300">{fighter.subtitle}</p>
            </div>

            <div className="flex-1 space-y-1.5">
              {facts.map((fact) => (
                <div key={`${fighterText}-${fact.title}`} className="rounded-md border border-white/15 bg-black/28 px-3 py-1.5">
                  <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: fighter.color }}>{fact.title}</p>
                  <p className="mt-0.5 text-sm leading-tight text-slate-100">{fact.text}</p>
                </div>
              ))}
            </div>

            <p className="mt-2 text-lg italic leading-tight text-slate-100">"{quote}"</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CharacterCardATemplate({ fighterA, title, factsA, templateBlocks, language }: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const fighterAText = fighterA.name || 'Fighter A'
  const safeFacts = factsA.length ? factsA : defaultFactsFor('a', language)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['character-card-a'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const fighterForCard = {
    ...fighterA,
    subtitle: pickTemplateField(blockFields, ['world', 'swiat', 'version']) || fighterA.subtitle,
  }
  const cardFacts = buildCardFacts(safeFacts, blockFields, language)
  const cardTitle = pickTemplateField(blockFields, ['header', 'title', 'headline']) || title
  const quote =
    pickTemplateField(blockFields, ['quote', 'cytat']) ||
    tr('Zawodnik kontrolujÄ…cy tempo i dystans.', 'Fighter who controls pace and distance.')
  return (
    <CharacterCardTemplate
      title={cardTitle}
      fighter={fighterForCard}
      fighterText={fighterAText}
      corner={tr('Niebieski naroĹĽnik', 'Blue corner')}
      facts={cardFacts}
      quote={quote}
      language={language}
    />
  )
}

function CharacterCardBTemplate({ fighterB, title, factsB, templateBlocks, language }: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const fighterBText = fighterB.name || 'Fighter B'
  const safeFacts = factsB.length ? factsB : defaultFactsFor('b', language)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['character-card-b'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const fighterForCard = {
    ...fighterB,
    subtitle: pickTemplateField(blockFields, ['world', 'swiat', 'version']) || fighterB.subtitle,
  }
  const cardFacts = buildCardFacts(safeFacts, blockFields, language)
  const cardTitle = pickTemplateField(blockFields, ['header', 'title', 'headline']) || title
  const quote =
    pickTemplateField(blockFields, ['quote', 'cytat']) ||
    tr('On nie szuka czystej walki. On szuka drogi do zniszczenia.', 'He does not seek a clean fight. He seeks destruction.')
  return (
    <CharacterCardTemplate
      title={cardTitle}
      fighter={fighterForCard}
      fighterText={fighterBText}
      corner={tr('Czerwony naroĹĽnik', 'Red corner')}
      facts={cardFacts}
      quote={quote}
      language={language}
    />
  )
}

function BlankTemplate({
  title,
  subtitle,
  activeTemplateId,
  templateBlocks,
  fighterA,
  fighterB,
  averageA,
  averageB,
  rows,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const aliases = TEMPLATE_BLOCK_ALIASES[activeTemplateId] || []
  const blockLines = findTemplateBlockLines(templateBlocks, aliases)
  const renderedLines = parseBulletItems(blockLines)
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)

  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const line = (position: number, keys: string[], fallback = '') =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback

  const winnerLabel =
    pickTemplateField(blockFields, ['winner', 'verdict']) ||
    (averageA === averageB
      ? tr('Remis', 'Draw')
      : averageA > averageB
        ? `${fighterA.name || 'Fighter A'} ${Math.round(averageA)}`
        : `${fighterB.name || 'Fighter B'} ${Math.round(averageB)}`)

  if (activeTemplateId === 'summary') {
    const summaryLines = [
      line(0, ['line_1', 'line1'], tr('Tempo > obraĹĽenia na otwarciu.', 'Tempo > damage in opening.')),
      line(1, ['line_2', 'line2'], tr('Regeneracja zmienia pĂłĹşnÄ… fazÄ™ starcia.', 'Regeneration changes late game.')),
      line(2, ['line_3', 'line3'], tr('Zasady walki mogÄ… odwrĂłciÄ‡ werdykt.', 'Rules can flip the verdict.')),
    ]

    return (
      <div className="relative z-10 flex h-full flex-col text-slate-100">
        <h2 className="text-center text-3xl uppercase tracking-[0.08em] text-slate-50">{headerText}</h2>
        <p className="mt-1 text-center text-sm uppercase tracking-[0.16em] text-slate-300">{subText}</p>

        <div className="mt-3 grid min-h-0 flex-1 grid-cols-[1.05fr_1.2fr_1.05fr] gap-3">
          <div className="min-h-0 rounded-xl border p-2" style={{ borderColor: `${fighterA.color}88`, backgroundColor: `${fighterA.color}10` }}>
            <div className="mb-2 rounded-md border border-white/20 bg-black/35 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300">{tr('Niebieski naroĹĽnik', 'Blue corner')}</p>
              <p className="text-lg uppercase leading-none" style={{ color: fighterA.color }}>
                {fighterA.name || 'Fighter A'}
              </p>
            </div>
            <div className="relative h-[78%] overflow-hidden rounded-lg border bg-black/45" style={{ borderColor: `${fighterA.color}88` }}>
              {fighterA.imageUrl ? (
                <img src={fighterA.imageUrl} alt={fighterA.name || 'Fighter A'} className="h-full w-full object-cover object-center" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.14),transparent_45%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.9))]"
                  style={{ color: fighterA.color }}
                >
                  <div className="text-center">
                    <p className="text-[56px] font-semibold tracking-[0.04em]">{fighterMonogram(fighterA.name || 'Fighter A')}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{tr('Miejsce na portret', 'Portrait Slot')}</p>
                  </div>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 border-[3px] border-black/35" />
              <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:28px_28px]" />
            </div>
          </div>

          <div className="min-h-0 rounded-xl border border-slate-500/45 bg-black/30 p-3">
            <div className="rounded-xl border border-amber-300/55 bg-[linear-gradient(115deg,rgba(120,53,15,0.42),rgba(251,191,36,0.35),rgba(120,53,15,0.42))] px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-100">{tr('Migawka zwyciÄ™zcy', 'Winner snapshot')}</p>
              <p className="mt-1 text-4xl uppercase leading-none text-white">{winnerLabel}</p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border px-3 py-2" style={{ borderColor: `${fighterA.color}88`, backgroundColor: `${fighterA.color}20` }}>
                <p className="text-xs uppercase tracking-[0.16em]">{fighterA.name || 'Fighter A'}</p>
                <p className="text-2xl font-semibold" style={{ color: fighterA.color }}>
                  {Math.round(averageA)}
                </p>
              </div>
              <div className="rounded-lg border px-3 py-2" style={{ borderColor: `${fighterB.color}88`, backgroundColor: `${fighterB.color}20` }}>
                <p className="text-xs uppercase tracking-[0.16em]">{fighterB.name || 'Fighter B'}</p>
                <p className="text-2xl font-semibold" style={{ color: fighterB.color }}>
                  {Math.round(averageB)}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-700/60 bg-slate-900/72 p-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">{tr('Linie podsumowania', 'Summary lines')}</p>
              <div className="mt-2 max-h-[220px] space-y-1.5 overflow-y-auto pr-1 text-sm text-slate-100">
                {summaryLines.map((item, index) => (
                  <div key={`summary-line-${index}-${item}`} className="rounded border border-slate-700/60 bg-black/35 px-2 py-1">
                    {index + 1}. {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="min-h-0 rounded-xl border p-2" style={{ borderColor: `${fighterB.color}88`, backgroundColor: `${fighterB.color}10` }}>
            <div className="mb-2 rounded-md border border-white/20 bg-black/35 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300">{tr('Czerwony naroĹĽnik', 'Red corner')}</p>
              <p className="text-lg uppercase leading-none" style={{ color: fighterB.color }}>
                {fighterB.name || 'Fighter B'}
              </p>
            </div>
            <div className="relative h-[78%] overflow-hidden rounded-lg border bg-black/45" style={{ borderColor: `${fighterB.color}88` }}>
              {fighterB.imageUrl ? (
                <img src={fighterB.imageUrl} alt={fighterB.name || 'Fighter B'} className="h-full w-full object-cover object-center" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.14),transparent_45%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.9))]"
                  style={{ color: fighterB.color }}
                >
                  <div className="text-center">
                    <p className="text-[56px] font-semibold tracking-[0.04em]">{fighterMonogram(fighterB.name || 'Fighter B')}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{tr('Miejsce na portret', 'Portrait Slot')}</p>
                  </div>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 border-[3px] border-black/35" />
              <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:28px_28px]" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeTemplateId === 'battle-dynamics') {
    const phase1 = line(
      0,
      ['phase_1', 'phase1'],
      tr(
        `${fighterA.name || 'Fighter A'} narzuca tempo szybkoĹ›ciÄ….`,
        `${fighterA.name || 'Fighter A'} sets the pace with speed.`,
      ),
    )
    const phase2 = line(
      1,
      ['phase_2', 'phase2'],
      tr(
        `${fighterB.name || 'Fighter B'} ignoruje obraĹĽenia i skraca dystans.`,
        `${fighterB.name || 'Fighter B'} absorbs damage and closes distance.`,
      ),
    )
    const phase3 = line(
      2,
      ['phase_3', 'phase3'],
      tr(
        `${fighterB.name || 'Fighter B'} zyskuje przewagÄ™ kondycyjnÄ….`,
        `${fighterB.name || 'Fighter B'} gains late stamina advantage.`,
      ),
    )
    const analysisLine =
      pickTemplateField(blockFields, ['analysis', 'note', 'line_4', 'line4']) ||
      tr(
        `Analiza: ${fighterA.name || 'Fighter A'} wygrywa sprint. ${fighterB.name || 'Fighter B'} wygrywa maraton.`,
        `Analysis: ${fighterA.name || 'Fighter A'} wins the sprint. ${fighterB.name || 'Fighter B'} wins the marathon.`,
      )
    const curveAValues = parseCurveValues(
      pickTemplateField(blockFields, ['a_curve', 'curve_a', 'blue_curve', 'left_curve']),
      [78, 64, 50, 32, 20],
    )
    const curveBValues = parseCurveValues(
      pickTemplateField(blockFields, ['b_curve', 'curve_b', 'red_curve', 'right_curve']),
      [35, 35, 35, 35, 35],
    )
    const yellowWaveValues = parseCurveValues(
      pickTemplateField(blockFields, ['yellow_wave', 'wave', 'chaos_wave']),
      [34, 36, 33, 35, 34, 36, 33, 35],
    )
    const curveA = buildCurvePolyline(curveAValues, 5, 96, 8, 41)
    const curveB = buildCurvePolyline(curveBValues, 5, 96, 8, 41)
    const yellowWave = buildCurvePolyline(yellowWaveValues, 5, 96, 8, 41)

    return (
      <div className="relative z-10 flex h-full flex-col text-slate-100">
        <div className="relative mt-1 min-h-0 flex-1 rounded-xl border border-cyan-300/35 bg-[linear-gradient(180deg,#06172a_0%,#0a2036_52%,#061325_100%)] p-3">
          <h2 className="text-center text-[52px] uppercase leading-none tracking-[0.02em] text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            {headerText}
          </h2>
          <p className="mt-1 text-center text-[12px] uppercase tracking-[0.16em] text-slate-300">{subText}</p>

          <div className="relative mt-2 min-h-0 rounded-md border border-cyan-300/30 bg-slate-950/65 p-2">
            <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(125,211,252,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(125,211,252,0.18)_1px,transparent_1px)] [background-size:10%_20%]" />
            <svg viewBox="0 0 100 49" className="relative z-10 h-[300px] w-full">
              <defs>
                <marker id="arrow-dark" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 z" fill="#cbd5e1" />
                </marker>
              </defs>

              {[10, 18, 26, 34].map((y) => (
                <line key={`grid-y-${y}`} x1="5" y1={y} x2="96" y2={y} stroke="rgba(125,211,252,0.35)" strokeWidth="0.12" />
              ))}
              {[14, 23, 32, 41, 50, 59, 68, 77, 86].map((x) => (
                <line key={`grid-x-${x}`} x1={x} y1="8" x2={x} y2="44" stroke="rgba(125,211,252,0.35)" strokeWidth="0.12" />
              ))}

              <line x1="5" y1="44" x2="96" y2="44" stroke="#cbd5e1" strokeWidth="0.35" markerEnd="url(#arrow-dark)" />
              <line x1="5" y1="44" x2="5" y2="5" stroke="#cbd5e1" strokeWidth="0.35" markerEnd="url(#arrow-dark)" />

              <text x="4.5" y="47.8" fontSize="2.5" fill="#e2e8f0" fontWeight="700">{tr('START', 'START')}</text>
              <text x="45" y="47.8" fontSize="2.5" fill="#e2e8f0" fontWeight="700">{tr('CZAS WALKI', 'FIGHT TIME')}</text>
              <text x="90.8" y="47.8" fontSize="2.5" fill="#e2e8f0" fontWeight="700">END</text>

              <text x="3" y="30" fontSize="2.7" fill="#e2e8f0" fontWeight="700" transform="rotate(-90 3 30)">
                {tr('PRZEWAGA / KONDYCJA', 'ADVANTAGE / STAMINA')}
              </text>

              <line x1="50.5" y1="8" x2="50.5" y2="44" stroke="#64748b" strokeWidth="0.25" strokeDasharray="1.1 0.9" />
              <polyline points={curveA.polyline} fill="none" stroke="rgba(56,189,248,0.35)" strokeWidth="2.3" />
              <polyline points={curveA.polyline} fill="none" stroke="#0ea5e9" strokeWidth="1.3" />
              <polyline points={curveB.polyline} fill="none" stroke="rgba(244,63,94,0.45)" strokeWidth="2.1" />
              <polyline points={curveB.polyline} fill="none" stroke="#c81e3a" strokeWidth="1.2" />
              <polyline points={yellowWave.polyline} fill="none" stroke="#eab308" strokeWidth="0.4" opacity="0.9" />

              {curveB.points.map((point, index) => (
                <circle key={`r-${index}-${point.x}`} cx={point.x} cy={point.y} r="0.56" fill="#ef4444" stroke="#7f1d1d" strokeWidth="0.2" />
              ))}
              {curveA.points.map((point, index) => (
                <circle key={`b-${index}-${point.x}`} cx={point.x} cy={point.y} r="0.56" fill="#0ea5e9" stroke="#0c4a6e" strokeWidth="0.2" />
              ))}
            </svg>

            <div className="relative z-10 mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-sm border-[3px] border-[#0ea5e9] bg-[#071b31]/95 p-2 text-[16px] leading-tight text-slate-100 shadow-[4px_4px_0_rgba(14,165,233,0.45)]">
                <p className="font-semibold">{tr('Faza 1: Otwarcie.', 'Phase 1: Opening.')}</p>
                <p>{phase1}</p>
              </div>
              <div className="rounded-sm border-[3px] border-[#64748b] bg-[#111827]/95 p-2 text-[16px] leading-tight text-slate-100 shadow-[4px_4px_0_rgba(71,85,105,0.45)]">
                <p className="font-semibold">{tr('Faza 2: Mid-Fight.', 'Phase 2: Mid-Fight.')}</p>
                <p>{phase2}</p>
              </div>
              <div className="rounded-sm border-[3px] border-[#f43f5e] bg-[#2b101b]/95 p-2 text-[16px] leading-tight text-slate-100 shadow-[4px_4px_0_rgba(244,63,94,0.45)]">
                <p className="font-semibold">{tr('Faza 3: Attrition.', 'Phase 3: Attrition.')}</p>
                <p>{phase3}</p>
              </div>
            </div>
          </div>

          <div className="mt-2 rounded-md border border-cyan-300/35 bg-slate-900/78 px-3 py-1 text-center text-[20px] font-semibold text-slate-100">
            {analysisLine}
          </div>
        </div>
      </div>
    )
  }

  if (activeTemplateId === 'x-factor') {
    const superPct = parsePercentValue(
      pickTemplateField(blockFields, ['a_value', 'super_value', 'superman', 'left_value']),
      40,
    )
    const hyperPct = parsePercentValue(
      pickTemplateField(blockFields, ['b_value', 'hyper_value', 'hyperion', 'right_value']),
      40,
    )
    const superBonusPct = parsePercentValue(
      pickTemplateField(blockFields, ['a_bonus', 'super_bonus', 'left_bonus']),
      0,
    )
    const hyperBonusPct = parsePercentValue(
      pickTemplateField(blockFields, ['b_bonus', 'hyper_bonus', 'right_bonus']),
      0,
    )
    const superTotalPct = Math.max(0, Math.min(100, superPct + superBonusPct))
    const hyperTotalPct = Math.max(0, Math.min(100, hyperPct + hyperBonusPct))
    const xLabel = line(0, ['factor', 'headline'], tr('REGENERACJA I PRZETRWANIE', 'REGENERATION AND SURVIVAL'))
    const xTitle =
      pickTemplateField(blockFields, ['headline', 'header', 'title']) ||
      `X-FACTOR: ${xLabel}`
    const xSubtitle =
      pickTemplateField(blockFields, ['subtitle', 'note']) || subText
    const mechanics = line(
      1,
      ['mechanika', 'mechanics'],
      tr(
        `${fighterB.name || 'Fighter B'} posiada potÄ™ĹĽny czynnik regeneracyjny.`,
        `${fighterB.name || 'Fighter B'} has a major regeneration factor.`,
      ),
    )
    const implication = line(
      2,
      ['implikacja', 'implication'],
      tr(
        `${fighterB.name || 'Fighter B'} nie musi wygraÄ‡ kaĹĽdej wymiany. Wystarczy, ĹĽe przetrwa.`,
        `${fighterB.name || 'Fighter B'} does not need to win every exchange. Surviving is enough.`,
      ),
    )
    const psychology = line(
      3,
      ['psychologia', 'psychology'],
      tr('Styl survival i walka na wyniszczenie zwiÄ™kszajÄ… jego szanse.', 'Survival mindset and attrition fighting raise his odds.'),
    )
    const superBonusLabel = pickTemplateField(blockFields, ['a_bonus_label', 'left_bonus_label']) || '+ BOOST'
    const regenLabel = pickTemplateField(blockFields, ['regen', 'regen_label']) || '+ REGEN'

    return (
      <div className="relative z-10 flex h-full flex-col text-slate-100">
        <div className="relative mt-1 min-h-0 flex-1 rounded-xl border border-cyan-300/35 bg-[linear-gradient(180deg,#06172a_0%,#0a2036_52%,#061325_100%)] p-3">
          <h2 className="text-center text-[52px] uppercase leading-none tracking-[0.02em] text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            {xTitle}
          </h2>
          <p className="mt-1 text-center text-[12px] uppercase tracking-[0.16em] text-slate-300">{xSubtitle}</p>

          <div className="mt-2 min-h-0 flex-1 rounded-md border border-cyan-300/25 bg-slate-950/65 p-3">
            <div className="space-y-6">
              <div>
                <p className="text-[58px] font-semibold uppercase leading-none tracking-[0.01em]" style={{ color: '#38bdf8', fontFamily: 'var(--font-display)' }}>
                  {fighterA.name || 'Fighter A'}
                </p>
                <div className="mt-2 grid grid-cols-[1fr_168px] items-center gap-2">
                  <div className="relative h-14 overflow-hidden rounded-md border-2 border-slate-500/70 bg-slate-900/85 shadow-[0_0_0_1px_rgba(125,211,252,0.12)]">
                    <div className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,#0ea5e9,#1d4ed8)]" style={{ width: `${superPct}%` }} />
                    {superBonusPct > 0 ? (
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          clipPath: `inset(5% ${Math.max(0, 100 - superTotalPct)}% 5% ${Math.max(0, Math.min(100, superPct))}%)`,
                          background:
                            'repeating-linear-gradient(135deg, rgba(56,189,248,0.75) 0px, rgba(56,189,248,0.75) 8px, rgba(15,23,42,0) 8px, rgba(15,23,42,0) 16px)',
                        }}
                      />
                    ) : null}
                    <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(226,232,240,0.08)_0px,rgba(226,232,240,0.08)_8px,rgba(15,23,42,0)_8px,rgba(15,23,42,0)_16px)]" />
                  </div>
                  <div className="flex h-14 w-[168px] flex-col items-center justify-center rounded-md border-2 border-cyan-300/55 bg-slate-950/92 px-3 leading-none text-sky-300">
                    <span className={superBonusPct > 0 ? 'text-[34px]' : 'text-[42px]'}>{Math.round(superPct)}%</span>
                    {superBonusPct > 0 ? (
                      <span className="text-[12px] uppercase tracking-[0.1em] text-cyan-100">
                        +{Math.round(superBonusPct)}% {superBonusLabel}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[58px] font-semibold uppercase leading-none tracking-[0.01em]" style={{ color: '#f87171', fontFamily: 'var(--font-display)' }}>
                  {fighterB.name || 'Fighter B'}
                </p>
                <div className="mt-2 grid grid-cols-[1fr_168px] items-center gap-2">
                  <div className="relative h-14 overflow-hidden rounded-md border-2 border-slate-500/70 bg-slate-900/85 shadow-[0_0_0_1px_rgba(248,113,113,0.12)]">
                    <div className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,#ef4444,#b91c1c)]" style={{ width: `${hyperPct}%` }} />
                    {hyperBonusPct > 0 ? (
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          clipPath: `inset(5% ${Math.max(0, 100 - hyperTotalPct)}% 5% ${Math.max(0, Math.min(100, hyperPct))}%)`,
                          background:
                            'repeating-linear-gradient(135deg, rgba(248,113,113,0.75) 0px, rgba(248,113,113,0.75) 8px, rgba(15,23,42,0) 8px, rgba(15,23,42,0) 16px)',
                        }}
                      />
                    ) : null}
                    <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(226,232,240,0.08)_0px,rgba(226,232,240,0.08)_8px,rgba(15,23,42,0)_8px,rgba(15,23,42,0)_16px)]" />
                  </div>
                  <div className="flex h-14 w-[168px] flex-col items-center justify-center rounded-md border-2 border-rose-300/55 bg-slate-950/92 px-3 leading-none text-rose-200">
                    <span className={hyperBonusPct > 0 ? 'text-[34px]' : 'text-[36px]'}>{Math.round(hyperPct)}%</span>
                    {hyperBonusPct > 0 ? (
                      <span className="text-[12px] uppercase tracking-[0.1em] text-rose-100">
                        +{Math.round(hyperBonusPct)}% {regenLabel}
                      </span>
                    ) : (
                      <span className="text-[13px] uppercase tracking-[0.12em] text-rose-100">{regenLabel}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-md border border-slate-500/70 bg-slate-900/85 p-2">
                <div className="flex items-start gap-2">
                  <WandSparkles size={20} className="mt-1 text-cyan-200" />
                  <div>
                    <p className="text-[16px] font-semibold uppercase leading-none text-slate-100">{tr('Mechanika:', 'Mechanics:')}</p>
                    <p className="mt-1 text-[15px] leading-tight text-slate-200">{mechanics}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-slate-500/70 bg-slate-900/85 p-2">
                <div className="flex items-start gap-2">
                  <Crosshair size={20} className="mt-1 text-cyan-200" />
                  <div>
                    <p className="text-[16px] font-semibold uppercase leading-none text-slate-100">{tr('Implikacja:', 'Implication:')}</p>
                    <p className="mt-1 text-[15px] leading-tight text-slate-200">{implication}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-slate-500/70 bg-slate-900/85 p-2">
                <div className="flex items-start gap-2">
                  <Brain size={20} className="mt-1 text-cyan-200" />
                  <div>
                    <p className="text-[16px] font-semibold uppercase leading-none text-slate-100">{tr('Psychologia:', 'Psychology:')}</p>
                    <p className="mt-1 text-[15px] leading-tight text-slate-200">{psychology}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeTemplateId === 'interpretation') {
    const leaderSide: 'a' | 'b' = averageA >= averageB ? 'a' : 'b'
    const leaderName = leaderSide === 'a' ? fighterA.name || 'Fighter A' : fighterB.name || 'Fighter B'
    const leaderColor = leaderSide === 'a' ? '#0b69ad' : '#b91c1c'
    const topEdges = [...rows]
      .map((row) => {
        const delta = leaderSide === 'a' ? row.a - row.b : row.b - row.a
        return { label: row.label.toUpperCase(), delta }
      })
      .filter((row) => row.delta > 0)
      .sort((left, right) => right.delta - left.delta)

    const maxDelta = topEdges.length ? topEdges[0].delta : 1
    const fallbackEdges = [
      { label: 'SILA', delta: 4 },
      { label: 'SZYBKOSC', delta: 12 },
      { label: 'IQ BOJOWE', delta: 8 },
    ]
    const bars = topEdges.length ? topEdges : fallbackEdges

    const bullet1 = line(
      0,
      ['line_1', 'line1', 'thesis'],
      tr(
        `${leaderName} prowadzi w kluczowych statystykach atletycznych.`,
        `${leaderName} leads in key athletic categories.`,
      ),
    )
    const bullet2 = line(
      1,
      ['line_2', 'line2', 'antithesis'],
      tr('Jako technik ma lepszy toolkit do kontroli dystansu.', 'As a technician, he has the better toolkit for range control.'),
    )
    const bullet3 = line(
      2,
      ['line_3', 'line3', 'conclusion'],
      tr(`W modelu liniowym ${leaderName} wygrywa wiÄ™kszoĹ›Ä‡ scenariuszy.`, `In a linear model, ${leaderName} wins most scenarios.`),
    )
    const closingQuote =
      pickTemplateField(blockFields, ['quote', 'line_4', 'line4']) ||
      tr(
        'Gdyby walka byĹ‚a matematykÄ…, analiza by siÄ™ skoĹ„czyĹ‚a. Ale walka to chaos.',
        'If fighting were math, analysis would end here. But fighting is chaos.',
      )

    return (
      <div className="relative z-10 flex h-full flex-col text-slate-100">
        <div className="relative mt-1 min-h-0 flex-1 rounded-xl border border-cyan-300/35 bg-[linear-gradient(180deg,#06172a_0%,#0a2036_52%,#061325_100%)] p-3">
          <h2 className="text-center text-[52px] uppercase leading-none tracking-[0.02em] text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            {headerText}
          </h2>
          <p className="mt-1 text-center text-[12px] uppercase tracking-[0.16em] text-slate-300">{subText}</p>

          <div className="relative mt-2 rounded-md border border-cyan-300/25 bg-slate-950/70 p-2">
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(125,211,252,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(125,211,252,0.18)_1px,transparent_1px)] [background-size:12%_33%]" />
            <div className="relative z-10 grid grid-cols-[0.9fr_1.7fr] gap-2">
              <div className="flex min-h-[185px] items-center justify-center rounded-md border-2 p-3" style={{ borderColor: leaderColor, backgroundColor: `${leaderColor}1A` }}>
                <div className="w-full rounded-md border border-slate-500/70 bg-[linear-gradient(135deg,rgba(2,132,199,0.28),rgba(15,23,42,0.5))] p-2 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border-2 text-3xl font-bold" style={{ borderColor: leaderColor, color: leaderColor }}>
                    âś“
                  </div>
                  <p className="mt-3 text-[52px] uppercase leading-none" style={{ color: leaderColor, fontFamily: 'var(--font-display)' }}>
                    {leaderName}
                  </p>
                </div>
              </div>

              <div className="max-h-[286px] space-y-2 overflow-y-auto py-2 pr-1">
                {bars.map((bar, index) => {
                  const width = 26 + (bar.delta / Math.max(maxDelta, 1)) * 50
                  return (
                    <div key={`interp-bar-${index}-${bar.label}`} className="grid grid-cols-[1fr_auto] items-center gap-2">
                      <div className="h-8 overflow-hidden rounded-sm border border-slate-500/70 bg-slate-900/85">
                        <div className="h-full" style={{ width: `${width}%`, background: 'linear-gradient(90deg,#0b69ad,#1377b9)' }} />
                      </div>
                      <p className="text-[20px] font-semibold uppercase leading-none text-slate-100">
                        {bar.label} (+{bar.delta})
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-2 rounded-md border border-slate-500/70 bg-slate-900/82 px-4 py-3">
            <ul className="list-disc space-y-1 pl-6 text-[20px] leading-tight text-slate-100">
              <li>{bullet1}</li>
              <li>{bullet2}</li>
              <li>{bullet3}</li>
            </ul>
          </div>

          <div className="mt-2 rounded-md border border-cyan-300/35 bg-slate-900/82 px-3 py-2 text-center text-[18px] italic text-slate-100">
            "{closingQuote}"
          </div>
        </div>
      </div>
    )
  }

  if (activeTemplateId === 'fight-simulation') {
    const opening = line(0, ['opening'], tr('Otwarcie: szybka kontrola dystansu.', 'Opening: fast range control.'))
    const midFight = line(1, ['mid_fight', 'midfight'], tr('Ĺšrodek walki: presja i pÄ™tle regeneracji.', 'Mid fight: pressure and recovery loops.'))
    const lateFight = line(2, ['late_fight', 'latefight'], tr('KoĹ„cowa faza: test wyniszczenia.', 'Late fight: attrition checks.'))
    const endCondition = line(3, ['end_condition', 'endcondition'], tr('Warunek koĹ„ca: KO/BFR kontra kill-only.', 'End condition: KO/BFR vs kill-only.'))
    const fallbackRows = [rows[0], rows[1], rows[5] || rows[2]].filter(Boolean) as ScoreRow[]

    const phaseDefaults = [
      {
        mode: 'bars' as const,
        animation: 'orbit-harass' as FightScenarioId,
        lead: 'a' as FightScenarioLead,
        title: opening,
        aLabel: fallbackRows[0]?.label || 'Strength',
        bLabel: fallbackRows[0]?.label || 'Strength',
        aValue: fallbackRows[0]?.a ?? 96,
        bValue: fallbackRows[0]?.b ?? 84,
        event: tr(`${fighterA.name || 'Fighter A'} narzuca tempo.`, `${fighterA.name || 'Fighter A'} sets the pace.`),
        branchA: tr(`${fighterA.name || 'Fighter A'} utrzymuje kontrolÄ™ dystansu.`, `${fighterA.name || 'Fighter A'} keeps range control.`),
        branchB: tr(`${fighterB.name || 'Fighter B'} przeĹ‚amuje dystans.`, `${fighterB.name || 'Fighter B'} breaks the distance.`),
      },
      {
        mode: 'split' as const,
        animation: 'clash-lock' as FightScenarioId,
        lead: 'a' as FightScenarioLead,
        title: midFight,
        aLabel: fallbackRows[1]?.label || 'Speed',
        bLabel: fallbackRows[1]?.label || 'Speed',
        aValue: fallbackRows[1]?.a ?? 92,
        bValue: fallbackRows[1]?.b ?? 88,
        event: tr('Punkt zwrotny: pierwsza wymiana zmienia warunki starcia.', 'Turning point: first exchange shifts the conditions.'),
        branchA: tr(`${fighterA.name || 'Fighter A'} buduje przewagÄ™ technikÄ….`, `${fighterA.name || 'Fighter A'} builds advantage with technique.`),
        branchB: tr(`${fighterB.name || 'Fighter B'} wymusza chaos i wyniszczenie.`, `${fighterB.name || 'Fighter B'} forces chaos and attrition.`),
      },
      {
        mode: 'bars' as const,
        animation: 'regen-attrition' as FightScenarioId,
        lead: 'a' as FightScenarioLead,
        title: lateFight,
        aLabel: fallbackRows[2]?.label || 'Stamina',
        bLabel: fallbackRows[2]?.label || 'Stamina',
        aValue: fallbackRows[2]?.a ?? 90,
        bValue: fallbackRows[2]?.b ?? 93,
        event: tr('KoĹ„cowy punkt zwrotny.', 'Final turning point.'),
        branchA: tr(`${fighterA.name || 'Fighter A'} domyka walkÄ™ decyzjÄ….`, `${fighterA.name || 'Fighter A'} closes the fight by decision.`),
        branchB: tr(`${fighterB.name || 'Fighter B'} przeĹ‚amuje rywala pĂłĹşno.`, `${fighterB.name || 'Fighter B'} breaks the rival late.`),
      },
    ]

    const globalModeToken = normalizeToken(
      pickTemplateField(blockFields, ['phase_mode', 'phasemode', 'mode', 'simulation_mode', 'simulationmode']),
    )

    const parsePhaseMode = (
      token: string,
      fallback: 'bars' | 'split' | 'animation',
    ): 'bars' | 'split' | 'animation' => {
      if (!token) return fallback
      if (token.includes('anim') || token.includes('scenario') || token.includes('preset')) return 'animation'
      if (token.includes('split') || token.includes('branch') || token.includes('turn') || token.includes('pivot')) return 'split'
      return 'bars'
    }

    const globalAnimationValue = pickTemplateField(blockFields, [
      'phase_animation',
      'phaseanimation',
      'animation',
      'scenario',
      'preset',
      'simulation_animation',
      'simulationanimation',
    ])

    const globalAnimationId = resolveFightScenarioId(globalAnimationValue, phaseDefaults[0]?.animation || 'orbit-harass')
    const globalLeadValue = pickTemplateField(blockFields, ['phase_actor', 'phaseactor', 'actor', 'lead', 'aggressor', 'attacker'])
    const globalLead = resolveFightScenarioLead(globalLeadValue, phaseDefaults[0]?.lead || 'a')

    const phaseMode = (index: number, fallback: 'bars' | 'split' | 'animation') => {
      const token = normalizeToken(
        pickTemplateField(blockFields, [
          `phase_${index}_mode`,
          `phase${index}mode`,
          `phase_${index}_type`,
          `phase${index}type`,
        ]),
      )
      return parsePhaseMode(token || globalModeToken, fallback)
    }

    const phaseAnimation = (index: number, fallback: FightScenarioId) =>
      resolveFightScenarioId(
        pickTemplateField(blockFields, [
          `phase_${index}_animation`,
          `phase${index}animation`,
          `phase_${index}_scenario`,
          `phase${index}scenario`,
          `phase_${index}_preset`,
          `phase${index}preset`,
        ]) || globalAnimationValue,
        fallback || globalAnimationId,
      )

    const phaseLead = (index: number, fallback: FightScenarioLead) =>
      resolveFightScenarioLead(
        pickTemplateField(blockFields, [
          `phase_${index}_actor`,
          `phase${index}actor`,
          `phase_${index}_lead`,
          `phase${index}lead`,
          `phase_${index}_aggressor`,
          `phase${index}aggressor`,
          `phase_${index}_attacker`,
          `phase${index}attacker`,
        ]) || globalLeadValue,
        fallback || globalLead,
      )

    const phaseData = [1, 2, 3].map((index) => {
      const defaults = phaseDefaults[index - 1]
      return {
        mode: phaseMode(index, defaults.mode),
        animation: phaseAnimation(index, defaults.animation),
        lead: phaseLead(index, defaults.lead),
        title:
          pickTemplateField(blockFields, [
            `phase_${index}_title`,
            `phase${index}title`,
            `phase_${index}_headline`,
            `phase${index}headline`,
          ]) || defaults.title,
        aLabel:
          pickTemplateField(blockFields, [
            `phase_${index}_a_label`,
            `phase${index}alabel`,
            `phase_${index}_left_label`,
            `phase${index}leftlabel`,
          ]) || defaults.aLabel,
        bLabel:
          pickTemplateField(blockFields, [
            `phase_${index}_b_label`,
            `phase${index}blabel`,
            `phase_${index}_right_label`,
            `phase${index}rightlabel`,
          ]) || defaults.bLabel,
        aValue: parsePercentValue(
          pickTemplateField(blockFields, [
            `phase_${index}_a_value`,
            `phase${index}avalue`,
            `phase_${index}_left_value`,
            `phase${index}leftvalue`,
          ]),
          defaults.aValue,
        ),
        bValue: parsePercentValue(
          pickTemplateField(blockFields, [
            `phase_${index}_b_value`,
            `phase${index}bvalue`,
            `phase_${index}_right_value`,
            `phase${index}rightvalue`,
          ]),
          defaults.bValue,
        ),
        event:
          pickTemplateField(blockFields, [
            `phase_${index}_event`,
            `phase${index}event`,
            `phase_${index}_turn`,
            `phase${index}turn`,
            `phase_${index}_pivot`,
            `phase${index}pivot`,
          ]) || defaults.event,
        branchA:
          pickTemplateField(blockFields, [
            `phase_${index}_branch_a`,
            `phase${index}brancha`,
            `phase_${index}_option_a`,
            `phase${index}optiona`,
            `phase_${index}_left_option`,
            `phase${index}leftoption`,
          ]) || defaults.branchA,
        branchB:
          pickTemplateField(blockFields, [
            `phase_${index}_branch_b`,
            `phase${index}branchb`,
            `phase_${index}_option_b`,
            `phase${index}optionb`,
            `phase_${index}_right_option`,
            `phase${index}rightoption`,
          ]) || defaults.branchB,
      }
    })

    return (
      <div className="relative z-10 flex h-full flex-col text-slate-100">
        <div className="relative mt-1 min-h-0 flex-1 rounded-xl border border-cyan-300/35 bg-[linear-gradient(180deg,#06172a_0%,#0a2036_52%,#061325_100%)] p-3">
          <h2 className="text-center text-[48px] uppercase leading-none tracking-[0.03em] text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            {headerText}
          </h2>
          <p className="mt-1 text-center text-[12px] uppercase tracking-[0.16em] text-slate-300">{subText}</p>

          <div className="mt-2 grid min-h-0 flex-1 grid-cols-3 items-stretch gap-3 rounded-md border border-cyan-300/25 bg-slate-950/68 p-3">
            {phaseData.map((phase, index) => (
              <div key={`phase-sim-${index}-${phase.title}`} className="flex min-h-[430px] flex-col rounded-lg border border-slate-500/70 bg-slate-900/84 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">{tr('Faza', 'Phase')} {index + 1}</p>
                  <span className="rounded-full border border-cyan-300/45 bg-cyan-400/12 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-cyan-100">
                    {phase.mode === 'bars' ? tr('paski', 'bars') : phase.mode === 'split' ? tr('punkt zwrotny', 'turning point') : tr('animacja', 'animation')}
                  </span>
                </div>
                <p className="text-[20px] font-semibold leading-tight text-slate-100">{phase.title}</p>

                <div className="mt-2 rounded-md border border-slate-600/70 bg-slate-950/75 p-2">
                  <FightScenarioCanvas scenario={phase.animation} colorA={fighterA.color} colorB={fighterB.color} lead={phase.lead} />
                  <div className="mt-1 flex items-center justify-between rounded border border-slate-700/70 bg-slate-900/72 px-2 py-1">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{tr('Preset scenariusza', 'Scenario preset')}</span>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-cyan-100">{fightScenarioLabel(phase.animation, language)}</span>
                  </div>
                </div>

                {phase.mode === 'bars' ? (
                  <div className="mt-2 flex flex-1 items-stretch">
                    <div className="flex w-full items-end justify-center gap-10 rounded-md border border-slate-600/70 bg-slate-950/75 p-3">
                      {[
                        {
                          id: 'a',
                          label: phase.aLabel,
                          value: phase.aValue,
                          color: 'bg-[linear-gradient(180deg,#22d3ee,#1d4ed8)]',
                          textColor: 'text-sky-200',
                        },
                        {
                          id: 'b',
                          label: phase.bLabel,
                          value: phase.bValue,
                          color: 'bg-[linear-gradient(180deg,#fb7185,#b91c1c)]',
                          textColor: 'text-rose-200',
                        },
                      ].map((entry) => (
                        <div key={`phase-bar-${index}-${entry.id}`} className="flex h-full w-[44%] flex-col items-center justify-end">
                          <p className={`mb-2 text-[18px] font-semibold leading-none ${entry.textColor}`}>{Math.round(entry.value)}</p>
                          <div className="relative h-[170px] w-14 overflow-hidden rounded border border-slate-500/75 bg-slate-900/95">
                            <div className={`absolute bottom-0 left-0 right-0 ${entry.color}`} style={{ height: `${entry.value}%` }} />
                          </div>
                          <p className={`mt-2 text-center text-[11px] uppercase leading-tight tracking-[0.12em] ${entry.textColor}`}>
                            {entry.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-1 flex-col">
                    <p className="text-sm leading-tight text-slate-200">{phase.event}</p>
                    <div className="mt-2 flex flex-1 flex-col rounded-md border border-slate-600/70 bg-slate-950/75 p-2">
                      <svg viewBox="0 0 100 40" className="h-20 w-full">
                        <line x1="50" y1="2" x2="50" y2="14" stroke="#94a3b8" strokeWidth="1.1" />
                        <line x1="50" y1="14" x2="22" y2="37" stroke="#22d3ee" strokeWidth="1.2" />
                        <line x1="50" y1="14" x2="78" y2="37" stroke="#fb7185" strokeWidth="1.2" />
                        <circle cx="50" cy="14" r="2.2" fill="#e2e8f0" />
                      </svg>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="rounded border border-cyan-300/45 bg-cyan-500/12 px-2 py-1.5 text-xs leading-tight text-cyan-100">{phase.branchA}</div>
                        <div className="rounded border border-rose-300/45 bg-rose-500/12 px-2 py-1.5 text-xs leading-tight text-rose-100">{phase.branchB}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-2 rounded-md border border-cyan-300/35 bg-slate-900/82 px-3 py-2 text-center text-[18px] text-slate-100">
            {endCondition}
          </div>
        </div>
      </div>
    )
  }

  if (activeTemplateId === 'stat-trap') {
    const trapTop =
      pickTemplateField(blockFields, ['trap_top', 'top', 'line_1']) ||
      tr('REGEN I BRUTALNOĹšÄ† >', 'REGEN AND BRUTALITY >')
    const trapBottom =
      pickTemplateField(blockFields, ['trap_bottom', 'bottom', 'line_2']) ||
      tr('TECHNIKA W DĹUGIEJ WALCE', 'TECHNIQUE IN A LONG FIGHT')
    const example =
      pickTemplateField(blockFields, ['example', 'line_3']) ||
      tr(
        'RĂłĹĽnica 2-3 punktĂłw w umiejÄ™tnoĹ›ciach zanika, gdy przeciwnik leczy siÄ™ natychmiastowo po kaĹĽdym ciosie.',
        'A 2-3 point skill edge disappears when the opponent heals immediately after each hit.',
      )
    const questionLine =
      pickTemplateField(blockFields, ['question', 'line_4', 'trap']) ||
      tr(
        "KLUCZOWE PYTANIE: W trybie 'Kill-Only' regeneracja przeciwnika waĹĽy wiÄ™cej niĹĽ statystyki all-around.",
        "KEY QUESTION: In 'Kill-Only' rules, opponent regeneration matters more than all-around stats.",
      )

    const questionMatch = questionLine.match(/^([^:]+:)\s*(.*)$/)
    const questionLead = questionMatch?.[1] || tr('KLUCZOWE PYTANIE:', 'KEY QUESTION:')
    const questionBody = questionMatch?.[2] || questionLine

    return (
      <div className="relative z-10 flex h-full flex-col text-slate-100">
        <div className="relative mt-1 min-h-0 flex-1 overflow-hidden rounded-xl border border-cyan-300/35 bg-[linear-gradient(180deg,#06172a_0%,#0a2036_52%,#061325_100%)] p-3">
          <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(125,211,252,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(125,211,252,0.18)_1px,transparent_1px)] [background-size:7%_13%]" />

          <div className="relative z-10 flex h-full flex-col">
            <h2 className="text-center text-[72px] uppercase leading-none tracking-[0.02em] text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
              {headerText}
            </h2>
            <p className="mt-1 text-center text-[12px] uppercase tracking-[0.16em] text-slate-300">{subText}</p>

            <div className="mt-2 border-y border-cyan-300/25 py-2">
              <p
                className="flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap text-center text-[clamp(1.15rem,1.5vw,1.9rem)] uppercase leading-none"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <span className="shrink-0 text-[#b10f24]">{trapTop}</span>
                <span className="shrink-0 text-[#c4951a]">{trapBottom}</span>
              </p>
            </div>

            <p className="mt-2 whitespace-pre-line text-[clamp(1.8rem,1.95vw,2.95rem)] leading-[1.08] text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
              {example}
            </p>

            <div className="mt-[clamp(12px,1.4vh,22px)] mb-[-8px] flex items-center justify-center">
              <svg
                viewBox="0 0 100 92"
                className="h-[clamp(156px,16.8vw,252px)] w-[clamp(178px,19vw,286px)] drop-shadow-[0_0_16px_rgba(255,45,63,0.52)]"
                aria-hidden="true"
              >
                <polygon
                  points="50,6 95,84 5,84"
                  fill="rgba(255,255,255,0.96)"
                  stroke="#ff2d3f"
                  strokeWidth="6"
                  strokeLinejoin="round"
                />
                <line x1="50" y1="30" x2="50" y2="56" stroke="#ff2d3f" strokeWidth="8" strokeLinecap="round" />
                <circle cx="50" cy="69" r="4.8" fill="#ff2d3f" />
              </svg>
            </div>

            <p className="mt-auto text-[clamp(1.6rem,1.75vw,2.6rem)] leading-[1.08] text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
              <span className="font-bold">{questionLead}</span> {questionBody}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (activeTemplateId === 'verdict-matrix') {
    const case1 = line(
      0,
      ['case_1', 'case1'],
      tr(
        `${fighterA.name || 'Fighter A'} (6/10). SzybkoĹ›Ä‡ i technika koĹ„czÄ… walkÄ™ przed czasem.`,
        `${fighterA.name || 'Fighter A'} (6/10). Speed and technique end the fight before attrition.`,
      ),
    )
    const case2 = line(
      1,
      ['case_2', 'case2'],
      tr(
        `${fighterB.name || 'Fighter B'} (5.5/10). Trudniej o szybkie domkniÄ™cie. Regen daje przewagÄ™.`,
        `${fighterB.name || 'Fighter B'} (5.5/10). Quick closure is harder. Regen gives edge.`,
      ),
    )
    const case3 = line(
      2,
      ['case_3', 'case3'],
      tr(
        `${fighterA.name || 'Fighter A'} (5.5/10). Ryzyko roĹ›nie. JeĹ›li szybki finisher nie wejdzie, rywal wraca.`,
        `${fighterA.name || 'Fighter A'} (5.5/10). Risk grows. If early finish fails, the rival recovers.`,
      ),
    )
    const case4 = line(
      3,
      ['case_4', 'case4'],
      tr(
        `${fighterB.name || 'Fighter B'} (6.5/10). Wojna na wyniszczenie faworyzuje regen.`,
        `${fighterB.name || 'Fighter B'} (6.5/10). Attrition war favors regen.`,
      ),
    )

    const splitCase = (value: string) => {
      const clean = value.trim()
      const normalized = clean.replace(/(\d)\s*\.\s*(\d)/g, '$1.$2')
      const match = normalized.match(/^(.+?[.!?])\s+([\p{L}].*)$/su)
      if (!match) return { lead: clean, body: '' }
      return { lead: match[1].trim(), body: match[2].trim() }
    }

    const colLeftHeader =
      pickTemplateField(blockFields, ['col_left', 'solar_flare_yes', 'solarflare_yes']) || tr('SOLAR FLARE: TAK', 'SOLAR FLARE: YES')
    const colRightHeader =
      pickTemplateField(blockFields, ['col_right', 'solar_flare_no', 'solarflare_no']) || tr('SOLAR FLARE: NIE', 'SOLAR FLARE: NO')
    const rowTopHeader =
      pickTemplateField(blockFields, ['row_top', 'standard', 'standard_ko']) || 'STANDARD KO'
    const rowBottomHeader =
      pickTemplateField(blockFields, ['row_bottom', 'deathmatch', 'kill_only']) || 'DEATHMATCH'

    const cells = [
      {
        id: 'tl',
        ...splitCase(case1),
        bg: 'bg-[linear-gradient(135deg,rgba(14,116,144,0.34),rgba(30,64,175,0.28))]',
        mark: fighterMonogram(fighterA.name || 'A'),
      },
      {
        id: 'tr',
        ...splitCase(case2),
        bg: 'bg-[linear-gradient(135deg,rgba(146,64,14,0.26),rgba(161,98,7,0.22))]',
        mark: fighterMonogram(fighterB.name || 'B'),
      },
      {
        id: 'bl',
        ...splitCase(case3),
        bg: 'bg-[linear-gradient(135deg,rgba(8,47,73,0.5),rgba(30,58,138,0.36))]',
        mark: fighterMonogram(fighterA.name || 'A'),
      },
      {
        id: 'br',
        ...splitCase(case4),
        bg: 'bg-[linear-gradient(135deg,rgba(120,53,15,0.4),rgba(133,77,14,0.3))]',
        mark: fighterMonogram(fighterB.name || 'B'),
      },
    ]

    return (
      <div className="relative z-10 flex h-full flex-col text-slate-100">
        <div className="relative mt-1 min-h-0 flex-1 overflow-hidden rounded-xl border border-cyan-300/35 bg-[linear-gradient(180deg,#06172a_0%,#0a2036_52%,#061325_100%)] p-3">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(125,211,252,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(125,211,252,0.2)_1px,transparent_1px)] [background-size:7%_13%]" />

          <div className="relative z-10 flex h-full flex-col">
            <h2 className="text-center text-[58px] uppercase leading-none tracking-[0.02em] text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
              {headerText}
            </h2>
            <p className="mt-1 text-center text-[12px] uppercase tracking-[0.16em] text-slate-300">{subText}</p>

            <div className="mt-2 grid min-h-0 flex-1 grid-cols-[96px_1fr] grid-rows-[56px_1fr]">
              <div />

              <div className="grid grid-cols-2">
                <div className="flex items-center justify-center border border-cyan-300/45 bg-slate-900/72 text-[38px] uppercase leading-none text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
                  {colLeftHeader}
                </div>
                <div className="flex items-center justify-center border border-l-0 border-cyan-300/45 bg-slate-900/72 text-[38px] uppercase leading-none text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
                  {colRightHeader}
                </div>
              </div>

              <div className="grid grid-rows-2">
                <div className="relative border border-r-0 border-t-0 border-cyan-300/45 bg-slate-900/72">
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[16px] uppercase tracking-[0.05em] text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
                    {rowTopHeader}
                  </span>
                </div>
                <div className="relative border border-r-0 border-t-0 border-cyan-300/45 bg-slate-900/72">
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[16px] uppercase tracking-[0.05em] text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
                    {rowBottomHeader}
                  </span>
                </div>
              </div>

              <div className="grid min-h-0 grid-cols-2 grid-rows-2 border border-t-0 border-cyan-300/45">
                {cells.map((cell, index) => (
                  <div
                    key={`matrix-cell-${cell.id}`}
                    className={`relative overflow-hidden border-cyan-300/45 p-3 ${cell.bg} ${index % 2 === 0 ? 'border-r' : ''} ${index < 2 ? 'border-b' : ''}`}
                  >
                    <p className="relative z-10 text-[clamp(1.3rem,1.45vw,2.2rem)] font-semibold uppercase leading-tight text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
                      {cell.lead}
                    </p>
                    {cell.body ? (
                      <p className="relative z-10 mt-1 text-[clamp(1.15rem,1.25vw,1.9rem)] leading-[1.08] text-slate-100" style={{ fontFamily: 'var(--font-ui)' }}>
                        {cell.body}
                      </p>
                    ) : null}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[170px] font-bold text-white/10">
                      {cell.mark}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <h2 className="text-center text-3xl uppercase tracking-[0.08em] text-slate-50">{headerText}</h2>
      <p className="mt-1 text-center text-sm uppercase tracking-[0.16em] text-slate-300">{subText}</p>
      <div className="mt-3 flex min-h-0 flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-400/45 bg-black/26">
        {renderedLines.length ? (
          <div className="w-[88%] rounded-xl border border-slate-500/45 bg-slate-950/60 p-4">
            <p className="text-center text-xs uppercase tracking-[0.18em] text-slate-300">{tr('PodglÄ…d bloku template', 'Template block preview')}</p>
            <div className="mt-3 max-h-[320px] space-y-1 overflow-y-auto pr-1 text-sm text-slate-100">
              {renderedLines.map((line, index) => (
                <div key={`blank-line-${index}-${line}`} className="rounded border border-slate-700/55 bg-black/35 px-2 py-1">
                  {line}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[20px] uppercase tracking-[0.24em] text-slate-400">{tr('PUSTE POLE', 'EMPTY FIELD')}</p>
        )}
      </div>
    </div>
  )
}

function MethodologyTemplate({ rows, title, subtitle, templateBlocks, language }: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES.methodology || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const listLabel = pickTemplateField(blockFields, ['list_label']) || tr('Lista metod', 'Method list')
  const realityLabel = pickTemplateField(blockFields, ['reality_label']) || tr('RzeczywistoĹ›Ä‡ walki', 'Combat reality')
  const linearLabel = pickTemplateField(blockFields, ['linear_label']) || tr('ODCINEK LINIOWY', 'LINEAR SEGMENT')
  const chaosLabel = pickTemplateField(blockFields, ['chaos_label']) || tr('ODCINEK CHAOSU', 'CHAOS SEGMENT')
  const closingLabel = pickTemplateField(blockFields, ['closing_label']) || tr('Statystyki sÄ… liniowe. Walka nie jest.', 'Stats are linear. Fight is not.')
  const safeRows = rows.length
    ? rows
    : [{ id: 'fallback', label: tr('Bazowy', 'Baseline'), a: 50, b: 50, delta: 0, winner: 'draw' as const }]

  const splitX = 50
  const linearStartX = 8
  const chaosEndX = 92
  const stablePoints = `${linearStartX},50 ${splitX},50`
  const linearLabelX = 25
  const chaosLabelX = 75

  return (
    <div className="relative z-10 flex h-full flex-col text-slate-100">
      <div className="border-b border-slate-400/25 pb-2">
        <h2 className="text-3xl uppercase tracking-[0.08em] text-slate-50">{headerText}</h2>
        <p className="text-base text-slate-300">{subText}</p>
      </div>

      <div className="mt-3 grid flex-1 grid-cols-[1fr_1.7fr] gap-3">
        <div className="min-h-0 rounded-xl border border-slate-300/30 bg-black/28 p-3">
          <p className="mb-2 text-[12px] uppercase tracking-[0.18em] text-slate-300">{listLabel}</p>
          <div className="max-h-full space-y-1 overflow-y-auto pr-1 text-[clamp(0.9rem,1.05vw,1.22rem)] leading-tight text-slate-100">
            {safeRows.map((row, index) => (
              <div key={`method-${row.id}`} className="rounded border border-slate-700/60 bg-slate-900/72 px-2 py-0.5">
                {index + 1}. {row.label}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-rows-[1fr_auto] gap-3">
          <div className="rounded-xl border border-slate-300/30 bg-black/28 p-3">
            <p className="text-[12px] uppercase tracking-[0.18em] text-slate-300">{realityLabel}</p>
            <div className="mt-2 h-[72%] rounded-lg border border-slate-600/55 bg-slate-950/65 p-2">
              <div className="relative h-full w-full overflow-hidden rounded-md">
                <LightningCanvas
                  startRatio={{ x: splitX / 100, y: 0.5 }}
                  endRatio={{ x: chaosEndX / 100, y: 0.5 }}
                />
                <svg viewBox="0 0 100 100" className="relative z-10 h-full w-full">
                  <line
                    x1={splitX}
                    y1="8"
                    x2={splitX}
                    y2="92"
                    stroke="rgba(148,163,184,0.35)"
                    strokeWidth="0.7"
                    strokeDasharray="2 2"
                  />
                  <text x={linearLabelX} y="14" fill="#67e8f9" fontSize="4" letterSpacing="0.8" textAnchor="middle">
                    {linearLabel}
                  </text>
                  <text x={chaosLabelX} y="14" fill="#fda4af" fontSize="4" letterSpacing="0.8" textAnchor="middle">
                    {chaosLabel}
                  </text>

                  <polyline points={stablePoints} fill="none" stroke="#22d3ee" strokeWidth="1.7" />
                  <polyline points={stablePoints} fill="none" stroke="rgba(34,211,238,0.3)" strokeWidth="3.2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-300/45 bg-slate-900/85 px-4 py-3">
            <p className="text-[42px] leading-tight text-slate-50">{closingLabel}</p>
            <p className="mt-1 text-sm uppercase tracking-[0.15em] text-slate-300">{subText}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App




