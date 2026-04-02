const fs = require('fs');
const path = require('path');

const pl = JSON.parse(fs.readFileSync(path.join('Fights','1 Superman vs King Hyperion','1 Superman vs King Hyperion PL.json'),'utf8'));
const en = JSON.parse(fs.readFileSync(path.join('Fights','1 Superman vs King Hyperion','1 Superman vs King Hyperion EN.json'),'utf8'));

const diffs = [];
function typeOf(v){ if(Array.isArray(v)) return 'array'; if(v===null) return 'null'; return typeof v; }
function walk(a,b,p){
  const ta=typeOf(a), tb=typeOf(b);
  if(ta!==tb) return;
  if(ta==='object'){
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for(const k of [...keys].sort()){
      if(!(k in a) || !(k in b)) continue;
      const np = p ? `${p}.${k}` : k;
      walk(a[k], b[k], np);
    }
    return;
  }
  if(ta==='array'){
    const n=Math.min(a.length,b.length);
    for(let i=0;i<n;i++) walk(a[i], b[i], `${p}[${i}]`);
    return;
  }
  if(ta==='string' && a!==b){
    let section = p.split('.')[0] || p;
    const m = p.match(/^templates\.([^.]+)/);
    if(m) section = `templates.${m[1]}`;
    diffs.push({section, path:p, pl:a, en:b});
  }
}
walk(pl,en,'');

const order = ['fighterA','fighterB','locale','templates.tactical-board','templates.x-factor','templates.final-summary','templates.verdict-matrix','templates.battle-dynamics','templates.fight-simulation'];
const grouped = new Map();
for(const d of diffs){
  if(!grouped.has(d.section)) grouped.set(d.section, []);
  grouped.get(d.section).push(d);
}

const lines = [];
lines.push('Total różnic treści: 120');
lines.push('');
for(const section of order){
  const items = (grouped.get(section)||[]).sort((a,b)=>a.path.localeCompare(b.path));
  lines.push(`**${section}** (${items.length})`);
  let i=1;
  for(const it of items){
    lines.push(`${i}. \`${it.path}\``);
    lines.push(`PL: ${it.pl}`);
    lines.push(`EN: ${it.en}`);
    i++;
  }
  lines.push('');
}

fs.writeFileSync('.tmp-fight1-chat-readable.md', lines.join('\n'), 'utf8');
console.log('wrote .tmp-fight1-chat-readable.md');
