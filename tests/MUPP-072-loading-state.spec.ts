import { expect, test, type Locator, type Page } from "@playwright/test";
import { expectNoA11yViolations, goto, runsLocally } from "./helpers";
import { addSantaDraw, addSantaEvent, addSantaMember, addSantaWish, clearFamily, clearSanta, santaWishes } from "./family-db";
import { foldOut, santaSignIn, wishRow } from "./santa";
import { testIp } from "./site-session";

// The tests make their data straight in the local test database (never the user's own) and remove it again
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

// Holds every server action (a POST to the page) for a while, so that the busy state can be looked at
async function slowActions(page: Page, ms = 1500) {
  await page.route("**/secret-santa/**", async (route) => {
    if (route.request().method() === "POST") await new Promise((resolve) => setTimeout(resolve, ms));
    await route.continue();
  });
}

// R1 R2 R3: locked at once, the spinner after 300 ms, hidden from screen readers, with a polite status, and gone again afterwards
// Returns the size of the button while it is busy
async function expectBusyThenDone(page: Page, button: Locator) {
  await expect(button).toBeDisabled();
  await expect(button).toHaveAttribute("aria-busy", "true");
  await expect(button.locator(".spinner")).toBeVisible();
  const size = (await button.boundingBox())!;
  await expect(button.locator(".spinner")).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("status").filter({ hasText: "Arbetar …" })).toHaveCount(1);
  await expectNoA11yViolations(page);
  return size;
}

async function startedEvent() {
  const event = await addSantaEvent("Familjen Test", undefined, "started");
  const anna = await addSantaMember(event, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  const bo = await addSantaMember(event, "Bo Testsson", "0700002222", "bo@exempel.invalid");
  await addSantaDraw(event, anna, bo);
  await addSantaDraw(event, bo, anna);
  return { anna, bo };
}

test("MUPP-072-R1 R2 R3 deleting a wish: the confirm button is locked at once, shows a spinner after a moment, and is done when the wish is gone", async ({ page }) => {
  const { anna } = await startedEvent();
  await addSantaWish(anna, "Bok");
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida/onskelista");
  await foldOut(page, "Bok");
  await page.getByRole("button", { name: "Ta bort Bok" }).click();
  await slowActions(page);
  const confirm = page.getByRole("alertdialog").getByRole("button", { name: "Ta bort" });
  await confirm.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
  const before = (await confirm.boundingBox())!;
  await confirm.click();
  // R2: locked at once, the spinner not yet there
  await expect(confirm).toBeDisabled();
  await expect(confirm.locator(".spinner")).toHaveCount(0);
  // R1: not smaller in the 300 ms before the spinner either
  const early = (await confirm.boundingBox())!;
  expect(Math.abs(early.width - before.width)).toBeLessThan(1);
  const during = await expectBusyThenDone(page, confirm);
  // R1: no layout jump: the spinner sits in the button's padding, which the spinner and its gap make up for, so the size is the same
  expect(Math.abs(during.width - before.width)).toBeLessThan(1);
  expect(during.height).toBe(before.height);
  await expect(wishRow(page, "Bok")).toHaveCount(0);
  expect(await santaWishes(anna)).toEqual([]);
});

test("MUPP-072-R1 R2 R3 saving a form shows the same busy state", async ({ page }) => {
  const { anna } = await startedEvent();
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida/onskelista");
  await page.getByRole("button", { name: "Ny önskning" }).click();
  const add = page.locator("form").filter({ has: page.getByRole("button", { name: "Lägg till" }) });
  await add.getByLabel("Namn").fill("Pussel");
  await slowActions(page);
  const submit = add.getByRole("button", { name: "Lägg till" });
  await submit.click();
  await expectBusyThenDone(page, submit);
  await expect(submit).toBeEnabled();
  await expect(submit).not.toHaveAttribute("aria-busy");
  await expect(submit.locator(".spinner")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "Arbetar" })).toHaveCount(0);
});

test("MUPP-072-R1 R5 the nag button is busy while the action runs; locked, it says why in a text tied to it, and free it says nothing", async ({ page }) => {
  const { anna } = await startedEvent();
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida/matchning");
  const hint = page.getByText("Du kan bara tjata en gång i timmen.");
  const free = page.getByRole("button", { name: "Tjata in en lista", exact: true });
  await expect(hint).toHaveCount(0);
  await slowActions(page);
  await free.click();
  await expectBusyThenDone(page, free);
  // Locked after the action: the same text in both locked states (the state "recent" is checked in MUPP-071's test)
  const locked = page.getByRole("button", { name: "Tjatet är på väg", exact: true });
  await expect(locked).toBeDisabled();
  await expect(hint).toBeVisible();
  await expect(locked).toHaveAttribute("aria-describedby", await hint.getAttribute("id") ?? "?");
  await expectNoA11yViolations(page);
});
