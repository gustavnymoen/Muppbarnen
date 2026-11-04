import { expect, test, type Page } from "@playwright/test";
import { addChild, addParent, addWish, clearFamily } from "./family-db";
import { animationsDone, birthdateIn, ghost, goto, pageAnimationsDone, runsLocally, uniqueName } from "./helpers";

// De här testen gör egna barn i testdatabasen, så de körs bara lokalt
test.skip(!runsLocally, "needs the local test database");

// Utan rörelse görs ingen kopia alls: det testas redan av MUPP-029-R3 och MUPP-016-R5
// Hur det ser ut (hur snabbt, hur mjukt) bedöms för hand; här testas bara att kopian saknar synligt innehåll när ytan krymper

const card = (page: Page) => page.getByRole("article");

test.beforeEach(async () => {
  await clearFamily();
});
test.afterAll(async () => {
  await clearFamily();
});

async function seed(page: Page, kids: string[]) {
  const parent = await addParent(uniqueName("Förälder"));
  const { birthdate } = birthdateIn(20);
  const ids = [];
  for (const name of kids) ids.push(await addChild(parent, name, birthdate));
  await addWish(ids[0], "birthday", "Cykel");
  await addWish(ids[0], "christmas", "Cykel");
  await page.setViewportSize({ width: 375, height: 667 });
  await goto(page, "/");
  await animationsDone(card(page));
}

// Allt direkt i kopian (listans rader och knappar, eller barnets namn och bild) ska tona bort helt på 100 ms, långt före slutet på rörelsen
// Testet visar tiden och slutläget; att inget syns under de första 100 ms är avsiktligt (ytan krymper medan innehållet tonar) och bedöms för hand
async function expectContentFades(page: Page) {
  await expect(ghost(page)).toHaveCount(1);
  const fades = await ghost(page).evaluate((copy) =>
    [...copy.children].map((child) => {
      const timing = child.getAnimations().find((a) => (a.effect as KeyframeEffect).getKeyframes().some((k) => "opacity" in k))?.effect?.getTiming();
      return { fades: timing !== undefined, ms: Number(timing?.duration) };
    }),
  );
  expect(fades.length).toBeGreaterThan(0);
  for (const { fades: yes, ms } of fades) {
    expect(yes).toBe(true);
    expect(ms).toBeLessThanOrEqual(100);
  }
  // Och när tonandet är klart är innehållet helt genomskinligt
  const opacities = await ghost(page).evaluate((copy) =>
    [...copy.children].map((child) => {
      child.getAnimations().forEach((a) => a.finish());
      return getComputedStyle(child).opacity;
    }),
  );
  expect(opacities.every((o) => o === "0")).toBe(true);
  await pageAnimationsDone(page);
  await expect(ghost(page)).toHaveCount(0);
}

test("MUPP-037-R1 on a single-kid card only the surface of the list folds into the button", async ({ page }) => {
  await seed(page, ["Vera"]);
  await card(page).getByRole("button", { name: "Önskelista", exact: true }).click();
  await animationsDone(card(page));
  await card(page).getByRole("button", { name: "Fäll ihop önskelistan" }).click();
  await expectContentFades(page);
});

test("MUPP-037-R1 on a card with several kids only the surface of the view folds into the button", async ({ page }) => {
  await seed(page, ["Vera", "Vilda"]);
  await card(page).getByRole("button", { name: "Önskelista för Vera" }).click();
  await animationsDone(card(page));
  await card(page).getByRole("button", { name: "Stäng önskelistan" }).click();
  await expectContentFades(page);
});

test("MUPP-037-R1 on the Christmas card only the surface of the view folds into the button", async ({ page }) => {
  await seed(page, ["Vera", "Vilda"]);
  for (let i = 0; i < 4 && (await card(page).getByRole("heading", { level: 2 }).innerText()) !== "Julafton"; i++) {
    await page.getByRole("button", { name: "Nästa kort" }).click();
    await animationsDone(card(page));
  }
  await card(page).getByRole("button", { name: /^Öppna Vera/ }).click();
  await animationsDone(card(page));
  await card(page).getByRole("button", { name: /^Tillbaka/ }).click();
  await expectContentFades(page);
});
