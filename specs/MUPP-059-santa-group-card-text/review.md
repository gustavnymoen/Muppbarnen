---
type: Review
title: "MUPP-059 Santa group card text and bigger own page cards: review"
description: "The code review of the Santa group card text and the bigger own page cards: findings, decisions and result."
feature: MUPP-059
---

# Code review of MUPP-059

**Result:** Passed
**Date:** 2026-11-10, review run 1
**Summary:** R1 and R2 are implemented as the card says, with no logic change; the old text is gone, the tests were changed in the existing tests only, and the docs follow. No must-fix findings.
**Security:** Passed. Text and layout only: no route, action, query, cookie or personal data (the admin name was already shown to the master admin). `/security-review` not needed, as the card's test plan says.

Read by the reviewer agent from the diff and files (it ran no tests); the tests were run by the author (149 browser tests pass locally).

## Must fix

None.

## Should fix

- `app/secret-santa/min-sida/page.tsx` `LinkCard` and `GreyCard` use a raw `<h2>` instead of `Heading level={2} small`. **Done:** a comment says why (the 30 px is a one-off, larger than `Heading small`).
- `tests/design.spec.ts` the R1 check used a bare `+ 39`. **Done:** named `lineAboveAdmin` with its meaning.

## Suggestions

- `Lines` hides the idea behind the tuple type. **Done:** a comment says the break is fixed but the text is one sentence with a space, so the accessible name stays "Min önskelista".
- The fold button's accessible name now ends in "Admin: <name>"; MUPP-056-R2 still holds (the group name is included). Left as it is.

## Outside the change

- The suite is over its time budget (301.5 s against 180 s): TECH-019.
- A very long single word as a participant name at 30 px on 320 px was not tested. **Done:** `break-words` on the title so it wraps inside the card; not covered by a test.
- The live accessibility check and `/impeccable critique` are open steps (see `verification.md`).
