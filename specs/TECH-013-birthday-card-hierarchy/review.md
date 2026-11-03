---
type: Review
title: "TECH-013 Birthday card hierarchy and small phones: review"
description: "The code review of Birthday card hierarchy and small phones: findings, decisions and result."
feature: TECH-013
---

# Code review of TECH-013

**Result:** Passed
**Date:** 2026-11-03, review run 1
**Summary:** The change does what TECH-013-R1 to R7 ask for with small, local edits in `BirthdayDeck.tsx` and `FitName.tsx`; the new test checks every requirement at both phone sizes and runs axe at 320 px, and the docs match the code. The findings were about tidiness and keeping the card in step.
**Security:** Passed. Presentation only, with no sign-in, admin, API, server action, database or personal data. `/security-review`: not needed, as the card says.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `tests/design.spec.ts` `toCard` was a line-for-line copy of the one in the MUPP-014 test. **Done:** moved to `tests/helpers.ts` as `toCard(page, heading)`, used by both tests.
- Card #96, Test plan: it still put the checks into the existing MUPP-014 test, while they went into a new test per phone size (the 5 s budget). **Done:** the card's test plan now describes the new test and why.

## Suggestions

- `app/components/BirthdayDeck.tsx` The size container with `100cqmin` could later replace `TWIN_AVATAR` if the cards with several kids get squeezed the same way. **Done:** left as it is; those cards are not squeezed today and are out of scope.
- `tests/design.spec.ts` The R6 check waits for exactly 18 px, the name's size in its class (`text-lg`). **Done:** left as it is: the full size cannot be measured at 320 px, where the name is already shrunk, and a changed type size should be looked at in this test anyway.

## Outside the change

- None.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
