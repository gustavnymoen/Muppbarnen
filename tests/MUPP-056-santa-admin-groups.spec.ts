import { expect, test, type Page } from "@playwright/test";
import { adminSignIn, expectNoA11yViolations, runsLocally, uniqueName } from "./helpers";
import { addParent, addSantaEvent, addSantaMember, clearFamily, clearSanta } from "./family-db";
import { eventCard } from "./santa";
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

async function openSantaTab(page: Page, parent: string) {
  await adminSignIn(page, parent);
  await page.getByRole("tab", { name: "Secret Santa" }).click();
}

// The button that folds a card is the heading's own button
const foldButton = (page: Page, name: string) => eventCard(page, name).getByRole("heading", { level: 3 }).first().getByRole("button");

test("MUPP-056-R1 a parent with one group sees it open and without a fold control", async ({ page }) => {
  const emma = uniqueName("Emma");
  const group = await addSantaEvent("Emmas jul", await addParent(emma), "inactive");
  await addSantaMember(group, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  await openSantaTab(page, emma);
  await expect(eventCard(page, "Emmas jul")).toContainText("Anna Testsson");
  await expect(foldButton(page, "Emmas jul")).toHaveCount(0);
  await expectNoA11yViolations(page);
});

test("MUPP-056-R2 R4 R5 several own groups are closed with name, status and participants; the header opens and closes, and nothing is focusable in a closed card; a change keeps the card open; a new group is open", async ({ page }) => {
  const emma = uniqueName("Emma");
  const emmaId = await addParent(emma);
  const jul = await addSantaEvent("Emmas jul", emmaId, "inactive");
  await addSantaMember(jul, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  await addSantaEvent("Emmas påsk", emmaId, "preparing");
  await page.setViewportSize({ width: 375, height: 667 });
  await openSantaTab(page, emma);

  // R2: both closed, the closed card says name, status and participants
  const jul0 = foldButton(page, "Emmas jul");
  await expect(jul0).toHaveAttribute("aria-expanded", "false");
  await expect(jul0).toHaveAccessibleName("Emmas jul Inaktiv, 1 deltagare");
  await expect(foldButton(page, "Emmas påsk")).toHaveAttribute("aria-expanded", "false");
  expect((await jul0.boundingBox())!.height).toBeGreaterThanOrEqual(44);

  // R4: nothing of the members, the plus or the status is there, so nothing can be reached by Tab or a screen reader
  const card = eventCard(page, "Emmas jul");
  await expect(card.getByText("Anna Testsson")).toHaveCount(0);
  await expect(card.getByRole("button", { name: "Ny person i Emmas jul" })).toHaveCount(0);
  await expect(card.getByRole("switch")).toHaveCount(0);
  await expectNoA11yViolations(page);

  // R2: the keyboard opens it, and the same key closes it
  await jul0.focus();
  await page.keyboard.press("Enter");
  await expect(jul0).toHaveAttribute("aria-expanded", "true");
  await expect(card).toContainText("Anna Testsson");
  await expect(card).toContainText("Status: Inaktiv");
  await expectNoA11yViolations(page);

  // R5: a change on the page keeps it open (and the other closed)
  await card.getByRole("button", { name: "Ny person i Emmas jul" }).click();
  await page.getByLabel("Namn", { exact: true }).fill("Bertil Testsson");
  await page.getByLabel("Telefon", { exact: true }).fill("0700002222");
  await page.getByLabel("E-post", { exact: true }).fill("bertil@exempel.invalid");
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await expect(card).toContainText("Bertil Testsson");
  await expect(jul0).toHaveAttribute("aria-expanded", "true");
  await expect(foldButton(page, "Emmas påsk")).toHaveAttribute("aria-expanded", "false");

  // R5: a new group is open at once
  await page.getByRole("button", { name: "Ny grupp", exact: true }).click();
  await page.getByLabel("Gruppens namn", { exact: true }).fill("Emmas midsommar");
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await expect(foldButton(page, "Emmas midsommar")).toHaveAttribute("aria-expanded", "true");

  // R2: pressing the header again closes the card; R5: a reload decides again (nothing is stored)
  await jul0.click();
  await expect(jul0).toHaveAttribute("aria-expanded", "false");
  await page.reload();
  await page.getByRole("tab", { name: "Secret Santa" }).click();
  await expect(foldButton(page, "Emmas midsommar")).toHaveAttribute("aria-expanded", "false");
});

test("MUPP-056-R3 MUPP-059-R1 the master admin sees own group open and first, then the others' closed by administrator name; several own groups are closed", async ({ page }) => {
  const [chef, emma, erik] = [uniqueName("Chef"), uniqueName("Emma"), uniqueName("Erik")];
  const chefId = await addParent(chef, true);
  // Created in the opposite order of what is expected, and the names sorted so that the order is by administrator and not by group
  await addSantaEvent("Aaa Eriks", await addParent(erik), "inactive");
  await addSantaEvent("Zzz Emmas", await addParent(emma), "inactive");
  await addSantaEvent("Chefens jul", chefId, "inactive");
  await openSantaTab(page, chef);

  await expect(page.getByRole("heading", { level: 3 })).toHaveText([/^Chefens jul/, /^Zzz Emmas/, /^Aaa Eriks/]);
  await expect(foldButton(page, "Chefens jul")).toHaveAttribute("aria-expanded", "true");
  await expect(foldButton(page, "Zzz Emmas")).toHaveAttribute("aria-expanded", "false");
  await expect(foldButton(page, "Aaa Eriks")).toHaveAttribute("aria-expanded", "false");
  await expect(eventCard(page, "Zzz Emmas")).toContainText(`Admin: ${emma}`);
  await expectNoA11yViolations(page);

  // Several own groups: all closed, still before the others
  await addSantaEvent("Chefens påsk", chefId, "inactive");
  await page.reload();
  await page.getByRole("tab", { name: "Secret Santa" }).click();
  await expect(page.getByRole("heading", { level: 3 })).toHaveText([/^Chefens jul/, /^Chefens påsk/, /^Zzz Emmas/, /^Aaa Eriks/]);
  for (const name of ["Chefens jul", "Chefens påsk", "Zzz Emmas", "Aaa Eriks"]) await expect(foldButton(page, name)).toHaveAttribute("aria-expanded", "false");
});

test("MUPP-056-R3 the master admin without an own group sees every group closed", async ({ page }) => {
  const chef = uniqueName("Chef");
  await addParent(chef, true);
  await addSantaEvent("Emmas jul", await addParent(uniqueName("Emma")), "inactive");
  await openSantaTab(page, chef);
  await expect(foldButton(page, "Emmas jul")).toHaveAttribute("aria-expanded", "false");
});
