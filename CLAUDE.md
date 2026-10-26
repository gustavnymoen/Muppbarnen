@AGENTS.md

# Working on Muppbarnen

This project is built with **specification-driven development** (SDD; "How we work" in `specs/overview.md`). The requirements decide what gets built, and code, tests and documentation follow from them. Read `README.md` for the project layout and conventions, `specs/overview.md` for the product, its terms and the rules that apply across features, and `wiki/system/testing.md` for how everything is tested.

- **What is built and why** is in a card on the GitHub board ["Muppbarnen"](https://github.com/users/gustavnymoen/projects/3): a short explanation, then the requirements and a test plan, worked out together with the user. Read a card with `gh issue view <number>`.
- **How it is built** is in the repo: `specs/<ID>-<name>/` with `solution.md`, `flow.mmd`, `verification.md` and `review.md`, plus the tests and the wiki.

## The board

The board is the backlog for the whole site. Its columns are **Backlog**, **Specified**, **Ongoing**, **Review** and **Done**; the order of the cards in Backlog is the priority, so the top card is next. Every card has a **Work type** (Feature, Fix or Tech) and an **Area** (Startsida, Önskelista, Barnkort, Tidslinje, Administration or Shared).

- A card gets its ID when it is created: the next free `MUPP-` ID for a Feature or Fix, `TECH-` for Tech. The ID starts its title, for example `MUPP-010 Wishlist`. New cards start from `.github/ISSUE_TEMPLATE/card.md`.
- Move a card on the board, or with `gh project item-edit` (field Status).
- A pull request with "Closes #<card>" moves the card to Done when it is merged (the board's built-in workflows).

## The workflow

Every change to the site's behaviour belongs to a card with an ID (`MUPP-001`, `MUPP-002`, …), and goes through these steps in order:

1. **Specify.** Pick the top card in Backlog with the user. Work out in the card, together with the user: Goal, Scope, numbered requirements (`<ID>-R1`, `<ID>-R2`, …) with acceptance criteria, a test plan (which unit tests, browser tests and smoke test, what accessibility checks, and whether `/security-review` is needed; see `wiki/system/testing.md`), and open questions. When the requirements and the test plan are settled and no open questions remain, move the card to **Specified**.
2. **Start.** Create a Git branch named `<ID>-<name>`, for example `MUPP-010-wishlist`, and the folder `specs/<ID>-<name>/` from `specs/_template/`: `solution.md` (how it is built: data, interface, decisions and why), `flow.mmd` and `verification.md`. Move the card to **Ongoing**.
3. **Build.** Implement exactly what the requirements say, and write the unit tests in the test plan together with the code they test. If a requirement turns out to be wrong or incomplete, stop and update the card with the user first, then the code. Never let code and requirements disagree. Keep `solution.md` up to date as the work goes.
4. **Test.** Write the tests in the card's test plan: the browser tests (checks of the look go into `tests/design.spec.ts`, in the test for their page and state, never one test per CSS value), and a smoke test when the feature adds or changes a main page or flow. Every requirement has at least one test named after it, or a manual check or code review recorded in `verification.md` with the reason it can't be automated. How to write them (names, places, data, helpers, what to do when one fails) is in `wiki/system/testing.md`.
5. **Verify.** Fill in `verification.md`: each requirement, how it was checked, where (local or live), the result and the date. Only record checks that were actually done; anything not checked is written as not checked. Run `npm run lint`, `npm run typecheck`, `npm run build` and `npm run test:time` (which runs the unit tests and `npm run test:local` and gives the test numbers for `verification.md`), and after the deploy check that Live tests (the smoke tests) passed against the live site.
6. **Document.** Update `wiki/system/` (how it works, in English) and `wiki/manual/` (how to use it, in Swedish), the `index.md` pages, `wiki/system/architecture.md` if the structure changed, and add a line to `wiki/log.md`.
7. **Review.** Run the reviewer agent (`.claude/agents/code-reviewer.md`), which follows `wiki/system/code-review.md` (including its security points) and reads the requirements from the card. If the change touches sign-in, admin, API routes, server actions, database queries or personal data, also run Claude Code's `/security-review` and add its result to the report. Save the report as `review.md` in the feature's folder, from `specs/_template/review.md`. Fix every must-fix finding, run lint, the type check and the affected tests again, and run the review again until none are left; fix small should-fix findings now and add larger ones to the board. If the review stopped the feature, tell the user in a few lines what it found and how it was fixed; otherwise just say that it passed.
8. **Done.** Check every point in the Definition of Done below. Copy the card's requirements, as built, into `verification.md`, so the repo shows what was built even if the card changes later. Add the feature to the list in `specs/overview.md`. Commit with the feature ID in the message, for example `MUPP-007: Önskelista`.
9. **Merge.** Push the branch (when the user asks) and open a pull request to `main` with "Closes #<card>" in its description, and move the card to **Review**. Post the feature's `review.md` on it as a comment (`gh pr comment`); if the review is run again later, post the new report as a new comment. GitHub's "CI" checks (`check`: lint, type check, unit tests, build and `npm run test:local`; `security`: the security scans), "Preview tests" (`preview`: the smoke tests against the pull request's preview on Vercel) and Vercel's own status must be green, and the branch up to date with `main`; branch protection enforces both (see `wiki/system/pipeline.md`). The merge publishes the site and moves the card to Done, and "Live tests" then runs the smoke tests against it.

Small fixes that don't change behaviour (typos, styling details) don't need a new card, but still keep the cards, the solutions and the wiki true.

## Definition of Done

A feature or technical task is done when all of these hold. Record them in its `verification.md`.

1. **Tests:** every check in the card's test plan is done, every requirement has a test named after it (or a recorded manual check or code review), `npm run test:unit` and `npm run test:local` pass, and after the deploy the smoke tests pass against production (Live tests).
2. **Accessibility:** what visitors see meets WCAG 2.2 level AA. Every page or state the change adds or alters is checked with `expectNoA11yViolations` (axe) in its tests, and the relevant items of the checklist in `wiki/system/accessibility.md` are gone through on the live site and recorded per item.
3. **Requirements:** the card's requirements describe what was actually built, and no open questions remain. Anything that changed during the work is updated in the card, `verification.md` records the requirements as built, and `solution.md` describes how it was built.
4. **Manual:** `wiki/manual/` (Swedish) describes how to use the feature, `wiki/system/` how it works, and `wiki/log.md` has a line.
5. **No leftovers:** code, files, exports, styles, scripts and documentation that the change made unused are deleted. No commented-out code, debug output or temporary files. Claude is responsible for the code being clean.
6. **Clean code:** reads like the surrounding code, reuses existing components and helpers instead of copying them, and `npm run lint`, `npm run typecheck` and `npm run build` pass without errors or warnings.
7. **Code review:** the review is done, `review.md` is saved, and no must-fix findings are left.
8. **Improvements handled:** small cleanups related to the work are fixed in the same change; larger or unrelated ones are added to the board as technical tasks (see below).
9. **Test suite:** the number of tests and the total time before and after the change are recorded, the suite is within the time budgets in `wiki/system/testing.md`, and the new tests follow its quality rules.

## Tests

How the site is tested is in `wiki/system/testing.md`: the kinds of checks (unit tests, browser tests, smoke tests, accessibility, security, code review), which to choose for what, where each runs, the quality rules and the time budgets. Check it with every change, so that the suite doesn't grow slower and weaker as the site grows.

## Technical tasks

Improvements to the code that don't change what the site does: removing leftovers, removing duplicated code, making shared components (for example one button component instead of the same classes in many places), and making things faster.

- **Small and related: fix it now.** A small improvement in or right next to the code being changed is done as part of that change, without a card. Mention it in the commit and in `verification.md`.
- **Large or unrelated: add a technical task.** Only what is too big for the current change, or concerns other parts of the code, goes to the board. Group small unrelated findings into one task instead of one task each. The board should not fill up with technical tasks.
- They are cards on the same board as features, with Work type **Tech** and IDs `TECH-001`, `TECH-002`, …, and a short description of the problem and where it is.
- When one is started it gets a folder like a feature, `specs/TECH-001-<name>/`, from the same template. Its requirements are usually "the site behaves as before" (shown by the existing tests passing) plus the concrete change.
- The Definition of Done applies to them too.

## Code quality

This is a hobby project and a learning project. The code doesn't have to be perfect, but it should be tidy, consistent and easy to follow: clear names, small functions, shared components instead of copies, comments that explain why. Prefer the simple solution over the clever one. When a choice is worth learning from (a pattern, a trade-off, why something was refactored), explain it briefly to the user.

## Languages

- Specifications, system documentation (`wiki/system/`), README and this file: **English**.
- User manual (`wiki/manual/`) and everything visitors see on the site: **Swedish**.
- Code comments: Swedish, as in the existing code.

## Rules

- **No real personal data in Git.** The repository is public. The children's pictures live in Vercel Blob and the real names, birthdates and sizes in the database, both entered on the admin page. `pictures/` is a local folder that Git ignores; never commit it. Seed data and test data are made-up.
- **Database changes go through migrations** in `db/migrations/NNN_<name>.sql`, run by `scripts/db-setup.mjs` before `dev` and `build`. Never edit an applied migration; add a new one.
- **The local database is the user's own data.** It lives at `~/Ai Projekt/muppbarnen-data/muppbarnen.db`, outside the project folder, with backups in `db/backups/` (local only, not in Git). Never reset it, delete from it or write test data to it. Experiments run on a copy (`TURSO_DATABASE_URL=file:<copy>`). Tests that write data must clean up after themselves or run against a separate database.
- **Production** is Vercel with Turso. `npm run db:reset` never runs against Turso. Secrets (`.env.local`, `.env.turso`) are never committed or printed.
- **Git:** work on a branch per feature, commit only when the user asks, and push only when the user asks. Check staged files before every commit. Don't push directly to `main` (branch protection refuses it); changes reach `main` through a pull request with green "CI" and "Preview tests" checks.
