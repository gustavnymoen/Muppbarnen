import { expect, test } from "@playwright/test";
import { animationsDone, expectNoA11yViolations, goto, runsLocally } from "./helpers";
import { addSantaDraw, addSantaMessage, addSantaEvent, addSantaMember, clearFamily, clearSanta } from "./family-db";
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

test("MUPP-068-R1 R2 R3 the chat opens without focus in the message field, and the card keeps its size and position when the visual viewport changes, and the newest message is in view", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const event = await addSantaEvent("Familjen Test", undefined, "started");
  const anna = await addSantaMember(event, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  const bo = await addSantaMember(event, "Bo Testsson", "0700002222", "bo@exempel.invalid");
  await addSantaDraw(event, anna, bo);
  for (let i = 1; i <= 30; i++) await addSantaMessage(event, anna, bo, i % 2 === 0, `Meddelande ${i}`);
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida/matchning");
  await page.getByRole("button", { name: /^Chatt med din matchning/ }).click();
  const chat = page.getByRole("dialog", { name: "Din matchning" });
  const field = chat.getByRole("textbox", { name: "Meddelande" });
  await expect(chat).toBeVisible();
  await animationsDone(chat);

  // R3: the newest message is in view at once, with no scrolling by the user
  const last = chat.getByText("Meddelande 30");
  await expect(last).toBeInViewport({ ratio: 1 });
  const log = (await chat.getByRole("log").boundingBox())!;
  const lastBox = (await last.boundingBox())!;
  expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(log.y + log.height);

  await expectNoA11yViolations(page);

  // R1: no focus in the field, so no keyboard opens by itself; a tap puts it there
  await expect(field).not.toBeFocused();
  await field.click();
  await expect(field).toBeFocused();

  // R2: the card is 75dvh, and nothing sets an inline size or position (also when the visual viewport shrinks, as with a keyboard)
  const before = await chat.boundingBox();
  expect(Math.round(before!.height)).toBe(Math.round(667 * 0.75));
  await page.evaluate(() => window.visualViewport?.dispatchEvent(new Event("resize")));
  expect(await chat.evaluate((el) => el.getAttribute("style") ?? "")).not.toMatch(/height|top|bottom|margin/);
  expect(await chat.boundingBox()).toEqual(before);
  await expect(chat.getByRole("log")).toHaveCSS("overscroll-behavior-y", "contain");
});
