import { Award, BookOpen, Brain, Clock3, Crosshair, Dumbbell, Flame, Gauge, Sparkles, Swords, WandSparkles, Zap, type LucideIcon } from 'lucide-react'
import { getTranslations } from '../../i18n'
import type { Category, Fighter, FighterFact, FightScenarioId, Frame, Language, ParsedVsImport, TemplateId, TemplatePreset, Theme } from './types'

type IconType = LucideIcon

export const FIGHTER_A_COLOR = '#3FC3CF'
export const FIGHTER_B_COLOR = '#EF5D5D'

export const DEFAULT_CATEGORIES: Category[] = [
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

export const defaultCategoriesFor = (language: Language): Category[] =>
  Object.entries(getTranslations(language).categories).map(([id, label]) => ({ id, label }))

export const FIGHTER_A: Fighter = {
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

export const FIGHTER_B: Fighter = {
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

export const TEMPLATE_PRESETS: TemplatePreset[] = [
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
    id: 'powers-tools',
    name: 'Powers / Tools / Weaknesses',
    description: 'Split dossier for both fighters with grouped tools and weaknesses.',
    layout: 'blankTemplate',
    frame: 'tech',
    theme: 'cosmic',
    title: 'POWERS / TOOLS / WEAKNESSES',
    subtitle: '',
  },
  {
    id: 'raw-feats',
    name: 'Raw Feats',
    description: 'Side-by-side feat ledger sourced from the import file.',
    layout: 'blankTemplate',
    frame: 'tech',
    theme: 'steel',
    title: 'RAW FEATS',
    subtitle: '',
  },
  {
    id: 'hud-bars',
    name: 'HUD Bars',
    description: 'Military HUD look with long horizontal bars like output (1).',
    layout: 'hudBars',
    frame: 'tech',
    theme: 'cosmic',
    title: 'CHARACTER STAT ESTIMATION',
    subtitle: '',
  },
  {
    id: 'radar-brief',
    name: 'Radar Brief',
    description: 'Center radar, side winner notes, bottom score strip.',
    layout: 'radarBrief',
    frame: 'neon',
    theme: 'cosmic',
    title: 'PARAMETER COMPARISON',
    subtitle: 'Favorite by stats',
  },
  {
    id: 'winner-cv',
    name: 'Winner CV',
    description: 'List of top beaten opponents for both fighters.',
    layout: 'winnerCv',
    frame: 'tech',
    theme: 'cosmic',
    title: 'WINNERS CV ARCHIVE',
    subtitle: 'Records and average score snapshot',
  },
  {
    id: 'summary',
    name: 'Podsumowanie',
    description: 'Summary card placeholder from imported template block.',
    layout: 'blankTemplate',
    frame: 'tech',
    theme: 'cosmic',
    title: 'PODSUMOWANIE KOŃCOWE',
    subtitle: '',
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
    subtitle: 'Who wins the fight on paper?',
  },
  {
    id: 'fight-simulation',
    name: 'Symulacja Walki',
    description: 'Simulation placeholder for phase-by-phase scenario.',
    layout: 'blankTemplate',
    frame: 'tech',
    theme: 'cosmic',
    title: 'SYMULACJA WALKI',
    subtitle: '',
  },
  {
    id: 'stat-trap',
    name: 'Pułapka Statystyk',
    description: 'Non-linear trap placeholder.',
    layout: 'blankTemplate',
    frame: 'tech',
    theme: 'steel',
    title: 'PUŁAPKA STATYSTYK',
    subtitle: 'Why better stats do not guarantee victory',
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
  {
    id: 'fight-title',
    name: 'Fight Title Outro',
    description: 'Animated title card rendered as the final screen.',
    layout: 'blankTemplate',
    frame: 'tech',
    theme: 'cosmic',
    title: 'FIGHT TITLE',
    subtitle: 'Animated final matchup text',
  },
]

export const pickLang = (language: Language, pl: string, en: string) => (language === 'pl' ? pl : en)

export const localizeTemplatePreset = (preset: TemplatePreset, language: Language): TemplatePreset => {
  const copy = getTranslations(language).templates.presets[preset.id]
  return {
    ...preset,
    name: copy.name,
    description: copy.description,
    title: copy.title,
    subtitle: copy.subtitle,
  }
}

export const FRAME_CLASSES: Record<Frame, string> = {
  neon:
    'border-cyan-300/70 shadow-[0_0_0_1px_rgba(125,211,252,0.4),0_0_42px_rgba(34,211,238,0.3)]',
  gold:
    'border-amber-300/70 shadow-[0_0_0_1px_rgba(251,191,36,0.45),inset_0_0_0_1px_rgba(251,191,36,0.2)]',
  tech: 'border-slate-300/60 shadow-[0_0_0_1px_rgba(148,163,184,0.45),0_0_36px_rgba(15,23,42,0.8)]',
}

export const THEME_CLASSES: Record<Theme, string> = {
  cosmic: 'bg-[linear-gradient(145deg,#020617_0%,#0f172a_55%,#172554_100%)]',
  ember: 'bg-[linear-gradient(145deg,#1f0805_0%,#451a03_55%,#111827_100%)]',
  steel: 'bg-[linear-gradient(145deg,#0f172a_0%,#1e293b_55%,#0f172a_100%)]',
}

export const LEGACY_FIGHTS_STORAGE_KEY = 'versus-verse-vault:fights:v1'
export const LEGACY_ACTIVE_FIGHT_STORAGE_KEY = 'versus-verse-vault:active-fight-id:v1'
export const LEGACY_MATCHUP_VARIANT_PREFS_KEY = 'versus-verse-vault:matchup-variant-prefs:v1'
export const FIGHTS_DB_NAME = 'versus-verse-vault-db'
export const FIGHTS_DB_VERSION = 1
export const FIGHTS_STORE_NAME = 'fights'
export const META_STORE_NAME = 'meta'
export const META_ACTIVE_FIGHT_KEY = 'activeFightId'
export const META_MATCHUP_VARIANT_PREFS_KEY = 'matchupVariantPrefs'
export const FOLDER_FIGHT_ID_PREFIX = 'folder::'

export const TEMPLATE_ID_SET = new Set<TemplateId>(TEMPLATE_PRESETS.map((template) => template.id))
export const FINAL_TEMPLATE_ID: TemplateId = 'fight-title'

export const ensureTemplateOrderHasFinal = (order: TemplateId[]) => {
  const normalized: TemplateId[] = []
  for (const id of order) {
    if (id === FINAL_TEMPLATE_ID) continue
    if (!normalized.includes(id)) normalized.push(id)
  }
  normalized.push(FINAL_TEMPLATE_ID)
  return normalized
}

export const insertTemplateAfterAnchor = (order: TemplateId[], templateId: TemplateId, anchors: TemplateId[]) => {
  if (order.includes(templateId)) return order.slice()

  const next = order.slice()
  const anchorIndex = anchors
    .map((anchor) => next.lastIndexOf(anchor))
    .find((index) => index >= 0)

  if (anchorIndex === undefined) {
    const finalIndex = next.indexOf(FINAL_TEMPLATE_ID)
    if (finalIndex >= 0) {
      next.splice(finalIndex, 0, templateId)
    } else {
      next.push(templateId)
    }
    return next
  }

  next.splice(anchorIndex + 1, 0, templateId)
  return next
}

export const injectDerivedTemplates = (order: TemplateId[], payload: ParsedVsImport) => {
  let next = ensureTemplateOrderHasFinal(order)
  const hasPowers = payload.powersA.length > 0 || payload.powersB.length > 0
  const hasRawFeats = payload.rawFeatsA.length > 0 || payload.rawFeatsB.length > 0

  if (hasPowers) {
    next = insertTemplateAfterAnchor(next, 'powers-tools', ['character-card-b', 'character-card-a', 'tactical-board'])
  }
  if (hasRawFeats) {
    next = insertTemplateAfterAnchor(next, 'raw-feats', ['powers-tools', 'character-card-b', 'character-card-a', 'tactical-board'])
  }

  return ensureTemplateOrderHasFinal(next)
}

export const THEME_OVERLAYS: Record<Theme, string> = {
  cosmic:
    'bg-[radial-gradient(circle_at_8%_10%,rgba(56,189,248,0.24),transparent_35%),radial-gradient(circle_at_86%_88%,rgba(59,130,246,0.20),transparent_35%)]',
  ember:
    'bg-[radial-gradient(circle_at_8%_10%,rgba(249,115,22,0.3),transparent_35%),radial-gradient(circle_at_86%_88%,rgba(244,63,94,0.22),transparent_35%)]',
  steel:
    'bg-[radial-gradient(circle_at_8%_10%,rgba(148,163,184,0.2),transparent_35%),radial-gradient(circle_at_86%_88%,rgba(34,211,238,0.18),transparent_35%)]',
}

export const ICON_BY_CATEGORY: Record<string, IconType> = {
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

export const FALLBACK_ICONS: IconType[] = [Sparkles, Award, BookOpen, Gauge]
export const DEFAULT_TEMPLATE_ORDER: TemplateId[] = ensureTemplateOrderHasFinal(
  TEMPLATE_PRESETS.map((template) => template.id),
)
export const DEFAULT_MORPH_SIZE = 66
export const MORPH_ORIGIN_SIZE_SHRINK_PX = 0

export const FIGHT_SCENARIO_EXTENDED_LABELS_EN: Record<string, string> = {
  sonicboomblitz: 'Sonic Boom Blitz',
  flickerdisplacement: 'Flicker Displacement',
  vortexvacuum: 'Vortex Vacuum',
  attosecondperception: 'Attosecond Perception',
  molecularvibrationpass: 'Molecular Vibration Pass',
  afterimagefeint: 'Afterimage Feint',
  infinitemasspunch: 'Infinite Mass Punch',
  temporalanchor: 'Temporal Anchor',
  slipstreamdrag: 'Slipstream Drag',
  kineticsteal: 'Kinetic Steal',
  groundshatter: 'Ground Shatter',
  colossalgrapple: 'Colossal Grapple',
  mountainthrow: 'Mountain Throw',
  thunderclapshock: 'Thunderclap Shock',
  unstoppablejuggernaut: 'Unstoppable Juggernaut',
  seismicslam: 'Seismic Slam',
  environmentweaponize: 'Environment Weaponize',
  bearhugcrush: 'Bear Hug Crush',
  avalancherush: 'Avalanche Rush',
  skyhighlauncher: 'Sky-High Launcher',
  beamstruggle: 'Beam Struggle',
  constructcage: 'Construct Cage',
  omnidirectionalburst: 'Omnidirectional Burst',
  guidedvolley: 'Guided Volley',
  energytether: 'Energy Tether',
  refractiveshield: 'Refractive Shield',
  sustainedsuppression: 'Sustained Suppression',
  sniperprecision: 'Sniper Precision',
  energysiphon: 'Energy Siphon',
  orbitalstrike: 'Orbital Strike',
  magneticcrush: 'Magnetic Crush',
  gravityanchor: 'Gravity Anchor',
  singularitypull: 'Singularity Pull',
  ferrofluidwhip: 'Ferrofluid Whip',
  internalirongrip: 'Internal Iron Grip',
  polarityreversal: 'Polarity Reversal',
  scraparmorbuild: 'Scrap Armor Build',
  magneticlevitation: 'Magnetic Levitation',
  geomagneticpulse: 'Geomagnetic Pulse',
  orbitaldebrisrain: 'Orbital Debris Rain',
  smokescreenvanish: 'Smoke Screen Vanish',
  explosivetrapplacement: 'Explosive Trap Placement',
  grapplehookswing: 'Grapple Hook Swing',
  countermeasurebuffer: 'Counter-Measure Buffer',
  weaknessanalysis: 'Weakness Analysis',
  acrobaticflurry: 'Acrobatic Flurry',
  stealthtakedown: 'Stealth Takedown',
  disarmingmaneuver: 'Disarming Maneuver',
  feartoxinillusion: 'Fear Toxin Illusion',
  environmentallure: 'Environmental Lure',
  berserkercharge: 'Berserker Charge',
  healingstandoff: 'Healing Standoff',
  tankhitexchange: 'Tank-Hit Exchange',
  wildslashes: 'Wild Slashes',
  deathdefiance: 'Death Defiance',
  animalisticsenses: 'Animalistic Senses',
  leapandpin: 'Leap-and-Pin',
  attritiongrind: 'Attrition Grind',
  selfmutilationfeint: 'Self-Mutilation Feint',
  adrenalineoverload: 'Adrenaline Overload',
  mirrordimensionloop: 'Mirror Dimension Loop',
  eldritchwhiplasso: 'Eldritch Whip Lasso',
  astralprojectionstrike: 'Astral Projection Strike',
  realitywarpingobjectswap: 'Reality Warping - Object Swap',
  timerewindcounter: 'Time Rewind Counter',
  chaosmagichex: 'Chaos Magic Hex',
  summoningcirclehorde: 'Summoning Circle - Horde',
  portaldisplacement: 'Portal Displacement',
  soulgazingstun: 'Soul Gazing Stun',
  elementaltransmutation: 'Elemental Transmutation',
  satelliteuplinklaser: 'Satellite Uplink Laser',
  nanorepairstall: 'Nano-Repair Stall',
  sonicfrequencydisruptor: 'Sonic Frequency Disruptor',
  aipredictionengine: 'AI Prediction Engine',
  rocketpoweredtackle: 'Rocket Powered Tackle',
  heatseekingmicromissiles: 'Heat-Seeking Micro-Missiles',
  empblast: 'EMP Blast',
  integratedbladecombo: 'Integrated Blade Combo',
  jetpackhoverharass: 'Jetpack Hover-Harass',
  holographicdecoyburst: 'Holographic Decoy Burst',
  feralpounce: 'Feral Pounce',
  wallclingambush: 'Wall-Cling Ambush',
  lowprofiledash: 'Low-Profile Dash',
  multislashjuggle: 'Multi-Slash Juggle',
  scenttrackingpursuit: 'Scent-Tracking Pursuit',
  dominancedisplay: 'Dominance Display',
  desperationblitz: 'Desperation Blitz',
  calculatedretreat: 'Calculated Retreat',
  mutualrespectclash: 'Mutual Respect Clash',
  villainousmonologuestall: 'Villainous Monologue Stall',
}

export const FIGHT_SCENARIO_CANONICAL_TOKEN_TO_ID: Record<string, FightScenarioId> = {
  orbitharass: 'orbit-harass',
  hitandrun: 'hit-and-run',
  rushko: 'rush-ko',
  clashlock: 'clash-lock',
  kitezone: 'kite-zone',
  teleportburst: 'teleport-burst',
  feintcounter: 'feint-counter',
  grapplepin: 'grapple-pin',
  cornertrap: 'corner-trap',
  regenattrition: 'regen-attrition',
  berserkoverextend: 'berserk-overextend',
  tradechaos: 'trade-chaos',
}

export const fightScenarioLabel = (scenario: FightScenarioId, language: Language) =>
  getTranslations(language).scenarios[scenario] || getTranslations('en').scenarios[scenario] || scenario

export const FIGHT_SCENARIO_ALIAS_TO_ID: Record<string, FightScenarioId> = {
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
  // Extended cinematic aliases from new.md
  sonicboomblitz: 'rush-ko',
  flickerdisplacement: 'teleport-burst',
  vortexvacuum: 'orbit-harass',
  attosecondperception: 'teleport-burst',
  molecularvibrationpass: 'hit-and-run',
  afterimagefeint: 'feint-counter',
  infinitemasspunch: 'rush-ko',
  temporalanchor: 'teleport-burst',
  slipstreamdrag: 'hit-and-run',
  kineticsteal: 'grapple-pin',
  groundshatter: 'rush-ko',
  colossalgrapple: 'grapple-pin',
  mountainthrow: 'grapple-pin',
  thunderclapshock: 'trade-chaos',
  unstoppablejuggernaut: 'rush-ko',
  seismicslam: 'rush-ko',
  environmentweaponize: 'clash-lock',
  bearhugcrush: 'grapple-pin',
  avalancherush: 'rush-ko',
  skyhighlauncher: 'grapple-pin',
  beamstruggle: 'trade-chaos',
  constructcage: 'corner-trap',
  omnidirectionalburst: 'trade-chaos',
  guidedvolley: 'kite-zone',
  energytether: 'grapple-pin',
  refractiveshield: 'kite-zone',
  sustainedsuppression: 'kite-zone',
  sniperprecision: 'kite-zone',
  energysiphon: 'regen-attrition',
  orbitalstrike: 'kite-zone',
  magneticcrush: 'corner-trap',
  gravityanchor: 'corner-trap',
  singularitypull: 'corner-trap',
  ferrofluidwhip: 'hit-and-run',
  internalirongrip: 'grapple-pin',
  polarityreversal: 'feint-counter',
  scraparmorbuild: 'regen-attrition',
  magneticlevitation: 'grapple-pin',
  geomagneticpulse: 'kite-zone',
  orbitaldebrisrain: 'kite-zone',
  smokescreenvanish: 'feint-counter',
  explosivetrapplacement: 'corner-trap',
  grapplehookswing: 'hit-and-run',
  countermeasurebuffer: 'feint-counter',
  weaknessanalysis: 'feint-counter',
  acrobaticflurry: 'hit-and-run',
  stealthtakedown: 'feint-counter',
  disarmingmaneuver: 'clash-lock',
  feartoxinillusion: 'trade-chaos',
  environmentallure: 'corner-trap',
  berserkercharge: 'berserk-overextend',
  healingstandoff: 'regen-attrition',
  tankhitexchange: 'clash-lock',
  wildslashes: 'trade-chaos',
  deathdefiance: 'regen-attrition',
  animalisticsenses: 'hit-and-run',
  leapandpin: 'grapple-pin',
  attritiongrind: 'regen-attrition',
  selfmutilationfeint: 'feint-counter',
  adrenalineoverload: 'berserk-overextend',
  mirrordimensionloop: 'trade-chaos',
  eldritchwhiplasso: 'grapple-pin',
  astralprojectionstrike: 'teleport-burst',
  realitywarpingobjectswap: 'trade-chaos',
  timerewindcounter: 'feint-counter',
  chaosmagichex: 'trade-chaos',
  summoningcirclehorde: 'corner-trap',
  portaldisplacement: 'teleport-burst',
  soulgazingstun: 'corner-trap',
  elementaltransmutation: 'corner-trap',
  satelliteuplinklaser: 'kite-zone',
  nanorepairstall: 'regen-attrition',
  sonicfrequencydisruptor: 'kite-zone',
  aipredictionengine: 'feint-counter',
  rocketpoweredtackle: 'rush-ko',
  heatseekingmicromissiles: 'kite-zone',
  empblast: 'corner-trap',
  integratedbladecombo: 'clash-lock',
  jetpackhoverharass: 'orbit-harass',
  holographicdecoyburst: 'feint-counter',
  feralpounce: 'rush-ko',
  wallclingambush: 'feint-counter',
  lowprofiledash: 'hit-and-run',
  multislashjuggle: 'trade-chaos',
  scenttrackingpursuit: 'corner-trap',
  dominancedisplay: 'clash-lock',
  desperationblitz: 'berserk-overextend',
  calculatedretreat: 'kite-zone',
  mutualrespectclash: 'clash-lock',
  villainousmonologuestall: 'regen-attrition',
}


export const DEFAULT_WINNER_CV_A = [
  'Doomsday',
  'Brainiac',
  "Mongul",
  'Pariah',
  "H'el",
  'Rogol Zaar',
  'Ulysses',
  'Wraith',
]

export const DEFAULT_WINNER_CV_B = [
  'Thor',
  'Hulk',
  'Blue Marvel',
  'Juggernaut',
  'Namora',
  'Winter Guard',
  'Rogue',
  'Gambit',
]

export const defaultFactsFor = (side: 'a' | 'b', language: Language): FighterFact[] =>
  getTranslations(language).defaults.profileFacts[side].map((item) => ({ ...item }))
