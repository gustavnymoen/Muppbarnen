---
type: Solution
title: "MUPP-024 Pictures are cached by the browser: solution"
description: "How picture addresses get a version and are cached for a year, and why a replaced picture still shows."
feature: MUPP-024
card: "#80"
depends_on: [MUPP-003, TECH-011]
---

# MUPP-024 Pictures are cached by the browser: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 80`.

## Data

None. The version is computed from the kid's stored file name.

## Interface

- `lib/picture-url.ts`: `pictureVersion(file)` (a short base-36 sum of the file name) and `pictureUrl(id, file)`, which gives `/bilder/<id>?v=<version>` or `undefined` without a picture. Used by `lib/deck.ts` (`DeckKid.picture` replaces `hasPicture`; `listDeckInput` passes the file name) and the three admin views.
- `app/bilder/[id]/route.ts`: if `?v` equals `pictureVersion(child.picture)` the answer has `Cache-Control: private, max-age=31536000, immutable`, otherwise `private, no-cache` as before. The cookie check stays first, then the kid and picture lookup, then the `ETag`/`304`.

## Decisions

- **Cause.** `no-cache` makes every new `<img>` revalidate; the tiles are re-created when a view closes, and the closing copy clones them, so the pictures are empty until the server has answered. A year of caching under a versioned address removes the request.
- **Version in the address, not a longer cache on the old address.** Replacing a picture changes the file name and so the version; the old address is never asked for again. An address without a version keeps `no-cache`, so a stale link can never show a wrong picture.
- **A sum, not the file name.** The page text must not hold the file name (tested since MUPP-003). The sum is 32 bits, so two different names could in theory give the same version; `shortcut:` noted in the code, and the `ETag` still guards the old address.
- **Security.** Only the cookie holder reaches the route (401 first), the picture is `private`, so shared caches do not keep it, and the Blob address is still never sent.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).

[Specifications](../index.md)
