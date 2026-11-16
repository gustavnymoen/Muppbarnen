---
type: Review
title: "MUPP-080 Choose families: review"
description: "The code review of the choice of families: findings, decisions and result."
feature: MUPP-080
---

# Code review of MUPP-080

**Result:** Passed
**Date:** 2026-11-17, review run 1
**Summary:** The server reads the cookie and filters before anything reaches the browser; the action checks the site session, `guardWrite()` and the ids. R1–R7 each have a named test. No must-fix findings.
**Security:** Passed on the security points of the review: `chooseFamilies` (`app/actions.ts`) checks `hasSiteSession()` and then `guardWrite()`, the ids are parsed as numbers and checked against the existing families, the cookie is HttpOnly, `SameSite=Lax`, `Secure` and `__Host-` in production, `parseChoice` is strict, and the SQL uses placeholders only. `/security-review`: not run; the card says it is probably not needed (the cookie is only read on the server and nothing is written to the database).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `tests/MUPP-080-choose-families.spec.ts` and `verification.md` claimed a parent in both families was checked in the browser; only the unit test does. **Done:** the claim is removed from both, and the browser test no longer creates that data.
- The card's test plan puts the look in `tests/design.spec.ts`. **Done:** not added; the browser test checks that the button is 44 px high and the page has no sideways scroll, and the deviation is recorded in `verification.md`. `/impeccable critique` was not run and is still to do before Done.

## Suggestions

- `lib/family.ts` and `lib/santa-auth.ts` repeat the expression for the `IN (?,?…)` placeholders. **Done:** left as it is at two uses; a helper in `lib/db.ts` when there is a third.
- `chooseFamilies` answers "Välj minst en familj, eller Alla." also for an unknown id; only reachable without the script. **Done:** left as it is.
- A visitor already signed in to a Secret Santa is redirected into it before the family check, so the card is skipped for them. **Done:** left as it is; it is a filter, not a boundary.
- `FamilyChoice.tsx` used a comma expression in an `onChange`. **Done:** replaced with a block.

## Outside the change

- None. (The two MUPP-073 browser tests were merged into one to keep the suite within its budget; their coverage is unchanged.)

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
