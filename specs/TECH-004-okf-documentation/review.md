---
type: Review
title: "TECH-004 OKF documentation: review"
description: "The code review of OKF documentation: findings, decisions and result."
feature: TECH-004
---

# Code review of TECH-004

**Result:** Passed
**Date:** 2026-10-27, review run 2
**Summary:** Run 1's must-fix is fixed and checked again; no must-fix or should-fix findings left. `lint:docs` and its 14 tests pass, and a separate YAML parse of the frontmatter in all files found no errors.
**Security:** Passed. The change adds a read-only docs script and a `lint:docs` step in CI, no sign-in, routes, queries or personal data, and no new GitHub Action. `/security-review`: not needed.

How the review works: [Code review](../../wiki/system/code-review.md).

## Review run 2

**Result:** Passed

### Suggestions

- `scripts/lint-docs.mjs:31` The unquoted-value check catches `: `, ` #` and a trailing `:`, but YAML also rejects values starting with `*`, `&`, `@`, `` ` `` or `%`. **Done:** noted as a known limit in [Documentation structure](../../wiki/system/documentation.md); no current file is affected.
- `scripts/lint-docs.mjs:15` The `TYPES` list is repeated in `documentation.md`. **Done:** left as it is; the page says that adding a type means changing both.

## Review run 1

**Result:** Stopped (1 must fix), fixed
**Summary:** The split of `PLAYBOOK.md` and `specs/overview.md` lost no substance, and the script and tests covered R2–R4 reasonably. But 24 of 35 frontmatter blocks were not valid YAML (an unquoted `: ` in `title` or `description`), which the script's own parser accepted.

### Must fix

- `scripts/lint-docs.mjs:15-25` and the frontmatter of 24 files were not valid YAML. **Done:** the values are quoted, the parser rejects unquoted values with `: ` or ` #`, and tests cover it (R2). All files parse with `js-yaml`.

### Should fix

- `scripts/lint-docs.mjs:56` A root `index.md` without any frontmatter passed the `okf_version` check. **Done:** the check no longer depends on the frontmatter, with a test.
- `specs/TECH-002-repository-and-hosting/solution.md:26` Pointed to a `PLAYBOOK.md` section that moved. **Done:** now links to [Architecture](../../wiki/system/architecture.md).
- `wiki/system/project-setup.md` steps 6 and 7 lost the `live-tests.yml` URL and the board URL in `CLAUDE.md`. **Done:** restored.
- `wiki/system/documentation.md` omitted `README.md`, `DESIGN.md`, `PRODUCT.md`; `wiki/system/way-of-working.md` lost the "only checks actually done" line. **Done:** both restored.

### Suggestions

- Folder links without an `index.md` and `#anchor` links are not checked. **Done:** noted as a known limit in `documentation.md`.
- Missing tests for unparseable frontmatter, `okf_version` and folder links. **Done:** added.
- `verification.md` R4 should say "not checked" for CI until the first run. **Done:** it does.

### Outside the change

- Several wiki descriptions with colons were invalid YAML before this change. **Done:** fixed with the must-fix.

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
