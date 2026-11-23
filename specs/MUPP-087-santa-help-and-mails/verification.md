---
type: Verification
title: "MUPP-087 Secret Santa help sections and mail texts: verification"
description: How each requirement of the Secret Santa help sections and mail 3 text was checked, the test suite before and after, and the requirements as built.
feature: MUPP-087
---

# Verification of MUPP-087

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-087-R1 | Test `MUPP-087-R1 R2 R3 …` in `tests/MUPP-086-help-texts.spec.ts`: the headings and paragraphs of "Deltagare" equal the approved texts, no list items | local | Pass | 2026-11-23 |
| MUPP-087-R2 | Same test for "Admin" | local | Pass | 2026-11-23 |
| MUPP-087-R3 | Same test: equal `offsetHeight` on the tabs; axe on both panels; the existing dialog test in `design.spec.ts` (MUPP-050-R4) still passes | local | Pass | 2026-11-23 |
| MUPP-087-R4 | Manual: screenshots at 375 px of Deltagare and Admin (headings like "Barnens listor") shown to the user; the user approved the look | local | Pass (approved by the user) | 2026-11-23 |
| MUPP-087-R5 | Unit test `mail 3` in `lib/santa-mail.test.ts` (exact text, with and without amount) | local | Pass | 2026-11-23 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/santa-mail.test.ts` updated for mail 3 (441 pass) | local | Pass | 2026-11-23 |
| Browser tests | The R3 test of `MUPP-086-help-texts.spec.ts` rewritten as the MUPP-087 test; `MUPP-050-santa-help` counts updated; the spacing check of the old sections removed from `design.spec.ts`; no new test | local | Pass | 2026-11-23 |
| Smoke test | Not applicable: no new page or flow | - | - | - |
| Accessibility | axe in the test above; the live checklist is not done | local | Not checked live | 2026-11-23 |
| Security | Not applicable: static texts; mail 3 still holds no member name, wish or message | - | - | - |
| Code review | [review.md](review.md) | local | Passed | 2026-11-23 |

## Test suite

`npm run test:time`: 441 unit and 188 browser tests, all pass.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (main, MUPP-086) | 441 unit, 188 browser | 357.2 s | 7.4 s |
| After | 441 unit, 188 browser | 356.4 s (6.4 s over the 350 s budget) | 7.7 s |

No test was added, so the feature's own tests added 0 s. The suite was already over its budget; handled by [TECH-030](https://github.com/gustavnymoen/Muppbarnen/issues/301). The Next.js security stop on every other build is [TECH-031](https://github.com/gustavnymoen/Muppbarnen/issues/302).

## Definition of Done

- [x] Tests: every requirement is tested or has a recorded manual check; unit tests and the affected browser tests pass
- [ ] Test suite: 6.4 s over the time budget, handled by TECH-030 (see above)
- [ ] Deployed, and the smoke tests pass against production (Live tests): after the merge
- [ ] Accessibility: axe passes; the live checklist is not checked
- [ ] Requirements in the card match what was built, no open questions left; copied below
- [x] Manual, system docs and `wiki/log.md` updated (the manual describes no part of these texts)
- [x] No leftovers: the `sections` field and its markup, and the old spacing check, are deleted
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Larger improvements added to the board: none new (TECH-030, TECH-031 exist)

## Requirements as built

See the card `gh issue view 305` (R1–R5); the texts are in `app/components/OnboardingDialog.tsx` and `lib/santa-mail.ts`, and word for word in the tests.

## Notes

- The first run of `npx playwright test` without `BASE_URL` ran against the live site, not the local build; the checks above are from the runs with `BASE_URL=http://localhost:3100`.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
