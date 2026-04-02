const fs = require('fs');
const report = JSON.parse(fs.readFileSync('.tmp-fight1-full-diff.json','utf8'));
const top = report.topRatio.filter(x=>x.ratio>=1.5);
console.log(JSON.stringify({count: top.length, items: top.map(x=>({path:x.path, ratio:x.ratio, pl:x.pl, en:x.en}))}, null, 2));
