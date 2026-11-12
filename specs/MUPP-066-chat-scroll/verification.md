---
type: Verification
title: "MUPP-066 Chat scroll with the keyboard up: verification"
description: How each requirement of dragging in the chat card with the phone keyboard up was checked, and the requirements as built.
feature: MUPP-066
---

# Verification of MUPP-066

Run locally 2026-11-12. Not deployed yet. **Not checked on a real iPhone.**

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-066-R1 | Browser test `MUPP-066-R1 R2 …` in `tests/MUPP-065-chat-keyboard.spec.ts`: with the faked keyboard a `touchmove` in the list blurs the field; without a keyboard nothing is blurred | local | Pass (fake events) | 2026-11-12 |
| MUPP-066-R2 | Same test: with the keyboard up a drag on the heading is cancelled, a drag in the field is not, the list has `overscroll-behavior: contain` | local | Pass (fake events) | 2026-11-12 |
| MUPP-066-R1 R2 (real) | Manual on an iPhone, Safari and pinned app: tap the field, drag the list (keyboard lowers, no jump), drag the title (nothing moves) | phone | Not checked | – |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | Not applicable: DOM events | – | – | – |
| Browser tests | The new test and the MUPP-043 and MUPP-065 chat tests (9) | local | Pass | 2026-11-12 |
| Real device | Manual on an iPhone | phone | Not checked | – |
| Smoke test, Security | Not applicable | – | – | – |
| Accessibility | Unchanged markup; no axe change | local | – | – |
| Code review | [review.md](review.md) | local | Passed | 2026-11-12 |

## Definition of Done

- [ ] Tests: real-phone check not done
- [ ] Deployed, and Live tests pass
- [ ] Accessibility: live checklist not done
- [x] Requirements match what was built; `solution.md` describes it
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers; lint, lint:docs and typecheck pass
- [x] Code review: Passed, see [review.md](review.md)

## Requirements as built

### MUPP-066-R1 A drag in the list lowers the keyboard

With the keyboard up, a drag in the message list blurs the field so the keyboard goes down; without a keyboard nothing is blurred.

### MUPP-066-R2 The page behind does not move

While the keyboard is up a drag outside the list and the field is cancelled, a drag in the field scrolls it as before, and the list does not chain its scroll to the page (`overscroll-contain`).

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
