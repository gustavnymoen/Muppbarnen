---
type: Solution
title: "TECH-020 Go live with mail: solution"
description: "How the site's real mail sending was turned on: the domain, the Resend account and DNS records, the secret key, the test-mail script and the checks."
feature: TECH-020
card: "#168"
depends_on: [TECH-017]
---

# TECH-020 Go live with mail: solution

How it is done. What and why (goal, scope, requirements) is in the card: `gh issue view 168`.

## Data

None.

## Interface

No page changes. One script, `scripts/send-test-mail.mjs`, sends a single test mail to an address given on the command line (see [Mail](../../wiki/system/mail.md#going-live-tech-020)). `.env.example` lists `RESEND_API_KEY`.

## Decisions

- **Mostly manual.** The domain, the Resend account, the DNS records and the key in Vercel are set up by the owner in the providers' dashboards; the repository holds no secret and no DNS configuration. The code of `sendMail` is unchanged (TECH-017).
- **A separate test-mail script, not a route.** A route would be a new way to make the server send mail; a script run by hand with the key in the environment reaches nobody but the address typed. It has its own plain text and no layout, since the layout is covered by unit tests and the point is deliverability.
- **DMARC `p=none`.** The record only asks receivers to report; it makes `dmarc=pass` show up. A stricter policy can wait until the mail is known to work from every sender.
- **R2 is checked by reading, by the scan and by the history.** The key is read in one place (`lib/mail.ts`), nothing logs it, the `.env*` files are ignored by Git and the CI job `security` runs Gitleaks over the whole history.

## Related

- Checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Mail](../../wiki/system/mail.md), [Secret Santa (manual)](../../wiki/manual/secret-santa.md).

[Specifications](../index.md)
