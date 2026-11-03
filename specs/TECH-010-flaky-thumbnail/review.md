---
type: Review
title: "TECH-010 Flaky picture thumbnail in MUPP-010-R4: review"
description: "The code review of the thumbnail flake card: findings, decisions and result."
feature: TECH-010
---

# Code review of TECH-010

**Result:** Passed
**Date:** 2026-11-03, review run 1
**Summary:** Documentation only: no test or site code changed, as the reworded R2 requires when the failure isn't reproduced. R1 and R3 are recorded with run counts that add up, and the MUPP-029 and MUPP-030 leftovers agree with the board and the earlier records.
**Security:** Passed: no code, routes, queries, cookies or personal data are touched. `/security-review`: not needed (card, and nothing to review).

How the review works: `wiki/system/code-review.md`. A later run is added at the top as "Review run 2".

## Must fix

None.

## Should fix

None.

## Suggestions

- `wiki/system/testing.md:101` The new sentence made this card's decision a rule for every flake. **Done:** reworded as an example of how to look for a flake, linking to this card; the rule itself ("fixed, never retried or skipped") is unchanged.
- `specs/TECH-010-flaky-thumbnail/verification.md` The Definition of Done item on technical tasks pointed to TECH-013's crowding, which this work didn't find. **Done:** it says none were noticed; the TECH-013 note stays under Notes.
- `specs/TECH-010-flaky-thumbnail/solution.md` The failing selector was quoted as it was at the time. **Done:** added that it changed with MUPP-024, and to what.

## Outside the change

- MUPP-030's accessibility checklist on the live site is not checked yet (its Definition of Done item is unticked, though the card is Done). Left to the user; recorded in MUPP-030's `verification.md`.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
