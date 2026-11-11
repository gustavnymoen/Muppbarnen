---
type: Solution
title: "MUPP-042 Secret Santa: your person and change mails: solution"
description: "How the started own page, the match's read-only list and the hourly change mails are built: the draw lookup, the change marks, the scheduled job and what keeps every answer to the signed-in giver's own match."
feature: MUPP-042
card: "#140"
depends_on: [MUPP-041, MUPP-051, MUPP-052, TECH-017]
---

# MUPP-042 Secret Santa: your person and change mails: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 140`.

## Data

Migration `db/migrations/010_santa_list_changes.sql` adds two nullable columns to `ss_member`: `list_changed_at` (milliseconds; since when the member's list has changed without the giver being told, `NULL` = nothing waiting) and `list_mailed_at` (when the giver last got the mail). The draw itself is `ss_draw` from MUPP-041.

## Interface

- **Own page** (`app/secret-santa/min-sida/page.tsx`): in a started group the second card is the link "Min matchning: <NAME>" (Santa-hat icon, same size as the list card), via the shared `LinkCard`; before the start it stays the grey "Inte tilldelad än" card (R1). A started group with no row in the draw (cannot happen through the site) shows the grey card.
- **Match page** (`app/secret-santa/min-sida/matchning/page.tsx`): "Önskelistan hos <NAME>", the wishes as the children's expandable rows without buttons ([MUPP-062](../MUPP-062-wish-rows/solution.md): `WishRow` without claiming, roomier), "Inga önskningar ännu." when empty, back arrow to the own page. Not started or no match: back to the own page.
- **The job** `POST /api/santa-mails` (`app/api/santa-mails/route.ts`) answers `{ sent, failed }` (counts only). `.github/workflows/santa-mails.yml` calls it every ten minutes with the secret `SANTA_JOB_SECRET`.
- **Mail 5** is `listChangedMail` of MUPP-052: the group in the subject, no name, no wish.

## Decisions

- **The timer is a scheduled GitHub Actions workflow** (the card's preferred option): Vercel's free plan runs a scheduled job once a day, too rarely for "once an hour". The workflow is free and calls the site's own route. **It needs one thing from the owner:** the same random string of at least 32 characters as `SANTA_JOB_SECRET` in Vercel (Production) and as a repository secret in GitHub. Until then the route refuses everything (it is closed without the secret) and the workflow does nothing; no change is lost, since marks wait in the database.
- **Marks, not a queue.** A wish change only sets `list_changed_at` (`markListChanged`, in `lib/santa-changes.ts`) and only while the group is started (R3: no mail for a change before the draw). The job looks at all marked lists whose giver has not been mailed in the last hour (`list_mailed_at`), so the first change is mailed within ten minutes and later ones at most once an hour, however many changes there were. No change since the last mail means no mark, so no mail.
- **Claim before send.** The job takes the mark (`UPDATE … WHERE list_changed_at = <the value it read>`) before it sends, so two runs at once send one mail; if the mail fails the mark and the old time are put back, and the next run tries again. The mail is sent to the giver found in `ss_draw`; the job never returns who that was.
- **Start and stop clear the marks** (`clearListChanges`): what waited belongs to an older draw.
- **The route is outside the site password on purpose.** `proxy.ts` lets exactly `POST /api/santa-mails` through without the cookie, and `lib/route-checks.test.ts` lists the route as the second exception from the sign-in check, with the reason. In its place the route first goes through `guardWrite()` (so the secret cannot be guessed at speed) and then `jobAuthorized` (`lib/santa-job.ts`: Bearer token, compared as SHA-256 hashes with `timingSafeEqual`, closed for a secret under 32 characters). The workflow calls `muppbarnen.vercel.app`, which is up before the mail domain (TECH-020).
- **Secrecy (R2):** `matchOf(giverId)` (`lib/santa-match.ts`) takes the id from the sign-in cookie, selects only the receiver of that giver in the latest draw of a started event, and returns `{ name, wishes }`. No function returns a giver for a receiver; the only place that looks the giver up is the job, which uses the address and returns a count. Tested for A→B, B→C, C→A and D↔E.
- **Wish rows without a form:** the read-only rows reuse `WishRow` of the children's list ([MUPP-062](../MUPP-062-wish-rows/solution.md)); no new component.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Secret Santa match and change mails](../../wiki/system/secret-santa-match.md), [Secret Santa event status](../../wiki/system/secret-santa-status.md), [Pipeline](../../wiki/system/pipeline.md), [Mail](../../wiki/system/mail.md), [Secret Santa](../../wiki/manual/secret-santa.md).

[Specifications](../index.md)
