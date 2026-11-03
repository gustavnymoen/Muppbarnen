import { devices, expect, test, type Page } from "@playwright/test";
import { addChild, addParent, addWish, clearFamily } from "./family-db";
import { animationsDone, birthdateIn, GHOST, runsLocally, uniqueName } from "./helpers";

// Körs bara med `npm run test:webkit` (WebKit är inte installerat i CI): Safari på iPhone är WebKit
test.skip(!runsLocally, "needs the local test database");
test.use({ ...devices["iPhone 13"], browserName: "webkit" });

const card = (page: Page) => page.getByRole("article");

type Frame = { time: number; copy: boolean; list: boolean; opacity: number; left: number; height: number; card: string };

test.beforeEach(async () => {
  await clearFamily();
});
test.afterAll(async () => {
  await clearFamily();
});

async function seed(page: Page, kids: string[]) {
  const parent = await addParent(uniqueName("Förälder"));
  const { birthdate } = birthdateIn(20);
  const vera = await addChild(parent, kids[0], birthdate);
  for (const name of kids.slice(1)) await addChild(parent, name, birthdate);
  await addWish(vera, "birthday", "Cykel");
  await page.goto("/");
  await animationsDone(card(page));
}

// Stänger med `close` och ger varje bildruta från tryckt till dess kopian är borta: om kopian och listan finns, hur synlig kopian är,
// var den är, hur hög den är och var kortet under den är
async function framesOfClose(page: Page, close: () => Promise<void>) {
  await page.evaluate((selector) => {
    const frames: Frame[] = [];
    Object.assign(window, { frames });
    const tick = (time: number) => {
      const copy = document.querySelector(selector);
      const current = document.querySelector(".deck-card:not([aria-hidden]) article")!;
      const box = current.getBoundingClientRect();
      frames.push({
        time,
        copy: copy !== null,
        list: current.querySelector('[role="region"]') !== null,
        opacity: copy ? Number(getComputedStyle(copy).opacity) : 0,
        left: copy?.getBoundingClientRect().left ?? 0,
        height: copy?.getBoundingClientRect().height ?? 0,
        card: `${box.top} ${box.height}`,
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, GHOST);
  await close();
  // Kopian har funnits och är borta
  await expect.poll(() => page.evaluate((selector) => document.querySelector(selector) === null && (window as unknown as { frames: Frame[] }).frames.some((f) => f.copy), GHOST)).toBe(true);
  return page.evaluate(() => (window as unknown as { frames: Frame[] }).frames);
}

test("MUPP-025-R1 in WebKit on a phone the closed view stays whole and visible for a moment while it shrinks", async ({ page }) => {
  await seed(page, ["Vera", "Vilda"]);
  await card(page).getByRole("button", { name: "Önskelista för Vera" }).click();
  await animationsDone(card(page));

  const frames = (await framesOfClose(page, () => card(page).getByRole("button", { name: /^Tillbaka/ }).click())).filter((f) => f.copy);
  // Kopian rör sig: den börjar vid vyns ruta och hamnar vid knappen
  expect(Math.abs(frames[0].left - frames.at(-1)!.left)).toBeGreaterThan(20);
  // Den syns tydligt (mer än hälften synlig) i minst 100 ms; med den gamla rörelsen försvann den på under 60 ms
  const clear = frames.filter((f) => f.opacity > 0.5);
  expect(clear.at(-1)!.time - clear[0].time).toBeGreaterThanOrEqual(100);
  // Och den tonar bort helt
  expect(frames.at(-1)!.opacity).toBeLessThan(0.2);
});

test("MUPP-029-R2 in WebKit on a phone the single kid list shrinks into the button without a gap or a jump", async ({ page }) => {
  await seed(page, ["Vera"]);
  await card(page).getByRole("button", { name: "Önskelista", exact: true }).click();
  await animationsDone(card(page));

  const frames = await framesOfClose(page, () => card(page).getByRole("button", { name: "Fäll ihop önskelistan" }).click());
  // Ingen bildruta där listan är borta och kopian ännu inte finns: fram till sista bildrutan med kopian syns det ena eller det andra
  const last = frames.findLastIndex((f) => f.copy);
  expect(frames.slice(0, last + 1).every((f) => f.list || f.copy)).toBe(true);
  // Kopian krymper mot knappen (som är lika bred som listan, så det är höjden som ändras) och tonar bort
  const moving = frames.filter((f) => f.copy);
  expect(moving[0].height - moving.at(-1)!.height).toBeGreaterThan(20);
  expect(moving.at(-1)!.opacity).toBeLessThan(0.2);
  // Kortet under hoppar inte: samma läge och höjd i alla bildrutor
  expect(new Set(frames.map((f) => f.card)).size).toBe(1);
});
