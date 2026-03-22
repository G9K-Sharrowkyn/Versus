import fs from 'fs';
import path from 'path';

const dirs = fs.readdirSync('Templates').filter(d => fs.statSync(`Templates/${d}`).isDirectory());
const baseTsx = fs.readFileSync('src/features/vs/templates/stat/TacticalBoardTemplate.tsx', 'utf-8');
const baseScss = fs.readFileSync('src/features/vs/templates/stat/TacticalBoardTemplate.scss', 'utf-8');

function toPascalCase(str) {
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

const sourceDirs = [
  'src/features/vs/templates/content/blank',
  'src/features/vs/templates/stat',
  'src/features/vs/templates/card'
];

for (const dir of dirs) {
  const componentName = `${toPascalCase(dir)}Template`;
  console.log(`Processing ${componentName}...`);
  
  const v2Dir = `src/features/vs/templates/v2/${dir}`;
  if (!fs.existsSync(v2Dir)) fs.mkdirSync(v2Dir, { recursive: true });
  
  // write scss
  fs.writeFileSync(path.join(v2Dir, `${componentName}.scss`), baseScss);
  
  // find original
  let originalCode = null;
  let originalPath = null;
  for (const src of sourceDirs) {
    const p = path.join(src, `${componentName}.tsx`);
    if (fs.existsSync(p)) {
      originalCode = fs.readFileSync(p, 'utf-8');
      originalPath = p;
      break;
    }
  }
  
  if (!originalCode) {
    console.warn(`Could not find original for ${componentName}`);
    continue;
  }
  
  // Fix imports by adding one more `../` because we went from `templates/category` to `templates/v2/dir`
  // Actually from `templates/category/File.tsx` (depth 4)
  // To `templates/v2/dir/File.tsx` (depth 5)
  // so `../../` becomes `../../../`
  let importsPart = originalCode.substring(0, originalCode.indexOf('export function'));
  importsPart = importsPart.replace(/from '(\.\.\/)+/g, match => match + '../');
  importsPart = importsPart.replace(/import '(\.\.\/)+/g, match => match + '../');
  
  // Except we need to remove duplicate imports that baseTsx also has, or just combine them.
  // Instead of a perfect regex, let's just create a shell file and let us patch it later or do our best.
  
  let newTsx = baseTsx;
  
  // replace imports
  // 1. rename import './TacticalBoardTemplate.scss'
  newTsx = newTsx.replace("import './TacticalBoardTemplate.scss'", `import './${componentName}.scss'`);
  
  // 2. rename component
  newTsx = newTsx.replace(/export function TacticalBoardTemplate/g, `export function ${componentName}`);
  newTsx = newTsx.replace(/TacticalBoardTemplateProps/g, `${componentName}Props`);
  
  // Extract body logic from original code
  // Regex from `export function XTemplate({...}) {` to `return (`
  const bodyMatch = originalCode.match(/export function [^{]+\{([\s\S]*?)\n\s*return \(/);
  let originalBody = bodyMatch ? bodyMatch[1] : '';
  
  // Try to extract the returned JSX. Specifically whatever is inside `<div className="vs-tpl-body">` or equivalent
  const jsxMatch = originalCode.match(/return \([\s\S]*?(<div[^>]*vs-tpl-body[^>]*>[\s\S]*?<\/div>)\s*<\/div>\s*\)\s*\}/);
  let originalJsx = jsxMatch ? jsxMatch[1] : '<div>Old JSX here</div>';
  if (!jsxMatch) {
     const fallbackMatch = originalCode.match(/return \([\s\S]*?(<div[^>]*vs-[a-z0-9-]+-body[^>]*>[\s\S]*?<\/div>)\s*<\/div>\s*\)\s*\}/);
     if (fallbackMatch) originalJsx = fallbackMatch[1];
  }

  // Inject into TacticalBoardTemplate body
  // We'll place original logic before the `return (` of the new template
  newTsx = newTsx.replace(/\n\s*return \(/, `\n\n  // --- INJECTED LOGIC ---\n  ${originalBody}\n\n  return (`);
  
  // Inject into panels
  newTsx = newTsx.replace(/<section className="vs-tactical-board25-stats">[\s\S]*?<\/section>/, `<section className="vs-tactical-board25-stats">\n        {/* INJECTED STATS */}\n        ${originalJsx}\n      </section>`);
  
  newTsx = newTsx.replace(/<div className="vs-tactical-board25-reality-viewport">[\s\S]*?<\/div>/, `<div className="vs-tactical-board25-reality-viewport">\n          {/* INJECTED REALITY */}\n        </div>`);
  
  // Add original imports
  newTsx = importsPart + "\n// --- BASE IMPORTS ---\n" + newTsx;
  
  fs.writeFileSync(path.join(v2Dir, `${componentName}.tsx`), newTsx);
  console.log(`Saved ${componentName}.tsx`);
}
