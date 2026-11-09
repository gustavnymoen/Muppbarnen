---
type: Review
title: "MUPP-049 Menu names and order: review"
description: "Code review of MUPP-049: passed, no must-fix findings."
feature: MUPP-049
---

# Review of MUPP-049

**Result:** Passed (0 must fix)

Menu names, order and dialog name match R1-R3 in code, tests, wiki and manual. The grep for the old words "Så funkar sajten" and the entry "Start" is clean (older specs and log lines keep the words they were built with).

## Security

Passed. Words and order only: no route, action, query, cookie or data change. `/security-review` is not needed (the card says Security: none).

## Must fix

None.

## Should fix

- A test title in `tests/design.spec.ts` was changed by mistake by a find-and-replace. **Done:** reverted.
- `verification.md` said "211 existing tests" next to a suite of 121. **Done:** it now says unit tests.
- A test found the dialog entry by position; **Done:** it finds it by name.

## Outside the change

None for the backlog.

[Specifications](../index.md)
