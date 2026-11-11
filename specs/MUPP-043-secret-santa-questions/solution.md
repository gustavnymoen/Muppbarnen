---
type: Solution
title: "MUPP-043 Secret Santa: anonymous chat: solution"
description: "How the anonymous chat between a giver and their receiver is built: the message table, the one reader that follows the draw, the chat card with its unread notice, and the message mails collected over ten minutes."
feature: MUPP-043
card: "#141"
depends_on: [MUPP-041, MUPP-042, MUPP-044, MUPP-051, MUPP-052, TECH-017]
---

# MUPP-043 Secret Santa: anonymous chat: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 141`.

## Data

Migration `db/migrations/012_santa_messages.sql`: the table `ss_message` (`id`, `event_id`, `giver_id`, `receiver_id`, `from_giver`, `text`, `created_at`, `read_at`, `mailed_at`). A conversation is one pair of the draw (`giver_id`, `receiver_id`), and `from_giver` says which way a message went, so a pair has two directions and every member has up to two conversations (as giver and as receiver). `read_at` is set when the other side opens the chat, `mailed_at` when the mail about the message was claimed. No foreign keys, as for `ss_draw`: the rows are deleted by the code that changes the draw (R7): `stopDraw`, `startDraw` (leftovers), `removeEvent` and `runCleanup`, each through `clearMessages(eventId, tx)`.

## Interface

- **The bubble** (`app/secret-santa/min-sida/ChatButton.tsx`): an icon button with the chat icon at the top of both opened lists: "Min önskelista" (side `receiver`: the chat with my Secret Santa) and "Min matchning" (side `giver`). An unread message gives an orange outline, an orange dot, and the name "…, nytt meddelande" (not colour alone). The dot goes when the chat has been opened.
- **The notice on the cards** (`NewMessage` in `app/secret-santa/min-sida/page.tsx`): the big cards have no button. A card with an unread message shows a small chat icon with an orange dot in its corner, inside the link, with a hidden text "Nytt meddelande" for screen readers. Changed 2026-11-11 after the user saw the first version, which had a button in each card.
- **The chat card** (`Dialog`, form variant: cross, Esc, focus in the field): "Din Secret Santa" or "Din matchning", a `role="log"` list of messages (mine to the right in the brand colour, the other's to the left; a hidden "Du:" or "Svar:" before each), the field "Meddelande" (max 500) and "Skicka". An error ("Skriv ett meddelande." / "Meddelandet får vara högst 500 tecken.") shows under the field. The text is rendered as text by React with `whitespace-pre-wrap`. The list is focusable so it scrolls with the keyboard and keeps the newest message in view.
- **The actions** (`app/secret-santa/chat-actions.ts`): `loadChat(side)` and `sendChat(side, text)`. Both run `requireSiteSession()`, `guardWrite()` and then read the member from the cookie; the caller only says which side it stands on.
- **The pages:** `min-sida` asks `unreadSides(memberId)` for the notice on the cards, and the two list pages for their own bubble. A group that is not started, or a member without a row in the draw, shows no bubble.
- **The job:** `POST /api/santa-mails` now runs `sendListChangeMails` and `sendMessageMails` and answers the summed counts only.
- **Mail:** texts 6 and 7 of MUPP-052 (`lib/santa-mail.ts`), sent by `sendMessageMails`.

## Decisions

- **The pair is never an input.** `lib/santa-chat.ts` resolves the pair from the signed-in member id and a side (`pairOf`: the latest draw of a started event). A member can only ever reach the two conversations the draw gives them (R4); a third member's request has no way to name another pair.
- **Nothing identifying leaves the server (R3).** Messages are returned as `{ mine, text }` only: no id, no time, no name. Ordering is by id. The chat names the other side only as "Din Secret Santa" (receiver side) or "Din matchning" (giver side). No timestamps are shown at all, so a message's time cannot become a pattern that identifies the giver either. The test checks every answer the server gives the receiver.
- **Both sides may start (R2).** The first draft of the card said the receiver could not write before the giver had; the user decided 2026-11-11 that both sides may start, and the card was changed.
- **One chat per side, shared types in `lib/santa-chat-shared.ts`.** The client card needs the side type and the length limit, and `lib/santa-chat.ts` is `server-only`, so those few lines live in a file without server keys.
- **Unread is per direction and conversation.** A message is unread for the other side until that side opens the chat; one's own messages never count (R5). Opening the chat is a write (`UPDATE … read_at`), so it goes through `guardWrite()` too.
- **Mail collection (R6).** The card's open question (a job that runs every few minutes) was already answered by the workflow of MUPP-042 (`.github/workflows/santa-mails.yml`, every ten minutes). `sendMessageMails` takes, per conversation and direction, the unmailed messages when the oldest of them has waited ten minutes, marks them all mailed first (so two runs send one mail), and sends mail 6 or 7 only if something is still unread by then; a mail that fails puts the mark back. So a burst of messages gives one mail, at most about twenty minutes after the first, and a message that was read in the meantime gives none.
- **No live refresh.** A message from the other side shows when the chat is opened (or after the next send); polling and push are out of scope (the card names no such requirement). `shortcut` noted: if people sit in the chat waiting for an answer, add polling.
- **The chat is opened from inside the lists only.** The cards are big links; a button on them was clumsy (a button may not sit in a link), so they only show that something is unread.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Secret Santa chat](../../wiki/system/secret-santa-chat.md), [Secret Santa match](../../wiki/system/secret-santa-match.md), [Mail](../../wiki/system/mail.md), [Secret Santa draw](../../wiki/system/secret-santa-draw.md), [Secret Santa cleanup](../../wiki/system/secret-santa-cleanup.md), and the manual [Secret Santa](../../wiki/manual/secret-santa.md).

[Specifications](../index.md)
