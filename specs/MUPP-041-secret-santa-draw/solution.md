---
type: Solution
title: "MUPP-041 Secret Santa: the draw: solution"
description: "How the Secret Santa draw is built: the draw table, the rules and their fallbacks, start and stop, the Startad toggle and the check marks, and what keeps the result secret."
feature: MUPP-041
card: "#139"
depends_on: [MUPP-051, MUPP-048, MUPP-052, TECH-017]
---

# MUPP-041 Secret Santa: the draw: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 139`.

## Data

Migration `db/migrations/009_santa_draw.sql` adds `ss_draw (event_id, year, giver_id, receiver_id)`, one row per giver and year, `PRIMARY KEY (event_id, year, giver_id)`, `UNIQUE (event_id, year, receiver_id)` and `CHECK (receiver_id <> giver_id)`. The card names a draw and a history log; one table is both: the rows of the latest year are the draw MUPP-042 reads, and the rows of earlier years are the log that "not last year" reads. There are no foreign keys, so the log survives the yearly cleanup (MUPP-044); `lib/santa.ts` removes the rows itself when a participant or the event is removed (so a reused id never inherits history), and when the draw is stopped.

## Interface

- **Admin, Secret Santa tab** (`app/admin/SantaTab.tsx`): next to the toggle Aktiv the toggle **Startad** (`StartedToggle`): off and disabled in an inactive group; in a preparing group it asks "Är du säker?" with the text of `STATUS_CONFIRMATIONS.start` and, when someone has no wish, "Ännu ingen önskelista från: <names>." (R2), then calls `startDraw`; in a started group it is on and asks with `STATUS_CONFIRMATIONS.stop`, then calls `stopDraw` (R7). The two toggles sit side by side under the plus button as a pair, centred. A participant with at least one wish has a check mark (`CheckIcon`, `role="img"`, "Har skrivit en önskelista") in front of the name (R1).
- **Notices** (red toast, as for unsent mails): "Dragningen är gjord, men regeln om att inte få förra årets person [och regeln om att inte få sin partner] gick inte att följa." (R3), and "Sparat, men <names> fick inget mejl." (R6). A lone participant: "Dragningen går inte att göra: det behövs minst två deltagare."
- **Mails:** mail 3 (`startedMail`) to everyone on start, mail 4 (`stoppedMail`) on stop, texts of MUPP-052.

## Decisions

- **The draw is pure logic** in `lib/santa-draw.ts` (`drawPairs(members, lastYear)`), so it is unit tested hundreds of times without a database. It tries three rule sets in turn: all rules, then without last year's rule, then without the partner rule; the rule against drawing yourself is never dropped. Two or more participants can always be drawn under that rule alone, so the draw fails only for fewer than two.
- **Random tries first, then an exact search.** 200 random shuffles are checked against the rules (almost always enough, and uniform); if none fits, a matching search with random order decides exactly whether a draw exists. The search is not uniformly random, which is accepted because it only runs when the rules leave almost no room (`shortcut:` comment in the code). The random numbers come from `crypto.getRandomValues`.
- **Start and stop are one transaction each** in `lib/santa.ts` (`startDraw`, `stopDraw`): rights, status, the draw, the rows and the status change together, and the `UPDATE` repeats the old status. They return the data for the mails and which rules were set aside, never a pair (R5). The server actions send the mails after the change is saved, so a failing mail never undoes the draw (R6).
- **Last year** is the rows of the latest year before this one. A stopped draw has deleted its rows, so it never counts (R7). A start deletes leftover rows of this year first, for an event that was cleaned up and drawn again the same year.
- **Who may start:** the owner of the event or the master admin, as for every change (`manageableEvent`); the card said "master admin" from before events had owners (MUPP-048).
- **Secrecy (R5):** nothing that lists events, members or wishes selects from `ss_draw`; `listEvents` has no draw field (a unit test checks the JSON), and the admin page says nothing about pairs. Only MUPP-042's own-page query will read a row, for the signed-in giver.
- **Conversations (MUPP-043)** do not exist yet; `stopDraw` has a comment where their deletion goes.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Secret Santa draw](../../wiki/system/secret-santa-draw.md), [Secret Santa event status](../../wiki/system/secret-santa-status.md), [Secret Santa](../../wiki/manual/secret-santa.md), [Admin](../../wiki/manual/admin.md).

[Specifications](../index.md)
