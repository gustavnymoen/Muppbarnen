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
- **Security:** the whole site is behind the site password, admin pages also need the admin password, and every check is made on the server ([Security](../wiki/system/security.md)). For every route handler, server action and form:
  - **Sign-in first.** Every route handler (`app/**/route.ts`) and server action (`"use server"` file) calls `hasSiteSession()` first, and what changes data under `admin` calls the admin check straight after. The one exception is the login action. `lib/route-checks.test.ts` fails when one is missing.
  - **Writes go through `guardWrite()`:** the request limit per IP address (60 a minute) and the check that the `Origin` is the site. Required for every server action and for `POST`, `PUT`, `PATCH` and `DELETE` handlers.
  - **Input is checked on the server:** type, length and allowed values, before it is used.
  - **Errors say nothing about internals:** what to do, never a stack trace, SQL or a name from the code.
  - **Pictures are served only by the site,** from the private Blob store, after the check (`access: "private"`).
  - **A new cookie** is named with the `__Host-` prefix and is `HttpOnly`, `Secure` and path `/` without `Domain`.
  - **No inline script or connection to another site** that the Content-Security-Policy blocks.
- **Personal data:** the repository is public. Real names, birthdates, sizes and pictures live in the database and Vercel Blob, entered on the admin page, never in Git. Seed and test data are made up.
- **Language:** everything visitors see is Swedish.

How a feature is specified, built and checked is in [Way of working](../wiki/system/way-of-working.md).

[Specifications](index.md)
