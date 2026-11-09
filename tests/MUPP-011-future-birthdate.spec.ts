import { expect, test } from "@playwright/test";
import { dayAndMonth, swedishToday } from "../lib/deck";
import { latestBirthdate } from "../lib/form-input";
import { addParent, clearFamily } from "./family-db";
import { adminSignIn, expectNoA11yViolations, goto, openCard, runsLocally, uniqueName } from "./helpers";
import { testIp } from "./site-session";

// De här testen gör egna barn i testdatabasen, så de körs bara lokalt
test.skip(!runsLocally, "needs the local test database");

// Ett datum `months` månader fram, och en dag till
const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const monthsAhead = (months: number) => {
  const today = swedishToday();
  return new Date(Date.UTC(today.year, today.month - 1 + months, 15));
};

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
});
test.afterEach(clearFamily);

test("MUPP-011-R1 R2 R4 MUPP-020-R2 an expected child is added, listed and shown as expected; a date too far ahead is refused", async ({ page }) => {
  const chef = uniqueName("Chef");
  await addParent(chef, true);
  await page.setViewportSize({ width: 375, height: 667 });
  await adminSignIn(page, chef);
  await page.getByRole("link", { name: "Hantera barn och föräldrar" }).click();
  const kids = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Barn", exact: true }) });

  // R1: the date field's limit is the server's, and a date after it is refused
  const form = await openCard(kids, "Nytt barn");
  await expect(form.getByLabel("Födelsedatum")).toHaveAttribute("max", latestBirthdate());
  const name = uniqueName("Väntad");
  await form.getByLabel("Namn").fill(name);
  await form.getByLabel("Födelsedatum").fill(isoDate(monthsAhead(11)));
  await form.getByRole("button", { name: "Lägg till" }).click();
  await expect(form.getByRole("alert").filter({ hasText: "Skriv ett riktigt datum, högst tio månader fram." })).toBeVisible();
  await expectNoA11yViolations(page);

  // R1: four months ahead is saved
  const due = monthsAhead(4);
  await form.getByLabel("Födelsedatum").fill(isoDate(due));
  await form.getByRole("button", { name: "Lägg till" }).click();

  // R4: the list says expected
  const row = kids.getByRole("article").filter({ hasText: name });
  await openCard(row, "Ändra");
  await expect(row).toContainText(`Beräknad ${isoDate(due)}`);
  await expectNoA11yViolations(page);

  // R2: the card has the name and "Beräknad {dag och månad}" and no age
  await goto(page, "/");
  const date = dayAndMonth(due.getUTCDate(), due.getUTCMonth() + 1);
  for (let i = 0; i < 3 && !(await page.getByRole("heading", { level: 3, name }).isVisible()); i++) await page.getByRole("button", { name: "Nästa kort" }).click();
  await expect(page.getByRole("heading", { level: 3, name })).toBeVisible();
  await expect(page.getByText(`Beräknad ${date}`)).toBeVisible();
  await expect(page.getByText(/Fyller \d+ år/)).toHaveCount(0);
  expect(await page.content()).not.toContain(isoDate(due));
  await expectNoA11yViolations(page);
});
