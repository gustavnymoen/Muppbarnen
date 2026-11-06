---
type: Solution
title: "TECH-016 Smaller functions on Vercel: solution"
description: "How the functions Vercel stores got smaller: the web database client on Vercel, sharp only in the function for /admin/hantera, and a script that measures it."
feature: TECH-016
card: "#132"
depends_on: [MUPP-003, TECH-012]
---

# TECH-016 Smaller functions on Vercel: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 132`.

## Data

None.

## Interface

None for visitors; the site behaves as before.

Code:

- **`lib/libsql-web.ts`** is one line, `export * from "@libsql/client/web";`. `next.config.ts` sets `turbopack.resolveAlias: { "@libsql/client": "./lib/libsql-web.ts" }` only when `process.env.VERCEL` is set, so `lib/db.ts` gets the web client in the Vercel build and the native client everywhere else.
- **`lib/picture-upload.ts`** holds `shrink`, `storePicture`, `BadPictureError` and the size constants, and is the only file that imports `sharp`. `lib/pictures.ts` keeps `readPicture` and `removePicture` and exports `storedInBlob` and `picturesDir` for the upload file.
- **`app/admin/picture-actions.ts`** (`"use server"`) holds `saveChildPicture`, unchanged: site cookie, admin cookie, write limit, rights, size and type, in that order. Only `app/admin/hantera/page.tsx` imports it. `answer`, `text` and `logPictureError`, which both action files use, are in `app/admin/action-helpers.ts`, a plain module, because a `"use server"` file may only export actions.
- **`scripts/function-sizes.mjs`** is described in [Testing](../../wiki/system/testing.md#function-sizes).

## Decisions

- **The alias points to a file in the repo.** `@libsql/client` is one of Next's default server external packages, so it is loaded from `node_modules` at run time and traced whole; an alias straight to `@libsql/client/web` leaves it external and the native `libsql` is still traced. An alias to a file in the repo is bundled.
- **The web client is enough on Vercel.** `lib/db.ts` only uses `db.transaction("write")`, and the native client already runs a `libsql://` URL as `https://` through the same `http.js` code; the web client is that code without the file engine. It refuses `file:` URLs, which is fine since `lib/db.ts` requires `TURSO_DATABASE_URL` on Vercel. `scripts/db-setup.mjs` is plain Node and unaffected by the alias.
- **Only the picture action moved.** The upload form lives on `/admin/hantera`, so the other admin pages no longer import `sharp` through `app/admin/actions.ts`. Taking `sharp` out of `/admin/hantera` itself is out of scope (it touches the write rules).
- **Limits of the script:** 6 MB for every function but `/admin/hantera` (measured 0.8–3.1), 25 MB for `/admin/hantera` (measured 22.4 on macOS; the Linux `sharp` packages are about 0.6 MB bigger).
- **Measured numbers (macOS, `VERCEL=1` build, MB):** start page 2.6, `/losenord` 2.4, `/bilder/[id]` 2.8, `/admin`, storlekar and önskelistor 3.1, `/admin/hantera` 22.4; before 10.7–30.9. Slightly lower than the card's estimate (2.8–3.5; 22.7), all within the limits.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Architecture](../../wiki/system/architecture.md), [Admin page](../../wiki/system/admin.md), [Testing](../../wiki/system/testing.md).

[Specifications](../index.md)
