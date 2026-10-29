---
type: Guide
title: Admin page
description: "How the admin page is built: the admin sign-in and cookie, choosing who you are, the pages for parents and the master admin, the rules per kid, the tables and the private pictures."
resource: app/admin/
feature: MUPP-003
tags: [admin, sign-in, database, pictures]
---

# Admin page

The admin page is where the parents fill in the kids' sizes and wish lists, and where the master admin manages the kids, the parents and the pictures. It sits on top of the site password: the site password gets you onto the site, the admin password lets you edit.

## Parts

| Part | Where | What |
|---|---|---|
| Sign-in | `app/admin/login-action.ts`, `lib/admin-session.ts`, `lib/admin-auth.ts` | One shared password, `ADMIN_PASSWORD`. A right password sets the session cookie `__Host-admin_session` (`admin_session` over http locally): `<expiry>.<chosen parent id, 0 = none>.<HMAC-SHA256>` made with `ADMIN_SESSION_SECRET`; `HttpOnly`, `Secure` in production, `SameSite=Lax`, gone when the browser closes and refused after 8 hours. Wrong passwords use the same one-second wait and the same block as the site password ([Security](security.md)). Missing settings close the admin. |
| Proxy | `proxy.ts` | Under `/admin/…` pages without the admin cookie are sent to `/admin` and other requests get 401. `/admin` itself passes, since it is the sign-in page and its action; everything there checks the cookie again. |
| Who am I | `app/admin/page.tsx`, `app/admin/actions.ts` | After the password you choose which parent you are ("Vem är du?"); the choice is stored, signed, in the cookie and checked against the database on every request. "Byt förälder" clears it. With no parent in the database the page offers the form "Skapa huvudadministratör" (name starting as "Gustav"); the server refuses it as soon as a parent exists. |
| Parent page | `app/admin/page.tsx`, `app/admin/ChildCard.tsx` | The chosen parent's kids as slim cards (thumbnail, name, measuring tape and checklist links to the two kid pages); the master admin also gets a "Hantera" section. |
| Kid pages | `app/admin/barn/[id]/storlekar`, `…/onskelistor`, `KidPage.tsx` | Two pages, each with only its own content: the sizes, and the lists "Födelsedag" and "Jul" as separate cards of slim rows with add, change, remove and "Töm listan". `KidPage` has the checks and the header they share. |
| Master section | `app/admin/hantera/page.tsx` | Parents and kids: add, change, remove, give the master flag, move a kid to another parent, upload and remove a picture. A 404 for everyone else. |
| Rules | `lib/family.ts`, `lib/form-input.ts` | Every read and every change. A function takes the actor (read from the database), checks the right and the input, and returns `{ ok }` or a message. |
| Pictures | `lib/pictures.ts`, `lib/image-type.ts`, `app/bilder/[id]/route.ts` | See below. |
| Forms | `app/components/Form.tsx`, `ConfirmAction.tsx` | Shared with the rest of the site: see [Design system](design.md). |
| Compact layout | `app/components/Fold.tsx`, `SlimCard.tsx`, `Button.tsx` (`IconButton`, `IconLink`), `icons.tsx` | See below. |

## Compact layout

[MUPP-010](../../specs/MUPP-010-compact-admin/solution.md) made the admin small enough for many kids and items on a phone:

- **Slim cards** (`SlimCard`): one row of about 50 px with a thumbnail, the name and icon buttons. The information and the form open under it.
- **Icon buttons** (`IconButton`, `IconLink` with `compact`): pencil "Ändra X", trash can "Ta bort X", picture "Bild för X", measuring tape "Storlekar för X" and checklist "Önskelistor för X". Each has the accessible name and the same text as a tooltip (`title`), is 32 × 32 px with 8 px between them. This is the one exception to the 44 px rule ([Design system](design.md)); buttons with text stay 44 px.
- **One open at a time** (`Fold.tsx`): a `FoldGroup` around a page knows which panel is open. `FoldToggle` / `FoldButton` carry `aria-expanded` and `aria-controls`; `FoldPanel` shows its content only while open and folds on Esc, returning focus to its button. A `Form` inside a panel folds it when saved (not the sizes, where "Sparat." is read out).
- **Removing a picture:** the picture panel of a kid with a picture has a row (thumbnail, "Bild", trash can). The server action `removeChildPicture` takes the same three checks as every action, and `family.clearChildPicture` allows only the master admin; the column is cleared first and the file removed from the store after, so a failed removal leaves at worst an unused file.

## Rights

- **Master admin:** the flag `parent.is_master_admin`, read from the database on every request, never from the cookie or the form. Only the master admin creates and changes parents and kids, moves a kid and uploads pictures, and may change every kid's sizes and lists.
- **Other parents:** only their own kids (`child.parent_id`). Another parent's kid gives the same answer as a kid that does not exist (a 404 page, or "Du kan inte göra det här.").
- **The last master admin** can't be removed and can't lose the flag; give it to someone else first. A parent with kids can't be removed.
- Removing a kid removes its lists, items and picture, after a confirmation that names it. Removing only the picture is the master admin's too.

## Data

Migration `db/migrations/003_family.sql`: `parent`, `child`, `wishlist` (one per kid and occasion, made with the first item) and `wishlist_item` (title, description, size, link, `unlimited`, and `claimed_by` / `claimed_at` for MUPP-005). The texts have length checks in the database and on the server. Real names, birthdates, sizes and pictures are entered on the page and live only in the database and the picture store.

## Pictures

The picture is stored under a generated name (`barn-<id>-<uuid>.jpg|png|webp`); the kid row holds only that name. With `BLOB_READ_WRITE_TOKEN` set the file goes to the **private** Vercel Blob store (`access: "private"`, checked by `lib/route-checks.test.ts`); without it, locally and in the tests, to the folder `PICTURES_DIR` (`~/Ai Projekt/muppbarnen-data/pictures` by default). The upload accepts JPEG, PNG and WebP up to 4 MB, decided by the file's first bytes and not its name or type; replacing a picture removes the old file. `/bilder/<child id>` answers after the site cookie check with the picture, `401` without the cookie and `404` when the kid or the picture is missing; the address of the store is never sent to the browser.

## Settings

`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` and (on Vercel) `BLOB_READ_WRITE_TOKEN`: in `.env.local` locally (not the Blob token, so that local work does not touch the real store) and under Environment Variables in Vercel for Production and Preview. A Vercel build stops without the two admin settings. See [Rotating secrets](security.md#rotating-secrets-and-leaks).

## Tests

`tests/MUPP-003-admin-page.spec.ts` and `tests/MUPP-010-compact-admin.spec.ts` (against the local test server, with made-up passwords, its own database and picture folder; data is made straight in the test database by `tests/family-db.ts`), the unit tests `lib/admin-session.test.ts`, `lib/form-input.test.ts`, `lib/image-type.test.ts`, `lib/pictures.test.ts`, `lib/family.test.ts` and `db/db-setup.test.ts`, the check test `lib/route-checks.test.ts`, the look in `tests/design.spec.ts` and the smoke test in `tests/smoke.spec.ts` ([Testing](testing.md)).

A kid's birthdate must be a real date from 1900 up to ten months ahead (`latestBirthdate` in `lib/form-input.ts`), so a kid who is on the way can be added; the kid is then listed as "Beräknad {datum}" until the day.

Built by [MUPP-003](../../specs/MUPP-003-admin-page/solution.md), made compact by [MUPP-010](../../specs/MUPP-010-compact-admin/solution.md) and given the future birthdate by [MUPP-011](../../specs/MUPP-011-future-birthdate/solution.md); the Swedish version is [Administrationssidan](../manual/admin.md).

[System documentation](index.md)
