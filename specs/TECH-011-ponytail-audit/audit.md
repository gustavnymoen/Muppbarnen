---
type: Review
title: "TECH-011 Ponytail audit and tidy-up: audit report"
description: "The ranked findings of the ponytail audit of the whole repository, and the decision for each."
feature: TECH-011
---

# Ponytail audit of the repository

**Date:** 2026-11-01. Read-only: the audit changed no code.

**What this repo does:** Muppbarnen is a small, password-protected family site. Visitors see birthday cards with each kid's wish list and can claim ("paxa") gifts. Parents and a master administrator manage kids, sizes, pictures and wishes on an admin page. It runs on Vercel with Turso (SQLite), and locally on a SQLite file.

**Load assumed:** a few dozen family members, a handful of requests a minute at most. Judged against that, not against a public site.

**Overall:** the code is careful. Sign-in, the write limit, cookies, input checks and transactions are done well, and every write route is covered by `lib/route-checks.test.ts`. No security hole and no data-loss bug was found. The findings below are one test-setup problem, one real slowness, and some code that can be deleted or merged.

Every finding has a **Decision** line (R2). The product owner chose to fix 1–5; the decisions on 6 (leave) and 7 (fix) were made by Claude and are still to be confirmed.

## Must fix

1. **Local unit tests also run the tests of other worktrees** (`vitest.config.mts:17-18`)
   - **What this is:** `npm run test:unit` runs every `*.test.ts` file. The config lists what to skip in `exclude`.
   - **Problem:** `exclude` has `node_modules/**` and `tests/**`, which only match the top folder. `npx vitest list --filesOnly` lists 885 files here, 870 of them under `.claude/worktrees/` (four old checkouts, 3.0 GB, with their own `node_modules`). CI has no such folder, so only local runs are hit.
   - **Fix:** add `".claude/**"` and `"**/node_modules/**"` to `exclude`, one line. Also remove the four old worktrees, which are merged: `git worktree remove` for each, or the app's clean-up of worktrees.
   - **If we skip it:** the test numbers and times that `npm run test:time` gives for `verification.md` are wrong, local runs are slow, and a broken test in an old checkout fails a run that has nothing to do with the change.
   - **Decision:** **Fix here.** Done: `exclude` now has `.claude/**` and `**/node_modules/**`; `vitest list` shows 15 files, not 885. Removing the four old worktrees was refused by the permission check, so it is left to the product owner (all four are clean and in `main`).

## Should fix

2. **Every picture is downloaded in full on every visit** (`app/bilder/[id]/route.ts:15`, `lib/pictures.ts`)
   - **What this is:** the start page shows each kid's picture as a small avatar from `/bilder/<id>`.
   - **Problem:** the picture is stored exactly as uploaded (up to 4 MB) and sent with `Cache-Control: private, no-cache` and no `ETag`. The browser asks again and gets all the bytes again, through a serverless function that reads the private blob. Ten kids can be tens of MB per visit on a phone.
   - **Fix:** small, now: send an `ETag` made from the stored file name (it is a new random name whenever the picture changes) and answer `304` when `If-None-Match` matches, before reading the blob. Bigger, own card: shrink the picture when it is uploaded (needs an image library).
   - **If we skip it:** slow loads and a big mobile data bill on the first screen of the site.
   - **Decision:** **Fix here and own card.** Done: `ETag` from the file name and `304` in `app/bilder/[id]/route.ts`, tested in `tests/MUPP-003-admin-page.spec.ts`. Shrinking at upload is [TECH-012](https://github.com/gustavnymoen/Muppbarnen/issues/63).

3. **Unused database helpers** (`lib/db.ts:77-89`)
   - **What this is:** `constraintKind` (names the kind of a database error) and `escapeLike` (for `LIKE` searches).
   - **Problem:** neither is called anywhere, in code or tests. They are only mentioned in `wiki/system/architecture.md`.
   - **Fix:** delete both, and update that document.
   - **If we skip it:** someone reads, trusts and maintains code that nothing uses.
   - **Decision:** **Fix here.** Done: both deleted; the mention in `wiki/system/architecture.md` is removed (the audit said two spec files; they only matched `buttonClass`).

4. **The same wish row is mapped twice** (`lib/family.ts:76-120`)
   - **What this is:** the admin page reads wishes with `listWishlists`, the start page with `listDeckInput`.
   - **Problem:** both turn a database row into a wish by hand, field by field (`id`, `title`, `description`, `size`, `url`, `unlimited`); the first with `as string` casts. A new column must be added in four places.
   - **Fix:** one `toWishlistItem(row)` that both use; `listDeckInput` adds `claimedBy` and `claimedAt`.
   - **If we skip it:** the next wish field (for example one more column after MUPP-018 or MUPP-019) is added to one of them and forgotten in the other.
   - **Decision:** **Fix here.** Done: `toItem` in `lib/family.ts` is used by both lists.

5. **The date text `ÅÅÅÅ-MM-DD` is built in two places** (`lib/deck.ts:55`, `lib/family.ts:138`)
   - **What this is:** both turn "today in Sweden" into a text, with `String(month).padStart(2, "0")` twice.
   - **Problem:** two copies of the same rule; `latestBirthdate` builds a third, differently, with `toISOString()`.
   - **Fix:** one `isoDate(today)` next to `swedishToday` in `lib/deck.ts`; both callers use it.
   - **If we skip it:** a date format change must be found in several places.
   - **Decision:** **Fix here.** Done: `isoDate` in `lib/deck.ts`, used by `isExpected` and `claimWishes`.

## Nice to have

6. **Claiming many gifts is many round trips and not one unit** (`lib/family.ts:142-151`)
   - **What this is:** `claimWishes` claims up to 50 gifts with one `UPDATE` each, and a second `SELECT` for each one that fails.
   - **Problem:** against Turso every query is a network call, so 50 gifts can be about 100 calls in a row. A connection error in the middle leaves some gifts claimed and tells the visitor to try again; the second try then reports their own claims as "someone else got there first".
   - **Fix:** run the loop in one `withTransaction`, or batch the `UPDATE`s. Only worth it if people claim many gifts at once, which the family does not do today.
   - **If we skip it:** nothing visible with 1 to 3 gifts at a time.
   - **Decision:** **Leave.** The family claims one to three gifts at a time, so nothing is gained by changing it now; revisit if claiming many at once becomes common.

7. **Exports that nothing imports** (`app/components/Button.tsx:15`, `lib/login-block.ts`, `lib/form-input.ts`, `lib/deck.ts`, `lib/admin-auth.ts`, `app/losenord/actions.ts`)
   - **What this is:** `export` on `buttonClass` (only used inside `Button.tsx`) and on the types `LoginState`, `AdminSession`, `Today`, `Parsed`, `LoginResult`, `WriteGuard` and the constant `MAX_MONTHS_AHEAD`, which no other file imports.
   - **Problem:** a public name that is not used suggests a use that does not exist.
   - **Fix:** remove the `export` keyword from each. Exports that only tests use (`beginAttempt`, `originMatches` and similar) stay: tests are a real caller.
   - **If we skip it:** harmless noise.
   - **Decision:** **Fix here.** Done: `export` removed from `buttonClass`, `LoginState`, `AdminSession`, `Today`, `Parsed`, `LoginResult`, `WriteGuard` and `MAX_MONTHS_AHEAD`.

**Lean:** about -30 lines (findings 3, 4, 5, 7), -0 dependencies.

**Left out:** nothing ranked below these was left out.

**Verdict:** healthy. Fix 1 first, since it makes the numbers in `verification.md` wrong; then 2, the only finding that visitors feel.

**Not checked:**

- Read fully: `lib/` (all non-test files), `proxy.ts`, `app/actions.ts`, `app/admin/actions.ts`, the login actions, `app/bilder/[id]/route.ts`, `next.config.ts`, `scripts/db-setup.mjs`, the migrations, `Avatar.tsx`, `ci.yml`, and the first part of `ListPicker.tsx`.
- Not read in depth: `BirthdayDeck.tsx`, `Fold.tsx`, `ListPicker.tsx` past the header, `ChristmasBackdrop.tsx`, the admin pages, `globals.css`, `scripts/lint-docs.mjs`, the other workflows and `.semgrep/`, and the test files (`tests/design.spec.ts` and `tests/MUPP-003-admin-page.spec.ts` are the largest). The wiki and manual texts were not checked against the code.
- Nothing was run except `vitest list` and `tsc --listFilesOnly` (to count files). The test suite itself was not run.
