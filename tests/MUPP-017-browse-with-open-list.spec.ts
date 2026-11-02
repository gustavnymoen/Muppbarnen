import { expect, test, type Page } from "@playwright/test";
import { addChild, addParent, addWish, clearFamily } from "./family-db";
import { animationsDone, birthdateIn, expectNoA11yViolations, runsLocally, uniqueName } from "./helpers";

// De här testen gör egna barn i testdatabasen, så de körs bara lokalt
test.skip(!runsLocally, "needs the local test database");

const card = (page: Page) => page.getByRole("article");
const region = (page: Page) => card(page).getByRole("region", { name: "Önskelista" });
const status = (page: Page) => page.getByRole("status").first();
const next = (page: Page) => page.getByRole("button", { name: "Nästa kort" });
const previous = (page: Page) => page.getByRole("button", { name: "Föregående kort" });
const kidName = (page: Page) => card(page).getByRole("heading", { level: 3 });

test.beforeEach(async () => {
  await clearFamily();
});
test.afterAll(async () => {
  await clearFamily();
});

// Tre barn med varsin födelsedag (tre kort med ett barn vardera) och en önskning var
async function threeCards(page: Page) {
  const parent = await addParent(uniqueName("Förälder"));
  for (const [name, days] of [["Otto", 10], ["Alma", 20], ["Vera", 30]] as const) {
    await addWish(await addChild(parent, name, birthdateIn(days).birthdate), "birthday", `Cykel åt ${name}`);
  }
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await animationsDone(card(page));
}

// Tre barn på samma födelsedag (ett kort med flera barn) och Julafton, med en önskning var
async function threeKids(page: Page) {
  const parent = await addParent(uniqueName("Förälder"));
  const { birthdate } = birthdateIn(20);
  for (const name of ["Vera", "Vilda", "Vilma"]) {
    const id = await addChild(parent, name, birthdate);
    await addWish(id, "birthday", `Cykel åt ${name}`);
    await addWish(id, "christmas", `Pussel åt ${name}`);
  }
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await animationsDone(card(page));
}

test("MUPP-017-R1 a card with one kid: next, previous and the arrow keys show the next card with its list open, forget the marks and wrap around", async ({ page }) => {
  await threeCards(page);
  await card(page).getByRole("button", { name: /^Önskelista/ }).click();
  await region(page).getByRole("checkbox", { name: "Cykel åt Otto" }).check();
  await expect(next(page)).toBeEnabled();

  await next(page).click();
  await expect(kidName(page)).toHaveText("Alma");
  await expect(region(page).getByRole("checkbox", { name: "Cykel åt Alma" })).not.toBeChecked();
  await expect(card(page).getByRole("button", { name: /^Paxa/ })).toHaveCount(0);
  await expect(card(page).getByRole("button", { name: "Fäll ihop önskelistan" })).toBeFocused();
  await expect(status(page)).toHaveText(/^Kort 2 av \d: Alma/);
  // Listan på det nya kortet glider upp (MUPP-016); axe läser först när den är i vila
  await animationsDone(region(page));
  await expectNoA11yViolations(page);

  await page.keyboard.press("ArrowRight");
  await expect(kidName(page)).toHaveText("Vera");
  await expect(region(page)).toBeVisible();
  await previous(page).click();
  await expect(kidName(page)).toHaveText("Alma");
  await expect(region(page)).toBeVisible();

  // Julafton har alla barn, så den visas som översikt; härifrån är ingen lista öppen, och leken går runt som vanligt
  await next(page).click();
  await next(page).click();
  await expect(card(page).getByRole("heading", { level: 2 })).toHaveText("Julafton");
  await expect(region(page)).toHaveCount(0);
  await next(page).click();
  await expect(kidName(page)).toHaveText("Otto");
  await expect(region(page)).toHaveCount(0);
});

test("MUPP-017-R1 a card with several kids next is shown as the overview, with no list open", async ({ page }) => {
  const parent = await addParent(uniqueName("Förälder"));
  await addWish(await addChild(parent, "Otto", birthdateIn(10).birthdate), "birthday", "Cykel");
  await addChild(parent, "Vera", birthdateIn(40).birthdate);
  await addChild(parent, "Vilda", birthdateIn(40).birthdate);
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await card(page).getByRole("button", { name: /^Önskelista/ }).click();
  await expect(region(page)).toBeVisible();

  await next(page).click();
  await expect(card(page).getByRole("button", { name: "Önskelista för Vera" })).toBeFocused();
  await expect(region(page)).toHaveCount(0);
  await expectNoA11yViolations(page);
});

for (const [name, open, occasion] of [
  ["the card with several kids", /^Önskelista för Vera/, "Cykel åt"],
  ["Christmas Eve", /^Öppna Vera/, "Pussel åt"],
] as const) {
  test(`MUPP-017-R2 ${name}: next and previous change kid on the same card, wrap around, forget the marks and are announced`, async ({ page }) => {
    await threeKids(page);
    if (occasion === "Pussel åt") {
      while ((await card(page).getByRole("heading", { level: 2 }).innerText()) !== "Julafton") await next(page).click();
    }
    const heading = await card(page).getByRole("heading", { level: 2 }).innerText();
    await card(page).getByRole("button", { name: open }).click();
    await region(page).getByRole("checkbox", { name: `${occasion} Vera` }).check();

    await next(page).click();
    await expect(region(page).getByRole("checkbox", { name: `${occasion} Vilda` })).not.toBeChecked();
    await expect(status(page)).toHaveText(/Vilda/);
    await expect(card(page).getByRole("heading", { level: 2 })).toHaveText(heading);
    await expect(card(page).getByRole("button", { name: /^Tillbaka/ })).toBeVisible();
    await expectNoA11yViolations(page);

    await page.keyboard.press("ArrowRight");
    await expect(region(page).getByRole("checkbox", { name: `${occasion} Vilma` })).toBeVisible();
    await next(page).click();
    await expect(region(page).getByRole("checkbox", { name: `${occasion} Vera` })).toBeVisible();
    await previous(page).click();
    await expect(region(page).getByRole("checkbox", { name: `${occasion} Vilma` })).toBeVisible();
    await expect(status(page)).toHaveText(/Vilma/);
  });
}

test("MUPP-017-R3 swiping does nothing, the arrow keys stay in the claim dialog, and the old text is gone", async ({ page }) => {
  await threeCards(page);
  await card(page).getByRole("button", { name: /^Önskelista/ }).click();
  await expect(page.getByText("Stäng önskelistan för att bläddra.")).toHaveCount(0);

  const box = (await card(page).boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width - 20, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 20, y, { steps: 8 });
  await page.mouse.up();
  await expect(kidName(page)).toHaveText("Otto");

  await region(page).getByRole("checkbox", { name: "Cykel åt Otto" }).check();
  await region(page).getByRole("button", { name: /^Paxa \(/ }).click();
  const name = page.getByRole("dialog").getByLabel("Ditt namn");
  await name.fill("Moster");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowRight");
  await expect(name).toHaveValue("Moster");
  await expect(kidName(page)).toHaveText("Otto");
  await page.keyboard.press("Escape");

  // Samma i storleksrutan
  await card(page).getByRole("button", { name: "Storlekar", exact: true }).click();
  await expect(page.getByRole("dialog", { name: /^Storlekar för/ })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(kidName(page)).toHaveText("Otto");
});

for (const width of [320, 375]) {
  test(`MUPP-017-R4 Tillbaka is only an icon, named after where it goes, 44 px, and works as before at ${width} px`, async ({ page }) => {
    await threeKids(page);
    await page.setViewportSize({ width, height: 667 });
    const open = card(page).getByRole("button", { name: /^Önskelista för Vera/ });
    await open.click();
    const back = card(page).getByRole("button", { name: "Tillbaka till alla barn" });
    await expect(back).toBeVisible();
    await expect(back).toHaveText("");
    const box = (await back.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expectNoA11yViolations(page);

    await region(page).getByRole("checkbox", { name: "Cykel åt Vera" }).check();
    await back.click();
    await expect(region(page)).toHaveCount(0);
    await expect(open).toBeFocused();
    await open.click();
    await expect(region(page).getByRole("checkbox", { name: "Cykel åt Vera" })).not.toBeChecked();
  });
}
