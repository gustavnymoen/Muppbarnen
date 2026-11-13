import { expect, type Locator, type Page } from "@playwright/test";
import { createSantaSession } from "../lib/santa-session";
import { goto } from "./helpers";
import { santaCleanupYear } from "./family-db";

// Shared by the Secret Santa tests (MUPP-039, MUPP-040, design.spec.ts). The cookie is __Host- on the
// production build the tests run against; its name in lib/santa-session.ts depends on NODE_ENV.
export const SANTA_COOKIE = "__Host-santa_session";

// Signs in without the form (TECH-018): the cookie the site would set, signed with the test server's
// made-up key (set in playwright.config.ts). Tests of the sign-in itself use the form.
export async function santaSignIn(page: Page, memberId: number) {
  const value = createSantaSession(process.env.SITE_SESSION_SECRET!, memberId, await santaCleanupYear());
  await page.context().addCookies([{ name: SANTA_COOKIE, value, domain: "localhost", path: "/", secure: true, httpOnly: true, sameSite: "Lax" }]);
}

// A wish row of "Din önskelista" (MUPP-070): a button that folds out; foldOut leaves an open row open
export const wishRow = (page: Page, title: string) => page.getByRole("button", { name: title, exact: true });
export async function foldOut(page: Page, title: string) {
  const row = wishRow(page, title);
  if ((await row.getAttribute("aria-expanded")) === "false") await row.click();
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

// A group's card on the admin Secret Santa tab. A group that folds (MUPP-056) has the status and the number of participants in
// its heading, so the name is matched as the start of the heading
export const eventCard = (page: Page, name: string) =>
  page.getByRole("article").filter({ has: page.getByRole("heading", { level: 3, name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?: |$)`) }) });

// Opens a card that is closed (a group that does not fold has no button and is open already)
export async function openEventCard(card: Locator) {
  const header = card.getByRole("heading", { level: 3 }).first().getByRole("button");
  if ((await header.count()) > 0 && (await header.getAttribute("aria-expanded")) === "false") await header.click();
}
