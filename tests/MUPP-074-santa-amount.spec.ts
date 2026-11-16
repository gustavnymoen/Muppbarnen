import { expect, test } from "@playwright/test";
import { adminSignIn, expectNoA11yViolations, goto, runsLocally, uniqueName } from "./helpers";
import { addParent, addSantaEvent, addSantaMember, clearFamily, clearSanta } from "./family-db";
import { eventCard, santaSignIn } from "./santa";
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

test("MUPP-074-R1 R4 an amount is set when creating and editing a group, shown on the card, and removed by clearing the field", async ({ page }) => {
  const emma = uniqueName("Emma");
  await addParent(emma);
  await adminSignIn(page, emma);
  await page.getByRole("tab", { name: "Secret Santa" }).click();

  await page.getByRole("button", { name: "Ny Secret Santa", exact: true }).click();
  await page.getByLabel("Namn på Secret Santa", { exact: true }).fill("Emmas jul");
  await page.getByLabel("Belopp (kr)").fill("200");
  await expectNoA11yViolations(page);
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  const card = eventCard(page, "Emmas jul");
  await expect(card).toContainText("200 kr");

  // R1: changed in the form, the card shows the new amount, and the field starts with the saved one
  await card.getByRole("button", { name: "Byt namn på Emmas jul" }).click();
  await expect(page.getByLabel("Belopp (kr)")).toHaveValue("200");
  await page.getByLabel("Belopp (kr)").fill("350");
  await page.getByRole("button", { name: "Spara", exact: true }).click();
  await expect(card).toContainText("350 kr");
  await expect(card).not.toContainText("200 kr");

  // R1: emptied, the group has no amount and the card says nothing about it
  await card.getByRole("button", { name: "Byt namn på Emmas jul" }).click();
  await page.getByLabel("Belopp (kr)").fill("");
  await page.getByRole("button", { name: "Spara", exact: true }).click();
  await expect(card).not.toContainText("kr");
});

test("MUPP-074-R2 a member sees the amount beside the greeting, and nothing when the group has none", async ({ page }) => {
  const group = await addSantaEvent("Emmas jul", undefined, "preparing", 200);
  const anna = await addSantaMember(group, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida");
  const heading = page.getByRole("heading", { level: 1, name: "Hej Anna Testsson!" });
  await expect(heading).toBeVisible();
  const pill = page.getByText("200 kr", { exact: true });
  await expect(pill).toBeVisible();
  // Beside the greeting on the same line
  const [h, p] = await Promise.all([heading.boundingBox(), pill.boundingBox()]);
  expect(Math.abs(h!.y + h!.height / 2 - (p!.y + p!.height / 2))).toBeLessThan(h!.height / 2);
  await expectNoA11yViolations(page);

  await clearSanta();
  const none = await addSantaEvent("Emmas jul");
  const bo = await addSantaMember(none, "Bo Testsson", "0700002222", "bo@exempel.invalid");
  await santaSignIn(page, bo);
  await goto(page, "/secret-santa/min-sida");
  await expect(page.getByRole("heading", { level: 1, name: "Hej Bo Testsson!" })).toBeVisible();
  await expect(page.getByText(/ kr$/)).toHaveCount(0);
});

test("MUPP-074-R1 the server refuses an amount that is not a whole number above 0", async ({ page }) => {
  const emma = uniqueName("Emma");
  await addParent(emma);
  await adminSignIn(page, emma);
  await page.getByRole("tab", { name: "Secret Santa" }).click();
  await page.getByRole("button", { name: "Ny Secret Santa", exact: true }).click();
  await page.getByLabel("Namn på Secret Santa", { exact: true }).fill("Emmas jul");
  // The number field does not stop a decimal or a negative number being sent; the server does
  await page.getByLabel("Belopp (kr)").fill("-5");
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Skriv ett helt antal kronor" })).toBeVisible();
  await expect(eventCard(page, "Emmas jul")).toHaveCount(0);
});
