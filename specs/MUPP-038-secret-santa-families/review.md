---
type: Review
title: "MUPP-038 Secret Santa: families and members: review"
description: "The code review of Secret Santa families and members: findings, decisions and result."
feature: MUPP-038
---

# Code review of MUPP-038

**Result:** Passed
**Date:** 2026-11-08, review run 1
**Summary:** Every action runs the site cookie, admin cookie and `guardWrite()` checks in order, `lib/santa.ts` re-checks the master admin on every read and write, queries are parameterised and the partner, orphan and phone rules match the requirements. No must-fix findings.
**Security:** The security points of the review: passed. `/security-review`: run, no finding of confidence 8 or higher (authorization, data exposure, SQL, input validation, error messages and XSS were examined).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `specs/MUPP-038-secret-santa-families/verification.md` The suite numbers and the Definition of Done were still open. **Done:** filled in from `npm run test:time` and the checks run.
- `lib/santa.ts` (`addNewMember`, `saveMember`) The phone-taken check and the write are separate statements, so two simultaneous requests could both pass the check. **Done:** no change needed: both run inside `withTransaction`, which opens a `write` transaction that locks the database, so the two requests are serialised and the second sees the first; the `UNIQUE` constraint stays as a safety net.

## Suggestions

- `app/components/Tabs.tsx` The `tabpanel` has no `tabIndex={0}`. **Done:** left as it is: the panel starts with focusable buttons, so the pattern's reason for it does not apply.
- `app/admin/santa-actions.ts` The three-line guard is repeated in each action. **Done:** left as it is: same as `app/admin/actions.ts`, and `lib/route-checks.test.ts` needs the calls to be visible in each action.

## Outside the change

- The repeated guard in `app/admin/actions.ts` and `app/admin/santa-actions.ts` could become a shared wrapper if the route-check test learns to recognise it. Not added to the board: one small group, and the trade-off is real.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
