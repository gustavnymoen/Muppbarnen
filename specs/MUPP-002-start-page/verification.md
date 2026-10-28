---
type: Verification
title: "MUPP-002 Start page: verification"
description: How each requirement of Start page was checked, the test suite before and after, and the requirements as built.
feature: MUPP-002
---

# Verification of MUPP-002

Tests: `tests/MUPP-002-start-page.spec.ts`; the look (header without border, reduced motion) in `tests/design.spec.ts`. Everything below was checked locally on 2026-10-27. After the merge the smoke tests (Live tests) passed against the live site; the manual accessibility checklist on the live site was not done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-002-R1 | Tests `MUPP-002-R1 R2 R4 …` (name as the one `h1` and a link to `/`, title), `MUPP-002-R1 R3 R4 …` (header stays while `main` scrolls) and `MUPP-002-R1 R3 the start page: a header without border …` in `design.spec.ts` | local | Pass | 2026-10-27 |
| MUPP-002-R2 | Test `MUPP-002-R1 R2 R4 header, menu and a11y on a phone`: button name, 44 × 44 px, `aria-expanded`, Escape, outside click, Admin does nothing, Start, keyboard with Tab, focus return and visible focus, only two links on the page | local | Pass | 2026-10-27 |
| MUPP-002-R3 | Tests `MUPP-002-R1 R3 R4 …` (card peeks, arrow keys snap one card at a time, one highlighted, "Exempel", group with name reached by focus), `MUPP-002-R3 R4 …` (desktop shows all three), reduced motion in `design.spec.ts` | local | Pass | 2026-10-27 |
| MUPP-002-R4 | The same tests at 390 × 844 and 320 × 568 (no sideways scroll, menu inside the screen), axe on the page, with the menu open, at 320 px and on a desktop; the old start-page tests updated to the new name (`TECH-001-R4`, smoke) | local | Pass | 2026-10-27 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: no logic beyond the components. The existing 24 pass. | local | Pass | 2026-10-27 |
| Browser tests | The three tests and the look test above | local | Pass | 2026-10-27 |
| Smoke test | `TECH-001-R4 @smoke` updated to the new heading | local, preview, live | Pass | 2026-10-27 |
| Accessibility | axe in the tests; the manual checklist (keyboard, VoiceOver, 200 % zoom, text spacing, reduced motion) on the live site | local; live checklist: not done | axe: Pass; checklist: not checked, left out on purpose (see Notes) | 2026-10-27 |
| Security | Not needed: no sign-in, admin, API, database or personal data | | Not applicable | 2026-10-27 |
| Code review | [review.md](review.md) | local | See review.md | 2026-10-27 |

## Test suite

`npm run test:time`. "Before" is the same suite without the four new tests, found by subtracting their time from the run, not from a separate run.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 6 browser, 24 unit | about 2.8 s | 1.0 s |
| After | 10 browser, 24 unit | 6.6 s | 1.9 s |

The time grew by more than 25 % because the suite is still tiny (three new browser tests of about 4 s in all); it is far inside the budgets (3 min, 5 s per test).

## Definition of Done

- [x] Tests: every check in the card's test plan is done (the accessibility checklist on the live site is not, see Notes); every requirement is tested; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets; the 25 % growth is explained above; the new tests follow the quality rules
- [x] Deployed, and the smoke tests pass against production (Live tests)
- [x] Accessibility: axe passes in every changed state; the manual checklist items on the live site were not checked, by choice of the owner (see Notes)
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/startsidan.md`), system docs (`wiki/system/start-page.md`) and `wiki/log.md` updated
- [x] No leftovers: the old placeholder page is replaced; no commented-out code or debug output
- [x] Clean code: reuses `Page`, `Card`, `Avatar`, `Chip`, `IconButton`; `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way: none

## Requirements as built

As on the card (`gh issue view 8`), with these details of how they were met:

- **MUPP-002-R1 Header:** the name is the `h1` and a link on the start page, a plain paragraph with a link on other pages (`<Page home>`); no border or shadow; it sits outside the scrolling region.
- **MUPP-002-R2 Menu:** a button "Meny" with `aria-expanded` and a `nav` ("Huvudmeny") with the link "Start" and the button "Admin"; Escape, a choice, a click outside and Tab out of the menu close it.
- **MUPP-002-R3 Example cards:** three made-up cards (Alma, Otto, Vera) marked "Exempel" in a group named "Barnens kort, exempel"; Otto's is highlighted; 85 % wide on a phone, a third of the row from 640 px.
- **MUPP-002-R4 Mobile first and accessibility:** checked from 320 × 568 to 1280 × 800; axe passes with the landmarks `header`, `nav` and `main`; the old start-page tests are updated.

## Notes

- **MUPP-004** replaced the example cards: the R3 tests of the carousel row (`Barnens kort, exempel`) were removed from `tests/MUPP-002-start-page.spec.ts` and `tests/design.spec.ts`; the header, menu and 320 px checks remain.

- **The manual accessibility checklist on the live site was left out on purpose** (decided by the owner, 2026-10-27). Not checked: VoiceOver, real touch swiping on a phone, Safari, 200 % zoom and text spacing by hand. What axe and the Chromium tests cover (keyboard, focus, 320 px, reduced motion, target sizes) is recorded above.
- `specs/features.md` listed MUPP-001 as Ongoing although it is merged; it was set to Done here.
- The row has `tabIndex={0}`, which axe requires for a scrollable region; the focus ring shows on the whole row.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
