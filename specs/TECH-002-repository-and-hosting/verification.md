---
id: TECH-002
title: Repository and hosting
---

# Verification of TECH-002

How each requirement was checked. Create this file when work starts and fill it in before the feature is done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-002-R1 | Manual: history searched with `git log --all --name-only --format= | sort -u | grep -Ei '(^|/)\.env|^pictures/|\.db$|\.pem$|\.key$'` (only `.env.example`) and `git grep -InE '(tcp|tursoa|vercel_blob_rw|ghp_|github_pat_|eyJhbGciOi)[A-Za-z0-9_.-]{12,}' $(git rev-list --all)` (nothing); `git ls-remote origin main` equals the TECH-001 commit `de5125f` | local | Pass | 2026-10-26 |
| TECH-002-R2 | Manual: `https://muppbarnen.vercel.app` answers 200; production build green after Framework Preset was set to Next.js. `deployment_status` events turned on by the user in Settings → Git (not independently inspected; proven by the first pull request in TECH-003) | live | Pass (`deployment_status` reported) | 2026-10-26 |
| TECH-002-R3 | Manual: `gh secret list` shows `VERCEL_AUTOMATION_BYPASS_SECRET`; the Vercel side was created by the user (value never recorded) | live | Pass | 2026-10-26 |
| TECH-002-R4 | Manual: the URL is in `playwright.config.ts` and `wiki/system/pipeline.md`; `live-tests.yml` uses the default from `playwright.config.ts`, so it needs no copy | local | Pass | 2026-10-26 |
| TECH-002-R5 | Manual: variables set by the user for Production only; `prebuild` runs `scripts/db-setup.mjs`, so the green production build applied the migrations (build log not read by Claude) | live | Pass (reported) | 2026-10-26 |
| TECH-002-R6 | Manual: the user confirmed the Preview variables come from the Storage integration, connected to Preview only, and differ from Production's. That a preview really uses its database is shown by the first pull request in TECH-003 | live | Pass (variables); preview use not checked | 2026-10-26 |
| TECH-002-R7 | Manual: the Blob store was created by the user and connected to Production and Preview; `BLOB_READ_WRITE_TOKEN` not inspected by Claude | live | Pass (reported by the user) | 2026-10-26 |

## The test plan

How each kind of check in the card's test plan was done (see `wiki/system/testing.md`). Write "not applicable" with the reason where the plan says none.

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: no behaviour changes. `npm run test:unit` still passes (1 test) | local | Pass | 2026-10-26 |
| Browser tests | Not applicable: no behaviour changes. `npm run test:local` still passes (3 tests) | local | Pass | 2026-10-26 |
| Smoke test | `npm run test:smoke` against https://muppbarnen.vercel.app (1 test). Live tests as a workflow and Preview tests run first with the pull request in TECH-003 | live | Pass | 2026-10-26 |
| Accessibility | Not applicable: visitors see the same start page as in TECH-001 | live | n/a | 2026-10-26 |
| Security | Not applicable for `/security-review`: no sign-in, API, query or personal-data code changed; the history was searched for secrets and personal data (R1); secrets only entered in Vercel/GitHub, never in chat or Git | local | Pass | 2026-10-26 |
| Code review | [review.md](review.md) | local | Passed | 2026-10-26 |

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 1 unit + 3 browser | 0.5 s | 0.3 s |
| After | 1 unit + 3 browser | 0.5 s | 0.3 s |

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested or has a recorded manual check; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets, total time grown by at most 25 % (or the cause handled), and the new tests follow the quality rules in `wiki/system/testing.md`
- [x] Deployed, and the smoke tests pass against production (run by hand with `npm run test:smoke`; the Live tests workflow first runs with TECH-003's pull request)
- [x] Accessibility: changed pages and states pass `expectNoA11yViolations`, and the relevant items of `wiki/system/accessibility.md` are checked on the live site (not applicable if visitors see no change)
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers: everything the change made unused is deleted, no commented-out code or debug output
- [x] Clean code: reuses existing components and helpers; `npm run lint`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board (none)

## Requirements as built

Copied from the card when the feature is done, with their acceptance criteria, so the repo shows what was built even if the card changes later.

### TECH-002-R1 Code on GitHub

`main` on GitHub holds the project as of TECH-001 (pushed from branch `TECH-001-project-setup`). Nothing with real personal data or secrets is in the history.

Acceptance criteria:

- **Given** the history, **when** it is searched for `.env*` files, `pictures/` and token patterns, **then** nothing is found.
- **Given** the push, **when** `main` is compared with the TECH-001 commit, **then** they are the same commit.

### TECH-002-R2 Site published from main

Vercel publishes `main` to https://muppbarnen.vercel.app, and builds a preview for every pull request.

Acceptance criteria:

- **Given** a successful production build, **when** the URL is opened, **then** the start page answers with status 200.
- **Given** Settings → Git, **then** `deployment_status` events are on.

### TECH-002-R3 Automation bypass

The Protection Bypass for Automation secret exists and is stored as the repository secret `VERCEL_AUTOMATION_BYPASS_SECRET`, so Preview tests can reach previews (used from TECH-003).

### TECH-002-R4 Production URL in the repo

The production URL is set in `playwright.config.ts` (the default for the smoke tests, which `.github/workflows/live-tests.yml` uses) and in `wiki/system/pipeline.md`.

### TECH-002-R5 Production database

A Turso database `muppbarnen-production` exists; `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set by hand in Vercel for Production only. The build runs the migrations on it.

Acceptance criteria:

- **Given** the production build, **then** the migrations are applied to `muppbarnen-production`.

### TECH-002-R6 Preview database

A Turso database `muppbarnen-preview` exists, connected through Vercel → Storage to Preview only, never to Production.

Acceptance criteria:

- **Given** the Vercel variables, **then** Production's and Preview's `TURSO_DATABASE_URL` point to different databases.

### TECH-002-R7 Picture storage

A Vercel Blob store exists for the kids' pictures; its token is a variable in Vercel (Production and Preview).

## Notes

R4 as built: `live-tests.yml` needs no copy of the URL; it uses the default in `playwright.config.ts`. The first build failed with `STATIC_BUILD_NO_OUT_DIR` because the Vercel project had Framework Preset "Other"; setting it to Next.js fixed it (noted in `wiki/system/architecture.md`). Whether a preview uses the preview database is shown by the first pull request in TECH-003.
