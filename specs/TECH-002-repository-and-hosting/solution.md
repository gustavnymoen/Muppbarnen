---
id: TECH-002
title: Repository and hosting
card: "#15"
depends_on: [TECH-001]
---

# TECH-002 Repository and hosting: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 15`.

## Data

None in the repository. Two new Turso databases are created outside it: `muppbarnen-production` and `muppbarnen-preview`. The migrations in `db/migrations/` run on them from the build.

## Interface

None. Visitors see the start page on https://muppbarnen.vercel.app once the first build has succeeded.

## Decisions

- The first push is `git push origin TECH-001-project-setup:main`: Vercel needs an app on `main` to import, and a pull request against an empty `main` could only run checks that cannot pass yet. TECH-003 is the first real pull request.
- New Turso databases instead of reusing the one of Gurras Flyg, so the projects share no data or secrets.
- Production's Turso variables are added by hand and Preview's through Vercel → Storage, connected to Preview only, so the two never fight over the same names (`PLAYBOOK.md`, "Databases and environments").
