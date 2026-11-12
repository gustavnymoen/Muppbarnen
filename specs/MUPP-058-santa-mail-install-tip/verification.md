---
type: Verification
title: "MUPP-058 Install tip in Secret Santa mails: verification"
description: How each requirement of the install tip in Secret Santa mails was checked, the test suite before and after, and the requirements as built.
feature: MUPP-058
---

# Verification of MUPP-058

How each requirement was checked. Dates are 2026-11-10. "Not checked" means the check was not done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-058-R1 | Tests `MUPP-058-R1 …` in `lib/santa-mail.test.ts`: mails 1, 3 and 8 have the tip after the button and the footer line (a numbered `<ol>` in HTML, steps numbered 1 to 3 in plain text), mails 2, 4, 5, 6 and 7 have none, the tip is one constant with three steps and the address from `SITE_URL`; the MUPP-052-R1 tests (exact text, no names) still pass | local | Pass | 2026-11-10 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/santa-mail.test.ts` (new tests above), `lib/mail.test.ts` unchanged and passing | local | Pass | 2026-11-10 |
| Browser tests | None added, as planned. The existing tests that read the mails from the outbox (MUPP-051) passed in `npm run test:local` | local | Pass | 2026-11-10 |
| Smoke test | Not applicable (no page changes) | | | |
| Accessibility | Not applicable on the site. The steps are a real `<ol>` in the HTML mail (unit test) | local | Pass | 2026-11-10 |
| Security | Fixed text, no input, so `/security-review` is not needed; the security points are in the review | local | Pass | 2026-11-10 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-10 |

Not checked: how the tip looks in a real mail client (no real mail is sent until TECH-020).

## Test suite

`npm run test:time`; the browser tests are the same as before (no new ones), the unit tests grew by 9 (the tip's tests, with `test.each` over the mails).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 284 unit + 139 browser (`main`) | over budget already (TECH-019) | over 5 s (TECH-019) |
| After, run 1 | 293 unit (0.4 s) + 139 browser | 71.2 s | 6.4 s |
| After, run 2 | 293 unit (0.4 s) + 139 browser | 282.8 s (the machine was busy with other sessions' test runs) | 7.0 s |

The two runs of the same code differ by a factor of four, so the time is the load of the machine, not the change: it adds no browser test. The browser tests over 5 s are the ones TECH-019 covers, none touched here.

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: no browser test added, unit tests 0.4 s; the browser suite's budget overrun is TECH-019's, not caused here
- [x] Deployed, and the smoke tests pass against production (Live tests): the run on the merge commit 0f8b1ad passed (2026-11-10)
- [x] Accessibility: no page changes (not applicable); the list is a real list
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way: none

## Requirements as built

### MUPP-058-R1 The tip in mails 1, 3 and 8

The site adds a tip to mails 1, 3 and 8 (event activated, draw done, added to a group), and to no other mail. After the button to the site and the line "Detta mail går inte att svara på." it says "Tomtenissen tipsar: Vill du ha en bättre och smidigare upplevelse? Gör så här:" and three steps: open the site (the address from `SITE_URL`, without `www.`) in Safari (iPhone) or Chrome (Android); in Safari tap the share symbol and "Lägg till på hemskärm", in Chrome the three dots and "Lägg till på hemskärm" or "Installera och skapa genväg"; then the site is an "app" on the start screen in a full window, and notifications do not work like in an ordinary app. The steps are a numbered list in the HTML mail and numbered 1 to 3 in the plain text. The rest of the text is as in MUPP-052-R1, and no mail holds a member name, wish or message text.
