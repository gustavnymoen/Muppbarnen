import { readFileSync } from "node:fs";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { expectNoA11yViolations, goto } from "./helpers";
import { newVisitor, siteSessionFile, testIp } from "./site-session";

// En besökare som är inloggad med sajtlösenordet men inte har sett rutan (saknar onboarding-kakan). Inloggningen anges
// som storageState, annars ärver sammanhanget testernas sparade inloggning med kakan.
async function newcomer(browser: Browser, baseURL: string | undefined) {
  const { cookies } = JSON.parse(readFileSync(siteSessionFile, "utf8"));
  return browser.newContext({
    baseURL,
    extraHTTPHeaders: { "x-real-ip": testIp() },
    storageState: { cookies: cookies.filter((c: { name: string }) => !c.name.endsWith("onboarding")), origins: [] },
  });
}

test("MUPP-035-R1 R2 R3 R4 R5 R6 R7 MUPP-036-R1 R2 the dialog opens by itself once, has two tabs with the texts, closes with OK and is opened again from the menu", async ({ browser, baseURL }) => {
  const context = await newcomer(browser, baseURL);
  const page = await context.newPage();
  await goto(page, "/");

  // R1: open with focus inside it, and the deck behind it cannot be used
  const dialog = page.getByRole("dialog", { name: "Så funkar sajten" });
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(() => document.activeElement?.closest("dialog") !== null)).toBe(true);
  // The page behind a modal dialog cannot be pressed
  await expect(page.getByRole("button", { name: "Meny" }).click({ trial: true, timeout: 500 })).rejects.toThrow();

  // MUPP-036-R1 R2: one button to close with, no cross; the text fits here, so it is OK and not the arrow
  await expect(dialog.getByRole("button", { name: "Stäng" })).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Läs vidare" })).toHaveCount(0);

  // R4 R6: the visitor tab is shown first, with the site's own words
  const tabs = dialog.getByRole("tablist", { name: "Läs som" });
  await expect(tabs.getByRole("tab")).toHaveText(["Besökare", "Förälder"]);
  await expect(tabs.getByRole("tab", { name: "Besökare" })).toHaveAttribute("aria-selected", "true");
  const panel = dialog.getByRole("tabpanel", { name: "Besökare" });
  await expect(panel).toContainText("underlätta födelsedagar och jul");
  await expect(panel).toContainText("Paxad");
  await expect(panel).toContainText("Kan köpas flera gånger");
  await expect(panel).toContainText("orangea pilen");
  await expectNoA11yViolations(page);

  // R5 R6: the arrow keys move between the tabs, the panel follows, Tab moves on into the panel
  await tabs.getByRole("tab", { name: "Besökare" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.getByRole("tab", { name: "Förälder" })).toBeFocused();
  const parent = dialog.getByRole("tabpanel", { name: "Förälder" });
  await expect(parent).toContainText("Admin");
  await expect(parent).toContainText("Obegränsad");
  await expect(parent).toContainText("Arkiverade");
  await expectNoA11yViolations(page);
  await page.keyboard.press("Tab");
  await expect(parent).toBeFocused();
  await tabs.getByRole("tab", { name: "Förälder" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(tabs.getByRole("tab", { name: "Besökare" })).toHaveAttribute("aria-selected", "true");

  // R1 R2 R7: OK closes it and sets the cookie, which is HttpOnly, Secure, on the whole site, lasts a year, and keeps it closed on a reload
  await dialog.getByRole("button", { name: "OK" }).click();
  await expect(dialog).toBeHidden();
  await expect.poll(async () => (await context.cookies()).some((c) => c.name.endsWith("onboarding"))).toBe(true);
  const cookie = (await context.cookies()).find((c) => c.name.endsWith("onboarding"))!;
  expect(cookie).toMatchObject({ name: "__Host-onboarding", httpOnly: true, secure: true, path: "/", value: "1" });
  expect(cookie.expires - Date.now() / 1000).toBeGreaterThan(364 * 24 * 3600);
  await page.reload();
  await goto(page, "/");
  await expect(dialog).toBeHidden();

  // R3 R2: the menu has the item between Start and Admin, which opens the dialog on the first tab; Esc closes it and the focus is back on the menu button
  await page.getByRole("button", { name: "Meny" }).click();
  const items = page.getByRole("navigation", { name: "Huvudmeny" }).getByRole("listitem");
  await expect(items).toHaveText(["Start", "Så funkar sajten", "Admin"]);
  await items.nth(1).getByRole("button").click();
  await expect(dialog).toBeVisible();
  await expect(tabs.getByRole("tab", { name: "Besökare" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Meny" })).toBeFocused();
  await context.close();
});

test("MUPP-035-R1 R2 Esc and a press outside also set the cookie, and the dialog is not on the password page", async ({ browser, baseURL }) => {
  const ways = {
    Esc: (page: Page) => page.keyboard.press("Escape"),
    "a press outside": (page: Page) => page.mouse.click(2, 2),
  };
  for (const [way, close] of Object.entries(ways)) {
    const context = await newcomer(browser, baseURL);
    const page = await context.newPage();
    await goto(page, "/");
    const dialog = page.getByRole("dialog", { name: "Så funkar sajten" });
    await expect(dialog, way).toBeVisible();
    await close(page);
    await expect(dialog, way).toBeHidden();
    await expect.poll(async () => (await context.cookies()).some((c) => c.name.endsWith("onboarding")), way).toBe(true);
    await context.close();
  }

  const visitor = await newVisitor(browser, baseURL);
  const page = await visitor.newPage();
  await goto(page, "/losenord");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await visitor.close();
});
