---
type: Review
title: "MUPP-041 Secret Santa: the draw: review"
description: "The code review of the Secret Santa draw: findings, decisions and result."
feature: MUPP-041
---

# Code review of MUPP-041

**Result:** Passed
**Date:** 2026-11-10, review run 1
**Summary:** R1 to R7 are met. The draw is pure logic with the platform's secure randomness and an exact fallback; start and stop are one transaction each; nothing that lists events, members or wishes carries a pair.
**Security:** The security points of the review: passed (site session, admin session and `guardWrite()` before every new action, ownership checked on the server by `manageableEvent`, parameterised SQL, event id validated, notices and mails name rules and the event only). `/security-review`: run on the branch, no finding of confidence 8 or more.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `tests/family-db.ts` The helper `santaDraw` sat between a comment and the function it describes. **Done:** moved above that comment.

## Suggestions

- `lib/santa.ts` (`stopDraw`) The rows of the latest year are deleted, not the current year's. **Done:** a comment says why (a draw in December stopped in January).
- `lib/santa.ts` (`thisYear`) The year is the server's local year; around New Year it can differ by time zone. **Done:** left as it is; harmless for a family event, to be remembered when MUPP-044 (yearly cleanup) is built.
- `lib/santa-draw.ts` The random tries and then an exact search are a good pattern and the `shortcut:` comment is correct. **Done:** nothing to change.

## Outside the change

- Deleting the conversations when the draw is stopped (R7) is only a comment in `stopDraw` until MUPP-043 has tables. Not added to the board: it is part of MUPP-043.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
