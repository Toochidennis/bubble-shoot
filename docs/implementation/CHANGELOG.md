# Changelog

All notable implementation and project-control changes are recorded here. Blueprint overrides must also be documented in `DECISIONS.md`.

## 2026-07-15 - Phase 16 presentation and living-space polish

### Added

- `GameplayPresentationTimeline` with frame-time advancement, deterministic shooter/trail/wall/ceiling/snap/match/floating/star feedback, bounded particles, falling copies, board entrance, pause freeze, reset clearing, and reduced-motion behavior.
- Score count-up, mission-progress pulse, star-threshold pulse, and a short terminal transition delay while preserving immediate authoritative state.
- Deterministic Home ambient metadata/tests and slow depth-layer motion for the existing six bubbles, two glows, and sparkle field.
- Focused Phase 16 tests covering entrance gating, pause/resume, frame-rate independence, bounded queues, authoritative match/floating copies, reset clearing, and Home motion metadata.

### Changed

- Gameplay Canvas now renders presentation trails, particles, falling copies, rail pulse, trajectory shimmer, board entrance, and restrained shooter recoil around unchanged Phase 15 geometry and rules.
- Home ambient bubbles use long deterministic drift profiles; reduced motion disables drift while keeping the approved background composition.
- The gameplay mission hub now keeps two objectives visible: chips sit side-by-side when space allows and wrap into a controlled two-line HUD area on narrow mobile widths.
- Phase tracker and project status now record Phase 16 complete and Phase 17 pending owner review.

### Verified

- Typecheck and lint passed with zero diagnostics.
- 39 test files and 211 tests passed.
- Production build passed: 306.99 kB JS / 93.56 kB gzip and 19.79 kB CSS / 5.53 kB gzip.
- Installed-Chrome fallback smoke at 430x784 rendered Home, Level 1 entrance, and a real shot with no gameplay console errors; the only console warning was the existing missing static resource (404).

### Scope confirmation

- No Phase 17 work started. No audio, camera shake, WebGL, new assets, balance change, geometry change, progression change, or gameplay-rule change was introduced.

## 2026-07-14 - Phase 15 dense-board and jewel-color correction

### Changed

- Reworked curated Levels 1-15 into dense, connected, bubble-first boards with 42-78 starting bubbles instead of sparse hanging silhouettes; board shape now reads through color lanes and bands while every piece remains a round normal bubble.
- Bumped generated configuration identity to version 4 and raised generated starting-count bands to 59-72 bubbles for Levels 16-100, 64-76 for Levels 101-1000, and 68-78 for Levels 1001-10000, clamped to the current 78-cell authoritative grid capacity.
- Kept the accepted snap/no-disappearance resolver unchanged; the denser board shapes reduce dead-looking edge gaps without adding a new snap system or unsupported mechanics.
- Retuned the normal BubbleColor palette from over-bright neon to saturated jewel colors, preserving pure blue/green/purple/red/yellow identity while reducing same-color light stops, glow intensity, white wash, glass shell, crystal, nebula, and facet overlay opacity.
- Preserved circular bubble silhouettes for all visual families; crystal, nebula, and faceted details remain low-opacity internal treatments rather than changing the gameplay shape.

### Verified

- Type checking and ESLint passed; 37 test files and 204 tests passed.
- A stratified deterministic sample of 1,000 unique generated IDs completed with 0 failures, 28 deterministic retries, maximum retry 2, 59-78 bubbles, 92.31%-100% intended-region density, all ten compositions, all five visual families, and validated mission exhaustion safety.
- Production build passed: Vite transformed 78 modules; main JS 296.87 kB / 90.50 kB gzip; CSS 18.80 kB / 5.30 kB gzip.
- The in-app Browser runtime remained blocked by the Windows sandbox (`CreateProcessWithLogonW failed: 2`), so owner-authorized Playwright with installed Chrome covered 430x784 Levels 5, 14, 15, 16, 31, and 61. Screenshots confirmed Level 14 at 76 bubbles, Level 15 at 78, Level 16 at 61, dense generated Nebula/Faceted boards, round bubble silhouettes, and no clipping or framework overlay.
- Phase 16 scope audit passed; no animation/particle/audio/booster or later feature was added.

## 2026-07-14 - Phase 15 generated-level full-board presentation correction

### Changed

- Reduced shared gameplay geometry from `width / 16` (15-30px) to `width / 20` (14-22px), a 20% radius reduction at both 320px and 430px, without separating visual and collision geometry.
- Bumped generated configuration identity to version 3 and changed generated boards from structural hole masks to full ceiling-down row fills with only a centered final partial row when needed.
- Kept starting count bands: 45-60 bubbles for Levels 16-100, 50-65 for 101-1000, and 55-70 for 1001-10000.
- Added board analysis for valid capacity, intended-region density, occupied rows, upper occupancy, central empty regions, width, depth, same-color clusters, articulation-based drop opportunity, and conservative score floor.
- Added ten deterministic color-composition styles independent of structural templates and retained only normal BubbleColor identities.
- Deepened BubbleColor palette stops and reduced white shell/specular influence across crystal, nebula, and faceted families.
- Refactored generated mission selection to occur after final board analysis; added content-bounded POP_COLOR/CLEAR_MARKED, score-floor-bounded REACH_SCORE, topology-bounded DROP_BUBBLES, and combined mission-set validation.
- Full generated boards no longer fabricate DROP_BUBBLES objectives when there is no detachable topology; shape identity is now produced primarily by color composition, not by empty placement holes.
- Added an empty-board/incomplete-generated-mission diagnostic that stops without falsely winning or fabricating objective progress.

### Verified

- Type checking and ESLint passed; 37 test files and 204 tests passed.
- A stratified deterministic sample of 1,000 unique generated IDs completed with 0 failures, 75 deterministic retries, 45-70 bubbles, 92.31%-100% intended-region density, all ten compositions, all five visual families, and validated mission exhaustion safety.
- Production build passed: Vite transformed 78 modules; main JS 299.68 kB / 90.75 kB gzip; CSS 18.80 kB / 5.30 kB gzip.
- Mobile Chrome QA covered Levels 5, 6, 16, 31, and 61 at 430x784; all five canvases were stable across a delayed screenshot pair, and generated crystal/nebula/faceted boards rendered full and strongly colored.

## 2026-07-14 - Phase 15 full-width ceiling and no-disappearance correction

### Changed

- Expanded the shared authoritative mobile bubble radius to 15-30px using a `width / 16` scale, so the seven-cell top formation covers the visible ceiling rail instead of leaving dead side gutters.
- Added deterministic supported-frontier placement when a full top row or a blocked contacted bubble has no local empty snap cell. Candidates must be empty and adjacent to the occupied formation; isolated deep cells are never used.
- Preserved the normal priority order: empty top-row cell for ceiling impact, immediate empty neighbor for bubble impact, then supported frontier. A completely full board remains the sole no-placement case.
- Added Playwright as a development-only local interaction driver after the in-app Browser reported no available backend.

### Verified

- Interactive Chrome play at 430x784 reproduced Level 6: the former right-edge shot resolved a blue match, and the next non-matching green shot remained attached at the far-right ceiling while shots and mission counts advanced once.
- Interactive Chrome play at 320x640 showed no horizontal or vertical document overflow and no runtime console/page errors.
- Type checking and ESLint passed; 33 test files and 187 tests passed.
- Production build passed: 74 modules; main JS 290.17 kB / 87.88 kB gzip; CSS 18.80 kB / 5.30 kB gzip.

## 2026-07-14 - Phase 15 targeted projectile, level-transition, color, and scale correction

### Changed

- Keyed the gameplay screen by active level so Next Level always starts a fresh populated session with a new board, Clear All mission, shooter, and bubble source while preserving progression records.
- Retained a terminal projectile as a presentation-only contact visual when snap has no valid candidate, preventing silent disappearance without inventing fallback placement.
- Strengthened the normal BubbleColor palette and reduced white shell/highlight wash for clearer pure blue, green, purple, red, and yellow identities.
- Increased the shared gameplay radius from 14-17px to 15-18px across grid, physics, shooter, projectile, snap, and falling presentation geometry.
- Carried a failed-snap projectile through the authoritative `TurnResult` so normal Canvas redraws cannot drop the terminal contact visual; blocked shots leave board occupancy and match results unchanged.
- Removed the arbitrary ceiling snap distance cutoff: direct, far-edge, shallow, and wall-bounced ceiling shots now attach to the nearest legal empty top-row cell before normal match resolution.

### Verified

- Type checking passed.
- ESLint passed with zero warnings.
- `npm.cmd test -- --run` passed: 33 test files, 183 tests.
- Production build passed: Vite transformed 74 modules; main JS 289.57 kB / 87.74 kB gzip; CSS 18.80 kB / 5.30 kB gzip.
- HTTP smoke and Phase 16 scope audit passed.

## 2026-07-14 - Phase 15 targeted visual depth, scale, and bubble-family correction

### Changed

- Reduced the shared gameplay bubble radius from the prior 16-20px responsive range to 14-17px (approximately 12.5-15% smaller) while preserving authoritative grid, projectile, collision, ceiling, snap, shooter, and falling geometry.
- Added the rendering-only `BubbleVisualTheme` registry with `CLASSIC_GLOSS`, `PEARL_GLASS`, `CRYSTAL_CORE`, `NEBULA_ENERGY`, and `FACETED_GEM` families. Levels 1-5 map to classic, Levels 6-15 to pearl/glass, and generated level eras map deterministically without changing BubbleColor or gameplay rules.
- Refactored normal Canvas bubbles through one reusable themed renderer with restrained family details, lower contact depth, deterministic row/column/color highlight variation, and a shared marked-target overlay.
- Refined the shooter into a compact crescent/cradle with a soft pool and made the next bubble a small floating preview instead of a rectangular card. The gameplay HUD hierarchy and navy/purple world remain intact.

### Verified

- Type checking passed.
- ESLint passed with zero warnings.
- `npm.cmd test -- --run` passed: 32 test files, 172 tests.
- Production build passed: Vite transformed 74 modules; main JS 289.10 kB / 87.68 kB gzip; CSS 18.80 kB / 5.30 kB gzip.
- HTTP smoke passed for the app, Canvas host wiring, and visual-theme registry. Browser visual QA remains unavailable in this environment.
- Phase 16 remains pending and was not started.

## 2026-07-14 - Phase 15 targeted ceiling, topology, and presentation correction

### Changed

- Added the authoritative `boardCeilingY` gameplay surface and a Canvas-rendered segmented ceiling rail. Grid row-zero centers, trajectory preview, projectile collision, and existing ceiling snap now agree on the same boundary.
- Replaced the deterministic two-column curated color helper with explicit organic Level 1-15 row masks, local color clusters, support bridges, hanging branches, alternate support paths, and revised shot limits.
- Added reference-style floating resolver regressions for one-cell bridges, two-cell alternate support, diagonal chains, independent branches, mixed-color drops, and exact removal counts.
- Removed the raw impact/contact ring from normal gameplay; diagnostics remain behind development plus `?debug`.
- Strengthened the fixed-shooter pointer with a luminous tapered arrow, reduced trajectory dots to a maximum of 40 with 30px sampling, and recomposed the HUD into a two-row game hierarchy.

### Verified

- Type checking passed.
- ESLint passed with zero warnings.
- `npm.cmd test -- --run` passed: 31 test files, 168 tests.
- Production build passed: Vite transformed 73 modules; main JS 285.30 kB / 86.49 kB gzip.
- HTTP smoke verified the app, Canvas pointer/ceiling wiring, and gameplay layout boundary.
- Phase 16 scope audit passed; no animation/particle/audio/booster or later feature was implemented.
- Browser discovery remains unavailable (`[]`); owner mobile visual review is still required.

## 2026-07-14 - Phase 15 live touch-aim redraw correction

### Changed

- Routed pointer-move and pointer-release aim updates through the normal Canvas gameplay renderer, not only the `?debug` diagnostic renderer.
- The fixed shooter cue and reflected dotted trajectory now visibly follow the active touch drag in the player-facing build before the release fires one projectile.

### Verified

- Type checking passed.
- ESLint passed with zero warnings.
- `npm.cmd test -- --run` passed: 31 test files, 162 tests.
- Production build passed: Vite transformed 73 modules; main JS 279.56 kB / 85.10 kB gzip.
- Phase 16 and later work remains prohibited pending owner review.

## 2026-07-14 - Phase 15 touch aim and projectile feel adjustment

### Changed

- Confirmed the shooter remains fixed while touch dragging; pointer movement updates only the authoritative aim direction, direction cue, and trajectory.
- Maintained single-pointer capture/release/cancel behavior and exactly-once fire semantics.
- Raised default projectile speed to 600 logical units per second for a faster but still readable bounce cadence.

### Verified

- The change remains within Phase 15; Phase 16 has not started.

## 2026-07-14 - Phase 15 early-level density and shooter aim correction

### Changed

- Reworked all curated Levels 1-15 into substantial, ceiling-connected multi-row formations; Levels 1-5 now contain 20/24/27/30/34 starting bubbles with readable three-color onboarding clusters.
- Rebalanced all curated shot limits for the revised content and verified derived star thresholds remain valid without changing scoring formulas.
- Added fixed-origin natural drag aiming with one-pointer capture, secondary-pointer rejection, pointer-cancel safety, and exactly-once release firing.
- Moved star progress into the compact upper HUD and removed the detached bottom-left star panel.

### Verified

- Type checking, linting, `npm.cmd test` (31 files / 162 tests), production build (73 modules; main JS 280.11 kB / 85.12 kB gzip), HTTP smoke, and targeted Phase 16-scope audit passed.
- Browser discovery remains unavailable (`[]`); project-owner visual approval is pending.

## 2026-07-14 - Phase 15 targeted gameplay composition correction

### Changed

- Corrected the verified board-visibility cause by introducing a shared HUD-safe `GameplayLayout`: row-zero bubbles now begin below the player HUD, board origin is responsive/centered, and grid/projectile/shooter radii remain coherent.
- Increased perceived board scale without visual/collision divergence, preserved close-packed hex spacing, compacted the HUD, simplified the shooter cradle, moved the next bubble nearby, and added an authoritative aim-direction cue.
- Reworked trajectory presentation into a bounded deterministic set of larger, wider-spaced dots tinted from the current bubble color; trajectory calculations and wall-bounce geometry were not changed.

### Verified

- Type checking, linting, `npm.cmd test` (30 files / 157 tests), production build (72 modules; main JS 279.43 kB / 84.99 kB gzip), HTTP smoke, and targeted Phase 16-scope audit passed.
- Browser discovery remains unavailable (`[]`); project-owner visual approval of the correction is pending.

## 2026-07-14 - Phase 15 Gameplay visual integration completed

### Added

- Polished gameplay presentation with a procedural navy/purple Canvas world, glossy dimensional bubbles, readable shooter/aim treatment, and responsive HUD overlays for mission, shots, score, stars, pause, win, loss, replay, and Home navigation.
- Player-facing mission labels and star-threshold progress presentation without exposing internal mission enum names.
- `docs/implementation/reports/PHASE_15_REPORT.md`.

### Changed

- The normal gameplay surface is presentation-only around the existing authoritative engine; debug diagnostics are available only with the development `?debug` query flag.
- Current/next bubble presentation, marked-bubble indication, projectile/impact rendering, and progression-aware overlays are integrated without changing gameplay rules or persistence authority.

### Verified

- Type checking, linting, 153 automated tests, production build (71 modules; main JS 278.27 kB / 84.57 kB gzip), HTTP smoke, and Phase 16+ scope audit passed.
- Browser discovery returned no available backends (`[]`); screenshot and pixel-level visual QA could not run.
- **Status:** Complete; awaiting project-owner review.

## 2026-07-14 - Phase 14 Home Dashboard completed

### Added

- Home Dashboard screen with procedural navy/purple game-world background, fixed progression HUD, fixed bottom navigation, winding virtualized level map, completed/current/unlocked/locked nodes, saved stars, node selection, Quick Play/Continue, and disabled Ranking/Rewards controls.
- Deterministic map layout, visible-range/overscan calculations, progression view helpers, screen transition wiring, and regression tests.
- `docs/implementation/reports/PHASE_14_REPORT.md`.

### Changed

- App now opens on Home and launches the existing gameplay screen only for unlocked levels; gameplay can return Home without replacing the shared progression authority.
- The map never calls full `getLevel()` generation for node rendering and renders only a bounded local path/node window.

### Verified

- Type checking, linting, 151 automated tests, production build (70 modules; main JS 270.09 kB / 82.40 kB gzip), HTTP smoke, and Phase 15+ scope audit passed.
- Browser discovery returned no available backends (`[]`); visual screenshot QA could not run and no pixel-level claim is made.
- **Status:** Complete; awaiting project-owner review.

## 2026-07-14 - Phase 14 Home Dashboard started

### Changed

- Marked only Phase 14 - Home Dashboard + virtualized 10,000-level map as in progress after explicit project-owner approval.
- Authorized the procedural game-world background, fixed HUD and bottom navigation, virtualized winding level map, level states, selection, Quick Play/Continue, and disabled future tabs.

### Scope confirmation

- Existing gameplay remains in its approved development presentation.
- Phase 15 and later remain prohibited.
- No blueprint override was introduced.

## 2026-07-14 - Phase 13 deterministic generator completed

### Added

- Versioned generation configuration and seeds, difficulty waves with recovery bands, template selection, deterministic board/color filling, generated missions/targets, star thresholds, structural/feasibility validation, bounded retries, and generated-level metadata.
- Generated access for IDs 16-10,000 through `getLevel(levelId)` and regression tests for deterministic content, validator rejection, retries, and progression bounds.
- `docs/implementation/reports/PHASE_13_REPORT.md`.

### Changed

- Normalized level loading and `LevelSession` now accept generated definitions without changing curated level behavior.
- Schema-version-1 save validation and progression unlock bounds now use the centralized 10,000-level cap without eager records.

### Verified

- Type checking, linting, 146 automated tests, production build (66 modules; main JS 261.35 kB / 79.54 kB gzip), live HTTP smoke, and Phase 14+ scope audit passed.
- Browser discovery remains unavailable (`[]`); no browser screenshot or interaction claim is made.
- **Status:** Complete; awaiting project-owner review.

## 2026-07-14 - Phase 13 deterministic generator started

### Changed

- Marked only Phase 13 - Deterministic generator + validator as in progress after explicit project-owner approval.
- Authorized versioned on-demand generation for Levels 16-10,000, reusable template selection, difficulty waves, mission-feasibility validation, bounded deterministic retries, and progression-compatible access.

### Scope confirmation

- Curated Levels 1-15 remain authoritative and unchanged.
- Phase 14 and later remain prohibited.
- No blueprint override was introduced.

## 2026-07-14 - Phase 12 mission registry expansion started

### Changed

- Marked only Phase 12 - Mission registry expansion as in progress after explicit project-owner approval.
- Authorized the five approved mission types, one/two-objective mission sets, authoritative event consumption, marked-bubble metadata, and curated-level compatibility.

### Scope confirmation

- Phase 13 and later remain prohibited.
- No blueprint override was introduced.

## 2026-07-14 - Phase 12 mission registry expansion completed

### Added

- Registry-driven `CLEAR_ALL_BUBBLES`, `POP_COLOR`, `DROP_BUBBLES`, `CLEAR_MARKED`, and `REACH_SCORE` mission definitions with validation, feasibility metadata, and deterministic runtime state.
- One/two-objective mission-set support with authoritative turn-event deduplication.
- Optional logical `BubbleDescriptor.marked` metadata and direct-match removal descriptors for mission accounting.
- `docs/implementation/reports/PHASE_12_REPORT.md`.

### Changed

- Refactored `LevelSession` to update generalized mission runtime state after stable scored turns while preserving Clear All compatibility and win ordering.
- Kept Levels 1-15 unchanged as single Clear All missions.
- Marked Phase 12 completed and verified after all required checks passed.

### Verified

- Type checking passed.
- ESLint passed with zero warnings.
- 24 test files and 140 tests passed.
- Production build passed (59 modules; main JS 247.33 kB / 75.51 kB gzip).
- Live Vite HTTP smoke returned HTTP 200 for the app and mission registry source.
- Browser discovery returned no available backends (`[]`); no browser screenshot or interaction claim is made.
- Phase-scope audit found no Phase 13 generator or later feature.

### Scope confirmation

- Phase 13 and later remain prohibited pending explicit owner approval.
- No blueprint override was introduced.

## 2026-07-14 - Phase 11 unified level access and templates started

### Changed

- Marked only Phase 11 - Unified level access + reusable templates as in progress after explicit project-owner approval.
- Authorized the normalized curated-level catalog boundary and deterministic structural template registry.

### Scope confirmation

- Phase 12 and later remain prohibited.
- No blueprint override was introduced.

## 2026-07-14 - Phase 11 unified level access and templates completed

### Added

- `src/game/levels/levelCatalog.ts` with immutable normalized curated-level access and controlled invalid/unsupported results.
- `src/game/templates/` with the Triangle, Diamond, Wave, Columns, Split Clusters, Hanging Clusters, Tunnel, Wide Top, Islands, and Zigzag structural families.
- Deterministic template registry validation for IDs, metadata, coordinates, bounds, duplicates, determinism, and ceiling support.
- `docs/implementation/reports/PHASE_11_REPORT.md`.

### Changed

- Refactored `LevelSession` to consume the central `getLevel` boundary while preserving curated gameplay behavior.
- Added Phase 11 level-access, curated-compatibility, template-shape, and ceiling-connectivity tests.
- Marked Phase 11 completed and verified after all required checks passed.

### Verified

- Type checking passed.
- ESLint passed with zero warnings.
- 23 test files and 133 tests passed.
- Production build passed (58 modules; main JS 240.85 kB / 74.08 kB gzip).
- Live Vite HTTP smoke returned HTTP 200 for the app and level catalog source.
- Browser discovery returned no available backends (`[]`); no browser screenshot or interaction claim is made.
- Phase-scope audit found no Phase 12 mission expansion, Phase 13 generator, generated level, or later feature.

### Scope confirmation

- Phase 12 and later remain prohibited pending explicit owner approval.
- No blueprint override was introduced.

## 2026-07-14 - Phase 10 score, stars, and save progress started

### Changed

- Marked only Phase 10 - Score, stars, save progress as in progress after explicit project-owner approval.
- Authorized deterministic score events, star thresholds, completion records, sequential Levels 1-15 unlocks, and validated versioned local persistence.

### Scope confirmation

- Phase 11 and later remain prohibited.
- No blueprint override was introduced.

## 2026-07-14 - Phase 10 score, stars, and save progress completed

### Added

- React-independent deterministic score calculation for matches, floating removals, large-match bonuses, and one-time Clear All completion bonuses.
- Curated-level star threshold derivation and 1-3 star calculation.
- Versioned schema-1 progression records, validated local storage adapter, safe parser, independent best score/stars updates, and sequential unlock progression through Level 15.
- Level-session score lifecycle diagnostics and replay/restart-safe progression tests.
- `docs/implementation/reports/PHASE_10_REPORT.md`.

### Changed

- Extended `LevelSession` with current-run score, last-turn score, final score, earned stars, best records, unlock status, and a locked-level development override boundary.
- Extended temporary Canvas diagnostics with score, stars, best results, and unlock state.
- Marked Phase 10 completed and verified after all required checks passed.

### Verified

- Type checking passed.
- ESLint passed with zero warnings.
- 21 test files and 126 tests passed.
- Production build passed (57 modules; main JS 239.95 kB / 73.87 kB gzip).
- Live Vite HTTP smoke returned HTTP 200 for the app and progression source.
- Browser discovery returned no available backends (`[]`); no browser screenshot or interaction claim is made.
- Phase-scope audit found no Phase 11 template/generalized-access system or later feature.

### Scope confirmation

- Phase 11 and later remain prohibited pending explicit owner approval.
- No blueprint override was introduced.

## 2026-07-13 - Phase 9 targeted mission-progress review fix

### Changed

- Clarified that Clear All `clearedBubbleCount` is net progress from the original starting board and is clamped at zero while current occupancy exceeds the starting count.
- Added regression tests for 20-to-21+ board growth, later net reduction below the starting count, and empty-board completion.
- Updated Phase 9 decision, status, and report documentation. Phase 10 and later phases remain untouched.

### Verified

- Type checking, linting, tests, and production build were rerun after the targeted fix.

## 2026-07-13 - Phase 9 started

### Changed

- Marked only Phase 9 - Mission 1 + first 15 levels as in progress after explicit project-owner approval.
- Updated project status to reflect the Clear All mission, curated onboarding levels, level-session boundary, shot limits, and development selector scope.

### Scope confirmation

- Phase 10 and later work remains prohibited.
- No blueprint override was introduced.

## 2026-07-13 - Phase 9 mission and curated levels completed

### Added

- `src/game/mission/types.ts` with the Clear All mission contract and logical occupancy-derived progress evaluation.
- `src/game/mission/mission.test.ts` with mission initialization, progress, and completion coverage.
- `src/game/levels/types.ts` with curated level, status, loading, and win/loss ordering contracts.
- `src/game/levels/curatedLevels.ts` with exactly 15 validated hand-authored onboarding levels.
- `src/game/levels/curatedLevels.test.ts` with uniqueness, coordinate, palette, mission, shot, and color-band validation.
- `src/game/levels/levelBubbleSource.ts` with deterministic fair level-aware color selection.
- `src/game/levels/levelBubbleSource.test.ts` with palette filtering, removed-color behavior, reset, and determinism coverage.
- `src/game/levels/LevelSession.ts` with level loading/restart, mission progress, shot accounting, status gating, and GameplaySession integration.
- `src/game/levels/LevelSession.test.ts` and `src/game/levels/levelStatus.test.ts` with loading, restart, input, shot, and win/loss ordering coverage.

### Changed

- Extended `GameplaySession` with a level-controlled bubble-advancement guard so a completed empty board does not require another gameplay bubble.
- Refactored the development Canvas host to use `LevelSession`, display level/mission/shots/status diagnostics, and expose a temporary Levels 1-15 selector and restart control.
- Added temporary development control styling only; no final HUD or Home Dashboard was implemented.
- Marked Phase 9 completed and verified after all required checks passed.
- Updated project status, decisions, and phase records for the completed mission/curated-level foundation.

### Verified

- Type checking passed.
- ESLint passed with zero warnings.
- 18 test files and 113 tests passed.
- Production build passed (50 modules; main JS 233.71 kB / 72.02 kB gzip).
- Live Vite HTTP smoke returned HTTP 200 for the app and Canvas host source, including `LevelSession` and development level controls.
- Browser discovery returned no available backends (`[]`); no browser screenshot or interaction claim is made.
- Phase-scope audit found no Phase 10 score/star/save system or later gameplay implementation.

### Scope confirmation

- No score, stars, persistence, templates, procedural generation, Home Dashboard, level unlocking, later mission type, or future feature was implemented.
- No blueprint override was introduced.

## 2026-07-13 - Phase 8 started

### Changed

- Marked only Phase 8 - State machine + turn lifecycle as in progress after explicit project-owner approval.
- Updated project status to reflect the lifecycle coordinator, explicit transitions, turn sequencing, deterministic bubble progression, and pause/resume foundation.

### Scope confirmation

- Phase 9 and later work remains prohibited.
- No blueprint override was introduced.

## 2026-07-13 - Phase 8 state machine and turn lifecycle completed

### Added

- `src/game/session/types.ts` with lifecycle states, transition/failure contracts, turn history, and bubble-source interfaces.
- `src/game/session/bubbleSource.ts` with an isolated deterministic cyclic development bubble source.
- `src/game/session/GameplaySession.ts` with authoritative state transitions, input ownership, projectile handoff, snap/match/floating sequencing, safe failure completion, pause/resume, and turn advancement.
- `src/game/session/GameplaySession.test.ts` with transition, locking, success/no-match, snap failure, pause/resume, repeated-turn, and resolution-order coverage.

### Changed

- Extended `ShooterState` with lifecycle-owned pending-fire abort and completed-turn reset/advancement operations.
- Refactored `CanvasHost` to drive `GameplaySession` rather than manually sequencing Phase 4-7 systems; diagnostics now show lifecycle state and turn count.
- Marked Phase 8 completed and verified after all required checks passed.
- Updated project status, decisions, and phase records for the completed lifecycle foundation.

### Verified

- Type checking passed.
- ESLint passed with zero warnings.
- 13 test files and 100 tests passed.
- Production build passed (46 modules; main JS 224.47 kB / 70.00 kB gzip).
- Live Vite HTTP smoke returned HTTP 200 for the app and Canvas host source, including `GameplaySession` wiring.
- Browser discovery returned no available backends (`[]`); no browser screenshot or interaction claim is made.
- Phase-scope audit found no Phase 9 mission/level system or later gameplay implementation.

### Scope confirmation

- No missions, levels, scoring, stars, persistence, win/lose conditions, final UI, or future feature was implemented.
- No blueprint override was introduced.

## 2026-07-13 - Phase 7 started

### Changed

- Marked only Phase 7 - Floating bubble resolver as in progress after explicit project-owner approval.
- Updated project status to reflect ceiling-connectivity analysis, floating removal, Phase 6 integration, and development falling diagnostics.

### Scope confirmation

- Phase 8 and later work remains prohibited.
- No blueprint override was introduced.

## 2026-07-13 - Phase 7 floating bubble resolver completed

### Added

- `src/game/floating/types.ts` with deterministic support/floating result contracts, removed bubble data, removal failures, and falling diagnostic state.
- `src/game/floating/floatingResolver.ts` with all-root ceiling connectivity traversal, deterministic floating detection, and authoritative removal.
- `src/game/floating/floatingResolver.test.ts` with support, mixed-color, staggered-grid, edge, no-root, empty-board, cluster-removal, determinism, and Phase 6 integration coverage.

### Changed

- Wired floating resolution after a valid Phase 6 match and added temporary gravity/drift Canvas falling diagnostics using copied removed-bubble data.
- Marked Phase 7 completed and verified after all required checks passed.
- Updated project status, decisions, and phase records for the completed floating-bubble foundation.

### Verified

- Type checking passed.
- ESLint passed with zero warnings.
- 12 test files and 93 tests passed.
- Production build passed (44 modules; main JS 219.65 kB / 68.81 kB gzip).
- Live Vite HTTP smoke returned HTTP 200 for the app and Canvas host source, including floating resolver wiring and floating status diagnostics.
- Browser discovery returned no available backends (`[]`); no browser screenshot or interaction claim is made.
- Phase-scope audit found no Phase 8 full turn lifecycle or later gameplay implementation.

### Scope confirmation

- No turn state machine, shooter unlock/reset, scoring, missions, levels, persistence, final UI, or future feature was implemented.
- No blueprint override was introduced.

## 2026-07-13 - Phase 6 started

### Changed

- Marked only Phase 6 - Match resolver as in progress after explicit project-owner approval.
- Updated project status to reflect origin-anchored same-color traversal, threshold handling, and authoritative removal work.

### Scope confirmation

- Phase 7 and later work remains prohibited.
- No blueprint override was introduced.

## 2026-07-13 - Phase 6 match resolver completed

### Added

- `src/game/match/types.ts` with threshold configuration and explicit valid, no-match, and invalid-origin result contracts.
- `src/game/match/matchConfig.ts` with the default minimum match threshold of three.
- `src/game/match/matchResolver.ts` with origin-anchored deterministic same-color traversal and authoritative cluster removal.
- `src/game/match/matchResolver.test.ts` with traversal, threshold, edge, mixed-color, disconnected, invalid-origin, determinism, removal, and Phase 5 integration coverage.

### Changed

- Wired terminal Phase 5 snap results into the match resolver and temporary Canvas diagnostics. Matched clusters are highlighted and match status is reported.
- Marked Phase 6 completed and verified after all required checks passed.
- Updated project status, decisions, and phase records for the completed match foundation.

### Verified

- Type checking passed.
- ESLint passed with zero warnings.
- 11 test files and 84 tests passed.
- Production build passed (43 modules; main JS 217.40 kB / 68.22 kB gzip).
- Live Vite HTTP smoke returned HTTP 200 for the app and Canvas host source, including match resolver wiring and match status diagnostics.
- Browser discovery returned no available backends (`[]`); no browser screenshot or interaction claim is made.
- Phase-scope audit found no Phase 7 floating-bubble resolver or later gameplay implementation.

### Scope confirmation

- No floating-bubble traversal/removal, scoring, missions, levels, persistence, turn lifecycle, final UI, or future feature was implemented.
- No blueprint override was introduced.

## 2026-07-13 - Phase 5 started

### Changed

- Marked only Phase 5 - Snap system as in progress after explicit project-owner approval.
- Updated project status to reflect the Phase 5 scope and Phase 6 approval gate.

### Scope confirmation

- Phase 6 and later work remains prohibited.
- No blueprint override was introduced.

## 2026-07-13 - Phase 5 snap system completed

### Added

- `src/game/snap/types.ts` with bounded candidate, configuration, failure, and explicit snap-result contracts.
- `src/game/snap/snapConfig.ts` with the controlled ceiling candidate-distance multiplier.
- `src/game/snap/snapResolver.ts` with ceiling and impacted-neighbor candidate generation, deterministic ranking, bounded failure behavior, and authoritative placement.
- `src/game/snap/snapResolver.test.ts` with 17 ceiling, neighbor, edge, exclusion, determinism, safety, and Phase 4 integration tests.

### Changed

- Wired terminal Phase 4 impacts into the snap resolver and temporary Canvas diagnostic. Candidate cells, selected cell, placed bubble, and snap status are now visible in development mode.
- Marked Phase 5 completed and verified after all required checks passed.
- Updated project status, decisions, and phase records for the completed snap foundation.

### Verified

- Type checking passed.
- ESLint passed with zero warnings.
- 10 test files and 75 tests passed.
- Production build passed.
- Live Vite HTTP smoke returned HTTP 200 for the app and Canvas host source, including snap resolver wiring and snap status diagnostics.
- Phase-scope audit found no Phase 6 match resolver or later gameplay implementation.

### Scope confirmation

- No matching, popping, floating-bubble removal, scoring, missions, levels, persistence, turn-resolution state machine, final UI, or future feature was implemented.
- No blueprint override was introduced.

## 2026-07-13 - Phase 4 started

### Changed

- Marked only Phase 4 - Projectile physics as in progress after explicit project-owner approval.
- Updated project status to reflect the Phase 4 scope and Phase 5 approval gate.

### Scope confirmation

- Phase 5 and later work remains prohibited.
- No blueprint override was introduced.

## 2026-07-13 - Phase 4 projectile physics completed

### Added

- `src/game/physics/types.ts` with projectile, collider, bounds, wall-event, impact, and step-result contracts.
- `src/game/physics/physicsConfig.ts` with centralized speed, radius, delta, iteration, and epsilon constants.
- `src/game/physics/collisionGeometry.ts` with radius-aware swept wall, ceiling, and circle intersection queries.
- `src/game/physics/collisionQueries.ts` with deterministic occupied-board collider extraction.
- `src/game/physics/projectileStepper.ts` with frame-independent continuous movement, remaining-distance wall reflection, earliest terminal impact selection, and bounded safety handling.
- `src/game/physics/ProjectileManager.ts` with single-active-projectile ownership and retained completion results.
- `src/game/physics/projectilePhysics.test.ts` with 16 projectile creation, ownership, frame-rate, wall, ceiling, bubble, anti-tunneling, ordering, safeguard, and lock tests.

### Changed

- Wired a development-only pointer-release fire gesture from the Phase 3 shooter boundary into projectile spawning and the existing GameLoop.
- Extended the temporary Canvas diagnostic with actual projectile movement, wall-bounce state, occupied debug bubbles, terminal impact markers, and impact labels.
- Marked Phase 4 completed and verified after all required checks passed.
- Updated project status, decisions, and phase records for the completed physics foundation.

### Verified

- Type checking passed.
- ESLint passed with zero warnings.
- 9 test files and 57 tests passed.
- Production build passed.
- Live Vite HTTP smoke returned HTTP 200 for the app and Canvas host source, including projectile manager and pointer-release wiring.
- Phase-scope audit found no Phase 5+ snap or later gameplay implementation.

### Scope confirmation

- No snap coordinate, board occupancy mutation, matching, popping, dropping, mission, level, score, persistence, final UI, or future feature was implemented.
- No blueprint override was introduced.

## 2026-07-13 - Phase 3 shooter and aiming completed

### Added

- `src/game/shooter/` pure shooter types/configuration, signed angle math, normalized aim directions, logical Pointer Event coordinate conversion, bounded reflected trajectory preview, and single-shot lock state.
- `src/game/shooter/*test.ts` coverage for aim limits, downward/extreme pointers, CSS/DPR conversion, shooter state transitions, fire locking, reflections, segment limits, and deterministic output.
- `src/game/rendering/drawShooterDebug.ts` neutral development-only Canvas overlay for shooter origin, current/next bubble diagnostics, aim line, and trajectory segments.

### Changed

- Wired `CanvasHost` to update the shooter aim through unified Pointer Events and redraw the temporary diagnostic preview.
- Marked Phase 3 completed and verified after all required checks passed.
- Updated project status, decisions, and phase records for the completed shooter/aiming foundation.

### Verified

- Type checking passed.
- ESLint passed with zero warnings.
- 8 test files and 41 tests passed.
- Production build passed.
- Live Vite HTTP smoke returned HTTP 200 for the app and Canvas host source, including shooter diagnostics and pointer handlers.
- Phase-scope audit found no Phase 4+ gameplay implementation.

### Scope confirmation

- Projectile travel, collision, snapping, matching, resolution, missions, levels, progression, persistence, final UI, and future features remain unimplemented.
- No blueprint override was introduced.

## 2026-07-13 - Phase 3 started

### Changed

- Marked only Phase 3 - Shooter and aiming as in progress after explicit project-owner approval.
- Updated project status to reflect the Phase 3 scope and Phase 4 approval gate.

### Scope confirmation

- Phase 4 and later work remains prohibited.
- No blueprint override was introduced.

## 2026-07-13 - Phase 2 hex grid system

### Added

- `src/game/grid/types.ts` with coordinate, cell, parity, and mutation-result types.
- `src/game/grid/gridConfig.ts` with validated centralized geometry and the default 12-row 7/6 staggered board configuration.
- `src/game/grid/coordinates.ts` with stable keys, row widths, bounds, grid-to-world centers, and deterministic nearest-cell conversion.
- `src/game/grid/neighbors.ts` with centralized six-neighbor lookup and documented deterministic ordering.
- `src/game/grid/HexBoard.ts` with generic authoritative occupancy, valid/occupied iteration, safe placement/removal, neighbor-cell inspection, and top-row APIs.
- `src/game/grid/hexGrid.test.ts` with geometry, bounds, neighbor, occupancy, and top-row tests.
- `src/game/rendering/drawHexGridDebug.ts` with neutral development-only cell outlines, coordinate labels, selected-cell highlighting, and neighbor highlighting.

### Changed

- Wired `CanvasHost` to render the grid debug adapter in development mode using the logical board model.
- Marked Phase 2 completed and verified after all required checks passed.
- Updated project status, decisions, and phase records for the completed grid foundation.

### Verified

- Type checking passed.
- ESLint passed with zero warnings.
- 4 test files and 21 tests passed.
- Production build passed.
- Live Vite HTTP smoke served the app and verified the Canvas host includes the debug renderer and grid configuration.
- Phase-scope audit found no Phase 3+ gameplay implementation.

### Scope confirmation

- Phase 3 and later work was not implemented.
- No blueprint override was introduced.

## 2026-07-13 - Phase 2 started

### Changed

- Marked only Phase 2 - Hex grid system as in progress after explicit project-owner approval.
- Updated project status to reflect the Phase 2 scope and Phase 3 approval gate.

### Scope confirmation

- Phase 3 and later work remains prohibited.
- No blueprint override was introduced.

## 2026-07-13 - Phase 1 project foundation

### Added

- React 19, TypeScript 6, and Vite 8 application foundation with strict compiler settings.
- Mobile-first application shell, browser-safe root initialization, and application error boundary.
- Deliberately minimal temporary Phase 1 screen; no approved Home or Gameplay UI recreation.
- Responsive Canvas host with resize observation, device-pixel-ratio cap, logical viewport metrics, 2D context setup, cleanup, and neutral diagnostic drawing.
- React-independent game-loop lifecycle skeleton with delta-time capping and lifecycle tests.
- Foundational point, viewport, frame, lifecycle, application configuration, and development flag types.
- Deterministic seeded-random utility isolated from `Math.random`, with regression and validation tests.
- Vitest, ESLint flat configuration, TypeScript project references, EditorConfig, and build/test/lint scripts.
- `package-lock.json` with the resolved dependency graph.
- `docs/implementation/reports/PHASE_01_REPORT.md`.

### Changed

- Marked only Phase 1 as completed and verified after its checks passed.
- Updated project status, decisions, and phase records for the completed foundation.

### Verified

- Dependency installation completed with 0 reported vulnerabilities.
- Type checking passed.
- ESLint passed with zero warnings.
- 3 test files and 8 tests passed.
- Production build passed.
- Live Vite development server returned HTTP 200 for the application document and entry module.

### Scope confirmation

- Phase 2 and later work was not implemented.
- No blueprint override was introduced.

## 2026-07-13 - Phase 0 initialization

### Added

- `docs/implementation/CODEX_RULES.md` with source hierarchy, phase-gate protocol, product constraints, technical baseline, feature boundaries, and completion rules.
- `docs/implementation/PHASE_TRACKER.md` with required status markers and Phase 0 through Phase 22 entries.
- `docs/implementation/PROJECT_STATUS.md` with current, completed, pending, approved, in-progress, blocked, deferred, issue, and non-violation status.
- `docs/implementation/DECISIONS.md` with initial authority, scope, phase, and disabled-feature decisions.
- `docs/implementation/CHANGELOG.md`.
- `docs/implementation/reports/` and `docs/implementation/reports/PHASE_00_REPORT.md`.

### Reviewed

- Full repository inventory.
- `docs/Bubble_Shooter_HTML5_Game_Master_Blueprint_v1.0.pdf` (23 pages).
- `home-dashboard.png`.
- `approved-gameplay-ui.png`.

### Scope confirmation

- No game code, application scaffold, package manifest, dependency, route, feature, or later-phase implementation was added.
- No blueprint override was introduced.
- Replaced the fixed 78-cell gameplay board with a 200-cell 11/10-column, 19-row responsive grid. Curated Levels 1-15 now use 59-129 bubbles, while generator version 5 scales Levels 16-10,000 through 59-200 bubble bands with deterministic full-row fills and color-composed shape illusions.
- Updated the authoritative radius to a viewport/vertical-fit range of 10-18px, preserving exact shared spacing across grid, physics, snapping, shooter, projectile, and Canvas. Family accents were kept circular so arches, waves, wings, rings, and other shapes come from arrangement and color rather than distorted bubbles.
- Added template inspection caching and replaced the legacy LevelSession fallback layout with the HUD-safe GameplayLayout factory. Typecheck, lint, build, 37 test files/204 tests, 1,000-level validation, and 430x784 Level 1/10,000 Chrome screenshots passed.
- Replaced candy-like bubble decoration with a single smooth round-sphere renderer across board, shooter, projectile, falling, and next-bubble states. Removed internal rings, center dots, polygonal/faceted family overlays, and white-shell wash; mission targets now use an external luminous ring while preserving pure jewel-tone colors.
- Moved the live mission objective into the gameplay HUD's compact third row and reduced board-only bubble glow/contact depth. Live 430x784 gameplay confirmed the objective stays legible, a real pointer shot decrements the shot counter, and delayed redraws show stable smooth spheres without cast-shadow bands.
- Re-aligned the HUD into paired columns: Level/Pause, Stars/Mission, and Score/Shots. A 430x784 live check confirmed the new grouping and a real shot still changed score, shots, and mission progress.
