# VS Graphic Studio - Template Data Requirements

## 1) Core `.txt` import sections (required)
Use sections `1..8` always. Section `9` is optional.
If section `9` is present, it defines which templates are used and in what order.
If section `9` is missing, app uses the default full template order.

Extended authoring sections:
- Sections `10..13` are the recommended extended data layer for richer matchup files.
- Current import logic still reads sections `1..9` as the functional minimum, so adding `10..13` is backward-safe.
- For the curated fight library, sections `10..13` should be included whenever source material supports them.

Filename side rule (priority):
- File name should be in matchup format, e.g. `Superman vs King Hyperion.txt`.
- Left side of file name (`Superman`) is forced as `Fighter A` (left / blue).
- Right side of file name (`King Hyperion`) is forced as `Fighter B` (right / red).
- If section data is reversed but names match opposite order, app auto-swaps A/B data.

1. `Character A Name` / `Nazwa Postaci A`
2. `Character A Stats` / `Staty Postaci A`
3. `Character A Feats` / `Featy Postaci A`
4. `Defeated by Character A` / `Pokonani przez Postać A`
5. `Character B Name` / `Nazwa Postaci B`
6. `Character B Stats` / `Staty Postaci B`
7. `Character B Feats` / `Featy Postaci B`
8. `Defeated by Character B` / `Pokonani przez Postać B`
9. `Template Order` / `Kolejność templatek` (optional)
10. `Character A Powers / Tools / Weaknesses` / `Moce / Narzędzia / Słabości Postaci A` (recommended)
11. `Character A Raw Feats` / `Surowe Featy Postaci A` (recommended)
12. `Character B Powers / Tools / Weaknesses` / `Moce / Narzędzia / Słabości Postaci B` (recommended)
13. `Character B Raw Feats` / `Surowe Featy Postaci B` (recommended)

## 2) Portrait inputs
Upload 2 images in UI:
- `Portrait A (left)`
- `Portrait B (right)`

Fixed corner mapping (always):
- `Character 1` (left side in file name) = `Fighter A` = `left` = `blue`
- `Character 2` (right side in file name) = `Fighter B` = `right` = `red`

## 3) Template IDs for section 9
Available IDs (pick only what fits the current fight):
- `tactical-board`
- `character-card-a`
- `character-card-b`
- `hud-bars`
- `radar-brief`
- `winner-cv`
- `summary`
- `battle-dynamics`
- `x-factor`
- `interpretation`
- `fight-simulation`
- `stat-trap`
- `verdict-matrix`
- `blank-template`
- `fight-title`
- `methodology`

Section 9 rules:
- Order is not fixed globally; order should be optimized per matchup.
- You can list any subset of IDs above (for some fights `x-factor` may be unnecessary).
- The order listed in section `9` is the render order used by the app.
- If section `9` is omitted, the app falls back to default full order.
- Final template is always `fight-title` (forced as the last screen by the app).
- `fight-title` is a mandatory outro screen with matchup name in character-themed colors.
- The app keeps this last screen even if `fight-title` is missing from section `9`.

Recommended sequencing pattern (reference, not mandatory):
Use this as a baseline for classic power-scaling matchups, then adapt per fight.

Part A: Intro and analytical framing
1. `tactical-board`
2. `character-card-a`
3. `character-card-b`
4. `hud-bars`
5. `radar-brief`
6. `interpretation`
7. `stat-trap`
8. `x-factor`
9. `winner-cv`
10. `summary`

Part B: Fight simulation and conditional verdict
11. `battle-dynamics`
12. `fight-simulation`
13. `verdict-matrix`

Adaptation notes:
- Remove any template that adds no value in a given matchup.
- If no meaningful joker-card exists, skip `x-factor`.
- If fight simulation is simple, keep only `fight-simulation` and skip extra narrative fillers.
- Keep in mind that `fight-title` is always appended as the final template.

## 4) Template block syntax
```txt
Template Character A:
- header: CHARACTER DOSSIER // BLUE
- world: New 52
```

Rules:
- Block must start with `Template <name>:`
- Inside block, use bullet lines: `- key: value`
- You can use any accepted alias key listed below
- Keys are normalized, so accents/case/spaces are tolerant

Copywriting rule:
- Prefer human, natural wording over technical meta-language.
- Write labels as if they were shown directly to a viewer, not as internal analyst jargon.
- Avoid phrases like `base model`, `scenario filters`, `weighted synthesis`, or other wording that sounds like internal methodology unless the panel is explicitly methodological.
- If a subtitle or micro-label adds no real viewer value, leave it empty instead of forcing filler copy.
- Do not add redundant UI words like `ARCHIVE`, `SNAPSHOT`, `MATCHUP`, `RULE-SETS` unless they communicate something the viewer actually needs.
- Prefer clear viewer-facing wording like:
- `STAT-BASED FAVORITE` instead of `BASE MODEL FAVORITE`
- `Two-profile stat readout` instead of `Two-profile readout with scenario filters`
- `Who wins the fight on paper?` instead of `Why stats and verdict can diverge`
- `Why better stats do not guarantee victory` instead of `Why better averages do not guarantee all conditions`
- `Estimated stats and conditional verdict logic` instead of `Weighted synthesis and conditional verdict logic`

Section-writing rule:
- Sections `3` and `7` are short profile summaries only.
- Keep them compact and viewer-facing:
- `Style`
- `Advantage`
- `Mentality`
- Do not dump long raw feat lists into sections `3` and `7`.
- Put concrete scale showings, destruction feats, survival feats, timeline feats, realm feats, and similar hard evidence into sections `11` and `13`.
- Put matchup-relevant kits, special tools, resistances, counters, dependencies, and weaknesses into sections `10` and `12`.
- In sections `10` and `12`, prefer bullets prefixed with `Tools:` or `Weaknesses:`.
- In sections `11` and `13`, use direct feat bullets only; avoid commentary if a clean feat statement is possible.

## 5) Field map (all fillable fields)

### Character A
Accepted block names: `Character A`, `Character Card A`, `Card A`, `Postać A`, `Karta Postaci A`
- `header | title | headline`
- `world | swiat | version`
- `style`
- `atut | advantage`
- `mentalnosc | mentality`
- `quote | cytat`

### Character B
Accepted block names: `Character B`, `Character Card B`, `Card B`, `Postać B`, `Karta Postaci B`
- `header | title | headline`
- `world | swiat | version`
- `style`
- `atut | advantage`
- `mentalnosc | mentality`
- `quote | cytat`

### Tactical Board
Accepted block names: `Tactical Board`, `Methodology`, `Tablica Taktyczna`, `Metodologia`
- `headline | header | title`
- `subtitle | purpose | note`
- `left_header | categories_header`
- `right_header | reality_header`
- `linear_label`
- `chaos_label`
- `lane | line_1 | line1`

### HUD Bars
Accepted block names: `HUD Bars`, `Paski HUD`
- `headline | header | title`
- `subtitle | purpose | note`
- `threat_level`
- `integrity | data_integrity`
- `profile_mode`
- `scale`

Recommended subtitle style:
- Use simple viewer-facing phrasing.
- Recommended: `Two-profile stat readout`
- Polish equivalent: `Odczyt statystyk dwóch profili`

### Radar Brief
Accepted block names: `Radar Brief`, `Parameter Comparison`, `Raport Radarowy`, `Porównanie Parametrów`
- `headline | header | title`
- `subtitle | purpose | note`
- `left_header`
- `right_header`
- `draw_header`
- `favorite_label | favorite`
- `draw_favorite | draw_favorite_label | favorite_draw`

Baseline favorite rule:
- Use a draw threshold of `< 1.0` average-point difference.
- If `|avgA - avgB| < 1.0`, baseline is a draw (not side A or side B).
- In draw state, keep the stamp in the middle and use draw labeling.
- `favorite_label` is used only for non-draw states; use `draw_favorite` for draw states.
- Prefer viewer-facing label text.
- Recommended non-draw label: `STAT-BASED FAVORITE`
- Polish equivalent: `FAWORYT WEDŁUG STATYSTYK`

### Winner CV
Accepted block names: `Winner CV`, `CV Zwycięzców`
- `headline | header | title`
- `subtitle | purpose | note`
- `archive_label`
- `avg_label`
- `left_title`
- `right_title`
- `win_badge`

Winner CV curation rules:
- Keep entries unique (no duplicates in one side list).
- Do not mix umbrella + member duplicates in the same list.
- Example: avoid `Celestials (multiple)` together with `Arishem` in one list.
- Prefer simple, human naming for this screen.
- Recommended headline: `Victory Archive`
- Polish equivalent: `Archiwum zwycięstw`
- If `subtitle` adds nothing useful, leave it empty.
- If `archive_label` only repeats the same idea as headline, leave it empty.

### Summary
Accepted block names: `Summary`, `Podsumowanie`
- `headline | header | title`
- `subtitle | purpose | note`
- `winner | verdict`
- `line_1 | line1`
- `line_2 | line2`
- `line_3 | line3`

Summary copy rule:
- Do not force filler subtitles like `One matchup, four rule-sets` if they do not improve clarity.
- If subtitle adds no value, leave it empty.
- Keep `winner | verdict` short, natural, and viewer-facing.
- Recommended example for close fights: `Statistical draw, conditional verdict`
- Polish equivalent: `Statystyczny remis, werdykt warunkowy`

### Battle Dynamics
Accepted block names: `Battle Dynamics`, `Dynamika Starcia`
- `headline | header | title`
- `subtitle | purpose | note`
- `a_curve | curve_a | blue_curve | left_curve`
- `b_curve | curve_b | red_curve | right_curve`
- `yellow_wave | wave | chaos_wave`
- `phase_1 | phase1`
- `phase_2 | phase2`
- `phase_3 | phase3`
- `analysis | note | line_4 | line4`

Curve format:
- comma/space separated values
- domain can be `0..100` or `0..1`

Example:
```txt
Template Dynamika Starcia:
- a_curve: 78,64,50,32,20
- b_curve: 35,35,35,35,35
- yellow_wave: 34,36,33,35,34,36,33,35
- phase_1: Superman narzuca tempo szybkością.
- phase_2: Hyperion ignoruje obrażenia i skraca dystans.
- phase_3: Hyperion zyskuje przewagę kondycyjną.
- analysis: Superman wygrywa sprint. Hyperion wygrywa maraton.
```

### X-Factor
Accepted block names: `X-Factor`, `XFactor`
- `headline | header | title`
- `subtitle | note`
- `factor | headline`
- `a_value | super_value | superman | left_value`
- `a_bonus | super_bonus | left_bonus`
- `a_bonus_label | left_bonus_label`
- `b_value | hyper_value | hyperion | right_value`
- `b_bonus | hyper_bonus | right_bonus`
- `regen | regen_label`
- `mechanika | mechanics`
- `implikacja | implication`
- `psychologia | psychology`

X-Factor interpretation (recommended model):
- `a_value` and `b_value` are the common baseline for joker-card comparison; use equal start (recommended `50/50`) when fighters are near overall parity.
- `a_bonus` and `b_bonus` should represent only the extra impact of each fighter's unique joker-card trait under selected rules.
- Use different base values only when you intentionally model a non-joker asymmetry.
- X-Factor is optional and matchup-specific, not universal.
- Do not frame X-Factor as something that always explains the winner.
- Use X-Factor only when a special mechanic materially changes odds or fight flow.
- If no such mechanic exists, skip X-Factor entirely.

### Interpretation
Accepted block names: `Interpretation`, `Interpretacja`
- `headline | header | title`
- `subtitle | purpose | note`
- `line_1 | line1 | thesis`
- `line_2 | line2 | antithesis`
- `line_3 | line3 | conclusion`
- `quote | line_4 | line4`

Interpretation rule:
- If average gap is `< 1.0`, frame this block as a draw analysis.
- In draw analysis, explain why conditions/mechanics decide more than linear stat deltas.
- If gap is `>= 1.0`, you can present a baseline side favorite.
- Prefer subtitle phrasing that sounds like a direct question to the viewer.
- Recommended subtitle: `Who wins the fight on paper?`
- Polish equivalent: `Kto wygrywa walkę na papierze?`

### Fight Simulation
Accepted block names: `Fight Simulation`, `Symulacja Walki`
- `headline | header | title`
- `subtitle | purpose | note`
- `opening`
- `mid_fight | midfight`
- `late_fight | latefight`
- `end_condition | endcondition`
- `phase_mode | phasemode | mode | simulation_mode | simulationmode`
- `phase_animation | phaseanimation | animation | scenario | preset | simulation_animation | simulationanimation`
- `phase_actor | phaseactor | actor | lead | aggressor | attacker`

Per-phase keys use `<N>` where `N` = `1`, `2`, `3`:
- `phase_<N>_mode | phase<N>mode | phase_<N>_type | phase<N>type`
- `phase_<N>_animation | phase<N>animation | phase_<N>_scenario | phase<N>scenario | phase_<N>_preset | phase<N>preset`
- `phase_<N>_actor | phase<N>actor | phase_<N>_lead | phase<N>lead | phase_<N>_aggressor | phase<N>aggressor | phase_<N>_attacker | phase<N>attacker`
- `phase_<N>_title | phase<N>title | phase_<N>_headline | phase<N>headline`
- `phase_<N>_a_label | phase<N>alabel | phase_<N>_left_label | phase<N>leftlabel`
- `phase_<N>_b_label | phase<N>blabel | phase_<N>_right_label | phase<N>rightlabel`
- `phase_<N>_a_value | phase<N>avalue | phase_<N>_left_value | phase<N>leftvalue`
- `phase_<N>_b_value | phase<N>bvalue | phase_<N>_right_value | phase<N>rightvalue`
- `phase_<N>_event | phase<N>event | phase_<N>_turn | phase<N>turn | phase_<N>_pivot | phase<N>pivot`
- `phase_<N>_branch_a | phase<N>brancha | phase_<N>_option_a | phase<N>optiona | phase_<N>_left_option | phase<N>leftoption`
- `phase_<N>_branch_b | phase<N>branchb | phase_<N>_option_b | phase<N>optionb | phase_<N>_right_option | phase<N>rightoption`

Lead/attacker values (global or per-phase):
- `a` / `1` / `left` / `blue` (fighter A attacks, fighter B defends)
- `b` / `2` / `right` / `red` (fighter B attacks, fighter A defends)

Animation IDs:
- `orbit-harass`
- `hit-and-run`
- `rush-ko`
- `clash-lock`
- `kite-zone`
- `teleport-burst`
- `feint-counter`
- `grapple-pin`
- `corner-trap`
- `regen-attrition`
- `berserk-overextend`
- `trade-chaos`

Extended aliases from `new.md`:
- The app supports cinematic phase names from `new.md` (90 names from groups `1.1` to `10.5`).
- Use clean phase names (recommended), for example: `Sonic Boom Blitz`.
- Full copied rows are also accepted (with extra text after `:` or tab separators); parser extracts phase title automatically.
- Each recognized phase now runs the base engine with extra motion modifiers matching its described behavior (not just plain name aliasing).
- Actor behavior still follows `phase_actor` / `phase_<N>_actor` (`a`/`b`).

Animation attacker direction:
- Global default for all phases: `phase_actor`
- Per-phase override: `phase_<N>_actor`
- If `phase_<N>_actor` is present, it overrides the global value
- Mapping reminder:
- `Character A` (section 1) = `Actor 1` (lead) = `a`
- `Character B` (section 5) = `Actor 2` (other side) = `b`
- To avoid ambiguity, prefer `a` / `b` values in import files.

Animation selection rule:
- Pick phase animations that match declared style and initiative owner.
- Do not use high-mobility harassment presets (for example `orbit-harass`) unless the acting fighter is actually represented as speed-harass archetype in the writeup.
- If phase text says one fighter controls pace, set `phase_<N>_actor` to that fighter.

Example:
```txt
Template Fight Simulation:
- phase_animation: orbit-harass
- phase_actor: a
- phase_1_actor: a
- phase_2_actor: b
- phase_3_actor: b
```

Animation behavior reference:

`orbit-harass`
- What happens: fast circular harassment around a central target with short in-out strike windows.
- Actor 1 (lead): orbits and repeatedly dashes in for quick touches.
- Actor 2 (other side): stays near center and absorbs pressure.

`hit-and-run`
- What happens: repeated approach-hit-disengage loops.
- Actor 1 (lead): rushes in, lands a burst, then retreats to safer distance.
- Actor 2 (other side): shifts position and attempts to track/reset spacing.

`rush-ko`
- What happens: direct linear blitz into high-impact contact.
- Actor 1 (lead): commits to full-speed rush aiming for immediate finish.
- Actor 2 (other side): gets pushed back/recoils after impact.

`clash-lock`
- What happens: both sides collide, then remain in prolonged lock/strain.
- Actor 1 (lead): drives first entry, then grinds in close clash.
- Actor 2 (other side): meets the clash and holds the lock.

`kite-zone`
- What happens: moving range-control pattern with chase pressure.
- Actor 1 (lead): kites, changes lanes, keeps distance.
- Actor 2 (other side): chases and tries to close before reset.

`teleport-burst`
- What happens: jump pattern between nodes with sudden strike insertions.
- Actor 1 (lead): blinks between positions and bursts into target windows.
- Actor 2 (other side): anchors near strike zone and reacts to teleports.

`feint-counter`
- What happens: fake entry, positional bait, then counter-exchange.
- Actor 1 (lead): initiates feint sequence and re-engages on timing.
- Actor 2 (other side): bites/repositions and counters in transition.

`grapple-pin`
- What happens: entry -> clinch/pin -> drag/finish attempt.
- Actor 1 (lead): closes distance and pins target in tight control phase.
- Actor 2 (other side): resists during pin, then gets displaced.

`corner-trap`
- What happens: pressure funneling target into corner and repeated corner hits.
- Actor 1 (lead): cuts angles and traps in corner orbit.
- Actor 2 (other side): compressed into corner with limited escape motion.

`regen-attrition`
- What happens: repeated strikes into visibly recovering defender.
- Actor 1 (lead): keeps cycling offense over time.
- Actor 2 (other side): regenerates between hits and survives attrition.

`berserk-overextend`
- What happens: wild surge, overcommit, positional punish/reversal window.
- Actor 1 (lead): overextends during aggressive sequence.
- Actor 2 (other side): capitalizes on overextension and turns position.

`trade-chaos`
- What happens: unstable cross-traffic exchange with frequent collision spikes.
- Actor 1 (lead): enters chaotic trades with erratic movement arcs.
- Actor 2 (other side): responds in mirrored chaos; neither side keeps stable line.

### Stat Trap
Accepted block names: `Stat Trap`, `Pułapka Statystyk`
- `headline | header | title`
- `subtitle | purpose | note`
- `trap_top | top | line_1`
- `trap_bottom | bottom | line_2`
- `example | line_3`
- `question | line_4 | trap`

Recommended subtitle style:
- Explain the trap in plain language.
- Recommended: `Why better stats do not guarantee victory`
- Polish equivalent: `Dlaczego lepsze statystyki nie gwarantują wygranej`

### Verdict Matrix
Accepted block names: `Verdict Matrix`, `Matryca Werdyktu`
- `headline | header | title`
- `subtitle | purpose | note`
- `col_left | solar_flare_yes | solarflare_yes`
- `col_right | solar_flare_no | solarflare_no`
- `row_top | standard | standard_ko`
- `row_bottom | deathmatch | kill_only`
- `case_1 | case1`
- `case_2 | case2`
- `case_3 | case3`
- `case_4 | case4`

Verdict Matrix modeling rule:
- Cases may be non-equiprobable (weighted), not necessarily 50/50.
- If weighting is used, describe it explicitly in `Template Summary` (`line_2` and/or `line_3`).
- Avoid framing any single condition as automatic hard-counter unless the writeup explicitly supports guaranteed uptime.

### Blank Template
Accepted block names: `Blank Template`, `New Template`, `Nowy Template`
- `headline | header | title`
- `subtitle | purpose | note`
- `line_1 | line1`
- `line_2 | line2`
- `line_3 | line3`

### Fight Title Outro
Accepted block names: `Fight Title`, `Final Title`, `Ending Title`, `Napis Koncowy`
- `fight_title | match_title | title_text | line_1 | line1`
- `subtitle | purpose | note | line_2 | line2` (optional)
- `top_color_a | top_primary | fighter_a_color_a | fighter_a_primary` (optional, hex `#RRGGBB` or `#RGB`)
- `top_color_b | top_secondary | fighter_a_color_b | fighter_a_secondary` (optional, hex `#RRGGBB` or `#RGB`)
- `bottom_color_a | bottom_primary | fighter_b_color_a | fighter_b_primary` (optional, hex `#RRGGBB` or `#RGB`)
- `bottom_color_b | bottom_secondary | fighter_b_color_b | fighter_b_secondary` (optional, hex `#RRGGBB` or `#RGB`)
- `top_dark | fighter_a_dark` (optional boolean: `true/false`, `yes/no`, `on/off`, `1/0`)
- `bottom_dark | fighter_b_dark` (optional boolean: `true/false`, `yes/no`, `on/off`, `1/0`)

Color behavior:
- This screen is always the final template.
- The displayed text is split into 3 lines: `Character A`, `vs`, `Character B`.
- Character-themed colors are applied to letters (alternating per character line).
- If color keys are provided in `.txt`, they override built-in palettes.
- If color keys are missing, app uses built-in palette mapping by character name.
- Built-in palettes include:
- Superman: `#f11712` + `#0099f7`
- King Hyperion: `#08090c` + `#b91c1c`
- Knull: `#08090c` + `#b91c1c`
- Odin: `#f5c542` + `#38bdf8`
- Unknown names fall back to side defaults (A: Superman palette, B: Hyperion palette).

### Methodology
Accepted block names: `Methodology`, `Metodologia`
- `headline | header | title`
- `subtitle | purpose | note`
- `list_label`
- `reality_label`
- `linear_label`
- `chaos_label`
- `closing_label`

Recommended subtitle style:
- If this panel appears in viewer-facing output, keep wording simple and concrete.
- Recommended: `Estimated stats and conditional verdict logic`
- Polish equivalent: `Szacowane statystyki i logika werdyktu warunkowego`
