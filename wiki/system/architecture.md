---
type: Guide
title: Architecture
description: "The parts of Muppbarnen and how they fit: framework, data, hosting and the databases per environment."
resource: app/, lib/, db/
feature: TECH-001
tags: [architecture, database, hosting]
---

# Architecture

| Part | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript, React 19), with `cacheComponents` on. Read `node_modules/next/dist/docs/` before writing code (`AGENTS.md`). |
| Styling | Tailwind CSS 4 with the design's tokens in `app/globals.css` and shared components in `app/components/` ([Design system](design.md)). |
| Data in pages | Server components read data. With `cacheComponents` on, data that depends on the request (database, clock, cookies) is read after `await connection()` or inside `<Suspense>`. |
| Changes | Server actions, which check sign-in and input on the server ([Security](security.md)), call `lib/`, and refresh the page. Errors meant for the user are thrown as their own error class and shown as messages. |
| Server code | `lib/`, with `import "server-only"` in files that touch the database or secrets. Pure rules (dates, validation) live in files without it, so the browser and the server share them and unit tests can import them. |
| Database | SQLite through `@libsql/client`: the same SQL locally and in production. On Vercel the build uses the web client (`lib/libsql-web.ts`, alias in `next.config.ts`, only when `VERCEL` is set) so the native engine is not stored with every function ([TECH-016](../../specs/TECH-016-smaller-functions/solution.md)). `lib/db.ts` has `all`, `get`, `run` and `withTransaction`; every value is a parameter (`?`). |
| Hosting | Vercel (production from `main` at <https://muppbarnen.vercel.app>, a preview per pull request). The project's Framework Preset must be Next.js with no overridden build or output settings; with "Other" the build fails with `STATIC_BUILD_NO_OUT_DIR`. |
| Access | The whole site is behind one shared password: `proxy.ts` refuses everything without a signed cookie, and pages and routes check it again ([Site password](site-password.md)). The admin pages need a second password on top ([Admin page](admin.md)). |
| Pictures | A **private** Vercel Blob store (token `BLOB_READ_WRITE_TOKEN` for Production and Preview), served by the site at `/bilder/<child id>` after the cookie check, never through a public address; uploaded on the admin page ([Admin page](admin.md)). Locally and in the tests a folder is used instead (`lib/pictures.ts`). Only `lib/picture-upload.ts` (shrinking, with `sharp`) and the action in `app/admin/picture-actions.ts` that uses it are left out of every function except `/admin/hantera`. |

## Databases

| Environment | Database |
|---|---|
| Local | `~/Ai Projekt/muppbarnen-data/muppbarnen.db`, outside the project; backups in `db/backups/` (not in Git, 20 newest kept, one on every `npm run dev`) |
| Unit tests | `unit-test.db` in the same folder, rebuilt before every run |
| Local browser tests | `test.db`, rebuilt every `npm run test:local` |
| Production | Turso `muppbarnen-production`; `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` added by hand in Vercel for Production only |
| Preview | Turso `muppbarnen-preview`, connected through Vercel → Storage to Preview only (never to Production) |

A new database is built from `db/schema.sql` and `db/seed.sql`; every later change is a numbered migration in `db/migrations/`, run once per database by `scripts/db-setup.mjs` before `npm run dev` and `npm run build`. Never edit an applied migration; a migration that is not yet merged (has run nowhere but test databases) may still be changed. Large generated data comes from a script with a fixed seed, with a unit test that regenerates it and compares. On Vercel the build stops if `TURSO_DATABASE_URL` is missing, so the site can't silently run against a temporary file. `npm run db:reset` refuses to run against Turso.

## Environment variables

`SITE_PASSWORD` and `SITE_SESSION_SECRET` (the site password and the key that signs its cookie) and `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` (the same for the admin) must be set for Production and Preview, or the build stops. `.env.local` locally (never committed or printed), Vercel's environment variables for Preview and Production, `.env.turso` only for running migrations against Turso by hand (`npm run db:turso`). `.env.example` lists them.

## Security headers

`next.config.ts` sends `X-Frame-Options: DENY`, a `Content-Security-Policy` that limits scripts, styles, images, fonts and connections to the site itself ([Security](security.md)), `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` on every response.

Built by [MUPP-003](../../specs/MUPP-003-admin-page/solution.md) (the tables and the admin), [MUPP-038](../../specs/MUPP-038-secret-santa-families/solution.md) (the Secret Santa tables), [MUPP-039](../../specs/MUPP-039-secret-santa-entrance/solution.md) (the Secret Santa entrance), [MUPP-040](../../specs/MUPP-040-secret-santa-wish-list/solution.md) (the Secret Santa wish lists), [MUPP-048](../../specs/MUPP-048-santa-events/solution.md) (events created by any parent), [MUPP-051](../../specs/MUPP-051-santa-status/solution.md) (the event status), [MUPP-041](../../specs/MUPP-041-secret-santa-draw/solution.md) (the draw), [TECH-017](../../specs/TECH-017-sending-email/solution.md) (mail, see [Mail](mail.md)), [TECH-001](../../specs/TECH-001-project-setup/solution.md) and [TECH-002](../../specs/TECH-002-repository-and-hosting/solution.md).

[System documentation](index.md)
