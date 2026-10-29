# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two groups, one family. **Parents (administrators):** three siblings with six kids between them; they fill in the kids' wish lists and sizes on the admin page, a few minutes at a time and rarely. One of them, Gustav, is the master admin. **Family and friends (visitors):** open the site mostly on a phone, calmly (on the sofa, not in a hurry), to see the kids, their birthdays and wish lists, and to claim a present. They range from kids to grandparents, so anyone must manage without help. The whole site is behind one shared password.

## Product Purpose

Keep track of the kids' wish lists for birthdays and Christmas so the same gift is not bought twice, with a nice view of upcoming birthdays and all the kids. Success: no duplicate gifts, any relative manages without help, and the site feels like a small family keepsake that is a pleasure to open, not only a utility.

## Positioning

A private, family-only site: one shared password, no accounts, no shop, no payments. It is made for these six kids and their relatives, which a generic wish-list service cannot be.

## Operating Context

Visitors arrive from a link shared in the family, on their phone, and are asked for the shared password once. Admins work on the admin page, on a phone or a computer. The next birthday or Christmas Eve is what matters most at any time of year.

## Capabilities and Constraints

- Swedish-only visible text; the terms are in `specs/terms.md`.
- Pictures of the children live in Vercel Blob; names, birthdates and sizes are real personal data in the database. No real data in Git; made-up data in seeds and tests.
- Out of scope: payments, shops, accounts per visitor.
- Motion respects `prefers-reduced-motion`; no heavy new dependencies; fonts and images keep loading fast.

## Brand Commitments

The name is Muppbarnen. Voice in the Swedish texts: warm and plain, a little playful, kid-friendly but never childish. The current look is a dark, muted system (`DESIGN.md`); whether it stays is decided in TECH-006 step 1.

## Evidence on Hand

No testimonials, statistics or press; nothing of that kind may be invented. The children's pictures are in Vercel Blob and are not in the repository.

## Product Principles

1. Anyone in the family can use it without being shown how.
2. Phone first; calm rather than busy.
3. Warm and personal: it is about these kids.
4. Never show anything that makes a gift ambiguous or double-bought.
5. Privacy before polish: the children's data stays behind the password.

## Accessibility & Inclusion

WCAG 2.2 level AA (`wiki/system/accessibility.md`); readable for older relatives (clear text size and contrast, large tap targets).
