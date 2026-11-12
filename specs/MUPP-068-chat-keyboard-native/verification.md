---
type: Verification
title: "MUPP-068 Chat keyboard handled by iOS: verification"
description: How each requirement of the chat card without scripted keyboard fit was checked, the test suite, and the requirements as built.
feature: MUPP-068
---

# Verification of MUPP-068

Run locally 2026-11-12. Not deployed yet. **Not checked on a real iPhone.**

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-068-R1 | Browser test `MUPP-068-R1 R2 R3 …` in `tests/MUPP-068-chat-keyboard-native.spec.ts`: no focus in the field after opening, focus after a tap; other cards keep focus in their first field: `MUPP-045-R2 …` tests in `tests/MUPP-045-form-cards.spec.ts` pass unchanged | local | Pass | 2026-11-12 |
| MUPP-068-R2 | Same test: the card is 75 % of the height, no inline `top`, `bottom`, `height` or `margin` and the same box after a visual viewport `resize`; the list has `overscroll-behavior: contain` | local | Pass | 2026-11-12 |
| MUPP-068-R3 | Same test: with 30 messages the newest is inside the list's visible area as soon as the card has opened | local | Pass (desktop browser) | 2026-11-12 |
| MUPP-068-R1 R2 R3 (real) | Manual on an iPhone, Safari, pinned app and Chrome: open the chat (no keyboard, newest message in view), tap the field, close the keyboard, scroll | phone | Not checked | – |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable; the 375 existing pass | local | Pass | 2026-11-12 |
| Browser tests | The new test, MUPP-043 chat tests, MUPP-045 form cards; the MUPP-065 test is removed with its code | local | Pass | 2026-11-12 |
| Real device | Manual on an iPhone | phone | Not checked | – |
| Smoke test, Security | Not applicable | – | – | – |
| Accessibility | axe on the open chat | local | Pass; live not checked | 2026-11-12 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-12 |

## Test suite

`npm run test:time`: 375 unit tests (0.6 s), 166 browser tests, 337.4 s against a budget of 330 s: over budget by 7 s, as before this change (the MUPP-065 and MUPP-066 test is replaced by one test of about 0.6 s).

## Definition of Done

- [ ] Tests: the real-phone check is not done
- [ ] Test suite: slightly over the 330 s budget (the cause is other tests)
- [ ] Deployed, and Live tests pass
- [ ] Accessibility: live checklist not done
- [x] Requirements match what was built; `solution.md` describes it
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers: the script and test of MUPP-065 and MUPP-066 are removed
- [x] Clean code: lint, lint:docs, typecheck, build pass
- [x] Code review: Passed, see [review.md](review.md)

## Requirements as built

### MUPP-068-R1 The chat opens without the keyboard

The chat card does not put focus in the message field when it opens; other form cards still focus their first field.

### MUPP-068-R2 The card is not resized or moved by script

The chat card is `75dvh` and centred, with no inline size or position and no scripted touch handling; the list does not scroll the page behind (`overscroll-contain`).

### MUPP-068-R3 The newest message is in view when the chat opens

The list is scrolled to its end when the card opens, once at once and once in the next frame.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
