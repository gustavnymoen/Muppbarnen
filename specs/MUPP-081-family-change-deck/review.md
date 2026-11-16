---
type: Review
title: "MUPP-081 Family change: the deck starts at the next event: review"
description: "Code review of MUPP-081: result, findings and how they were handled."
feature: MUPP-081
---

# Review of MUPP-081

**Result:** Passed, 2026-11-16 (reviewer agent, following `wiki/system/code-review.md`).

Keying `BirthdayDeck` by the family choice in `app/page.tsx` is the smallest correct fix for MUPP-081-R1; the new step in the existing MUPP-080 test adds no page load. Security: passed; nothing about sign-in, routes, actions, queries, cookies or personal data changed. `/security-review` was not needed.

## Must fix

None.

## Should fix

- The criterion "a wish list is open, then nothing is open" has no test of its own. Kept as recorded in `verification.md` (it follows from the same remount; the card's test plan asks for no extra test).

## Suggestions

- A short comment on why the key is there: added in `app/page.tsx`.
- The "Julafton is gone" check depends on the test kid's birthday being before 24 December: both kids are created 10 and 20 days from today, as the other steps of the test already assume. Left as is.

## Outside the change

None.

See also: [Verification](verification.md), [Solution](solution.md).

[Specifications](../index.md)
