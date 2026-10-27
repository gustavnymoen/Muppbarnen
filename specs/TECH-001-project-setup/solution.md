---
type: Solution
title: "TECH-001 Project setup: solution"
description: "How Project setup is built: data, interface and decisions and why."
feature: TECH-001
card: "#7"
depends_on: []
---

# TECH-001 Project setup: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 7`.

## Data

None. The empty `db/schema.sql`, `db/seed.sql` and `db/migrations/` from the kit are unchanged; the first tables come with MUPP-003. The local database is created at `~/Ai Projekt/muppbarnen-data/muppbarnen.db` by `scripts/db-setup.mjs` (R3).

## Interface

- `app/layout.tsx`: `<html lang="sv">`, title "Muppbarnen", no web fonts yet (the design card decides).
- `app/page.tsx`: placeholder start page with the heading "Muppbarnen", replaced by MUPP-002.
- `app/globals.css`: Tailwind only; the tokens come with MUPP-001.

## Decisions

- **The app was generated in a scratch folder and merged by hand.** `create-next-app` refuses a folder that already has files, and its `next.config.ts`, `eslint.config.mjs` and `.gitignore` were identical to or a subset of the kit's, so the kit's versions were kept. Taken from it: `app/`, `tsconfig.json`, `AGENTS.md` and the pinned versions of Next.js and React. Its sample page, icons and `public/` images were not used, and `README.md` is the project's own.
- **Web fonts left out.** The generated layout loaded Geist from Google; fonts are a design decision (MUPP-001) and a build that needs the network for them is a risk for nothing.
- **Playwright 1.64.1** is what npm installed, the same as the version in the three workflows' image, so `scripts/check-playwright-image.mjs` will pass in CI.
- **Git:** the folder was connected to `gustavnymoen/Muppbarnen` with `git reset origin/main`, which keeps the files and adopts the history (a README from "Initial commit"). `pictures/` is ignored, since the repository is public.
- **Small related cleanups:** an unused `connection` import in `lib/db.ts` (left from the old project) and a leftover price rule in the docs, removed.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Architecture](../../wiki/system/architecture.md).

[Specifications](../index.md)
