---
type: Guide
title: Way of working
description: "Specification-driven development in Muppbarnen: the roles, the steps for every card, technical tasks, how Claude and the user work together, code quality and languages."
resource: CLAUDE.md
feature: TECH-004
tags: [workflow, sdd]
---

# Way of working

Taken from the project Gurras Flyg (October 2026) and made general. The steps and the Definition of Done are maintained in one place, [CLAUDE.md](../../CLAUDE.md); this page explains the thinking behind them.

## Specification-driven development (SDD)

- **The requirements are the source of truth.** Every change starts as a card on the GitHub board ([Backlog](backlog.md)), with a goal, a scope, numbered requirements (`MUPP-010-R1`, …) with acceptance criteria in Given/When/Then, and a test plan. It is built only when no open questions remain.
- **Code, tests and documentation follow from the requirements.** `specs/<ID>-<name>/solution.md` says how a card is built, each test is named after the requirement it checks ([Testing](testing.md)), and the manual and the system documentation describe what was built ([Documentation structure](documentation.md)).
- **Every requirement is traceable:** from the card, to its tests, to a row in the card's `verification.md` (how it was checked, where, the result, the date). When the card is done, its requirements are copied into `verification.md` as built.
- **`verification.md` records only checks that were actually done;** anything not checked is written as not checked.
- **A requirement that turns out wrong is changed in the card first,** together with the product owner (the user), and then in the code. Code and requirements never disagree.

## Roles

- **The user** is the product owner: decides what is built, settles the requirements and open questions, merges pull requests, and does what needs their accounts and secrets.
- **Claude** specifies together with the user, builds, tests, documents, runs the reviews, and keeps the board, the specs and the wiki true. Claude commits only when asked and pushes only when asked.

## The steps for every card

In short (full text in [CLAUDE.md](../../CLAUDE.md)):

1. **Specify** the top card in Backlog with the user: goal, scope, requirements with acceptance criteria, test plan, open questions answered. Move it to **Specified**.
2. **Start:** branch `<ID>-<name>`, folder `specs/<ID>-<name>/` from `specs/_template/`, card to **Ongoing**.
3. **Build** exactly what the requirements say, with the unit tests next to the code. Keep `solution.md` current.
4. **Test:** the browser tests and, for a new main page or flow, a smoke test. Every requirement has a test named after it, or a recorded manual check with the reason.
5. **Verify:** fill in `verification.md`; run lint, the type check, the build and `npm run test:time`.
6. **Document:** `wiki/system/` (English), `wiki/manual/` (Swedish), the index pages, `architecture.md` if the structure changed, a line in `wiki/log.md`.
7. **Review:** the reviewer agent ([Code review](code-review.md)), plus `/security-review` when the change touches sign-in, admin, API routes, server actions, database queries or personal data. Save `review.md`; fix every must-fix and run again; give every finding a decision and a reason.
8. **Done:** Definition of Done checked, requirements copied into `verification.md` as built, the feature added to [the feature list](../../specs/features.md), commit with the ID (`MUPP-007: Önskelista`).
9. **Merge:** push when asked, pull request with "Closes #<card>", card to **Review**, `review.md` posted as a comment. The checks must be green and the branch up to date ([Pipeline](pipeline.md)); the user merges. Live tests run after the deploy; then the accessibility checklist ([Accessibility](accessibility.md)) on the live site.

Small fixes that don't change behaviour (typos, styling details) need no card, but the cards, the specs and the wiki are kept true.

## Definition of Done

Tests (every check in the test plan, every requirement tested, unit and local browser tests pass, smoke tests pass against production after the deploy); accessibility (axe on every new page and state, the checklist on the live site per item); requirements match what was built; manual, system docs and log updated; no leftovers; clean code (lint, type check, build without warnings, shared components reused); code review done with no must-fix left; improvements handled; the test suite's numbers before and after recorded and within budget. The exact list is in [CLAUDE.md](../../CLAUDE.md).

## Technical tasks

Improvements that don't change what the site does (leftovers, duplicated code, shared components, speed). Small and related: fixed in the same change, mentioned in the commit and `verification.md`. Large or unrelated: a card with Work type **Tech** and ID `TECH-001`, …, grouped so the board doesn't fill up. They go through the same steps and Definition of Done; their requirements are usually "the site behaves as before" plus the concrete change.

## How Claude and the user work together

Learned in Gurras Flyg; keep them unless the user says otherwise:

- **Answer in Swedish** in the chat; files follow the language rules below.
- **Specify only a few cards ahead,** then build; specs written far ahead go stale.
- **One card per session.** A whole card in one long conversation costs many tokens: start a new session per card, read only what each step needs, run only the card's test file while working and the whole suite once at the end.
- **Commit only when asked, push only when asked,** check the staged files before every commit, never push to `main` ([Git and GitHub](git-and-github.md)).
- **Push everything before the checks go green:** the user merges as soon as the pull request's checks pass, so nothing may be left to push after.
- **After a push,** offer Auto-fix on the pull request instead of polling CI.
- **Explain briefly** when a choice is worth learning from (a pattern, a trade-off, why something was refactored). The project is also a learning project.

## Code quality

Tidy, consistent and easy to follow: clear names, small functions, shared components instead of copies, comments that explain why. Prefer the simple solution over the clever one. Read the code around a change and write like it.

## Languages

- Specifications, system documentation (`wiki/system/`), README, `CLAUDE.md`: **English**.
- The user manual (`wiki/manual/`) and everything visitors see: **Swedish**.
- Code comments: **Swedish**.

The documentation structure was added by [TECH-004](../../specs/TECH-004-okf-documentation/solution.md).

[System documentation](index.md)
