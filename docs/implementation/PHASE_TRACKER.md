# Phase Tracker

## Status legend

- `[ ]` Pending
- `[~]` In Progress
- `[x]` Completed and verified
- `[!]` Blocked
- `[-]` Intentionally deferred

Only one phase may be in progress at a time. A completed phase requires implemented scope, passing relevant checks, no known critical in-scope issue, and a completed report.

## Phase 0 - Blueprint + project audit

- **Status:** `[x]` Completed and verified
- **Scope:** Confirm the source-of-truth blueprint and approved visual references; inspect the entire existing repository; establish project-control documentation. No gameplay implementation beyond audit notes.
- **Acceptance criteria:** Repository inventory is complete; blueprint and visual references are reviewed; source hierarchy and phase rules are documented; control files and report directory exist; no game code or later-phase work is introduced; completion report is written.
- **Dependencies:** Project-owner authorization and source artifacts.
- **Report file:** `docs/implementation/reports/PHASE_00_REPORT.md`
- **Notes:** Completed on 2026-07-13. The repository contained only the blueprint PDF and two approved PNG references before this documentation was added.

## Phase 1 - Project foundation

- **Status:** `[x]` Completed and verified
- **Scope:** React/TypeScript/Vite shell, approved directory architecture, game-loop skeleton, feature flags, seeded RNG utility, and test setup.
- **Acceptance criteria:** Foundation builds and type-checks; baseline tests run; architecture boundaries match the blueprint; seeded RNG is deterministic; no Phase 2 gameplay systems are implemented.
- **Dependencies:** Phase 0 completed; explicit approval to begin Phase 1.
- **Report file:** `docs/implementation/reports/PHASE_01_REPORT.md`
- **Notes:** Approved by the project owner and completed on 2026-07-13. Type checking, linting, 8 automated tests, production build, dependency audit, and HTTP runtime smoke checks passed. Phase 2 and later work was not implemented.

## Phase 2 - Hex grid system

- **Status:** `[x]` Completed and verified
- **Scope:** Staggered hex coordinates, world mapping, odd/even neighbor math, occupancy, debug visualization, and unit tests.
- **Acceptance criteria:** Logical coordinates are authoritative; world positions are derived; neighbor and occupancy tests pass; no overlapping cells occur in tested cases.
- **Dependencies:** Phase 1 completed and approved.
- **Report file:** `docs/implementation/reports/PHASE_02_REPORT.md`
- **Notes:** Approved by the project owner and completed on 2026-07-13. Type checking, linting, 21 automated tests, production build, HTTP runtime smoke, and Phase 3+ scope audit passed. Phase 3 and later work was not implemented.

## Phase 3 - Shooter and aiming

- **Status:** `[x]` Completed and verified
- **Scope:** Normalized pointer/touch aiming, angle limits, current/next bubble, trajectory visualization, and input lock foundation.
- **Acceptance criteria:** Touch and mouse aiming behave consistently; angle constraints hold; current/next state is visible; input can be locked; no projectile physics beyond approved aiming scope.
- **Dependencies:** Phase 2 completed and approved.
- **Report file:** `docs/implementation/reports/PHASE_03_REPORT.md`
- **Notes:** Approved by the project owner and completed on 2026-07-13. Type checking, linting, 41 automated tests, production build, HTTP runtime smoke, and Phase 4+ scope audit passed. Phase 4 and later work remains prohibited pending owner review.

## Phase 4 - Projectile physics

- **Status:** `[x]` Completed and verified
- **Scope:** Frame-independent projectile motion, side-wall reflection, collision detection, earliest-impact handling, and anti-tunneling strategy.
- **Acceptance criteria:** Motion is delta-time based; wall bounces preserve speed; collision regressions and high-speed anti-tunneling tests pass.
- **Dependencies:** Phase 3 completed and approved.
- **Report file:** `docs/implementation/reports/PHASE_04_REPORT.md`
- **Notes:** Approved by the project owner and completed on 2026-07-13. Type checking, linting, 57 automated tests, production build, HTTP runtime smoke, and Phase 5+ scope audit passed. Phase 5 and later work remains prohibited pending owner review.

## Phase 5 - Snap system

- **Status:** `[x]` Completed and verified
- **Scope:** Deterministic nearest-valid-cell snapping and authoritative occupancy integrity.
- **Acceptance criteria:** Candidate filtering, nearest-cell choice, deterministic tie-breaking, bounds, and occupancy assertions pass; no bubble remains between logical cells.
- **Dependencies:** Phase 4 completed and approved.
- **Report file:** `docs/implementation/reports/PHASE_05_REPORT.md`
- **Notes:** Approved by the project owner and completed on 2026-07-13. Type checking, linting, 75 automated tests, production build, HTTP runtime smoke, and Phase 6+ scope audit passed. Phase 6 and later work remains prohibited pending owner review.

## Phase 6 - Match resolver

- **Status:** `[x]` Completed and verified
- **Scope:** Connected same-color group detection, minimum match size of three, pop resolution, and single-emission pop events.
- **Acceptance criteria:** BFS/DFS match tests pass across grid offsets and edges; only groups of 3+ pop; nonmatching placements remain; events are not double-counted.
- **Dependencies:** Phase 5 completed and approved.
- **Report file:** `docs/implementation/reports/PHASE_06_REPORT.md`
- **Notes:** Approved by the project owner and completed on 2026-07-13. Type checking, linting, 84 automated tests, production build, HTTP runtime smoke, and Phase 7+ scope audit passed. Phase 7 and later work remains prohibited pending owner review.

## Phase 7 - Floating bubble resolver

- **Status:** `[x]` Completed and verified
- **Scope:** Ceiling connectivity, floating cluster detection, falling-bubble resolution, and drop scoring events.
- **Acceptance criteria:** Ceiling flood-fill is correct; every disconnected bubble falls once; connected bubbles remain; drop score events are emitted once.
- **Dependencies:** Phase 6 completed and approved.
- **Report file:** `docs/implementation/reports/PHASE_07_REPORT.md`
- **Notes:** Approved by the project owner and completed on 2026-07-13. Type checking, linting, 93 automated tests, production build, HTTP runtime smoke, and Phase 8+ scope audit passed. Phase 8 and later work remains prohibited pending owner review.

## Phase 8 - State machine + turn lifecycle

- **Status:** `[x]` Completed and verified
- **Scope:** Strict engine states, ordered turn lifecycle, resolution timing, input locks, one-projectile rule, and pause handling.
- **Acceptance criteria:** State transitions match the blueprint turn loop; input cannot cause double shots during travel or resolution; pause/resume is safe; transition tests pass.
- **Dependencies:** Phase 7 completed and approved.
- **Report file:** `docs/implementation/reports/PHASE_08_REPORT.md`
- **Notes:** Approved by the project owner and completed on 2026-07-13. Type checking, linting, 100 automated tests, production build, HTTP runtime smoke, and Phase 9+ scope audit passed. Phase 9 and later work remains prohibited pending owner review.

## Phase 9 - Mission 1 + first 15 levels

- **Status:** `[x]` Completed and verified
- **Scope:** `CLEAR_ALL` mission, 15 curated onboarding levels, first-15 progression bands, and forgiving early tuning.
- **Acceptance criteria:** Levels 1-15 are curated; every level uses only Clear All; colors, shapes, teaching focus, and shot pressure follow the blueprint; no later mission type is activated.
- **Dependencies:** Phase 8 completed and approved.
- **Report file:** `docs/implementation/reports/PHASE_09_REPORT.md`
- **Notes:** Approved by the project owner and completed on 2026-07-13. Targeted mission-progress review fix verified with type checking, linting, 115 automated tests, production build, HTTP runtime smoke, and Phase 10+ scope audit. Phase 10 and later work remains prohibited pending owner review.

## Phase 10 - Score, stars, save progress

- **Status:** `[x]` Completed and verified
- **Scope:** Score events, star thresholds, win/loss completion records, best score/highest stars, local persistence, schema versioning, and migrations.
- **Acceptance criteria:** Score and star tests pass; completion grants at least one star; worse results cannot overwrite better results; save/reload and migration tests pass.
- **Dependencies:** Phase 9 completed and approved.
- **Report file:** `docs/implementation/reports/PHASE_10_REPORT.md`
- **Notes:** Completed on 2026-07-14 after type checking, linting, 126 automated tests, production build, HTTP runtime smoke, and Phase 11+ scope audit passed. Awaiting explicit owner review before Phase 11; no later phase was implemented.

## Phase 11 - Level access + templates

- **Status:** `[x]` Completed and verified
- **Scope:** Unified `getLevel(levelId)` API, template definitions and parameter ranges, level metadata, and override foundation.
- **Acceptance criteria:** Access contract supports curated 1-15, controlled 16-100, and future generated 101+ ranges without 10,000 files; template output respects bounds and model requirements.
- **Dependencies:** Phase 10 completed and approved.
- **Report file:** `docs/implementation/reports/PHASE_11_REPORT.md`
- **Notes:** Completed on 2026-07-14 after type checking, linting, 133 automated tests, production build, HTTP runtime smoke, and Phase 12+ scope audit passed. Awaiting explicit owner review before Phase 12; no later phase was implemented.

## Phase 12 - Mission registry expansion

- **Status:** `[x]` Completed and verified
- **Scope:** Registry-driven Pop Color, Drop Bubbles, Clear Marked, Reach Score, and initially limited multi-objective support.
- **Acceptance criteria:** Mission descriptors drive engine progress and UI data; target validation works; new types do not rewrite the turn loop; first 15 levels remain Clear All only.
- **Dependencies:** Phase 11 completed and approved.
- **Report file:** `docs/implementation/reports/PHASE_12_REPORT.md`
- **Notes:** Completed and approved on 2026-07-14 after type checking, linting, 140 automated tests, production build, HTTP runtime smoke, and Phase 13+ scope audit passed. No later phase was implemented until the explicit Phase 13 approval instruction.

## Phase 13 - Deterministic generator + validator

- **Status:** `[x]` Completed and verified
- **Scope:** On-demand deterministic generation for Levels 16-10,000, versioned seeds, wave-based difficulty, reusable template/color/mission selection, structural and mission-feasibility validation, bounded retries, and progression-compatible generated access.
- **Acceptance criteria:** Curated Levels 1-15 remain unchanged; generated IDs 16-10,000 resolve deterministically; invalid candidates are rejected; retries are bounded and stable; generated missions and star thresholds are feasible and validated; no Phase 14 feature is implemented.
- **Dependencies:** Phase 12 completed and approved.
- **Report file:** `docs/implementation/reports/PHASE_13_REPORT.md`
- **Notes:** Completed on 2026-07-14 after type checking, linting, 146 automated tests, production build, HTTP smoke, and Phase 14+ scope audit passed. Static validation is not represented as a mathematical proof of solvability. Awaiting explicit owner review; Phase 14 and later were not implemented.

## Phase 14 - Home dashboard/map

- **Status:** `[x]` Completed and verified
- **Scope:** Approved game-world dashboard direction, fixed top HUD and bottom navigation, virtualized vertical level map, deterministic path, level states, current-level focus, Quick Play, and disabled future controls.
- **Acceptance criteria:** Map scroll is smooth and virtualized; it never renders all 10,000 nodes; HUD/navigation remain fixed; Quick Play launches current level; completed/current/locked states differ; future tabs are visible where approved and truly disabled.
- **Dependencies:** Phase 13 completed and approved.
- **Report file:** `docs/implementation/reports/PHASE_14_REPORT.md`
- **Notes:** Completed on 2026-07-14 after type checking, linting, 151 automated tests, production build, HTTP smoke, and Phase 15+ scope audit passed. Must follow `home-dashboard.png` for visual direction without embedding it as the screen background. Phase 15 was subsequently approved and completed at its own gate.

## Phase 15 - Gameplay visual integration

- **Status:** `[x]` Completed and verified
- **Scope:** Procedural gameplay background, glossy Canvas bubbles, vector shooter, aim effects, responsive HUD composition, current/next bubbles, and explicitly omitted or disabled future affordances.
- **Acceptance criteria:** Gameplay matches the approved mood, depth, hierarchy, and readability; rendering is code-first and responsive; generic icons are restyled; unsupported booster behavior is not activated; core gameplay state stays engine-authoritative.
- **Dependencies:** Phase 14 completed and approved.
- **Report file:** `docs/implementation/reports/PHASE_15_REPORT.md`
- **Notes:** Completed on 2026-07-15 and corrected again after targeted ceiling/topology/presentation, visual-depth, projectile/transition, critical snap, generated-level presentation/mission-safety, dense-board/color, and reference-video review: type checking, linting, 204 automated tests, a 1,000-ID deterministic content audit, production build, interactive Chrome mobile play, and Phase 16+ scope audit passed. The accepted snap resolver is unchanged. Current geometry is an 11/10-column, 19-row (200-cell) authoritative board with a 10-18px responsive radius; curated Levels 1-15 use 59-129 dense round-bubble boards, and generated Levels 16-10000 use version-5 bands of 59-200 bubbles, 92-100% filled ceiling-down board regions, ten deterministic color compositions for shape illusion, jewel-toned circular visual families, post-board mission feasibility, and an empty-board/incomplete-mission diagnostic. Must follow the video and `approved-gameplay-ui.png` as direction, not as required raster backgrounds or rigid pixel clones. Project-owner gameplay approval is still required before Phase 16.

## Phase 16 - Animation/illusion polish

- **Status:** `[ ]` Pending
- **Scope:** Layered parallax, ambient motion, connected screen transitions, path shimmer, current-level emphasis, shooter rotation/recoil, particles, restrained camera response, and reduced-motion behavior.
- **Acceptance criteria:** Motion communicates state and depth; gameplay feedback remains readable; reduced motion is respected; ambient work throttles when hidden/paused; input is not blocked beyond engine needs; performance remains within target.
- **Dependencies:** Phase 15 completed and approved.
- **Report file:** `docs/implementation/reports/PHASE_16_REPORT.md`
- **Notes:** Pending.

## Phase 17 - QA + first hosted build

- **Status:** `[ ]` Pending
- **Scope:** Cross-device and mobile-viewport testing, full regression coverage, performance profiling, critical fixes, E2E smoke flow, and deployment candidate preparation.
- **Acceptance criteria:** Required unit, deterministic, physics, persistence, build, and E2E checks pass; representative mobile profiling is completed; no known critical gameplay-state issue remains; first-hosted-build exit gate is met.
- **Dependencies:** Phase 16 completed and approved.
- **Report file:** `docs/implementation/reports/PHASE_17_REPORT.md`
- **Notes:** Hosting/deployment actions require explicit phase approval and appropriate authority.

## Phase 18 - Senior-dev review gate

- **Status:** `[ ]` Pending
- **Scope:** Collect and document senior-developer feedback on the first hosted build. Do not plan or implement boosters, blockers, events, economy, or other advanced systems until approval.
- **Acceptance criteria:** Review evidence and findings are recorded; issues are classified; any proposed follow-up scope is explicitly approved and versioned before implementation.
- **Dependencies:** Phase 17 completed and deployment candidate available.
- **Report file:** `docs/implementation/reports/PHASE_18_REPORT.md`
- **Notes:** This is the last implementation phase defined by Master Blueprint v1.0.

## Phase 19 - Reserved: scope not defined

- **Status:** `[-]` Intentionally deferred
- **Scope:** No implementation scope is defined or approved in Master Blueprint v1.0. Reserved to satisfy the project-owner instruction that the tracker span Phase 0 through Phase 22.
- **Acceptance criteria:** A project-owner-approved instruction or versioned blueprint revision defines the title, scope, criteria, and dependencies before work starts.
- **Dependencies:** Phase 18 review outcome and explicit approval of new scope.
- **Report file:** `docs/implementation/reports/PHASE_19_REPORT.md`
- **Notes:** Do not infer that this phase is boosters, blockers, events, economy, or any other future feature.

## Phase 20 - Reserved: scope not defined

- **Status:** `[-]` Intentionally deferred
- **Scope:** No implementation scope is defined or approved in Master Blueprint v1.0. Reserved to satisfy the project-owner instruction that the tracker span Phase 0 through Phase 22.
- **Acceptance criteria:** A project-owner-approved instruction or versioned blueprint revision defines the title, scope, criteria, and dependencies before work starts.
- **Dependencies:** Approved preceding work and explicit approval of this phase's new scope.
- **Report file:** `docs/implementation/reports/PHASE_20_REPORT.md`
- **Notes:** No work is authorized.

## Phase 21 - Reserved: scope not defined

- **Status:** `[-]` Intentionally deferred
- **Scope:** No implementation scope is defined or approved in Master Blueprint v1.0. Reserved to satisfy the project-owner instruction that the tracker span Phase 0 through Phase 22.
- **Acceptance criteria:** A project-owner-approved instruction or versioned blueprint revision defines the title, scope, criteria, and dependencies before work starts.
- **Dependencies:** Approved preceding work and explicit approval of this phase's new scope.
- **Report file:** `docs/implementation/reports/PHASE_21_REPORT.md`
- **Notes:** No work is authorized.

## Phase 22 - Reserved: scope not defined

- **Status:** `[-]` Intentionally deferred
- **Scope:** No implementation scope is defined or approved in Master Blueprint v1.0. Reserved to satisfy the project-owner instruction that the tracker span Phase 0 through Phase 22.
- **Acceptance criteria:** A project-owner-approved instruction or versioned blueprint revision defines the title, scope, criteria, and dependencies before work starts.
- **Dependencies:** Approved preceding work and explicit approval of this phase's new scope.
- **Report file:** `docs/implementation/reports/PHASE_22_REPORT.md`
- **Notes:** No work is authorized.
