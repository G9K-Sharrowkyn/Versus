import type {
  Category,
  FighterFact,
  FightLocaleJsonFighter,
  FightLocaleJsonTemplateBlock,
  FightLocaleJsonV1,
  FightScansJsonV1,
  FightStatId,
  Language,
  TemplateId,
  TemplatePreset,
} from './types'

export type FightManifestLocale = Language

type LocalizedText = Record<FightManifestLocale, string>

export type FightTemplateFieldSchema = {
  key: string
  aliases?: string[]
  starter?: boolean
  jsonKey?: string
  source?: 'fight' | 'scans'
  valueType?: 'string' | 'string-array'
}

export type FightTemplateManifest = {
  id: TemplateId
  activeName: LocalizedText
  description: LocalizedText
  title: LocalizedText
  subtitle: LocalizedText
  blockName: LocalizedText
  purpose: LocalizedText
  variableFields: FightTemplateFieldSchema[]
  defaultFields?: Record<string, LocalizedText>
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
  chrome: {
    threatLevelLabel: LocalizedText
    threatLevelValue: LocalizedText
    dataIntegrityLabel: LocalizedText
    dataIntegrityValue: LocalizedText
    brandAlt: LocalizedText
    brandMarkTitle: LocalizedText
    brandMarkAria: LocalizedText
    brandImageSrc: string
    portraitAdjustHint: LocalizedText
  }
}

export type FightManifest = {
  templates: FightTemplateManifest[]
  fightUi: FightUiManifest
  sharedFightDataDefaults: {
    categories: Array<{
      id: string
      label: LocalizedText
    }>
    common: {
      style: LocalizedText
      advantage: LocalizedText
      mentality: LocalizedText
      blueCorner: LocalizedText
      redCorner: LocalizedText
      noImage: LocalizedText
      portraitSlot: LocalizedText
      noDrawsCurrentSetup: LocalizedText
      baseline: LocalizedText
      toolkitProfileSuffix: LocalizedText
      noEntry: LocalizedText
      noDataInCategory: LocalizedText
      noPowersWeaknesses: LocalizedText
      noLeftCategoryEdge: LocalizedText
      noRightCategoryEdge: LocalizedText
      archiveLabel: LocalizedText
      recordPrefix: LocalizedText
      entriesUnit: LocalizedText
      averageShort: LocalizedText
      parameterLabel: LocalizedText
      scoreScaleLabel: LocalizedText
      drawZonesLabel: LocalizedText
      drawLabel: LocalizedText
      favoriteSuffix: LocalizedText
      summaryLabel: LocalizedText
      dataLabel: LocalizedText
      verdictLabel: LocalizedText
      mechanicsLabel: LocalizedText
      implicationLabel: LocalizedText
      psychologyLabel: LocalizedText
      templateBlockPreviewLabel: LocalizedText
      emptyFieldLabel: LocalizedText
      startLabel: LocalizedText
      fightTimeLabel: LocalizedText
      endLabel: LocalizedText
      advantageStaminaLabel: LocalizedText
      phaseLabel: LocalizedText
      phase1Label: LocalizedText
      phase2Label: LocalizedText
      phase3Label: LocalizedText
      scenarioPresetLabel: LocalizedText
    }
    profileFacts: {
      a: Array<{
        title: LocalizedText
        text: LocalizedText
      }>
      b: Array<{
        title: LocalizedText
        text: LocalizedText
      }>
    }
    victoryArchive: {
      a: string[]
      b: string[]
    }
  }
}

type TemplateTranslationSlice = Record<TemplateId, TemplatePreset>

const text = (pl: string, en: string): LocalizedText => ({ pl, en })
const field = (
  key: string,
  aliases: string[] = [],
  starter = true,
  options: Pick<FightTemplateFieldSchema, 'jsonKey' | 'source' | 'valueType'> = {},
): FightTemplateFieldSchema => ({
  key,
  aliases,
  starter,
  jsonKey: options.jsonKey,
  source: options.source,
  valueType: options.valueType,
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
    chrome: {
      threatLevelLabel: text('Stopień zagrożenia', 'Threat level'),
      threatLevelValue: text('ekstremalny', 'extreme'),
      dataIntegrityLabel: text('Integralność danych', 'Data integrity'),
      dataIntegrityValue: text('99.6%', '99.6%'),
      brandAlt: text('VersusVerseVault', 'VersusVerseVault'),
      brandMarkTitle: text('Sygnatura marki', 'Brand mark'),
      brandMarkAria: text('Sygnatura VersusVerseVault', 'VersusVerseVault badge'),
      brandImageSrc: '/assets/VS2.png',
      portraitAdjustHint: text('LPM: przesuń | PPM: skaluj', 'LMB: move | RMB: zoom'),
    },
  },
  sharedFightDataDefaults: {
    categories: [
      { id: 'strength', label: text('Siła', 'Strength') },
      { id: 'speed', label: text('Szybkość', 'Speed') },
      { id: 'durability', label: text('Wytrzymałość', 'Durability') },
      { id: 'battleIq', label: text('IQ bojowe', 'Combat IQ') },
      { id: 'hax', label: text('Hax', 'Hax') },
      { id: 'stamina', label: text('Kondycja', 'Stamina') },
      { id: 'style', label: text('Styl walki', 'Fighting Style') },
      { id: 'experience', label: text('Doświadczenie', 'Experience') },
      { id: 'skills', label: text('Umiejętności', 'Combat Skills') },
    ],
    common: {
      style: text('Styl', 'Style'),
      advantage: text('Atut', 'Advantage'),
      mentality: text('Mentalność', 'Mentality'),
      blueCorner: text('Niebieski narożnik', 'Blue corner'),
      redCorner: text('Czerwony narożnik', 'Red corner'),
      noImage: text('Brak obrazu', 'No image'),
      portraitSlot: text('Miejsce na portret', 'Portrait Slot'),
      noDrawsCurrentSetup: text('Brak remisów w bieżącym układzie.', 'No draws in current setup.'),
      baseline: text('Bazowy', 'Baseline'),
      toolkitProfileSuffix: text('profil narzędzi', 'toolkit profile'),
      noEntry: text('Brak wpisu.', 'No entry.'),
      noDataInCategory: text('Brak danych w tej kategorii.', 'No data in this category.'),
      noPowersWeaknesses: text('Brak danych o mocach i słabościach.', 'No powers / weaknesses data found.'),
      noLeftCategoryEdge: text('Brak przewagi kategorii po lewej stronie.', 'No category edge for the left side.'),
      noRightCategoryEdge: text('Brak przewagi kategorii po prawej stronie.', 'No category edge for the right side.'),
      archiveLabel: text('ARCHIWUM', 'ARCHIVE'),
      recordPrefix: text('REKORD', 'RECORD'),
      entriesUnit: text('wpisów', 'entries'),
      averageShort: text('Śr.', 'Avg'),
      parameterLabel: text('Parametr', 'Parameter'),
      scoreScaleLabel: text('Wynik (0-100)', 'Score (0-100)'),
      drawZonesLabel: text('Strefy remisu', 'Draw zones'),
      drawLabel: text('REMIS', 'DRAW'),
      favoriteSuffix: text('faworyt', 'favorite'),
      summaryLabel: text('Podsumowanie', 'Summary'),
      dataLabel: text('Dane', 'Data'),
      verdictLabel: text('Werdykt', 'Verdict'),
      mechanicsLabel: text('Mechanika:', 'Mechanics:'),
      implicationLabel: text('Implikacja:', 'Implication:'),
      psychologyLabel: text('Psychologia:', 'Psychology:'),
      templateBlockPreviewLabel: text('Podgląd bloku template', 'Template block preview'),
      emptyFieldLabel: text('PUSTE POLE', 'EMPTY FIELD'),
      startLabel: text('POCZĄTEK', 'START'),
      fightTimeLabel: text('CZAS WALKI', 'FIGHT TIME'),
      endLabel: text('KONIEC', 'END'),
      advantageStaminaLabel: text('PRZEWAGA / KONDYCJA', 'ADVANTAGE / STAMINA'),
      phaseLabel: text('Faza', 'Phase'),
      phase1Label: text('Faza 1: Otwarcie.', 'Phase 1: Opening.'),
      phase2Label: text('Faza 2: Środek walki.', 'Phase 2: Midfight.'),
      phase3Label: text('Faza 3: Końcówka.', 'Phase 3: Endgame.'),
      scenarioPresetLabel: text('Preset scenariusza', 'Scenario preset'),
    },
    profileFacts: {
      a: [
        { title: text('Styl', 'Style'), text: text('Kontrola dystansu i tempa', 'Range control and pace control') },
        { title: text('Atut', 'Advantage'), text: text('Dyscyplina taktyczna', 'Tactical discipline') },
        { title: text('Mentalność', 'Mentality'), text: text('Wygrać decyzją, uniknąć zniszczeń', 'Win by decision, avoid collateral damage') },
      ],
      b: [
        { title: text('Styl', 'Style'), text: text('Agresywne skracanie dystansu', 'Aggressive distance closing') },
        { title: text('Atut', 'Advantage'), text: text('Nieludzka regeneracja', 'Extreme regeneration') },
        { title: text('Mentalność', 'Mentality'), text: text('Złamać przeciwnika za wszelką cenę', 'Break the opponent at any cost') },
      ],
    },
    victoryArchive: {
      a: ['Doomsday', 'Brainiac', 'Mongul', "H'el", 'Pariah', 'Rogol Zaar', 'Ulysses', 'Wraith'],
      b: ['Thor', 'Hulk', 'Blue Marvel', 'Juggernaut', 'Namora', 'Winter Guard', 'Rogue', 'Gambit'],
    },
  },
  templates: [
    {
      id: 'tactical-board',
      activeName: text('Tablica taktyczna', 'Tactical board'),
      description: text('Plansza kategorii i ekran realiów walki.', 'Category board and combat-reality screen.'),
      title: text('TABLICA TAKTYCZNA', 'TACTICAL BOARD'),
      subtitle: text('Tabela kategorii i nieliniowa rzeczywistość starcia', 'Category table and non-linear combat reality'),
      blockName: text('Tablica Taktyczna', 'Tactical Board'),
      purpose: text('Plansza kategorii + panel chaosu.', 'Category board + chaos panel.'),
      aliases: ['tablica taktyczna', 'tactical board', 'methodology', 'metodologia'],
      variableFields: [
        field('subtitle', ['purpose', 'note']),
        field('lane', ['line_1', 'line1']),
      ],
      defaultFields: {
        left_header: text('Kategorie', 'Categories'),
        right_header: text('Rzeczywistość walki', 'Combat reality'),
        linear_label: text('Segment liniowy', 'Linear segment'),
        chaos_label: text('Segment chaosu', 'Chaos segment'),
      },
    },
    {
      id: 'character-dossier-a',
      activeName: text('Dossier postaci', 'Character dossier'),
      description: text('Pełna karta lewej postaci z większym miejscem na portret.', 'Single full card for fighter A (more portrait space).'),
      title: text('DOSSIER POSTACI', 'CHARACTER DOSSIER'),
      subtitle: text('Archetyp, styl i profil taktyczny', 'Archetype, style and tactical profile'),
      blockName: text('Dossier Postaci A', 'Character Dossier A'),
      purpose: text('Karta lewej postaci (niebieski narożnik).', 'Card for the left fighter (blue corner).'),
      aliases: ['character a', 'character card a', 'card a', 'dossier postaci a', 'karta postaci a', 'postać a'],
      legacyIds: ['character-card-a'],
      variableFields: [],
      defaultFields: {
        corner_label: text('Niebieski narożnik', 'Blue corner'),
        quote: text('Walka oparta na kontroli tempa i dystansu.', 'Fighter who controls pace and distance.'),
      },
    },
    {
      id: 'character-dossier-b',
      activeName: text('Dossier postaci', 'Character dossier'),
      description: text('Pełna karta prawej postaci z większym miejscem na portret.', 'Single full card for fighter B (more portrait space).'),
      title: text('DOSSIER POSTACI', 'CHARACTER DOSSIER'),
      subtitle: text('Archetyp, styl i profil taktyczny', 'Archetype, style and tactical profile'),
      blockName: text('Dossier Postaci B', 'Character Dossier B'),
      purpose: text('Karta prawej postaci (czerwony narożnik).', 'Card for the right fighter (red corner).'),
      aliases: ['character b', 'character card b', 'card b', 'dossier postaci b', 'karta postaci b', 'postać b'],
      legacyIds: ['character-card-b'],
      variableFields: [],
      defaultFields: {
        corner_label: text('Czerwony narożnik', 'Red corner'),
        quote: text('Walka oparta na przejmowaniu inicjatywy i presji.', 'Fighter who takes initiative and applies pressure.'),
      },
    },
    {
      id: 'character-profile',
      activeName: text('Profil postaci', 'Character profile'),
      description: text('Dwustronny panel narzędzi i słabości obu postaci.', 'Split dossier for both fighters with grouped tools and weaknesses.'),
      title: text('PROFIL POSTACI', 'CHARACTER PROFILE'),
      subtitle: text('MOCE, NARZĘDZIA I SŁABOŚCI', 'POWERS, TOOLS, AND WEAKNESSES'),
      blockName: text('Profil Postaci', 'Character Profile'),
      purpose: text('Panel mocy, narzędzi i słabości obu postaci.', 'Panel for powers, tools, and weaknesses of both fighters.'),
      aliases: ['profil postaci', 'character profile', 'powers / tools / weaknesses', 'powers tools weaknesses', 'powers tools', 'moce narzędzia i słabości'],
      legacyIds: ['powers-tools'],
      derivedFrom: 'powers',
      variableFields: [],
      defaultFields: {
        powers_label: text('Moce', 'Powers'),
        tools_label: text('Narzędzia', 'Tools'),
        weaknesses_label: text('Słabości', 'Weaknesses'),
        left_title_suffix: text('profil narzędzi', 'toolkit profile'),
        right_title_suffix: text('profil narzędzi', 'toolkit profile'),
      },
    },
    {
      id: 'crucial-feats',
      activeName: text('Najważniejsze wyczyny', 'Crucial feats'),
      description: text('Lista konkretnych dokonań obu postaci, bez interpretacji.', 'Side-by-side feat ledger sourced from the import file.'),
      title: text('NAJWAŻNIEJSZE WYCZYNY', 'CRUCIAL FEATS'),
      subtitle: text('Skalowanie postaci poprzez osiągnięcia.', 'Character scaling through achievements.'),
      blockName: text('Najważniejsze Wyczyny', 'Crucial Feats'),
      purpose: text('Panel najważniejszych wyczynów obu postaci.', 'Panel for the most important feats of both fighters.'),
      aliases: ['najważniejsze wyczyny', 'crucial feats', 'raw feats', 'surowe featy', 'feats ledger'],
      legacyIds: ['raw-feats'],
      derivedFrom: 'crucial-feats',
      variableFields: [
        field('left_image', [], true, { jsonKey: 'leftImages', source: 'scans', valueType: 'string-array' }),
        field('right_image', [], true, { jsonKey: 'rightImages', source: 'scans', valueType: 'string-array' }),
      ],
      defaultFields: {
        feat_label: text('FEAT', 'FEAT'),
      },
    },
    {
      id: 'fight-analytics',
      activeName: text('Analityka walki', 'Fight analytics'),
      description: text('Militarna plansza z poziomymi paskami statystyk.', 'Military HUD look with long horizontal bars like output (1).'),
      title: text('ANALITYKA WALKI', 'FIGHT ANALYTICS'),
      subtitle: text('Szacowanie statystyk obu przeciwników', 'Estimated stats of both opponents'),
      blockName: text('Analityka Walki', 'Fight Analytics'),
      purpose: text('Długi panel statystyk poziomych.', 'Long horizontal statistics panel.'),
      aliases: ['analityka walki', 'fight analytics', 'hud bars', 'paski hud'],
      legacyIds: ['hud-bars'],
      variableFields: [],
      defaultFields: {
        parameter_label: text('Parametr', 'Parameter'),
        score_scale_label: text('Wynik (0-100)', 'Score (0-100)'),
        average_short: text('Śr.', 'Avg'),
        scale: text('0-100', '0-100'),
      },
    },
    {
      id: 'parameter-comparison',
      activeName: text('Porównanie parametrów', 'Parameter comparison'),
      description: text('Radar w centrum, przewagi po bokach, pasek wyniku na dole.', 'Center radar, side winner notes, bottom score strip.'),
      title: text('PORÓWNANIE PARAMETRÓW', 'PARAMETER COMPARISON'),
      subtitle: text('Mapa średniego profilu statystyk', 'Average stat profile map'),
      blockName: text('Porównanie Parametrów', 'Parameter Comparison'),
      purpose: text('Radar + przewagi lewej i prawej strony.', 'Radar + left/right side advantages.'),
      aliases: ['porównanie parametrów', 'parameter comparison', 'radar brief', 'raport radarowy'],
      legacyIds: ['radar-brief'],
      variableFields: [
        field('left_header'),
        field('right_header'),
        field('favorite_label', ['favorite']),
        field('draw_favorite', ['draw_favorite_label', 'favorite_draw']),
      ],
      defaultFields: {
        left_header: text('NIEBIESKI NAROŻNIK', 'BLUE CORNER'),
        right_header: text('CZERWONY NAROŻNIK', 'RED CORNER'),
        draw_header: text('Strefy remisu', 'Draw zones'),
        favorite_label: text('Faworyt według statystyk', 'Stat-based favorite'),
        draw_favorite: text('REMIS', 'DRAW'),
      },
    },
    {
      id: 'victory-archive',
      activeName: text('Archiwum zwycięstw', 'Victory archive'),
      description: text('Lista najważniejszych pokonanych rywali po obu stronach.', 'List of top beaten opponents for both fighters.'),
      title: text('ARCHIWUM ZWYCIĘSTW', 'VICTORY ARCHIVE'),
      subtitle: text('Najważniejsi pokonani przeciwnicy', 'Most notable defeated opponents'),
      blockName: text('Archiwum Zwycięstw', 'Victory Archive'),
      purpose: text('Lista pokonanych przeciwników.', 'List of defeated opponents.'),
      aliases: ['archiwum zwycięstw', 'victory archive', 'winner cv', 'cv zwycięzców', 'cv zwyciezcow'],
      legacyIds: ['winner-cv'],
      variableFields: [
        field('left_image', [], true, { jsonKey: 'leftImages', source: 'scans', valueType: 'string-array' }),
        field('right_image', [], true, { jsonKey: 'rightImages', source: 'scans', valueType: 'string-array' }),
      ],
      defaultFields: {
        archive_label: text('ARCHIWUM', 'ARCHIVE'),
        left_title_prefix: text('REKORD', 'RECORD'),
        right_title_prefix: text('REKORD', 'RECORD'),
        entries_unit: text('wpisów', 'entries'),
      },
    },
    {
      id: 'final-summary',
      activeName: text('Podsumowanie końcowe', 'Final summary'),
      description: text('Blok końcowego podsumowania z danych importu.', 'Summary card placeholder from imported template block.'),
      title: text('PODSUMOWANIE KOŃCOWE', 'FINAL SUMMARY'),
      subtitle: text('Werdykt wstępny', 'Preliminary verdict'),
      blockName: text('Podsumowanie Końcowe', 'Final Summary'),
      purpose: text('Końcowe streszczenie starcia.', 'Final fight summary.'),
      aliases: ['podsumowanie końcowe', 'final summary', 'podsumowanie', 'summary'],
      legacyIds: ['summary'],
      variableFields: [
        field('winner', ['verdict']),
        field('line_1', ['line1']),
        field('line_2', ['line2']),
        field('line_3', ['line3']),
      ],
      defaultFields: {
        winner: text('WERDYKT WARUNKOWY, BRAK ABSOLUTNEGO STOMPA', 'CONDITIONAL VERDICT, NO ABSOLUTE STOMP'),
        line_1: text('Tempo > obrażenia na otwarciu.', 'Tempo > damage in opening.'),
        line_2: text('Regeneracja zmienia późną fazę starcia.', 'Regeneration changes late game.'),
        line_3: text('Zasady walki mogą odwrócić werdykt.', 'Rules can flip the verdict.'),
      },
    },
    {
      id: 'battle-dynamics',
      activeName: text('Dynamika walki', 'Battle dynamics'),
      description: text('Tempo walki i presja w czasie.', 'Fight tempo and pressure over time.'),
      title: text('DYNAMIKA WALKI', 'BATTLE DYNAMICS'),
      subtitle: text('Jak walka zmienia się z minuty na minutę.', 'How the fight changes minute by minute.'),
      blockName: text('Dynamika Starcia', 'Battle Dynamics'),
      purpose: text('Tempo walki i presja w czasie.', 'Fight tempo and pressure over time.'),
      aliases: ['dynamika starcia', 'battle dynamics'],
      variableFields: [
        field('a_curve', ['curve_a', 'blue_curve', 'left_curve']),
        field('b_curve', ['curve_b', 'red_curve', 'right_curve']),
        field('yellow_wave', ['wave', 'chaos_wave']),
        field('phase_1', ['phase1']),
        field('phase_2', ['phase2']),
        field('phase_3', ['phase3']),
        field('analysis', ['note', 'line_4', 'line4']),
      ],
    },
    {
      id: 'x-factor',
      activeName: text('X-Factor', 'X-Factor'),
      description: text('Najważniejsza zmienna decydująca.', 'Most decisive variable.'),
      title: text('X-FACTOR', 'X-FACTOR'),
      subtitle: text('Zmienna, która wpływa na werdykt bardziej niż zwykłe statystyki.', 'The variable that affects the verdict more than ordinary stats.'),
      blockName: text('X-Factor', 'X-Factor'),
      purpose: text('Najważniejsza zmienna decydująca.', 'Most decisive variable.'),
      aliases: ['x-factor', 'xfactor'],
      variableFields: [
        field('factor', ['headline']),
        field('a_value', ['super_value', 'superman', 'left_value']),
        field('a_bonus', ['super_bonus', 'left_bonus']),
        field('a_bonus_label', ['left_bonus_label']),
        field('b_value', ['hyper_value', 'hyperion', 'right_value']),
        field('b_bonus', ['hyper_bonus', 'right_bonus']),
        field('regen', ['regen_label']),
        field('mechanika', ['mechanics']),
        field('implikacja', ['implication']),
        field('psychologia', ['psychology']),
      ],
    },
    {
      id: 'interpretation',
      activeName: text('Interpretacja', 'Interpretation'),
      description: text('Komentarz ekspercki do danych.', 'Expert readout of the data.'),
      title: text('INTERPRETACJA', 'INTERPRETATION'),
      subtitle: text('Kto wygrywa walkę na papierze?', 'Who wins the fight on paper?'),
      blockName: text('Interpretacja', 'Interpretation'),
      purpose: text('Komentarz ekspercki do danych.', 'Expert readout of the data.'),
      aliases: ['interpretacja', 'interpretation'],
      variableFields: [
        field('line_1', ['line1', 'thesis']),
        field('line_2', ['line2', 'antithesis']),
        field('line_3', ['line3', 'conclusion']),
        field('quote', ['line_4', 'line4']),
      ],
      defaultFields: {
        line_3: text('Warunki i wykonanie decydują o wyniku.', 'Conditions and execution decide the result.'),
      },
    },
    {
      id: 'fight-simulation',
      activeName: text('Symulacja walki', 'Fight simulation'),
      description: text('Symulacja etapów walki.', 'Three-phase simulation board.'),
      title: text('SYMULACJA WALKI', 'FIGHT SIMULATION'),
      subtitle: text('Przebieg walki przez trzy fazy.', 'The course of the fight across three phases.'),
      blockName: text('Symulacja Walki', 'Fight Simulation'),
      purpose: text('Symulacja etapów walki.', 'Three-phase simulation board.'),
      aliases: ['symulacja walki', 'fight simulation'],
      variableFields: [
        field('opening'),
        field('mid_fight', ['midfight']),
        field('late_fight', ['latefight']),
        field('end_condition', ['endcondition']),
        field('phase_mode', ['phasemode', 'mode', 'simulation_mode', 'simulationmode']),
        field('phase_animation', ['phaseanimation', 'animation', 'scenario', 'preset', 'simulation_animation', 'simulationanimation']),
        field('phase_actor', ['phaseactor', 'actor', 'lead', 'aggressor', 'attacker']),
        field('phase_<N>_mode', ['phase<N>mode', 'phase_<N>_type', 'phase<N>type']),
        field('phase_<N>_animation', ['phase<N>animation', 'phase_<N>_scenario', 'phase<N>scenario', 'phase_<N>_preset', 'phase<N>preset']),
        field('phase_<N>_actor', ['phase<N>actor', 'phase_<N>_lead', 'phase<N>lead', 'phase_<N>_aggressor', 'phase<N>aggressor', 'phase_<N>_attacker', 'phase<N>attacker']),
        field('phase_<N>_title', ['phase<N>title', 'phase_<N>_headline', 'phase<N>headline']),
        field('phase_<N>_a_label', ['phase<N>alabel', 'phase_<N>_left_label', 'phase<N>leftlabel']),
        field('phase_<N>_b_label', ['phase<N>blabel', 'phase_<N>_right_label', 'phase<N>rightlabel']),
        field('phase_<N>_a_value', ['phase<N>avalue', 'phase_<N>_left_value', 'phase<N>leftvalue']),
        field('phase_<N>_b_value', ['phase<N>bvalue', 'phase_<N>_right_value', 'phase<N>rightvalue']),
        field('phase_<N>_event', ['phase<N>event', 'phase_<N>_turn', 'phase<N>turn', 'phase_<N>_pivot', 'phase<N>pivot']),
        field('phase_<N>_branch_a', ['phase<N>brancha', 'phase_<N>_option_a', 'phase<N>optiona', 'phase_<N>_left_option', 'phase<N>leftoption']),
        field('phase_<N>_branch_b', ['phase<N>branchb', 'phase_<N>_option_b', 'phase<N>optionb', 'phase_<N>_right_option', 'phase<N>rightoption']),
      ],
      defaultFields: {
        phase_1_actor: text('a', 'a'),
        phase_1_mode: text('bars', 'bars'),
        phase_2_actor: text('b', 'b'),
        phase_2_mode: text('split', 'split'),
        phase_3_mode: text('split', 'split'),
      },
    },
    {
      id: 'stat-trap',
      activeName: text('Pułapka statystyk', 'Stat trap'),
      description: text('Wyjaśnienie nieliniowości starcia.', 'Explains non-linear outcome mechanics.'),
      title: text('PUŁAPKA STATYSTYK', 'STAT TRAP'),
      subtitle: text('Dlaczego lepsze statystyki nie gwarantują zwycięstwa', 'Why better stats do not guarantee victory'),
      blockName: text('Pułapka Statystyk', 'Stat Trap'),
      purpose: text('Wyjaśnienie nieliniowości starcia.', 'Explains non-linear outcome mechanics.'),
      aliases: ['pułapka statystyk', 'pulapka statystyk', 'stat trap'],
      variableFields: [
        field('trap_top', ['top', 'line_1']),
        field('trap_bottom', ['bottom', 'line_2']),
        field('example', ['line_3']),
        field('question', ['line_4', 'trap']),
      ],
      defaultFields: {
        trap_top: text('REGENERACJA I BRUTALNOŚĆ >', 'REGEN AND BRUTALITY >'),
        trap_bottom: text('TECHNIKA W DŁUGIEJ WALCE', 'TECHNIQUE IN A LONG FIGHT'),
        example: text(
          'Przewaga umiejętności o 2-3 punkty znika, gdy przeciwnik od razu leczy każde trafienie.',
          'A 2-3 point skill edge disappears when the opponent heals immediately after each hit.',
        ),
        question: text(
          'Kluczowe pytanie: W zasadach "tylko zabicie" regeneracja przeciwnika znaczy więcej niż ogólny profil statystyk.',
          "KEY QUESTION: In 'Kill-Only' rules, opponent regeneration matters more than all-around stats.",
        ),
      },
    },
    {
      id: 'direct-verdict',
      activeName: text('Werdykt prosty', 'Direct verdict'),
      description: text('Jednostronny werdykt bez matrycy warunków.', 'One-sided verdict without a condition matrix.'),
      title: text('WERDYKT PROSTY', 'DIRECT VERDICT'),
      subtitle: text('Jednostronny rezultat bez matrycy warunków.', 'One-sided result without a condition matrix.'),
      blockName: text('Werdykt Prosty', 'Direct Verdict'),
      purpose: text('Plansza jednostronnego werdyktu bez matrycy.', 'Single-outcome verdict board without matrix logic.'),
      aliases: ['werdykt prosty', 'direct verdict', 'simple verdict', 'clear verdict'],
      variableFields: [
        field('winner', ['verdict']),
        field('loser', ['opponent']),
        field('outcome', ['result', 'method']),
        field('certainty', ['margin', 'confidence']),
        field('line_1', ['line1']),
        field('line_2', ['line2']),
        field('line_3', ['line3']),
      ],
      defaultFields: {
        outcome: text('Wygrywa konsekwentnie w standardowych warunkach.', 'Wins consistently under standard conditions.'),
        certainty: text('Wysoka', 'High'),
        line_1: text('Przewaga jest stała i nie zależy od niszowych zasad walki.', 'The edge is stable and does not depend on niche rules.'),
        line_2: text('Przeciwnik nie ma realistycznego mechanizmu odwrócenia przebiegu starcia.', 'The opponent lacks a realistic mechanism to flip the fight.'),
        line_3: text('Większość sensownych scenariuszy kończy się tym samym wynikiem.', 'Most reasonable scenarios end with the same result.'),
      },
    },
    {
      id: 'verdict-matrix',
      activeName: text('Matryca werdyktu', 'Verdict matrix'),
      description: text('Werdykt zależny od warunków walki.', 'Condition-based verdict matrix.'),
      title: text('MATRYCA WERDYKTU', 'VERDICT MATRIX'),
      subtitle: text('Wygrana zależy od zasad walki.', 'Victory depends on the rules.'),
      blockName: text('Matryca Werdyktu', 'Verdict Matrix'),
      purpose: text('Werdykt zależny od warunków.', 'Condition-based verdict matrix.'),
      aliases: ['matryca werdyktu', 'verdict matrix'],
      variableFields: [
        field('case_1', ['case1']),
        field('case_2', ['case2']),
        field('case_3', ['case3']),
        field('case_4', ['case4']),
      ],
      defaultFields: {
        col_left: text('SOLAR FLARE: TAK', 'SOLAR FLARE: YES'),
        col_right: text('SOLAR FLARE: NIE', 'SOLAR FLARE: NO'),
        row_top: text('STANDARD KO', 'STANDARD KO'),
        row_bottom: text('WALKA NA ŚMIERĆ', 'DEATHMATCH'),
      },
    },
    {
      id: 'fight-card',
      activeName: text('Karta walki', 'Fight card'),
      description: text('Animowany ekran końcowy z nazwą pojedynku.', 'Animated final screen with matchup name.'),
      title: text('KARTA WALKI', 'FIGHT CARD'),
      subtitle: text('Sekwencja ukończona', 'Sequence Complete'),
      blockName: text('Karta Walki', 'Fight Card'),
      purpose: text('Finalny ekran z nazwami postaci i ich kolorami.', 'Final screen with fighter names and character-themed colors.'),
      aliases: ['karta walki', 'fight card', 'fight title', 'final title', 'ending title', 'napis końcowy'],
      legacyIds: ['fight-title'],
      forceFinal: true,
      variableFields: [
        field('fight_title', ['match_title', 'title_text', 'line_1', 'line1']),
      ],
      defaultFields: {
        top_color_a: text('#2563eb', '#2563eb'),
        top_color_b: text('#93c5fd', '#93c5fd'),
        bottom_color_a: text('#facc15', '#facc15'),
        bottom_color_b: text('#dc2626', '#dc2626'),
      },
    },
    {
      id: 'methodology',
      activeName: text('Metodologia', 'Methodology'),
      description: text('Plansza metodologii i nieliniowości walki.', 'Method board and non-linear combat panel.'),
      title: text('METODOLOGIA', 'METHODOLOGY'),
      subtitle: text('Źródła danych i dynamika walki', 'Data source and combat dynamics'),
      blockName: text('Metodologia', 'Methodology'),
      purpose: text('Plansza metodologii i nieliniowości walki.', 'Method board and non-linear combat panel.'),
      aliases: ['methodology', 'metodologia'],
      variableFields: [],
      defaultFields: {
        list_label: text('Lista kontrolna', 'Checklist'),
        reality_label: text('Rzeczywistość walki', 'Combat reality'),
        linear_label: text('Segment liniowy', 'Linear segment'),
        chaos_label: text('Segment chaosu', 'Chaos segment'),
        closing_label: text('Uwagi końcowe', 'Closing notes'),
      },
    },
  ],
}

const templateById = new Map(fightManifest.templates.map((template) => [template.id, template]))

export const getFightTemplateManifest = (templateId: TemplateId) => templateById.get(templateId)

export const getFightTemplatePreset = (templateId: TemplateId, language: FightManifestLocale): TemplatePreset => {
  const template = templateById.get(templateId)
  if (!template) {
    return {
      id: templateId,
      name: templateId,
      description: templateId,
      title: templateId.toUpperCase(),
      subtitle: '',
    }
  }
  return {
    id: template.id,
    name: localize(template.activeName, language),
    description: localize(template.description, language),
    title: localize(template.title, language),
    subtitle: localize(template.subtitle, language),
  }
}

export const getFightTemplatePresets = (language: FightManifestLocale): TemplatePreset[] =>
  fightManifest.templates.map((template) => getFightTemplatePreset(template.id, language))

export const getFightTemplateDefaultField = (
  templateId: TemplateId,
  fieldKey: string,
  language: FightManifestLocale,
) => {
  const template = templateById.get(templateId)
  if (!template?.defaultFields) return ''
  const value = template.defaultFields[fieldKey]
  return value ? localize(value, language) : ''
}

export const getFightTemplateAliases = (templateId: TemplateId) => {
  const template = templateById.get(templateId)
  if (!template) return []
  return Array.from(
    new Set([
      template.id,
      localize(template.blockName, 'pl'),
      localize(template.blockName, 'en'),
      localize(template.activeName, 'pl'),
      localize(template.activeName, 'en'),
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
    blockPl: localize(template.blockName, 'pl'),
    blockEn: localize(template.blockName, 'en'),
    purposePl: localize(template.purpose, 'pl'),
    purposeEn: localize(template.purpose, 'en'),
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
    register(localize(template.blockName, 'pl'))
    register(localize(template.blockName, 'en'))
    register(localize(template.activeName, 'pl'))
    register(localize(template.activeName, 'en'))
    ;(template.aliases || []).forEach(register)
    ;(template.legacyIds || []).forEach(register)
  })
  return map
}

export const getFightToolbarCopy = (language: FightManifestLocale) =>
  Object.fromEntries(
    Object.entries(fightManifest.fightUi.toolbar).map(([key, value]) => [key, localize(value, language)]),
  ) as Record<keyof FightUiManifest['toolbar'], string>

export const getFightChromeCopy = (language: FightManifestLocale) => ({
  threatLevelLabel: localize(fightManifest.fightUi.chrome.threatLevelLabel, language),
  threatLevelValue: localize(fightManifest.fightUi.chrome.threatLevelValue, language),
  dataIntegrityLabel: localize(fightManifest.fightUi.chrome.dataIntegrityLabel, language),
  dataIntegrityValue: localize(fightManifest.fightUi.chrome.dataIntegrityValue, language),
  brandAlt: localize(fightManifest.fightUi.chrome.brandAlt, language),
  brandMarkTitle: localize(fightManifest.fightUi.chrome.brandMarkTitle, language),
  brandMarkAria: localize(fightManifest.fightUi.chrome.brandMarkAria, language),
  brandImageSrc: fightManifest.fightUi.chrome.brandImageSrc,
  portraitAdjustHint: localize(fightManifest.fightUi.chrome.portraitAdjustHint, language),
})

export const buildFightTemplateChrome = (language: FightManifestLocale, fields: Record<string, string> = {}) => {
  const copy = getFightChromeCopy(language)
  return {
    threatLevelLabel: copy.threatLevelLabel,
    threatLevelValue: fields.threatlevel || copy.threatLevelValue,
    dataIntegrityLabel: copy.dataIntegrityLabel,
    dataIntegrityValue: fields.integrity || fields.dataintegrity || copy.dataIntegrityValue,
    brandAlt: copy.brandAlt,
    brandMarkTitle: copy.brandMarkTitle,
    brandMarkAria: fields.brandmarkaria || fields.brandaria || copy.brandMarkAria,
    brandImageSrc: fields.brandimagesrc || fields.brandimage || copy.brandImageSrc,
    portraitAdjustHint: copy.portraitAdjustHint,
  }
}

export const getFightCommonCopy = (language: FightManifestLocale) =>
  Object.fromEntries(
    Object.entries(fightManifest.sharedFightDataDefaults.common).map(([key, value]) => [key, localize(value, language)]),
  ) as Record<keyof FightManifest['sharedFightDataDefaults']['common'], string>

export const getFightDefaultCategories = (language: FightManifestLocale): Category[] =>
  fightManifest.sharedFightDataDefaults.categories.map((category) => ({
    id: category.id,
    label: localize(category.label, language),
  }))

export const getFightDefaultProfileFacts = (side: 'a' | 'b', language: FightManifestLocale): FighterFact[] =>
  fightManifest.sharedFightDataDefaults.profileFacts[side].map((entry) => ({
    title: localize(entry.title, language),
    text: localize(entry.text, language),
  }))

export const getFightDefaultVictoryArchive = (side: 'a' | 'b') =>
  fightManifest.sharedFightDataDefaults.victoryArchive[side].slice()

export const getFightFinalTemplateId = () =>
  fightManifest.templates.find((template) => template.forceFinal)?.id || 'fight-card'

export const getFightTemplateIds = () => fightManifest.templates.map((template) => template.id)

export const buildFightTemplateTranslationSlice = (language: FightManifestLocale): TemplateTranslationSlice =>
  Object.fromEntries(
    fightManifest.templates.map((template) => [template.id, getFightTemplatePreset(template.id, language)]),
  ) as TemplateTranslationSlice

export const buildFightTranslationSlice = (language: FightManifestLocale) => {
  const common = getFightCommonCopy(language)
  const toolbar = getFightToolbarCopy(language)

  return {
    categories: Object.fromEntries(
      fightManifest.sharedFightDataDefaults.categories.map((category) => [category.id, localize(category.label, language)]),
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

const FIGHT_STAT_IDS: FightStatId[] = [
  'strength',
  'speed',
  'durability',
  'battleIq',
  'hax',
  'stamina',
  'style',
  'experience',
  'skills',
]

const buildEmptyStatsRecord = () =>
  Object.fromEntries(FIGHT_STAT_IDS.map((statId) => [statId, null])) as Partial<
    Record<FightStatId, number | null>
  >

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
    if (
      templateId === 'crucial-feats' ||
      templateId === 'victory-archive'
    ) {
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
