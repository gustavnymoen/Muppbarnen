---
type: Verification
title: "MUPP-025 Close animation visible on iPhone: verification"
description: How each requirement of Close animation visible on iPhone was checked, the test suite before and after, and the requirements as built.
feature: MUPP-025
---

# Verification of MUPP-025

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-025-R1 | WebKit test `MUPP-025-R1 …` (`npm run test:webkit`): the copy moves, is more than half opaque for at least 100 ms and ends faded; it **failed before** the change (13 ms) and passes after. Chromium tests `MUPP-016-R3 R4 …` and `MUPP-022-R1 …` pass | local (WebKit, iPhone 13 profile; Chromium) | Pass | 2026-11-02 |

## Test suite

| | Tests | Total time |
|---|---|---|
| Before (MUPP-022 PR) | 132 unit + 99 browser | 161.9 s |
| After | 132 unit + 99 browser (+1 WebKit, run by hand) | 166 s (3 MUPP-016 tests were updated for the two close animations and re-run: pass) |

`npm run lint`, `lint:docs` and `typecheck` pass; the production build is made by the test server.

## Definition of Done

- [x] Tests: all checks of the test plan done; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets (see above)
- [x] Deployed, and the smoke tests pass against production (Live tests): passed after the merge, 2026-11-02
- [x] Accessibility: no visible state added; the live checklist: the user reports the live checklist was tested by hand, including the screen reader items (said by the user, 2026-11-09, not recorded item by item)
- [x] Requirements match what was built (below); `solution.md` describes how
- [x] Manual, system docs and `wiki/log.md` updated (no manual change: the visitor sees no new function)
- [x] No leftovers
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] No larger improvements to add to the board

## Requirements as built

### MUPP-025-R1 The closing view stays visible while it shrinks

When a kid's view is closed the shrinking copy is more than half opaque for at least 100 ms before it fades, and is then removed; the motion takes 300 ms and uses only `transform` and `opacity`. Replaces the 200 ms of MUPP-022-R1.

## Notes

- **Checked on the user's iPhone after the merge (2026-11-02):** it looks better and the motion is seen; the user finds it very detailed (buttons and all are visible while it shrinks), which is good enough for now. Earlier: not checked on a real iPhone. The fault was not reproduced as a missing copy; the change makes the motion longer and later to fade. After the merge: close a kid on Christmas Eve and on a card with several kids on the iPhone and see if the card is seen shrinking into its button. If not, the next step is to look at the iPhone with Safari's Web Inspector on a Mac.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
