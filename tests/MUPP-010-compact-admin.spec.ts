import { readdirSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { testPicturesDir } from "../lib/local-db.mjs";
import { adminSignIn, expectNoA11yViolations, runsLocally, uniqueName } from "./helpers";
import { addChild, addParent, clearFamily, pictureOf } from "./family-db";
import { testIp } from "./site-session";

// Like the MUPP-003 tests, these need the local test server (its own database, passwords and picture folder)
test.skip(!runsLocally, "the admin tests need the local test server (its own database, passwords and picture folder)");

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const hasHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
const dialog = (page: Page) => page.getByRole("alertdialog");

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
});
test.afterEach(clearFamily);

// The slim card of a kid or a parent on the Hantera page, found by its name
const card = (page: Page, name: string) => page.getByRole("article").filter({ has: page.getByRole("heading", { level: 3, name, exact: true }) });
const expanded = (button: Locator) => button.getAttribute("aria-expanded");

test("MUPP-010-R1 R2 R6 Hantera starts folded: two headings, slim cards, and icon buttons that are named, have a tooltip and are at least 32 px", async ({ page }) => {
  // Short names, as real ones are: a long name wraps and makes the card higher
  const chef = "Ada";
  const chefId = await addParent(chef, true);
  const kid = "Otis";
  await addChild(chefId, kid);
  await page.setViewportSize({ width: 375, height: 667 });
  await adminSignIn(page, chef);
  await page.goto("/admin/hantera");

  // R1: the headings, one slim card per parent and kid, nothing unfolded, no form field in sight
  await expect(page.getByRole("heading", { level: 2, name: "Föräldrar" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Barn" })).toBeVisible();
  const parentCard = card(page, chef);
  const kidCard = card(page, kid);
  await expect(parentCard).toContainText("Huvudadministratör");
  await expect(kidCard.getByRole("img")).toHaveCount(0);
  await expect(page.locator("main input:visible, main select:visible, main textarea:visible")).toHaveCount(0);
  for (const toggle of [kidCard.getByRole("button", { name: `Ändra ${kid}` }), kidCard.getByRole("button", { name: `Bild för ${kid}` }), parentCard.getByRole("button", { name: `Ändra ${chef}` })]) {
    expect(await expanded(toggle)).toBe("false");
  }
  // R6: a folded card is about one line high
  for (const slim of [parentCard, kidCard]) expect((await slim.boundingBox())!.height).toBeLessThanOrEqual(56);

  // R2: the icons have an accessible name and the same text as a tooltip, are at least 32 × 32 px and do not touch
  const icons: [Locator, string][] = [
    [kidCard.getByRole("link", { name: `Önskelistor för ${kid}` }), `Önskelistor för ${kid}`],
    [kidCard.getByRole("button", { name: `Ändra ${kid}` }), `Ändra ${kid}`],
    [kidCard.getByRole("button", { name: `Bild för ${kid}` }), `Bild för ${kid}`],
    [kidCard.getByRole("button", { name: `Ta bort ${kid}` }), `Ta bort ${kid}`],
    [parentCard.getByRole("button", { name: `Ändra ${chef}` }), `Ändra ${chef}`],
    [parentCard.getByRole("button", { name: `Ta bort ${chef}` }), `Ta bort ${chef}`],
  ];
  let previousRight = -Infinity;
  for (const [icon, name] of icons) {
    await expect(icon).toHaveAttribute("title", name);
    await expect(icon).not.toContainText(/./);
    const box = (await icon.boundingBox())!;
    expect(box.width, name).toBeGreaterThanOrEqual(32);
    expect(box.height, name).toBeGreaterThanOrEqual(32);
    if (name.endsWith(kid) && previousRight !== -Infinity) expect(box.x - previousRight, name).toBeGreaterThanOrEqual(4);
    previousRight = name.endsWith(kid) ? box.x + box.width : -Infinity;
  }
  // The buttons that open a form keep their text
  for (const name of ["Ny förälder", "Nytt barn"]) await expect(page.getByRole("button", { name })).toHaveText(name);
  await expectNoA11yViolations(page);
});

test("MUPP-010-R1 R3 a card unfolds with its form, one panel is open at a time, Esc and saving fold it, a mistake keeps it open", async ({ page }) => {
  const chef = uniqueName("Chef");
  const chefId = await addParent(chef, true);
  const [first, second] = [uniqueName("Ett"), uniqueName("Två")];
  await addChild(chefId, first, "2019-03-09");
  await addChild(chefId, second);
  await adminSignIn(page, chef);
  await page.goto("/admin/hantera");
  const [one, two] = [card(page, first), card(page, second)];
  const pencil = one.getByRole("button", { name: `Ändra ${first}` });

  // R1: unfolded, the information beside the picture and the form below; only the buttons are icons
  await pencil.click();
  expect(await expanded(pencil)).toBe("true");
  await expect(one).toContainText(`Född 2019-03-09, förälder: ${chef}`);
  await expect(one.getByLabel("Namn")).toHaveValue(first);
  await expectNoA11yViolations(page);

  // R3: opening the other card, the picture panel and a "new" form each fold the one before
  await two.getByRole("button", { name: `Ändra ${second}` }).click();
  expect(await expanded(pencil)).toBe("false");
  await expect(one.getByLabel("Namn")).toHaveCount(0);
  await two.getByRole("button", { name: `Bild för ${second}` }).click();
  await expect(two.getByLabel("Namn")).toHaveCount(0);
  await expect(two.getByLabel("Bild", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ny förälder" }).click();
  await expect(two.getByLabel("Bild", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Nytt barn" }).click();
  await expect(page.getByRole("button", { name: "Ny förälder" })).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("main form:visible")).toHaveCount(1);

  // R3: a form with a mistake stays open with its message next to the field; the same button folds it
  await page.getByRole("button", { name: "Lägg till" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Fyll i det här fältet." }).first()).toBeVisible();
  await expect(page.getByLabel("Namn")).toBeVisible();
  await page.getByRole("button", { name: "Nytt barn" }).click();
  await expect(page.locator("main form:visible")).toHaveCount(0);

  // R3: Esc folds the panel and gives focus back to the button; a saved form folds too
  await pencil.click();
  await one.getByLabel("Namn").focus();
  await page.keyboard.press("Escape");
  await expect(one.getByLabel("Namn")).toHaveCount(0);
  await expect(pencil).toBeFocused();
  const renamed = uniqueName("Nytt namn");
  await pencil.click();
  await one.getByLabel("Namn").fill(renamed);
  await one.getByRole("button", { name: "Spara" }).click();
  await expect(card(page, renamed)).toBeVisible();
  await expect(page.locator("main form:visible")).toHaveCount(0);
});

test("MUPP-010-R4 a picture is uploaded, shown as a row with Bild and a trash can, and removed after a confirmation that names the kid", async ({ page }) => {
  const chef = uniqueName("Chef");
  const kid = uniqueName("Barn");
  const kidId = await addChild(await addParent(chef, true), kid);
  await adminSignIn(page, chef);
  await page.goto("/admin/hantera");
  const kidCard = card(page, kid);
  const pictureButton = kidCard.getByRole("button", { name: `Bild för ${kid}` });
  const files = () => readdirSync(testPicturesDir).filter((f) => f.startsWith(`barn-${kidId}-`));

  // No picture yet: the panel has only the file field
  await pictureButton.click();
  await expect(kidCard.getByRole("button", { name: /^Ta bort bilden/ })).toHaveCount(0);
  await expectNoA11yViolations(page);
  await kidCard.getByLabel("Bild", { exact: true }).setInputFiles({ name: "bild.png", mimeType: "image/png", buffer: png });
  await kidCard.getByRole("button", { name: "Spara bild" }).click();
  await expect.poll(() => pictureOf(kidId)).toMatch(/\.png$/);
  await expect(kidCard.locator(`img[src="/bilder/${kidId}"]`)).toBeVisible();
  expect(files()).toHaveLength(1);

  // With a picture the panel has a row: a thumbnail, "Bild" and a trash can that names the kid
  await pictureButton.click();
  const remove = kidCard.getByRole("button", { name: `Ta bort bilden för ${kid}` });
  await expect(kidCard.locator("span", { hasText: /^Bild$/ })).toBeVisible();
  await expect(remove).toHaveAttribute("title", `Ta bort bilden för ${kid}`);
  await expect(kidCard.getByLabel("Bild", { exact: true })).toBeVisible();
  await expectNoA11yViolations(page);

  // The confirmation names the kid; Avbryt keeps the picture, Ta bort removes it from the kid and from the store
  await remove.click();
  await expect(dialog(page).getByRole("heading", { name: `Ta bort bilden för ${kid}?` })).toBeVisible();
  await expect(dialog(page)).toContainText(kid);
  await expectNoA11yViolations(page);
  await dialog(page).getByRole("button", { name: "Avbryt" }).click();
  expect(await pictureOf(kidId)).not.toBe("");
  await remove.click();
  await dialog(page).getByRole("button", { name: "Ta bort" }).click();
  await expect(remove).toHaveCount(0);
  expect(await pictureOf(kidId)).toBe("");
  expect(files()).toHaveLength(0);
  // The kid shows the avatar again, and the picture is gone
  await expect(kidCard.locator("img")).toHaveCount(0);
  expect((await page.request.get(`/bilder/${kidId}`)).status()).toBe(404);
  // The kid itself is still there
  await expect(kidCard).toBeVisible();
});

test("MUPP-010-R1 R3 R5 the sizes page has only the sizes, the wish list page only the lists as slim folded rows", async ({ page }) => {
  const mia = uniqueName("Mia");
  const kid = uniqueName("Barn");
  const kidId = await addChild(await addParent(mia), kid);
  await adminSignIn(page, mia);

  // R5: the sizes page has the sizes and nothing of the wish lists
  await page.goto(`/admin/barn/${kidId}/storlekar`);
  await expect(page.getByRole("heading", { level: 1, name: kid })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Storlekar" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Födelsedag|Jul/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Ny önskning/ })).toHaveCount(0);
  await page.getByLabel("Kläder").fill("128");
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Sparat." })).toBeVisible();
  await expectNoA11yViolations(page);

  // R5: the wish list page has Födelsedag and Jul as separate cards and no sizes
  await page.goto(`/admin/barn/${kidId}/onskelistor`);
  const birthday = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Födelsedag" }) });
  const christmas = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Jul" }) });
  await expect(birthday).toBeVisible();
  await expect(christmas.getByRole("heading", { name: "Födelsedag" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Storlekar" })).toHaveCount(0);
  await expect(page.getByLabel("Kläder")).toHaveCount(0);
  // R1: everything is folded when the page opens
  await expect(page.locator("main form:visible")).toHaveCount(0);

  // An item is a slim row with its icon buttons; "Ny önskning" has text
  await birthday.getByRole("button", { name: "Ny önskning, Födelsedag" }).click();
  await birthday.getByLabel("Namn").fill("Pussel");
  await birthday.getByRole("button", { name: "Lägg till" }).click();
  const item = birthday.getByRole("article").filter({ hasText: "Pussel" });
  await expect(item).toBeVisible();
  expect((await item.boundingBox())!.height).toBeLessThanOrEqual(56);
  await expect(item.getByRole("button", { name: "Ändra Pussel" })).toHaveAttribute("title", "Ändra Pussel");
  await expect(item.getByRole("button", { name: "Ta bort Pussel" })).toHaveAttribute("title", "Ta bort Pussel");
  await expect(item.getByLabel("Namn")).toHaveCount(0);

  // R3: opening an item folds the "new" form; the item shows its details and form
  await birthday.getByRole("button", { name: "Ny önskning, Födelsedag" }).click();
  await item.getByRole("button", { name: "Ändra Pussel" }).click();
  await expect(birthday.getByRole("button", { name: "Ny önskning, Födelsedag" })).toHaveAttribute("aria-expanded", "false");
  await expect(item.getByLabel("Namn")).toHaveValue("Pussel");
  await expectNoA11yViolations(page);
});

test("MUPP-010-R6 five kids fit on a phone without scrolling", async ({ page }) => {
  const chef = uniqueName("Chef");
  const chefId = await addParent(chef, true);
  for (const name of ["Alva", "Bo", "Cleo", "Dan", "Eli"]) await addChild(chefId, name);
  await adminSignIn(page, chef);

  for (const [width, height] of [[375, 667], [430, 932]]) {
    await page.setViewportSize({ width, height });
    // The parent's own page: all five kids are inside the screen, the page itself does not scroll
    await page.goto("/admin");
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
    const kids = page.getByRole("article");
    await expect(kids).toHaveCount(5);
    for (const index of [0, 4]) {
      const box = (await kids.nth(index).boundingBox())!;
      expect(box.y + box.height, `kid ${index} at ${width}`).toBeLessThanOrEqual(height);
    }
  }
});

test("MUPP-010-R6 the unfolded panels and the kid pages have no sideways scroll at 320 and 430 px, and pass axe", async ({ page }) => {
  const chef = uniqueName("Chef");
  const kidId = await addChild(await addParent(chef, true), uniqueName("Barn"));
  await adminSignIn(page, chef);

  for (const [width, height] of [[320, 568], [430, 932]]) {
    await page.setViewportSize({ width, height });
    await page.goto("/admin/hantera");
    const first = page.getByRole("article").filter({ has: page.getByRole("button", { name: /^Bild för / }) }).first();
    await first.getByRole("button", { name: /^Ändra / }).click();
    expect(await hasHorizontalScroll(page), `edit at ${width}`).toBe(false);
    await first.getByRole("button", { name: /^Bild för / }).click();
    expect(await hasHorizontalScroll(page), `picture at ${width}`).toBe(false);
    await page.goto(`/admin/barn/${kidId}/storlekar`);
    expect(await hasHorizontalScroll(page), `sizes at ${width}`).toBe(false);
    await expectNoA11yViolations(page);
    await page.goto(`/admin/barn/${kidId}/onskelistor`);
    expect(await hasHorizontalScroll(page), `lists at ${width}`).toBe(false);
    await expectNoA11yViolations(page);
  }
});

test("MUPP-010-R6 with the keyboard only: Tab to the pencil, Enter opens, Esc folds, and Tab reaches the trash can and the confirmation", async ({ page }) => {
  const chef = uniqueName("Chef");
  const kid = uniqueName("Barn");
  await addChild(await addParent(chef, true), kid);
  await adminSignIn(page, chef);
  await page.goto("/admin/hantera");
  await page.waitForLoadState("networkidle");
  const kidCard = card(page, kid);
  const pencil = kidCard.getByRole("button", { name: `Ändra ${kid}` });

  await kidCard.getByRole("link", { name: `Önskelistor för ${kid}` }).focus();
  await page.keyboard.press("Tab");
  await expect(pencil).toBeFocused();
  await expect(pencil).toHaveCSS("outline-width", "3px");
  await page.keyboard.press("Enter");
  await expect(kidCard.getByLabel("Namn")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(kidCard.getByLabel("Namn")).toHaveCount(0);
  await expect(pencil).toBeFocused();

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(kidCard.getByRole("button", { name: `Ta bort ${kid}` })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog(page).getByRole("button", { name: "Avbryt" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
});

test("MUPP-010-R2 R5 a kid on the parent's page has a measuring tape to a page with only the sizes and a checklist to a page with only the wish lists", async ({ page }) => {
  const mia = "Mia";
  await addChild(await addParent(mia), "Otis");
  await adminSignIn(page, mia);
  for (const name of ["Storlekar för Otis", "Önskelistor för Otis"]) {
    const link = page.getByRole("link", { name });
    await expect(link).toHaveAttribute("title", name);
    expect((await link.boundingBox())!.width).toBeGreaterThanOrEqual(32);
  }
  await expectNoA11yViolations(page);
  await page.getByRole("link", { name: "Storlekar för Otis" }).click();
  await expect(page.getByLabel("Kläder")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Födelsedag" })).toHaveCount(0);
  await page.goto("/admin");
  await page.getByRole("link", { name: "Önskelistor för Otis" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Födelsedag" })).toBeVisible();
  await expect(page.getByLabel("Kläder")).toHaveCount(0);
});
