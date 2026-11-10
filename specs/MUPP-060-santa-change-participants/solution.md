---
type: Solution
title: "MUPP-060 Change participants in a started group: solution"
description: "How a participant's name, phone and e-mail are corrected in every status, what a started group still refuses, and the question about mailing the new address."
feature: MUPP-060
card: "#187"
depends_on: [MUPP-051, MUPP-041, MUPP-052, MUPP-048]
---

# MUPP-060 Change participants in a started group: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 187`.

## Data

None. No migration: the participant's id, which the draw (`ss_draw`), the wishes and the participant's cookie refer to, never changes, so an update of `name`, `phone` and `email` leaves them as they are (R3).

## Interface

- **The pencil** on a participant's card is there in every status (`app/admin/SantaTab.tsx`, `MemberEdit.tsx`). The form has name, phone and e-mail; the partner field and the remove button are only there when the group is not started (R1, R2). The add form was already hidden in a started group.
- **The question** "Skicka mejlet till den nya adressen?" (`MemberEdit.tsx`, `NewAddressQuestion`) opens after the form card has closed, growing out of the pencil, when the saved e-mail differs from the old one (ignoring case). It says "Mejlet går till <address>. Den gamla adressen får inget." and has "Inte nu" and "Skicka". Nothing is sent before the answer (R4). A name or phone change gives no question.
- **Server actions** (`app/admin/santa-actions.ts`): `saveMember` answers with `ask` (member id and new address) when the e-mail changed; the new `mailNewAddress` takes only the member id.
- **Messages:** "Gruppen är startad. Deltagare kan inte läggas till eller tas bort nu." (was "Deltagarna kan inte ändras nu."), "Gruppen är startad. Partnern kan inte ändras nu.", the existing "Sparat, men <name> fick inget mejl." and the toast "Mejlet skickades.". The text of the question when starting the draw now says that name, phone and e-mail can still be corrected.

## Decisions

- **`manageableMember` no longer refuses a started group.** It checks the rights only; the callers decide what a started group allows. `removeMember` refuses it, `saveMember` refuses any `partnerId` that comes with the request in a started group (also an empty one, since "no partner" would be a change), and skips `setPartner`. The started form has no partner field, so the action passes `null`, which is the only value accepted.
- **The answer to the question carries only the member id.** `memberToMail` (`lib/santa.ts`) reads the saved address, the group and the status from the database, so the mail can never go to an address from the request. It checks the rights like every other change and `guardWrite()` limits the rate.
- **`mailNewMember` handles all three statuses** (`lib/santa-notify.ts`): `NewMember.preparing` became `status`, since the started group sends the started mail (`startedMail`, MUPP-041-R6) and nothing else. The mails are the existing texts; nothing new to write or translate.
- **`FormCard` got `onClose`, and the question is opened from it** with `document.activeElement` (the pencil, which `Dialog.close` has just focused) as the opener, so the question grows out of the pencil and focus goes back to it. The question is its own small `Dialog` and not a `ConfirmAction`, because it has no trigger button of its own.
- **`FormState.ask`** is a small extension of the shared form state, so no second round trip is needed to learn the new address; the data is the administrator's own input.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Secret Santa event status](../../wiki/system/secret-santa-status.md), [Admin page](../../wiki/system/admin.md), [Admin manual](../../wiki/manual/admin.md).

[Specifications](../index.md)
