---
type: Review
title: "MUPP-043 Secret Santa: anonymous chat: review"
description: "The code review of the anonymous chat between a giver and their receiver: findings, decisions and result."
feature: MUPP-043
---

# Code review of MUPP-043

**Result:** Passed
**Date:** 2026-11-11, review run 1
**Summary:** R1 to R7 are met. The pair of a conversation is always read on the server from the signed-in member and a side, and the page only gets `{ mine, text }`, so nobody can learn who drew them. No must-fix findings.
**Security:** The security points of the review: passed (`requireSiteSession()` then `guardWrite()` first in both actions, the member from the cookie, `parseSide` for the only client input, server-side length check, bound SQL with one fragment chosen from two constants, text rendered as text, the job route unchanged in its guards and answering counts only). `/security-review`: run on the branch, no finding of confidence 8 or more (authorization and anonymity, SQL, XSS, the job route and the deletions were examined).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `lib/santa-chat.ts` `sendMessageMails` marked every unmailed message of a conversation as mailed, also one that arrived after the query had counted the unread ones; if everything counted was read, that message got no mail. **Done:** the claim is limited to the messages that existed at the query (`id <= last_id`), so a later message waits for the next run.

## Suggestions

- `app/secret-santa/min-sida/ChatButton.tsx` The `eslint-disable react-hooks/exhaustive-deps` is there because `onRead` is a new function on every render. **Done:** left as it is, with the reason in a comment; the chat must be read once when the card opens.
- `app/secret-santa/chat-actions.ts` `loadChat` and `sendChat` repeat the same first lines. **Done:** left as it is: `lib/route-checks.test.ts` requires `requireSiteSession()` and `guardWrite()` in each action body, so they cannot move into a helper.

## Note

The look of the chat button and of the notice on the cards was changed after the review at the user's request (a "Chatt" button in the lists, only a small orange icon on the cards). Logic, queries and actions are unchanged; the tests and axe checks were run again and pass.

## Outside the change

- Opening the chat counts against the write limit of `guardWrite()` because it sets `read_at`. A member who opens the chat very often could hit it; not changed, the limit is shared by all writes. Not added to the board.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
