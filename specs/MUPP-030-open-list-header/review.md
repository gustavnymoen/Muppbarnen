---
type: Review
title: "MUPP-030 Open wish list gets the room: review"
description: "The code review of Open wish list gets the room: findings, decisions and result."
feature: MUPP-030
---

# Code review of MUPP-030

**Result:** Passed
**Date:** 2026-11-03, review run 1
**Summary:** In every open kid view the chip and the age line are hidden, the picture is 40 px with a one-line `FitName` name beside it, and the date sits on the corner buttons' row. The closed cards take the same class branches as before. The tests check R1 to R3 at both phone sizes, and the docs are updated.
**Security:** Passed. The change is presentation only: no sign-in, server, database or personal data. `/security-review`: not needed (the card says so; no such code is touched).

How the review works: `wiki/system/code-review.md`. A later run is added at the top as "Review run 2".

## Must fix

None.

## Should fix

None.

## Suggestions

- `tests/design.spec.ts` (`chipAndAge` on Christmas Eve): the "Nästa: Julafton" part passes trivially, because in the test data the twins' card is the nearest. R1 is still covered, since `!openKid` is the one shared path that hides the chip. **Done:** left as it is. Making Christmas Eve the nearest card depends on the date.
- `app/components/BirthdayDeck.tsx` (`KidFace`, open row): `FitName` sits in a content-sized `h3`, so a name that has shrunk doesn't grow back when the card gets wider (for example, when the phone is turned) until the view is drawn again. The twins' names already behave like this. **Done:** left as it is, see below.
- The tests use one locator with exact regexes for "chip or age" that proves the texts are gone (`toHaveCount(0)`) and back (`toHaveText`) after folding up. This is a good pattern.

## Outside the change

- `app/components/FitName.tsx`: it watches its own width, not its parent's. **Done:** added to TECH-013 (#96) as a comment.

[Specifications](../index.md)
