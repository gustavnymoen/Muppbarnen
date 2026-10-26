---
id: TECH-002
title: Repository and hosting
---

# Code review of TECH-002

**Result:** Passed
**Date:** 2026-10-26, review run 1
**Summary:** The documentation matches R1–R7 of card #15; no secrets, `.env*` files or personal data are committed. Only minor findings, all fixed.
**Security:** Passed. No sign-in, API, query or personal-data code changed; only variable names appear in the diff. `/security-review`: not needed (the change touches none of sign-in, admin, API routes, server actions, queries or personal data).

How the review works: `wiki/system/code-review.md`. A later run is added at the top as "Review run 2".

## Must fix

None.

## Should fix

- `verification.md` Definition of Done and requirements as built were unfilled. **Done:** ticked and copied from the card.
- `verification.md` R1: the search command was not recorded. **Done:** both commands added.
- `verification.md` R2 and R5 relied on user-reported evidence without saying so in the Result column. **Done:** marked "Pass (reported)".
- `wiki/system/architecture.md` front matter `feature: TECH-001`. **Done:** left as it is; the field names the feature that created the page.

## Suggestions

- The Framework Preset pitfall (`STATIC_BUILD_NO_OUT_DIR`) is a setup note. **Done:** left in the architecture page's Hosting row, where it is found next to the hosting description.

## Outside the change

- None.
