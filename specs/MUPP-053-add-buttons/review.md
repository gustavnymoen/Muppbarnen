---
type: Review
title: "MUPP-053 Plus buttons for adding: review"
description: "The code review of Plus buttons for adding: findings, decisions and result."
feature: MUPP-053
---

# Code review of MUPP-053

**Result:** Passed
**Date:** 2026-11-09, review run 1
**Summary:** R1 to R5 are met: one shared `FormCard add` and `AddRow` are used everywhere, names and form behaviour are unchanged, and each requirement has a test. Only small cleanups were found. The reviewer read the code and did not run tests, lint or the build (they were run separately and pass).
**Security:** Passed. No server action, route, query or data changed, only markup and wording. `/security-review` not needed, as the card says.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `app/admin/SantaTab.tsx:67-84` and `app/admin/hantera/page.tsx` The children of `AddRow` were not indented. **Done:** indented. The wrapper `div` with `mt-3 pb-1` was left as it is: it spaces the row inside the group's card, which `AddRow` does not know about.
- `app/admin/hantera/page.tsx:8` The `Card` import was out of order. **Done:** moved.
- `specs/MUPP-053-add-buttons/verification.md` Definition of Done partly unchecked. **Done:** left honest. Over-budget suite is TECH-019 (already on `main`); the live accessibility checklist and the Live tests follow the deploy.
- The new test `MUPP-053-R1 R2 R4` takes 5.2 s, just over the 5 s budget. **Done:** not changed; noted in `verification.md`. It may be trimmed together with TECH-019.
- `review.md` missing. **Done:** this file.

## Suggestions

- `app/components/FormCard.tsx:11` Three exclusive props (`icon`, `add`, `text`) make a nested ternary; one `kind` prop would rule out wrong combinations. **Done:** left as it is; three call patterns do not justify it yet.
- `app/admin/page.tsx:120` "Inloggad som Gustav" no longer says the list shows that parent's kids. **Done:** left as the card decided; to be looked at on a phone on the live site.

## Outside the change

- `lib/santa.ts:24,44` Code comments still say "Familjer" while the interface says "grupp". Naming drift only; MUPP-048 will likely settle it. Not added to the board.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
