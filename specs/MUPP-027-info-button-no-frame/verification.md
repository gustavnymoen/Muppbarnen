---
type: Verification
title: "MUPP-027 Info button without a frame: verification"
description: How each requirement of Info button without a frame was checked, the test suite before and after, and the requirements as built.
feature: MUPP-027
---

# Verification of MUPP-027

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-027-R1 | Browser test `MUPP-027-R1 R2 R3 …` in `tests/design.spec.ts`: border width 0, no shadow, transparent background at rest, contrast of the icon at least 4.5:1 | local | Pass | 2026-11-02 |
| MUPP-027-R2 | Same test: 44 × 44 px target centred in the checkbox column (existing MUPP-019 check), 3 px focus ring after keyboard focus | local | Pass | 2026-11-02 |
| MUPP-027-R3 | Same test: background is the `edge` colour while hovered, no shadow, rounded, and the button has not moved. The pressed state is checked with the mouse held down. The tint uses no motion, so reduced motion is the same (code review) | local | Pass | 2026-11-02 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | not applicable: no logic | | | |
| Browser tests | the test above; `tests/MUPP-019-wish-row.spec.ts` passes unchanged | local | Pass | 2026-11-02 |
| Smoke test | not applicable: no page or flow added or changed | | | |
| Accessibility | axe in the existing MUPP-019 test (list with the bubble shown); the live checklist reported tested by hand by the user, screen reader items included (2026-11-09, not recorded item by item) | local, live | Pass (axe); live checklist reported done | 2026-11-02 |
| Security | not applicable: no sign-in, API, data or server code | | | |
| Code review | [review.md](review.md) | local | Passed | 2026-11-02 |

## Test suite

| | Tests | Total time |
|---|---|---|
| Before (MUPP-023) | 134 unit + 102 browser | 176.7 s |
| After | 134 unit + 102 browser | 176.6 s (budget 180 s; the tests over 5 s are existing ones) |

## Definition of Done

- [x] Tests: all checks of the test plan done; unit and local browser tests pass
- [x] Test suite: within the budgets (no test added, one extended)
- [x] Deployed, and the smoke tests pass against production (Live tests): passed after the merge, 2026-11-02
- [x] Accessibility: axe passes; the live checklist in `wiki/system/accessibility.md`: the user reports the live checklist was tested by hand, including the screen reader items (said by the user, 2026-11-09, not recorded item by item)
- [x] Requirements match what was built (below); `solution.md` describes how
- [x] Manual (no change: it does not describe the frame), system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: lint, `lint:docs`, typecheck and build pass
- [x] Code review done; see [review.md](review.md)
- [x] No larger improvements to add to the board

## Requirements as built

### MUPP-027-R1 The info button has no frame

The site shows the info button as the icon alone: no border, no shadow and no background while resting. The icon keeps its size and its text colour (contrast at least 4.5:1).

### MUPP-027-R2 The target and the focus ring are unchanged

The info button stays a target of at least 44 × 44 px, centred in the checkbox column of the row, and shows the site's focus ring when focused with the keyboard.

### MUPP-027-R3 Tint on hover and press

While hovered or pressed the button shows a soft round tint (the `edge` colour) and nothing else: no movement, no shadow. The tint does not depend on motion.

## Notes

The test measures the button just before and after the hover, because keyboard focus scrolls the list.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
