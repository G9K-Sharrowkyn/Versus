const fs = require('fs');
const path = require('path');
const root = path.join('src','features','vs','templates','content');
const dirs = fs.readdirSync(root, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'blank')
  .map(d => d.name)
  .sort();

const polishWords = [' i ',' oraz ',' walka',' zwyci',' przewag',' moc',' szybko',' wytrzyma',' analiza',' scenariusz',' zasady',' koniec',' start',' cios',' bohater',' przeciwnik','postaci','wprowadzenie','symulacja','werdykt','podsumowanie','taktyka'];
const englishWords = [' the ',' and ',' fight',' victory',' advantage',' power',' speed',' durability',' analysis',' scenario',' rules',' ending',' opening',' strike',' hero',' opponent','character','introduction','simulation','verdict','summary','tactical'];

const skipPath = (p) => {
  const u = p.toUpperCase();
  return (
    u.includes('.LAYOUT.') ||
    u.includes('_CLASS') ||
    u.includes('_IMAGE') ||
    u.includes('_ICON') ||
    u.includes('_URL') ||
    u.includes('_SRC') ||
    u.includes('_PATH') ||
    u.includes('_ASSET') ||
    u.includes('_TOKEN') ||
    u.includes('.TOKENS.') ||
    u.includes('.ID') ||
    u.includes('.KEY') ||
    u.endsWith('.LOCALE') ||
    u.endsWith('.SCHEMAVERSION')
  );
};

function readJson(p){ return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '')); }

function walk(a,b,prefix,out){
  if(skipPath(prefix)) return;
  if(typeof a !== typeof b){ out.types.push(`${prefix}: type ${typeof a} vs ${typeof b}`); return; }
  if(Array.isArray(a)){
    if(a.length !== b.length) out.lengths.push(`${prefix}: ${a.length} vs ${b.length}`);
    const n=Math.min(a.length,b.length);
    for(let i=0;i<n;i++) walk(a[i],b[i],`${prefix}[${i}]`,out);
    return;
  }
  if(a && typeof a==='object'){
    const ka=Object.keys(a), kb=Object.keys(b);
    for(const k of ka) if(!(k in b)) out.missing.push(`${prefix}.${k} missing in EN`);
    for(const k of kb) if(!(k in a)) out.missing.push(`${prefix}.${k} missing in PL`);
    for(const k of ka) if(k in b) walk(a[k],b[k],`${prefix}.${k}`,out);
    return;
  }
  if(typeof a==='string' && typeof b==='string'){
    const p=` ${a.toLowerCase()} `;
    const e=` ${b.toLowerCase()} `;

    if(a==='-' && b && b!=='-') out.placeholders.push(`${prefix}: PL '-' vs EN text`);
    if(b==='-' && a && a!=='-') out.placeholders.push(`${prefix}: EN '-' vs PL text`);

    if(/[ąćęłńóśźż]/i.test(b)) out.lang.push(`${prefix}: EN has PL diacritics -> ${b}`);

    let eScore=0;
    for(const w of englishWords) if(p.includes(w)) eScore++;
    if(eScore>=2 && !/[ąćęłńóśźż]/i.test(a)) out.lang.push(`${prefix}: PL maybe EN -> ${a}`);

    let pScore=0;
    for(const w of polishWords) if(e.includes(w)) pScore++;
    if(pScore>=2) out.lang.push(`${prefix}: EN maybe PL -> ${b}`);

    if(a===b && a.length>20 && /\s/.test(a) && !/^[A-Z0-9 .:()\-]+$/.test(a)) out.identical.push(`${prefix}: identical long text -> ${a}`);
  }
}

let total=0;
for(const dir of dirs){
  const plPath=path.join(root,dir,'Template PL.json');
  const enPath=path.join(root,dir,'Template EN.json');
  if(!fs.existsSync(plPath)||!fs.existsSync(enPath)){
    console.log(`Template ${dir}: missing pair`);
    total++;
    continue;
  }
  const pl=readJson(plPath);
  const en=readJson(enPath);
  const out={missing:[],types:[],lengths:[],placeholders:[],lang:[],identical:[]};
  walk(pl,en,'$',out);

  const issues=[...out.missing,...out.types,...out.lengths,...out.placeholders,...out.lang,...out.identical];
  if(issues.length){
    total+=issues.length;
    console.log(`\nTemplate ${dir}`);
    for(const item of issues.slice(0,60)) console.log(` - ${item}`);
    if(issues.length>60) console.log(` - ... +${issues.length-60}`);
  }
}
console.log(`\nTotal copy-level flags: ${total}`);
