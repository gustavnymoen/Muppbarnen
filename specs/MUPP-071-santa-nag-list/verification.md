---
type: Verification
title: "MUPP-071 Secret Santa: nag the match for a list: verification"
description: How each requirement of the nag button was checked, the test suite before and after, and the requirements as built.
feature: MUPP-071
---

# Verification of MUPP-071

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-071-R1 | Tests `MUPP-071-R1 …` in `tests/MUPP-071-santa-nag-list.spec.ts` (shown only for an empty list, SVG icon aria-hidden, 44 px, axe) and `MUPP-071-R1 R3 …` in `tests/design.spec.ts` (red border, text and icon, contrast, no horizontal scroll at 375 px) | local | Pass | 2026-11-12 |
| MUPP-071-R2 | Unit tests in `lib/santa-nag.test.ts` (mail to the match only, no name, failed mail stays, dropped request) and `lib/santa-mail.test.ts` (mail 9); browser test `MUPP-071-R2 R3 R4 …` calls the job and reads the outbox; `MUPP-071-R2 a wish written …` | local | Pass | 2026-11-12 |
| MUPP-071-R3 | Unit tests (locked while waiting and an hour after sending, with a fake clock; start/stop and cleanup clear it; a second request is refused by the server); browser tests for both disabled texts and for the button opening again after an hour. A direct call past the disabled button is covered by the unit tests only: React ignores clicks on a disabled button, so a browser test cannot make one | local | Pass | 2026-11-12 |
| MUPP-071-R4 | Unit tests: only the giver of a started group, receiver from the draw, a match with a wish is refused; `nagForList` takes no argument and passes `lib/route-checks.test.ts` | local | Pass | 2026-11-12 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/santa-nag.test.ts` (new), additions to `santa-mail`, `santa-cleanup`, `santa-match` tests; `npm run test:unit` 393 passed after merging main (388 before) | local | Pass | 2026-11-12 |
| Browser tests | `tests/MUPP-071-santa-nag-list.spec.ts` (3) and one test in `tests/design.spec.ts`; full `npm run test:time` after the last change: 170 passed | local | Pass | 2026-11-12 |
| Smoke test | Not applicable: the page is behind a sign-in and the smoke tests are read-only | n/a | n/a | 2026-11-12 |
| Accessibility | axe on the empty, the queued and the "Du har tjatat nyss" state in the browser tests. The checklist in `wiki/system/accessibility.md` on the live site: marked done by the user on 2026-11-13; no per-item details were recorded | local, live | Pass | 2026-11-12 |
| Security | Security points of the review; `/security-review` run on the change: no findings | local | Pass | 2026-11-12 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-12 |
| Look | The red button, empty and locked, seen on a 375 px phone in the test run (screenshots); the user liked it and asked for the text and the button to be centred, which is done and checked in `tests/design.spec.ts` | local | Pass | 2026-11-12 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 375 unit + 167 browser (TECH-022) | 338.8 s | 7.4 s |
| After | 388 unit + 170 browser (before merging main; 393 unit after it, the browser tests of MUPP-071, 042 and 043 re-run: 17 passed) | 340.2 s | 7.4 s |

Over the 330 s budget, as it already was before this change (338.8 s, accepted by the user in TECH-022); the three new browser tests add about 1 to 4 s (340.2 s now, 338.8 s before).

## Definition of Done

- [x] Tests: every check in the card's test plan is done except the live ones; `npm run test:unit` and `npm run test:local` pass
- [ ] Test suite: over the 330 s budget, as before (see above); the new tests follow the quality rules
- [ ] Deployed, and the smoke tests pass against production (Live tests): not yet, nothing is merged
- [x] Accessibility: axe passes; the live checklist was gone through by the user (no per-item details recorded)
- [ ] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built.
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements: none

## Requirements as built

### MUPP-071-R1 The button

When the group is started and the match's list is empty, the page of the match's list shall show, under the text that says the list is empty, a button with a red border, a red angry Santa icon (a drawn SVG icon in the style of the site's other icons, never an emoji) and the red text "Tjata in en lista".

Acceptance criteria:

- **Given** a started group where my match has no wishes, **when** I open my match's list, **then** the text that the list is empty is shown with the button "Tjata in en lista" under it.
- **Given** my match has at least one wish, **then** the button is not shown.
- The button is at least 44 px high, has a visible focus, red text and border that meet the contrast rules, and the icon is an SVG, not an emoji or a text character, and is decorative (hidden from screen readers); the name of the button is its text.

### MUPP-071-R2 The mail

Pressing the button shall queue one mail to the match, sent by the scheduled job that sends the change mails, but only when the request has waited at least an hour, so the mail does not ping the match soon after the giver pressed the button (the giver may be sitting with them). The mail is mail 9 in the series of `lib/santa-mail.ts`; it has no heading and no home-screen tip. The subject is "Secret Santa: <group> – Din secret santa vill ha in en lista!" (the group first, as in the other Secret Santa mails), and the text is: "Rappa på! Din secret santa vill att du skickar in en önskelista, personen är het på gröten! Ho ho ho!" The mail names the group and nothing else: not the giver, not a name, not a wish.

Acceptance criteria:

- **Given** I pressed the button, **when** the job runs, **then** my match gets the mail with that subject and text, and nobody else does.
- **Given** the match has written a wish before the job runs, **or** the draw has been stopped, **then** no mail is sent and the request is dropped.
- **Given** a mail fails to send, **then** the request stays and the next run tries again.
- The mail is added to `lib/santa-mail.ts` and the table of mails in `wiki/system/mail.md`.
- The job's answer still only counts numbers (the nag mails are added to `sent` and `failed`).

### MUPP-071-R3 No spamming

While a nag mail waits to be sent, and for an hour after one was sent to that person, the button shall not be clickable, and the server shall refuse a request in that time. The state belongs to the match (the person nagged), not to the giver, and a started group gives a person exactly one giver.

Acceptance criteria:

- **Given** I pressed the button and the mail has not been sent, **then** the button is disabled and says "Tjatet är på väg", and a direct call to the server action is refused without queueing a second mail.
- **Given** the mail was sent less than an hour ago, **then** the button is disabled and says "Du har tjatat nyss", and the server refuses a request.
- **Given** the mail was sent more than an hour ago and the list is still empty, **then** the button is clickable again.
- Both disabled states are understandable without colour (the text says why) and keep the icon, greyed out.
- The request and the sent time are in the database on the match's `ss_member` row (like `list_changed_at` and `list_mailed_at`), so nothing is lost between two runs, and starting or stopping the draw or the yearly cleanup clears them.

### MUPP-071-R4 Only the giver, only an empty list

The server shall accept the request only from the signed-in giver of a started group, and only while the match's list is empty. The receiver is found on the server from the draw (`matchOf`), never from the request.

Acceptance criteria:

- **Given** a member who is not in a started group, or whose match has wishes, **when** they call the action, **then** nothing is queued.
- **Given** any request, **then** nobody can nag anyone except their own match.

[Specifications](../index.md)
