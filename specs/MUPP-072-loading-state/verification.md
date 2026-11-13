---
type: Verification
title: "MUPP-072 Loading state on buttons + nag button text: verification"
description: How each requirement of the busy state and the nag text was checked, the test suite before and after, and the requirements as built.
feature: MUPP-072
---

# Verification of MUPP-072

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-072-R1 | Browser tests `MUPP-072-R1 R2 R3 deleting a wish …` (confirm dialog: locked at once, `aria-busy`, spinner `aria-hidden`, same width and height before, in the 300 ms before the spinner, and with it) and `… saving a form …`; `MUPP-072-R4 …` in `tests/design.spec.ts` (busy `IconButton` shows the spinner instead of its icon, 44 px wide). Grep `disabled={pending}` and `disabled={.*pending` in `app/`: no match; the only spinner is `Spinner` in `app/components/Button.tsx` (`grep -rn "spinner" app` finds it and the CSS only). Not tested with a real server action: `ClaimDialog`, `UnclaimDialog`, `ChatButton`, `LoginForm`, `SignInForm`, `MemberEdit` and `CopyItem`; they use the same `busy` prop, checked by the grep and the type check | local | Pass | 2026-11-13 |
| MUPP-072-R2 | Unit tests `lib/busy-delay.test.ts` with a fake clock (nothing before 300 ms, spinner after, a fast action never shows one, gone when done); browser test: the button is disabled and has no spinner right after the press, the spinner comes later | local | Pass | 2026-11-13 |
| MUPP-072-R3 | Browser tests: one `role="status"` with "Arbetar …" while the spinner shows, none afterwards; axe in the busy state of the delete, the form and the nag button. Not checked with a real screen reader | local | Pass (screen reader: not checked) | 2026-11-13 |
| MUPP-072-R4 | `tests/design.spec.ts` `MUPP-072-R4 …`: the ring turns (`spin`), pulses with reduced motion (`pulse-busy`) and keeps its words; ring colour against the button 3:1; busy is less pale than disabled; axe. Seen on a 375 px phone in the dark theme, three variants, normal and reduced motion (screenshots shown to the user) | local | Pass | 2026-11-13 |
| MUPP-072-R5 | Browser test `MUPP-072-R1 R5 …` (text and `aria-describedby` after the press, absent when free); `MUPP-071-R2 R3 R4 …` extended with the "Du har tjatat nyss" state; `tests/design.spec.ts` `MUPP-071-R1 R3 MUPP-072-R5 …` (contrast of the text 4.5:1 against the card, full opacity) | local | Pass | 2026-11-13 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/busy-delay.test.ts` (3 new); `npm run test:unit` 396 passed (393 before) | local | Pass | 2026-11-13 |
| Browser tests | `tests/MUPP-072-loading-state.spec.ts` (3, a slowed server action), one new test in `tests/design.spec.ts`, additions to the nag tests; full `npm run test:time`: 174 passed, 176 after merging main | local | Pass | 2026-11-13 |
| Smoke test | Not applicable: the states are behind sign-in or need a slow action, and the smoke tests are read-only. After the merge, Live tests (the smoke tests) passed against the live site on the merge commit | live | Pass | 2026-11-13 |
| Accessibility | axe on each busy state in the browser tests. The checklist in `wiki/system/accessibility.md` on the live site (a busy button, the locked nag button, reduced motion) and a real screen reader: not checked yet, it is the user's to do | live | Not checked | n/a |
| Security | `/security-review` not needed (client components only; the review's security points passed) | local | Pass | 2026-11-13 |
| Code review | [review.md](review.md): run 1 stopped on one must-fix (the button shrank before the spinner), fixed | local | Passed | 2026-11-13 |
| Look | Chosen on a 375 px phone among three proposals (ring beside the text; ring in the side padding, too crowded; text only); screenshots shown to the user, who said to go on. The user has not yet seen the final version in the running site | local | Pass | 2026-11-13 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | 393 unit + 170 browser (MUPP-071) | 340.2 s | 7.4 s |
| After (before merging main) | 396 unit + 174 browser | 352.5 s | 7.4 s |
| After merging main (MUPP-070) | 396 unit + 176 browser | 352.2 s | 7.4 s |

Over the 330 s budget, as it already was before this change (accepted by the user in TECH-022). The four new browser tests add about 9 s (three of them 2.5 to 3 s each: the slowed action takes 1.5 s); the rest is normal variation between runs.

## Definition of Done

- [x] Tests: every check in the card's test plan is done except the live ones; `npm run test:unit` and `npm run test:local` pass
- [ ] Test suite: over the 330 s budget, as before (see above)
- [x] Deployed, and the smoke tests pass against production (Live tests): merged in pull request 252, Live tests passed on 2026-11-13
- [ ] Accessibility: axe passes; the live checklist is not gone through yet (open)
- [x] Requirements in the card match what was built (see below), no open questions left; `solution.md` describes how it was built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`), `DESIGN.md` and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements: none

## Requirements as built

- **R1 One shared busy state:** `busy` on `Button` and `IconButton` locks the button at once, sets `aria-busy="true"` and draws a spinner left of the text (instead of the icon on an `IconButton`); the button keeps its text and size (the side padding goes from 20 to 10 px together with the spinner). Every former `disabled={pending}` uses it.
- **R2 Only when it takes a moment:** the spinner shows after 300 ms; the lock is immediate.
- **R3 Screen readers:** a polite status "Arbetar …" while the spinner shows (the region exists only while the button is busy), the spinner is `aria-hidden`, focus does not move; toasts and `role="alert"` unchanged.
- **R4 Motion:** the ring turns; with reduced motion it pulses and the words stay. Colours come from the button's own text colour.
- **R5 The nag button says why:** "Du kan bara tjata en gång i timmen." under the locked button in both locked states, tied with `aria-describedby`, full-strength text, absent when the button is free.

[Specifications](../index.md)
