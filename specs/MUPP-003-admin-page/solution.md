---
type: Solution
title: "MUPP-003 Admin page: solution"
description: How the admin page is built - the tables, the admin sign-in and cookie, the pages and forms, the rules for parents, kids and wish lists, and the private picture store - and the decisions behind it.
feature: MUPP-003
card: "#2"
depends_on: [MUPP-001, MUPP-002, MUPP-009, TECH-005]
---

# MUPP-003 Admin page: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 2`.

## Data

Migration `db/migrations/003_family.sql` creates `parent`, `child`, `wishlist` and `wishlist_item` as in the card's data model. Text columns have `CHECK` limits equal to the server's (`lib/form-input.ts`), `birthdate` is checked to look like `YYYY-MM-DD`, `occasion` is `birthday` or `christmas`, `unlimited` and `is_master_admin` are 0 or 1, and a list is unique per `(child_id, occasion)`. `child.parent_id` is `NOT NULL` and has no cascade, so a parent with kids cannot be deleted; `wishlist` and `wishlist_item` cascade from the child. Optional texts are `NOT NULL DEFAULT ''` instead of `NULL` (empty clears a size). `claimed_by` and `claimed_at` exist and are unused until MUPP-005. The seed stays empty: the first parent is made on the admin page.

The attempt counting is not changed: `login_attempts` and `login_blocks` from MUPP-009 and TECH-005 are shared by the site and the admin sign-in (see Decisions), so no migration for it.

## Interface

- **Pages** (all behind the site password, `noindex` by `app/admin/layout.tsx` and by `X-Robots-Tag` in `next.config.ts`; each checks in a component of its own behind `<Suspense>`, as the site password does):
  - `/admin` (`app/admin/page.tsx`): four states from the cookie and the database: not signed in (field "Adminlösenord", button "Logga in"), no parents (the form "Skapa huvudadministratör", name starting as "Gustav"), no parent chosen ("Vem är du?", one button per parent), a parent chosen (their kids as cards with a link to each kid's page, the button "Byt förälder", and for the master admin a "Hantera" card).
  - `/admin/barn/[id]` (`app/admin/barn/[id]/`): a kid's sizes form and the two lists "Födelsedag" and "Jul". An item has a `<details>` form ("Ändra") and "Ta bort"; a list has "Ny önskning" and "Töm listan". The page is a 404 for anyone who may not manage the kid.
  - `/admin/hantera` (`app/admin/hantera/page.tsx`): the master admin's section with all parents and kids: add, change, remove, move a kid, upload a picture. A 404 for everyone else.
  - `/bilder/[id]` (`app/bilder/[id]/route.ts`): the picture, after the site cookie check; 404 without a kid or a picture.
- **Server actions** (`app/admin/actions.ts`, and `app/admin/login-action.ts` for the sign-in): each starts with the site check, the admin check and `guardWrite()`, then calls the rule in `lib/family.ts`. They answer with a `FormState` (`saved`, `error`, `fields`, `values`) and refresh the pages with `revalidatePath`.
- **Shared components** (new, in `app/components/`): `Form` and `Field` (a form run by a server action with `useActionState`, `noValidate`, a label and an error `role="alert"` for every field, "Sparat." as `role="status"`, and the typed values kept after an error), `ConfirmAction` (a modal `<dialog role="alertdialog">` that names what is removed; focus starts on "Avbryt"), `Disclosure` (a `<details>` with a button-like `<summary>`), `LinkButton` and `buttonClass` in `Button.tsx`, `decorative` on `Avatar`, `section` on `Card`. "Admin" in `SiteMenu` is a `Link`, last and in the muted text colour.
- **Library** (`lib/`): `admin-session.ts` (the cookie, pure), `admin-auth.ts` (`currentAdmin`, `requireAdminSession`, `hasAdminSession`, `setAdminCookie`), `form-input.ts` (pure checks of ids, text, date, link and occasion), `family.ts` (all reads and rules), `image-type.ts` (the picture type from its first bytes, pure), `pictures.ts` (the store). `login-block.ts` got `checkLogin()` and `request-guard.ts` got `guardMessage()`, which the site sign-in and the admin sign-in share.
- **Texts** are Swedish, listed in the card's criteria; other messages: "Fyll i det här fältet.", "Högst N tecken.", "Skriv ett riktigt datum som inte är i framtiden.", "Länken måste börja med http:// eller https://.", "Du kan inte göra det här.", "Föräldern har barn. Flytta eller ta bort barnen först.", "Det måste finnas minst en huvudadministratör.", "Det går inte att logga in just nu." (settings missing).
- **Settings:** `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` (`.env.example`; a Vercel build stops without them, in `next.config.ts`), `BLOB_READ_WRITE_TOKEN` (Vercel Blob; its presence selects Blob), `PICTURES_DIR` (the picture folder when there is no token). `serverActions.bodySizeLimit` is 5 MB for the 4 MB picture.
- The flow is in [flow.mmd](flow.mmd).

## Decisions

- **The admin cookie carries the chosen parent, signed.** `<expiry>.<parent id, 0 = none>.<HMAC-SHA256 of "admin.<expiry>.<id>">`. The card asks for the choice to be kept in the cookie; signing the id means it can't be changed by hand. The rights are never in it: every request reads the parent, and `is_master_admin`, from the database (`currentAdmin`). Changing parent keeps the original expiry, so choosing again does not extend the 8 hours. It is a session cookie (no `Max-Age`) as the card says.
- **`/admin` itself passes the proxy without the admin cookie.** The card says `/admin` shows the sign-in, and the sign-in is a server action posted to the page, so the proxy can't tell it from another action. Everything below `/admin` needs the cookie in the proxy (a page is sent to `/admin`, anything else gets 401), and every action and page checks the cookie again in code; `lib/route-checks.test.ts` fails when an admin action lacks that check. The one listed exception is `adminLogin`.
- **The attempt limit is the one from TECH-005, shared with the site password.** The card was written before TECH-005 and says "5 wrong attempts, a sixth is refused, a column tells the two passwords apart". TECH-005 made it a block (the sixth wrong password blocks the address for 20 minutes; right passwords are not counted) shared by both sign-ins, which [Security](../../wiki/system/security.md) already describes for the admin. Using it keeps one rule and one table. The card's requirements as built say so.
- **Business rules in `lib/family.ts`, not in the actions.** Each function takes the actor (read from the database), checks the right, checks the input and writes, and returns an `Outcome`. That keeps the actions short and identical in shape, and the rules can be unit-tested against the test database. A kid that does not exist and a kid that is not yours give the same answer.
- **Deleting a kid deletes its lists explicitly,** in one transaction, as well as by `ON DELETE CASCADE`: on a local database file, a libSQL transaction does not keep `PRAGMA foreign_keys` from the first connection, so the cascade can't be trusted there. Turso enforces keys itself.
- **Forms keep what was typed after an error.** React 19 clears an uncontrolled form after an action, so the action returns the typed values (never a password or a file) and `Field` shows them (`key` makes the field rebuild with the new value).
- **A confirmation is a native `<dialog>`** opened with `showModal()`: it traps focus, closes with Esc and gives focus back for free. Its question names the item, list or kid as the card asks.
- **Pictures:** the kid row stores only a generated file name (`barn-<id>-<uuid>.<ext>`), never an address; `readPicture` and `removePicture` refuse any other name. The upload checks size and the first bytes on the server; the old file is removed after the new one is stored. `/bilder/<id>` sends `Cache-Control: private, no-cache` so a replaced picture shows at once. Blob is used when `BLOB_READ_WRITE_TOKEN` is set; the test server blanks it and uses its own folder.
- **Admin links inside the admin only,** and `noindex` twice (meta and header). There is no `robots.txt`.
- **Tests make their data straight in the test database** (`tests/family-db.ts`), not through the pages, so that every test starts from known data and the forms are tested where they are the point. It touches only `test.db`, which `scripts/test-server.mjs` rebuilds. The old template teardown (`tests/global-teardown.ts`) is removed: the admin tests run only locally, against a database thrown away each run.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Admin page](../../wiki/system/admin.md), [Security](../../wiki/system/security.md), [Site password](../../wiki/system/site-password.md), [Architecture](../../wiki/system/architecture.md), [Start page and menu](../../wiki/system/start-page.md), [Administrationssidan](../../wiki/manual/admin.md).

[Specifications](../index.md)
