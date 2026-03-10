# VS Graphic Studio

## Fight Data

The app now uses a JSON-only fight format. Each fight folder in [Fights](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/Fights) should look like this:

```text
Fights/
  1 Superman vs King Hyperion/
    1 Superman vs King Hyperion EN.json
    1 Superman vs King Hyperion PL.json
    1 Superman vs King Hyperion Scans.json
    img/
```

Rules:

- `EN.json` stores the English locale payload.
- `PL.json` stores the Polish locale payload.
- `Scans.json` stores shared portraits and template images.
- Files are read strictly as UTF-8 JSON through `fs.readFile(..., 'utf8')` and `JSON.parse`.
- There is no legacy text import flow and no alternate encoding fallback.

## Add New Fight

Use the `Add New Fight` panel on the home screen:

1. Enter the matchup name in `Character A vs Character B` format.
2. Choose the templates and reorder them.
3. Confirm creation.

The app will create the next numbered folder with:

- `... EN.json`
- `... PL.json`
- `... Scans.json`
- `img/`

Those JSON files are scaffolded and ready to fill in.

## Folder Scan

Folder fights are scanned from:

- `VS/App/vs-graphic-studio/Fights`

Fallback path:

- `VS/Fights`

Behavior:

- EN/PL variants are grouped into one matchup card.
- Portraits are read from `Scans.json` under `portraits.a` and `portraits.b`.
- Shared template images are read from `Scans.json`.
- Folder fights are rebuilt from disk on refresh and shown in `Folder Fights`.
- Manual fights from storage can still appear in `Manual Fights`.
- Portrait framing is persisted in [Fights/.fight-visuals.json](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/Fights/.fight-visuals.json).

## Dev

```bash
npm install
npm run dev
```

Important scripts:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run i18n:audit`
- `npm run i18n:keys`

`prebuild` runs `i18n:audit` and `i18n:keys`.
