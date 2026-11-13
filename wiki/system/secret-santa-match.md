---
type: Guide
title: Secret Santa match and change mails
description: "How a member sees the person they drew and that person's list, why nobody sees their own giver, how a changed list is mailed to the giver at most once an hour by a scheduled job, and how the giver can nag a match with an empty list."
resource: lib/santa-changes.ts
feature: MUPP-042
tags: [secret-santa, draw, mail, security]
---

# Secret Santa match and change mails

Once the draw is made ([Secret Santa draw](secret-santa-draw.md)) a member sees the person they give to, and that person's wishes, and the giver is told when those wishes change. Built by [MUPP-042](../../specs/MUPP-042-secret-santa-your-person/solution.md).

## The member's pages

- **Own page** `/secret-santa/min-sida`: the card "Min önskelista" and the card "Min matchning: <name>" (a link, Santa-hat icon). Both cards are at least 11 rem high with a 40 px symbol over a centred two-line 30 px title ("Min / önskelista", "Min matchning: / <name>"; [MUPP-059](../../specs/MUPP-059-santa-group-card-text/solution.md)). Before the start the second card is the grey "Inte tilldelad än" ([event status](secret-santa-status.md)).
- **The match's list** `/secret-santa/min-sida/matchning`: the receiver's wishes as the same expandable rows as on a child's wish list (`WishRow`), collapsed at first (every row folds out, with "–" for an empty description or size, [MUPP-064](../../specs/MUPP-064-wish-row-fold/solution.md)) and without checkbox, marks or buttons, a little roomier (56 px high instead of 44 px, same text sizes); "Inga önskningar ännu." when there are none ([MUPP-062](../../specs/MUPP-062-wish-rows/solution.md)). Under that text there is a red button "Tjata in en lista" ([nagging](#nagging-for-a-list)). Without a started group and a row in the draw the page sends the member back to their own page.

## Who sees what

`matchOf(giverId)` in `lib/santa-match.ts` is the only reader of `ss_draw` for the pages. It takes the member id from the signed sign-in cookie, never from the address or a form, and returns the receiver's name and wishes. There is no function that returns a giver for a receiver, so nothing a member can open says who drew them; the draw may be asymmetric (A→B, B→C) and two people may draw each other. The chat bubble in the opened lists and the notice on the cards are described in [Secret Santa chat](secret-santa-chat.md). The job below reads the giver's address to send mail but returns only counts.

## Change mails

- **Marking:** `saveWish` and `removeWish` (`lib/santa-wishes.ts`) call `markListChanged`, which sets `ss_member.list_changed_at`, but only while the event is started. Starting and stopping the draw clear the marks.
- **The job:** `sendListChangeMails` (`lib/santa-changes.ts`) finds marked lists of started events whose giver has not been mailed for an hour (`list_mailed_at`), takes the mark, and sends mail 5 ([Mail](mail.md): the group in the subject, no name, no wish) to the giver. A failed mail puts the mark back, so the next run tries again. Many changes within the hour give one mail; no change gives none.
- **The timer:** `.github/workflows/santa-mails.yml` calls `POST /api/santa-mails` every ten minutes ([Pipeline](pipeline.md)). The route lets only that request past the site password in `proxy.ts`, opens with `refuseJobCall()` (`lib/job-auth.ts`, shared with the cleanup route): `guardWrite()` and then `Authorization: Bearer <SANTA_JOB_SECRET>` (at least 32 characters, constant-time comparison). Without the secret set the route and the workflow do nothing. GitHub's runners share IP addresses, so the request limit of `guardWrite()` may answer 429 now and then; the run fails and the next one, ten minutes later, tries again, and no mark is lost. The secret is set in Vercel (Production) and as the repository secret `SANTA_JOB_SECRET`; `.env.example` describes it ([Security](security.md)).

## Nagging for a list

Built by [MUPP-071](../../specs/MUPP-071-santa-nag-list/solution.md). When the match's list is empty the giver can press "Tjata in en lista". `nagForList` (`app/secret-santa/nag-actions.ts`) takes no argument and `requestNag` (`lib/santa-nag.ts`) finds the receiver in the draw with the member id from the cookie, so nobody can nag anyone but their own match. One statement sets `ss_member.nag_requested_at` on the receiver's row, and only if the group is started, the list is empty, nothing waits and no nag mail went out in the last hour.

- **The job:** `sendNagMails`, called by the same ten-minute run, but it mails only requests that have waited at least an hour (`NAG_DELAY_MS`), so the mail does not ping the receiver soon after the giver pressed, drops requests whose list got a wish meanwhile (or whose group is no longer started), and mails the rest with mail 9 ([Mail](mail.md): the group in the subject, no name). A failed mail puts the request back. The job's answer still only counts.
- **The lock:** the button says "Tjatet är på väg" and is disabled while the mail waits, and "Du har tjatat nyss" for an hour after it was sent (`nag_mailed_at`); the server refuses a request in both states. Starting or stopping the draw and the yearly cleanup clear both columns.
- **The look:** a red border and red text (`--color-christmas-red`) and `AngryTomteIcon`, the angry santa ([DESIGN.md](../../DESIGN.md)).

[System documentation](index.md)
