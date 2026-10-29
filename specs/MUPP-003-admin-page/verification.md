---
type: Verification
title: "MUPP-003 Admin page: verification"
description: How each requirement of the admin page was checked, the test suite before and after, and the requirements as built.
feature: MUPP-003
---

# Verification of MUPP-003

Tests: `tests/MUPP-003-admin-page.spec.ts` (browser, against the test database and the local picture folder), the unit tests in `lib/` and `db/`, the look in `tests/design.spec.ts` and the smoke test in `tests/smoke.spec.ts`. Everything below was checked locally on 2026-10-28, never against the user's own database or Blob store. Not done: the accessibility checklist on the live site, the site-password check of `/bilder/1` on the live site, and the Live tests after the merge (see Notes).

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-003-R1 | Browser tests `MUPP-003-R1 without the admin cookie …` (sign-in only, anything below leads there, actions refused), `MUPP-003-R1 R8 a wrong password …` (about a second, message next to the field, session cookie flags), `MUPP-003-R1 R2 a changed, expired or foreign cookie …`, `MUPP-003-R1 the sixth wrong password blocks …`; unit tests in `lib/admin-session.test.ts` (signing, expiry, changed, other secret) and `lib/route-checks.test.ts` (site check, admin check and `guardWrite()` in every action); the `VERCEL=1` build without the admin variables stops with a clear message | local | Pass | 2026-10-28 |
| MUPP-003-R2 | Browser tests `MUPP-003-R2 R8 with no parent the page offers one form …` (name "Gustav" filled in, creates the master admin, refused once a parent exists) and `MUPP-003-R2 R3 choose who you are …` (list, choose, "Byt förälder", removed parent drops the choice, rights from the database); unit tests in `lib/family.test.ts` | local | Pass | 2026-10-28 |
| MUPP-003-R3 | Browser test `MUPP-003-R3 sizes are edited and saved …` (saved, "Sparat.", bad value, another parent's kid out of reach); unit tests in `lib/family.test.ts` (own kids only, master can change all) | local | Pass | 2026-10-28 |
| MUPP-003-R4 | Browser test `MUPP-003-R4 R8 wish lists …` (add, edit, remove an item, clear a list, confirmations naming them, plain text); unit tests in `lib/family.test.ts` and `lib/form-input.test.ts` (limits, the link check) | local | Pass | 2026-10-28 |
| MUPP-003-R5 | Browser tests `MUPP-003-R5 the master admin manages parents and kids …` and `MUPP-003-R5 R6 a parent who is not the master admin has no Hantera and no upload`; unit tests in `lib/family.test.ts` (last master admin, parent with kids, removing a kid with its lists) | local | Pass | 2026-10-28 |
| MUPP-003-R6 | Browser test `MUPP-003-R6 a picture is uploaded, shown only through the site, replaced, and a bad file is refused` (also: no picture without the site cookie, 404 without a picture); unit tests in `lib/image-type.test.ts` (JPEG, PNG, WebP by content, a renamed text file) and `lib/pictures.test.ts` (the local store, size limit, only generated names) | local | Pass | 2026-10-28 |
| MUPP-003-R6, real Blob store | Manual check on the preview: the store `muppbarnen-blob` is Private (Vercel Storage); a picture was uploaded as the master admin (store shows 396 kB, file `barn-1-<uuid>.jpg`); `/bilder/1` shows the picture when signed in; the file's direct address without the signature answers 403 (only Vercel's time-limited signed link opens it). Not checked on the preview: that `/bilder/1` asks for the site password, because the preview is behind Vercel's own sign-in (a private window gets the Vercel login first); that is covered by the browser test and is to be seen on the live site | preview | Pass, except the site-password check, which was not checked on the preview | 2026-10-28 |
| MUPP-003-R7 | Unit tests in `db/db-setup.test.ts` (the tables, the foreign keys, the unique list per kid and occasion, the `occasion` check); all queries use `?` parameters (read in the review and by `/security-review`); seed and test data are made up | local | Pass | 2026-10-28 |
| MUPP-003-R8 | Browser tests `MUPP-003-R8 the menu ends with a quiet Admin link …` (last item, only link, `noindex`, `X-Robots-Tag`), `MUPP-003-R8 every admin page works at 320 and 430 px and on a desktop …` (three tests: no sideways scroll, controls of 44 px), `MUPP-003-R8 with the keyboard only …` (two tests), axe on every page and state, and `MUPP-003-R8 the admin link is quiet, and the admin pages look like the rest …` in `design.spec.ts` | local | Pass | 2026-10-28 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/admin-session.test.ts`, `form-input.test.ts`, `image-type.test.ts`, `pictures.test.ts`, `family.test.ts`; additions to `db/db-setup.test.ts` and `lib/route-checks.test.ts` | local, CI | Pass | 2026-10-28 |
| Browser tests | `tests/MUPP-003-admin-page.spec.ts` with data from `uniqueName()` or the test database, and the look test in `tests/design.spec.ts` | local, CI | Pass | 2026-10-28 |
| Smoke test | `@smoke` test in `tests/smoke.spec.ts`: `/admin` without the site cookie answers with the site password page and none of the admin | local; preview and live: not run yet | Pass locally | 2026-10-28 |
| Accessibility | axe (`expectNoA11yViolations`) on the sign-in, the first-master form, the parent list, a parent's page with the forms, the master section and the confirmation; the manual checklist (VoiceOver, 200 % zoom, text spacing, contrast, target sizes) on the live site | local; live checklist: not done | axe: Pass; checklist: not checked | 2026-10-28 |
| Security | The security points of the review; `/security-review` run on the whole change, nothing found at high confidence (see [review.md](review.md)) | local | Pass | 2026-10-28 |
| Manual check | Real Blob upload on the preview, as described under R6 | preview | Pass (the site-password check of `/bilder/1` not checked on the preview) | 2026-10-28 |
| Code review | [review.md](review.md) | local | Passed | 2026-10-28 |

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (TECH-005) | 57 unit, 18 browser | 20.7 s | not recorded |
| After | 92 unit, 37 browser | 68.4 s | 4.3 s |

The browser time grew about 3.3 times, more than the 25 % rule, and is still inside the budgets (180 s in total, 5 s per test). The cause is the admin flows themselves: a wrong password waits one second, the block test makes six wrong attempts, and every page and state is checked with axe and at three widths. Two slow tests were split in three and two to keep each under 5 s. Further trimming would mean testing less of the admin, so it is left as it is for now; the cost is noted here to be handled if the suite keeps growing.

## Definition of Done

- [x] Tests: every check in the card's test plan is done (the real Blob upload on the preview by hand, recorded above); every requirement is tested; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets; total time grew more than 25 %, with the cause explained above; the new tests follow the quality rules in `wiki/system/testing.md`
- [ ] Deployed, and the smoke tests pass against production (Live tests): not done, comes after the merge
- [ ] Accessibility: changed pages and states pass `expectNoA11yViolations` (done), but the relevant items of `wiki/system/accessibility.md` are not yet checked on the live site
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/admin.md`), system docs (`wiki/system/admin.md` and others) and `wiki/log.md` updated
- [x] No leftovers: the template helpers in `tests/helpers.ts` and `tests/global-teardown.ts` that the change replaced are deleted; no commented-out code or debug output
- [x] Clean code: reuses `Button`, `Card`, `Avatar`, `SiteMenu` and the shared login block; `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way: none found

## Requirements as built

Copied from the card (issue #2), shortened to the acceptance criteria as they were built.

### MUPP-003-R1 Admin password

The admin pages need the admin password in addition to the site password.

- A visitor with the site cookie but no admin cookie who opens `/admin` sees the sign-in page (field "Adminlösenord", button "Logga in") and nothing else from the admin. Anything below `/admin` leads there (page requests) or is refused with 401 (other requests).
- The right password sets an admin cookie: `HttpOnly`, `Secure` and named `__Host-admin_session` in production, `SameSite=Lax`, a session cookie, rejected after 8 hours, with an expiry, the chosen parent's id and an HMAC-SHA256 signature made with `ADMIN_SESSION_SECRET`. An expired, changed or other-secret cookie is rejected as if there were none.
- A wrong password is answered after about a second with "Fel lösenord." next to the field, read out by a screen reader.
- **Changed from the card:** the attempt limit is the block from TECH-005, shared with the site password: the sixth wrong password blocks the address for 20 minutes, with "För många försök. Försök igen om en stund.", and right passwords are not counted. This replaces the card's older wording ("5 wrong attempts in 15 minutes", "a column tells the two apart"); no migration was needed. Passwords are compared as SHA-256 hashes with `timingSafeEqual`.
- With `ADMIN_PASSWORD` or `ADMIN_SESSION_SECRET` missing the admin refuses everything, and a build on Vercel stops with a clear message.
- Every admin page, server action and the picture upload is checked by `proxy.ts` (the cookie must be present) and again in the code (the cookie must be valid). `/admin` itself passes the proxy, because the sign-in action posts there; the page shows only the sign-in without a valid cookie.

### MUPP-003-R2 Choose who you are

- With a valid admin cookie and no chosen parent, `/admin` lists the parents as cards with one button each; the choice is kept in the signed cookie and checked to exist on every request.
- A chosen parent gets the button "Byt förälder", and the page says whose kids are shown. A removed parent drops the choice.
- The rights of the master admin are read from the database (`is_master_admin`) on every request.
- With no parents the page offers one form, "Skapa huvudadministratör", with the name "Gustav" filled in (changeable) as the only field; the server refuses it as soon as any parent exists.

### MUPP-003-R3 My kids and their sizes

- A chosen parent sees their kids with picture (or the avatar with an initial), name and sizes, and no other parent's kids.
- Clothes, shoes, head and gloves sizes (each at most 40 characters, empty clears) are saved and shown again, with "Sparat." read out; a bad value shows a message next to the field.
- Another parent's kid id is refused on the server; the master admin can change all.

### MUPP-003-R4 Wish lists

- A kid shows the two lists "Födelsedag" and "Jul".
- A new item has "Namn" (mandatory, at most 120), "Storlek" (at most 40), "Beskrivning" (at most 500), "Länk" (only `http://` or `https://`, at most 500) and "Obegränsad" (default limited). A missing name or a bad link is refused next to the field, on the server too.
- An item can be edited; "Ta bort" removes it after a confirmation that names it; "Töm listan" removes all items after a confirmation that names the list and the kid.
- Another parent's item or list is refused. Texts are shown as plain text.

### MUPP-003-R5 Manage kids and parents (master admin)

- Only the master admin has the section "Hantera" with all parents and kids, and the server refuses its actions for others.
- A parent (name mandatory, at most 60) or a kid (name mandatory at most 60, birthdate a real date not in the future (changed by MUPP-011: up to ten months ahead), parent) can be added and edited.
- Removing a kid removes its lists and its picture after a confirmation. A parent with kids cannot be removed (the message says to move or remove the kids first). The last master admin cannot be removed, and the flag can be given to another parent but never lost by the last master admin.

### MUPP-003-R6 Pictures

- The master admin uploads or replaces a kid's picture; it goes to the private Blob store and the old file is removed. Only JPEG, PNG and WebP up to 4 MB are accepted, checked by the file's content; anything else gives "Bilden måste vara JPEG, PNG eller WebP och högst 4 MB."
- `/bilder/<child id>` answers with the picture after the site cookie check, with 404 when the kid has none, and never reveals the Blob address. The image has an empty alt text where the name stands next to it, otherwise the kid's name.
- In tests the pictures use a local folder behind the same small module.

### MUPP-003-R7 The tables and the data

- `db/migrations/003_family.sql` creates Parent, Child, Wishlist and Wishlist item as in the data model, with foreign keys, the unique list per kid and occasion, and checks on `occasion`. Seed and test data are made up.
- All queries are parameterised, and every input is validated on the server (ids integers, texts strings of limited length, the occasion one of two values).

### MUPP-003-R8 The discreet link, mobile and accessibility

- "Admin" is the last item of the menu, a real link to `/admin` in a quieter style that still meets contrast, and the start page has no other link to it (this changes MUPP-002-R2).
- Admin pages have `noindex` (meta robots and `X-Robots-Tag`), and `robots.txt` does not list them.
- Every admin page works from 320 × 568 to 430 × 932 px and on a desktop, with no sideways scroll and controls of at least 44 × 44 px, built from the MUPP-001 components.
- The sign-in, the parent list, a parent's page with the forms, the master section and a confirmation pass axe; every field has a label, errors are read out, and everything works with the keyboard only.

## Notes

- **`/admin` passes the proxy without the admin cookie.** The sign-in action posts to `/admin`, so it has to. The page and every action check the cookie again in the code and show only the sign-in without it.
- **`notFound()` inside `Suspense` answers with status 200** (the page streams), so the tests check the page content ("Sidan finns inte", from the new Swedish `app/not-found.tsx`) instead of status 404.
- **The proxy's redirect** from `/admin/...` to `/admin` carries the body "/admin"; the test allows both an empty body and that.
- **The confirmation dialog does not wrap focus** (Tab past the last button leaves to the browser's own interface). The test checks that focus never lands behind the dialog, and Escape and Shift+Tab work.
- **Preview and Vercel's sign-in:** the preview is behind Vercel's own authentication, so a private window sees the Vercel login and never the site's password page. The site-password check of `/bilder/<id>` is therefore covered by the browser test (`MUPP-003-R6 …`, no picture without the site cookie) and is to be seen once on the live site.
- **Not checked:** the accessibility checklist on the live site, the site-password check of `/bilder/1` on the live site, and the Live tests after the merge.
- **Test time:** see Test suite above.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
