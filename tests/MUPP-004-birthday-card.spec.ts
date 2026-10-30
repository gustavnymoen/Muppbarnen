import { expect, test, type Page } from "@playwright/test";
import { MONTHS, swedishToday } from "../lib/deck";
import { addChild, addParent, addWish, clearFamily } from "./family-db";
import { expectNoA11yViolations, runsLocally, uniqueName } from "./helpers";

// De här testen gör egna barn i testdatabasen, så de körs bara lokalt
test.skip(!runsLocally, "needs the local test database");

// Ett födelsedatum så att födelsedagen kommer om `days` dagar; åldern blir då `age`
function birthdateIn(days: number) {
  const today = swedishToday();
  const date = new Date(Date.UTC(today.year, today.month - 1, today.day + days));
  const nextYear = date.getUTCFullYear();
  return { birthdate: `${nextYear - 6}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`, month: date.getUTCMonth() };
}

// Sidan scrollar inte: varken dokumentet eller innehållsytan, bara listan inuti kortet
const pageDoesNotScroll = (page: Page) =>
  page.evaluate(() => {
    const main = document.querySelector("main")!;
    return document.documentElement.scrollHeight <= window.innerHeight && main.scrollHeight <= main.clientHeight;
  });

const card = (page: Page) => page.getByRole("article");
const status = (page: Page) => page.getByRole("status");
const next = (page: Page) => page.getByRole("button", { name: "Nästa kort" });
const previous = (page: Page) => page.getByRole("button", { name: "Föregående kort" });

// Bläddrar tills kortet med rubriken finns överst
async function showCard(page: Page, text: string) {
  for (let i = 0; i < 6; i++) {
    if (await card(page).getByText(text, { exact: true }).first().isVisible()) return;
    await next(page).click();
  }
  throw new Error(`Hittade inget kort med ${text}`);
}

test.beforeEach(async () => {
  await clearFamily();
});
test.afterAll(async () => {
  await clearFamily();
});

test("MUPP-004-R1 the empty deck: one card with a text, no examples, no buttons, no scrolling page", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await expect(page.getByText("Inga barn har lagts till än.")).toBeVisible();
  await expect(page.getByText("Exempel")).toHaveCount(0);
  await expect(next(page)).toHaveCount(0);
  await expect(previous(page)).toHaveCount(0);
  expect(await pageDoesNotScroll(page)).toBe(true);
  await expectNoA11yViolations(page);
});

test("MUPP-004-R2 R3 R6 R7 R8 R9 R10 one kid: month, nearest mark, folded and unfolded list, browsing, the lock and the screen reader", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const parent = await addParent(uniqueName("Förälder"));
  const otto = birthdateIn(0);
  const alma = birthdateIn(10);
  const vera = birthdateIn(40);
  await addChild(parent, "Otto", otto.birthdate);
  const almaId = await addChild(parent, "Alma", alma.birthdate);
  await addChild(parent, "Vera", vera.birthdate);
  for (const title of ["Cykel", "<b>Fet</b> tröja", "Lego", ...Array.from({ length: 12 }, (_, i) => `Önskning ${i + 1}`)]) await addWish(almaId, "birthday", title);
  await page.goto("/");

  // R10: kortleken är en grupp med ett namn och en roll, och bara det översta kortet går att nå
  const deck = page.getByRole("group", { name: "Födelsedagskort" });
  await expect(deck).toHaveAttribute("aria-roledescription", "karusell");
  await expect(card(page)).toHaveCount(1);
  expect(await page.locator(".deck-card[inert][aria-hidden='true']").count()).toBeGreaterThanOrEqual(1);

  // R2 R3: det närmaste kortet är överst med månaden, märket, namnet och åldern; bara det har märket
  await expect(card(page).getByRole("heading", { level: 2 })).toHaveText(MONTHS[otto.month]);
  await expect(card(page).getByText("Nästa födelsedag")).toBeVisible();
  await expect(page.getByText("Nästa födelsedag")).toHaveCount(1);
  await expect(card(page).getByRole("heading", { level: 3, name: "Otto" })).toBeVisible();
  await expect(card(page).getByText("Fyller 6 år")).toBeVisible();

  // R7: listan är hopfälld, tom listan säger det, och hela kortet ryms på en telefon utan att sidan scrollar
  const list = card(page).getByRole("button", { name: /^Önskelista/ });
  await expect(list).toHaveAttribute("aria-expanded", "false");
  expect((await card(page).boundingBox())!.y + (await card(page).boundingBox())!.height).toBeLessThanOrEqual(667);
  expect(await pageDoesNotScroll(page)).toBe(true);
  await expectNoA11yViolations(page);
  await list.click();
  await expect(card(page).getByText("Inga önskningar än.")).toBeVisible();

  // R9: listan är öppen, så kortleken är låst: knapparna är avstängda och texten och skärmläsaren säger det
  // (listknappen har bytts mot Stäng, som får fokus; MUPP-013-R5)
  await expect(list).toHaveCount(0);
  await expect(card(page).getByRole("button", { name: "Stäng önskelistan" })).toBeFocused();
  await expect(next(page)).toBeDisabled();
  await expect(previous(page)).toBeDisabled();
  await expect(page.getByText("Stäng önskelistan för att bläddra.", { exact: true })).toBeVisible();
  await expect(status(page)).toHaveText("Kortleken är låst. Stäng önskelistan för att bläddra.");
  await page.keyboard.press("ArrowRight");
  await expect(card(page).getByRole("heading", { level: 3, name: "Otto" })).toBeVisible();
  await expectNoA11yViolations(page);

  // R9: Escape stänger listan, fokus stannar på listknappen och leken är upplåst
  await page.keyboard.press("Escape");
  await expect(list).toHaveAttribute("aria-expanded", "false");
  await expect(list).toBeFocused();
  await expect(status(page)).toHaveText("Kortleken är upplåst.");
  await expect(next(page)).toBeEnabled();

  // R8 R10: nästa kort med knappen, med pil och med svep; skärmläsaren hör var man är; fokus stannar på knappen
  await next(page).click();
  await expect(status(page)).toHaveText(/^Kort 2 av \d: /);
  await expect(next(page)).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(status(page)).toHaveText(/^Kort 1 av \d: /);
  await expect(card(page).getByRole("heading", { level: 3, name: "Otto" })).toBeVisible();
  const box = (await card(page).boundingBox())!;
  await page.mouse.move(box.x + box.width - 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 20, box.y + 20, { steps: 8 });
  await page.mouse.up();
  await expect(status(page)).toHaveText(/^Kort 2 av \d: /);
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 20, box.y + 20, { steps: 8 });
  await page.mouse.up();
  await expect(status(page)).toHaveText(/^Kort 1 av \d: /);

  // R8: bakåt från det första kortet går till det sista, och framåt från det sista till det första
  await previous(page).click();
  await expect(status(page)).toHaveText(/^Kort (\d) av \1: /);
  await next(page).click();
  await expect(status(page)).toHaveText(/^Kort 1 av \d: /);

  // R7: Alma har femton önskningar; de visas som vanlig text (inte som HTML) och listan scrollar inuti kortet
  await showCard(page, "Alma");
  await card(page).getByRole("button", { name: /^Önskelista/ }).click();
  const items = card(page).getByRole("listitem");
  await expect(items).toHaveCount(15);
  await expect(items.nth(1)).toHaveText("<b>Fet</b> tröja");
  await expect(card(page).locator("li b")).toHaveCount(0);
  const region = card(page).getByRole("region", { name: "Önskelista" });
  expect(await region.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  expect(await pageDoesNotScroll(page)).toBe(true);

  // R6: sidan innehåller varken födelsedatum eller dag för barnen
  const html = await page.content();
  for (const { birthdate } of [otto, alma, vera]) expect(html).not.toContain(birthdate);
});

test("MUPP-004-R2 R4 R5 R7 R9 several kids on one card, then Christmas Eve", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const parent = await addParent(uniqueName("Förälder"));
  const twins = birthdateIn(20);
  const vera = await addChild(parent, "Vera", twins.birthdate);
  await addChild(parent, "Vilda", twins.birthdate);
  await addWish(vera, "birthday", "Dockhus");
  await addWish(vera, "christmas", "Julpussel");
  await page.goto("/");

  // R4: ett kort med två barn: ett litet kort per barn, äldst först (här i ordning efter id), utan att några listor är öppna
  await showCard(page, MONTHS[twins.month]);
  const open = card(page).getByRole("button", { name: /^Önskelista för / });
  await expect(open).toHaveText([/Vera/, /Vilda/]);
  await expect(card(page).getByText("Fyller 6 år")).toHaveCount(2);
  await expect(open).toHaveCount(2);
  // R4: miniatyrerna ligger över varandra och får plats på en telefon utan scroll i kortet
  expect(await card(page).locator("ul").evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(true);
  const [first, second] = await open.all();
  expect((await first.boundingBox())!.y).toBeLessThan((await second.boundingBox())!.y);
  await expectNoA11yViolations(page);

  // R4 R9: barnet öppnas som ett vanligt kort med listan utfälld och leken låst; Escape går tillbaka till barnen med fokus på knappen
  await open.first().click();
  await expect(card(page).getByRole("heading", { level: 3, name: "Vera" })).toBeVisible();
  await expect(card(page).getByRole("button", { name: "Stäng önskelistan" })).toBeVisible();
  await expect(card(page).getByRole("listitem")).toHaveText(["Dockhus"]);
  await expect(next(page)).toBeDisabled();
  await expectNoA11yViolations(page);
  await page.keyboard.press("Escape");
  await expect(card(page).getByRole("button", { name: "Önskelista för Vera" })).toBeFocused();
  await expect(next(page)).toBeEnabled();

  // R5: julkortet visar alla barn utan ålder, och julönskningarna öppnas via barnet
  await showCard(page, "Julafton");
  await expect(card(page).getByRole("button", { name: /^Öppna / })).toHaveCount(2);
  await expect(card(page).getByText(/Fyller/)).toHaveCount(0);
  await expectNoA11yViolations(page);
  await card(page).getByRole("button", { name: "Öppna Vera" }).click();
  await expect(card(page).getByRole("button", { name: "Stäng önskelistan" })).toBeVisible();
  await expect(card(page).getByRole("listitem")).toHaveText(["Julpussel"]);
  await expectNoA11yViolations(page);
  // R4 R9: Escape på julkortet för fokus tillbaka till barnets knapp på just det kortet (samma barn finns också på födelsedagskortet)
  await page.keyboard.press("Escape");
  await expect(card(page).getByRole("button", { name: "Öppna Vera" })).toBeFocused();
});

test("MUPP-004-R2 a birthday on Christmas Eve comes before the Christmas Eve card", async ({ page }) => {
  await addChild(await addParent(uniqueName("Förälder")), "Jul", "2020-12-24");
  await page.goto("/");
  await expect(card(page).getByRole("heading", { level: 2 })).toHaveText("December");
  await expect(card(page).getByText("Nästa födelsedag")).toBeVisible();
  await next(page).click();
  await expect(card(page).getByRole("heading", { level: 2 })).toHaveText("Julafton");
  await expect(page.getByText("Nästa: Julafton")).toHaveCount(0);
});
