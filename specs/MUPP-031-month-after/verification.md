---
type: Verification
title: "MUPP-031 Wish list stays a month after the occasion: verification"
description: How each requirement of Wish list stays a month after the occasion was checked, the test suite before and after, and the requirements as built.
feature: MUPP-031
---

# Verification of MUPP-031

How each requirement was checked. Dates count in Swedish time; the unit tests choose the day, the browser tests count from today.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-031-R1 | Unit tests `MUPP-031-R1 …` in `lib/deck.test.ts` (the day itself, day 1, day 30, day 31, one card per kid on every day of a year, 29 February); browser test `MUPP-031-R1 R3 …` in `tests/MUPP-031-month-after.spec.ts` ("Fyllde 6 år", the date, claiming); live: a "Fyllde 2 år" card with its date was in the deck (seen, not claimed from) | local, live | Pass | 2026-11-03 |
| MUPP-031-R2 | Unit tests `MUPP-031-R2 …` and `MUPP-031-R1 R2 one … card … on every day of a year` (25 December, 31 December, 1 January, 23 January, 24 January) | local | Pass | 2026-11-03 |
| MUPP-031-R3 | Unit tests `MUPP-031-R3 …` (order, the next card marked, a card that resets moves); browser test `MUPP-031-R1 R3 …` (opens on "Nästa", the card one step back) | local | Pass | 2026-11-03 |
| MUPP-031-R4 | Unit tests `MUPP-031-R4 …` in `lib/deck.test.ts` (the rule: day 30/31, an item added during the month after, Christmas Eve across the new year, the birth) and in `lib/family.test.ts` (the added date, archived items left out of the start page and the editable list, claimed in the month after, claim/unclaim/edit/remove refused); migration test `MUPP-031-R4 …` in `db/db-setup.test.ts` | local | Pass | 2026-11-03 |
| MUPP-031-R5 | Unit tests `MUPP-031-R5 …` in `lib/family.test.ts` (groups, names, order, "Töm listan"); browser test `MUPP-031-R5 R7 …` (section, folded group, rows with "Paxad av", no dates, no edit or remove, axe) | local | Pass | 2026-11-03 |
| MUPP-031-R6 | Unit tests `MUPP-031-R6 …` and `MUPP-011-R3 MUPP-031-R6 …` in `lib/deck.test.ts` ("Beräknad" the day before, "Född" from the birthdate (day 0) to day 30, then "Fyller 1 år", by the dates only), `MUPP-031-R4 R6 …` (the list made in advance is archived on day 31). Not in a browser test: the card plan names none; live: a "Född" card with its date and an open list was in the deck | local, live | Pass | 2026-11-03 |
| MUPP-031-R7 | Unit tests `MUPP-031-R7 …` in `lib/family.test.ts` (copy into both lists, unclaimed, added today, archive kept; refused for an item not archived, another parent, no parent, a bad list or id); browser test `MUPP-031-R5 R7 …` (dialog, Avbryt and Esc, Julafton, focus back to "+", "+" at least 24 px, axe on the dialog); `lib/route-checks.test.ts` covers the new action's check order | local | Pass | 2026-11-03 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/deck.test.ts`, `lib/family.test.ts`, `db/db-setup.test.ts` (migration on a copy in memory); `npm run test:unit` 161 passed | local | Pass | 2026-11-03 |
| Browser tests | `tests/MUPP-031-month-after.spec.ts` (2 tests), the whole suite with `npm run test:time` 112 passed | local | Pass | 2026-11-03 |
| Smoke test | Not applicable: the card's plan names none (same pages, the existing smoke tests cover that they load). The existing smoke tests ran after the deploy: Live tests on `main` at the merge commit f04aeb0 (run 41669447211) passed | live | Pass | 2026-11-03 |
| Accessibility | axe (`expectNoA11yViolations`) on the card in the month after, the archive with a group open, and the copy dialog. Live, start page (a "Född" card and a "Fyllde 2 år" card, 375 px): per item below. Live, admin page: not checked, see below | local, live | Pass (axe); live partly checked | 2026-11-03 |
| Security | Security points in the review; `/security-review`: no findings (see [review.md](review.md)) | local | Pass | 2026-11-03 |
| Code review | [review.md](review.md) | local | Passed (run 2; run 1 stopped on the birth day, resolved with the user) | 2026-11-03 |
| Design | `/impeccable critique` (degraded, single context: no sub-agents spawned for it) on screenshots at 375 px of the "Fyllde" card and the archive; the detector found nothing; the arrow of an open group now turns up | local | Done | 2026-11-03 |

## Live accessibility checks

On https://muppbarnen.vercel.app, 2026-11-03, in the built-in browser at 375 px. Read-only: nothing was claimed, copied or changed.

**Start page**, a "Född" card (born 30 October) and a "Fyllde 2 år" card (birthday 4 October, its last day in the month after), both still in the deck:

| # | Item | Result |
|---|---|---|
| 1 | Keyboard | Not checked (the browser pane gives no reliable Tab order) |
| 2 | Focus visible | Not checked |
| 3 | Screen reader | Not checked (VoiceOver not run); the headings are H2 date and H3 name and the fold buttons have `aria-expanded` (read from the page) |
| 4 | Zoom 200 %, 320 px | 375 px: no sideways scroll; 200 % and 320 px not checked |
| 5 | Text spacing | Not checked |
| 6 | Contrast | "Född" 5.53:1, date and name 11.36:1, "Önskelista" button text about 6:1 (estimated from the colours). "Fyllde 2 år" line not measured |
| 7 | Target size | Folds 192×60 and 229×72 px, the sizes button 44×44 px: pass |
| 8 | Hover or focus content | Not affected: no new menus or tooltips |
| 9 | Errors and labels | Not affected: no form |
| 10 | Title, language, images | `lang="sv"`, the title names the page; no new images |
| 11 | Reduced motion | Not checked |

**Admin page** `/admin/barn/<id>/onskelistor` (the three kids of the signed-in parent): there is no "Arkiv" on any of them, because they have no archived items yet, and the archive cannot be made without changing real data. So the Arkiv group, the fold buttons in it, the "+" label "Lägg till … igen" and its size, and focus into and out of the copy dialog are **not checked live**; they are covered by the local browser test `MUPP-031-R5 R7 …` (axe, "+" at least 24 px, focus back to "+"). They need checking when a kid first gets an archived item.

## Test suite

`npm run test:time` before (from TECH-013's after, the same `main`) and after the change.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 141 unit + 110 browser | 173.4 s (browser) + 0.3 s (unit) | 4.5 s |
| After | 161 unit + 112 browser | 178.0 s (browser) + 0.3 s (unit) | 4.6 s |

Two browser tests added (1.4 s each) and 20 unit tests. Three runs gave 178.5 s, 182.0 s (over the budget) and, after the R5 and R7 tests were merged into one to share the admin setup, 178.0 s. The suite is within the budget but at it, so [TECH-015](https://github.com/gustavnymoen/Muppbarnen/issues/111) is at the top of the backlog to win time back, as `wiki/system/testing.md` asks.

## Definition of Done

- [x] Tests: every check in the card's test plan is done (except the live checklist, after the deploy); every requirement is tested; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: within the time budgets (178.0 s of 180 s; TECH-015 added), total time grown by 3 %, the new tests follow the quality rules
- [x] Deployed, and the smoke tests pass against production (Live tests: run 41669447211 on `main` at f04aeb0, green)
- [ ] Accessibility: axe passes on the changed states; the live checklist is done for the start page only in part, and not for the admin archive (see Live accessibility checks), so this stays open
- [x] Requirements in the card match what was built (R6 updated with the user, see Notes), no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: reuses `SlimCard`, `Fold`, `Dialog`, `IconButton`; `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks: TECH-015 (test suite at its time budget) added at the top of the backlog

## Requirements as built

Copied from the card (#66) on 2026-11-03.

### MUPP-031-R1 The card stays during the month after a birthday

The site shall keep a kid's birthday card, with the same list, for the month after the birthday, and say that the kid turned their age.

Acceptance criteria:

- **Given** a kid whose birthday was 1 to 30 days ago, **when** the start page is shown, **then** the kid's card shows that day's date and "Fyllde X år", with the list as it was, and the list can be claimed from as usual.
- **Given** the same kid 31 days after the birthday, **when** the start page is shown, **then** the card shows next year's date and "Fyller X+1 år", with an empty list (until the parent adds items).
- The kid has one birthday card at a time: never a "Fyllde" card and a "Fyller" card for the same birthday at once.
- A 29 February birthday counts from the day it is celebrated that year (28 February in a year without 29 February, as today).

### MUPP-031-R2 Christmas Eve stays for the month after

Acceptance criteria:

- **Given** a date from 25 December to 23 January, **when** the start page is shown, **then** the Christmas Eve card shows the lists for the Christmas Eve that just passed, and they can be claimed from.
- **Given** 24 January, **when** the start page is shown, **then** the Christmas Eve card is for the next Christmas Eve, with empty lists.
- There is one Christmas Eve card at a time.

### MUPP-031-R3 Place in the deck

Acceptance criteria:

- **Given** one or more cards in the month after, **when** the start page opens, **then** the deck still opens on the next upcoming card ("Nästa födelsedag" or "Nästa: Julafton"), and the cards in the month after lie just before it (one step back), the most recent nearest.
- When a card resets (R1, R2), it moves to its place among the upcoming cards.

### MUPP-031-R4 The whole list is archived

The site shall archive every item of a list when the month after its occasion is over.

Acceptance criteria:

- **Given** a list with claimed, unclaimed and unlimited items for an occasion, **when** the month after that occasion is over, **then** none of them shows on the start page or among the editable items on the admin page.
- **Given** a parent who adds an item during the month after, **when** the start page is shown, **then** the item shows on the card for the occasion that just passed, and it is archived with the rest when the month is over.
- **Given** an item added before the occasion, **when** it is claimed during the month after, **then** the claim works and the item is archived with the rest.
- An archived item cannot be claimed, edited or removed; the server refuses it even if the request is sent anyway.
- Items that existed before this feature count as added on the day the migration runs.

### MUPP-031-R5 The archive on the admin page

Acceptance criteria:

- **Given** a kid with archived items, **when** a parent opens the kid's wish lists on the admin page, **then** under the lists there is a section "Arkiv" with one folded group per archived occasion, named by the occasion and its year (for example "Födelsedag 2025", "Julafton 2026"; Christmas Eve 2026 is archived in January 2027 but named 2026), newest first.
- **Given** the section, **when** the parent opens a group, **then** it shows that occasion's archived items as slim rows, each with its title and, if it was claimed, who claimed it, and no dates on the rows.
- Archived items can't be edited, removed or claimed; the only button on them is the small "+" (R7).
- **Given** a kid without archived items, **when** the page is shown, **then** there is no "Arkiv" section.
- "Töm listan" removes only the items that are not archived.

### MUPP-031-R6 A newborn: "Född"

Acceptance criteria:

- **Given** a kid whose birthdate is after today, **when** the start page is shown, **then** the card shows "Beräknad" and the date (MUPP-011, unchanged).
- **Given** a kid whose birthdate is today or up to 30 days ago, **when** the start page is shown, **then** the card shows the birthdate and "Född", with the list (also one made in advance), and the list can be claimed from. This holds for every kid, however and whenever it was added: it is decided by the dates only.
- **Given** the same kid 31 days after the birthdate, **when** the start page is shown, **then** the card shows the first birthday and "Fyller 1 år", and the list for the birth is archived.
- This changes MUPP-011-R3 for kids born in the last 30 days: they are shown "Född" (age 0) instead of "Fyller 1 år"; from day 31 the first birthday comes next, as before.

### MUPP-031-R7 Add an archived item again

The site shall let a parent copy an archived item into one of the kid's current lists.

Acceptance criteria:

- **Given** an archived item, **when** the parent presses its small "+" (labelled for screen readers, for example "Lägg till Cykel igen"), **then** a dialog asks which list to add it to, with the choices "Födelsedag", "Julafton" and "Avbryt".
- **Given** the dialog, **when** the parent chooses "Födelsedag" or "Julafton", **then** a copy of the item (title, description, size, link and unlimited) is added to that list of the same kid, unclaimed and with today as its added date, and the archived item stays in the archive.
- **Given** the dialog, **when** the parent chooses "Avbryt" or presses Esc, **then** nothing changes.
- The "+" is at least 44 px (or 24 px with room around it, as the other compact icon buttons), and focus returns to it when the dialog closes.
- Only a parent who may manage the kid can copy; the server checks it, and that the item is archived and belongs to that kid.

## Notes

- **R6 changed with the user (2026-11-03):** the card first said "Född" only for a kid added before its birth, which needed a date for when a kid was added. The user chose the dates only: before the birthdate "Beräknad", from the birthdate (day 0) to day 30 "Född", then "Fyller 1 år", however the kid was added. The card's R6, scope and terms are updated and say that this changes MUPP-011-R3 for kids born in the last 30 days; its unit test is updated. Kids get no added date.
- **Dates in the browser tests** count from today. The R1 test is skipped on 25 December, when the Christmas Eve card (also a day ago) is the card one step back. Older tests with fixed birthdates (for example `2020-05-17` in `tests/family-db.ts`) will see a card in the month after for 30 days a year; the whole suite passed today, but not on every day of the year.
- An archived item sent to "Paxa" counts as missing, so the visitor gets the existing message that something is no longer there.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
