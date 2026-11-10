---
type: Guide
title: Secret Santa draw
description: "How the Secret Santa draw works: the rules and their fallback order, the draw table that is both the result and the history, start and stop, the mails and what keeps the result secret."
resource: lib/santa-draw.ts
feature: MUPP-041
tags: [secret-santa, draw, security]
---

# Secret Santa draw

The administrator of a preparing event ([event status](secret-santa-status.md)) starts the draw with the toggle **Startad**; the event becomes started and every participant gives to one person and gets from one. Built by [MUPP-041](../../specs/MUPP-041-secret-santa-draw/solution.md).

## The rules

`drawPairs` in `lib/santa-draw.ts` (pure logic, no database) draws so that nobody gets themself, their partner or the person they had last year. When that cannot be done it drops **last year's rule** first, then the **partner rule**; the rule against drawing yourself is never dropped. The answer says which rules were dropped, never who drew whom, and the administrator sees it as a notice. With fewer than two participants nothing is saved or mailed and the administrator is told why. It tries 200 random shuffles (random numbers from `crypto.getRandomValues`) and then a matching search, which also decides whether a draw exists.

## What is stored

The table `ss_draw` (migration `009`) has one row per giver and year: event, year, giver, receiver. The rows of the latest year are the draw; earlier years are the history that the rule "not last year" reads. It has no foreign keys, so the history survives the yearly cleanup; removing a participant or an event removes their rows (`removeMember`, `removeEvent` in `lib/santa.ts`).

## Start and stop

- **Start** (`startDraw`): owner or master admin, status must be preparing; the rows and the status change are one transaction. Mail 3 goes to everyone; a mail that fails never undoes the draw, and the administrator sees who got none. The question lists participants who have not written a wish yet; the draw can still be made. A participant with a wish has the note "Önskelista påbörjad" under the name in the admin ([MUPP-061](../../specs/MUPP-061-santa-wish-note/solution.md)).
- **Stop** (`stopDraw`): only while started; deletes this year's rows (so a stopped draw never counts as last year), keeps the wish lists, returns the event to preparing and sends mail 4. Conversations ([MUPP-043](https://github.com/gustavnymoen/Muppbarnen/issues/141)) will be deleted here too.

## Secrecy

Nothing that lists events, members or wishes reads `ss_draw`, and the admin page shows no pair; the one reader will be the signed-in giver's own page ([MUPP-042](https://github.com/gustavnymoen/Muppbarnen/issues/140)). `lib/santa.test.ts` checks that the event list holds no draw data.

[System documentation](index.md)
