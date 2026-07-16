# Phase 16 Report - Animation, game-feel, and living-space background polish

## Phase status

**PHASE:** Phase 16 - Animation/illusion polish  
**STATUS:** COMPLETE  
**APPROVAL NEEDED BEFORE NEXT PHASE:** Yes; Phase 17 has not started.

## Objective and boundaries

Phase 16 adds restrained, Bubble Shooter-appropriate presentation around the approved Phase 15 authorities. Animation consumes authoritative shot, projectile, wall-contact, turn, match, floating, score, mission, star, and terminal results; it never calculates placement, matching, falling, score, mission progress, BubbleColor, or win/loss. Phase 15 geometry, dense boards, colors, missions, shot balance, generation, progression, and snap rules remain unchanged; the follow-up mission-first HUD correction changes presentation grouping only. No audio, camera shake, WebGL, new raster artwork, balance work, or Phase 17 work was added.

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
- `src/components/GameIcon.tsx`
- `src/game/rendering/drawGameplayFrame.ts`
- `src/screens/gameplayPresentation.ts`
- `src/screens/gameplayPresentation.test.ts`
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
- Wall feedback uses the authoritative contact point, a brief directional squash on contact, rebound stretch, wall-aligned same-color ring flash, and 1-3 same-color sparks without screen shake. The reflected projectile remains the authoritative physics object.
- Ceiling contact pulses the existing rail at the authoritative contact location; rail geometry is not moved.
- Successful snap uses a brief visual settle and returns to scale 1 without changing grid centers, collision radius, or board occupancy.
- Authoritative match descriptors are copied for a short brightness/scale anticipation and distance-ordered pop propagation. Only the returned matched set is presented.
- Match-pop presentation now uses a staged premium sequence: a synchronized cluster pulse, distance-ordered anticipation, brief volume-preserving compression/expansion, an external same-color ring, a short color flash, and color-matched ray sparks plus bounded diamond fragments. The authoritative sphere remains smooth and round; no center hole, polygon, white explosion, or rainbow confetti is introduced. Normal matches stay light; larger matches receive bounded additional particles.
- Floating descriptors create a short detach emphasis before falling. Only authoritative removed floating bubbles fall; supported bubbles never do. Falling copies accelerate downward, use deterministic subtle drift, leave restrained trails, and expire below the viewport.
- Drop response scales by authoritative removed count through stronger pulse/trail intensity, with no combo text or score multiplier.
- Trajectory dots remain at exact predicted positions; only their BubbleColor-tinted brightness shimmers. The dot count remains capped at 40.
- Shooter idle energy breathes gently while waiting. The loaded bubble center, shooter origin, and aim ownership remain fixed.
- The rail retains a low-amplitude ambient shimmer, with contact pulses temporarily brighter.

## HUD feedback and transitions

The active hub keeps only the essential shot counter and pause control; final score and stars are presented after completion. Mission cards pulse only for changed authoritative objectives. Neither display mutates scoring, mission runtime, or progression. WON/LOST overlays wait approximately 240ms after the authoritative terminal transition so the final snap/pop/drop remains visible. WON presents Next Level and Home only; LOST presents Retry and Home. Restart and level changes clear terminal result state, trail, particles, falling copies, and entrance state.

The mission hub now supports two visual objective cards responsively: cards remain side-by-side at 430px, while narrow 260px verification stacks them into a controlled visible area without clipping the HUD or covering the ceiling rail.

## Follow-up mission-first HUD correction

The gameplay hub no longer displays Level, Score, or Star progress. Those results are reserved for the terminal completion popup, where the final level, authoritative score, and earned stars are shown together. Earned stars reveal sequentially with a short scale/glow entrance; reduced motion removes the decorative star transform while preserving the result.

Mission objectives now render as prominent bubble target cards rather than text-only chips. Each card uses the existing jewel-tone bubble treatment, a cohesive inline SVG action icon, a readable action label, and a countdown (`N left`) driven by authoritative `MissionObjectiveProgress.remaining`. Pop Color uses the target BubbleColor, marked targets receive an external ring, and Drop/Clear/Reach objectives use distinct bubble/icon pairings. One or two objectives remain independently visible and pulse only when authoritative progress changes.

The follow-up visual pass tightens the hub glass surface, reduces border/glow weight, aligns Pause and Shots into a compact top row, makes the numeric countdown dominant, adds a subtle conic progress ring around each mission bubble, and stacks cards cleanly on narrow screens.

## Board entrance and input gate

The existing authoritative board is revealed from the ceiling downward using row-banded alpha/offset/scale treatment over 520ms (180ms with reduced motion). Pointer-start is blocked during entrance and critical snap/pop/ceiling/wall presentation, while decorative particles may outlive the input gate. Pointer capture/cancel ownership remains in `AimPointerController`; no second gameplay state machine was added.

## Pause and reduced motion

Pause freezes recoil, trail ages, shimmer, rail pulses, particles, falling acceleration, score count-up, mission/star pulses, and board entrance at the same presentation time. `prefers-reduced-motion` shortens entrance, removes falling drift, reduces particles, and disables trajectory shimmer while preserving essential match/pop/fall communication. Home reduced-motion CSS disables ambient drift and current-node animation.

## Home ambient architecture

Home reuses exactly six existing decorative bubbles/orbs, two existing glow fields, and the existing sparkle layer. `homeAmbient.ts` supplies deterministic near/mid/far metadata with independent drift vectors, micro-rotation, scale breathing, and phase offsets; CSS transform/opacity animation creates slow 28-64 second zero-gravity drift, depth variation, glow breathing, and sparkle breathing. The redundant `Best stars 0/3` status line is removed; level nodes and the selected-level star treatment remain available where they provide context. The ambient wrapper and elements use `pointer-events: none`, remain behind the fixed HUD/map/navigation, create no objects per frame, and do not rerender or alter the virtualized level map. Reduced motion leaves the approved background composition static and calm.

## Tests and checks

| Check | Result |
| --- | --- |
| `npm.cmd run typecheck` | Passed with no TypeScript diagnostics. |
| `npm.cmd run lint` | Passed with zero warnings under `--max-warnings 0`. |
| `npm.cmd test -- --run` | Passed: 39 test files, 213 tests, 0 failures. |
| `npm.cmd run build` | Passed: Vite 8.1.4; JS 312.04 kB / 94.83 kB gzip; CSS 22.85 kB / 6.22 kB gzip. |
| Live HTTP | Vite returned HTTP 200. |
| Installed Chrome fallback | Passed at 430x784: Home ambient screen, Level 1 board entrance, and a real pointer shot. No gameplay console errors; one existing missing static resource returned 404. |

## Performance observations

- Maximum active particles: 320.
- Normal pop particle budget: 4 sparks plus 2 fragments per removed bubble; reduced motion uses 2 sparks plus 1 fragment, larger groups use up to 6 sparks, and the shared pool remains capped at 320 particles.
- Maximum projectile trail samples: 8.
- Wall-bounce accents are one short pooled effect per authoritative contact; repeated bounces use the existing bounded particle pool and never create DOM nodes.
- Maximum trajectory dots: 40.
- Board entrance duration: 520ms normal, 180ms reduced motion, independent of 59-200 board count through row-banded progress.
- Presentation event/effect, falling, trail, and particle storage are bounded; no per-effect timers or DOM particles were added.
- Home ambient element count: 6 existing bubbles; depth layers: 3; configured drift durations: 28s, 34s, 42s, 46s, 52s, 64s.
- Home animation uses CSS transforms/opacity and does not cause React/map rerenders.
- Production bundle increased from the Phase 15 baseline of 296.87 kB / 90.50 kB gzip JS to 306.99 kB / 93.56 kB gzip JS (+10.12 kB / +3.06 kB gzip); CSS increased from 18.80 kB / 5.30 kB gzip to 19.79 kB / 5.53 kB gzip.

## Mobile and Home QA

At 430x784, the Home Dashboard remained readable with slow ambient orb drift, fixed HUD/nav, and clickable Play. Level 1 showed the mission-first HUD with only Pause/Shots in the header, a visual Clear All bubble card, the HUD-safe ceiling rail, dense round-bubble board, fixed shooter, short trajectory dots, and smooth entrance. Real shallow-angle pointer shots decremented shots and placed the projectile through the existing authoritative flow. The Phase 15 Chrome matrix already covered Levels 5, 6, 16, 31, 61, and 10,000; Phase 16 changed only presentation around those same level authorities.

## Known issues

- The in-app Browser backend remains unavailable in this Windows sandbox; owner-authorized installed Chrome fallback was used for live rendered QA.
- The existing missing static resource produces a harmless 404 console warning during local smoke; no gameplay exception occurs.
- Cross-device hosted QA and profiling remain Phase 17 scope.

## Deferred work

- Phase 17 hosted QA/performance matrix and Phase 18 senior review.
- Audio, boosters, special bubbles, blockers, ranking, rewards, backend/cloud sync, monetization, and all later features.

## Confirmation

Phase 17 was not started. Phase 16 stops at the owner-review gate.
