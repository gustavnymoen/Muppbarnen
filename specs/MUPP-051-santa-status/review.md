---
type: Review
title: "MUPP-051 Secret Santa: event status: review"
description: "The code review of the Secret Santa event status: findings, decisions and result."
feature: MUPP-051
---

# Code review of MUPP-051

**Result:** Passed
**Date:** 2026-11-09, review run 1 (the state without the mails)
**Summary:** The status change, the member lock and the wish lock are checked on the server in the right places; no must-fix findings. The mails of R2 and R3 are not built yet (MUPP-052 is not on `main`) and a second run is needed when they are added.
**Security:** The security points of the review: passed (site, admin and `guardWrite` first in both actions; ownership through `canManage`; status never taken from the form; parameterised queries; a CHECK in the migration). `/security-review`: run on the uncommitted changes (2026-11-09): no findings at confidence 8 or higher (checked: ownership and status on the server for the two new actions and for every member and wish change, no status taken from the form, parameterised queries, no new cookie or route handler, the list page redirects an inactive member).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `lib/santa-wishes.ts` The status is read before the write, outside a transaction, so a deactivation in between can let one wish through. **Done:** accepted and written in `solution.md`.
- `lib/santa-wishes.ts` `listIsOpen` was exported without a user. **Done:** no longer exported.
- `app/components/form-state.ts` `savedWithNotice` is not used yet. **Done:** kept for the mail step ("who got no mail"); delete it if that step does not use it.

## Suggestions

- `lib/santa.ts` `changeStatus`: the `UPDATE` did not repeat the old status. **Done:** `AND status = ?` added.

## Outside the change

- `removeEvent` is allowed for a started event; MUPP-041 decides whether it should be.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
