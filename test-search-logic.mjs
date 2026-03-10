const MATCHUP_PREFIX_PATTERN = /^\s*\d+\s*[._ -]*/
const FIGHT_LOCALE_SUFFIX_PATTERN = /(?:^|[\s._-])(pl|en|eng|polski|english)\s*$/i

const stripFileExtension = (value) => value.replace(/\.[^.]+$/, '').trim()
const stripFightFileDecoratorSuffix = (value) =>
  value.replace(/\.(?:txt|json)\s*(?:pl|en|eng|polski|english)?\s*$/i, '').trim()
const normalizeFightFileBaseName = (value) => stripFightFileDecoratorSuffix(stripFileExtension(value))

const normalizeToken = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')

const splitFightNameLocaleSuffix = (value) => {
  const normalized = value.replace(/[_]+/g, ' ').trim()
  if (!normalized) return { base: '', locale: 'unknown' }
  const match = normalized.match(FIGHT_LOCALE_SUFFIX_PATTERN)
  if (!match) return { base: normalized, locale: 'unknown' }
  const suffix = normalizeToken(match[1] || '')
  const locale = suffix === 'pl' || suffix === 'polski' ? 'pl' : 'en'
  const base = normalized.slice(0, match.index ?? normalized.length).trim()
  return { base: base || normalized, locale }
}

const toMatchupDisplayNameFromFileName = (fileName) => {
  const raw = normalizeFightFileBaseName(fileName).replace(MATCHUP_PREFIX_PATTERN, '').trim()
  const split = splitFightNameLocaleSuffix(raw)
  return split.base || raw
}

const findFightByQuery = (fights, query, preferredVariantByMatchup) => {
  const cleaned = stripFileExtension(query).trim()
  if (!cleaned) return null
  const token = normalizeToken(cleaned)
  if (!token) return null

  const candidates = fights.filter((fight) => {
    const matchupFromFile = normalizeToken(toMatchupDisplayNameFromFileName(fight.fileName))
    return (
      normalizeToken(stripFileExtension(fight.name)) === token ||
      matchupFromFile === token ||
      normalizeToken(stripFileExtension(fight.fileName)) === token
    )
  })

  if (!candidates.length) return null
  if (candidates.length === 1) return candidates[0]

  const preferredCandidate =
    candidates.find((fight) => preferredVariantByMatchup[fight.matchupKey] === fight.id) || null
  if (preferredCandidate) return preferredCandidate

  return candidates[0]
}

const fights = [
  {
    id: 'folder::2 Knull vs Odin::2knullvsodinenjson',
    name: 'Knull vs Odin',
    fileName: '2 Knull vs Odin EN.json',
    matchupKey: 'knull::odin'
  },
  {
    id: 'folder::2 Knull vs Odin::2knullvsodinpljson',
    name: 'Knull vs Odin PL',
    fileName: '2 Knull vs Odin PL.json',
    matchupKey: 'knull::odin'
  }
];

const queries = ['Knull vs Odin', 'knull vs odin', '2 Knull vs Odin', 'Knull vs Odin.json'];

queries.forEach(query => {
  const result = findFightByQuery(fights, query, {});
  console.log(`Query: "${query}" -> Found: ${result ? result.name : 'NONE'}`);
  
  const cleaned = stripFileExtension(query).trim();
  const token = normalizeToken(cleaned);
  console.log(`  Token: "${token}"`);
  
  fights.forEach(fight => {
    const matchupFromFile = normalizeToken(toMatchupDisplayNameFromFileName(fight.fileName));
    const nameToken = normalizeToken(stripFileExtension(fight.name));
    const fileToken = normalizeToken(stripFileExtension(fight.fileName));
    console.log(`  Fight: "${fight.fileName}"`);
    console.log(`    matchupFromFile: "${matchupFromFile}" (match: ${matchupFromFile === token})`);
    console.log(`    nameToken: "${nameToken}" (match: ${nameToken === token})`);
    console.log(`    fileToken: "${fileToken}" (match: ${fileToken === token})`);
  });
});
