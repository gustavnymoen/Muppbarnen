---
type: Verification
title: "MUPP-057 Secret Santa own page cards: verification"
description: How each requirement of the Secret Santa own page cards was checked, the test suite before and after, and the requirements as built.
feature: MUPP-057
---

# Verification of MUPP-057

How each requirement was checked. Browser tests ran locally (a production build, the local test database); nothing is deployed yet, so the live checks are not done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-057-R1 | Browser test `MUPP-051-R2 R6 MUPP-057-R1 R2 R3 R4 R5 …` in `tests/design.spec.ts`: widths and heights of the two cards equal at 375 and 320 px (the grey card is taller because of its note and wraps at 320 px) | local | Pass | 2026-11-10 |
| MUPP-057-R2 | Same test: symbols 18 px, the same distance from their card's left edge, centred in height | local | Pass | 2026-11-10 |
| MUPP-057-R3 | Same test: the text block of each card is centred in the card's height at 375 and 320 px | local | Pass | 2026-11-10 |
| MUPP-057-R4 | Same test: the `::before` of the second row is 1 px, 60 % of the card width, halfway down the gap; in the started state the only row's `::before` has no content, so no divider. The colour is the unchanged `divider-short` colour (not measured again). That a screen reader does not read it follows from it being a pseudo-element (not checked with a screen reader) | local | Pass | 2026-11-10 |
| MUPP-057-R5 | The unchanged MUPP-051 tests and the 44 px check in the same design test pass; axe in the preparing and started state | local | Pass | 2026-11-10 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: no logic; the 284 existing ones pass | local | Pass | 2026-11-10 |
| Browser tests | The existing design test of the own page extended (no new test, no new file) | local | Pass (139) | 2026-11-10 |
| Smoke test | Not applicable: no main page or flow added | – | – | – |
| Accessibility | axe in the preparing and started state; the live checklist (contrast, reflow, focus) not done yet | local | Pass (axe); live not checked | 2026-11-10 |
| Design | Looked at on a 375 and a 320 px phone in a screenshot of the running local build; `/impeccable critique` not run as a separate pass | local | Done | 2026-11-10 |
| Security | Not applicable: no route, action, query or data changes | – | – | – |
| Code review | [review.md](review.md) | local | See review | 2026-11-10 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 139 browser (the same, no test added) | not measured on `main` | not measured |
| After | 284 unit (0.4 s) + 139 browser | 287.9 s (budget 180 s) | 6.9 s (MUPP-038, not touched) |

The suite is over its budget with and without this change; that is TECH-019. The test added about a second at most (one more page load and a few box reads).

## Definition of Done

- [x] Tests: every check in the test plan is done and every requirement has a check; unit and browser tests pass locally
- [ ] Test suite: over budget (287.9 s against 180 s), as before this change (TECH-019); this change added no test
- [ ] Deployed, and the smoke tests pass against production: not yet
- [ ] Accessibility: axe passes; the live checklist is not done yet
- [x] Requirements in the card match what was built, no open questions; copied below; `solution.md` describes how it was built
- [x] Manual, system docs, `DESIGN.md` and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [ ] Code review: see [review.md](review.md)
- [x] Improvements: none found

## Requirements as built

### MUPP-057-R1 Equal cards

The own page shall show its cards at the same width and the same height, the height of the taller one, with a small gap between them.

Acceptance criteria:

- **Given** a participant in a group that is preparing, **when** the own page is opened on a 375 px and on a 320 px wide phone, **then** both cards have the same width and the same height.
- **Given** the grey card has a note and the link card has not, **then** the link card is as tall as the grey one, and the heights stay equal when a heading wraps to two lines.

### MUPP-057-R2 Aligned symbols

The symbol of each card shall be the same size and sit at the same left position inside its card, and be centred in height.

Acceptance criteria:

- **Given** both cards are shown, **when** measured, **then** the symbols are the same size, their left edges are the same distance from the left edge of their cards, and the vertical centre of each symbol is the vertical centre of its card.

### MUPP-057-R3 Text centred in height

The heading of each card (with the note, on the grey card) shall be centred in the height of the card, and stay left-aligned beside the symbol.

Acceptance criteria:

- **Given** both cards are shown, **when** measured, **then** the vertical centre of each card's text block is the vertical centre of its card, so the space above and below it is equal.
- **Given** a small phone (320 px), **when** a heading or the note wraps, **then** the text stays beside the symbol without overlapping it, and both cards are still equal in height (R1).

### MUPP-057-R4 Divider between the cards

The cards shall be separated by the same divider as on the multi-kid birthday card, in the gap between them.

Acceptance criteria:

- **Given** both cards are shown, **when** the page is viewed, **then** a line 1 px thick, 60 % of the card width and centred, in the muted colour at 45 %, sits halfway down the gap between the two cards; it comes from the shared `divider-short` style (reused, not copied) and is not in the page's content, so a screen reader does not announce it.
- **Given** only one card is shown (a started group), **then** no divider is shown.

### MUPP-057-R5 Nothing else changes

The cards shall keep their texts, heading levels, link, press behaviour, focus ring and look (colours, dashed grey card, shadow).

Acceptance criteria:

- **Given** the own page after the change, **then** the existing checks of MUPP-051-R5 and R6 and the 44 px target of the link card (design test) still pass unchanged, and axe finds no violation in the preparing and the started state.

## Notes

Found while testing: the link card's symbol sat 16 px further in than the grey card's because `p-4` of `Card` won over `p-0` (see the solution). The generated folder `.next/dev/types` was stale (it pointed at a deleted page) and made the build fail its type check; it is not in Git and was deleted. The full suite (139 tests) passed before the last test edit; after it the changed test passed on its own with its own `HOME` and port, since another worktree's test run shared the database and made two runs fail.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
