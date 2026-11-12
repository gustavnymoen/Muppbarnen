---
type: Verification
title: "TECH-017 Sending email: verification"
description: How each requirement of Sending email was checked, the test suite before and after, and the requirements as built.
feature: TECH-017
---

# Verification of TECH-017

How each requirement was checked. Dates are 2026-11-09. "Not checked" means the check was not done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-017-R0 | Unit tests `TECH-017-R0 …` in `lib/mail.test.ts` (logo with alt text, link, footer in HTML and plain text, escaping). `/icon.png` being public is MUPP-046-R4 (its smoke test `MUPP-046-R4 @smoke`, which passed in the local run) | local | Pass | 2026-11-09 |
| TECH-017-R1 | Unit tests `TECH-017-R1 …` with a faked `fetch`: the request, a provider error or failed request (and no `console` output), bad addresses. A real request to Resend: not checked (no key until TECH-020) | local | Pass | 2026-11-09 |
| TECH-017-R2 | Unit tests `TECH-017-R2 …`: the outbox with a local database and no key, a failure on a deployed database and without a database | local | Pass | 2026-11-09 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/mail.test.ts`, 7 tests | local | Pass | 2026-11-09 |
| Browser tests | Not applicable: no page | | | |
| Smoke test | Not applicable: a mail is never sent from a smoke test | | | |
| Accessibility | Not applicable: no page; the alt text of the logo is a unit test | | | |
| Security | Security points in the review; `/security-review` not needed (no route, action or sign-in; the cards that send mail are reviewed) | local | Pass | 2026-11-09 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-09 |

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | not measured on its own; the change adds no browser test and `main` was already over budget (TECH-019, about 270 s) | | |
| After | 241 unit (0.3 s) + 130 browser | 266.9 s (budget 180 s, over: TECH-019, not fixed here) | 6.9 s (MUPP-038-R2 …, over the 5 s budget, not touched) |

The seven new tests are unit tests and add no measurable time.

## Definition of Done

- [x] Tests: every requirement is tested; `npm run test:unit` (241) and `npm run test:local` (130) pass
- [x] Test suite: the browser suite is over its budget since before this change (TECH-019); this change adds no browser test; accepted by the user (2026-11-12): the suite grew fast while the site was built
- [x] Deployed, and the smoke tests pass against production (Live tests): the run on the merge commit ad32262 passed (2026-11-09)
- [x] Accessibility: not applicable (visitors see no change)
- [x] Requirements in the card match what was built, no open questions left; copied below; `solution.md` describes how it was built
- [x] Manual: not applicable (no visitor sees anything); system docs (`wiki/system/mail.md`) and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks: TECH-020 (go live with mail) was split off from this card

## Requirements as built

### TECH-017-R0 Mail layout

Every mail shall be short Swedish: the site's small logo at the top (the same picture as the browser tab icon, [MUPP-046](https://github.com/gustavnymoen/Muppbarnen/issues/144)), a heading and a short text that differ per mail, and the same footer in every mail: a link to the site (`https://www.kusinportalen.com`) and the line "Detta mail går inte att svara på." It is sent as a simple HTML mail with a plain-text copy, and reads well when images are blocked. A caller may name the event but `sendMail` itself knows no member names, wishes or message text.

Acceptance criteria:

- **Given** any mail sent with `sendMail`, **then** it has the logo (with an alt text), that footer line and that link, and the callers can only set the subject, the heading and a short text.
- **Given** the text of a caller holds HTML characters, **then** they are escaped in the HTML part.
- **Given** the logo, **then** it is the site's icon at `/icon.png`, which is already public without the site password ([MUPP-046](https://github.com/gustavnymoen/Muppbarnen/issues/144)-R4), so nothing new is made public.

### TECH-017-R1 Send a plain mail

The server shall send one mail to one address through the provider.

Acceptance criteria:

- **Given** a valid address and the provider's key, **when** `sendMail` runs, **then** one request goes to the provider's API with the sender address, the recipient, the subject, the HTML and the plain text, and the key in the Authorization header.
- **Given** the provider answers with an error or the request fails, **when** `sendMail` runs, **then** the caller gets a failure it can handle (`{ ok: false }`, not an exception), and the log holds no address, key or mail text.
- **Given** an address that is not an email address, **then** nothing is sent and the caller gets a failure.

### TECH-017-R2 No real mail in development and tests

Local runs and tests shall not send real mail.

Acceptance criteria:

- **Given** a local or test run, **when** `sendMail` runs, **then** nothing leaves the machine and the mail (recipient, subject, text, heading) can be read by tests.
- **Given** a deployed site (no local database) without a key, **when** `sendMail` runs, **then** nothing is sent and the caller gets a failure.

## Notes

- The card was split with the user on 2026-11-09: real sending (domain, Resend account, key, deliverability check) moved to TECH-020 (#168). The provider call is written and unit-tested here but off until `RESEND_API_KEY` is set.
- The outbox is used when there is no key and the database is a local file, not by `NODE_ENV`, because the test server runs as a production build.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
