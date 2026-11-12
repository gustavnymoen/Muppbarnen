---
type: Guide
title: Testing
description: "How Muppbarnen is tested: which kind of check verifies what, when it is written, where it runs, and the rules and time budgets for the tests."
resource: tests/
feature: TECH-001
tags: [workflow, testing, quality, sdd]
---

# Testing

The project follows specification-driven development (see [Way of working](way-of-working.md)): every requirement in a card is checked, and the check is named after the requirement. This page is the one place that says how. Each card's **test plan** says which of the checks below its requirements get, and the feature's `verification.md` records how each was done.

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

- **Tool:** Vitest. `npm run test:unit` runs all unit tests once (never the ones in `.claude/`, where other checkouts of the project may live); `npm run test:unit -- --watch` reruns the affected ones on every save.
- **Place and name:** next to the code they test, as `<file>.test.ts` (for example `lib/dates.test.ts`); data checks next to the data or migrations they check. Each test is named after its requirement, as the browser tests are.
- **Data:** tests that read the database use their own test database, `~/Ai Projekt/muppbarnen-data/unit-test.db`, which `vitest.global-setup.mjs` deletes and builds again from the schema, seed and migrations (with `scripts/db-setup.mjs`) before every run, so it is never the user's own. Read it with `queryUnitDb` or `openUnitDb` from `db/test-db.ts`.
- **The check test** `lib/route-checks.test.ts` reads the code as text and fails when a route handler or server action lacks the sign-in check or `guardWrite()` ([Security](security.md)); it needs no change when a route is added, only when an exception is.
- **Every test that needs no browser is a unit test.** `tests/` holds only browser tests (and the smoke tests); Vitest runs only `*.test.ts` outside `tests/`, Playwright only `tests/*.spec.ts`.
- **Written** together with the code, while building. A feature with logic (dates, rules, generated data) gets its unit tests in the same change.

## Browser tests

- **Tool:** Playwright, one file per feature: `tests/<ID>-<name>.spec.ts` (the one exception is the look, below), each test named after its requirement, for example `test("MUPP-007-R2 shows only the chosen date", …)`.
- **The site password:** `tests/global-setup.ts` signs in once and every test reuses the cookie; against a deployed site set `SITE_PASSWORD` by hand ([Site password](site-password.md)). Tests of the password page itself and the smoke tests start without it (`test.use({ storageState: … })`), and a test that tries wrong passwords uses its own `x-real-ip` (`newVisitor()` in `tests/site-session.ts`) so the attempt limit isn't shared.
- **The admin password:** against the local test server `tests/global-setup.ts` also signs in on `/admin` through the form once, without choosing a parent, and saves the cookie in `playwright/.auth/admin.json`. `adminSignIn(page, parent?)` adds that cookie and chooses the parent on the page, so a test doesn't fill in the password ([TECH-014](../../specs/TECH-014-test-time/solution.md)). Tests of the sign-in itself (wrong password, refused cookies, the blocked address, the keyboard) don't call it and start without the cookie.
- **Helpers:** `tests/helpers.ts` (unique names, sign-in, colours, contrast, axe, and the helpers the features add). Use them instead of copying. A form card ([Form cards](form-cards.md)) is an open `<dialog>` that stays in the page next to its button, so a test finds its fields with `page.locator("dialog[open]")` or inside the scope of its row, opens it with `openCard(scope, name)`, closes it with Esc or "Stäng", and finds what a screen reader hears after a save in `[aria-live=polite]`; the page behind an open card is inert, so check the list after the card is closed. Tests of a page that several features change share its helpers and fixtures in a file of their own, for example `tests/<page>.ts` with a worker fixture that creates the test data once.
- **The look** is checked in one file, `tests/design.spec.ts`: one test per page and state, each named after every requirement it checks, so the page is loaded once for many checks. A new design check goes into the test for its page and state (a new page or state gets a new test there), not into a new file or a test of its own per CSS value. A design check stays a browser test, since it reads what the browser draws (computed colours, sizes, contrast, focus rings); a rule that needs no browser, such as a calculation or a token value read from a file, is a unit test.
- **Waiting without the backoff:** an `expect` that isn't true at once is checked again after 20, 50, 100, 100 and then 500 ms, that is at 0, 20, 70, 170, 270 and 770 ms, so something that takes 300 ms is seen at 770 ms. Two waits avoid that ([TECH-014](../../specs/TECH-014-test-time/solution.md)): open pages with `goto(page, path)` from `tests/helpers.ts`, not `page.goto`, since every page streams its content and React shows it about 300 ms after the load (`goto` waits on every frame until it is shown, also on the password page), and before an `expect` that waits for an animation to end, call `animationsDone(locator)` or, for something removed when it ends (the copy that moves when a view closes), `pageAnimationsDone(page)`.
- **Measuring boxes:** read a size or position with `settledBox(locator)` from `tests/helpers.ts` (all of the tests do, [TECH-008](../../specs/TECH-008-flaky-box-measurements/solution.md), [TECH-009](../../specs/TECH-009-settled-boxes-in-feature-tests/solution.md)), not with a bare `boundingBox()!`. It waits until the element is visible and two reads in a row agree, so a box read during an animation (a height of 43.99 instead of 44), a re-render (`null` for a detached element) or a layout that is still moving is read again. Read the boxes you compare in one go, and leave a comment where a read needs no wait.
- **Data:** data a test creates is named with `uniqueName()` ("E2E …") and deleted by the test itself. Tests that would change shared data irreversibly, or read the database directly, are skipped unless `runsLocally`.
- **Runs:** `npm run test:local` against a local production build with its own test database, also in CI, where the whole suite runs once per pull request. `npm test` runs them against a deployed site (the live site, or `BASE_URL`) by hand, for example to check something on the live site; the pipeline only runs the smoke tests there.
- **Combine by journey.** Tests that reach the same page or state are one test that goes on from where the last check left it, named after every requirement it checks (`MUPP-004-R1 R2 R7 …`), with a comment per requirement. A test of its own is for a page, viewport at load time or data the others must not see. A 320 px check resizes the window in the middle of a test (`page.setViewportSize`). A check of the same page at several widths opens the page once and resizes between the widths instead of loading it again ([TECH-015](../../specs/TECH-015-test-suite-room/solution.md)): every page load costs 0.2–0.8 s, since React shows the streamed page about 300 ms after it has loaded. A merged test stays under the 8 s budget for one test; two tests whose merge would go over it, or need the view closed again before the next step, stay apart.
- **Fast set-up and reads** ([TECH-018](../../specs/TECH-018-test-suite-room-again/solution.md)):
  - **No wait after a wrong password on the test server.** A wrong site, admin or Secret Santa password costs a second on the real site (`wrongWait` in `lib/login-block.ts`). `scripts/test-server.mjs` sets `SKIP_LOGIN_WAIT=1`, which `wrongWait` honours only when the database is a local file, so a deployed site always waits. That the wait exists is checked by unit tests with fake timers (`lib/login-block.test.ts`, `lib/santa-auth.test.ts`), not by timing a browser test. Six wrong tries in a row run on one page, waiting for each answer.
  - **Sign in by cookie when signing in is not the test.** `santaSignIn(page, personId)` in `tests/santa.ts` sets the signed Secret Santa cookie (made with the test server's made-up key) instead of going through the form, as `adminSignIn` does for the admin pages; the sign-in test itself (MUPP-039) uses the form (`openSignInForm`, `sendPhone`).
  - **`settledBox` reads in the page**, both reads in one round trip, 50 ms apart. A version that compared two frames was faster but failed once, so the 50 ms stays. Read several boxes with `Promise.all`, so the 50 ms is paid once.
  - **Traces are opt-in:** recording a trace on every test cost about 4 s, so a local run records none unless `TRACE=1` is set (CI sets it, and keeps the traces of failed tests in the report).
  - **Measured** (the step profile is in the [TECH-018 verification](../../specs/TECH-018-test-suite-room-again/verification.md)): 203.0 s before, about 178 s after (111 browser tests instead of 121). What is left is mostly what the site does: the 300 ms reveal after every page load (about 33 s over 180 loads), and animations (about 37 s).
- **One run at a time per computer.** Every checkout shares `~/Ai Projekt/muppbarnen-data/test.db`, which each `npm run test:local` deletes and builds again, so two runs at once break each other. A second run uses another `HOME` (`HOME=<empty folder> PLAYWRIGHT_BROWSERS_PATH=~/Library/Caches/ms-playwright npm run test:time`), which gives it a database of its own.
- **WebKit (Safari on iPhone):** tests in `*.webkit.spec.ts` run only with `npm run test:webkit` (WebKit is installed once with `npx playwright install webkit` and is not in CI, so the normal suite stays in its time budget). Use it for what only a phone browser can show ([MUPP-025](../../specs/MUPP-025-ios-close-animation/solution.md)).
- **A failing test** is either a bug in the site (report it to the user) or a wrong test (fix the test and, if needed, the requirement). Never weaken a test to make it pass.

## Smoke tests

- **What:** a few fast checks that a deployed site works: each main page loads and each main flow answers, for example the start page, a child's wishlist, sign-in being required for what needs it.
- **Rules:** read-only: no sign-in, no secrets, no data written, so they can run against production. The site is behind the site password, so a smoke test sees the password page (it starts without the saved sign-in, see below) and checks that nothing else is shown. Marked `@smoke` in their names, for example `MUPP-009-R6 @smoke the site answers with the password page and none of its content`, and run with `npm run test:smoke` (against the live site, or `BASE_URL`). They live with the feature that needs them.
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

## Function sizes

Vercel stores every function of every deployment, and the free plan limits that storage (10 GB), so the size of the functions is checked by hand after a change to what the pages import. Build with `VERCEL=1` (the web client is only used there; a dummy `TURSO_DATABASE_URL=https://example.invalid`, dummy secrets and `NEXT_DIST_DIR=<another folder>` are enough, no network is needed) and run `node scripts/function-sizes.mjs <that folder>`. It sums the files each function traces (`.nft.json`) and fails, naming the function, when one is over 6 MB (`/admin/hantera`: 25 MB, it holds `sharp`), traces the native `libsql`, or (except `/admin/hantera`) traces `sharp`. It is not run in CI ([TECH-016](../../specs/TECH-016-smaller-functions/solution.md)).

## Where each check runs

| | Locally | CI (pull request) | Preview tests | Live tests (after deploy) |
|---|---|---|---|---|
| Lint, type check, build | ✓ | ✓ | | |
| Browser tests | `npm run test:local` | ✓ (all) | | |
| Unit tests | `npm run test:unit` | ✓ (before the build) | | |
| Smoke tests | `npm run test:smoke` | ✓ (part of all) | ✓ | ✓ |
| axe | in the browser tests | ✓ | | |
| Security scans | | ✓ (job `security`) | | |
| Time limits of the browser tests | `npm run test:time` | ✓ (fails the job) | | |
| Code review | ✓ | | | |

The pipeline itself (workflows, events, secrets and the branch protection) is described in [Pipeline](pipeline.md).

## Quality rules

The test suite is checked with every change, so that it doesn't grow slower and weaker as the site grows.

- **No flaky tests.** Tests are not retried. A test that sometimes fails is fixed (or the bug in the site is), never retried or skipped. [TECH-010](../../specs/TECH-010-flaky-thumbnail/solution.md) shows one way to look for a flake: `--repeat-each 20` while busy processes keep the CPUs busy, on the current code and the code where it failed.
- **No fixed waits.** Tests wait for what the user sees (`expect`, `toBeVisible`), never for a time (`waitForTimeout`).
- **Each test checks behaviour** named in its requirement, not only CSS or markup, unless the requirement is about the look.
- **No duplicates.** A behaviour already checked by another feature's test is not tested again; a test that a later change made redundant is removed.
- **Shared helpers** in `tests/helpers.ts` instead of copies.
- **Cheap where it can be:** checks that don't need a browser or a new page load are combined or done without one.

## Time budgets


| What | Budget |
|---|---|
| One test, locally | at most 8 s |
| All unit tests (`npm run test:unit`) | at most 30 s |
| All tests in `npm run test:local` (without the build) | at most 330 s (5.5 min) |
| The smoke tests against a preview or the live site | at most 1 min |
| A whole job on GitHub | CI at most 8 min, of which at most 2 min preparation; Preview tests and Live tests at most 2 min |

`npm run test:time` runs the unit tests and `npm run test:local`, and prints the number of each, their total time and the five slowest browser tests, marking anything over budget. Every feature records the numbers before and after in `verification.md`. When a budget is exceeded, or the total time grows by more than 25 % in one change, find the cause: fix the change if it caused it, otherwise put a technical task at the top of the backlog.

**The limits are checked in CI** ([TECH-019](../../specs/TECH-019-test-suite-budget/solution.md)): after `npm run test:local`, the step `node scripts/check-test-time.mjs test-results/report.json` reads Playwright's JSON report and fails the job when the browser tests' total or one test is over its limit, naming the limit and the slowest tests. The limits are in `scripts/test-time-limits.mjs` (the same ones `npm run test:time` uses) and tested by `scripts/test-time-limits.test.ts`. CI's computer is slower than the developer's, so the limits given in `ci.yml` (`--total-ms`, `--test-ms`) are higher than the 330 s and 8 s budgets: the first measured CI run plus 25 % (363.9 s in total and 7.4 s for the slowest test gave 455 s and 9.3 s). A limit is raised only on a card, with the numbers and the reason, never to make one pull request pass.

**Why 330 s and 8 s:** the suite grew from 111 tests (178 s) to 162 (327 s, 2.0 s per test), and the 180 s and 5 s of TECH-018 could not be kept without more workers (a database each) or splitting the large journey tests, which the project, a hobby site for about 20 users, does not need. The budgets follow the suite, and the check in CI stops it from growing without being noticed.

[System documentation](index.md)
