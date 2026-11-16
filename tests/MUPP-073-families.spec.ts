import { expect, test } from "@playwright/test";
import { addFamily, addParent, addSantaEvent, clearFamily, clearSanta, clearTestFamilies, familiesOfParent, familyOfEvent, setParentFamilies } from "./family-db";
import { adminSignIn, expectNoA11yViolations, goto, runsLocally, uniqueName } from "./helpers";
import { eventCard } from "./santa";
import { testIp } from "./site-session";

// The tests make their data straight in the local test database (never the user's own) and remove it again
test.skip(!runsLocally, "the family tests need the local test server (its own database and passwords)");

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
});
test.afterEach(async () => {
  await clearSanta();
  await clearFamily();
  await clearTestFamilies();
});

test("MUPP-073-R1 R2 R3 R4 the master admin makes a family, puts a parent in it and moves a Secret Santa to it, and the refused cases say why; an ordinary admin chooses among their own families only when there is more than one and cannot reach the settings", async ({ page }) => {
  const master = uniqueName("Chef");
  await addParent(master, true);
  await addFamily(uniqueName("Andra"), "Annan sida");
  const emma = uniqueName("Emma");
  await addSantaEvent("E2E Emmas jul", await addParent(emma));
  await page.setViewportSize({ width: 375, height: 667 });
  await adminSignIn(page, master, "/admin/hantera");
  await expect(page.getByRole("heading", { level: 2, name: "Familjer" })).toBeVisible();

  // R1: a name is required, a description of 30 characters is saved and listed with the counts on their own line
  const name = uniqueName("Berg");
  await page.getByRole("button", { name: "Ny familj" }).click();
  const dialog = page.getByRole("dialog", { name: "Ny familj" });
  await dialog.getByRole("button", { name: "Lägg till" }).click();
  await expect(dialog.getByText("Fyll i det här fältet.")).toBeVisible();
  await expectNoA11yViolations(page);
  await dialog.getByLabel("Namn").fill(name);
  await dialog.getByLabel("Beskrivning").fill("S".repeat(30));
  await dialog.getByRole("button", { name: "Lägg till" }).click();
  await expect(dialog).toBeHidden();
  const row = page.getByRole("article").filter({ has: page.getByRole("heading", { name, exact: true }) });
  await expect(row).toContainText("S".repeat(30));
  await expect(row).toContainText("0 föräldrar, 0 Secret Santa");

  // R2: a new parent needs at least one family
  await page.getByRole("button", { name: "Ny förälder" }).click();
  const parentDialog = page.getByRole("dialog", { name: "Ny förälder" });
  const pelle = uniqueName("Pelle");
  await parentDialog.getByLabel("Namn").fill(pelle);
  await expect(parentDialog.getByRole("checkbox", { checked: true })).toHaveCount(0);
  await parentDialog.getByRole("button", { name: "Lägg till" }).click();
  await expect(parentDialog.getByText("Välj minst en familj.")).toBeVisible();
  await parentDialog.getByLabel(name).check();
  await parentDialog.getByRole("button", { name: "Lägg till" }).click();
  await expect(parentDialog).toBeHidden();
  expect(await familiesOfParent(pelle)).toEqual([name]);
  await expect(row).toContainText("1 förälder");

  // A family with a parent is not deleted
  await row.getByRole("button", { name: `Ta bort ${name}` }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Ta bort" }).click();
  await expect(page.getByText("Familjen har föräldrar.").first()).toBeVisible();

  // R3: the Secret Santa is moved to the other family on the admin's Secret Santa tab
  await goto(page, "/admin");
  await page.getByRole("tab", { name: "Secret Santa" }).click();
  await page.getByRole("button", { name: "Byt namn på E2E Emmas jul" }).click();
  const edit = page.getByRole("dialog");
  await edit.getByRole("button", { name: /Familj/ }).click();
  await page.getByRole("option", { name: /Andra/ }).click();
  await edit.getByRole("button", { name: "Spara" }).click();
  await expect(edit).toBeHidden();
  expect(await familyOfEvent("E2E Emmas jul")).toMatch(/Andra/);
  await expect(eventCard(page, "E2E Emmas jul")).toContainText("Familj: ");

  // R3 R4: an ordinary admin chooses among their own families only when there is more than one, and cannot reach the family settings
  const emma2 = uniqueName("Emma");
  const emmaId = await addParent(emma2);
  const x = await addFamily(uniqueName("X"));
  const y = await addFamily(uniqueName("Y"));
  await setParentFamilies(emmaId, x);
  await adminSignIn(page, emma2);

  // One family: no question, the group gets it
  await page.getByRole("tab", { name: "Secret Santa" }).click();
  await page.getByRole("button", { name: "Ny Secret Santa", exact: true }).click();
  await expect(page.getByRole("dialog").getByText("Familj", { exact: true })).toHaveCount(0);
  await page.getByLabel("Namn på Secret Santa", { exact: true }).fill("E2E Ett val");
  await page.getByRole("button", { name: "Lägg till" }).click();
  await expect(eventCard(page, "E2E Ett val")).toBeVisible();
  expect(await familyOfEvent("E2E Ett val")).toMatch(/X/);

  // R4: no family settings
  await goto(page, "/admin/hantera");
  await expect(page.getByRole("heading", { level: 1, name: "Sidan finns inte" })).toBeVisible();

  // Two families: the form asks, and offers only hers
  await setParentFamilies(emmaId, x, y);
  await goto(page, "/admin");
  await page.getByRole("tab", { name: "Secret Santa" }).click();
  await page.getByRole("button", { name: "Ny Secret Santa", exact: true }).click();
  await page.getByLabel("Namn på Secret Santa", { exact: true }).fill("E2E Två val");
  await page.getByRole("dialog").getByRole("button", { name: /Familj/ }).click();
  await expect(page.getByRole("option")).toHaveCount(2);
  await page.getByRole("option", { name: /Y/ }).click();
  await page.getByRole("button", { name: "Lägg till" }).click();
  await expect(eventCard(page, "E2E Två val")).toBeVisible();
  expect(await familyOfEvent("E2E Två val")).toMatch(/Y/);
  await expectNoA11yViolations(page);
});
