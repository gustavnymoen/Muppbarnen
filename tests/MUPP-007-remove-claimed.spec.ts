import { expect, test, type Page } from "@playwright/test";
import { addChild, addParent, addWish, claimedByOf, clearFamily, countRows } from "./family-db";
import { adminSignIn, birthdateIn, expectNoA11yViolations, goto, runsLocally, uniqueName } from "./helpers";
import { testIp } from "./site-session";

// De här testen gör egna barn i testdatabasen, så de körs bara lokalt
test.skip(!runsLocally, "needs the local test database");

const dialog = (page: Page) => page.getByRole("alertdialog");

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
});
test.afterAll(clearFamily);

// Vera har en paxad önskning (paxad 15 januari i testdatabasen), en ledig och en obegränsad; påhittade namn
async function openVerasList(page: Page) {
  const name = uniqueName("Förälder");
  const vera = await addChild(await addParent(name), "Vera", birthdateIn(20).birthdate);
  await addWish(vera, "birthday", "Cykel", { claimedBy: "Moster Lisa" });
  await addWish(vera, "birthday", "Pussel");
  await addWish(vera, "birthday", "Strumpor", { unlimited: true });
  await adminSignIn(page, name);
  await goto(page, `/admin/barn/${vera}/onskelistor`);
}

test("MUPP-007-R1 R2 removing a claimed present warns who claimed it and when; Avbryt keeps it, confirming removes it", async ({ page }) => {
  await openVerasList(page);
  await page.getByRole("button", { name: "Ta bort Cykel" }).click();
  await expect(dialog(page)).toContainText("Cykel är paxad av Moster Lisa 15 januari. Hen kan redan ha köpt den.");
  await expect(dialog(page)).toContainText("Det går inte att ångra.");
  // R1: varningen hör till dialogens beskrivning
  await expect(dialog(page)).toHaveAccessibleDescription(/paxad av Moster Lisa 15 januari/);
  await expect(dialog(page).getByRole("button", { name: "Avbryt" })).toBeFocused();
  await expectNoA11yViolations(page);

  await dialog(page).getByRole("button", { name: "Avbryt" }).click();
  await expect(dialog(page)).toHaveCount(0);
  expect(await claimedByOf("Cykel")).toBe("Moster Lisa");

  await page.getByRole("button", { name: "Ta bort Cykel" }).click();
  await page.keyboard.press("Escape");
  expect(await claimedByOf("Cykel")).toBe("Moster Lisa");

  await page.getByRole("button", { name: "Ta bort Cykel" }).click();
  await dialog(page).getByRole("button", { name: "Ta bort" }).click();
  await expect(page.getByRole("button", { name: "Ta bort Cykel" })).toHaveCount(0);
  expect(await claimedByOf("Cykel")).toBeUndefined();
  expect(await countRows("wishlist_item")).toBe(2);
});

test("MUPP-007-R3 a free or unlimited present has the usual dialog, without a warning", async ({ page }) => {
  await openVerasList(page);
  for (const title of ["Pussel", "Strumpor"]) {
    await page.getByRole("button", { name: `Ta bort ${title}` }).click();
    await expect(dialog(page)).toContainText(`”${title}” tas bort från listan för Vera. Det går inte att ångra.`);
    await expect(dialog(page)).not.toContainText("paxad");
    await dialog(page).getByRole("button", { name: "Avbryt" }).click();
  }
});
