---
type: Verification
title: "MUPP-065 Chat field above the keyboard: verification"
description: How each requirement of the chat card fitting above the phone keyboard was checked, the test suite before and after, and the requirements as built.
feature: MUPP-065
---

# Verification of MUPP-065

Run locally (production build, local test database), 2026-11-12. Not deployed yet. **Not checked on a real iPhone.** On the user's iPhone this did not work (the card jumped and was squeezed); it was replaced by [MUPP-068](../MUPP-068-chat-keyboard-native/verification.md), which the user confirmed works.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-065-R1 | Browser test `MUPP-065-R1 R2 R3 …` in `tests/MUPP-065-chat-keyboard.spec.ts`: a fake visual viewport 367 px high (and moved 40 px down) puts the card, the field and Skicka inside it; axe in that state. A real iOS keyboard cannot be simulated | local | Pass (fake viewport) | 2026-11-12 |
| MUPP-065-R1 (real) | Manual on an iPhone, in Safari and as a pinned app: open the chat, tap the field | phone | Not checked | – |
| MUPP-065-R2 | Same test: the viewport returns to full height and the card is as before without inline size; closing with the keyboard up leaves nothing on the next opening | local | Pass (fake viewport) | 2026-11-12 |
| MUPP-065-R2 (real) | Manual on an iPhone: close the keyboard, the card is normal again | phone | Not checked | – |
| MUPP-065-R3 | Same test: no inline size without a keyboard, and a pinch-zoom (scale 2) changes nothing; the seven MUPP-043 chat tests pass unchanged | local | Pass | 2026-11-12 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: DOM sizing only; the 369 existing pass | local | Pass | 2026-11-12 |
| Browser tests | The new test above and the MUPP-043 chat tests | local | Pass | 2026-11-12 |
| Smoke test | Not applicable: no main page or flow changed | – | – | – |
| Real device | Manual on an iPhone, Safari and pinned app | phone | Not checked | – |
| Accessibility | axe on the open chat with the keyboard state; live checklist not done | local | Pass locally; live not checked | 2026-11-12 |
| Security | Not applicable, see [review.md](review.md) | – | – | – |
| Code review | [review.md](review.md) | local | Passed | 2026-11-12 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 165 browser | not measured on a clean `main` | – |
| After | 369 unit, 166 browser | 337.2 s (budget 180 s) | 7.5 s |

The suite was already over budget with eight slow tests that are not part of this change (the run included the other tests of `main`); the new test takes 1.5 s.

## Definition of Done

- [ ] Tests: the real-phone checks are not done
- [ ] Test suite: over budget before this change too; the new test is 1.5 s
- [ ] Deployed, and the smoke tests pass against production (Live tests)
- [ ] Accessibility: live checklist not done
- [x] Requirements in the card match what was built; no open questions; `solution.md` describes how it was built
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` pass (build ran in the tests)
- [x] Code review done, no must-fix findings; see [review.md](review.md)
- [x] No larger improvements to add to the board

## Requirements as built

### MUPP-065-R1 The field is visible above the keyboard

While the on-screen keyboard is open, the chat card fits inside the visible part of the screen (the visual viewport), so the message field and the Skicka button are fully visible, and it follows the viewport when it scrolls.

### MUPP-065-R2 Back to normal when the keyboard closes

The card returns to 75dvh and centred when the keyboard closes; nothing remains after the card is closed.

### MUPP-065-R3 No change without a keyboard

Without a keyboard (desktop, or a pinch-zoom) the card looks and behaves as before.

## Notes

The keyboard detection ignores pinch-zoom (found in review).

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
