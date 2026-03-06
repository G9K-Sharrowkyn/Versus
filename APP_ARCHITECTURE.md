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
  Glowny kontener aplikacji. Nadal trzyma stan i logike przeplywu, ale render duzych sekcji jest juz wyniesiony.
- `aaa.html`
  Wrapper dla intro fight flow.
- `bbb.html`
  Dodatkowy standalone wrapper. W obecnym repo wyglada na nieuzywany.
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
  Ekran `home`: import `.txt`, upload portretow, biblioteka walk.
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

### `src/features/vs/templates`

- `statTemplates.tsx`
  Template'y statystyczne.
- `cardTemplates.tsx`
  Template'y kart i winner CV.
- `contentTemplates.tsx`
  Template'y content-heavy. To nadal najwiekszy modul i glowny kandydat do dalszego dzielenia.

### Inne katalogi

- `src/i18n`
  Slowniki i typy tlumaczen.
- `public/assets`
  Statyczne assety graficzne.
- `public/standalone`
  CSS/JS dla `aaa.html` i `bbb.html`.

## Jak plynie stan

`App.tsx` nadal trzyma glowny stan runtime:

- aktywna walka,
- aktywny template i kolejnosc template'ow,
- dane fighterow,
- dane importu draft,
- stan przejsc `search -> intro -> fight -> search`,
- lokalne preferencje wariantow i persistence.

Przeplyw w skrocie:

1. Uzytkownik laduje `.txt` i dwa portrety na `home`.
2. `importer.ts` buduje `ParsedVsImport`.
3. Po utworzeniu lub otwarciu walki `App.tsx` sklada stan domenowy pod template'y.
4. `TemplateRenderer.tsx` wybiera konkretny widok z `templates/`.
5. `FightPreviewStage.tsx` renderuje preview i toolbar.
6. `storage.ts` zapisuje walki i odczytuje dane z IndexedDB / legacy storage.

## Gdzie co zmieniac

### Chcesz zmienic wyglad ekranu home

Edytuj:

- `src/features/vs/components/HomeView.tsx`

### Chcesz zmienic shell preview / toolbar

Edytuj:

- `src/features/vs/components/FightPreviewStage.tsx`

### Chcesz dodac albo podmienic template

Edytuj:

- `src/features/vs/presets.ts` - definicja template'u i preset.
- `src/features/vs/components/TemplateRenderer.tsx` - routing do komponentu.
- odpowiedni plik w `src/features/vs/templates/`.

### Chcesz zmienic import `.txt`

Edytuj:

- `src/features/vs/importer.ts`

### Chcesz zmienic storage lub skan folderu

Edytuj:

- `src/features/vs/storage.ts`

### Chcesz zmienic intro / standalone animacje

Edytuj:

- `aaa.html`
- `bbb.html`
- `public/standalone/aaa.css`
- `public/standalone/aaa.js`
- `public/standalone/bbb.css`
- `public/standalone/bbb.js`

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
3. pociac `contentTemplates.tsx` na mniejsze moduly per template,
4. rozwazyc code-splitting dla ciezszych template'ow i canvasow.
