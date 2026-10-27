---
type: Verification
title: "TECH-004 OKF documentation: verification"
description: How each requirement of OKF documentation was checked, the test suite before and after, and the requirements as built.
feature: TECH-004
---

# Verification of TECH-004

How each requirement was checked. Anything not checked is written as not checked.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-004-R1 | Manual: [Documentation structure](../../wiki/system/documentation.md) read; `README.md` links to it, and `PLAYBOOK.md`, `CLAUDE.md` and `README.md` point to it instead of repeating it. `npm run lint:docs` shows the page is reachable from `README.md` | local | Pass | 2026-10-27 |
| TECH-004-R2 | Unit tests `TECH-004-R2 …` in `scripts/lint-docs.test.ts` (missing `type`, bad `feature` and `type`, invalid YAML, quoted values, `index.md` frontmatter, `okf_version` and entries, `log.md` dates); `npm run lint:docs` on the real docs reports nothing | local, CI | Pass | 2026-10-27 |
| TECH-004-R3 | Unit tests `TECH-004-R3 …` (broken link, unreachable page, spec folder without a wiki link, folder links, links in code ignored); `npm run lint:docs` on the real docs reports nothing; `PLAYBOOK.md` read: only links | local, CI | Pass | 2026-10-27 |
| TECH-004-R4 | `npm run lint:docs` added to `.github/workflows/ci.yml` after `npm run lint`; locally a page without `type` made it print the problem and exit 1. `check` passed in CI on pull request #22 (the failing case is still not shown) | local, CI | Pass (failing case not shown) | 2026-10-27 |
| TECH-004-R5 | TECH-001 is Done on the board and its issue closed; `specs/features.md` lists it as Done; TECH-003's `verification.md` has "Requirements as built" | local, board | Pass | 2026-10-27 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `scripts/lint-docs.test.ts`, 14 tests on fixture folders | local, CI | Pass | 2026-10-27 |
| Browser tests | Not applicable: visitors see no change. `npm run test:local` still passes (3 tests) | local | Pass | 2026-10-27 |
| Smoke test | Not applicable: no page or flow changes | - | n/a | 2026-10-27 |
| Accessibility | Not applicable: visitors see no change | - | n/a | 2026-10-27 |
| Security | `/security-review` not needed: no sign-in, routes, queries or personal data; the script only reads local files | local | n/a | 2026-10-27 |
| Code review | [review.md](review.md) | local | Passed (run 2) | 2026-10-27 |

## Test suite

`npm run test:time` before and after the change (budgets and rules in [Testing](../../wiki/system/testing.md)).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 1 unit + 3 browser | 0.5 s | 0.3 s |
| After | 15 unit + 3 browser | 0.5 s (unit 0.0 s) | 0.3 s |

The lint check itself takes well under a second (budget in the card: 2 s).

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested or has a recorded manual check; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets, and the new tests follow the quality rules
- [x] Deployed, and the smoke tests pass against production (Live tests): Live tests succeeded on `main` after the merge
- [x] Accessibility: not applicable, visitors see no change
- [x] Requirements in the card match what was built, no open questions left; copied below as built; [solution.md](solution.md) describes how it was built
- [x] Manual, system docs and `wiki/log.md` updated (no manual page: no change for visitors)
- [x] No leftovers: `specs/overview.md` removed and nothing refers to it as a live file; the historical records of TECH-001 to TECH-003 are left as they were
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board (none)

## Requirements as built

Copied from the card when the feature is done, with their acceptance criteria, so the repo shows what was built even if the card changes later.

### TECH-004-R1 The convention is written down

`wiki/system/` shall have a page describing the OKF-based documentation structure: bundles, what a concept is, the frontmatter fields and `type` values, where each kind of thing lives, and how things link. `PLAYBOOK.md`, `CLAUDE.md` and `README.md` point to it instead of repeating it.

Acceptance criteria:

- **Given** the page, **when** an agent starts at `README.md`, **then** it reaches the page by following links.

### TECH-004-R2 Concepts conform to OKF

Every markdown file in `wiki/` and `specs/` except `index.md` and `log.md` shall have parseable frontmatter with a non-empty `type`, our recommended fields, and a real feature ID in `feature` (no `setup`). `index.md` shall have no frontmatter other than `okf_version` in a bundle root, and list its entries as `* [Title](url) - description`. `log.md` shall have a title and `## YYYY-MM-DD` headings, newest first.

Acceptance criteria:

- **Given** all those files, **when** `npm run lint:docs` runs, **then** it reports no missing or invalid fields and no structure errors.

### TECH-004-R3 Things are linked as a graph

Each spec folder and each wiki page about a feature or component shall link to the other side, every page shall be reachable from `README.md` by markdown links, and one subject shall live in one file (no content copied between files).

Acceptance criteria:

- **Given** the docs, **when** `npm run lint:docs` runs, **then** it reports no broken links, no page unreachable from `README.md`, and no `specs/` folder without a link from the wiki.
- **Given** `PLAYBOOK.md`, **then** it holds only links to the pages its content moved to.

### TECH-004-R4 The check runs automatically

`npm run lint:docs` shall run in the CI `check` job, and fail the build on any finding.

Acceptance criteria:

- **Given** a pull request with a page missing `type`, **when** CI runs, **then** `check` fails.

### TECH-004-R5 Leftovers fixed

TECH-001 shall be Done on the board and in `specs/overview.md`, and TECH-003's `verification.md` shall have "Requirements as built".

## Notes

- The card's scope listed the `type` value `Requirement set`; nothing uses it (the as-built requirements live in `verification.md`), so it was left out of the list and the card updated.
- `timestamp` was dropped from the frontmatter, as the card's open question allowed: OKF has no such field.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
