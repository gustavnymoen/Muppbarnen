---
type: Verification
title: "MUPP-059 Santa group card text and bigger own page cards: verification"
description: How each requirement of the Santa group card text and the bigger own page cards was checked, the test suite before and after, and the requirements as built.
feature: MUPP-059
---

# Verification of MUPP-059

Browser tests ran locally (a production build, the local test database), 2026-11-10. Deployed the same day; the live checks are at the end of this file.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-059-R1 | Browser tests `MUPP-048-R1 R3 MUPP-059-R1 …` and `MUPP-056-R3 MUPP-059-R1 …` (the closed card of another parent's group shows "Admin: <name>"); `MUPP-038-R1 R2 R3 MUPP-053-R1 R3 MUPP-059-R1 …` in `tests/design.spec.ts` at 320 px: "Admin: <name>" is one 16 px line below the status line, the header is at least 44 px, no sideways scroll, axe. The own group has no admin line: the unchanged MUPP-056-R1 test. "administreras av" is gone from the site and the wiki (checked with grep; the history of MUPP-048 keeps the old text) | local | Pass | 2026-11-10 |
| MUPP-059-R2 | Browser test `MUPP-051-R2 R6 MUPP-057-R1 R2 R3 R4 R5 MUPP-059-R2 …` in `tests/design.spec.ts`: at 375 and 320 px the cards are at least 176 px high, the 40 px symbol is over the text, both centred, the text is 30 px, no sideways scroll; 44 px targets and axe in the preparing and started state. Names "Min önskelista" and "Min matchning: Bo Ek" found by the unchanged tests. The look was chosen by the user from four proposals on 375 and 320 px in the running site (manual, in the browser pane with a copy of the database); contrast is the unchanged colours | local | Pass | 2026-11-10 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: no logic; the 333 existing ones pass | local | Pass | 2026-11-10 |
| Browser tests | Existing tests changed (3 files), no new test and no new page load | local | Pass (149) | 2026-11-10 |
| Smoke test | Not applicable: no main page or flow added | – | – | – |
| Accessibility | axe in the changed states (above); the live checklist: see "Live checks" below | local and live | Pass; VoiceOver, 200 % zoom and the light theme not checked live | 2026-11-10, own page 2026-11-11 |
| Design | Looked at on 375 and 320 px in the running local site with the user, proposals A to D; `/impeccable critique` not run as a separate pass | local | Done | 2026-11-10 |
| Security | Not applicable: text and size only | – | – | – |
| Code review | [review.md](review.md) | local | See review | 2026-11-10 |

## Live checks

On https://muppbarnen.vercel.app, in the built-in browser pane at 320 px width, signed in as the master admin, 2026-11-10. Checklist numbers from [accessibility.md](../../wiki/system/accessibility.md).

| Item | Result |
|---|---|
| 4 Reflow at 320 px, Secret Santa tab (closed group card with "Admin: Emma") | Pass: the page is 320 px wide and does not scroll sideways. 200 % zoom not checked |
| 6 Contrast of the Admin line | Pass: 5.53:1 (14 px, `rgb(133, 145, 164)` on `rgb(20, 25, 32)`, dark theme); the light theme not checked |
| 7 Target size | Pass: the closed card's header is 56 px high, the open one 44 px; the Admin line is a 16 px line inside the header button |
| 3 Screen reader | Not checked (VoiceOver) |
| `/secret-santa/min-sida` (the tall cards), checked 2026-11-11 signed in as a participant of a started group | Pass at 320 px: the page is 320 px wide with no sideways scroll; both cards are 176 px (11 rem) high and 286 px wide with the 30 px two-line text ("Min / önskelista", "Min matchning: / <name>") centred and the symbol above it; the text contrast is 11.36:1. Looked at in a screenshot. Target size is met (the cards are 176 px high links). 200 % zoom and the light theme not checked |
| Live tests (smoke) | The workflow run on `main` after the merge passed |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | not measured on `main` (MUPP-057: 284 unit + 139 browser, 287.9 s) | – | – |
| After | 333 unit (0.6 s) + 149 browser | 301.5 s (budget 180 s) | 7.2 s (MUPP-038, not touched) |

The suite is over its budget with and without this change (TECH-019). This change added no test and no page load; the other tests came from other cards merged since.

## Definition of Done

- [x] Tests: every requirement has a test; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: over budget before this change (TECH-019); nothing added here; accepted by the user (2026-11-12): the suite grew fast while the site was built
- [x] Deployed, and the smoke tests pass against production (Live tests): the run on `main` after the merge passed (2026-11-10)
- [x] Accessibility: axe passes locally and every changed state has an axe call; the live checklist (reflow, contrast, target size) is done for the Secret Santa tab and the own page; VoiceOver, 200 % zoom and the light theme are not checked (accepted as done by the user, 2026-11-11)
- [x] Requirements in the card match what was built (copied below)
- [x] Manual, system docs, `DESIGN.md` and `wiki/log.md` updated
- [x] No leftovers: the temporary size switch is removed
- [x] Clean code: `npm run lint`, `npm run typecheck`, `npm run build` pass
- [x] Code review: see [review.md](review.md)

## Requirements as built

- **MUPP-059-R1:** the closed card of a group that another parent administers shows the name, "<status>, N deltagare" and "Admin: <name>" on a line of its own; the visitor's own group has no admin line; the header stays at least 44 px with the group's name in its accessible name; no sideways scroll at 320 px.
- **MUPP-059-R2:** the two cards on `/secret-santa/min-sida` are at least 11 rem high, with a 40 px symbol over a centred 30 px two-line title ("Min / önskelista", "Min matchning: / <name>", grey card "Min matchnings / önskelista"); 44 px targets, contrast and accessible names kept; no sideways scroll at 320 px; chosen with the user (size of B, layout of C).
