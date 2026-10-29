import { readdirSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { createAdminSession } from "../lib/admin-session";
import { testPicturesDir } from "../lib/local-db.mjs";
import { adminSignIn, expectNoA11yViolations, pickOption, runsLocally, uniqueName } from "./helpers";
import { addChild, addParent, childIdOf, clearFamily, countRows, pictureOf, removeParentRow, setMasterFlag } from "./family-db";
import { testIp } from "./site-session";

// The admin pages are tested against the local test server only: it has made-up passwords and its
// own database and picture folder, and the tests make their data straight in that database.
test.skip(!runsLocally, "the admin tests need the local test server (its own database, passwords and picture folder)");

const secret = process.env.ADMIN_SESSION_SECRET ?? "";
const hasHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
// The test server is a production build, so the cookie has the __Host- prefix and is Secure
const ADMIN_COOKIE = "__Host-admin_session";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1]);

test.beforeEach(async ({ page }) => {
  // Its own "IP address" per test, so that the limits on wrong passwords and writes are not shared
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
});
test.afterEach(clearFamily);

// The card for a list (Födelsedag or Jul) on a kid's page
const list = (page: Page, name: string) => page.locator("section", { has: page.getByRole("heading", { level: 2, name, exact: true }) });
// Opens the form behind a button ("Ändra …", "Ny önskning, …") unless it is open, and gives
// the card it is in (MUPP-010: one panel is open at a time, so opening one folds another)
async function opened(scope: Locator, name: string) {
  const toggle = scope.getByRole("button", { name });
  if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
  return scope;
}
// The page's alert dialog: answers it
const dialog = (page: Page) => page.getByRole("alertdialog");

test("MUPP-003-R1 without the admin cookie /admin shows only the sign-in, anything below it leads there, and actions are refused", async ({ page, request }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 1, name: "Admin" })).toBeVisible();
  const field = page.getByLabel("Adminlösenord");
  await expect(field).toHaveAttribute("type", "password");
  await expect(page.getByRole("button", { name: "Logga in" })).toBeVisible();
  // Nothing else from the admin: no parents, no lists, no links but the site name
  await expect(page.getByRole("link")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(0);
  await expectNoA11yViolations(page);

  for (const path of ["/admin/hantera", "/admin/barn/1/storlekar", "/admin/barn/1/onskelistor", "/admin/finns-inte"]) {
    await page.goto(path);
    await expect(page, path).toHaveURL(/\/admin$/);
    await expect(page.getByLabel("Adminlösenord")).toBeVisible();
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(307);
    // (Next.js writes the address of a redirect as text in the answer; no content of the page)
    expect(["", "/admin"], path).toContain(await response.text());
  }
  // An action below /admin, such as the picture upload, gets 401 without a body
  const action = await request.post("/admin/hantera", { maxRedirects: 0, headers: { "next-action": "abc" }, data: "[]" });
  expect(action.status()).toBe(401);
  expect(await action.text()).toBe("");
});

test("MUPP-003-R1 R8 a wrong password is answered after a second next to the field, the right one sets a session cookie", async ({ page, context }) => {
  await page.goto("/admin");
  const field = page.getByLabel("Adminlösenord");
  await field.fill("fel lösenord");
  const started = Date.now();
  await page.getByRole("button", { name: "Logga in" }).click();
  const error = page.getByRole("alert").filter({ hasText: "Fel lösenord." });
  await expect(error).toBeVisible();
  expect(Date.now() - started).toBeGreaterThanOrEqual(900);
  // The error is read out, and the field points to it
  await expect(field).toHaveAttribute("aria-invalid", "true");
  await expect(field).toHaveAttribute("aria-describedby", new RegExp(`${await error.getAttribute("id")}`));
  await expectNoA11yViolations(page);
  expect(await context.cookies()).toEqual(expect.not.arrayContaining([expect.objectContaining({ name: ADMIN_COOKIE })]));

  await field.fill(process.env.ADMIN_PASSWORD ?? "");
  await page.getByRole("button", { name: "Logga in" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Skapa huvudadministratör" })).toBeVisible();
  const cookie = (await context.cookies()).find((c) => c.name === ADMIN_COOKIE)!;
  expect(cookie).toMatchObject({ httpOnly: true, secure: true, sameSite: "Lax", path: "/", expires: -1 });
  expect(cookie.value).toMatch(/^\d+\.0\.[0-9a-f]{64}$/);
  // Lasts 8 hours from now, read out of the value
  const expires = Number(cookie.value.split(".")[0]);
  expect(expires - Date.now() / 1000).toBeGreaterThan(8 * 3600 - 120);
  expect(expires - Date.now() / 1000).toBeLessThanOrEqual(8 * 3600);
  expect(await page.evaluate(() => document.cookie)).not.toContain("admin_session");
  expect(cookie.value).not.toContain(process.env.ADMIN_PASSWORD ?? "?");
});

test("MUPP-003-R1 R2 a changed, expired or foreign cookie is refused, a signed one is accepted, and a removed parent drops the choice", async ({ page, context, baseURL }) => {
  const mia = await addParent(uniqueName("Mia"));
  const soon = Math.floor(Date.now() / 1000) + 600;
  const withCookie = async (value: string) => {
    await context.clearCookies({ name: ADMIN_COOKIE });
    await context.addCookies([{ name: ADMIN_COOKIE, value, domain: new URL(baseURL!).hostname, path: "/", secure: true }]);
    await page.goto("/admin");
  };

  const good = createAdminSession(secret, 0, soon);
  await withCookie(good);
  await expect(page.getByRole("heading", { level: 2, name: "Vem är du?" })).toBeVisible();

  const [expires, parent, signature] = good.split(".");
  const refused = {
    expired: createAdminSession(secret, 0, Math.floor(Date.now() / 1000) - 10),
    "8 hours old": createAdminSession(secret, 0, Math.floor(Date.now() / 1000) - 1),
    "another secret": createAdminSession("en-annan-nyckel", 0, soon),
    "another parent": `${expires}.${mia}.${signature}`,
    "a longer time": `${Number(expires) + 3600}.${parent}.${signature}`,
    junk: "skräp",
  };
  for (const [what, value] of Object.entries(refused)) {
    await withCookie(value);
    await expect(page.getByLabel("Adminlösenord"), what).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 }), what).toHaveCount(0);
  }

  // R2: a signed cookie for a parent that has been removed: the choice is dropped and the list shown
  await withCookie(createAdminSession(secret, mia + 1000, soon));
  await expect(page.getByRole("heading", { level: 2, name: "Vem är du?" })).toBeVisible();
});

test("MUPP-003-R1 the sixth wrong password blocks the address, and then even the right one is refused", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, storageState: "playwright/.auth/site.json", extraHTTPHeaders: { "x-real-ip": testIp() } });
  // Six wrong at once, so that the second a wrong password costs is paid once (as in TECH-005-R3)
  const pages = await Promise.all(Array.from({ length: 6 }, () => context.newPage()));
  for (const page of pages) await page.goto("/admin");
  for (const page of pages) {
    await page.getByLabel("Adminlösenord").fill("fel lösenord");
    await page.getByRole("button", { name: "Logga in" }).click();
  }
  for (const page of pages) await expect(page.getByRole("alert").filter({ hasText: "Fel lösenord." })).toHaveText("Fel lösenord.");

  const page = pages[0];
  await page.goto("/admin");
  await page.getByLabel("Adminlösenord").fill(process.env.ADMIN_PASSWORD ?? "");
  await page.getByRole("button", { name: "Logga in" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "För många försök. Försök igen om en stund." })).toHaveText("För många försök. Försök igen om en stund.");
  expect((await context.cookies()).filter((c) => c.name === ADMIN_COOKIE)).toEqual([]);
  await context.close();
});

test("MUPP-003-R2 R8 with no parent the page offers one form, Skapa huvudadministratör, with Gustav filled in", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await adminSignIn(page);
  await expect(page.getByRole("heading", { level: 2, name: "Skapa huvudadministratör" })).toBeVisible();
  await expect(page).toHaveTitle("Admin | Muppbarnens önskelistor");
  const name = page.getByLabel("Namn");
  await expect(name).toHaveValue("Gustav");
  await expect(page.getByRole("textbox")).toHaveCount(1);
  expect(await hasHorizontalScroll(page)).toBe(false);
  await expectNoA11yViolations(page);

  // An empty name is refused next to the field, and what is typed stays
  await name.fill("");
  await page.getByRole("button", { name: "Skapa" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Fyll i det här fältet." })).toHaveText("Fyll i det här fältet.");
  await name.fill("Gustav");
  await page.getByRole("button", { name: "Skapa" }).click();

  // The new parent is the master admin and is chosen at once
  await expect(page.getByText("Barn som tillhör")).toContainText("Gustav");
  await expect(page.getByRole("heading", { level: 2, name: "Hantera" })).toBeVisible();
  expect(await countRows("parent")).toBe(1);
  await expect(page.getByRole("heading", { name: "Skapa huvudadministratör" })).toHaveCount(0);
});

test("MUPP-003-R2 R3 choose who you are, change, and see only your own kids; the rights come from the database", async ({ page }) => {
  const [mia, ola, chef] = [uniqueName("Mia"), uniqueName("Ola"), uniqueName("Chef")];
  const [miaId, olaId, chefId] = [await addParent(mia), await addParent(ola), await addParent(chef, true)];
  const [miaKid, olaKid] = [uniqueName("Miabarn"), uniqueName("Olabarn")];
  await addChild(miaId, miaKid);
  await addChild(olaId, olaKid);

  await page.setViewportSize({ width: 320, height: 568 });
  await adminSignIn(page);
  // One button per parent, in cards
  await expect(page.getByRole("heading", { level: 2, name: "Vem är du?" })).toBeVisible();
  for (const name of [mia, ola, chef]) await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  expect(await hasHorizontalScroll(page)).toBe(false);
  await expectNoA11yViolations(page);

  await page.getByRole("button", { name: mia, exact: true }).click();
  await expect(page.getByText("Barn som tillhör")).toContainText(mia);
  await expect(page.getByRole("heading", { level: 2, name: miaKid })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: olaKid })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Hantera" })).toHaveCount(0);
  expect(await hasHorizontalScroll(page)).toBe(false);
  await expectNoA11yViolations(page);

  // "Byt förälder" goes back to the list; another parent shows other kids
  await page.getByRole("button", { name: "Byt förälder" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Vem är du?" })).toBeVisible();
  await page.getByRole("button", { name: ola, exact: true }).click();
  await expect(page.getByRole("heading", { level: 2, name: olaKid })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: miaKid })).toHaveCount(0);

  // The rights are read from the database on every request: the master admin's section appears and disappears with the flag
  await page.getByRole("button", { name: "Byt förälder" }).click();
  await page.getByRole("button", { name: chef, exact: true }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Hantera" })).toBeVisible();
  await setMasterFlag(chefId, false);
  await page.reload();
  await expect(page.getByText("Barn som tillhör")).toContainText(chef);
  await expect(page.getByRole("heading", { name: "Hantera" })).toHaveCount(0);
  await page.goto("/admin/hantera");
  await expect(page.getByRole("heading", { level: 1, name: "Sidan finns inte" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Föräldrar" })).toHaveCount(0);

  // The chosen parent is removed: the choice is dropped and the list shown
  await removeParentRow(chefId);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 2, name: "Vem är du?" })).toBeVisible();
});

test("MUPP-003-R3 sizes are edited and saved, a bad value shows a message, and another parent's kid is out of reach", async ({ page }) => {
  const [mia, ola] = [uniqueName("Mia"), uniqueName("Ola")];
  const [miaId, olaId] = [await addParent(mia), await addParent(ola)];
  const kid = uniqueName("Barn");
  await addChild(miaId, kid);
  const olaKid = await addChild(olaId, uniqueName("Annat"));

  await page.setViewportSize({ width: 320, height: 568 });
  await adminSignIn(page, mia);
  await page.getByRole("link", { name: `Storlekar för ${kid}` }).click();
  await expect(page.getByRole("heading", { level: 1, name: kid })).toBeVisible();
  expect(await hasHorizontalScroll(page)).toBe(false);

  await page.getByLabel("Kläder").fill("128");
  await page.getByLabel("Skor").fill("31");
  await page.getByLabel("Huvud").fill("52");
  await page.getByLabel("Handskar").fill("4-6 år");
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Sparat." })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Kläder")).toHaveValue("128");
  await expect(page.getByLabel("Handskar")).toHaveValue("4-6 år");

  // Empty clears; a too long text is refused next to its field and the typed text stays
  await page.getByLabel("Kläder").fill("");
  // (the browser's own limit is taken away to reach the server's)
  await page.getByLabel("Skor").evaluate((el) => el.removeAttribute("maxlength"));
  await page.getByLabel("Skor").fill("x".repeat(41));
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Högst 40 tecken." })).toBeVisible();
  await expect(page.getByLabel("Skor")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Skor")).toHaveValue("x".repeat(41));
  await expectNoA11yViolations(page);
  await page.getByLabel("Skor").fill("32");
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Sparat." })).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Skor")).toHaveValue("32");
  await expect(page.getByLabel("Huvud")).toHaveValue("52");
  await expect(page.getByLabel("Kläder")).toHaveValue("");

  // Another parent's kid, and an id that is no number: the page does not exist for Mia
  for (const id of [String(olaKid), "abc"]) {
    await page.goto(`/admin/barn/${id}/storlekar`);
    await expect(page.getByRole("heading", { level: 1, name: "Sidan finns inte" }), id).toBeVisible();
    await expect(page.getByLabel("Kläder"), id).toHaveCount(0);
  }
});

test("MUPP-003-R4 R8 wish lists: add, edit, remove an item and clear a list, with confirmations that name them", async ({ page }) => {
  const mia = uniqueName("Mia");
  const kid = uniqueName("Barn");
  await addChild(await addParent(mia), kid);

  await page.setViewportSize({ width: 320, height: 568 });
  await adminSignIn(page, mia);
  await page.getByRole("link", { name: `Önskelistor för ${kid}` }).click();
  const birthday = list(page, "Födelsedag");
  const christmas = list(page, "Jul");
  await expect(birthday.getByText("Inga önskningar ännu.")).toBeVisible();
  await expect(christmas.getByText("Inga önskningar ännu.")).toBeVisible();

  // Add: a missing name and a bad link are refused next to their fields
  let form = await opened(birthday, "Ny önskning");
  await expectNoA11yViolations(page);
  await form.getByLabel("Länk").fill("javascript:alert(1)");
  await form.getByRole("button", { name: "Lägg till" }).click();
  await expect(form.getByRole("alert").filter({ hasText: "Fyll i det här fältet." })).toBeVisible();
  await expect(form.getByRole("alert").filter({ hasText: "Länken måste börja med http:// eller https://." })).toBeVisible();
  await expect(form.getByLabel("Länk")).toHaveValue("javascript:alert(1)");
  await expectNoA11yViolations(page);

  // Add: Lego (unlimited, with everything), with markup in the text that must stay text
  const title = "<b>Lego</b> & Duplo";
  await form.getByLabel("Namn").fill(title);
  await form.getByLabel("Storlek").fill("Stor");
  await form.getByLabel("Beskrivning").fill("<script>alert(1)</script> En stor ask");
  await form.getByLabel("Länk").fill("https://exempel.se/lego");
  await form.getByLabel("Obegränsad").check();
  await form.getByRole("button", { name: "Lägg till" }).click();
  const item = birthday.getByRole("article").filter({ hasText: title });
  await expect(item).toBeVisible();
  const unlimited = item.locator("span").filter({ hasText: /^Obegränsad$/ });
  await expect(unlimited).toBeVisible();
  // The details are behind the row's pencil
  await expect(item.getByText("Storlek: Stor")).toHaveCount(0);
  await opened(item, "Ändra");
  await expect(item.getByText("Storlek: Stor")).toBeVisible();
  await expect(item.getByRole("link", { name: "https://exempel.se/lego" })).toHaveAttribute("href", "https://exempel.se/lego");
  await expect(item.locator("p").filter({ hasText: "<script>alert(1)</script> En stor ask" })).toBeVisible();
  // Never rendered as HTML: no element was made of the text
  expect(await birthday.locator("article b, article script").count()).toBe(0);
  // The new form folded when it was saved, is empty when opened again, and the other list is unchanged
  await expect(birthday.getByRole("button", { name: "Ny önskning" })).toHaveAttribute("aria-expanded", "false");
  form = await opened(birthday, "Ny önskning");
  await expect(form.getByLabel("Namn")).toHaveValue("");
  await expect(christmas.getByText("Inga önskningar ännu.")).toBeVisible();

  // Edit (one panel at a time: the new form folds when the row's pencil is chosen)
  const edit = await opened(item, "Ändra");
  await expect(birthday.getByRole("button", { name: "Ny önskning" })).toHaveAttribute("aria-expanded", "false");
  await edit.getByLabel("Namn").fill("Lego Technic");
  await edit.getByLabel("Obegränsad").uncheck();
  await edit.getByRole("button", { name: "Spara" }).click();
  const edited = birthday.getByRole("article").filter({ hasText: "Lego Technic" });
  await expect(edited).toBeVisible();
  await expect(edited.locator("span").filter({ hasText: /^Obegränsad$/ })).toHaveCount(0);

  // Remove: the confirmation names the item; Avbryt keeps it, Ta bort removes it
  await edited.getByRole("button", { name: "Ta bort Lego Technic" }).click();
  await expect(dialog(page).getByRole("heading", { name: "Ta bort ”Lego Technic”?" })).toBeVisible();
  await expectNoA11yViolations(page);
  await dialog(page).getByRole("button", { name: "Avbryt" }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(edited).toBeVisible();
  await edited.getByRole("button", { name: "Ta bort Lego Technic" }).click();
  await dialog(page).getByRole("button", { name: "Ta bort" }).click();
  await expect(edited).toHaveCount(0);
  expect(await countRows("wishlist_item")).toBe(0);

  // Clear a list: the confirmation names the list and the kid
  for (const name of ["Cykel", "Hjälm"]) {
    form = await opened(christmas, "Ny önskning");
    await form.getByLabel("Namn").fill(name);
    await form.getByRole("button", { name: "Lägg till" }).click();
    await expect(christmas.getByRole("heading", { level: 3, name })).toBeVisible();
  }
  await christmas.getByRole("button", { name: /^Töm listan/ }).click();
  await expect(dialog(page).getByRole("heading", { name: "Töm listan ”Jul”?" })).toBeVisible();
  await expect(dialog(page)).toContainText(kid);
  await dialog(page).getByRole("button", { name: "Töm listan" }).click();
  await expect(christmas.getByText("Inga önskningar ännu.")).toBeVisible();
  expect(await countRows("wishlist_item")).toBe(0);
  expect(await hasHorizontalScroll(page)).toBe(false);
});

test("MUPP-003-R5 the master admin manages parents and kids, moves a kid and cannot lose the last master admin", async ({ page }) => {
  const chef = uniqueName("Chef");
  const mia = uniqueName("Mia");
  await addParent(chef, true);
  await addParent(mia);

  await page.setViewportSize({ width: 320, height: 568 });
  await adminSignIn(page, chef);
  await page.getByRole("link", { name: "Hantera barn och föräldrar" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Hantera" })).toBeVisible();
  const parents = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Föräldrar" }) });
  const kids = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Barn" }) });

  // A parent: a name is needed
  let form = await opened(parents, "Ny förälder");
  await form.getByRole("button", { name: "Lägg till" }).click();
  await expect(form.getByRole("alert").filter({ hasText: "Fyll i det här fältet." })).toBeVisible();
  const ola = uniqueName("Ola");
  await form.getByLabel("Namn").fill(ola);
  await form.getByRole("button", { name: "Lägg till" }).click();
  await expect(parents.getByRole("heading", { level: 3, name: ola })).toBeVisible();
  await expectNoA11yViolations(page);

  // A kid: a real date, not more than ten months ahead (MUPP-011-R1)
  const kid = uniqueName("Barn");
  form = await opened(kids, "Nytt barn");
  await form.getByLabel("Namn").fill(kid);
  await form.getByLabel("Födelsedatum").fill("2999-01-01");
  await pickOption(page, form, "Förälder", mia);
  await form.getByRole("button", { name: "Lägg till" }).click();
  await expect(form.getByRole("alert").filter({ hasText: "Skriv ett riktigt datum, högst tio månader fram." })).toBeVisible();
  await form.getByLabel("Födelsedatum").fill("2019-03-09");
  await form.getByRole("button", { name: "Lägg till" }).click();
  const row = kids.getByRole("article").filter({ hasText: kid });
  await expectNoA11yViolations(page);
  const edit = await opened(row, "Ändra");
  await expect(row).toContainText(`Född 2019-03-09, förälder: ${mia}`);

  // Move the kid to another parent
  await pickOption(page, edit, "Förälder", ola);
  await edit.getByRole("button", { name: "Spara" }).click();
  await expect(row.getByRole("button", { name: "Ändra" })).toHaveAttribute("aria-expanded", "false");
  await opened(row, "Ändra");
  await expect(row).toContainText(`förälder: ${ola}`);

  // A parent with kids cannot be removed; the message says what to do and the dialog stays open
  await parents.getByRole("button", { name: `Ta bort ${ola}` }).click();
  await dialog(page).getByRole("button", { name: "Ta bort" }).click();
  await expect(dialog(page).getByRole("alert")).toHaveText("Föräldern har barn. Flytta eller ta bort barnen först.");
  await dialog(page).getByRole("button", { name: "Avbryt" }).click();

  // The last master admin can be neither removed nor lose the flag
  await parents.getByRole("button", { name: `Ta bort ${chef}` }).click();
  await dialog(page).getByRole("button", { name: "Ta bort" }).click();
  await expect(dialog(page).getByRole("alert")).toHaveText("Det måste finnas minst en huvudadministratör.");
  await dialog(page).getByRole("button", { name: "Avbryt" }).click();
  const chefEdit = await opened(parents.getByRole("article").filter({ hasText: chef }), "Ändra");
  await chefEdit.getByLabel("Huvudadministratör").uncheck();
  await chefEdit.getByRole("button", { name: "Spara" }).click();
  await expect(chefEdit.getByRole("alert").filter({ hasText: "Det måste finnas minst en huvudadministratör." })).toHaveText("Det måste finnas minst en huvudadministratör.");

  // Remove the kid after a confirmation, then its parent
  await row.getByRole("button", { name: `Ta bort ${kid}` }).click();
  await expect(dialog(page)).toContainText(kid);
  await dialog(page).getByRole("button", { name: "Ta bort" }).click();
  await expect(row).toHaveCount(0);
  await parents.getByRole("button", { name: `Ta bort ${ola}` }).click();
  await dialog(page).getByRole("button", { name: "Ta bort" }).click();
  await expect(parents.getByRole("heading", { level: 3, name: ola })).toHaveCount(0);
  expect(await countRows("child")).toBe(0);
  expect(await hasHorizontalScroll(page)).toBe(false);
});

test("MUPP-003-R6 a picture is uploaded, shown only through the site, replaced, and a bad file is refused", async ({ page, playwright, baseURL }) => {
  const chef = uniqueName("Chef");
  const kid = uniqueName("Barn");
  const chefId = await addParent(chef, true);
  const kidId = await addChild(chefId, kid);
  const noPicture = await addChild(chefId, uniqueName("Utan bild"));

  await adminSignIn(page, chef);
  await page.goto("/admin/hantera");
  const row = page.getByRole("article").filter({ hasText: kid });
  const upload = async (file: { name: string; mimeType: string; buffer: Buffer }) => {
    const form = await opened(row, `Bild för ${kid}`);
    await form.getByLabel("Bild", { exact: true }).setInputFiles(file);
    await form.getByRole("button", { name: "Spara bild" }).click();
    return form;
  };
  const message = "Bilden måste vara JPEG, PNG eller WebP och högst 4 MB.";

  // Refused by content: text with a picture's name and type, a file that is too large, and a GIF
  let form = await upload({ name: "bild.jpg", mimeType: "image/jpeg", buffer: Buffer.from("detta är text, inte en bild") });
  await expect(form.getByRole("alert").filter({ hasText: message })).toBeVisible();
  form = await upload({ name: "stor.png", mimeType: "image/png", buffer: Buffer.concat([png, Buffer.alloc(4 * 1024 * 1024)]) });
  await expect(form.getByRole("alert").filter({ hasText: message })).toBeVisible();
  form = await upload({ name: "rörlig.gif", mimeType: "image/gif", buffer: Buffer.from("GIF89a\u0001\u0000") });
  await expect(form.getByRole("alert").filter({ hasText: message })).toBeVisible();
  expect(await pictureOf(kidId)).toBe("");
  await expectNoA11yViolations(page);

  // A picture: stored, shown next to the name as decoration (empty alt text), served at /bilder/<id>
  form = await upload({ name: "bild.png", mimeType: "image/png", buffer: png });
  // The panel folds when the picture is saved
  await expect.poll(() => pictureOf(kidId)).toMatch(/\.png$/);
  await expect(form.getByLabel("Bild", { exact: true })).toHaveCount(0);
  const first = await pictureOf(kidId);
  expect(first).toMatch(/^barn-\d+-[0-9a-f-]{36}\.png$/);
  await expect(row.locator(`img[src="/bilder/${kidId}"]`)).toHaveAttribute("alt", "");
  const served = await page.request.get(`/bilder/${kidId}`);
  expect(served.status()).toBe(200);
  expect(served.headers()["content-type"]).toBe("image/png");
  expect(await served.body()).toEqual(png);
  // The page never mentions where the file is kept
  expect(await page.content()).not.toContain(first);

  // Replaced: the old file is gone
  await upload({ name: "ny.jpg", mimeType: "image/jpeg", buffer: jpeg });
  await expect.poll(() => pictureOf(kidId)).toMatch(/\.jpg$/);
  expect(readdirSync(testPicturesDir).filter((f) => f.startsWith(`barn-${kidId}-`))).toHaveLength(1);
  expect((await page.request.get(`/bilder/${kidId}`)).headers()["content-type"]).toBe("image/jpeg");

  // No picture, a made-up id and text instead of an id: 404
  for (const id of [String(noPicture), "999999", "abc"]) expect((await page.request.get(`/bilder/${id}`)).status(), id).toBe(404);
  // Without the site cookie there is no picture (MUPP-009-R4)
  const stranger = await playwright.request.newContext({ baseURL: baseURL!, storageState: { cookies: [], origins: [] }, extraHTTPHeaders: { "x-real-ip": testIp() } });
  expect((await stranger.get(`/bilder/${kidId}`, { maxRedirects: 0 })).status()).toBe(401);
  await stranger.dispose();

  // Removing the kid removes its picture
  await row.getByRole("button", { name: `Ta bort ${kid}` }).click();
  await dialog(page).getByRole("button", { name: "Ta bort" }).click();
  await expect(row).toHaveCount(0);
  expect(readdirSync(testPicturesDir).filter((f) => f.startsWith(`barn-${kidId}-`))).toHaveLength(0);
});

test("MUPP-003-R5 R6 a parent who is not the master admin has no Hantera and no upload", async ({ page }) => {
  const mia = uniqueName("Mia");
  await addParent(uniqueName("Chef"), true);
  const kid = uniqueName("Barn");
  await addChild(await addParent(mia), kid);
  await adminSignIn(page, mia);
  await expect(page.getByRole("heading", { level: 2, name: kid })).toBeVisible();
  await expect(page.getByRole("link", { name: /Hantera/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Hantera" })).toHaveCount(0);
  await page.goto("/admin/hantera");
  await expect(page.getByRole("heading", { level: 1, name: "Sidan finns inte" })).toBeVisible();
  // The kid's own page has no picture upload or kid form either
  await page.goto("/admin");
  await page.getByRole("link", { name: `Önskelistor för ${kid}` }).click();
  await expect(page.getByLabel("Bild")).toHaveCount(0);
  await expect(page.getByLabel("Födelsedatum")).toHaveCount(0);
});

test("MUPP-003-R8 the menu ends with a quiet Admin link, nothing else points to /admin, and the pages are noindex", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Meny" }).click();
  const links = page.getByRole("navigation", { name: "Huvudmeny" }).getByRole("link");
  await expect(links).toHaveText(["Start", "Admin"]);
  await expect(links.last()).toHaveAttribute("href", "/admin");
  await expect(page.locator('a[href^="/admin"]')).toHaveCount(1);

  // noindex: in the page and in the header, also for the redirect-free sign-in page and its sub-pages
  const response = await page.goto("/admin");
  expect(response!.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  expect((await request.get("/admin/hantera", { maxRedirects: 0 })).headers()["x-robots-tag"]).toContain("noindex");
  // robots.txt does not list it
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).not.toContain("admin");
});

for (const [width, height] of [[320, 568], [430, 932], [1280, 800]]) {
  test(`MUPP-003-R8 every admin page works at ${width} px: no sideways scroll, controls of 44 px (32 px for the icon buttons)`, async ({ page }) => {
  const mia = uniqueName("Mia");
  const chef = uniqueName("Chef");
  const miaId = await addParent(mia, true);
  await addParent(chef);
  const kid = await addChild(miaId, uniqueName("Barn"));
  await adminSignIn(page, mia);
  await page.goto(`/admin/barn/${kid}/onskelistor`);
  const form = await opened(list(page, "Födelsedag"), "Ny önskning");
  await form.getByLabel("Namn").fill("Pussel");
  await form.getByRole("button", { name: "Lägg till" }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Pussel" })).toBeVisible();

  await page.setViewportSize({ width, height });
  for (const path of ["/admin", `/admin/barn/${kid}/storlekar`, `/admin/barn/${kid}/onskelistor`, "/admin/hantera"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await hasHorizontalScroll(page), `${path} at ${width}`).toBe(false);
    // Every button, link and field is at least 44 × 44 px (a checkbox sits in a row that high),
    // except the compact icon buttons (the ones with a tooltip), which are 32 × 32 px (MUPP-010-R2)
    const small = await page.locator("main").locator("button, a, input:not([type=checkbox]):not([type=hidden]), select, textarea").evaluateAll((els) =>
      els
        .filter((el) => (el as HTMLElement).offsetParent !== null)
        .map((el) => ({ text: el.getAttribute("aria-label") || el.textContent?.trim().slice(0, 30) || el.getAttribute("name"), box: el.getBoundingClientRect(), min: el.hasAttribute("title") ? 31.5 : 43.5 }))
        .filter(({ box, min }) => box.height < min || box.width < min)
        .map(({ text, box }) => `${text}: ${box.width}×${box.height}`),
    );
    expect(small, `${path} at ${width}`).toEqual([]);
  }
});
}

test("MUPP-003-R8 with the keyboard only: sign in, choose a parent and open a kid", async ({ page }) => {
  const mia = uniqueName("Mia");
  const kid = uniqueName("Barn");
  await addChild(await addParent(mia), kid);
  await page.goto("/admin");
  // Wait until the page's script is running, so that Enter in the field is sent by the page
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Adminlösenord").focus();
  await page.keyboard.type(process.env.ADMIN_PASSWORD ?? "");
  await page.keyboard.press("Enter");
  const choose = page.getByRole("button", { name: mia, exact: true });
  await expect(choose).toBeVisible();
  await choose.focus();
  await page.keyboard.press("Enter");

  const open = page.getByRole("link", { name: `Önskelistor för ${kid}` });
  await open.focus();
  await expect(open).toHaveCSS("outline-width", "3px");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: kid })).toBeVisible();
});

test("MUPP-003-R8 with the keyboard only: open a form, send it and answer the confirmation", async ({ page }) => {
  const mia = uniqueName("Mia");
  const kid = uniqueName("Barn");
  await addChild(await addParent(mia), kid);
  await adminSignIn(page, mia);
  await page.goto(`/admin/barn/${await childIdOf(kid)}/onskelistor`);

  // A button opens the form with Enter, the form is filled in and sent with Enter in a field
  const birthday = list(page, "Födelsedag");
  await birthday.getByRole("button", { name: "Ny önskning" }).focus();
  await page.keyboard.press("Enter");
  await birthday.getByLabel("Namn").focus();
  await page.keyboard.type("Pussel");
  await page.keyboard.press("Enter");
  await expect(birthday.getByRole("heading", { level: 3, name: "Pussel" })).toBeVisible();

  // The dialog keeps focus away from the page behind it, starts on Avbryt, closes with Esc and gives focus back
  const remove = birthday.getByRole("button", { name: "Ta bort Pussel" });
  await remove.focus();
  await page.keyboard.press("Enter");
  await expect(dialog(page).getByRole("button", { name: "Avbryt" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog(page).getByRole("button", { name: "Ta bort" })).toBeFocused();
  // Past the last button focus leaves the page for the browser's own controls, never to the page behind the dialog
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement === document.body || document.activeElement?.closest("dialog") !== null)).toBe(true);
  await page.keyboard.press("Shift+Tab");
  await expect(dialog(page).getByRole("button", { name: "Ta bort" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(remove).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(birthday.getByRole("heading", { level: 3, name: "Pussel" })).toHaveCount(0);
});
