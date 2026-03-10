import {
  normalizeToken,
  stripFileExtension,
  toMatchupDisplayNameFromFileName,
  findFightByQuery
} from './src/features/vs/helpers.js';

const fights = [
  {
    id: 'folder::2knullvsodinenjson',
    name: 'Knull vs Odin',
    fileName: '2 Knull vs Odin EN.json',
    matchupKey: 'knull::odin'
  },
  {
    id: 'folder::2knullvsodinpljson',
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
