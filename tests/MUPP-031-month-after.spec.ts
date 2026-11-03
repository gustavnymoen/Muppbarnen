import { expect, test, type Page } from "@playwright/test";
import { addChild, addParent, addWish, claimedByOf, clearFamily, countRows } from "./family-db";
import { adminSignIn, animationsDone, birthdateIn, dateIn, expectNoA11yViolations, goto, runsLocally, uniqueName } from "./helpers";
import { testIp } from "./site-session";

// De här testen gör egna barn i testdatabasen, med datum räknade från idag, så de körs bara lokalt
test.skip(!runsLocally, "needs the local test database");

const card = (page: Page) => page.getByRole("article").first();
const dialog = (page: Page) => page.getByRole("dialog");

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
});
test.afterAll(clearFamily);

test("MUPP-031-R1 R3 a birthday a day ago keeps its card and list one step back from the next card, and can be claimed from", async ({ page }) => {
  // Den 25 december ligger julkortet (också en dag sedan) närmast före det kommande kortet
  test.skip(dateIn(0).endsWith("-12-25"), "Christmas Eve is the card one step back on 25 December");
  const parent = await addParent(uniqueName("Förälder"));
  const tilda = birthdateIn(-1);
  await addWish(await addChild(parent, "Tilda", tilda.birthdate), "birthday", "Cykel", { addedAt: dateIn(-15) });
  await addChild(parent, "Otto", birthdateIn(5).birthdate);
  await page.setViewportSize({ width: 375, height: 667 });
  await goto(page, "/");
  await animationsDone(card(page));

  // R3: the deck opens on the next card, and the card in the month after lies one step back
  await expect(card(page)).toContainText("Nästa");
  await expect(card(page)).not.toContainText("Tilda");
  await page.getByRole("button", { name: "Föregående kort" }).click();
  await animationsDone(card(page));

  // R1: the day of the birthday and "Fyllde", with the list as it was
  await expect(card(page).getByRole("heading", { level: 2 })).toHaveText(tilda.date);
  await expect(card(page)).toContainText("Fyllde 6 år");
  await expect(card(page)).not.toContainText("Nästa");
  await expectNoA11yViolations(page);

  await card(page).getByRole("button", { name: /^Önskelista/ }).click();
  const region = card(page).getByRole("region", { name: "Önskelista" });
  await region.getByRole("checkbox", { name: "Cykel" }).check();
  await region.getByRole("button", { name: /^Paxa \(/ }).click();
  await dialog(page).getByLabel("Ditt namn").fill("Moster Lisa");
  await dialog(page).getByRole("button", { name: "Paxa" }).click();
  await expect(region.getByRole("checkbox", { name: "Cykel" })).toHaveCount(0);
  expect(await claimedByOf("Cykel")).toBe("Moster Lisa");
});

// Vera fyllde år för 40 dagar sedan: listan till den födelsedagen är arkiverad, Lego är tillagd idag
async function openVerasLists(page: Page) {
  const name = uniqueName("Förälder");
  const vera = await addChild(await addParent(name), "Vera", birthdateIn(-40).birthdate);
  await addWish(vera, "birthday", "Cykel", { addedAt: dateIn(-50), claimedBy: "Moster Lisa" });
  await addWish(vera, "birthday", "Pussel", { addedAt: dateIn(-45), size: "100 bitar" });
  await addWish(vera, "birthday", "Lego");
  await adminSignIn(page, name);
  await goto(page, `/admin/barn/${vera}/onskelistor`);
  const archive = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Arkiv" }) });
  const group = `Födelsedag ${dateIn(-40).slice(0, 4)}`;
  return { archive, group, toggle: archive.getByRole("button", { name: `Visa ${group}` }) };
}

test("MUPP-031-R5 R7 the archive lies under the lists, one folded group per occasion, opening to rows with only +, which copies an item into a list", async ({ page }) => {
  const { archive, group, toggle } = await openVerasLists(page);
  const birthday = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Födelsedag", exact: true }) });
  await expect(birthday.getByRole("heading", { level: 3 })).toHaveText(["Lego"]);

  await expect(archive.getByRole("heading", { level: 3 })).toHaveText([group]);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(archive.getByText("Cykel")).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const rows = archive.getByRole("heading", { level: 4 });
  await expect(rows).toHaveText(["Cykel", "Pussel"]);
  await expect(archive.getByText("Paxad av Moster Lisa")).toBeVisible();
  // Inga datum och inga knappar utom "+"
  await expect(archive).not.toContainText(dateIn(-50));
  await expect(archive.getByRole("button", { name: /^(Ändra|Ta bort)/ })).toHaveCount(0);
  await expect(archive.getByRole("button", { name: /^Lägg till .* igen$/ })).toHaveCount(2);
  await expectNoA11yViolations(page);

  // R7: + asks which list; Avbryt and Esc change nothing, Julafton adds a copy, and focus goes back to + (samma sida, för testernas tid)
  const plus = archive.getByRole("button", { name: "Lägg till Pussel igen" });
  expect((await plus.boundingBox())!.width).toBeGreaterThanOrEqual(24);

  await plus.click();
  await expect(dialog(page)).toHaveAccessibleName("Lägg till ”Pussel” igen");
  await expect(dialog(page).getByRole("button")).toHaveText(["Födelsedag", "Julafton", "Avbryt"]);
  await expectNoA11yViolations(page);
  await dialog(page).getByRole("button", { name: "Avbryt" }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(plus).toBeFocused();
  await plus.click();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(plus).toBeFocused();
  expect(await countRows("wishlist_item")).toBe(3);

  await plus.click();
  await dialog(page).getByRole("button", { name: "Julafton" }).click();
  await expect(dialog(page)).toBeHidden();
  const christmas = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Jul", exact: true }) });
  await expect(christmas.getByRole("heading", { level: 3 })).toHaveText(["Pussel"]);
  await expect(archive.getByRole("heading", { level: 4 })).toHaveText(["Cykel", "Pussel"]);
  await expect(plus).toBeFocused();
});
