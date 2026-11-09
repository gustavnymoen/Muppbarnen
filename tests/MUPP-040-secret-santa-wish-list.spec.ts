import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations, goto, runsLocally } from "./helpers";
import { addSantaFamily, addSantaMember, addSantaWish, clearSanta, joinSantaFamily, santaWishes } from "./family-db";
import { testIp } from "./site-session";

// The tests make their data straight in the local test database (never the user's own) and remove it again
test.skip(!runsLocally, "the Secret Santa tests need the local test server (its own database and passwords)");

// Made-up details, never real ones
const ANNA = "0700001111";
const BERTIL = "0700002222";

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearSanta();
});
test.afterEach(clearSanta);

async function signIn(page: Page, family: string, name: string, phone: string) {
  await goto(page, "/secret-santa");
  const familyLink = page.getByRole("link", { name: family, exact: true });
  if (await familyLink.count()) await familyLink.click();
  await page.getByRole("link", { name, exact: true }).click();
  await page.getByLabel("Ditt telefonnummer").fill(phone);
  await page.getByRole("button", { name: "Fortsätt" }).click();
  await expect(page.getByRole("heading", { level: 1, name: `Hej ${name}!` })).toBeVisible();
}

async function twoMembers() {
  const family = await addSantaFamily("Familjen Test");
  const anna = await addSantaMember(family, "Anna Testsson", ANNA, "anna@exempel.invalid");
  const bertil = await addSantaMember(family, "Bertil Testsson", BERTIL, "bertil@exempel.invalid");
  return { family, anna, bertil };
}

test("MUPP-040-R1 a wish is added with a title; a link must be http(s) and the limits are the kids'", async ({ page }) => {
  const { anna } = await twoMembers();
  await signIn(page, "Familjen Test", "Anna Testsson", ANNA);
  await expect(page.getByText("Inga önskningar ännu.")).toBeVisible();
  await expectNoA11yViolations(page);

  await page.getByRole("button", { name: "Ny önskning" }).click();
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Lägg till" }) });
  await expectNoA11yViolations(page);
  // The title is required; a link must be a web address
  await form.getByRole("button", { name: "Lägg till" }).click();
  await expect(form.getByRole("alert").filter({ hasText: /\S/ })).toHaveText("Fyll i det här fältet.");
  await form.getByLabel("Namn").fill("Bok");
  await form.getByLabel("Länk").fill("javascript:alert(1)");
  await form.getByRole("button", { name: "Lägg till" }).click();
  await expect(form.getByRole("alert").filter({ hasText: /\S/ })).toHaveText("Länken måste börja med http:// eller https://.");
  expect(await santaWishes(anna)).toEqual([]);
  // The same length limits as the kids' form
  await expect(form.getByLabel("Namn")).toHaveAttribute("maxlength", "60");
  await expect(form.getByLabel("Beskrivning")).toHaveAttribute("maxlength", "100");
  await expect(form.getByLabel("Storlek")).toHaveAttribute("maxlength", "40");

  await form.getByLabel("Länk").fill("https://exempel.invalid/bok");
  await form.getByLabel("Storlek").fill("M");
  await form.getByLabel("Beskrivning").fill("En <b>spännande</b> bok");
  await form.getByRole("button", { name: "Lägg till" }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Bok" })).toBeVisible();
  expect(await santaWishes(anna)).toEqual([{ title: "Bok", size: "M", description: "En <b>spännande</b> bok", url: "https://exempel.invalid/bok" }]);
  // Nothing to claim, and no "unlimited"
  await expect(page.getByText("Obegränsad")).toHaveCount(0);
  await page.getByRole("button", { name: "Ändra Bok" }).click();
  await expect(page.getByText("Storlek: M")).toBeVisible();
  await expect(page.locator("p", { hasText: "En <b>spännande</b> bok" })).toBeVisible();
  await expect(page.getByRole("link", { name: "https://exempel.invalid/bok" })).toHaveAttribute("href", "https://exempel.invalid/bok");
  await expectNoA11yViolations(page);
});

test("MUPP-040-R2 a wish is edited and deleted", async ({ page }) => {
  const { anna } = await twoMembers();
  await addSantaWish(anna, "Bok");
  await addSantaWish(anna, "Tröja");
  await signIn(page, "Familjen Test", "Anna Testsson", ANNA);

  await page.getByRole("button", { name: "Ändra Bok" }).click();
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Spara" }) });
  await form.getByLabel("Namn").fill("Kokbok");
  await form.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Kokbok" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Bok", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Ta bort Tröja" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("tas bort från din önskelista i Familjen Test");
  await expectNoA11yViolations(page);
  await dialog.getByRole("button", { name: "Ta bort" }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Tröja" })).toHaveCount(0);
  expect((await santaWishes(anna)).map((w) => w.title)).toEqual(["Kokbok"]);
});

test("MUPP-040-R3 a wish id changed to another member's is refused", async ({ page }) => {
  const { anna, bertil } = await twoMembers();
  await addSantaWish(anna, "Annas önskning");
  const bertilsWish = await addSantaWish(bertil, "Bertils önskning");
  await signIn(page, "Familjen Test", "Anna Testsson", ANNA);

  // The form is sent with Bertil's wish id instead of Anna's own
  await page.getByRole("button", { name: "Ändra Annas önskning" }).click();
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Spara" }) });
  await form.locator("input[name=wishId]").evaluate((input: HTMLInputElement, id) => (input.value = id), String(bertilsWish));
  await form.getByLabel("Namn").fill("Kapad");
  await form.getByRole("button", { name: "Spara" }).click();
  await expect(form.getByRole("alert").filter({ hasText: /\S/ })).toHaveText("Du kan inte göra det här.");
  expect((await santaWishes(bertil)).map((w) => w.title)).toEqual(["Bertils önskning"]);
  expect((await santaWishes(anna)).map((w) => w.title)).toEqual(["Annas önskning"]);
});

test("MUPP-040-R3 a person in two families has a separate list in each", async ({ page }) => {
  const { anna } = await twoMembers();
  const other = await addSantaFamily("Familjen Annan");
  const annaThere = await joinSantaFamily(anna, other);
  await addSantaWish(anna, "Hos Test");
  await signIn(page, "Familjen Test", "Anna Testsson", ANNA);

  const here = page.locator("section", { has: page.getByRole("heading", { name: "Din önskelista i Familjen Test" }) });
  const there = page.locator("section", { has: page.getByRole("heading", { name: "Din önskelista i Familjen Annan" }) });
  await expect(here.getByRole("heading", { level: 3, name: "Hos Test" })).toBeVisible();
  await expect(there.getByText("Inga önskningar ännu.")).toBeVisible();

  await there.getByRole("button", { name: "Ny önskning" }).click();
  await there.getByLabel("Namn").fill("Hos Annan");
  await there.getByRole("button", { name: "Lägg till" }).click();
  await expect(there.getByRole("heading", { level: 3, name: "Hos Annan" })).toBeVisible();
  await expect(here.getByRole("heading", { level: 3, name: "Hos Annan" })).toHaveCount(0);
  expect((await santaWishes(annaThere)).map((w) => w.title)).toEqual(["Hos Annan"]);
  expect((await santaWishes(anna)).map((w) => w.title)).toEqual(["Hos Test"]);
});

test("MUPP-040-R4 another member sees no list on any page they can open", async ({ page }) => {
  const { anna } = await twoMembers();
  await addSantaWish(anna, "Hemlig önskning");
  await signIn(page, "Familjen Test", "Bertil Testsson", BERTIL);
  await expect(page.getByText("Inga önskningar ännu.")).toBeVisible();
  for (const path of ["/", "/secret-santa", "/secret-santa/min-sida", "/admin"]) {
    const html = await page.context().request.get(path).then((r) => r.text());
    expect(html, path).not.toContain("Hemlig önskning");
  }
});
