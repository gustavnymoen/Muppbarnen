---
type: Verification
title: "MUPP-046 Site name: verification"
description: How each requirement of Site name was checked, the test suite before and after, and the requirements as built.
feature: MUPP-046
---

# Verification of MUPP-046

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-046-R1 | Unit test `MUPP-046-R1` (`app/site-name.test.ts`); browser test `MUPP-046-R1 R2 R3 every page says Kusinportalen…` and `…the password page is called Kusinportalen…` in `tests/MUPP-046-site-name.spec.ts` (titles, headings, no "Muppbarnen" in the visible text); the old name replaced in `MUPP-002`, `MUPP-003`, `MUPP-009`, `TECH-001` and `smoke` | local | Pass | 2026-11-09 |
| MUPP-046-R2 | Browser tests (the head on every page above; the manifest as served) and unit test `MUPP-046-R2` (manifest values) | local | Pass | 2026-11-09 |
| MUPP-046-R3 | Unit tests `MUPP-046-R3` (sizes, types, opacity, weight, no script or link in the SVG); head links in the browser test; the icon at 16, 32 and 180 px looked at as a contact sheet (gift and ribbon recognisable at 16 px) | local | Pass; the user's own look before the work is done: not checked | 2026-11-09 |
| MUPP-046-R4 | Unit tests `MUPP-046-R4` (`proxy.test.ts`: the exact list, GET and HEAD, other methods, lookalikes); browser test `MUPP-046-R2 R3 R4 the icons and the manifest are public files…` without the cookie; `@smoke` test | local | Pass | 2026-11-09 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `proxy.test.ts`, `app/site-name.test.ts` (15 tests) | local | Pass | 2026-11-09 |
| Browser tests | `tests/MUPP-046-site-name.spec.ts` (3 tests); the five existing files updated; the helper `message` in `MUPP-039` now ignores Next's route announcer, which holds text once page titles differ | local | Pass | 2026-11-09 |
| Smoke test | New `@smoke` test `MUPP-046-R4` in `tests/smoke.spec.ts`; the password-page smoke test updated | local; preview and live: not checked yet | Pass locally | 2026-11-09 |
| Accessibility | axe on the password page and the start page; page titles (WCAG 2.4.2) read in the browser test for every page type. The checklist on the live site (titles, tab icon, iPhone home screen): not checked | local | Pass locally | 2026-11-09 |
| Security | `/security-review`: see [review.md](review.md); the exact-path list, methods and lookalikes are unit tested | local | see review | 2026-11-09 |
| Code review | [review.md](review.md) | local | see review | 2026-11-09 |

## Test suite

`npm run test:time`, on `main` before and on this branch after (the suite was already over its budget before, TECH-019).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 211 unit, 121 browser | 249.0 s (unit 0.4 s) | 7.3 s |
| After | 226 unit, 125 browser | 261.2 s (unit 0.4 s) | 7.5 s |

The browser suite grew by 12.2 s (4 %) for 4 tests (one new file with three tests, one smoke test). The 5 s per-test budget is exceeded by the same tests as before; the new tests are under it. Bringing the suite back under its budget is TECH-019, not this card.

## Definition of Done

- [x] Tests: every check in the plan is done locally; `npm run test:unit` and `npm run test:local` pass
- [ ] Test suite: within the time budgets, total time grown by at most 25 % (grown 4 %; the budget was already exceeded before, TECH-019)
- [ ] Deployed, and the smoke tests pass against production (Live tests): not yet
- [ ] Accessibility: axe passes locally; the checklist items on the live site not checked yet
- [x] Requirements in the card match what was built, no open questions left; copied below; `solution.md` describes how it was built
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review done; see [review.md](review.md)
- [x] Technical tasks for larger improvements: none found

## Requirements as built

### MUPP-046-R1 One name

The site shall be called **Kusinportalen**, taken from the one constant `SITE_NAME`, and no page shall show the old name or the word "Muppbarnen".

Acceptance criteria:

- **Given** the start page, **then** its page title is `Kusinportalen` and its hidden `h1` is `Kusinportalen`.
- **Given** the password page, **then** its heading is `Kusinportalen` and its title is `Kusinportalen`.
- **Given** any other page (the admin pages, the style guide, the Secret Santa entrance and own page, a kid's wish list, the not-found page), **then** its title ends with ` | Kusinportalen` (for example `Admin | Kusinportalen`, `Secret Santa | Kusinportalen`), from a title template in `app/layout.tsx` and not repeated in each page.
- **Given** those pages, **then** neither the title nor the visible text contains `Muppbarnens önskelistor`, and no visible text contains `Muppbarnen`.

### MUPP-046-R2 Share preview and home-screen name

The site shall describe itself with the new name when shared and when added to a phone's home screen.

Acceptance criteria:

- **Given** any page, **then** its `<head>` has the meta description `Familjens önskelistor och Secret Santa.` and Open Graph tags `og:title` (`Kusinportalen`), `og:site_name` (`Kusinportalen`), `og:description` (the same text) and `og:locale` (`sv_SE`), and no `og:image`.
- **Given** the web app manifest (`/manifest.webmanifest`), **then** its `name` and `short_name` are `Kusinportalen`, its `lang` is `sv`, its `background_color` and `theme_color` are `#0C1015` (`--color-page`), and it lists the two PNG icons with their sizes.
- **Given** the page `<head>`, **then** it sets the iOS home screen title to `Kusinportalen` (`appleWebApp.title`).

### MUPP-046-R3 One icon

The site shall have one icon, the gift below, used for the browser tab, the home screen and the mail logo.

The design, chosen with the user (a gift in the palette of `DESIGN.md`: page `#0C1015`, lilac `#A698D0`, brand `#9AA9E0`, claimed amber `#E3A15F`; drawn as SVG, no emoji, readable at 16 px; this source is `app/icon.svg`):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><title>Kusinportalen</title>
<rect width="512" height="512" rx="112" fill="#0C1015"/>
<g transform="translate(256 268) scale(1.16) translate(-256 -268)">
<rect x="112" y="244" width="288" height="170" rx="34" fill="#A698D0"/>
<rect x="92" y="196" width="328" height="76" rx="30" fill="#9AA9E0"/>
<rect x="226" y="196" width="60" height="218" fill="#E3A15F"/>
<g fill="none" stroke="#E3A15F" stroke-width="30" stroke-linecap="round" stroke-linejoin="round">
<path d="M256 192C200 190 160 160 176 124C192 92 244 130 256 192Z"/>
<path d="M256 192C312 190 352 160 336 124C320 92 268 130 256 192Z"/></g></g>
</svg>
```

Acceptance criteria:

- **Given** `app/icon.svg`, **then** it is this picture, has no script, no external reference and no embedded image, and is under 5 KB.
- **Given** `app/icon.png`, **then** it is this picture as a 192 × 192 PNG, with the rounded corners transparent, and under 20 KB.
- **Given** `app/apple-icon.png`, **then** it is this picture as a 180 × 180 PNG, square and fully opaque (the page colour fills the corners, since iOS rounds it itself), and under 20 KB.
- **Given** any page, **then** its `<head>` links the three icons (Next.js generates the links).
- **Given** the icon at 16, 32 and 180 px (looked at by the user before the build is done, recorded in `verification.md`), **then** the gift and its ribbon are recognisable at 16 px.

### MUPP-046-R4 The icon and the manifest are public, and nothing else is

The icon files and the manifest shall be fetchable without the site password, and no other path shall become public.

Acceptance criteria:

- **Given** a visitor without the site cookie, **when** they `GET` or `HEAD` `/icon.svg`, `/icon.png`, `/apple-icon.png` or `/manifest.webmanifest`, **then** the answer is 200 with the content types `image/svg+xml`, `image/png`, `image/png` and `application/manifest+json`.
- **Given** a visitor without the site cookie, **when** they fetch any other path (a page, `/bilder/<id>`, an API route, a lookalike such as `/icon.png/x` or `/icons/icon.png`), **then** the answer is the same as before: a redirect to the password page for a page, 401 for the rest.
- **Given** any method other than `GET` or `HEAD` on those four paths without the cookie, **then** it gets 401 as before.
- **Given** the rule is a short list of exact paths in `proxy.ts` (one place), **then** a unit test fails if the list grows or holds anything but those four paths.

## Notes

- The apple icon is the same drawing without rounded corners on the page colour; the PNGs were made with `sharp` from `app/icon.svg` (192 px with transparency; 180 px flattened onto `#0C1015`).
- The card names "a kid's wish list" among the pages with the title suffix; a kid's list on the start page has the start page's bare title, and the admin list page (`/admin/barn/<id>/onskelistor`) gets `Admin | Kusinportalen`, from the admin layout.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
