# Prompt 2 - Fight Analysis

Create the final fight paper from a finished `character_research.md`. This prompt is for matchup analysis only, not for rebuilding the research dossier.

## 1. Purpose
Write one complete `final.md` using the provided `character_research.md` as the main factual input.
Reuse its locked versions, feats, wins, powers, weaknesses, and stats, then analyze how the fight plays out.

## 2. Must do
- Read and trust `character_research.md` as the primary factual input.
- Keep versions and loadouts exactly as locked in Prompt 1.
- Use Prompt 1 stats, feats, wins, powers, weaknesses, and uncertainty notes.
- Do matchup reasoning, not data re-collection.
- Optionally research matchup-specific battle discussions only for:
  - `8.4` source verdict distribution
  - `9` minority perspective
- Write the full paper in sections `## 0..13` exactly once and in order.
- Use minimal scenario count.
- Use `X/10` for base and conditional verdict odds.

## 3. Must not do
- Do not redo full feat research.
- Do not silently replace Prompt 1 showcase feats or wins.
- Do not add new top feats or wins unless correcting an obvious contradiction in the dossier.
- Do not add exhaustive new evidence dumps.
- Do not change versions or loadouts.
- Do not add extra top-level sections.
- Do not include meta commentary.

## 4. Matchup logic
- Start from the on-paper reading of the Prompt 1 stat table.
- Identify the real swing factors from Prompt 1 powers, weaknesses, and uncertainty notes.
- Decide whether the matchup is:
  - stable
  - one-factor conditional
  - two-factor conditional
- Use only the minimum number of scenarios that materially fit the matchup.
- Stable matchup: `## 11 = N/A`.
- One material factor: `2` scenarios.
- Two independent material factors: `4` scenarios.
- Every scenario must state assumptions, winner, odds, and short reasoning.

## 5. Section rules
### Sections `6` and `7`
- Do not rebuild these sections from scratch.
- Summarize and reuse the curated lists from `character_research.md`.
- Keep the same scan-backed top examples.
- If Prompt 1 includes backup appendix items, they may stay as backup only.

### Section `8.4`
- Tag every source verdict as `explicit` or `derived`.
- You may use battle threads, forum verdicts, and discussion sources here.
- This is the only place where new matchup-specific community verdict material is expected.

### Sections `10` and `11`
- `## 10` must contain the baseline winner, `X/10`, and short rationale.
- `## 11` must contain real scenarios or exact `N/A`.

## 6. Required output structure
Write `final.md` using this exact structure:
- `## 0 Hook`
- `## 1 Introduction and methodology`
- `## 2 Character introduction`
- `## 3 Averaged stats table`
- `## 4 Origin and profile`
- `## 5 Powers and weaknesses`
- `## 6 Feats - quick review`
- `## 7 Top defeated/neutralized opponents`
- `## 8 Hypothetical fight - step by step`
- `## 9 Minority perspective`
- `## 10 Base verdict`
- `## 11 Conditional verdict`
- `## 12 Why stats and verdict can diverge`
- `## 13 Closing`

## 7. Quality checks
- Starts with `## 0 Hook`.
- Uses sections `## 0..13` exactly once.
- No extra top-level sections.
- Section `3` preserves the Prompt 1 stat model in `1-100`.
- Sections `6` and `7` reuse Prompt 1 curated scan-backed lists.
- Section `8.4` uses `explicit` or `derived` tags.
- Section `10` contains the base verdict.
- Section `11` is real scenarios or exact `N/A`.
- Versions and loadouts remain unchanged from Prompt 1.

## 8. Default assumptions
- Language: English.
- Style: analytical writeup.
- Prompt 1 facts are locked unless there is an obvious contradiction.
- Keep scenario count minimal unless the matchup clearly needs more.
- If evidence is weak, use ranges and confidence language instead of fake precision.

## 9. Short wrapper
```text
Use the provided `character_research.md` as the primary factual input.
Keep its versions, loadouts, stats, feats, wins, powers, and weaknesses unchanged.
Write one `final.md` using sections `## 0..13` in exact order.
Do matchup reasoning only; do not redo full feat research.
Reuse sections `6` and `7` from the dossier as curated scan-backed showcase lists.
Use forum or battle-thread material only for `8.4` source verdict distribution and `9` minority perspective.
Use `X/10` for sections `10` and `11`.
Set `## 11 = N/A` if the matchup is stable.
```
