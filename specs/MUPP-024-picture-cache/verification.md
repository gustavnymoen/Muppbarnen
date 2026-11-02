---
type: Verification
title: "MUPP-024 Pictures are cached by the browser: verification"
description: How each requirement of Pictures are cached by the browser was checked, the test suite before and after, and the requirements as built.
feature: MUPP-024
---

# Verification of MUPP-024

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-024-R1 | Browser test `MUPP-003-R6 …` (admin page): the `<img>` address is `/bilder/<id>?v=…`; the current version gives `private, max-age=31536000, immutable`, no version or `v=old` gives `private, no-cache`; after replacing the picture the address is another one; the page still never holds the file name. Unit test in `lib/deck.test.ts` (the kid holds `picture`) | local | Pass | 2026-11-02 |
| MUPP-024-R2 | The same test: 401 without the cookie (also with `If-None-Match`), 404 without kid or picture, `ETag`/`304` as before | local | Pass | 2026-11-02 |

## Test suite

| | Tests | Total time |
|---|---|---|
| Before (MUPP-022 PR) | 132 unit + 99 browser | 161.9 s |
| After | 132 unit + 99 browser (+1 WebKit, run by hand) | 166 s (3 MUPP-016 tests were updated for the two close animations and re-run: pass) |

`npm run lint`, `lint:docs` and `typecheck` pass; the production build is made by the test server.

## Definition of Done

- [x] Tests: all checks of the test plan done; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets (see above)
- [x] Deployed, and the smoke tests pass against production (Live tests): passed after the merge, 2026-11-02
- [ ] Accessibility: no visible state added; the live checklist is not checked
- [x] Requirements match what was built (below); `solution.md` describes how
- [x] Manual, system docs and `wiki/log.md` updated (no manual change: the visitor sees no new function)
- [x] No leftovers
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] No larger improvements to add to the board

## Requirements as built

### MUPP-024-R1 Versioned picture address, cached for good

See the card (#80): every picture address is `/bilder/<id>?v=<version>`; the current version is answered with `Cache-Control: private, max-age=31536000, immutable`, otherwise `private, no-cache`; a replaced picture has a new address. The version does not reveal the file name.

### MUPP-024-R2 Still only through the site

`401` without the site cookie, `404` without a kid or picture, the storage address never sent.

## Notes

- Not checked on a phone: that the pictures no longer reload when a view is closed on Christmas Eve (after the merge, on the iPhone).

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
