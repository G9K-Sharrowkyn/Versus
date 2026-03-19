import { readFileSync } from 'fs';
const src = readFileSync('f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/anime/the-cyberpunk-station-for-netrunners/dist/bundle.js', 'utf8');
console.log('Total length:', src.length);

// Find all String.raw occurrences
const re = /String\.raw`/g;
let m;
const positions = [];
while ((m = re.exec(src)) !== null) {
  positions.push(m.index);
}
console.log('String.raw positions:', positions);

// Show context before each String.raw (variable name)
positions.forEach((pos, i) => {
  const before = src.slice(Math.max(0, pos - 20), pos);
  const after = src.slice(pos, pos + 50);
  console.log(`\n[${i}] pos=${pos} ctx: ...${before}|||${after}...`);
});
