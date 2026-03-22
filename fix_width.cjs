const fs = require('fs');
const path = require('path');

const dir = 'src/features/vs/templates/v2';

function processDir(directory) {
  const items = fs.readdirSync(directory);
  items.forEach(item => {
    const fullPath = path.join(directory, item);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.scss')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const searchIndividualStats = /\.vs-tactical-board25-stats \{\s*\n\s*top: var\(--tb-panel-top\);\s*\n\s*left: var\(--tb-stats-left\);\s*\n\s*width: var\(--tb-stats-width\);\s*\n\s*height: var\(--tb-panel-height\) !important;\s*\n\s*max-height: var\(--tb-panel-height\) !important;\s*\n\s*min-height: var\(--tb-panel-height\) !important;/g;
      
      const replaceIndividualStats = `.vs-tactical-board25-stats {
  top: var(--tb-panel-top);
  left: var(--tb-stats-left);
  width: var(--tb-stats-width) !important;
  min-width: var(--tb-stats-width) !important;
  max-width: var(--tb-stats-width) !important;
  height: var(--tb-panel-height) !important;
  max-height: var(--tb-panel-height) !important;
  min-height: var(--tb-panel-height) !important;`;

      let changed = false;
      if (content.match(searchIndividualStats)) {
         content = content.replace(searchIndividualStats, replaceIndividualStats);
         changed = true;
      }
      
      // I also need to fix the width for the Reality panel to make it totally immutable
      const searchIndividualReality = /\.vs-tactical-board25-reality \{\s*\n\s*left: var\(--tb-reality-left\);\s*\n\s*width: var\(--tb-reality-width\);\s*\n\s*height: var\(--tb-panel-height\) !important;\s*\n\s*max-height: var\(--tb-panel-height\) !important;\s*\n\s*min-height: var\(--tb-panel-height\) !important;/g;
      const replaceIndividualReality = `.vs-tactical-board25-reality {
  left: var(--tb-reality-left);
  width: var(--tb-reality-width) !important;
  min-width: var(--tb-reality-width) !important;
  max-width: var(--tb-reality-width) !important;
  height: var(--tb-panel-height) !important;
  max-height: var(--tb-panel-height) !important;
  min-height: var(--tb-panel-height) !important;`;
      
      if (content.match(searchIndividualReality)) {
         content = content.replace(searchIndividualReality, replaceIndividualReality);
         changed = true;
      }

      if (changed) {
          fs.writeFileSync(fullPath, content);
          console.log('Fixed panel width stretching in: ' + fullPath);
      }
    }
  });
}

processDir(dir);
