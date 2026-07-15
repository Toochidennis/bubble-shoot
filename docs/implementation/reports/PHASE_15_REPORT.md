# Phase 15 Report - Approved gameplay UI and visual integration

## Phase status

**PHASE:** Phase 15 - Gameplay visual integration  
**STATUS:** COMPLETE  
**APPROVAL NEEDED BEFORE NEXT PHASE:** Yes

## Objective

Replace the player-facing gameplay foundation presentation with a polished, mobile-first Bubble Shooter gameplay surface guided by `approved-gameplay-ui.png`. The implementation adds code-generated depth, deterministic level-era normal-bubble visual families, shared bubble rendering, responsive HUD composition, shooter/aim presentation, current/next bubble context, pause and terminal overlays, and Home/replay navigation while preserving the existing engine and progression authorities. Targeted corrections also establish an authoritative ceiling rail, organic hand-authored Level 1-15 formations with support bridges, fixed-origin natural drag aiming with pointer capture, full-width upper-row play, deterministic no-disappearance placement, compact game-like HUD hierarchy, and reliable next-bubble/shooter composition. Phase 16 animation/particle polish and all later features remain out of scope.

## Source-of-truth documents reviewed

- `docs/Bubble_Shooter_HTML5_Game_Master_Blueprint_v1.0.pdf` - functional, architectural, gameplay, and scope authority.
- `home-dashboard.png` - approved Home visual direction; preserved from Phase 14.
- `approved-gameplay-ui.png` - approved gameplay visual direction; inspected for hierarchy, palette, depth, bubble treatment, HUD density, and shooter composition.
- `docs/implementation/CODEX_RULES.md`.
- `docs/implementation/PHASE_TRACKER.md`.
- `docs/implementation/PROJECT_STATUS.md`.
- `docs/implementation/DECISIONS.md`.
- `docs/implementation/CHANGELOG.md`.
- `docs/implementation/reports/PHASE_00_REPORT.md` through `PHASE_15_REPORT.md` (the prior Phase 15 report was the baseline being corrected).
- Project-owner Phase 15 implementation instruction.
- Project-owner Phase 15 targeted ceiling/topology/presentation correction instruction.
- Project-owner Phase 15 targeted visual-depth, bubble-scale, and level-based bubble-style instruction.
- Project-owner Phase 15 targeted projectile-disappearance, next-level initialization, color-strength, and gameplay-scale correction instruction.
- Project-owner instruction that the complete visible upper row remain playable and no accepted normal bubble disappear there.
- Project-owner generated-level presentation and mission-safety correction instruction.
- Project-owner dense-board, bubble-count, pure-color, and round-bubble silhouette correction instruction.

The no-disappearance instruction is an explicit owner clarification of normal shot placement and supersedes the earlier local-only snap fallback restriction. The generated-level correction explicitly supersedes the interim `width / 16` scale and the sparse/holed generated board approach while preserving the accepted snap rule. The latest dense-board correction supersedes the prior 45-70 generated count range and the sparse curated onboarding formations. Generated and curated board shape is expected to read primarily through BubbleColor placement rather than large structural gaps, while every bubble remains a true circle. The scalable board correction now provides 11/10 alternating columns across 19 rows (exactly 200 logical cells), with responsive radius fitting that keeps the complete board below the HUD and above the shooter region. Generated counts use the 59-200 range by level era and remain clamped to the shared 200-cell capacity. These overrides are recorded in `DECISIONS.md` and `CHANGELOG.md`. The reference image was treated as visual direction, not as authorization for unsupported features or as a required raster background.

## Files created

- `src/game/rendering/drawGameplayFrame.ts`
- `src/game/rendering/bubbleVisualTheme.ts`
- `src/game/rendering/bubbleVisualTheme.test.ts`
- `src/game/rendering/drawGameplayFrame.test.ts`
- `src/game/layout/gameplayLayout.ts`
- `src/game/layout/gameplayLayout.test.ts`
- `src/game/shooter/aimPointerController.ts`
- `src/game/shooter/aimPointerController.test.ts`
- `src/screens/gameplayPresentation.ts`
- `src/screens/gameplayPresentation.test.ts`
- `src/game/floating/floatingResolver.test.ts` (reference-style bridge/drop regressions)
- `src/game/session/ceilingAttachment.test.ts`
- `src/game/generation/analysis.ts`
- `src/game/generation/boardBuilder.ts`
- `src/game/generation/colorComposition.ts`
- `src/game/generation/colorComposition.test.ts`
- `src/game/generation/missionSafety.test.ts`
- `src/game/generation/sampleValidation.test.ts`
- `src/game/levels/levelInvariant.ts`
- `src/game/levels/levelInvariant.test.ts`
- `docs/implementation/reports/PHASE_15_REPORT.md`

## Files modified

- `src/app/App.tsx`
- `src/config/appConfig.ts`
- `src/components/CanvasHost.tsx`
- `src/game/levels/LevelSession.ts`
- `src/game/levels/curatedLevels.test.ts`
- `src/game/levels/curatedLevels.ts`
- `src/game/layout/gameplayLayout.ts`
- `src/game/layout/gameplayLayout.test.ts`
- `src/game/rendering/drawGameplayFrame.ts`
- `src/game/rendering/drawGameplayFrame.test.ts`
- `src/game/rendering/bubbleVisualTheme.ts`
- `src/game/levels/LevelSessionScore.test.ts`
- `src/game/session/GameplaySession.ts`
- `src/game/session/GameplaySession.test.ts`
- `src/game/session/types.ts`
- `src/game/shooter/ShooterState.test.ts`
- `src/screens/FoundationScreen.tsx`
- `src/styles/global.css`
- `src/game/snap/snapConfig.ts`
- `src/game/snap/snapResolver.ts`
- `src/game/snap/snapResolver.test.ts`
- `src/game/generation/config.ts`
- `src/game/generation/types.ts`
- `src/game/generation/generator.ts`
- `src/game/generation/generator.test.ts`
- `src/game/generation/validator.ts`
- `package.json`
- `package-lock.json`
- `docs/implementation/PHASE_TRACKER.md`
- `docs/implementation/PROJECT_STATUS.md`
- `docs/implementation/DECISIONS.md`
- `docs/implementation/CHANGELOG.md`

The blueprint PDF, approved image references, grid/physics/resolution systems, curated/generated level content, mission registry, scoring formulas, progression records, and save schema were not replaced.

## Targeted review correction: verified cause and architectural fix

The verified cause of the invisible starting formation was the mismatch between the logical board origin and the player-facing HUD: `DEFAULT_HEX_GRID_CONFIG.origin.y` was `24`, while the normal HUD and mission strip occupied the top portion of the same full-viewport Canvas. Row-0 bubbles were logically present but rendered underneath the HUD rather than being absent from the board or removed by mission logic. The compact logical viewport also used a 14px radius and a left-biased origin, making the remaining formation read smaller than intended.

`GameplayLayout` is now the authoritative presentation/world configuration passed into `LevelSession`. It derives a responsive, centered 11/10-column grid origin, sets a HUD-safe `hudInset` of 112 logical pixels, fits 19 rows to the available vertical space, and uses the same 10-18px radius for grid spacing, projectile configuration, collision queries, snap centers, shooter bubble, projectile, and Canvas rendering. The board is not CSS-translated independently of physics. Direct `LevelSession` construction uses the same layout factory as CanvasHost, so the old row-zero-under-HUD fallback cannot return.

The corrected layout guarantees row 0's visual radius begins at or below the HUD inset, keeps occupied cells within horizontal bounds for narrow mobile widths, and reserves a shooter region below representative early-level formations. Automated layout tests cover Levels 1, 2, 5, 15, and generated Level 16, plus narrow mobile, default mobile, and portrait desktop dimensions.

### Targeted bubble-scale and visual-family correction

The scalable board correction uses a responsive radius derived from `viewportWidth / 24` and the available height, clamped to 10-18px. This keeps 11 bubbles across the full width and all 19 rows inside the playable viewport at 224px, 320px, 430px, and portrait desktop sizes. This is a geometry change, not CSS scaling: grid spacing, row offsets, world centers, projectile radius, swept collision, wall boundaries, ceiling contact, snap centers, shooter current bubble, and falling copies consume the same value.

`BubbleVisualTheme` is rendering metadata only. Its registry contains the five approved normal presentation families: `CLASSIC_GLOSS`, `PEARL_GLASS`, `CRYSTAL_CORE`, `NEBULA_ENERGY`, and `FACETED_GEM`. The deterministic mapping keeps Levels 1-5 classic and simple, Levels 6-15 pearl/glass, Levels 16-30 crystal, Levels 31-60 nebula, and Levels 61-100 faceted. Levels 101+ rotate through stable visual bands (20 levels before the 1,000-level range and 30 levels thereafter). No theme is persisted, randomly selected, or consulted by gameplay rules.

`drawBubble` is now the shared Canvas renderer for board, falling, projectile, and shooter bubbles. It renders one smooth circular sphere for every presentation state, matching the clean `NEXT` preview feel. Family IDs remain level metadata, but no family adds polygons, facets, internal rings, or center-hole artifacts. Marked bubbles receive only an external luminous target ring. A small deterministic row/column/color variant changes highlight position without changing gameplay identity. The normal-color palette remains pure jewel-tone BubbleColor against the navy/purple world and no special bubble types were introduced.

The final bubble correction makes BubbleColor the dominant material layer while removing the candy-like appearance. Sapphire blue, emerald green, amethyst violet, ruby red, and amber gold use saturated same-color base/light/dark stops, a small soft specular highlight, and a restrained lower rim. There is no neutral white shell, concentric interior stroke, center dot, polygon, or faceted overlay. Mission targets remain identifiable through an external ring rather than a hole inside the sphere.

Per-bubble rendering remains a single Canvas pass over authoritative cells. Stable palette/theme metadata is module-level, no DOM bubble list or per-frame animation state was added, and gradients are limited to the existing bubble draw operations plus bounded family details. The next preview uses the same level-era mapping through compact CSS treatment rather than a large rectangular card; it is non-interactive.

### Targeted disappearance and next-level correction

The recorded behavior was traced to two separate boundaries. A terminal projectile is legitimately removed from the physics manager before the next frame; when its impact could not produce a valid snap, normal rendering therefore had no projectile and no board bubble to show. `GameplaySession` now carries the completed terminal projectile in the authoritative `TurnResult` when snap resolution explicitly fails, and `CanvasHost` retains that result as a presentation-only contact visual across redraws. The hold is cleared on the next accepted shot or level reload. Successful snap, match, and floating results still use the authoritative board, and no fallback coordinate or new gameplay rule was added.

The next-level empty-state risk was caused by `App` changing `activeLevel` while the existing `FoundationScreen`/`CanvasHost` session references remained mounted. The gameplay screen is now keyed by active level ID, forcing a clean session boundary for the next level. The new session constructs the populated board, Clear All mission progress, shot counter, shooter, projectile manager, and level-aware bubble source before presenting the level. The shared progression repository remains intact, so unlocks and best records are not lost.

The normal palette was also strengthened: base colors are more saturated, darker stops are cleaner, and white highlight/shell opacity is reduced. Blue, green, purple, red, and yellow remain immediately distinguishable while the five visual families retain their rendering-only identity.

### Critical projectile disappearance / ceiling snap correction

The actual runtime failure was at ceiling snap candidate selection, not projectile collision, wall bounce, color identity, board placement, or match resolution. `projectileStepper` produced a valid `ceiling` `ProjectileImpact`, but `getSnapCandidates` filtered every empty row-0 cell outside `1.5 * bubbleDiameter` of the exact ceiling contact. Shallow side shots and wall-bounced shots could contact the legal ceiling rail left or right of a narrow/centered formation, so the filter returned an empty candidate list and `resolveSnapAndPlace` returned `reason: 'no-valid-candidate'`. `GameplaySession` then entered its controlled `snap-failure` abort path. The projectile manager correctly cleared the completed physics projectile, while `LevelSession.requestFire` had already consumed the accepted shot, leaving unchanged board and mission state. This explains both the disappearance and the shot-count decrease.

The first fix removed the arbitrary ceiling-distance rejection. Interactive Level 6 play then established that this was insufficient: row 0 was full, the visible rail was wider than the logical formation, and an edge contact could also have no immediate empty neighbor. Reassigning such a shot inward did not make the entire visible upper rail genuinely playable.

The final owner-approved rule keeps normal priorities and adds a bounded supported-frontier fallback. Ceiling contact first ranks empty row-0 cells. Bubble contact first ranks empty immediate neighbors. If that local set is exhausted, the resolver considers only valid empty cells adjacent to at least one occupied cell. Ceiling fallback preserves horizontal lane, then prefers shallow row and geometric distance; blocked bubble fallback uses geometric distance and stable alignment/coordinate ties. Placement still occurs exactly once through `HexBoard.place`, followed by the existing match and floating resolvers. Isolated deep cells are never candidates, and no match, score, or mission result is fabricated.

The normal gameplay invariant is now explicit: an accepted normal shot resolves to authoritative board placement unless an intentionally implemented mechanic consumes it. There is no such destruction mechanic. A completely occupied logical board is the only normal geometry with no empty supported frontier; that condition remains an explicit `no-valid-candidate` failure rather than overwriting occupancy.

### Generated-level presentation and mission-safety correction

The accepted ceiling/snap correction was not changed. Generated configuration identity is now version 5 so the scalable Levels 16-10,000 cannot be confused with earlier content. The generation order is: difficulty profile -> template identity -> deterministic full-board fill -> color composition -> final starting board -> board analysis -> eligible mission/target -> effort-based shots -> validation.

Generated starting-bubble bands are now 59-110 for Levels 16-100, 76-140 for Levels 101-1000, 96-175 for Levels 1001-5000, and 116-200 for Levels 5001-10,000, always clamped to the 200-cell authoritative grid capacity. The selected template still supplies deterministic identity/anchor influence, but the playable generated board fills complete rows from the ceiling downward and uses only a centered final partial row when the target count lands mid-row. This produces the dense reference-style board while preserving readable round-bubble spacing.

`analyzeGeneratedBoard` records valid grid capacity, occupied count, occupied rows, upper-row occupancy, formation width/depth, largest central empty component, same-color cluster distribution, validated drop opportunity, and conservative score floor. Fullness is exactly `occupied cells / all valid grid cells from row 0 through the deepest occupied row`. Accepted candidates now require 92%-100% fullness, 100% occupancy across the first three rows, at least seven occupied/deep rows, width of at least 5.5 normalized columns, and only minimal central empty space from the final partial row.

Board templates and color compositions are independent. The deterministic composition registry contains `ORGANIC_CLUSTERS`, `WAVES`, `SPIRAL_FLOW`, `COLOR_RINGS`, `MIRRORED_WINGS`, `FLAME_FLOW`, `ZIGZAG_FLOW`, `DIAGONAL_FLOW`, `COLOR_CORE`, and `SPLIT_TONES`. Each style creates a board-scale flow phase, then bounded neighbor propagation forms organic local clusters while preventing connected same-color components above the accepted design bound. It uses only the existing normal BubbleColor palette and the seeded generator stream; no `Math.random`, new color, or match rule exists.

Generated mission configuration is derived after board analysis:

- `POP_COLOR` targets 62%-72% of the board's dominant eligible color and can never exceed finite target-color content. Direct and floating removals both count under the existing runtime, so complete logical removal satisfies the target.
- `CLEAR_MARKED` marks 4-8 deterministic existing cells and sets the target to the reachable marked count. Both approved removal paths continue to count marked bubbles.
- `REACH_SCORE` uses the conservative full-board floor `startingBubbleCount * 10`, which assumes every starting bubble earns only the lowest approved direct-removal value and excludes cascades, large-match bonuses, floating premiums, and completion bonus. Difficulty factors select 52%-72% of that floor.
- `DROP_BUBBLES` is eligible only when a single articulation traversal finds a detachable ceiling-supported region. With the new full generated board fill, DROP objectives are normally not selected unless analysis proves real detachable topology. This prevents the generator from promising a drop mission that the denser physical board does not actually support.
- `MISSION_SET` validates every objective separately, board-exhaustion feasibility, and combined effort against `shotLimit * 1.15`; incompatible sets are rejected.

Shot limits now estimate starting count, palette size, formation depth, average cluster size, support/drop topology, mission targets, objective count, and difficulty generosity. Generated limits remain clamped to 36-96, while curated onboarding limits span 36-92; early/recovery profiles receive the largest allowance so visual fullness does not create a Level-16 difficulty spike.

After each stable generated turn, `LevelSession` checks the defensive invariant. If `board.size === 0` while mandatory mission progress is incomplete, it records `EMPTY_BOARD_INCOMPLETE_MISSION` with level ID, mission definition, mission progress, starting count, and turn number, then stops in a non-winning state. Debug diagnostics expose it; the runtime never marks the mission complete or fabricates score/progress.

The 1,000-ID deterministic stratified sample used unique IDs from every requested range. It produced 0 failures, 67 bounded deterministic retries, maximum retry 3, bubble count 69-200 (average 134.391), intended-region density 92.24%-100% (average 96.76%), and shots 39-96 (average 70.599). Visual-family counts were Classic 186, Pearl 184, Crystal 195, Nebula 211, and Faceted 224. Every composition appeared (85-118 uses). Mission configurations were Clear All 193, Pop Color 410, Clear Marked 94, Reach Score 204, and Mission Set 99; every accepted mission passed content/exhaustion validation. No DROP mission was fabricated in the sample because the full-board topology did not expose a validated detachable region.

### Unified ceiling surface correction

The prior architecture implicitly treated `grid.origin.y - bubbleRadius` as the ceiling for the board while the projectile environment independently used `topY: 0`, so the visual board, trajectory preview, and physical ceiling could disagree. `GameplayLayout.boardCeilingY` is now the single physical ceiling surface. Its semantics are explicit:

- visible rail Y = `boardCeilingY`
- row-0 bubble center Y = `boardCeilingY + grid.bubbleRadius`
- projectile ceiling-contact center Y = `boardCeilingY + projectile.radius`

The same layout value drives grid origin, trajectory preview, projectile bounds, ceiling collision, ceiling snap candidates, and the Canvas rail. Ceiling contact still terminates the projectile and feeds the existing Phase 5 snap resolver; no second snap system was added. The rail is a restrained segmented violet/white glow with endpoint and center accents, rendered in Canvas rather than CSS so it cannot drift from physics.

## Targeted board, scale, spacing, and trajectory decisions

- Board bubbles render at the authoritative grid radius rather than `0.92` of it; projectile and shooter current bubble use the same radius, so visuals do not exceed collision geometry or jump scale after firing.
- Close-packed hex spacing remains `2 * radius` with the existing odd-row staggering and six-neighbor topology. Outer glow and rim are reduced enough that touching neighbors read as one connected formation rather than separated neon circles.
- The glossy renderer retains strong color identity, upper specular highlight, curved internal reflection, darker lower hemisphere, controlled rim, and restrained glow. Falling copies remain transient visual entities.
- Trajectory calculation is unchanged. Presentation now derives a bounded maximum of 40 deterministic dots at 30px spacing, with larger near-shooter dots, controlled fade, and a light variant of the current bubble's color; bounce segments remain represented.
- The shooter keeps a centered cradle and now uses a compact luminous tapered pointer with a white rim aligned to the authoritative aim direction. The detached oversized next card is reduced to a compact nearby `NEXT` bubble card.
- The deep navy/purple/magenta gameplay background is retained; no bright-blue theme replacement was made.

## Targeted early-level content correction

The previous deterministic two-column color helper was removed. After the dense-board review, Levels 1-15 now use deterministic dense row-filled formations with color lanes, waves, cores, and split-color illusions instead of sparse hanging silhouettes. No runtime random color noise or procedural generator replaced the curated content. Every level remains deterministic, uses only its approved normal-color band, preserves round normal-bubble silhouettes, and is validated against the authoritative six-neighbor topology.

The revised curated catalog is:

| Level | Starting bubbles | Shot limit | Design focus |
| ---: | ---: | ---: | --- |
| 1 | 59 | 36 | Round shield with simple three-color lanes |
| 2 | 64 | 40 | Full crown with friendly color pockets |
| 3 | 69 | 44 | Dense diagonal ribbons with easy matches |
| 4 | 74 | 48 | Rounded mass with color-core illusion |
| 5 | 79 | 52 | Dense wave bands with three-color clusters |
| 6 | 84 | 56 | Full upper board with side-color lanes |
| 7 | 89 | 60 | Four-color shield with split wings |
| 8 | 94 | 64 | Dense diagonal color ribbons |
| 9 | 99 | 68 | Full three-color board with broad waves |
| 10 | 104 | 72 | Broad crown with multiple color lanes |
| 11 | 109 | 76 | Dense split-color wings |
| 12 | 114 | 80 | Full layered arch with diagonal colors |
| 13 | 119 | 84 | Alternate color paths through a deep board |
| 14 | 124 | 88 | Full crown with split-color illusion |
| 15 | 129 | 92 | Final dense color-core board |

Levels 1-5 remain three-color and forgiving. Levels 6-10 use three or four colors with fuller lane and wave formations. Levels 11-15 use four colors and near-capacity boards. The structural validator checks non-empty valid coordinates, ceiling support, local same-color clusters, lower depth, dense top-row roots, broad lower contours, and a repeated two-column-band heuristic that rejects the old stripe pattern without rejecting ordinary local pairs.

All revised shot limits continue through the existing centralized star-threshold derivation. Validation confirms every threshold remains positive and strictly increasing; scoring formulas, mission completion semantics, and progression/save behavior were not changed.

### Floating-drop topology and density strategy

The approved Phase 7 resolver was not changed. Focused floating-drop regressions remain in place for one-cell necks, two-cell bridges, diagonal support chains, split branches, alternate support paths, mixed-color drops, and exact logical/falling-removal correspondence. The latest curated presentation intentionally prioritizes dense bubble-first boards for visual fullness; it does not disable or rewrite floating removal, but it no longer relies on large authored empty gaps as the main early-level visual shape.

Focused regression coverage now includes one-cell bridge removal, two-cell alternate-path preservation, diagonal branch removal, independent branches, mixed-color floating clusters, exact logical removal counts, and supported-bubble preservation.

Star thresholds continue to derive from each level's starting count and shot limit through the existing centralized formula. Validation and regression tests confirm every resulting threshold remains positive and strictly increasing; scoring formulas were not modified.

## Targeted fixed-shooter and natural aim correction

The prior interaction defect was event-boundary ownership, not a pointer assignment inside `ShooterState`: pointer move/up handlers had no active-pointer capture protocol, so a touch drag could stop updating when it left the Canvas and a release was not tied to one captured aiming gesture. `ShooterState` already derives the origin from the viewport and never moves it during aim; the correction preserves that ownership rule explicitly.

`AimPointerController` now allows exactly one active pointer. Canvas pointer-down begins only through the gameplay Canvas, captures that pointer, and updates aim relative to the fixed shooter origin. Pointer-move continuously updates the authoritative angle while captured (mouse hover remains supported), unrelated second pointers are ignored, pointer-cancel releases without firing, and pointer-up releases capture and requests exactly one shot. HUD, pause, and terminal overlays remain separate DOM layers above the Canvas and therefore cannot begin aiming.

The visual direction cue is drawn from the fixed shooter origin using `ShooterState.aimDirection`; the trajectory preview uses that same direction, and the projectile is spawned with the same accepted fire-request direction. No slingshot, drag-the-bubble, launcher translation, swapping, or new cannon mechanic was added.

The default projectile speed is now `600` logical units per second (previously `520`), giving touch shots a faster but still readable wall-bounce cadence without changing swept collision, bounce, or trajectory calculations.

The detached bottom-left star panel was removed from normal gameplay. Three threshold milestones now sit in a compact upper-HUD track beside the level/score/shots information. Stars remain display-only until the existing level-completion system awards them.

The HUD was then recomposed from equal stat cards into a two-row paired-column game hierarchy: Level sits above Pause in the first column, Star progress sits above Mission in the middle column, and Score sits above Shots in the right column. Mission objectives remain compact, readable, and inside the HUD rather than floating over the board. Authoritative score, shots, level, and mission data are unchanged; only the player-facing grouping and surfaces changed.

## Gameplay screen architecture

`FoundationScreen` remains the gameplay route surface but is now a player-facing composition: a full-bleed Canvas world, compact HUD, mission chips, star rail, next-bubble card, pause overlay, and WON/LOST overlays. `App` continues to own only Home/gameplay screen selection, the selected level, and the shared `ProgressionRepository`. The existing `HomeDashboard` and virtualized map remain unchanged.

`CanvasHost` forwards pointer input and lifecycle requests to `LevelSession`; it does not calculate matches, snaps, scores, missions, progression, or persistence. `LevelSession` remains authoritative for turn state and stable snapshots. `ProgressionRepository` remains authoritative for best results and unlocks.

## Debug separation

The normal player view no longer shows engine captions, coordinates, selectors, or development controls. `APP_CONFIG.development.showCanvasDiagnostics` is now enabled only in Vite development builds when the URL includes the explicit `?debug` query flag. The existing diagnostic renderer and controls remain available for engineering inspection without becoming part of the normal gameplay surface.

## Procedural background and asset-light strategy

`drawGameplayFrame` creates the deep navy/purple atmosphere with Canvas gradients, radial ambient glows, restrained sparkle marks, vignette shading, and a subtle playfield frame. CSS supplies responsive safe-area layout, translucent HUD surfaces, borders, shadows, and overlay depth. No screenshot is embedded as a background, no large raster collection was added, and the existing inline SVG `GameIcon` system is used instead of raw web-app icons.

## Board and bubble presentation

Occupied board cells are still read from the authoritative `HexBoard` and their centers from Phase 2 grid geometry. The renderer uses the shared authoritative radius, smooth same-color radial shading, one small specular highlight, a restrained lower contact rim, and a soft color-matched glow. Board-only glow and contact-rim opacity are deliberately reduced so touching bubbles do not cast heavy dark shadow bands or muddy the pure colors; shooter/projectile readability retains slightly stronger glow. Blue, green, purple, red, and yellow remain pure and immediately distinguishable. Marked bubbles retain their normal color and receive only an external luminous target ring; no new special-bubble behavior was introduced.

Falling visual copies are rendered as presentation entities supplied by the existing floating resolver. They do not affect board occupancy, scoring, collision, or mission state.

## Shooter, aiming, and projectile presentation

The shooter is rendered as a compact crescent/cradle, soft energy pool, and shared themed current bubble at the authoritative shooter origin. The current bubble remains owned by the Phase 3 shooter/session; the HUD shows only the next bubble descriptor in a small floating preview with the active level's visual-family treatment rather than a stat card. The aim preview uses the existing reflected `TrajectoryPreview`, rendered as fewer, wider-spaced, shrinking dots tinted to the current bubble's light color so it remains visually distinct from the active projectile. Active projectiles, terminal contact positions, and impact markers are drawn from the existing Phase 4 state/results. No projectile or trajectory rule was changed.

The targeted touch correction also routes every accepted pointer-move and final pointer-release aim update through the same normal gameplay render boundary used by the game loop. The fixed shooter cue and reflected dotted trajectory therefore update in the player-facing build, not only when `?debug` diagnostics are enabled. Release redraws the final accepted aim before starting the single projectile flight; React remains an input/render adapter and does not own aim or physics rules.

Normal gameplay no longer draws the hollow impact/contact ring. Raw impact markers, collision normals, snap candidate rings, selected cells, coordinate labels, and other diagnostics remain available only through the explicit development build plus `?debug` renderer.

## HUD and player feedback

The compact responsive HUD shows level, current run score, shots remaining, pause control, mission objective progress, and star-threshold progress. Internal mission enum names are mapped to player-facing labels (`Clear All`, `Pop`, `Drop Bubbles`, `Clear Targets`, and `Reach Score`). Completed objectives receive a distinct state treatment. Star rail progress is derived from the existing level star thresholds; earned completion stars and final score are shown in the terminal overlay.

Pause requests call the existing session pause/resume boundary and stop/restart the game loop without mutating progression. WON and LOST overlays expose only replay/retry, optional unlocked next-level navigation, and Home. Replay and retry use the existing controlled level reload path; completion records and best score/star values remain intact.

## Booster and future-feature decision

Booster controls were omitted from the player-facing Phase 15 HUD. The reference's booster-looking elements are visual direction only, and adding controls without approved booster behavior would imply unsupported functionality. Ranking, rewards, special bubbles, blockers, audio, backend, monetization, and other future features remain absent or disabled according to the phase rules.

## Responsive and performance behavior

The gameplay shell remains mobile-first with `100dvh`/safe-area handling, a bounded desktop presentation, touch-friendly pointer input, and CSS media-query adjustments for compact widths. Canvas drawing uses the measured logical viewport and existing DPR-capped backing store. Rendering is a single frame pass over authoritative occupied cells plus bounded transient visuals; no DOM bubble list or full-level content is mounted. No new animation loop, particle system, audio system, or Phase 16 transition system was added.

## Tests and commands run

| Command/check | Exact result |
| --- | --- |
| `npm.cmd run typecheck` | Passed with exit code 0 and no TypeScript diagnostics. |
| `npm.cmd run lint` | Passed with exit code 0 and zero warnings under `--max-warnings 0`. |
| `npm.cmd test -- --run` | Passed: 37 test files, 204 tests, 0 failures, including dense 200-cell curated boards, version-5 generated density bands, all color compositions, circular jewel-color family metadata, mission target feasibility, mission-set rejection, runtime invariant diagnostics, 1,000-level sampling, accepted snap behavior, shooter/physics/match/floating, score, progression, persistence, and map virtualization. |
| `npm.cmd run build` | Passed: Vite 8.1.4 transformed 78 modules; main JS was 296.87 kB / 90.50 kB gzip; CSS was 18.80 kB / 5.30 kB gzip. |
| Live Vite HTTP smoke | Passed: `/` returned HTTP 200 with the Bubble Shooter title; `CanvasHost.tsx` returned HTTP 200 with pointer capture and `boardCeilingY` wiring; `bubbleVisualTheme.ts` returned HTTP 200 with the approved family registry. |
| Phase-scope audit | Passed: no Phase 16 animation/particle/transition system, audio, booster, special-bubble, blocker, ranking, rewards, backend, monetization, or other later feature was found in authored source. |
| Interactive mobile gameplay | The in-app Browser runtime failed in this Windows sandbox with `CreateProcessWithLogonW failed: 2`, so the owner-authorized Playwright/installed Chrome fallback was used at 430x784. Level 1 rendered 59 round bubbles with 36 shots, and Level 10,000 rendered the full 200-cell round-bubble board with 83 shots. Screenshots showed the HUD-safe ceiling rail, full-width dense rows, shape-forming color composition, no clipping, and no framework overlay. |

## Results

- The normal gameplay screen is a polished game-like presentation rather than a technical debug shell.
- The starting-board cause is verified and corrected through an authoritative HUD-safe world layout; row-zero and representative-level bounds are covered by tests.
- Levels 1-15 now contain explicit dense authored formations with documented 59-129 bubble counts and shot limits; all starting bubbles are ceiling-supported and shape comes from color composition over round spheres.
- A visible Canvas ceiling rail, row-zero centers, trajectory ceiling, projectile ceiling collision, and Phase 5 ceiling snap now share one `boardCeilingY` surface.
- Floating reference topology tests cover bridge cuts, alternate support paths, mixed-color drops, and exact logical/falling-removal correspondence.
- Shooter origin remains fixed through aim changes, pointer capture protects natural drags, and pointer cancellation/secondary pointers cannot fire.
- The detached bottom star panel is removed and replaced by compact upper-HUD threshold progress.
- The HUD is composed as a two-row game hierarchy instead of three equal rectangular stat cards; score, level, shots, stars, and mission data remain authoritative.
- The HUD's final paired-column layout places Level/Pause, Stars/Mission, and Score/Shots in aligned vertical groups with mobile-safe padding; live 430x784 verification confirmed the objective remains legible and does not overlap the ceiling rail.
- Normal gameplay no longer shows the raw hollow impact/contact diagnostic marker.
- Code-generated background depth, five deterministic normal-bubble visual families, color differentiation, marked-bubble indication, shooter, aim guide, projectile, and impact visuals are integrated with authoritative state.
- Normal bubble geometry now uses an authoritative 10-18px range derived from `width / 24` and vertical fit, while keeping 11/10-column grid spacing, physics, snap, shooter, projectile, and falling visuals aligned.
- Levels 1-5 use simple `CLASSIC_GLOSS`; Levels 6-15 use richer `PEARL_GLASS`; generated level eras resolve deterministic `CRYSTAL_CORE`, `NEBULA_ENERGY`, and `FACETED_GEM` bands without changing gameplay behavior.
- Board bubble contacts now use restrained lower-rim depth and deterministic highlight variation, while the shooter cradle and next-bubble preview are visually lighter and less card-like.
- Next Level remounts a fresh populated session, and blocked snap-failure projectiles remain visibly held at terminal contact instead of silently disappearing; the hold is sourced from `TurnResult`, not a transient frame callback.
- The normal color palette is saturated and pure without a white wash; every board, shooter, projectile, falling, and preview bubble now uses the same smooth round-sphere renderer with no center-hole artifact.
- Board bubble contact depth and glow are restrained so the formation reads as clean connected spheres rather than candy-like bubbles with dark cast shadows; internal same-color shading still preserves roundness.
- Full row-zero and blocked edge contacts now fall back only to an empty ceiling-connected frontier cell; live Level 6 play confirmed both a matching edge shot and the following non-matching shot remain in the logical/visual game flow. Only a completely full logical board has no valid placement.
- Generated Levels 16-10,000 now use version-5 capacity-relative 59-200-bubble bands, 92-100% filled ceiling-down board regions, ten deterministic composition styles for shape illusion, round jewel-toned BubbleColor-dominant material families, board-derived mission targets, and defensive empty-board mission diagnostics.
- HUD, mission progress, score, shots, stars, pause, win/loss, replay, next-level, and Home behaviors remain connected to existing session/progression APIs.
- Debug-only controls are explicitly query-gated and separated from normal player presentation.
- Existing gameplay rules and progression behavior remain intact; no Phase 16 or later feature was implemented.
- No known critical Phase 15 issue remains within functional scope.

## Known issues

- The in-app Browser runtime remains blocked in this Windows sandbox, but owner-authorized local Playwright with installed Chrome completed rendered 430x784 checks for Levels 5, 14, 15, 16, 31, and 61. Cross-browser/device-matrix QA remains deferred to Phase 17.
- Visual polish is intentionally code-native and asset-light; exact raster/pixel matching is not claimed and can be refined during the approved visual/QA phases.
- The gameplay engine's terminal lock and turn behavior remain as previously approved; this phase does not add automatic turn progression or new gameplay rules.
- The project directory is not currently a Git worktree, so Git-based diff/status verification remains unavailable.
- Project-owner gameplay/visual approval of the corrected full-width behavior remains pending before Phase 16.

## Deferred work

- Phase 16 animation/illusion polish: layered parallax motion, path shimmer, shooter recoil/rotation, particles, camera response, and transition polish.
- Phase 17 hosted QA/performance matrix and Phase 18 senior review.
- Boosters, special bubbles, blockers, audio, ranking, rewards, backend/cloud sync, monetization, and all other future features.

## Confirmation that Phase 16 and later phases were not implemented

Confirmed. No Phase 16 animation system, particle system, audio, booster, special-bubble, blocker, ranking, rewards, backend, monetization, final map change, or other later feature was implemented or scaffolded. Work stops at the Phase 15 targeted-correction approval gate.
