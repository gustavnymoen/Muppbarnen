import { expect, test, type Locator, type Page } from "@playwright/test";
import { addChild, addParent, addWish, clearFamily } from "./family-db";
import { animationsDone, birthdateIn, expectNoA11yViolations, expectOnto, ghost, goto, pageAnimationsDone, runsLocally, settledBox, transformsOf, uniqueName } from "./helpers";

// De här testen gör egna barn i testdatabasen, så de körs bara lokalt
test.skip(!runsLocally, "needs the local test database");

// Hur rörelsen ser ut (kurva, exakta tider) testas inte, bara att den börjar och slutar på knappens plats och att läget är rätt efteråt.
// Att den är mjuk på en telefon visar WebKit-testet (MUPP-025) och en koll för hand.

const card = (page: Page) => page.getByRole("article");
const region = (page: Page) => card(page).getByRole("region", { name: "Önskelista" });
const openButton = (page: Page) => card(page).getByRole("button", { name: "Önskelista", exact: true });
// Egenskaperna som animeras på el; transform-origin står i bildrutorna men är samma i alla och rör sig inte
const animated = (el: Locator) =>
  el.evaluate((node) => [...new Set(node.getAnimations().flatMap((a) => (a.effect as KeyframeEffect).getKeyframes()).flatMap((k) => Object.keys(k).filter((key) => !["offset", "easing", "composite", "computedOffset", "transformOrigin"].includes(key))))].sort());

test.beforeEach(async () => {
  await clearFamily();
});
test.afterAll(async () => {
  await clearFamily();
});

// Som oneKid i MUPP-016, men bara födelsedagens lista: testerna här stannar på det första kortet
async function oneKid(page: Page) {
  const parent = await addParent(uniqueName("Förälder"));
  const vera = await addChild(parent, "Vera", birthdateIn(20).birthdate);
  for (const title of ["Cykel", "Pussel"]) {
    await addWish(vera, "birthday", title);
    await addWish(vera, "christmas", title);
  }
  await page.setViewportSize({ width: 375, height: 667 });
  await goto(page, "/");
  await animationsDone(card(page));
}

test("MUPP-029-R1 R2 the single kid list grows out of the button and shrinks back into it, with transform and opacity only", async ({ page }) => {
  await oneKid(page);
  const button = await settledBox(openButton(page));

  // R1: listan börjar på knappens plats och storlek och växer till sin egen; R2: bara transform och opacity
  await openButton(page).click();
  const [grow, growing] = [await transformsOf(region(page)), await animated(region(page))];
  await animationsDone(card(page));
  const list = await settledBox(region(page));
  expectOnto(grow[0], list, button);
  expect(growing).toEqual(["opacity", "transform"]);
  await expect(region(page).getByRole("button", { name: "Cykel" })).toBeVisible();
  await expect(card(page).getByRole("button", { name: "Fäll ihop önskelistan" })).toBeFocused();
  expect(await region(page).evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).isIdentity)).toBe(true);

  // R1: när listan fälls ihop krymper kopian till knappens plats, och kortet är stängt med fokus på knappen; R2: bara transform och opacity
  await card(page).getByRole("button", { name: "Fäll ihop önskelistan" }).click();
  await expect(region(page)).toHaveCount(0);
  await expect(openButton(page)).toBeFocused();
  await expect(ghost(page)).toHaveCount(1);
  expect(await animated(ghost(page))).toEqual(["opacity", "transform"]);
  expectOnto((await transformsOf(ghost(page))).at(-1)!, list, button);
  // Inget blir kvar när rörelsen är slut
  await pageAnimationsDone(page);
  await expect(ghost(page)).toHaveCount(0);
  await expectNoA11yViolations(page);

  // R1: Esc stänger på samma sätt, och ett nytt tryck medan listan krymper öppnar den igen direkt (MUPP-016-R6)
  await openButton(page).click();
  await animationsDone(card(page));
  await page.keyboard.press("Escape");
  await expect(ghost(page)).toHaveCount(1);
  await openButton(page).click();
  await expect(ghost(page)).toHaveCount(0);
  await expect(region(page)).toHaveCount(1);
  await expect(region(page)).toBeVisible();
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("MUPP-029-R3 the single kid list opens and closes at once, without movement", async ({ page }) => {
    // Övergångar av färg (ett tryck som mörknar knappen) är ingen rörelse; det som inte får finnas är animationer
    const noMotion = () => page.evaluate(() => document.getAnimations().filter((a) => !(a instanceof CSSTransition)).length);
    await oneKid(page);
    await openButton(page).click();
    await expect(region(page)).toBeVisible();
    expect(await noMotion()).toBe(0);
    await card(page).getByRole("button", { name: "Fäll ihop önskelistan" }).click();
    await expect(region(page)).toHaveCount(0);
    await expect(ghost(page)).toHaveCount(0);
    expect(await noMotion()).toBe(0);
  });
});
