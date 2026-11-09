---
type: Solution
title: "MUPP-046 Site name: solution"
description: "How the site got the name Kusinportalen from one constant, a gift icon and a manifest, and how the icons became public files."
feature: MUPP-046
card: "#144"
depends_on: []
---

# MUPP-046 Site name: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 144`.

## Data

None.

## Interface

- **Name (R1):** `SITE_NAME = "Kusinportalen"` in `app/components/SiteHeader.tsx` is the only place the name is written. The root layout uses it in a title template (`title: { default, template: "%s | Kusinportalen" }`), so a page only gives its own part (`Admin`, `Stilguide`, `Secret Santa`, `Din Secret Santa-sida`, and `Sidan finns inte` for the not-found page). The start page and the password page have no title of their own and get the bare name.
- **Share preview and home screen (R2):** the root layout's `metadata` holds the description, `openGraph` (title, site name, description, locale `sv_SE`, no image) and `appleWebApp.title`. `app/manifest.ts` is the web app manifest (name, short name, `lang`, `#0C1015` as background and theme colour, the two PNG icons).
- **Icon (R3):** `app/icon.svg` is the drawing from the card; `app/icon.png` (192 px) and `app/apple-icon.png` (180 px) are made from it with `sharp`. The apple icon is the same drawing without the rounded corners, flattened onto the page colour, because iOS rounds it itself. Next.js finds the three files and links them in every `<head>`.
- **Public files (R4):** `PUBLIC_FILES` in `proxy.ts` lists the four exact paths. A `GET` or `HEAD` of one of them passes before the cookie check; every other method and path is handled as before. `proxy.test.ts` pins the list and the lookalikes.

Texts are in Swedish; the only new visible text is the name.

## Decisions

- **One constant, a template for the rest.** The name was written in four layouts and pages; now only `SITE_NAME` has it, and a title template adds it. The alternative, a helper function building each title, would have been more code for the same result.
- **An exact list, not a rule.** Letting "anything that ends in .png" through would open `/bilder/…` lookalikes and future files by accident; four exact paths, only for `GET` and `HEAD`, can be reviewed at a glance, and a unit test fails if the list grows.
- **The PNGs are committed files, not generated at build time.** They change rarely; `sharp` made them once from `icon.svg` (see the commands in Verification), and a unit test reads them back to check size, transparency and weight.
- **No `favicon.ico`.** Modern browsers use `icon.svg`; the card leaves it out.
- **The old address and the repository keep "Muppbarnen"** (card, Out of scope).

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Design system](../../wiki/system/design.md), [Site password](../../wiki/system/site-password.md), [Phone guide](../../wiki/manual/telefon.md), [DESIGN.md](../../DESIGN.md).

[Specifications](../index.md)
