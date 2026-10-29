---
type: Verification
title: "TECH-006 Design skills and a design pass: verification"
description: How each requirement of Design skills and a design pass was checked, the test suite before and after, and the requirements as built.
feature: TECH-006
---

# Verification of TECH-006

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-006-R1 | Manual: the three skills are in `.claude/skills/` and listed in the session; `CLAUDE.md`, `wiki/system/way-of-working.md` and `wiki/system/code-review.md` name them and say when they are used (read, nothing to automate) | local | Pass | 2026-10-29 |
| TECH-006-R2 | `PRODUCT.md` written with the user (interview answers); `impeccable context` loads it with `DESIGN.md`; `lib/design-tokens.test.ts` passes (every token listed in `DESIGN.md`) | local | Pass | 2026-10-29 |
| TECH-006-R3 | Manual: eight proposals in four rounds were tried on a phone with the user, who chose to keep the current look; recorded on the card, in `DESIGN.md` and `solution.md`; no token changed | local | Pass | 2026-10-29 |
| TECH-006-R4 | Test `TECH-006-R4 …` in `tests/design.spec.ts` (text beside the icons from 640 px, only icons on a phone, the manage lists at most 672 px wide, axe on both pages); critique by Impeccable (one context, see Notes), `impeccable detect` found nothing | local | Pass | 2026-10-29 |
| TECH-006-R5 | Test `TECH-006-R5 …` in `tests/design.spec.ts` (narrow one-line wish button of 44 px, picture over 60 px, line between kids, contrast of the wish button for the kids' colours, Christmas tiles, axe); the findings are listed below | local | Pass | 2026-10-29 |
| TECH-006-R6 | The existing tests pass; MUPP-002-R1 and MUPP-003-R1 were changed for the missing site name (see Notes) | local | Pass | 2026-10-29 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `npm run test:unit`: 110 pass, including `lib/design-tokens.test.ts` | local | Pass | 2026-10-29 |
| Browser tests | `npm run test:local`: 55 tests; look changes in `tests/design.spec.ts` | local | Pass (see Notes on one flaky test) | 2026-10-29 |
| Smoke test | None new | | Not applicable | |
| Accessibility | axe on the admin start, Hantera, the two-kid card and the Christmas card; contrast of the wish button 5.6–7.5 for all six kid colours. The checklist in `wiki/system/accessibility.md` on the live site: not checked yet | local | Pass locally, live not checked | 2026-10-29 |
| Security | Not needed: only looks changed | | Not applicable | |
| Code review | [review.md](review.md) | local | Passed | 2026-10-29 |

The findings of step 3 (the card): **twins** have a bigger picture (72 px on a low phone, growing to 104 px with the screen's height), a narrow one-line wish button and a divider (fixed); **Christmas Eve** shows the kids as tiles two by two (fixed); **the wish list** rolls down when opened and its button is the kid's colour as a fill (fixed; closing is unchanged, instant); **the side cards** show a little less and are darker (fixed).

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-012) | 110 unit, 53 browser | 92.0 s | 4.5 s |
| After | 110 unit, 55 browser | 98.9 s | 4.4 s (6.8 s once, see Notes) |

## Definition of Done

- [ ] Tests: the plan's checks are done locally; the live checks are not yet
- [x] Test suite: within the budgets, total time +7 %, the two new tests follow the quality rules
- [ ] Deployed, and the smoke tests pass against production (Live tests): not yet
- [ ] Accessibility: axe locally passes; the checklist on the live site not yet
- [ ] Requirements as built (below) match the card; `solution.md` describes how it was built
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers: the proposals page and its stylesheet, the variant code and the dev server's files were deleted
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` pass; `build` runs in `test:time`
- [x] Code review done, no must-fix left; see [review.md](review.md)
- [x] Larger improvements: none noticed

## Requirements as built

Copied from the card (`gh issue view 34`), with the changes made during the work noted in Notes.

### TECH-006-R1 The skills are set up

The three skills can be used in a session in this repository, and the project says how and when to use each. `CLAUDE.md`, `wiki/system/way-of-working.md` and the reviewer's checklist name them (design work: the skills; every UI change: at least a look with Impeccable's critique).

### TECH-006-R2 Product context

`PRODUCT.md` exists and describes the product, its users and its tone, written with the user; `DESIGN.md` still lists every token.

### TECH-006-R3 The concept (step 1)

Proposals were tried in the running site and the user chose; the choice (keep the current look) is on the card and in `DESIGN.md`.

### TECH-006-R4 The admin (step 2)

The password page and the admin pages follow the concept and were checked with critique and audit on a phone and a wide screen; the findings are fixed or noted.

### TECH-006-R5 The cards (step 3)

The birthday card and the Christmas card follow the concept: filled wish button, bigger pictures and a divider for kids sharing a birthday, tiles on Christmas Eve, a wish list that rolls down, and darker side cards.

### TECH-006-R6 The site behaves as before

Nothing changes in what the site does; the existing tests pass and the changed looks are tested in `tests/design.spec.ts`.

## Notes

- **Requirement changed with the user (MUPP-002-R1):** the site's name is no longer shown as a heading or a link. It stays as a visually hidden `h1` on the start page. The tests of MUPP-002-R1 and MUPP-003-R1 were changed to match. The password page keeps its visible heading.
- **Critique in one context:** Impeccable wants two isolated sub-agents for a critique; no sub-agents were used, so the critique of step 2 ran in one context.
- **Flaky test, not caused by this change:** `MUPP-012-R1 R2 R3` failed on its first run (6.8 s, the keyboard step) and passed on the next two (1.9 s); it does not touch what this change touched. Worth a look in a technical task if it happens again.
- **A fix found on the way:** the narrow wish button used to be as wide as the card because `w-full` won over `w-44`; the small button no longer has `w-full`.
- **Not checked yet:** the live site and the accessibility checklist.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
