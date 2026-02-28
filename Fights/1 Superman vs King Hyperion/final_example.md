# final_example.md - universal blueprint for writing `final.md`

This file is a decision-complete standard for building a full VS writeup from scratch.
It is designed to work for every matchup type:
- one-sided matchups,
- close matchups,
- rule-sensitive matchups,
- ability-sensitive matchups.

## 1. Document goal
- Build one coherent final VS analysis for 2 characters.
- Merge data from multiple source analyses into one consistent narrative.
- Separate clearly: statistical profile, fight dynamics, and final verdict logic.

## 1.1 MUST vs OPTIONAL output (hard rule)
MUST in every `final.md`:
- Section headers `0..13` are always present.
- Stat table with exactly 9 categories.
- One base verdict under default assumptions.

OPTIONAL in content, not in section presence:
- `## 9` can be `N/A: not applicable for this matchup`.
- `## 11` can be `N/A: outcome stable across tested assumptions`.
- `## 12` can be `N/A: linear and practical verdict are aligned`.

## 1.2 Output contract (strict, machine-checkable)
The generated answer must obey all constraints below.

1. Output starts directly with `## 0. Hook`.
2. Include only section headers `## 0` ... `## 13`, in exact order.
3. Do not add extra top-level sections before, between, or after `0..13`.
4. If section `9`, `11`, or `12` is not applicable, write the required `N/A` sentence under that section.
5. Keep section names aligned with this blueprint (no custom renaming like `I.`, `Phase Alpha`, etc.).
6. Keep subsection structure for section `2`, `6`, `8` (A/B split and step-by-step split).
7. Include section `3` stat table with exactly 9 categories and both overall averages.
8. In section `8.4`, each source verdict must be tagged `explicit` or `derived`.
9. If `derived`, include confidence label (`high`/`medium`/`low`).
10. Output only the final paper content; no meta comments.

## 1.3 Forbidden output patterns
The answer is invalid if any item below appears:
- Freeform essay format that ignores `## 0..13`.
- Roman numeral chaptering (`I.`, `II.`, `III.`) as primary structure.
- Meta commentary like: `I corrected it`, `Here is your updated research`, `Let me know`.
- Reference-only dump without the required stat table and verdict sections.
- Invented citation markers as structure replacements for required sections.

## 1.4 Self-check before returning answer (mandatory)
Before returning the final answer, verify:
- First line is `## 0. Hook`.
- All section headers `## 0..13` exist exactly once.
- No extra top-level section outside `0..13`.
- Section `3` has exactly 9 stat categories.
- Section `10` always has base verdict.
- Section `11` is either valid scenarios or exact `N/A` line.
- Section `8.4` includes `explicit/derived` tags and confidence for derived entries.

If any check fails, regenerate the full answer before sending.

## 2. Required input package

### 2.1 Character A and B identity
- Character name.
- Version/incarnation (for example New 52, Earth-616, game version, anime arc).
- Short combat profile (archetype, style, mentality).

### 2.2 Core stats (0-100, exactly 9 categories)
Each character must have values for:
1. Strength
2. Speed
3. Durability
4. Combat IQ
5. Hax
6. Stamina
7. Fighting Style
8. Experience
9. Combat Skills

### 2.3 Evidence (feats)
- Key power/scaling feats.
- Key durability/regeneration feats.
- Key speed/reaction feats.
- Key offensive and defensive tools.

### 2.3.1 AI estimation pipeline (mandatory)
Use this workflow when sources do not provide ready numeric stats/verdicts.

1. Extract evidence per source:
- defeated opponents,
- notable feats,
- damage survived,
- combat context and limits.
2. Map extracted evidence to the 9 categories.
3. Estimate per-source stats (0-100) for both fighters.
4. Mark confidence for each estimate: `high`, `medium`, `low`.
5. Produce final averaged stats across all sources.

### 2.4 Defeated/neutralized opponents
- Separate list for character A.
- Separate list for character B.
- Remove duplicates, do not remove relevant names.

### 2.5 Match condition logic (intelligent scenario selection)
This logic is mandatory. Creating many scenarios is not mandatory.

Step 0: Lock baseline assumptions first.
- Lock character versions exactly as defined by title/prompt.
- Lock loadouts/forms exactly as defined by title/prompt.
- Do not remove core gear/forms unless prompt explicitly asks for a variant.
- Do not add extra gear/forms not declared in prompt.
- Example: `Knull (Necrosword) vs Odin (Destroyer Armor + Odinsword)` means those loadouts stay fixed in baseline.

Step 1: List candidate outcome-sensitive factors.
- Ruleset type (standard VS vs kill-only).
- Battlefield constraints (ring-out possible/impossible, open space, city, etc.).
- Special mechanics (ultimate mode access, cooldown finishers, regeneration loops, etc.).
- Prep/gear constraints only if prompt explicitly introduces them as a variable.

Step 2: Apply materiality filter.
- Keep only factors that can realistically change winner or significantly move odds.
- Drop factors that do not change result in a meaningful way.

Step 3: Choose minimal scenario set.
- Use 1 scenario if matchup is stable.
- Use 2 scenarios for one material binary factor.
- Use 4 scenarios (2x2) only when two independent material factors both matter.
- Use more than 4 only when each extra scenario has clear analytical value.
- Do not build exhaustive combinations of every candidate factor.

Step 4: Define scenario payload (only for selected scenarios).
Each selected scenario must include:
- exact assumptions,
- favored side,
- score (X/10),
- 1-3 sentence reasoning.

### 2.6 Scenario count decision tree (mandatory)
1. Check if any tested factor materially changes winner or odds.
- If no: run 1 scenario only; `## 11` becomes `N/A`.
- If yes: continue.
2. Count independent material factors.
- One factor: run 2 scenarios.
- Two factors: run 4 scenarios (2x2).
- More than two factors: prioritize top two, add more only if they still materially change outcome.
3. Validate minimality.
- Remove any scenario that does not add a distinct outcome insight.

### 2.7 Scenario templates by matchup type (reference, not mandatory)
- One-sided matchup:
- 1 scenario, base verdict only, `## 11 = N/A`.
- One-factor conditional matchup:
- 2 scenarios, each with assumptions + score + rationale.
- Two-factor conditional matchup:
- 4 scenarios (2x2), only if both factors are materially independent.

## 3. What must be calculated

### 3.1 Category averages
- Arithmetic mean for each of 9 categories across all source analyses.
- Round to whole numbers in the final stat table.

### 3.2 Overall average per fighter
- Mean of all 9 categories for A.
- Mean of all 9 categories for B.
- Provide exact and rounded values.

### 3.3 Source verdict evidence (`explicit_or_derived`)
- For each source verdict, mark type:
- `explicit` (source directly gives a score),
- `derived` (AI estimated from evidence).
- If `derived`, provide a short derivation note.
- If derivation confidence is low, use qualitative label + numeric range (for example: `slight edge A, ~5.5-6/10`).

### 3.4 Base verdict
- One baseline score and winner (for default assumptions).
- Short rationale (1-3 sentences).

### 3.5 Conditional verdict (content only if needed)
- Stable matchup:
- `## 10` contains base verdict.
- `## 11` contains `N/A: outcome stable across tested assumptions`.
- Conditional matchup:
- `## 11` contains only minimal material scenarios (2, 4, or more if justified).
- No forced matrix when not needed.

## 4. Required `final.md` structure
Fixed section contract:
- All section headers `0..13` must exist in every final file.
- Sections `9`, `11`, `12` can be marked `N/A` when not applicable.

### 4.0 Section 0: Hook
- 2-4 opening sentences.
- Frame core conflict (for example raw stats vs non-linear combat reality).

### 4.1 Section 1: Introduction and methodology
- Data origin and synthesis method.
- List of 9 categories.
- Short note that fights are non-linear.

### 4.2 Section 2: Character introduction
#### 4.2.1 Character A
- Profile, style, strongest practical edges.
#### 4.2.2 Character B
- Profile, style, strongest practical edges.

### 4.3 Section 3: Averaged stats table
- 9x2 table.
- Overall averages under table.
- One short on-paper interpretation.

### 4.4 Section 4: Origin and profile
- Psychology and combat philosophy comparison.

### 4.5 Section 5: Powers and weaknesses
- Key tools and vulnerabilities for A.
- Key tools and vulnerabilities for B.
- One paragraph on the highest-impact swing factor.

### 4.6 Section 6: Feats - quick review
#### 4.6.1 Character A
#### 4.6.2 Character B
- Short, concrete feat bullets.

### 4.7 Section 7: Complete defeated/neutralized list
- Full list A.
- Full list B.
- No duplicates.

### 4.8 Section 8: Hypothetical fight - step by step
#### 4.8.1 Opening
- Describe first-contact dynamics in the first exchanges.
- Specify who controls tempo, distance, and initiative at the start.
- Include which tools are expected immediately (for example speed burst, pressure entry, zoning).

#### 4.8.2 Mid-fight
- Explain adaptation after opening.
- Show what grows in importance over time (for example stamina drain, regen loops, tactical reads).
- Identify which side gains in extended exchanges and why.

#### 4.8.3 Turning points
- List 2-4 concrete momentum-flip events.
- For each event: trigger, beneficiary, and impact.
- Include at least one pro-A branch and one pro-B branch in close matchups.

#### 4.8.4 Source verdict evidence distribution
- Provide source-by-source verdict evidence in consistent format.
- Mark each entry `explicit` or `derived`.
- Add one synthesis sentence about spread, consensus, and outlier.
- If only one source exists, state that and skip comparison language.

### 4.9 Section 9: Minority perspective
- If applicable: present strongest credible counter-position.
- If not applicable: `N/A: no materially distinct minority interpretation found`.

### 4.10 Section 10: Base verdict (always)
- Final baseline winner and score.
- Clear rationale.

### 4.11 Section 11: Conditional verdict
- Conditional matchup: include selected scenario set only.
- Stable matchup: `N/A: outcome stable across tested assumptions`.

### 4.12 Section 12: Why stats and final verdict can diverge
- If applicable: explain non-linear effects (regen economy, hard counters, win-condition asymmetry, etc.).
- If not applicable: `N/A: linear profile and practical result align`.

### 4.13 Section 13: Closing
- Final take in 2-4 sentences.
- Mention confidence level and the key condition that could alter outcome.

## 5. Quality rules (acceptance criteria)
- Style is consistent from start to finish.
- Section headers `0..13` are all present.
- Stat table has exactly 9 categories.
- Key evidence from sources is preserved.
- No duplicate entries.
- Verdict matches argumentation.
- No forced matrix: do not add 2x2 if matchup is stable.
- `## 11` has either valid scenario set or explicit `N/A`.
- Every source verdict entry is tagged `explicit` or `derived`.
- Derived estimates include confidence tags.
- Baseline loadout/version assumptions are explicit and consistent throughout.

## 6. Quick author checklist
- [ ] Collected all source data and assumptions.
- [ ] Locked baseline versions/loadouts to prompt.
- [ ] Calculated 9 category averages for both fighters.
- [ ] Calculated overall averages for both fighters.
- [ ] Compiled feats and defeated lists (A/B).
- [ ] Wrote fight flow (opening, mid-fight, turning points).
- [ ] Wrote base verdict.
- [ ] Decided if conditional verdict is needed.
- [ ] If needed, added minimal scenario set with assumptions and scores.
- [ ] If not needed, wrote `N/A` in `## 11`.
- [ ] Tagged each source verdict as `explicit` or `derived`.
- [ ] Added confidence tags for derived stats/verdicts.
- [ ] Confirmed sections `0..13` are present.
- [ ] Checked duplicates, clarity, and narrative consistency.

## 7. Interface/contract changes (documentation-level)
1. `final.md` uses fixed section-header contract `0..13`.
2. Source verdict entries use `explicit_or_derived` tagging.
3. AI estimation from evidence is required before final stat averaging when direct numbers are absent.
4. `## 11` is required as header and contains either scenarios or explicit `N/A`.

## 8. Validation scenarios (test plan)
### Test 1: One-sided matchup
- Input: clearly dominant fighter.
- Expected:
- headers `0..13` present,
- `## 11` is `N/A`,
- no forced matrix.

### Test 2: One-factor conditional matchup
- Input: one factor materially flips odds.
- Expected:
- `## 11` has exactly 2 scenarios,
- each has assumptions + score + reasoning.

### Test 3: Two-factor conditional matchup
- Input: two independent material factors.
- Expected:
- `## 11` has 4 scenarios (2x2),
- no non-material extra branches.

### Test 4: No explicit source scores
- Input: feats/opponents/context only.
- Expected:
- source verdict entries are `derived`,
- confidence tags present,
- low-confidence entries can use qualitative + numeric range.

### Test 5: Locked loadout prompt
- Input: prompt defines exact forms/gear.
- Expected:
- no scenario removes/adds loadout unless explicitly requested.

## 9. Assumptions and defaults to lock
- Default language of `final_example.md`: English.
- Default output style: long-form essay + analytical sections.
- Default scoring scale: `X/10`.
- Low-evidence cases must use confidence labels and ranges instead of fake precision.
- If prompt does not request alternate loadouts/rules, keep baseline locked and scenario set minimal.

## 10. LLM strict wrapper (copy before task prompt)
Use this wrapper when prompting another model:

```txt
HARD FORMAT CONTRACT:
Return only one markdown document that starts with:
## 0. Hook

You must output sections ## 0 through ## 13 in exact order, with no extra top-level sections.
If section 9, 11, or 12 is not applicable, keep the header and write the required N/A line.
Do not use Roman numeral chaptering.
Do not add meta lines like "updated research" or "let me know".
Section 3 must include a 9-category stat table + overall averages for both fighters.
Section 8.4 must tag each source verdict as explicit or derived; every derived verdict must include confidence (high/medium/low).
If any rule is violated, regenerate before final output.
```
