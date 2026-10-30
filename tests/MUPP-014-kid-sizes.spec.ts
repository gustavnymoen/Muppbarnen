import { expect, test, type Page } from "@playwright/test";
import { addChild, addParent, addWish, clearFamily, setSizes } from "./family-db";
import { animationsDone, birthdateIn, expectNoA11yViolations, runsLocally, uniqueName } from "./helpers";

// De här testen gör egna barn i testdatabasen, så de körs bara lokalt
test.skip(!runsLocally, "needs the local test database");

// Utseendet och måtten (44 px, 70–80 %, hörnet, ingen scroll) testas i design.spec.ts

const card = (page: Page) => page.getByRole("article");
const dialog = (page: Page) => page.getByRole("dialog");
const region = (page: Page) => card(page).getByRole("region", { name: "Önskelista" });

test.beforeEach(async () => {
  await clearFamily();
});
test.afterAll(async () => {
  await clearFamily();
});

// Kort med två barn på samma födelsedag, och ett tredje barn som ger julkortet tre rutor
async function twoKids(page: Page, sizes = { clothes: "122", shoes: "30" }) {
  const parent = await addParent(uniqueName("Förälder"));
  const { birthdate } = birthdateIn(20);
  const vera = await addChild(parent, "Vera", birthdate);
  const vilda = await addChild(parent, "Vilda", birthdate);
  await setSizes(vera, sizes);
  await addWish(vera, "birthday", "Cykel");
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await animationsDone(card(page));
  return { vera, vilda };
}

test("MUPP-014-R2 R5 the single kid card: a Storlekar button opens the sizes with only the ones that are saved", async ({ page }) => {
  const parent = await addParent(uniqueName("Förälder"));
  const vera = await addChild(parent, "Vera", birthdateIn(20).birthdate);
  await setSizes(vera, { clothes: "122", shoes: "30" });
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await animationsDone(card(page));

  const button = card(page).getByRole("button", { name: "Storlekar" });
  await expect(button).toBeVisible();
  await expectNoA11yViolations(page);

  await button.click();
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page).getByRole("heading", { name: "Storlekar för Vera" })).toBeVisible();
  const rows = dialog(page).getByRole("term");
  await expect(rows).toHaveText(["Kläder", "Skor"]);
  await expect(dialog(page).getByRole("definition")).toHaveText(["122", "30"]);
  await expectNoA11yViolations(page);

  // Esc closes it and the focus is back on the button
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0);
  await expect(button).toBeFocused();

  // "Stäng" closes it too
  await button.click();
  await dialog(page).getByRole("button", { name: "Stäng" }).click();
  await expect(dialog(page)).toHaveCount(0);
  await expect(button).toBeFocused();
});

test("MUPP-014-R5 a kid with no sizes still has the button, and the dialog says so", async ({ page }) => {
  const parent = await addParent(uniqueName("Förälder"));
  await addChild(parent, "Vera", birthdateIn(20).birthdate);
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await card(page).getByRole("button", { name: "Storlekar" }).click();
  await expect(dialog(page).getByText("Inga storlekar inlagda än.")).toBeVisible();
  await expect(dialog(page).getByRole("term")).toHaveCount(0);
  await expectNoA11yViolations(page);
});

test("MUPP-014-R4 R5 the open list on the single kid card has the icon in the corner instead of the button, and the dialog leaves the list and its marks alone", async ({ page }) => {
  const parent = await addParent(uniqueName("Förälder"));
  const vera = await addChild(parent, "Vera", birthdateIn(20).birthdate);
  await setSizes(vera, { clothes: "122" });
  await addWish(vera, "birthday", "Cykel");
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await animationsDone(card(page));
  await card(page).getByRole("button", { name: /^Önskelista/ }).click();
  await expect(card(page).getByRole("button", { name: "Storlekar", exact: true })).toHaveCount(1);
  await expect(card(page).getByText("Storlekar", { exact: true })).toHaveCount(0);

  // A gift is marked, then the dialog is opened and closed with Esc: the list and the mark stay
  await region(page).getByRole("checkbox", { name: "Cykel" }).check();
  const icon = card(page).getByRole("button", { name: "Storlekar" });
  await icon.click();
  await expect(dialog(page).getByRole("definition")).toHaveText(["122"]);
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0);
  await expect(icon).toBeFocused();
  await expect(region(page)).toBeVisible();
  await expect(region(page).getByRole("checkbox", { name: "Cykel" })).toBeChecked();
  await expectNoA11yViolations(page);
});

test("MUPP-014-R3 R4 R5 the card with several kids: an icon button per kid, and the corner icon on the open kid view", async ({ page }) => {
  await twoKids(page);

  const veraIcon = card(page).getByRole("button", { name: "Storlekar för Vera" });
  const vildaIcon = card(page).getByRole("button", { name: "Storlekar för Vilda" });
  await expect(veraIcon).toBeVisible();
  await expect(vildaIcon).toBeVisible();
  await expect(card(page).getByRole("button", { name: "Storlekar", exact: true })).toHaveCount(0);
  await expectNoA11yViolations(page);

  // Each kid has their own sizes
  await veraIcon.click();
  await expect(dialog(page).getByRole("heading", { name: "Storlekar för Vera" })).toBeVisible();
  await expect(dialog(page).getByRole("definition")).toHaveText(["122", "30"]);
  await page.keyboard.press("Escape");
  await vildaIcon.click();
  await expect(dialog(page).getByText("Inga storlekar inlagda än.")).toBeVisible();
  await dialog(page).getByRole("button", { name: "Stäng" }).click();
  await expect(vildaIcon).toBeFocused();

  // The kid view: the icon is named without the name, and the icons of the list are gone
  await card(page).getByRole("button", { name: "Önskelista för Vera" }).click();
  await expect(region(page)).toBeVisible();
  await expect(card(page).getByRole("button", { name: "Storlekar", exact: true })).toHaveCount(1);
  await expect(card(page).getByRole("button", { name: /^Storlekar för / })).toHaveCount(0);
  await expectNoA11yViolations(page);
  await card(page).getByRole("button", { name: "Storlekar" }).click();
  await expect(dialog(page).getByRole("heading", { name: "Storlekar för Vera" })).toBeVisible();
  await expectNoA11yViolations(page);
});

test("MUPP-014-R5 the dialog keeps the focus inside, shows long values as plain text and fits at 320 px", async ({ page }) => {
  const parent = await addParent(uniqueName("Förälder"));
  const vera = await addChild(parent, "Vera", birthdateIn(20).birthdate);
  const long = "<b>x</b>".repeat(5);
  await setSizes(vera, { clothes: long, shoes: "1".repeat(40) });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await card(page).getByRole("button", { name: "Storlekar" }).click();
  await expect(dialog(page).getByText(long)).toBeVisible();
  await expect(dialog(page).locator("b")).toHaveCount(0);

  // Tab never reaches the page behind: the focus is in the dialog (or, with only "Stäng" to focus, leaves the page)
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement === document.body || document.activeElement?.closest("dialog") != null)).toBe(true);
  }
  // Nothing sticks out of the dialog sideways
  expect(await dialog(page).evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await expectNoA11yViolations(page);
});

test("MUPP-014-R4 R5 Christmas Eve: the tiles have no sizes button, and the open kid view has the corner icon", async ({ page }) => {
  await twoKids(page);
  for (let i = 0; i < 3 && (await card(page).getByRole("heading", { level: 2 }).innerText()) !== "Julafton"; i++) {
    await page.getByRole("button", { name: "Nästa kort" }).click();
    await animationsDone(card(page));
  }
  await expect(card(page).getByRole("button", { name: /^Storlekar/ })).toHaveCount(0);
  await card(page).getByRole("button", { name: /^Öppna Vera/ }).click();
  await expect(region(page)).toBeVisible();
  const icon = card(page).getByRole("button", { name: "Storlekar" });
  await expect(icon).toBeVisible();
  await expectNoA11yViolations(page);
  await icon.click();
  await expect(dialog(page).getByRole("heading", { name: "Storlekar för Vera" })).toBeVisible();
  await expect(dialog(page).getByRole("definition")).toHaveText(["122", "30"]);
  await expectNoA11yViolations(page);
});
