---
type: Verification
title: "MUPP-037 Clean close motion of the wish list: verification"
description: How each requirement of Clean close motion of the wish list was checked, the test suite before and after, and the requirements as built.
feature: MUPP-037
---

# Verification of MUPP-037

How each requirement was checked.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-037-R1 | Tests `MUPP-037-R1 on a single-kid card …`, `… on a card with several kids …` and `… on the Christmas card …` in `tests/MUPP-037-close-motion-surface.spec.ts`: after the close every direct child of the copy has an opacity animation of at most 100 ms, and the copy is removed at the end. The test also checks that the content ends fully transparent. Interrupting the motion and reduced motion (no copy) are tested by MUPP-022-R1, MUPP-016-R6, MUPP-016-R5 and MUPP-029-R3, which still pass | local | Pass | 2026-11-04 |
| MUPP-037-R2 | Manual: the user tried A and B in the iOS simulator and on desktop, found them almost identical and chose A (the motion is a feeling that can't be measured) | local (iOS simulator) | Pass | 2026-11-04 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | None: nothing to test outside the browser; `npm run test:unit`: 163 passed | local | Pass | 2026-11-04 |
| Browser tests | `tests/MUPP-037-close-motion-surface.spec.ts` (2 tests); the MUPP-016, -022, -029 tests pass unchanged | local | Pass | 2026-11-04 |
| Smoke test | Not applicable: no page or flow is added or changed | – | Not applicable | 2026-11-04 |
| Accessibility | The copy stays `inert` and `aria-hidden` (unchanged); the closed state is checked by axe in the MUPP-029 test. The checklist on the live site: reported tested by hand by the user, screen reader items included (2026-11-09, not recorded item by item) | local, live | Pass (live checklist reported done) | 2026-11-04 |
| Security | Not needed: presentation only | – | Not applicable | 2026-11-04 |
| Code review | [review.md](review.md) | local | See review.md | 2026-11-04 |

## Test suite

`npm run test:time` before and after the change.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (`main`) | 163 unit + 100 browser | not measured | – |
| After, run 1 (with a third test) | 163 unit + 103 browser | 170.6 s | 4.5 s |
| After, run 2 (final) | 163 unit + 102 browser | 173.7 s | not noted |

The two new tests add about 2.5 s. The total is under the 180 s budget but 3.7 s over the 170 s goal; the before time was not measured on this machine, and the first run (with a third test) was 170.6 s, so the difference is mostly run-to-run noise. Not handled further here.

## Definition of Done

- [ ] Deployed, and the smoke tests pass against production (Live tests): after the merge
- [x] Accessibility checklist on the live site: the user reports the live checklist was tested by hand, including the screen reader items (said by the user, 2026-11-09, not recorded item by item)

## Requirements as built

### MUPP-037-R1 Only a plain surface folds into the button

The site shall, when a wish list is closed, show no wish rows, checkboxes, names, pictures or buttons in the motion; only a surface (the colour and edge of the list or kid view) folds into the "Önskelista" button, fading on the way, in no more than 300 ms. As built: the content of the copy fades out in 100 ms and the surface folds in 300 ms (variant A).

### MUPP-037-R2 The motion is decided on a phone

Variant A was chosen by the user after trying A and B (in the simulator and on desktop rather than on a phone).

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
