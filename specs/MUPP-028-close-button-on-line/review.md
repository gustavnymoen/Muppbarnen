---
type: Review
title: "MUPP-028 Wish list close button on the line: review"
description: "The code review of Wish list close button on the line: findings, decisions and result."
feature: MUPP-028
---

# Code review of MUPP-028

**Result:** Passed
**Date:** 2026-11-03, review run 1
**Summary:** The fold-up button sits on the bottom line as a 32 px round `IconButton` with a 44 px `before:` target, and "Paxa (n)" was the last row of the list (later changed with the user to a fixed row above the button, see Verification); R1–R3 are met and each has a test named after it. Two small should-fix points, both fixed.
**Security:** Passed. Presentation only (no sign-in, admin, API routes, server actions, database queries or personal data), so `/security-review` is not needed.

How the review works: `wiki/system/code-review.md`. A later run is added at the top as "Review run 2".

## Must fix

None.

## Should fix

- `app/components/WishList.tsx:91` The inner scrolling box takes the keyboard focus but had no role or name, where focus used to land on the named "Önskelista" region; a screen reader announced an unnamed element. **Done:** `role="group"` and `aria-label="Önskningar"`.
- `specs/MUPP-028-close-button-on-line/verification.md` The Impeccable critique required for UI changes was not recorded. **Done:** recorded under Accessibility in the test plan table.

## Suggestions

- `tests/design.spec.ts:598`, `tests/MUPP-004-birthday-card.spec.ts:134`, `tests/MUPP-015-back-button.spec.ts:64` The scrolling box was found by the markup selector `:scope > [tabindex]`. **Done:** found by role and name (`group`, "Önskningar").
- `app/components/Button.tsx:29` Moving the radius out of `base` into `buttonClass`/`iconClass` with a `round` prop is the right move: two conflicting Tailwind classes have no guaranteed winner (as in MUPP-027). **Done:** nothing to change.
- `tests/design.spec.ts` `settledBox(card)` was awaited twice in one expression. **Done:** measured once.

## Outside the change

- The test suite is over its 180 s budget on `main` (186 s); TECH-014 is on the board, at the top of Backlog.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
