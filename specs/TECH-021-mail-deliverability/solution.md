---
type: Solution
title: "TECH-021 Mail deliverability: solution"
description: "How the mail layout became a complete HTML document with a hidden preview text, and why the provider's tracking is off."
feature: TECH-021
card: "#189"
depends_on: [TECH-017, TECH-020]
---

# TECH-021 Mail deliverability: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 189`.

## Data

None.

## Interface

No page changes. `layout` in `lib/mail.ts` now takes the subject too (`sendMail` passes the whole mail) and returns a complete document: `<!doctype html><html lang="sv"><head><meta charset="utf-8"><title>subject</title></head><body>`, a hidden preview `<div>`, then the layout as before, then `</body></html>`. The plain-text part is unchanged.

## Decisions

- **Preview text** is the first paragraph of the text, whitespace collapsed, cut at 90 characters before it is escaped (so an entity is never cut in half). It is hidden with `display:none;max-height:0;overflow:hidden;mso-hide:all`. No new field on `Mail`: the texts belong to the mail cards.
- **Tracking** (open and click) is a setting per domain in the Resend dashboard, not something the code sends per mail, so R3 is a manual check recorded in [verification.md](verification.md).
- The logo stays: one small image with an alt text is not a spam signal, and removing it would change how the mail looks.

## Related

- Checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Mail](../../wiki/system/mail.md).

[Specifications](../index.md)
