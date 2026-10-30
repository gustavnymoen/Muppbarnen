import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations, settledBox } from "./helpers";

const hasHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

test("MUPP-002-R1 R2 R4 header, menu and a11y on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  // R1 (changed by TECH-006): namnet syns inte som rubrik; det finns kvar som en dold h1, den enda, och sidtiteln är densamma (sidhuvudets utseende: tests/design.spec.ts)
  const name = page.getByRole("heading", { level: 1, name: "Muppbarnens önskelistor" });
  await expect(name).toBeAttached();
  // dold: syns inte, men finns för skärmläsare
  expect((await settledBox(name)).width).toBeLessThanOrEqual(1);
  expect(await page.getByRole("heading", { level: 1 }).count()).toBe(1);
  await expect(page).toHaveTitle("Muppbarnens önskelistor");

  // R4: landmärkena header, nav (när menyn är öppen) och main; inga axe-fel
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expectNoA11yViolations(page);

  // R2: menyknappen heter "Meny", är minst 44 × 44 px och säger om menyn är öppen
  const menu = page.getByRole("button", { name: "Meny" });
  const box = await settledBox(menu);
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  const nav = page.getByRole("navigation", { name: "Huvudmeny" });
  // R2 (changed by MUPP-003-R8): "Admin" is a real link and the last item
  await expect(nav.getByRole("link")).toHaveText(["Start", "Admin"]);
  await expect(nav.getByRole("button")).toHaveCount(0);
  // R2: en hamburgare, aldrig en rad med länkar: bara menyn har länkar (Start och Admin), och namnet är ingen länk (TECH-006)
  await expect(page.getByRole("link")).toHaveCount(2);
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
  await page.getByRole("main").click({ position: { x: 2, y: 2 } });
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

test("MUPP-002-R1 R4 the fixed header on a phone, also at 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(await hasHorizontalScroll(page)).toBe(false);

  // R1: sidhuvudet står kvar när innehållet scrollar och bara innehållsytan scrollar
  const header = page.getByRole("banner");
  const before = await settledBox(header);
  const main = page.getByRole("main");
  await main.evaluate((el) => el.scrollTo(0, 40));
  const after = await settledBox(header);
  expect(after.y).toBe(before.y);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);

  // R4: på 320 × 568 px fungerar sidhuvud och meny utan sidled scroll (fönstret ändras mitt i testet)
  await page.setViewportSize({ width: 320, height: 568 });
  expect(await hasHorizontalScroll(page)).toBe(false);
  await expect(page.getByRole("heading", { level: 1, name: "Muppbarnens önskelistor" })).toBeVisible();
  const menu = page.getByRole("button", { name: "Meny" });
  const menuBox = await settledBox(menu);
  expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(320);
  await menu.click();
  await expect(page.getByRole("navigation", { name: "Huvudmeny" })).toBeInViewport({ ratio: 1 });
  await expectNoA11yViolations(page);
  expect(await hasHorizontalScroll(page)).toBe(false);
});
