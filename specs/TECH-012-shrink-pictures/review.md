---
type: Review
title: "TECH-012 Shrink uploaded pictures: review"
description: "The code review of Shrink uploaded pictures: findings, decisions and result."
feature: TECH-012
---

# Code review of TECH-012

**Result:** Passed
**Date:** 2026-11-02, review run 1
**Summary:** `storePicture` decodes, rotates, shrinks to 256 px and stores WebP without metadata; a broken file gives the old message and stores nothing; every requirement has a test. No must-fix findings.
**Security:** Passed. Sign-in, `guardWrite`, the 4 MB check, the content-signature check and the `NAME` guard are unchanged; decoding is guarded by `limitInputPixels`; visitors never see sharp's error text; GPS and other metadata are dropped. `/security-review`: run, no findings.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `lib/pictures.ts:23` The pixel limit of 100 million allows about 400 MB of decoded RGBA from a small PNG. **Done:** lowered to 50 million (above any phone camera); the unit test and the docs follow.
- `tests/MUPP-003-admin-page.spec.ts:20`, `lib/pictures.test.ts:20` The same `sharp({ create })` helper in two files. **Done:** left as it is; the unit test must not import `tests/helpers.ts` (it pulls in Playwright), and the two helpers differ in shape.

## Suggestions

- `lib/pictures.test.ts` The oversized-picture test was 121 MP. **Done:** now 7 200 × 7 200 (52 MP), just over the new limit.
- `lib/pictures.ts:7` The `sharp` import was out of order. **Done:** moved up with the other package imports.
- `lib/pictures.ts:32` Every `sharp` error becomes `BadPictureError`, so a missing native binary would read as a bad file and not be logged. **Done:** left as it is for now; the preview tests would show it, since the upload test needs a working `sharp`.

## Outside the change

- Check on the Vercel preview that the `sharp` binary is bundled. Not a card; the preview tests cover it.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
