import { expect, request as playwrightRequest, test } from "@playwright/test";
import { expectNoA11yViolations, goto, runsLocally } from "./helpers";
import { addSantaDraw, addSantaEvent, addSantaMember, addSantaWish, ageSantaMail, clearFamily, clearSanta, santaWishes } from "./family-db";
import { clearOutbox, readOutbox } from "../lib/mail-sink";
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

// A started event where Anna gives to Bo, Bo to Cia and Cia to Anna, and Dan and Eva give to each other
async function startedEvent() {
  const event = await addSantaEvent("Familjen Test", undefined, "started");
  const [anna, bo, cia, dan, eva] = [
    await addSantaMember(event, "Anna Testsson", "0700001111", "anna@exempel.invalid"),
    await addSantaMember(event, "Bo Testsson", "0700002222", "bo@exempel.invalid"),
    await addSantaMember(event, "Cia Testsson", "0700003333", "cia@exempel.invalid"),
    await addSantaMember(event, "Dan Testsson", "0700004444", "dan@exempel.invalid"),
    await addSantaMember(event, "Eva Testsson", "0700005555", "eva@exempel.invalid"),
  ];
  for (const [giver, receiver] of [[anna, bo], [bo, cia], [cia, anna], [dan, eva], [eva, dan]]) await addSantaDraw(event, giver, receiver);
  return { event, anna, bo, cia, dan, eva };
}

test("MUPP-042-R1 R2 MUPP-062-R2 MUPP-064-R1 R2 R3 a started group gives the second card 'Min matchning: <name>' that opens that person's list read-only, and nobody sees who drew them", async ({ page }) => {
  const { anna, bo, dan } = await startedEvent();
  await addSantaWish(bo, "Bok att läsa", { description: "Helst en spänningsroman", size: "Pocket", url: "https://example.com/bok" });
  await addSantaWish(bo, "Bara en titel");
  await addSantaWish(bo, "Farlig länk", { url: "javascript:alert(1)" });
  await addSantaWish(anna, "Annas egen önskning");
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida");

  // R1: the list card and the active match card; no grey card
  await expect(page.getByRole("link", { name: "Min önskelista" })).toBeVisible();
  await expect(page.getByText("Inte tilldelad än")).toHaveCount(0);
  const match = page.getByRole("link", { name: "Min matchning: Bo Testsson" });
  await expect(match).toBeVisible();
  await expect(page.getByRole("main")).not.toContainText("Cia Testsson");
  await expectNoA11yViolations(page);

  // R1: the match's wishes, without any button to change them
  await match.click();
  await expect(page.getByRole("heading", { level: 2, name: "Önskelistan hos Bo Testsson" })).toBeVisible();
  // MUPP-062-R2: every wish is a collapsed row with a title and a chevron, no checkbox, mark or button to change anything
  const rows = page.getByRole("main").getByRole("listitem");
  await expect(rows).toHaveCount(3);
  const book = page.getByRole("button", { name: "Bok att läsa" });
  await expect(book).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByText(/Beskrivning:|Storlek:|Länk till presenten/)).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByText(/Paxad|Kan köpas flera gånger/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Ny önskning|Ändra|Ta bort|Paxa/ })).toHaveCount(0);
  await expectNoA11yViolations(page);
  // MUPP-062-R2: a row expands to the details with bold labels and a link that opens in a new tab; a title-only wish shows a dash for both headings (MUPP-064-R1 R2 R3), and an address that is not http(s) gives no link
  await book.click();
  await expect(book).toHaveAttribute("aria-expanded", "true");
  const details = rows.filter({ hasText: "Bok att läsa" });
  await expect(details.locator("strong")).toHaveText(["Beskrivning:", "Storlek:"]);
  await expect(details).toContainText("Beskrivning: Helst en spänningsroman");
  await expect(details).toContainText("Storlek: Pocket");
  const link = details.getByRole("link", { name: "Länk till presenten (öppnas i en ny flik)" });
  await expect(link).toHaveAttribute("href", "https://example.com/bok");
  await expect(link).toHaveAttribute("target", "_blank");
  await expectNoA11yViolations(page);
  await book.click();
  await expect(book).toHaveAttribute("aria-expanded", "false");
  await expect(details.getByRole("link")).toHaveCount(0);
  await page.getByRole("button", { name: "Bara en titel" }).click();
  await page.getByRole("button", { name: "Farlig länk" }).click();
  await expect(rows.filter({ hasText: "Bara en titel" }).locator("p")).toHaveText(["Beskrivning: –", "Storlek: –"]);
  await expect(rows.filter({ hasText: "Farlig länk" }).locator("p")).toHaveText(["Beskrivning: –", "Storlek: –"]);
  await expect(page.getByRole("link", { name: /Länk till presenten/ })).toHaveCount(0);
  await expect(page.getByText("Annas egen önskning")).toHaveCount(0);
  // R2: the page names the match only; Cia, who gives to Anna, is nowhere
  await expect(page.getByRole("main")).not.toContainText("Cia Testsson");
  await expectNoA11yViolations(page);
  await page.getByRole("link", { name: "Tillbaka" }).click();
  await expect(page).toHaveURL(/\/secret-santa\/min-sida$/);

  // R2: Bo's page names Cia (the draw is asymmetric on the page too: Bo does not see Anna, who gives to Bo)
  await santaSignIn(page, bo);
  await goto(page, "/secret-santa/min-sida");
  await expect(page.getByRole("link", { name: "Min matchning: Cia Testsson" })).toBeVisible();
  await expect(page.getByRole("main")).not.toContainText("Anna Testsson");
  // R2: two people who drew each other each see the other
  await santaSignIn(page, dan);
  await goto(page, "/secret-santa/min-sida");
  await expect(page.getByRole("link", { name: "Min matchning: Eva Testsson" })).toBeVisible();
  // MUPP-062-R2: Eva has no wishes, so Dan's match page says so
  await goto(page, "/secret-santa/min-sida/matchning");
  await expect(page.getByText("Inga önskningar ännu.")).toBeVisible();
  await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(0);
});

test("MUPP-042-R1 before the start the second card is grey with 'Inte tilldelad än', and the match page leads back", async ({ page }) => {
  const event = await addSantaEvent("Familjen Test", undefined, "preparing");
  const anna = await addSantaMember(event, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  const bo = await addSantaMember(event, "Bo Testsson", "0700002222", "bo@exempel.invalid");
  await addSantaDraw(event, anna, bo);
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida");
  await expect(page.getByText("Inte tilldelad än")).toBeVisible();
  await expect(page.getByRole("link", { name: /matchning/ })).toHaveCount(0);
  // Not even a row left over in the draw opens a match before the start
  await goto(page, "/secret-santa/min-sida/matchning");
  await expect(page).toHaveURL(/\/secret-santa\/min-sida$/);
  await expect(page.getByText("Önskelistan hos")).toHaveCount(0);
});

test("MUPP-042-R3 a changed list mails the giver once an hour: the job refuses without its secret, collects changes, sends nothing when nothing changed, and names the group but nobody", async ({ page }) => {
  clearOutbox();
  const { bo } = await startedEvent();
  // The job is called without the site cookie, as the scheduled workflow does
  const caller = await playwrightRequest.newContext({ baseURL: process.env.BASE_URL, extraHTTPHeaders: { "x-real-ip": testIp() } });
  const secret = process.env.SANTA_JOB_SECRET!;
  const runJob = async (authorization = `Bearer ${secret}`) => caller.post("/api/santa-mails", { headers: { authorization } });
  const subjects = () => readOutbox().map((mail) => `${mail.to} ${mail.subject}`);

  // Without the secret, or with a wrong one, nothing is sent
  expect((await runJob("Bearer fel")).status()).toBe(401);
  expect((await caller.post("/api/santa-mails")).status()).toBe(401);
  // A GET is not a job call: refused (Next answers 405 for a method the route does not have)
  expect((await caller.get("/api/santa-mails")).ok()).toBe(false);

  // No change yet: no mail
  expect(await (await runJob()).json()).toEqual({ sent: 0, failed: 0 });
  expect(readOutbox()).toEqual([]);

  // Bo (whom Anna gives to) changes their list in two steps; the job sends one mail, to Anna
  await santaSignIn(page, bo);
  await goto(page, "/secret-santa/min-sida/onskelista");
  for (const title of ["Ny sak", "Ännu en sak"]) {
    await page.getByRole("button", { name: "Ny önskning" }).click();
    await page.getByLabel("Namn").fill(title);
    await page.getByRole("button", { name: "Lägg till" }).click();
    // The card stays open with empty fields for the next wish; Esc closes it
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { level: 3, name: title })).toBeVisible();
  }
  expect((await santaWishes(bo)).map((w) => w.title)).toEqual(["Ny sak", "Ännu en sak"]);
  expect(await (await runJob()).json()).toEqual({ sent: 1, failed: 0 });
  expect(subjects()).toEqual(["anna@exempel.invalid Secret Santa: Familjen Test – din matchning har uppdaterat sin önskelista"]);
  expect(JSON.stringify(readOutbox())).not.toMatch(/Testsson|Ny sak|Ännu en sak/);

  // Another change within the hour waits; with no new change later, nothing more is sent
  await page.getByRole("button", { name: "Ändra Ny sak" }).click();
  await page.getByLabel("Namn").fill("Ändrad sak");
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Ändrad sak" })).toBeVisible();
  expect(await (await runJob()).json()).toEqual({ sent: 0, failed: 0 });
  await ageSantaMail(bo);
  expect(await (await runJob()).json()).toEqual({ sent: 1, failed: 0 });
  expect(readOutbox()).toHaveLength(2);
  await ageSantaMail(bo);
  expect(await (await runJob()).json()).toEqual({ sent: 0, failed: 0 });
  expect(readOutbox()).toHaveLength(2);
  await caller.dispose();
  clearOutbox();
});

test("MUPP-042-R3 a change while the group is only preparing sends no mail", async ({ page }) => {
  clearOutbox();
  const event = await addSantaEvent("Familjen Test", undefined, "preparing");
  const bo = await addSantaMember(event, "Bo Testsson", "0700002222", "bo@exempel.invalid");
  await santaSignIn(page, bo);
  await goto(page, "/secret-santa/min-sida/onskelista");
  await page.getByRole("button", { name: "Ny önskning" }).click();
  await page.getByLabel("Namn").fill("Tidig sak");
  await page.getByRole("button", { name: "Lägg till" }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Tidig sak" })).toBeVisible();
  const caller = await playwrightRequest.newContext({ baseURL: process.env.BASE_URL, extraHTTPHeaders: { "x-real-ip": testIp() } });
  expect(await (await caller.post("/api/santa-mails", { headers: { authorization: `Bearer ${process.env.SANTA_JOB_SECRET}` } })).json()).toEqual({ sent: 0, failed: 0 });
  expect(readOutbox()).toEqual([]);
  await caller.dispose();
});
