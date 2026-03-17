import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = 'Fights';
const EXTENSIONS_TO_CONVERT = ['.png', '.webp', '.jpeg', '.JPG', '.PNG', '.WEBP', '.JPEG'];

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

console.log('--- KROK 1: Konwersja obrazów ---');
const imageMappings = new Map(); // Stary path -> Nowy path

walk(ROOT_DIR, (filePath) => {
  const ext = path.extname(filePath);
  if (EXTENSIONS_TO_CONVERT.includes(ext) || (ext === '.jpg' && filePath !== filePath.toLowerCase())) {
    const dir = path.dirname(filePath);
    const name = path.basename(filePath, ext);
    const newPath = path.join(dir, name + '.jpg');

    if (filePath !== newPath) {
      console.log(`Konwertowanie: ${filePath} -> ${newPath}`);
      try {
        // Używamy ffmpeg do konwersji
        execSync(`ffmpeg -i "${filePath}" -y "${newPath}"`, { stdio: 'ignore' });
        imageMappings.set(filePath, newPath);
      } catch (err) {
        console.error(`Błąd konwersji ${filePath}:`, err.message);
      }
    }
  }
});

console.log('\n--- KROK 2: Aktualizacja JSON-ów ---');
walk(ROOT_DIR, (filePath) => {
  if (filePath.endsWith('.json')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Prosta zamiana w tekście rozszerzeń na .jpg dla plików, które konwertowaliśmy
    // Szukamy wzorców typu "nazwa.png", "nazwa.webp" itp.
    EXTENSIONS_TO_CONVERT.forEach(ext => {
      const regex = new RegExp(`(?<=[\\/\\"\\'])([\\w\\s\\-\\.\\(\\)]+)\\${ext}`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, '$1.jpg');
        changed = true;
      }
    });

    if (changed) {
      console.log(`Zaktualizowano JSON: ${filePath}`);
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});

console.log('\n--- KROK 3: Usuwanie starych plików ---');
imageMappings.forEach((newPath, oldPath) => {
  if (fs.existsSync(oldPath) && oldPath !== newPath) {
    fs.unlinkSync(oldPath);
    console.log(`Usunięto: ${oldPath}`);
  }
});

console.log('\nGotowe!');
