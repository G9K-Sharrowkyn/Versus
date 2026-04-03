import type {
  FightLocaleJsonFighter,
  FightLocaleJsonTemplateBlock,
  FightLocaleJsonV1,
  FightScansJsonV1,
  Language,
  TemplateId,
  TemplatePreset,
} from './types'
import {
  buildTemplateChrome,
  getDefaultFightCategories,
  getDefaultProfileFacts,
  getDefaultVictoryArchive,
  getTemplateBlockName,
  getTemplateChromeCopy,
  getTemplateCommonCopy,
  getTemplateMetadata,
  getTemplatePreset,
  getTemplatePurpose,
  getTemplateStaticField,
} from './templates/shared/templateCopy'

export type FightManifestLocale = Language

type LocalizedText = Record<FightManifestLocale, string>

export type FightTemplateFieldSchema = {
  key: string
  aliases?: string[]
  starter?: boolean
  jsonKey?: string
  source?: 'fight' | 'scans'
  valueType?: 'string' | 'string-array'
  allowScenarioPrefix?: boolean
}

export type FightTemplateManifest = {
  id: TemplateId
  variableFields: FightTemplateFieldSchema[]
  aliases?: string[]
  legacyIds?: string[]
  forceFinal?: boolean
  derivedFrom?: 'powers' | 'crucial-feats'
}

export type FightUiManifest = {
  toolbar: {
    liveMode: LocalizedText
    backToLibrary: LocalizedText
    previousTemplate: LocalizedText
    nextTemplate: LocalizedText
    sequence: LocalizedText
    active: LocalizedText
    importFile: LocalizedText
    notLoaded: LocalizedText
  }
}

export type FightManifest = {
  templates: FightTemplateManifest[]
  fightUi: FightUiManifest
}

type TemplateTranslationSlice = Record<TemplateId, TemplatePreset>

const text = (pl: string, en: string): LocalizedText => ({ pl, en })
const field = (
  key: string,
  aliases: string[] = [],
  starter = true,
  options: Pick<FightTemplateFieldSchema, 'jsonKey' | 'source' | 'valueType' | 'allowScenarioPrefix'> = {},
): FightTemplateFieldSchema => ({
  key,
  aliases,
  starter,
  jsonKey: options.jsonKey,
  source: options.source,
  valueType: options.valueType,
  allowScenarioPrefix: options.allowScenarioPrefix,
})
const joinFieldLabel = (entry: FightTemplateFieldSchema) => [entry.key, ...(entry.aliases || [])].join(' | ')
const localize = (copy: LocalizedText, language: FightManifestLocale) => copy[language]
const toCamelCase = (value: string) =>
  value.replace(/[_-]([a-z0-9])/gi, (_, char: string) => char.toUpperCase())
const getFieldJsonKey = (entry: FightTemplateFieldSchema) => entry.jsonKey || toCamelCase(entry.key)

export const fightManifest: FightManifest = {
  fightUi: {
    toolbar: {
      liveMode: text('Tryb prezentacji live', 'Live presentation mode'),
      backToLibrary: text('Powrót do listy walk', 'Back to fight list'),
      previousTemplate: text('Poprzedni template', 'Previous template'),
      nextTemplate: text('Następny template', 'Next template'),
      sequence: text('Sekwencja', 'Sequence'),
      active: text('Aktywny', 'Active'),
      importFile: text('Plik importu', 'Import file'),
      notLoaded: text('jeszcze nie wczytano', 'not loaded yet'),
    },
  },
  templates: [
    {
      id: 'tactical-board',
      aliases: ['tablica taktyczna', 'tactical board', 'methodology', 'metodologia'],
      variableFields: [
        field('subtitle', ['purpose', 'note']),
        field('lane', ['line_1', 'line1']),
      ],
    },
    {
      id: 'character-dossier-a',
      aliases: ['character a', 'character card a', 'card a', 'dossier postaci a', 'karta postaci a', 'postać a'],
      legacyIds: ['character-card-a'],
      variableFields: [
        field('world'),
        field('quote', ['cytat']),
      ],
    },
    {
      id: 'character-dossier-b',
      aliases: ['character b', 'character card b', 'card b', 'dossier postaci b', 'karta postaci b', 'postać b'],
      legacyIds: ['character-card-b'],
      variableFields: [
        field('world'),
        field('quote', ['cytat']),
      ],
    },
    {
      id: 'character-profile',
      aliases: ['profil postaci', 'character profile', 'powers / tools / weaknesses', 'powers tools weaknesses', 'powers tools', 'moce narzędzia i słabości'],
      legacyIds: ['powers-tools'],
      derivedFrom: 'powers',
      variableFields: [],
    },
    {
      id: 'crucial-feats',
      aliases: ['najważniejsze wyczyny', 'crucial feats', 'raw feats', 'surowe featy', 'feats ledger'],
      legacyIds: ['raw-feats'],
      derivedFrom: 'crucial-feats',
      variableFields: [
        field('left_image', [], true, { jsonKey: 'leftImages', source: 'scans', valueType: 'string-array' }),
        field('right_image', [], true, { jsonKey: 'rightImages', source: 'scans', valueType: 'string-array' }),
      ],
    },
    {
      id: 'fight-analytics',
      aliases: ['analityka walki', 'fight analytics', 'hud bars', 'paski hud'],
      legacyIds: ['hud-bars'],
      variableFields: [],
    },
    {
      id: 'parameter-comparison',
      aliases: ['porównanie parametrów', 'parameter comparison', 'radar brief', 'raport radarowy'],
      legacyIds: ['radar-brief'],
      variableFields: [
        field('left_header'),
        field('right_header'),
        field('favorite_side', ['winner_side', 'leader_side', 'fav_side']),
        field('favorite_label', ['favorite']),
        field('draw_favorite', ['draw_favorite_label', 'favorite_draw']),
      ],
    },
    {
      id: 'victory-archive',
      aliases: ['archiwum zwycięstw', 'victory archive', 'winner cv', 'cv zwycięzców', 'cv zwyciezcow'],
      legacyIds: ['winner-cv'],
      variableFields: [
        field('left_image', [], true, { jsonKey: 'leftImages', source: 'scans', valueType: 'string-array' }),
        field('right_image', [], true, { jsonKey: 'rightImages', source: 'scans', valueType: 'string-array' }),
      ],
    },
    {
      id: 'final-summary',
      aliases: ['podsumowanie końcowe', 'final summary', 'podsumowanie', 'summary'],
      legacyIds: ['summary'],
      variableFields: [
        field('winner', ['verdict']),
        field('line_1', ['line1']),
        field('line_2', ['line2']),
        field('line_3', ['line3']),
        field('left_image', ['left_img', 'portrait_a', 'image_a', 'fighter_a_image'], true, { source: 'scans' }),
        field('right_image', ['right_img', 'portrait_b', 'image_b', 'fighter_b_image'], true, { source: 'scans' }),
      ],
    },
    {
      id: 'battle-dynamics',
      aliases: ['dynamika starcia', 'battle dynamics'],
      variableFields: [
        field('label', ['s1_label'], true, { allowScenarioPrefix: true }),
        field('a_curve', ['curve_a', 'blue_curve', 'left_curve'], true, { allowScenarioPrefix: true }),
        field('b_curve', ['curve_b', 'red_curve', 'right_curve'], true, { allowScenarioPrefix: true }),
        field('yellow_wave', ['wave', 'chaos_wave'], true, { allowScenarioPrefix: true }),
        field('phase_1', ['phase1'], true, { allowScenarioPrefix: true }),
        field('phase_2', ['phase2'], true, { allowScenarioPrefix: true }),
        field('phase_3', ['phase3'], true, { allowScenarioPrefix: true }),
        field('analysis', ['note', 'line_4', 'line4'], true, { allowScenarioPrefix: true }),
      ],
    },
    {
      id: 'x-factor',
      aliases: ['x-factor', 'xfactor'],
      variableFields: [
        field('factor', ['headline']),
        field('a_value', ['super_value', 'superman', 'left_value']),
        field('a_bonus', ['super_bonus', 'left_bonus']),
        field('a_bonus_label', ['left_bonus_label']),
        field('b_value', ['hyper_value', 'hyperion', 'right_value']),
        field('b_bonus', ['hyper_bonus', 'right_bonus']),
        field('regen', ['regen_label']),
        field('mechanika_label', ['mechanics_label']),
        field('mechanika', ['mechanics']),
        field('implikacja_label', ['implication_label']),
        field('implikacja', ['implication']),
        field('psychologia_label', ['psychology_label']),
        field('psychologia', ['psychology']),
      ],
    },
    {
      id: 'interpretation',
      aliases: ['interpretacja', 'interpretation'],
      variableFields: [
        field('line_1', ['line1', 'thesis']),
        field('line_2', ['line2', 'antithesis']),
        field('line_3', ['line3', 'conclusion']),
        field('quote', ['line_4', 'line4']),
      ],
    },
    {
      id: 'fight-simulation',
      aliases: ['symulacja walki', 'fight simulation'],
      variableFields: [
        field('label', ['s1_label'], true, { allowScenarioPrefix: true }),
        field('opening'),
        field('mid_fight', ['midfight']),
        field('late_fight', ['latefight']),
        field('end_condition', ['endcondition'], true, { allowScenarioPrefix: true }),
        field('phase_mode', ['phasemode', 'mode', 'simulation_mode', 'simulationmode']),
        field('phase_animation', ['phaseanimation', 'animation', 'scenario', 'preset', 'simulation_animation', 'simulationanimation']),
        field('phase_actor', ['phaseactor', 'actor', 'lead', 'aggressor', 'attacker']),
        field('phase_<N>_mode', ['phase<N>mode', 'phase_<N>_type', 'phase<N>type'], true, { allowScenarioPrefix: true }),
        field('phase_<N>_animation', ['phase<N>animation', 'phase_<N>_scenario', 'phase<N>scenario', 'phase_<N>_preset', 'phase<N>preset'], true, { allowScenarioPrefix: true }),
        field('phase_<N>_token', ['phase<N>token', 'phase_<N>_variant', 'phase<N>variant'], true, { allowScenarioPrefix: true }),
        field('phase_<N>_actor', ['phase<N>actor', 'phase_<N>_lead', 'phase<N>lead', 'phase_<N>_aggressor', 'phase<N>aggressor', 'phase_<N>_attacker', 'phase<N>attacker'], true, { allowScenarioPrefix: true }),
        field('phase_<N>_title', ['phase<N>title', 'phase_<N>_headline', 'phase<N>headline'], true, { allowScenarioPrefix: true }),
        field('phase_<N>_a_label', ['phase<N>alabel', 'phase_<N>_left_label', 'phase<N>leftlabel'], true, { allowScenarioPrefix: true }),
        field('phase_<N>_b_label', ['phase<N>blabel', 'phase_<N>_right_label', 'phase<N>rightlabel'], true, { allowScenarioPrefix: true }),
        field('phase_<N>_a_value', ['phase<N>avalue', 'phase_<N>_left_value', 'phase<N>leftvalue'], true, { allowScenarioPrefix: true }),
        field('phase_<N>_b_value', ['phase<N>bvalue', 'phase_<N>_right_value', 'phase<N>rightvalue'], true, { allowScenarioPrefix: true }),
        field('phase_<N>_event', ['phase<N>event', 'phase_<N>_turn', 'phase<N>turn', 'phase_<N>_pivot', 'phase<N>pivot'], true, { allowScenarioPrefix: true }),
        field('phase_<N>_branch_a', ['phase<N>brancha', 'phase_<N>_option_a', 'phase<N>optiona', 'phase_<N>_left_option', 'phase<N>leftoption'], true, { allowScenarioPrefix: true }),
        field('phase_<N>_branch_b', ['phase<N>branchb', 'phase_<N>_option_b', 'phase<N>optionb', 'phase_<N>_right_option', 'phase<N>rightoption'], true, { allowScenarioPrefix: true }),
      ],
    },
    {
      id: 'stat-trap',
      aliases: ['pułapka statystyk', 'pulapka statystyk', 'stat trap'],
      variableFields: [
        field('trap_top', ['top', 'line_1']),
        field('trap_bottom', ['bottom', 'line_2']),
        field('example', ['line_3']),
        field('question', ['line_4', 'trap']),
      ],
    },
    {
      id: 'direct-verdict',
      aliases: ['werdykt prosty', 'direct verdict', 'simple verdict', 'clear verdict'],
      variableFields: [
        field('winner', ['verdict']),
        field('loser', ['opponent']),
        field('outcome', ['result', 'method']),
        field('certainty', ['margin', 'confidence']),
        field('line_1', ['line1']),
        field('line_2', ['line2']),
        field('line_3', ['line3']),
        field('left_image', ['left_img', 'portrait_a', 'image_a', 'fighter_a_image'], true, { source: 'scans' }),
        field('right_image', ['right_img', 'portrait_b', 'image_b', 'fighter_b_image'], true, { source: 'scans' }),
      ],
    },
    {
      id: 'verdict-matrix',
      aliases: ['matryca werdyktu', 'verdict matrix'],
      variableFields: [
        field('header', ['headline', 'title']),
        field('subtitle', ['note']),
        field('layout', ['matrix_layout', 'matrix_mode', 'verdict_layout', 'verdict_matrix_layout', 'type', 'format']),
        field('row_1', ['row1']),
        field('row_2', ['row2']),
        field('col_1', ['col1']),
        field('col_2', ['col2']),
        field('case_1', ['case1']),
        field('case_1_winner', ['case1_winner', 'winner_1', 'winner1']),
        field('case_2', ['case2']),
        field('case_2_winner', ['case2_winner', 'winner_2', 'winner2']),
        field('case_3', ['case3']),
        field('case_3_winner', ['case3_winner', 'winner_3', 'winner3']),
        field('case_4', ['case4']),
        field('case_4_winner', ['case4_winner', 'winner_4', 'winner4']),
        field('left_image', ['left_img', 'portrait_a', 'image_a', 'fighter_a_image'], true, { source: 'scans' }),
        field('right_image', ['right_img', 'portrait_b', 'image_b', 'fighter_b_image'], true, { source: 'scans' }),
      ],
    },
    {
      id: 'fight-card',
      aliases: ['karta walki', 'fight card', 'fight title', 'final title', 'ending title', 'napis końcowy'],
      legacyIds: ['fight-title'],
      forceFinal: true,
      variableFields: [
        field('fight_title', ['match_title', 'title_text', 'line_1', 'line1']),
        field('left_image', ['left_img', 'portrait_a', 'image_a', 'fighter_a_image'], true, { source: 'scans' }),
        field('right_image', ['right_img', 'portrait_b', 'image_b', 'fighter_b_image'], true, { source: 'scans' }),
      ],
    },
    {
      id: 'methodology',
      aliases: ['methodology', 'metodologia'],
      variableFields: [],
    },
  ],
}

const templateById = new Map(fightManifest.templates.map((template) => [template.id, template]))

export const getFightTemplateManifest = (templateId: TemplateId) => templateById.get(templateId)

export const getFightTemplatePreset = (templateId: TemplateId, language: FightManifestLocale): TemplatePreset =>
  getTemplatePreset(templateId, language)

export const getFightTemplatePresets = (language: FightManifestLocale): TemplatePreset[] =>
  fightManifest.templates.map((template) => getFightTemplatePreset(template.id, language))

export const getFightTemplateDefaultField = (
  templateId: TemplateId,
  fieldKey: string,
  language: FightManifestLocale,
) => getTemplateStaticField(templateId, fieldKey, language)

export const getFightTemplateBlockName = (templateId: TemplateId, language: FightManifestLocale) =>
  getTemplateBlockName(templateId, language)

export const getFightTemplateAliases = (templateId: TemplateId) => {
  const template = templateById.get(templateId)
  if (!template) return []
  const blockNamePl = getTemplateBlockName(template.id, 'pl')
  const blockNameEn = getTemplateBlockName(template.id, 'en')
  const activeNamePl = getTemplateMetadata(template.id, 'pl')?.activeName || template.id
  const activeNameEn = getTemplateMetadata(template.id, 'en')?.activeName || template.id
  return Array.from(
    new Set([
      template.id,
      blockNamePl,
      blockNameEn,
      activeNamePl,
      activeNameEn,
      ...(template.aliases || []),
      ...(template.legacyIds || []),
    ]),
  )
}

export const getFightTemplateBlockAliases = () =>
  Object.fromEntries(
    fightManifest.templates.map((template) => [template.id, getFightTemplateAliases(template.id)]),
  ) as Partial<Record<TemplateId, string[]>>

export const getFightTemplateRequirements = () =>
  fightManifest.templates.map((template) => ({
    blockPl: getTemplateBlockName(template.id, 'pl'),
    blockEn: getTemplateBlockName(template.id, 'en'),
    purposePl: getTemplatePurpose(template.id, 'pl'),
    purposeEn: getTemplatePurpose(template.id, 'en'),
    fields: template.variableFields.map(joinFieldLabel),
  }))

export const getFightTemplateTokenMap = () => {
  const map: Record<string, TemplateId> = {}
  fightManifest.templates.forEach((template) => {
    const register = (value: string) => {
      const normalized = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '')
      if (normalized) map[normalized] = template.id
    }

    register(template.id)
    register(getTemplateBlockName(template.id, 'pl'))
    register(getTemplateBlockName(template.id, 'en'))
    register(getTemplateMetadata(template.id, 'pl')?.activeName || template.id)
    register(getTemplateMetadata(template.id, 'en')?.activeName || template.id)
    ;(template.aliases || []).forEach(register)
    ;(template.legacyIds || []).forEach(register)
  })
  return map
}

export const getFightToolbarCopy = (language: FightManifestLocale) =>
  Object.fromEntries(
    Object.entries(fightManifest.fightUi.toolbar).map(([key, value]) => [key, localize(value, language)]),
  ) as Record<keyof FightUiManifest['toolbar'], string>

export const getFightChromeCopy = (templateId: TemplateId, language: FightManifestLocale) =>
  getTemplateChromeCopy(templateId, language)

export const buildFightTemplateChrome = (
  templateId: TemplateId,
  language: FightManifestLocale,
  fields: Record<string, string> = {},
) => buildTemplateChrome(templateId, language, fields)

export const getFightCommonCopy = (templateId: TemplateId, language: FightManifestLocale) =>
  getTemplateCommonCopy(templateId, language)

export const getFightDefaultCategories = (templateId: TemplateId, language: FightManifestLocale) =>
  getDefaultFightCategories(templateId, language)

export const getFightDefaultProfileFacts = (side: 'a' | 'b', language: FightManifestLocale) =>
  getDefaultProfileFacts(side, language)

export const getFightDefaultVictoryArchive = (side: 'a' | 'b') =>
  getDefaultVictoryArchive(side)

export const getFightFinalTemplateId = () =>
  fightManifest.templates.find((template) => template.forceFinal)?.id || 'fight-card'

export const getFightTemplateIds = () => fightManifest.templates.map((template) => template.id)

export const buildFightTemplateTranslationSlice = (language: FightManifestLocale): TemplateTranslationSlice =>
  Object.fromEntries(
    fightManifest.templates.map((template) => [template.id, getFightTemplatePreset(template.id, language)]),
  ) as TemplateTranslationSlice

export const buildFightTranslationSlice = (language: FightManifestLocale) => {
  const common = getFightCommonCopy('tactical-board', language)
  const toolbar = getFightToolbarCopy(language)

  return {
    categories: Object.fromEntries(
      getFightDefaultCategories('tactical-board', language).map((category) => [category.id, category.label]),
    ) as Record<string, string>,
    common: {
      style: common.style,
      advantage: common.advantage,
      mentality: common.mentality,
      blueCorner: common.blueCorner,
      redCorner: common.redCorner,
      noImage: common.noImage,
      portraitSlot: common.portraitSlot,
      noDrawsCurrentSetup: common.noDrawsCurrentSetup,
      baseline: common.baseline,
    },
    templates: {
      presets: buildFightTemplateTranslationSlice(language),
    },
    defaults: {
      profileFacts: {
        a: getFightDefaultProfileFacts('a', language),
        b: getFightDefaultProfileFacts('b', language),
      },
    },
    controls: {
      liveMode: toolbar.liveMode,
      backToList: toolbar.backToLibrary,
      previousTemplate: toolbar.previousTemplate,
      nextTemplate: toolbar.nextTemplate,
      sequence: toolbar.sequence,
      active: toolbar.active,
    },
    ui: {
      liveMode: toolbar.liveMode,
      backToLibrary: toolbar.backToLibrary,
      prevTemplate: toolbar.previousTemplate,
      nextTemplate: toolbar.nextTemplate,
      sequence: toolbar.sequence,
      active: toolbar.active,
      importFile: toolbar.importFile,
      notLoaded: toolbar.notLoaded,
    },
  }
}

const ensureStarterTemplateOrder = (input?: TemplateId[]) => {
  const finalId = getFightFinalTemplateId()
  const deduped: TemplateId[] = []
  const source = input?.length ? input : getFightTemplateIds()
  source.forEach((templateId) => {
    if (templateId === finalId) return
    if (!deduped.includes(templateId)) deduped.push(templateId)
  })
  deduped.push(finalId)
  return deduped
}

const FIGHT_STAT_IDS = [
  'strength',
  'speed',
  'durability',
  'battleIq',
  'hax',
  'stamina',
  'style',
  'experience',
  'skills',
] as const

const buildEmptyStatsRecord = () =>
  Object.fromEntries(FIGHT_STAT_IDS.map((statId) => [statId, null])) as Record<typeof FIGHT_STAT_IDS[number], number | null>

const buildEmptyFighterJson = (
  language: FightManifestLocale,
  fighterName: string,
): FightLocaleJsonFighter => ({
  name: fighterName.trim() || (language === 'pl' ? 'Postać' : 'Character'),
  version: '',
  stats: buildEmptyStatsRecord(),
  dossier: {
    style: '',
    advantage: '',
    mentality: '',
    quote: '',
  },
  victories: Array.from({ length: 5 }, () => ''),
  profile: {
    powers: Array.from({ length: 2 }, () => ''),
    tools: Array.from({ length: 2 }, () => ''),
    weaknesses: Array.from({ length: 2 }, () => ''),
  },
  crucialFeats: Array.from({ length: 5 }, () => ''),
})

const buildTemplateStarterValue = (templateId: TemplateId, entry: FightTemplateFieldSchema) => {
  if (entry.valueType === 'string-array') {
    if (templateId === 'crucial-feats' || templateId === 'victory-archive') {
      return Array.from({ length: 5 }, () => '')
    }
    return []
  }

  if (templateId === 'fight-analytics' && getFieldJsonKey(entry) === 'profileMode') {
    return 'VS'
  }

  return ''
}

const buildTemplateStarterBlock = (
  template: FightTemplateManifest,
  source: 'fight' | 'scans',
): FightLocaleJsonTemplateBlock => {
  const blockEntries = template.variableFields.filter(
    (entry) => entry.starter !== false && (entry.source || 'fight') === source,
  )

  return Object.fromEntries(
    blockEntries.map((entry) => [getFieldJsonKey(entry), buildTemplateStarterValue(template.id, entry)]),
  )
}

const buildSelectedTemplateBlocks = (
  templateOrder: TemplateId[],
  source: 'fight' | 'scans',
) =>
  Object.fromEntries(
    templateOrder
      .map((templateId) => getFightTemplateManifest(templateId))
      .filter((template): template is FightTemplateManifest => Boolean(template))
      .map((template) => [template.id, buildTemplateStarterBlock(template, source)])
      .filter(([, block]) => Object.keys(block).length),
  ) as Partial<Record<TemplateId, FightLocaleJsonTemplateBlock>>

export const buildFightStarterJson = (
  language: FightManifestLocale,
  templateOrder?: TemplateId[],
) =>
  buildFightScaffoldFightJson(
    language,
    language === 'pl' ? 'Postać A' : 'Character A',
    language === 'pl' ? 'Postać B' : 'Character B',
    templateOrder,
  )

export const buildFightScaffoldFightJson = (
  language: FightManifestLocale,
  fighterAName: string,
  fighterBName: string,
  templateOrder?: TemplateId[],
): FightLocaleJsonV1 => {
  const selectedOrder = ensureStarterTemplateOrder(templateOrder)
  return {
    schemaVersion: 1,
    locale: language,
    fighterA: buildEmptyFighterJson(language, fighterAName),
    fighterB: buildEmptyFighterJson(language, fighterBName),
    templateOrder: selectedOrder,
    templates: buildSelectedTemplateBlocks(selectedOrder, 'fight'),
  }
}

export const buildFightScaffoldScansJson = (templateOrder?: TemplateId[]): FightScansJsonV1 => {
  const selectedOrder = ensureStarterTemplateOrder(templateOrder)
  return {
    schemaVersion: 1,
    portraits: {
      a: '',
      b: '',
    },
    templates: buildSelectedTemplateBlocks(selectedOrder, 'scans'),
  }
}
