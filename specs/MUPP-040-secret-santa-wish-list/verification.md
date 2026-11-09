---
type: Verification
title: "MUPP-040 Secret Santa: own wish list: verification"
description: How each requirement of the Secret Santa wish list was checked, the test suite before and after, and the requirements as built.
feature: MUPP-040
---

# Verification of MUPP-040

How each requirement was checked. Everything ran locally (local test database, a production build); nothing is pushed or deployed, so the live checks are not done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-040-R1 | Browser test `MUPP-040-R1 …` (title required, a `javascript:` link refused, limits 60/100/40 on the fields, a saved wish with text printed as text and a safe link, axe); unit tests `MUPP-040-R1 …` (limits at and over the edge, links) | local | Pass | 2026-11-08 |
| MUPP-040-R2 | Browser test `MUPP-040-R2 …` (edit, delete with the confirmation, axe on the dialog); unit test `MUPP-040-R2 …` | local | Pass | 2026-11-08 |
| MUPP-040-R3 | Browser tests `MUPP-040-R3 a wish id changed …` (another member's wish id in the form is refused, nothing changes) and `… a person in two families …` (two lists, a change in one leaves the other); unit tests `MUPP-040-R3 …` (refusals, two families, removal with member and family) | local | Pass | 2026-11-08 |
| MUPP-040-R4 | Browser test `MUPP-040-R4 …` (another member's own page, `/`, `/secret-santa` and `/admin` do not contain the wish); code review: only `listOwn`, filtered on the signed-in person, reads `ss_wish` | local | Pass | 2026-11-08 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/santa-wishes.test.ts` (5); `lib/santa.test.ts` and `lib/route-checks.test.ts` keep passing | local | Pass | 2026-11-08 |
| Browser tests | `tests/MUPP-040-secret-santa-wish-list.spec.ts` (5) with axe on the list, the form and the dialog; the list and form on a 375 x 667 phone in `tests/design.spec.ts` (1) | local | Pass | 2026-11-08 |
| Smoke test | Not applicable: the card says none (the page is behind the sign-in the smoke tests do not have) | n/a | n/a | 2026-11-08 |
| Accessibility | axe in the browser tests; the manual checklist on the live site: reported tested by hand by the user, screen reader items included (2026-11-09, not recorded item by item) | local, live | Pass (axe); live checklist reported done | 2026-11-08 |
| Security | Security points in the review; `/security-review` run, no finding at confidence 8 or higher | local | Pass | 2026-11-08 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-08 |
| Look | Phone view looked at in a screenshot (375 wide) and measured in `tests/design.spec.ts`; Impeccable's critique was not run: the page is the kids' admin pattern reused as it is | local | Looked at, no critique | 2026-11-08 |

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-039) | 187 unit + 114 browser | 191.8 s (browser) | 4.5 s |
| After | 193 unit + 120 browser | 200.2 s (browser), unit 0.4 s | 4.5 s |

Five unit tests and six browser tests were added; growth 4 % (under the 25 % limit). The browser total is over the 3 minute budget, as it already was; [TECH-018](https://github.com/gustavnymoen/Muppbarnen/issues/146) covers it. The new tests take 1.2–2.5 s each. The full `test:time` run started before the review fix to the server actions (and one unit test then failed because it read the file while it was being edited); afterwards the unit tests (193) and the MUPP-038, 039 and 040 browser tests and the phone test were run again and passed, but the whole browser suite was not run again.

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested; `npm run test:unit` and `npm run test:local` pass (browser suite as noted above)
- [ ] Test suite: browser total 200.2 s, over the 180 s budget, growth 4 %; TECH-018 is open
- [ ] Deployed, and the smoke tests pass against production (Live tests): not yet, nothing is pushed
- [x] Accessibility (axe passes; the manual checklist on the live site: the user reports the live checklist was tested by hand, including the screen reader items (said by the user, 2026-11-09, not recorded item by item))
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers: the kids' form fields and details moved to shared components, nothing unused left
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way: none

## Requirements as built

See the card (`gh issue view 138`) for the wording; as built:

- **R1** On the own page, "Ny önskning" in each family's card opens the form: name (required, 60), size (40), description (100), link (500, http or https only).
- **R2** The pencil opens the details and the edit form; the trash can asks before deleting.
- **R3** The person comes from the cookie. A new wish needs a membership in the posted family, an edit or delete a wish in the person's own lists; otherwise "Du kan inte göra det här.". Each family has its own list.
- **R4** Only the owner's own page reads the list.

[Specifications](../index.md)
