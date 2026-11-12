---
type: Verification
title: "TECH-020 Go live with mail: verification"
description: How each requirement of Go live with mail was checked, what is still not checked, and the requirements as built.
feature: TECH-020
---

# Verification of TECH-020

"Not checked" means the check was not done. The manual steps are done by the owner; their results come from the card's "Result so far" (2026-11-10), not from this session.

| Requirement | How it was checked | Where | Result | Date |
|---|---|---|---|---|
| TECH-020-R1 | Manual, reported by the owner: a test mail from `scripts/send-test-mail.mjs` (2026-11-11). **Hotmail** (sender not marked as trusted): `spf=pass`, `dkim=pass` (kusinportalen.com and amazonses.com), `dmarc=pass`, `compauth=pass`, SCL 1, in the inbox. **Gmail:** in the inbox, SPF, DKIM and DMARC pass (reported by the owner, header lines not recorded). **Work address on Exchange (aqc.se):** not in the inbox and not seen in the junk folder; not delivered or filtered by the company's own rules, cause not found. Earlier (2026-11-10, Outlook): `spf`, `dkim`, `dmarc`, `compauth` pass, SCL 5 | live | Pass for Gmail and Hotmail; Exchange work address: delivered per Resend but not seen, accepted as is (see Notes) | 2026-11-11 |
| TECH-020-R2 | Code read: the key is read only in `lib/mail.ts` (and `scripts/send-test-mail.mjs`), no `console` output in the mail code, no `NEXT_PUBLIC_` variable, `.env*` ignored by Git. A pattern search (`re_…`) of the history found nothing. CI `security` (Gitleaks) passed on the latest `main` pull request run. In Vercel the key is a sensitive environment variable (shown with a lock) for Production and Preview (screenshot from the owner); real mail was received from the live site. The owner searched Vercel's logs for `re_` and `Bearer` and found nothing. The owner also searched the Vercel build log of the latest production deployment for `re_` and `Bearer`: nothing | local, CI, live | Pass | 2026-11-11 |

## The test plan

| Check | How it was done | Where | Result | Date |
|---|---|---|---|---|
| Unit tests | None planned; `sendMail` is tested in TECH-017 | | Not applicable | |
| Browser tests | None planned | | Not applicable | |
| Smoke test | None planned: a mail is never sent from a smoke test | | Not applicable | |
| Accessibility | None planned: visitors see no change | | Not applicable | |
| Security | The secret scan in CI (Gitleaks); `/security-review` not needed (the card says so) | CI | Pass (latest run) | 2026-11-11 |
| Manual check | Gmail, Hotmail and Outlook (see R1); the work address did not receive the mail | live | Partly | 2026-11-11 |
| Code review | [review.md](review.md): passed, no must-fix | local | Passed | 2026-11-12 | |

## Test suite

Not measured: the change adds a script and documentation, no test.

## Notes

- The key is also set for **Preview** in Vercel, not only Production, so a preview deployment can send real mail if its database holds real members. Open: decide whether to remove the Preview key (not done).
- The Exchange work address got nothing in the inbox or the junk folder, yet Resend's Emails page shows every test mail, the aqc.se one too, as Delivered: the company's server accepted it and then held it back (quarantine or a transport rule are the likely causes; not checked). The owner decided it is acceptable, since most users have private addresses; nothing changed for it.

## Definition of Done

- [ ] Tests: every check in the card's test plan is done (the manual check is partly open)
- [x] Test suite: not applicable (no test added)
- [x] Deployed, and the smoke tests pass against production (Live tests): the run on the merge commit bb3d0fe passed (2026-11-12)
- [x] Accessibility: not applicable (visitors see no change)
- [ ] Requirements in the card match what was built, no open questions left; copied below as built
- [x] Manual (`wiki/manual/`), system docs (`wiki/system/`) and `wiki/log.md` updated
- [x] No leftovers: the change adds one script and documentation, nothing made unused
- [x] Clean code: `npm run lint`, `lint:docs`, `typecheck` and `build` pass (2026-11-12; the build with a scratch database, one Turbopack warning about dynamic file access)
- [x] Code review done, no must-fix findings left; see [review.md](review.md)
- [x] Technical tasks for larger improvements noticed along the way added to the board: none

## Requirements as built

Not copied yet: the card is not finished.

See also: [Solution](solution.md), [Review](review.md).

[Specifications](../index.md)
