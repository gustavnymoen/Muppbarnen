---
type: Guide
title: Architecture
description: The parts of Muppbarnen and how they fit: framework, data, hosting and the databases per environment.
resource: app/, lib/, db/
feature: TECH-001
tags: [architecture, database, hosting]
timestamp: 2026-10-26
---

# Architecture

| Part | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript, React 19), with `cacheComponents` on. Read `node_modules/next/dist/docs/` before writing code (`AGENTS.md`). |
| Styling | Tailwind CSS 4; the design tokens come with MUPP-001. |
| Server code | `lib/`, with `import "server-only"` in files that touch the database or secrets. |
| Database | SQLite through `@libsql/client`: the same SQL locally and in production. `lib/db.ts` has `all`, `get`, `run`, `withTransaction`, `constraintKind` and `escapeLike`; every value is a parameter (`?`). |
| Hosting | Vercel (production from `main`, a preview per pull request); not set up until TECH-002. |
| Pictures | Vercel Blob, from TECH-002; uploaded on the admin page. |

## Databases

| Environment | Database |
|---|---|
| Local | `~/Ai Projekt/muppbarnen-data/muppbarnen.db`, outside the project; backups in `db/backups/` (not in Git, 20 newest kept, one on every `npm run dev`) |
| Unit tests | `unit-test.db` in the same folder, rebuilt before every run |
| Local browser tests | `test.db`, rebuilt every `npm run test:local` |
| Production, preview | Turso, from TECH-002 |

A new database is built from `db/schema.sql` and `db/seed.sql`; every later change is a numbered migration in `db/migrations/`, run once per database by `scripts/db-setup.mjs` before `npm run dev` and `npm run build`. Never edit an applied migration.

## Security headers

`next.config.ts` sends `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` on every response.

[System documentation](index.md)
