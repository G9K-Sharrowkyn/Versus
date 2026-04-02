const fs = require('fs');
const path = require('path');
const fights = [1,2,3,4,5,6,7,8];
const root = 'Fights';
const polishWords = [' i ',' oraz ',' walka',' zwyci',' przewag',' moc',' szybko',' wytrzyma',' analiza',' scenariusz',' zasady',' koniec',' start',' cios',' bohater',' przeciwnik'];
const englishWords = [' the ',' and ',' fight',' victory',' advantage',' power',' speed',' durability',' analysis',' scenario',' rules',' ending',' opening',' strike',' hero',' opponent'];

function readJson(p){
  return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
}

function walk(a,b,prefix,out){
  if(typeof a !== typeof b){
    out.types.push(`${prefix}: type ${typeof a} vs ${typeof b}`);
    return;
  }
  if(Array.isArray(a)){
    if(a.length !== b.length) out.lengths.push(`${prefix}: ${a.length} vs ${b.length}`);
    const n = Math.min(a.length, b.length);
    for(let i=0;i<n;i++) walk(a[i], b[i], `${prefix}[${i}]`, out);
    return;
  }
  if(a && typeof a === 'object'){
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    for(const k of ka) if(!(k in b)) out.missing.push(`${prefix}.${k} missing in EN`);
    for(const k of kb) if(!(k in a)) out.missing.push(`${prefix}.${k} missing in PL`);
    for(const k of ka) if(k in b) walk(a[k], b[k], `${prefix}.${k}`, out);
    return;
  }
  if(typeof a === 'string' && typeof b === 'string'){
    const p = a.toLowerCase();
    const e = b.toLowerCase();

    if(a === '-' && b && b !== '-') out.placeholders.push(`${prefix}: PL '-' vs EN text`);
    if(b === '-' && a && a !== '-') out.placeholders.push(`${prefix}: EN '-' vs PL text`);

    if(/[ąćęłńóśźż]/i.test(b)) out.lang.push(`${prefix}: EN has PL diacritics`);

    if(/[A-Za-z]/.test(a)){
      let score = 0;
      for(const w of englishWords){ if((` ${p} `).includes(w)) score++; }
      if(score >= 2 && !/[ąćęłńóśźż]/i.test(a)) out.lang.push(`${prefix}: PL maybe EN text`);
    }

    if(/[A-Za-z]/.test(b)){
      let score = 0;
      for(const w of polishWords){ if((` ${e} `).includes(w)) score++; }
      if(score >= 2) out.lang.push(`${prefix}: EN maybe PL text`);
    }

    if(a === b && a.length > 20 && /\s/.test(a) && !/^[A-Z0-9 .:()\-]+$/.test(a)){
      out.identical.push(`${prefix}: identical long text`);
    }

    if(a.length > 0 && b.length > 0){
      const ratio = Math.min(a.length, b.length) / Math.max(a.length, b.length);
      if(ratio < 0.3) out.ratio.push(`${prefix}: length ratio ${ratio.toFixed(2)}`);
    }
  }
}

for(const n of fights){
  const dir = fs.readdirSync(root).find(d => d.startsWith(String(n) + ' '));
  if(!dir){
    console.log(`Missing dir ${n}`);
    continue;
  }

  const full = path.join(root, dir);
  const base = `${n} ${dir.slice(2)}`;
  const pl = path.join(full, `${base} PL.json`);
  const en = path.join(full, `${base} EN.json`);

  const a = readJson(pl);
  const b = readJson(en);

  const out = { missing: [], types: [], lengths: [], placeholders: [], lang: [], identical: [], ratio: [] };
  walk(a, b, '$', out);

  console.log(`\nFight ${n} ${dir}`);
  for(const k of ['missing','types','lengths','placeholders','lang','identical','ratio']){
    if(out[k].length){
      console.log(` ${k}:`);
      out[k].slice(0, 120).forEach(v => console.log(`  - ${v}`));
      if(out[k].length > 120) console.log(`  ... +${out[k].length - 120}`);
    }
  }
  if(Object.values(out).every(v => v.length === 0)){
    console.log('  OK: no structural/lang red flags');
  }
}
