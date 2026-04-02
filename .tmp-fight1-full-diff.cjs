const fs = require('fs');
const path = require('path');

const plPath = path.join('Fights','1 Superman vs King Hyperion','1 Superman vs King Hyperion PL.json');
const enPath = path.join('Fights','1 Superman vs King Hyperion','1 Superman vs King Hyperion EN.json');

const pl = JSON.parse(fs.readFileSync(plPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const out = [];

function typeOf(v){ if(Array.isArray(v)) return 'array'; if(v===null) return 'null'; return typeof v; }
function walk(a,b,p){
  const ta = typeOf(a), tb = typeOf(b);
  if (ta !== tb) { out.push({path:p, kind:'type', ta, tb, pl:a, en:b}); return; }
  if (ta === 'object'){
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of [...keys].sort()){
      const np = p ? `${p}.${k}` : k;
      if (!(k in a)) { out.push({path:np, kind:'missing-pl'}); continue; }
      if (!(k in b)) { out.push({path:np, kind:'missing-en'}); continue; }
      walk(a[k], b[k], np);
    }
    return;
  }
  if (ta === 'array'){
    if (a.length !== b.length) out.push({path:p, kind:'array-len', plLen:a.length, enLen:b.length});
    const n = Math.min(a.length,b.length);
    for(let i=0;i<n;i++) walk(a[i], b[i], `${p}[${i}]`);
    return;
  }
  if (ta === 'string'){
    if (a !== b){
      const aLen = a.length;
      const bLen = b.length;
      const ratio = aLen === 0 ? (bLen === 0 ? 1 : 999) : bLen / aLen;
      const numsA = (a.match(/\d+(?:[.,]\d+)?%?/g) || []).join('|');
      const numsB = (b.match(/\d+(?:[.,]\d+)?%?/g) || []).join('|');
      out.push({path:p, kind:'string', aLen, bLen, ratio: Number(ratio.toFixed(2)), numsA, numsB, numsDiff: numsA!==numsB, pl:a, en:b});
    }
    return;
  }
  if (a !== b) out.push({path:p, kind:'value', pl:a, en:b});
}

walk(pl,en,'');

const strings = out.filter(x=>x.kind==='string');
const numericMismatches = strings.filter(x=>x.numsDiff);
const topRatio = [...strings].sort((x,y)=>Math.abs(y.ratio-1)-Math.abs(x.ratio-1)).slice(0,60);

const report = {
  totals: {
    allDiffs: out.length,
    strings: strings.length,
    numericMismatches: numericMismatches.length,
  },
  nonStringDiffs: out.filter(x=>x.kind!=='string'),
  numericMismatches,
  topRatio,
};

fs.writeFileSync('.tmp-fight1-full-diff.json', JSON.stringify(report, null, 2));
console.log(`wrote .tmp-fight1-full-diff.json; strings=${strings.length}; numeric=${numericMismatches.length}; nonString=${report.nonStringDiffs.length}`);
