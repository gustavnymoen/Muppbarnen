---
type: Guide
title: Secret Santa chat
description: "How a giver and their receiver chat without the receiver learning who the giver is: the one pair per conversation read from the draw, what the server returns, the unread notice, the message mails collected over ten minutes and when the conversations are deleted."
resource: lib/santa-chat.ts
feature: MUPP-043
tags: [secret-santa, chat, mail, security]
---

# Secret Santa chat

Once the draw is made ([Secret Santa draw](secret-santa-draw.md)) the giver and the person they give to can talk. Nobody's name is shown: the receiver's chat is "Din Secret Santa", the giver's is "Din matchning". Built by [MUPP-043](../../specs/MUPP-043-secret-santa-questions/solution.md).

## Two conversations per member

The draw is not symmetric (A→B, B→C, and D and E may draw each other), so every member has up to two conversations: one as receiver, with whoever drew them, and one as giver, with whoever they drew. They are never mixed. In the code the two are the *sides* `receiver` (button on "Min önskelista") and `giver` (button on "Min matchning: <name>"); both sides may write first and at any time, and several messages in a row are fine. A message is 1 to 500 characters (trimmed); it is stored and shown as text.

## Who sees what

`lib/santa-chat.ts` resolves the pair itself: `pairOf(memberId, side)` reads the latest draw of a started event for the signed-in member (from the cookie, never from a form). The actions (`app/secret-santa/chat-actions.ts`) take only the side. So a member can reach only their own two conversations, and a request cannot name another pair (R4). What leaves the server is a list of `{ mine, text }`: no id, no time, no name or address, so the receiver cannot work out who the giver is from any answer or page (R3; the browser test checks every answer sent to the receiver). The dots on the cards come from `unreadSides(memberId)`, which also returns only two booleans.

## Unread

A message is unread for the other side until that side opens the chat; opening it (`loadChat`) sets `read_at` on that direction only. The bubble then shows an orange outline and dot and the name "…, nytt meddelande"; the dot is on the card and in the opened list. Messages one has written never count.

## Message mails

`sendMessageMails` runs in the same scheduled job as the change mails ([Secret Santa match](secret-santa-match.md): `POST /api/santa-mails` every ten minutes). For each conversation and direction it takes the unmailed messages once the oldest has waited ten minutes, marks them mailed (so two runs send one mail), and sends mail 6 (from the giver, to the receiver) or 7 (from the receiver, to the giver) only if something is still unread. The mail names the group and nothing else ([Mail](mail.md)). A mail that fails puts the mark back. The route answers the summed counts only.

## Data and deletion

Table `ss_message` (migration `012`). The conversations are deleted with `clearMessages(eventId, tx)` when the draw is stopped or started again (`lib/santa.ts`), when a group is deleted, and by the yearly cleanup ([cleanup](secret-santa-cleanup.md)). There is no live refresh: the other side's new messages show when the chat is opened or after the next send.

[System documentation](index.md)
