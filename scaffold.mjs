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
  'src/features/vs/templates/content',
  'src/features/vs/templates/stat',
  'src/features/vs/templates/card'
];

const getSource = (componentName, dir) => {
  const originalNames = [componentName, dir === 'final-summary' ? 'SummaryTemplate' : null].filter(Boolean);
  for (const origName of originalNames) {
    for (const src of sourceDirs) {
      const p = path.join(src, `${origName}.tsx`);
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, 'utf-8');
      }
    }
  }
  return null;
}

for (const dir of dirs) {
  const componentName = `${toPascalCase(dir)}Template`;
  const v2Dir = `src/features/vs/templates/v2/${dir}`;
  if (!fs.existsSync(v2Dir)) fs.mkdirSync(v2Dir, { recursive: true });
  
  fs.writeFileSync(path.join(v2Dir, `${componentName}.scss`), baseScss);

  const oldCode = getSource(componentName, dir);
  if (!oldCode) {
    console.warn(`Original not found for ${componentName}`);
    continue;
  }

  // Extract old imports
  let oldImports = oldCode.substring(0, oldCode.indexOf('export function'));
  oldImports = oldImports.replace(/from '(\.\.\/)+/g, match => match + '../');
  oldImports = oldImports.replace(/import '(\.\.\/)+/g, match => match + '../');

  // Extract old body
  const bodyMatch = oldCode.match(/export function [^{]+\{([\s\S]*?)\n\s*return \(/);
  let oldBody = bodyMatch ? bodyMatch[1] : '';

  // Extract old JSX body (everything inside vs-tpl-body or similar)
  let oldJsx = '';
  const jsxMatch = oldCode.match(/return \([\s\S]*?(<div[^>]*vs-tpl-body[^>]*>[\s\S]*?<\/div>)\s*<\/div>\s*\)\s*\}/);
  if (jsxMatch) {
    oldJsx = jsxMatch[1];
  } else {
    const fallback = oldCode.match(/return \([\s\S]*?(<div[^>]*vs-[a-z0-9-]+-body[^>]*>[\s\S]*?<\/div>)\s*<\/div>\s*\)\s*\}/);
    if (fallback) oldJsx = fallback[1];
    else {
      // Just take everything inside return (...)
      const retMatch = oldCode.match(/return \(([\s\S]*?)\)/);
      if (retMatch) oldJsx = retMatch[1];
    }
  }

  // Create new component
  let newTsx = baseTsx.replace("import './TacticalBoardTemplate.scss'", `import './${componentName}.scss'`);
  newTsx = newTsx.replace(/TacticalBoardTemplateProps/g, `${componentName}Props`);
  newTsx = newTsx.replace(/export function TacticalBoardTemplate/g, `export function ${componentName}`);

  // Replace stats panel
  newTsx = newTsx.replace(/<section className="vs-tactical-board25-stats">[\s\S]*?<\/section>/, `<section className="vs-tactical-board25-stats">\n        {/* INJECTED STATS */}\n        ${oldJsx}\n      </section>`);
  
  // Replace reality panel
  newTsx = newTsx.replace(/<div className="vs-tactical-board25-reality-viewport">[\s\S]*?<\/div>/, `<div className="vs-tactical-board25-reality-viewport">\n          {/* INJECTED REALITY */}\n        </div>`);

  // Merge logic inside component
  newTsx = newTsx.replace(/\n\s*return \(/, `\n\n  // --- OLD LOGIC ---\n  ${oldBody}\n\n  return (`);

  // Combine imports
  let finalCode = `// --- OLD IMPORTS ---\n${oldImports}\n// --- BASE IMPORTS ---\n${newTsx}`;

  fs.writeFileSync(path.join(v2Dir, `${componentName}.tsx`), finalCode);
}
console.log("Scaffolding complete.");
