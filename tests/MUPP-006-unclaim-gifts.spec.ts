import { expect, test, type Page } from "@playwright/test";
import { addChild, addParent, addWish, claimedByOf, clearFamily, unclaimDirectly } from "./family-db";
import { animationsDone, birthdateIn, expectNoA11yViolations, goto, runsLocally, uniqueName } from "./helpers";

// De här testen gör egna barn i testdatabasen, så de körs bara lokalt
test.skip(!runsLocally, "needs the local test database");

const card = (page: Page) => page.getByRole("article");
const region = (page: Page) => card(page).getByRole("region", { name: "Önskelista" });
const dialog = (page: Page) => page.getByRole("alertdialog");
const row = (page: Page, title: string) => region(page).getByRole("listitem").filter({ hasText: title });
const undo = (page: Page, title: string) => region(page).getByRole("button", { name: `Ta bort paxningen på ${title}` });

test.beforeEach(async () => {
  await clearFamily();
});
test.afterAll(async () => {
  await clearFamily();
});

// Vera har ett kort för sig själv, med påhittade önskningar; telefonen först (320 px)
async function openVerasList(page: Page) {
  const parent = await addParent(uniqueName("Förälder"));
  const vera = await addChild(parent, "Vera", birthdateIn(20).birthdate);
  await addWish(vera, "birthday", "Cykel");
  await addWish(vera, "birthday", "Strumpor", { unlimited: true });
  await addWish(vera, "birthday", "Hoppborg", { claimedBy: "Moster Lisa" });
  await addWish(vera, "birthday", "Lego", { claimedBy: "Anna" });
  await page.setViewportSize({ width: 320, height: 640 });
  await goto(page, "/");
  // Ett klick medan korten tonas in får Playwright att scrolla kortleken i sidled
  await animationsDone(card(page));
  await card(page).getByRole("button", { name: /^Önskelista/ }).click();
  await expect(region(page)).toBeVisible();
}

// Samma lista i hela testet, så att den bara byggs och öppnas en gång (TECH-015); R5 sist, eftersom den tar bort sessionen
test("MUPP-006-R1 R2 R5 claimed rows have an undo button, the dialog asks first, and without a site session nothing is removed", async ({ page }) => {
  await openVerasList(page);

  // R1
  await expect(region(page).getByRole("button", { name: /^Ta bort paxningen på/ })).toHaveCount(2);
  await expect(row(page, "Hoppborg").getByRole("checkbox")).toHaveCount(0);
  await expect(row(page, "Cykel").getByRole("button", { name: /^Ta bort paxningen/ })).toHaveCount(0);
  await expect(row(page, "Strumpor").getByRole("button", { name: /^Ta bort paxningen/ })).toHaveCount(0);
  await expectNoA11yViolations(page);

  // R2
  await region(page).getByRole("checkbox", { name: "Cykel" }).check();
  await undo(page, "Hoppborg").click();
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page)).toHaveAccessibleName("Ta bort paxningen");
  await expect(dialog(page)).toContainText("Hoppborg är paxad av Moster Lisa.");
  await expect(dialog(page)).toContainText("Är du säker? Ta bara bort paxningen på presenter du själv har paxat.");
  await expect(dialog(page).getByRole("button", { name: "Avbryt" })).toBeFocused();
  await expectNoA11yViolations(page);

  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0);
  await expect(undo(page, "Hoppborg")).toBeFocused();
  await undo(page, "Hoppborg").click();
  await dialog(page).getByRole("button", { name: "Avbryt" }).click();
  await expect(dialog(page)).toHaveCount(0);
  await expect(undo(page, "Hoppborg")).toBeFocused();
  // Raden för paxning är fortfarande markerad, och ingenting ändrades
  await expect(region(page).getByRole("checkbox", { name: "Cykel" })).toBeChecked();
  expect(await claimedByOf("Hoppborg")).toBe("Moster Lisa");

  // R5
  await undo(page, "Hoppborg").click();
  await page.context().clearCookies();
  await dialog(page).getByRole("button", { name: "Ta bort" }).click();
  await expect(dialog(page).getByRole("alert")).toHaveText("Något gick fel. Ladda om sidan och försök igen.");
  await expect(dialog(page)).toBeVisible();
  expect(await claimedByOf("Hoppborg")).toBe("Moster Lisa");
});

test("MUPP-006-R3 R4 confirming removes the claim, also after a reload, and says so; a claim someone else removed meanwhile is told so", async ({ page }) => {
  await openVerasList(page);
  // R3 R4
  await undo(page, "Hoppborg").click();
  await dialog(page).getByRole("button", { name: "Ta bort" }).click();

  await expect(dialog(page)).toHaveCount(0);
  await expect(region(page).getByRole("status")).toHaveText("Paxningen på Hoppborg är borttagen.");
  await expect(row(page, "Hoppborg")).not.toContainText("Paxad");
  await expect(region(page).getByRole("checkbox", { name: "Hoppborg" })).toBeVisible();
  await expect(undo(page, "Hoppborg")).toHaveCount(0);
  await expect(region(page).getByRole("button", { name: "Fäll ihop önskelistan" })).toBeFocused();
  expect(await claimedByOf("Hoppborg")).toBeNull();
  await expectNoA11yViolations(page);

  // Kvar efter omladdning, och kan paxas igen
  await goto(page, "/");
  await animationsDone(card(page));
  await card(page).getByRole("button", { name: /^Önskelista/ }).click();
  await expect(region(page).getByRole("checkbox", { name: "Hoppborg" })).toBeVisible();
  await expect(undo(page, "Lego")).toBeVisible();

  // R4: någon annan har redan tagit bort paxningen på Lego
  await undo(page, "Lego").click();
  await unclaimDirectly("Lego");
  await dialog(page).getByRole("button", { name: "Ta bort" }).click();
  await expect(dialog(page)).toHaveCount(0);
  await expect(region(page).getByRole("status")).toHaveText("Paxningen på Lego var redan borttagen. Listan är uppdaterad.");
  await expect(region(page).getByRole("checkbox", { name: "Lego" })).toBeVisible();
});
