import { expect, test, type Locator, type Page } from "@playwright/test";
import { addParent, clearFamily } from "./family-db";
import { adminSignIn, expectNoA11yViolations, pickOption, runsLocally, settledBox, uniqueName } from "./helpers";
import { testIp } from "./site-session";

// De här testen gör egna föräldrar i testdatabasen, så de körs bara lokalt
test.skip(!runsLocally, "needs the local test database");

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
});
test.afterEach(clearFamily);

// Opens the "Nytt barn" form on the manage page, signed in as `chef`
async function newChildForm(page: Page, chef: string) {
  await adminSignIn(page, chef);
  await page.getByRole("link", { name: "Hantera barn och föräldrar" }).click();
  const kids = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Barn", exact: true }) });
  await kids.getByRole("button", { name: "Nytt barn" }).click();
  return kids;
}

const listOf = (page: Page) => page.getByRole("listbox");

// The list's box is against the field's: as wide, and just under it (or just above it when there is no room below)
async function expectAgainstField(field: Locator, list: Locator, side: "below" | "above") {
  const [f, l] = await Promise.all([settledBox(field), settledBox(list)]);
  expect(Math.abs(l.x - f.x)).toBeLessThan(1);
  expect(Math.abs(l.width - f.width)).toBeLessThan(1);
  if (side === "below") expect(l.y - (f.y + f.height)).toBeLessThan(12);
  else expect(f.y - (l.y + l.height)).toBeLessThan(12);
}

test("MUPP-012-R1 R2 R3 the parent is picked from the site's own list at 375 px: under the field, with pointer and keyboard, closing without a change, and the value saved", async ({ page }) => {
  const chef = uniqueName("Chef");
  const mia = uniqueName("Mia");
  await addParent(chef, true);
  await addParent(mia);
  await page.setViewportSize({ width: 375, height: 667 });
  const kids = await newChildForm(page, chef);
  const field = kids.getByRole("button", { name: /^Förälder/ });

  // R3: the signed-in parent (the first) is selected when the form opens; the field is a button for a list
  await expect(field).toHaveText(chef);
  await expect(field).toHaveAttribute("aria-haspopup", "listbox");
  await expect(field).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("select")).toHaveCount(0);

  // R1: the list opens under the field, as wide, with the selected option marked
  await field.click();
  const list = listOf(page);
  await expect(field).toHaveAttribute("aria-expanded", "true");
  await expect(list.getByRole("option")).toHaveCount(2);
  await expect(list.getByRole("option", { name: chef })).toHaveAttribute("aria-selected", "true");
  await expect(list.getByRole("option", { name: mia })).toHaveAttribute("aria-selected", "false");
  await expectAgainstField(field, list, "below");
  await expectNoA11yViolations(page);

  // R1: Escape and a click outside close the list without a change, Escape without folding the panel
  await page.keyboard.press("Escape");
  await expect(list).toBeHidden();
  await expect(field).toBeFocused();
  await expect(kids.getByLabel("Namn")).toBeVisible();
  await expect(field).toHaveText(chef);
  await field.click();
  await page.getByRole("heading", { level: 1, name: "Hantera" }).click();
  await expect(list).toBeHidden();
  await expect(field).toHaveText(chef);

  // R1: an option picked with the pointer closes the list and shows in the field
  await pickOption(page, kids, "Förälder", mia);
  await expect(list).toBeHidden();
  await expect(field).toHaveText(mia);
  await expect(field).toBeFocused();

  // R2: the keyboard on the closed field opens the list at the selected option; the arrows, Home and End move,
  // typing a letter jumps, Enter picks
  await page.keyboard.press("ArrowDown");
  await expect(list).toBeFocused();
  await expect(list.getByRole("option", { name: mia })).toHaveAttribute("id", (await list.getAttribute("aria-activedescendant"))!);
  await page.keyboard.press("Home");
  await expect(list).toHaveAttribute("aria-activedescendant", (await list.getByRole("option").first().getAttribute("id"))!);
  await page.keyboard.press("End");
  await expect(list).toHaveAttribute("aria-activedescendant", (await list.getByRole("option").last().getAttribute("id"))!);
  await page.keyboard.press("ArrowUp");
  await page.keyboard.type("E2E Chef");
  await page.keyboard.press("Enter");
  await expect(list).toBeHidden();
  await expect(field).toHaveText(chef);
  await expect(field).toBeFocused();

  // R2: Space opens, Tab picks and goes on to the next control, with focus on the field closed
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
  await expect(list).toBeHidden();
  await expect(field).toHaveText(mia);
  await expect(kids.getByRole("button", { name: "Lägg till" })).toBeFocused();

  // R3: the picked parent is sent under the same name and saved with the child
  const kid = uniqueName("Barn");
  await kids.getByLabel("Namn").fill(kid);
  await kids.getByLabel("Födelsedatum").fill("2019-03-09");
  await kids.getByRole("button", { name: "Lägg till" }).click();
  const row = kids.getByRole("article").filter({ hasText: kid });
  await row.getByRole("button", { name: "Ändra" }).click();
  await expect(row).toContainText(`förälder: ${mia}`);
  await expect(row.getByRole("button", { name: /^Förälder/ })).toHaveText(mia);
});

test("MUPP-012-R1 R2 on a wide screen the list opens under the field, and above it when there is no room below", async ({ page }) => {
  const chef = uniqueName("Chef");
  await addParent(chef, true);
  for (let i = 0; i < 8; i++) await addParent(uniqueName(`Förälder ${i}`));
  await page.setViewportSize({ width: 1280, height: 720 });
  const kids = await newChildForm(page, chef);
  const field = kids.getByRole("button", { name: /^Förälder/ });

  await field.click();
  const list = listOf(page);
  await expectAgainstField(field, list, "below");
  // Eight parents are more than fit under the field: the list scrolls and stays on the screen
  const below = await settledBox(list);
  expect(below.y + below.height).toBeLessThanOrEqual(720);
  await expectNoA11yViolations(page);
  // The list is drawn in body, so the folded panel cannot cut it off, and clicking the field closes it
  await expect(page.locator("body > ul[role=listbox]")).toHaveCount(1);
  await field.click();
  await expect(list).toBeHidden();

  // A window that ends just under the field: more room above than below, so the list goes above
  const box = await settledBox(field);
  await page.setViewportSize({ width: 1280, height: Math.round(box.y + box.height + 30) });
  const now = await settledBox(field);
  expect(now.y).toBeGreaterThan(200);
  await field.click();
  await expectAgainstField(field, list, "above");
  expect((await settledBox(list)).y).toBeGreaterThanOrEqual(0);
});
