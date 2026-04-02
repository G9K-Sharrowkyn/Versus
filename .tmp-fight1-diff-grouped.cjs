const fs = require('fs');
const path = require('path');
const pl = JSON.parse(fs.readFileSync(path.join('Fights','1 Superman vs King Hyperion','1 Superman vs King Hyperion PL.json'),'utf8'));
const en = JSON.parse(fs.readFileSync(path.join('Fights','1 Superman vs King Hyperion','1 Superman vs King Hyperion EN.json'),'utf8'));
const diffs = [];
function t(v){ if(Array.isArray(v)) return 'array'; if(v===null) return 'null'; return typeof v; }
function walk(a,b,p){
  const ta=t(a), tb=t(b);
  if(ta!==tb){diffs.push({path:p, kind:'type'}); return;}
  if(ta==='object'){
    const all = new Set([...Object.keys(a),...Object.keys(b)]);
    for(const k of [...all].sort()){
      const np = p? `${p}.${k}`:k;
      if(!(k in a)){diffs.push({path:np,kind:'missing-pl'}); continue;}
      if(!(k in b)){diffs.push({path:np,kind:'missing-en'}); continue;}
      walk(a[k],b[k],np);
    }
    return;
  }
  if(ta==='array'){
    if(a.length!==b.length) diffs.push({path:p,kind:'array-len'});
    const n=Math.min(a.length,b.length);
    for(let i=0;i<n;i++) walk(a[i],b[i],`${p}[${i}]`);
    return;
  }
  if(a!==b){
    if(ta==='string'){
      const al=a.length, bl=b.length;
      const ratio = al===0?999:bl/al;
      diffs.push({path:p, kind:'string', ratio:Number(ratio.toFixed(2)), pl:a, en:b});
    } else {
      diffs.push({path:p, kind:'value', pl:a, en:b});
    }
  }
}
walk(pl,en,'');
const grouped = new Map();
for(const d of diffs){
  const m=d.path.match(/^templates\.([^.]+)/);
  const section = m ? `templates.${m[1]}` : (d.path.split('.')[0] || d.path);
  if(!grouped.has(section)) grouped.set(section, []);
  grouped.get(section).push(d);
}
const out=[];
for(const [section,items] of [...grouped.entries()].sort((a,b)=>a[0].localeCompare(b[0]))){
  out.push({section,count:items.length,paths:items.map(i=>i.path).sort()});
}
fs.writeFileSync('.tmp-fight1-diff-grouped.json', JSON.stringify({total:diffs.length, grouped:out}, null, 2));
console.log(`total=${diffs.length}; sections=${out.length}`);
