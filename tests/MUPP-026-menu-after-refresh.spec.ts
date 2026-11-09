import { expect, test } from "@playwright/test";
import { expectNoA11yViolations, goto } from "./helpers";

test.use({ viewport: { width: 390, height: 664 } });

// Samma sida i båda, så den läses in en gång (TECH-018): R2 först, eftersom R1 laddar om sidan
test("MUPP-026-R1 R2 the page itself does not scroll or bounce and its content still scrolls to the end; the menu button is inside the visible area after a reload, also after a drag", async ({ page }) => {
  await goto(page, "/design");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overscrollBehaviorY)).toBe("none");
  // The document cannot be scrolled and is as tall as the screen
  await page.evaluate(() => window.scrollTo(0, 500));
  expect(await page.evaluate(() => [window.scrollY, document.documentElement.scrollHeight <= window.innerHeight])).toEqual([0, true]);
  // The content area is taller than the screen and scrolls to its end
  const main = page.getByRole("main");
  expect(await main.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await main.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  expect(await main.evaluate((el) => Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) < 2)).toBe(true);

  // R1
  // A scroll position left over from before the reload must not hide the menu
  await page.evaluate(() => window.scrollTo(0, 40));
  await page.reload();
  const box = (await page.getByRole("button", { name: "Meny" }).boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(664);
  await page.getByRole("button", { name: "Meny" }).click();
  await expect(page.getByRole("navigation", { name: "Huvudmeny" })).toBeVisible();
  await expectNoA11yViolations(page);
});
