import { expect, test, type Page } from "@playwright/test";
import { adminSignIn, expectNoA11yViolations, runsLocally, settledBox, uniqueName } from "./helpers";
import { addParent, addSantaEvent, addSantaMember, addSantaWish, clearFamily, clearSanta, santaDraw, santaStatusOf } from "./family-db";
import { clearOutbox, readOutbox } from "../lib/mail-sink";
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


async function openSantaTab(page: Page, parent: string) {
  await adminSignIn(page, parent);
  await page.getByRole("tab", { name: "Secret Santa" }).click();
}

test("MUPP-041-R1 MUPP-061-R1 R2 R3 R4 R5 R6 R7 the wish note, the toggle Startad with its question, the draw, its mails, and the stop", async ({ page }) => {
  clearOutbox();
  const emma = uniqueName("Emma");
  const event = await addSantaEvent("Emmas jul", await addParent(emma), "preparing");
  const anna = await addSantaMember(event, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  await addSantaMember(event, "Bertil Testsson", "0700002222", "bertil@exempel.invalid");
  await addSantaMember(event, "Cia Testsson", "0700003333", "cia@exempel.invalid");
  await addSantaWish(anna, "Bok");
  await openSantaTab(page, emma);
  const card = eventCard(page, "Emmas jul");

  // MUPP-061-R1: the note "Önskelista påbörjad" only by the participant with a wish, as text, with a green symbol in front
  await expect(card.getByText("Önskelista påbörjad")).toHaveCount(1);
  await expect(card.getByRole("article").filter({ hasText: "Anna Testsson" }).getByText("Önskelista påbörjad")).toBeVisible();

  // R2: the question names who has no list yet; cancelling changes nothing
  const toggle = card.getByRole("switch", { name: "Startad Emmas jul" });
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  expect((await settledBox(toggle)).height).toBeGreaterThanOrEqual(44);
  await toggle.click();
  const question = page.getByRole("alertdialog", { name: "Är du säker?" });
  await expect(question).toContainText("Efter det går det inte att lägga till, ändra eller ta bort någon.");
  await expect(question).toContainText("Ännu ingen önskelista från: Bertil Testsson, Cia Testsson.");
  await expectNoA11yViolations(page);
  await question.getByRole("button", { name: "Avbryt" }).click();
  expect(await santaStatusOf(event)).toBe("preparing");

  // R2 R3 R4: confirming draws everyone once; Aktiv is locked on, the members have no buttons
  await toggle.click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Starta", exact: true }).click();
  await expect(card).toContainText("Status: Startad");
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await expect(card.getByRole("switch", { name: "Aktiv Emmas jul" })).toBeDisabled();
  const drawn = await santaDraw(event);
  expect(drawn).toHaveLength(3);
  expect(drawn.every(([giver, receiver]) => giver !== receiver)).toBe(true);
  expect(new Set(drawn.map(([, receiver]) => receiver)).size).toBe(3);
  await expectNoA11yViolations(page);

  // R5: the page says nothing about who drew whom (the data side is a unit test: the event list has no draw)
  await expect(card).not.toContainText(/drog|matchad med|handlar åt/i);

  // R6: one mail per participant, naming the event and nobody else
  await expect.poll(() => readOutbox().length).toBe(3);
  expect(readOutbox().map((m) => m.subject)).toEqual(Array(3).fill("Secret Santa: Emmas jul – nu har du fått en secret santa!"));
  expect(JSON.stringify(readOutbox())).not.toContain("Testsson");

  // R7: stop asks the same way, mails everyone, deletes the draw and keeps the list
  clearOutbox();
  await toggle.click();
  await expect(page.getByRole("alertdialog", { name: "Är du säker?" })).toContainText("Dragningen och alla samtal tas bort");
  await page.getByRole("alertdialog").getByRole("button", { name: "Stoppa", exact: true }).click();
  await expect(card).toContainText("Status: Förbereder");
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  expect(await santaDraw(event)).toEqual([]);
  await expect(card.getByText("Önskelista påbörjad")).toHaveCount(1);
  await expect.poll(() => readOutbox().length).toBe(3);
  expect(readOutbox().map((m) => m.subject)).toEqual(Array(3).fill("Secret Santa: Emmas jul – dragningen är stoppad"));
  clearOutbox();
});

test("MUPP-041-R2 the toggle Startad is off and locked in an inactive group, the draw is refused for a lone participant and a failing mail is named while the draw stands", async ({ page }) => {
  const emma = uniqueName("Emma");
  const parent = await addParent(emma);
  const inactive = await addSantaEvent("Inaktiv grupp", parent, "inactive");
  await addSantaMember(inactive, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  const lone = await addSantaEvent("Ensam grupp", parent, "preparing");
  await addSantaMember(lone, "Bertil Testsson", "0700002222", "bertil@exempel.invalid");
  const bad = await addSantaEvent("Mejlgrupp", parent, "preparing");
  await addSantaMember(bad, "Cia Testsson", "0700003333", "cia@exempel.invalid");
  await addSantaMember(bad, "Dan Testsson", "0700004444", "dan@invalid");
  await openSantaTab(page, emma);
  // Several own groups fold (MUPP-056): open each
  for (const name of ["Inaktiv grupp", "Ensam grupp", "Mejlgrupp"]) await openEventCard(eventCard(page, name));

  await expect(eventCard(page, "Inaktiv grupp").getByRole("switch", { name: "Startad Inaktiv grupp" })).toBeDisabled();

  // R3: one participant cannot be drawn; the admin is told why and nothing changes
  await eventCard(page, "Ensam grupp").getByRole("switch", { name: "Startad Ensam grupp" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Starta", exact: true }).click();
  await expect(page.getByText("Dragningen går inte att göra: det behövs minst två deltagare.").first()).toBeVisible();
  expect(await santaStatusOf(lone)).toBe("preparing");
  expect(await santaDraw(lone)).toEqual([]);
  await page.getByRole("alertdialog").getByRole("button", { name: "Avbryt" }).click();

  // R6: Dan's address is refused by the mail check: the draw stands and the admin sees who got none
  await eventCard(page, "Mejlgrupp").getByRole("switch", { name: "Startad Mejlgrupp" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Starta", exact: true }).click();
  await expect(page.getByText("Sparat, men Dan Testsson fick inget mejl.").first()).toBeVisible();
  expect(await santaStatusOf(bad)).toBe("started");
  expect(await santaDraw(bad)).toHaveLength(2);
  clearOutbox();
});
