import { expect, test } from "@playwright/test";
import { expectNoA11yViolations, goto, runsLocally } from "./helpers";
import { addSantaEvent, addSantaMember, addSantaWish, clearSanta, santaWishes } from "./family-db";
import { foldOut, santaSignIn, wishRow } from "./santa";
import { testIp } from "./site-session";

// The tests make their data straight in the local test database (never the user's own) and remove it again
test.skip(!runsLocally, "the Secret Santa tests need the local test server (its own database and passwords)");

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearSanta();
});
test.afterEach(clearSanta);

// The look (44 px buttons, the dialog's width) is in design.spec.ts
test("MUPP-070-R3 R4 the own wish list folds out per row, the pencil and the bin are only in the folded-out row, and editing and removing work from there", async ({ page }) => {
  const family = await addSantaEvent("Familjen Test");
  const anna = await addSantaMember(family, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  await addSantaWish(anna, "Bok", { description: "Gärna inbunden", size: "M", url: "https://exempel.invalid/bok" });
  await addSantaWish(anna, "Ljusstake");
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida/onskelista");

  // R3 R4: folded rows are buttons with aria-expanded and aria-controls, with no pencil, bin, checkbox or "Paxad"
  const bok = wishRow(page, "Bok");
  await expect(bok).toHaveAttribute("aria-expanded", "false");
  await expect(bok).toHaveAttribute("aria-controls", /.+/);
  await expect(page.getByRole("button", { name: /^(Ändra|Ta bort) / })).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByText("Paxad")).toHaveCount(0);
  await expectNoA11yViolations(page);

  // R3: folded out it shows the description, the size and the link; a second press folds it again
  await bok.click();
  await expect(bok).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Beskrivning: Gärna inbunden")).toBeVisible();
  await expect(page.getByText("Storlek: M")).toBeVisible();
  await expect(page.getByRole("link", { name: /Länk till presenten/ })).toHaveAttribute("href", "https://exempel.invalid/bok");
  // R4: the pencil and the bin are there, with the same names as before
  await expect(page.getByRole("button", { name: "Ändra Bok" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ta bort Bok" })).toBeVisible();
  await expectNoA11yViolations(page);
  await bok.click();
  await expect(bok).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("button", { name: "Ändra Bok" })).toHaveCount(0);

  // R3: no description or size: the headings show with a dash
  await foldOut(page, "Ljusstake");
  await expect(page.getByText("Beskrivning: –")).toBeVisible();
  await expect(page.getByText("Storlek: –")).toBeVisible();

  // R4: a save shows the new text in the row; the card closes and the focus is back on the pencil
  await foldOut(page, "Bok");
  await page.getByRole("button", { name: "Ändra Bok" }).click();
  await page.getByLabel("Namn").fill("Kokbok");
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(wishRow(page, "Kokbok")).toBeVisible();
  await expect(wishRow(page, "Bok")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ändra Kokbok" })).toBeFocused();

  // R4: after a removal the row is gone
  await page.getByRole("button", { name: "Ta bort Kokbok" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Ta bort" }).click();
  await expect(wishRow(page, "Kokbok")).toHaveCount(0);
  expect((await santaWishes(anna)).map((w) => w.title)).toEqual(["Ljusstake"]);
});
