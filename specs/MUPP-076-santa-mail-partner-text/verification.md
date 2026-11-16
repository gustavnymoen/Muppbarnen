---
type: Verification
title: "MUPP-076 Secret Santa mail: partner sentence: verification"
description: "How each requirement of Secret Santa mail: partner sentence was checked, the test suite before and after, and the requirements as built."
feature: MUPP-076
---

# Verification of MUPP-076

How each requirement was checked. Create this file when work starts and fill it in before the feature is done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-076-R1 | Test `MUPP-052-R1 mail 1 has exactly the subject and text of the card` in `lib/santa-mail.test.ts` | local | Pass | 2026-11-15 |
| MUPP-076-R2 | Same test: the whole text of mail 1 | local | Pass | 2026-11-15 |
| MUPP-076-R3 | Same tests for mails 1 and 8 (the contact sentence), and `tests/MUPP-051-santa-status.spec.ts` (the mail a new participant gets has the sentence and no administrator's name) | local | Pass | 2026-11-15 |
| MUPP-076-R4 | Test `MUPP-052-R1 mail 8 has exactly the subject and text of the card` | local | Pass | 2026-11-15 |
| MUPP-076-R5 | The signatures of `activatedMail` and `addedMail` take only the group (checked by the type check, not by a test); `MUPP-052-R1 no mail holds a member name, a wish or a message` | local | Pass | 2026-11-15 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/santa-mail.test.ts` (texts of mails 1 and 8, no secrets in any mail), `lib/santa-notify.test.ts` and `lib/santa.test.ts` follow the new signatures | local | Pass | 2026-11-15 |
| Browser tests | One assertion in `tests/MUPP-051-santa-status.spec.ts` changed (the mail has the new contact sentence, not the administrator's name); the whole suite passed in `npm run test:time`. One run had a flaky subpixel failure (43.99998 px) in `MUPP-071-R1`, unrelated to this change; the test passed 3 of 3 when run again | local | Pass | 2026-11-15 |
| Smoke test | Not applicable: nothing visible changes on the site | - | - | 2026-11-15 |
| Accessibility | Not applicable: no page changes | - | - | 2026-11-15 |
| Security | Security points in the review: the privacy rule gets stronger, no name goes into a mail; `/security-review` not needed | local | Pass | 2026-11-15 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-15 |

## Test suite

`npm run test:time` before and after the change.

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 397 unit + 176 browser (TECH-028) | 358.1 s | under 8 s |
| After | 397 unit + 176 browser | 354.4 s | 7.3 s |

Over the 330 s budget, as before this change. The change adds no tests and no run time. The user accepted the overrun on 2026-11-16.

## Definition of Done

- [x] Tests: every check in the test plan is done; every requirement is tested or has a recorded check; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: 354.4 s, over the 330 s budget as before; not growing; the overrun accepted by the user (2026-11-16, ticked by the user's say-so; the budget is now 350 s after TECH-029)
- [x] Deployed, and the smoke tests pass against production (Live tests): pull request 268 merged as commit 8c5acd5; Live tests run 43763277923 passed on 2026-11-15
- [x] Accessibility: not applicable, visitors see no change
- [x] Requirements in the card match what was built; `solution.md` describes how it was built
- [x] Manual: not applicable (the manual does not quote the sentences); system docs (`wiki/system/mail.md`) and `wiki/log.md` updated
- [x] No leftovers: `adminName`, `ownerName` and the administrator parameter of the mail functions are removed
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way: none

## Requirements as built

Copied from card #258 (MUPP-075 was merged into it, as R3–R5).

### MUPP-076-R1 Generic matching sentence

The sentence of mail 1 shall read "Du kan inte matchas med dig själv eller den du hade förra året! Har admin även satt partners på deltagarna får du inte din partner."

Acceptance criteria:

- **Given** mail 1 for any group, **when** it is built, **then** the sentence reads exactly as above, whether or not any member has a partner.

### MUPP-076-R2 Mail 1 as a whole

Mail 1 shall read, with the group's name in place of `<group>`:

> Ho-Ho! Nu har gruppen <group> öppnat. Gå in på sajten, välj Secret Santa och din grupp, logga in med ditt telefonnummer eller din e-post och skriv din önskelista. Senare dras lottningen, och du ser vem du ska handla åt.
> Du kan inte matchas med dig själv eller den du hade förra året! Har admin även satt partners på deltagarna får du inte din partner.
> Du kan fylla i din önskelista från och med nu och ändra fram till julafton, men var snäll mot din matchning och bestäm dig i tid!
> Allt är hemligt: ingen får veta vem som drar vem. Är det här inte du, eller vill du inte vara med, hör av dig till den som skapade gruppen.

(The last sentence is R3.)

Acceptance criteria:

- **Given** mail 1 for a group, **when** it is built, **then** the text is exactly the above.

### MUPP-076-R3 Contact sentence

The contact sentence of mail 1 and mail 8 shall read "Är det här inte du, eller vill du inte vara med, hör av dig till den som skapade gruppen."

Acceptance criteria:

- **Given** mail 1 and mail 8, **when** they are built, **then** they contain that sentence and no administrator's name.

### MUPP-076-R4 Mail 8 without a name

Mail 8 shall say "Du har lagts till i Secret Santa-gruppen <group>." without naming who added the person.

Acceptance criteria:

- **Given** mail 8 for a group, **when** it is built, **then** the text has the group's name and no person's name.

### MUPP-076-R5 No names in the mails

The mails shall be built from the group's name only.

Acceptance criteria:

- **Given** any mail of the series, **when** it is built, **then** its function takes no administrator or member name, and the text has none.

## Notes

- MUPP-075 (#257) was merged into this card; its requirements are R3–R5 here.
- The browser test of MUPP-051 expected the administrator's name in mail 1; it now expects the new contact sentence.
- The flaky subpixel height in `MUPP-071-R1` (43.99998 px against 44) is not caused by this change; not fixed here.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
