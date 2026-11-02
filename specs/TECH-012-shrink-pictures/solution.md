---
type: Solution
title: "TECH-012 Shrink uploaded pictures: solution"
description: "How uploaded pictures are shrunk with sharp: the size limit and why, the steps, the error path and what happens to old pictures."
feature: TECH-012
card: "#63"
depends_on: []
---

# TECH-012 Shrink uploaded pictures: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 63`.

## Data

None. The picture column still holds a file name; new pictures end in `.webp`, old ones in `.jpg`, `.png` or `.webp` and stay as they are.

## Interface

No page changes. `storePicture(childId, bytes)` in `lib/pictures.ts` no longer takes the type: it decodes and shrinks the bytes with `sharp` and always stores WebP (`barn-<id>-<uuid>.webp`). A file that cannot be decoded makes it throw `BadPictureError`, which `saveChildPicture` (`app/admin/actions.ts`) turns into the same message as before: "Bilden måste vara JPEG, PNG eller WebP och högst 4 MB." The first-bytes check (`detectImageType`) stays in the action as a cheap early refusal.

## Decisions

- **Size limit `MAX_PICTURE_SIDE` = 256 px.** The largest `Avatar` is the twin avatar on the birthday card, `clamp(72px, …, 104px)` in `BirthdayDeck.tsx`; the open single card uses 72 px. 104 px at 2x is 208 px; 256 gives some margin and keeps the files at a few kB. The picture is resized with `fit: "inside"` and `withoutEnlargement`, so the aspect ratio is kept and a smaller picture is stored at its own size.
- **Orientation and metadata (R2).** `.rotate()` without arguments turns the picture as its EXIF orientation says. `sharp` leaves metadata out of the output unless `withMetadata` is asked for, so GPS position and the rest are gone; the tests check that `exif` and `orientation` are empty.
- **Broken files (R3).** Every error from `sharp` (broken contents, a picture cut off halfway, too many pixels) becomes `BadPictureError`; the picture is decoded before anything is written, so nothing is stored. Other errors (the store) keep the old message "Bilden kunde inte sparas…".
- **Pixel limit 50 million.** The upload is at most 4 MB, but a small PNG can hold a huge picture that takes a lot of memory to decode (a decompression bomb). `limitInputPixels` refuses it before decoding. 50 MP covers phone cameras.
- **Decoding stays on the server in the action.** Shrinking in the browser would not help: the limits must hold for any request, and the browser cannot be trusted.
- **`sharp` is a direct dependency** (`^0.35.5`, the version Next.js already installs). It ships a prebuilt binary per platform, so nothing changes in the build on Vercel.
- **Not done:** shrinking pictures that are already stored (out of scope in the card) and Vercel's image optimisation (reasons in the card).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Admin page](../../wiki/system/admin.md) (Pictures), [Admin manual](../../wiki/manual/admin.md).

[Specifications](../index.md)
