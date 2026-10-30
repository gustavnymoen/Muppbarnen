import { expect, test, type Page } from "@playwright/test";
import { addChild, addParent, addWish, claimDirectly, claimedByOf, clearFamily } from "./family-db";
import { birthdateIn, expectNoA11yViolations, runsLocally, uniqueName } from "./helpers";

// De här testen gör egna barn i testdatabasen, så de körs bara lokalt
test.skip(!runsLocally, "needs the local test database");

// MUPP-005-R6–R8 (pilknapparna och Stäng) testas tillsammans med kortleken i MUPP-004-birthday-card.spec.ts

const card = (page: Page) => page.getByRole("article");
const region = (page: Page) => card(page).getByRole("region", { name: "Önskelista" });
const claimButton = (page: Page) => region(page).getByRole("button", { name: /^Paxa \(/ });
const dialog = (page: Page) => page.getByRole("dialog");
const row = (page: Page, title: string) => region(page).getByRole("listitem").filter({ hasText: title });
const rowButton = (page: Page, title: string) => row(page, title).getByRole("button", { expanded: false }).or(row(page, title).getByRole("button", { expanded: true }));

test.beforeEach(async () => {
  await clearFamily();
});
test.afterAll(async () => {
  await clearFamily();
});

// Vera har ett kort för sig själv, med påhittade önskningar
async function openVerasList(page: Page) {
  const parent = await addParent(uniqueName("Förälder"));
  const vera = await addChild(parent, "Vera", birthdateIn(20).birthdate);
  // Hoppborg är paxad och står först i databasen, men ska visas sist
  await addWish(vera, "birthday", "Hoppborg", { claimedBy: "Moster Lisa" });
  await addWish(vera, "birthday", "Cykel", { description: "Röd, med korg", size: "20 tum", url: "https://example.com/cykel" });
  await addWish(vera, "birthday", "Pussel");
  await addWish(vera, "birthday", "Strumpor", { unlimited: true });
  await addWish(vera, "birthday", "<b>Fet</b> tröja", { url: "javascript:alert(1)" });
  await addWish(vera, "birthday", "Lego");
  await addWish(vera, "birthday", "Bil");
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await card(page).getByRole("button", { name: /^Önskelista/ }).click();
  await expect(region(page)).toBeVisible();
}

test("MUPP-005-R1 R2 R3 the rows: marks, order, details, links, and marking rows", async ({ page }) => {
  await openVerasList(page);

  // R1: claimed gifts last, the others in their order; the marks show without unfolding; the texts are plain text
  const rows = region(page).getByRole("listitem");
  await expect(rows).toHaveCount(7);
  await expect(rows.first()).toContainText("Cykel");
  await expect(rows.last()).toContainText("Hoppborg");
  await expect(row(page, "Hoppborg")).toContainText("Paxad");
  await expect(row(page, "Strumpor")).toContainText("Kan köpas flera gånger");
  await expect(row(page, "Cykel")).not.toContainText("Paxad");
  await expect(row(page, "<b>Fet</b> tröja")).toBeVisible();
  await expect(region(page).locator("b")).toHaveCount(0);
  // R1: the list scrolls inside the card, not the page
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);

  // R2: a row unfolds to its description, size and link, and folds again; empty fields are not shown
  const cykel = rowButton(page, "Cykel");
  await expect(cykel).toHaveAttribute("aria-expanded", "false");
  await expect(region(page).getByText("Röd, med korg")).toHaveCount(0);
  await cykel.click();
  await expect(cykel).toHaveAttribute("aria-expanded", "true");
  await expect(row(page, "Cykel")).toContainText("Röd, med korg");
  await expect(row(page, "Cykel")).toContainText("Storlek: 20 tum");
  const link = row(page, "Cykel").getByRole("link");
  await expect(link).toHaveAttribute("href", "https://example.com/cykel");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  await expectNoA11yViolations(page);
  await cykel.click();
  await expect(cykel).toHaveAttribute("aria-expanded", "false");
  await expect(row(page, "Cykel").getByRole("link")).toHaveCount(0);
  await rowButton(page, "Pussel").click();
  await expect(row(page, "Pussel").getByText(/Storlek|Länk/)).toHaveCount(0);

  // R2: only http and https are links
  await rowButton(page, "<b>Fet</b> tröja").click();
  await expect(row(page, "<b>Fet</b> tröja").getByRole("link")).toHaveCount(0);

  // R2: the claimed row says by whom and when, the unlimited row says it can't be claimed
  await rowButton(page, "Hoppborg").click();
  await expect(row(page, "Hoppborg")).toContainText("Paxad av Moster Lisa 2026-01-15");
  await rowButton(page, "Strumpor").click();
  await expect(row(page, "Strumpor")).toContainText("kan köpas flera gånger, så den går inte att paxa");

  // R3: a checkbox named after the wish on rows that can be claimed, none on claimed and unlimited rows
  await expect(region(page).getByRole("checkbox")).toHaveCount(5);
  await expect(row(page, "Hoppborg").getByRole("checkbox")).toHaveCount(0);
  await expect(row(page, "Strumpor").getByRole("checkbox")).toHaveCount(0);

  // R3: "Paxa" with the number marked appears with the first mark and goes with the last
  await expect(claimButton(page)).toHaveCount(0);
  await region(page).getByRole("checkbox", { name: "Cykel" }).check();
  await expect(claimButton(page)).toHaveText("Paxa (1)");
  await region(page).getByRole("checkbox", { name: "Pussel" }).check();
  await expect(claimButton(page)).toHaveText("Paxa (2)");
  await region(page).getByRole("checkbox", { name: "Pussel" }).uncheck();
  await expect(claimButton(page)).toHaveText("Paxa (1)");
  await region(page).getByRole("checkbox", { name: "Cykel" }).uncheck();
  await expect(claimButton(page)).toHaveCount(0);

  // R3: folding the list clears the marks
  await region(page).getByRole("checkbox", { name: "Cykel" }).check();
  await region(page).getByRole("button", { name: "Fäll ihop önskelistan" }).click();
  await card(page).getByRole("button", { name: /^Önskelista/ }).click();
  await expect(region(page).getByRole("checkbox", { name: "Cykel" })).not.toBeChecked();
  await expect(claimButton(page)).toHaveCount(0);
});

test("MUPP-005-R3 R4 R5 claiming: the dialog, its errors, Escape and cancel, success, and a gift taken meanwhile", async ({ page }) => {
  await openVerasList(page);
  const tick = (title: string) => region(page).getByRole("checkbox", { name: title }).check();

  // R4: the dialog is modal, has the focus in the name field, lists the marked gifts and says what claiming means
  await tick("Cykel");
  await tick("Pussel");
  await claimButton(page).click();
  await expect(dialog(page)).toBeVisible();
  const name = dialog(page).getByLabel("Ditt namn");
  await expect(name).toBeFocused();
  await expect(dialog(page)).toContainText("Cykel");
  await expect(dialog(page)).toContainText("Pussel");
  await expect(dialog(page)).toContainText("Du paxar nu de här presenterna. Om du ändrar dig, ta gärna bort paxningen så att andra vet.");
  await expectNoA11yViolations(page);

  // R4: an empty or too long name keeps the dialog open with an error, and claims nothing
  await dialog(page).getByRole("button", { name: "Paxa" }).click();
  await expect(dialog(page).getByRole("alert")).toHaveText("Skriv ditt namn.");
  await expect(dialog(page)).toBeVisible();
  await name.fill("a".repeat(61));
  await dialog(page).getByRole("button", { name: "Paxa" }).click();
  await expect(dialog(page).getByRole("alert")).toHaveText("Högst 60 tecken.");
  await expect(name).toHaveAttribute("aria-invalid", "true");
  expect(await claimedByOf("Cykel")).toBeNull();

  // R4: Escape closes it without claiming and the focus goes back to "Paxa"; so does "Avbryt"
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0);
  await expect(claimButton(page)).toBeFocused();
  await claimButton(page).click();
  await expect(dialog(page).getByRole("alert")).toHaveText("");
  await dialog(page).getByRole("button", { name: "Avbryt" }).click();
  await expect(dialog(page)).toHaveCount(0);
  await expect(claimButton(page)).toBeFocused();
  expect(await claimedByOf("Cykel")).toBeNull();
  expect(await claimedByOf("Pussel")).toBeNull();

  // R4 R5: with a name of 1–60 characters (trimmed) both are claimed with that name; the rows show it and go last
  await claimButton(page).click();
  await dialog(page).getByLabel("Ditt namn").fill("  Moster Lisa  ");
  await dialog(page).getByRole("button", { name: "Paxa" }).click();
  await expect(dialog(page)).toHaveCount(0);
  await expect(row(page, "Cykel")).toContainText("Paxad");
  await expect(row(page, "Pussel")).toContainText("Paxad");
  // Claimed gifts keep their order among themselves (Hoppborg was first in the database)
  await expect(region(page).getByRole("listitem").nth(-3)).toContainText("Hoppborg");
  await expect(region(page).getByRole("listitem").last()).toContainText("Pussel");
  await expect(region(page).getByRole("listitem").first()).not.toContainText("Paxad");
  await expect(region(page).getByRole("checkbox", { name: "Cykel" })).toHaveCount(0);
  await expect(claimButton(page)).toHaveCount(0);
  expect(await claimedByOf("Cykel")).toBe("Moster Lisa");
  expect(await claimedByOf("Pussel")).toBe("Moster Lisa");

  // R5: a gift someone else claimed meanwhile is not overwritten; the visitor is told, the other gift is claimed, the list is updated
  await tick("Lego");
  await tick("Bil");
  await claimDirectly("Lego", "Anna");
  await claimButton(page).click();
  await dialog(page).getByLabel("Ditt namn").fill("Pappa");
  await dialog(page).getByRole("button", { name: "Paxa" }).click();
  await expect(dialog(page)).toHaveCount(0);
  await expect(region(page).getByRole("status")).toHaveText("Det gick inte att paxa Lego: någon annan hann före. Listan är uppdaterad.");
  await expect(row(page, "Bil")).toContainText("Paxad");
  await rowButton(page, "Lego").click();
  await expect(row(page, "Lego")).toContainText("Paxad av Anna");
  expect(await claimedByOf("Lego")).toBe("Anna");
  expect(await claimedByOf("Bil")).toBe("Pappa");
  await expectNoA11yViolations(page);
});
