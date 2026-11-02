import { devices, expect, test, type Page } from "@playwright/test";
import { addChild, addParent, addWish, clearFamily } from "./family-db";
import { animationsDone, birthdateIn, runsLocally, uniqueName } from "./helpers";

// Körs bara med `npm run test:webkit` (WebKit är inte installerat i CI): Safari på iPhone är WebKit
test.skip(!runsLocally, "needs the local test database");
test.use({ ...devices["iPhone 13"], browserName: "webkit" });

const card = (page: Page) => page.getByRole("article");

test.beforeEach(async () => {
  await clearFamily();
});
test.afterAll(async () => {
  await clearFamily();
});

test("MUPP-025-R1 in WebKit on a phone the closed view stays whole and visible for a moment while it shrinks", async ({ page }) => {
  const parent = await addParent(uniqueName("Förälder"));
  const { birthdate } = birthdateIn(20);
  const vera = await addChild(parent, "Vera", birthdate);
  await addChild(parent, "Vilda", birthdate);
  await addWish(vera, "birthday", "Cykel");
  await page.goto("/");
  await animationsDone(card(page));
  await card(page).getByRole("button", { name: "Önskelista för Vera" }).click();
  await animationsDone(card(page));

  // Varje bildruta efter stängningen: när kopian syns, hur synlig den är och var den är
  await page.evaluate(() => {
    const frames: { time: number; opacity: number; left: number }[] = [];
    Object.assign(window, { frames });
    const tick = (time: number) => {
      const copy = document.querySelector("body > [inert][aria-hidden=true]");
      if (copy) frames.push({ time, opacity: Number(getComputedStyle(copy).opacity), left: copy.getBoundingClientRect().left });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await card(page).getByRole("button", { name: /^Tillbaka/ }).click();
  await expect.poll(() => page.evaluate(() => document.querySelector("body > [inert][aria-hidden=true]") === null && (window as unknown as { frames: unknown[] }).frames.length > 0)).toBe(true);

  const frames = await page.evaluate(() => (window as unknown as { frames: { time: number; opacity: number; left: number }[] }).frames);
  // Kopian rör sig: den börjar vid vyns ruta och hamnar vid knappen
  expect(Math.abs(frames[0].left - frames.at(-1)!.left)).toBeGreaterThan(20);
  // Den syns tydligt (mer än hälften synlig) i minst 100 ms; med den gamla rörelsen försvann den på under 60 ms
  const clear = frames.filter((f) => f.opacity > 0.5);
  expect(clear.at(-1)!.time - clear[0].time).toBeGreaterThanOrEqual(100);
  // Och den tonar bort helt
  expect(frames.at(-1)!.opacity).toBeLessThan(0.2);
});
