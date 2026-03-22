import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dir = path.join(__dirname, 'src', 'features', 'vs', 'templates', 'v2');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Remove duplicate import { useEffect } from 'react' at the very top
  content = content.replace(/^import \{ useEffect \} from 'react';?\r?\n/, '');

  // 2. Find the glitch text
  const glitchRegex = /  return \(\) => clearInterval\(timer\)\r?\n  }, \[text\]\)\r?\n  return <>{display}<\/>\r?\n}\r?\n\r?\nexport function (\w+?Template)\(\{[\s\S]*?(?=  const headerTextStr)/;
  
  const match = content.match(glitchRegex);
  if (match) {
    const templateName = match[1];
    const kebabName = templateName.replace(/Template$/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    
    const replacement = `  const realityHeader =
    pickTemplateField(blockFields, ['right_header', 'reality_header']) ||
    getFightTemplateDefaultField('${kebabName}', 'right_header', language)

`;
    content = content.replace(match[0], replacement);
    
    // Replace the props type
    const propsRegex = /(\s*)\}: TemplatePreviewProps\) \{/;
    if (propsRegex.test(content)) {
      content = content.replace(propsRegex, `,\n  integratedToolbar,\n}: ${templateName}Props) {`);
    } else {
        // Just look for `):` and insert integratedToolbar if not present
        // Actually, just changing `TemplatePreviewProps` is probably enough since it was the original signature
        // But what if it's already BattleDynamicsTemplateProps?
    }
  }

  // 3. Remove tiles array
  const tilesRegex = /  const tiles = \[\r?\n\s*\.\.\.rows\.slice\(0, 9\),[\s\S]*?\]\r?\n/;
  content = content.replace(tilesRegex, '');

  fs.writeFileSync(filePath, content, 'utf8');
}

function processDir(directory) {
  fs.readdirSync(directory).forEach(item => {
    const fullPath = path.join(directory, item);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  });
}

processDir(dir);
