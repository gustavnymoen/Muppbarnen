---
type: Review
title: "MUPP-000 Short name of the feature: review"
description: "The code review of Short name of the feature: findings, decisions and result."
feature: MUPP-000
---

# Code review of MUPP-000

**Result:** Passed
**Date:** 2026-11-10, review run 1
**Summary:** R1 to R4 are met: a started group accepts only name, phone and e-mail, any `partnerId` is refused, add and remove stay refused, and the new-address mail is built from the saved row. No must-fix findings.
**Security:** Passed on every point of the guide: sign-in, `guardWrite()` and `canManage` come first in both actions, input is checked on the server with bound queries, the mail target is read from the database (the request carries only the member id), the answers never carry the draw, the session is untouched. `/security-review`: run, no findings with confidence of 8 or more.

How the review works: `wiki/system/code-review.md`. A later run is added at the top as "Review run 2".

## Must fix

None.

## Should fix

- `lib/santa.ts` (`memberToMail`): a second query only for the event name, with a `?? ""` fallback. **Done:** `manageableMember` now selects `e.name AS event_name`.
- `app/admin/santa-actions.ts` (`mailNewAddress`): mails the saved address of any managed member each time, without checking that the e-mail changed. **Done:** left as it is; only the owner or master admin can call it, `guardWrite` limits the rate, and the worst case is one extra mail.

## Suggestions

- `lib/santa.ts` (`saveMember`) `!= null` and `app/admin/MemberEdit.tsx` `asked` next to `ask`. **Done:** a comment on each says why.

## Outside the change

None.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
