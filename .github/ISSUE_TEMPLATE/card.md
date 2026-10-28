---
name: Card
about: A feature, fix or technical task for the backlog
title: "MUPP-000 Short name"
---

<!-- Title: the next free ID (MUPP- for Feature and Fix, TECH- for Tech) and a short name. Set "Work type" and "Area" on the board. -->

A short explanation: what the user can do when this is done, and why it matters.

Solution, flow and verification: `specs/MUPP-000-<name>/` (created when the work starts).

<!-- Filled in together when the card is specified, before it moves to Specified. -->

## Goal

One or two sentences.

## Background

What exists today, and what prompted the card. Link to related cards and wiki pages.

## Users

Visitor, administrator, or both.

## Scope

**In scope**

- …

**Out of scope**

- … (things that could be mistaken for part of this card, and where they belong instead)

## Requirements

Each requirement is one testable statement. Tests are named after the requirement ID.

### MUPP-000-R1 Short title

The site shall …

Acceptance criteria:

- **Given** …, **when** …, **then** ….

## Test plan

How the requirements will be checked (see `wiki/system/testing.md`). Write "none" with the reason where a kind doesn't apply.

- **Unit tests:** which logic, calculations, rules or data.
- **Browser tests:** which flows and states, with axe on each. Checks of the look (colours, sizes, contrast, focus) go into the matching test in `tests/design.spec.ts`, one test per page and state; say which.
- **Smoke test:** what a quick read-only check against the preview and production shows, if the card adds or changes a main page or flow.
- **Accessibility:** which pages go through the checklist on the live site.
- **Security:** whether `/security-review` is needed (sign-in, admin, API routes, server actions, database queries, personal data). A card that adds an API route, a server action or a form lists here how the security rules of `specs/rules.md` are met and tested: sign-in first, `guardWrite()` for writes, input checked on the server, no internals in errors, pictures only through the site, `__Host-` cookies, nothing the Content-Security-Policy blocks.
- **Code review:** always; anything the reviewer should look at in particular.

## Non-functional requirements

Performance, accessibility, security, mobile. "None beyond `specs/rules.md`" if nothing special.

## Open questions

Settled with the user before the card moves to Specified. Remove when answered, and write the answer into the right section.

- …
