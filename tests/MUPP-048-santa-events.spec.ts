import { expect, test, type Page } from "@playwright/test";
import { adminSignIn, expectNoA11yViolations, goto, runsLocally, uniqueName } from "./helpers";
import { addParent, addSantaEvent, addSantaMember, clearFamily, clearSanta, countSanta, santaEventNames } from "./family-db";
import { pickName, sendPhone } from "./santa";
import { testIp } from "./site-session";

// The tests make their data straight in the local test database (never the user's own) and remove it again
test.skip(!runsLocally, "the Secret Santa tests need the local test server (its own database and passwords)");

// Made-up details, never real ones
const PHONE = "0700001111";
const EMAIL = "anna@exempel.invalid";

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
  await clearSanta();
});
test.afterEach(async () => {
  await clearSanta();
  await clearFamily();
});

const eventCard = (page: Page, name: string) => page.getByRole("article").filter({ has: page.getByRole("heading", { level: 3, name, exact: true }) });

async function openSantaTab(page: Page, parent: string) {
  await adminSignIn(page, parent);
  await page.getByRole("tab", { name: "Secret Santa" }).click();
}

async function createEvent(page: Page, name: string) {
  await page.getByRole("button", { name: "Ny grupp", exact: true }).click();
  await page.getByLabel("Gruppens namn", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
}

test("MUPP-048-R1 R3 a parent who is not master admin has the tab, creates a group and administers it; another parent does not see it, the master admin sees every group", async ({ page }) => {
  const [chef, emma, erik] = [uniqueName("Chef"), uniqueName("Emma"), uniqueName("Erik")];
  await addParent(chef, true);
  await addParent(emma);
  await addParent(erik);

  // R1: Emma creates a group with a member, which she then administers
  await openSantaTab(page, emma);
  await expect(page.getByText("Inga grupper ännu.")).toBeVisible();
  await createEvent(page, "Emmas jul");
  const emmas = eventCard(page, "Emmas jul");
  await expect(emmas).toContainText("0 medlemmar");
  await emmas.getByRole("button", { name: "Ny person i Emmas jul" }).click();
  await page.getByLabel("Namn", { exact: true }).fill("Anna Testsson");
  await page.getByLabel("Telefon", { exact: true }).fill(PHONE);
  await page.getByLabel("E-post", { exact: true }).fill(EMAIL);
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await expect(emmas).toContainText("1 medlem");
  await expectNoA11yViolations(page);
  await emmas.getByRole("button", { name: "Byt namn på Emmas jul" }).click();
  await page.getByLabel("Gruppens namn", { exact: true }).fill("Emmas julafton");
  await page.getByRole("button", { name: "Spara", exact: true }).click();
  await expect(eventCard(page, "Emmas julafton")).toBeVisible();

  // R3: Erik has the tab and sees nothing of Emma's group; his own group is his alone
  await openSantaTab(page, erik);
  await expect(page.getByText("Inga grupper ännu.")).toBeVisible();
  await expect(page.getByText("Emmas julafton")).toHaveCount(0);
  await expect(page.getByText("Anna Testsson")).toHaveCount(0);
  await createEvent(page, "Eriks jul");
  await expect(page.getByRole("heading", { level: 3 })).toHaveText(["Eriks jul"]);

  // R3: the master admin sees both, and who administers the other's
  await openSantaTab(page, chef);
  await expect(page.getByRole("heading", { level: 3 })).toHaveText(["Emmas julafton", "Eriks jul"]);
  await expect(eventCard(page, "Emmas julafton")).toContainText(`administreras av ${emma}`);
  await expectNoA11yViolations(page);
});

test("MUPP-048-R3 an action sent for someone else's group is refused on the server and changes nothing", async ({ page }) => {
  const [emma, erik] = [uniqueName("Emma"), uniqueName("Erik")];
  await addParent(emma);
  await addParent(erik);
  const emmas = await addSantaEvent("Emmas jul", await addParent(uniqueName("Ägare")));
  await addSantaMember(emmas, "Anna Testsson", PHONE, EMAIL);

  // Erik opens his own group's rename card and sends it with Emma's group id instead of his own
  await openSantaTab(page, erik);
  await createEvent(page, "Eriks jul");
  const eriks = eventCard(page, "Eriks jul");
  await eriks.getByRole("button", { name: "Byt namn på Eriks jul" }).click();
  const form = page.locator("form").filter({ has: page.getByLabel("Gruppens namn", { exact: true }) });
  await form.locator("input[name=eventId]").evaluate((input: HTMLInputElement, id) => (input.value = id), String(emmas));
  await form.getByLabel("Gruppens namn", { exact: true }).fill("Kapad");
  await form.getByRole("button", { name: "Spara", exact: true }).click();
  await expect(form.getByRole("alert").filter({ hasText: /\S/ })).toHaveText("Du kan inte göra det här.");
  expect(await santaEventNames()).toEqual(["Emmas jul", "Eriks jul"]);
  expect(await countSanta("ss_member")).toBe(1);
});

test("MUPP-048-R2 a group name is refused when another group has it, ignoring case and spaces, and the same name is free after the other is removed", async ({ page }) => {
  const [emma, erik] = [uniqueName("Emma"), uniqueName("Erik")];
  await addParent(emma);
  await addParent(erik);
  await addSantaEvent("Julen 2026", await addParent(uniqueName("Ägare")));

  await openSantaTab(page, erik);
  await createEvent(page, "julen 2026 ");
  await expect(page.getByRole("alert").filter({ hasText: "Det finns redan en grupp med det namnet." })).toBeVisible();
  expect(await santaEventNames()).toEqual(["Julen 2026"]);
  await expectNoA11yViolations(page);
  await page.getByLabel("Gruppens namn", { exact: true }).fill("Julen 2027");
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await expect(eventCard(page, "Julen 2027")).toBeVisible();
  expect(await santaEventNames()).toEqual(["Julen 2026", "Julen 2027"]);
});

test("MUPP-048-R4 R5 the entrance lists every group; the same person in two groups is a separate member in each and signs in to the one picked", async ({ page }) => {
  const emma = await addParent(uniqueName("Emma"));
  const erik = await addParent(uniqueName("Erik"));
  const [first, second] = [await addSantaEvent("Emmas jul", emma), await addSantaEvent("Eriks jul", erik)];
  await addSantaMember(first, "Anna Testsson", PHONE, EMAIL);
  await addSantaMember(first, "Bertil Testsson", "0700002222", "bertil@exempel.invalid");
  await addSantaMember(second, "Anna Testsson", PHONE, EMAIL);

  // R4: all groups are listed, then only the picked group's names, and no phone or email anywhere
  await goto(page, "/secret-santa");
  await expect(page.getByText("Vilken grupp är du med i?")).toBeVisible();
  await expect(page.getByRole("link", { name: "Emmas jul" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Eriks jul" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Anna Testsson" })).toHaveCount(0);
  await page.getByRole("link", { name: "Emmas jul" }).click();
  await expect(page).toHaveURL(new RegExp(`grupp=${first}$`));
  await expect(page.getByText("Vem är du i Emmas jul?")).toBeVisible();
  await expect(page.getByRole("link", { name: /Testsson/ })).toHaveText(["Anna Testsson", "Bertil Testsson"]);
  for (const secret of [PHONE, EMAIL, "0700002222", "bertil@"]) expect(await page.content(), secret).not.toContain(secret);

  // R5: the second group has only its own Anna, and signing in there shows that group's page
  await goto(page, `/secret-santa?grupp=${second}`);
  await expect(page.getByRole("link", { name: /Testsson/ })).toHaveText(["Anna Testsson"]);
  await pickName(page, "Anna Testsson");
  await sendPhone(page, PHONE);
  await expect(page.getByRole("heading", { level: 1, name: "Hej Anna Testsson!" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Din önskelista i Eriks jul" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Din önskelista i Emmas jul" })).toHaveCount(0);
});

test("MUPP-048-R8 the names step has Tillbaka in place of Byt grupp: with several groups it goes to the list, with one to the start page, and Esc does the same", async ({ page }) => {
  const emma = await addParent(uniqueName("Emma"));
  const first = await addSantaEvent("Emmas jul", emma);
  await addSantaMember(first, "Anna Testsson", PHONE, EMAIL);

  // One group: the names are the first step, so Tillbaka goes to the start page
  await goto(page, "/secret-santa");
  await expect(page.getByRole("link", { name: "Anna Testsson" })).toBeVisible();
  const back = page.getByRole("link", { name: "Tillbaka" });
  await expect(back).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: /^Byt (grupp|familj)$/ })).toHaveCount(0);
  await expectNoA11yViolations(page);
  await back.click();
  await expect(page).toHaveURL(/\/$/);

  // Several groups: Tillbaka and Esc go back to the list with nothing picked
  await addSantaEvent("Eriks jul", emma);
  await goto(page, `/secret-santa?grupp=${first}`);
  await expect(page.getByRole("link", { name: "Tillbaka" })).toHaveAttribute("href", "/secret-santa");
  await page.getByRole("link", { name: "Tillbaka" }).click();
  await expect(page).toHaveURL(/\/secret-santa$/);
  await expect(page.getByRole("link", { name: "Emmas jul" })).toBeVisible();
  await page.getByRole("link", { name: "Emmas jul" }).click();
  await expect(page.getByText("Vem är du i Emmas jul?")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/secret-santa$/);
  await expect(page.getByRole("link", { name: "Eriks jul" })).toBeVisible();

  // The sign-in step still goes back to the names of the same group (MUPP-047)
  await goto(page, `/secret-santa?grupp=${first}`);
  await pickName(page, "Anna Testsson");
  await page.getByRole("link", { name: "Tillbaka" }).click();
  await expect(page).toHaveURL(new RegExp(`grupp=${first}$`));
  await expect(page.getByText("Vem är du i Emmas jul?")).toBeVisible();
});
