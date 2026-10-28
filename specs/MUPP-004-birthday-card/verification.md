---
type: Verification
title: "MUPP-004 Birthday card: verification"
description: "How each requirement of Birthday card was checked, the test suite before and after, and the requirements as built."
feature: MUPP-004
---

# Verification of MUPP-004

Everything below was checked locally on 2026-10-28 against the local test server (its own database), never against the user's own database. Not yet checked on the live site (marked "not checked").

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-004-R1 | Test `MUPP-004-R1 the empty deck …` in `tests/MUPP-004-birthday-card.spec.ts`; the examples are gone from `app/page.tsx` (code review) | local | Pass | 2026-10-28 |
| MUPP-004-R2 | Unit tests `MUPP-004-R2 …` in `lib/deck.test.ts` (today, tomorrow, passed, 29 February, 24 December, grouping, oldest first); browser tests for the order and the "next" mark | local | Pass | 2026-10-28 |
| MUPP-004-R3 | Browser test `MUPP-004-R2 R3 R6 R7 R8 R9 R10 one kid …` (month, mark, name, age); picture through `/bilder/<id>`, empty `alt` and the avatar fallback: code review (the avatar is `decorative`; a test with a real picture needs the Blob upload) | local | Pass | 2026-10-28 |
| MUPP-004-R4 | Browser test `MUPP-004-R2 R4 R5 R7 R9 several kids …` (buttons, opening, Escape, focus on the kid's button) | local | Pass | 2026-10-28 |
| MUPP-004-R5 | The same test (Christmas Eve with all kids, no age, "Önskelista jul"); the look in `tests/design.spec.ts` (gradient, contrast of the heading and the star) | local | Pass | 2026-10-28 |
| MUPP-004-R6 | Unit test `MUPP-004-R6 …` (the JSON holds month and age but not the day or birthdate; a test caught a card key made from the date), and the browser test (the page HTML holds no birthdate) | local | Pass | 2026-10-28 |
| MUPP-004-R7 | Browser test (folded, fits 375×667, unfolded with 15 wishes that scroll inside the card, empty list, plain text of `<b>`) | local | Pass | 2026-10-28 |
| MUPP-004-R8 | Browser tests (buttons, arrow keys, swipe with the mouse, wrapping both ways); the look and 250 ms / reduced motion in `tests/design.spec.ts`. Buttons disabled with a single card: not tested, since a deck with a kid always has at least two cards (code path in `go()`) | local | Pass | 2026-10-28 |
| MUPP-004-R9 | Browser test (disabled buttons, the text, the live region texts, arrow key does nothing, Escape closes and focus stays on the list button) | local | Pass | 2026-10-28 |
| MUPP-004-R10 | Browser tests (group name and role, behind cards `inert` and `aria-hidden`, live region "Kort 2 av N: …", focus stays on the button) and axe in every state (empty, folded, unfolded, several kids, Christmas, opened kid); target sizes in `tests/design.spec.ts` | local | Pass | 2026-10-28 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/deck.test.ts`, 11 tests | local | Pass | 2026-10-28 |
| Browser tests | `tests/MUPP-004-birthday-card.spec.ts` (4 tests) and one test in `tests/design.spec.ts`; the MUPP-002 tests that used the example cards were changed (menu test keeps, carousel and desktop tests replaced by the header test) | local | Pass | 2026-10-28 |
| Smoke test | None new, see the card: the site is behind the password, so smoke tests cannot see the deck; the existing smoke tests still pass | local | Pass | 2026-10-28 |
| Accessibility | axe in every state; the checklist of `wiki/system/accessibility.md` on the live site including a screen reader pass on a phone | local; live | Pass (axe); not checked (checklist) | 2026-10-28 |
| Security | Security points in the review, and `/security-review`: no findings | local | Pass | 2026-10-28 |
| Code review | [review.md](review.md), two runs | local | Passed (1 must fix each, fixed) | 2026-10-28 |

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-010) | 95 unit, 45 browser | 80.1 s | 4.8 s |
| After | 106 unit, 49 browser | 84.6 s | 3.8 s |

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested or has a recorded manual check; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets, total time grown by at most 25 % (or the cause handled), and the new tests follow the quality rules in `wiki/system/testing.md`
- [ ] Deployed, and the smoke tests pass against production (Live tests)
- [ ] Accessibility: changed pages and states pass `expectNoA11yViolations`, and the relevant items of `wiki/system/accessibility.md` are checked on the live site
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers: the example cards, their test and the `.carousel` styles are removed
- [x] Clean code: reuses `Card`, `Chip`, `Avatar`, `IconButton`; `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left (run 1 and run 2); see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board (none found)

## Requirements as built

Copied from the card (`gh issue view 10`) on 2026-10-28, after looking at the running site changed the layout several times (equal card sizes, a carousel with the side cards seen, a drawn Christmas background, miniatures stacked for twins, narrow rows at Christmas, a tall wish list button in the kid's colour).

### MUPP-004-R1 Cards replace the examples

The start page shall show the birthday deck instead of the example cards.

Acceptance criteria:

- **Given** the start page, **then** no card is marked "Exempel" and the made-up example data is gone from `app/page.tsx`.
- **Given** no kids in the database, **then** the deck shows one card with the text "Inga barn har lagts till än." and no browsing buttons.
- **Given** the page, **then** it does not scroll; only a wish list scrolls inside its card (`specs/rules.md`).

### MUPP-004-R2 Order and grouping

The deck shall hold one card per upcoming date, nearest first.

Acceptance criteria:

- **Given** kids and today's date, **then** each date with at least one birthday gets one card, plus one Christmas Eve card (24 December) when there is at least one kid, ordered by the next time the date comes (today counts).
- **Given** a birthday on 29 February, **then** it counts as 28 February in years without a 29 February.
- **Given** a kid whose birthday is 24 December, **then** the deck holds that birthday card first and then the Christmas Eve card.
- **Given** several kids on one card, **then** they are grouped by parent and, inside each group, the oldest first.
- **Given** the nearest card, **then** it is the one on top when the page opens and is marked "Nästa födelsedag" (or "Nästa: Julafton"); no other card is marked.

### MUPP-004-R3 A card with one kid

A birthday card with one kid shall show a large picture, the name and the month, centred.

Acceptance criteria:

- **Given** one kid, **then** the card has a centred header with the month ("Mars") and, below it on the nearest card, the mark "✦ Nästa födelsedag ✦" (a star on each side, in the kid's colour); the month sits a little way down from the top edge; below that a large picture (192 px), the name as a heading and "Fyller 7 år", with room between the texts.
- **Given** a kid without a picture, **then** the avatar with the initial (MUPP-001) is shown instead.
- **Given** the picture, **then** it is loaded only through `/bilder/<child id>` (MUPP-003) and has an empty `alt` since the name is next to it.

### MUPP-004-R4 A card with several kids

A birthday card with several kids shall show each kid as a miniature of the single card, one above the other.

Acceptance criteria:

- **Given** several kids on one date, **then** the card has the same header (month, "Nästa födelsedag" when it is the nearest) and below it one miniature per kid, stacked one above the other in the order of R2, each with a centred picture (60 px), the name, "Fyller N år" and a narrower wish list button under them ("Önskelista", "Visa mer · N") in the kid's colour; two kids fit a 375×667 phone without any scroll.
- **Given** a miniature, **when** its wish list button is pressed (a button named after the kid, e.g. "Önskelista för Alma"), **then** that kid opens as an ordinary birthday card with the same header, large picture, name and age as R3, with the wish list already unfolded (R7), and the deck is locked (R9).
- **Given** the opened kid, **when** the list is closed (by its button or Escape), **then** the kid's card closes and the card with all the kids is shown again, with focus on that kid's wish list button.
- **Given** the wish list buttons of the miniatures, **then** they open the kid as above and do not navigate to another page.

### MUPP-004-R5 The Christmas Eve card

The Christmas Eve card shall work like a birthday card with its own header and a Christmas look drawn in the background of the card itself: dark green, with a garland of lights, stars, snow and fir trees (shapes in SVG, no emoji).

Acceptance criteria:

- **Given** the Christmas Eve card, **then** the header says "Julafton" instead of a month, with the decoration as one SVG behind the content (`aria-hidden`, colours from the tokens in `app/globals.css`) and the mark "✦ Nästa: Julafton ✦" when it is the nearest.
- **Given** the card, **then** it shows all kids as narrow rows (a small picture with the name beside it, no age; a button named "Öppna Vera") so that six kids fit a 375×667 phone without any scroll in the card; the row opens that kid's Christmas wish list as in R4.
- **Given** the cards, **then** text and decorations meet the contrast rules (WCAG 2.2 AA).

### MUPP-004-R6 The birthday day stays private

The site shall not show or send a kid's day of birth or full birthdate to the browser.

Acceptance criteria:

- **Given** the start page, **then** the HTML and the data sent to the browser contain the month, the age and the order, but not the day of the month or the birthdate.
- **Given** the page text, **then** only the month name is shown.

### MUPP-004-R7 Compact wish list

Each kid shall have a compact wish list under the picture that unfolds.

Acceptance criteria:

- **Given** a card, **then** the list is folded to one tall button in the kid's colour (a tint of it with the colour as text; "Önskelista" on the first line and "Visa mer · N", the number of wishes, on the second), `aria-expanded="false"`, near the bottom of the card, and the whole card fits a 375×667 phone screen with the header, picture, name and the button.
- **Given** the button is pressed, **then** the list unfolds in the card, shows the headline of each wish, using the wish list component that MUPP-005 extends (no details, size, link or claim status yet), scrolls inside the card when long, and `aria-expanded="true"`.
- **Given** an empty list, **then** it says "Inga önskningar än." when unfolded.
- **Given** several kids on a card, **then** a list is only reached through the opened kid (R4), so at most one is open at a time.
- **Given** the texts, **then** they are shown as plain text, never as HTML.

### MUPP-004-R8 The deck and browsing

The cards shall form a carousel and be browsed by swiping, buttons and keys.

Acceptance criteria:

- **Given** the deck, **then** every card has the same size whatever the number of kids (spare room is left empty), and the cards are centred on the page; the selected card is in the middle and the previous and the next are seen dimmed and smaller at the left and right (a part of each, behind the middle card); the others are not drawn.
- **Given** a swipe left (or the button "Nästa kort"), **then** the cards slide so that the next card is in the middle and the old one is at the left; a swipe right (or "Föregående kort") does the reverse. Arrow keys left and right do the same when the deck has focus.
- **Given** the last card, **when** next is chosen, **then** the first card comes; from the first card, previous goes to the last. With a single card the buttons are disabled and swiping does nothing (a deck with any kid always has at least two cards, so this is only a code path).
- **Given** the buttons, **then** they sit at the cards, one on each side at the height of the middle of the card, are visible on all screens, at least 44×44 px, and a single click does everything a swipe does (WCAG 2.5.7), and swiping stays the natural way on a touch screen, following the finger.
- **Given** "reduce motion", **then** the cards change without animation.

### MUPP-004-R9 Locked while the list is open

The deck shall not be browsable while a wish list is unfolded.

Acceptance criteria:

- **Given** an unfolded list (also in an opened kid from a card with several), **then** swipe, arrow keys and both buttons do nothing; the buttons are disabled and a text near them says "Stäng önskelistan för att bläddra."
- **Given** the list is closed (by its button or the Escape key), **then** browsing works again and focus stays on the list button.
- **Given** the lock, **then** a screen reader hears "Kortleken är låst. Stäng önskelistan för att bläddra." when the list opens, and "Kortleken är upplåst." when it closes.

### MUPP-004-R10 Keyboard and screen reader

The deck shall be fully usable without swiping and without seeing it.

Acceptance criteria:

- **Given** the deck, **then** it is a group named "Födelsedagskort" with `aria-roledescription="karusell"`; the buttons are reached with Tab and have the names "Föregående kort" and "Nästa kort".
- **Given** a change of card, **then** a polite live region says "Kort 2 av 5: Alma, mars" (or "Julafton"), and focus stays on the button that was used.
- **Given** the cards behind, **then** they are `aria-hidden` and not focusable (`inert`); only the top card's controls can be reached.
- **Given** every state (folded, unfolded, locked, empty, Christmas, several kids), **then** `expectNoA11yViolations` passes, focus is visible and every target is at least 24×24 px (WCAG 2.2 AA).

## Notes

- R5: the Christmas list button is "Önskelista jul" (the card first said "Jul"; the button is now simply "Önskelista" under the kid). R8: with a single card the buttons cannot be reached (see above). Both are written into the card.
- Not yet done: the live accessibility checklist and the Live tests after the deploy. The follow-up design points are in TECH-006.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
