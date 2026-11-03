import { expect, test, type Locator, type Page } from "@playwright/test";
import { addChild, addParent, addWish, clearFamily } from "./family-db";
import { animationsDone, birthdateIn, expectNoA11yViolations, goto, pageAnimationsDone, runsLocally, settledBox, uniqueName } from "./helpers";

// De här testen gör egna barn i testdatabasen, så de körs bara lokalt
test.skip(!runsLocally, "needs the local test database");

// Hur rörelsen ser ut (kurva, exakta mått) testas inte, bara att den finns, börjar och slutar på rätt plats och att läget är rätt efteråt

const card = (page: Page) => page.getByRole("article");
const region = (page: Page) => card(page).getByRole("region", { name: "Önskelista" });
// Kopian som rör sig när en lista stängs (transition.ts): ligger i body, inert och dold för skärmläsare
const ghost = (page: Page) => page.locator("body > [inert][aria-hidden=true]");

test.beforeEach(async () => {
  await clearFamily();
});
test.afterAll(async () => {
  await clearFamily();
});

async function seed(page: Page, kids: string[]) {
  const parent = await addParent(uniqueName("Förälder"));
  const { birthdate } = birthdateIn(20);
  const ids = [];
  for (const name of kids) ids.push(await addChild(parent, name, birthdate));
  for (const title of ["Cykel", "Pussel"]) {
    await addWish(ids[0], "birthday", title);
    await addWish(ids[0], "christmas", title);
  }
  await page.setViewportSize({ width: 375, height: 667 });
  await goto(page, "/");
  await animationsDone(card(page));
}
const oneKid = (page: Page) => seed(page, ["Vera"]);
const twoKids = (page: Page) => seed(page, ["Vera", "Vilda"]);

async function toChristmas(page: Page) {
  for (let i = 0; i < 4 && (await card(page).getByRole("heading", { level: 2 }).innerText()) !== "Julafton"; i++) {
    await page.getByRole("button", { name: "Nästa kort" }).click();
    await animationsDone(card(page));
  }
}

// Rutan (x, y, bredd, höjd) som en clip-path: inset(...) pekar ut i ett element av en viss storlek. Första och sista bildrutan i animationen på el
async function clips(el: Locator) {
  return el.evaluate((node) => {
    const { width, height } = node.getBoundingClientRect();
    const clip = node.getAnimations().flatMap((a) => (a.effect as KeyframeEffect).getKeyframes()).flatMap((k) => (k.clipPath ? [String(k.clipPath)] : []));
    return { clip, width, height };
  });
}
function cutOut(clipPath: string, width: number, height: number) {
  const [top, right, bottom, left] = (clipPath.replace(/ round.*/, "").match(/-?[\d.]+(?=px)/g) ?? []).map(Number);
  return { x: left, y: top, width: width - left - right, height: height - top - bottom };
}
// Utsnittet ska ligga där knappen satt (båda i sidans koordinater), med kortets övre vänstra hörn som nollpunkt
type Box = { x: number; y: number; width: number; height: number };
function expectCutOut(clipPath: string, size: { width: number; height: number }, button: Box, cardBox: Box) {
  const cut = cutOut(clipPath, size.width, size.height);
  for (const [got, want] of [[cut.x, button.x - cardBox.x], [cut.y, button.y - cardBox.y], [cut.width, button.width], [cut.height, button.height]]) expect(got).toBeCloseTo(want, 0);
}

// Den stängda vyn krymper (MUPP-022): sista bildrutan flyttar och skalar kopian från vyns ruta till knappens
async function shrunkTo(el: Locator, button: Box, view: Box) {
  const transform = await el.evaluate((node) => String(node.getAnimations().flatMap((a) => (a.effect as KeyframeEffect).getKeyframes()).findLast((k) => k.transform)?.transform));
  const [dx, dy, sx, sy] = (transform.match(/-?[\d.]+(?=px|,|\))/g) ?? []).map(Number);
  for (const [got, want] of [[dx, button.x - view.x], [dy, button.y - view.y], [sx, button.width / view.width], [sy, button.height / view.height]]) expect(got).toBeCloseTo(want, 1);
}

test("MUPP-016-R1 the single kid list slides up, ends in place and is usable", async ({ page }) => {
  await oneKid(page);
  await card(page).getByRole("button", { name: "Önskelista", exact: true }).click();
  // Glider upp och tonar in, och den gamla utrullningen uppifrån används inte längre
  const names = await region(page).evaluate((el) => el.getAnimations().map((a) => (a as CSSAnimation).animationName));
  expect(names).toEqual(["wish-slide"]);
  await animationsDone(card(page));
  await expect(region(page)).toBeVisible();
  await expect(region(page).getByRole("button", { name: "Cykel" })).toBeVisible();
  await expect(card(page).getByRole("button", { name: "Fäll ihop önskelistan" })).toBeFocused();
  expect(await region(page).evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).isIdentity)).toBe(true);
  await region(page).getByRole("button", { name: "Cykel" }).click();
  await expect(region(page).getByText("Beskrivning").or(region(page).getByRole("button", { name: "Cykel", expanded: true }))).toBeVisible();
  await expectNoA11yViolations(page);
});

test("MUPP-016-R2 the single kid list slides down when closed, and can be opened again at once", async ({ page }) => {
  await oneKid(page);
  const open = card(page).getByRole("button", { name: "Önskelista", exact: true });
  await open.click();
  await animationsDone(card(page));
  await card(page).getByRole("button", { name: "Fäll ihop önskelistan" }).click();
  // Listan är stängd och knappen är tillbaka med fokus; det som glider ner är en kopia
  await expect(region(page)).toHaveCount(0);
  await expect(open).toBeFocused();
  await expect(ghost(page)).toHaveCount(1);
  expect(await ghost(page).evaluate((el) => el.getAnimations().length)).toBe(2); // rörelsen och tonandet (MUPP-025)
  await pageAnimationsDone(page);
  await expect(ghost(page)).toHaveCount(0);
  await expectNoA11yViolations(page);

  // Esc stänger på samma sätt, och ett nytt tryck medan den glider ner öppnar listan igen
  await open.click();
  await animationsDone(card(page));
  await page.keyboard.press("Escape");
  await expect(ghost(page)).toHaveCount(1);
  await open.click();
  await expect(ghost(page)).toHaveCount(0);
  await expect(region(page)).toBeVisible();
  await expect(region(page)).toHaveCount(1);
});

for (const kind of ["birthday", "christmas"] as const) {
  const name = kind === "birthday" ? "the card with several kids" : "the Christmas card";
  test(`MUPP-016-R3 R4 ${name}: the kid's view grows from the pressed button and shrinks back to it`, async ({ page }) => {
    await twoKids(page);
    if (kind === "christmas") await toChristmas(page);
    const open = card(page).getByRole("button", { name: kind === "birthday" ? "Önskelista för Vera" : /^Öppna Vera/ });
    const [button, before] = [await settledBox(open), await settledBox(card(page))];

    // R3: vyn börjar på knappens plats och storlek och växer till hela kortet
    await open.click();
    const grow = await clips(card(page));
    const [from, to] = grow.clip;
    expectCutOut(from, grow, button, before);
    expect(to).toMatch(/^inset\(0px round/);
    await animationsDone(card(page));
    await expect(region(page)).toBeVisible();
    await expect(card(page).getByRole("heading", { level: 3, name: "Vera" })).toBeVisible();
    await expect(card(page).getByRole("button", { name: /^Tillbaka/ })).toBeVisible();
    await expect(card(page).getByRole("button", { name: /^Stäng/ })).toBeVisible();
    await expect(card(page).getByRole("button", { name: /^Storlekar/ })).toBeVisible();
    expect((await clips(card(page))).clip).toEqual([]); // inget som växer är kvar (kortets egen inton ligger kvar i sitt slutläge)
    await expectNoA11yViolations(page);

    // R4: stänger man med Stäng, Tillbaka eller Esc krymper vyn tillbaka till knappen, och fokus är på den
    const closers = [
      () => region(page).getByRole("button", { name: /^Stäng/ }).click(),
      () => card(page).getByRole("button", { name: /^Tillbaka/ }).click(),
      () => page.keyboard.press("Escape"),
    ];
    for (const [i, closeView] of closers.entries()) {
      const view = await settledBox(card(page));
      await closeView();
      await expect(region(page)).toHaveCount(0);
      await expect(open).toBeFocused();
      await expect(ghost(page)).toHaveCount(1);
      await shrunkTo(ghost(page), button, view);
      await pageAnimationsDone(page);
      await expect(ghost(page)).toHaveCount(0);
      // Det stängda läget är detsamma efter alla tre, så axe körs en gång (TECH-014)
      if (i === 0) await expectNoA11yViolations(page);
      await open.click();
      await animationsDone(card(page));
    }

    // R4: ändras fönstret medan vyn är öppen krymper den till där knappen nu sitter (läget mäts när den stängs)
    await page.setViewportSize({ width: 360, height: 740 });
    await animationsDone(card(page));
    const moved = await settledBox(card(page));
    await page.keyboard.press("Escape");
    await shrunkTo(ghost(page), await settledBox(open), moved);
    await expect(ghost(page)).toHaveCount(0);
  });
}

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  // Övergångar av färg (ett tryck som mörknar knappen) är ingen rörelse; det som inte får finnas är animationer
  const noMotion = (page: Page) => page.evaluate(() => document.getAnimations().filter((a) => !(a instanceof CSSTransition)).map((a) => (a as CSSAnimation).animationName ?? "web-animation"));

  test("MUPP-016-R5 the single kid list opens and closes at once, without movement", async ({ page }) => {
    await oneKid(page);
    await card(page).getByRole("button", { name: "Önskelista", exact: true }).click();
    await expect(region(page)).toBeVisible();
    expect(await noMotion(page)).toEqual([]);
    await card(page).getByRole("button", { name: "Fäll ihop önskelistan" }).click();
    await expect(region(page)).toHaveCount(0);
    await expect(ghost(page)).toHaveCount(0);
    expect(await noMotion(page)).toEqual([]);
  });

  for (const kind of ["birthday", "christmas"] as const) {
    test(`MUPP-016-R5 the kid's view on the ${kind} card opens and closes at once, without movement`, async ({ page }) => {
      await twoKids(page);
      if (kind === "christmas") await toChristmas(page);
      const open = card(page).getByRole("button", { name: kind === "birthday" ? "Önskelista för Vera" : /^Öppna Vera/ });
      await open.click();
      await expect(region(page)).toBeVisible();
      expect(await noMotion(page)).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(region(page)).toHaveCount(0);
      await expect(open).toBeFocused();
      await expect(ghost(page)).toHaveCount(0);
      expect(await noMotion(page)).toEqual([]);
    });
  }
});

test("MUPP-016-R6 the transitions never get in the way: double press and press during motion", async ({ page }) => {
  await oneKid(page);
  const open = card(page).getByRole("button", { name: "Önskelista", exact: true });

  // Två snabba tryck: det andra träffar det som ligger under, som utan rörelse (pilen som fäller ihop ligger där knappen låg).
  // Listan är öppen eller stängd, aldrig två gånger eller halvvägs, och inget ligger kvar när rörelsen är slut
  await open.dblclick();
  await pageAnimationsDone(page);
  await expect(ghost(page)).toHaveCount(0);
  await animationsDone(card(page));
  expect((await region(page).count()) + (await open.count())).toBe(1);

  if ((await region(page).count()) === 0) await open.click();
  await expect(region(page)).toHaveCount(1);
  await animationsDone(card(page));

  // Esc mitt i rörelsen stänger som vanligt, och leken är upplåst efteråt
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(region(page)).toHaveCount(0);
  await pageAnimationsDone(page);
  await expect(ghost(page)).toHaveCount(0);
  await expect(open).toBeFocused();

  // Samma sak på ett kort med flera barn: Esc direkt efter öppning
  await clearFamily();
  await twoKids(page);
  const vera = card(page).getByRole("button", { name: "Önskelista för Vera" });
  await vera.click();
  await page.keyboard.press("Escape");
  // Vyn som höll på att växa slutar växa när den stängs
  expect((await clips(card(page))).clip).toEqual([]);
  await expect(region(page)).toHaveCount(0);
  await expect(vera).toBeFocused();
  await expect(card(page).getByRole("heading", { level: 3, name: "Vilda" })).toBeVisible();
  await pageAnimationsDone(page);
  await expect(ghost(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Nästa kort" })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
