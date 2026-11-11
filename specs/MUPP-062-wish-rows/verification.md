---
type: Verification
title: "MUPP-062 Wish rows on the Secret Santa match page: verification"
description: How each requirement of the wish rows on the match page and the bold labels was checked, the test suite before and after, and the requirements as built.
feature: MUPP-062
---

# Verification of MUPP-062

Everything ran locally (a production build, the local test database), 2026-11-11. Deployed the same day (PR #201); the live checks are at the end of this file.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-062-R1 | Browser test `MUPP-005-R1 R2 R3 R4 R5 MUPP-062-R1 …` in `tests/MUPP-005-kid-card-and-claiming.spec.ts`: the two labels are `strong` with weight 600 and the paragraph (the value) has weight 400; the text and order of the details and the missing lines are checked by the same test as before | local | Pass | 2026-11-11 |
| MUPP-062-R2 | Browser test `MUPP-042-R1 R2 MUPP-062-R2 …` in `tests/MUPP-042-santa-your-person.spec.ts`: three collapsed rows (`aria-expanded` false, no details), no checkbox, "Paxad", "Kan köpas flera gånger" or button to change; expanding shows "Beskrivning:" and "Storlek:" in bold and the link that opens in a new tab and is announced as such; collapsing hides it; a title-only wish and a `javascript:` address show no details and no link; the empty match says "Inga önskningar ännu."; axe in the collapsed and the expanded state | local | Pass | 2026-11-11 |
| MUPP-062-R3 | `MUPP-051-R2 … MUPP-062-R3 …` in `tests/design.spec.ts` (375 x 667): the collapsed row is at least 56 px high (the children's row is 44 px), the title is 16 px as on the children's list, no sideways scroll, axe in the dark and, with the row open, in the light theme. The size was chosen with the user from a screenshot of the match page at 375 px (a version with larger text was dropped) | local | Pass | 2026-11-11 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: no logic or data changed; the 354 existing ones pass | local | Pass | 2026-11-11 |
| Browser tests | The three tests above changed (no new test, no new page load); `addSantaWish` in `tests/family-db.ts` takes optional description, size and url | local | Pass (154) | 2026-11-11 |
| Smoke test | Not applicable: no main page or flow added; the Live tests run on `main` after the merge (`82051eb`) passed | live | Pass | 2026-11-11 |
| Accessibility | axe in the match page collapsed and expanded and, open, in the light theme; live checklist: see "Live checks" below | local and live | Pass; live: see "Live checks" for what is not checked | 2026-11-11 |
| Security | Not applicable: no route, action, query or data changed; `/security-review` not needed (see [review.md](review.md)) | – | – | – |
| Code review | [review.md](review.md) | local | See review | 2026-11-11 |

## Live checks

On https://muppbarnen.vercel.app after the merge, in the built-in browser pane at 320 px, 2026-11-11. Nothing was saved. Checklist numbers from [accessibility.md](../../wiki/system/accessibility.md).

| Item | Result |
|---|---|
| R1 on a child's list (Otis, 13 wishes, all rows opened) | Pass: every "Beskrivning:" and "Storlek:" is bold (600) and the text after it normal (400); the order and the text are as before |
| 4 Reflow at 320 px | Pass for the children's list: the page is 320 px wide and the list does not scroll sideways. 200 % zoom not checked |
| The match page, 1 Keyboard (320 px) | Pass: Tab from the top goes back arrow, menu, then the wish rows in list order; Enter and Space open a row (`aria-expanded` true). 2026-11-11 |
| The match page, 2 Focus ring | Pass: the focused row has a solid 3 px ring (`:focus-visible`), not hidden by anything. 2026-11-11 |
| The match page, 4 Reflow | Pass at 320 px and 375 px (page width = viewport, no sideways scroll, rows 254 and 309 px wide), and at a 640 px viewport (what 200 % zoom of a 1280 px window gives). Real browser zoom not used. 2026-11-11 |
| The match page, 6 Contrast | Pass: title and chevron `rgb(200, 208, 220)` on `rgb(20, 25, 32)` are 11.36:1 (the chevron needs 3:1). The site has one dark theme only: with light colour scheme emulated the page is identical, so there is no light theme to check. 2026-11-11 |
| The match page, 7 Row height and target | Pass: six rows, each 56 px high and 254 px wide at 320 px (309 px at 375 px), above 44 px. 2026-11-11 |
| The match page, new-tab link | Not checked live: the participant's wishes in this group are title-only (six wishes: no description, size or link), so no "Länk till presenten" and no "(öppnas i en ny flik)" was on screen, and nothing may be saved on the live site to add one. Checked locally in `MUPP-042-R1 R2 MUPP-062-R2 …` |
| The match page, "Beskrivning:" and "Storlek:" bold | Not checked live, same reason (title-only wishes). Checked locally and on a child's list live (above) |
| 3 VoiceOver | Not checked (needs a person with VoiceOver) |
| The children's list, light theme and 200 % zoom | Not checked: there is no light theme; the page that opens a child's list shows the onboarding dialog in a fresh browser, and closing it would set a cookie, so the list was not opened at 640 px |
| 9 Errors and labels | Not affected: no form or error |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 354 unit + 154 browser, 314.7 s (MUPP-060) | – | 6.9 s |
| After | 354 unit (0.6 s) + 154 browser | 310.6 s (budget 180 s) | 7.3 s (`design.spec.ts`, got a few assertions, no new page load) |

Over budget with and without this change (TECH-019). This change added no test and no page load.

## Definition of Done

- [x] Tests: every requirement has a test; `npm run test:unit` and `npm run test:local` pass
- [ ] Test suite: over budget before this change (TECH-019); nothing added here
- [x] Deployed, and the smoke tests pass against production (Live tests): the run on `main` after the merge passed (2026-11-11)
- [x] Accessibility: axe passes locally; live, the match page is checked for keyboard, focus ring, reflow (320, 375 and 640 px), contrast and target size. Accepted by the user without VoiceOver, real 200 % zoom, and the link and bold labels on the match page (its wishes have no details; covered by the local tests) (2026-11-11)
- [x] Requirements in the card match what was built (copied below)
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers: `SlimCard` and `WishDetails` stay in use by the own list and the admin lists; the match page's `WishCard` is removed
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` pass (`npm run build` ran as part of `npm run test:time`)
- [x] Code review: passed, see [review.md](review.md)
- [x] Technical tasks: none noticed

## Requirements as built

- **MUPP-062-R1:** "Beskrivning:" and "Storlek:" are bold (semibold, 600) in the expanded row of a child's wish list; the values stay normal; order and texts as before.
- **MUPP-062-R2:** the match page shows each wish as a collapsed row (title wrapping like the children's list, chevron) that expands to "Beskrivning: …", "Storlek: …" and "Länk till presenten" (new tab, announced), without checkbox, claimed marks, "Kan köpas flera gånger" or buttons; no empty lines and no non-http(s) link; "Inga önskningar ännu." when there are none.
- **MUPP-062-R3:** the match rows are 56 px high (the children's row: 44 px) with the same text sizes (16 px title, 14 px details), still touch targets; chosen by trying it on a phone, written in `DESIGN.md`.

## Notes

The wrapping of a long title (two lines collapsed, the whole title open) has no test of its own on the match page: it comes from the shared `WishRow`, which the children's list tests (MUPP-023) check. A long title keeps the small text (14 px) also in a roomy row, as on the children's list.

The card's R3 said "a little more height and text size" and left the size to be chosen; the user chose more height only (56 px), with the text sizes of the children's row. Card #192 is updated to say so.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
