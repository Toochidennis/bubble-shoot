# Phase 17 Report - QA, responsive fixes, and Bubble Shooter ad preparation

## Phase status

- **PHASE:** Phase 17 - QA + first hosted build
- **STATUS:** In progress
- **OWNER APPROVAL:** Approved on 2026-11-13 after screenshot review
- **LINKSCHOOL BRIDGE:** Prepared in the local LinkSchool worktree and left uncommitted at the owner's request; existing ad placements preserved

## Objective and scope

Address the screenshot's native-banner overlap; make the game adapt to the banner inset; add the two approved, optional Bubble Shooter reward moments; improve poor-display contrast and reduce Canvas work on lower-end hardware; verify the web-side layout and host protocol. No deployment or existing ad placement change is included.

## Sources reviewed

- `docs/Bubble_Shooter_HTML5_Game_Master_Blueprint_v1.0.pdf`, especially its mobile-first layout, safe-area, 60 FPS, DPR, and Phase 17 QA constraints.
- `docs/implementation/CODEX_RULES.md`, `PROJECT_STATUS.md`, `PHASE_TRACKER.md`, Phase 16 report, screenshot supplied by the owner, and relevant Bubble Shooter source.
- LinkSchool inspection and approved bridge changes in `game_player_screen.dart` and `game_reward_bridge.dart`. The existing Number Merge origin, placements, callback, and `GameAdManager` flow remain available.
- Google AdMob rewarded-ad guide and policy, Google game placement guidance, MDN Canvas optimization, and W3C WCAG use-of-color guidance; links are in `docs/implementation/BUBBLE_AD_HOST_INTEGRATION.md`.

## Implemented in Bubble Shooter

- Added a host layout-inset contract plus an optional `nativeAdInset` first-paint URL parameter. The CSS reserves banner space for app content and for the wide-screen spacing override.
- Added a version 1 JS reward client for the fixed `level_rescue` and `color_swap_refill` placements. It advertises neither offer until the host reports it, only grants on `earned`, acknowledges results, and leaves normal play available when the host is absent.
- Added one free current/next Color Swap charge per level attempt and one optional rewarded refill per attempt. Added a one-time five-shot continuation after a normal out-of-shots loss; content-invariant loss cannot be rescued.
- Added saved High Contrast Bubbles colors and outlines. The standard bubble shape and matching rules remain unchanged.
- Replaced the Color Swap text control with a clear swap icon and visible charge badge.
- Capped Canvas DPR at 1.25 for devices reporting four or fewer CPU threads or at most 4 GB memory, and at 1.75 otherwise. Reduced repeated board-bubble shadow blur and raised the bounded default frame delta from 50 ms to 100 ms.
- Fixed the desktop padding override that was dropping the banner inset in landscape/desktop viewports.
- Prepared the LinkSchool host route for `https://bubble.linkskool.com`, Bubble Shooter's two fixed reward placements, and `BubbleShooterHost.receive`. The bridge reuses the app's configured rewarded-ad flow; these host edits remain uncommitted at the owner's request and no existing ad placement was changed.

## Checks and evidence

- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed after removing temporary browser scripts from the workspace.
- `npm.cmd run build`: passed. Vite still reports a bundle chunk over 500 kB; no chunk-splitting change was included in this phase slice.
- Targeted Dart analysis of the two changed LinkSchool bridge files: no issues found.
- Local Chrome viewport check with a simulated 46 CSS-pixel native banner: 320x568, 360x750, 393x873, 430x932, 844x390, and 1280x800. No horizontal overflow; game stage and next bubble stayed above the simulated banner after the desktop override fix.
- Mocked host check: capability response enabled the Color Swap refill; request was sent, `earned` was acknowledged, and one charge was restored. High-contrast preference persisted through reload.
- A manual screenshot confirmed the revised 360x750 gameplay layout and a separate screenshot confirmed the higher-contrast palette.
- Unit suite was not run for this report slice. The local mock does not verify the Flutter WebView channel or real AdMob delivery.

## Remaining work and limitations

- The LinkSchool bridge edits remain uncommitted at the owner's request. Real native rewarded-ad delivery and the earned callback still need Android WebView verification with test ad units. The web-side mock and source bridge are not evidence of an actual impression.
- The game-side host inset API is available; no changes were made to LinkSchool's existing banner placement or sizing.
- No physical Android/iOS low-end device profiling, production/test AdMob impression, host banner screenshot, or hosted deployment candidate has been verified.
- The reward rescue UI was not driven through a full real loss in the browser. The game model guards and web callback path compile; native delivery remains unverified.
- High contrast improves visibility on dim screens but does not add shape cues. The approved sphere rules currently prohibit internal center markings; any shape-coded option needs its own visual review.
- Vite logged Howler `InvalidStateError: AudioContext is closed` messages during repeated automated page reload/browser shutdown. They did not appear as a gameplay failure in the viewport pass; audio lifecycle handling was outside this slice and should be checked separately.

## Confirmation

Phase 17 remains in progress. No Phase 18 work, LinkSchool app edit, or deployment was started. Stop here for the owner's review and separate permission for the LinkSchool bridge changes.
