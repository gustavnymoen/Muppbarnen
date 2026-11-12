---
type: Verification
title: "TECH-012 Shrink uploaded pictures: verification"
description: How each requirement of Shrink uploaded pictures was checked, the test suite before and after, and the requirements as built.
feature: TECH-012
---

# Verification of TECH-012

How each requirement was checked.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-012-R1 | Unit tests `TECH-012-R1 …` in `lib/pictures.test.ts` (2000 × 1000 JPEG becomes 256 × 128 WebP and less than half the size; a 100 × 60 picture stays 100 × 60); browser test `MUPP-003-R6 …` uploads a large JPEG and checks that `/bilder/<id>` serves a 256 × 128 `image/webp` | local | Pass | 2026-11-02 |
| TECH-012-R2 | Unit test `TECH-012-R2 …`: a JPEG with orientation 6 and a GPS position is stored upright (128 × 256) with no `exif` and no orientation | local | Pass | 2026-11-02 |
| TECH-012-R3 | Unit tests `TECH-012-R3 …` (a PNG signature with junk, a PNG cut in half, 7 200 × 7 200 px: `BadPictureError`, nothing in the folder); browser test `MUPP-003-R6 …` shows the old message for a broken PNG and stores nothing | local | Pass | 2026-11-02 |
| TECH-012-R4 | Browser test `MUPP-003-R6 …` puts an old `.jpg` in the picture folder and the kid's row: `/bilder/<id>` answers `image/jpeg` and the admin page shows it (`naturalWidth` 30). The start page reads the same route. Not separately checked on the start page | local | Pass | 2026-11-02 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/pictures.test.ts`: size, no enlargement, WebP, rotation, metadata, broken file, pixel limit, and that the stored name fits `NAME` (read back by `readPicture`) | local | Pass | 2026-11-02 |
| Browser tests | `MUPP-003-R6` (large picture, broken picture, old picture) and `MUPP-010-R4` (WebP name) | local | Pass | 2026-11-02 |
| Smoke test | Not applicable: no page or flow is added | none | n/a | 2026-11-02 |
| Accessibility | Not applicable: visitors see the same pictures; axe in `MUPP-003-R6` is unchanged and passes | local | Pass | 2026-11-02 |
| Security | Security points in the review; `/security-review` run, no findings | local | Pass | 2026-11-02 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-02 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (TECH-011) | 125 unit + 72 browser | 124.0 s (browser) + 0.2 s (unit) | 4.7 s |
| After | 130 unit + 72 browser | 119.8 s (browser) + 0.3 s (unit) | 4.7 s |

Five unit tests added; no browser test added (the existing picture tests were extended). Timing differences are within noise.

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets, total time not grown, and the new tests follow the quality rules in `wiki/system/testing.md`
- [x] Deployed, and the smoke tests pass against production (Live tests): the run on the merge commit c58dff0 passed (2026-11-02)
- [x] Accessibility: not applicable, visitors see no change
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers: `storePicture` lost its unused `type` parameter, and `IMAGE_EXTENSIONS` is no longer used in `lib/pictures.ts`; no commented-out code or debug output
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board: none noticed

## Requirements as built

### TECH-012-R1 Smaller pictures

A picture is shrunk to at most 256 px on its longest side and stored as WebP. A picture that is already smaller is not enlarged.

- **Given** a large picture, **when** it is uploaded, **then** the stored file is at most 256 px on its longest side, in WebP, and clearly smaller than the original.
- **Given** a picture smaller than 256 px, **when** it is uploaded, **then** its size is unchanged.

### TECH-012-R2 Orientation and metadata

The picture is rotated as its EXIF orientation says, and metadata (such as GPS position) is removed.

- **Given** a picture with orientation and GPS data, **when** it is uploaded, **then** the stored picture is upright and holds no EXIF data.

### TECH-012-R3 Unreadable files

A file that cannot be decoded as a picture gives the same error message as today (MUPP-003) and nothing is stored. As built this also covers pictures with more than 50 million pixels.

- **Given** a file with a picture's type but broken contents, **when** it is uploaded, **then** the error message is the same as today and no file is stored.

### TECH-012-R4 Stored pictures still work

Pictures stored before this change are still shown. The route `/bilder/[id]` serves both old and new pictures with the right type.

- **Given** a kid with an old JPEG and a kid with a new WebP, **when** the start page and the admin page are opened, **then** both pictures are shown.

## Notes

- A browser test that leaves a picture behind in the test folder (such as one that overwrites the kid's picture in the database) makes later runs fail on "no file left"; the test removes the file itself.
- Not checked: that `sharp` runs on Vercel (it ships a prebuilt binary and is already installed by Next.js); the preview tests and Live tests show it after the push.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
