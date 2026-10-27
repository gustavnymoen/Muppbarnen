# Log

## 2026-10-27

* **Creation** [MUPP-002 Start page](../specs/MUPP-002-start-page/solution.md): the shared header with the site name, a hamburger menu, and a swipeable row of three example cards.

* **Creation** [MUPP-001 Design](../specs/MUPP-001-design/solution.md): a dark, muted, mobile-first look as tokens and shared components, the style guide page `/design`, and `npm run dev:https`.

* **Creation** [TECH-004 OKF documentation](../specs/TECH-004-okf-documentation/solution.md): the specs and the wiki follow the Open Knowledge Format and are checked by `npm run lint:docs`; `PLAYBOOK.md` is split into wiki pages.

## 2026-10-26

* **Creation** [TECH-003 Pipeline and branch protection](../specs/TECH-003-pipeline-and-branch-protection/solution.md): `main` is protected (pull requests with green checks only, also for the owner), and the first pull request runs the whole pipeline.
* **Creation** [TECH-002 Repository and hosting](../specs/TECH-002-repository-and-hosting/solution.md): the code is on GitHub, Vercel publishes `main` to muppbarnen.vercel.app, Turso databases for production and preview, Vercel Blob store.
* **Creation** [TECH-001 Project setup](../specs/TECH-001-project-setup/solution.md): Next.js project with the database, tests and documentation, running locally.
