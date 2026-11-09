import { expect, type Page } from "@playwright/test";
import { createSantaSession } from "../lib/santa-session";
import { goto } from "./helpers";

// Shared by the Secret Santa tests (MUPP-039, MUPP-040, design.spec.ts). The cookie is __Host- on the
// production build the tests run against; its name in lib/santa-session.ts depends on NODE_ENV.
export const SANTA_COOKIE = "__Host-santa_session";

// Signs in without the form (TECH-018): the cookie the site would set, signed with the test server's
// made-up key (set in playwright.config.ts). Tests of the sign-in itself use the form.
export async function santaSignIn(page: Page, memberId: number) {
  const value = createSantaSession(process.env.SITE_SESSION_SECRET!, memberId);
  await page.context().addCookies([{ name: SANTA_COOKIE, value, domain: "localhost", path: "/", secure: true, httpOnly: true, sameSite: "Lax" }]);
}

// The names step: from the entrance to a person's sign-in form
export async function pickName(page: Page, name: string) {
  await page.getByRole("link", { name, exact: true }).click();
  await expect(page.getByLabel("Ditt telefonnummer")).toBeVisible();
}

// Opens the entrance and the form for one person
export async function openSignInForm(page: Page, name: string) {
  await goto(page, "/secret-santa");
  await pickName(page, name);
}

// Types the phone number and sends it with Fortsätt
export async function sendPhone(page: Page, phone: string) {
  await page.getByLabel("Ditt telefonnummer").fill(phone);
  await page.getByRole("button", { name: "Fortsätt" }).click();
}
