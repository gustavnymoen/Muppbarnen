---
type: Verification
title: "MUPP-038 Secret Santa: families and members: verification"
description: How each requirement of Secret Santa families and members was checked, the test suite before and after, and the requirements as built.
feature: MUPP-038
---

# Verification of MUPP-038

How each requirement was checked. Browser tests ran locally (`npm run test:local`, local test database); nothing is deployed yet, so the live checks are not done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-038-R1 | Unit test `MUPP-038-R1 every read and change is refused …` (`lib/santa.test.ts`); browser tests `MUPP-038-R1 the master admin sees two tabs …` and `MUPP-038-R1 R6 a parent who is not master admin has no Secret Santa tab …` (`tests/MUPP-038-secret-santa.spec.ts`); look in `tests/design.spec.ts` | local | Pass | 2026-11-08 |
| MUPP-038-R2 | Unit tests `MUPP-038-R2 …` (create, rename, delete with orphans); browser test `MUPP-038-R2 R3 R4 R5 families and members …` (create, rename, delete with the question, Avbryt) | local | Pass | 2026-11-08 |
| MUPP-038-R3 | Unit tests `MUPP-038-R3 …` and `lib/form-input.test.ts` (phone, email, name length, unique phone, one person in two families, removal from one and the last family); the same browser test (errors shown with what to fix, edit in one family shows in both, removal) | local | Pass | 2026-11-08 |
| MUPP-038-R4 | Unit test `MUPP-038-R4 …`; the browser test adds a known person to a second family | local | Pass | 2026-11-08 |
| MUPP-038-R5 | Unit tests `MUPP-038-R5 …` (both ways, change, clear, never self or another family, per family, removal frees the partner); the browser test checks the list holds "Ingen" and the other members only | local | Pass | 2026-11-08 |
| MUPP-038-R6 | Browser test `MUPP-038-R1 R6 …` reads the HTML of `/`, `/admin` (a parent who is not master admin) and `/design` and finds none of a made-up phone, email, name or family; code review: `lib/santa.ts` is imported only by `app/admin/page.tsx` and `app/admin/santa-actions.ts` | local | Pass | 2026-11-08 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/santa.test.ts` (13), `lib/form-input.test.ts` (2 new), and `lib/route-checks.test.ts` keeps passing with the new action file | local | Pass | 2026-11-08 |
| Browser tests | `tests/MUPP-038-secret-santa.spec.ts` (3), each with axe where a new state shows; the look in `tests/design.spec.ts` (1: tabs ≥ 44 px, a family of 8 at 320 px, no sideways scroll, axe) | local | Pass | 2026-11-08 |
| Smoke test | Not applicable: admin is behind the second password and nothing visitors see changes | | | |
| Accessibility | axe in the browser tests (tabs, empty tab, the forms with errors, the family of 8 with a form open); keyboard on the tabs (arrows, Home); the manual checklist on the live site: reported tested by hand by the user, screen reader items included (2026-11-09, not recorded item by item) | local, live | Pass (axe); live checklist reported done | 2026-11-08 |
| Security | Security points in the review; `/security-review` run, no finding | local | Pass | 2026-11-08 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-08 |

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (TECH-016) | 163 unit + 103 browser | 177.3 s (browser) | 4.7 s |
| After | 178 unit + 107 browser | 179.0 s (browser), unit 0.3 s | 4.5 s |

Four browser tests and 15 unit tests were added; the browser total is just inside the 180 s budget (+1.7 s, under 25 %), and the new tests take 0.3–2.3 s each. The slowest test is an older one.

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested or has a recorded manual check; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets, total time grown by at most 25 % (or the cause handled), and the new tests follow the quality rules in `wiki/system/testing.md`
- [ ] Deployed, and the smoke tests pass against production (Live tests): not yet, nothing is pushed
- [x] Accessibility (axe passes; the manual checklist on the live site: the user reports the live checklist was tested by hand, including the screen reader items (said by the user, 2026-11-09, not recorded item by item))
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers: everything the change made unused is deleted, no commented-out code or debug output
- [x] Clean code: reuses existing components and helpers; `npm run lint`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board

## Requirements as built

See the card (`gh issue view 135`) for the wording; as built:

- **R1** Two tabs, "Barn" (selected first) and "Secret Santa", for the master admin only; a parent who is not master admin sees no tab and every action is refused on the server.
- **R2** Families: create (1–60 characters), rename, delete after a question; members and people who are in no other family are removed with it.
- **R3** Members: name, phone `07XXXXXXXX` ("Skriv numret som 07XXXXXXXX"), email; one person row, so edits show in every family; removal from one family keeps them in the others and from the last deletes them. Phone and email are both required and the phone is unique (see the solution).
- **R4** A known person is added to another family from "Lägg till känd person".
- **R5** The partner is picked among the other members of the family or "Ingen", is mutual and stored per family.
- **R6** Phone and email are read only by the master admin's Secret Santa tab.

## Notes

- Deviation to note: the card does not say that email is required or that the phone is unique; both were chosen because sign-in (MUPP-039) and mail (TECH-017) depend on them.
