import fs from 'fs';
import path from 'path';

const filePath = 'F:/Teksty/Programming/YT/iVerifyYT/Spartakus/Spartakus PL.md';
const baseDir = 'F:/Teksty/Programming/YT/iVerifyYT/Spartakus';

function sanitize(name) {
  return name.replace(/[\\/:*?"<>|]/g, '').trim();
}

try {
  const content = fs.readFileSync(filePath, 'utf8');
  // Rozdzielamy po nagłówkach drugiego stopnia, zachowując je
  const parts = content.split(/\n(?=##\s\d+)/);

  let chapterCount = 0;

  for (const part of parts) {
    const lines = part.trim().split('\n');
    const firstLine = lines[0];

    // Sprawdzamy czy to nagłówek rozdziału (np. ## 1. Wstęp)
    if (firstLine.startsWith('## ')) {
      const chapterTitle = firstLine.replace('## ', '').trim();
      const folderName = sanitize(chapterTitle);
      const chapterDirPath = path.join(baseDir, folderName);

      // Tworzymy folder
      if (!fs.existsSync(chapterDirPath)) {
        fs.mkdirSync(chapterDirPath, { recursive: true });
      }

      // Tworzymy plik .md wewnątrz folderu
      const fileName = `${folderName}.md`;
      const fileContent = part.trim();
      fs.writeFileSync(path.join(chapterDirPath, fileName), fileContent);
      
      chapterCount++;
    }
  }

  console.log(`Sukces! Stworzono ${chapterCount} folderów i plików.`);
} catch (err) {
  console.error('Błąd podczas przetwarzania:', err);
}
