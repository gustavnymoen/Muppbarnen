import { expect, test, type Locator, type Page } from "@playwright/test";
import { addChild, addParent, addWish, clearFamily } from "./family-db";
import { animationsDone, birthdateIn, expectNoA11yViolations, goto, pageAnimationsDone, runsLocally, settledBox, uniqueName } from "./helpers";

// De här testen gör egna barn i testdatabasen, så de körs bara lokalt
test.skip(!runsLocally, "needs the local test database");

// Utseendet och måtten (hörnet, 44 px, rubriken, kontrast, ingen scroll) testas i design.spec.ts

const card = (page: Page) => page.getByRole("article");
const region = (page: Page) => card(page).getByRole("region", { name: "Önskelista" });

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
  await goto(page, "/");
  await animationsDone(card(page));
}

async function toChristmas(page: Page) {
  for (let i = 0; i < 4 && (await card(page).getByRole("heading", { level: 2 }).innerText()) !== "Julafton"; i++) {
    await page.getByRole("button", { name: "Nästa kort" }).click();
    // Kortet glider på plats; öppnas något medan det glider kan webbläsaren skrolla ytan för att visa fokuset
    await settledBox(card(page));
  }
}

// Öppnar Vera, markerar två önskningar och går tillbaka med Tillbaka; samma resa för båda korten (R1-R3)
async function backJourney(page: Page, open: Locator, backName: string) {
  await open.click();
  await expect(region(page)).toBeVisible();

  // R1: knappen finns, och R3: den är först i tabbordningen och heter efter vart den går
  const back = card(page).getByRole("button", { name: backName });
  await expect(back).toBeVisible();
  await settledBox(card(page));
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
  // sedan rutan med listans rader, som går att scrolla med tangentbordet (MUPP-028)
  await page.keyboard.press("Tab");
  await expect(region(page).getByRole("group", { name: "Önskningar" })).toBeFocused();

  // R2: som Stäng; alla barn syns, fokus på barnets knapp och markeringarna är borta
  await back.click();
  await expect(region(page)).toHaveCount(0);
  await expect(open).toBeFocused();
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

// Samma sida för båda korten: först kortet med flera barn, sedan bläddras det till Julafton (TECH-015)
test("MUPP-015-R1 R2 R3 the birthday card with several kids and the Christmas card: Tillbaka is first, named after where it goes, and does what Stäng does", async ({ page }) => {
  await twoKids(page);
  await backJourney(page, card(page).getByRole("button", { name: "Önskelista för Vera" }), "Tillbaka till alla barn");
  await pageAnimationsDone(page);
  await toChristmas(page);
  await backJourney(page, card(page).getByRole("button", { name: /^Öppna Vera/ }), "Tillbaka till Julafton");
});

test("MUPP-015-R1 the single kid card has no Tillbaka button, open or folded", async ({ page }) => {
  const parent = await addParent(uniqueName("Förälder"));
  const vera = await addChild(parent, "Vera", birthdateIn(20).birthdate);
  await addWish(vera, "birthday", "Cykel");
  await page.setViewportSize({ width: 375, height: 667 });
  await goto(page, "/");
  await animationsDone(card(page));
  await expect(card(page).getByRole("button", { name: /^Tillbaka/ })).toHaveCount(0);
  await card(page).getByRole("button", { name: /^Önskelista/ }).click();
  await expect(region(page)).toBeVisible();
  await expect(card(page).getByRole("button", { name: /^Tillbaka/ })).toHaveCount(0);
  await expectNoA11yViolations(page);
});
