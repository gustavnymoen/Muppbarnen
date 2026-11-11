---
type: Verification
title: "MUPP-062 Wish rows on the Secret Santa match page: verification"
description: How each requirement of the wish rows on the match page and the bold labels was checked, the test suite before and after, and the requirements as built.
feature: MUPP-062
---

# Verification of MUPP-062

Everything ran locally (a production build, the local test database), 2026-11-11. Not yet deployed: the live checks are not done.

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
| Smoke test | Not applicable: no main page or flow added | – | – | – |
| Accessibility | axe in the match page collapsed and expanded and, open, in the light theme; the live checklist is not done yet (after the deploy) | local | Pass locally; live not checked | 2026-11-11 |
| Security | Not applicable: no route, action, query or data changed; `/security-review` not needed (see [review.md](review.md)) | – | – | – |
| Code review | [review.md](review.md) | local | See review | 2026-11-11 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 354 unit + 154 browser, 314.7 s (MUPP-060) | – | 6.9 s |
| After | 354 unit (0.6 s) + 154 browser | 310.6 s (budget 180 s) | 7.3 s (`design.spec.ts`, got a few assertions, no new page load) |

Over budget with and without this change (TECH-019). This change added no test and no page load.

## Definition of Done

- [x] Tests: every requirement has a test; `npm run test:unit` and `npm run test:local` pass
- [ ] Test suite: over budget before this change (TECH-019); nothing added here
- [ ] Deployed, and the smoke tests pass against production (Live tests): after the merge
- [ ] Accessibility: axe passes locally; the live checklist after the deploy
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
