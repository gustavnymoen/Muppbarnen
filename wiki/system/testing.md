---
type: Guide
title: Testing
description: How Muppbarnen is tested: which kind of check verifies what, when it is written, where it runs, and the rules and time budgets for the tests.
feature: setup
tags: [workflow, testing, quality, sdd]
timestamp: 2026-10-24
---

# Testing

The project follows specification-driven development (see "How we work" in `specs/overview.md`): every requirement in a card is checked, and the check is named after the requirement. This page is the one place that says how. Each card's **test plan** says which of the checks below its requirements get, and the feature's `verification.md` records how each was done.

## The kinds of checks

| Check | What it checks | Written | Runs | Passes when | Status |
|---|---|---|---|---|---|
| [Unit tests](#unit-tests) | Logic, calculations, rules and data | With the code, while building | On save (watch mode), in CI before the build | Every unit test passes | In use |
| [Browser tests](#browser-tests) | What a visitor or the administrator sees and does, the keyboard, and look | In the Test step | Locally and in CI | Every browser test passes, none retried | In use |
| [Smoke tests](#smoke-tests) | That a deployed site works: the main pages and flows answer | When a feature adds or changes a main page or flow | Against the preview and production after each deploy | Every smoke test passes against the deployed site | In use |
| [Accessibility](#accessibility) | WCAG 2.2 AA | axe in the browser tests; the checklist after deploy | In the browser tests; by hand on the live site | axe finds no violations, and every relevant checklist item passes | In use |
| [Security](#security) | Security mistakes in our code, leaked secrets, vulnerable packages | In the review step; scans in the pipeline | Review; CI (the job `security`); Dependabot | No security finding left that must be fixed, and the scans pass | In use |
| [Code review](#code-review) | What the tools can't: design, duplication, requirements and tests | In the review step | Before the feature is done | No must-fix finding left | In use |

**Which kind to choose:** test a rule or calculation in a unit test, with as many cases as it needs, and show in one or two browser tests that the page uses it. Test in the browser what only a browser can show: a flow, the keyboard, focus, what a screen reader is told, the look. Every requirement has at least one test named after it, of either kind, or a recorded manual check or code review in `verification.md` with the reason it can't be automated.

## Unit tests

- **Tool:** Vitest. `npm run test:unit` runs all unit tests once; `npm run test:unit -- --watch` reruns the affected ones on every save.
- **Place and name:** next to the code they test, as `<file>.test.ts` (for example `lib/dates.test.ts`); data checks next to the data or migrations they check. Each test is named after its requirement, as the browser tests are.
- **Data:** tests that read the database use their own test database, `~/Ai Projekt/muppbarnen-data/unit-test.db`, which `vitest.global-setup.mjs` deletes and builds again from the schema, seed and migrations (with `scripts/db-setup.mjs`) before every run, so it is never the user's own. Read it with `queryUnitDb` or `openUnitDb` from `db/test-db.ts`.
- **Every test that needs no browser is a unit test.** `tests/` holds only browser tests (and the smoke tests); Vitest runs only `*.test.ts` outside `tests/`, Playwright only `tests/*.spec.ts`.
- **Written** together with the code, while building. A feature with logic (dates, rules, generated data) gets its unit tests in the same change.

## Browser tests

- **Tool:** Playwright, one file per feature: `tests/<ID>-<name>.spec.ts` (the one exception is the look, below), each test named after its requirement, for example `test("MUPP-007-R2 shows only the chosen date", …)`.
- **Helpers:** `tests/helpers.ts` (unique names, sign-in, colours, contrast, axe, and the helpers the features add). Use them instead of copying. Tests of a page that several features change share its helpers and fixtures in a file of their own, for example `tests/<page>.ts` with a worker fixture that creates the test data once.
- **The look** is checked in one file, `tests/design.spec.ts`: one test per page and state, each named after every requirement it checks, so the page is loaded once for many checks. A new design check goes into the test for its page and state (a new page or state gets a new test there), not into a new file or a test of its own per CSS value. A design check stays a browser test, since it reads what the browser draws (computed colours, sizes, contrast, focus rings); a rule that needs no browser, such as a calculation or a token value read from a file, is a unit test.
- **Data:** data a test creates is named with `uniqueName()` ("E2E …") and deleted by the test itself. Tests that would change shared data irreversibly, or read the database directly, are skipped unless `runsLocally`.
- **Runs:** `npm run test:local` against a local production build with its own test database, also in CI, where the whole suite runs once per pull request. `npm test` runs them against a deployed site (the live site, or `BASE_URL`) by hand, for example to check something on the live site; the pipeline only runs the smoke tests there.
- **Combine by journey.** Tests that reach the same page or state are one test that goes on from where the last check left it, named after every requirement it checks (`MUPP-004-R1 R2 R7 …`), with a comment per requirement. A test of its own is for a page, viewport at load time or data the others must not see. A 320 px check resizes the window in the middle of a test (`page.setViewportSize`).
- **One run at a time per computer.** Every checkout shares `~/Ai Projekt/muppbarnen-data/test.db`, which each `npm run test:local` deletes and builds again, so two runs at once break each other. A second run uses another `HOME` (`HOME=<empty folder> PLAYWRIGHT_BROWSERS_PATH=~/Library/Caches/ms-playwright npm run test:time`), which gives it a database of its own.
- **A failing test** is either a bug in the site (report it to the user) or a wrong test (fix the test and, if needed, the requirement). Never weaken a test to make it pass.

## Smoke tests

- **What:** a few fast checks that a deployed site works: each main page loads and each main flow answers, for example the start page, a child's wishlist, sign-in being required for what needs it.
- **Rules:** read-only: no sign-in, no secrets, no data written, so they can run against production. Marked `@smoke` in their names, for example `MUPP-001-R2 @smoke the start page loads with its heading`, and run with `npm run test:smoke` (against the live site, or `BASE_URL`). They live with the feature that needs them.
- **Overlap:** a smoke test may check something a browser test also checks, since it runs against a different place (the deployed site). It is the one exception to the rule "No duplicates"; keep smoke tests few and fast (all of them under a minute).
- **Written** when a feature adds or changes a main page or flow, as its test plan says.
- **Runs** against the preview of every pull request and against production after every deploy.

## Accessibility

The site meets WCAG 2.2 AA. How it is checked is in [Accessibility](accessibility.md):

- **axe:** every page or state a feature adds or changes is checked with `expectNoA11yViolations` in its browser tests.
- **The manual checklist:** a feature that changes what visitors or the administrator see goes through the relevant items on the live site after the deploy, and records them in its `verification.md`.

## Security

Security is checked in three places, each for what it is good at:

- **In the code review,** for what only a reader sees: the security points in [Code review](code-review.md) (sign-in checked on the server, input validated on the server, parameterised queries, secrets kept out of the code, the browser, logs and error messages, secure cookies, no internals in error messages, personal data shown only to the right person). Breaking one is a must-fix finding.
- **With `/security-review`,** Claude Code's security review, for a change that touches sign-in, admin, API routes, server actions, database queries or personal data. It is run in the review step; its high-severity findings are must-fix, and its result goes into `review.md`. When it is needed is decided by what the change touches, as above; the card's test plan only records it.
- **In the pipeline,** for known problems, by the CI job `security` on every pull request:
  - `npm audit --omit=dev --audit-level=high` fails on a known high or critical vulnerability in a package the site uses in production.
  - **Semgrep** (the free community rules for JavaScript, TypeScript, React, Next.js and SQL injection) fails on an insecure pattern in our code. Our own rule in `.semgrep/sql.yml` (`sql-built-from-text`) catches SQL joined from text inside a call to `all`, `get`, `run` or `execute`, which the community rules don't know; it doesn't see SQL built in a variable first, so the review's point on parameters still matters. A finding that is wrong is marked on its line with `// nosemgrep: <rule id>` and a comment that says why, never by turning a rule off for the whole project.
  - **Gitleaks** scans the whole Git history and fails on anything that looks like a password, token or key; values are never printed. A real secret found is rotated (changed where it is used) before anything else, since removing it from Git doesn't make it secret again.
  - **Dependabot** watches the npm packages and the GitHub Actions and opens a pull request with the fix when one has a known vulnerability. For npm it proposes security updates only; the GitHub Actions, which are pinned to commits, also get one grouped pull request a month with new versions. Such a pull request goes through CI and Preview tests like any other.

## Code review

Every feature and technical task is reviewed by the reviewer agent before it is done; the rules and levels are in [Code review](code-review.md), and the report is saved as `review.md` and posted on the pull request.

## Where each check runs

| | Locally | CI (pull request) | Preview tests | Live tests (after deploy) |
|---|---|---|---|---|
| Lint, type check, build | ✓ | ✓ | | |
| Browser tests | `npm run test:local` | ✓ (all) | | |
| Unit tests | `npm run test:unit` | ✓ (before the build) | | |
| Smoke tests | `npm run test:smoke` | ✓ (part of all) | ✓ | ✓ |
| axe | in the browser tests | ✓ | | |
| Security scans | | ✓ (job `security`) | | |
| Code review | ✓ | | | |

The pipeline itself (workflows, events, secrets and the branch protection) is described in [Pipeline](pipeline.md).

## Quality rules

The test suite is checked with every change, so that it doesn't grow slower and weaker as the site grows.

- **No flaky tests.** Tests are not retried. A test that sometimes fails is fixed (or the bug in the site is), never retried or skipped.
- **No fixed waits.** Tests wait for what the user sees (`expect`, `toBeVisible`), never for a time (`waitForTimeout`).
- **Each test checks behaviour** named in its requirement, not only CSS or markup, unless the requirement is about the look.
- **No duplicates.** A behaviour already checked by another feature's test is not tested again; a test that a later change made redundant is removed.
- **Shared helpers** in `tests/helpers.ts` instead of copies.
- **Cheap where it can be:** checks that don't need a browser or a new page load are combined or done without one.

## Time budgets


| What | Budget |
|---|---|
| One test, locally | at most 5 s |
| All unit tests (`npm run test:unit`) | at most 30 s |
| All tests in `npm run test:local` (without the build) | at most 3 min |
| The smoke tests against a preview or the live site | at most 1 min |
| A whole job on GitHub | CI at most 8 min, of which at most 2 min preparation; Preview tests and Live tests at most 2 min |

`npm run test:time` runs the unit tests and `npm run test:local`, and prints the number of each, their total time and the five slowest browser tests, marking anything over budget. Every feature records the numbers before and after in `verification.md`. When a budget is exceeded, or the total time grows by more than 25 % in one change, find the cause: fix the change if it caused it, otherwise put a technical task at the top of the backlog.

[System documentation](index.md)
