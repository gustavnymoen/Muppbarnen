---
type: Review
title: "MUPP-035 Onboarding card: review"
description: "The code review of the onboarding card: findings, decisions and result."
feature: MUPP-035
---

# Code review of MUPP-035

**Result:** Passed
**Date:** 2026-11-04, review run 1
**Summary:** The dialog does what R1 to R7 ask and reuses `Dialog`, `Button`, `IconButton` and the cookie pattern of `lib/site-session`. No must-fix findings.
**Security:** Passed. `markOnboardingSeen` calls `hasSiteSession()` then `guardWrite()`, takes no input, and sets a fixed value in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie with the `__Host-` prefix in production, path `/`, no `Domain`, one year. All texts are static JSX, no inline script. `/security-review`: run, no findings.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `lib/onboarding.ts:3` The cookie name has `__Host-` only in production. **Done:** the same rule as the site cookie, written in `solution.md`.
- `specs/features.md` Marked "Done" before the live checks. **Done:** set to "Review"; the live R1 check and the accessibility checklist stay "not checked" in `verification.md` until after the deploy.
- `tests/MUPP-035-onboarding-card.spec.ts` The rule "not on admin pages" is tested only for the password page. **Done:** left as a code-review check (only `app/page.tsx` passes `onboarding`), recorded in `verification.md`.
- R7 "without the site session it does nothing" is covered by `lib/route-checks.test.ts` (the checks are present), not by a behavioural test. **Done:** recorded as a code-review check.

## Suggestions

- `OnboardingDialog.tsx` Selecting text inside the dialog and releasing over the backdrop closed it. **Done:** the press must also have started on the backdrop.
- `OnboardingDialog.tsx` `showModal()` on an already open dialog (React Strict Mode in development). **Done:** guarded with `!node.open`.
- The callback ref mirroring into state is a little heavy. **Done:** left as it is; the comment says why, and the alternative is a matter of taste.

## Outside the change

- `SiteMenu` is also on the password page, so "Så funkar sajten" can be opened there before sign-in. It shows only fixed, non-secret text, so it was left as it is.
