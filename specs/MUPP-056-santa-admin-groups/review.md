---
type: Review
title: "MUPP-000 Short name of the feature: review"
description: "The code review of Short name of the feature: findings, decisions and result."
feature: MUPP-000
---

# Code review of MUPP-000

**Result:** Passed | Stopped (n must fix)
**Date:** YYYY-MM-DD, review run 1
**Summary:** One or two sentences.
**Security:** The security points of the review: passed, or the findings below. `/security-review`: run, with its result, or not needed and why (see `wiki/system/code-review.md`).

How the review works: `wiki/system/code-review.md`. A later run is added at the top as "Review run 2".

## Must fix

- `file:line` What is wrong and why. **Done:** how it was fixed.

## Should fix

- `file:line` What and why. **Done:** fixed in this change, or added to the board as TECH-00n.

## Suggestions

- `file:line` What could be learned. **Done:** fixed, or left as it is and why.

## Outside the change

- Candidate for the backlog, and whether it was added.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)

# Review of MUPP-056

**Result: Passed.** No must-fix findings. Security: passed (no new action, route, query or personal data; `/security-review` not needed per the card).

## Must fix

None.

## Should fix (done)

- `tests/santa.ts` `eventCard` built a `RegExp` from the name without escaping: fixed.
- `aria-controls` pointed to an id missing from the DOM while closed: dropped (the closed card renders nothing, R4).
- `.claude/launch.json` is untracked and not part of the feature: left out of the commit.

## Suggestions

- The "first render" ref and context in `EventFold.tsx` is hard to follow; it is explained in `solution.md`. The open state is reset if the tab is unmounted, which matches "nothing is stored between visits".
- The tie-break by group name for two groups of one administrator is not unit tested (small, optional).
