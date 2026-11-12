---
type: Verification
title: "MUPP-043 Secret Santa: anonymous chat: verification"
description: How each requirement of the anonymous chat was checked, the test suite before and after, and the requirements as built.
feature: MUPP-043
---

# Verification of MUPP-043

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-043-R1 | Unit test `MUPP-043-R1 …` in `lib/santa-chat.test.ts` (limits, text kept as text); browser test `MUPP-043-R1 …` in `tests/MUPP-043-santa-chat.spec.ts` (send, empty and too long refused, markup shown as text, several in a row, axe) | local | Pass | 2026-11-11 |
| MUPP-043-R2 | Unit tests `MUPP-043-R2 …` (receiver first, several in a row, no chat in a group that is not started); browser tests `MUPP-043-R2 R5 …` and `MUPP-043-R2 the receiver may write first …` | local | Pass | 2026-11-11 |
| MUPP-043-R3 | Unit tests `MUPP-043-R3 …` (asymmetric draw A→B, B→C and D↔E, only `{ mine, text }` returned); browser test `MUPP-043-R3 R4 …` checks every answer the server gives the receiver for a name or an id of the giver, and the page HTML | local | Pass | 2026-11-11 |
| MUPP-043-R4 | Unit test `MUPP-043-R4 …` (a third member sees nothing, a wrong member id or side gets nothing; no function takes a pair from the caller); browser test `MUPP-043-R3 R4 …` (Dan, in another pair) | local | Pass | 2026-11-11 |
| MUPP-043-R5 | Unit tests `MUPP-043-R5 …` (unread per side, read on opening, own messages count as read); browser tests (the card shows "Nytt meddelande" and no button, the bubble in the list is named "…, nytt meddelande", both gone after opening); `tests/design.spec.ts` `MUPP-043-R5 …` on a 375 px phone | local | Pass | 2026-11-11 |
| MUPP-043-R5 (fix) | Browser test `MUPP-043-R5 a new message shows on the button also when the same list was visited and read earlier …`: a message that comes after a read gives the notice again without a reload, and the messages are shown the moment the card opens | local | Pass | 2026-11-11 |
| MUPP-043-R2 (fix) | Browser test `MUPP-043-R2 a message that comes between loading the page and opening the chat …`: it is in the chat when opened, and one that comes while the chat is open shows after the ten-second poll (the test moves the clock); the R3 test now also checks the pages sent to the receiver | local | Pass | 2026-11-11 |
| MUPP-043-R6 | Unit tests `MUPP-043-R6 …` (ten-minute collecting, one mail per conversation and direction, none when already read, a failed mail tried again); browser test `MUPP-043-R6 …` through the job route and the outbox (no text or name in the mails) | local | Pass | 2026-11-11 |
| MUPP-043-R7 | Unit tests `MUPP-043-R7 …` (stopping the draw, starting again, deleting the group, the yearly cleanup). Not in the browser: the unit tests run the same functions the admin buttons call | local | Pass | 2026-11-11 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/santa-chat.test.ts` (15 tests): who may send and read, read marks, length limits, the ten-minute collecting, several in a row, asymmetric draw | local | Pass | 2026-11-11 |
| Browser tests | `tests/MUPP-043-santa-chat.spec.ts` (5) and the chat test in `tests/design.spec.ts` (1), with axe on the cards, the open chat and the notice | local | Pass | 2026-11-11 |
| Smoke test | Not applicable: the card says none; the chat needs a signed-in member of a started group | – | – | – |
| Accessibility | axe in the browser tests (card, open chat, error text, notice); the chat is a dialog with a focusable `role="log"` list; the notice is a dot plus the name "nytt meddelande", not colour alone; live checklist: not checked yet | local | Pass (live not checked) | 2026-11-11 |
| Security | Security points in [review.md](review.md); `/security-review`: no finding of confidence 8 or more | local | Pass | 2026-11-11 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-11 |

## Test suite

`npm run test:time`.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 354 unit + 154 browser, 315.1 s (MUPP-062) | – | 7.2 s |
| After | 369 unit (0.6 s) + 160 browser | 325.5 s (budget 180 s) | 7.1 s (not touched) |

Over budget with and without this change (TECH-019). The 15 unit tests and 6 browser tests add about 10 s (3 %); the browser tests use direct database rows and the job route instead of long flows.

## Definition of Done

- [x] Tests: every requirement has a test; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: over budget before this change (TECH-019); the change added 3 %
- [x] Deployed, and the smoke tests pass against production (Live tests): the run after the merge of PR #212 (merge commit 5a3afcb, which includes #211) passed on 2026-11-11
- [x] Accessibility: axe passes locally; the live checklist is marked done by the user (2026-11-12); not gone through item by item by Claude, and no details recorded per item
- [x] Requirements in the card match what was built (copied below)
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` pass (`npm run build` ran as part of `npm run test:time`)
- [x] Code review: passed, see [review.md](review.md)
- [x] Technical tasks: none noticed (the over-budget suite is TECH-019)

## Requirements as built

Card #141 as of 2026-11-11 (the first R2 criterion, that the receiver cannot write before the giver has, was dropped by the user the same day: both sides may start).

- **MUPP-043-R1 The giver writes:** a message of 1 to 500 characters from "Min matchning" is in the conversation; empty or too long is refused with a message; text is shown as text.
- **MUPP-043-R2 The receiver writes:** the receiver sees the giver's messages in the chat on "Min önskelista" and writes there, first or at any time; the giver sees it in the same conversation; each side may send several messages in a row.
- **MUPP-043-R3 Names never shown:** nothing in the receiver's page or data identifies the giver (no id, name, time or address); the chat says "Din Secret Santa"; the giver's chat shows no name either; in an asymmetric draw a member's two chats are separate.
- **MUPP-043-R4 One conversation per pair:** a conversation belongs to one giver and one receiver only; a third member does not see it and a request for it is refused on the server.
- **MUPP-043-R5 Unread notice:** the card shows a small chat icon with a dot (and a hidden text "Nytt meddelande") and the bubble in the opened list shows a dot and "nytt meddelande" in its name for an unread message; the messages are marked read in the database when the chat is opened; one's own messages count as read.
- **MUPP-043-R6 Message mail:** the other side gets mail 6 or 7 (group named, no text or names), collected so that messages sent within ten minutes give one mail per conversation and direction.
- **MUPP-043-R7 Gone with the draw:** conversations are deleted when the draw is stopped (and started again), when the group is deleted, and in the yearly cleanup (MUPP-044).

[Specifications](../index.md)
