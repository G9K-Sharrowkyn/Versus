# VS Graphic Studio Architecture

Ten plik opisuje, jak jest zlozona aplikacja po refaktorze i gdzie szukac konkretnych rzeczy.

## Co robi aplikacja

Aplikacja sluzy do budowania i odtwarzania ekranow "versus" na podstawie:

- pliku `.txt` z opisem walki,
- dwoch portretow zawodnikow,
- zapisanych walk lokalnych,
- walk zeskanowanych z folderu / API.

UI ma 4 glowne tryby:

1. `search` - fullscreen z iframe wyszukiwarki.
2. `home` - panel importu i biblioteka walk.
3. `fight-intro` - fullscreen intro oparte o `aaa.html`.
4. `fight` - glowny podglad i sekwencja template'ow.

## Jak uruchomic

```bash
npm install
npm run dev
```

Najwazniejsze skrypty:

- `npm run dev` - lokalny dev server Vite.
- `npm run build` - TypeScript build + Vite build.
- `npm run lint` - ESLint.
- `npm run i18n:audit` - kontrola kodowania tekstow.
- `npm run i18n:keys` - kontrola kluczy i18n.

`prebuild` automatycznie odpala `i18n:audit` i `i18n:keys`.

## Mapa projektu

### Root

- `src/App.tsx`
  Glowny kontener aplikacji. Po ostatnim refaktorze jest cienkim kontenerem, ktory skleja hooki, domene i widoki.
- `aaa.html`
  Wrapper dla intro fight flow.
- `APP_ARCHITECTURE.md`
  Ten plik.

### `src/features/vs`

- `types.ts`
  Glowne typy domenowe: fighterzy, walki, template'y, stany widokow.
- `presets.ts`
  Presety template'ow, motywow, ramek i wartosci startowych.
- `helpers.ts`
  Male funkcje pomocnicze: normalizacja, parsowanie nazw, style obrazow, handoff dla morphingu.
- `importer.ts`
  Parsowanie `.txt` i budowanie payloadu importu.
- `storage.ts`
  IndexedDB/local persistence, merge walk z folderu, migracje legacy storage.

### `src/features/vs/components`

- `HomeView.tsx`
  Ekran `home`: kompozycja sekcji importu i biblioteki walk.
- `components/home/*`
  Atomowe sekcje `home`: header, panel draft importu, panel biblioteki i karta walki.
- `FightPreviewStage.tsx`
  Shell podgladu fight view: toolbar + skalowany preview frame.
- `TemplateRenderer.tsx`
  Przelacznik layout/template -> konkretny komponent preview.
- `PortraitEditorModal.tsx`
  Modal do korekty kadrowania portretow.
- `SearchMorphOverlay.tsx`
  Overlay morphingu miedzy search i intro/search.
- `AdjustableTemplateImage.tsx`
  Edycja pozycji/zoomu obrazow w template'ach.
- `FightScenarioCanvas.tsx`
  Canvas dla niektorych scen fight.
- `LightningCanvas.tsx`
  Canvas efektow piorunow.

### `src/features/vs/hooks`

- `useAnimatedCursor.ts`
  Efekt kursora i relay pozycji kursora z iframe'ow.
- `usePreviewScale.ts`
  Skalowanie preview do dostepnej przestrzeni.
- `useVsDraftImport.ts`
  Caly flow draft importu, drag/drop i edytora portretow.
- `useVsPersistence.ts`
  Restore, persistence i live refresh walk.
- `useVsTransitions.ts`
  Przejscia `search -> intro -> fight -> search` oraz bridge `postMessage`.
- `useScopedCycleIndex.ts`
  Lokalny helper do cyklicznych par slajdow bez efektow resetujacych.

### `src/features/vs/domain`

- `fightState.ts`
  Mapowanie `FightRecord -> runtime state` pod template'y.
- `fightFactory.ts`
  Tworzenie rekordow walk manualnych z draftu importu.
- `fightLibrary.ts`
  Selektory biblioteki i grupowanie walk folderowych.

### `src/features/vs/templates`

- `statTemplates.tsx`
  Template'y statystyczne.
- `cardTemplates.tsx`
  Template'y kart i winner CV.
- `contentTemplates.tsx`
  Cienki barrel eksportujacy template'y content-heavy.
- `templates/content/*`
  Osobne implementacje `PowersToolsTemplate`, `RawFeatsTemplate` i dispatcher `BlankTemplate`.
- `templates/content/blank/*`
  Warianty `BlankTemplate` rozbite per ekran (`fight-title`, `summary`, `battle-dynamics`, `x-factor`, `interpretation`, `fight-simulation`, `stat-trap`, `verdict-matrix`).

### Inne katalogi

- `src/i18n`
  Slowniki i typy tlumaczen.
- `public/assets`
  Statyczne assety graficzne.
- `public/standalone`
  CSS/JS dla `aaa.html`.

## Jak plynie stan

`App.tsx` sklada glowny stan runtime z hookow i domeny:

- aktywna walka,
- aktywny template i kolejnosc template'ow,
- dane fighterow,
- dane importu draft,
- stan przejsc `search -> intro -> fight -> search`,
- lokalne preferencje wariantow i persistence.

Przeplyw w skrocie:

1. Uzytkownik laduje `.txt` i dwa portrety na `home`.
2. `importer.ts` buduje `ParsedVsImport`.
3. `useVsDraftImport.ts` tworzy rekord draftu albo `useVsPersistence.ts` odtwarza zapisane walki.
4. `fightState.ts` sklada runtime state pod template'y.
5. `TemplateRenderer.tsx` wybiera konkretny widok z `templates/`.
6. `FightPreviewStage.tsx` renderuje preview i toolbar.
7. `storage.ts` zapisuje walki i odczytuje dane z IndexedDB / legacy storage.

## Gdzie co zmieniac

### Chcesz zmienic wyglad ekranu home

Edytuj:

- `src/features/vs/components/HomeView.tsx`
- `src/features/vs/components/home/*`

### Chcesz zmienic shell preview / toolbar

Edytuj:

- `src/features/vs/components/FightPreviewStage.tsx`

### Chcesz dodac albo podmienic template

Edytuj:

- `src/features/vs/presets.ts` - definicja template'u i preset.
- `src/features/vs/components/TemplateRenderer.tsx` - routing do komponentu.
- odpowiedni plik w `src/features/vs/templates/`.
- dla `BlankTemplate` najczesciej odpowiedni plik w `src/features/vs/templates/content/blank/`.

### Chcesz zmienic import `.txt`

Edytuj:

- `src/features/vs/importer.ts`
- ewentualnie podmoduly w `src/features/vs/templates/content/` gdy template korzysta z dodatkowych pol blokowych.

### Chcesz zmienic storage lub skan folderu

Edytuj:

- `src/features/vs/storage.ts`
- `src/features/vs/hooks/useVsPersistence.ts`

### Chcesz zmienic intro / standalone animacje

Edytuj:

- `aaa.html`
- `public/standalone/aaa.css`
- `public/standalone/aaa.js`

## Persistence

Aplikacja korzysta z dwoch warstw persistence:

- aktualny storage oparty o IndexedDB,
- fallback / migracje ze starych kluczy `localStorage`.

Najwazniejsze rzeczy:

- lista walk jest zapisywana lokalnie,
- aktywna walka tez jest zapamietywana,
- preferowany wariant jezykowy dla danego matchup jest trzymany osobno.

## Co dalej warto jeszcze rozbic

Najbardziej sensowne kolejne kroki:

1. wyniesc efekty persistence z `App.tsx` do osobnego hooka,
2. wyniesc logike przejsc search/intro/fight do osobnego hooka,
3. rozbic `aaa.html` / `public/standalone/aaa.*` na mniejsze moduly,
4. rozwazyc code-splitting dla ciezszych template'ow i canvasow.
