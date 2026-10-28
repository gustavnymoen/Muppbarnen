import { expect, test, type Page } from "@playwright/test";
import { adminSignIn, animationsDone, backgroundOf, BRAND, CARD, contrast, css, DANGER, EDGE, expectNoA11yViolations, expectTextMessage, PAGE, runsLocally, SHADOW, uniqueName } from "./helpers";
import { addChild, addParent, clearFamily } from "./family-db";
import { newVisitor } from "./site-session";

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

test("MUPP-009-R1 the password page: a card with the name, a labelled field, a button and an error as coloured text", async ({ browser, baseURL }) => {
  // Utan inloggning (sidan syns bara då), på en telefon, med ett eget "IP-nummer" för försöksgränsen
  const context = await newVisitor(browser, baseURL, { width: 390, height: 844 });
  const page = await context.newPage();
  await page.goto("/losenord");

  // Namnet i Fredoka, ett kort med kant, och fältet och knappen minst 44 px höga
  await page.evaluate(() => document.fonts.ready);
  expect(await css(page.getByRole("heading", { level: 1 }), "font-family")).toMatch(/Fredoka/);
  const card = page.locator("form").locator("..");
  await expect(card).toHaveCSS("border-top-color", EDGE);
  await expect(card).toHaveCSS("background-color", CARD);
  // Kortet tonar in: mät först när rörelsen är klar, annars ger bråkdelar av pixlar 43,99 i stället för 44
  await animationsDone(card);
  const field = page.getByLabel("Lösenord");
  await expect(field).toHaveCSS("background-color", PAGE);
  expect((await field.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  const button = page.getByRole("button", { name: "Öppna" });
  await expect(button).toHaveCSS("background-color", BRAND);
  expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);

  // Fokus syns på fältet
  await field.focus();
  await expect(field).toHaveCSS("outline-width", "3px");

  // Felet är rödtonad text utan bakgrund och kant, med god kontrast mot kortet
  await field.fill("fel");
  await button.click();
  const error = page.locator("#losenord-fel");
  await expectTextMessage(error, DANGER);
  expect(contrast(DANGER, CARD)).toBeGreaterThanOrEqual(4.5);
  await context.close();
});

const MUTED = "rgb(133, 145, 164)";
const TEXT = "rgb(200, 208, 220)";

test("MUPP-003-R8 the admin link is quiet, and the admin pages look like the rest: headings, cards, field, summary button, dialog", async ({ page }) => {
  test.skip(!runsLocally, "needs the admin password of the local test server");
  await clearFamily();
  const mia = uniqueName("Mia");
  const kid = uniqueName("Barn");
  await addChild(await addParent(mia), kid);
  try {
    // The menu: "Admin" in the muted text colour, still readable, "Start" in the normal one
    await page.goto("/");
    await page.getByRole("button", { name: "Meny" }).click();
    const admin = page.getByRole("link", { name: "Admin" });
    await animationsDone(page.getByRole("navigation", { name: "Huvudmeny" }));
    await expect(admin).toHaveCSS("color", MUTED);
    await expect(page.getByRole("link", { name: "Start" })).toHaveCSS("color", TEXT);
    expect(contrast(MUTED, await backgroundOf(admin))).toBeGreaterThanOrEqual(4.5);

    // Sign-in: the name of the page in Fredoka, a card, a field and a button as on the password page
    await page.goto("/admin");
    await page.evaluate(() => document.fonts.ready);
    expect(await css(page.getByRole("heading", { level: 1, name: "Admin" }), "font-family")).toMatch(/Fredoka/);
    const field = page.getByLabel("Adminlösenord");
    await expect(field).toHaveCSS("background-color", PAGE);
    expect((await field.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole("button", { name: "Logga in" })).toHaveCSS("background-color", BRAND);
    await field.fill("fel");
    await page.getByRole("button", { name: "Logga in" }).click();
    const wrong = page.getByRole("alert").filter({ hasText: "Fel lösenord." });
    await expectTextMessage(wrong, DANGER);

    // A kid's page: cards with an edge, a "Ändra" summary that looks like the secondary button, an item in a bordered box
    await adminSignIn(page, mia);
    await page.getByRole("link", { name: `Önskelistor och storlekar, ${kid}` }).click();
    await page.evaluate(() => document.fonts.ready);
    const sizes = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Storlekar" }) });
    await animationsDone(sizes);
    await expect(sizes).toHaveCSS("border-top-color", EDGE);
    await expect(sizes).toHaveCSS("background-color", CARD);
    const birthday = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Födelsedag" }) });
    const summary = birthday.locator("summary", { hasText: "Ny önskning" });
    await expect(summary).toHaveCSS("background-color", CARD);
    await expect(summary).toHaveCSS("border-top-width", "1px");
    await expect(summary).toHaveCSS("list-style-type", "none");
    expect((await summary.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await summary.focus();
    await expect(summary).toHaveCSS("outline-width", "3px");

    // The confirmation: a card-coloured dialog in the middle with a dark backdrop, the question in Fredoka
    await summary.click();
    await birthday.getByLabel("Namn").fill("Pussel");
    await birthday.getByRole("button", { name: "Lägg till" }).click();
    await birthday.getByRole("button", { name: "Ta bort Pussel" }).click();
    const dialog = page.getByRole("alertdialog");
    await animationsDone(dialog);
    await expect(dialog).toHaveCSS("background-color", CARD);
    await expect(dialog).toHaveCSS("border-top-color", EDGE);
    expect(await css(dialog.getByRole("heading"), "font-family")).toMatch(/Fredoka/);
    expect(await css(dialog, "background-color", "::backdrop")).toMatch(/^(rgba\(0, 0, 0, 0\.7\)|color\(srgb 0 0 0 \/ 0\.7\)|oklab\(0 0 0 \/ 0\.7\))$/);
    const box = (await dialog.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThan(2);
    expect(Math.abs(box.y + box.height / 2 - viewport.height / 2)).toBeLessThan(2);
    await expect(dialog.getByRole("button", { name: "Ta bort" })).toHaveCSS("background-color", BRAND);
  } finally {
    await clearFamily();
  }
});
