# Phase 14 Report - Home Dashboard, virtualized 10,000-level map, and Quick Play

## Phase status

**PHASE:** Phase 14 - Home Dashboard + virtualized 10,000-level map  
**STATUS:** COMPLETE  
**APPROVAL NEEDED BEFORE NEXT PHASE:** Yes

## Objective

Implement the approved game-like Home Dashboard as the initial screen and main level map. The implementation adds a procedural navy/purple game-world background, fixed HUD and bottom navigation, deterministic winding level layout, bounded virtualization, progression-aware node states, level selection, Quick Play/Continue, and a lightweight Home-to-existing-gameplay screen transition. Phase 15 gameplay visual integration and later features remain out of scope.

## Source-of-truth documents reviewed

- `docs/Bubble_Shooter_HTML5_Game_Master_Blueprint_v1.0.pdf` - all 23 pages, functional and architectural authority.
- `home-dashboard.png` - primary approved visual reference for this phase; visually inspected.
- `approved-gameplay-ui.png` - reserved visual reference for Phase 15; visually inspected but not implemented.
- `docs/implementation/CODEX_RULES.md`.
- `docs/implementation/PHASE_TRACKER.md`.
- `docs/implementation/PROJECT_STATUS.md`.
- `docs/implementation/DECISIONS.md`.
- `docs/implementation/CHANGELOG.md`.
- `docs/implementation/reports/PHASE_00_REPORT.md` through `PHASE_13_REPORT.md`.
- Project-owner Phase 14 implementation instruction.

No source-of-truth conflict or blueprint override was discovered.

## Files created

- `src/game/map/mapLayout.ts`
- `src/game/map/mapLayout.test.ts`
- `src/game/map/progressionView.ts`
- `src/game/map/progressionView.test.ts`
- `src/screens/HomeDashboard.tsx`
- `src/components/GameIcon.tsx`
- `docs/implementation/reports/PHASE_14_REPORT.md`

## Files modified

- `src/app/App.tsx`
- `src/components/CanvasHost.tsx`
- `src/screens/FoundationScreen.tsx`
- `src/styles/global.css`
- `docs/implementation/PHASE_TRACKER.md`
- `docs/implementation/PROJECT_STATUS.md`
- `docs/implementation/DECISIONS.md`
- `docs/implementation/CHANGELOG.md`

## Home Dashboard architecture

`App` now owns a minimal screen state (`home` or `gameplay`), one shared `ProgressionRepository`, and the selected active level. `HomeDashboard` observes progression summaries and launches only unlocked IDs. `FoundationScreen` and `CanvasHost` remain the existing gameplay surface and receive the selected level ID without changing engine authority. Returning Home preserves the repository and does not erase saved progression.

## Background and asset-light strategy

The dashboard recreates the approved deep navy/purple atmosphere with CSS linear/radial gradients, blurred ambient glows, procedural DOM bubble circles, sparkle dots, translucent borders, layered shadows, and safe-area-aware surfaces. The approved reference image is not embedded as a full-screen background. No raster assets or icon library were added; the phase intentionally uses code-generated CSS/vector-like motifs to satisfy the asset-light requirement.

## Fixed top HUD

The top HUD remains fixed while the map scrolls. It shows a code-native Bubble Shooter mark, real highest-unlocked progression, the supported cap, and a visually integrated disabled settings control. It does not fabricate hearts, currencies, energy, rewards, or backend identity data that are not authorized in this phase.

## Fixed bottom navigation and disabled tabs

The bottom navigation is fixed with Home, Map, center shooter-style Play, Ranking, and Rewards. Home and Map remain the same dashboard context. Ranking and Rewards are semantically disabled buttons with no navigation, mutation, or placeholder backend behavior. The center action is the only future-looking control that is functional.

## Quick Play / Continue

Quick Play calls the existing progression repository, clamps to the supported cap, and launches the highest unlocked playable level. The selected-level Play/Replay action uses the same unlocked-level guard. Locked nodes cannot launch; completed nodes remain replayable; Level 10,001 cannot be selected or launched.

## Level-node states and selection

The map exposes completed, current, unlocked-but-incomplete, and locked states through distinct gradients, borders, shadows, lock treatment, stars, and current-node emphasis. Saved best stars come directly from completion records. Selecting an unlocked node updates the selected level and the prominent play action; locked nodes are disabled. Current and completed states remain visually distinct without relying solely on hue.

## Map-layout algorithm

`getMapNodeLayout(levelId)` derives a stable vertical position from a configurable 118px stride and a repeating eight-step horizontal wave. The wave is normalized and bounded, producing an organic left/right winding path without consulting preceding nodes or mounting prior content. The content height is computed as `cap * stride + padding`, so Level 10,000 is addressable without 10,000 authored definitions.

## Virtualization strategy and maximum mounted nodes

`getVisibleLevelRange(scrollTop, viewportHeight, config, overscan)` calculates a bounded ID window directly from scroll position, stride, and five-node overscan. `HomeDashboard` creates only that window's buttons and local path segments. At the tested 640px viewport this is approximately 10-16 nodes, not 10,000. The map has one scrollable world-height element for native scrolling but no all-level node array, no eager `getLevel()` calls, and no full generated-level construction while scrolling.

## Path-rendering strategy

The winding path is rendered as a bounded SVG containing only visible/overscan curve segments. Its local viewBox and top offset are recomputed from the visible window, so there is no giant 10,000-segment SVG. Node coordinates and path control points share the same deterministic layout function, preventing drift around the visible window.

## Current-level focus and scroll behavior

On first meaningful dashboard load, the map scrolls to a computed position near the highest unlocked level. A ref guard prevents repeated automatic recentering after manual scrolling. Native touch, mouse, and trackpad scrolling remain available inside the map viewport, with smooth scrolling for Home/focus actions and reduced-motion overrides.

## Progression integration and level launch

The dashboard reads only `highestUnlockedLevel` and compact completion records from the existing repository. It never calls `getLevel()` for map rendering. Full level access and generation occur only when the selected level enters the existing gameplay screen. Current save records, best stars, generated-level determinism, mission state, scoring, and persistence remain in their prior authorities.

## Icon/vector decisions

No icon dependency was added. Small decorative marks and controls are implemented as restrained text/CSS motifs inside custom game-styled containers because this phase does not require a broad icon system. No raw web-app icon grid or unstyled library glyphs were introduced. A later visual phase may replace these motifs with approved vector art without changing behavior.

## Motion and illusion techniques

Ambient bubbles drift slowly, glows provide depth, the current node pulses, selected nodes scale with focus feedback, and Home/focus scrolling is smooth. `prefers-reduced-motion` disables ambient/node animation and changes scrolling to non-smooth behavior. Full particle, transition, camera, and gameplay animation polish remains deferred to Phase 16.

## Responsive behavior

The dashboard is mobile-first, portrait-oriented, safe-area aware, and bounded to a centered desktop presentation. CSS `clamp()` sizing, percentage-based node offsets, responsive HUD/nav spacing, native scrolling, and a reduced-motion media query support narrow and tall screens as well as desktop widths. Fixed HUD and bottom navigation never participate in map scrolling.

## Tests and commands run

| Command/check | Exact result |
| --- | --- |
| `npm.cmd run typecheck` | Passed with exit code 0 and no TypeScript diagnostics. |
| `npm.cmd run lint` | Passed with exit code 0 and zero warnings under `--max-warnings 0`. |
| `npm.cmd test -- --run` | Passed: 27 test files, 151 tests, 0 failures. |
| `npm.cmd run build` | Passed: Vite 8.1.4 transformed 70 modules; main JS was 270.09 kB / 82.40 kB gzip. |
| Live Vite HTTP smoke | Passed: `/` returned HTTP 200; `HomeDashboard.tsx` returned HTTP 200 and contained visible-range virtualization and disabled navigation wiring. |
| Phase-scope audit | Passed: no Phase 15 gameplay visual integration, final bubble art, gameplay HUD redesign, audio, or later feature implementation exists in authored source. |
| Browser availability | Browser setup and discovery were attempted through the required Browser skill; no browser backend was available (`[]`). No screenshot or pixel-level visual approval claim is made. |

## Results

- Home is now the initial app screen and feels like a game-world surface rather than an admin/dashboard application.
- Fixed HUD and bottom navigation remain outside the scrolling map world.
- Levels 1-10,000 are addressable through deterministic arithmetic layout, while only a bounded visible/overscan window mounts.
- Completed/current/unlocked/locked states, saved stars, selection, and Quick Play use real progression data.
- Ranking and Rewards are visible but disabled and nonfunctional.
- Full level generation is deferred until launch; map scrolling does not eagerly generate levels.
- Existing gameplay remains available and returns to Home without corrupting progression.
- No known critical Phase 14 issue remains within functional scope.

## Known issues

- Browser visual QA could not run because no Browser backend is provisioned. The accepted `home-dashboard.png` was inspected with `view_image`, but a rendered implementation screenshot could not be captured in this environment.
- Decorative controls use lightweight CSS/text motifs rather than a new icon dependency; this is an intentional asset-light Phase 14 choice and can be refined during the later visual phase.
- The existing gameplay screen is still a development presentation by explicit scope; gameplay visual integration belongs to Phase 15.
- The project directory is not currently a Git worktree, so Git-based diff/status verification is unavailable.

## Deferred work

- Phase 15 gameplay visual integration using `approved-gameplay-ui.png`.
- Phase 16 full animation/particle/transition polish and Phase 17 hosted QA.
- Ranking, Rewards, settings functionality, audio, backend, cloud accounts, monetization, boosters, blockers, special bubbles, and all other future features.

## Confirmation that Phase 15 and later phases were not implemented

Confirmed. No final gameplay background, glossy Canvas bubble rendering, final shooter art, gameplay HUD redesign, mission HUD redesign, audio, ranking, rewards, shop, events, boosters, special bubbles, blockers, backend, cloud save, monetization, or other Phase 15+ functionality was implemented or scaffolded. Work stops at the Phase 14 approval gate.
