---
type: Rules
title: Rules for all features
description: "The rules every feature must follow: mobile first, accessibility, security, personal data and language."
feature: TECH-004
tags: [product, rules]
---

# Rules for all features

- **Mobile first.** The main page does not scroll; only cards scroll inside.
- **Accessibility:** WCAG 2.2 AA ([Accessibility](../wiki/system/accessibility.md)).
- **Security:** the whole site is behind the site password, admin pages also need the admin password, and every check is made on the server ([Security](../wiki/system/security.md)).
- **Personal data:** the repository is public. Real names, birthdates, sizes and pictures live in the database and Vercel Blob, entered on the admin page, never in Git. Seed and test data are made up.
- **Language:** everything visitors see is Swedish.

How a feature is specified, built and checked is in [Way of working](../wiki/system/way-of-working.md).

[Specifications](index.md)
