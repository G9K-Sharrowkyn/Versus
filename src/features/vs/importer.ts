import type { Category, FighterFact, Language, ParsedStat, ParsedVsImport, TemplateId } from './types'
import { DEFAULT_CATEGORIES, DEFAULT_TEMPLATE_ORDER, TEMPLATE_ID_SET, TEMPLATE_PRESETS, ensureTemplateOrderHasFinal, pickLang } from './presets'
import { clamp, normalizeToken, slug } from './helpers'

export const extractBullet = (line: string) => line.trim().replace(/^[-*?]\s*/, '').trim()

export const parseBulletItems = (lines: string[]) =>
  lines
    .map((line) => extractBullet(line))
    .filter(Boolean)

export const trimSectionAtTemplateBlock = (lines: string[]) => {
  const templateStart = lines.findIndex((line) => /^\s*Template\b/i.test(line.trim()))
  return templateStart >= 0 ? lines.slice(0, templateStart) : lines
}

export const parseStatItems = (lines: string[]): ParsedStat[] => {
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

export const factDefaults = ['Style', 'Advantage', 'Mentality']

export const parseFactItems = (lines: string[]): FighterFact[] =>
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

export const pickNameFromSection = (
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

export const TEMPLATE_TOKEN_MAP: Record<string, TemplateId> = {
  powerstools: 'powers-tools',
  powersweaknesses: 'powers-tools',
  powertoolsweaknesses: 'powers-tools',
  mocenarzedziaslabosci: 'powers-tools',
  rawfeats: 'raw-feats',
  featsledger: 'raw-feats',
  surowefeaty: 'raw-feats',
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
  fighttitle: 'fight-title',
  finaltitle: 'fight-title',
  finalscreen: 'fight-title',
}

export const parseTemplateOrder = (lines: string[]) => {
  const ids: TemplateId[] = []
  for (const line of parseBulletItems(lines)) {
    const normalized = normalizeToken(line)
    if (!normalized) continue
    const mapped = TEMPLATE_TOKEN_MAP[normalized]
    if (mapped) ids.push(mapped)
  }
  return ensureTemplateOrderHasFinal(ids.length ? ids : DEFAULT_TEMPLATE_ORDER)
}

export const parseTemplateOrderTokens = (tokens: string[]) => {
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

export const parseTemplateBlocks = (raw: string) => {
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

export type TemplateBlockRequirement = {
  blockPl: string
  blockEn: string
  purposePl: string
  purposeEn: string
  fields: string[]
}

export const TEMPLATE_BLOCK_REQUIREMENTS: TemplateBlockRequirement[] = [
  {
    blockPl: 'Postać A',
    blockEn: 'Character A',
    purposePl: 'Karta lewej postaci (niebieski narożnik).',
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
    blockPl: 'Postać B',
    blockEn: 'Character B',
    purposePl: 'Karta prawej postaci (czerwony narożnik).',
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
    blockPl: 'Moce / Narzedzia / Slabosci',
    blockEn: 'Powers / Tools / Weaknesses',
    purposePl: 'Panel mocy, narzedzi i slabosci obu postaci.',
    purposeEn: 'Panel for powers, tools, and weaknesses of both fighters.',
    fields: [
      'headline | header | title',
      'subtitle | purpose | note',
      'left_title',
      'right_title',
      'powers_label',
      'tools_label',
      'weaknesses_label',
    ],
  },
  {
    blockPl: 'Surowe Featy',
    blockEn: 'Raw Feats',
    purposePl: 'Panel surowych featow obu postaci.',
    purposeEn: 'Panel for raw feats of both fighters.',
    fields: [
      'headline | header | title',
      'subtitle | purpose | note',
      'left_title',
      'right_title',
      'feat_label',
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
    purposePl: 'Długi panel statystyk poziomych.',
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
      'draw_favorite | draw_favorite_label | favorite_draw',
    ],
  },
  {
    blockPl: 'CV Zwycięzców',
    blockEn: 'Winner CV',
    purposePl: 'Lista pokonanych przeciwników.',
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
    purposePl: 'Końcowe streszczenie starcia.',
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
    purposePl: 'Najważniejsza zmienna decydująca.',
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
    purposePl: 'Symulacja etapów walki.',
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
    blockPl: 'Pułapka Statystyk',
    blockEn: 'Stat Trap',
    purposePl: 'Wyjaśnienie nieliniowości starcia.',
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
    purposePl: 'Werdykt zależny od warunków.',
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
    blockPl: 'Napis Koncowy',
    blockEn: 'Fight Title',
    purposePl: 'Finalny ekran z nazwami postaci i ich kolorami.',
    purposeEn: 'Final screen with fighter names and character-themed colors.',
    fields: [
      'fight_title | match_title | title_text | line_1 | line1',
      'subtitle | purpose | note | line_2 | line2',
      'top_color_a | top_primary | fighter_a_color_a | fighter_a_primary',
      'top_color_b | top_secondary | fighter_a_color_b | fighter_a_secondary',
      'bottom_color_a | bottom_primary | fighter_b_color_a | fighter_b_primary',
      'bottom_color_b | bottom_secondary | fighter_b_color_b | fighter_b_secondary',
      'top_dark | fighter_a_dark',
      'bottom_dark | fighter_b_dark',
    ],
  },
  {
    blockPl: 'Metodologia',
    blockEn: 'Methodology',
    purposePl: 'Plansza metodologii i nieliniowości walki.',
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

export const buildImportTxtBlueprint = (language: Language) => {
  const lines: string[] = []
  lines.push(pickLang(language, '1. (Nazwa Postaci A)', '1. (Character A Name)'))
  lines.push(pickLang(language, '2. (Staty Postaci A)', '2. (Character A Stats)'))
  lines.push(pickLang(language, '- Siła: 96', '- Strength: 96'))
  lines.push(pickLang(language, '- Szybkość: 95', '- Speed: 95'))
  lines.push(pickLang(language, '- Wytrzymałość: 94', '- Durability: 94'))
  lines.push(pickLang(language, '3. (Featy Postaci A)', '3. (Character A Feats)'))
  lines.push(pickLang(language, '- Styl: Kontrola dystansu i tempa', '- Style: Range control and pace control'))
  lines.push(pickLang(language, '- Atut: Dyscyplina taktyczna', '- Advantage: Tactical discipline'))
  lines.push(pickLang(language, '- Mentalnosc: Wygrać decyzją, uniknąć zniszczeń', '- Mentality: Win by decision, avoid collateral damage'))
  lines.push(pickLang(language, '4. (Pokonani przez Postać A)', '4. (Defeated by Character A)'))
  lines.push('- Doomsday')
  lines.push('- Brainiac')
  lines.push(pickLang(language, '5. (Nazwa Postaci B)', '5. (Character B Name)'))
  lines.push(pickLang(language, '6. (Staty Postaci B)', '6. (Character B Stats)'))
  lines.push(pickLang(language, '- Siła: 92', '- Strength: 92'))
  lines.push(pickLang(language, '- Szybkość: 84', '- Speed: 84'))
  lines.push(pickLang(language, '- Wytrzymałość: 95', '- Durability: 95'))
  lines.push(pickLang(language, '7. (Featy Postaci B)', '7. (Character B Feats)'))
  lines.push(pickLang(language, '- Styl: Agresywne skracanie dystansu', '- Style: Aggressive distance closing'))
  lines.push(pickLang(language, '- Atut: Nieludzka regeneracja', '- Advantage: Extreme regeneration'))
  lines.push(pickLang(language, '- Mentalnosc: Złamać przeciwnika za wszelką cenę', '- Mentality: Break the opponent at any cost'))
  lines.push(pickLang(language, '8. (Pokonani przez Postać B)', '8. (Defeated by Character B)'))
  lines.push('- Thor')
  lines.push('- Hulk')
  lines.push(pickLang(language, '9. (Kolejność templatek użytych w tej walce)', '9. (Template Order Used In This Fight)'))
  TEMPLATE_PRESETS.forEach((template) => {
    lines.push(`- ${template.id}`)
  })
  lines.push('')
  lines.push(
    pickLang(
      language,
      '10. (Moce / Narzędzia / Słabości Postaci A)',
      '10. (Character A Powers / Tools / Weaknesses)',
    ),
  )
  lines.push(
    pickLang(
      language,
      '- Narzędzia: Kontrola pola walki, presja dystansowa, odpowiedzi na zwarcie',
      '- Tools: Battlefield control, ranged pressure, answers to close range',
    ),
  )
  lines.push(
    pickLang(
      language,
      '- Słabości: Zależność od konkretnego źródła mocy lub wyraźny hard-counter',
      '- Weaknesses: Dependence on a specific power source or a clear hard counter',
    ),
  )
  lines.push(
    pickLang(
      language,
      '11. (Surowe Featy Postaci A)',
      '11. (Character A Raw Feats)',
    ),
  )
  lines.push(
    pickLang(
      language,
      '- Przetrwał atak skali planetarnej',
      '- Survived a planet-level attack',
    ),
  )
  lines.push(
    pickLang(
      language,
      '- Zniszczył cel jednym ciosem lub pojedynczą techniką',
      '- Destroyed a target with one strike or one technique',
    ),
  )
  lines.push(
    pickLang(
      language,
      '12. (Moce / Narzędzia / Słabości Postaci B)',
      '12. (Character B Powers / Tools / Weaknesses)',
    ),
  )
  lines.push(
    pickLang(
      language,
      '- Narzędzia: Regeneracja, kontratak, przewaga zasięgu lub specjalna mechanika',
      '- Tools: Regeneration, counterplay, range advantage, or a special mechanic',
    ),
  )
  lines.push(
    pickLang(
      language,
      '- Słabości: Luka taktyczna, limit zasobów albo konkretna podatność',
      '- Weaknesses: Tactical gap, resource limit, or a specific vulnerability',
    ),
  )
  lines.push(
    pickLang(
      language,
      '13. (Surowe Featy Postaci B)',
      '13. (Character B Raw Feats)',
    ),
  )
  lines.push(
    pickLang(
      language,
      '- Powstrzymał przeciwnika o dużo większej skali',
      '- Stopped an opponent operating at a much larger scale',
    ),
  )
  lines.push(
    pickLang(
      language,
      '- Odbudował się po skrajnym zniszczeniu',
      '- Rebuilt from catastrophic destruction',
    ),
  )
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

export const findTemplateBlockLines = (
  blocks: Record<string, string[]>,
  aliases: string[],
) => {
  const normalizedAliases = aliases.map((alias) => normalizeToken(alias))
  let latestMatch: string[] = []
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
      latestMatch = lines
    }
  }
  return latestMatch
}

export const parseTemplateFieldMap = (lines: string[]) => {
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

export const pickTemplateField = (fields: Record<string, string>, keys: string[]) => {
  for (const key of keys) {
    const normalized = normalizeToken(key)
    if (fields[normalized]) return fields[normalized]
  }
  return ''
}

export const buildCardFacts = (fallbackFacts: FighterFact[], fields: Record<string, string>, language: Language) => {
  const styleDefault = fallbackFacts[0]?.text || '-'
  const atutDefault = fallbackFacts[1]?.text || '-'
  const mentalDefault = fallbackFacts[2]?.text || '-'

  return [
    { title: pickLang(language, 'Styl', 'Style'), text: pickTemplateField(fields, ['style']) || styleDefault },
    { title: pickLang(language, 'Atut', 'Advantage'), text: pickTemplateField(fields, ['atut', 'advantage']) || atutDefault },
    {
      title: pickLang(language, 'Mentalność', 'Mentality'),
      text: pickTemplateField(fields, ['mentalnosc', 'mentality']) || mentalDefault,
    },
  ]
}

export const parseCurveValues = (raw: string, fallback: number[]) => {
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

export const parsePercentValue = (raw: string, fallback: number) => {
  const value = Number(raw.replace('%', '').trim())
  if (!Number.isFinite(value)) return fallback
  const scaled = value <= 1 ? value * 100 : value
  return Math.max(0, Math.min(100, scaled))
}

export const buildCurvePolyline = (
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

export const KEY_VALUE_BULLET_RE = /^[^:=]+\s*[:=]\s*.+$/

export const getPlainTemplateLines = (lines: string[]) =>
  parseBulletItems(lines).filter((item) => !KEY_VALUE_BULLET_RE.test(item))

export const TEMPLATE_BLOCK_ALIASES: Partial<Record<TemplateId, string[]>> = {
  'character-card-a': ['character a', 'character card a', 'card a', 'postac a', 'karta postaci a'],
  'character-card-b': ['character b', 'character card b', 'card b', 'postac b', 'karta postaci b'],
  'powers-tools': ['powers / tools / weaknesses', 'powers tools weaknesses', 'powers tools', 'mocenarzedziaslabosci', 'moce narzedzia slabosci'],
  'raw-feats': ['raw feats', 'surowe featy', 'feats ledger'],
  'tactical-board': ['tactical board', 'methodology', 'tablica taktyczna', 'metodologia'],
  'hud-bars': ['hud bars', 'paski hud'],
  'radar-brief': ['radar brief', 'parameter comparison', 'raport radarowy', 'porownanie parametrow'],
  'winner-cv': ['winner cv', 'cv zwyciezcow', 'cv zwyciezców', 'zwyciezcy cv'],
  summary: ['podsumowanie', 'summary'],
  'battle-dynamics': ['dynamika starcia', 'battle dynamics'],
  'x-factor': ['x-factor', 'xfactor'],
  interpretation: ['interpretacja', 'interpretation'],
  'fight-simulation': ['symulacja walki', 'fight simulation'],
  'stat-trap': ['pulapka statystyk', 'pułapka statystyk', 'stat trap'],
  'verdict-matrix': ['matryca werdyktu', 'verdict matrix'],
  'blank-template': ['new template', 'blank template', 'nowy template'],
  'fight-title': ['fight title', 'final title', 'ending title', 'napis koncowy'],
  methodology: ['methodology', 'metodologia'],
}

export const createCategoryPayload = (statsA: ParsedStat[], statsB: ParsedStat[]) => {
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

export const parseVsImportText = (raw: string): { ok: true; data: ParsedVsImport } | { ok: false; error: string } => {
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
  const section10 = sections.get(10)
  const section11 = sections.get(11)
  const section12 = sections.get(12)
  const section13 = sections.get(13)

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
  const powersA = section10 ? parseFactItems(trimSectionAtTemplateBlock(section10.lines)) : []
  const rawFeatsA = section11 ? parseBulletItems(trimSectionAtTemplateBlock(section11.lines)) : []
  const powersB = section12 ? parseFactItems(trimSectionAtTemplateBlock(section12.lines)) : []
  const rawFeatsB = section13 ? parseBulletItems(trimSectionAtTemplateBlock(section13.lines)) : []
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
      powersA,
      powersB,
      rawFeatsA,
      rawFeatsB,
      winsA,
      winsB,
      templateOrder,
      templateBlocks: parseTemplateBlocks(sanitized),
    },
  }
}


export type TemplateImageEntry = {
  id: string
  slot: number
  text: string
  imageFile: string
}

export type AutoTemplateImageRequest = {
  templateId: 'raw-feats' | 'winner-cv'
  side: 'left' | 'right'
  slot: number
}

const resolveAutoTemplateImageSection = (
  request: AutoTemplateImageRequest,
): string => {
  if (request.templateId === 'raw-feats') {
    return request.side === 'left' ? '6.1' : '6.2'
  }
  return request.side === 'left' ? '7.1' : '7.2'
}

export const resolveFightTemplateImageUrl = (
  folderKey: string | undefined,
  imageFile: string,
  autoRequest?: AutoTemplateImageRequest,
) => {
  if (!folderKey) return ''
  const trimmed = imageFile.trim()
  if (trimmed) {
    return `/api/fights/image?key=${encodeURIComponent(folderKey)}&file=${encodeURIComponent(trimmed)}`
  }
  if (!autoRequest || autoRequest.slot < 1) return ''
  return `/api/fights/image?key=${encodeURIComponent(folderKey)}&section=${encodeURIComponent(resolveAutoTemplateImageSection(autoRequest))}&index=${encodeURIComponent(String(autoRequest.slot))}`
}

export const buildTemplateImageEntries = (
  blockFields: Record<string, string>,
  side: 'left' | 'right',
  fallbackItems: string[],
) => {
  const entries: TemplateImageEntry[] = []
  const maxItems = Math.max(20, fallbackItems.length)

  for (let index = 1; index <= maxItems; index += 1) {
    const itemText = pickTemplateField(blockFields, [`${side}_item_${index}`]) || fallbackItems[index - 1] || ''
    const imageFile =
      pickTemplateField(blockFields, [
        `${side}_image_${index}`,
        `${side}_img_${index}`,
        `${side}_picture_${index}`,
      ]) || ''

    if (!itemText.trim() && !imageFile.trim()) continue
    entries.push({
      id: `${side}-${index}`,
      slot: index,
      text: itemText.trim(),
      imageFile: imageFile.trim(),
    })
  }

  if (!entries.length && fallbackItems.length) {
    fallbackItems.forEach((item, index) => {
      if (!item.trim()) return
      entries.push({
        id: `${side}-fallback-${index + 1}`,
        slot: index + 1,
        text: item.trim(),
        imageFile: '',
      })
    })
  }

  return entries
}
