import fs from 'fs';
import path from 'path';

const filePath = 'F:/Teksty/Programming/YT/iVerifyYT/Spartakus/Spartakus PL.md';
const baseDir = 'F:/Teksty/Programming/YT/iVerifyYT/Spartakus';

function sanitize(name) {
  // Usuwamy znaki niedozwolone w systemie Windows i skracamy dla bezpieczeństwa
  return name.replace(/[\\/:*?"<>|]/g, '').replace(/\.$/, '').trim();
}

try {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Rozdzielamy tekst na rozdziały używając nagłówka "# [Numer]."
  // Używamy lookahead, aby zachować nagłówek w treści rozdziału
  const chapters = content.split(/\n(?=#\s\d+\.)/);

  let createdCount = 0;

  for (const chapter of chapters) {
    const lines = chapter.trim().split('\n');
    const firstLine = lines[0];

    // Sprawdzamy czy linia zaczyna się od "# [Numer]."
    if (/^#\s\d+\./.test(firstLine)) {
      const fullTitle = firstLine.replace('# ', '').trim();
      const folderName = sanitize(fullTitle);
      
      if (!folderName) continue;

      const chapterDirPath = path.join(baseDir, folderName);

      // 1. Tworzymy folder o nazwie rozdziału
      if (!fs.existsSync(chapterDirPath)) {
        fs.mkdirSync(chapterDirPath, { recursive: true });
      }

      // 2. Tworzymy plik .md o nazwie rozdziału
      const fileName = `${folderName}.md`;
      const finalContent = chapter.trim();
      
      fs.writeFileSync(path.join(chapterDirPath, fileName), finalContent);
      
      createdCount++;
    }
  }

  console.log(`Operacja zakończona sukcesem!`);
  console.log(`Przetworzono rozdziałów: ${createdCount}`);
} catch (err) {
  console.error('Błąd krytyczny:', err.message);
}
