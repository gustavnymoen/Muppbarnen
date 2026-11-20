---
type: Verification
title: "MUPP-086 Help dialog texts and Secret Santa sections: verification"
description: How each requirement of the help dialog texts was checked, the test suite before and after, and the requirements as built.
feature: MUPP-086
---

# Verification of MUPP-086

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-086-R1 | Test `MUPP-086-R1 R2 …` in `tests/MUPP-086-help-texts.spec.ts` (heading order and exact text) | local | Pass | 2026-11-20 |
| MUPP-086-R2 | Same test (order of the parts, new text, old text gone); `MUPP-035` test updated to the new text | local | Pass | 2026-11-20 |
| MUPP-086-R3 | Test `MUPP-086-R3 …`: no list items or headings, three paragraphs per tab, equal `offsetHeight` on the tabs; axe on both panels | local | Pass | 2026-11-20 |
| MUPP-086-R4 | Manual: screenshots on a 375 px phone (Besökare, Deltagare, Admin) shown to the user, who approved the grouping and spacing ("Godkänt, fortsätt") | local | Pass | 2026-11-20 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: texts and markup only (441 existing pass) | local | Pass | 2026-11-20 |
| Browser tests | `MUPP-086-help-texts.spec.ts` (2 tests, axe on each panel); spacing check in `design.spec.ts`; `MUPP-050` and `MUPP-035` tests updated | local | Pass | 2026-11-20 |
| Smoke test | Not applicable for new tests (no new page or flow); the existing smoke tests ran as Live tests after the merge (run 44751363861) | preview, live | Pass | 2026-11-20 |
| Accessibility | axe in the new tests; the live checklist is not done | local | Not checked live | 2026-11-20 |
| Security | Not applicable: static texts, no input, route or data | - | - | - |
| Code review | [review.md](review.md) | local | Passed | 2026-11-20 |

## Test suite

`npm run test:time`, clean run after the review fixes: 441 unit and 188 browser tests, all pass.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (main, MUPP-085) | 441 unit, 186 browser | 347.3 s | 6.9 s |
| After | 441 unit, 188 browser | 357.2 s (7.2 s over the 350 s budget) | 7.4 s |

The two new tests take about 1.3 s together; the rest of the rise is run-to-run variation on a suite that was already at its budget (an earlier run gave 365 s). Handled by [TECH-030](https://github.com/gustavnymoen/Muppbarnen/issues/301) (test suite time again); the Next.js security stop on the first build is [TECH-031](https://github.com/gustavnymoen/Muppbarnen/issues/302).

## Definition of Done

- [x] Tests: every requirement is tested or has a recorded manual check; unit tests and the affected browser tests pass
- [ ] Test suite: 7 s over the time budget, handled by TECH-030 (see above)
- [x] Deployed (pull request 303), and the smoke tests pass against production (Live tests, run 44751363861, 2026-11-20)
- [ ] Accessibility: axe passes; the live checklist is not checked
- [x] Requirements in the card match what was built, no open questions left; copied below
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers: the `bullets` field and its list markup are deleted
- [x] Clean code: `npm run lint`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Larger improvements added to the board: TECH-030 (test time) and TECH-031 (Next.js security upgrade)

## Requirements as built

### MUPP-086-R1 Own gifts text

The tab "Besökare" shall have a part "Lägg till egna presenter" directly after "Ångrat dig eller klickat fel?".

Acceptance criteria:

- **Given** the dialog on "Barnens listor" > "Besökare", **then** the part after "Ångrat dig eller klickat fel?" has the heading "Lägg till egna presenter" and the text "Du kan i barnens önskelista lägga till egna presenter om du kommer på något som inte finns i önskelistan. Du kan sedan ta bort den om du ångrat dig.", styled like the other parts.

### MUPP-086-R2 Choose family first

"Välj familj" shall be the first part of "Besökare", with the text "Välj de familjer du tillhör, så får du bara upp relevanta barn och Secret Santa-grupper. Du hittar filtret uppe i vänstra hörnet.".

Acceptance criteria:

- **Given** the dialog on "Barnens listor" > "Besökare", **then** the parts are in the order "Välj familj", "Önskelistor", "Paxa en present", "Ångrat dig eller klickat fel?", "Lägg till egna presenter", and the old text of "Välj familj" is gone.
- **Given** the intro line of the tab, **then** it is still above all parts.

### MUPP-086-R3 Secret Santa guides in sections

The tabs "Deltagare" and "Admin" shall show their texts as a few sections instead of a bullet list, with no bold headings and no change to the wording.

Acceptance criteria:

- **Given** "Secret Santa" > "Deltagare" or "Admin", **then** the panel has no list items and no headings, the texts are paragraphs grouped as agreed in the design check, and every sentence of today's bullets is still there in the same order.
- **Given** the four panels, **then** the dialog is still the same size on all of them (MUPP-050-R4) and its scroll arrow and OK button work as before.

### MUPP-086-R4 Design agreed before the build

The grouping and look of the sections shall be agreed with the user on a phone before the work is built.

Acceptance criteria:

- **Given** the proposal in the Design section, **then** the user has seen it in the running site on a phone-sized screen and approved the grouping and spacing, and the result is written in the Design section and in `DESIGN.md`.

## Notes

- "Secret Santa-grupper" is capitalised as on the rest of the site (decided with the user).
- The MUPP-080-R7 sentence "Valet filtrerar bara det som visas" is gone with the user's new text for "Välj familj"; its test check now looks for the new text.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
