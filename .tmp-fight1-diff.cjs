const fs = require('fs');
const path = require('path');

const plPath = path.join('Fights','1 Superman vs King Hyperion','1 Superman vs King Hyperion PL.json');
const enPath = path.join('Fights','1 Superman vs King Hyperion','1 Superman vs King Hyperion EN.json');

const pl = JSON.parse(fs.readFileSync(plPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const diffs = [];
const onlyInPl = [];
const onlyInEn = [];

function typeOf(v){
  if (Array.isArray(v)) return 'array';
  if (v === null) return 'null';
  return typeof v;
}

function walk(a,b,p){
  const ta = typeOf(a);
  const tb = typeOf(b);
  if (ta !== tb){
    diffs.push({path:p, kind:'type-mismatch', plType:ta, enType:tb, pl:a, en:b});
    return;
  }

  if (ta === 'object'){
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    const all = new Set([...aKeys, ...bKeys]);
    for (const k of [...all].sort()){
      const np = p ? `${p}.${k}` : k;
      if (!(k in b)) { onlyInPl.push(np); continue; }
      if (!(k in a)) { onlyInEn.push(np); continue; }
      walk(a[k], b[k], np);
    }
    return;
  }

  if (ta === 'array'){
    if (a.length !== b.length){
      diffs.push({path:p, kind:'array-length', plLen:a.length, enLen:b.length});
    }
    const len = Math.min(a.length,b.length);
    for (let i=0;i<len;i++) walk(a[i],b[i],`${p}[${i}]`);
    return;
  }

  if (ta === 'number' || ta === 'boolean' || ta === 'null'){
    if (a !== b) diffs.push({path:p, kind:'value-mismatch', pl:a, en:b});
    return;
  }

  if (ta === 'string'){
    if (a === b) return;
    // Keep string differences only for fields likely requiring semantic parity.
    const np = p.toLowerCase();
    const parityFields = [
      '.label', '.winner', '.winner_short', '.winner_long', '.winner_label',
      '.a_share', '.b_share', '.draw_share', '.a_curve', '.b_curve',
      '.scenario_1_title', '.scenario_2_title', '.scenario_3_title',
      '.scenario_1_result', '.scenario_2_result', '.scenario_3_result',
      '.scenario_1_probability', '.scenario_2_probability', '.scenario_3_probability'
    ];
    const keyName = p.split('.').pop() || '';
    const likelyControl = keyName.startsWith('line_') || keyName.startsWith('reason_') || keyName.startsWith('scenario_') || keyName.startsWith('header');
    const hasParity = parityFields.some(s => np.endsWith(s));

    // numeric fingerprint for strings
    const numsA = (a.match(/\d+(?:[.,]\d+)?/g) || []).join('|');
    const numsB = (b.match(/\d+(?:[.,]\d+)?/g) || []).join('|');
    const pctA = (a.match(/\d+\s?%/g) || []).join('|');
    const pctB = (b.match(/\d+\s?%/g) || []).join('|');
    const numsDiffer = numsA !== numsB || pctA !== pctB;

    if (hasParity || likelyControl || numsDiffer){
      diffs.push({path:p, kind:'string-diff', pl:a, en:b, numsA, numsB, pctA, pctB, numsDiffer, hasParity, likelyControl});
    }
  }
}

walk(pl,en,'');

const nonString = diffs.filter(d => d.kind !== 'string-diff');
const stringDiffs = diffs.filter(d => d.kind === 'string-diff');

const byPrefix = {};
for (const d of stringDiffs){
  const m = d.path.match(/^templates\.([^.]+)/);
  const prefix = m ? `templates.${m[1]}` : d.path.split('.').slice(0,2).join('.') || d.path;
  byPrefix[prefix] = (byPrefix[prefix] || 0) + 1;
}

const output = {
  summary: {
    onlyInPl: onlyInPl.length,
    onlyInEn: onlyInEn.length,
    nonStringDiffs: nonString.length,
    stringDiffCandidates: stringDiffs.length,
  },
  onlyInPl,
  onlyInEn,
  nonStringDiffs: nonString,
  stringDiffCountBySection: Object.entries(byPrefix).sort((a,b)=>b[1]-a[1]),
  stringDiffCandidates: stringDiffs,
};

console.log(JSON.stringify(output, null, 2));
