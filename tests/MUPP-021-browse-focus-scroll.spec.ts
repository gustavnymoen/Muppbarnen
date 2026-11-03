import { expect, test, type Page } from "@playwright/test";
import { addChild, addParent, addWish, clearFamily } from "./family-db";
import { animationsDone, birthdateIn, expectNoA11yViolations, goto, runsLocally, uniqueName } from "./helpers";

// De här testen gör egna barn i testdatabasen, så de körs bara lokalt
test.skip(!runsLocally, "needs the local test database");

const card = (page: Page) => page.getByRole("article");
// Spelytan som korten glider i: den får inte ha scrollats i sidled
const deckScroll = (page: Page) => card(page).evaluate((el) => el.parentElement!.parentElement!.scrollLeft);

test.beforeEach(async () => {
  await clearFamily();
});
test.afterAll(async () => {
  await clearFamily();
});

async function openFirstList(page: Page, others: { name: string; days: number }[]) {
  const parent = await addParent(uniqueName("Förälder"));
  await addWish(await addChild(parent, "Otto", birthdateIn(10).birthdate), "birthday", "Cykel åt Otto");
  for (const { name, days } of others) await addWish(await addChild(parent, name, birthdateIn(days).birthdate), "birthday", `Cykel åt ${name}`);
  await page.setViewportSize({ width: 375, height: 667 });
  await goto(page, "/");
  await animationsDone(card(page));
  await card(page).getByRole("button", { name: /^Önskelista/ }).click();
}

test("MUPP-021-R1 next card with a list open leaves the deck in place: a card with one kid has its list open", async ({ page }) => {
  await openFirstList(page, [{ name: "Alma", days: 20 }]);
  await page.getByRole("button", { name: "Nästa kort" }).click();
  await expect(card(page).getByRole("heading", { level: 3 })).toHaveText("Alma");
  await expect(card(page).getByRole("region", { name: "Önskelista" })).toBeVisible();
  await expect(card(page).getByRole("button", { name: "Fäll ihop önskelistan" })).toBeFocused();
  await animationsDone(card(page));
  expect(await deckScroll(page)).toBe(0);
  await expectNoA11yViolations(page);
});

test("MUPP-021-R1 next card with a list open leaves the deck in place: a card with several kids is the overview", async ({ page }) => {
  await openFirstList(page, [{ name: "Vera", days: 40 }, { name: "Vilda", days: 40 }]);
  await page.getByRole("button", { name: "Nästa kort" }).click();
  await expect(card(page).getByRole("button", { name: "Önskelista för Vera" })).toBeFocused();
  await animationsDone(card(page));
  expect(await deckScroll(page)).toBe(0);
  await expectNoA11yViolations(page);
});
