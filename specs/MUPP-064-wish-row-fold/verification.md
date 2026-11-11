---
type: Verification
title: "MUPP-064 Wish rows fold out consistently: verification"
description: How each requirement of the consistent wish rows was checked, the test suite before and after, and the requirements as built.
feature: MUPP-064
---

# Verification of MUPP-064

Everything ran locally (a production build, the local test database), 2026-11-11. The live checks (smoke tests, accessibility checklist, how a screen reader reads "Storlek: –") are not done yet: they follow the deploy.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-064-R1 | Tests `MUPP-005-R1 … MUPP-064-R1 R2 R3 R4` (a title-only wish unfolds and folds, `aria-expanded`), `MUPP-042-R1 R2 MUPP-062-R2 MUPP-064-R1 R2 R3` (match page) and the design test `MUPP-051-R2 … MUPP-064-R1 …` (title-only row at least 56 px, unfolds) | local | Pass | 2026-11-11 |
| MUPP-064-R2 | The same tests: both lines read "Beskrivning: –" and "Storlek: –" for title-only wishes (children's list and match page) and for a wish with only a link (match page), values and bold labels as before for a full wish (`MUPP-019-R1 …` too); the design test checks the dash colour on the match page. A wish with only a size or only a description is not tested separately: the code is one `||` per line, the same for both | local | Pass | 2026-11-11 |
| MUPP-064-R3 | The children's list test (non-http(s) address gives no link, title-only none) and the match page test (title-only and "Farlig länk" have no link) | local | Pass | 2026-11-11 |
| MUPP-064-R4 | Test `MUPP-005-R1 …` ("Paxad av Moster Lisa 2026-01-15"), `MUPP-019-R1 …` and the match page test (no claim parts) | local | Pass | 2026-11-11 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: no logic outside the component changed; the 354 existing unit tests pass | local | Pass | 2026-11-11 |
| Browser tests | The three feature tests above and `MUPP-019-R1 …` updated; one failed first (a second click folded a row that was now open) and was fixed | local | Pass | 2026-11-11 |
| Look check | In `tests/design.spec.ts`, match page only: dash colour, title-only row at least 56 px. The 44 px title-only row on the children's list is not checked separately (the row code is shared and unchanged in height) | local | Pass | 2026-11-11 |
| Smoke test | Not applicable: no main page or flow added | – | – | – |
| Accessibility | axe in the unfolded state on the match page (light and dark) and the children's list; the live checklist and the screen reader reading of the dash: not checked | local | Pass (live not checked) | 2026-11-11 |
| Security | Not applicable: no route, action, query or data change | – | – | – |
| Code review | [review.md](review.md) | local | Passed | 2026-11-11 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 354 unit + 154 browser, 315.1 s (MUPP-063) | – | 7.2 s |
| After | 354 unit + 154 browser | 318.6 s (budget 180 s) | 7.1 s |

Over budget with and without this change (TECH-019). No test and no page load were added; existing tests got a few assertions.

## Definition of Done

- [x] Tests: every requirement has a test; `npm run test:unit` and `npm run test:local` pass (one test was fixed and re-run alone)
- [ ] Test suite: over budget before this change (TECH-019); nothing added here
- [ ] Deployed, and the smoke tests pass against production (Live tests): after the merge
- [ ] Accessibility: axe passes locally; the live checklist and the dash check after the deploy
- [x] Requirements in the card match what was built (copied below)
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers (the draft page and `proxy.ts` edit used to choose the variant were removed)
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review: passed, see [review.md](review.md)
- [x] Technical tasks: none noticed

## Requirements as built

- **MUPP-064-R1:** every wish row on a child's list and on the match page has a chevron and folds out and in, whatever the wish contains.
- **MUPP-064-R2:** the unfolded row always shows "Beskrivning:" and "Storlek:", with "–" for a value that is not filled in.
- **MUPP-064-R3:** "Länk till presenten" shows only for an http(s) address, with no heading or dash.
- **MUPP-064-R4:** "Paxad av …" and everything else about claiming is as before; the match page has no claim parts.
