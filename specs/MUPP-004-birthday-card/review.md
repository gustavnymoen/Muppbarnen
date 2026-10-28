---
type: Review
title: "MUPP-004 Birthday card: review"
description: "The code review of Birthday card: findings, decisions and result."
feature: MUPP-004
---

# Code review of MUPP-004

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
