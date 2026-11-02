---
type: Solution
title: "MUPP-025 Close animation visible on iPhone: solution"
description: "How the closing copy gets a longer motion and a later fade so it is seen on a phone, and the WebKit test."
feature: MUPP-025
card: "#81"
depends_on: [MUPP-016, MUPP-022]
---

# MUPP-025 Close animation visible on iPhone: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 81`.

## Data

None.

## Interface

- `app/components/transition.ts`: `play(copy, transform)` runs two animations on the copy for `CLOSE_MS` (300 ms): the move (`EASE`) and the fade (linear, fully opaque until `FADE_AFTER` = 40 %, then to 0). `shrinkTo` and `sinkAway` pass the transform. The copy is removed on finish and cancel of the move, and after the safety time.
- `tests/MUPP-025-close-animation-webkit.webkit.spec.ts`: iPhone 13 profile in WebKit; samples the copy every frame. `playwright.config.ts` ignores `*.webkit.spec.ts` unless `WEBKIT` is set; `npm run test:webkit` sets it.

## Decisions

- **Cause.** The copy moved and faded on one curve (strong ease-out, 200 ms): after about 100 ms it was less than 30 % opaque, so the motion was a short blink, which on a phone is easy to miss. The WebKit run showed the copy is created and animated there (also with the main thread blocked for 250 ms), so the guess that Safari cancelled it was wrong. Before the change the test measured 13 ms of clear visibility; it needs 100 ms.
- **Two animations.** One `animate` call has one easing for all properties; the move should be quick at first and the fade should wait, so they are separate.
- **Not in the normal suite.** WebKit is not installed in CI and the suite is near its 180 s budget; the test is run by hand.
- **Not proven on a real phone:** an emulated WebKit is not iOS, see `verification.md`.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).

[Specifications](../index.md)
