---
id: TECH-001
title: Project setup
---

# Verification of TECH-001

How each requirement was checked. Anything not checked is written as not checked.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-001-R1 | Test `TECH-001-R1 every response has the security headers` in `tests/TECH-001-project-setup.spec.ts`; `npm run build` without errors or warnings | local | Pass | 2026-10-26 |
| TECH-001-R2 | Manual: `npm install` run in the project (Chromium installed by the postinstall); `package.json` compared with the list in `PLAYBOOK.md`. Not checked in a fresh clone | local | Pass (fresh clone not checked) | 2026-10-26 |
| TECH-001-R3 | Test `TECH-001-R3 …` in `db/db-setup.test.ts` (the database has `schema_migrations`). Manual: `npm run build` created `muppbarnen.db` and `npm run db:backup` wrote a backup to `db/backups/`. The backup on `npm run dev` start was not run (it is the same script with the same flag) | local | Pass | 2026-10-26 |
| TECH-001-R4 | Test `TECH-001-R4 the start page has its heading, language and title, and no a11y violations` (axe included) and the smoke test `TECH-001-R4 @smoke …` | local | Pass | 2026-10-26 |
| TECH-001-R5 | `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:unit`, `npm run test:time` | local | Pass | 2026-10-26 |
| TECH-001-R6 | Manual: a script checked that no link in `CLAUDE.md`, `README.md`, `specs/overview.md` or the wiki points to a missing file; the frontmatter is on every wiki page | local | Pass | 2026-10-26 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `db/db-setup.test.ts` | local | Pass | 2026-10-26 |
| Browser tests | `tests/TECH-001-project-setup.spec.ts` | local | Pass | 2026-10-26 |
| Smoke test | `tests/smoke.spec.ts` run by `npm run test:local`. Not yet run against a deployed site (TECH-002) | local | Pass locally | 2026-10-26 |
| Accessibility | axe on the start page. The manual checklist is not done: the page is a placeholder heading (MUPP-002 replaces it) | local | Pass (axe only) | 2026-10-26 |
| Security | Not applicable: no sign-in, admin, API routes, server actions, queries or personal data. Headers tested (R1) | local | Pass | 2026-10-26 |
| Code review | [review.md](review.md): passed, no must-fix | local | Passed | 2026-10-26 |

## Test suite

`npm run test:time` before and after (budgets and rules in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 0 | 0 s | none |
| After | 1 unit, 3 browser | 0.0 s unit, 0.5 s browser | 0.3 s |

## Definition of Done

- [x] Tests: every check in the card's test plan is done (the smoke test only locally so far); every requirement is tested or has a recorded manual check; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets, and the new tests follow the quality rules in `wiki/system/testing.md`
- [ ] Deployed, and the smoke tests pass against production (Live tests): waits for TECH-002 and TECH-003
- [x] Accessibility: the start page passes `expectNoA11yViolations`; the manual checklist is not applicable to a placeholder heading
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers: the generated sample page, icons and fonts were not used; the unused `connection` import and the price rule were removed
- [x] Clean code: `npm run lint`, `npm run typecheck` and `npm run build` pass without errors or warnings
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way: none

## Requirements as built

Copied from the card (#7).

### TECH-001-R1 Next.js project

The project is a Next.js 16 app (App Router, TypeScript, React 19, Tailwind CSS 4) with `cacheComponents` on, keeping the kit's files; `next.config.ts`, `eslint.config.mjs` and `.gitignore` are the kit's, merged with what `create-next-app` makes. Given the project, when `npm run build` runs, then it builds without errors or warnings. Given any page, when it is loaded, then the response has the security headers in `next.config.ts`.

### TECH-001-R2 Scripts and dependencies

`package.json` has the scripts and dependencies listed in `PLAYBOOK.md` ("package.json"), and requires Node.js 24. Given a fresh clone, when `npm install` runs, then the packages and Playwright's Chromium are installed.

### TECH-001-R3 Local database

`npm run dev` creates the local database `~/Ai Projekt/muppbarnen-data/muppbarnen.db` from `db/schema.sql`, `db/seed.sql` and `db/migrations/` when it is missing, and makes a backup in `db/backups/` when it exists. Given no local database, when `npm run dev` starts, then the database exists with the table `schema_migrations`. Given a local database, when `npm run dev` starts, then a new backup is in `db/backups/`.

### TECH-001-R4 Placeholder start page

The start page shows the heading "Muppbarnen", with the page language Swedish and the title "Muppbarnen", and meets WCAG 2.2 AA. Given the site, when a visitor opens `/`, then they see the heading "Muppbarnen", and axe finds no violations.

### TECH-001-R5 Checks pass

`npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run build` and `npm run test:local` pass, and `npm run test:time` prints the suite's numbers.

### TECH-001-R6 Documentation

The project has `README.md`, `specs/overview.md`, `wiki/index.md`, `wiki/system/index.md`, `wiki/manual/index.md`, `wiki/system/architecture.md` and `wiki/log.md`, each wiki page with the frontmatter in `PLAYBOOK.md`, and no link in `CLAUDE.md`, `README.md` or the wiki pointing to a missing file.

## Notes

- Playwright's image in the workflows is v1.64.1, the same as the installed `@playwright/test`.
- npm warns that `unrs-resolver` has an install script that is not approved (`allowScripts`). It is a dependency of the lint setup; lint passes without it, so it was left unapproved.
