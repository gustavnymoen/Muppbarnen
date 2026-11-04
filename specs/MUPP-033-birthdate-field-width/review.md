---
type: Review
title: "MUPP-033 Birthdate field fits on a phone: review"
description: "Code review of MUPP-033: passed, no must-fix findings."
feature: MUPP-033
---

# Review of MUPP-033

**Result:** Passed. **Security:** Passed (CSS only; `/security-review` not needed, as the card says).

Date inputs in `Field` get `block min-w-0 max-w-full appearance-none text-left`; documented, and the MUPP-010-R6 test extended to 375 px with a date-field-inside-form check. No tests were run by the reviewer.

## Must fix

None.

## Should fix

- `verification.md`: the iPhone (Safari) check, the Definition of Done and the code-review row were still open when reviewed. They are done on the preview before the pull request is merged.

## Suggestions

- The new Chromium assertion passes with or without the fix (neither Chromium nor WebKit reproduces the fault); it guards against regressions. The manual iPhone check is the real evidence.
- `appearance-none` on iOS date inputs can make the field look empty or collapse; `min-h-11` covers the height. Look at the empty state in the iPhone check.

## Outside the change

None.

See also: [Verification](verification.md), [Solution](solution.md).

[Specifications](../index.md)
