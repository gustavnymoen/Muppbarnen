import { expect, test, type Page } from "@playwright/test";
import { addChild, addParent, addWish, clearFamily } from "./family-db";
import { animationsDone, birthdateIn, expectNoA11yViolations, ghost, goto, pageAnimationsDone, runsLocally, uniqueName } from "./helpers";

// De här testen gör egna barn i testdatabasen, så de körs bara lokalt
test.skip(!runsLocally, "needs the local test database");

const card = (page: Page) => page.getByRole("article");
const region = (page: Page) => card(page).getByRole("region", { name: "Önskelista" });

test.beforeEach(async () => {
  await clearFamily();
});
test.afterAll(async () => {
  await clearFamily();
});

async function twoKids(page: Page) {
  const parent = await addParent(uniqueName("Förälder"));
  const { birthdate } = birthdateIn(20);
  const vera = await addChild(parent, "Vera", birthdate);
  await addChild(parent, "Vilda", birthdate);
  await addWish(vera, "birthday", "Cykel");
  await addWish(vera, "christmas", "Cykel");
  await page.setViewportSize({ width: 375, height: 667 });
  await goto(page, "/");
  await animationsDone(card(page));
}

async function toChristmas(page: Page) {
  for (let i = 0; i < 4 && (await card(page).getByRole("heading", { level: 2 }).innerText()) !== "Julafton"; i++) {
    await page.getByRole("button", { name: "Nästa kort" }).click();
    await animationsDone(card(page));
  }
}

const cards = [
  { name: "the card with several kids", prepare: async () => {}, open: (page: Page) => card(page).getByRole("button", { name: "Önskelista för Vera" }) },
  { name: "the Christmas card", prepare: toChristmas, open: (page: Page) => card(page).getByRole("button", { name: /^Öppna Vera/ }) },
];

for (const { name, prepare, open } of cards) {
  test(`MUPP-022-R1 ${name}: the closed view shrinks as a whole, with transform and opacity only, and the copy is always removed, also when cut short or interrupted`, async ({ page }) => {
    await twoKids(page);
    await prepare(page);
    await open(page).click();
    await expect(region(page)).toBeVisible();
    await animationsDone(card(page));
    await card(page).getByRole("button", { name: /^Tillbaka/ }).click();

    // Hela vyn skalas och tonar bort: inget utsnitt (clip-path) och inget annat än transform och opacity
    await expect(ghost(page)).toHaveCount(1);
    const properties = await ghost(page).evaluate((node) => node.getAnimations().flatMap((a) => (a.effect as KeyframeEffect).getKeyframes()).flatMap((k) => Object.keys(k).filter((key) => !["offset", "easing", "composite", "computedOffset"].includes(key))));
    expect([...new Set(properties)].sort()).toEqual(["opacity", "transform"]);

    // Kopian är borta inom 500 ms, och inget rör sig; vyn är som vanligt
    await expect(ghost(page)).toHaveCount(0, { timeout: 500 });
    await expect(region(page)).toHaveCount(0);
    await expect(open(page)).toBeFocused();
    expect(await page.evaluate(() => document.getAnimations().filter((a) => !(a instanceof CSSTransition) && a.effect instanceof KeyframeEffect && a.playState === "running").length)).toBe(0);
    await expectNoA11yViolations(page);

    // En kopia som avbryts eller klipps av ligger inte heller kvar (samma kort och läge, så samma test, TECH-014)
    await open(page).click();
    await animationsDone(card(page));
    await page.keyboard.press("Escape");
    await expect(ghost(page)).toHaveCount(1);
    // En avbruten animation (webbläsaren skickar då cancel, inte finish) lämnar ingen kopia
    await ghost(page).evaluate((node) => node.getAnimations().forEach((a) => a.cancel()));
    await expect(ghost(page)).toHaveCount(0);

    // En ny öppning mitt i en stängning tar bort kopian direkt
    await open(page).click();
    await animationsDone(card(page));
    await page.keyboard.press("Escape");
    await expect(ghost(page)).toHaveCount(1);
    await open(page).click();
    await expect(ghost(page)).toHaveCount(0);
  });

  test(`MUPP-022-R2 ${name}: no focus ring after a close with the pointer, the ring after Esc`, async ({ page }) => {
    await twoKids(page);
    await prepare(page);
    const outline = () => open(page).evaluate((node) => getComputedStyle(node).outlineStyle);
    // Chromium visar ändå ingen ring efter ett tryck (iOS gör det), så märket som döljer ringen kontrolleras också
    const quiet = (on: boolean) => (on ? expect(open(page)).toHaveAttribute("data-quiet-focus", "") : expect(open(page)).not.toHaveAttribute("data-quiet-focus"));

    // Med musen eller fingret: Stäng och Tillbaka lämnar knappen fokuserad men utan ring
    for (const button of [/^Tillbaka/, /^Stäng/]) {
      await open(page).click();
      await animationsDone(card(page));
      await card(page).getByRole("button", { name: button }).click();
      await expect(open(page)).toBeFocused();
      expect(await outline()).toBe("none");
      await quiet(true);
      await pageAnimationsDone(page);
      await expect(ghost(page)).toHaveCount(0);
    }

    // Ett tangenttryck på knappen som fick fokus av ett finger visar ringen
    await open(page).click();
    await animationsDone(card(page));
    await card(page).getByRole("button", { name: /^Stäng/ }).click();
    await quiet(true);
    await page.keyboard.press("Shift");
    await quiet(false);

    // Med tangentbordet visas ringen som vanligt
    await open(page).click();
    await animationsDone(card(page));
    await page.keyboard.press("Escape");
    await expect(open(page)).toBeFocused();
    expect(await outline()).toBe("solid");
    await quiet(false);
    await pageAnimationsDone(page);
    await expect(ghost(page)).toHaveCount(0);

    // Lämnar man knappen och kommer tillbaka med tangentbordet visas ringen igen
    await open(page).click();
    await animationsDone(card(page));
    await card(page).getByRole("button", { name: /^Tillbaka/ }).click();
    expect(await outline()).toBe("none");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(open(page)).toBeFocused();
    expect(await outline()).toBe("solid");
    await quiet(false);
  });
}
