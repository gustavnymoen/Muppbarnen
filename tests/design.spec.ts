import { expect, test, type Locator, type Page } from "@playwright/test";
import { type Box, adminSignIn, animationsDone, backgroundOf, birthdateIn, BRAND, CARD, contrast, css, DANGER, disjoint, EDGE, expectNoA11yViolations, expectTextMessage, goto, inside, PAGE, runsLocally, settledBox, SHADOW, toCard, uniqueName } from "./helpers";
import { addChild, addParent, addSantaEvent, addSantaMember, addSantaWish, addWish, clearFamily, clearSanta, setSantaStatus } from "./family-db";
import { eventCard, santaSignIn } from "./santa";
import { swedishToday } from "../lib/deck";
import { newVisitor } from "./site-session";

// Utseendet: ett test per sida och läge, så att sidan laddas en gång för många kontroller.
// Reglerna som inte behöver en webbläsare (kontrast ur tokens, barnfärger) är enhetstester.

const hasHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

// A form card that is open (MUPP-045-R3 R4): on a phone it sits at the top with a margin and not in the middle, inside the screen, and the cross beside the title is a
// 44 px target with the 3 px ring (at least 3:1 against the card); at 200 % zoom (a window half as wide and high) the card scrolls inside itself
async function expectFormCardLooks(page: Page, dialog: Locator) {
  const cross = dialog.getByRole("button", { name: "Stäng" });
  const title = dialog.getByRole("heading", { level: 2 });
  for (const [width, height] of [[375, 667], [320, 568]]) {
    await page.setViewportSize({ width, height });
    const [box, crossBox, titleBox] = [await settledBox(dialog), await settledBox(cross), await settledBox(title)];
    expect(box.x, `card at ${width}`).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, `card at ${width}`).toBeLessThanOrEqual(width);
    expect(box.y, `card at ${width}`).toBeGreaterThanOrEqual(8);
    expect(box.y, `card at ${width}`).toBeLessThanOrEqual(24);
    expect(box.y + box.height, `card at ${width}`).toBeLessThanOrEqual(height);
    expect(await hasHorizontalScroll(page), `page at ${width}`).toBe(false);
    expect(crossBox.width).toBeGreaterThanOrEqual(44);
    expect(crossBox.height).toBeGreaterThanOrEqual(44);
    expect(titleBox.x + titleBox.width, `title at ${width}`).toBeLessThanOrEqual(crossBox.x + 0.5);
    expect(crossBox.x + crossBox.width, `cross at ${width}`).toBeLessThanOrEqual(box.x + box.width + 0.5);
  }
  // focus() alone does not show :focus-visible, so a key goes first
  await cross.focus();
  await page.keyboard.press("Shift");
  await expect(cross).toHaveCSS("outline-width", "3px");
  expect(contrast(BRAND, CARD)).toBeGreaterThanOrEqual(3);
  await page.setViewportSize({ width: 188, height: 334 });
  const zoomed = await settledBox(dialog);
  expect(zoomed.y + zoomed.height).toBeLessThanOrEqual(334);
  expect(await dialog.evaluate((el) => getComputedStyle(el).overflowY === "auto" && el.scrollHeight > el.clientHeight)).toBe(true);
  await page.setViewportSize({ width: 375, height: 667 });
}

test("MUPP-001-R2 R3 R4 R5 R8 /design on a phone, then on a desktop: fonts, cards, controls, shell, the wide centred frame and a11y", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const hosts = new Set<string>();
  page.on("request", (request) => hosts.add(new URL(request.url()).host));
  await goto(page, "/design");
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

  // R5 R8: the same page on a desktop, by resizing the window (TECH-018): a wide centred frame with the same look
  await page.setViewportSize({ width: 1280, height: 800 });
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
  await goto(page, "/design");
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
  await goto(page, "/");
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
    const birthdate2018In = (days: number) => {
      const date = new Date(Date.UTC(today.year, today.month - 1, today.day + days));
      return `2018-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    };
    for (const [i, name] of ["Otto", "Alma", "Vera", "Vilda", "Otis", "Ines"].entries()) await addChild(parent, name, birthdate2018In(i * 40));
    await page.setViewportSize({ width: 375, height: 667 });
    await goto(page, "/");
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
  await goto(page, "/losenord");

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

test("MUPP-003-R8 MUPP-010-R2 R6 MUPP-053-R1 the admin link is quiet, and the admin pages look like the rest: headings, cards, field, button, slim rows with icon buttons, dialog", async ({ page }) => {
  test.skip(!runsLocally, "needs the admin password of the local test server");
  await clearFamily();
  const mia = uniqueName("Mia");
  const kid = uniqueName("Barn");
  await addChild(await addParent(mia), kid);
  try {
    // The menu: "Admin" in the muted text colour, still readable, "Barnens listor" in the normal one
    await goto(page, "/");
    await page.getByRole("button", { name: "Meny" }).click();
    const admin = page.getByRole("link", { name: "Admin" });
    await animationsDone(page.getByRole("navigation", { name: "Huvudmeny" }));
    await expect(admin).toHaveCSS("color", MUTED);
    await expect(page.getByRole("link", { name: "Barnens listor" })).toHaveCSS("color", TEXT);
    expect(contrast(MUTED, await backgroundOf(admin))).toBeGreaterThanOrEqual(4.5);

    // Sign-in: the name of the page in Fredoka, a card, a field and a button as on the password page
    await goto(page, "/admin");
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

    // The wish list page: "Ny önskning" is a round plus button that looks like the other icon buttons, MUPP-053-R1
    await adminSignIn(page, mia);
    await page.getByRole("link", { name: `Önskelistor för ${kid}` }).click();
    await page.evaluate(() => document.fonts.ready);
    const birthday = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Födelsedag" }) });
    const open = birthday.getByRole("button", { name: "Ny önskning" });
    await expect(open).toHaveCSS("background-color", CARD);
    await expect(open).toHaveCSS("border-top-width", "1px");
    await expect(open).toHaveClass(/rounded-full/);
    const plus = await settledBox(open);
    expect([plus.width, plus.height]).toEqual([44, 44]);
    await open.focus();
    await expect(open).toHaveCSS("outline-width", "3px");

    // MUPP-045-R3 R4 R6: the form card is a card on a dark backdrop, at the top of a phone, with a cross, and the message after a save is a toast
    await open.click();
    const form = page.locator("dialog[open]");
    await animationsDone(form);
    await expect(form).toHaveCSS("background-color", CARD);
    await expect(form).toHaveCSS("border-top-color", EDGE);
    expect(await css(form, "background-color", "::backdrop")).toMatch(/^(rgba\(0, 0, 0, 0\.7\)|color\(srgb 0 0 0 \/ 0\.7\)|oklab\(0 0 0 \/ 0\.7\))$/);
    await expectFormCardLooks(page, form);
    await form.getByLabel("Namn").fill("Pussel");
    await form.getByRole("button", { name: "Lägg till" }).click();
    // MUPP-054-R1 R3: the message is a green tinted band at the top, centred of the screen, in front of the card, with readable text; a failed save is a red one
    const message = page.locator("[data-toast] p");
    await expect(message).toHaveText("Pussel lades till");
    await animationsDone(message);
    await expect(message).toHaveCSS("border-top-color", "rgb(95, 154, 115)");
    expect(contrast(await css(message, "color"), await backgroundOf(message))).toBeGreaterThanOrEqual(4.5);
    const band = await settledBox(message);
    expect(band.y).toBeLessThanOrEqual(16);
    expect(band.x).toBeGreaterThanOrEqual(0);
    // MUPP-054-R2: a field that is not filled in shows its error at the field and no toast
    await form.getByLabel("Namn").fill("");
    await form.getByRole("button", { name: "Lägg till" }).click();
    await expect(form.getByRole("alert").filter({ hasText: "Fyll i det här fältet." })).toBeVisible();
    await expect(page.locator("[data-toast]")).toHaveCount(0);
    await page.keyboard.press("Escape");

    // MUPP-010-R2 R6: a slim row is about one line high, its icon buttons are 32 px, look like the secondary button, and are equally high side by side
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

test("MUPP-038-R1 R2 R3 MUPP-053-R1 R3 the Secret Santa tab on a phone: tabs 44 px high with the selected one marked, a family of 8 as slim rows that fit the width", async ({ page }) => {
  test.skip(!runsLocally, "needs the admin password of the local test server");
  await clearFamily();
  await clearSanta();
  const chef = uniqueName("Chef");
  await addParent(chef, true);
  const family = await addSantaEvent("Familjen Ek");
  for (let i = 1; i <= 8; i++) await addSantaMember(family, `Person Nummer${i}`, `070000${String(i).padStart(4, "0")}`, `person${i}@exempel.invalid`);
  try {
    await page.setViewportSize({ width: 320, height: 640 });
    await adminSignIn(page, chef);
    const kids = page.getByRole("tab", { name: "Barn" });
    const santa = page.getByRole("tab", { name: "Secret Santa" });
    // R1: both tabs at least 44 px high and side by side; the selected one has a brand underline, the other muted text
    for (const tab of [kids, santa]) expect((await settledBox(tab)).height).toBeGreaterThanOrEqual(44);
    const [kidsBox, santaBox] = [await settledBox(kids), await settledBox(santa)];
    expect(disjoint(kidsBox, santaBox)).toBe(true);
    await expect(kids).toHaveCSS("border-bottom-color", BRAND);
    await expect(santa).toHaveCSS("border-bottom-color", "rgba(0, 0, 0, 0)");
    expect(contrast(await css(santa, "color"), await backgroundOf(santa))).toBeGreaterThanOrEqual(4.5);

    // R2 R3: the family is one slim card with eight slim member rows, nothing wider than the screen
    await santa.click();
    const card = eventCard(page, "Familjen Ek");
    // MUPP-056: the group is someone else's, so it is a closed card: a header button of at least 44 px that is the whole card (the note wraps on 320 px, and by more or less lines with the font), the arrow down
    const header = card.getByRole("heading", { level: 3 }).getByRole("button");
    await expect(card.getByRole("heading", { level: 4 })).toHaveCount(0);
    expect((await settledBox(header)).height).toBeGreaterThanOrEqual(44);
    expect((await settledBox(card)).height).toBeLessThanOrEqual((await settledBox(header)).height + 16); // nothing but the header row
    expect(await hasHorizontalScroll(page)).toBe(false);
    await expectNoA11yViolations(page);
    await header.click();
    await expect(card.getByRole("heading", { level: 4 })).toHaveCount(8);
    for (const row of await card.locator("article").all()) expect((await settledBox(row)).height).toBeLessThanOrEqual(56);
    expect(await hasHorizontalScroll(page)).toBe(false);
    // MUPP-053-R1 R3: a 44 px plus for a new person inside the group's card, and "Ny grupp" a text button centred under the groups
    const plus = await settledBox(card.getByRole("button", { name: "Ny person i Familjen Ek" }));
    expect([plus.width, plus.height]).toEqual([44, 44]);
    const [cardBox, groupButton] = await Promise.all([settledBox(card), settledBox(page.getByRole("button", { name: "Ny grupp", exact: true }))]);
    expect(plus.y + plus.height).toBeLessThanOrEqual(cardBox.y + cardBox.height);
    expect(groupButton.height).toBeGreaterThanOrEqual(44);
    expect(Math.abs(groupButton.x + groupButton.width / 2 - 160)).toBeLessThanOrEqual(2);
    const edit = card.getByRole("button", { name: "Ändra Person Nummer1 i Familjen Ek" });
    expect((await settledBox(edit)).width).toBeGreaterThanOrEqual(32);
    await edit.click();
    await expect(card.getByLabel("Telefon")).toBeVisible();
    expect(await hasHorizontalScroll(page)).toBe(false);
    await expectNoA11yViolations(page);
  } finally {
    await clearSanta();
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

test("TECH-006-R4 MUPP-053-R2 R4 the admin start shows a short text by the icons from 640 px and only icons on a phone, and the manage page keeps its lists narrow on a wide screen", async ({ page }) => {
  test.skip(!runsLocally, "needs the admin password of the local test server");
  await clearFamily();
  const chef = uniqueName("Chef");
  const kid = uniqueName("Barn");
  await addChild(await addParent(chef, true), kid);
  try {
    // Phone: only the icons, 32 px each
    await page.setViewportSize({ width: 375, height: 667 });
    await adminSignIn(page, chef);
    const sizes = page.getByRole("button", { name: `Storlekar för ${kid}` });
    const wishes = page.getByRole("link", { name: `Önskelistor för ${kid}` });
    await expect(sizes.getByText("Storlekar", { exact: true })).toBeHidden();
    const phoneBox = await settledBox(sizes);
    expect([phoneBox.width, phoneBox.height]).toEqual([32, 32]);

    // MUPP-053-R4: "Inloggad som" and the 44 px swap icon share one row on the narrowest common phone
    await page.setViewportSize({ width: 360, height: 640 });
    const [who, swap] = await Promise.all([settledBox(page.getByText("Inloggad som")), settledBox(page.getByRole("button", { name: "Byt förälder" }))]);
    expect([swap.width, swap.height]).toEqual([44, 44]);
    expect(who.y + who.height).toBeGreaterThan(swap.y);
    expect(swap.y + swap.height).toBeGreaterThan(who.y);
    expect(swap.x).toBeGreaterThanOrEqual(who.x + who.width);
    expect(await hasHorizontalScroll(page)).toBe(false);
    await page.setViewportSize({ width: 375, height: 667 });

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

    // MUPP-053-R2: the list of kids is a framed card with its plus button inside it, centred, under the last row
    const frame = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Barn" }) });
    await expect(frame).toHaveCSS("border-top-width", "1px");
    const [frameBox, rowBox, addBox] = await Promise.all([settledBox(frame), settledBox(row), settledBox(frame.getByRole("button", { name: "Nytt barn" }))]);
    expect([addBox.width, addBox.height]).toEqual([44, 44]);
    expect(addBox.y).toBeGreaterThanOrEqual(rowBox.y + rowBox.height);
    expect(addBox.y + addBox.height).toBeLessThanOrEqual(frameBox.y + frameBox.height);
    expect(Math.abs(addBox.x + addBox.width / 2 - (frameBox.x + frameBox.width / 2))).toBeLessThanOrEqual(1);
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
    await goto(page, "/");
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
    await goto(page, "/");
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
    await goto(page, "/");
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

test("MUPP-013-R5 MUPP-005-R6 MUPP-028-R1 R2 R3 MUPP-034-R1 an open wish list swaps the wish button for a 32 px button on the bottom line of the list, a cross on every card, that covers no row and closes the list", async ({ page }) => {
  test.skip(!runsLocally, "needs its own kids in the local test database");
  await clearFamily();
  try {
    const parent = await addParent(uniqueName("Förälder"));
    // Born in 20 days, so that the birthday card is the next one whatever the date is; the twins' card comes after it
    const today = swedishToday();
    const date = new Date(Date.UTC(today.year, today.month - 1, today.day + 20));
    const child = await addChild(parent, "Vera", `2019-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`);
    for (let i = 1; i <= 30; i++) await addWish(child, "birthday", `Önskning ${i}`);
    const twins = birthdateIn(40).birthdate;
    await addChild(parent, "Alma", twins);
    await addChild(parent, "Alva", twins);
    await page.setViewportSize({ width: 375, height: 667 });
    await goto(page, "/");
    const card = page.getByRole("article");
    await animationsDone(card);
    const wishButton = card.getByRole("button", { name: /^Önskelista/ });
    // MUPP-005-R6: the button says only "Önskelista" with an arrow down, no "Visa mer" and no count
    await expect(wishButton).toHaveText("Önskelista");
    await expect(wishButton.locator("svg")).toHaveCount(1);
    await wishButton.click();

    // The wish button is gone and the cross has the focus
    let region = card.getByRole("region", { name: "Önskelista" });
    const close = region.getByRole("button", { name: "Fäll ihop önskelistan" });
    const rows = region.getByRole("group", { name: "Önskningar" });
    await expect(wishButton).toHaveCount(0);
    await expect(close).toBeFocused();
    await animationsDone(region);

    // MUPP-028-R1 R2: a 32 px circle, centred on the bottom edge line of the box, with a 44 px target, and the rows end above it
    const onTheLine = async (button: typeof close) => {
      const [box, rowsBox, buttonBox] = await Promise.all([settledBox(region), settledBox(rows), settledBox(button)]);
      expect(buttonBox.width).toBe(32);
      expect(buttonBox.height).toBe(32);
      expect(parseFloat(await css(button, "border-top-left-radius"))).toBeGreaterThanOrEqual(16);
      expect(Math.abs(buttonBox.x + buttonBox.width / 2 - (box.x + box.width / 2))).toBeLessThan(1);
      expect(Math.abs(buttonBox.y + buttonBox.height / 2 - (box.y + box.height))).toBeLessThan(1.5);
      expect(rowsBox.y + rowsBox.height).toBeLessThanOrEqual(buttonBox.y + 0.5);
      // The target reaches 22 px from the centre in every direction
      const [cx, cy] = [buttonBox.x + 16, buttonBox.y + 16];
      for (const [dx, dy] of [[-21, 0], [21, 0], [0, -21], [0, 21]]) {
        expect(await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest("button")?.id, [cx + dx, cy + dy])).toBe(await button.getAttribute("id"));
      }
      return buttonBox;
    };
    expect(await rows.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    const before = await onTheLine(close);
    // MUPP-034-R1: the cross, also on this card with one kid, which keeps its name "Fäll ihop önskelistan"
    const soloCross = await close.locator("path").getAttribute("d");
    await expectNoA11yViolations(page);

    // It stays in place when the list is scrolled, and at the end the last row is fully visible and can be pressed
    await rows.evaluate((el) => el.scrollTo(0, el.scrollHeight / 2));
    expect(await onTheLine(close)).toEqual(before);
    await rows.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    const last = region.getByRole("button", { name: "Önskning 30" });
    const [lastBox, rowsBox] = [await settledBox(last), await settledBox(rows)];
    expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(rowsBox.y + rowsBox.height + 0.5);
    await last.click();
    await expect(last).toHaveAttribute("aria-expanded", "true");

    // The focus ring from the keyboard is drawn in full: 3 px out from the button, inside the card
    await close.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(close).toHaveCSS("outline-width", "3px");
    const cardBox = await settledBox(card);
    expect(before.y + before.height + 6).toBeLessThanOrEqual(cardBox.y + cardBox.height);

    // MUPP-028-R3: marking the top wish of a long list shows "Paxa (1)" at once, in a fixed row under the rows, and it stays when the list scrolls
    await rows.evaluate((el) => el.scrollTo(0, 0));
    await region.getByRole("checkbox", { name: "Önskning 1", exact: true }).check();
    const claim = region.getByRole("button", { name: /^Paxa \(/ });
    await expect(claim).toBeInViewport({ ratio: 1 });
    const claimAt = await settledBox(claim);
    expect((await settledBox(rows)).y + (await settledBox(rows)).height).toBeLessThanOrEqual(claimAt.y + 0.5);
    await rows.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    expect(await settledBox(claim)).toEqual(claimAt);
    expect(await onTheLine(close)).toEqual(before);

    // It closes the list and unlocks the deck, with the focus back on the wish button
    await close.click();
    await expect(region).toHaveCount(0);
    await expect(wishButton).toBeFocused();
    await expect(page.getByRole("button", { name: "Nästa kort" })).toBeEnabled();

    // On the twins' card the button is the same cross in the same place and size, and its focus ring fits the card too
    await page.getByRole("button", { name: "Nästa kort" }).click();
    await animationsDone(card);
    await card.getByRole("button", { name: /^Önskelista för Alma/ }).click();
    region = card.getByRole("region", { name: "Önskelista" });
    await animationsDone(card);
    const cross = region.getByRole("button", { name: "Stäng önskelistan" });
    const crossBox = await onTheLine(cross);
    expect(await cross.locator("path").getAttribute("d")).toBe(soloCross);
    const twinsBox = await settledBox(card);
    expect(crossBox.y + crossBox.height + 6).toBeLessThanOrEqual(twinsBox.y + twinsBox.height);
    await expectNoA11yViolations(page);
  } finally {
    await clearFamily();
  }
});

test("MUPP-005-R1 R3 R4 R5 MUPP-027-R1 R2 R3 MUPP-028-R3 MUPP-006-R1 R2 the wish rows, the claim dialog and the unclaim dialog: marks, targets, contrast, focus and fit on a phone", async ({ page }) => {
  test.skip(!runsLocally, "needs its own kids in the local test database");
  await clearFamily();
  try {
    const parent = await addParent(uniqueName("Förälder"));
    const child = await addChild(parent, "Vera", birthdateIn(20).birthdate);
    await addWish(child, "birthday", "Cykel");
    await addWish(child, "birthday", "Strumpor", { unlimited: true });
    await addWish(child, "birthday", "Hoppborg", { claimedBy: "Moster Lisa" });
    await page.setViewportSize({ width: 375, height: 667 });
    await goto(page, "/");
    const card = page.getByRole("article");
    await animationsDone(card);
    await card.getByRole("button", { name: /^Önskelista/ }).click();
    const region = card.getByRole("region", { name: "Önskelista" });
    await animationsDone(region);

    // The marks are small muted text under the headline, readable on the card; the row buttons and checkboxes are 44 px targets
    const claimedMark = region.getByText("Paxad", { exact: true });
    expect(contrast(await css(claimedMark, "color"), await backgroundOf(claimedMark))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(await css(region.getByText("Kan köpas flera gånger", { exact: true }), "color"), await backgroundOf(region))).toBeGreaterThanOrEqual(4.5);
    // MUPP-019: the "Paxad" mark and the "Paxad av" line are orange-like (red above green and blue), and the info button is a 44 px target in the checkbox column
    expect(await css(claimedMark, "color")).toBe("rgb(227, 161, 95)");
    await region.getByRole("button", { name: /^Hoppborg/ }).click();
    const claimedBy = region.getByText("Paxad av Moster Lisa");
    expect(await css(claimedBy, "color")).toBe("rgb(227, 161, 95)");
    expect(contrast(await css(claimedBy, "color"), await backgroundOf(region))).toBeGreaterThanOrEqual(4.5);
    const info = await settledBox(region.getByRole("button", { name: "Kan köpas flera gånger", exact: true }));
    expect(info.width).toBeGreaterThanOrEqual(44);
    expect(info.height).toBeGreaterThanOrEqual(44);
    const tick = await settledBox(region.getByRole("checkbox", { name: "Cykel" }).locator(".."));
    expect(Math.abs(info.x + info.width / 2 - (tick.x + tick.width / 2))).toBeLessThan(2);

    // MUPP-027: the info button is the icon alone at rest, gets a round tint (the edge colour) while hovered, and does not move
    const infoButton = region.getByRole("button", { name: "Kan köpas flera gånger", exact: true });
    await expect(infoButton).toHaveCSS("border-top-width", "0px");
    await expect(infoButton).toHaveCSS("box-shadow", "none");
    await expect(infoButton).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    expect(contrast(await css(infoButton, "color"), await backgroundOf(region))).toBeGreaterThanOrEqual(4.5);
    // focus() alone does not show :focus-visible, so the focus arrives by the keyboard
    await infoButton.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(infoButton).toHaveCSS("outline-width", "3px");
    const beforeHover = await settledBox(infoButton);
    await infoButton.hover();
    await expect(infoButton).toHaveCSS("background-color", EDGE);
    await expect(infoButton).toHaveCSS("box-shadow", "none");
    expect(await css(infoButton, "border-top-left-radius")).not.toBe("0px");
    expect(await settledBox(infoButton)).toEqual(beforeHover);
    await page.mouse.move(0, 0);
    await infoButton.hover();
    await page.mouse.down();
    await expect(infoButton).toHaveCSS("background-color", EDGE);
    expect(await settledBox(infoButton)).toEqual(beforeHover);
    await page.mouse.up();
    await page.mouse.move(0, 0);
    const target = (locator: ReturnType<Page["locator"]>) => settledBox(locator);
    expect((await target(region.getByRole("button", { name: /^Cykel/ }))).height).toBeGreaterThanOrEqual(44);
    const tickTarget = await target(region.getByRole("checkbox", { name: "Cykel" }).locator(".."));
    expect(tickTarget.width).toBeGreaterThanOrEqual(44);
    expect(tickTarget.height).toBeGreaterThanOrEqual(44);

    // MUPP-028-R3: "Paxa" is a main button of 44 px, centred under the rows and above the arrow button, only while something is marked
    const claim = region.getByRole("button", { name: /^Paxa \(/ });
    await expect(claim).toHaveCount(0);
    await region.getByRole("checkbox", { name: "Cykel" }).check();
    const [claimBox, closeBox, rowsBox, regionBox] = [
      await target(claim),
      await target(region.getByRole("button", { name: "Fäll ihop önskelistan" })),
      await target(region.getByRole("group", { name: "Önskningar" })),
      await target(region),
    ];
    expect(claimBox.height).toBeGreaterThanOrEqual(44);
    expect(claimBox.y).toBeGreaterThanOrEqual(rowsBox.y + rowsBox.height - 0.5);
    expect(Math.abs(claimBox.x + claimBox.width / 2 - (regionBox.x + regionBox.width / 2))).toBeLessThan(1);
    expect(claimBox.y + claimBox.height).toBeLessThanOrEqual(closeBox.y + 0.5);
    await expect(claim).toHaveCSS("background-color", BRAND);

    // The dialog: a card on a dark backdrop, fits the phone, the name field has no focus ring after a tap and the ring after a key, the error is red text
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
    await expect(name).toHaveCSS("outline-style", "none");
    await page.keyboard.press("Shift");
    await expect(name).toHaveCSS("outline-width", "3px");
    await expect(name).toHaveCSS("outline-color", BRAND);
    expect((await target(name)).height).toBeGreaterThanOrEqual(44);
    expect((await target(dialog.getByRole("button", { name: "Paxa" }))).height).toBeGreaterThanOrEqual(44);
    await dialog.getByRole("button", { name: "Paxa" }).click();
    await expectTextMessage(dialog.getByRole("alert"), DANGER);
    expect(contrast(DANGER, CARD)).toBeGreaterThanOrEqual(4.5);
    await expectNoA11yViolations(page);
    // MUPP-045-R3 R4: the claim window is a form card, at the top with a cross
    await expectFormCardLooks(page, dialog);
    await page.keyboard.press("Escape");

    // MUPP-006-R1: the undo arrow on the claimed row is frameless like the info button, in the checkbox column, orange and readable
    const undo = region.getByRole("button", { name: "Ta bort paxningen på Hoppborg" });
    const undoBox = await target(undo);
    expect(undoBox.width).toBeGreaterThanOrEqual(44);
    expect(undoBox.height).toBeGreaterThanOrEqual(44);
    expect(Math.abs(undoBox.x + undoBox.width / 2 - (tick.x + tick.width / 2))).toBeLessThan(2);
    await expect(undo).toHaveCSS("border-top-width", "0px");
    await expect(undo).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    const arrowColour = await css(undo.locator("svg"), "color");
    expect(arrowColour).toBe("rgb(227, 161, 95)");
    expect(contrast(arrowColour, await backgroundOf(region))).toBeGreaterThanOrEqual(3);

    // MUPP-006-R2: on the narrowest phone the dialog fits and "Avbryt" and "Ta bort" stand side by side
    await page.setViewportSize({ width: 320, height: 640 });
    await undo.click();
    const unclaim = page.getByRole("alertdialog");
    await animationsDone(unclaim);
    await expect(unclaim).toHaveCSS("background-color", CARD);
    const unclaimBox = await settledBox(unclaim);
    expect(unclaimBox.x).toBeGreaterThanOrEqual(0);
    expect(unclaimBox.x + unclaimBox.width).toBeLessThanOrEqual(320);
    const [cancel, remove] = [await target(unclaim.getByRole("button", { name: "Avbryt" })), await target(unclaim.getByRole("button", { name: "Ta bort" }))];
    expect(cancel.height).toBeGreaterThanOrEqual(44);
    expect(remove.y).toBe(cancel.y);
    expect(remove.x).toBeGreaterThan(cancel.x + cancel.width);
    await expect(unclaim.getByRole("button", { name: "Ta bort" })).toHaveCSS("background-color", BRAND);
  } finally {
    await clearFamily();
  }
});

test("MUPP-023-R2 a wish title is on at most two lines with an ellipsis and smaller when long, and the opened row shows all of it", async ({ page }) => {
  test.skip(!runsLocally, "needs its own kids in the local test database");
  await clearFamily();
  try {
    const long = "Ett ganska långt önskemål med många ord som aldrig får plats på en enda rad i listan på en telefon ".repeat(2).trim().slice(0, 120);
    const child = await addChild(await addParent(uniqueName("Förälder")), "Vera", birthdateIn(20).birthdate);
    await addWish(child, "birthday", "Cykel");
    await addWish(child, "birthday", long);
    await page.setViewportSize({ width: 375, height: 667 });
    await goto(page, "/");
    const card = page.getByRole("article");
    await animationsDone(card);
    await card.getByRole("button", { name: /^Önskelista/ }).click();
    const region = card.getByRole("region", { name: "Önskelista" });
    await animationsDone(region);

    const short = region.getByRole("button", { name: "Cykel" }).getByText("Cykel", { exact: true });
    const title = region.getByRole("button", { name: long }).getByText(long, { exact: true });
    const lines = async () => Math.round((await settledBox(title)).height / parseFloat(await css(title, "line-height")));
    // A short title is as before: one line at the body size; a long one is smaller and cut after two lines with an ellipsis
    expect(await css(short, "font-size")).toBe("16px");
    expect(parseFloat(await css(title, "font-size"))).toBeLessThan(16);
    expect(await lines()).toBe(2);
    expect(await title.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);

    // The opened row shows the whole title
    await region.getByRole("button", { name: long }).click();
    expect(await lines()).toBeGreaterThan(2);
    expect(await title.evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(true);
    await expectNoA11yViolations(page);
  } finally {
    await clearFamily();
  }
});

// One test per phone size, to stay within the time budget of a test
for (const viewport of [{ width: 320, height: 568 }, { width: 375, height: 667 }]) {
  test(`MUPP-014-R2 R3 R4 R6 MUPP-015-R1 R4 MUPP-030-R1 R2 R3 the sizes buttons, Tillbaka and the top of an open kid view at ${viewport.width} × ${viewport.height}: 44 px, between the age and the wish button, 70-80 % for the wish button beside the icon, in the corners of an open kid view with the date between them, no chip or age, a small picture with the name on one line, and no scroll or overlap`, async ({ page }) => {
    test.skip(!runsLocally, "needs its own kids in the local test database");
    await clearFamily();
    try {
      const parent = await addParent(uniqueName("Förälder"));
      const { birthdate, date } = birthdateIn(20);
      // The long name is first among the twins, so its open view is the one measured
      await addChild(parent, "Maximiliana-Charlotte", birthdate);
      await addChild(parent, "Vera", birthdate);
      // Ensam has a card of her own, the twins share another (the chip on the nearest card with one kid is in the MUPP-004 test)
      await addChild(parent, "Ensam", "2018-02-02");
      const card = page.getByRole("article");
      const noScroll = () => page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight && document.documentElement.scrollWidth <= window.innerWidth);

      // MUPP-015-R1 R4: Tillbaka is in the top left corner, 44 px, clear of the heading, the picture and the icon, as an icon with readable colour
      const expectBack = async (name: string) => {
        const back = card.getByRole("button", { name });
        const [box, cardBox, heading, picture, icon] = [
          await settledBox(back),
          await settledBox(card),
          await settledBox(card.getByRole("heading", { level: 2 })),
          await settledBox(card.locator(".ring-child")),
          await settledBox(card.getByRole("button", { name: "Storlekar", exact: true })),
        ];
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.x - cardBox.x).toBeLessThan(20);
        expect(box.y - cardBox.y).toBeLessThan(20);
        expect(inside(box, cardBox)).toBe(true);
        for (const other of [heading, picture, icon]) expect(disjoint(box, other)).toBe(true);
        // the heading stays centred in the card
        expect(Math.abs(heading.x + heading.width / 2 - (cardBox.x + cardBox.width / 2))).toBeLessThan(1);
        expect(contrast(await css(back, "color"), await backgroundOf(back))).toBeGreaterThanOrEqual(4.5);
      };

      // MUPP-030-R1 R2 R3: no chip and no age line; a 40 px picture with the name on one line to its right, the two centred;
      // the date centred on the row of the corner buttons and clear of them
      const chipAndAge = card.getByText(/^(Nästa födelsedag|Nästa: Julafton|Fyller \d+ år|Beräknad .*)$/);
      const expectOpenTop = async (name: string) => {
        await expect(chipAndAge).toHaveCount(0);
        const heading = card.getByRole("heading", { level: 3, name });
        const [picture, nameBox, date, corner, cardBox] = [
          await settledBox(card.locator(".ring-child")),
          await settledBox(heading),
          await settledBox(card.getByRole("heading", { level: 2 })),
          await settledBox(card.getByRole("button", { name: "Storlekar", exact: true })),
          await settledBox(card),
        ];
        const middle = (box: { y: number; height: number }) => box.y + box.height / 2;
        expect(picture.width).toBeCloseTo(40, 0);
        expect(nameBox.x).toBeGreaterThanOrEqual(picture.x + picture.width);
        expect(Math.abs(middle(nameBox) - middle(picture))).toBeLessThan(2);
        expect(Math.abs((picture.x + nameBox.x + nameBox.width) / 2 - (cardBox.x + cardBox.width / 2))).toBeLessThan(1);
        // One line, all of it shown, inside the card
        expect(nameBox.height).toBeLessThan(40);
        expect(await heading.locator("span").evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
        expect(inside(nameBox, cardBox)).toBe(true);
        expect(Math.abs(middle(date) - middle(corner))).toBeLessThan(1);
        expect(disjoint(date, corner)).toBe(true);
      };

      await page.setViewportSize(viewport);
      await goto(page, "/");
      await animationsDone(card);

      // The twins' card: the wish button takes 70-80 % of the two buttons together, both 44 px high, on one line
      await toCard(page, date);
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
      await expectBack("Tillbaka till alla barn");
      await expectOpenTop("Maximiliana-Charlotte");
      await region.getByRole("button", { name: /^Stäng/ }).click();

      // The single kid card: the button is between the age and the wish button
      await toCard(page, "2 februari");
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
      await expectOpenTop("Ensam");
      await expectNoA11yViolations(page);
      await region.getByRole("button", { name: "Fäll ihop önskelistan" }).click();

      // Christmas Eve: the kid view has the corner icon, clear of the heading
      await toCard(page, "Julafton");
      await card.getByRole("button", { name: /^Öppna Vera/ }).click();
      await expect(card.getByRole("region", { name: "Önskelista" })).toBeVisible();
      corner = await settledBox(card.getByRole("button", { name: "Storlekar" }));
      expect(corner.width).toBeGreaterThanOrEqual(44);
      expect(disjoint(corner, await settledBox(card.getByRole("heading", { level: 2 })))).toBe(true);
      expect(await noScroll()).toBe(true);
      await expectBack("Tillbaka till Julafton");
      await expectOpenTop("Vera");
    } finally {
      await clearFamily();
    }
  });
}

// One test per phone size, as above
for (const viewport of [{ width: 320, height: 568 }, { width: 375, height: 667 }]) {
  test(`TECH-013-R1 R2 R3 R4 R5 R6 the closed cards at ${viewport.width} × ${viewport.height}: the name leads over a smaller date, a one-line chip, a round picture, Storlekar clear of the wish button, arrows clear of three kids' buttons, and a shrunk name that grows back`, async ({ page }) => {
    test.skip(!runsLocally, "needs its own kids in the local test database");
    await clearFamily();
    try {
      const parent = await addParent(uniqueName("Förälder"));
      // Ensam has the nearest card, with the chip; the twins (one with a long name) and three kids share a card each
      const ensam = birthdateIn(0);
      await addChild(parent, "Ensam", ensam.birthdate);
      const twins = birthdateIn(20);
      for (const name of ["Maximiliana-Charlotte", "Vera"]) await addChild(parent, name, twins.birthdate);
      const three = birthdateIn(40);
      for (const name of ["Alva", "Bo", "Cilla"]) await addChild(parent, name, three.birthdate);
      const card = page.getByRole("article");
      const fontSize = async (locator: Locator) => parseFloat(await css(locator, "font-size"));
      await page.setViewportSize(viewport);
      await goto(page, "/");
      await animationsDone(card);

      // R1: on the closed card with one kid the name leads (text-3xl) and the date above it is a smaller label
      const nameSize = await fontSize(card.getByRole("heading", { level: 3 }));
      expect(nameSize).toBe(30);
      expect(await fontSize(card.getByRole("heading", { level: 2 }))).toBeLessThan(nameSize);
      // R2 R4: the chip is on one line with both stars, clear of the picture, and the picture is round
      const chip = card.getByText("Nästa födelsedag").locator("..");
      const [chipBox, picture] = [await settledBox(chip), await settledBox(card.locator(".ring-child"))];
      expect(chipBox.height).toBeLessThan(40);
      await expect(chip.getByText("✦")).toHaveCount(2);
      expect(disjoint(chipBox, picture)).toBe(true);
      expect(Math.abs(picture.width - picture.height)).toBeLessThanOrEqual(1);
      // R3: Storlekar and the wish button are clear of each other, 44 px high and inside the card
      const [sizes, wish, cardBox] = [await settledBox(card.getByRole("button", { name: "Storlekar" })), await settledBox(card.getByRole("button", { name: /^Önskelista/ })), await settledBox(card)];
      for (const button of [sizes, wish]) {
        expect(button.height).toBeGreaterThanOrEqual(44);
        expect(inside(button, cardBox)).toBe(true);
      }
      expect(disjoint(sizes, wish)).toBe(true);
      if (viewport.width === 320) await expectNoA11yViolations(page);

      // R6: the long name has shrunk at 320 px, and grows back to its full size on a wider screen (the phone turned)
      if (viewport.width === 320) {
        await toCard(page, twins.date);
        const longName = card.getByText("Maximiliana-Charlotte", { exact: true });
        expect(await fontSize(longName)).toBeLessThan(18);
        await page.setViewportSize({ width: 568, height: 320 });
        await expect.poll(() => fontSize(longName)).toBe(18);
        expect(await longName.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
        await page.setViewportSize(viewport);
      }

      // R5: on the card with three kids the arrows, 44 px and on the screen, are clear of every kid's buttons
      await toCard(page, three.date);
      const arrows = [await settledBox(page.getByRole("button", { name: "Föregående kort" })), await settledBox(page.getByRole("button", { name: "Nästa kort" }))];
      for (const arrow of arrows) {
        expect(arrow.width).toBeGreaterThanOrEqual(44);
        expect(arrow.x).toBeGreaterThanOrEqual(0);
        expect(arrow.x + arrow.width).toBeLessThanOrEqual(viewport.width);
      }
      for (let i = 0; i < 3; i++) {
        const buttons = [card.getByRole("button", { name: /^Önskelista för / }).nth(i), card.getByRole("button", { name: /^Storlekar för / }).nth(i)];
        await buttons[0].scrollIntoViewIfNeeded();
        for (const button of buttons) {
          const box = await settledBox(button);
          for (const arrow of arrows) expect(disjoint(box, arrow)).toBe(true);
        }
      }
      if (viewport.width === 320) await expectNoA11yViolations(page);
    } finally {
      await clearFamily();
    }
  });
}

test("MUPP-020-R1 R2 the card heading with a long date and the expected date fit on the narrowest phone", async ({ page }) => {
  test.skip(!runsLocally, "needs its own kids in the local test database");
  await clearFamily();
  try {
    const parent = await addParent(uniqueName("Förälder"));
    const today = swedishToday();
    const due = new Date(Date.UTC(today.year, today.month - 1 + 4, 29)).toISOString().slice(0, 10);
    await addChild(parent, "Alma", "2018-09-29");
    await addChild(parent, "Alva", "2018-09-29");
    await addChild(parent, "Väntad", due);
    await page.setViewportSize({ width: 320, height: 568 });
    await goto(page, "/");
    const card = page.getByRole("article");
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      await animationsDone(card);
      const heading = card.getByRole("heading", { level: 2 });
      seen.push(await heading.innerText());
      // One line: a heading of two lines would push the card down on a short phone
      expect((await settledBox(heading)).height).toBeLessThan(40);
      for (const text of [heading, card.getByText(/^Beräknad \d+ \p{L}+$/u)]) {
        if ((await text.count()) > 0) expect(await text.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      }
      if (seen.at(-1) === "29 september") {
        await expectNoA11yViolations(page);
        // The open kid view has icons in both top corners; the heading stays clear of them
        await card.getByRole("button", { name: "Önskelista för Alma" }).click();
        const openHeading = await settledBox(card.getByRole("heading", { level: 2 }));
        for (const name of ["Tillbaka till alla barn", "Storlekar"]) {
          const icon = await settledBox(card.getByRole("button", { name, exact: true }));
          expect(icon.x + icon.width <= openHeading.x + 0.5 || openHeading.x + openHeading.width <= icon.x + 0.5).toBe(true);
        }
        await card.getByRole("button", { name: "Tillbaka till alla barn" }).click();
      }
      await page.getByRole("button", { name: "Nästa kort" }).click();
    }
    expect(seen).toContain("29 september");
    expect(await hasHorizontalScroll(page)).toBe(false);
  } finally {
    await clearFamily();
  }
});

test("MUPP-035-R6 MUPP-036-R2 the dialog Så funkar listorna on the narrowest phone: it fits, its panel scrolls inside it, an arrow shows there is more until the end, and the buttons are 44 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await goto(page, "/");
  // The signed-in test visitor has the cookie, so the dialog is opened from the menu
  await page.getByRole("button", { name: "Meny" }).click();
  await page.getByRole("button", { name: "Så funkar listorna" }).click();
  const dialog = page.getByRole("dialog", { name: "Så funkar listorna" });
  await expect(dialog).toBeVisible();
  const box = await settledBox(dialog);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(320);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(568);
  for (const name of ["Besökare", "Förälder", "Läs vidare"]) {
    const button = dialog.getByRole(name === "Läs vidare" ? "button" : "tab", { name });
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  // The panel is what scrolls when the text does not fit
  const panel = dialog.getByRole("tabpanel");
  expect(await panel.evaluate((el) => el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY === "auto")).toBe(true);
  await expectNoA11yViolations(page);
  // MUPP-036-R2: the arrow stands in for OK while there is more text, and the last scroll turns it into OK
  await expect(dialog.getByRole("button", { name: "OK" })).toHaveCount(0);
  await expect(async () => {
    const arrow = dialog.getByRole("button", { name: "Läs vidare" });
    if (await arrow.count()) await arrow.click();
    await expect(dialog.getByRole("button", { name: "OK" })).toBeVisible({ timeout: 500 });
  }).toPass();
  // Another tab starts at the top again
  await dialog.getByRole("tab", { name: "Förälder" }).click();
  expect(await panel.evaluate((el) => el.scrollTop)).toBe(0);
});

// MUPP-047-R1, MUPP-048-R8: Tillbaka is in the top left corner, 44 px, clear of the menu button and the heading
async function expectBackInCorner(page: Page, control = page.getByRole("link", { name: "Tillbaka" })) {
  const back = await settledBox(control);
  expect(back.height).toBeGreaterThanOrEqual(44);
  expect(back.width).toBeGreaterThanOrEqual(44);
  expect(back.x).toBeLessThan(24);
  expect(back.y).toBeLessThan(24);
  for (const other of [page.getByRole("button", { name: "Meny" }), page.getByRole("heading", { level: 1 })]) expect(disjoint(back, await settledBox(other))).toBe(true);
}

test("MUPP-039-R3 R4b the member grid on a 375 x 667 phone: eight names, two per row, all visible without scrolling and 44 px high; the sign-in form fits", async ({ page }) => {
  test.skip(!runsLocally, "needs the local test database");
  await clearSanta();
  const family = await addSantaEvent("Familjen Ek");
  for (let i = 1; i <= 8; i++) await addSantaMember(family, `Person Nummer${i}`, `070000${String(i).padStart(4, "0")}`, `person${i}@exempel.invalid`);
  try {
    await page.setViewportSize({ width: 375, height: 667 });
    await goto(page, "/secret-santa");
    const tiles = await page.getByRole("list").getByRole("link").all();
    expect(tiles).toHaveLength(8);
    const boxes = [];
    for (const tile of tiles) boxes.push(await settledBox(tile));
    for (const box of boxes) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.y + box.height).toBeLessThanOrEqual(667);
      expect(box.x + box.width).toBeLessThanOrEqual(375);
    }
    // Two per row: four distinct rows, two tiles side by side in each
    expect(new Set(boxes.map((b) => Math.round(b.y))).size).toBe(4);
    for (let i = 0; i < 8; i += 2) expect(disjoint(boxes[i], boxes[i + 1])).toBe(true);
    expect(await hasHorizontalScroll(page)).toBe(false);
    await expectNoA11yViolations(page);
    // MUPP-048-R8: the names step has the same Tillbaka (it goes to the start page with one group), and no "Byt grupp" text button
    await expectBackInCorner(page);
    await expect(page.getByRole("link", { name: "Tillbaka" })).toHaveAttribute("href", "/");

    await tiles[0].click();
    await expect(page.getByLabel("Ditt telefonnummer")).toBeVisible();
    // The radio buttons are as large as their labels, and the field and button as the other forms'
    const controls = [page.locator("label").filter({ hasText: /^Telefon$/ }), page.locator("label").filter({ hasText: /^E-post$/ }), page.getByLabel("Ditt telefonnummer"), page.getByRole("button", { name: "Fortsätt" })];
    for (const control of controls) expect((await settledBox(control)).height).toBeGreaterThanOrEqual(44);
    await expectBackInCorner(page);
    expect(await hasHorizontalScroll(page)).toBe(false);

    // MUPP-048-R4: with several groups the entrance lists them, 44 px high and within the width; no Tillbaka there
    await addSantaEvent("Familjen Ask");
    await goto(page, "/secret-santa");
    const groups = await page.getByRole("list").getByRole("link").all();
    expect(groups).toHaveLength(2);
    for (const group of groups) {
      const box = await settledBox(group);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x + box.width).toBeLessThanOrEqual(375);
    }
    await expect(page.getByRole("link", { name: "Tillbaka" })).toHaveCount(0);
    expect(await hasHorizontalScroll(page)).toBe(false);
    await expectNoA11yViolations(page);
  } finally {
    await clearSanta();
  }
});

test("MUPP-040-R1 R2 MUPP-053-R1 MUPP-055-R1 the Secret Santa wish list on a 375 x 667 phone: long titles wrap, icon buttons are 32 px, the plus is 44 px, the form fits the width, and the own page has the cross (one group) or the arrow (several) in the corner like the entrance", async ({ page }) => {
  test.skip(!runsLocally, "needs the local test database");
  await clearSanta();
  const family = await addSantaEvent("Familjen Ek");
  const member = await addSantaMember(family, "Anna Ek", "0700004444", "anna@exempel.invalid");
  await addSantaWish(member, "En mycket lång önskning med många ord som måste radbrytas");
  await addSantaWish(member, "Bok");
  try {
    await page.setViewportSize({ width: 375, height: 667 });
    await santaSignIn(page, member);
    await goto(page, "/secret-santa/min-sida/onskelista");
    await expect(page.getByRole("heading", { level: 2, name: "Din önskelista i Familjen Ek" })).toBeVisible();
    expect(await hasHorizontalScroll(page)).toBe(false);
    for (const name of [/^Ändra /, /^Ta bort /]) {
      for (const button of await page.getByRole("button", { name }).all()) expect((await settledBox(button)).height).toBeGreaterThanOrEqual(32);
    }
    expect((await settledBox(page.getByRole("button", { name: "Ny önskning" }))).height).toBeGreaterThanOrEqual(44);
    await page.getByRole("button", { name: "Ny önskning" }).click();
    for (const field of ["Namn", "Storlek", "Beskrivning", "Länk"]) {
      const box = await settledBox(page.getByLabel(field));
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x + box.width).toBeLessThanOrEqual(375);
    }
    expect((await settledBox(page.getByRole("button", { name: "Lägg till" }))).height).toBeGreaterThanOrEqual(44);
    expect(await hasHorizontalScroll(page)).toBe(false);
    await expectNoA11yViolations(page);

    // MUPP-055-R1: one group gives the cross, several the arrow, both 44 px in the same corner as the entrance's Tillbaka
    await goto(page, "/secret-santa/min-sida"); // the wish list is a page of its own since MUPP-051
    await expectBackInCorner(page, page.getByRole("link", { name: "Stäng" }));
    await addSantaEvent("Familjen Ask");
    await goto(page, "/secret-santa/min-sida");
    await expectBackInCorner(page, page.getByRole("button", { name: "Tillbaka" }));
  } finally {
    await clearSanta();
  }
});

test("MUPP-051-R2 R6 MUPP-057-R1 R2 R3 R4 R5 the Secret Santa status on a 375 x 667 phone: the match card is grey and says why, the list card is 44 px, the two cards are equal with aligned symbols, centred text and a divider in the gap, and the toggle Aktiv and its question fit the width", async ({ page }) => {
  test.skip(!runsLocally, "needs the local test server");
  await clearFamily();
  await clearSanta();
  const owner = uniqueName("Emma");
  const ownerId = await addParent(owner);
  const family = await addSantaEvent("Familjen Ek", ownerId, "inactive");
  const member = await addSantaMember(family, "Anna Ek", "0700004444", "anna@exempel.invalid");
  try {
    await page.setViewportSize({ width: 375, height: 667 });
    // The preparing page: two cards, the second without a link and with its reason in text and in a readable orange
    await setSantaStatus(family, "preparing");
    await santaSignIn(page, member);
    await goto(page, "/secret-santa/min-sida");
    expect((await settledBox(page.getByRole("link", { name: "Min önskelista" }))).height).toBeGreaterThanOrEqual(44);
    const reason = page.getByText("Inte tilldelad än");
    expect(contrast(await css(reason, "color"), await backgroundOf(reason))).toBeGreaterThanOrEqual(4.5);
    expect(await hasHorizontalScroll(page)).toBe(false);
    // MUPP-057-R1 R2 R3 R4, at 375 px and then at 320 px: equal cards, symbols and text centred in height, one divider in the gap
    const link = page.getByRole("link", { name: "Min önskelista" });
    const grey = page.getByRole("heading", { level: 2, name: "Min matchnings önskelista" }).locator("xpath=ancestor::*[contains(@class,'border-dashed')][1]");
    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 667 });
      const [a, b] = await Promise.all([settledBox(link.locator("xpath=..")), settledBox(grey)]);
      expect(Math.abs(a.width - b.width)).toBeLessThan(1);
      expect(Math.abs(a.height - b.height)).toBeLessThan(1);
      const centreY = (box: Box) => box.y + box.height / 2;
      for (const [card, symbol, text] of [
        [a, link.locator("svg"), link.getByRole("heading")],
        [b, grey.locator("svg"), grey.locator("div")],
      ] as const) {
        const [s, t] = await Promise.all([settledBox(symbol), settledBox(text)]);
        expect(Math.abs(centreY(s) - centreY(card))).toBeLessThan(1);
        expect(Math.abs(centreY(t) - centreY(card))).toBeLessThan(1);
        expect(s.x - card.x).toBeCloseTo(17, 0); // the border and 1 rem of padding, the same in both cards
        expect(s.width).toBe(18);
      }
      // 60 % of the card width, 1 px thick, halfway down the gap, in the muted colour at 45 % (the divider-short style of MUPP-013)
      const line = await page.locator("li.divider-short").nth(1).evaluate((li) => {
        const style = getComputedStyle(li, "::before");
        return { width: parseFloat(style.width), height: parseFloat(style.height), top: parseFloat(style.top) };
      });
      expect(line.height).toBe(1);
      expect(Math.abs(line.width - a.width * 0.6)).toBeLessThan(1);
      expect(Math.abs(line.top + (b.y - (a.y + a.height)) / 2)).toBeLessThan(1);
    }
    await expectNoA11yViolations(page);
    await page.setViewportSize({ width: 375, height: 667 });
    // The started page has one card and no divider
    await setSantaStatus(family, "started");
    await goto(page, "/secret-santa/min-sida");
    await expect(page.getByRole("link", { name: "Min önskelista" })).toBeVisible();
    await expect(page.locator("li.divider-short")).toHaveCount(1);
    expect(await page.locator("li.divider-short").evaluate((li) => getComputedStyle(li, "::before").content)).toBe("none");
    await expectNoA11yViolations(page);
    await setSantaStatus(family, "preparing");

    // The admin: the status with its button, and the question inside the screen
    await setSantaStatus(family, "inactive");
    await adminSignIn(page, owner);
    await page.getByRole("tab", { name: "Secret Santa" }).click();
    const activate = page.getByRole("switch", { name: "Aktiv Familjen Ek" });
    expect((await settledBox(activate)).height).toBeGreaterThanOrEqual(44);
    // Under the plus button of the group, and centred in the screen (the centred proposal of MUPP-051-R2)
    const [toggleBox, plusBox] = [await settledBox(activate), await settledBox(page.getByRole("button", { name: "Ny person i Familjen Ek" }))];
    expect(toggleBox.y).toBeGreaterThanOrEqual(plusBox.y + plusBox.height);
    expect(Math.abs(toggleBox.x + toggleBox.width / 2 - 187.5)).toBeLessThan(8);
    expect(await hasHorizontalScroll(page)).toBe(false);
    await activate.click();
    const question = page.getByRole("alertdialog", { name: "Är du säker?" });
    expect(inside(await settledBox(question), { x: 0, y: 0, width: 375, height: 667 })).toBe(true);
    await expectNoA11yViolations(page);
  } finally {
    await clearSanta();
    await clearFamily();
  }
});
