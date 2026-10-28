---
type: Review
title: "MUPP-003 Admin page: review"
description: "The code review of the admin page: findings, decisions and result."
feature: MUPP-003
---

# Code review of MUPP-003

**Result:** Passed
**Date:** 2026-10-28, review run 1
**Summary:** No must-fix findings. Three should-fix items were fixed in the change; the suggestions were left as they are, with reasons.
**Security:** The security points of the review passed. `/security-review` was run on the whole change (sign-in, admin cookie, server actions, ownership checks, SQL, picture upload and `/bilder/[id]`, rendering, error messages) and found nothing at high confidence. It noted two things below the threshold: a possible orphan file when the database update fails after an upload (fixed, see below), and that anyone with the admin password can choose any parent, which the card accepts on purpose.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `tsconfig.json` had stray `.next-dev2` entries from a local dev run. **Done:** reverted to the committed file.
- `db/migrations/003_family.sql` A comment named the wrong file for the input checks. **Done:** it now names `lib/form-input.ts`.
- `app/admin/actions.ts` (`saveChildPicture`) If the database update failed after the upload, the new file stayed in the store. **Done:** the new file is removed when `setChildPicture` fails.

## Suggestions

- `app/admin/actions.ts` Every action repeats the same three lines (site check, admin check, `guardWrite()`). **Done:** left as it is. The repetition is on purpose: `lib/route-checks.test.ts` reads each action and fails if one lacks a check, so a helper would hide the check from the test.
- `lib/form-input.ts` (`parseBirthdate`) "Today" is taken in UTC, so around midnight in Sweden a birthdate of the next day is accepted for up to two hours. **Done:** left as it is; it has no effect on safety or on the data that matters.
- The card's older wording of the attempt limit (R1) is simpler than what the shared login block from TECH-005 does. **Done:** the card's requirement was clarified in `verification.md` (see Notes there).

## Outside the change

- Nothing that needs a card on the board.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
