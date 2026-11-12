import { expect, test, type Locator, type Page } from "@playwright/test";
import { animationsDone, expectNoA11yViolations, goto, runsLocally } from "./helpers";
import { addSantaDraw, addSantaEvent, addSantaMember, clearFamily, clearSanta } from "./family-db";
import { santaSignIn } from "./santa";
import { testIp } from "./site-session";

test.skip(!runsLocally, "the Secret Santa tests need the local test server (its own database and passwords)");

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
  await clearSanta();
});
test.afterEach(async () => {
  await clearSanta();
  await clearFamily();
});

// Playwright can't open a real iOS keyboard, so the page gets a visual viewport it can shrink and move by hand, as iOS does
async function fakeVisualViewport(page: Page) {
  await page.addInitScript(() => {
    const view = Object.assign(new EventTarget(), { height: window.innerHeight, offsetTop: 0, scale: 1 });
    Object.defineProperty(window, "visualViewport", { value: view, configurable: true });
    (window as unknown as { setView: (height: number, offsetTop: number, event: string, scale?: number) => void }).setView = (height, offsetTop, event, scale = 1) => {
      view.height = height;
      view.scale = scale;
      view.offsetTop = offsetTop;
      view.dispatchEvent(new Event(event));
    };
  });
}
const setView = (page: Page, height: number, offsetTop: number, event = "resize", scale = 1) =>
  page.evaluate(([h, t, e, s]) => (window as unknown as { setView: (h: number, t: number, e: string, s: number) => void }).setView(h, t, e, s), [height, offsetTop, event, scale] as const);

test("MUPP-065-R1 R2 R3 with the keyboard up the chat card fits the visible part of the screen with the field and Skicka in view, follows it when it scrolls, and is normal again when the keyboard closes", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await fakeVisualViewport(page);
  const event = await addSantaEvent("Familjen Test", undefined, "started");
  const anna = await addSantaMember(event, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  const bo = await addSantaMember(event, "Bo Testsson", "0700002222", "bo@exempel.invalid");
  await addSantaDraw(event, anna, bo);
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida/matchning");
  await page.getByRole("button", { name: /^Chatt med din matchning/ }).click();
  const chat = page.getByRole("dialog", { name: "Din matchning" });
  const field = chat.getByRole("textbox", { name: "Meddelande" });
  const send = chat.getByRole("button", { name: "Skicka" });
  await expect(chat).toBeVisible();
  // The card grows out of the button; measure it when it has stopped
  await animationsDone(chat);
  const normal = await chat.evaluate((el) => ({ height: el.getBoundingClientRect().height, top: el.getBoundingClientRect().top }));

  // R3: no keyboard, 75dvh and centred (no inline size left over)
  expect(Math.round(normal.height)).toBe(Math.round(667 * 0.75));
  expect(await chat.evaluate((el) => el.getAttribute("style") ?? "")).not.toMatch(/height|top/);

  // R3: a pinch-zoom (scale 2, half the height visible) is not a keyboard
  await setView(page, 333, 0, "resize", 2);
  await expect.poll(async () => (await chat.boundingBox())!.height).toBeCloseTo(normal.height, 0);
  await setView(page, 667, 0);

  // R1: the keyboard takes 300 px; iOS then moves the visual viewport 40 px down
  const inside = async (top: number, bottom: number) => {
    for (const part of [chat, field, send]) {
      const box = (await part.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(top);
      expect(box.y + box.height).toBeLessThanOrEqual(bottom);
    }
  };
  await setView(page, 367, 0);
  await expect.poll(async () => (await chat.boundingBox())!.height).toBeLessThanOrEqual(367);
  await inside(0, 367);
  await setView(page, 367, 40, "scroll");
  await expect.poll(async () => (await chat.boundingBox())!.y).toBeGreaterThanOrEqual(40);
  await inside(40, 407);
  await expectNoA11yViolations(page);

  // R2: the keyboard closes and the card is as before
  await setView(page, 667, 0);
  await expect.poll(async () => (await chat.boundingBox())!.height).toBeCloseTo(normal.height, 0);
  expect(Math.round((await chat.boundingBox())!.y)).toBe(Math.round(normal.top));
  expect(await chat.evaluate((el) => el.getAttribute("style") ?? "")).not.toMatch(/height|top|margin/);

  // R2: closed with the keyboard up, nothing is left on the next opening
  await setView(page, 367, 0);
  await chat.getByRole("button", { name: "Stäng" }).click();
  await expect(chat).toBeHidden();
  await setView(page, 667, 0);
  await page.getByRole("button", { name: /^Chatt med din matchning/ }).click();
  await expect(chat).toBeVisible();
  await animationsDone(chat);
  expect(Math.round((await chat.boundingBox())!.height)).toBe(Math.round(normal.height));
  expect(await chat.evaluate((el) => el.getAttribute("style") ?? "")).not.toMatch(/height|top|margin/);
});

test("MUPP-066-R1 R2 with the keyboard up a drag in the list lowers it, a drag outside the list and field moves nothing, and without a keyboard everything scrolls as before", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await fakeVisualViewport(page);
  const event = await addSantaEvent("Familjen Test", undefined, "started");
  const anna = await addSantaMember(event, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  const bo = await addSantaMember(event, "Bo Testsson", "0700002222", "bo@exempel.invalid");
  await addSantaDraw(event, anna, bo);
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida/matchning");
  await page.getByRole("button", { name: /^Chatt med din matchning/ }).click();
  const chat = page.getByRole("dialog", { name: "Din matchning" });
  const field = chat.getByRole("textbox", { name: "Meddelande" });
  await animationsDone(chat);
  // Dispatches a touchmove on the element and says whether the page was allowed to scroll (not cancelled)
  const drag = (target: Locator) => target.evaluate((el) => !el.dispatchEvent(new TouchEvent("touchmove", { bubbles: true, cancelable: true })));
  const log = chat.getByRole("log");
  await expect(log).toHaveCSS("overscroll-behavior-y", "contain");

  // No keyboard: nothing is cancelled, nothing is blurred
  await field.focus();
  expect(await drag(log)).toBe(false);
  expect(await drag(chat.getByRole("heading", { name: "Din matchning" }))).toBe(false);
  await expect(field).toBeFocused();

  // Keyboard up: outside the list and field the drag is cancelled, in the field it is not, in the list it lowers the keyboard
  await setView(page, 367, 0);
  expect(await drag(chat.getByRole("heading", { name: "Din matchning" }))).toBe(true);
  expect(await drag(field)).toBe(false);
  await expect(field).toBeFocused();
  expect(await drag(log)).toBe(false);
  await expect(field).not.toBeFocused();
});
