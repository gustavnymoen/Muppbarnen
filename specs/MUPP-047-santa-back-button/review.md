---
type: Review
title: "MUPP-047 Back button on the Secret Santa sign-in: review"
description: "The code review of the back button, the new welcome line and the button text on the Secret Santa sign-in: findings, decisions and result."
feature: MUPP-047
---

# Code review of MUPP-047

**Result:** Passed
**Date:** 2026-11-09, review run 1
**Summary:** The change reuses `IconLink` and `ReturnIcon` and meets R1–R3 with tests and docs; other pages are unchanged. No must-fix findings; one real bug in the Esc handling and the missing `verification.md` were fixed.
**Security:** Passed. No data path, server action, query, cookie or secret is touched; `backHref` is built from the family id that was already validated against the family list. `/security-review`: not run, since the card's test plan says none is needed (no data path changes).

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `app/secret-santa/SignInForm.tsx` The guard for an open menu did not work: the menu closes on a React key handler that runs before the window listener, so Esc closed the menu and also went back. **Done:** `SiteMenu` now calls `preventDefault` on the Esc that closes it and the form skips handled keys; the test presses Esc with the menu open.
- `specs/MUPP-047-santa-back-button/` had no `verification.md`. **Done:** written.

## Suggestions

- `app/components/SiteHeader.tsx` `{back ?? <span />}` as a spacer. **Done:** left as it is; it keeps the menu on the right and pages without `back` look the same.
- `app/secret-santa/SignInForm.tsx` The selector-based guard coupled the form to every expandable element. **Done:** replaced by the `defaultPrevented` check above.

## Outside the change

- The "Fortsätt" click is repeated across the MUPP-039, MUPP-040 and design tests; a shared sign-in helper in `tests/helpers.ts` could replace them. Not added to the board: small, and part of the test-suite work in TECH-018.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
