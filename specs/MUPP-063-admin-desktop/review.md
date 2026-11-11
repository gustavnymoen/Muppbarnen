---
type: Review
title: "MUPP-063 Admin page layout on desktop: review"
description: "The code review of the admin Barn tab layout: findings, decisions and result."
feature: MUPP-063
---

# Code review of MUPP-063

**Result:** Passed
**Date:** 2026-11-11, review run 1
**Summary:** The Barn tab is one `max-w-2xl` column with one card per row, and `SlimCard` got an opt-in `nowrap` prop so a child's name is cut with an ellipsis instead of being split. R1, R2 and R3 are met and covered by assertions in the existing admin design test. No must-fix findings.
**Security:** The security points passed: layout only, no route, action, query, cookie, input or personal-data change, and the sign-in check of the Barn tab is unchanged. `/security-review` not needed (layout only).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `specs/features.md` MUPP-063 was listed above MUPP-062. **Done:** the two rows are swapped.

## Suggestions

- `tests/design.spec.ts` The admin test now holds R1 to R3 and the MUPP-053 checks in one body. **Done:** left as it is: it saves page loads, and each block has a comment per requirement.
- `app/components/SlimCard.tsx` With `nowrap` the title sits in a `truncate` span inside a container with `break-words`. **Done:** a one-line comment says that `truncate` wins.

## Outside the change

- `/admin/barn/[id]/onskelistor` uses the full 72 rem page frame, not `max-w-2xl`. The card and `solution.md` leave it as it is on purpose; it is a candidate if the admin pages should share one width. Not added to the board.
- The 320 px no-sideways-scroll check is asserted for the long name; the 375 px case is covered by the MUPP-053 checks in the same test.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
