import { readdirSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { testPicturesDir } from "../lib/local-db.mjs";
import { adminSignIn, expectNoA11yViolations, goto, runsLocally, settledBox, uniqueName } from "./helpers";
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

test("MUPP-010-R1 R2 R6 Hantera starts with every card closed: two headings, slim cards, and icon buttons that are named, have a tooltip and are at least 32 px", async ({ page }) => {
  // Short names, as real ones are: a long name wraps and makes the card higher
  const chef = "Ada";
  const chefId = await addParent(chef, true);
  const kid = "Otis";
  await addChild(chefId, kid);
  await page.setViewportSize({ width: 375, height: 667 });
  await adminSignIn(page, chef);
  await goto(page, "/admin/hantera");

  // R1: the headings, one slim card per parent and kid, no card open, no form field in sight
  await expect(page.getByRole("heading", { level: 2, name: "Föräldrar" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Barn" })).toBeVisible();
  const parentCard = card(page, chef);
  const kidCard = card(page, kid);
  await expect(parentCard).toContainText("Huvudadministratör");
  await expect(kidCard.getByRole("img")).toHaveCount(0);
  await expect(page.locator("main input:visible, main select:visible, main textarea:visible")).toHaveCount(0);
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  // R6: a slim card is about one line high
  for (const slim of [parentCard, kidCard]) expect((await settledBox(slim)).height).toBeLessThanOrEqual(56);

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
    const box = await settledBox(icon);
    expect(box.width, name).toBeGreaterThanOrEqual(32);
    expect(box.height, name).toBeGreaterThanOrEqual(32);
    if (name.endsWith(kid) && previousRight !== -Infinity) expect(box.x - previousRight, name).toBeGreaterThanOrEqual(4);
    previousRight = name.endsWith(kid) ? box.x + box.width : -Infinity;
  }
  // The buttons that add a row are plus icons without text (MUPP-053)
  for (const name of ["Ny förälder", "Nytt barn"]) await expect(page.getByRole("button", { name })).toHaveText("");
  await expectNoA11yViolations(page);
});

test("MUPP-010-R4 a picture is uploaded, shown as a row with Bild and a trash can, and removed after a confirmation that names the kid", async ({ page }) => {
  const chef = uniqueName("Chef");
  const kid = uniqueName("Barn");
  const kidId = await addChild(await addParent(chef, true), kid);
  await adminSignIn(page, chef);
  await goto(page, "/admin/hantera");
  const kidCard = card(page, kid);
  const pictureButton = kidCard.getByRole("button", { name: `Bild för ${kid}` });
  const files = () => readdirSync(testPicturesDir).filter((f) => f.startsWith(`barn-${kidId}-`));

  // No picture yet: the card has only the file field
  await pictureButton.click();
  await expect(kidCard.getByRole("button", { name: /^Ta bort bilden/ })).toHaveCount(0);
  await expectNoA11yViolations(page);
  await kidCard.getByLabel("Bild", { exact: true }).setInputFiles({ name: "bild.png", mimeType: "image/png", buffer: png });
  await kidCard.getByRole("button", { name: "Spara bild" }).click();
  await expect.poll(() => pictureOf(kidId)).toMatch(/\.webp$/);
  await expect(kidCard.locator(`img[src^="/bilder/${kidId}?v="]`)).toBeVisible();
  expect(files()).toHaveLength(1);

  // With a picture the card has a row: a thumbnail, "Bild" and a trash can that names the kid
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

test("MUPP-010-R1 R5 the wish list page has only the lists, as slim rows, and the kid's sizes are a card on the parent's page", async ({ page }) => {
  const mia = uniqueName("Mia");
  const kid = uniqueName("Barn");
  const kidId = await addChild(await addParent(mia), kid);
  await adminSignIn(page, mia);

  // The sizes: a card on the parent's page (MUPP-045-R2), with nothing of the wish lists
  await page.getByRole("button", { name: `Storlekar för ${kid}` }).click();
  const sizes = page.locator("dialog[open]");
  await expect(sizes.getByRole("heading", { level: 2, name: `Storlekar för ${kid}` })).toBeVisible();
  await expect(sizes.getByRole("button", { name: /Ny önskning/ })).toHaveCount(0);
  await sizes.getByLabel("Kläder").fill("128");
  await sizes.getByRole("button", { name: "Spara" }).click();
  await expect(sizes).toHaveCount(0);
  await expectNoA11yViolations(page);

  // R5: the wish list page has Födelsedag and Jul as separate cards and no sizes
  await goto(page, `/admin/barn/${kidId}/onskelistor`);
  const birthday = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Födelsedag" }) });
  const christmas = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Jul" }) });
  await expect(birthday).toBeVisible();
  await expect(christmas.getByRole("heading", { name: "Födelsedag" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Storlekar" })).toHaveCount(0);
  await expect(page.getByLabel("Kläder")).toHaveCount(0);
  // R1: no card is open when the page opens
  await expect(page.locator("main form:visible")).toHaveCount(0);

  // An item is a slim row with its icon buttons
  await birthday.getByRole("button", { name: "Ny önskning, Födelsedag" }).click();
  await birthday.getByLabel("Namn").fill("Pussel");
  await birthday.getByRole("button", { name: "Lägg till" }).click();
  await page.keyboard.press("Escape");
  const item = birthday.getByRole("article").filter({ hasText: "Pussel" });
  await expect(item).toBeVisible();
  expect((await settledBox(item)).height).toBeLessThanOrEqual(56);
  await expect(item.getByRole("button", { name: "Ändra Pussel" })).toHaveAttribute("title", "Ändra Pussel");
  await expect(item.getByRole("button", { name: "Ta bort Pussel" })).toHaveAttribute("title", "Ta bort Pussel");
  await expect(item.getByLabel("Namn")).toHaveCount(0);

  // The item's card shows its details and form
  await item.getByRole("button", { name: "Ändra Pussel" }).click();
  await expect(item.getByLabel("Namn")).toHaveValue("Pussel");
  await expectNoA11yViolations(page);
});

test("MUPP-010-R6 five kids fit on a phone without scrolling", async ({ page }) => {
  const chef = uniqueName("Chef");
  const chefId = await addParent(chef, true);
  for (const name of ["Alva", "Bo", "Cleo", "Dan", "Eli"]) await addChild(chefId, name);
  await adminSignIn(page, chef);

  // The page is opened once and measured at each width by resizing the window (TECH-015)
  await goto(page, "/admin");
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
  const kids = page.getByRole("article");
  await expect(kids).toHaveCount(5);
  for (const [width, height] of [[375, 667], [430, 932]]) {
    await page.setViewportSize({ width, height });
    // The parent's own page: all five kids are inside the screen, the page itself does not scroll
    for (const index of [0, 4]) {
      const box = await settledBox(kids.nth(index));
      expect(box.y + box.height, `kid ${index} at ${width}`).toBeLessThanOrEqual(height);
    }
  }
});

test("MUPP-010-R6 the open cards and the kid pages have no sideways scroll at 320, 375 and 430 px, and pass axe", async ({ page }) => {
  const chef = uniqueName("Chef");
  const kidId = await addChild(await addParent(chef, true), uniqueName("Barn"));
  await adminSignIn(page, chef);

  // Each page is opened once and checked at each width by resizing the window (TECH-015)
  const widths = [[320, 568], [375, 667], [430, 932]];
  const noSidewaysScroll = async (what: string) => {
    for (const [width, height] of widths) {
      await page.setViewportSize({ width, height });
      expect(await hasHorizontalScroll(page), `${what} at ${width}`).toBe(false);
    }
  };
  // MUPP-033-R1: the birthdate field ends inside its form, in the add form and in an edit form
  const dateInsideForm = async (form: Locator, what: string) => {
    for (const [width, height] of widths) {
      await page.setViewportSize({ width, height });
      // The card may still be growing (MUPP-045): both boxes are read once they have settled
      const date = await settledBox(form.getByLabel("Födelsedatum"));
      const box = await settledBox(form);
      expect(date.x + date.width, `${what} date field at ${width}`).toBeLessThanOrEqual(box.x + box.width + 0.5);
    }
  };
  await goto(page, "/admin/hantera");
  await page.getByRole("button", { name: "Nytt barn" }).click();
  await dateInsideForm(page.locator("form").filter({ has: page.getByLabel("Födelsedatum") }).first(), "add");
  await noSidewaysScroll("add");
  const first = page.getByRole("article").filter({ has: page.getByRole("button", { name: /^Bild för / }) }).first();
  await page.keyboard.press("Escape");
  await first.getByRole("button", { name: /^Ändra / }).click();
  await dateInsideForm(first.locator("form").filter({ has: page.getByLabel("Födelsedatum") }), "edit");
  await noSidewaysScroll("edit");
  await page.keyboard.press("Escape");
  await first.getByRole("button", { name: /^Bild för / }).click();
  await noSidewaysScroll("picture");
  await page.keyboard.press("Escape");
  await goto(page, "/admin");
  await page.getByRole("button", { name: /^Storlekar för / }).click();
  await noSidewaysScroll("sizes");
  await expectNoA11yViolations(page);
  await goto(page, `/admin/barn/${kidId}/onskelistor`);
  await noSidewaysScroll("lists");
  await expectNoA11yViolations(page);
});

test("MUPP-010-R6 with the keyboard only: Tab to the pencil, Enter opens, Esc closes, and Tab reaches the trash can and the confirmation", async ({ page }) => {
  const chef = uniqueName("Chef");
  const kid = uniqueName("Barn");
  await addChild(await addParent(chef, true), kid);
  await adminSignIn(page, chef);
  await goto(page, "/admin/hantera");
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

test("MUPP-010-R2 R5 a kid on the parent's page has a measuring tape that opens the sizes and a checklist to a page with only the wish lists", async ({ page }) => {
  const mia = "Mia";
  await addChild(await addParent(mia), "Otis");
  await adminSignIn(page, mia);
  for (const [role, name] of [["button", "Storlekar för Otis"], ["link", "Önskelistor för Otis"]] as const) {
    const control = page.getByRole(role, { name });
    await expect(control).toHaveAttribute("title", name);
    expect((await settledBox(control)).width).toBeGreaterThanOrEqual(32);
  }
  await expectNoA11yViolations(page);
  await page.getByRole("button", { name: "Storlekar för Otis" }).click();
  await expect(page.getByLabel("Kläder")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Födelsedag" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Önskelistor för Otis" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Födelsedag" })).toBeVisible();
  await expect(page.getByLabel("Kläder")).toHaveCount(0);
});
