---
type: Verification
title: "MUPP-056 Foldable groups in Secret Santa admin: verification"
description: How each requirement of Foldable groups in Secret Santa admin was checked, the test suite before and after, and the requirements as built.
feature: MUPP-056
---

# Verification of MUPP-056

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| MUPP-056-R1 | Test `MUPP-056-R1 …` in `tests/MUPP-056-santa-admin-groups.spec.ts`; unit test in `lib/santa-groups.test.ts` | local | Pass | 2026-11-10 |
| MUPP-056-R2 | Test `MUPP-056-R2 R4 R5 …` (closed cards, mouse and keyboard, `aria-expanded`, name, 44 px); unit test | local | Pass | 2026-11-10 |
| MUPP-056-R3 | Test `MUPP-056-R3 …` (two tests: own first and open, several own, none); unit tests | local | Pass | 2026-11-10 |
| MUPP-056-R4 | Test `MUPP-056-R2 R4 R5 …`: a closed card has no members, plus or switch in the page | local | Pass | 2026-11-10 |
| MUPP-056-R5 | Test `MUPP-056-R2 R4 R5 …`: stays open after adding a person, a new group is open, a reload decides again | local | Pass | 2026-11-10 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | `lib/santa-groups.test.ts`, one per rule | local | Pass | 2026-11-10 |
| Browser tests | `tests/MUPP-056-santa-admin-groups.spec.ts` with axe on each state; the Secret Santa tests of MUPP-038, 045, 048, 051, 053 adapted (other parents' groups are closed) | local | Pass | 2026-11-10 |
| Look on a phone | `tests/design.spec.ts` (closed card at 320 px: header 44 px, no sideways scroll, then open) | local | Pass | 2026-11-10 |
| Smoke test | not applicable (none planned) | | | |
| Accessibility | axe in the browser tests; checklist items on the live site | live | Not checked yet (after deploy) | |
| Security | no new action, data or route; `/security-review` not needed | local | Pass | 2026-11-10 |
| Code review | [review.md](review.md) | local | Passed | 2026-11-10 |

## Test suite

| | Tests | Total time | Slowest test |
|---|---|---|---|
| Before | not measured | over budget already (TECH-019) | |
| After | 297 unit, 143 browser | 322.9 s (budget 180 s) | 30 s (MUPP-045, first run: failed, group cards closed; fixed and run again, passes in 3.8 s) |

The full run before the MUPP-045 fix had 142 passed and that one failed; after the fix the file and the new tests were run again and pass. The full suite was not run a second time. The suite is over its budget because of TECH-019, not this change (4 new browser tests, about 5 s).

## Definition of Done

- [x] Tests: the checks in the plan are done (live accessibility pending)
- [x] Test suite: over budget because of TECH-019; the new tests follow the quality rules; accepted by the user (2026-11-12): the suite grew fast while the site was built
- [x] Deployed, and the smoke tests pass against production (Live tests on `main` after the merge of #180, 2026-11-10)
- [x] Accessibility: axe passes; the live checklist is marked done by the user (2026-11-12); it was not gone through item by item by Claude and no details are recorded per item
- [x] Requirements match what was built, below; `solution.md` describes how it was built
- [x] Manual, system docs and `wiki/log.md` updated
- [x] No leftovers
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` pass; `npm run build` ran as part of the test run
- [x] Code review done, no must-fix findings; see [review.md](review.md)
- [x] No larger improvements to add to the board

## Requirements as built

### MUPP-056-R1 One group, nothing to fold

A visitor who administers exactly one group and sees no other groups shall see it open without a fold control.

Acceptance criteria:

- **Given** a parent with one group, **then** the group is shown as today, open, with no open/close control.

### MUPP-056-R2 Several own groups: all closed

A parent who administers more than one group shall see each of them as a closed card.

Acceptance criteria:

- **Given** a parent with two or more groups, **then** every group is a closed card with name, status and participants, and pressing its header opens it, pressing it again closes it.
- **Given** a card, **then** the header is a button with `aria-expanded` and an accessible name that includes the group's name; it is reachable by keyboard and at least 44 px high.

### MUPP-056-R3 Master admin: own open, others closed and last

The master admin shall see their own groups first and the other parents' groups last, closed and ordered by the administrator's name.

Acceptance criteria:

- **Given** the master admin with one own group and groups of Emma and Erik, **then** the own group is open and first, followed by Emma's and Erik's groups closed, in the order of the names.
- **Given** the master admin with several own groups, **then** all of them are closed (R2) and still before the groups of the other parents.
- **Given** the master admin with no own group, **then** all groups are closed, ordered by administrator.

### MUPP-056-R4 Closed means hidden

A closed card shall not show its participants or buttons, and shall not leave anything focusable inside it.

Acceptance criteria:

- **Given** a closed card, **then** its participants, plus and status controls are not visible and cannot be reached by Tab or by a screen reader.

### MUPP-056-R5 Open state kept while the page is open

A newly created group shall be open, and what the visitor has opened or closed shall stay as it is after a change on the page.

Acceptance criteria:

- **Given** a group is created, **then** it is shown open.
- **Given** an open card, **when** a participant is added, changed or removed, **then** the card stays open; a closed card stays closed.
- **Given** a reload or a new visit, **then** the rules R1 to R3 decide again (nothing is stored between visits).

## Notes

- A closed card keeps the rename and delete buttons in its header row.
- The open state is lost if the tab is unmounted; nothing is stored between visits.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
