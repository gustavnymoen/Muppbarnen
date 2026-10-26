# Muppbarnen: overview

## Purpose

A simple app for a family to keep track of all the kids' wish lists for birthdays and Christmas, so the same gift isn't bought several times, with a nice view of upcoming birthdays and all the kids.

## Users

- **Parents (administrators):** three siblings with six kids between them. They fill in the wish lists and sizes for their kids on the admin page. One of them, Gustav, is the master admin.
- **Family and friends (visitors):** see the kids and their lists and claim presents. The whole site is behind one shared password.

## Terms

| Term | Meaning |
|---|---|
| Parent | An administrator who owns kids |
| Child | A kid with name, picture, birthdate and sizes |
| Wish list | A child's list for one occasion, birthday or Christmas |
| Wish list item | One wish, either limited (can be claimed once) or unlimited |
| Claim ("paxa") | A visitor marks an item as bought, so others don't buy it |

## Scope

In scope: the pages and flows in the board's features below. Out of scope: payments, shops, accounts per visitor.

## Features

| ID | What | Area | Status |
|---|---|---|---|
| TECH-001 | Project setup | Shared | Ongoing |

The backlog is the board <https://github.com/users/gustavnymoen/projects/3>.

## Rules for all features

- **Mobile first.** The main page does not scroll; only cards scroll inside.
- **Accessibility:** WCAG 2.2 AA (`wiki/system/accessibility.md`).
- **Security:** the whole site is behind the site password, admin pages also need the admin password, and every check is made on the server.
- **Personal data:** the repository is public. Real names, birthdates, sizes and pictures live in the database and Vercel Blob, entered on the admin page, never in Git. Seed and test data are made up.
- **Language:** everything visitors see is Swedish.

## How we work

Specification-driven development: a card on the board holds the requirements and test plan, every requirement has a test or a recorded check, and code, tests and documentation follow from it. The steps, the Definition of Done and the roles are in `CLAUDE.md`; the whole way of working in `PLAYBOOK.md`.
