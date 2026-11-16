import { expect, test, type Page } from "@playwright/test";
import { addChild, addParent, addWish, clearFamily } from "./family-db";
import { animationsDone, birthdateIn, expectNoA11yViolations, goto, runsLocally, settledBox, uniqueName } from "./helpers";

test.skip(!runsLocally, "needs the local test database");

const longWord = "Superlångtordutanmellanslagsomintegårattbrytapåvanligtsättochsomärlångtfördenhärradenpåtelefonenärdetinteettenaste";
const region = (page: Page) => page.getByRole("article").getByRole("region", { name: "Önskelista" });
const noSidewaysScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test.beforeEach(clearFamily);
test.afterAll(clearFamily);

const oneWord = longWord.padEnd(120, "t"); // an old title, longer than the 60 now allowed
const newWord = longWord.slice(0, 60);

test("MUPP-023-R1 a long title wraps inside its row and in the claim dialog, at 320 and 375 px", async ({ page }) => {
  expect(newWord).toHaveLength(60);
  const vera = await addChild(await addParent(uniqueName("Förälder")), "Vera", birthdateIn(20).birthdate);
  await addWish(vera, "birthday", newWord);
  await addWish(vera, "birthday", oneWord);
  await page.setViewportSize({ width: 375, height: 667 });
  await goto(page, "/");
  await page.getByRole("article").getByRole("button", { name: /^Önskelista/ }).click();
  await animationsDone(region(page));

  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 667 });
    const list = await settledBox(region(page));
    for (const word of [newWord, oneWord]) {
      const arrow = await settledBox(region(page).getByRole("button", { name: word, exact: true }).locator("svg"));
      // The row's arrow is inside the list, and neither list nor page scrolls sideways
      expect(arrow.x + arrow.width).toBeLessThanOrEqual(list.x + list.width);
      // ...and keeps its size instead of shrinking beside a long title
      expect(arrow.width).toBeCloseTo(18, 0);
    }
    expect(await region(page).evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect(await noSidewaysScroll(page)).toBe(true);
  }
  await expectNoA11yViolations(page);

  // The claim dialog wraps the title too
  await region(page).getByRole("checkbox", { name: oneWord, exact: true }).check();
  await region(page).getByRole("checkbox", { name: newWord, exact: true }).check();
  await region(page).getByRole("button", { name: /^Paxa \(/ }).click();
  const dialog = page.getByRole("dialog");
  await animationsDone(dialog);
  const box = await settledBox(dialog);
  expect(box.x + box.width).toBeLessThanOrEqual(320);
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  expect(await noSidewaysScroll(page)).toBe(true);
  await expectNoA11yViolations(page);
});
