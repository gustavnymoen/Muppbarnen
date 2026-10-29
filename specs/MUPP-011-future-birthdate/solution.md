---
type: Solution
title: "MUPP-011 Future birthdate: solution"
description: How a birthdate up to ten months ahead is accepted and how a child who is not born yet is shown as expected, and the decisions behind it.
feature: MUPP-011
card: "#32"
depends_on: [MUPP-003, MUPP-004]
---

# MUPP-011 Future birthdate: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 32`.

## Data

None. The birthdate is still a `YYYY-MM-DD` text in `child.birthdate`; whether a child is expected is worked out from it and today's date every time, so nothing has to change on the day the child is born (R3).

## Interface

- **`lib/form-input.ts`:** `MAX_MONTHS_AHEAD` (10) and `latestBirthdate(now)`, the last allowed date, counted from the Swedish date. `parseBirthdate` accepts 1900-01-01 up to that date and otherwise gives "Skriv ett riktigt datum, högst tio månader fram." (R1).
- **`app/components/Form.tsx`:** `Field` takes `max`, which the date field gets from `latestBirthdate()` in `app/admin/hantera/page.tsx`. The form has `noValidate`, so the server's message is still the one shown; `max` only limits the date picker.
- **`lib/deck.ts`:** `isExpected(birthdate, today)` (the date is after today). `DeckKid` has `expected`; an expected kid on a birthday card has `age: null` and `expected: true`. For a kid who is born, `nextOccurrence` is moved to the first birthday if it would give age 0 (R3). Only the month and the flag go to the browser, as before (MUPP-004-R6).
- **`app/components/BirthdayDeck.tsx`:** `ageText(kid, month)` gives "Beräknad {månad}" for an expected kid (R2) and otherwise "Fyller N år"; the Christmas card shows no age, as before.
- **`app/admin/hantera/page.tsx`:** the info line of a kid says "Beräknad {datum}" instead of "Född {datum}" when the kid is expected (R4).
- The flow is in [flow.mmd](flow.mmd).

## Decisions

- **Ten months, one constant.** About nine months of pregnancy plus a margin, and it stops a mistyped year (2062). A different limit is one number.
- **The Swedish date, not UTC.** `parseBirthdate` used UTC before; the limit and the "expected" check both use `swedishToday`, as the deck does, so the card and the check agree around midnight.
- **Month ends:** the limit clamps to the last day of the month (30 April plus ten months is 28 February, not 2 March).
- **`expected` is a flag in the data, the text is in the interface.** `lib/deck.ts` stays free of Swedish texts; the same `age: null` already meant "no age" on the Christmas card, so a separate flag says why.
- **Age at least 1 for a born kid.** Without it a kid born today or earlier this year had "Fyller 0 år" on the first birthday card. A kid born today gets the card for next year.
- **The old test of "not in the future" is changed, not kept:** `lib/form-input.test.ts` and the browser test of MUPP-003-R5 now check the new message and limit; the sentence in the MUPP-003 solution is updated and its verification gets a note.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page and menu](../../wiki/system/start-page.md), [Admin page](../../wiki/system/admin.md), [Admin (manual)](../../wiki/manual/admin.md), [Startsidan (manual)](../../wiki/manual/startsidan.md).

[Specifications](../index.md)
