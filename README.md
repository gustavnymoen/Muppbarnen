# Muppbarnen

A simple app for a family to keep track of the kids' wish lists for birthdays and Christmas. Parents fill in the lists on an admin page; family and friends see them and claim presents so the same gift isn't bought twice. Built with specification-driven development as a hobby and learning project.

Live site: <https://muppbarnen.vercel.app>

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
| `npm run dev:https` | The same on `https://localhost:3000` (needs mkcert; [Testing on a phone](wiki/system/phone-testing.md)) |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint`, `npm run typecheck`, `npm run lint:docs` | Lint, type check, and the check of the documentation structure |
| `npm run test:unit` | Unit tests (Vitest) |
| `npm run test:local` | Browser tests against a local production build with its own database |
| `npm run test:smoke` | Read-only smoke tests (against the live site, or `BASE_URL`) |
| `npm run test:time` | Unit and browser tests with timings, for `verification.md` |
| `npm run db:backup`, `npm run db:reset` | Back up or rebuild the local database |

Never run `npm run build` while `npm run dev` is running in the same folder.

## Layout

| Path | What |
|---|---|
| `app/` | Pages and components (Next.js App Router); the look is in `DESIGN.md` and [Design system](wiki/system/design.md) |
| `lib/` | Server code, database access |
| `db/` | Schema, seed, migrations, test helper |
| `scripts/` | Database setup, test server, timing |
| `tests/` | Browser tests (Playwright) |
| `specs/` | The product, its terms, rules and feature list, and one folder per card with its solution, flow, verification and review ([index](specs/index.md)) |
| `wiki/` | `system/` (how it works, English) and `manual/` (how to use it, Swedish) ([index](wiki/index.md)) |
| `.github/` | Workflows, card template, Dependabot |
| `.claude/` | Reviewer agent and design skills |

## Conventions

How we work is in [CLAUDE.md](CLAUDE.md) and [Way of working](wiki/system/way-of-working.md) (the kit as a whole: [PLAYBOOK.md](PLAYBOOK.md)); the product and its rules in [specs/](specs/index.md); tests in [Testing](wiki/system/testing.md); how the documentation is organised in [Documentation structure](wiki/system/documentation.md). Specifications and system documentation are in English, the manual and everything visitors see in Swedish, and code comments in Swedish. The repository is public: no real personal data is committed.
