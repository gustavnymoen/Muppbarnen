---
type: Review
title: "MUPP-031 Wish list stays a month after the occasion: review"
description: "The code review of Wish list stays a month after the occasion: findings, decisions and result."
feature: MUPP-031
---

# Code review of MUPP-031

## Review run 2

**Result:** Passed
**Date:** 2026-11-03, review run 2
**Summary:** The must-fix from run 1 is resolved: the user decided R6 by the dates only ("Beräknad" before the birthdate, "Född" from day 0 to day 30, then "Fyller 1 år"), the card says so and notes the change to MUPP-011-R3, and the card, code, tests, solution, verification and wiki agree. No `child.added_at` is left.
**Security:** Passed. Unchanged since run 1; migration 004 now only adds `wishlist_item.added_at`, shown on a copy to change nothing else. After the review, CI's Semgrep rule `sql-built-from-text` blocked the `IN (?, …)` that `clearList` built from text; it now passes the ids as one JSON parameter (`json_each(?)`), so the query is fixed text.

### Must fix

None.

### Should fix

None.

### Suggestions

- `db/db-setup.test.ts` The migration test still checks that the `child` row is unchanged, which was needed when 004 touched `child`. **Done:** left as it is: it still shows that 004 changes nothing in the kids.

### Outside the change

- `specs/MUPP-011-future-birthdate/verification.md` calls R3 "The age is never below 1" with no pointer to the change. **Done:** a one-line note there points to MUPP-031-R6.
- `tests/helpers.ts` `birthdateIn` on 29 February (from run 1). Not added to the board.

## Review run 1

**Result:** Stopped (1 must fix, waiting for the user's decision; resolved in run 2)
**Date:** 2026-11-03, review run 1
**Summary:** The date rule (`occasionOn`, `occasionOf`, `isArchived`) holds at every edge traced: day 0/30/31, 23 and 24 January across the new year, 29 February from the 28th, the first-year clamp. Archived items are refused on the server. One disagreement between the code and the requirements remains, about the birth day itself.
**Security:** Passed. `copyArchivedItem` checks the site cookie, the admin cookie and `guardWrite()` first, then the list, the id, that the item is archived and `manageableChild`; every refusal is the same `NOT_ALLOWED`, and the copy always goes to the item's own kid. Claim, unclaim, edit and remove refuse archived items on the server. All queries take parameters (also the `IN (?, …)` in `clearList`). The migration only adds the dates (shown on a copy). Claimers' names are shown only on the admin page, behind sign-in and `canManage`. `/security-review` (needed: migration, queries, admin page, personal data): no findings.

### Must fix

- `lib/deck.ts` (`buildDeck`), `app/components/BirthdayDeck.tsx` (`ageText`), `lib/deck.test.ts` (`MUPP-011-R3 MUPP-031-R6 …`) A kid added before its birth shows "Född" (age 0) on the birth day itself, marked "Nästa födelsedag". MUPP-011-R3 says a born kid is never shown with age 0, and MUPP-031-R6 only covers days 1–30. **Open:** either R6 is widened to the birth day (and overrides MUPP-011-R3 for kids added before the birth), or day 0 keeps the old rule. That is a change to the card, so it waits for the user.

### Should fix

- `tests/MUPP-031-month-after.spec.ts` The R1 R3 test failed every 25 December, when the Christmas Eve card ties with Tilda's card one day back. **Done:** skipped on that day, with the reason.
- `specs/MUPP-031-month-after/verification.md` was still the template when the review read it. **Done:** filled in.
- Card #66 scope names only the migration that dates items; `child.added_at` is built too. **Open:** the card is updated when the user answers about R6 (same question).

### Suggestions

- `db/migrations/004_added_at.sql` Existing kids get the migration date, so a kid entered before its birth and born in the 30 days before the migration gets "Fyller 1 år" instead of "Född". **Done:** written in `solution.md`; harmless, so left as it is.
- `lib/family.ts` (`listDeckInput`) Every start page reads all items ever added and filters the archived ones in JavaScript. Fine at this size and documented in `solution.md`; left as it is.

### Outside the change

- `tests/helpers.ts` `birthdateIn` makes `<year−6>-02-29` when the target day is 29 February, which is not a real date in that year (old behaviour). Small; not added to the board.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
