---
type: Review
title: "MUPP-051 Secret Santa: event status: review"
description: "The code review of the Secret Santa event status: findings, decisions and result."
feature: MUPP-051
---

# Code review of MUPP-051

## Review run 3 (the card changed; the mails added)

**Result:** Passed
**Date:** 2026-11-09
**Summary:** Run 2 covered the toggle Aktiv, the "i" explanation and "deltagare" (R2, R7): no must-fix; the locked switch now carries the group in its name. Run 3 covered the mail calls (R2, R3): mails go out only after the change is saved, from actions behind the site session, the admin session and `guardWrite()`; a failing mail never undoes a change; no participant name or wish is in any mail text.
**Security:** Passed by reading the code (the mails hold only the event's and the administrator's name; the notice with participant names goes only to the administrator who made the change; `sendMail` logs nothing). `/security-review` was run once on the first version (see run 1); it was not run again for the toggle and the mail calls, which add no new input, route or cookie.

### Should fix

- The name in the notice for a new participant was the raw form value. **Done:** `addMember` returns the saved (trimmed) name.
- No test for a failing mail to a new participant. **Done:** the mail test adds one whose address the mail check refuses.
- Verification numbers were from before the mail tests. **Done:** recorded again (284 unit, 138 browser, 278.2 s).
- The locked switch had the name "Aktiv" only. **Done:** "Aktiv <group>".

### Suggestions

- `mailEveryone` sends all mails at once. **Done:** a `shortcut:` comment with the limit.
- The mail tests clear the shared outbox file in the local data folder, and other specs that add participants leave mails in it. **Left:** it holds only made-up mails; a separate outbox for the test server is a candidate for the backlog.
- Found on the way: `.env.local` has a `RESEND_API_KEY` that the test server passed on, so the first mail test attempted two real sends to a made-up `.invalid` address. **Done:** the test server blanks the key.

## Review run 1 (the state without the mails)

**Result:** Passed
**Date:** 2026-11-09, review run 1
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
