# Phase 13 Report - Deterministic level generator, difficulty system, and generated-level validator

## Phase status

**PHASE:** Phase 13 - Deterministic generator + validator  
**STATUS:** COMPLETE  
**APPROVAL NEEDED BEFORE NEXT PHASE:** Yes

## Objective

Add an on-demand, deterministic level-content pipeline for generated Levels 16-10,000 while preserving immutable curated Levels 1-15. The pipeline includes versioned seeds, wave-based difficulty, template/color/mission selection, conservative feasibility validation, bounded deterministic retries, generated star thresholds, central `getLevel` access, and save/progression compatibility. No Home Dashboard or Phase 14 feature was implemented.

## Source-of-truth documents reviewed

- `docs/Bubble_Shooter_HTML5_Game_Master_Blueprint_v1.0.pdf` - all 23 pages, functional and architectural authority.
- `home-dashboard.png` - approved visual direction only.
- `approved-gameplay-ui.png` - approved visual direction only.
- `docs/implementation/CODEX_RULES.md`.
- `docs/implementation/PHASE_TRACKER.md`.
- `docs/implementation/PROJECT_STATUS.md`.
- `docs/implementation/DECISIONS.md`.
- `docs/implementation/CHANGELOG.md`.
- `docs/implementation/reports/PHASE_00_REPORT.md` through `PHASE_12_REPORT.md`.
- Project-owner Phase 13 implementation instruction.

No blueprint conflict or override was discovered.

## Files created

- `src/game/generation/config.ts`
- `src/game/generation/types.ts`
- `src/game/generation/seed.ts`
- `src/game/generation/difficulty.ts`
- `src/game/generation/validator.ts`
- `src/game/generation/generator.ts`
- `src/game/generation/generator.test.ts`
- `docs/implementation/reports/PHASE_13_REPORT.md`

## Files modified

- `src/game/levels/types.ts`
- `src/game/levels/levelCatalog.ts`
- `src/game/levels/levelCatalog.test.ts`
- `src/game/levels/levelBubbleSource.ts`
- `src/game/levels/LevelSession.ts`
- `src/game/progression/types.ts`
- `src/game/progression/saveValidation.ts`
- `src/game/progression/ProgressionRepository.ts`
- `src/game/progression/progression.test.ts`
- `docs/implementation/PHASE_TRACKER.md`
- `docs/implementation/PROJECT_STATUS.md`
- `docs/implementation/DECISIONS.md`
- `docs/implementation/CHANGELOG.md`

The blueprint PDF, approved image references, curated level layouts, mission registry, scoring formulas, and save schema version remained authoritative and were not replaced.

## Supported range and central access

`src/game/generation/config.ts` centralizes the current supported range (1-10,000), generated start (16), generator/config versions, shot bounds, and maximum retries. `getLevel(levelId)` now resolves curated IDs 1-15 through the existing normalized catalog and generated IDs 16-10,000 through the generator. Zero, negative, fractional, and unsafe IDs return `invalid-level`; IDs above 10,000 return `unsupported-level`; generation failures return `generation-failed`. No generated level files or placeholders are stored.

Generated snapshots are newly constructed and deeply frozen at the public boundary (grid origin, mission objectives, placements, colors, thresholds, and metadata). Repeated lookup of the same ID/version/retry is logically identical and does not mutate curated definitions.

## Generator versioning and seed derivation

`generatorVersion` and `generatorConfigVersion` are both `1`. The deterministic identity is:

`level:<levelId>|generator:<generatorVersion>|config:<generatorConfigVersion>|retry:<retryAttempt>`

The approved seeded-random utility is the only random source. Retry attempts increment the identity deterministically; no clock, browser entropy, or `Math.random()` is used.

## Difficulty waves

The wave is deterministic from `levelId - 16` and repeats:

`easy, easy, medium, medium, hard, recovery, medium, hard, challenge, recovery`.

A baseline tier increases only across larger 1,000-level bands. Profiles expose color count (four in early/easier waves and five for hard/challenge or later tiers), density factor, and one/two-objective complexity. Recovery levels intentionally provide more generous density and shot inputs; difficulty is not a permanent linear staircase.

## Template selection and board filling

The Phase 11 template registry remains the sole structural source. A seeded selection filters templates by suitability rank and supported default grid dimensions, then chooses deterministically. Coordinates are sorted, deduplicated by construction, and filled with normal BubbleColor values from a deterministic 4-5 color palette. Neighbor colors are preferred during filling to avoid purely uniform random noise. No mission, color, score, or shot rule is embedded in a template.

All registered templates claim `guaranteed` ceiling support and were already validated through the authoritative Phase 2 neighbor model. The generated validator also requires every placement to be valid, unique, inside the selected template mask, and palette-constrained. Marked metadata is added only when the selected mission includes `CLEAR_MARKED`.

## Mission selection and feasibility

Generated missions use only the Phase 12 registry types: `CLEAR_ALL_BUBBLES`, `POP_COLOR`, `DROP_BUBBLES`, `CLEAR_MARKED`, and `REACH_SCORE`. Early wave slots favor Clear All/Pop/Drop; later slots can select marked, score, and bounded two-objective Pop+Drop missions. Targets are derived from actual generated placements, estimated lower-board potential, score-event values, shot limit, and difficulty factor.

The validator checks registry validity, one/two objective limits, duplicate objective rejection, non-empty boards, target-color availability, conservative floating potential, marked-bubble sufficiency, and reachable score bounds. The feasibility rule is intentionally conservative and is not a full AI solvability proof: Pop Color cannot exceed initially available target-color bubbles; Drop targets cannot exceed estimated lower-board potential; Clear Marked targets require enough marked cells; Reach Score and star thresholds remain below a score upper bound derived from approved score events, board size, floating potential, and shot limit.

## Shot limits and star thresholds

Generated shot limits are deterministic, use board size, palette size, mission complexity, and difficulty generosity, and are clamped to 8-40. Generated thresholds are derived from the same conservative score upper bound:

- `one = max(10, floor(upper * 0.35))`
- `two = max(one + 1, floor(upper * 0.55))`
- `three = max(two + 1, floor(upper * 0.75))`

The validator requires positive finite strictly increasing values and rejects a three-star threshold above the conservative upper bound. Curated thresholds are still derived from their existing approved formula and are unchanged.

## Validation and retry behavior

`validateGeneratedLevel` returns explicit error strings for identity/version metadata, seed/retry mismatch, board bounds/duplicates/colors, template identity, mission registry/configuration, conservative feasibility, shot bounds, star thresholds, and metadata drift. `generateGeneratedLevel` attempts retry zero plus at most three deterministic retries. If every candidate fails, it returns `generation-failed` with bounded attempt count and diagnostics; invalid content is never returned.

## Progression and save compatibility

Save schema version 1 remains the active schema. Validation now accepts level IDs through the centralized 10,000 cap while still rejecting impossible unlock relationships and invalid values. `ProgressionRepository` unlocks level N+1 after completion, including generated levels, but clamps at 10,000 and never creates a level 10,001 record. No eager generated completion records or active gameplay state are persisted.

`LevelSession` and `LevelBubbleSource` consume normalized generated definitions through the same authority boundaries as curated levels. Existing mission runtime, score, star, replay, restart, and progression behavior remains intact.

## Development diagnostics

No final UI or level editor was added. Generated content is covered through pure access and validator tests; the existing development level override can inspect a generated ID without changing normal lock/progression APIs. The Home Dashboard and scrollable map remain deferred.

## Tests and commands run

| Command/check | Exact result |
| --- | --- |
| `npm.cmd run typecheck` | Passed with exit code 0 and no TypeScript diagnostics. |
| `npm.cmd run lint` | Passed with exit code 0 and zero warnings under `--max-warnings 0`. |
| `npm.cmd test -- --run` | Passed: 25 test files, 146 tests, 0 failures. |
| `npm.cmd run build` | Passed: Vite 8.1.4 transformed 66 modules; main JS was 261.35 kB / 79.54 kB gzip. |
| Live Vite HTTP smoke | Passed: `/` returned HTTP 200; `/src/game/levels/levelCatalog.ts` returned HTTP 200 and contained generated access wiring. |
| Phase-scope audit | Passed: no Phase 14 Home Dashboard/map, final UI, or later feature implementation exists in authored source. |
| Browser availability | Browser discovery remains unavailable (`[]`); no screenshot or interaction claim is made. |

## Results

- Curated Levels 1-15 remain immutable and resolve through the original catalog path.
- Generated Levels 16-10,000 resolve on demand with deterministic versioned seeds and no authored level-file explosion.
- Difficulty waves include recovery bands and gradually increasing baseline inputs.
- Template selection, board filling, color palettes, missions, targets, shots, and thresholds are deterministic.
- Structural and conservative mission-feasibility validation is mandatory; failed candidates use bounded deterministic retries and explicit failure results.
- Progression/save version 1 remains compatible and supports sequential unlocks through level 10,000 without inventing level 10,001.
- No known critical Phase 13 issue remains within scope.

## Known issues

- Mission feasibility is conservative static validation, not a mathematical solvability proof or AI simulation; generated balancing remains subject to later QA.
- Browser visual and interaction QA remains unavailable because no Browser backend is provisioned; HTTP smoke checks passed.
- Generated levels are not cached; repeated access deterministically regenerates an immutable snapshot. This avoids stale-version cache concerns and is acceptable for the current scope.
- The project directory is not currently a Git worktree, so Git-based diff/status verification is unavailable.

## Deferred work

- Phase 14 Home Dashboard, fixed HUD/navigation, virtualized 10,000-level map, and Quick Play.
- Phase 15 gameplay visual integration and Phase 16 animation polish.
- Phase 17 hosted QA and Phase 18 senior review.
- Any future backend, economy, monetization, boosters, blockers, events, rewards, or other features outside the approved phase.

## Confirmation that Phase 14 and later phases were not implemented

Confirmed. No Home Dashboard, scrollable level map, final navigation, Quick Play, final visual integration, animation system, procedural solvability simulator, backend, cloud save, monetization, boosters, blockers, rewards, rankings, events, or other Phase 14+ feature was implemented or scaffolded. Work stops at the Phase 13 approval gate.
