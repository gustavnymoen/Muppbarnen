---
type: Verification
title: "TECH-021 Mail deliverability: verification"
description: How each requirement of Mail deliverability was checked, the test suite before and after, and the requirements as built.
feature: TECH-021
---

# Verification of TECH-021

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-021-R1 | Unit test `TECH-021-R1 the HTML is a complete document…` in `lib/mail.test.ts`; the existing mail tests pass with only the wrapper changed | local | Pass | 2026-11-10 |
| TECH-021-R2 | Unit test `TECH-021-R2 the first element of the body is a hidden preview…` in `lib/mail.test.ts` | local | Pass | 2026-11-10 |
| TECH-021-R3 | Manual: open and click tracking off for `kusinportalen.com` in the Resend dashboard; links and tracking image checked in the message source of a real mail | live | Pass for the mail itself: in the message source of a real mail the links go straight to `www.kusinportalen.com` and there is no tracking image. The Resend dashboard setting itself was not looked at. | 2026-11-10 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `npm run test:time`: 346 pass | local | Pass | 2026-11-10 |
| Browser tests | None planned; the whole suite was run: 151 pass | local | Pass | 2026-11-10 |
| Smoke test | Not applicable: a mail is not a page | | | |
| Accessibility | Not applicable: visitors see no change | | | |
| Security | Not needed: no data or route changes | | | |
| Manual: Outlook | Before: SCL 5 in `X-MS-Exchange-Organization-SCL` (owner, 2026-11-10). After: SCL 5 again, in a real mail sent 19:29 UTC after the deploy (the source shows the new document, title and preview text); BCL 0, SPF, DKIM, DMARC and compauth pass, no `X-Forefront-Antispam-Report`, so Outlook gives no reason. The goal that SCL falls was not met; the domain's missing reputation is the likely cause. Gmail: SPF, DKIM and DMARC pass. | live | Done, SCL unchanged | 2026-11-10 |
| Code review | [review.md](review.md) | local | See file | 2026-11-10 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 344 unit, 151 browser (the unit tests of main plus the two new ones) | not measured | not measured |
| After | 346 unit, 151 browser | 303 s browser (budget 180 s) | 6.8 s |

The browser run was over its budget with seven tests over 5 s, none of them touched by this change; it ran on a machine shared with other sessions, so the time is not a clean measure. Not compared with a run on `main`.

## Definition of Done

- [x] Tests: unit and local tests pass; Outlook and Gmail are checked (Outlook SCL did not fall, it stays 5; the domain's missing reputation is the likely cause); the tracking setting in the Resend dashboard is not checked (the message source of a real mail shows no tracking)
- [x] Deployed, and the smoke tests pass against production (Live tests): the run on the merge commit 8c802c5 passed (2026-11-10)
- [x] Accessibility: not applicable
- [x] Requirements in the card match what was built, no open questions
- [x] Manual (not needed, no visible change), system docs (`wiki/system/mail.md`) and `wiki/log.md` updated
- [x] No leftovers; `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [ ] Code review done: see [review.md](review.md)

## Requirements as built

As in the card (#189): R1 a complete HTML document with `lang="sv"`, charset and the subject as title; R2 a hidden preview text, first paragraph, 90 characters, escaped; R3 no open or click tracking in Resend.
