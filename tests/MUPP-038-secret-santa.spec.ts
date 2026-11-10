import { expect, test, type Page } from "@playwright/test";
import { adminSignIn, expectNoA11yViolations, pickOption, runsLocally, uniqueName } from "./helpers";
import { addParent, addSantaEvent, addSantaMember, clearFamily, clearSanta, countSanta } from "./family-db";
import { eventCard } from "./santa";
import { testIp } from "./site-session";

// The tests make their data straight in the local test database (never the user's own) and remove it again
test.skip(!runsLocally, "the Secret Santa tests need the local test server (its own database and passwords)");

// Made-up details, never real ones
const PHONE = "0700001111";
const EMAIL = "hemlig.testperson@exempel.invalid";

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
  await clearSanta();
});
test.afterEach(async () => {
  await clearSanta();
  await clearFamily();
});

const dialog = (page: Page) => page.getByRole("alertdialog");
const memberCard = (page: Page, name: string) => page.locator("article:not(:has(article))").filter({ has: page.getByRole("heading", { level: 4, name, exact: true }) });

test("MUPP-038-R1 the master admin sees two tabs with the kids tab selected; they work with the arrow keys and show one panel at a time", async ({ page }) => {
  const chef = uniqueName("Chef");
  await addParent(chef, true);
  await adminSignIn(page, chef);

  const kids = page.getByRole("tab", { name: "Barn" });
  const santa = page.getByRole("tab", { name: "Secret Santa" });
  await expect(page.getByRole("tablist", { name: "Admin" })).toBeVisible();
  await expect(kids).toHaveAttribute("aria-selected", "true");
  await expect(santa).toHaveAttribute("aria-selected", "false");
  await expect(page.getByRole("link", { name: "Hantera barn och föräldrar" })).toBeVisible();

  await kids.focus();
  await page.keyboard.press("ArrowRight");
  await expect(santa).toBeFocused();
  await expect(santa).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: "Secret Santa" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Hantera barn och föräldrar" })).toBeHidden();
  await expect(page.getByText("Inga grupper ännu.")).toBeVisible();
  await expectNoA11yViolations(page);
  await page.keyboard.press("Home");
  await expect(kids).toHaveAttribute("aria-selected", "true");
});

test("MUPP-038-R6 MUPP-048-R3 no phone, email or member name is on the visitor pages or the page of a parent who does not administer the group", async ({ page }) => {
  const mia = uniqueName("Mia");
  await addParent(mia);
  await addSantaMember(await addSantaEvent("Testfamiljen"), "Anna Testsson", PHONE, EMAIL);

  // Mia has the tab (MUPP-048-R1) but no group of her own, so there is nothing of Anna's in it
  await adminSignIn(page, mia);
  await page.getByRole("tab", { name: "Secret Santa" }).click();
  await expect(page.getByText("Inga grupper ännu.")).toBeVisible();

  // The admin page of a parent who does not administer the group and the visitor pages carry nothing from the group's members
  // (the group's own name is public on the entrance, but not on these pages)
  for (const path of ["/", "/admin", "/design"]) {
    const html = await (await page.request.get(path)).text();
    for (const secret of [PHONE, EMAIL, "Anna Testsson", "Testfamiljen"]) expect(html, `${path} ${secret}`).not.toContain(secret);
  }
});

test("MUPP-038-R2 R3 R5 groups and members: create, rename, add with errors, choose a partner both ways, remove, delete with a question", async ({ page }) => {
  const chef = uniqueName("Chef");
  await addParent(chef, true);
  await page.setViewportSize({ width: 375, height: 667 });
  await adminSignIn(page, chef);
  await page.getByRole("tab", { name: "Secret Santa" }).click();

  // R2: create a family; an empty name is refused
  await page.getByRole("button", { name: "Ny grupp", exact: true }).click();
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Fyll i det här fältet." })).toBeVisible();
  await page.getByLabel("Gruppens namn", { exact: true }).fill("Familjen Ek");
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await expect(eventCard(page, "Familjen Ek")).toContainText("0 deltagare");

  // R2: rename it
  await page.getByRole("button", { name: "Byt namn på Familjen Ek" }).click();
  await page.getByLabel("Gruppens namn", { exact: true }).fill("Familjen Björk");
  await page.getByRole("button", { name: "Spara", exact: true }).click();
  const birch = eventCard(page, "Familjen Björk");
  await expect(birch).toBeVisible();

  // R3: a new person with an invalid phone and email is refused with what to fix, and nothing is saved
  await birch.getByRole("button", { name: "Ny person i Familjen Björk" }).click();
  await page.getByLabel("Namn", { exact: true }).fill("Anna Testsson");
  await page.getByLabel("Telefon", { exact: true }).fill("070 123 45 67");
  await page.getByLabel("E-post", { exact: true }).fill("anna");
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Skriv numret som 07XXXXXXXX" })).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "Skriv en e-postadress" })).toBeVisible();
  expect(await countSanta("ss_member")).toBe(0);
  await expectNoA11yViolations(page);

  // R3: valid details add the member (the fields kept what was typed)
  await page.getByLabel("Telefon", { exact: true }).fill(PHONE);
  await page.getByLabel("E-post", { exact: true }).fill(EMAIL);
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await expect(memberCard(page, "Anna Testsson")).toBeVisible();
  for (const [name, phone] of [["Bo Testsson", "0700002222"], ["Cia Testsson", "0700003333"]]) {
    await birch.getByRole("button", { name: "Ny person i Familjen Björk" }).click();
    await page.getByLabel("Namn", { exact: true }).fill(name);
    await page.getByLabel("Telefon", { exact: true }).fill(phone);
    await page.getByLabel("E-post", { exact: true }).fill(`${name.split(" ")[0].toLowerCase()}@exempel.invalid`);
    await page.getByRole("button", { name: "Lägg till", exact: true }).click();
    await expect(memberCard(page, name)).toBeVisible();
  }
  await expect(birch).toContainText("3 deltagare");

  // R5: the partner list holds the other members and "Ingen", never the member; the link goes both ways
  const anna = memberCard(page, "Anna Testsson");
  await anna.getByRole("button", { name: "Ändra Anna Testsson i Familjen Björk" }).click();
  await anna.getByRole("button", { name: "Partner" }).click();
  await expect(page.getByRole("option")).toHaveText(["Ingen", "Bo Testsson", "Cia Testsson"]);
  await page.getByRole("option", { name: "Bo Testsson" }).click();
  await anna.getByRole("button", { name: "Spara", exact: true }).click();
  await expect(anna).toContainText("Partner: Bo Testsson");
  await expect(memberCard(page, "Bo Testsson")).toContainText("Partner: Anna Testsson");
  await expect(memberCard(page, "Cia Testsson")).not.toContainText("Partner");

  // R5: choosing another partner frees the first; "Ingen" clears the link
  const cia = memberCard(page, "Cia Testsson");
  await cia.getByRole("button", { name: "Ändra Cia Testsson i Familjen Björk" }).click();
  await pickOption(page, cia, "Partner", "Anna Testsson");
  await cia.getByRole("button", { name: "Spara", exact: true }).click();
  await expect(cia).toContainText("Partner: Anna Testsson");
  await expect(anna).toContainText("Partner: Cia Testsson");
  await expect(memberCard(page, "Bo Testsson")).not.toContainText("Partner");
  await cia.getByRole("button", { name: "Ändra Cia Testsson i Familjen Björk" }).click();
  await pickOption(page, cia, "Partner", "Ingen");
  await cia.getByRole("button", { name: "Spara", exact: true }).click();
  await expect(anna).not.toContainText("Partner");
  await expect(cia).not.toContainText("Partner");

  // The same phone number can be used for a person in another group (MUPP-048-R5): Anna is a separate member there
  await page.getByRole("button", { name: "Ny grupp", exact: true }).click();
  await page.getByLabel("Gruppens namn", { exact: true }).fill("Familjen Ask");
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  const ash = eventCard(page, "Familjen Ask");
  await ash.getByRole("button", { name: "Ny person i Familjen Ask" }).click();
  await page.getByLabel("Namn", { exact: true }).fill("Anna Testsson");
  await page.getByLabel("Telefon", { exact: true }).fill(PHONE);
  await page.getByLabel("E-post", { exact: true }).fill(EMAIL);
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await expect(ash).toContainText("1 deltagare");
  expect(await countSanta("ss_member")).toBe(4);

  // Editing her in one group does not change the other
  const annaAsh = ash.locator("article");
  await annaAsh.getByRole("button", { name: "Ändra Anna Testsson i Familjen Ask" }).click();
  await annaAsh.getByLabel("Namn", { exact: true }).fill("Anna Ek");
  await annaAsh.getByRole("button", { name: "Spara", exact: true }).click();
  await expect(memberCard(page, "Anna Ek")).toHaveCount(1);
  await expect(memberCard(page, "Anna Testsson")).toHaveCount(1);

  // R3: removing her from the second group asks, and she stays in the first
  await annaAsh.getByRole("button", { name: "Ta bort Anna Ek i Familjen Ask" }).click();
  await expect(dialog(page)).toContainText("önskelistan i Familjen Ask tas bort");
  await dialog(page).getByRole("button", { name: "Ta bort", exact: true }).click();
  await expect(ash).toContainText("0 deltagare");
  await expect(memberCard(page, "Anna Testsson")).toHaveCount(1);

  // R2: deleting a family asks first; Avbryt keeps it, Ta bort removes it with its members
  await birch.getByRole("button", { name: "Ta bort Familjen Björk" }).click();
  await expect(dialog(page)).toContainText("tas bort");
  await dialog(page).getByRole("button", { name: "Avbryt" }).click();
  await expect(birch).toBeVisible();
  await birch.getByRole("button", { name: "Ta bort Familjen Björk" }).click();
  await dialog(page).getByRole("button", { name: "Ta bort", exact: true }).click();
  await expect(birch).toBeHidden();
  await expect(page.getByRole("heading", { level: 4 })).toHaveCount(0);
  expect(await countSanta("ss_member")).toBe(0);
});
