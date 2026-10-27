---
type: Guide
title: Testing on a phone
description: "How to look at the site on a real phone over HTTPS: the Vercel preview of a pull request, and npm run dev:https locally."
resource: package.json
feature: MUPP-001
tags: [workflow, testing, https]
---

# Testing on a phone

Most visitors use a phone, so the look is checked on one early.

## The preview (the simple route)

Every pull request gets a preview at an `https://…vercel.app` address (shown in the pull request's checks, "Vercel"). It has a valid certificate, so the phone shows no warning. Vercel asks for a sign-in on previews: sign in with the GitHub account that owns the Vercel project (the first time only; the phone remembers it). Then open `/design` to see the style guide.

## Locally: `npm run dev:https`

Serves the app on `https://localhost:3000` with a certificate made by [mkcert](https://github.com/FiloSottile/mkcert) (Next.js's `--experimental-https`); the local database setup and backup run first, as for `npm run dev`. One-time setup on the computer:

```bash
brew install mkcert
mkcert -install
```

The certificate is then trusted on the computer. A phone does **not** trust it unless the mkcert root certificate (`mkcert -CAROOT`, the file `rootCA.pem`) is installed on the phone and trusted there, and the phone reaches the computer through its network address, not `localhost`. That is optional; use the preview for the phone.

## Production

Production keeps sending `Strict-Transport-Security` (Vercel's default); this was checked, not built.

Built by [MUPP-001](../../specs/MUPP-001-design/solution.md); the Swedish version is [Titta på sajten på telefonen](../manual/telefon.md).

[System documentation](index.md)
