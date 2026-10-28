# Log

## 2026-10-28

* **Creation** [TECH-005 Security hardening](../specs/TECH-005-security-hardening/solution.md): a test that every route and server action checks the sign-in, a request limit for writes, a 20-minute block after repeated wrong passwords, a Content-Security-Policy and `__Host-` cookies, and the rules written into the specs and the code review.

## 2026-10-27

* **Creation** [MUPP-009 Site password](../specs/MUPP-009-site-password/solution.md): the whole site is behind one shared password with a signed cookie, a password page, `proxy.ts`, a limit of 5 attempts per 15 minutes, and tests that sign in once.

* **Creation** [MUPP-002 Start page](../specs/MUPP-002-start-page/solution.md): the shared header with the site name, a hamburger menu, and a swipeable row of three example cards.

* **Creation** [MUPP-001 Design](../specs/MUPP-001-design/solution.md): a dark, muted, mobile-first look as tokens and shared components, the style guide page `/design`, and `npm run dev:https`.

* **Creation** [TECH-004 OKF documentation](../specs/TECH-004-okf-documentation/solution.md): the specs and the wiki follow the Open Knowledge Format and are checked by `npm run lint:docs`; `PLAYBOOK.md` is split into wiki pages.

## 2026-10-26

* **Creation** [TECH-003 Pipeline and branch protection](../specs/TECH-003-pipeline-and-branch-protection/solution.md): `main` is protected (pull requests with green checks only, also for the owner), and the first pull request runs the whole pipeline.
* **Creation** [TECH-002 Repository and hosting](../specs/TECH-002-repository-and-hosting/solution.md): the code is on GitHub, Vercel publishes `main` to muppbarnen.vercel.app, Turso databases for production and preview, Vercel Blob store.
* **Creation** [TECH-001 Project setup](../specs/TECH-001-project-setup/solution.md): Next.js project with the database, tests and documentation, running locally.
