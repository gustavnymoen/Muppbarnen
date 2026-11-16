---
type: Review
title: "MUPP-074 Amount on Secret Santa groups: review"
description: "The code review of the amount on Secret Santa groups: findings, decisions and result."
feature: MUPP-074
---

# Code review of MUPP-074

**Result:** Passed
**Date:** 2026-11-16, review run 1
**Summary:** The amount is stored on the group (migration 014), checked on the server, shown on the admin card and the members' page, and added to the draw mail. All four requirements are implemented and tested. No must-fix findings.
**Security:** Passed: `saveEvent` still goes through `openAdminAction()` and `canManage`; `parseAmount` checks the amount on the server and it is written as a parameter; a CHECK in the database backs it up; no new route, cookie or write path. `/security-review`: not run yet.

How the review works: `wiki/system/code-review.md`. A later run is added at the top as "Review run 2".

## Must fix

None.

## Should fix

- `lib/santa.ts` `StatusChange` carries `amount` for activate, deactivate and stop, but only the draw mail uses it. **Done:** left as it is; one shared type keeps the status functions alike, and the field costs nothing.
- `verification.md` was a draft. **Done:** updated with the numbers of this run.

## Suggestions

- `lib/form-input.ts` `parseAmount` used a `"?"` placeholder for a non-text value. **Done:** rewritten without it.
- `app/components/Form.tsx` the number field lets decimals and "e" through; the server refuses them (tested). **Done:** left as it is; `inputMode` is not supported by `Field`, and adding it is not worth a new prop.

## Outside the change

- None.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
