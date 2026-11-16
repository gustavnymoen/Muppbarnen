---
type: Review
title: "MUPP-073 Families: review"
description: "The code review of families: findings, decisions and result."
feature: MUPP-073
---

# Code review of MUPP-073

**Result:** Passed
**Date:** 2026-11-17, review run 1
**Summary:** Families are built as the card asks: the master-admin check is on the server in every new action, family ids are validated on the server, queries use parameters, and R1–R5 each have a named test. No must-fix findings.
**Security:** Passed on the security points of the review. `/security-review`: run, no findings (the new actions open with the site and admin checks and `guardWrite()`, authorization is in `lib/families.ts` and `chooseFamily`, ids go through `parseId`/`checkFamilyIds`, SQL is parameterized, no new cookie or route).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `specs/MUPP-073-families/verification.md` the security row still held a placeholder. **Done:** filled in with the `/security-review` result.
- `tests/MUPP-073-families.spec.ts:49` `uncheck()` on a box that was never ticked. **Done:** replaced with an assertion that no family is pre-ticked with more than one family.

## Suggestions

- `lib/families.ts` and `lib/santa.ts` (`nameTaken`) both check "name taken ignoring case" and catch the unique-index error. **Done:** left as it is; a shared helper is worth it when a third entity needs a unique name.
- `db/migrations/016_families.sql` the unique index lowercases only ASCII; `nameKey` in code is the real check and the index is the race backstop. **Done:** left as it is.
- `lib/families.ts` (`removeFamily`) the last family cannot be deleted while any parent exists. **Done:** one-line comment added.

## Outside the change

- The migration (two triggers) has never run against Turso: try it on a copy of the production database before release (recorded as "Not checked" in verification.md).
- `parent_family.family_id` has no `ON DELETE` rule and relies on `removeFamily`; a direct delete from a script would leave orphans. Low risk, not added to the board.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
