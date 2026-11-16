---
type: Verification
title: "MUPP-085 Admin wish lists: arrows, slide and button places: verification"
description: How each requirement of MUPP-085 was checked, the test suite before and after, and the requirements as built.
feature: MUPP-085
---

# Verification of MUPP-085

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-085-R1 | Test `MUPP-010-R1 R2 R5 MUPP-083-R2 MUPP-085-R1 R2 R3 R4 R5 …` in `tests/MUPP-010-compact-admin.spec.ts`: both arrows at least 44 px and never overlapping the row's title, pencil or trash can at 320, 375 and 430 px. The choice among A, B and C: screenshots on a 375 px phone shown to the user, who chose A and later asked for the wider frame (see the solution) | local | Pass | 2026-11-16 |
| MUPP-085-R2 | Same test: "Nästa barn" shows the other kid (slide class while it runs, none after), the URL is the other kid's, no request is made and the page is not reloaded (a marker on `window` survives), focus is on the name, axe passes after a flip, Back returns, the arrows go round the end, a sideways swipe flips, a swipe from a button or inside an open card does not, reduced motion has no slide classes, a stranger's wish is not in the page source, and the wish added before flipping is still in the kid's panel when flipping back (fresh lists). The parent scope and that only the parent's own kids are rendered: code review (`KidPage` renders `listChildren(parent.id)`, and the checks before it are unchanged) | local | Pass | 2026-11-16 |
| MUPP-085-R3 | Same test: in the open "Ändra" card Storlekar and Spara have the same height, centres within 1 px, Storlekar to the right | local | Pass | 2026-11-16 |
| MUPP-085-R4 | Same test: no "Storlekar" button on the page before a card is opened | local | Pass | 2026-11-16 |
| MUPP-085-R5 | `expectBackArrow` (`tests/helpers.ts`) in the same test (wish list page), in the Hantera test `MUPP-010-R1 R2 R6 …` and in the not-found check in `tests/MUPP-003-admin-page.spec.ts`: the "Tillbaka" link to `/admin` (or `/`), 44 px, left of and level with the menu button, and no "Till barnen" or "Till startsidan" link. There is no sizes page any more (the sizes are a card on the parent's page), so none to check | local | Pass | 2026-11-16 |
| MUPP-085-R6 | `tests/design.spec.ts`, the test of the dialog "Lägg till present": the step back is 44 px and has the return arrow's path | local | Pass | 2026-11-16 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | None new: the neighbour rule is unchanged (`lib/kid-neighbours.test.ts`); 441 pass. The slide direction is not a function of its own (it is two lines inside `KidFlipper`), so it is checked in the browser test (the arrows go both ways and round the end) | local | Pass | 2026-11-16 |
| Browser tests | No new file or test: the checks joined the wish list page test, the Hantera test, the not-found check and the "Lägg till present" test; MUPP-083's checks of the top sizes button were removed | local | Pass | 2026-11-16 |
| Smoke test | Not needed for the change (no main page or flow is added); Live tests (the smoke tests) ran after the merge, run 43946433890 on merge commit `0df47a7` | live | Pass | 2026-11-16 |
| Accessibility | axe on the page and after a flip, focus on the name after a flip, reduced motion. The checklist items on the live site: not checked | local | Pass (axe) | 2026-11-16 |
| Security | Security points in the review; `/security-review` not needed (no new route, action or query; only the parent's own kids are rendered) | local | Pass | 2026-11-16 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-16 |

## Test suite

`npm run test:time`. The suite was at its budget (347.3 s), so no new test was added; the checks joined existing ones.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (main, MUPP-083) | 441 unit, 186 browser | 347.3 s | 6.9 s |
| After | 441 unit, 186 browser | 345.5 s | 7.6 s (the wish list page test) |

The wish list page test went from about 5.4 s to about 7.6 s (under the 8 s budget for one test), and the rest of the suite was a little faster in this run, so the total is lower than before; no limit was changed.

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets (345.5 s of 350 s), and the new checks follow the quality rules
- [x] Deployed (pull request 296, merge commit `0df47a7`), and the smoke tests pass against production (Live tests, run 43946433890)
- [ ] Accessibility: axe passes; the live checklist is not done
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual, system docs, `DESIGN.md` and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements: none found

## Requirements as built

### MUPP-085-R1 Arrows that cover nothing

The arrows "Föregående barn" and "Nästa barn" shall never cover a button, a field or text on the page, at 320 to 430 px width. As built (proposal A, chosen by the user after seeing A, B and C on a phone, "like the kid cards"): the content sits in a frame as wide as the page, the arrows are fixed at the screen edges in the middle of the screen, half over the frame's edge, and the cards in the frame are 20 px in from it, so only the edges of the cards go under an arrow and never a row, a title or a button.

Acceptance criteria:

- **Given** a long Jul list and a 320, 375 and 430 px wide window, **when** the page is shown and scrolled, **then** no arrow overlaps a row's title or its buttons.

### MUPP-085-R2 Slide when flipping

Flipping to another kid shall slide the lists sideways, the next kid in from the right and the previous from the left (the opposite way for the previous), without loading the whole page again, and with `prefers-reduced-motion` the kid changes with no movement. The kid can also be changed by swiping sideways on the page, as on the start page's deck, but not while a form card is open or when the touch starts on a button or a field, and a swipe never stops the page from scrolling up and down. The lists of all the parent's kids (a few) are fetched together when the page opens, by the page's own server rendering, so the next kid is there at once and the slide starts without waiting. The arrows and the swipe go only between the parent's own kids, in the order of the admin page, round the end. The URL still changes to the kid's page, the back button and a reload still work, and focus goes to the kid's name. After a change to a list (add, edit, remove, copy) the lists of all the kids in the page are fresh.

Acceptance criteria:

- **Given** two kids, **when** "Nästa barn" is pressed, **then** the other kid's name and lists are shown, the URL is the other kid's page, and the header and the arrows did not reload.
- **Given** reduced motion, **then** nothing moves.
- **Given** a parent with several kids, **when** the page is opened, **then** every kid's lists are already in the page, and a sideways swipe changes the kid like "Nästa barn".
- **Given** a kid of another parent, **then** their page still looks like a kid that does not exist, and their lists are never in the page.

### MUPP-085-R3 Storlekar beside the save button

In the form cards "Ny önskning" and "Ändra", the "Storlekar" button shall be on the same row as the save button ("Lägg till" or "Spara"), at the right, with the same height.

Acceptance criteria:

- **Given** an open form card, **then** the two buttons share one row and their vertical centres are equal.

### MUPP-085-R4 No sizes button at the top

The page shall no longer have the "Storlekar" button at the top right (MUPP-083-R1 is removed); the sizes are reached from the form cards (R3) and from the parent's page.

Acceptance criteria:

- **Given** the wish list page, **then** the only "Storlekar" buttons are inside open form cards.

### MUPP-085-R5 One back button: the arrow, in the header row

Every "go back" to another page shall be the arrow button (`ReturnIcon`, label "Tillbaka") in the header's `back` place, at the left, level with the menu button at the right, as on the Secret Santa pages. This replaces the text buttons "Till barnen" on the wish list page, the sizes page (both through `KidPage`) and "Hantera" (`app/admin/hantera/page.tsx`), which lead to `/admin`, and "Till startsidan" on the not-found page, which leads to `/`.

Acceptance criteria:

- **Given** the wish list, sizes, "Hantera" and not-found pages, **then** each has the "Tillbaka" arrow link with the same vertical centre as the menu button (the not-found page has no menu button: it is in the same corner), 44 px, leading to `/admin` (or `/` on the not-found page), and no text button "Till barnen" or "Till startsidan" is left.
- **Given** any page in the site, **then** the only back controls are this arrow and, inside a dialog, the step back of R6.

### MUPP-085-R6 The step back in "Lägg till present" is the same arrow

The step back in the dialog "Lägg till present" (`AddGiftDialog`, the chevron labelled "Tillbaka") shall use the same arrow (`ReturnIcon`), so one symbol means "back" everywhere. The chevrons of the deck and of the flip arrows stay: they mean "previous" and "next", not "back".

Acceptance criteria:

- **Given** the second step of the dialog, **then** its "Tillbaka" shows the return arrow and still goes to step 1, 44 px.
