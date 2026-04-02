const fs = require('fs');
const path = require('path');

const pl = JSON.parse(fs.readFileSync(path.join('Fights','1 Superman vs King Hyperion','1 Superman vs King Hyperion PL.json'),'utf8'));
const en = JSON.parse(fs.readFileSync(path.join('Fights','1 Superman vs King Hyperion','1 Superman vs King Hyperion EN.json'),'utf8'));

const diffs = [];
function t(v){ if(Array.isArray(v)) return 'array'; if(v===null) return 'null'; return typeof v; }
function walk(a,b,p){
  const ta=t(a), tb=t(b);
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
    for (let i=0;i<n;i++) walk(a[i], b[i], `${p}[${i}]`);
    return;
  }
  if (ta === 'string' && a !== b) diffs.push({path:p, pl:a, en:b});
}
walk(pl,en,'');
const lines = [];
for (const d of diffs.sort((x,y)=>x.path.localeCompare(y.path))){
  lines.push(`${d.path} | PL: ${d.pl} | EN: ${d.en}`);
}
fs.writeFileSync('.tmp-fight1-all-text-differences-flat.txt', lines.join('\n'));
console.log(`wrote .tmp-fight1-all-text-differences-flat.txt (${lines.length} lines)`);
