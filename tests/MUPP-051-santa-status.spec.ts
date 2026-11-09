import { expect, test, type Page } from "@playwright/test";
import { adminSignIn, expectNoA11yViolations, goto, runsLocally, uniqueName } from "./helpers";
import { addParent, addSantaEvent, addSantaMember, addSantaWish, clearFamily, clearSanta, santaStatusOf, santaWishes, setSantaStatus } from "./family-db";
import { santaSignIn } from "./santa";
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

const eventCard = (page: Page, name: string) => page.getByRole("article").filter({ has: page.getByRole("heading", { level: 3, name, exact: true }) });

async function openSantaTab(page: Page, parent: string) {
  await adminSignIn(page, parent);
  await page.getByRole("tab", { name: "Secret Santa" }).click();
}

// Anna's own page in an event of the given status
async function annaIn(page: Page, status: "inactive" | "preparing" | "started") {
  const event = await addSantaEvent("Familjen Test", undefined, status);
  const anna = await addSantaMember(event, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  await santaSignIn(page, anna);
  return { event, anna };
}

test("MUPP-051-R1 R2 a new group is inactive; Aktivera and Avaktivera each ask 'Är du säker?', cancelling changes nothing, and the status follows", async ({ page }) => {
  const emma = uniqueName("Emma");
  await addParent(emma);
  await openSantaTab(page, emma);
  await page.getByRole("button", { name: "Ny grupp", exact: true }).click();
  await page.getByLabel("Gruppens namn", { exact: true }).fill("Emmas jul");
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  const card = eventCard(page, "Emmas jul");

  // R1: a new group is inactive
  await expect(card).toContainText("Status: Inaktiv");
  await expect(card.getByRole("button", { name: "Avaktivera Emmas jul", exact: true })).toHaveCount(0);

  // R2: the question first; cancelling changes nothing
  await card.getByRole("button", { name: "Aktivera Emmas jul", exact: true }).click();
  const question = page.getByRole("alertdialog", { name: "Är du säker?" });
  await expect(question).toContainText("inga mejl skickas");
  await expectNoA11yViolations(page);
  await question.getByRole("button", { name: "Avbryt" }).click();
  await expect(card).toContainText("Status: Inaktiv");

  // R2: confirming activates; then it can be deactivated, after the same question
  await card.getByRole("button", { name: "Aktivera Emmas jul", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Aktivera", exact: true }).click();
  await expect(card).toContainText("Status: Förbereder");
  await expect(card.getByRole("button", { name: "Aktivera Emmas jul", exact: true })).toHaveCount(0);
  await card.getByRole("button", { name: "Avaktivera Emmas jul", exact: true }).click();
  await expect(page.getByRole("alertdialog", { name: "Är du säker?" })).toContainText("Önskelistorna ligger kvar");
  await page.getByRole("alertdialog").getByRole("button", { name: "Avaktivera", exact: true }).click();
  await expect(card).toContainText("Status: Inaktiv");
  await expectNoA11yViolations(page);
});

test("MUPP-051-R2 R3 a started group shows its status but no buttons for the status or the members; another parent's group has none either, and a stale page is refused by the server", async ({ page }) => {
  const [chef, emma, erik] = [uniqueName("Chef"), uniqueName("Emma"), uniqueName("Erik")];
  await addParent(chef, true);
  const emmaId = await addParent(emma);
  await addParent(erik);
  const started = await addSantaEvent("Startad grupp", emmaId, "started");
  await addSantaMember(started, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  const open = await addSantaEvent("Öppen grupp", emmaId, "inactive");
  await addSantaMember(open, "Bertil Testsson", "0700002222", "bertil@exempel.invalid");

  // R2 R3: a started group: the status is shown, nothing can be changed
  await openSantaTab(page, emma);
  const card = eventCard(page, "Startad grupp");
  await expect(card).toContainText("Status: Startad");
  await expect(card.getByRole("button", { name: /^(Aktivera|Avaktivera|Ny person|Ändra Anna|Ta bort Anna)/ })).toHaveCount(0);
  await expectNoA11yViolations(page);

  // R3: the group that is not started still has its buttons
  await expect(eventCard(page, "Öppen grupp").getByRole("button", { name: "Ny person i Öppen grupp" })).toBeVisible();

  // R2: another parent does not see the group, so there is no button to press
  await openSantaTab(page, erik);
  await expect(page.getByText("Öppen grupp")).toHaveCount(0);

  // R2: the page was loaded while the group was inactive; the server refuses the second activation and the status stays
  await openSantaTab(page, emma);
  await eventCard(page, "Öppen grupp").getByRole("button", { name: "Aktivera Öppen grupp", exact: true }).click();
  await setSantaStatus(open, "preparing");
  await page.getByRole("alertdialog").getByRole("button", { name: "Aktivera", exact: true }).click();
  await expect(page.getByText("Gruppens status har redan ändrats.").first()).toBeVisible();
  expect(await santaStatusOf(open)).toBe("preparing");
});

test("MUPP-051-R4 R5 an inactive group gives only 'Vi har inte kört igång än': no list, no card, and the list page leads back", async ({ page }) => {
  const { anna } = await annaIn(page, "inactive");
  await addSantaWish(anna, "Kvarglömd bok");
  await goto(page, "/secret-santa/min-sida");
  await expect(page.getByRole("heading", { level: 1, name: "Hej Anna Testsson!" })).toBeVisible();
  await expect(page.getByText("Vi har inte kört igång än", { exact: true })).toBeVisible();
  await expect(page.getByText("Min önskelista")).toHaveCount(0);
  await expect(page.getByText("Kvarglömd bok")).toHaveCount(0);
  await expect(page.locator("main a")).toHaveCount(0);
  await expectNoA11yViolations(page);

  // R4: the list page does not show a list; the way to it is closed
  await goto(page, "/secret-santa/min-sida/onskelista");
  await expect(page).toHaveURL(/\/secret-santa\/min-sida$/);
  await expect(page.getByText("Kvarglömd bok")).toHaveCount(0);
});

test("MUPP-051-R6 MUPP-051-R4 a preparing group has the active list card and the greyed match card; wishes kept while inactive come back, and a change after deactivation is refused", async ({ page }) => {
  const { event, anna } = await annaIn(page, "inactive");
  await addSantaWish(anna, "Bok");
  await setSantaStatus(event, "preparing");
  await goto(page, "/secret-santa/min-sida");

  // R6: the two cards; the second is not a link and says why it is grey
  await expect(page.getByRole("link", { name: "Min önskelista" })).toBeVisible();
  const grey = page.getByRole("heading", { level: 2, name: "Min matchnings önskelista" });
  await expect(grey).toBeVisible();
  await expect(page.getByRole("link", { name: /matchning/ })).toHaveCount(0);
  await expect(page.getByText("Inte tilldelad än")).toBeVisible();
  await expect(page.getByText("Vi har inte kört igång än")).toHaveCount(0);
  await expectNoA11yViolations(page);

  // R4: the kept wish is there when the group has been activated again
  await page.getByRole("link", { name: "Min önskelista" }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Bok" })).toBeVisible();
  await expectNoA11yViolations(page);

  // R4: the page was opened while preparing; after the deactivation the server refuses the change and the wish stays
  await setSantaStatus(event, "inactive");
  await page.getByRole("button", { name: "Ny önskning" }).click();
  await page.getByLabel("Namn").fill("Ny sak");
  await page.getByRole("button", { name: "Lägg till" }).click();
  await expect(page.getByText("Önskelistan är stängd just nu.").first()).toBeVisible();
  expect((await santaWishes(anna)).map((w) => w.title)).toEqual(["Bok"]);
});
