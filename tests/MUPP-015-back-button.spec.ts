import { expect, test, type Locator, type Page } from "@playwright/test";
import { addChild, addParent, addWish, clearFamily } from "./family-db";
import { animationsDone, birthdateIn, expectNoA11yViolations, runsLocally, uniqueName } from "./helpers";

// De här testen gör egna barn i testdatabasen, så de körs bara lokalt
test.skip(!runsLocally, "needs the local test database");

// Utseendet och måtten (hörnet, 44 px, rubriken, kontrast, ingen scroll) testas i design.spec.ts

const card = (page: Page) => page.getByRole("article");
const region = (page: Page) => card(page).getByRole("region", { name: "Önskelista" });
const status = (page: Page) => page.getByRole("status");

test.beforeEach(async () => {
  await clearFamily();
});
test.afterAll(async () => {
  await clearFamily();
});

// Två barn på samma födelsedag (kort med flera barn), och med två önskningar var som kan paxas
async function twoKids(page: Page) {
  const parent = await addParent(uniqueName("Förälder"));
  const { birthdate } = birthdateIn(20);
  const vera = await addChild(parent, "Vera", birthdate);
  await addChild(parent, "Vilda", birthdate);
  for (const title of ["Cykel", "Pussel"]) {
    await addWish(vera, "birthday", title);
    await addWish(vera, "christmas", title);
  }
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await animationsDone(card(page));
}

async function toChristmas(page: Page) {
  for (let i = 0; i < 4 && (await card(page).getByRole("heading", { level: 2 }).innerText()) !== "Julafton"; i++) {
    await page.getByRole("button", { name: "Nästa kort" }).click();
    await animationsDone(card(page));
  }
}

// Öppnar Vera, markerar två önskningar och går tillbaka med Tillbaka; samma resa för båda korten (R1-R3)
async function backJourney(page: Page, open: Locator, backName: string) {
  await open.click();
  await expect(region(page)).toBeVisible();

  // R1: knappen finns, och R3: den är först i tabbordningen och heter efter vart den går
  const back = card(page).getByRole("button", { name: backName });
  await expect(back).toBeVisible();
  await expect(back).toHaveText("Tillbaka");
  await expect(page.getByRole("button", { name: "Nästa kort" })).toBeDisabled();
  await expectNoA11yViolations(page);
  await region(page).getByRole("checkbox", { name: "Cykel" }).check();
  await region(page).getByRole("checkbox", { name: "Pussel" }).check();
  await back.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(back).not.toBeFocused();
  await page.keyboard.press("Tab");
  await expect(back).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(card(page).getByRole("button", { name: "Storlekar", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(region(page)).toBeFocused();

  // R2: som Stäng; alla barn syns, leken är upplåst, fokus på barnets knapp och markeringarna är borta
  await back.click();
  await expect(region(page)).toHaveCount(0);
  await expect(open).toBeFocused();
  await expect(page.getByRole("button", { name: "Nästa kort" })).toBeEnabled();
  await expect(status(page)).toHaveText("Kortleken är upplåst.");
  await open.click();
  await expect(region(page).getByRole("checkbox", { name: "Cykel" })).not.toBeChecked();
  await expect(card(page).getByRole("button", { name: /^Paxa/ })).toHaveCount(0);

  // R2 oförändrat: Esc och Stäng
  await page.keyboard.press("Escape");
  await expect(region(page)).toHaveCount(0);
  await expect(open).toBeFocused();
  await open.click();
  await region(page).getByRole("button", { name: /^Stäng/ }).click();
  await expect(region(page)).toHaveCount(0);
  await expect(open).toBeFocused();
}

test("MUPP-015-R1 R2 R3 the birthday card with several kids: Tillbaka is first, named after where it goes, and does what Stäng does", async ({ page }) => {
  await twoKids(page);
  const open = card(page).getByRole("button", { name: "Önskelista för Vera" });
  await backJourney(page, open, "Tillbaka till alla barn");
});

test("MUPP-015-R1 R2 R3 the Christmas card: Tillbaka is first, named after Julafton, and does what Stäng does", async ({ page }) => {
  await twoKids(page);
  await toChristmas(page);
  const open = card(page).getByRole("button", { name: /^Öppna Vera/ });
  await backJourney(page, open, "Tillbaka till Julafton");
});

test("MUPP-015-R1 the single kid card has no Tillbaka button, open or folded", async ({ page }) => {
  const parent = await addParent(uniqueName("Förälder"));
  const vera = await addChild(parent, "Vera", birthdateIn(20).birthdate);
  await addWish(vera, "birthday", "Cykel");
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await animationsDone(card(page));
  await expect(card(page).getByRole("button", { name: /^Tillbaka/ })).toHaveCount(0);
  await card(page).getByRole("button", { name: /^Önskelista/ }).click();
  await expect(region(page)).toBeVisible();
  await expect(card(page).getByRole("button", { name: /^Tillbaka/ })).toHaveCount(0);
  await expectNoA11yViolations(page);
});
