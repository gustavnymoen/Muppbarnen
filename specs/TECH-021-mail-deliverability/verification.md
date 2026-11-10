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
| TECH-021-R3 | Manual: open and click tracking off for `kusinportalen.com` in the Resend dashboard; links and tracking image checked in the message source of a real mail | live | **Not checked yet** (owner, after the deploy) | |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `npm run test:time`: 346 pass | local | Pass | 2026-11-10 |
| Browser tests | None planned; the whole suite was run: 151 pass | local | Pass | 2026-11-10 |
| Smoke test | Not applicable: a mail is not a page | | | |
| Accessibility | Not applicable: visitors see no change | | | |
| Security | Not needed: no data or route changes | | | |
| Manual: Outlook | Before: SCL 5 in `X-MS-Exchange-Organization-SCL` (owner, 2026-11-10). After: **not checked yet** (a real mail to the same Outlook address once this is deployed and tracking is off) | live | Not checked | |
| Code review | [review.md](review.md) | local | See file | 2026-11-10 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 344 unit, 151 browser (the unit tests of main plus the two new ones) | not measured | not measured |
| After | 346 unit, 151 browser | 303 s browser (budget 180 s) | 6.8 s |

The browser run was over its budget with seven tests over 5 s, none of them touched by this change; it ran on a machine shared with other sessions, so the time is not a clean measure. Not compared with a run on `main`.

## Definition of Done

- [ ] Tests: unit and local tests pass; the manual checks (tracking, Outlook) are not done yet
- [ ] Deployed, and the smoke tests pass against production (Live tests): after the merge
- [x] Accessibility: not applicable
- [x] Requirements in the card match what was built, no open questions
- [x] Manual (not needed, no visible change), system docs (`wiki/system/mail.md`) and `wiki/log.md` updated
- [x] No leftovers; `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [ ] Code review done: see [review.md](review.md)

## Requirements as built

As in the card (#189): R1 a complete HTML document with `lang="sv"`, charset and the subject as title; R2 a hidden preview text, first paragraph, 90 characters, escaped; R3 no open or click tracking in Resend.
