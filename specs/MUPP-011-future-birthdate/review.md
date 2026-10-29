---
type: Review
title: "MUPP-011 Future birthdate: review"
description: "The code review of Future birthdate: findings, decisions and result."
feature: MUPP-011
---

# Code review of MUPP-011

**Result:** Passed
**Date:** 2026-10-29, review run 1
**Summary:** R1 to R4 are met: the server check, the `max` on the field, the month-end arithmetic, the Swedish date and the rule that a born kid is never 0 years are correct, and the browser data still holds no date.
**Security:** Passed. `parseBirthdate` still checks type, format, real date and range on the server; the actions are unchanged, so the sign-in check and `guardWrite()` still apply; no new route, query, cookie or secret; the browser gets only `expected` and the month. `/security-review`: not needed, as the card says.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `lib/deck.test.ts:79` The reviewer thought the "born today" branch of R3 was not tested. **Done:** no change needed: the test's "today" is 2026-10-28, so `born("2026-10-28")` is the born-today case. Checked by turning the branch off, which made two tests fail.
- `tests/design.spec.ts` The card's test plan said the "Beräknad" text goes in the design test. **Done:** the card's test plan now says there is no new check there, since the text uses the existing age style (also in `verification.md`).
- `.claude/launch.json` Untracked dev-server config, not part of the feature. **Done:** left out of the commit.

## Suggestions

- `lib/form-input.ts:3` The input checks import `swedishToday` from `lib/deck.ts`. **Done:** left as it is; a `lib/dates.ts` is worth it when a third file needs the Swedish date.
- `lib/deck.ts` `isExpected` and `latestBirthdate` each build an ISO date. **Done:** left as it is; they build it from different inputs.
- `app/components/BirthdayDeck.tsx:21` `month!` in `ageText`. **Done:** left as it is; the month is null only on the Christmas card, which has no expected kids.

## Outside the change

- A kid born today gets a card dated next year and nothing marks "born today" on the start page. Not added to the board; a small idea if wanted.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
