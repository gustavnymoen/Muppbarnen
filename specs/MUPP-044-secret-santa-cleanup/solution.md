---
type: Solution
title: "MUPP-044 Secret Santa: yearly cleanup: solution"
description: "How the yearly Secret Santa cleanup is built: the daily cron route, the once-a-year rule, what is deleted and kept, and how sign-ins end."
feature: MUPP-044
card: "#142"
depends_on: [MUPP-041, MUPP-051]
---

# MUPP-044 Secret Santa: yearly cleanup: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 142`.

## Data

Migration `011_santa_cleanup.sql` adds `ss_cleanup`, one row (`id = 1`) with the `year` of the last cleanup. It starts at the current year, so a site that gets the migration is not wiped at once but first the next 24 January. No other table changes.

## Interface

No page changes. A route, `GET /api/santa-cleanup` (`app/api/santa-cleanup/route.ts`), is called once a day at 03:00 UTC by Vercel Cron (`vercel.json`). It answers `{ "cleaned": <number of events> }`, or 401.

- **Secret.** The route needs `Authorization: Bearer <CRON_SECRET>` (Vercel sends it when the project has the environment variable `CRON_SECRET`), compared with `timingSafeEqual`. Without the variable the route always answers 401. `proxy.ts` lets this exact path through on GET without the site cookie (Vercel Cron has none), so the secret is the only gate; the route-checks test lists it as the one route without a sign-in check.
- **Test date.** `SANTA_CLEANUP_TODAY` (ignored on Vercel) sets the date; `scripts/test-server.mjs` sets it to 2099-02-01 and the cron secret, so the browser tests can run the cleanup.

## Decisions

- **Once a year, not every day after 24 January.** The card's rule "24 January or later" would, run daily, wipe the lists the members write for the next Christmas. So the cleanup runs when today is 24 January or later and `ss_cleanup.year` is lower than this year, and then saves the year. A day the cron misses is caught up the next day.
- **The log is `ss_draw`.** The draw table is both the year's draw and the history ([draw](../../wiki/system/secret-santa-draw.md)), and the card says the log stays with ids, so the rows are not deleted. "No draw" after the wipe means the event is inactive: nothing reads a draw of an inactive event, and starting a new draw replaces the rows of the same year and reads the latest earlier year as "last year". Conversations ([MUPP-043](https://github.com/gustavnymoen/Muppbarnen/issues/141)) are not built yet; their deletion is added to `runCleanup` when they are.
- **One transaction per event** (wishes deleted, status inactive), the year saved last. If something fails the cleanup runs again the next day, and an event already cleaned is cleaned again without harm.
- **Signing everyone out with the year in the cookie.** The Secret Santa cookie is now `<member id>.<cleanup year>.<signature>` (`lib/santa-session.ts`) and `currentSantaMember` refuses it when the year is not the one in `ss_cleanup`. A cookie made before this change has no year and is refused once, so current sign-ins end when this is deployed. Chosen over a column per member because the cleanup then needs no extra writes.
- **Swedish time.** The date is `swedishToday()`, as for the kids' lists (MUPP-031); 24 January is 30 days after Christmas Eve (`DAYS_AFTER`).
- **No mail** is sent for the return to inactive (card, out of scope).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Secret Santa yearly cleanup](../../wiki/system/secret-santa-cleanup.md), [Secret Santa](../../wiki/manual/secret-santa.md).

[Specifications](../index.md)
