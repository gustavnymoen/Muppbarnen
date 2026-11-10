import { expect, test, type Page } from "@playwright/test";
import { adminSignIn, expectNoA11yViolations, goto, runsLocally, uniqueName } from "./helpers";
import { addParent, addSantaDraw, addSantaEvent, addSantaMember, addSantaWish, clearFamily, clearSanta, santaDraw, santaWishes, setSantaEmail } from "./family-db";
import { clearOutbox, readOutbox } from "../lib/mail-sink";
import { eventCard, openEventCard, openSignInForm, SANTA_COOKIE, santaSignIn, sendPhone } from "./santa";
import { testIp } from "./site-session";

// The tests make their data straight in the local test database (never the user's own) and remove it again
test.skip(!runsLocally, "the Secret Santa tests need the local test server (its own database and passwords)");

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
  await clearSanta();
  clearOutbox();
});
test.afterEach(async () => {
  clearOutbox();
  await clearSanta();
  await clearFamily();
});

const mailsTo = (address: string) => readOutbox().filter((m) => m.to === address);

async function openCard(page: Page) {
  const card = eventCard(page, "Emmas jul");
  await openEventCard(card);
  return card;
}

test("MUPP-060-R1 R2 R3 R4 a started group: the pencil with name, phone and e-mail only, the question before the new address gets the started mail, 'Inte nu' sends nothing, and the signed-in participant is undisturbed", async ({ page }) => {
  const emma = uniqueName("Emma");
  const event = await addSantaEvent("Emmas jul", await addParent(emma), "started");
  const anna = await addSantaMember(event, "Anna Testsson", "0700001111", "anna@gammal.invalid");
  const bertil = await addSantaMember(event, "Bertil Testsson", "0700002222", "bertil@exempel.invalid");
  await addSantaWish(anna, "Bok");
  await addSantaDraw(event, anna, bertil);
  await addSantaDraw(event, bertil, anna);
  const drawn = await santaDraw(event);

  // R3: Anna is signed in on her own page before the change
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida");
  await expect(page.getByRole("heading", { level: 1, name: "Hej Anna Testsson!" })).toBeVisible();

  await adminSignIn(page, emma);
  await page.getByRole("tab", { name: "Secret Santa" }).click();
  const card = await openCard(page);

  // R1 R2: the pencil is there; the form has the three fields, no partner, and no remove button or add form
  await expect(card.getByRole("button", { name: /^(Ny person|Ta bort Anna)/ })).toHaveCount(0);
  await card.getByRole("button", { name: "Ändra Anna Testsson i Emmas jul" }).click();
  await expect(page.getByLabel("Namn", { exact: true })).toHaveValue("Anna Testsson");
  await expect(page.getByLabel("Telefon")).toBeVisible();
  await expect(page.getByLabel("E-post")).toBeVisible();
  await expect(page.getByText("Partner", { exact: true })).toHaveCount(0);
  await expectNoA11yViolations(page);

  // R1 R4: a changed phone and e-mail are saved; the question names the new address and nothing is sent before the answer
  await page.getByLabel("Telefon").fill("0709998888");
  await page.getByLabel("E-post").fill("anna@ny.invalid");
  await page.getByRole("button", { name: "Spara", exact: true }).click();
  const question = page.getByRole("alertdialog", { name: "Skicka mejlet till den nya adressen?" });
  await expect(question).toContainText("anna@ny.invalid");
  expect(readOutbox()).toEqual([]);
  await expectNoA11yViolations(page);

  // R4: Skicka gives the new address the started mail and the old one nothing
  await question.getByRole("button", { name: "Skicka" }).click();
  await expect(question).toBeHidden();
  await expect.poll(() => mailsTo("anna@ny.invalid").length).toBe(1);
  expect(mailsTo("anna@ny.invalid")[0].subject).toBe("Secret Santa: Emmas jul – nu har du fått en secret santa!");
  expect(mailsTo("anna@gammal.invalid")).toEqual([]);

  // R4: a second change answered "Inte nu" sends nothing and stays saved
  clearOutbox();
  await card.getByRole("button", { name: "Ändra Anna Testsson i Emmas jul" }).click();
  await page.getByLabel("E-post").fill("anna@tredje.invalid");
  await page.getByRole("button", { name: "Spara", exact: true }).click();
  await page.getByRole("alertdialog", { name: "Skicka mejlet till den nya adressen?" }).getByRole("button", { name: "Inte nu" }).click();
  expect(readOutbox()).toEqual([]);

  // R4: a change of name only gives no question
  await card.getByRole("button", { name: "Ändra Anna Testsson i Emmas jul" }).click();
  await expect(page.getByLabel("E-post")).toHaveValue("anna@tredje.invalid");
  await page.getByLabel("Namn", { exact: true }).fill("Anna Nysson");
  await page.getByRole("button", { name: "Spara", exact: true }).click();
  await expect(card.getByRole("heading", { level: 4, name: "Anna Nysson" })).toBeVisible();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);

  // R3: the draw and the wishes are as before, Anna is still signed in, and signs in next time with the new phone only
  expect(await santaDraw(event)).toEqual(drawn);
  expect(await santaWishes(anna)).toHaveLength(1);
  await goto(page, "/secret-santa/min-sida");
  await expect(page.getByRole("heading", { level: 1, name: "Hej Anna Nysson!" })).toBeVisible();
  await page.context().clearCookies({ name: SANTA_COOKIE });
  await openSignInForm(page, "Anna Nysson");
  await sendPhone(page, "0700001111");
  await expect(page.getByText("Det stämde inte", { exact: true })).toBeVisible();
  await sendPhone(page, "0709998888");
  await expect(page.getByRole("heading", { level: 1, name: "Hej Anna Nysson!" })).toBeVisible();
});

test("MUPP-060-R1 R2 a group that is not started still has the partner field and the remove button", async ({ page }) => {
  const emma = uniqueName("Emma");
  const event = await addSantaEvent("Emmas jul", await addParent(emma), "preparing");
  await addSantaMember(event, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  await addSantaMember(event, "Bertil Testsson", "0700002222", "bertil@exempel.invalid");
  await adminSignIn(page, emma);
  await page.getByRole("tab", { name: "Secret Santa" }).click();
  const card = await openCard(page);
  await expect(card.getByRole("button", { name: "Ta bort Anna Testsson i Emmas jul" })).toBeVisible();
  await card.getByRole("button", { name: "Ändra Anna Testsson i Emmas jul" }).click();
  await expect(page.getByRole("button", { name: "Partner" })).toBeVisible();
});

test("MUPP-060-R4 a mail that cannot be sent is named, the change stays saved, and a started group refuses a duplicate phone", async ({ page }) => {
  const emma = uniqueName("Emma");
  const event = await addSantaEvent("Emmas jul", await addParent(emma), "started");
  const anna = await addSantaMember(event, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  await addSantaMember(event, "Bertil Testsson", "0700002222", "bertil@exempel.invalid");
  await adminSignIn(page, emma);
  await page.getByRole("tab", { name: "Secret Santa" }).click();
  const card = await openCard(page);

  // R1: the phone of another participant is refused with the same message as before
  await card.getByRole("button", { name: "Ändra Anna Testsson i Emmas jul" }).click();
  await page.getByLabel("Telefon").fill("0700002222");
  await page.getByRole("button", { name: "Spara", exact: true }).click();
  await expect(page.getByText("Numret används redan av en annan person i gruppen.")).toBeVisible();

  // R4: an address the mail check refuses (put in the database, the form would not take it): the change stays saved, and the administrator is told who got no mail
  await page.getByLabel("Telefon").fill("0700001111");
  await page.getByLabel("E-post").fill("anna@ny.invalid");
  await page.getByRole("button", { name: "Spara", exact: true }).click();
  const question = page.getByRole("alertdialog", { name: "Skicka mejlet till den nya adressen?" });
  await expect(question).toBeVisible();
  await setSantaEmail(anna, "fel@invalid");
  await question.getByRole("button", { name: "Skicka" }).click();
  await expect(page.getByText("Sparat, men Anna Testsson fick inget mejl.").first()).toBeVisible();
  expect(readOutbox()).toEqual([]);
});
