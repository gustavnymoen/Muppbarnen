---
type: Verification
title: "MUPP-077 Add gifts not on the wish list: verification"
description: How each requirement of MUPP-077 was checked, the test suite before and after, and the requirements as built.
feature: MUPP-077
---

# Verification of MUPP-077

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-077-R1 | Browser tests `MUPP-077-R1 R2 R3 R4 …`, `MUPP-077-R1 R4 R5 …` (empty list) and `MUPP-077-R1 R4 …` (month after) in `tests/MUPP-077-visitor-gifts.spec.ts`; look in `tests/design.spec.ts` | local | Pass | 2026-11-15 |
| MUPP-077-R2 | Browser test `MUPP-077-R1 R2 R3 R4 …`; unit tests `MUPP-077-R2 R3 R7 …` in `lib/family.test.ts` | local | Pass | 2026-11-15 |
| MUPP-077-R3 | Browser test `MUPP-077-R1 R2 R3 R4 …` (empty name, back keeps values); design test `MUPP-077-R1 R3 R4 R5 …` (320 px) | local | Pass | 2026-11-15 |
| MUPP-077-R4 | Browser tests (saved, "Tillagd av", after reload, sorted last); unit test `MUPP-077-R4 …` | local | Pass | 2026-11-15 |
| MUPP-077-R5 | Browser tests `MUPP-077-R1 R4 R5 …` and `MUPP-077-R5 a parent's claimed row …`; unit tests `MUPP-077-R5 …` (a visitor's gift has no claim to remove, gift deleted, parent's and archived row refused) | local | Pass | 2026-11-15 |
| MUPP-077-R6 | Browser test `MUPP-077-R6 …` (admin note, warning, archive) | local | Pass | 2026-11-15 |
| MUPP-077-R7 | Unit tests `MUPP-077-R7 …` (unknown child, wrong occasion value, text kept as text, limit of 20, archived not counted); browser test `MUPP-077-R7 without a site session …`; `lib/route-checks.test.ts` | local | Pass | 2026-11-15 |

"A wrong occasion" in R7 means a value that is not birthday or christmas. The server cannot know which list the card shows, and the rule is as strong as `saveItem`'s.

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/family.test.ts` (10 new), `db/db-setup.test.ts` updated for the new column; 411 pass | local | Pass | 2026-11-15 |
| Browser tests | `tests/MUPP-077-visitor-gifts.spec.ts` (4 tests, axe in every state) and one new test in `tests/design.spec.ts` | local | Pass | 2026-11-15 |
| Smoke test | Not applicable: the flow writes data; the Live tests (smoke tests) passed after the deploy | live | Pass | 2026-11-16 |
| Accessibility | axe in every state of the browser tests; the checklist on the live site was marked done by the user, with no per-item details | local, live | Pass | 2026-11-16 |
| Manual check on a phone with the keyboard up | Marked done by the user, with no details recorded | phone | Pass | 2026-11-16 |
| Security | Security points in the review; `/security-review` run, no finding | local | Pass | 2026-11-15 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-15 |

## Test suite

The feature's own browser tests (5: four in `tests/MUPP-077-visitor-gifts.spec.ts` and one in `tests/design.spec.ts`) take 14.6 s locally, merged by journey so that each page is loaded once. Before the merge with TECH-029 they were 7 tests and about 23 s; CI failed twice on the 455 s limit (455.4 s and 456.3 s) and the feature waited for TECH-029 ([#271](https://github.com/gustavnymoen/Muppbarnen/pull/271)), which brought the suite to 179 tests in 361.2 s in CI (322.9 s locally).

| | Tests | Total time |
|---|---|---|
| Before MUPP-077 and TECH-029 | 179 browser tests | 322.9 s locally, 361.2 s in CI (after TECH-029) |
| After MUPP-077 | 5 more browser tests, 10 more unit tests (411 in all) | about 14.6 s more locally; CI measured on the pull request |

All the feature's tests pass on the code merged with `main`. The full suite after this merge is run by CI on the pull request.

## Requirements as built

As in the card (`gh issue view 259`), with these details:

- Step 1 errors are found in the browser (`parseWish`) and again on the server.
- The add button is a muted "Lägg till egen present" row with a plus; the undo dialog of an added gift has only "Avbryt" and "Ta bort" (the gift is deleted), and `unclaimWish` leaves an added gift alone (R5 as changed on 2026-11-15).

## Definition of Done

- [x] Unit tests and browser tests pass
- [x] Test suite within budgets: CI 361.2 s of 455 s after TECH-029; the feature's own tests add 14.6 s locally
- [x] Deployed, and the Live tests passed against the live site on the merge commit `53a16da` (2026-11-16)
- [x] Accessibility checklist on the live site: marked done by the user (2026-11-16); no per-item details were recorded
- [x] Requirements match what was built; `solution.md` written
- [x] Manual, system docs and log updated
- [x] No leftovers; `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review done, no must-fix; see [review.md](review.md)
- [x] Larger improvements: see the review's notes
