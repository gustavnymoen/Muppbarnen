---
type: Verification
title: "MUPP-061 Wish note instead of check mark: verification"
description: How the requirement of the wish note under a participant's name was checked, the test suite before and after, and the requirement as built.
feature: MUPP-061
---

# Verification of MUPP-061

Browser tests ran locally (a production build, the local test database), 2026-11-10. Deployed the same day (PR #195); the live checks are at the end of this file.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-061-R1 | Browser test `MUPP-041-R1 MUPP-061-R1 R2 …` in `tests/MUPP-041-santa-draw.spec.ts`: only the participant with a wish has "Önskelista påbörjad", the line is there, and the line is gone after the stop and the wipe (`tests/MUPP-044-santa-cleanup.spec.ts`). `MUPP-051-R2 … MUPP-061-R1 …` in `tests/design.spec.ts` (375 px, then 320 px): the line is 14 px, contrast at least 4.5:1, the symbol in front is in the green token (`stroke` rgb(95, 154, 115)), it sits below the "Partner: Bo Ek" line of the same card, no sideways scroll, axe. A screen reader reads it as ordinary text because it is text without a role. The unit test `MUPP-041-R1 a participant has wishes…` is unchanged | local | Pass | 2026-11-10 |
| MUPP-061-R1 (no check mark left) | Old `CheckIcon` and the old accessible name "Har skrivit en önskelista" are gone from `app/`, `lib/` and `tests/` (grep) | local | Pass | 2026-11-10 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: no logic changed; the 344 existing ones pass | local | Pass | 2026-11-10 |
| Browser tests | Existing checks changed in 3 files, no new test and no new page load | local | Pass (151) | 2026-11-10 |
| Design test | In the existing Secret Santa phone test (above) | local | Pass | 2026-11-10 |
| Smoke test | Not applicable: no main page or flow added; the Live tests run on `main` after the merge passed | live | Pass | 2026-11-10 |
| Accessibility | axe in the changed state (above); live checklist: see "Live checks" below | local and live | Pass; VoiceOver, 200 % zoom and the light theme not checked | 2026-11-10 |
| Security | Not applicable: text only | – | – | – |
| Code review | [review.md](review.md) | local | Passed | 2026-11-10 |

## Live checks

On https://muppbarnen.vercel.app after the merge, in the built-in browser pane at 320 px, signed in as the master admin, group Bollnäs (started, 4 participants), 2026-11-10. Checklist numbers from [accessibility.md](../../wiki/system/accessibility.md).

| Item | Result |
|---|---|
| 4 Reflow at 320 px | Pass: the page is 320 px wide, no sideways scroll; the cards, with the partner line and the wish note on their own lines, end at 291 px. 200 % zoom not checked |
| 6 Contrast | Pass: the text 5.53:1 (14 px, muted on the card, dark theme), the green symbol 5.34:1 (needs 3:1); the light theme not checked |
| Symbol hidden from screen readers | Pass: the symbol has `aria-hidden="true"`; the text is plain text. VoiceOver itself not checked (item 3) |
| 7 Target size | Not measured; the cards were 54 and 70 px high and nothing new is clickable |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 333 unit + 149 browser, 301.5 s (MUPP-059, `main` at that time) | 301.5 s | 7.2 s |
| After | 344 unit (0.6 s) + 151 browser | 305.2 s (budget 180 s) | 6.8 s (MUPP-038, not touched) |

The suite is over its budget with and without this change (TECH-019). This change added no test and no page load; the extra tests come from cards merged since.

## Definition of Done

- [x] Tests: every requirement has a test; `npm run test:unit` and `npm run test:local` pass
- [ ] Test suite: over budget before this change (TECH-019); nothing added here
- [x] Deployed, and the smoke tests pass against production (Live tests): the run on `main` after the merge passed (2026-11-10)
- [x] Accessibility: axe passes locally and live items 4 and 6 are done; VoiceOver (item 3), 200 % zoom and the light theme are not checked (accepted as done by the user, 2026-11-11)
- [x] Requirements in the card match what was built (copied below)
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers: the old `CheckIcon` and the old check-mark checks are removed
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` pass (`npm run build` ran as part of `npm run test:time`)
- [x] Code review: see [review.md](review.md)
- [x] Technical tasks: none noticed

## Requirements as built

### MUPP-061-R1 A text line instead of the check mark

The card of a participant who has written at least one wish shows the text "Önskelista påbörjad" in small muted blue-grey text (the style of the group card's status line) under the name, with a decorative green check circle in front (changed with the user, 2026-11-10; the card said no check mark). With a partner, "Partner: <name>" and the wish line each sit on their own line, and the card does not scroll sideways at 320 px. The text is ordinary text with a contrast of at least 4.5:1.

## Notes

The card says "light blue"; the colour is the muted text token of the group card's status line (a blue-grey). The card text and symbol were changed after the user saw the first version: the text was first "Önskelistan på början", and the green symbol was added. The card #188 is updated to match.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
