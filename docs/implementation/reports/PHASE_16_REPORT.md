# Phase 16 Report - Animation, game-feel, and living-space background polish

## Phase status

**PHASE:** Phase 16 - Animation/illusion polish  
**STATUS:** COMPLETE  
**APPROVAL NEEDED BEFORE NEXT PHASE:** Yes; Phase 17 has not started.

## Objective and boundaries

Phase 16 adds restrained, Bubble Shooter-appropriate presentation around the approved Phase 15 authorities. Animation consumes authoritative shot, projectile, wall-contact, turn, match, floating, score, mission, star, and terminal results; it never calculates placement, matching, falling, score, mission progress, BubbleColor, or win/loss. Phase 15 geometry, dense boards, colors, HUD hierarchy, missions, shot balance, generation, progression, and snap rules remain unchanged. No audio, camera shake, WebGL, new raster artwork, balance work, or Phase 17 work was added.

## Sources reviewed

- Master Blueprint v1.0 PDF and approved gameplay/Home references.
- `CODEX_RULES.md`, `PHASE_TRACKER.md`, `PROJECT_STATUS.md`, `DECISIONS.md`, `CHANGELOG.md`.
- Phase 00 through Phase 15 reports and the complete approved Phase 15 implementation.
- Project-owner Phase 16 brief supplied with the task.

## Files created

- `src/game/presentation/gameplayPresentationTimeline.ts`
- `src/game/presentation/gameplayPresentationTimeline.test.ts`
- `src/screens/homeAmbient.ts`
- `src/screens/homeAmbient.test.ts`
- `docs/implementation/reports/PHASE_16_REPORT.md`

## Files modified

- `src/components/CanvasHost.tsx`
- `src/game/rendering/drawGameplayFrame.ts`
- `src/screens/FoundationScreen.tsx`
- `src/screens/HomeDashboard.tsx`
- `src/styles/global.css`
- `docs/implementation/PHASE_TRACKER.md`
- `docs/implementation/PROJECT_STATUS.md`
- `docs/implementation/DECISIONS.md`
- `docs/implementation/CHANGELOG.md`

## Presentation architecture and clock

`GameplayPresentationTimeline` is a single delta-time presentation clock driven beside the existing Canvas/game loop. It owns transient effects, an eight-sample projectile trail, a 320-entry particle pool, falling visual copies, board entrance progress, shooter recoil, rail pulse, and trajectory shimmer. Effects are bounded and reset on level reload. Pause stops clock advancement and the RAF is not requeued until resume. Variation is deterministic from level, turn, coordinate, color, wall, and effect index; `Math.random` is not used.

## Gameplay feel

- Shooter fire emits a restrained color-matched recoil/compression and glow while the shooter origin and loaded bubble remain fixed.
- The trail records real authoritative projectile positions, fades quickly, and is capped at eight samples; it does not draw a laser or shortcut wall-bounce path.
- Wall feedback uses the authoritative contact point, a short pulse, and 1-3 same-color sparks without screen shake.
- Ceiling contact pulses the existing rail at the authoritative contact location; rail geometry is not moved.
- Successful snap uses a brief visual settle and returns to scale 1 without changing grid centers, collision radius, or board occupancy.
- Authoritative match descriptors are copied for a short brightness/scale anticipation and distance-ordered pop propagation. Only the returned matched set is presented.
- Pop effects retain deep jewel-color identity (sapphire, emerald, amethyst, ruby, amber) with same-color sparks/fragments rather than white explosions or rainbow confetti. Normal matches stay light; larger matches receive bounded additional particles.
- Floating descriptors create a short detach emphasis before falling. Only authoritative removed floating bubbles fall; supported bubbles never do. Falling copies accelerate downward, use deterministic subtle drift, leave restrained trails, and expire below the viewport.
- Drop response scales by authoritative removed count through stronger pulse/trail intensity, with no combo text or score multiplier.
- Trajectory dots remain at exact predicted positions; only their BubbleColor-tinted brightness shimmers. The dot count remains capped at 40.
- Shooter idle energy breathes gently while waiting. The loaded bubble center, shooter origin, and aim ownership remain fixed.
- The rail retains a low-amplitude ambient shimmer, with contact pulses temporarily brighter.

## HUD feedback and transitions

Displayed score interpolates over approximately 320ms toward the immediate authoritative score; mission chips pulse only for changed authoritative objectives; star threshold feedback fires once per threshold per run and uses bounded gold sparks. Neither display mutates scoring, mission runtime, or progression. WON/LOST overlays wait approximately 240ms after the authoritative terminal transition so the final snap/pop/drop remains visible. Restart and level changes clear score display, threshold history, trail, particles, falling copies, and entrance state.

The mission hub now supports two objective chips responsively: objectives remain side-by-side at 430px, while narrow 260px verification wraps them into two visible lines without clipping the HUD or covering the ceiling rail.

## Board entrance and input gate

The existing authoritative board is revealed from the ceiling downward using row-banded alpha/offset/scale treatment over 520ms (180ms with reduced motion). Pointer-start is blocked during entrance and critical snap/pop/ceiling/wall presentation, while decorative particles may outlive the input gate. Pointer capture/cancel ownership remains in `AimPointerController`; no second gameplay state machine was added.

## Pause and reduced motion

Pause freezes recoil, trail ages, shimmer, rail pulses, particles, falling acceleration, score count-up, mission/star pulses, and board entrance at the same presentation time. `prefers-reduced-motion` shortens entrance, removes falling drift, reduces particles, and disables trajectory shimmer while preserving essential match/pop/fall communication. Home reduced-motion CSS disables ambient drift and current-node animation.

## Home ambient architecture

Home reuses exactly six existing decorative bubbles/orbs, two existing glow fields, and the existing sparkle layer. `homeAmbient.ts` supplies deterministic near/mid/far metadata; CSS transform/opacity animation creates slow 18-46 second zero-gravity drift, depth variation, glow breathing, and sparkle breathing. The ambient wrapper and elements use `pointer-events: none`, remain behind the fixed HUD/map/navigation, create no objects per frame, and do not rerender or alter the virtualized level map. Reduced motion leaves the approved background composition static and calm.

## Tests and checks

| Check | Result |
| --- | --- |
| `npm.cmd run typecheck` | Passed with no TypeScript diagnostics. |
| `npm.cmd run lint` | Passed with zero warnings under `--max-warnings 0`. |
| `npm.cmd test -- --run` | Passed: 39 test files, 211 tests, 0 failures. |
| `npm.cmd run build` | Passed: Vite 8.1.4; JS 306.99 kB / 93.56 kB gzip; CSS 19.79 kB / 5.53 kB gzip. |
| Live HTTP | Vite returned HTTP 200. |
| Installed Chrome fallback | Passed at 430x784: Home ambient screen, Level 1 board entrance, and a real pointer shot. No gameplay console errors; one existing missing static resource returned 404. |

## Performance observations

- Maximum active particles: 320.
- Normal pop particle budget: 3-4 sparks per removed bubble; larger groups use bounded 4-particle bursts and the shared pool.
- Maximum projectile trail samples: 8.
- Maximum trajectory dots: 40.
- Board entrance duration: 520ms normal, 180ms reduced motion, independent of 59-200 board count through row-banded progress.
- Presentation event/effect, falling, trail, and particle storage are bounded; no per-effect timers or DOM particles were added.
- Home ambient element count: 6 existing bubbles; depth layers: 3; configured drift durations: 18s, 22s, 29s, 34s, 38s, 46s.
- Home animation uses CSS transforms/opacity and does not cause React/map rerenders.
- Production bundle increased from the Phase 15 baseline of 296.87 kB / 90.50 kB gzip JS to 306.99 kB / 93.56 kB gzip JS (+10.12 kB / +3.06 kB gzip); CSS increased from 18.80 kB / 5.30 kB gzip to 19.79 kB / 5.53 kB gzip.

## Mobile and Home QA

At 430x784, the Home Dashboard remained readable with slow ambient orb drift, fixed HUD/nav, and clickable Play. Level 1 showed the HUD-safe ceiling rail, dense round-bubble board, fixed shooter, short trajectory dots, and smooth entrance. A real shot decremented shots and placed the projectile/bubble through the existing authoritative flow; delayed screenshots showed no disappearing-shot regression, clipping, or overlay. The Phase 15 Chrome matrix already covered Levels 5, 6, 16, 31, 61, and 10,000; Phase 16 changed only presentation around those same level authorities.

## Known issues

- The in-app Browser backend remains unavailable in this Windows sandbox; owner-authorized installed Chrome fallback was used for live rendered QA.
- The existing missing static resource produces a harmless 404 console warning during local smoke; no gameplay exception occurs.
- Cross-device hosted QA and profiling remain Phase 17 scope.

## Deferred work

- Phase 17 hosted QA/performance matrix and Phase 18 senior review.
- Audio, boosters, special bubbles, blockers, ranking, rewards, backend/cloud sync, monetization, and all later features.

## Confirmation

Phase 17 was not started. Phase 16 stops at the owner-review gate.
