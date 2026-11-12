---
type: Review
title: "TECH-022 Ponytail audit of the code: audit report"
description: "The ranked findings of the second ponytail audit of the whole repository, and the decision for each."
feature: TECH-022
---

# Ponytail audit of the repository (second run)

**Date:** 2026-11-12. Read-only: the audit changed no code. The first run is [TECH-011](../TECH-011-ponytail-audit/audit.md).

**What this repo does:** Muppbarnen (the site is called Kusinportalen) is a small, password-protected family site. Visitors see birthday cards with each kid's wish list and can claim ("paxa") gifts; parents manage kids, sizes, pictures and wishes on an admin page; a Secret Santa part lets groups draw names, keep wish lists and chat without revealing who is who. It runs on Vercel with Turso (SQLite), and locally on a SQLite file.

**Load assumed:** a few dozen family members, a handful of requests a minute at most. Judged against that, not against a public site.

**Overall:** healthy. Sign-in, cookies, the login block, the write limit, input checks, transactions and the mail jobs are done with care, and the rules in `specs/rules.md` are enforced by `lib/route-checks.test.ts`. No security hole that works today and no data-loss bug was found. The findings below are one small time-zone bug, one weak spot in a rarely used route, and some repeated code. Every finding has a **Decision** line (R2). The decisions are Claude's proposal; the owner confirms them when the card is merged.

## Should fix

1. **The year of a draw comes from the server clock** (`lib/santa.ts:149`, used in `startDraw`)
   - **What this is:** when an administrator starts a Secret Santa draw, the rows are saved with a year. "Not last year's person" and "stop the draw" read that year.
   - **Problem:** `thisYear()` is `new Date().getFullYear()`, the server's time zone (UTC on Vercel). The rest of the site uses Swedish time (`swedishToday()` in `lib/deck.ts`; the yearly clean-up too). A draw started between 00:00 and 01:00 Swedish time on 1 January is saved under the year before, and the "left over from the same year" delete in `startDraw` then looks at the wrong year.
   - **Fix:** `swedishToday().year` instead. One line, plus a unit test for the turn of the year.
   - **If we skip it:** it is rare (one hour a year), but when it hits, the "not last year's person" rule is applied to the wrong draw.
   - **Decision:** **Own card**, because it is a bug fix that changes behaviour and needs a new test: [MUPP-067 Secret Santa draw year in Swedish time](https://github.com/gustavnymoen/Muppbarnen/issues/227) (Fix).

2. **The clean-up route is the weakest door** (`app/api/santa-cleanup/route.ts:10-14`)
   - **What this is:** a public `GET` that Vercel Cron calls every day. With the right secret it deletes the Secret Santa wish lists and chats (once a year, when due).
   - **Problem:** it compares the `Authorization` header its own way (length first, then `timingSafeEqual`), accepts a `CRON_SECRET` of any length, and has no limit on wrong guesses. The mail route next to it (`app/api/santa-mails/route.ts`, `lib/santa-job.ts`) hashes both sides, requires 32 characters and runs `guardWrite()` first. Two checks for the same job, one of them weaker.
   - **Fix:** one bearer-secret helper used by both routes, and `guardWrite()` first in the clean-up route.
   - **If we skip it:** a short `CRON_SECRET` could be guessed without any limit; it is unlikely, but the other route shows it is cheap to prevent.
   - **Decision:** **Own card** (new test logic and a security review are needed): [TECH-024 Shared access checks](https://github.com/gustavnymoen/Muppbarnen/issues/228) (Tech), requirement R3.

3. **The same opening checks are written out in about 30 server actions** (`app/admin/actions.ts` 12×, `app/admin/santa-actions.ts` 10×, `app/admin/picture-actions.ts`, `app/secret-santa/*-actions.ts`; cookies in `app/losenord/actions.ts:22`, `lib/admin-auth.ts:39`, `lib/santa-auth.ts:94`)
   - **What this is:** every action first checks the site cookie, the admin cookie and the write limit, in that order (`specs/rules.md`). Three places also set a session cookie with the same options.
   - **Problem:** the order is kept by copy and paste, and `lib/route-checks.test.ts` finds a missing check by reading the text. The next action can get one wrong; a change to a cookie option must be made in three places.
   - **Fix:** one helper for each kind of opening and one for setting a session cookie. It touches every action file, so it is not small.
   - **If we skip it:** more copies with every new action.
   - **Decision:** **Own card**: [TECH-024 Shared access checks](https://github.com/gustavnymoen/Muppbarnen/issues/228) (Tech), requirement R2.

4. **The build warns that the whole project is traced** (`lib/mail-sink.ts:18`, imported by `lib/mail.ts`)
   - **What this is:** `npm run build` prints "Dynamic filesystem access causes tracing of the whole project". Next.js then copies every source file into the server code of the functions that import the file.
   - **Problem:** `readOutbox` reads a file from a path that is only known at run time. It and `clearOutbox` are used only by tests, but they sit in the same file as `saveToOutbox`, which `lib/mail.ts` (and so the mail routes and Secret Santa actions) imports. This is the kind of size growth [TECH-016](../TECH-016-smaller-functions/solution.md) removed; `scripts/function-sizes.mjs` is not run in CI, so nothing stopped it.
   - **Fix:** move `readOutbox` and `clearOutbox` to a test helper (`tests/mail-outbox.ts`) and leave only `saveToOutbox` in `lib/mail-sink.ts`. Six test files change their import; no logic changes.
   - **If we skip it:** bigger functions on Vercel and a warning in every build.
   - **Decision:** **Fix here.** Small, behaviour-preserving, no new test logic.

## Nice to have

5. **A list is copied into an identical list** (`lib/family.ts:107`)
   - **What this is:** `listDeckInput` reads the children for the start page.
   - **Problem:** it maps every `Child` to a new object with the same six fields; `DeckInput` (`lib/deck.ts:11`) is exactly the shape of `Child`.
   - **Fix:** use the result of `listChildren()` as it is.
   - **If we skip it:** a new child field must be added in this copy too, or it silently does not reach the start page.
   - **Decision:** **Fix here.** Small, behaviour-preserving, no new test.

6. **Twelve `export`s that nothing outside the file uses**
   - **What this is:** types and constants that are exported but only used in their own file (checked by searching the whole tree, tests included): `SignInState` (`app/secret-santa/actions.ts`), `occasionOn` (`lib/deck.ts`), `CONFIRMATION_TITLE` and `EnterAction` (`lib/form-card.ts`), `IMAGE_EXTENSIONS` (`lib/image-type.ts`), `MailResult` (`lib/mail.ts`), `MAX_PICTURE_SIDE` (`lib/picture-upload.ts`), `EntranceMember` and `SantaContact` (`lib/santa-auth.ts`), `MAIL_WAIT_MS` (`lib/santa-chat.ts`), `DrawResult` (`lib/santa-draw.ts`), `DrawStart` (`lib/santa.ts`).
   - **Problem:** an export says "other files may depend on this". Here none does, so a reader looks for users that do not exist.
   - **Fix:** remove the word `export` from each. No code is deleted.
   - **If we skip it:** harmless, but the public surface of `lib/` is bigger than it is.
   - **Decision:** **Fix here.**

7. **`lib/mail.ts` imports the site name from a component file** (`lib/mail.ts:2`)
   - **What this is:** the mail layout needs the name `SITE_NAME`, which lives in `app/components/SiteHeader.tsx`.
   - **Problem:** a server library imports a file that also holds a React component and pulls in the menu component, so the mail routes may carry more than they need.
   - **Fix:** move the constant to a plain file (for example `lib/site.ts`) and update five imports and four documentation lines.
   - **If we skip it:** possibly a slightly larger function for `/api/santa-mails`; not measured.
   - **Decision:** **Leave.** It was seen and left on purpose in [TECH-017's review](../TECH-017-sending-email/review.md), it is the one place the name lives (MUPP-046), and the cost has not been measured (`scripts/function-sizes.mjs`, TECH-016, can show it if it ever matters).

8. **The chat reads the whole conversation on every call** (`lib/santa-chat.ts:38-43`, `openChat`, `sendMessage`)
   - **What this is:** each time a chat is opened or a message sent, all messages of the pair are read.
   - **Problem:** the list only grows. A message is at most 500 characters and writes are limited, so a pair would need thousands of messages before it is slow.
   - **Fix:** a limit or paging, which is new behaviour.
   - **If we skip it:** nothing at this size.
   - **Decision:** **Leave.** Far below the assumed load; revisit if a conversation ever gets long.

**Left out:** two smaller things (a date text built by hand in `tests/helpers.ts` next to the helper `isoDate`, and the non-null `!` in `cleanupYear`, which is safe because the migration inserts the row).

## Checked and fine

Sign-in, cookies (`__Host-`, signed, expiry, constant-time compare), the login block and write limit (counted in the database, written before the check), `safeTarget` against open redirects, the proxy and its public file list, the transactions and the busy-retry in `lib/db.ts`, claim and unclaim (one `UPDATE` per wish, so two people cannot take the same one), the draw (uses `crypto.getRandomValues`, falls back to an exhaustive search), the Secret Santa chat and mail jobs (claim first, put back on failure), the migrations script (one transaction per migration, backup before), picture handling (name pattern, private storage, `ETag`), the CI workflow and the security headers.

**Verdict:** healthy. Fix 4, 5 and 6 now; 1 to 3 are own cards.

**Lean:** -8 lines, -0 dependencies possible.

**Not checked:** the React components in `app/components/` and the pages (looked at only through their imports), `tests/design.spec.ts` and the other browser tests, the CSS, the wiki and the specs (`npm run lint:docs` covers them), and the deployed Vercel and Turso settings (the value of `CRON_SECRET` in particular).
