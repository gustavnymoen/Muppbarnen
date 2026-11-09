---
type: Guide
title: Secret Santa event status
description: "How a Secret Santa event's status (inactive, preparing, started) is stored, changed and enforced: who may change it, what each status allows, and what members see."
resource: lib/santa.ts
feature: MUPP-051
tags: [secret-santa, status, security]
---

# Secret Santa event status

An event ([MUPP-048](../../specs/MUPP-048-santa-events/solution.md)) has a status in `ss_event.status`: **inactive** (every new event, and every event that existed before migration `008`), **preparing** and **started**. The administrator moves it between inactive and preparing; the move to and from started is the draw ([MUPP-041](https://github.com/gustavnymoen/Muppbarnen/issues/139)). Built by [MUPP-051](../../specs/MUPP-051-santa-status/solution.md).

## What each status allows

| | Inactive | Preparing | Started |
|---|---|---|---|
| Members added, changed, removed (`lib/santa.ts`) | yes | yes | no ("Gruppen är startad. Deltagarna kan inte ändras nu.") |
| Wishes added, changed, removed (`lib/santa-wishes.ts`) | no ("Önskelistan är stängd just nu.") | yes | yes |
| What a member sees on `/secret-santa/min-sida` | "Vi har inte kört igång än" | the card "Min önskelista" and the greyed "Min matchnings önskelista" ("Inte tilldelad än") | the card "Min önskelista" (the rest comes with MUPP-041) |
| The toggle "Aktiv" | off; switch on to activate | on; switch off to deactivate | on and locked, "Stoppa gruppen först" |

In the interface the people are "deltagare" ([R7](../../specs/MUPP-051-santa-status/solution.md)); the code and the database keep `member`.

The group's name can still be changed and the group deleted in every status.

## The admin controls

Under the group's plus button, `ActiveToggle` in `app/admin/SantaTab.tsx` shows the toggle **Aktiv** (`SwitchButton`, `role="switch"`, 44 px high, centred). Switching it asks "Är du säker?" (`ConfirmAction` with `switchLabel`), then calls `activateEvent` or `deactivateEvent`. Beside the status text `StatusInfo` (an "i" button, "Vad betyder statusen?") opens a card with the three explanations; Esc, the cross and a press outside close it. Started has no second toggle yet (MUPP-041).

## Rules

- **The server decides.** `activateEvent` and `deactivateEvent` (`lib/santa.ts`) look the event up, check ownership with `canManage` (the owner or the master admin, as for every change), then the status, all in one transaction. A status that is not the expected one answers "Gruppens status har redan ändrats. Ladda om sidan."; a started group answers "Dragningen måste stoppas först.". The two server actions take no status from the form, only the event id.
- **Every place that changes members or wishes checks the status:** `addMember` and `manageableMember` (used by `saveMember` and `removeMember`) in `lib/santa.ts`, and `saveWish` and `removeWish` through `listIsOpen` in `lib/santa-wishes.ts`. The rights are checked before the status, so a stranger is told "Du kan inte göra det här.".
- **Deactivating keeps the wishes.** Nothing is deleted; they are there when the event is activated again.
- **The member's page follows the status** and is read on every request: `findMember` (`lib/santa-auth.ts`) returns the status with the member. `/secret-santa/min-sida/onskelista` sends a member of an inactive event back to `min-sida`.

## Mails

The library functions (`activateEvent`, `deactivateEvent`, `addMember`) change data and return what a mail needs (the event name, the administrator's name, the recipients); the server actions in `app/admin/santa-actions.ts` then send, through `lib/santa-notify.ts` and the texts of [MUPP-052](../../specs/MUPP-052-santa-mail-texts/solution.md) (`lib/santa-mail.ts`), after the change is saved:

- **Activation:** mail 1 to every participant. **Deactivation:** mail 2 to every participant. The question's texts are `STATUS_CONFIRMATIONS` in `lib/santa-mail.ts`.
- **A new participant:** mail 8 (welcome), and in a preparing group mail 1 right after it.
- **A mail that cannot be sent** never undoes the change: the action answers `savedWithNotice` and the administrator sees "Sparat, men <names> fick inget mejl." in a red toast.
- The mail has the administrator's name and the event's name, never a participant's name or a wish ([Mail](mail.md)).

[System documentation](index.md)
