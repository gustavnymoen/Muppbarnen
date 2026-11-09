---
type: Solution
title: "MUPP-051 Secret Santa: event status: solution"
description: "How the event status is built: the migration, the two status changes with their server checks, the locks on members and wishes, the confirmation, and the member's two pages."
feature: MUPP-051
card: "#153"
depends_on: [MUPP-048, MUPP-040, TECH-017]
---

# MUPP-051 Secret Santa: event status: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 153`.

## Data

Migration `db/migrations/008_santa_event_status.sql` adds `ss_event.status` (`'inactive'`, `'preparing'` or `'started'`, `NOT NULL`, default `'inactive'`, with a `CHECK`). Existing events get the default, so they become inactive (R1). `ALTER TABLE … ADD COLUMN` is enough here; no table is rebuilt. Tested in `db/db-setup.test.ts` by running 003 to 007 on made-up rows and then 008.

## Interface

- **Admin, Secret Santa tab** (`app/admin/SantaTab.tsx`, `santa-actions.ts`): under the event's title a row "Status: Inaktiv/Förbereder/Startad" with an "i" icon button (`StatusInfo.tsx`, "Vad betyder statusen?", 44 px) that opens a card with the three explanations, and under the plus button the toggle **Aktiv** (`SwitchButton`, `role="switch"`, centred; the left-aligned alternative of the card is to be tried by the user). Switching it opens the question "Är du säker?" (`ConfirmAction` with the props `switchLabel` and `switchOn`, which make the trigger a switch instead of the trash icon) that says how many participants get a mail. In a started event the toggle is on, disabled, and says "Stoppa gruppen först" (R2). In a started event the plus for a new person and the pencil and trash on the member cards are gone (R3).
- **Own page** (`app/secret-santa/min-sida/page.tsx`): inactive gives "Vi har inte kört igång än" under the greeting and nothing else (R5); preparing gives the link card "Min önskelista" (checklist icon) and the grey card "Min matchnings önskelista" (Santa-hat icon, dashed border, no link, "Inte tilldelad än" in the orange of `text-claimed`, so the reason is text and not only colour) (R6). Started shows only the list card until MUPP-041 builds its page.
- **The list** moved to `app/secret-santa/min-sida/onskelista/page.tsx` (Tillbaka goes to `min-sida`); an inactive event redirects to `min-sida` (R4).
- **"Deltagare" (R7)** is a change of visible text only (the count, the delete question, the status question, the error "Gruppen är startad. Deltagarna kan inte ändras nu."); `member` stays in code and the database.
- Messages: "Gruppen är startad. Deltagarna kan inte ändras nu.", "Gruppens status har redan ändrats. Ladda om sidan.", "Gruppen är startad. Dragningen måste stoppas först.", "Önskelistan är stängd just nu."

## Decisions

- **One generic `changeStatus(actor, id, from, to)`**, exported as `activateEvent` and `deactivateEvent`, with the two server actions taking no status from the form. A forged request can therefore only ask for the two allowed moves, and each is allowed from one status only; a stale page gets "har redan ändrats" instead of doing a second change. Ownership is checked first (`manageableEvent`), then the status, in one transaction.
- **The status check sits next to the rights check**, in `manageableMember` and in `addMember`, so `saveMember`, `removeMember` and `addMember` cannot miss it. For wishes it is `listIsOpen` at the top of `saveWish` and `removeWish`. Rights come first, so a stranger never learns the status.
- **The functions return what a mail needs and send nothing.** `activateEvent`/`deactivateEvent` return the event name, the administrator and the recipients; `addMember` returns the address, the event, the administrator and whether the event is preparing. The server actions send through `lib/santa-notify.ts` (`mailEveryone`, `mailNewMember`, with the texts of `lib/santa-mail.ts`) after the change is saved, so a failing mail never undoes a status (R2). The names of those who got none come back as a notice (`savedWithNotice`), shown by `Form` and `ConfirmAction` as a red toast.
- **The test server blanks `RESEND_API_KEY`.** `.env.local` has a key, and the first browser test of the mails would have sent a real mail; now the mails go to the outbox, which the tests read.
- **The wish lock reads the status before the write, not in the same transaction.** An administrator who deactivates at that very moment can let one wish through; for a hobby site that is accepted. The status change itself is one transaction and repeats the old status in the `UPDATE`.
- **A single `ConfirmAction` for both directions of the toggle**, so the dialog and its answer stay while the status changes under it.
- **The question's texts** are `STATUS_CONFIRMATIONS` of `lib/santa-mail.ts` (MUPP-052), not written here.
- **The test helper `addSantaEvent` makes a "preparing" event by default** (`tests/family-db.ts`), since the older tests of members and wish lists need the list open; the site itself starts every event inactive.
- **The browser test suite** was over its budget before this change (TECH-019); the cost of the new tests is in `verification.md`.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Secret Santa event status](../../wiki/system/secret-santa-status.md), [Secret Santa wish list](../../wiki/system/secret-santa-wish-list.md), [Secret Santa entrance](../../wiki/system/secret-santa-entrance.md), [Admin page](../../wiki/system/admin.md), [Secret Santa](../../wiki/manual/secret-santa.md), [Admin](../../wiki/manual/admin.md).

[Specifications](../index.md)
