# VS Graphic Studio - JSON Fight Data

## Folder Layout

Każda walka ma folder w [Fights](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/Fights):

```text
Templates/
  tactical-board/
    Template EN.json
    Template PL.json

Fights/
  1 Superman vs King Hyperion/
    1 Superman vs King Hyperion EN.json
    1 Superman vs King Hyperion PL.json
    1 Superman vs King Hyperion Scans.json
    img/
```

## Locale File Schema

`EN.json` i `PL.json` używają schematu `FightLocaleJsonV1`.

```json
{
  "schemaVersion": 1,
  "locale": "en",
  "fighterA": {
    "name": "Superman",
    "version": "New 52",
    "stats": {
      "strength": 96,
      "speed": 96,
      "durability": 95,
      "battleIq": 92,
      "hax": 80,
      "stamina": 94,
      "style": 89,
      "experience": 90,
      "skills": 91
    },
    "dossier": {
      "style": "",
      "advantage": "",
      "mentality": "",
      "quote": ""
    },
    "victories": [],
    "profile": {
      "powers": [],
      "tools": [],
      "weaknesses": []
    },
    "crucialFeats": []
  },
  "fighterB": {
    "name": "King Hyperion",
    "version": "Earth-4023",
    "stats": {},
    "dossier": {
      "style": "",
      "advantage": "",
      "mentality": "",
      "quote": ""
    },
    "victories": [],
    "profile": {
      "powers": [],
      "tools": [],
      "weaknesses": []
    },
    "crucialFeats": []
  },
  "templateOrder": [
    "tactical-board",
    "character-dossier-a",
    "character-dossier-b",
    "fight-card"
  ],
  "templates": {}
}
```

## Shared Scans Schema

`Scans.json` używa schematu `FightScansJsonV1`.

```json
{
  "schemaVersion": 1,
  "portraits": {
    "a": "1.webp",
    "b": "2.jpg"
  },
  "templates": {
    "fight-analytics": {
      "profileMode": "VS"
    },
    "crucial-feats": {
      "leftImages": [],
      "rightImages": []
    },
    "victory-archive": {
      "leftImages": [],
      "rightImages": []
    }
  }
}
```

## Canonical Template IDs

Do `templateOrder` używaj tylko tych ID:

- `tactical-board`
- `character-dossier-a`
- `character-dossier-b`
- `character-profile`
- `crucial-feats`
- `fight-analytics`
- `parameter-comparison`
- `victory-archive`
- `final-summary`
- `battle-dynamics`
- `x-factor`
- `interpretation`
- `fight-simulation`
- `stat-trap`
- `direct-verdict`
- `verdict-matrix`
- `fight-card`
- `methodology`

Zasady:

- `fight-card` zawsze ląduje na końcu.
- Dla walk jednostronnych preferuj `direct-verdict` zamiast `verdict-matrix`.
- `templates` może zawierać tylko override’y potrzebne dla konkretnej walki.
- Stałe nagłówki, podtytuły, etykiety i copy viewerowe są w [Templates](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/Templates), po jednym folderze na template i dwóch locale JSON na każdy template.
- [fightManifest.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/fightManifest.ts) przechowuje tylko techniczny kontrakt template’ów: `TemplateId`, aliasy, pola zmienne i scaffold.
- [templateCopy.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/templates/shared/templateCopy.ts) tylko ładuje bibliotekę `Templates/`; nie jest już ręcznie wpisanym źródłem copy.
- Dane template’ów nie przechowują stałych prefiksów sekcji ani layoutowych obejść; to należy do template’u.
- `stat-trap.question` przechowuje samo pytanie, bez prefiksu `Kluczowe pytanie:` / `Key question:`.
- `stat-trap.trap_top` używa wzoru `A >`, a `trap_bottom` domyka drugą stronę tezy.
- `x-factor.factor` używa wzoru `A VS B`, żeby viewer mógł zawsze rozdzielić oba człony kolorystycznie.

## Source of Truth

- Stałe template’ów i fight-viewera: [Templates](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/Templates)
- Runtime loader biblioteki template’ów: [templateCopy.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/templates/shared/templateCopy.ts)
- Wygenerowany indeks biblioteki template’ów: [templateLibrary.generated.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/templates/shared/templateLibrary.generated.ts)
- Techniczny manifest template’ów: [fightManifest.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/fightManifest.ts)
- Typy JSON: [types.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/types.ts)
- Parser JSON runtime: [importer.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/src/features/vs/importer.ts)
- Skan folderów i zapis scaffoldów: [vite.config.ts](/f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/vite.config.ts)
