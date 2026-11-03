---
type: Review
title: "MUPP-029 Single-kid wish list close motion: review"
description: "The code review of Single-kid wish list close motion: findings, decisions and result."
feature: MUPP-029
---

# Code review of MUPP-029

**Result:** Passed
**Date:** 2026-11-03, review run 1
**Summary:** The single-kid list now grows out of the "Önskelista" button (`growScale`) and shrinks back into it (`shrinkTo`, with the shared `onto`). `sinkAway`, `.wish-slide` and its class in `WishList.tsx` are fully removed, and the ghost's lifecycle still removes every copy: on finish, on cancel, after the safety timeout, in `dropGhost` from `open()`, in `makeGhost`, and when `shrinkTo` finds no button. Tests cover R1–R3; some test helpers were copies, now shared.
**Security:** Passed. No sign-in, admin, API routes, server actions, database queries, personal data, cookies or CSP are touched, so `/security-review` is not needed (as the card says).

How the review works: `wiki/system/code-review.md`. A later run is added at the top as "Review run 2".

## Must fix

None.

## Should fix

- `tests/MUPP-029-single-kid-close-motion.spec.ts:15` The ghost locator `body > [inert][aria-hidden=true]` was defined in four test files. **Done:** `GHOST` and `ghost(page)` are exported from `tests/helpers.ts` and used in MUPP-016, MUPP-022, MUPP-025 and MUPP-029.
- `tests/helpers.ts` `type Box` was declared there and in the MUPP-016 spec. **Done:** exported from helpers, the local copy removed.
- `tests/MUPP-029-single-kid-close-motion.spec.ts` `oneKid` and `noMotion` are near copies of those in the MUPP-016 spec. **Done:** left as they are, with a comment on why `oneKid` differs (only the birthday list, the tests stay on the first card); sharing them would mean a new helper file for two short functions, and the two specs already have their own seeds, as MUPP-022 does.

## Suggestions

- `app/components/BirthdayDeck.tsx` One line held a closure, a ternary between two functions and two `getElementById` calls. **Done:** split into an `if … else` inside the closure.
- `app/components/transition.ts` `play` sets `transformOrigin` on the copy as a style, while `growScale` puts it in the keyframes. **Done:** left as it is: the copy is removed when it ends, and `play` is shared with the other cards' close, which this card does not change.

## Outside the change

- The solutions of MUPP-016, MUPP-022 and MUPP-025 still described `sinkAway` and `.wish-slide`. **Done:** each got a "Changed later by MUPP-029" line.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
