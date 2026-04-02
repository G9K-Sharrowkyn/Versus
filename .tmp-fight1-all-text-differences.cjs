const fs = require('fs');
const path = require('path');

const pl = JSON.parse(fs.readFileSync(path.join('Fights','1 Superman vs King Hyperion','1 Superman vs King Hyperion PL.json'),'utf8'));
const en = JSON.parse(fs.readFileSync(path.join('Fights','1 Superman vs King Hyperion','1 Superman vs King Hyperion EN.json'),'utf8'));

const diffs = [];

function typeOf(v){
  if (Array.isArray(v)) return 'array';
  if (v === null) return 'null';
  return typeof v;
}

function walk(a, b, p){
  const ta = typeOf(a);
  const tb = typeOf(b);
  if (ta !== tb) return;

  if (ta === 'object'){
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of [...keys].sort()){
      if (!(k in a) || !(k in b)) continue;
      const np = p ? `${p}.${k}` : k;
      walk(a[k], b[k], np);
    }
    return;
  }

  if (ta === 'array'){
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i += 1){
      walk(a[i], b[i], `${p}[${i}]`);
    }
    return;
  }

  if (ta === 'string' && a !== b){
    diffs.push({ path: p, pl: a, en: b });
  }
}

walk(pl, en, '');

const grouped = new Map();
for (const d of diffs){
  const m = d.path.match(/^templates\.([^.]+)/);
  let section;
  if (m) section = `templates.${m[1]}`;
  else section = d.path.split('.')[0] || d.path;
  if (!grouped.has(section)) grouped.set(section, []);
  grouped.get(section).push(d);
}

const order = [...grouped.keys()].sort((a,b)=>a.localeCompare(b));
const lines = [];
lines.push(`# Fight 1 text differences (PL vs EN)`);
lines.push(``);
lines.push(`Total string differences: ${diffs.length}`);
lines.push(``);
for (const section of order){
  const items = grouped.get(section).sort((a,b)=>a.path.localeCompare(b.path));
  lines.push(`## ${section} (${items.length})`);
  lines.push(``);
  for (const item of items){
    lines.push(`- ${item.path}`);
    lines.push(`  - PL: ${item.pl}`);
    lines.push(`  - EN: ${item.en}`);
  }
  lines.push(``);
}

fs.writeFileSync('.tmp-fight1-all-text-differences.md', lines.join('\n'));
console.log(`wrote .tmp-fight1-all-text-differences.md with ${diffs.length} entries`);
