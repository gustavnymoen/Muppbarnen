---
type: Guide
title: Setting up a new project
description: What the project kit contains, how to start a new project from it, the skills and tools used, and the pitfalls learned in Gurras Flyg.
resource: README.md
feature: TECH-004
tags: [setup, kit]
---

# Setting up a new project

This project started from a kit exported from Gurras Flyg: workflow, templates, pipelines, scripts and test helpers. To start a new project the same way, put the kit in an empty project folder, open Claude Code there and write: **"Read wiki/system/project-setup.md and set the project up according to it, one step at a time with me."** Claude goes through the steps below with the user and says which ones the user must do in a browser (accounts, secrets and settings in GitHub, Vercel and Turso). After that every change follows [Way of working](way-of-working.md).

Two names to choose at the start: the product's name (here **Muppbarnen**) and the prefix of feature IDs (here **`MUPP-`**; technical tasks are always `TECH-`). They are filled in throughout the files; change them with a search and replace.

## What is in the folder

| Path | What |
|---|---|
| `CLAUDE.md` | The instructions Claude Code reads in every session: the workflow, Definition of Done, rules |
| `.claude/agents/code-reviewer.md` | The reviewer agent used in the review step |
| `.claude/skills/` and `skills-lock.json` | Design skills: `design-taste-frontend`, `emil-design-eng`, `impeccable` |
| `.github/ISSUE_TEMPLATE/card.md` | The template for every card on the board |
| `.github/workflows/ci.yml`, `preview-tests.yml`, `live-tests.yml` | CI, smoke tests against the preview and against production (check the live URL and the Playwright version) |
| `.github/actions/setup-tests/action.yml` | The test jobs' shared setup |
| `.github/dependabot.yml` | Security updates for npm, monthly updates for Actions |
| `.semgrep/sql.yml` | Our own Semgrep rule: SQL joined from text |
| `specs/_template/` | `solution.md`, `flow.mmd`, `verification.md`, `review.md` for every card |
| `wiki/system/` | The rules for tests, the pipeline, the review, accessibility and the way of working |
| `scripts/` | Database setup and migrations with backups; the local test server; the timed test run; Playwright install; the image version check; the documentation check |
| `lib/db.ts`, `lib/local-db.mjs`, `db/` | Database access, where the local databases are, an empty schema, seed and migration folder, and the unit tests' database helper |
| `playwright.config.ts`, `vitest.config.mts`, `vitest.global-setup.mjs`, `tests/helpers.ts`, `tests/global-teardown.ts` | Test configuration and shared test helpers |
| `next.config.ts`, `eslint.config.mjs`, `.gitignore`, `.env.example` | Next.js settings with security headers, lint, ignores, the environment variables |

The scripts and dependencies are in `package.json`; Node.js 24.

## The steps

1. **Accounts and tools (the user):** GitHub, Vercel and Turso accounts; Node.js 24; Git; `gh` installed and signed in (`gh auth login`, then `gh auth refresh -s project`).
2. **The Next.js project:** `npx create-next-app@latest` in the folder (TypeScript, Tailwind, App Router, ESLint), keeping the files of the kit; merge `next.config.ts`, `eslint.config.mjs` and `.gitignore` with what it made; add the scripts and dependencies; `npm install`; turn on `cacheComponents` and read `node_modules/next/dist/docs/`.
3. **Local setup:** copy `.env.example` to `.env.local` and fill in the values; `npm run dev` creates the local database outside the folder; check that `npm run lint`, `npm run typecheck`, `npm run test:unit` and `npm run build` pass.
4. **First pages and tests:** a start page, `tests/smoke.spec.ts` with a first `@smoke` test, `tests/design.spec.ts` when the design arrives, `app/components/` for the shared components, the product pages in `specs/`, `README.md`, the wiki index pages and `wiki/log.md`.
5. **GitHub repository (public)** and the first push of `main` (the only direct push; after branch protection everything goes through pull requests).
6. **The board (the user, with Claude's help):** a new Project linked to the repository; Status with Backlog, Specified, Ongoing, Review, Done; fields Work type and Area; the built-in workflows that set Done ([Backlog](backlog.md)); fill in the board URL and the areas in `CLAUDE.md`.
7. **Vercel (the user):** import the repository; Settings → Git: turn on `deployment_status` events; Settings → Deployment Protection → create the Protection Bypass for Automation secret, and add it as the GitHub repository secret `VERCEL_AUTOMATION_BYPASS_SECRET`; put the production URL in `playwright.config.ts`, `.github/workflows/live-tests.yml` and [Pipeline](pipeline.md).
8. **Turso (the user):** one database for Production, its URL and token added by hand in Vercel's environment variables for Production only; one for Preview through Vercel → Storage, connected to Preview only; admin secrets (if any) for both ([Architecture](architecture.md)).
9. **Branch protection on `main`** (the user, or `gh api`): pull requests only, required checks `check`, `security`, `preview` and `Vercel`, branch up to date, no force pushes or deletion ([Git and GitHub](git-and-github.md)).
10. **Check the pipeline** with a first pull request: CI, Preview tests, the merge, Live tests.
11. **Design (optional, with the skills):** `impeccable` or `design-taste-frontend` to settle the look; `DESIGN.md` and `PRODUCT.md`; tokens in `app/globals.css`.
12. **The first cards:** write the backlog with the user (a few cards specified ahead), and start the workflow in [CLAUDE.md](../../CLAUDE.md) with the top card.

## Skills and tools

| What | Where | Used for |
|---|---|---|
| `design-taste-frontend` | `.claude/skills/`, source `leonxlnx/taste-skill` | Art direction and a no-slop house style for pages and app screens |
| `emil-design-eng` | `.claude/skills/`, source `emilkowalski/skills` | UI polish, components and animation decisions |
| `impeccable` | `.claude/skills/`, source `pbakaus/impeccable` | Design, critique, audit and polish of interfaces; writes `DESIGN.md` and `PRODUCT.md` |
| `code-reviewer` agent | `.claude/agents/code-reviewer.md` | The review step |
| `/security-review` | Built into Claude Code | Security review in the review step |
| `/code-review` | Built into Claude Code | Optional extra bug review |
| GitHub CLI (`gh`) | Installed locally, signed in with the `project` scope | Cards, the board, pull requests, comments, workflow runs |
| Vercel | vercel.com, connected to the GitHub repository | Previews and production |
| Turso | turso.tech (and its CLI, optional) | The production and preview databases |
| Playwright, Vitest, axe | npm | Tests |

`skills-lock.json` records each skill's source and hash, so they can be updated from their sources.

## Lessons from Gurras Flyg

Pitfalls met once, so they needn't be met again:

- **Never run `npm run build` while `npm run dev` is running** in the same folder: the dev server loses its CSS. Restart dev after building; the test server builds into `.next-test/` for this reason.
- **Vercel can serve old CSS from its build cache** after a merge; redeploy without the cache.
- **Previews have their own database.** A smoke test that needs data (for example at least one product) fails on a preview whose database lacks it.
- **One test run at a time per computer:** every checkout shares the test database. A second run needs another `HOME`.
- **Next.js has an alert of its own** (the route announcer) outside `<main>`: look for a page's messages inside `main`.
- **A controlled input whose state lives in the address** (`history.replaceState`) isn't checked at once after a click: click and wait for `toBeChecked()` instead of `check()`.
- **A `beforeEach` runs before the test's fixtures:** sign in inside the test when it needs the fixture's data.
- **Elements that fade in confuse axe's contrast check:** wait for animations before running axe (the helper does).
- **Don't run Prettier** unless it is a dependency: it reformats everything to 80 columns.
- **`next dev` rewrites `AGENTS.md` and `tsconfig.json`;** commit `AGENTS.md` with the work, and revert unrelated `tsconfig.json` changes.
- **Long sessions burn tokens:** a whole card, two review agents and repeated full test runs in one conversation add up. A new session per card is cheaper.

The kit was set up in [TECH-001](../../specs/TECH-001-project-setup/solution.md), [TECH-002](../../specs/TECH-002-repository-and-hosting/solution.md) and [TECH-003](../../specs/TECH-003-pipeline-and-branch-protection/solution.md).

[System documentation](index.md)
