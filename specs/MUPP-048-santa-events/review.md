---
type: Review
title: "MUPP-048 Secret Santa: events created by any parent: review"
description: "The code review of Secret Santa events: findings, decisions and result."
feature: MUPP-048
---

# Code review of MUPP-048

**Result:** Passed
**Date:** 2026-11-09, review run 1
**Summary:** The change meets R1–R5, R7 and R8; no must-fix findings. The migration keeps ids and runs in one transaction, every admin action checks ownership on the server, and the new cookie signature invalidates old cookies.
**Security:** Review points passed: every admin action starts with the site cookie, the admin cookie and `guardWrite()`, then `canManage` (owner or master admin) for event, member and partner; visitor wish actions take the member from the cookie only; SQL is fixed text with bound parameters; phone and email are read only for admins and by the sign-in check; the entrance shows names only. `/security-review`: run, no findings at confidence 8 or higher.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `specs/MUPP-048-santa-events/verification.md` and `review.md` were still templates when the reviewer read them. **Done:** filled in.
- `lib/santa.ts` `saveEvent`: two parents saving the same name at the same moment could hit the unique index and show a database error. **Done:** the constraint error is caught and answered with "Det finns redan en grupp med det namnet."

## Suggestions

- `db/migrations/007_secret_santa_events.sql`: an old family name of only spaces would trim to '' and fail the check, rolling the migration back. **Done:** such a name becomes `Grupp <id>`, with a case in `db/db-setup.test.ts`. A missing owner (families but no parent) is not realistic and is left.
- `lib/santa.ts` `nameKey` lowercases with Swedish rules and the index only ASCII: the code check is the stricter one, as the comment says. Left as it is.
- Esc on the names step with one group now leaves `/secret-santa` for the start page (R8). Left as it is.

## Outside the change

- Tests still use "Familjen Ek" as group names and `family` as a variable name (`tests/design.spec.ts`, `tests/MUPP-045-form-cards.spec.ts`). Only names, not worth a change.
- R6 (mails name the event) has no code to review: the mails are later cards.

[Specifications](../index.md)
