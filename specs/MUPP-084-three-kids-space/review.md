---
type: Review
title: "MUPP-084 Three kids: use the card's space: review"
description: "The code review of the three-kid card layout: findings, decisions and result."
feature: MUPP-084
---

# Code review of MUPP-084

**Result:** Passed
**Date:** 2026-11-17, review run 1
**Summary:** The three-row layout works as the card asks; the container-query sizing of the picture is sound, and rows and tiles still share one button. No must-fix findings; the should-fix points are fixed.
**Security:** Passed. The change is CSS and layout only (no sign-in, API, action, query or personal data). `/security-review` not needed, as the card says.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `app/components/BirthdayDeck.tsx:264` The `ul` class had the same string in the `rows` and the default branch. **Done:** the `rows` branch is removed.
- `tests/design.spec.ts` R2 was only checked as at least 56 px, which the floor satisfies even if the picture never grew. **Done:** at 375 px the picture must be over 70 px.
- `tests/design.spec.ts` The long-name check always passed because `FitName` always sets an ellipsis. **Done:** it now checks that the name fits or is at 12 px, and that it is on one line (height under 1.6 lines).
- `review.md` unfilled, and the card named the folder `three-kids-card-space`. **Done:** this report is filled in; the card now names `three-kids-space` and says the rows have no vertical padding.

## Suggestions

- `app/components/BirthdayDeck.tsx:26` The `2px` in `ROW_AVATAR` looked like a magic number. **Done:** the comment says it is the button's border.
- On a screen so low that the list is under 3 × 44 px plus gaps the list scrolls. **Done:** left as it is; not a supported size, and `verification.md` says very low screens are not tested.

## Outside the change

None.
