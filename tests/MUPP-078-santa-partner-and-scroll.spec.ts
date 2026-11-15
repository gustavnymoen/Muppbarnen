import { expect, test, type Page } from "@playwright/test";
import { adminSignIn, expectNoA11yViolations, pickOption, runsLocally, uniqueName } from "./helpers";
import { addParent, addSantaEvent, addSantaMember, clearFamily, clearSanta, countSanta } from "./family-db";
import { eventCard, openEventCard } from "./santa";
import { testIp } from "./site-session";

// The tests make their data straight in the local test database (never the user's own) and remove it again
test.skip(!runsLocally, "the Secret Santa tests need the local test server (its own database and passwords)");

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
  await clearSanta();
});
test.afterEach(async () => {
  await clearSanta();
  await clearFamily();
});

const memberCard = (page: Page, name: string) => page.locator("article:not(:has(article))").filter({ has: page.getByRole("heading", { level: 4, name, exact: true }) });

async function addPerson(page: Page, name: string, phone: string) {
  await page.getByLabel("Namn", { exact: true }).fill(name);
  await page.getByLabel("Telefon", { exact: true }).fill(phone);
  await page.getByLabel("E-post", { exact: true }).fill(`${name.split(" ")[0].toLowerCase()}@exempel.invalid`);
}

test("MUPP-078-R1 the new-person card has no Partner field in an empty group, and a person is added with a partner or without one", async ({ page }) => {
  const emma = uniqueName("Emma");
  await addSantaEvent("Emmas jul", await addParent(emma), "preparing");
  await adminSignIn(page, emma);
  await page.getByRole("tab", { name: "Secret Santa" }).click();
  const card = eventCard(page, "Emmas jul");
  await openEventCard(card);

  // An empty group: nobody to choose, so no field; the first person is added without a partner
  await card.getByRole("button", { name: "Ny person i Emmas jul" }).click();
  await expect(page.getByRole("button", { name: "Partner" })).toHaveCount(0);
  await addPerson(page, "Anna Testsson", "0700001111");
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await expect(memberCard(page, "Anna Testsson")).toBeVisible();
  await expect(memberCard(page, "Anna Testsson")).not.toContainText("Partner");

  // With a person in the group: "Ingen" first, then the people; a chosen partner points both ways
  await card.getByRole("button", { name: "Ny person i Emmas jul" }).click();
  await page.getByRole("button", { name: "Partner" }).click();
  await expect(page.getByRole("option")).toHaveText(["Ingen", "Anna Testsson"]);
  await page.keyboard.press("Escape");
  await addPerson(page, "Bo Testsson", "0700002222");
  await expectNoA11yViolations(page);
  await pickOption(page, page.getByRole("dialog"), "Partner", "Anna Testsson");
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await expect(memberCard(page, "Bo Testsson")).toContainText("Partner: Anna Testsson");
  await expect(memberCard(page, "Anna Testsson")).toContainText("Partner: Bo Testsson");

  // "Ingen" (the default) adds a person without a partner
  await card.getByRole("button", { name: "Ny person i Emmas jul" }).click();
  await addPerson(page, "Cia Testsson", "0700003333");
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await expect(memberCard(page, "Cia Testsson")).toBeVisible();
  await expect(memberCard(page, "Cia Testsson")).not.toContainText("Partner");
  expect(await countSanta("ss_member")).toBe(3);
});

test("MUPP-078-R1 a started group has no new-person card", async ({ page }) => {
  const emma = uniqueName("Emma");
  const event = await addSantaEvent("Emmas jul", await addParent(emma), "started");
  await addSantaMember(event, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  await adminSignIn(page, emma);
  await page.getByRole("tab", { name: "Secret Santa" }).click();
  const card = eventCard(page, "Emmas jul");
  await openEventCard(card);
  await expect(card.getByRole("button", { name: /^Ny person/ })).toHaveCount(0);
});

test("MUPP-078-R2 the page is back at its top when an edit card is closed, saved or not", async ({ page }) => {
  const emma = uniqueName("Emma");
  const event = await addSantaEvent("Emmas jul", await addParent(emma), "preparing");
  await addSantaMember(event, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  await adminSignIn(page, emma);
  await page.getByRole("tab", { name: "Secret Santa" }).click();
  const card = eventCard(page, "Emmas jul");
  await openEventCard(card);
  const scrolled = () => page.evaluate(() => window.scrollY);

  for (const close of ["Stäng", "Spara"]) {
    await card.getByRole("button", { name: "Ändra Anna Testsson i Emmas jul" }).click();
    // What iOS does when the keyboard opens: the document is pushed up
    await page.evaluate(() => {
      document.documentElement.style.height = "3000px";
      window.scrollTo(0, 120);
    });
    expect(await scrolled()).toBe(120);
    await page.getByRole("button", { name: close, exact: true }).click();
    await expect.poll(scrolled).toBe(0);
    await page.evaluate(() => (document.documentElement.style.height = ""));
  }
});
