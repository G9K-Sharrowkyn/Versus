const fs = require('fs');
const path = require('path');
const root = path.join('src','features','vs','templates','content');
const dirs = fs.readdirSync(root, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'blank')
  .map(d => d.name)
  .sort();

const polishWords = [' i ',' oraz ',' walka',' zwyci',' przewag',' moc',' szybko',' wytrzyma',' analiza',' scenariusz',' zasady',' koniec',' start',' cios',' bohater',' przeciwnik','postaci','wprowadzenie','symulacja'];
const englishWords = [' the ',' and ',' fight',' victory',' advantage',' power',' speed',' durability',' analysis',' scenario',' rules',' ending',' opening',' strike',' hero',' opponent','character','introduction','simulation'];

function readJson(p){
  return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
}

function walk(a,b,prefix,out){
  if(typeof a !== typeof b){ out.types.push(`${prefix}: type ${typeof a} vs ${typeof b}`); return; }
  if(Array.isArray(a)){
    if(a.length !== b.length) out.lengths.push(`${prefix}: ${a.length} vs ${b.length}`);
    const n = Math.min(a.length, b.length);
    for(let i=0;i<n;i++) walk(a[i], b[i], `${prefix}[${i}]`, out);
    return;
  }
  if(a && typeof a === 'object'){
    const ka = Object.keys(a), kb = Object.keys(b);
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

    if(a === b && a.length > 25 && /\s/.test(a) && !/^[A-Z0-9 .:()\-]+$/.test(a)) out.identical.push(`${prefix}: identical long text`);
  }
}

let totalIssues = 0;
for(const dir of dirs){
  const plPath = path.join(root, dir, 'Template PL.json');
  const enPath = path.join(root, dir, 'Template EN.json');

  console.log(`\nTemplate ${dir}`);
  if(!fs.existsSync(plPath) || !fs.existsSync(enPath)){
    totalIssues++;
    console.log(` missing pair: PL=${fs.existsSync(plPath)} EN=${fs.existsSync(enPath)}`);
    continue;
  }

  const pl = readJson(plPath);
  const en = readJson(enPath);

  const out = { missing: [], types: [], lengths: [], placeholders: [], lang: [], identical: [] };
  walk(pl,en,'$',out);

  const keys = ['missing','types','lengths','placeholders','lang','identical'];
  let clean = true;
  for(const k of keys){
    if(out[k].length){
      clean = false;
      totalIssues += out[k].length;
      console.log(` ${k}:`);
      out[k].slice(0, 80).forEach(v => console.log(`  - ${v}`));
      if(out[k].length > 80) console.log(`  ... +${out[k].length - 80}`);
    }
  }
  if(clean) console.log(' OK: no structural/lang red flags');
}

console.log(`\nTotal flagged items: ${totalIssues}`);
