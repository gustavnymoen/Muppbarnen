import { expect, test, type Page } from "@playwright/test";
import { BRAND, CARD, contrast, css, EDGE, expectNoA11yViolations, PAGE, SHADOW } from "./helpers";

// Utseendet: ett test per sida och läge, så att sidan laddas en gång för många kontroller.
// Reglerna som inte behöver en webbläsare (kontrast ur tokens, barnfärger) är enhetstester.

const hasHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

test("MUPP-001-R2 R3 R4 R5 R8 /design on a phone: fonts, cards, controls, shell and a11y", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const hosts = new Set<string>();
  page.on("request", (request) => hosts.add(new URL(request.url()).host));
  await page.goto("/design");
  const baseHost = new URL(page.url()).host;

  // R8: sidan visar alltid samma sak, har en h1 och rubriker i ordning, och inga axe-fel
  await expect(page.getByRole("heading", { level: 1, name: "Stilguide" })).toBeVisible();
  expect(await page.getByRole("heading", { level: 1 }).count()).toBe(1);
  const levels = await page.locator("h1, h2, h3").evaluateAll((els) => els.map((el) => Number(el.tagName[1])));
  levels.forEach((level, i) => expect(level - (levels[i - 1] ?? 1)).toBeLessThanOrEqual(1));
  await expectNoA11yViolations(page);

  // R2: rubriker i Fredoka, text i Nunito, minst 16 px, och inga anrop till en typsnittstjänst
  await page.evaluate(() => document.fonts.ready);
  expect(await css(page.getByRole("heading", { level: 1 }), "font-family")).toMatch(/Fredoka/);
  const running = page.getByText("Löpande text i Nunito");
  expect(await css(running, "font-family")).toMatch(/Nunito/);
  expect(parseFloat(await css(running, "font-size"))).toBeGreaterThanOrEqual(16);
  expect([...hosts].filter((host) => host !== baseHost)).toEqual([]);

  // R3: vanligt kort med smal kant och skikt av skugga, markerat kort i barnets färg
  const normal = page.getByText("Ett vanligt kort").locator("..");
  await expect(normal).toHaveCSS("border-top-width", "1px");
  await expect(normal).toHaveCSS("border-top-color", EDGE);
  const shadow = await css(normal, "box-shadow");
  expect(shadow).toContain("inset");
  expect(shadow).toContain(`${SHADOW} 2px 3px 0px 0px`);
  expect(shadow.match(/rgb/g)!.length).toBeGreaterThanOrEqual(4);

  const highlighted = page.getByText("Markerat kort").locator("..");
  await expect(highlighted).toHaveCSS("border-top-width", "2px");
  const edge = await css(highlighted, "border-top-color");
  expect(edge).not.toBe(EDGE);
  expect(contrast(edge, CARD)).toBeGreaterThanOrEqual(3);
  expect(await page.locator(".card-highlight").count()).toBe(1);

  // R4: varje knapp är minst 44 × 44 px
  const buttons = page.getByRole("button");
  for (const button of await buttons.all()) {
    const box = (await button.boundingBox())!;
    expect(box.width, await button.innerText()).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  // R4: fokusringen syns från tangentbordet och har minst 3:1 mot sidan
  await page.getByRole("button", { name: "Huvudknapp" }).focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const main = page.getByRole("button", { name: "Huvudknapp" });
  await expect(main).toBeFocused();
  await expect(main).toHaveCSS("outline-width", "3px");
  await expect(main).toHaveCSS("outline-color", BRAND);
  expect(contrast(BRAND, PAGE)).toBeGreaterThanOrEqual(3);
  // R4: huvudknappen har fyllnad, text i mörk färg och en kort avstängd variant
  await expect(main).toHaveCSS("background-color", BRAND);
  await expect(page.getByRole("button", { name: "Avstängd" }).first()).toBeDisabled();
  // R4: avataren har ett tillgängligt namn; utan bild visas initialen i rubrikfonten
  const initial = page.getByRole("img", { name: "Korall" });
  await expect(initial).toHaveText("K");
  expect(await css(initial, "font-family")).toMatch(/Fredoka/);
  await expect(page.getByRole("img", { name: "Bild" })).toBeVisible();
  // R4: etiketten har alltid text
  await expect(page.getByText("Önskat", { exact: true })).toBeVisible();

  // R4: fokusringen och skuggorna klipps inte av innehållsytan: första knappen och korten ligger minst 6 px (ringen) inom ytans kant
  const region = (await page.getByRole("main").boundingBox())!;
  const firstButton = (await main.boundingBox())!;
  const firstCard = (await normal.boundingBox())!;
  expect(firstButton.x - region.x).toBeGreaterThanOrEqual(6);
  expect(firstCard.x - region.x).toBeGreaterThanOrEqual(6);
  await page.getByRole("heading", { level: 1 }).scrollIntoViewIfNeeded();
  expect((await page.getByRole("heading", { level: 1 }).boundingBox())!.y - region.y).toBeGreaterThanOrEqual(6);

  // R5: sidan själv scrollar inte, bara innehållsytan
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
  const content = page.getByRole("main");
  expect(await content.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  expect(await css(content, "overflow-y")).toBe("auto");

  // R5: ingen sidled scroll vid 320 px (fönstret ändras mitt i testet)
  await page.setViewportSize({ width: 320, height: 568 });
  expect(await hasHorizontalScroll(page)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
  expect(await content.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await expectNoA11yViolations(page);
});

test("MUPP-001-R5 R8 /design on a desktop: a wide centred frame with the same look", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/design");
  await expect(page.getByRole("heading", { level: 1, name: "Stilguide" })).toBeVisible();
  const frame = page.getByRole("main").locator("..");
  const box = (await frame.boundingBox())!;
  expect(box.width).toBeGreaterThan(1000);
  expect(box.width).toBeLessThanOrEqual(1152);
  expect(box.x).toBeCloseTo((1280 - box.width) / 2, 0);
  expect(await css(page.locator("html"), "color-scheme")).toBe("dark");
  await expectNoA11yViolations(page);
});

test("MUPP-001-R3 R7 motion: a pressed card moves into its shadow, a card fades in, nothing moves with reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/design");
  const pressable = page.getByRole("button", { name: "Tryckbart kort" });
  await pressable.scrollIntoViewIfNeeded();
  const box = (await pressable.boundingBox())!;

  // R7: en rörelse tar högst 300 ms och använder bara transform och opacity
  const entrance = await page.getByText("Ett vanligt kort").locator("..").evaluate((el) => {
    const effect = el.getAnimations()[0]?.effect as KeyframeEffect | undefined;
    return effect && { duration: effect.getComputedTiming().duration, props: effect.getKeyframes().flatMap((k) => Object.keys(k)) };
  });
  expect(entrance).toBeTruthy();
  expect(Number(entrance!.duration)).toBeLessThanOrEqual(300);
  expect(entrance!.props.filter((p) => !["offset", "easing", "composite", "computedOffset", "opacity", "transform"].includes(p))).toEqual([]);

  // R3: tryckt kort flyttar sig och skuggan krymper
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
  const before = await css(pressable, "box-shadow");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(pressable).not.toHaveCSS("transform", "none");
  expect(await css(pressable, "box-shadow")).not.toBe(before);
  await page.mouse.up();

  // R7: med minskad rörelse flyttas inget och inget tonar in
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Stilguide" })).toBeVisible();
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await pressable.scrollIntoViewIfNeeded();
  const pressedBox = (await pressable.boundingBox())!;
  await page.mouse.move(pressedBox.x + pressedBox.width / 2, pressedBox.y + pressedBox.height / 2);
  await page.mouse.down();
  await expect(pressable).toHaveCSS("transform", "none");
  await page.mouse.up();
});

test("MUPP-002-R1 R3 the start page: a header without border, a carousel that glides or, with reduced motion, jumps", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  // R1: sidhuvudet har ingen kant eller skiljelinje
  const header = page.getByRole("banner");
  for (const side of ["top", "right", "bottom", "left"]) await expect(header).toHaveCSS(`border-${side}-width`, "0px");
  await expect(header).toHaveCSS("box-shadow", "none");

  // R3: raden snäpper kort för kort och glider
  const row = page.getByRole("group", { name: "Barnens kort, exempel" });
  await expect(row).toHaveCSS("scroll-snap-type", "x mandatory");
  await expect(row).toHaveCSS("scroll-behavior", "smooth");

  // R3: med minskad rörelse hoppar den
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(row).toHaveCSS("scroll-behavior", "auto");
});
