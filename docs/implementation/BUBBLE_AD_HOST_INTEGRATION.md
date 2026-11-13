# Bubble Shooter Ad Host Integration

**Status:** Bubble Shooter's reward client is implemented. LinkSchool bridge edits are present locally but remain uncommitted at the owner's request. Existing ad placements remain in place; real rewarded-ad delivery still needs a device check.

## Why the host needs a change

Bubble Shooter exposes a measured bottom-inset API for hosts that need it. The existing LinkSchool game reward bridge already used LinkSchool's configured rewarded-ad manager for Number Merge; it now also recognizes Bubble Shooter and returns responses to `BubbleShooterHost.receive`. Existing LinkSchool ad placements and the game's current ads are preserved.

## Bubble Shooter web contract

- First paint may pass `?nativeAdInset=46` (example only; use the actual measured banner height in CSS pixels).
- The native player may update the value at runtime with `window.BubbleShooterHost?.setLayoutInsets({ bottom: heightInCssPixels })` whenever the banner's size or visibility changes.
- The game already accounts for device safe areas. Pass the banner height only; do not add the safe-area inset again.
- Reward requests use the existing `GameHost` JavaScript channel and version 1 messages. The page sends `rewarded.ready`, receives `rewarded.capabilities`, and requests only `level_rescue` or `color_swap_refill`. A result uses the existing `{ requestId, status }` shape and the game acknowledges it with `rewarded.ack` plus the host's `bridgeToken`.
- Offers are hidden unless the host advertises that exact placement. The page grants a benefit only for `status: earned`.

## LinkSchool bridge changes

1. Allowlist the deployed Bubble Shooter origin, `https://bubble.linkskool.com`, while preserving the existing Number Merge origin and configured debug preview.
2. Route Bubble Shooter responses to `window.BubbleShooterHost?.receive(...)`; keep Number Merge on `NumberMergeHost.receive`.
3. Advertise only Bubble Shooter's `level_rescue` and `color_swap_refill` placements for that game. Both are fixed gameplay benefits with no client-supplied amount.
4. Reuse LinkSchool's existing configured rewarded-ad manager and earned callback. No banner or other ad placement was changed.
5. Verify the bridge with Google test ad units on an Android WebView before considering production ad delivery. Source compatibility does not prove a real ad impression or earned callback.

## Placement ideas

- **Approved in this game:** one five-shot rescue after a normal out-of-shots loss; one Color Swap refill after the free per-level charge is used. Both require an explicit tap, disclose the exact reward, and have a bounded frequency.
- **Possible later test:** an interstitial only at a natural next-level transition, with a strict frequency cap and only after measuring session retention. Do not show one after every shot, pause, or loss. The host's current interstitial flow is a score-break request, so a next-level placement would need its own agreed contract.
- **Avoid for now:** an ad that doubles stars/level score or skips a level; those can distort progression and require separate balance review.

## Research

- Google recommends a natural reward opportunity such as an extra life after a player runs out, and distinct next-level placements for transition ads: [Ad Placement API placement types](https://developers.google.com/ad-placement/docs/placement-types?hl=en).
- AdMob requires clear pre-ad reward disclosure, affirmative opt-in for rewarded ads, no penalty for declining, and delivery after completion: [Rewarded ad policies](https://support.google.com/admob/answer/7313578?hl=en).
- Flutter AdMob grants rewards through `onUserEarnedReward` and recommends test ad units during development: [Flutter rewarded ads](https://developers.google.com/admob/flutter/rewarded).
- Repeated Canvas shapes should be cached, DPR should be controlled, and `shadowBlur` should be avoided where possible: [MDN Canvas optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas).
- WCAG advises against using color as the only visual distinction: [W3C Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html). The current High Contrast Bubbles preference improves dim-display contrast; shape-coded bubble cues would require a separate visual-rule review.
