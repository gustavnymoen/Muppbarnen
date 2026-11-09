import { expect, test, type Locator, type Page } from "@playwright/test";
import { adminSignIn, expectNoA11yViolations, goto, runsLocally, uniqueName } from "./helpers";
import { addChild, addParent, addSantaEvent, addSantaMember, clearFamily, clearSanta } from "./family-db";
import { santaSignIn } from "./santa";
import { testIp } from "./site-session";

// The tests make their data straight in the local test database (never the user's own) and remove it again
test.skip(!runsLocally, "the admin tests need the local test server (its own database and passwords)");

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
  await clearSanta();
});
test.afterEach(async () => {
  await clearSanta();
  await clearFamily();
});

// A plus button: only the icon is seen (no text in it), and it opens the card with this title
async function expectPlus(page: Page, button: Locator, title: string) {
  await expect(button).toBeVisible();
  await expect(button).toHaveText("");
  await expect(button.locator("svg")).toHaveCount(1);
  await button.click();
  await expect(page.locator("dialog[open]").getByRole("heading", { level: 2, name: title })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
}

test("MUPP-053-R1 R2 R4 the admin pages: plus buttons for a new wish, parent and kid inside their frames, and a swap icon with the logged-in parent", async ({ page }) => {
  const chef = uniqueName("Chef");
  const kid = uniqueName("Barn");
  await addChild(await addParent(chef, true), kid);
  await page.setViewportSize({ width: 360, height: 640 });
  await adminSignIn(page, chef);

  // R4: "Inloggad som <förälder>" and an icon button with no text, named "Byt förälder", that goes back to the list
  await expect(page.getByText("Inloggad som")).toContainText(chef);
  await expect(page.getByText("Barn som tillhör")).toHaveCount(0);
  const swap = page.getByRole("button", { name: "Byt förälder" });
  await expect(swap).toHaveText("");
  await expect(swap.locator("svg")).toHaveCount(1);
  await swap.click();
  await expect(page.getByRole("heading", { level: 2, name: "Vem är du?" })).toBeVisible();
  await page.getByRole("button", { name: chef, exact: true }).click();
  await expect(page.getByText("Inloggad som")).toContainText(chef);
  await expectNoA11yViolations(page);

  // R1 R2: Hantera, a plus for a new parent and a new kid, each in the frame of its own list
  await page.getByRole("link", { name: "Hantera barn och föräldrar" }).click();
  const parents = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Föräldrar" }) });
  const kids = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Barn" }) });
  await expectPlus(page, parents.getByRole("button", { name: "Ny förälder" }), "Ny förälder");
  await expectPlus(page, kids.getByRole("button", { name: "Nytt barn" }), "Nytt barn");
  await expectNoA11yViolations(page);

  // R1: the wish lists of the kid
  await page.getByRole("link", { name: `Önskelistor för ${kid}` }).click();
  await expectPlus(page, page.getByRole("button", { name: "Ny önskning, Födelsedag" }), "Ny önskning, Födelsedag");
  await expectPlus(page, page.getByRole("button", { name: "Ny önskning, Jul" }), "Ny önskning, Jul");
  await expectNoA11yViolations(page);
});

test("MUPP-053-R1 R3 the Secret Santa tab and a participant's own page: a text button Ny grupp under Grupper, a plus for a new person and a new wish", async ({ page }) => {
  const chef = uniqueName("Chef");
  await addParent(chef, true);
  const family = await addSantaEvent("Familjen Ek");
  const member = await addSantaMember(family, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  await page.setViewportSize({ width: 360, height: 640 });
  await adminSignIn(page, chef);
  await page.getByRole("tab", { name: "Secret Santa" }).click();

  // R3: "Grupper" and "Ny grupp", never "Familjer" or "Ny familj"; a text button, not a plus
  await expect(page.getByRole("heading", { level: 2, name: "Grupper" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Familjer" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ny familj" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ny grupp", exact: true })).toHaveText("Ny grupp");

  // R1: a plus for a new person, in the group's card
  const ek = page.getByRole("article").filter({ has: page.getByRole("heading", { level: 3, name: "Familjen Ek" }) });
  await expectPlus(page, ek.getByRole("button", { name: "Ny person i Familjen Ek" }), "Ny person i Familjen Ek");
  await expectNoA11yViolations(page);

  // R1: a participant's own wish list
  await santaSignIn(page, member);
  await goto(page, "/secret-santa/min-sida/onskelista");
  await expectPlus(page, page.getByRole("button", { name: "Ny önskning, Familjen Ek" }), "Ny önskning, Familjen Ek");
  await expectNoA11yViolations(page);
});
