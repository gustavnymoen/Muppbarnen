---
type: Guide
title: Security
description: "How security is handled: review points, /security-review, the CI scans, Dependabot, the site password, and the planned admin sign-in design."
resource: .semgrep/
feature: TECH-004
tags: [security, workflow]
---

# Security

- **In the code review** ([Code review](code-review.md)): sign-in checked on the server for every admin page, server action and API route; input validated on the server; parameterised queries; secrets out of code, the browser, logs and error messages; secure cookies; errors that say what to do without internals; personal data shown only to the right person; actions pinned to commits. Breaking one is must-fix.
- **`/security-review`** (Claude Code) for every change touching sign-in, admin, API routes, server actions, database queries or personal data; its high findings are must-fix and its result goes into `review.md`.
- **In CI** (job `security`, see [Pipeline](pipeline.md)): `npm audit --omit=dev --audit-level=high`; Semgrep with the community rules for JavaScript, TypeScript, React, Next.js and SQL injection plus our rule in `.semgrep/sql.yml`; Gitleaks over the whole history. A wrong Semgrep finding is marked on its line with `// nosemgrep: <rule>` and a comment why.
- **Dependabot:** npm security updates; monthly grouped updates of the pinned Actions.
- **A leaked secret is rotated first;** removing it from Git doesn't make it secret again.
- **Headers:** the security headers are in [Architecture](architecture.md).

## Site password (built, MUPP-009)

The whole site is behind one shared password ([Site password](site-password.md)):

- One shared password, `SITE_PASSWORD`; the server sets the cookie `site_session` with an expiry and an HMAC-SHA256 signature made with `SITE_SESSION_SECRET`: `HttpOnly`, `Secure` in production, `SameSite=Lax`, valid 180 days.
- Passwords compared as SHA-256 hashes with `timingSafeEqual`; a wrong password answered after a second; at most 5 attempts per IP address in 15 minutes, counted in a database table before the password is checked (on Vercel each request may run in a new function).
- `proxy.ts` refuses everything without the cookie (pages are sent to `/losenord`, API routes, actions and pictures get 401), and what reads data checks the cookie again on the server. With the password or the secret missing the site is closed, and the build on Vercel stops.
- The children's pictures live in a private Blob store and are served by the site after the check.

## Admin sign-in (planned for MUPP-003)

The design carried over from Gurras Flyg, built the same way as the site password:

- One shared password, `ADMIN_PASSWORD`; a cookie with an expiry and an HMAC-SHA256 signature made with `ADMIN_SESSION_SECRET`: `HttpOnly`, `Secure` in production, `SameSite`, lasting until the browser closes and rejected after 8 hours.
- The same hashed comparison, one-second delay and attempt limit.
- `proxy.ts` checks the cookie before admin pages, and every server action checks it again; server actions check their input at run time (ids integers, texts strings of limited length, lists arrays).

[System documentation](index.md)
