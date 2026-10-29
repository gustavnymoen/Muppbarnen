---
type: Review
title: "MUPP-012 Parent picker in mobile mode: review"
description: "The code review of Parent picker in mobile mode: findings, decisions and result."
feature: MUPP-012
---

# Code review of MUPP-012

**Result:** Passed
**Date:** 2026-10-29, review run 1
**Summary:** `ListPicker` follows the select-only combobox pattern and meets R1 to R3; no new dependency. Two small points were raised and handled.
**Security:** Passed. The control only picks among options the server sent; the field name is unchanged and the server still checks the parent id. No secrets, cookies, queries or personal data are touched. `/security-review`: not needed, as the card says.

How the review works: `wiki/system/code-review.md`.

## Must fix

None.

## Should fix

- `app/components/ListPicker.tsx` `aria-invalid` is not set on the picker, as the old `<select>` had. **Done:** left as it is on purpose. `aria-invalid` is not allowed on the role `button` (ESLint `jsx-a11y/role-supports-aria-props` warns), and the error is still read through `aria-describedby`.
- `app/components/ListPicker.tsx` clicking the field while the list is open could close and reopen it where a click does not focus a button (Safari, Firefox on Mac), since the list closes on blur. **Done:** the button's `onMouseDown` prevents the focus change while the list is open; the wide-screen test checks that a click on the field closes the list (only Chromium is tested).

## Suggestions

- The scroll listener ran `place()` when the list itself scrolled. **Done:** it now ignores scrolls of the list.
- Typing one letter twice ("aa") matches nothing, where a native select cycles. **Done:** left as it is: the parent list is short.
- The title of the second browser test promised more than it checked. **Done:** the title is shortened and the test now checks that the list is drawn in `body` and that a click on the field closes it.

## Outside the change

- None.

The review was done by reading the files; the tests, lint and build were run by the author (see [Verification](verification.md)).

See also: [Solution](solution.md), [Verification](verification.md).

[Specifications](../index.md)
