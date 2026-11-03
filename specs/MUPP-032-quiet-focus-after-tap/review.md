---
type: Review
title: "MUPP-032 No focus ring after a tap: review"
description: "The code review of No focus ring after a tap: findings, decisions and result."
feature: MUPP-032
---

# Code review of MUPP-032

**Result:** Passed
**Date:** 2026-11-03, review run 1
**Summary:** MUPP-022's special case (`byKeyboard`, `data-quiet-focus`) is removed from `BirthdayDeck.tsx` and `globals.css` and replaced by one site-wide rule (`InputModality` and `html[data-pointer] :focus-visible`); nothing else uses the old marker. R1 and R2 are covered by WebKit tests.
**Security:** Passed. CSS and a client component with two passive listeners; no sign-in, API, database, personal data or secrets. `/security-review`: not needed, as the card's plan says.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `specs/MUPP-022-close-animation-glitch/verification.md` and `flow.mmd` still named `data-quiet-focus`. **Done:** a pointer to MUPP-032 added to the verification (the flow stays as history of that day).
- `verification.md` had the code review box unchecked. **Done:** updated from this report.
- R1's claim by tap had no test of its own. **Done:** `MUPP-032-R1 a claim by tap …` added to the WebKit file.

## Suggestions

- `app/components/InputModality.tsx`: `keydown` also fires for Shift or Cmd alone, so the ring comes back after any key. **Done:** left as it is; it only shows the ring more often, and the design test relies on Shift.

## Outside the change

- `.claude/launch.json` is untracked and unrelated; it is not committed here.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
