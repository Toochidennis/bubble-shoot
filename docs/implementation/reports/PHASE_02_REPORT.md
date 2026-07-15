# Phase 02 Report - Hex grid system

## Phase status

**PHASE:** Phase 2 - Hex grid system  
**STATUS:** COMPLETE  
**APPROVAL NEEDED BEFORE NEXT PHASE:** Yes

## Objective

Implement the independent logical foundation for a staggered hexagonal Bubble Shooter board: stable coordinates, centralized geometry, bounds, six-neighbor lookup, generic occupancy, top-row traversal APIs, and a neutral development-only Canvas diagnostic. Do not implement shooting, input, physics, snapping, matching, missions, levels, or any later phase.

## Source-of-truth files reviewed

- `docs/Bubble_Shooter_HTML5_Game_Master_Blueprint_v1.0.pdf` - all 23 pages.
- `home-dashboard.png` - reviewed as visual direction only.
- `approved-gameplay-ui.png` - reviewed as visual direction only.
- `docs/implementation/CODEX_RULES.md`.
- `docs/implementation/PHASE_TRACKER.md`.
- `docs/implementation/PROJECT_STATUS.md`.
- `docs/implementation/DECISIONS.md`.
- `docs/implementation/CHANGELOG.md`.
- `docs/implementation/reports/PHASE_00_REPORT.md`.
- `docs/implementation/reports/PHASE_01_REPORT.md`.
- Project-owner Phase 2 approval and implementation instruction from the attached pasted text.

## Files created

- `src/game/grid/types.ts`
- `src/game/grid/gridConfig.ts`
- `src/game/grid/coordinates.ts`
- `src/game/grid/neighbors.ts`
- `src/game/grid/HexBoard.ts`
- `src/game/grid/hexGrid.test.ts`
- `src/game/rendering/drawHexGridDebug.ts`
- `docs/implementation/reports/PHASE_02_REPORT.md`

## Files modified

- `src/components/CanvasHost.tsx` - wires the development debug renderer to the logical board model.
- `docs/implementation/PHASE_TRACKER.md`
- `docs/implementation/PROJECT_STATUS.md`
- `docs/implementation/DECISIONS.md`
- `docs/implementation/CHANGELOG.md`

The blueprint PDF, both approved visual references, and all Phase 1 source behavior outside the Canvas debug integration were preserved.

## Chosen grid coordinate convention

- Logical coordinates are `{ row, column }` with zero-based integers.
- Row 0 is the ceiling/top row.
- Rows increase downward; columns increase left-to-right.
- Stable keys use the form `row:column`, for example `2:4`.
- Row 0 is unshifted. Odd rows are offset right by one bubble radius.
- Even rows contain 7 columns and odd rows contain 6 columns in the default diagnostic board.
- The configuration accepts row-specific even/odd widths so bounds remain explicit and future level data can provide other validated dimensions.

## Staggered-row convention

The chosen convention is **odd rows offset right**. For an even, unshifted row at column `c`, diagonals in adjacent odd rows are `c-1` and `c`. For an odd, offset row at column `c`, diagonals in adjacent even rows are `c` and `c+1`. Horizontal neighbors are always `c-1` and `c+1` when valid.

Neighbor order is deterministic: left, right, up-left, up-right, down-left, down-right, with invalid and duplicate coordinates removed.

## Grid geometry and spacing approach

All geometry is centralized in `HexGridConfig`; no renderer or screen owns grid constants.

- `bubbleRadius` is the base radius.
- `bubbleDiameter = bubbleRadius * 2`.
- `horizontalSpacing = bubbleDiameter`.
- `rowOffset = bubbleRadius` (half the diameter).
- `verticalSpacing = sqrt(3) * bubbleRadius` for close-packed staggered rows.
- `origin` is the world-space center of row 0, column 0.
- `rowCount`, `evenRowWidth`, and `oddRowWidth` define logical board bounds.

The default development board is 12 rows, alternating widths 7 and 6, with radius 14, origin `(28,24)`, and no occupancy payloads.

## Grid-to-world approach

`getCellCenter(config, coordinate)` validates the coordinate, applies the row parity offset, and returns the derived world-space center. The logical coordinate remains authoritative; world-space positions are always derived.

`worldToNearestCell` is included as a deterministic coordinate utility for later pointer/debug selection support. It samples nearby rows and columns, rejects out-of-bounds candidates, and uses distance followed by row/column ordering as its tie-break.

## Neighbor mapping

`getNeighborCoordinates` is centralized in `src/game/grid/neighbors.ts`. It handles interior, top, bottom, left-edge, and right-edge cases by filtering every candidate through the configured row-specific bounds. It returns no invalid coordinates and no duplicates. `HexBoard` exposes traversal-friendly neighbor and neighbor-cell APIs without implementing any resolver or flood fill.

## Occupancy model

`HexBoard<T>` owns a `Map<string, T>` keyed by stable coordinate keys. The payload is generic and intentionally not a Bubble entity. It provides:

- valid-coordinate checks and row-width queries
- empty/occupied queries
- generic payload retrieval
- placement with overwrite protection
- removal with controlled results
- deterministic valid-cell and occupied-cell iteration
- neighbor-cell inspection
- occupied top-row enumeration

Invalid reads throw an explicit range error. Invalid placement/removal return `{ ok: false, reason: 'invalid-coordinate' }`. Placement into an occupied cell returns `{ ok: false, reason: 'occupied' }` and preserves the original payload.

## Board-boundary rules

- Valid rows are `0 <= row < rowCount`.
- Valid columns are `0 <= column < evenRowWidth` on even rows and `0 <= column < oddRowWidth` on odd rows.
- Negative, fractional, unsafe-integer, out-of-range rows, and row-incompatible columns are invalid.
- Boundary behavior is deterministic and centralized in `isValidCoordinate`/`assertValidCoordinate`.
- No invalid coordinate can enter the occupancy map.

## Top-row foundation

- `HexBoard.isTopRow` identifies row 0 after validation.
- `HexBoard.getOccupiedTopRowCells` returns occupied row-0 cells in deterministic row/column order.
- `HexBoard.getNeighbors` and `getNeighborCells` provide traversal-friendly neighbor APIs.

Unsupported-cluster detection, floating-bubble traversal, and resolver behavior were not implemented.

## Debug visualization implemented

The existing development Canvas host now consumes a `HexBoard` and renders a deliberately neutral diagnostic frame when the Phase 1 development diagnostic flag is enabled:

- outlines every valid cell
- labels each cell with `row,column`
- shows the alternating row alignment and configured bounds
- highlights a defined selected cell `(0,0)`
- distinguishes that cell's valid neighbors
- displays the configured row count and selected coordinate

The renderer reads `GridCell` centers and neighbor results from the model. It does not define grid geometry, render bubble art, add final visual styling, accept pointer aiming, or create gameplay state.

## Tests and commands run

| Command/check | Exact result |
| --- | --- |
| `npm.cmd run typecheck` | Passed with exit code 0 and no TypeScript diagnostics. |
| `npm.cmd run lint` | Passed with exit code 0 and zero warnings under `--max-warnings 0`. |
| `npm.cmd test` | Passed: 4 test files, 21 tests, 0 failures. |
| `npm.cmd run build` | Passed: Vite 8.1.4 transformed 27 modules and emitted production output; main JS was 197.93 kB / 62.62 kB gzip. |
| Live Vite HTTP smoke | Passed: `/` returned HTTP 200 with the Bubble Shooter title; `src/components/CanvasHost.tsx` returned HTTP 200 and contained both the debug renderer and default grid configuration wiring. |
| Phase-scope audit | Passed: no Phase 3+ gameplay system was found in authored source/configuration. Product-name occurrences of “Bubble Shooter” are not feature implementations. |

The first post-implementation typecheck caught four strict indexed-array errors in the neighbor mapping. The mapping was rewritten with explicit scalar diagonal columns; the final typecheck, lint, tests, and build all passed.

## Results

- Coordinates, centers, bounds, row widths, and neighbor mappings are deterministic and independently tested.
- Generic occupancy is authoritative and rejects invalid or accidental-overwrite mutations.
- Top-row APIs are available for future ceiling traversal.
- The development-only Canvas diagnostic is wired to the model and serves successfully.
- No known critical Phase 2 issue remains.
- Phase 2 acceptance criteria are satisfied.

## Known issues

- Browser-driven DOM, console, interaction, viewport, and screenshot QA could not run because the installed in-app Browser capability reported no available browser backend. The live Vite HTTP smoke check passed. Playwright was not installed solely for this phase.
- Debug selected-cell inspection is defined as fixed cell `(0,0)`; pointer-based selection belongs with a later approved input phase.
- The project directory still has no Git repository metadata, so Git-based diff/status verification is unavailable.

## Deferred work

- Phase 3 shooter and aiming input.
- Projectile movement, wall bounce, collision, snapping, match resolution, floating-bubble resolution, and turn-state additions.
- Missions, levels, progression, generation, scoring, persistence, and final visual systems.
- Pointer-driven debug cell selection and E2E/browser-matrix testing until an approved phase requires them.

## Confirmation that Phase 3 and later phases were not implemented

Confirmed. No shooter, current/next bubble, aiming input, trajectory, projectile, wall bounce, collision, snap resolution, match detection, bubble pop/drop, mission, level, score, star, persistence, navigation, future feature, or final gameplay visual functionality was implemented or scaffolded. Work stopped at the Phase 2 approval gate.
