---
type: Review
title: "MUPP-077 Add gifts not on the wish list: review"
description: "The code review of MUPP-077: findings, decisions and result."
feature: MUPP-077
---

# Code review of MUPP-077

**Result:** Passed
**Date:** 2026-11-15, review run 1
**Summary:** No must-fix findings. A few should-fix and suggestion items, handled below.
**Security:** The security points of the review: passed (`addGift` and `removeAddedGift` check the site session, then `guardWrite()`, then validate on the server; SQL is parameterised; texts are plain text; the limit is checked inside the transaction; a parent's row is never deleted). `/security-review`: run on the whole change, no finding.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `lib/family.ts` (`addVisitorGift`): "a wrong occasion" in R7 only means a value that is not birthday or christmas; a gift can be added to a list the card is not showing. **Done:** left as it is, as safe as `saveItem`; `verification.md` says what R7 means.
- `specs/MUPP-077-visitor-gifts/`: `verification.md` and `review.md` were missing. **Done:** written.

## Suggestions

- Both suggestions about "Tillagd av" on a row claimed by someone else and a gift without an undo arrow no longer apply: the card was changed so an added gift has no claim to remove (see `solution.md`).
- `app/components/AddGiftDialog.tsx`: the focus effect also sees the hidden step. **Done:** a comment says why it works.

## Outside the change

- `MUPP-013-R5` (`tests/design.spec.ts`), `MUPP-017-R1` and `MUPP-021-R1` fail on today's date (the Christmas Eve card comes before the multi-kid card they expect to be next). Not caused by this change; should be fixed in a technical task.
