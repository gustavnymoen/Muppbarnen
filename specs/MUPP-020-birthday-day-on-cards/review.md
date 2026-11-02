---
type: Review
title: "MUPP-020 Birthday day on the cards: review"
description: "The code review of Birthday day on the cards: findings, decisions and result."
feature: MUPP-020
---

# Code review of MUPP-020

**Result:** Passed
**Date:** 2026-11-02, review run 1
**Summary:** The code does what R1-R4 say: only `day` and `month` were added to the card, `DeckKid` is unchanged, and the unit test checks the exact keys and that the birthdate and the year are absent. The privacy rule is stated once, in `specs/rules.md`. The findings were leftovers in documentation and tests, all fixed.
**Security:** Passed. No sign-in, route, query or form changes; card keys are still `kort-<index>`, so no date leaks through them. `/security-review`: not needed (the card's test plan says so); the reviewer checked that the birthdate and year are not sent.

## Must fix

None.

## Should fix

- `specs/MUPP-020-birthday-day-on-cards/verification.md` was missing. **Done:** written.
- `specs/MUPP-004-birthday-card/verification.md` and `specs/MUPP-011-future-birthdate/` (verification and solution) still said only the month goes to the browser. **Done:** updated.
- `lib/deck.ts` exported `MONTHS`, which nothing else uses now; `tests/helpers.ts` `birthdateIn` returned `month` and `day` that no test reads. **Done:** removed.
- Tests were not named after MUPP-020 and nothing asserted that the miniatures show no date. **Done:** the MUPP-004 and MUPP-011 tests carry `MUPP-020-R1`/`R2` in their names, and the several-kids test checks the date is in the page once.
- A shadowed `heading` in the new design test. **Done:** renamed `openHeading`.

## Suggestions

- A single expected kid shows "22 november" in the heading and "Beräknad 22 november" below it. This is what R2 says; left as it is.

## Outside the change

- `tests/design.spec.ts` has a local `birthdateIn` that shadows the helper of the same name. Not added to the board (small, unrelated).

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
