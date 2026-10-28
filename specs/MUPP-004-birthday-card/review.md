---
type: Review
title: "MUPP-004 Birthday card: review"
description: "The code review of Birthday card: findings, decisions and result."
feature: MUPP-004
---

# Code review of MUPP-004

## Review run 2

**Result:** Passed (1 must fix, fixed)
**Date:** 2026-10-28, review run 2, of the layout that changed after run 1 (carousel, Christmas background, miniatures, narrow rows, wish list button)
**Summary:** Focus, `inert`/`aria-hidden`, unique ids and the data sent to the browser are sound. One browser test depended on today's date and was fixed.
**Security:** Passed by reading. The change since run 1 adds no route, action, input or write; the browser still gets only month, age, order and wish headlines. `/security-review` was run on the first version (no findings); the later changes are layout only and add nothing for it to look at.

### Must fix

- `tests/design.spec.ts` The deck look test looked for the Christmas card with three clicks, but its place in the deck depends on the date, and fixed birthdays could merge with today's. **Done:** the kids' birthdays are counted from today (distinct dates), and the test pages until "Julafton" shows.

### Should fix

- The Christmas heading's contrast was measured against the card colour, not the green background. **Done:** measured against the lightest part of the gradient (green 42 % over the card).
- R8 "the others are not drawn" was untested. **Done:** the design test checks that exactly three `.deck-card` elements are in the page with seven cards in the deck.
- A misindented comment and a double blank line. **Done.**

### Suggestions

- If MUPP-005 adds inputs inside a card, the arrow keys of the carousel must not take over text editing; filter on `event.target` then. **Done:** noted here for MUPP-005.
- A comment that the dimming of the side cards is deliberate. **Done** in `app/globals.css`.
- The SVG ids of `ChristmasBackdrop` are unique only while there is one Christmas card. **Done:** left as it is.

### Outside the change

- MUPP-002's solution and verification still described the example carousel. **Done:** a note in both says MUPP-004 replaced it.

## Review run 1

**Result:** Passed for run 1 (it stopped on 1 must fix, fixed). The layout was changed afterwards (carousel, Christmas background, miniatures, wish list button); a second review run of that code is still to be done.
**Date:** 2026-10-28, review run 1
**Summary:** The privacy rule (R6), the `inert`/`aria-hidden` handling and the lock are sound. One focus bug was found and fixed: the DOM ids of the same kid were repeated across the cards drawn at once.
**Security:** Passed by reading (the reviewer) and `/security-review`: run, no findings. The change adds no route, action or input; the one new query is constant; the page stays behind `requireSiteSession()`; the browser gets month, age and order but no day or birthdate; wish titles are plain text; pictures only through `/bilder/<id>`.

How the review works: `wiki/system/code-review.md`.

## Must fix

- `app/components/BirthdayDeck.tsx`, `app/components/WishList.tsx` The ids (`lista-<kid>`, `barn-<kid>`) were built from the kid id only, so the same kid on the birthday card and the Christmas card (both drawn) got the same id, and `getElementById` found the `inert` one, so focus was lost after closing a list on the later card (R4, R9). **Done:** the ids include the card key (`lista-<card>-<kid>`, `barn-<card>-<kid>`); the browser test now checks focus after Escape on the Christmas card.

## Should fix

- `tests/design.spec.ts` the deck test took today's date in UTC while the deck counts in Swedish time. **Done:** it uses `swedishToday()`.
- `lib/deck.test.ts` the R6 test searched for the text "17". **Done:** it checks the exact keys of card and kid and that the birthdate is absent.
- R3 (picture through `/bilder/<id>`, empty `alt`, avatar fallback) has no browser test. **Done:** recorded in `verification.md` as checked by code review (the avatar is `decorative` and the kids in the tests have no picture); a test with a picture needs the Blob upload and belongs with MUPP-005's card test.

## Suggestions

- The live region does not repeat an identical message; the texts alternate, so it works. **Done:** left as it is.
- `key: ""` placeholder in `buildDeck`. **Done:** left as it is; the key is set once the order is known, with a comment.

## Outside the change

- None.

[Specifications](../index.md)
