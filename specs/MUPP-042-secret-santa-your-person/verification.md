---
type: Verification
title: "MUPP-042 Secret Santa: your person and change mails: verification"
description: How each requirement of the started own page and the change mails was checked, the test suite before and after, and the requirements as built.
feature: MUPP-042
---

# Verification of MUPP-042

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-042-R1 | Unit tests `MUPP-042-R1` (`lib/santa-match.test.ts`: the name and wishes of the one drawn; nothing before the start or without a row; only this year's draw); browser tests `MUPP-042-R1 R2 …` (the link card, the read-only list without buttons, axe) and `MUPP-042-R1 before the start…` (grey card, the match page leads back); the cards on a phone in `tests/design.spec.ts` | local | Pass | 2026-11-10 |
| MUPP-042-R2 | Unit test `MUPP-042-R2` (`lib/santa-match.test.ts`: A→B, B→C, C→A and D↔E each see only their own receiver, and the answer holds no giver); browser test `MUPP-042-R1 R2 …` (pages of Anna, Bo and Dan never name who gave to them) | local | Pass | 2026-11-10 |
| MUPP-042-R3 | Unit tests `MUPP-042-R3` (`lib/santa-changes.test.ts`: marks only in a started event; several changes one mail, the next an hour later; none without change; a failed mail is retried; two runs one mail; start and stop clear the marks; mail names the group only; `lib/santa-job.test.ts`: the secret; `proxy.test.ts`, `lib/route-checks.test.ts`); browser tests `MUPP-042-R3 a changed list mails the giver…` (the job without cookie, refused without its secret, mails from the test sink) and `MUPP-042-R3 a change while … preparing…` (no mail) | local | Pass | 2026-11-10 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Hourly collecting (several changes one mail, none no mail) and who may read which list: `lib/santa-changes.test.ts`, `lib/santa-match.test.ts`, `lib/santa-job.test.ts`, `proxy.test.ts`, `lib/route-checks.test.ts` | local | Pass | 2026-11-10 |
| Browser tests | New `tests/MUPP-042-santa-your-person.spec.ts` (4 tests) with axe, and the started own page and match list in the phone test of `tests/design.spec.ts`; mails from the test sink | local | Pass | 2026-11-10 |
| Smoke test | None, as planned | not applicable | Not applicable | 2026-11-10 |
| Accessibility | axe on the started own page and the match page. The live checklist: see "Live accessibility check" below | local and live | Pass locally; live checked in the section below, with items not checked listed there | 2026-11-10 |
| Security | `/security-review` and the review's security points: [review.md](review.md) | local | Pass (no finding) | 2026-11-10 |
| Code review | [review.md](review.md) | local | Passed (run 1, no must-fix) | 2026-11-10 |
| The scheduled job live | Not checked: it needs `SANTA_JOB_SECRET` set in Vercel and in GitHub (see solution.md) | live | Not checked | 2026-11-10 |

## Live accessibility check

Checklist in `wiki/system/accessibility.md`, on https://muppbarnen.vercel.app in the built-in browser, signed in by the user, phone width (375 px) and 320 px, on the existing group Bollnäs (started, made by the user). Nothing was created or changed in production; the dialogs were opened and cancelled. Names shown are the user's own test names and are not recorded here.

| Item | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| 4, 6, 7, 10 Own page in a started group (`/secret-santa/min-sida`) | The title "Din Secret Santa-sida | Kusinportalen"; the heading "Hej Gustav!"; two links, "Min önskelista" and "Min matchning: <name>", each 341 × 60 px, text contrast about 13:1 (against the page background, the card is transparent), the symbols hidden from screen readers; 375 px wide without sideways scroll | live | Pass | 2026-11-10 |
| 4, 6, 10 The match page (`/secret-santa/min-sida/matchning`) | The title "Min matchning | Kusinportalen"; the heading "Önskelistan hos <name>" with the wishes as a list, read-only (no buttons), a "Tillbaka" link to the own page; no sideways scroll | live | Pass | 2026-11-10 |
| 1 The grey card before the start | Not checked: it needs a group that is not started | live | Not checked | 2026-11-10 |
| The scheduled job live | The Live tests above passed, but whether `POST /api/santa-mails` mailed a giver was not checked here (it would need a changed wish and a real mail); it runs from GitHub Actions every ten minutes, the user reports that it works | live | Not checked by this session | 2026-11-10 |
| 3 Screen reader (VoiceOver) | Not checked: no screen reader could be run from this session. The accessibility tree read in the browser gives the names below. | live | Not checked | 2026-11-10 |
| 5 Text spacing | Not checked: the bookmarklet was not applied | live | Not checked | 2026-11-10 |
| 11 Reduced motion | Not checked: the system setting was not changed from this session | live | Not checked | 2026-11-10 |
| 10 Title, language, images | Titles and `<html lang="sv">` as listed above; no new images | live | Pass | 2026-11-10 |
| 1, 2 Keyboard and focus | Where listed above. The rest of the tab order was not walked through | live | Partly checked | 2026-11-10 |
| Live tests after the merge | `gh run list --workflow "Live tests"`: after the merge of MUPP-041 (main, 2026-11-10 13:34 UTC) and of MUPP-042 (main, 2026-11-10 14:01 UTC) the run passed (success) | live | Pass | 2026-11-10 |

## Test suite

`npm run test:time` (budgets in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 311 unit + 141 browser (`main` after MUPP-041, plus MUPP-056) | over budget already (TECH-019) | over 5 s (TECH-019) |
| After | 332 unit (0.5 s) + 149 browser | 305.2 s (budget 180 s), the machine shared with other sessions | 6.9 s (MUPP-038, not touched) |

The suite is over its budget with and without this change (TECH-019). The four new browser tests take about 4 s together; the phone test of `tests/design.spec.ts` grew by a few reads.

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested; `npm run test:unit` and `npm run test:local` pass
- [ ] Test suite: over budget as before (TECH-019); the new tests follow the quality rules
- [x] Deployed, and the smoke tests pass against production (Live tests): passed after the merge, 2026-11-10
- [ ] Accessibility: axe passes; the live checklist is done for the points in "Live accessibility check"; VoiceOver, text spacing and reduced motion are not checked
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way: none

## Requirements as built

Copied from the card (`gh issue view 140`). Built as written. The open question about the timer was settled as a scheduled GitHub Actions workflow calling a secret-protected route every ten minutes, which sends at most one mail an hour per list (see `solution.md`).

### MUPP-042-R1 Your person and their list

A member shall see the person they drew and that person's wishes, once the event is started.

Acceptance criteria:

- **Given** an event that is not started, **then** the second card is greyed with "Inte tilldelad än" (MUPP-051-R6).
- **Given** a started event, **then** the second card is active and reads "Min matchning: <NAME>"; opening it shows that person's wishes, read-only.

### MUPP-042-R2 Only your own draw

A member shall never see who anyone else drew, nor who drew them.

Acceptance criteria:

- **Given** member A, **when** any page or response is read, **then** it holds only A's receiver, never A's giver; the draw may be asymmetric (A→B, B→C), and D and E may draw each other.

### MUPP-042-R3 Change mail

The giver shall get a mail when the receiver has added, edited or removed wishes after the draw, collected into one mail an hour and not one per change.

Acceptance criteria:

- **Given** a change after the draw, **then** the giver gets a short mail that "something changed", without the new text and without any member's name, but naming the event.
- **Given** several changes within an hour, **then** they are collected and only one mail is sent for them, once an hour, to the giver of each receiver who changed their list.
- **Given** no change since the last mail, **then** no mail is sent.
- **Given** a change while the event is not started, **then** no mail.
- **Given** the mail text, **then** it is mail 5 of MUPP-052.

## Notes

The job does nothing until `SANTA_JOB_SECRET` is set in Vercel (Production) and as a repository secret in GitHub.
