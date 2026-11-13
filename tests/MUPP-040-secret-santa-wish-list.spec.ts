import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations, goto, runsLocally } from "./helpers";
import { addSantaEvent, addSantaMember, addSantaWish, clearSanta, santaWishes } from "./family-db";
import { SANTA_COOKIE, foldOut, santaSignIn, wishRow } from "./santa";
import { testIp } from "./site-session";

// The tests make their data straight in the local test database (never the user's own) and remove it again
test.skip(!runsLocally, "the Secret Santa tests need the local test server (its own database and passwords)");

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearSanta();
});
test.afterEach(clearSanta);

// The sign-in itself is tested in MUPP-039: here the cookie is set directly (TECH-018) and the own page opened
async function signInAs(page: Page, member: number) {
  await santaSignIn(page, member);
  await goto(page, "/secret-santa/min-sida/onskelista");
}

async function twoMembers() {
  const family = await addSantaEvent("Familjen Test");
  const anna = await addSantaMember(family, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  const bertil = await addSantaMember(family, "Bertil Testsson", "0700002222", "bertil@exempel.invalid");
  return { family, anna, bertil };
}

test("MUPP-040-R1 R2 a wish is added with a title, a link must be http(s) and the limits are the kids'; then it is edited and deleted", async ({ page }) => {
  const { anna } = await twoMembers();
  await signInAs(page, anna);
  await expect(page.getByText("Inga önskningar ännu.")).toBeVisible();
  await expectNoA11yViolations(page);

  // R1
  await page.getByRole("button", { name: "Ny önskning" }).click();
  const add = page.locator("form").filter({ has: page.getByRole("button", { name: "Lägg till" }) });
  await expectNoA11yViolations(page);
  // The title is required; a link must be a web address
  await add.getByRole("button", { name: "Lägg till" }).click();
  await expect(add.getByRole("alert").filter({ hasText: /\S/ })).toHaveText("Fyll i det här fältet.");
  await add.getByLabel("Namn").fill("Bok");
  await add.getByLabel("Länk").fill("javascript:alert(1)");
  await add.getByRole("button", { name: "Lägg till" }).click();
  await expect(add.getByRole("alert").filter({ hasText: /\S/ })).toHaveText("Länken måste börja med http:// eller https://.");
  expect(await santaWishes(anna)).toEqual([]);
  // The same length limits as the kids' form
  await expect(add.getByLabel("Namn")).toHaveAttribute("maxlength", "60");
  await expect(add.getByLabel("Beskrivning")).toHaveAttribute("maxlength", "100");
  await expect(add.getByLabel("Storlek")).toHaveAttribute("maxlength", "40");

  await add.getByLabel("Länk").fill("https://exempel.invalid/bok");
  await add.getByLabel("Storlek").fill("M");
  await add.getByLabel("Beskrivning").fill("En <b>spännande</b> bok");
  await add.getByRole("button", { name: "Lägg till" }).click();
  // A new wish keeps its card open (MUPP-045-R6); closing it shows the list
  await expect(page.getByRole("status").filter({ hasText: "Bok lades till" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(wishRow(page, "Bok")).toBeVisible();
  expect(await santaWishes(anna)).toEqual([{ title: "Bok", size: "M", description: "En <b>spännande</b> bok", url: "https://exempel.invalid/bok" }]);
  // Nothing to claim, and no "unlimited"
  await expect(page.getByText("Obegränsad")).toHaveCount(0);
  await foldOut(page, "Bok");
  await page.getByRole("button", { name: "Ändra Bok" }).click();
  const card = page.locator("dialog[open]");
  await expect(card.getByText("Storlek: M")).toBeVisible();
  await expect(card.locator("p", { hasText: "En <b>spännande</b> bok" })).toBeVisible();
  await expect(card.getByRole("link", { name: "https://exempel.invalid/bok" })).toHaveAttribute("href", "https://exempel.invalid/bok");
  await expectNoA11yViolations(page);

  // R2: the open form is the wish's own, changed and saved
  const edit = page.locator("form").filter({ has: page.getByRole("button", { name: "Spara" }) });
  await edit.getByLabel("Namn").fill("Kokbok");
  await edit.getByRole("button", { name: "Spara" }).click();
  await expect(wishRow(page, "Kokbok")).toBeVisible();
  await expect(wishRow(page, "Bok")).toHaveCount(0);

  // R2: deleted after a question that names the list
  await foldOut(page, "Kokbok");
  await page.getByRole("button", { name: "Ta bort Kokbok" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("tas bort från din önskelista i Familjen Test");
  await expectNoA11yViolations(page);
  await dialog.getByRole("button", { name: "Ta bort" }).click();
  await expect(wishRow(page, "Kokbok")).toHaveCount(0);
  expect(await santaWishes(anna)).toEqual([]);
});

test("MUPP-040-R3 MUPP-048-R5 a person in two groups is a member of each with a separate list, and a wish id changed to another member's is refused", async ({ page }) => {
  const { anna, bertil } = await twoMembers();
  const other = await addSantaEvent("Familjen Annan");
  const annaThere = await addSantaMember(other, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  await addSantaWish(anna, "Hos Test");
  const bertilsWish = await addSantaWish(bertil, "Bertils önskning");

  // Signed in as the member of one group: only that group's list, and a new wish goes into it
  await signInAs(page, annaThere);
  await expect(page.getByRole("heading", { level: 2, name: "Din önskelista i Familjen Annan" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Din önskelista i Familjen Test" })).toHaveCount(0);
  await expect(page.getByText("Inga önskningar ännu.")).toBeVisible();
  await page.getByRole("button", { name: "Ny önskning" }).click();
  await page.getByLabel("Namn").fill("Hos Annan");
  await page.getByRole("button", { name: "Lägg till" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Hos Annan lades till" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(wishRow(page, "Hos Annan")).toBeVisible();
  expect((await santaWishes(annaThere)).map((w) => w.title)).toEqual(["Hos Annan"]);
  expect((await santaWishes(anna)).map((w) => w.title)).toEqual(["Hos Test"]);

  // The other member's own page shows the other list
  await page.context().clearCookies({ name: SANTA_COOKIE });
  await signInAs(page, anna);
  await expect(wishRow(page, "Hos Test")).toBeVisible();
  await expect(wishRow(page, "Hos Annan")).toHaveCount(0);

  // The form is sent with Bertil's wish id instead of Anna's own
  await foldOut(page, "Hos Test");
  await page.getByRole("button", { name: "Ändra Hos Test" }).click();
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Spara" }) });
  await form.locator("input[name=wishId]").evaluate((input: HTMLInputElement, id) => (input.value = id), String(bertilsWish));
  await form.getByLabel("Namn").fill("Kapad");
  await form.getByRole("button", { name: "Spara" }).click();
  await expect(form.getByRole("alert").filter({ hasText: /\S/ })).toHaveText("Du kan inte göra det här.");
  expect((await santaWishes(bertil)).map((w) => w.title)).toEqual(["Bertils önskning"]);
  expect((await santaWishes(anna)).map((w) => w.title)).toEqual(["Hos Test"]);
});

test("MUPP-040-R4 another member sees no list on any page they can open", async ({ page }) => {
  const { anna, bertil } = await twoMembers();
  await addSantaWish(anna, "Hemlig önskning");
  await signInAs(page, bertil);
  await expect(page.getByText("Inga önskningar ännu.")).toBeVisible();
  for (const path of ["/", "/secret-santa", "/secret-santa/min-sida", "/secret-santa/min-sida/onskelista", "/admin"]) {
    const html = await page.context().request.get(path).then((r) => r.text());
    expect(html, path).not.toContain("Hemlig önskning");
  }
});
