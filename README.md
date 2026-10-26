# Muppbarnen

A simple app for a family to keep track of the kids' wish lists for birthdays and Christmas. Parents fill in the lists on an admin page; family and friends see them and claim presents so the same gift isn't bought twice. Built with specification-driven development as a hobby and learning project.

Live site (from TECH-002): <https://muppbarnen.vercel.app>

## Getting started

Needs Node.js 24.

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev                  # creates the local database on first start
```

## Commands

| Command | What |
|---|---|
| `npm run dev` | Development server; backs up and migrates the local database first |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint`, `npm run typecheck` | Lint and type check |
| `npm run test:unit` | Unit tests (Vitest) |
| `npm run test:local` | Browser tests against a local production build with its own database |
| `npm run test:smoke` | Read-only smoke tests (against the live site, or `BASE_URL`) |
| `npm run test:time` | Unit and browser tests with timings, for `verification.md` |
| `npm run db:backup`, `npm run db:reset` | Back up or rebuild the local database |

Never run `npm run build` while `npm run dev` is running in the same folder.

## Layout

| Path | What |
|---|---|
| `app/` | Pages and components (Next.js App Router) |
| `lib/` | Server code, database access |
| `db/` | Schema, seed, migrations, test helper |
| `scripts/` | Database setup, test server, timing |
| `tests/` | Browser tests (Playwright) |
| `specs/` | `overview.md`, and one folder per card with its solution, flow, verification and review |
| `wiki/` | `system/` (how it works, English) and `manual/` (how to use it, Swedish) |
| `.github/` | Workflows, card template, Dependabot |
| `.claude/` | Reviewer agent and design skills |

## Conventions

How we work is in `CLAUDE.md` and `PLAYBOOK.md`; the product and its rules in `specs/overview.md`; tests in `wiki/system/testing.md`. Specifications and system documentation are in English, the manual and everything visitors see in Swedish, and code comments in Swedish. The repository is public: no real personal data is committed.
