---
type: Review
title: "MUPP-082 Cards by number of kids: review"
description: "The code review of Cards by number of kids: findings, decisions and result."
feature: MUPP-082
---

# Code review of MUPP-082

**Result:** Passed
**Date:** 2026-11-16, review run 1
**Summary:** `DeckCardView` picks the layout by the number of kids on every card (two like the twin list, three as wide rows, four or more as tiles), reusing the twin branch and the tile button. The code matches R1-R4, the eleven older tests were adjusted correctly and the new checks join existing page loads.
**Security:** The security points of the review: passed (only a layout in a client component changed). `/security-review`: not needed, as the card says.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `app/components/BirthdayDeck.tsx:25` The comment on `TILE_AVATAR` said "barnen på julkortet", but the constant also sizes the rows and the birthday cards. **Done:** now "barnen i rader och rutor".
- `tests/MUPP-017-browse-with-open-list.spec.ts:97-100` The loop table had the same locator in both entries. **Done:** the loop is over the occasion text only.
- `verification.md` and `review.md` were the untouched template. **Done:** filled in.

## Suggestions

- `app/components/BirthdayDeck.tsx:214-216` `tiles` and `rows` are two booleans for one thing; a `layout` value would read more clearly if a fifth case ever comes. **Done:** left as it is, it is small and clear.
- `tests/design.spec.ts:719-760` The combined test builds the state step by step (two, three, four kids) with few page loads. **Done:** kept; the next such test should have the same shape.
- A birthday card with three or more kids shows no age, sizes or wish buttons until a kid is opened. **Done:** the user's decision, recorded in `solution.md` and in the notes of `verification.md`.

## Outside the change

- None found.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
