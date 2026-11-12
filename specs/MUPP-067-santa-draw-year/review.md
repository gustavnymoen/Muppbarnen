---
type: Review
title: "MUPP-067 Secret Santa draw year in Swedish time: review"
description: "The code review of the Swedish draw year: findings, decisions and result."
feature: MUPP-067
---

# Code review of MUPP-067

**Result:** Passed
**Date:** 2026-11-12, review run 1
**Summary:** `startDraw` takes `today = swedishToday()` and reads `today.year` once for all three queries, which meets MUPP-067-R1. The unit test covers the turn of the year; the caller passes nothing and gets the default. The wiki, log, `solution.md` and `flow.mmd` match the code.
**Security:** Passed. No change to sign-in checks, queries (still `?` parameters), input handling, cookies or personal data; only where the year comes from changes. `/security-review`: not needed (the card says none).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `specs/MUPP-067-santa-draw-year/` had no `verification.md` or `review.md` yet. **Done:** both written.

## Suggestions

- `lib/santa.test.ts` The criterion "12:00 on any other day, the year is unchanged" is covered only indirectly: the existing draw tests compare with `swedishToday().year`. **Done:** left as it is, and noted in `verification.md`.

## Outside the change

None.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
