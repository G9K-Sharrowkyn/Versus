const fs=require('fs');
const path=require('path');
const pl=JSON.parse(fs.readFileSync(path.join('Fights','1 Superman vs King Hyperion','1 Superman vs King Hyperion PL.json'),'utf8'));
const en=JSON.parse(fs.readFileSync(path.join('Fights','1 Superman vs King Hyperion','1 Superman vs King Hyperion EN.json'),'utf8'));

const pairs=[];
function t(v){if(Array.isArray(v))return 'array';if(v===null)return 'null';return typeof v}
function walk(a,b,p){
 const ta=t(a),tb=t(b); if(ta!==tb)return;
 if(ta==='object'){const keys=[...new Set([...Object.keys(a),...Object.keys(b)])].sort(); for(const k of keys){if(!(k in a)||!(k in b))continue; walk(a[k],b[k],p?`${p}.${k}`:k)}; return;}
 if(ta==='array'){const n=Math.min(a.length,b.length); for(let i=0;i<n;i++)walk(a[i],b[i],`${p}[${i}]`); return;}
 if(ta==='string' && a!==b) pairs.push({path:p,pl:a,en:b});
}
walk(pl,en,'');

const templates=pairs.filter(x=>x.path.startsWith('templates.'));

// find repeated EN text across different keys with different PL texts
const byEn=new Map();
for(const p of templates){
 const key=p.en.trim();
 if(!byEn.has(key)) byEn.set(key,[]);
 byEn.get(key).push(p);
}
const repeats=[];
for(const [enText,items] of byEn.entries()){
 if(items.length>1){
  const uniquePl=[...new Set(items.map(i=>i.pl.trim()))];
  if(uniquePl.length>1){
    repeats.push({en:enText, items:items.map(i=>({path:i.path,pl:i.pl}))});
  }
 }
}

console.log(JSON.stringify({repeatCount:repeats.length,repeats},null,2));
