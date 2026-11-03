---
type: Review
title: "MUPP-034 Cross on single-kid wish list: review"
description: "The code review of Cross on single-kid wish list: findings, decisions and result."
feature: MUPP-034
---

# Code review of MUPP-034

**Result:** Passed
**Date:** 2026-11-03, review run 1 (stopped on 1 must fix, fixed in the same run)
**Summary:** The change is minimal and correct: the icon branch became `<CrossIcon />`, the name is kept, and `ChevronUpIcon` is still used by `WishRow`.
**Security:** Passed: presentation only, no sign-in, input, query, cookie, secret or personal-data code touched. `/security-review` not needed (card).

How the review works: `wiki/system/code-review.md`.

## Must fix

- `DESIGN.md:66` Still described the arrow up. **Done:** now "a cross on every card (MUPP-034)".

## Should fix

- `specs/features.md` Six unrelated statuses (MUPP-002 and others) had changed from Ongoing to Done, and MUPP-034 was listed as Done. **Done:** the file was restored and only the MUPP-034 line (Ongoing until the merge) was added.
- `app/components/WishList.tsx:46` The comment line was long and mixed two sentences. **Done:** split over two lines.
- `tests/design.spec.ts` The new assertion hard-coded the path of the cross. **Done:** the single-kid button's path is saved and the twins' card is checked against it, so the test shows "the same cross everywhere" without the literal path.

## Suggestions

- The same comparison on the twins' card (above). **Done.**

## Outside the change

- `.claude/launch.json` is untracked and not part of the feature; it is not committed.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
