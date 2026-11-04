---
type: Solution
title: "MUPP-035 Onboarding card: solution"
description: "How the dialog Så funkar sajten is built: two tabs, a cookie that remembers it was seen, and a menu item that opens it again."
feature: MUPP-035
card: "#41"
depends_on: [MUPP-002, MUPP-009]
---

# MUPP-035 Onboarding card: solution

How it is built. What is built and why (goal, scope, requirements) is in the card: `gh issue view 41`.

## Data

None. The only memory is a cookie in the visitor's browser.

## Interface

- `app/components/OnboardingDialog.tsx`: the dialog (`Dialog`, a `<dialog>` with `showModal()`), with a title, a close button "Stäng", the tabs "Besökare" and "Förälder" (`role="tablist"`, arrow keys move between them, only the selected tab is in the tab order), a panel that scrolls inside the dialog, and "OK". The texts are fixed data at the top of the file, approved on the card. Every way of closing it (OK, "Stäng", Esc, a press on the backdrop) ends in the dialog's `close` event, which resets the tab to "Besökare" and, if the dialog opened by itself, calls the action.
- `app/components/SiteMenu.tsx`: owns the dialog (so it exists on every page, not only while the menu is open) and has the item "Så funkar sajten" between "Start" and "Admin". The item moves the focus to the menu button first, so the dialog gives it back there when it closes.
- `app/page.tsx` reads the cookie and passes `onboarding` (no cookie) through `Page` and `SiteHeader` to the menu. Only the start page does, so the dialog never opens by itself on the password page or the admin pages.
- `app/actions.ts`, `markOnboardingSeen()`: `hasSiteSession()`, `guardWrite()`, then sets the cookie. No input.
- `lib/onboarding.ts`: the cookie's name (`__Host-onboarding` in production), lifetime (one year) and options (`HttpOnly`, `Secure`, `SameSite=Lax`, path `/`, no `Domain`).

## Decisions

- **The dialog lives in the menu component.** It has to open from the menu item and by itself, and the menu's list is removed from the page when it closes; the menu root is the one place that is on every page and stays mounted.
- **Cookie name.** `__Host-onboarding` in production and `onboarding` over http in development, the same rule as the site cookie (`lib/site-session.ts`), since `Secure` cannot be set locally.
- **One close handler instead of four.** The browser fires `close` for all four ways, so the cookie is set in one place.
- **Opens by itself only on mount.** Setting the cookie makes Next draw the page again with `onboarding` off; the effect that opens the dialog runs only once, so nothing reopens or closes it.
- **Texts kept short** on purpose (the audience is a small family group and the site explains itself): a sentence or two per part, no pictures.
- **Tests:** the test sign-in (`tests/global-setup.ts`) presses OK once, so the saved sign-in carries the cookie and no other test is blocked by the dialog; the new tests start from a visitor without it.

## Related

- The card's checks and review: [Verification](verification.md), [Review](review.md); the flow: [flow.mmd](flow.mmd).
- Documentation: [Start page and menu](../../wiki/system/start-page.md), [Site password](../../wiki/system/site-password.md), manual [Startsidan och menyn](../../wiki/manual/startsidan.md).

[Specifications](../index.md)
