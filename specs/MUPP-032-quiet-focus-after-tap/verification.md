---
type: Verification
title: "MUPP-032 No focus ring after a tap: verification"
description: How each requirement of No focus ring after a tap was checked, the test suite before and after, and the requirements as built.
feature: MUPP-032
---

# Verification of MUPP-032

How each requirement was checked. The fault only shows in WebKit on a phone, so the main tests run with `npm run test:webkit` (local only, WebKit is not installed in CI).

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-032-R1 | WebKit tests `MUPP-032-R1 Ta bort paxningen / Paxa / Storlekar …` in `tests/MUPP-032-quiet-focus-after-tap.webkit.spec.ts`: after a tap the first control (Avbryt, the name field, Stäng) has no outline, and after a tap on Avbryt or Stäng the element that gets the focus has none. The four tests fail without the CSS rule (tried) and pass with it. Kid's view closed by tap: `MUPP-022-R2 …` (now checks `data-pointer` on `<html>`); the name field after a tap in `tests/design.spec.ts` (`MUPP-005-R1 …`). WebKit test `MUPP-032-R1 a claim by tap …` (the close button that gets the focus after a claim has no outline) | local | Pass | 2026-11-03 |
| MUPP-032-R2 | WebKit tests `MUPP-032-R2 … the ring after a key, and the focus is where it was` for the three dialogs (Enter opens: ring on the first control; Esc closes: ring on the element that gets the focus) and `MUPP-032-R2 a tap followed by Tab …` (a tap, then a key, then the name field has the ring). Focus order is unchanged because no focus code changed (the only code removed from `BirthdayDeck.tsx` is the ring marking); the existing focus tests in the normal suite pass | local | Pass | 2026-11-03 |
| Real phone | On the user's iPhone on the live site (tapping the dialogs): checked by the user (reported 2026-11-03): it looks good; no per-item results were given | live | Pass (reported) | 2026-11-03 |
| Keyboard on desktop | Closed on the user's instruction (2026-11-03): the keyboard check (desktop Safari and Chrome, checklist items 1 and 2 on the live site) is the user's to do; not checked by Claude. On 2026-11-09 the user reported tested by hand by the user, screen reader items included (2026-11-09, not recorded item by item) | live | Reported done by the user | 2026-11-03 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable (no logic outside the browser); `npm run test:unit` 162 passed | local | Pass | 2026-11-03 |
| Browser tests | `tests/MUPP-032-quiet-focus-after-tap.webkit.spec.ts` (10 tests, `npm run test:webkit`, all pass); the normal suite with `npm run test:time`: 114 passed. `MUPP-022-R2` and `design.spec.ts` adapted to the new rule | local | Pass | 2026-11-03 |
| Smoke test | Not applicable: no new page or flow (the card's plan names none) | | | |
| Accessibility | axe on the open dialogs is in the existing tests of MUPP-005, MUPP-006 and MUPP-014 and passes. On the live site, on the phone: checked by the user (reported 2026-11-03) (no per-item results). With a keyboard (checklist items 1 and 2): closed on the user's instruction (2026-11-03); on 2026-11-09 the user reported tested by hand by the user, screen reader items included (2026-11-09, not recorded item by item) | local, live | Pass (axe); live checks reported done | 2026-11-03 |
| Security | Not needed: CSS and a client component with two listeners (the card's plan) | | | |
| Code review | [review.md](review.md) | local | Passed | 2026-11-03 |

## Test suite

`npm run test:time` before (MUPP-007's after, the same `main`) and after the change.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 162 unit + 114 browser | 176.3 s | 4.5 s |
| After | 162 unit + 114 browser | 177.5 s | 4.5 s |

The ten new tests are WebKit tests and are not in this run (the normal suite is Chromium). Run `npm run test:webkit` for them (about 17 s together with the MUPP-025 ones).

## Definition of Done

- [x] Tests: every check in the card's test plan is done, except the live checks below; every requirement is tested; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets (177.5 s of 180 s), no growth, and the new tests follow the quality rules in `wiki/system/testing.md`
- [x] Deployed, and the smoke tests pass against production (Live tests): run 41714617055 on `main` at the merge commit `24799d3` succeeded (2026-11-03)
- [x] Accessibility: axe passes; the phone check on the live site is checked by the user (reported 2026-11-03); the keyboard check (desktop Safari and Chrome, checklist items 1 and 2) was closed on the user's instruction (2026-11-03); on 2026-11-09 the user reported tested by hand by the user, screen reader items included (2026-11-09, not recorded item by item)
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual, system docs and `wiki/log.md` updated: the manual (`wiki/manual/`) has nothing to change, since nothing a visitor does is different; `wiki/system/accessibility.md`, `start-page.md` and the log are updated
- [x] No leftovers: MUPP-022's `data-quiet-focus` code and style are removed
- [x] Clean code: one component and one CSS rule instead of a mark per element; `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks: none noticed

## Requirements as built

### MUPP-032-R1 No ring after a tap or click

The site shall not show the focus ring on an element that got the focus during or right after pointer or touch use (a tap or click, or a dialog opened or closed by one).

- A dialog opened by a tap (Ta bort paxningen, Paxa, Storlekar): its focused first control has no outline, including the name field in Paxa.
- That dialog closed by tapping Avbryt or Stäng: the element that gets the focus (for example the "Önskningar" box) has no outline.
- A claim or unclaim done by tap: the wish list's close button that gets the focus has no outline.
- A kid's view closed by tap (MUPP-022-R2): the tile has no outline as before.

### MUPP-032-R2 Keyboard users keep the ring

The site shall show the focus ring as before as soon as the keyboard is used, and the focus shall move exactly as before (WCAG 2.4.3, 2.4.7, 2.4.11).

- A dialog opened with Enter or Space: its first control has the ring; closed with Esc or Enter on Avbryt: the element that gets the focus has the ring.
- A tap followed by Tab: the newly focused element has the ring.
- In any of the cases in R1, `document.activeElement` is the same element as before the change.

## Notes

- In WebKit, Tab skips buttons (as in Safari), so the "tap then Tab" test goes out of the name field and back with Shift+Tab and Tab.
- Text fields lose the ring after a tap too (the user's decision on the card); typing a key shows it.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
