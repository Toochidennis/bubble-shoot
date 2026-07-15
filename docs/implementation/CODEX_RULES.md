# Codex Project Rules

## Purpose

This file controls implementation work for the Bubble Shooter HTML5 game. Read it, the current project status, the phase tracker, and the latest source-of-truth documents before editing the project.

## Source-of-truth hierarchy

1. The latest explicitly approved revision of `docs/Bubble_Shooter_HTML5_Game_Master_Blueprint_v1.0.pdf`.
2. Explicit written project-owner or senior-developer instructions issued after that revision and recorded in `DECISIONS.md` and `CHANGELOG.md`.
3. The approved visual references:
   - `home-dashboard.png`
   - `approved-gameplay-ui.png`
4. The approved implementation plan for the current phase.
5. Existing code behavior when it is not contradicted by a higher authority.

The blueprint is the primary authority for functionality, architecture, gameplay, progression, scalability, and project scope. The reference images are the authority for visual direction, mood, hierarchy, layout philosophy, depth, lighting, game feel, and asset-light execution. Visual references are directional; they are not instructions to embed the images or make a rigid pixel clone.

## Change control

- Do not silently invent, remove, or materially change gameplay rules, architecture, navigation behavior, mission rules, visual direction, or project scope.
- A later explicit owner instruction may override the blueprint only when the override is recorded in both `DECISIONS.md` and `CHANGELOG.md`.
- Blueprint revisions must be deliberate and versioned.
- Generated level identity must include a `generatorVersion` so existing level IDs do not drift when generation logic changes.
- Record meaningful architectural and product decisions in `DECISIONS.md`.
- Record actual repository changes in `CHANGELOG.md`.

## Phase gate

- Work on exactly one explicitly approved phase at a time.
- Never begin the next phase automatically.
- Before implementation, state the phase scope and what is out of scope.
- Finish by running relevant tests and checks, writing the phase report, and stopping for approval.
- Do not mark a phase complete merely because code exists.
- A phase is complete only when its required scope is implemented, relevant checks pass, no known critical issue remains in scope, and its report exists.
- Every implementation prompt must end with: "Implement this phase only. Do not proceed to the next phase. Stop after tests and the completion report."
- No opportunistic out-of-phase refactor is allowed unless required to keep the approved phase working; report any such change explicitly.
- New dependencies require a stated reason and must be minimized.

## Product constraints

- Build a polished, modern, mobile-first HTML5 Bubble Shooter that feels like a game world, not a normal website, SaaS product, or admin dashboard.
- Portrait mobile is the primary target. Desktop and tablet may center or letterbox a portrait playfield.
- Respect safe-area insets and derive gameplay geometry from the measured playfield.
- Target smooth 60 FPS on modern mobile hardware, degrading nonessential effects before gameplay responsiveness.
- Keep the project asset-light. Prefer Canvas, CSS gradients, SVG, procedural visuals, lightweight reusable vectors, and code-generated effects.
- Do not require full-screen raster backgrounds for home or gameplay.
- Integrate generic library icons into the game style with custom containers, sizing, gradients, highlights, shadows, glow, and feedback. Never present raw web-app icons.
- Use modern motion, depth, lighting, parallax, particles, transitions, and visual illusion with reduced-motion support.

## Locked technical baseline

- Application shell: React + TypeScript + Vite.
- Gameplay renderer: HTML5 Canvas 2D.
- UI styling: CSS + SVG.
- React UI motion: Motion/Framer Motion by default and used selectively.
- Icons: Lucide first; Iconify only when needed.
- Gameplay animation: Canvas-native engine timeline/state animation.
- Persistence: localStorage initially; IndexedDB only if justified by growth.
- Tests: unit tests, deterministic simulation tests, and E2E smoke tests.
- React owns screens, menus, HUD containers, and lifecycle. Core game rules remain React-independent and independently testable.
- Engine state is authoritative. React observes summaries/events and must not duplicate physics or resolver rules.
- Use a single gameplay Canvas scene or tightly controlled layered canvases. Do not create one DOM element per gameplay bubble.

## Gameplay and progression constraints

- Support 10,000 addressable level IDs initially; the cap must be configurable and expandable without an engine rewrite.
- Do not allocate or render data for every possible level. Store only played/completed records and current progression metadata.
- Levels 1 through 15 are curated onboarding levels using only the `CLEAR_ALL` objective.
- Level access follows the blueprint contract: levels 1-15 curated, 16-100 controlled curated/template-assisted, and 101+ deterministic template-driven generation with override support.
- Deterministic generation must use stable seeds and `generatorVersion`, never time or uncontrolled runtime randomness.
- Do not activate later missions, blockers, special bubbles, pressure systems, or meta-features without phase approval.

## Home dashboard constraints

- The approved Home Dashboard contains the vertically scrollable level map.
- The top HUD and bottom navigation remain fixed while only the level-map world scrolls.
- Virtualize or recycle level nodes; never mount all 10,000 nodes or create a hard-coded 10,000-node page.
- Automatically position near the current level while preserving manual scroll freedom.
- Completed, current, and locked nodes require distinct visual states.
- The center shooter action is the active Quick Play/Continue action and launches the current unlocked level.
- Future navigation and feature controls may remain visible where the approved shell expects them, but they must be genuinely disabled and nonfunctional until their phase is approved.

## Initial feature boundaries

Active when their approved phases are implemented: home dashboard, virtualized level map, Quick Play/Continue, level selection and unlocking, core gameplay, Clear All, mission-engine foundation, stars, best score, and basic settings foundation.

Visible but disabled until explicitly approved: boosters, ranking, rewards/daily reward, missions meta-screen, events, shop, most currency add/purchase actions, and reserved future map behavior.

Future and out of initial scope: cloud accounts/sync, ads, IAP, backend systems, advanced blockers/special bubbles, economy, and other advanced systems.

Disabled controls must not navigate to broken screens, mutate state or currency, fake rewards, or acquire partial functionality because their UI is present.

## Required implementation sequence

1. Read the latest blueprint and relevant repository files.
2. Confirm the phase is explicitly approved.
3. State the intended scope and exclusions.
4. Implement only that phase.
5. Run relevant unit, deterministic, lint, type, build, E2E, runtime, visual, accessibility, and performance checks appropriate to the phase.
6. Update `PROJECT_STATUS.md`, `DECISIONS.md` when needed, and `CHANGELOG.md`.
7. Create or update `reports/PHASE_XX_REPORT.md` with objective, reviewed sources, files, implementation, decisions, checks, results, issues, deferred work, and confirmation that no later phase was implemented.
8. Stop and wait for approval.

## Completion and blocking rules

- Use only the phase statuses defined in `PHASE_TRACKER.md`.
- A critical issue inside phase scope prevents completion.
- A failed required check prevents completion unless the phase is explicitly marked blocked and the failure is documented.
- If a source conflict or material ambiguity cannot be resolved through the hierarchy, stop, mark the affected work blocked, document it, and request owner direction.
- Phase 19 through Phase 22 are reserved slots only because the owner requested a tracker through Phase 22. The current blueprint defines no scope for them; they must remain intentionally deferred until explicitly defined and approved.

