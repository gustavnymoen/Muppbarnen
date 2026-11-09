---
type: Review
title: "MUPP-054 Toast after saving: review"
description: Code review of the toast.
feature: MUPP-054
---

# Review of MUPP-054

**Result:** Passed. **Security:** passed; no server code, route, query or personal data changed, the text is rendered as text.

## Must fix

None.

## Should fix

- Timing of the slide and the fade, and restart of the 2 seconds, are not measured by a test: the test comment now says what is checked; recorded in [verification.md](verification.md).
- Reduced motion has no test (code review only): recorded in verification.md as not run.
- `verification.md` was missing: written.

## Suggestions

- The cleanup in `Toaster.tsx` read an old timers array: fixed, it reads `timers.current`.
- `toast()` uses one module-level `show`, so it only works with one Toaster; fine for the root layout.

[Solution](solution.md)
