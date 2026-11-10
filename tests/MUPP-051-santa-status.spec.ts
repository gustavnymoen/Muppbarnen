import { expect, test, type Page } from "@playwright/test";
import { adminSignIn, expectNoA11yViolations, goto, runsLocally, settledBox, uniqueName } from "./helpers";
import { addParent, addSantaEvent, addSantaMember, addSantaWish, clearFamily, clearSanta, santaStatusOf, santaWishes, setSantaStatus } from "./family-db";
import { clearOutbox, readOutbox } from "../lib/mail-sink";
import { eventCard, openEventCard, santaSignIn } from "./santa";
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

test("MUPP-051-R1 R2 a new group is inactive; the toggle Aktiv asks 'Är du säker?' each way, cancelling changes nothing, and the status follows", async ({ page }) => {
  const emma = uniqueName("Emma");
  await addParent(emma);
  await openSantaTab(page, emma);
  await page.getByRole("button", { name: "Ny grupp", exact: true }).click();
  await page.getByLabel("Gruppens namn", { exact: true }).fill("Emmas jul");
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  const card = eventCard(page, "Emmas jul");

  // R1: a new group is inactive
  await expect(card).toContainText("Status: Inaktiv");
  const toggle = card.getByRole("switch", { name: "Aktiv Emmas jul" });
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  expect((await settledBox(toggle)).height).toBeGreaterThanOrEqual(44);

  // R2: the question first; cancelling changes nothing
  await toggle.click();
  const question = page.getByRole("alertdialog", { name: "Är du säker?" });
  await expect(question).toContainText("Alla i gruppen får ett mail och kan börja skriva önskelistor.");
  await expectNoA11yViolations(page);
  await question.getByRole("button", { name: "Avbryt" }).click();
  await expect(card).toContainText("Status: Inaktiv");

  // R2: confirming activates; then it can be deactivated, after the same question
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await toggle.click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Aktivera", exact: true }).click();
  await expect(card).toContainText("Status: Förbereder");
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await toggle.click();
  await expect(page.getByRole("alertdialog", { name: "Är du säker?" })).toContainText("Önskelistorna finns kvar.");
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
  await openEventCard(card);
  await expect(card).toContainText("Status: Startad");
  await expect(card.getByRole("button", { name: /^(Ny person|Ändra Anna|Ta bort Anna)/ })).toHaveCount(0);
  // R2: the toggle is on and locked, with the note
  const locked = card.getByRole("switch", { name: "Aktiv Startad grupp" });
  await expect(locked).toBeDisabled();
  await expect(locked).toHaveAttribute("aria-checked", "true");
  await expect(card).toContainText("Stoppa gruppen först");
  await expectNoA11yViolations(page);

  // R3: the group that is not started still has its buttons
  await openEventCard(eventCard(page, "Öppen grupp"));
  await expect(eventCard(page, "Öppen grupp").getByRole("button", { name: "Ny person i Öppen grupp" })).toBeVisible();

  // R2: another parent does not see the group, so there is no button to press
  await openSantaTab(page, erik);
  await expect(page.getByText("Öppen grupp")).toHaveCount(0);

  // R2: the page was loaded while the group was inactive; the server refuses the second activation and the status stays
  await openSantaTab(page, emma);
  await openEventCard(eventCard(page, "Öppen grupp"));
  await eventCard(page, "Öppen grupp").getByRole("switch", { name: "Aktiv Öppen grupp" }).click();
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

test("MUPP-051-R2 the i icon is 44 px, opens the three explanations and closes with Esc, the cross and a press outside", async ({ page }) => {
  const emma = uniqueName("Emma");
  await addSantaEvent("Emmas jul", await addParent(emma), "inactive");
  await openSantaTab(page, emma);
  const info = page.getByRole("button", { name: "Vad betyder statusen?" });
  expect((await settledBox(info)).height).toBeGreaterThanOrEqual(44);
  const dialog = page.getByRole("dialog", { name: "Vad betyder statusen?" });
  const texts = ["Gruppen har ej startat.", "Deltagarna kan nu skapa önskelistor men har ej tilldelats en matchning.", "Deltagarna är matchade och kan se den andres lista, samt skicka meddelanden."];

  await info.click();
  for (const text of texts) await expect(dialog).toContainText(text);
  await expectNoA11yViolations(page);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await info.click();
  await dialog.getByRole("button", { name: /Stäng|Avbryt/ }).click();
  await expect(dialog).toBeHidden();
  await info.click();
  await page.mouse.click(2, 2);
  await expect(dialog).toBeHidden();
});

test("MUPP-051-R7 the count and the delete question say deltagare, in singular and plural, and nowhere does the tab say medlem", async ({ page }) => {
  const emma = uniqueName("Emma");
  const event = await addSantaEvent("Emmas jul", await addParent(emma), "inactive");
  await addSantaMember(event, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  await openSantaTab(page, emma);
  const card = eventCard(page, "Emmas jul");
  await expect(card).toContainText("1 deltagare");
  await addSantaMember(event, "Bertil Testsson", "0700002222", "bertil@exempel.invalid");
  await page.reload();
  await page.getByRole("tab", { name: "Secret Santa" }).click();
  await expect(card).toContainText("2 deltagare");
  await card.getByRole("button", { name: "Ta bort Emmas jul", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toContainText("Emmas jul, dess deltagare och deras önskelistor tas bort. Det går inte att ångra.");
  await page.getByRole("button", { name: "Avbryt" }).click();
  await expect(page.locator("main")).not.toContainText(/medlem/i);
});

test("MUPP-051-R2 R3 the mails: activation and deactivation go to every participant, a failing one is named, and a new participant gets the welcome mail (and the activation mail while preparing)", async ({ page }) => {
  clearOutbox();
  const emma = uniqueName("Emma");
  const event = await addSantaEvent("Emmas jul", await addParent(emma), "inactive");
  await addSantaMember(event, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  // An address the mail check refuses (no dot after the @), put straight in the database
  await addSantaMember(event, "Bertil Testsson", "0700002222", "bertil@invalid");
  const subjects = () => readOutbox().map((mail) => `${mail.to} ${mail.subject}`);
  await openSantaTab(page, emma);
  const card = eventCard(page, "Emmas jul");

  // R2: activation: one mail to the participant with a working address, and the administrator is told who got none
  await card.getByRole("switch", { name: "Aktiv Emmas jul" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Aktivera", exact: true }).click();
  await expect(card).toContainText("Status: Förbereder");
  await expect(page.getByText("Sparat, men Bertil Testsson fick inget mejl.").first()).toBeVisible();
  expect(subjects()).toEqual(["anna@exempel.invalid Secret Santa: Emmas jul – Nu kan du skriva din önskelista"]);
  expect(readOutbox()[0].text).toContain(emma);
  expect(JSON.stringify(readOutbox())).not.toContain("Testsson");

  // R3: a new participant in a preparing group: the welcome mail and then the activation mail
  clearOutbox();
  await card.getByRole("button", { name: "Ny person i Emmas jul" }).click();
  await page.getByLabel("Namn", { exact: true }).fill("Cia Testsson");
  await page.getByLabel("Telefon", { exact: true }).fill("0700003333");
  await page.getByLabel("E-post", { exact: true }).fill("cia@exempel.invalid");
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await expect(card).toContainText("3 deltagare");
  await expect.poll(subjects).toEqual(["cia@exempel.invalid Secret Santa: Emmas jul – välkommen", "cia@exempel.invalid Secret Santa: Emmas jul – Nu kan du skriva din önskelista"]);

  // R2: deactivation
  clearOutbox();
  await card.getByRole("switch", { name: "Aktiv Emmas jul" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Avaktivera", exact: true }).click();
  await expect(card).toContainText("Status: Inaktiv");
  await expect.poll(() => subjects().sort()).toEqual(["anna@exempel.invalid Secret Santa: Emmas jul – är avaktiverad!", "cia@exempel.invalid Secret Santa: Emmas jul – är avaktiverad!"]);

  // R3: a new participant in an inactive group: the welcome mail only
  clearOutbox();
  await card.getByRole("button", { name: "Ny person i Emmas jul" }).click();
  await page.getByLabel("Namn", { exact: true }).fill("Dan Testsson");
  await page.getByLabel("Telefon", { exact: true }).fill("0700004444");
  await page.getByLabel("E-post", { exact: true }).fill("dan@exempel.invalid");
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await expect(card).toContainText("4 deltagare");
  await expect.poll(subjects).toEqual(["dan@exempel.invalid Secret Santa: Emmas jul – välkommen"]);

  // R3: an address the mail check refuses (a quote is allowed by the form): saved, and the administrator is told
  clearOutbox();
  await card.getByRole("button", { name: "Ny person i Emmas jul" }).click();
  await page.getByLabel("Namn", { exact: true }).fill("  Eva Testsson ");
  await page.getByLabel("Telefon", { exact: true }).fill("0700005555");
  await page.getByLabel("E-post", { exact: true }).fill('e"va@exempel.invalid');
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await expect(card).toContainText("5 deltagare");
  await expect(page.getByText("Sparat, men Eva Testsson fick inget mejl.").first()).toBeVisible();
  expect(readOutbox()).toEqual([]);
  clearOutbox();
});
