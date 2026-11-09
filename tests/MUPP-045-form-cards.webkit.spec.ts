import { devices, expect, test, type Page } from "@playwright/test";
import { addChild, addParent, addWish, clearFamily } from "./family-db";
import { birthdateIn, goto, runsLocally, uniqueName } from "./helpers";

// Körs bara med `npm run test:webkit` (WebKit är inte installerat i CI): bara Safari på iPhone visar om fokus sätts i själva trycket (MUPP-045-R4).
// Admin går inte att logga in på i WebKit här (kakan är Secure på http), så formulärkorten i adminen testas bara i Chromium; paxa-fönstret är samma kort.
// Att tangentbordet verkligen kommer upp går inte att se i WebKit utan skärm; det kontrolleras på en riktig iPhone (verification.md).
test.skip(!runsLocally, "needs the local test database");
test.use({ ...devices["iPhone 13"], browserName: "webkit" });

test.beforeEach(async () => {
  await clearFamily();
});
test.afterAll(async () => {
  await clearFamily();
});

// Trycker på knappen som ett tryck gör (click() kör samma händelse) och säger vad som har fokus innan något annat hunnit hända
const pressAndRead = (page: Page, name: string | RegExp) =>
  page.getByRole("button", { name }).evaluate((button: HTMLElement) => {
    button.click();
    const active = document.activeElement as HTMLInputElement;
    return { field: active.name || active.id, insideCard: active.closest("dialog[open]") !== null };
  });

test("MUPP-045-R4 on an iPhone the claim window has its name field active in the press that opens it, and focus is back on the button when it closes", async ({ page }) => {
  const child = await addChild(await addParent(uniqueName("Förälder")), "Vera", birthdateIn(20).birthdate);
  await addWish(child, "birthday", "Cykel");
  await goto(page, "/");
  await page.getByRole("article").getByRole("button", { name: /^Önskelista/ }).tap();
  const region = page.getByRole("region", { name: "Önskelista" });
  await region.getByRole("checkbox", { name: "Cykel" }).tap();

  expect((await pressAndRead(page, /^Paxa \(/)).insideCard).toBe(true);
  await expect(page.getByRole("dialog").getByLabel("Ditt namn")).toBeFocused();
  await page.getByRole("dialog").getByRole("button", { name: "Stäng" }).tap();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(region.getByRole("button", { name: /^Paxa \(/ })).toBeFocused();
});
