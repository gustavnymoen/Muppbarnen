---
type: Review
title: "MUPP-010 Compact admin: review"
description: "The code review of Compact admin: findings, decisions and result."
feature: MUPP-010
---

# Code review of MUPP-010

**Result:** Passed
**Date:** 2026-10-28, review run 1
**Summary:** The change meets the card: one icon button component, one place for folding, and the old Disclosure, large buttons and size chips are gone with nothing left unused. No must-fix findings.
**Security:** The security points of the review: passed. `removeChildPicture` calls `requireSiteSession`, `requireAdminSession` and `guardWrite()` in that order, the id goes through `parseId` in `manageableChild`, only the master admin passes `childForPicture`, queries use `?` parameters, and the file is removed only after the database is updated. `/security-review`: run over the branch, no findings. Nothing newly rendered as HTML (React text only), the file name comes from the database and is checked again against the generated-name pattern in `lib/pictures.ts` before it is removed, and no new route or setting was added.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `specs/MUPP-010-compact-admin/` lacked `verification.md` and `review.md`. **Done:** both added.
- `app/components/Form.tsx:12` said the form works without script, which no longer holds inside a folded panel. **Done:** the comment says so.
- `app/admin/barn/[id]/page.tsx` had the `SlimCard` import among the `@/lib` imports. **Done:** moved.

## Suggestions

- `app/components/Fold.tsx` `FoldButton` set `aria-label` equal to its visible text for "Ny förälder" and "Nytt barn". **Done:** only set when it differs from the text.
- `app/components/Fold.tsx` Esc on any toggle closes whatever panel is open. **Done:** commented (only one can be open).
- `tests/MUPP-010-compact-admin.spec.ts` waits for `networkidle` before the keyboard test, as MUPP-003 does. **Left as it is:** the same pattern is used in MUPP-003 and is steady in practice.

## Outside the change

- MUPP-003's accessibility checklist on the live site was never done; it can be done together with this one (recorded in `verification.md`).
- The "no sideways scroll" checks of MUPP-003-R8 and MUPP-010-R6 overlap and could be merged later; not added to the board (small).

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
