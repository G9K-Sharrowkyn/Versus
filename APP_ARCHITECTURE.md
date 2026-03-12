# VS Graphic Studio Architecture

Ten plik opisuje aktualną architekturę po twardym cutoverze z legacy plików tekstowych do `JSON`.

## Co robi aplikacja

Aplikacja służy do budowania i odtwarzania ekranów `versus` na podstawie:

- `EN.json` / `PL.json` z danymi walki,
- `Scans.json` ze wspólnymi portretami i grafikami template'ów,
- zapisanych walk lokalnych,
- walk zeskanowanych z folderu / API.

UI ma 4 główne tryby:

1. `search`
2. `home`
3. `fight-intro`
4. `fight`

## Najważniejsze pliki

### Root

- [src/App.tsx](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/App.tsx)
  Główny kontener aplikacji.
- [vite.config.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/vite.config.ts)
  Dev API do skanu `Fights/**`, tworzenia folderów walk i zapisu ustawień grafik.
- [APP_ARCHITECTURE.md](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/APP_ARCHITECTURE.md)
  Ten plik.

### `src/features/vs`

- [types.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/types.ts)
  Typy domenowe i JSON schema payloadów walk.
- [fightManifest.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/fightManifest.ts)
  Jedno źródło prawdy dla stałych fight-viewera, template’ów i generatorów scaffoldów JSON.
- [importer.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/importer.ts)
  Parser JSON payloadów walk i helpery dla template’ów.
- [storage.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/storage.ts)
  IndexedDB/local persistence, merge walk z folderu, migracje legacy storage.
- [helpers.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/helpers.ts)
  Normalizacja, style obrazów i pomocnicze utility runtime.

### `src/features/vs/components`

- [HomeView.tsx](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/components/HomeView.tsx)
  Ekran `home`: kreator nowej walki i biblioteka.
- [components/home/DraftImportPanel.tsx](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/components/home/DraftImportPanel.tsx)
  Generator folderu walki i scaffoldów JSON.
- [FightPreviewStage.tsx](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/components/FightPreviewStage.tsx)
  Shell preview z toolbar.
- [TemplateRenderer.tsx](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/components/TemplateRenderer.tsx)
  Routing `TemplateId -> komponent`.
- [PortraitEditorModal.tsx](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/components/PortraitEditorModal.tsx)
  Modal do korekty portretów.

### `src/features/vs/hooks`

- [useVsPersistence.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/hooks/useVsPersistence.ts)
  Restore, persistence i live refresh walk.
- [useVsTransitions.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/hooks/useVsTransitions.ts)
  Przejścia `search -> intro -> fight -> search`.

### `src/features/vs/domain`

- [fightState.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/domain/fightState.ts)
  Mapowanie `FightRecord -> runtime state`.
- [fightLibrary.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/domain/fightLibrary.ts)
  Grupowanie walk folderowych i manualnych.

## Jak płynie stan

1. Użytkownik tworzy nowy folder walki w `home`.
2. `vite.config.ts` zapisuje `EN.json`, `PL.json`, `Scans.json` i `img/`.
3. Skan folderów odczytuje JSON-y przez `fs.readFile(..., 'utf8')` + `JSON.parse`.
4. [importer.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/importer.ts) buduje `ParsedVsImport`.
5. [fightState.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/domain/fightState.ts) składa runtime state pod template’y.
6. [TemplateRenderer.tsx](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/components/TemplateRenderer.tsx) wybiera konkretny widok.
7. [storage.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/storage.ts) zapisuje lokalne rekordy i przywraca preferencje.

## Ważne zasady

- Runtime nie czyta już legacy plików tekstowych.
- Runtime nie używa alternatywnych kodowań, heurystyk dekodowania ani warstw compat dla dawnych plików tekstowych.
- `fightManifest.ts` jest źródłem prawdy dla stałych napisów fight-viewera i template’ów.
- `EN.json` / `PL.json` przechowują dane zmienne walki.
- `Scans.json` przechowuje portrety i wspólne obrazy template’ów.
- Layout template’ów jest stały: rozmiary ramek, spacing, typografia, ikony i prefiksy sekcji nie są przechowywane w danych walki.
- JSON walki nie może zawierać obejść layoutowych ani kopiować stałych etykiet viewer’a; trzyma wyłącznie treść zmienną per matchup.
- `Fights/.fight-visuals.json` jest kanonicznym magazynem korekt portretów i obrazów współdzielonych przez warianty tej samej walki.

## Gdzie co zmieniać

### Chcesz zmienić wygląd home

- [src/features/vs/components/HomeView.tsx](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/components/HomeView.tsx)
- [src/features/vs/components/home](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/components/home)

### Chcesz zmienić schemat danych walki

- [src/features/vs/types.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/types.ts)
- [src/features/vs/fightManifest.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/fightManifest.ts)
- [src/features/vs/importer.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/importer.ts)
- [TEMPLATE_DATA_REQUIREMENTS.md](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/TEMPLATE_DATA_REQUIREMENTS.md)

### Chcesz zmienić skan folderu albo zapis JSON

- [vite.config.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/vite.config.ts)
- [src/features/vs/storage.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/storage.ts)
- [src/features/vs/hooks/useVsPersistence.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/hooks/useVsPersistence.ts)
