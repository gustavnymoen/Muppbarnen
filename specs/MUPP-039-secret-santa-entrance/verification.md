---
type: Verification
title: "MUPP-039 Secret Santa: entrance and sign-in: verification"
description: How each requirement of the Secret Santa entrance and sign-in was checked, the test suite before and after, and the requirements as built.
feature: MUPP-039
---

# Verification of MUPP-039

How each requirement was checked. Browser tests ran locally (`npm run test:local`, local test database, a production build); nothing is deployed yet, so the live checks are not done.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-039-R1 | Browser test `MUPP-039-R1 R2 R3 …` (menu entry opens the entrance); smoke test `MUPP-039-R1 @smoke …` (the entrance and the own page are behind the site password) | local | Pass | 2026-11-08 |
| MUPP-039-R2 | Browser test `MUPP-039-R1 R2 R3 …` (one family: names directly; two: choices, "Byt familj") | local | Pass | 2026-11-08 |
| MUPP-039-R3 | `tests/design.spec.ts` `MUPP-039-R3 R4b …` (8 names on 375 x 667: two per row, four rows, all visible, ≥ 44 px); `MUPP-039-R1 R2 R3 …` and unit test `MUPP-039-R3 the entrance reads names only` (no phone or email in the HTML) | local | Pass | 2026-11-08 |
| MUPP-039-R4 | Unit tests `lib/santa-auth.test.ts` (phone writings, `+46`, email case, wrong values, one answer for every wrong try, the block after repeated wrong tries); browser tests `MUPP-039-R4 R4b …` and `MUPP-039-R4 the saved phone in other writings …` | local | Pass | 2026-11-08 |
| MUPP-039-R4b | Browser test `MUPP-039-R4 R4b …` (Telefon selected, `type="tel"`, `inputmode="tel"`, focus; E-post empties and focuses an email field; arrow keys; axe); the look in `tests/design.spec.ts` | local | Pass | 2026-11-08 |
| MUPP-039-R5 | Browser test `MUPP-039-R5 …` (`__Host-santa_session`, HttpOnly, Secure, path `/`, no Domain, value `<id>.<64 hex>`; remembered; "Byt person" removes it); unit tests `lib/santa-session.test.ts` | local | Pass | 2026-11-08 |
| MUPP-039-R6 | Browser test `MUPP-039-R6 …` (no cookie, another person's id with the same signature, and a removed person all lead to the entrance; the own page holds no one else's data); unit test on the signature; code review: the own page has no id in the address | local | Pass | 2026-11-08 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/santa-session.test.ts` (3), `lib/santa-auth.test.ts` (6); `lib/route-checks.test.ts` keeps passing with the new action file | local | Pass | 2026-11-08 |
| Browser tests | `tests/MUPP-039-secret-santa-entrance.spec.ts` (5) with axe on each page and state; the grid on a small phone in `tests/design.spec.ts` (1); the three tests that list the menu were updated for the new entry | local | Pass | 2026-11-08 |
| Smoke test | `MUPP-039-R1 @smoke …`: without the site cookie the entrance and the own page lead to the password page and show no names. The menu entry and the entrance itself need the site password, which the smoke tests do not have | local | Pass (live: not run) | 2026-11-08 |
| Accessibility | axe in the browser tests (entrance, grid, sign-in form with and without an error, own page); keyboard on the radio buttons and the menu; the manual checklist on the live site: reported tested by hand by the user, screen reader items included (2026-11-09, not recorded item by item) | local, live | Pass (axe); live checklist reported done | 2026-11-08 |
| Security | Security points in the review; `/security-review` run, no finding at confidence 8 or higher | local | Pass | 2026-11-08 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-08 |

## Test suite

`npm run test:time` before and after the change (budgets and rules in `wiki/system/testing.md`).

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before (MUPP-038) | 178 unit + 107 browser | 179.0 s (browser) | 4.5 s |
| After | 187 unit + 114 browser | 191.8 s (browser), unit 0.4 s | 4.5 s |

Nine unit tests and seven browser tests were added (the browser count includes the grid and smoke tests); the three tests that list the menu were updated. The browser total grew by 12.8 s (7 %, under the 25 % limit) but is over the 3 minute budget; it was already at it (179.0 s). The new tests take 0.1–4.0 s each and the browser tests were merged by journey. The cost is mainly real: every wrong sign-in takes a second by design, and each sign-in loads pages. The suite is over its budget, so the technical task [TECH-018](https://github.com/gustavnymoen/Muppbarnen/issues/146) is at the top of the backlog.

## Definition of Done

- [x] Tests: every check in the card's test plan is done; every requirement is tested or has a recorded manual check; `npm run test:unit` and `npm run test:local` pass
- [x] Test suite: the total time is over the budget (191.8 s of 180 s), growth 7 %; the new tests follow the quality rules; a technical task is needed; accepted by the user (2026-11-12): the suite grew fast while the site was built
- [x] Deployed, and the smoke tests pass against production (Live tests): the run on the merge commit 0c9968a passed (2026-11-08)
- [x] Accessibility (axe passes; the manual checklist on the live site: the user reports the live checklist was tested by hand, including the screen reader items (said by the user, 2026-11-09, not recorded item by item))
- [x] Requirements in the card match what was built, no open questions left; copied below as built; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers: everything the change made unused is deleted, no commented-out code or debug output
- [x] Clean code: reuses existing components and helpers; `npm run lint`, `npm run lint:docs`, `npm run typecheck` and `npm run build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board: TECH-018 (the suite over its time budget)

## Requirements as built

See the card (`gh issue view 137`) for the wording; as built:

- **R1** "Secret Santa" in the menu, before "Admin", opens `/secret-santa`.
- **R2** The entrance lists the families as links; with one family its names show directly.
- **R3** The names as a two-column grid of links, at least 48 px high; eight fit 375 x 667. No phone or email in the page.
- **R4** The saved phone (spaces, dashes and parentheses ignored, `+46` read as 0) or email (case ignored) signs the person in. A wrong value says "Det stämde inte"; more than 5 wrong tries in 15 minutes block the address for 20, as for the passwords.
- **R4b** Radio buttons Telefon (selected) and E-post; the field is `tel` or `email` with the matching `inputmode`, empties and gets focus on a change.
- **R5** The signed cookie `__Host-santa_session` (HttpOnly, Secure, path `/`, no Domain, one year) holds only the person id; a signed-in visitor goes straight to the own page; "Byt person" removes the cookie.
- **R6** The own page `/secret-santa/min-sida` has no id in the address and shows whoever the cookie names; another person's id fails the signature.

## Notes

- Locally over http the cookie has no `__Host-` prefix and is not Secure, like the other cookies; the test server is a production build, so the tests see the production attributes.
- `npm run lint:docs`, `build`, `lint` and `typecheck` pass.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
