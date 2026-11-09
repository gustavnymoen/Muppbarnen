---
type: Verification
title: "MUPP-054 Toast after saving: verification"
description: How each requirement of the toast was checked, the test suite before and after, and the requirements as built.
feature: MUPP-054
---

# Verification of MUPP-054

How each requirement was checked. Everything ran locally (a production build with its own test database on port 3101); nothing is deployed, so the live checks are not done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-054-R1 | Browser test `MUPP-045-R2 R4 R5 R6 R7 a kid's wish lists …` (the toast says "fotboll lades till", is `aria-hidden`, is a popover that is open, is at the top of the screen, a second save replaces the text, the toast is gone after the page's clock has moved 2.6 s from the last save); `tests/design.spec.ts` (green band at the top, centred). Reduced motion: code review of `Toaster.tsx` (no animations, hidden after 2 s); not run in a browser | local | Pass; reduced motion by code review only | 2026-11-09 |
| MUPP-054-R2 | `tests/MUPP-003-admin-page.spec.ts` (a server refusal gives a red toast with its message, red border, contrast at least 4.5:1); `tests/design.spec.ts` (an empty field gives its error at the field and no toast) | local | Pass | 2026-11-09 |
| MUPP-054-R3 | `tests/design.spec.ts` (border colour, text contrast at least 4.5:1 on its own background for green and red, top at most 16 px, left edge on the screen). Not checked: the safe area on an iPhone with a notch, and that the band does not block taps (`pointer-events: none`, by code review) | local | Pass; safe area not checked | 2026-11-09 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: no new logic outside the component. `npm run test:unit` passes | local | Pass | 2026-11-09 |
| Browser tests | The two tests above; the whole suite (128) passes | local | Pass | 2026-11-09 |
| Smoke test | Not applicable (behind the admin password) | n/a | n/a | 2026-11-09 |
| Accessibility | axe in the changed tests; the toast is `aria-hidden`; live checklist: reported tested by hand by the user, screen reader items included (2026-11-09, not recorded item by item) | local, live | Pass (axe); live checklist reported done | 2026-11-09 |
| Security | The text is rendered as text; no server code changed; `/security-review` not needed | local | Pass | 2026-11-09 |
| Code review | [review.md](review.md) | local | See the report | 2026-11-09 |

## Manual checks

- **On a phone:** not checked. Look at the toast in Safari: at the top, under the notch, in front of the open card, readable, and that it is not hidden by the keyboard.
- **Safari older than 17** has no `popover`: the toast then shows behind an open card.

## Test suite

Whole suite against the test server on port 3101: 128 browser tests, 4.5 min (MUPP-045: 127 tests, about 236 s on a busier computer); no test was added, two were changed. Unit tests 209.

## Requirements as built

As on the card (`gh issue view 159`), with this point as built: the explicit error message is `state.error`; the toast is `aria-hidden` and the screen reader announcements are the unchanged ones from MUPP-045.
