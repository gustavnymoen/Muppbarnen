---
type: Guide
title: Secret Santa yearly cleanup
description: "How the yearly Secret Santa cleanup works: the daily cron route and its secret, the once-a-year rule, what is deleted and what stays, and how sign-ins end."
resource: lib/santa-cleanup.ts
feature: MUPP-044
tags: [secret-santa, cleanup, security]
---

# Secret Santa yearly cleanup

A month after Christmas Eve, on 24 January, every Secret Santa event goes back to inactive and its wish lists are deleted, so last year's lists do not show up next year. Built by [MUPP-044](../../specs/MUPP-044-secret-santa-cleanup/solution.md).

## What runs

Vercel Cron calls `GET /api/santa-cleanup` every day at 03:00 UTC (`vercel.json`). The route (`app/api/santa-cleanup/route.ts`) needs the header `Authorization: Bearer <CRON_SECRET>`; the project's environment variable `CRON_SECRET` must be set in Vercel, and without it the route answers 401 to everyone. The proxy lets that one path through without the site cookie ([site password](site-password.md)); the secret is its only gate.

`runCleanup` in `lib/santa-cleanup.ts` does the work only when it is due: today (Swedish time) is 24 January or later **and** the year in `ss_cleanup` (migration `011`) is lower than this year. Then, per event and in one transaction, it deletes the wishes ([wish lists](secret-santa-wish-list.md)) and the conversations ([chat](secret-santa-chat.md)), clears the marks of changed lists that wait for a mail ([MUPP-042](../../specs/MUPP-042-secret-santa-your-person/solution.md)) and sets the status to inactive ([status](secret-santa-status.md)); at the end it saves this year in `ss_cleanup`. A day the cron misses is caught up the next day, and a second run the same year changes nothing, so the lists written for next Christmas are safe.

## What stays

Events, members and the draw rows `ss_draw` ([draw](secret-santa-draw.md)), which are the log of who gave to whom. The next draw reads the latest earlier year as "last year" and avoids those receivers. The conversations ([chat](secret-santa-chat.md)) are deleted with the wishes.

## Sign-ins

The Secret Santa cookie holds the member id, the cleanup year and a signature (`lib/santa-session.ts`). After a cleanup the year in `ss_cleanup` is new, so every older cookie is refused by `currentSantaMember` and the members sign in again.

[System documentation](index.md)
