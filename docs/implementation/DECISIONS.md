# Decisions

This log records meaningful architectural, product, scope, and source-control decisions. Later approved instructions that override the blueprint must be recorded here and in `CHANGELOG.md` before implementation.

## DEC-0001 - Source artifacts and authority

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Treat `docs/Bubble_Shooter_HTML5_Game_Master_Blueprint_v1.0.pdf` as the primary functional, architectural, gameplay, progression, scalability, and project-scope source of truth. Treat `home-dashboard.png` and `approved-gameplay-ui.png` as the approved visual-direction sources.
- **Reason:** This matches both the blueprint's authority statement and the project-owner initialization instruction.
- **Consequence:** Code, plans, prompts, or assumptions that conflict with the blueprint are rejected unless a later explicit approved instruction is recorded. Visual references guide mood and composition but do not activate pictured future features or require embedding the raster files.

## DEC-0002 - Phase 19 through Phase 22 remain reserved

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Add tracker entries through Phase 22 as requested, but mark Phases 19-22 intentionally deferred with undefined scope.
- **Reason:** Master Blueprint v1.0 defines approved roadmap scope only through Phase 18. Assigning advanced features to Phases 19-22 would silently invent scope.
- **Consequence:** These phases cannot start until an explicit owner instruction or versioned blueprint revision defines their titles, scope, acceptance criteria, and dependencies.

## DEC-0003 - Phase 0 completion boundary

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Phase 0 includes repository/source audit plus creation of the requested project-control documentation, and is marked completed only after verification and creation of `reports/PHASE_00_REPORT.md`.
- **Reason:** This initialization task matches the blueprint's Phase 0 scope and explicitly prohibits actual game implementation.
- **Consequence:** Phase 1 remains pending and requires separate approval. No game scaffold, dependency, package file, or runtime code is created in Phase 0.

## DEC-0004 - Disabled visual features do not imply implementation approval

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Future controls appearing in the Home Dashboard or Gameplay UI references are treated as layout/style direction only. Their routes, state changes, rewards, economy, and gameplay effects remain nonfunctional until approved.
- **Reason:** The blueprint explicitly distinguishes active, visible-disabled, and future features.
- **Consequence:** Later UI phases may render appropriately disabled shells, but may not implement the underlying feature behavior unless the relevant phase is approved.

## DEC-0005 - Foundation module boundaries

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Keep React application lifecycle and temporary screen composition under `src/app`, `src/screens`, and `src/components`; keep engine timing, Canvas sizing/drawing, and deterministic utilities in React-independent modules under `src/game` and `src/utils`.
- **Reason:** The blueprint requires React to own screens and lifecycle while the game engine remains independently testable and authoritative for later gameplay rules.
- **Consequence:** Phase 1 includes a minimal `GameLoop` skeleton and Canvas host adapter, but no grid, gameplay state, physics, resolver, level, mission, scoring, or persistence implementation.

## DEC-0006 - Measured logical Canvas coordinates with capped DPR

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Treat measured Canvas CSS dimensions as logical coordinates, scale backing storage by device pixel ratio, and cap the ratio at 2 through application configuration.
- **Reason:** This avoids screenshot-pixel assumptions, supports responsive geometry, and limits high-density fill-rate cost as required by the blueprint.
- **Consequence:** Later renderers receive stable logical measurements while retaining sharp output. The cap remains configurable for later performance profiling.

## DEC-0007 - Version-stable seeded random stream

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Use a local FNV-1a seed hash followed by a Mulberry32-style 32-bit stream behind `createSeededRandom(seed)`.
- **Reason:** The utility is small, deterministic, platform-stable under JavaScript integer semantics, independently testable, and isolated from `Math.random`, time, and browser entropy.
- **Consequence:** The regression sequence is locked by automated tests. Any future algorithm change that affects generated content must be paired with the blueprint's `generatorVersion` policy rather than silently changing existing level streams.

## DEC-0008 - Minimal Phase 1 dependency policy

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Install only React/React DOM, Vite's React integration, TypeScript and type packages, Vitest, and ESLint's TypeScript/React support.
- **Reason:** These packages are required to run, compile, test, and lint the approved foundation. Animation, icon, routing, state-management, Canvas, physics, E2E, and formatting libraries are not required in Phase 1.
- **Consequence:** No dependency for a later feature was introduced. Later phases must justify and install their own genuinely needed packages.

## DEC-0009 - Staggered-row coordinate convention

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Use row/column coordinates with row 0 unshifted, odd rows offset right by one bubble radius, even rows containing 7 columns, and odd rows containing 6 columns. Rows increase downward and columns increase left-to-right.
- **Reason:** This is a deterministic staggered-row hex arrangement matching the approved conceptual board shape while keeping row-specific bounds explicit.
- **Consequence:** An unshifted even row connects diagonally to columns `c-1` and `c` in adjacent odd rows. An offset odd row connects diagonally to columns `c` and `c+1` in adjacent even rows. All neighbor results are filtered against row-specific bounds.

## DEC-0010 - Centralized close-packed grid geometry

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Centralize geometry in `HexGridConfig`: bubble radius, diameter, horizontal spacing, vertical spacing, row offset, parity, origin, and row widths. Use diameter for horizontal spacing, half-diameter for the offset, and `sqrt(3) * radius` for vertical spacing.
- **Reason:** The board must avoid scattered geometry magic numbers and must derive world-space centers consistently from logical coordinates.
- **Consequence:** `getCellCenter` is the only grid-to-world authority. The default debug board uses a 12-row, 7/6 alternating-width configuration; later level content can provide other validated configurations.

## DEC-0011 - Generic authoritative occupancy map

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Store occupancy in a `Map<coordinateKey, T>` owned by `HexBoard<T>`, with generic payloads and controlled mutation results for invalid or occupied placement.
- **Reason:** The blueprint requires logical occupancy to be authoritative, generic enough for later bubbles, deterministic, and independent of React/rendering.
- **Consequence:** Invalid reads throw explicit range errors, invalid placement/removal return `invalid-coordinate`, and accidental overwrite returns `occupied` without mutating state. Match, pop, drop, and bubble entities remain deferred.

## DEC-0012 - Development-only grid debug renderer

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Render a neutral Canvas diagnostic from `HexBoard` cells rather than defining grid geometry inside the renderer. The fixed selected cell `(0,0)` is highlighted and its valid neighbors are distinguished.
- **Reason:** Phase 2 requires visual verification of centers, labels, staggered alignment, bounds, and neighbor relationships without introducing final gameplay styling or input systems.
- **Consequence:** The debug display is enabled only when the existing development diagnostic flag is true. Pointer-based selection, gameplay visuals, and input handling remain deferred.

## DEC-0013 - Signed upward shooter angle convention

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Represent aim as a signed angle in radians from the upward vertical: negative values aim left, positive values aim right. The default safe range is ±0.38π and is validated to remain in the upward hemisphere.
- **Reason:** One convention keeps pointer aiming, direction vectors, clamping, and trajectory preview deterministic and easy to test.
- **Consequence:** Pointer input at or below the shooter is treated as upward aim, and all exposed directions are normalized unit vectors.

## DEC-0014 - Logical pointer conversion and unified input

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Use Pointer Events for mouse and touch alike. Convert client coordinates through the Canvas CSS bounding rectangle into measured logical viewport coordinates; do not multiply by device-pixel ratio a second time.
- **Reason:** The Canvas backing store may be DPR-scaled while game geometry remains in logical CSS-space coordinates.
- **Consequence:** A single aim path behaves consistently across input devices and responsive sizes.

## DEC-0015 - Trajectory preview is bounded prediction only

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** The Phase 3 trajectory utility predicts straight segments with geometric left/right wall reflection, a top boundary, maximum distance, and maximum segment count. It does not move a projectile or perform collision, snapping, or resolution.
- **Reason:** The approved phase requires an aiming preview while reserving projectile physics for Phase 4.
- **Consequence:** Preview output is deterministic, finite, and safe against reflection loops; gameplay remains input/state only.

## DEC-0016 - Single-shot request lock foundation

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** `ShooterState.requestFire()` records one pending fire request, locks aim input, and returns the current bubble plus direction without creating a projectile. A later request is rejected until the pending request is cleared and input unlocked.
- **Reason:** This establishes the one-shot input boundary required before projectile travel is implemented.
- **Consequence:** Fire lifecycle completion and projectile ownership remain deferred to later approved phases.

## DEC-0017 - Swept projectile collision with bounded continuation

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Integrate projectile travel as a distance-based continuous step. Each step solves time/distance of impact against radius-adjusted side walls, the radius-adjusted ceiling, and occupied bubble circles, then selects the earliest candidate with deterministic tie priority. Wall impacts reflect and consume the remaining distance in the same step; ceiling and bubble impacts terminate the projectile.
- **Reason:** Analytic swept tests prevent high-speed tunneling without arbitrary tiny substeps and preserve frame-rate-independent motion.
- **Consequence:** Physics remains deterministic and React-independent. A bounded collision-iteration limit emits a safety impact rather than permitting an infinite bounce loop.

## DEC-0018 - Projectile radius and shared wall convention

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** The projectile center travels between `leftWallX + radius` and `rightWallX - radius`; the ceiling contact center is `topY + radius`. The Phase 3 trajectory diagnostic now uses the same centerline limits so its preview and actual bounce geometry agree.
- **Reason:** The blueprint requires radius-respecting walls and ceiling contact, and the Phase 3 preview must remain mathematically consistent with actual physics.
- **Consequence:** No projectile center can cross a playable boundary during a tested step; the shared radius is centralized in `DEFAULT_PROJECTILE_CONFIG`.

## DEC-0019 - Explicit projectile ownership and completion

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** `ProjectileManager` owns zero or one active projectile, rejects a second spawn, retains one explicit terminal impact result, and does not unlock the Phase 3 shooter or create a subsequent turn.
- **Reason:** Phase 4 establishes travel ownership while Phase 8 owns the broader turn lifecycle.
- **Consequence:** Terminal results are available for Phase 5 to consume later, but no snap coordinate or occupancy mutation is performed now.

## DEC-0020 - Bounded snap candidate scopes

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Ceiling impacts consider only empty row-0 cells within `1.5 * bubbleDiameter` of the contact position. Occupied-bubble impacts consider only valid empty neighbors of the impacted coordinate. No distant-board search or teleport fallback is permitted.
- **Reason:** Bubble Shooter placement must remain physically local to the impact and must fail explicitly when the local geometry is blocked.
- **Consequence:** Candidate generation is bounded, deterministic, and cannot place a bubble through an occupied cluster or at an unrelated distant cell.

## DEC-0021 - Deterministic snap ranking

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Rank candidates by squared distance from the projectile contact position, then by alignment with the opposite of the projectile approach direction, then by row and column ascending.
- **Reason:** Contact geometry selects the physically nearest local destination while stable coordinate ordering resolves ties without relying on collection iteration order.
- **Consequence:** Identical board, impact, bubble, and grid inputs always produce the same coordinate and result.

## DEC-0022 - Snap placement is the Phase 5 terminal boundary

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** `resolveSnapAndPlace` commits only through `HexBoard.place`, returns an explicit success/failure result with the authoritative cell center, and performs no match, removal, floating-bubble, scoring, mission, or turn transition work.
- **Reason:** Phase 5 owns collision-to-grid handoff; Phase 6 and later phases own all post-placement resolution.
- **Consequence:** Successful placement changes occupancy exactly once; every failure leaves occupancy unchanged and reports its reason.

## DEC-0023 - Match traversal is anchored to the newly placed origin

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Resolve matches by traversing only from the coordinate returned by Phase 5 snapping, following authoritative six-neighbor links and never scanning for unrelated groups.
- **Reason:** A shot may remove only the connected group containing the newly placed bubble; disconnected same-color bubbles must remain for the later floating-bubble phase.
- **Consequence:** The resolver is bounded by the origin component and has no Phase 7 ceiling-connectivity behavior.

## DEC-0024 - Exact color identity and deterministic match output

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Bubbles match only when their exact `BubbleColor` values are equal. A configurable positive threshold defaults to three. Cluster and removal coordinates are sorted by row then column before being returned or removed.
- **Reason:** Exact identity prevents visual or future metadata ambiguity, while stable ordering makes events reproducible and testable.
- **Consequence:** Groups below threshold remain untouched; groups at or above threshold emit one explicit matched result with one removal coordinate per bubble.

## DEC-0025 - Match removal is the Phase 6 terminal boundary

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** A successful match removes only the origin-connected cluster through `HexBoard.remove` and returns the removed coordinates. No floating-bubble traversal, score, mission, turn, or input-unlock behavior is performed.
- **Reason:** Those systems belong to later approved phases and must consume explicit match results rather than be silently coupled to traversal.
- **Consequence:** Board occupancy reflects only the matched cluster removal; disconnected bubbles remain authoritative and available to Phase 7.

## DEC-0026 - Floating support starts from every occupied ceiling cell

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Determine support with a deterministic breadth-first traversal rooted at every occupied row-0 cell, following only occupied authoritative hex-grid neighbors and ignoring bubble color.
- **Reason:** Bubble support is a topology question, and multiple ceiling roots or mixed-color bridges must remain supported without relying on visual distance or match identity.
- **Consequence:** An occupied cell is supported if reachable from any occupied top-row root; with no roots, every occupied cell is floating.

## DEC-0027 - Floating removal is a post-match authoritative boundary

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Run floating resolution only after a Phase 6 matched removal, identify all occupied cells outside the supported set, and remove them exactly once through `HexBoard.remove` in row/column order.
- **Reason:** Floating detection must observe the board topology after match mutation while remaining independent from the future Phase 8 turn pipeline.
- **Consequence:** Results include supported coordinates, floating coordinates, removed descriptors, counts, and removal failures without score, mission, turn, or unlock state.

## DEC-0028 - Falling bubbles are copied diagnostic visuals

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Development falling visuals copy removed bubble descriptors and authoritative cell centers after logical removal, then apply deterministic gravity and small alternating drift outside the board model.
- **Reason:** Visual feedback should communicate floating removal without reinsertions, collision changes, connectivity side effects, or final animation scope.
- **Consequence:** Falling entities are temporary Canvas diagnostics only and are cleaned up after leaving the viewport.

## DEC-0029 - GameplaySession owns the turn lifecycle

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Coordinate shooter input, projectile stepping, snap, match, floating, completion, and bubble advancement in the React-independent `GameplaySession`; CanvasHost only forwards input, drives the loop, and renders snapshots.
- **Reason:** Phase 8 requires one authoritative lifecycle rather than competing React booleans or manual phase sequencing in the Canvas component.
- **Consequence:** Lifecycle state and transition history are testable without React, while existing phase modules remain focused on their own domain responsibilities.

## DEC-0030 - Explicit lifecycle transitions and pause preservation

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Use explicit `INITIALIZING`, `AIMING`, `SHOOTING`, `SNAPPING`, `MATCHING`, `RESOLVING_FLOATING`, `TURN_COMPLETE`, and `PAUSED` states. Pause stores the prior legal state and resume restores it; invalid transitions return a controlled failure.
- **Reason:** Input permissions, projectile timing, and resolution order must not be inferred from loosely related flags.
- **Consequence:** Aiming and firing are accepted only in `AIMING`; paused sessions do not advance projectile or resolution logic.

## DEC-0031 - Deterministic development bubble source and safe failure completion

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Advance current to previous next and obtain the next bubble from an isolated deterministic cyclic development source exactly once after successful turns. Controlled snap, safety-limit, or missing-projectile failures abort safely through `TURN_COMPLETE`, clear locks/results, and return to `AIMING` without score or penalty.
- **Reason:** Repeated development turns require stable bubble progression and recoverable failure behavior without inventing Phase 9 consequences.
- **Consequence:** Level-aware color filtering, mission effects, score, and turn penalties remain deferred; no stale projectile or permanent shooter lock survives completion.

## DEC-0032 - Phase 9 owns curated level and mission state above GameplaySession

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Keep turn sequencing in `GameplaySession` and add `LevelSession` as the level boundary owning the active curated definition, Clear All mission progress, shots, level status, level loading, restart, and level-aware bubble source.
- **Reason:** Level completion is evaluated only after a stable logical turn while avoiding a monolithic gameplay coordinator or React-owned rules.
- **Consequence:** WON/LOST blocks input at the level boundary; GameplaySession remains responsible for individual turn resolution and returns to AIMING only when the level remains active.

## DEC-0033 - Clear All mission and deterministic curated onboarding content

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** Levels 1-15 use only `CLEAR_ALL_BUBBLES`, with all starting cells required, explicit positive shot limits, validated coordinates/colors, and hand-authored layouts. Mission completion is evaluated before shot-exhaustion loss.
- **Reason:** The blueprint requires a curated, understandable onboarding ramp before generalized templates or generation exist.
- **Consequence:** Mission progress is derived solely from logical board occupancy; no score, stars, persistence, generated levels, or later mission types are activated.

## DEC-0034 - Level-aware fair bubble source

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** `LevelBubbleSource` cycles deterministically through colors still present on the active board and allowed by the level; removed colors are excluded while other colors remain. Bubble advancement can be suppressed when the level layer has completed.
- **Reason:** Shooter colors must stay within the curated level’s palette and avoid offering colors that cannot contribute to the remaining board.
- **Consequence:** The source is replaceable by later level/generator logic, never creates special bubbles, and does not require a new bubble after a completed empty board.

## DEC-0035 - Clear All progress is clamped net progress

- **Date:** 2026-07-13
- **Status:** Accepted
- **Decision:** `clearedBubbleCount` is calculated as `Math.max(0, startingBubbleCount - remainingBubbleCount)`. The starting count is captured from the authoritative board at level load/restart, remaining count is the current `HexBoard.size`, and completion remains `remainingBubbleCount === 0`.
- **Reason:** A non-matching snapped bubble can temporarily grow the board above its original size; mission progress must never expose a negative cleared count or introduce lifetime-removal history.
- **Consequence:** Progress represents net reduction relative to the original curated board, remains zero while the board is larger than its start, and becomes positive only after the board falls below the starting count.
## DEC-0036 - Phase 10 deterministic score events

- **Date:** 2026-07-14
- **Status:** Accepted
- Direct same-color match removals award 10 points per removed bubble.
- Floating removals award 20 points per removed bubble.
- Matches larger than the minimum three add 5 points per extra directly matched bubble.
- A Clear All completion awards 25 points per unused shot exactly once; no time, combo, booster, ad, or bank-shot modifiers are inferred.
- Score consumes only `TurnResult` logical match/floating data, never Canvas or animation state.

## DEC-0037 - Phase 10 stars and replay-safe best records

- **Date:** 2026-07-14
- **Status:** Accepted
- Curated level star thresholds are derived deterministically from starting bubble count and shot limit: one star is the board baseline, then two equal shot-pressure increments produce thresholds two and three.
- A WON level always receives at least one star; LOST runs receive zero completion stars.
- Best score and best stars are updated independently by maximum value, so replaying cannot reduce either record.

## DEC-0038 - Phase 10 versioned local progression

- **Date:** 2026-07-14
- **Status:** Accepted
- Local progress uses schema version 1 with highest unlocked level and compact per-level completion records only.
- Invalid JSON, unsupported versions, invalid shape, invalid IDs, negative scores, and stars outside 0-3 fall back to safe in-memory defaults; storage read/write failures never block gameplay.
- Normal level loading rejects locked levels. The development selector uses a separate explicitly named override path and does not alter progression APIs.

## DEC-0039 - Phase 11 central normalized level access

- **Date:** 2026-07-14
- **Status:** Accepted
- Curated Levels 1-15 resolve through `getLevel(levelId)` into a normalized immutable runtime model with explicit `contentSource: 'curated'`, authoritative grid configuration, mission, colors, shot limit, placements, and derived star thresholds.
- Invalid IDs and unsupported future IDs return controlled failures; no placeholder or generated level is fabricated.

## DEC-0040 - Phase 11 deterministic structural templates

- **Date:** 2026-07-14
- **Status:** Accepted
- The initial ten template families are pure coordinate masks over the Phase 2 grid: Triangle, Diamond, Wave, Columns, Split Clusters, Hanging Clusters, Tunnel, Wide Top, Islands, and Zigzag.
- Templates emit no colors, missions, shot limits, or level content. All initial masks are marked `guaranteed` ceiling-connected and are validated with the authoritative neighbor mapping; a future template may instead declare `requires-validation`.
- Registry order and IDs are stable, lookup is explicit, and template inspection returns cloned immutable coordinates. Difficulty and density fields are metadata only and do not select or generate levels.

## DEC-0041 - Phase 12 registry-driven mission objectives

- **Date:** 2026-07-14
- **Status:** Accepted
- Register the five approved objective types centrally: `CLEAR_ALL_BUBBLES`, `POP_COLOR`, `DROP_BUBBLES`, `CLEAR_MARKED`, and `REACH_SCORE`.
- Runtime mission sets contain one or two mandatory, non-duplicate objectives. Completion requires every objective; optional, hidden, and bonus objectives are not supported.
- Mission updates consume only stable turn results, authoritative board state, authoritative score, direct match removal descriptors, and floating removal descriptors. Event IDs based on stable turn identity prevent repeated processing.

## DEC-0042 - Phase 12 marked-bubble metadata

- **Date:** 2026-07-14
- **Status:** Accepted
- `BubbleDescriptor.marked` is optional metadata only. Matching remains color-only; physics, snapping, and floating connectivity remain unchanged. Marked bubbles count for `CLEAR_MARKED` only when their logical removal descriptor is consumed, regardless of direct match or floating removal.
- Existing curated Levels 1-15 contain no marked placements and existing save data remains valid because active board state is not persisted.

## DEC-0043 - Phase 12 mission feasibility metadata

- **Date:** 2026-07-14
- **Status:** Accepted
- Each registered objective exposes structured target metadata and an event requirement (`board-clear`, direct-or-floating removal, floating removal, marked removal, or score) for later Phase 13 validation. This phase does not perform feasibility or solvability validation and does not assign missions to future levels.

## DEC-0044 - Phase 13 versioned generated-level identity

- **Date:** 2026-07-14
- **Status:** Accepted
- Levels 16-10,000 are generated on demand from level ID, generator/config versions, and a deterministic retry attempt. Seeds use `level:<id>|generator:<version>|config:<config>|retry:<attempt>` and never runtime entropy.
- Curated Levels 1-15 continue to resolve from immutable authored definitions and are never passed through the generator.

## DEC-0045 - Phase 13 difficulty waves and structural generation

- **Date:** 2026-07-14
- **Status:** Accepted
- Generated difficulty follows an easy/easy/medium/medium/hard/recovery/medium/hard/challenge/recovery wave with a gradual baseline tier. Difficulty influences template suitability, palette size, density-aware filling, mission complexity, shot generosity, and score thresholds only.
- Boards are deterministic fills of Phase 11 ceiling-connected template masks using normal colors and neighbor-aware clustering.

## DEC-0046 - Phase 13 bounded validation and retry behavior

- **Date:** 2026-07-14
- **Status:** Accepted
- Every generated candidate passes identity, board, template, mission, conservative feasibility, shot-limit, star-threshold, and metadata checks before access returns it. Failed candidates retry with deterministic incremented seeds up to three retries (four attempts including retry zero), then return an explicit failure.
- Feasibility is conservative rather than a full solvability proof: color, floating, marked, and score targets are bounded by generated board/scoring evidence.

## DEC-0047 - Phase 13 progression-cap compatibility

- **Date:** 2026-07-14
- **Status:** Accepted
- Save schema version 1 remains compatible while level-ID validation expands to the centralized 1-10,000 cap. Completing generated level N unlocks N+1 only within that cap; level 10,000 never creates a level 10,001 record.

## DEC-0048 - Phase 14 Home Dashboard screen boundary

- **Date:** 2026-07-14
- **Status:** Accepted
- The React app now starts on a Home Dashboard screen and switches to the existing gameplay presentation only after an unlocked level is launched. Returning Home preserves the shared progression repository and selected progression context; no new routing dependency was added.
- The gameplay Canvas remains engine-authoritative. The Home screen reads progression summaries and never constructs full level content for map nodes.

## DEC-0049 - Phase 14 deterministic virtualized map

- **Date:** 2026-07-14
- **Status:** Accepted
- Map positions derive directly from level ID, a configurable stride, and a repeating horizontal wave. Visible level IDs are calculated from scroll position with bounded overscan; only that window's node buttons and local SVG path segments mount. The map uses one large scrollable world height but never a 10,000-node DOM/SVG structure.
- Current focus scrolls once on initial dashboard load toward the highest unlocked level. Manual scrolling is not repeatedly overridden.

## DEC-0050 - Phase 14 asset-light game-world UI

- **Date:** 2026-07-14
- **Status:** Accepted
- The Home Dashboard recreates the approved deep navy/purple atmosphere, winding glow path, bubble depth, node elevation, fixed HUD, and fixed bottom navigation with CSS gradients, procedural DOM bubbles, blur, shadows, and bounded SVG. The approved reference image is not embedded as a background and no large raster dependency or icon library was added.
- Ranking and Rewards remain semantically disabled. The center shooter-style control launches the highest unlocked supported level through the existing progression boundary.

## DEC-0051 - Phase 15 presentation boundary

- **Date:** 2026-07-14
- **Status:** Accepted
- The normal gameplay screen is a React HUD/overlay composition around the existing React-independent gameplay session and Canvas renderer. Grid, physics, snap, match, floating, mission, scoring, progression, and persistence authorities were not moved into presentation components.
- Debug diagnostics are query-gated behind the development-only `?debug` flag. The player-facing screen does not expose coordinates, engine state captions, selectors, or debug controls.

## DEC-0052 - Phase 15 code-native visual integration

- **Date:** 2026-07-14
- **Status:** Accepted
- The approved Gameplay UI mood is implemented with Canvas gradients, procedural glows/sparkles, glossy bubble gradients, SVG icons, depth shadows, and responsive CSS rather than embedding a raster screenshot or adding a large asset dependency. This preserves the asset-light project rule while matching the reference's hierarchy and lighting direction.

## DEC-0053 - Phase 15 progression and overlay behavior

- **Date:** 2026-07-14
- **Status:** Accepted
- Pause, win, loss, replay, next-level, and Home controls are presentation actions that call the existing session/progression boundaries. Completion records, best scores/stars, unlocks, and level loading remain owned by `LevelSession` and `ProgressionRepository`; overlays do not add turn, score, or persistence rules.
- Booster slots, special bubbles, audio, particles, and final animation systems are omitted from this phase because they are not approved functionality; those concerns remain deferred to their explicit phases.

## DEC-0054 - Phase 15 HUD-safe authoritative gameplay layout correction

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- The starting-board visibility defect was caused by the logical grid origin at `y=24` sharing the full Canvas viewport with a HUD/mission overlay that occupied the upper region. The board was present in authoritative occupancy but row 0 rendered underneath the player-facing HUD.
- `GameplayLayout` now provides a deliberate HUD inset, centered responsive grid origin, shared grid/projectile radius, and shooter spacing. `LevelSession`, physics, snapping, pointer/world coordinates, and Canvas rendering consume the same layout values; no CSS-only translation or independent visual collision scale was introduced.

## DEC-0055 - Phase 15 compact bubble/shooter/trajectory composition

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- Board bubbles render at their authoritative collision radius with close-packed hex spacing. The shooter uses the same current-bubble radius as the projectile, adds only a short aim-direction cue, and keeps the next bubble in a compact nearby card.
- Trajectory math remains unchanged. Its presentation is derived into a deterministic maximum of 72 wider-spaced dots tinted from the current BubbleColor, preserving wall-bounce continuity without debug-like white point noise.

## DEC-0056 - Phase 15 owner override: substantial curated onboarding formations

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- The project owner overrode the earlier minimal Levels 1-15 onboarding layouts after mobile review. Levels 1-5 now use substantial authored, ceiling-connected formations with 20/24/27/30/34 starting bubbles; Levels 6-15 were expanded into deliberate multi-row structures while preserving their approved color bands and mission type.
- Shot limits were rebalanced for all curated levels (24, 27, 29, 32, 35, 30, 32, 34, 34, 36, 32, 34, 36, 36, 38). Star thresholds continue to derive from current level inputs; scoring formulas remain unchanged.

## DEC-0057 - Phase 15 owner override: fixed-shooter natural aiming

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- The shooter bubble remains fixed at the authoritative shooter origin during aiming. Pointer movement controls only `ShooterState` aim direction, the visual direction cue, and the reflected trajectory; fired projectiles inherit the accepted direction.
- Canvas input now captures one active pointer, ignores secondary pointers, handles pointer cancel without firing, and fires once on the captured pointer's release. HUD and terminal overlays remain separate from the aim-input region.

## DEC-0058 - Phase 15 responsive projectile speed

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- The default projectile speed is raised from `520` to `600` logical units per second. This makes bubble travel and wall bounces feel brisker on touch while retaining readable swept-collision behavior and deterministic stepping. No collision, aim, or bounce geometry was changed.

## DEC-0059 - Phase 15 live drag-render boundary

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- Pointer movement now redraws through the same normal gameplay render boundary used by the game loop, regardless of whether development diagnostics are enabled. This keeps the fixed shooter cue and reflected trajectory visibly synchronized with touch dragging in the player-facing build.
- Pointer release performs the final aim update, redraws the accepted direction, and then starts the single projectile flight. No aim, physics, collision, or turn authority was moved into React.

## DEC-0060 - Phase 15 unified gameplay ceiling surface

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- `GameplayLayout.boardCeilingY` is the physical ceiling surface for the gameplay world. The Canvas rail, grid row-0 centers, trajectory preview, projectile collision, ceiling impact position, and existing Phase 5 ceiling snap all derive from it. Bubble centers sit one radius below the surface; no CSS-only rail or second snap system exists.

## DEC-0061 - Phase 15 organic curated color clusters

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- Curated Levels 1-15 no longer use the deterministic two-column color helper. Each level uses explicit deterministic row masks with local organic color clusters, gaps, diagonal continuations, and mixed-color neighborhoods. No procedural generator or runtime random noise replaced curated content.

## DEC-0062 - Phase 15 support-bridge topology

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- Curated boards deliberately include narrow necks, diagonal support chains, hanging branches, split formations, and alternate support paths so the approved color-independent floating resolver can produce strategic mixed-color drops. The resolver rules were not changed to force visual outcomes, and ordinary early matches do not automatically empty the board.

## DEC-0063 - Phase 15 normal-play diagnostic boundary

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- Raw impact/contact rings, collision normals, snap candidate rings, selected cells, and coordinate labels are forbidden in normal player gameplay. They remain available only through the development build plus explicit `?debug` diagnostics. The normal Canvas renderer no longer draws the terminal impact ring.

## DEC-0064 - Phase 15 trajectory resampling and pointer clarity

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- The authoritative trajectory math is unchanged. Player-facing presentation samples it into at most 40 dots at 30px spacing, with stronger near-shooter color/size and controlled fade. A compact tapered pointer is drawn from the fixed shooter origin using the same authoritative aim direction as trajectory and projectile launch.

## DEC-0065 - Phase 15 game-like HUD hierarchy

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- Level, score, shots, and star progress remain authoritative, but the HUD is grouped into a two-row game hierarchy rather than equal dashboard cards. Mission chips remain compact below the HUD, and the deep navy/purple background is unchanged.

## DEC-0066 - Phase 15 authoritative bubble-scale reduction

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- The normal gameplay radius is reduced from the prior responsive 16-20px range to 14-17px (approximately 12.5-15% smaller) through centralized `GameplayLayout` constants. This is shared geometry, not a visual-only transform: grid spacing, centers, bounds, projectile radius, collisions, ceiling contact, snap centers, shooter, and falling copies remain coherent.

## DEC-0067 - Phase 15 rendering-only bubble visual families

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- `BubbleVisualTheme` controls only normal-bubble rendering treatment. `BubbleColor` remains the sole gameplay identity for matching, physics, missions, scoring, and progression. The five approved families are `CLASSIC_GLOSS`, `PEARL_GLASS`, `CRYSTAL_CORE`, `NEBULA_ENERGY`, and `FACETED_GEM`.
- Levels 1-5 remain classic onboarding spheres; Levels 6-15 use pearl/glass presentation; generated levels use deterministic visual-era bands. Theme metadata is not persisted and never uses random entropy.

## DEC-0068 - Phase 15 shared themed bubble renderer

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- A shared Canvas `drawBubble` path renders board, falling, projectile, and shooter bubbles, then applies the marked mission-target overlay. Family details remain static, circular, asset-light, and restrained; they do not create new bubble mechanics or polygon collision geometry.
- Stable row/column/color variation offsets highlights and internal light subtly so dense boards do not read as identical copied circles. Palette clarity remains more important than family tint.

## DEC-0069 - Phase 15 compact next preview and shooter chrome

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- The next bubble is presented as a small floating preview using the active level's theme rather than a rectangular stat card. The shooter uses one compact crescent/cradle and a soft energy pool beneath the current themed bubble. No swap interaction or new shooter mechanic was added.

## DEC-0070 - Phase 15 fresh-session level transition

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- The gameplay screen is keyed by active level ID so selecting Next Level remounts the session surface and creates a fresh authoritative board, mission, shooter, projectile manager, and bubble source. This prevents stale completed-session state or an empty intermediate board from being reused for the next level.
- The progression repository remains shared, so saved best scores, stars, and unlocks are preserved while active level state resets.

## DEC-0071 - Phase 15 terminal projectile visibility on snap failure

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- A terminal projectile whose impact cannot produce a valid snap is retained as a presentation-only contact visual instead of disappearing silently. It is cleared when the next shot begins or a level reloads. Successful snap, match, and floating resolution remain authoritative board operations; no fallback placement or new gameplay rule was added.

## DEC-0072 - Phase 15 stronger color and shared scale correction

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- Normal BubbleColor palette stops are more saturated and white highlight/shell opacity is reduced so blue, green, purple, red, and yellow read as pure, strong gameplay colors against the navy world.
- The shared gameplay radius is modestly increased from 14-17px to 15-18px. Grid spacing, collision radius, shooter, projectile, ceiling, snap, and falling visuals remain derived from the same radius; no visual-only enlargement exists.

## DEC-0073 - Phase 15 authoritative blocked-shot retention

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- A terminal projectile is carried in the authoritative `TurnResult` only when snap resolution returns no legal placement. Canvas may retain that completed projectile as a presentation-only hold across redraws, while the authoritative board remains unchanged.
- This prevents a blocked shot from appearing to disappear without inventing a distant fallback cell, false same-color match, score event, or new gameplay rule. The hold is cleared when the next shot begins or the level session reloads.

## DEC-0074 - Phase 15 ceiling rail attachment has no arbitrary distance cutoff

- **Date:** 2026-07-14
- **Status:** Implemented; owner visual review pending
- The authoritative ceiling rail spans the valid row-0 grid cells, including edge cells beyond a narrow formation. Ceiling snap enumerates all empty row-0 cells and selects the nearest legal cell by geometric proximity, using deterministic alignment and row/column tie-breaking. A contact outside the span resolves to the nearest legal edge cell.
- The former `1.5 * bubbleDiameter` cutoff caused valid shallow and wall-bounced shots to return `no-valid-candidate`, after which the completed projectile was cleared and the accepted shot remained consumed. The cutoff is no longer used to reject normal ceiling placement. Bubble impacts still use only empty immediate neighbors, and no arbitrary deep-board fallback is permitted.

## DEC-0075 - Phase 15 full-width ceiling play and supported-frontier retention

- **Date:** 2026-07-14
- **Status:** Implemented; owner gameplay review pending
- The project owner explicitly requires the entire visible upper rail to be playable and forbids an accepted normal bubble from disappearing there. This supersedes DEC-0074's restriction against a connected fallback when row 0 or the contacted bubble has no immediate legal opening.
- The shared mobile bubble radius is now `width / 16`, clamped to 15-30 logical pixels. Seven row-0 bubbles therefore cover the playable width at supported mobile sizes, and the same radius remains authoritative for rendering, grid spacing, projectile motion, collision, snapping, shooter, and falling copies.
- Snap resolution still prefers an empty row-0 cell for ceiling contact and an empty immediate neighbor for bubble contact. When that local set is exhausted, it deterministically selects the nearest empty cell touching the occupied formation. Ceiling fallback preserves the horizontal shot lane and prefers the shallowest cell; blocked bubble fallback uses geometric proximity. It never chooses an isolated empty cell. Only a completely occupied logical board can legitimately return no placement.

## DEC-0076 - Phase 15 generated-board density, composition, and mission safety

- **Date:** 2026-07-14
- **Status:** Implemented; owner gameplay review pending
- The accepted snap resolver is frozen. Normal gameplay geometry is reduced from `width / 16` with a 15-30px clamp to `width / 20` with a 14-22px clamp so later boards can carry substantially more visible content. The radius remains authoritative for grid, rendering, shooter, projectile, swept collision, walls, ceiling, snapping, and falling copies.
- Generated content version 3 fills the board from the ceiling downward with complete rows and only a centered final partial row when the target count lands mid-row. Level 16-100 uses 45-60 starting bubbles, Level 101-1000 uses 50-65, and Level 1001+ uses 55-70 within the current 78-cell capacity.
- Generated fullness is measured as occupied cells divided by all valid cells from row 0 through the deepest occupied row. Accepted candidates now require 92-100% density, full occupancy across the first three rows, at least seven occupied/deep rows, broad formation width, and only minimal central empty space from a final partial row.
- Structural templates remain metadata/anchor influence for generation identity, but visible generated-board shape is no longer made by large empty placement holes. The intended shape illusion comes from deterministic BubbleColor composition across a full physical board.
- Board template and color composition are separate. The registered deterministic composition styles are `ORGANIC_CLUSTERS`, `WAVES`, `SPIRAL_FLOW`, `COLOR_RINGS`, `MIRRORED_WINGS`, `FLAME_FLOW`, `ZIGZAG_FLOW`, `DIAGONAL_FLOW`, `COLOR_CORE`, and `SPLIT_TONES`. They use only existing BubbleColor values and bound connected local clusters without changing match rules.
- All visual families preserve a deep saturated BubbleColor body. Crystal, nebula, and faceted treatments use same-color cores, clouds, arcs, and planes with restrained neutral highlights and low-opacity shells.
- Generated mission selection occurs only after final board construction and analysis. POP_COLOR is bounded by eligible color content; CLEAR_MARKED by marked content; REACH_SCORE by the conservative floor `startingBubbleCount * 10`; DROP_BUBBLES by one-pass articulation analysis of detachable supported regions; mission sets validate every objective and combined effort. Full generated boards do not fabricate DROP_BUBBLES objectives when no detachable topology exists.
- Empty generated board plus incomplete mandatory mission is a content invariant failure. It produces a structured diagnostic and a non-winning terminal state; it never fabricates progress or silently awards completion. Generator validation remains the primary prevention boundary.

## DEC-0077 - Phase 15 dense-board bubble count and jewel-color correction

- **Date:** 2026-07-14
- **Status:** Implemented; owner gameplay review pending
- The project owner approved denser boards after rendered Level 14 and Level 16 screenshots still looked too empty. The requested 59-200 range is interpreted within the current authoritative grid capacity: the existing mobile gameplay grid supports 78 starting cells without changing layout, scrolling, physics, or level architecture, so Phase 15 raises density to the safe capacity range rather than expanding the engine to 200.
- Curated Levels 1-15 now use dense connected formations with 42-78 starting bubbles. They remain deterministic, normal-bubble-only, ceiling-supported, and clear-all authored onboarding content; visible shape comes from BubbleColor bands and lanes instead of large structural holes.
- Generated content version 4 raises bands to 59-72 bubbles for Levels 16-100, 64-76 for Levels 101-1000, and 68-78 for Levels 1001-10000. Counts are still clamped to valid capacity, analyzed after construction, and mission-validated before acceptance.

## DEC-0056 - Scalable reference-style board correction

- The fixed 78-cell board is replaced by an 11/10 alternating-column, 19-row grid with exactly 200 logical cells. A responsive radius derived from viewport width and available height keeps the complete board below the HUD-safe ceiling and above the shooter region, including narrow mobile viewports.
- Curated Levels 1-15 use 59-129 dense starting bubbles. Generated configuration version 5 uses 59-110 bubbles for Levels 16-100, 76-140 for Levels 101-1000, 96-175 for Levels 1001-5000, and 116-200 for Levels 5001-10000.
- Board silhouettes are created by deterministic BubbleColor composition and controlled occupancy contours. Every bubble remains a circular normal bubble; family accents are clipped to the circular silhouette and never create polygonal gameplay shapes.
- `LevelSession` now falls back to the same `GameplayLayout` factory used by CanvasHost, eliminating a second legacy layout path that could place row zero beneath the HUD.

## DEC-0057 - Smooth sphere and external target marker

- All bubble presentation states share one circular renderer modeled on the clean next-bubble preview. The body uses pure BubbleColor shading, one restrained specular highlight, and a same-color lower rim.
- Internal concentric strokes, center dots, angular facets, polygonal cores, and neutral white shell overlays are prohibited because they make normal bubbles read like candy or contain a hole.
- Mission-target marking remains visible as an external luminous ring around the sphere and never alters the colored bubble body.
- The accepted no-disappearance/supported-frontier snap rule is unchanged. This correction changes board fullness and presentation, not the shot resolver, scoring formula, mission runtime, save schema, or progression authority.
- Normal color rendering is retuned from over-bright neon to saturated jewel colors. White wash and family overlay opacity are reduced, while same-color light/dark stops preserve pure BubbleColor identity. Every visual family still renders a circular bubble silhouette; faceted/crystal/nebula details are internal decoration only and do not imply polygonal bubble shapes or special mechanics.

## DEC-0058 - HUD mission placement and restrained bubble contact depth

- The active mission objective is rendered inside the gameplay HUD as a compact third row beneath star/shot progress. It no longer floats as an independent strip over the playfield, keeping the objective readable and the HUD-safe ceiling authoritative.
- Board bubbles retain internal same-color shading for roundness, but board-only glow and lower contact-rim opacity are reduced so touching bubbles do not cast a heavy dark shadow or muddy the pure jewel colors. Projectile and shooter readability retain a slightly stronger presentation glow.

## DEC-0059 - Two-column gameplay HUD alignment

- The gameplay HUD uses two aligned rows: Level above Pause in the first column, Star progress above Mission in the middle column, and Score above Shots in the right column. This keeps related information vertically grouped with consistent mobile padding.

## DEC-0060 - Phase 16 presentation ownership and bounded motion

- **Date:** 2026-07-15
- **Status:** Implemented; owner review pending before Phase 17
- Phase 16 is presentation-only. `GameplayPresentationTimeline` consumes accepted shots, authoritative projectile positions, wall contacts, turn results, matched descriptors, floating descriptors, score threshold crossings, and terminal state without deciding gameplay outcomes.
- Normal shots remain calm. Match, large-match, and floating-drop intensity scales through deterministic effect counts, brief pulses, bounded same-color particles, and accelerated falling copies. No camera shake, audio, WebGL, DOM particles, or balance changes were introduced.
- Presentation state uses delta-time, a 320-particle pool, eight-sample projectile trail, forty-dot trajectory cap, bounded effects/falling collections, and reset-safe level boundaries. Pause freezes the presentation clock; reduced motion shortens entrance, removes drift, suppresses most particles, and disables trajectory shimmer.
- Score count-up, mission pulses, star threshold sparks, and 240ms terminal breathing delay are display-only. Progression and mission authorities remain unchanged.
- Home animation reuses only its six existing ambient bubbles, two existing glow fields, and existing sparkle layer. Their deterministic 18-46 second drift profiles use pointer-events none and cannot affect map virtualization, scrolling, or navigation. Audio remains deferred.
