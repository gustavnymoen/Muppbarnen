---
type: Verification
title: "MUPP-026 Menu hidden after refresh on a phone: verification"
description: How each requirement of MUPP-026 was checked, the test suite, and the requirements as built.
feature: MUPP-026
---

# Verification of MUPP-026

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-026-R1 | Test `MUPP-026-R1 …` in `tests/MUPP-026-menu-after-refresh.spec.ts` (menu inside the viewport after a reload with a leftover scroll, axe). It also passes without the fix in desktop Chrome, so it only guards against regression | local | Pass | 2026-11-02 |
| MUPP-026-R1 | Manual on an iPhone 17 in Chrome (the cause may exist only in the real browser bar) | live | Pass (by the user, not recorded per check) | 2026-11-12 |
| MUPP-026-R2 | Test `MUPP-026-R2 …` (no document scroll, `overscroll-behavior: none`, content scrolls to its end); fails without the fix | local | Pass | 2026-11-02 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `npm run test:unit`, 134 pass | local | Pass | 2026-11-02 |
| Browser tests | The two tests above; whole suite run on port 3126 (3100 was in use) | local | Pass (44 passed; 7 tests of MUPP-022/023 flaky while the machine was busy, pass alone) | 2026-11-02 |
| Smoke test | None new | not applicable | Not applicable | 2026-11-02 |
| Accessibility | axe in the R1 test with the menu open | local | Pass | 2026-11-02 |
| Security | Security points in the review; `/security-review` not needed (CSS only) | local | Pass | 2026-11-02 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-02 |

## Test suite

`npm run test:time` could not run (port 3100 taken by another session), so the browser suite was run directly on port 3126, while other work loaded the machine.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | not measured | not measured | not measured |
| After | 44 browser + 134 unit | 30.4 min browser (loaded machine, not comparable) | not measured |

## Definition of Done

- [x] Tests: manual iPhone check: the user tested on a phone at each merge and reports it fine (2026-11-12); not recorded per check; Live tests passed on the merge commit
- [ ] Test suite: time comparison not measured (see above)
- [x] Deployed, and the smoke tests pass against production (Live tests): the run on the merge commit bb86c82 passed (2026-11-02)
- [x] Accessibility: axe on the menu at phone width
- [x] Requirements match what was built, copied below
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: lint, typecheck and build pass
- [x] Code review done, no must-fix findings; see [review.md](review.md)
- [x] No larger improvements noticed

## Requirements as built

### MUPP-026-R1 The menu is reachable after a refresh

After a reload the page is shown from its top: the menu button is fully visible and can be tapped (the document cannot be scrolled out of place).

### MUPP-026-R2 The page itself does not scroll on a phone

The document does not scroll or bounce (`overflow: hidden` on `html` for pages with `Page`, `overscroll-behavior: none`); long content scrolls inside `PageContent`. Pull-down-to-refresh no longer works, as accepted on the card.

## Notes

The cause was not reproduced; the fix removes the way the document could end up shifted.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
