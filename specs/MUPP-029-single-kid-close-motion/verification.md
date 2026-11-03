---
type: Verification
title: "MUPP-029 Single-kid wish list close motion: verification"
description: How each requirement of Single-kid wish list close motion was checked, the test suite before and after, and the requirements as built.
feature: MUPP-029
---

# Verification of MUPP-029

How each requirement was checked.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-029-R1 | Test `MUPP-029-R1 R2 the single kid list grows out of the button and shrinks back into it, with transform and opacity only` in `tests/MUPP-029-single-kid-close-motion.spec.ts`: the opening's first keyframe moves and scales the list's box onto the button's, the list ends at rest and usable with focus on the fold-up arrow; the closing copy's last keyframe lands on the button, the card is closed with focus on "Önskelista", the copy is gone at the end, axe on the closed card; Esc closes the same way and a press during the motion opens at once. `MUPP-016-R6` (double press, Esc during the motion) still passes | local | Pass | 2026-11-03 |
| MUPP-029-R2 | The same test: only `opacity` and `transform` are animated, opening and closing. `MUPP-029-R2 in WebKit on a phone …` in `tests/MUPP-025-close-animation-webkit.webkit.spec.ts` (`npm run test:webkit`, iPhone 13): sampled every frame from the press until the copy is gone, there is no frame where the list is missing and the copy is not there yet, the copy shrinks more than 20 px in height and fades below 0.2, and the card's top and height are the same in every frame | local (WebKit) | Pass | 2026-11-03 |
| MUPP-029-R2 (on the real phone) | Manual check by the user: opened and folded up the list on their iPhone; the opening and the closing look good | live | Pass | 2026-11-03 |
| MUPP-029-R3 | Test `MUPP-029-R3 the single kid list opens and closes at once, without movement` (reduced motion): no animations other than colour transitions while opening and closing, and no copy | local | Pass | 2026-11-03 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | None: no logic that can be tested alone (`growScale` and `onto` measure the page); `npm run test:unit`: 137 passed | local | Pass | 2026-11-03 |
| Browser tests | `tests/MUPP-029-single-kid-close-motion.spec.ts` (2 tests). They replace MUPP-016's single-kid tests (R1, R2 and the single-kid R5), which tested the slide this card removes. `expectOnto`, `transformsOf`, `GHOST`/`ghost` and `Box` moved to `tests/helpers.ts` and are shared with the MUPP-016, MUPP-022 and MUPP-025 tests. The WebKit test of MUPP-025 got a MUPP-029-R2 test, run by hand: `npm run test:webkit`, 2 passed | local | Pass | 2026-11-03 |
| Smoke test | Not needed (card): no page or flow is added or changed | – | Not applicable | 2026-11-03 |
| Accessibility | `expectNoA11yViolations` on the closed card after the motion (MUPP-029-R1 R2); focus ends on the same element as before (fold-up arrow when opened, "Önskelista" when closed). The phone check by hand: done by the user on their iPhone (live, 2026-11-03). The checklist item 11 (reduced motion) on the live site: checked by the user (reported 2026-11-03) | local, live | Pass | 2026-11-03 |
| Security | Security points in the review; `/security-review` not needed (card): presentation only | local | Pass | 2026-11-03 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-03 |
| Design | Impeccable critique on the running site at 375 px (one context, not two sub-agents): detector clean, frozen frames of the opening and the closing; see [solution.md](solution.md) | local | Pass | 2026-11-03 |

## Test suite

`npm run test:time` before and after the change.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (TECH-014 on `main`, its two runs) | 137 unit + 104 browser | 163.0 s and 161.1 s (browser) | 4.5 s |
| After | 137 unit + 103 browser | 161.6 s (browser) + 0.3 s (unit) | 4.2 s |

Three MUPP-016 single-kid tests became two MUPP-029 tests, so the suite is one test shorter and stays under the 165 s target.

## Definition of Done

- [x] Tests: every check in the card's test plan is done (the phone check by hand is the user's, below); every requirement is tested; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets (161.6 s, slowest 4.2 s), and the new tests follow the quality rules in `wiki/system/testing.md` (`goto`, `animationsDone`, `pageAnimationsDone`, no fixed waits)
- [x] Deployed, and the smoke tests pass against production (Live tests): Live tests run 41614915709 for the merge `f144028`, passed (2026-11-03)
- [x] Accessibility: axe passes on the changed state; the phone check on the live site is done (the user, 2026-11-03); the checklist item 11 on reduced motion on the live site is checked by the user (reported 2026-11-03)
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/startsidan.md`), system docs (`wiki/system/start-page.md`, `wiki/system/design.md`, `DESIGN.md`) and `wiki/log.md` updated
- [x] No leftovers: `sinkAway`, `.wish-slide` and its class are removed, and the copied test helpers are shared
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board: none

## Requirements as built

### MUPP-029-R1 The list shrinks into the button and grows out of it

The site shall, when the wish list of a single-kid card is folded up, shrink the list (width and height) towards the place where the "Önskelista" button comes back and fade it on the way, in about 300 ms, as `shrinkTo` does for several kids; and, when it is opened, grow it out of the button the same way in reverse. No copy of the list or other visual is left over when the motion ends.

- **Given** an open list on a single-kid card, **when** it is folded up, **then** the list shrinks into the button's place and the card ends plain and closed.
- **Given** a closed single-kid card, **when** the "Önskelista" button is pressed, **then** the list grows out of the button's place to its full size.
- **Given** the motion is running, **when** the visitor presses again (for example "Önskelista"), **then** the site reacts at once and the motion is dropped, as in MUPP-016-R6.

### MUPP-029-R2 Smooth on a phone

The single-kid motion shall only animate `transform` and `opacity` (no layout or `clip-path`), and shall not flicker, jump or show a frame of the final state before it starts, also on an iPhone.

- **Given** the WebKit test of MUPP-025, **when** the closing is sampled frame by frame, **then** the motion has no frame where the list is missing and the card is already closed, and the card below does not jump.
- **Given** the real phone, **when** the list is folded up, **then** the user finds the motion smooth (checked by hand and written in `verification.md`).

### MUPP-029-R3 Reduced motion

With `prefers-reduced-motion: reduce` the list shall open and close at once, with no motion, as today.

## Notes

- Browsing to a single-kid card with the lists open (MUPP-017) no longer plays a motion of its own on the list: there is no pressed button to grow from, and the card slides in with the list. The CSS slide used to play there.
- Small and related fix carried along (CLAUDE.md): `specs/TECH-014-test-time/verification.md` now records that Live tests passed against production for the TECH-014 merge `3814d9e` (run 41611939784, 2026-11-03).

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
