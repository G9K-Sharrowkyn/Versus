import { readFileSync } from 'fs';
const src = readFileSync('f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/anime/the-cyberpunk-station-for-netrunners/dist/bundle.js', 'utf8');

const starts = [724672, 728176, 729061, 731037, 733073, 734728, 738338];

starts.forEach((start, i) => {
  // "String.raw`" is 11 chars (10 + backtick), content starts at start+11
  const contentStart = start + 11;
  let end = contentStart;
  while (end < src.length) {
    if (src[end] === '`') break;
    end++;
  }
  const content = src.slice(contentStart, end);
  console.log(`\n=== [${i}] pos=${start}..${end} length=${content.length} ===`);
  console.log('FIRST 150:', JSON.stringify(content.slice(0, 150)));
  console.log('LAST  150:', JSON.stringify(content.slice(-150)));
});
