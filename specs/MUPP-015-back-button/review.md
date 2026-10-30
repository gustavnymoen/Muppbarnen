---
type: Review
title: "MUPP-015 Back button on kids card: review"
description: "The code review of Back button on kids card: findings, decisions and result."
feature: MUPP-015
---

# Code review of MUPP-015

**Result:** Passed
**Date:** 2026-10-30, review run 1
**Summary:** The back button is a second trigger of the existing `close`, so the closing logic is not duplicated. R1-R4 are covered by the journey tests and the extended design test. No must-fix findings.
**Security:** Passed. The change has no sign-in, route, action, query, cookie, secret or personal-data code. `/security-review`: not needed, as the card says.

How the review works: `wiki/system/code-review.md`. A later run is added at the top as "Review run 2".

## Must fix

None.

## Should fix

- `specs/MUPP-015-back-button/verification.md` was still the template. **Done:** filled in.
- `specs/features.md` said Done before the work was. **Done:** set to Done only at the end of the Done step.

## Suggestions

- `tests/MUPP-015-back-button.spec.ts` The tab-order check showed Tillbaka before the sizes icon but not before the list. **Done:** the test now tabs on through the list and checks the order Tillbaka, Storlekar, the list.
- `app/components/BirthdayDeck.tsx` A Christmas card with one kid gets no "Tillbaka" (`hasBack` needs more than one kid). **Done:** said so in `solution.md`.
- The corner buttons could share a wrapper with MUPP-014. **Done:** left as it is; weighed and rejected in `solution.md`.

## Outside the change

None.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
