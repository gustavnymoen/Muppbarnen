---
type: Solution
title: "TECH-010 Flaky picture thumbnail in MUPP-010-R4: solution"
description: "How the thumbnail flake in MUPP-010-R4 was looked for under load, and why nothing was changed when it could not be reproduced."
feature: TECH-010
card: "#54"
depends_on: [TECH-009]
---

# TECH-010 Flaky picture thumbnail in MUPP-010-R4: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 54`.

## Data

None.

## Interface

None. Neither the site nor the test changed.

## Decisions

- **Looked for on the old and the new code.** In TECH-009 (2026-10-30) `MUPP-010-R4` failed at `expect(img[src="/bilder/1"]).toBeVisible()` after "Spara bild", in two of four runs under load (since MUPP-024 the selector is `img[src^="/bilder/${kidId}?v="]`, `tests/MUPP-010-compact-admin.spec.ts`). Since then the picture code changed three times: TECH-011 (an ETag on `/bilder/[id]`), TECH-012 (uploads shrunk to WebP with sharp) and MUPP-024 (a version in the address, `/bilder/<id>?v=…`, cached by the browser). So the failure was looked for on three commits, each with `MUPP-010-compact-admin.spec.ts --repeat-each 20` while 12 `yes` processes kept the 10 CPUs busy (the load in TECH-009):

  | Code | Runs of the file | Tests | `MUPP-010-R4` failed |
  |---|---|---|---|
  | `c70e674` (current `main`) | 1 | 160 passed | 0 of 20 |
  | `5c35a28` (just before MUPP-024) | 1 | 160 passed | 0 of 20 |
  | `ec4de06` (TECH-009, where it failed) | 2 | 320 passed | 0 of 40 |

  640 tests, 80 runs of `MUPP-010-R4`, no failure, so there is no trace of a late step.
- **Nothing changed without a cause (R2).** A longer timeout or a wait would hide a cause that isn't known, against the quality rules in `wiki/system/testing.md`. Decided with the user (2026-11-03): with the failure not reproduced, the test and the site stay as they are, and the card's R1 and R2 were reworded to say so. The `img` has a fixed width and height (`Avatar`), so `toBeVisible` doesn't wait for the picture to load, only for the re-render after the server action; a slow re-render under load on the machine of that day is the likeliest explanation, but it is not shown.
- **The proof is R3.** The four spec files of TECH-009 run 20 times each under the same load, three runs in a row, without a failure (see [Verification](verification.md)). Should the test fail again, the trace that `npm run test:local` keeps on failure (`test-results/`) shows the late step; that is where to start.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Testing](../../wiki/system/testing.md) (how to look for a flake).
- Where the flake was found: [TECH-009](../TECH-009-settled-boxes-in-feature-tests/solution.md).

[Specifications](../index.md)
