# React + TypeScript + Vite

## Fights Auto-Import (Folder Scan)

App supports two import modes:

1. Manual Add in the `Add` panel (TXT + portraits upload).
2. Auto-import from local `Fights` directory on page reload.

Auto-import path:

`VS/App/vs-graphic-studio/Fights`

Fallback path (also supported):

`VS/Fights`

Expected structure:

```txt
Fights/
  1. Superman vs King Hyperion/
    Superman vs King Hyperion.txt
    Superman vs King Hyperion PL.txt
    1.jpg   (or .jpeg/.png/.webp/.avif)
    2.jpg   (or .jpeg/.png/.webp/.avif)
  2. Knull vs Odin/
    Knull vs Odin.txt
    Knull vs Odin PL.txt
    1.png
    2.png
```

Rules:

- Multiple `.txt` files per folder are supported.
- Language variants are detected by filename suffix:
  - `... PL.txt` -> Polish variant
  - `... EN.txt` -> English variant
  - no suffix -> auto (defaults to English when paired with `PL` file)
- Folder variants are grouped by matchup in `Folder Fights` (for example EN + PL pair in one framed group).
- Portrait A must be `1.*`, portrait B must be `2.*`.
- If `1.*` / `2.*` are missing but there are at least 2 image files, app falls back to the first two images (alphabetical).
- Folder fights are rebuilt from disk on refresh and shown in `Folder Fights`.
- Manual fights stay in `Manual Fights`.
- Portrait framing (`x/y/scale`) can be edited for both folder and manual fights and is persisted in local storage/IndexedDB.
- Preferred matchup variant selection (EN/PL) is persisted. Search uses the selected variant for the matchup.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
