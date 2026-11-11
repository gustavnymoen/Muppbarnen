---
type: Review
title: "MUPP-064 Wish rows fold out consistently: review"
description: "The code review of the consistent wish rows: findings, decisions and result."
feature: MUPP-064
---

# Code review of MUPP-064

**Result:** Passed
**Date:** 2026-11-11, review run 1
**Summary:** The change in `WishRow` is small and correct: both headings always show, a missing value shows "–", and the link and claim parts are untouched. The own list and the admin lists (`WishDetails`) are not touched.
**Security:** Passed. No route, action, query, cookie or data change; values are rendered as React text and `webLink` still limits links to http(s). `/security-review`: not needed, as the card says.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `specs/MUPP-064-wish-row-fold/verification.md` claimed partial cases (only a size, only a description) that no test covers. **Done:** reworded to say what was tested; the code is one `||` per line.
- `tests/design.spec.ts` checks the dash and the 56 px row on the match page only, not 44 px on the children's list. **Done:** the verification now says so; the row code is shared and unchanged in height.
- `specs/MUPP-062-wish-rows/solution.md` still said which lines show "are as before". **Done:** a pointer to MUPP-064 added.

## Suggestions

- `app/components/WishList.tsx` `wish.description || "–"` shows a whitespace-only description as it is. **Done:** left as it is; the paragraph is unchanged and input is the admin's or participant's own.
- The check of how a screen reader reads "Storlek: –" is open on the live site; recorded as not checked in the verification.

## Outside the change

- The suite is over its time budget (318.6 s against 180 s), already known as TECH-019.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
