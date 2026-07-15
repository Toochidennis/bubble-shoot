# Phase 04 Report - Projectile physics

## Phase status

**PHASE:** Phase 4 - Projectile physics  
**STATUS:** COMPLETE  
**APPROVAL NEEDED BEFORE NEXT PHASE:** Yes

## Objective

Implement the complete single-projectile motion foundation: projectile state and ownership, spawning from the approved Phase 3 fire boundary, frame-independent movement, continuous wall/ceiling/occupied-bubble collision protection, actual side-wall reflection, deterministic earliest-impact results, and development-only visualization. Snap-to-grid and all later resolution systems remain out of scope.

## Source-of-truth files reviewed

- `docs/Bubble_Shooter_HTML5_Game_Master_Blueprint_v1.0.pdf` - all 23 pages.
- `home-dashboard.png` - visual direction only.
- `approved-gameplay-ui.png` - visual direction only.
- `docs/implementation/CODEX_RULES.md`.
- `docs/implementation/PHASE_TRACKER.md`.
- `docs/implementation/PROJECT_STATUS.md`.
- `docs/implementation/DECISIONS.md`.
- `docs/implementation/CHANGELOG.md`.
- `docs/implementation/reports/PHASE_00_REPORT.md`.
- `docs/implementation/reports/PHASE_01_REPORT.md`.
- `docs/implementation/reports/PHASE_02_REPORT.md`.
- `docs/implementation/reports/PHASE_03_REPORT.md`.
- Project-owner Phase 4 approval and implementation instruction from the attached pasted text.

The PDF was text-reviewed across all 23 pages with `pypdf`; both approved PNG references were visually inspected. No source-of-truth conflict or blueprint override was discovered.

## Files created

- `src/game/physics/types.ts`
- `src/game/physics/physicsConfig.ts`
- `src/game/physics/collisionGeometry.ts`
- `src/game/physics/collisionQueries.ts`
- `src/game/physics/projectileStepper.ts`
- `src/game/physics/ProjectileManager.ts`
- `src/game/physics/projectilePhysics.test.ts`
- `docs/implementation/reports/PHASE_04_REPORT.md`

## Files modified

- `src/components/CanvasHost.tsx`
- `src/game/rendering/drawShooterDebug.ts`
- `docs/implementation/PHASE_TRACKER.md`
- `docs/implementation/PROJECT_STATUS.md`
- `docs/implementation/DECISIONS.md`
- `docs/implementation/CHANGELOG.md`

The blueprint PDF and approved reference images were not modified.

## Projectile model

`ProjectileState` is React-independent and contains a stable identifier, inherited `BubbleDescriptor`, logical position, normalized direction, speed, radius, travel distance, elapsed lifetime, and active/completed status. `createProjectile` validates the muzzle origin and rejects non-upward directions. The default radius is centralized at 14 logical pixels, matching the Phase 2 diagnostic grid radius.

## Projectile ownership model

`ProjectileManager` owns zero or one active projectile. It rejects a second spawn while active, retains one explicit terminal `ProjectileImpact`, and rejects another spawn while that completion result remains pending. It never creates a queue and never unlocks the shooter or starts a later turn automatically.

## Fire integration

Canvas Pointer Events continue to update Phase 3 aiming. A deliberate `pointerup` gesture requests fire exactly once, passes the accepted Phase 3 bubble and direction to `ProjectileManager`, and starts the existing `GameLoop`. Pointer-down and pointer-move only aim; they do not fire. The shooter remains locked for the active flight and after terminal completion.

## Motion integration approach

`stepProjectile` advances by `direction * speed * deltaSeconds`, with elapsed time capped by `maxDeltaSeconds` for large-frame protection. The existing `GameLoop` already caps browser frame deltas at 50 ms; pure step tests also verify deterministic equivalent travel across 100 ms, two 50 ms steps, and ten 10 ms steps.

## Side-wall bounce approach

The playable centerline boundaries are `leftWallX + radius` and `rightWallX - radius`. Analytic distance-to-wall queries find the earliest side-wall event. The horizontal direction component is inverted, the vertical component is preserved, and the remaining distance in the same physics step is integrated after the bounce. High-speed tests verify the center never escapes the legal bounds.

## Anti-tunneling approach

The implementation uses continuous swept distance calculations rather than final-position overlap checks. Circle intersections solve the quadratic ray/circle equation for the earliest valid contact against each occupied bubble. Wall and ceiling candidates are solved analytically over the same segment. A deterministic maximum collision-iteration limit emits a `safety-limit` impact instead of allowing an infinite bounce loop.

## Ceiling-collision approach

The ceiling centerline is `topY + projectile.radius`. Direct and angled upward paths terminate at the earliest ceiling contact with an explicit `ceiling` impact, upward normal, contact position, and direction. No snap cell is selected.

## Existing-bubble collision approach

`getOccupiedBubbleColliders` derives temporary collision representations from `HexBoard<BubbleDescriptor>` occupied cells and their authoritative world-space centers. The development board uses three fixed, deterministic occupied cells solely for diagnostics. Circle contact uses the projectile radius plus collider radius and returns the impacted grid coordinate, bubble center, bubble descriptor, contact position, direction, and normal. Board occupancy is never changed by physics.

## Collision ordering and tie-breaking

All wall, ceiling, and occupied-bubble candidates in the remaining movement segment are collected and sorted by distance. Practically simultaneous candidates use deterministic priority: bubble, ceiling, left wall, right wall. Terminal impacts stop the step immediately; wall impacts reflect and continue. The bounded iteration safeguard prevents loops and double terminal results.

## Impact result model

`ProjectileImpact` distinguishes `ceiling`, `bubble`, and bounded `safety-limit` outcomes. It includes final/contact position, direction at impact, normal, and optional impacted coordinate, bubble center, and bubble descriptor. It deliberately contains no snap coordinate and does not mutate board occupancy.

## Development visualization

The temporary Canvas diagnostic now shows the Phase 2 grid, deterministic occupied debug bubbles, the Phase 3 shooter and predicted trajectory, the actual moving projectile, actual wall-bounce motion, terminal impact marker, impact type, and lock/flight status. The predicted path is dimmed while actual flight is active so the two remain distinguishable. No final bubble art, HUD, particles, background, or gameplay polish was added.

## Tests and commands run

| Command/check | Exact result |
| --- | --- |
| `npm.cmd run typecheck` | Passed with exit code 0 and no TypeScript diagnostics. |
| `npm.cmd run lint` | Passed with exit code 0 and zero warnings under `--max-warnings 0`. |
| `npm.cmd test -- --run` | Passed: 9 test files, 57 tests, 0 failures. |
| `npm.cmd run build` | Passed: Vite 8.1.4 transformed 39 modules and emitted production output; main JS was 212.96 kB / 67.04 kB gzip. |
| Live Vite HTTP smoke | Passed: `/` returned HTTP 200 and contained the Bubble Shooter title; `/src/components/CanvasHost.tsx` returned HTTP 200 and contained `ProjectileManager` and `onPointerUp` fire wiring. |
| Phase-scope audit | Passed: no Phase 5 snap system or later gameplay system was found in authored Phase 4 source. |

Browser-driven DOM, pointer, console, viewport, and screenshot QA was attempted through the installed Browser capability. Browser discovery returned no available backends (`agent.browsers.list()` returned `[]`), so no browser screenshot or interaction claim is made. No Playwright dependency was added solely for this phase.

## Results

- Exactly zero or one active projectile is enforced.
- Motion is delta-time based and tested for frame-rate equivalence.
- Radius-aware wall reflection, ceiling contact, occupied-bubble contact, earliest-impact ordering, remaining-step continuation, and anti-tunneling are implemented and covered.
- Fire integration is deliberate and single-shot through pointer release.
- Terminal impact results are explicit and retained; no snap coordinate or occupancy mutation exists.
- No known critical Phase 4 issue remains within scope.

## Known issues

- Browser visual and interaction QA remains unavailable because no Browser backend is provisioned.
- The development board occupancy is intentionally fixed diagnostic data, not a level system.
- The terminal shooter lock remains locked after impact because turn reset belongs to later approved lifecycle work.
- The project directory still has no Git repository metadata, so Git-based diff/status verification is unavailable.

## Deferred work

- Phase 5 deterministic snap-to-grid candidate selection and board placement.
- Phase 6 matching, Phase 7 floating-bubble resolution, and Phase 8 full turn lifecycle.
- Missions, levels, score, stars, persistence, final Home/Gameplay UI, animation polish, and all future features.

## Confirmation that Phase 5 and later phases were not implemented

Confirmed. No snap coordinate, snap resolver, board placement after impact, matching, popping, floating-bubble dropping, mission, level, score, persistence, navigation, backend, monetization, booster, or final visual feature was implemented. Work stops at the Phase 4 approval gate.
