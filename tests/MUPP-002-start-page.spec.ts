import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations } from "./helpers";

const hasHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

// Korten i raden
const cards = (page: Page) => page.getByRole("group", { name: "Barnens kort, exempel" }).getByRole("article");

test("MUPP-002-R1 R2 R4 header, menu and a11y on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  // R1: namnet är den enda h1 och en länk till startsidan, och sidtiteln är densamma (sidhuvudets utseende: tests/design.spec.ts)
  const name = page.getByRole("heading", { level: 1, name: "Muppbarnens önskelistor" });
  await expect(name.getByRole("link")).toHaveAttribute("href", "/");
  expect(await page.getByRole("heading", { level: 1 }).count()).toBe(1);
  await expect(page).toHaveTitle("Muppbarnens önskelistor");

  // R4: landmärkena header, nav (när menyn är öppen) och main; inga axe-fel
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expectNoA11yViolations(page);

  // R2: menyknappen heter "Meny", är minst 44 × 44 px och säger om menyn är öppen
  const menu = page.getByRole("button", { name: "Meny" });
  const box = (await menu.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  const nav = page.getByRole("navigation", { name: "Huvudmeny" });
  // R2 (changed by MUPP-003-R8): "Admin" is a real link and the last item
  await expect(nav.getByRole("link")).toHaveText(["Start", "Admin"]);
  await expect(nav.getByRole("button")).toHaveCount(0);
  // R2: en hamburgare, aldrig en rad med länkar: bara menyn har länkar förutom namnet
  await expect(page.getByRole("link")).toHaveCount(3);
  await expectNoA11yViolations(page);

  // R2: Escape stänger och fokus går tillbaka till knappen
  await page.keyboard.press("Escape");
  await expect(nav).toHaveCount(0);
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded", "false");

  // R2: med bara tangentbordet: öppna, gå med Tab, stäng; fokus syns och döljs inte
  await page.keyboard.press("Enter");
  await expect(nav).toBeVisible();
  await page.keyboard.press("Tab");
  const start = nav.getByRole("link", { name: "Start" });
  await expect(start).toBeFocused();
  await expect(start).toHaveCSS("outline-width", "3px");
  await page.keyboard.press("Tab");
  await expect(nav.getByRole("link", { name: "Admin" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(nav).toHaveCount(0);
  await expect(menu).toBeFocused();

  // R2: ett klick utanför stänger menyn
  await menu.click();
  await expect(nav).toBeVisible();
  await page.getByRole("heading", { level: 2, name: "Alma" }).click();
  await expect(nav).toHaveCount(0);

  // R2 (changed by MUPP-003-R8): "Admin" leads to /admin, which asks for the admin password
  await menu.click();
  await nav.getByRole("link", { name: "Admin" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByLabel("Adminlösenord")).toBeVisible();

  // R2: "Start" visar startsidan (här från en annan sida, så att valet syns)
  await page.goto("/design");
  await page.getByRole("button", { name: "Meny" }).click();
  await page.getByRole("link", { name: "Start" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Muppbarnens önskelistor" })).toBeVisible();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
});

test("MUPP-002-R1 R3 R4 the carousel and the fixed header on a phone, also at 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  // R3: raden är en grupp med ett namn som går att nå med Tab, tre kort, och inget kort döljer ett annat
  const row = page.getByRole("group", { name: "Barnens kort, exempel" });
  await expect(cards(page)).toHaveCount(3);
  await row.focus();
  await expect(row).toBeFocused();
  for (const card of await cards(page).all()) await expect(card.getByText("Exempel", { exact: true })).toBeVisible();

  // R3: ett kort syns helt och nästa tittar fram; sidan scrollar inte i sidled
  const first = (await cards(page).nth(0).boundingBox())!;
  const second = (await cards(page).nth(1).boundingBox())!;
  expect(first.x + first.width).toBeLessThanOrEqual(390);
  expect(second.x).toBeLessThan(390 - 16);
  expect(second.x + second.width).toBeGreaterThan(390);
  expect(await hasHorizontalScroll(page)).toBe(false);

  // R3: exakt ett kort är markerat med sitt barns färg
  expect(await page.locator(".card-highlight").count()).toBe(1);
  await expect(cards(page).nth(1)).toHaveClass(/card-highlight/);

  // R3: piltangenten flyttar raden ett kort åt gången och kortet snäpper på plats
  await expect(cards(page).nth(0)).toBeInViewport({ ratio: 1 });
  await page.keyboard.press("ArrowRight");
  await expect(cards(page).nth(1)).toBeInViewport({ ratio: 1 });
  await expect(cards(page).nth(0)).not.toBeInViewport({ ratio: 1 });
  // Raden glider, så kortet är på plats först när rörelsen är klar
  await expect.poll(async () => (await cards(page).nth(1).boundingBox())!.x, { message: "snaps to the edge, in line with the header" }).toBeCloseTo((await page.getByRole("heading", { level: 1 }).boundingBox())!.x, 0);
  await page.keyboard.press("ArrowLeft");
  await expect(cards(page).nth(0)).toBeInViewport({ ratio: 1 });
  expect(await hasHorizontalScroll(page)).toBe(false);

  // R1: sidhuvudet står kvar när innehållet scrollar och bara innehållsytan scrollar
  const header = page.getByRole("banner");
  const before = (await header.boundingBox())!;
  const main = page.getByRole("main");
  await main.evaluate((el) => el.scrollTo(0, 40));
  const after = (await header.boundingBox())!;
  expect(after.y).toBe(before.y);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);

  // R4: på 320 × 568 px fungerar sidhuvud, meny och kort utan sidled scroll (fönstret ändras mitt i testet)
  await page.setViewportSize({ width: 320, height: 568 });
  expect(await hasHorizontalScroll(page)).toBe(false);
  await expect(page.getByRole("heading", { level: 1, name: "Muppbarnens önskelistor" })).toBeVisible();
  const menu = page.getByRole("button", { name: "Meny" });
  const menuBox = (await menu.boundingBox())!;
  expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(320);
  await menu.click();
  await expect(page.getByRole("navigation", { name: "Huvudmeny" })).toBeInViewport({ ratio: 1 });
  await expectNoA11yViolations(page);
  expect(await hasHorizontalScroll(page)).toBe(false);
  await page.keyboard.press("Escape");
  await expect(cards(page).nth(0)).toBeInViewport({ ratio: 1 });
});

test("MUPP-002-R3 R4 the start page on a desktop shows several cards at once", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Muppbarnens önskelistor" })).toBeVisible();
  for (const card of await cards(page).all()) await expect(card).toBeInViewport({ ratio: 1 });
  expect(await page.locator(".card-highlight").count()).toBe(1);
  await expectNoA11yViolations(page);
});
