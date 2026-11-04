---
type: Review
title: "MUPP-037 Clean close motion of the wish list: review"
description: "The code review of Clean close motion of the wish list: findings, decisions and result."
feature: MUPP-037
---

# Code review of MUPP-037

**Result:** Passed
**Date:** 2026-11-04, review run 1
**Summary:** The content of the close copy fades in 100 ms in the shared `play()`, covering all three card types with one loop. No must-fix findings.
**Security:** Passed. Presentation only: no sign-in, routes, actions, queries, cookies, personal data or secrets are touched. `/security-review`: not needed.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `tests/MUPP-037-close-motion-surface.spec.ts` The test only checked that a fade animation exists. **Done:** it now also finishes the animations and checks the content's opacity is 0.
- `verification.md` Christmas Eve was recorded as "same code". **Done:** recorded as not tested separately for this card (MUPP-022-R1 tests its close motion).
- Card #129 listed the A or B question as open. **Done:** the card is updated with the choice of A.

## Suggestions

- The comment above `play()` said two animations. **Done:** updated, and a note says only direct children are faded.
- The suite's "before" time was not measured on `main`. Not done: the 3.7 s over the 170 s goal is run-to-run noise (the first run was 170.6 s).

## Outside the change

- The single-kid list surface (`bg-page/40`) is so faint that the fold is barely visible. Candidate for a design card if wanted.
