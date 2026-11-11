---
type: Verification
title: "MUPP-063 Admin page layout on desktop: verification"
description: How each requirement of the admin page layout on desktop was checked, the test suite before and after, and the requirements as built.
feature: MUPP-063
---

# Verification of MUPP-063

Everything ran locally (a production build, the local test database), 2026-11-11. Deployed the same day (PR #204); the live checks are at the end of this file.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-063-R1 | `MUPP-063-R1 R2 R3 …` in `tests/design.spec.ts` (the admin start test): at 1280 and 1920 px every name, also a 39-letter word, is on one line (height under 32 px) and the three ordinary names are shown in full; at 320 px the long name has `text-overflow: ellipsis`, is cut (`scrollWidth` larger than `clientWidth`), is one line and the page does not scroll sideways | local | Pass | 2026-11-11 |
| MUPP-063-R2 | Same test: at 1280 and 1920 px the four cards have the same x, width and height and are stacked (each starts below the one before). The phone checks of MUPP-053 in the same test (375 and 360 px, no sideways scroll) are unchanged and pass | local | Pass | 2026-11-11 |
| MUPP-063-R3 | Same test: at 1920 px the Secret Santa tab section is at most 672 px wide and starts at the left edge of the Barn tab cards; at 1280 px the manage page's frame starts at the same left edge and its row is at most 672 px | local | Pass | 2026-11-11 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: layout only; the 354 existing ones pass | local | Pass | 2026-11-11 |
| Browser tests | The existing admin tests pass (154); no new test | local | Pass | 2026-11-11 |
| Design test | In the existing admin test of `tests/design.spec.ts` (above); the pages were also looked at in screenshots at 1440 px | local | Pass | 2026-11-11 |
| Smoke test | Not applicable: no main page or flow changes; the Live tests run on `main` after the merge (`a2fc98c`) passed | live | Pass | 2026-11-11 |
| Accessibility | axe in the same test at 1280 px as before; live checklist: see "Live checks" below | local and live | Pass; VoiceOver, 200 % zoom and the light theme not checked | 2026-11-11 |
| Security | Not applicable: layout only; `/security-review` not needed | – | – | – |
| Code review | [review.md](review.md) | local | See review | 2026-11-11 |

## Live checks

On https://muppbarnen.vercel.app after the merge, in the built-in browser pane, signed in as the master admin, Barn tab with three kids (Otis, Wilda, Arthur), 2026-11-11. Nothing was saved. Checklist numbers from [accessibility.md](../../wiki/system/accessibility.md).

| Item | Result |
|---|---|
| R1 Names whole | Pass: at 1280 px and 320 px every name is one line (28 px high) and shown in full; the long-name case (ellipsis) is covered by the browser test only, since no kid has such a name |
| R2 One column | Pass: at 1280 and 1920 px the three cards are 672 x 46 px, at the same left edge (96 px and 416 px), stacked; at 320 px they are 288 x 46 px |
| R3 Same width | Pass: at 1280 px the Secret Santa tab section is 672 px wide and starts at the same left edge as the cards (96 px). The manage page was not opened live |
| 4 Reflow at 320 px | Pass: no sideways scroll at 320, 1280 and 1920 px. 200 % zoom not checked |
| 7 Target size | Pass: the Storlekar and Önskelistor buttons are 32 px high (110 and 123 px wide), the known 32 px exception for admin icon buttons (24 px needed) |
| 1, 2, 3, 6, 9 | Not checked live (keyboard, focus ring, VoiceOver, contrast, errors): the change moves cards and adds no new control or colour |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 354 unit + 154 browser, 310.6 s (MUPP-062) | – | 7.3 s |
| After | 354 unit (0.5 s) + 154 browser | 315.1 s (budget 180 s) | 7.2 s (not touched) |

Over budget with and without this change (TECH-019). This change added no test and no page load; the admin test got a few assertions and two more kids.

## Definition of Done

- [x] Tests: every requirement has a test; `npm run test:unit` and `npm run test:local` pass
- [ ] Test suite: over budget before this change (TECH-019); nothing added here
- [x] Deployed, and the smoke tests pass against production (Live tests): the run on `main` after the merge passed (2026-11-11)
- [ ] Accessibility: axe passes locally and live items 4 and 7 are done; VoiceOver (3), 200 % zoom and the light theme are not checked
- [x] Requirements in the card match what was built (copied below)
- [x] Manual, system docs and `wiki/log.md` updated: the manual says nothing about the layout, so only the system page, `DESIGN.md` and the log
- [x] No leftovers
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` pass (`npm run build` ran as part of `npm run test:time`)
- [x] Code review: passed, see [review.md](review.md)
- [x] Technical tasks: none noticed

## Requirements as built

- **MUPP-063-R1:** a child's name on the Barn tab is on one line at every width and is never split inside a word; a name that does not fit is cut with an ellipsis.
- **MUPP-063-R2:** the child cards are one per row at every width, with the same width and height; the phone layout is as before.
- **MUPP-063-R3:** the Barn tab, the Secret Santa tab and `/admin/hantera` are at most 672 px wide and start at the same left edge.

## Notes

The wish list page of a kid (`/admin/barn/[id]/onskelistor`) was looked at at 1440 px and left as it is: it uses the page frame's full width and reads fine. Only the cards in `ChildCard` use the new `nowrap`.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
