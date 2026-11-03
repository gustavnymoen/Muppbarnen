import { expect, test, type Locator, type Page } from "@playwright/test";
import { addChild, addParent, addWish, clearFamily } from "./family-db";
import { animationsDone, birthdateIn, type Box, expectNoA11yViolations, expectOnto, ghost, goto, pageAnimationsDone, runsLocally, settledBox, transformsOf, uniqueName } from "./helpers";

// De här testen gör egna barn i testdatabasen, så de körs bara lokalt
test.skip(!runsLocally, "needs the local test database");

// Hur rörelsen ser ut (kurva, exakta mått) testas inte, bara att den finns, börjar och slutar på rätt plats och att läget är rätt efteråt

const card = (page: Page) => page.getByRole("article");
const region = (page: Page) => card(page).getByRole("region", { name: "Önskelista" });

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
function expectCutOut(clipPath: string, size: { width: number; height: number }, button: Box, cardBox: Box) {
  const cut = cutOut(clipPath, size.width, size.height);
  for (const [got, want] of [[cut.x, button.x - cardBox.x], [cut.y, button.y - cardBox.y], [cut.width, button.width], [cut.height, button.height]]) expect(got).toBeCloseTo(want, 0);
}

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
      expectOnto((await transformsOf(ghost(page))).at(-1)!, view, button);
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
    expectOnto((await transformsOf(ghost(page))).at(-1)!, moved, await settledBox(open));
    await expect(ghost(page)).toHaveCount(0);
  });
}

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  // Övergångar av färg (ett tryck som mörknar knappen) är ingen rörelse; det som inte får finnas är animationer
  const noMotion = (page: Page) => page.evaluate(() => document.getAnimations().filter((a) => !(a instanceof CSSTransition)).map((a) => (a as CSSAnimation).animationName ?? "web-animation"));

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
