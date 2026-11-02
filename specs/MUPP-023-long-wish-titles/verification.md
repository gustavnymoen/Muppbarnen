---
type: Verification
title: "MUPP-023 Long wish titles wrap and get a maximum length: verification"
description: How each requirement of Long wish titles wrap and get a maximum length was checked, the test suite before and after, and the requirements as built.
feature: MUPP-023
---

# Verification of MUPP-023

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-023-R1 | Browser test `MUPP-023-R1 …` in `tests/MUPP-023-long-wish-titles.spec.ts`: a 60-character and a 120-character word at 375 and 320 px, the arrow inside the list, no sideways scroll of list or page, also in the claim dialog; axe on the list and the dialog. The test fails without the fix (checked) | local | Pass | 2026-11-02 |
| MUPP-023-R2 | Browser test `MUPP-023-R2 …` in `tests/design.spec.ts`: short title 16 px on one line; 120-character title smaller, two lines, cut; whole title in the opened row; axe. Unit test `MUPP-023-R2` in `lib/wishes.test.ts` (24 and 25 characters). Threshold looked at by eye on a screenshot at 375 px | local | Pass | 2026-11-02 |
| MUPP-023-R3 | Unit test `MUPP-023-R3` in `lib/family.test.ts` (60 saved, 61 refused with "Högst 60 tecken."); browser test `MUPP-023-R3 …` (the field stops at 60, the server refuses 61, 60 is saved) | local | Pass | 2026-11-02 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/wishes.test.ts`, `lib/family.test.ts` | local | Pass | 2026-11-02 |
| Browser tests | the three tests above | local | Pass | 2026-11-02 |
| Smoke test | not applicable: none new in the plan | | | |
| Accessibility | axe on the list, the dialog and the opened row; the live checklist is not checked | local | Pass (live: not checked) | 2026-11-02 |
| Security | not applicable: no `/security-review` planned (only a shorter length check in an existing validation); the security points are in the review | local | Pass | 2026-11-02 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-02 |

## Test suite

| | Tests | Total time |
|---|---|---|
| Before (main, TECH-012 run) | 132 unit + 99 browser | about 166 s (MUPP-024) |
| After | 134 unit + 102 browser | 176.7 s (budget 180 s; tests over 5 s are the same three as before) |

## Definition of Done

- [x] Tests: all checks of the test plan done; unit and local browser tests pass
- [x] Test suite: within the budgets (176.7 s, +6 % on 166 s)
- [x] Deployed, and the smoke tests pass against production (Live tests): passed after the merge, 2026-11-02
- [ ] Accessibility: axe passes; the live checklist is not checked (not done)
- [x] Requirements match what was built (below); `solution.md` describes how
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: lint, `lint:docs` and typecheck pass
- [x] Code review done; see [review.md](review.md)
- [x] No larger improvements to add to the board

## Requirements as built

### MUPP-023-R1 A long title wraps inside the row

The site shall wrap a wish title, also a single long word, inside its row, so that the row is never wider than the list.

Acceptance criteria:

- **Given** a wish whose title is one long word of 60 characters (and, for an existing title, 120), **when** the list is open on a 320 px and a 375 px screen, **then** the title is broken onto lines, the row's arrow is inside the list and visible, and the page has no sideways scroll.
- **Given** the same wish is marked and the claim dialog is opened, **then** the title wraps there too, without sideways scroll.

### MUPP-023-R2 At most two lines, smaller text when it wraps

The site shall show a wish title on at most two lines in the row, cut with an ellipsis if it is longer, and in a smaller text size when it is too long for one line. The whole title is shown in the opened row.

Acceptance criteria:

- **Given** an existing title longer than 60 characters, **then** the row shows at most two lines of it with an ellipsis, and the opened row shows the whole title.
- **Given** a short title, **then** it looks as before (one line, normal size).
- **Given** a long title, **then** its text size is smaller than that of a short title.

### MUPP-023-R3 Maximum length of the title is 60

The site shall refuse a title longer than 60 characters, in the form and on the server, as it does for the description (MUPP-018). Titles already saved with more than 60 characters are not changed, but must be shortened when the wish is next edited.

Acceptance criteria:

- **Given** the wish form, **then** the title field stops at 60 characters.
- **Given** a title of 61 characters sent to the server, **then** it is refused with "Högst 60 tecken." and nothing is saved; 60 characters are accepted.

## Notes

- Not checked: a real iPhone and the live accessibility checklist.
- The threshold for the smaller text is 24 characters (written in the card and in `solution.md`).
- Existing titles longer than 60 are not changed; the server refuses them when their wish is saved again, so the administrator shortens them then.
- A line was removed by mistake from another test while working and restored (the Christmas Eve tile's `text-overflow` check, MUPP-013-R3).

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
