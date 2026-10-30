import { expect, test, type Page } from "@playwright/test";
import { adminSignIn, animationsDone, backgroundOf, birthdateIn, BRAND, CARD, contrast, css, DANGER, EDGE, expectNoA11yViolations, expectTextMessage, PAGE, runsLocally, SHADOW, settledBox, uniqueName } from "./helpers";
import { addChild, addParent, addWish, clearFamily } from "./family-db";
import { swedishToday } from "../lib/deck";
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
    const box = await settledBox(button);
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
  const region = await settledBox(page.getByRole("main"));
  const firstButton = await settledBox(main);
  const firstCard = await settledBox(normal);
  expect(firstButton.x - region.x).toBeGreaterThanOrEqual(6);
  expect(firstCard.x - region.x).toBeGreaterThanOrEqual(6);
  await page.getByRole("heading", { level: 1 }).scrollIntoViewIfNeeded();
  expect((await settledBox(page.getByRole("heading", { level: 1 }))).y - region.y).toBeGreaterThanOrEqual(6);

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
  const box = await settledBox(frame);
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
  const box = await settledBox(pressable);

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
  const pressedBox = await settledBox(pressable);
  await page.mouse.move(pressedBox.x + pressedBox.width / 2, pressedBox.y + pressedBox.height / 2);
  await page.mouse.down();
  await expect(pressable).toHaveCSS("transform", "none");
  await page.mouse.up();
});

test("MUPP-002-R1 the start page: a header without border", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const header = page.getByRole("banner");
  for (const side of ["top", "right", "bottom", "left"]) await expect(header).toHaveCSS(`border-${side}-width`, "0px");
  await expect(header).toHaveCSS("box-shadow", "none");
});

test("MUPP-004-R3 R5 R8 R9 R10 the start page deck: a stack with one marked card, 44 px controls, a Christmas look, focus and reduced motion", async ({ page }) => {
  test.skip(!runsLocally, "needs its own kids in the local test database");
  await clearFamily();
  try {
    const parent = await addParent(uniqueName("Förälder"));
    const today = swedishToday();
    // Sex barn med olika födelsedagar som räknas från idag, så att kortens ordning och antal inte hänger på datumet
    const birthdateIn = (days: number) => {
      const date = new Date(Date.UTC(today.year, today.month - 1, today.day + days));
      return `2018-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    };
    for (const [i, name] of ["Otto", "Alma", "Vera", "Vilda", "Otis", "Ines"].entries()) await addChild(parent, name, birthdateIn(i * 40));
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const card = page.getByRole("article");
    await animationsDone(page.locator(".deck-card").first());
    await animationsDone(card);

    // R8: det valda kortet är framför de på sidorna, som är mindre; kortet i mitten har kortets yta
    const behind = page.locator(".deck-card[inert]").first();
    expect(Number(await css(card.locator(".."), "z-index"))).toBeGreaterThan(Number(await css(behind, "z-index")));
    expect(await css(behind, "transform")).not.toBe("none");
    await expect(card).toHaveCSS("background-color", CARD);

    // R8: bara tre kort ritas (det i mitten och de på sidorna), fast leken har sju
    expect(await page.locator(".deck-card").count()).toBe(3);

    // R8: knapparna sitter vid kortet, på var sida och i höjd med dess mitt
    const firstBox = await settledBox(card);
    const prevBox = await settledBox(page.getByRole("button", { name: "Föregående kort" }));
    const nextBox = await settledBox(page.getByRole("button", { name: "Nästa kort" }));
    expect(Math.abs(prevBox.y + prevBox.height / 2 - (firstBox.y + firstBox.height / 2))).toBeLessThan(2);
    expect(prevBox.x).toBeLessThan(firstBox.x + 8);
    expect(nextBox.x + nextBox.width).toBeGreaterThan(firstBox.x + firstBox.width - 8);

    // R2: exakt ett kort är markerat med barnets färg
    expect(await page.locator(".card-highlight").count()).toBe(1);

    // R8 R9: knapparna är minst 44 × 44 px, fokus syns, och korten rör sig i 250 ms eller, med minskad rörelse, inte alls
    for (const name of ["Föregående kort", "Nästa kort", "Önskelista"]) {
      const box = await settledBox(page.getByRole("button", { name: new RegExp(`^${name}`) }));
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    const nextButton = page.getByRole("button", { name: "Nästa kort" });
    await nextButton.focus();
    await expect(nextButton).toHaveCSS("outline-width", "3px");
    await expect(card.locator("..")).toHaveCSS("transition-duration", "0.25s, 0.25s");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(card.locator("..")).toHaveCSS("transition-duration", "0s");

    // R5: julkortet har sitt eget utseende (grön kant och bakgrund), och rubriken har god kontrast mot bakgrundens ljusaste del
    // (grönt, 42 % över kortets yta); julkortet ligger olika långt fram beroende på datum, så vi bläddrar tills det syns
    for (let i = 0; i < 8 && !(await page.getByRole("heading", { level: 2, name: "Julafton" }).isVisible()); i++) await nextButton.click();
    await expect(card).toHaveClass(/christmas-card/);
    expect(await card.locator("svg[aria-hidden='true']").count()).toBe(1);
    // R5: sex barn får plats på julkortet utan scroll, som smala rader
    await expect(card.getByRole("button", { name: /^Öppna / })).toHaveCount(6);
    expect(await card.locator("ul").evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(true);
    expect(await card.innerText()).not.toMatch(/\p{Extended_Pictographic}/u);
    const heading = page.getByRole("heading", { level: 2, name: "Julafton" });
    expect(contrast(await css(heading, "color"), "rgb(52, 79, 67)")).toBeGreaterThanOrEqual(4.5);
    // R5: alla kort är lika stora (julkortet har flera barn, födelsedagskortet ett) och rubriken står i mitten
    const christmasBox = await settledBox(card);
    expect(Math.abs(christmasBox.height - firstBox.height)).toBeLessThan(1);
    const headingBox = await settledBox(heading);
    expect(Math.abs(headingBox.x + headingBox.width / 2 - (christmasBox.x + christmasBox.width / 2))).toBeLessThan(2);
  } finally {
    await clearFamily();
  }
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
  expect((await settledBox(field)).height).toBeGreaterThanOrEqual(44);
  const button = page.getByRole("button", { name: "Öppna" });
  await expect(button).toHaveCSS("background-color", BRAND);
  expect((await settledBox(button)).height).toBeGreaterThanOrEqual(44);

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

test("MUPP-003-R8 MUPP-010-R2 R6 the admin link is quiet, and the admin pages look like the rest: headings, cards, field, button, slim rows with icon buttons, dialog", async ({ page }) => {
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
    expect((await settledBox(field)).height).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole("button", { name: "Logga in" })).toHaveCSS("background-color", BRAND);
    await field.fill("fel");
    await page.getByRole("button", { name: "Logga in" }).click();
    const wrong = page.getByRole("alert").filter({ hasText: "Fel lösenord." });
    await expectTextMessage(wrong, DANGER);

    // The sizes page: a card with an edge; the wish list page: "Ny önskning" looks like the secondary button
    await adminSignIn(page, mia);
    await page.getByRole("link", { name: `Storlekar för ${kid}` }).click();
    await page.evaluate(() => document.fonts.ready);
    const sizes = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Storlekar" }) });
    await animationsDone(sizes);
    await expect(sizes).toHaveCSS("border-top-color", EDGE);
    await expect(sizes).toHaveCSS("background-color", CARD);
    await page.goBack();
    await page.getByRole("link", { name: `Önskelistor för ${kid}` }).click();
    const birthday = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Födelsedag" }) });
    const open = birthday.getByRole("button", { name: "Ny önskning" });
    await expect(open).toHaveCSS("background-color", CARD);
    await expect(open).toHaveCSS("border-top-width", "1px");
    expect((await settledBox(open)).height).toBeGreaterThanOrEqual(44);
    await open.focus();
    await expect(open).toHaveCSS("outline-width", "3px");

    // MUPP-010-R2 R6: a slim row is about one line high, its icon buttons are 32 px, look like the secondary button, and are equally high side by side
    await open.click();
    await birthday.getByLabel("Namn").fill("Pussel");
    await birthday.getByRole("button", { name: "Lägg till" }).click();
    const row = birthday.getByRole("article").filter({ hasText: "Pussel" });
    expect((await settledBox(row)).height).toBeLessThanOrEqual(56);
    await expect(row).toHaveCSS("border-top-color", EDGE);
    await page.mouse.move(0, 0);
    const edit = row.getByRole("button", { name: "Ändra Pussel" });
    const remove = row.getByRole("button", { name: "Ta bort Pussel" });
    for (const icon of [edit, remove]) {
      const iconBox = await settledBox(icon);
      expect([iconBox.width, iconBox.height]).toEqual([32, 32]);
      await expect(icon).toHaveCSS("background-color", CARD);
      await expect(icon).toHaveCSS("border-top-width", "1px");
      await expect(icon.locator("svg")).toHaveAttribute("aria-hidden", "true");
    }
    await edit.focus();
    await expect(edit).toHaveCSS("outline-width", "3px");

    // The confirmation: a card-coloured dialog in the middle with a dark backdrop, the question in Fredoka
    await remove.click();
    const dialog = page.getByRole("alertdialog");
    await animationsDone(dialog);
    await expect(dialog).toHaveCSS("background-color", CARD);
    await expect(dialog).toHaveCSS("border-top-color", EDGE);
    expect(await css(dialog.getByRole("heading"), "font-family")).toMatch(/Fredoka/);
    expect(await css(dialog, "background-color", "::backdrop")).toMatch(/^(rgba\(0, 0, 0, 0\.7\)|color\(srgb 0 0 0 \/ 0\.7\)|oklab\(0 0 0 \/ 0\.7\))$/);
    const box = await settledBox(dialog);
    const viewport = page.viewportSize()!;
    expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThan(2);
    expect(Math.abs(box.y + box.height / 2 - viewport.height / 2)).toBeLessThan(2);
    await expect(dialog.getByRole("button", { name: "Ta bort" })).toHaveCSS("background-color", BRAND);
  } finally {
    await clearFamily();
  }
});

test("MUPP-012-R1 R2 the parent picker looks like the other fields, and its list like a card with the selected row marked and the focus visible", async ({ page }) => {
  test.skip(!runsLocally, "needs the admin password of the local test server");
  await clearFamily();
  const chef = uniqueName("Chef");
  const mia = uniqueName("Mia");
  await addParent(chef, true);
  await addParent(mia);
  try {
    await page.setViewportSize({ width: 375, height: 667 });
    await adminSignIn(page, chef);
    await page.getByRole("link", { name: "Hantera barn och föräldrar" }).click();
    await page.getByRole("button", { name: "Nytt barn" }).click();
    const field = page.getByRole("button", { name: /^Förälder/ });
    const name = page.getByLabel("Namn");

    // The field: as high and as round as a text field, with the same colours
    expect((await settledBox(field)).height).toBeGreaterThanOrEqual(44);
    for (const property of ["background-color", "border-top-color", "border-top-width", "border-top-left-radius", "color", "height"]) {
      expect(await css(field, property)).toBe(await css(name, property));
    }

    // The list: a card-coloured box with an edge and a shadow, rows of at least 44 px, the selected row bold with a check mark in the brand colour, the active row lighter
    await field.click();
    const list = page.getByRole("listbox");
    await expect(list).toHaveCSS("background-color", CARD);
    await expect(list).toHaveCSS("border-top-width", "1px");
    expect(await css(list, "box-shadow")).not.toBe("none");
    const selected = list.getByRole("option", { name: chef });
    const other = list.getByRole("option", { name: mia });
    expect((await settledBox(other)).height).toBeGreaterThanOrEqual(44);
    await expect(selected).toHaveCSS("font-weight", "700");
    await expect(other).toHaveCSS("font-weight", "400");
    await expect(selected.locator("svg")).toHaveCSS("color", BRAND);
    await expect(list).toBeFocused();
    await expect(list).toHaveCSS("outline-width", "3px");
    await other.hover();
    await expect(other).toHaveCSS("background-color", EDGE);
    expect(contrast(TEXT, await backgroundOf(other))).toBeGreaterThanOrEqual(4.5);

    // Closed again, the focus ring is on the field
    await page.keyboard.press("Escape");
    await expect(field).toBeFocused();
    await expect(field).toHaveCSS("outline-width", "3px");
  } finally {
    await clearFamily();
  }
});

test("TECH-006-R4 the admin start shows a short text by the icons from 640 px and only icons on a phone, and the manage page keeps its lists narrow on a wide screen", async ({ page }) => {
  test.skip(!runsLocally, "needs the admin password of the local test server");
  await clearFamily();
  const chef = uniqueName("Chef");
  const kid = uniqueName("Barn");
  await addChild(await addParent(chef, true), kid);
  try {
    // Phone: only the icons, 32 px each
    await page.setViewportSize({ width: 375, height: 667 });
    await adminSignIn(page, chef);
    const sizes = page.getByRole("link", { name: `Storlekar för ${kid}` });
    const wishes = page.getByRole("link", { name: `Önskelistor för ${kid}` });
    await expect(sizes.getByText("Storlekar", { exact: true })).toBeHidden();
    const phoneBox = await settledBox(sizes);
    expect([phoneBox.width, phoneBox.height]).toEqual([32, 32]);

    // Wide screen: the text is visible beside the icon, the link grows, and the name is still the full one
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(sizes.getByText("Storlekar", { exact: true })).toBeVisible();
    await expect(wishes.getByText("Önskelistor", { exact: true })).toBeVisible();
    const wideBox = await settledBox(sizes);
    expect(wideBox.width).toBeGreaterThan(32);
    expect(wideBox.height).toBe(32);
    await expectNoA11yViolations(page);

    // The manage page: the content is at most 42 rem (672 px) wide, so the buttons stay near the names
    await page.getByRole("link", { name: "Hantera barn och föräldrar" }).click();
    const row = page.getByRole("article").filter({ hasText: kid });
    await animationsDone(row);
    expect((await settledBox(row)).width).toBeLessThanOrEqual(672);
    await expectNoA11yViolations(page);
  } finally {
    await clearFamily();
  }
});

test("TECH-006-R5 MUPP-005-R7 the cards: a narrow one-line wish button and a big picture and a line between kids sharing a birthday, tiles on Christmas Eve, and a wish list button filled with the kid's colour", async ({ page }) => {
  test.skip(!runsLocally, "needs its own kids in the local test database");
  await clearFamily();
  try {
    const parent = await addParent(uniqueName("Förälder"));
    const today = swedishToday();
    const date = new Date(Date.UTC(today.year, today.month - 1, today.day + 20));
    const twins = `2019-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    await addChild(parent, "Vera", twins);
    await addChild(parent, "Vilda", twins);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const card = page.getByRole("article");
    await animationsDone(card);

    // The card with two kids: the wish button is one line, narrow and 44 px high, the pictures are bigger than 60 px, and a thin line separates the kids
    const buttons = card.getByRole("button", { name: /^Önskelista för / });
    for (const button of await buttons.all()) {
      // MUPP-005-R7: no count on the button
      await expect(button).toHaveText(/^Önskelista( för \S+)?$/);
      const box = await settledBox(button);
      expect(box.width).toBeLessThanOrEqual(160);
      expect(box.height).toBe(44);
      // Dark text on the kid's colour, readable
      // (the fill is a colour mix; a canvas turns it into plain rgb(…) for the contrast helper)
      const fill = await button.evaluate((el) => {
        const context = document.createElement("canvas").getContext("2d")!;
        context.fillStyle = getComputedStyle(el).backgroundColor;
        context.fillRect(0, 0, 1, 1);
        const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
        return `rgb(${r}, ${g}, ${b})`;
      });
      expect(contrast(await css(button, "color"), fill)).toBeGreaterThanOrEqual(4.5);
    }
    const kids = card.locator("ul > li");
    expect((await settledBox(kids.first().locator("[aria-hidden]").first())).width).toBeGreaterThan(60);
    expect(await css(kids.nth(1), "height", "::before")).toBe("1px");
    expect(await css(kids.first(), "height", "::before")).not.toBe("1px");
    await expectNoA11yViolations(page);

    // Christmas Eve: the kids are tiles, two by two
    for (let i = 0; i < 3 && (await card.getByRole("heading", { level: 2 }).innerText()) !== "Julafton"; i++) {
      await page.getByRole("button", { name: "Nästa kort" }).click();
      await animationsDone(card);
    }
    const tiles = card.getByRole("button", { name: /^Öppna / });
    // Both boxes are read in one go: a name that is fitted a moment later (MUPP-013-R3) moves the list between two reads
    const [a, b] = await tiles.evaluateAll((els) => els.slice(0, 2).map((el) => el.getBoundingClientRect()));
    expect(a.y).toBe(b.y);
    expect(b.x).toBeGreaterThan(a.x + a.width - 1);
    await expectNoA11yViolations(page);
  } finally {
    await clearFamily();
  }
});

test("MUPP-013-R1 R2 R3 R4 the card with several kids: spread out with a clear line, a name on one line, and a yellow mark for the next card", async ({ page }) => {
  test.skip(!runsLocally, "needs its own kids in the local test database");
  await clearFamily();
  try {
    const parent = await addParent(uniqueName("Förälder"));
    const today = swedishToday();
    const date = new Date(Date.UTC(today.year, today.month - 1, today.day + 20));
    const twins = `2019-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    const longName = "Maximiliana Wilhelmina Fredrika";
    await addChild(parent, longName, twins);
    await addChild(parent, "Vera", twins);
    // A tall phone, where there is room to spread the kids out
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto("/");
    const card = page.getByRole("article");
    await animationsDone(card);

    // R1: each kid sits in its own half of the list, so the card is filled from top to bottom
    const list = card.locator("ul");
    const [listBox, firstBox, secondBox] = await Promise.all([settledBox(list), settledBox(list.locator("li").nth(0)), settledBox(list.locator("li").nth(1))]);
    // (the second part is a little taller: the room above the line)
    expect(Math.abs(secondBox.height - firstBox.height)).toBeLessThan(20);
    expect(firstBox.height).toBeGreaterThan(listBox.height / 2 - 20);
    const buttons = card.getByRole("button", { name: /^Önskelista för / });
    expect((await settledBox(buttons.nth(1))).y).toBeGreaterThan(secondBox.y + secondBox.height / 2);

    // R2: the line is 60 % of the width and clear enough to see, but still a thin line
    const line = list.locator("li").nth(1);
    expect(await css(line, "height", "::before")).toBe("1px");
    expect(Number.parseFloat(await css(line, "left", "::before"))).toBeCloseTo(secondBox.width * 0.2, 0);
    expect(await css(line, "background-color", "::before")).not.toBe(EDGE);

    // R3: a long name stays on one line, smaller but not below 12 px, and is cut with an ellipsis when it still does not fit
    const name = card.getByRole("heading", { level: 3, name: longName });
    const [nameBox, shortBox] = await Promise.all([settledBox(name), settledBox(card.getByRole("heading", { level: 3, name: "Vera" }))]);
    expect(nameBox.height).toBeLessThanOrEqual(shortBox.height);
    const size = Number.parseFloat(await css(name.locator("span"), "font-size"));
    expect(size).toBeGreaterThanOrEqual(12);
    expect(size).toBeLessThan(18);
    expect(await name.locator("span").evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await expectNoA11yViolations(page);

    // R4: the mark is yellow (the sun colour), with readable text on its background
    const mark = card.locator(".chip-child");
    await expect(mark).toHaveCSS("color", "rgb(212, 184, 115)");
    expect(contrast(await css(mark, "color"), await backgroundOf(mark))).toBeGreaterThanOrEqual(4.5);
  } finally {
    await clearFamily();
  }
});

test("MUPP-013-R3 Christmas Eve: a long name is on one line in its tile", async ({ page }) => {
  test.skip(!runsLocally, "needs its own kids in the local test database");
  await clearFamily();
  try {
    const parent = await addParent(uniqueName("Förälder"));
    const longName = "Maximiliana Wilhelmina Fredrika";
    await addChild(parent, longName);
    await addChild(parent, "Vera");
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const card = page.getByRole("article");
    await animationsDone(card);
    for (let i = 0; i < 3 && (await card.getByRole("heading", { level: 2 }).innerText()) !== "Julafton"; i++) {
      await page.getByRole("button", { name: "Nästa kort" }).click();
      await animationsDone(card);
    }
    const [tileName, otherName] = [card.getByText(longName, { exact: true }), card.getByText("Vera", { exact: true })];
    expect((await settledBox(tileName)).height).toBeLessThanOrEqual((await settledBox(otherName)).height);
    // The tile is narrower than the card: this name does not fit even at 12 px, so it is cut with an ellipsis
    expect(Number.parseFloat(await css(tileName, "font-size"))).toBe(12);
    await expect(tileName).toHaveCSS("text-overflow", "ellipsis");
    expect(await card.locator("ul").evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(true);
    await expectNoA11yViolations(page);
  } finally {
    await clearFamily();
  }
});

test("MUPP-013-R5 MUPP-005-R6 an open wish list swaps the wish button for a small arrow button, centred at the bottom of the list, that stays there when the list scrolls and closes the list", async ({ page }) => {
  test.skip(!runsLocally, "needs its own kids in the local test database");
  await clearFamily();
  try {
    const parent = await addParent(uniqueName("Förälder"));
    // Born in 20 days, so that the birthday card is the next one whatever the date is
    const today = swedishToday();
    const date = new Date(Date.UTC(today.year, today.month - 1, today.day + 20));
    const child = await addChild(parent, "Vera", `2019-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`);
    for (let i = 1; i <= 30; i++) await addWish(child, "birthday", `Önskning ${i}`);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const card = page.getByRole("article");
    await animationsDone(card);
    const wishButton = card.getByRole("button", { name: /^Önskelista/ });
    // MUPP-005-R6: the button says only "Önskelista" with an arrow down, no "Visa mer" and no count
    await expect(wishButton).toHaveText("Önskelista");
    await expect(wishButton.locator("svg")).toHaveCount(1);
    await wishButton.click();

    // The wish button is gone and the arrow up has the focus
    const region = card.getByRole("region", { name: "Önskelista" });
    const close = region.getByRole("button", { name: "Fäll ihop önskelistan" });
    await expect(wishButton).toHaveCount(0);
    await expect(close).toBeFocused();
    const corner = async () => {
      const [regionBox, closeBox] = await Promise.all([settledBox(region), settledBox(close)]);
      return { middle: closeBox.x + closeBox.width / 2 - (regionBox.x + regionBox.width / 2), bottom: regionBox.y + regionBox.height - (closeBox.y + closeBox.height), width: closeBox.width, height: closeBox.height };
    };
    // The list is long enough to scroll, and the button is small, 44 px high and centred at the bottom
    expect(await region.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    const before = await corner();
    expect(Math.abs(before.middle)).toBeLessThan(2);
    expect(before.bottom).toBeLessThan(20);
    expect(before.height).toBeGreaterThanOrEqual(44);
    expect(before.width).toBeLessThan(120);
    await expectNoA11yViolations(page);

    // It stays in place when the list is scrolled
    await region.evaluate((el) => el.scrollTo(0, el.scrollHeight / 2));
    const scrolled = await corner();
    expect(Math.abs(scrolled.bottom - before.bottom)).toBeLessThan(1);
    expect(Math.abs(scrolled.middle - before.middle)).toBeLessThan(1);

    // It closes the list and unlocks the deck, with the focus back on the wish button
    await close.click();
    await expect(region).toHaveCount(0);
    await expect(wishButton).toBeFocused();
    await expect(page.getByRole("button", { name: "Nästa kort" })).toBeEnabled();
  } finally {
    await clearFamily();
  }
});

test("MUPP-005-R1 R3 R4 R5 the wish rows and the claim dialog: marks, targets, contrast, focus and fit on a phone", async ({ page }) => {
  test.skip(!runsLocally, "needs its own kids in the local test database");
  await clearFamily();
  try {
    const parent = await addParent(uniqueName("Förälder"));
    const child = await addChild(parent, "Vera", birthdateIn(20).birthdate);
    await addWish(child, "birthday", "Cykel");
    await addWish(child, "birthday", "Strumpor", { unlimited: true });
    await addWish(child, "birthday", "Hoppborg", { claimedBy: "Moster Lisa" });
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const card = page.getByRole("article");
    await animationsDone(card);
    await card.getByRole("button", { name: /^Önskelista/ }).click();
    const region = card.getByRole("region", { name: "Önskelista" });
    await animationsDone(region);

    // The marks are small muted text under the headline, readable on the card; the row buttons and checkboxes are 44 px targets
    const claimedMark = region.getByText("Paxad", { exact: true });
    expect(contrast(await css(claimedMark, "color"), await backgroundOf(claimedMark))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(await css(region.getByText("Kan köpas flera gånger"), "color"), await backgroundOf(region))).toBeGreaterThanOrEqual(4.5);
    const target = (locator: ReturnType<Page["locator"]>) => settledBox(locator);
    expect((await target(region.getByRole("button", { name: /^Cykel/ }))).height).toBeGreaterThanOrEqual(44);
    const tickTarget = await target(region.getByRole("checkbox", { name: "Cykel" }).locator(".."));
    expect(tickTarget.width).toBeGreaterThanOrEqual(44);
    expect(tickTarget.height).toBeGreaterThanOrEqual(44);

    // "Paxa" is a main button of 44 px next to the arrow button, both centred at the bottom of the list
    await region.getByRole("checkbox", { name: "Cykel" }).check();
    const claim = region.getByRole("button", { name: /^Paxa \(/ });
    const [claimBox, closeBox] = [await target(claim), await target(region.getByRole("button", { name: "Fäll ihop önskelistan" }))];
    expect(claimBox.height).toBeGreaterThanOrEqual(44);
    expect(Math.abs(claimBox.y + claimBox.height / 2 - (closeBox.y + closeBox.height / 2))).toBeLessThan(2);
    await expect(claim).toHaveCSS("background-color", BRAND);

    // The dialog: a card on a dark backdrop, fits the phone, the name field has the focus ring, the error is red text
    await claim.click();
    const dialog = page.getByRole("dialog");
    await animationsDone(dialog);
    await expect(dialog).toHaveCSS("background-color", CARD);
    await expect(dialog).toHaveCSS("border-top-color", EDGE);
    const box = await settledBox(dialog);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);
    expect(box.y + box.height).toBeLessThanOrEqual(667);
    const name = dialog.getByLabel("Ditt namn");
    await expect(name).toBeFocused();
    await expect(name).toHaveCSS("outline-width", "3px");
    await expect(name).toHaveCSS("outline-color", BRAND);
    expect((await target(name)).height).toBeGreaterThanOrEqual(44);
    for (const button of ["Avbryt", "Paxa"]) expect((await target(dialog.getByRole("button", { name: button }))).height).toBeGreaterThanOrEqual(44);
    await dialog.getByRole("button", { name: "Paxa" }).click();
    await expectTextMessage(dialog.getByRole("alert"), DANGER);
    expect(contrast(DANGER, CARD)).toBeGreaterThanOrEqual(4.5);
    await expectNoA11yViolations(page);
  } finally {
    await clearFamily();
  }
});

// One test per phone size, to stay within the time budget of a test
for (const viewport of [{ width: 320, height: 568 }, { width: 375, height: 667 }]) {
  test(`MUPP-014-R2 R3 R4 R6 the sizes buttons at ${viewport.width} × ${viewport.height}: 44 px, between the age and the wish button, 70-80 % for the wish button beside the icon, in the corner of an open kid view, and no scroll or overlap`, async ({ page }) => {
    test.skip(!runsLocally, "needs its own kids in the local test database");
    await clearFamily();
    try {
      const parent = await addParent(uniqueName("Förälder"));
      const { birthdate } = birthdateIn(20);
      await addChild(parent, "Vera", birthdate);
      await addChild(parent, "Vilda", birthdate);
      // Ensam has a card of her own, the twins share another
      await addChild(parent, "Ensam", "2018-02-02");
      const card = page.getByRole("article");
      const noScroll = () => page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight && document.documentElement.scrollWidth <= window.innerWidth);
      const toCard = async (heading: string) => {
        for (let i = 0; i < 4 && (await card.getByRole("heading", { level: 2 }).innerText()) !== heading; i++) {
          await page.getByRole("button", { name: "Nästa kort" }).click();
          await animationsDone(card);
        }
      };
      const disjoint = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) =>
        a.x + a.width <= b.x + 0.5 || b.x + b.width <= a.x + 0.5 || a.y + a.height <= b.y + 0.5 || b.y + b.height <= a.y + 0.5;
      const inside = (inner: { x: number; y: number; width: number; height: number }, outer: { x: number; y: number; width: number; height: number }) =>
        inner.x >= outer.x - 0.5 && inner.y >= outer.y - 0.5 && inner.x + inner.width <= outer.x + outer.width + 0.5 && inner.y + inner.height <= outer.y + outer.height + 0.5;

      await page.setViewportSize(viewport);
      await page.goto("/");
      await animationsDone(card);

      // The twins' card: the wish button takes 70-80 % of the two buttons together, both 44 px high, on one line
      await toCard("November");
      const wishButtons = card.getByRole("button", { name: /^Önskelista för / });
      for (let i = 0; i < 2; i++) {
        const wish = await settledBox(wishButtons.nth(i));
        const icon = await settledBox(card.getByRole("button", { name: /^Storlekar för / }).nth(i));
        expect(icon.width).toBeGreaterThanOrEqual(44);
        expect(icon.height).toBeGreaterThanOrEqual(44);
        expect(wish.height).toBeGreaterThanOrEqual(44);
        expect(Math.abs(wish.y + wish.height / 2 - (icon.y + icon.height / 2))).toBeLessThan(1);
        const share = wish.width / (icon.x + icon.width - wish.x);
        expect(share).toBeGreaterThanOrEqual(0.7);
        expect(share).toBeLessThanOrEqual(0.8);
        expect(disjoint(wish, icon)).toBe(true);
      }
      // The two kids' parts do not overlap each other and nothing is cut off at the sides of the card
      // (a short phone may scroll the list inside the card, as before; that is allowed by the rules)
      const list = card.locator("ul");
      expect(await list.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      const [first, second] = [await settledBox(card.locator("ul > li").first()), await settledBox(card.locator("ul > li").nth(1))];
      expect(disjoint(first, second)).toBe(true);
      expect(await noScroll()).toBe(true);

      // An open kid view of the twins: the icon is in the top right corner, 44 px, clear of the month
      await wishButtons.first().click();
      let region = card.getByRole("region", { name: "Önskelista" });
      await expect(region).toBeVisible();
      let corner = await settledBox(card.getByRole("button", { name: "Storlekar", exact: true }));
      let cardBox = await settledBox(card);
      expect(corner.width).toBeGreaterThanOrEqual(44);
      expect(corner.height).toBeGreaterThanOrEqual(44);
      expect(cardBox.x + cardBox.width - (corner.x + corner.width)).toBeLessThan(20);
      expect(corner.y - cardBox.y).toBeLessThan(20);
      expect(inside(corner, cardBox)).toBe(true);
      expect(disjoint(corner, await settledBox(card.getByRole("heading", { level: 2 })))).toBe(true);
      expect(await noScroll()).toBe(true);
      await region.getByRole("button", { name: /^Stäng/ }).click();

      // The single kid card: the button is between the age and the wish button
      await toCard("Februari");
      const age = await settledBox(card.getByText(/^Fyller \d+ år$/));
      const sizes = await settledBox(card.getByRole("button", { name: "Storlekar" }));
      const wish = await settledBox(card.getByRole("button", { name: /^Önskelista/ }));
      cardBox = await settledBox(card);
      expect(sizes.height).toBeGreaterThanOrEqual(44);
      expect(sizes.y).toBeGreaterThanOrEqual(age.y + age.height - 0.5);
      expect(sizes.y + sizes.height).toBeLessThanOrEqual(wish.y + 0.5);
      expect(inside(wish, cardBox)).toBe(true);
      expect(disjoint(await settledBox(card.getByRole("heading", { level: 3 })), sizes)).toBe(true);
      expect(await noScroll()).toBe(true);

      // Its open list: the button is gone and the icon is in the corner
      await card.getByRole("button", { name: /^Önskelista/ }).click();
      region = card.getByRole("region", { name: "Önskelista" });
      await expect(region).toBeVisible();
      corner = await settledBox(card.getByRole("button", { name: "Storlekar" }));
      cardBox = await settledBox(card);
      expect(corner.width).toBeGreaterThanOrEqual(44);
      expect(cardBox.x + cardBox.width - (corner.x + corner.width)).toBeLessThan(20);
      expect(corner.y - cardBox.y).toBeLessThan(20);
      expect(disjoint(corner, await settledBox(card.getByRole("heading", { level: 2 })))).toBe(true);
      await region.getByRole("button", { name: "Fäll ihop önskelistan" }).click();

      // Christmas Eve: the kid view has the corner icon, clear of the heading
      await toCard("Julafton");
      await card.getByRole("button", { name: /^Öppna Vera/ }).click();
      await expect(card.getByRole("region", { name: "Önskelista" })).toBeVisible();
      corner = await settledBox(card.getByRole("button", { name: "Storlekar" }));
      expect(corner.width).toBeGreaterThanOrEqual(44);
      expect(disjoint(corner, await settledBox(card.getByRole("heading", { level: 2 })))).toBe(true);
      expect(await noScroll()).toBe(true);
    } finally {
      await clearFamily();
    }
  });
}
