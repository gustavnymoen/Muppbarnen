import { existsSync, readdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { testPicturesDir } from "../lib/local-db.mjs";
import {
  adminSignIn,
  birthdateIn,
  expectNoA11yViolations,
  expectOnto,
  ghost,
  goto,
  pageAnimationsDone,
  runsLocally,
  settledBox,
  signInSanta,
  transformsOf,
  uniqueName,
} from "./helpers";
import { addChild, addParent, addSantaEvent, addSantaMember, addWish, claimedByOf, clearFamily, clearSanta, setSizes } from "./family-db";
import { newcomer, testIp } from "./site-session";

// The tests make their data straight in the local test database (never the user's own) and remove it again
test.skip(!runsLocally, "the admin tests need the local test server (its own database and passwords)");

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
  await clearSanta();
});
test.afterEach(async () => {
  await clearSanta();
  await clearFamily();
  // The picture the Hantera test uploads: kid ids start again at 1, so the file would be counted by the picture tests
  for (const file of (existsSync(testPicturesDir) ? readdirSync(testPicturesDir) : []).filter((f) => f.startsWith("barn-"))) unlinkSync(path.join(testPicturesDir, file));
});

// The open card (MUPP-045): a modal <dialog>, which stays in the page's DOM next to its button
const card = (page: Page) => page.locator("dialog[open]");
// What a screen reader hears once a card has closed after a save (R7): a live region next to the card that the eye does not see
const said = (page: Page, text: string) => page.locator("[aria-live=polite]").filter({ hasText: text });
// A point on the dark area beside the card, where a phone shows the page behind it
const outside = (page: Page) => page.mouse.click(2, 300);
const selection = (field: ReturnType<Page["locator"]>) => field.evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd]);

test("MUPP-045-R2 R3 R4 R5 R7 Hantera, a kid's edit card: title and values, the first field focused with its text selected, Enter on to the next field and sending from the last, a mistake keeps the card, Esc and the cross close it and a tap outside does not, and a save is announced", async ({ page }) => {
  const chef = uniqueName("Chef");
  await addChild(await addParent(chef, true), "Otis", "2019-03-09");
  await page.setViewportSize({ width: 375, height: 667 });
  await adminSignIn(page, chef);
  await goto(page, "/admin/hantera");
  const pencil = page.getByRole("button", { name: "Ändra Otis" });
  const dialog = card(page);
  const name = dialog.getByLabel("Namn");
  const date = dialog.getByLabel("Födelsedatum");

  // R2 R4: a title that says what it is for, the current values, focus in the first field at once and its text selected
  await pencil.click();
  await expect(dialog.getByRole("heading", { level: 2, name: "Ändra Otis" })).toBeVisible();
  await expect(name).toHaveValue("Otis");
  await expect(date).toHaveValue("2019-03-09");
  await expect(name).toBeFocused();
  expect(await selection(name)).toEqual([0, 4]);
  // R5: the Enter key of a phone says "Nästa", and "Klar" in the last text field (the list after the date is no field for Enter)
  await expect(name).toHaveAttribute("enterkeyhint", "next");
  await expect(date).toHaveAttribute("enterkeyhint", "done");
  // R3: the cross has a name and a 44 px target, and sits beside the title
  const cross = dialog.getByRole("button", { name: "Stäng" });
  const [crossBox, titleBox] = [await settledBox(cross), await settledBox(dialog.getByRole("heading", { level: 2 }))];
  expect(crossBox.width).toBeGreaterThanOrEqual(44);
  expect(crossBox.height).toBeGreaterThanOrEqual(44);
  expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(crossBox.x + 0.5);
  await expectNoA11yViolations(page);

  // R5 R7: Enter in an empty field moves on anyway; Enter in the last field sends, and the mistake keeps the card with what was typed and focus at the field
  await name.fill("");
  await page.keyboard.press("Enter");
  await expect(date).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog.getByRole("alert").filter({ hasText: "Fyll i det här fältet." })).toBeVisible();
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(date).toHaveValue("2019-03-09");
  await expectNoA11yViolations(page);

  // R7: put right, Enter twice sends it; the card folds into its button, which has focus, and a screen reader hears what was saved
  await page.keyboard.type("Nils");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(said(page, "Nils sparades")).toBeAttached();
  const renamed = page.getByRole("button", { name: "Ändra Nils" });
  await expect(renamed).toBeFocused();
  await expect(page.getByRole("heading", { level: 3, name: "Nils" })).toBeVisible();

  // R3: Esc closes without saving and gives focus back; the card starts over when it is opened again
  await renamed.click();
  await name.fill("Annat");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(renamed).toBeFocused();
  await expect(page.getByRole("heading", { level: 3, name: "Nils" })).toBeVisible();
  await renamed.click();
  await expect(name).toHaveValue("Nils");
  // R3: a tap on the dark area does nothing; the cross closes
  await outside(page);
  await expect(dialog).toHaveCount(1);
  await cross.click();
  await expect(dialog).toHaveCount(0);
  await expect(renamed).toBeFocused();
});

test("MUPP-045-R2 R5 R7 R8 Hantera, a new parent, a new kid with the parent list in front of the card, and the picture card: Enter sends from the last text field, the list works inside the card, a save closes the card and is announced", async ({ page }) => {
  const chef = uniqueName("Chef");
  const mia = uniqueName("Mia");
  await addChild(await addParent(chef, true), "Otis");
  await addParent(mia);
  await page.setViewportSize({ width: 375, height: 667 });
  await adminSignIn(page, chef);
  await goto(page, "/admin/hantera");
  const dialog = card(page);

  // R2 R5: a new parent has empty fields and focus in the first; Enter in the only text field sends it (a checkbox after it is no field for Enter),
  // and an empty name is refused where it is and keeps the card
  await page.getByRole("button", { name: "Ny förälder" }).click();
  await expect(dialog.getByRole("heading", { level: 2, name: "Ny förälder" })).toBeVisible();
  await expect(dialog.getByLabel("Namn")).toHaveValue("");
  await expect(dialog.getByLabel("Namn")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog.getByRole("alert").filter({ hasText: "Fyll i det här fältet." })).toBeVisible();
  const ola = uniqueName("Ola");
  await page.keyboard.type(ola);
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(said(page, `${ola} lades till`)).toBeAttached();
  await expect(page.getByRole("heading", { level: 3, name: ola })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ny förälder" })).toBeFocused();

  // R2 R8: a new kid; the parent list opens in front of the card and is used with the keyboard and a tap, Esc closes the list and not the card
  const kid = uniqueName("Barn");
  await page.getByRole("button", { name: "Nytt barn" }).click();
  await dialog.getByLabel("Namn").fill(kid);
  await dialog.getByLabel("Födelsedatum").fill("2019-03-09");
  const parent = dialog.getByRole("button", { name: /^Förälder/ });
  await parent.click();
  await expect(page.getByRole("option")).toHaveCount(3);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("option")).toHaveCount(0);
  await expect(dialog).toHaveCount(1);
  await expect(parent).toBeFocused();
  // R5: Enter on a list opens it, as before
  await page.keyboard.press("Enter");
  await page.getByRole("option", { name: mia }).click();
  await expect(parent).toHaveText(mia);
  await expectNoA11yViolations(page);
  // R5: Enter in the date, the last text field, sends (the list is skipped)
  await dialog.getByLabel("Födelsedatum").focus();
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(said(page, `${kid} lades till`)).toBeAttached();
  await expect(page.getByRole("heading", { level: 3, name: kid })).toBeVisible();

  // R2 R7: the picture card has the file field first, with focus; saving closes it and says so
  await page.getByRole("button", { name: "Bild för Otis" }).click();
  await expect(dialog.getByRole("heading", { level: 2, name: "Bild för Otis" })).toBeVisible();
  const file = dialog.getByLabel("Bild", { exact: true });
  await expect(file).toBeFocused();
  await file.setInputFiles({ name: "bild.png", mimeType: "image/png", buffer: png });
  await dialog.getByRole("button", { name: "Spara bild" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(said(page, "Bilden för Otis sparades")).toBeAttached();
  await expect(page.getByRole("button", { name: "Bild för Otis" })).toBeFocused();

  // R3: a button that is gone when the card closes: focus goes to the heading of the section it was in, never to the top of the page
  await page.getByRole("button", { name: "Ny förälder" }).click();
  await expect(dialog).toHaveCount(1);
  await page.getByRole("button", { name: "Ny förälder" }).evaluate((button) => button.remove());
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2, name: "Föräldrar" })).toBeFocused();
});

test("MUPP-045-R2 R4 R5 R6 R7 a kid's wish lists: Enter through the wish form, a new wish keeps the card open with empty fields and a short confirmation that is text and goes after 3 s, and an edit closes the card", async ({ page }) => {
  const mia = uniqueName("Mia");
  const kidId = await addChild(await addParent(mia), "Otis");
  await page.setViewportSize({ width: 320, height: 568 });
  await adminSignIn(page, mia);
  await goto(page, `/admin/barn/${kidId}/onskelistor`);
  const birthday = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Födelsedag" }) });
  const dialog = card(page);
  const [name, size, description, link] = ["Namn", "Storlek", "Beskrivning", "Länk"].map((label) => dialog.getByLabel(label));
  const unlimited = dialog.getByLabel("Obegränsad");
  const confirmation = dialog.getByRole("status");
  const save = dialog.getByRole("button", { name: "Lägg till" });

  await birthday.getByRole("button", { name: "Ny önskning, Födelsedag" }).click();
  await expect(dialog.getByRole("heading", { level: 2, name: "Ny önskning, Födelsedag" })).toBeVisible();
  // R6: the status for the confirmation is in the card from the start, and empty
  await expect(confirmation).toHaveText("");
  await expect(name).toBeFocused();
  // R5: Enter moves from Namn to Storlek to Beskrivning; in Beskrivning it makes a new line and focus stays
  await page.keyboard.type("fotboll");
  await page.keyboard.press("Enter");
  await expect(size).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(description).toBeFocused();
  await page.keyboard.type("rad 1");
  await page.keyboard.press("Enter");
  await page.keyboard.type("rad 2");
  await expect(description).toHaveValue("rad 1\nrad 2");
  await expect(description).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(link).toBeFocused();
  await unlimited.check();
  await expect(link).toHaveAttribute("enterkeyhint", "done");
  await expectNoA11yViolations(page);

  // R5: Enter in Länk, the last text field (the checkbox after it is no field for Enter), sends the form
  await link.focus();
  // The clock is the page's own: the 3 seconds of the confirmation pass when it is moved, not the test
  await page.clock.install();
  await page.keyboard.press("Enter");
  // R6: the card stays, the confirmation names the wish, every field is empty, nothing is checked, focus is in Namn and the wish is in the list behind
  await expect(confirmation).toHaveText("fotboll lades till");
  for (const field of [name, size, description, link]) await expect(field).toHaveValue("");
  await expect(unlimited).not.toBeChecked();
  await expect(name).toBeFocused();
  // MUPP-054-R1: the same words are in a toast at the top of the screen, in the top layer in front of the card
  const toast = page.locator("[data-toast]");
  await expect(toast).toHaveText("fotboll lades till");
  await expect(toast).toHaveAttribute("data-toast", "saved");
  await expect(toast).toHaveAttribute("aria-hidden", "true");
  expect(await toast.evaluate((el) => el.matches(":popover-open"))).toBe(true);
  expect((await settledBox(toast.locator("p"))).y).toBeLessThanOrEqual(16);
  await expect(dialog.getByRole("alert").filter({ hasText: /\S/ })).toHaveCount(0);
  await expect(birthday.locator("article").filter({ hasText: "fotboll" })).toBeAttached();
  await expectNoA11yViolations(page);

  // R6: a title over 25 characters is cut to 24 and an ellipsis; a second save within 3 s replaces the text and starts the 3 s again
  await page.clock.fastForward(2000);
  const long = "Ett väldigt långt önskemål om en cykel";
  await page.keyboard.type(long);
  await save.click();
  await expect(confirmation).toHaveText("Ett väldigt långt önskem… lades till");
  await page.clock.fastForward(2000);
  await expect(confirmation).not.toHaveText("");
  await expect(toast).toHaveText("Ett väldigt långt önskem… lades till");
  await page.clock.fastForward(1100);
  await expect(confirmation).toHaveText("");
  // MUPP-054-R1: still there 2 s after the last save, gone 3.1 s after it (the slide and the fade are not measured)
  await expect(toast).toHaveCount(0);
  await expect(birthday.locator("article").filter({ hasText: long })).toBeAttached();
  // R6: what is typed is text, never HTML
  await page.keyboard.type("<b>x</b>");
  await save.click();
  await expect(confirmation).toHaveText("<b>x</b> lades till");
  await expect(dialog.locator("b")).toHaveCount(0);

  // R3: Esc closes the card with focus back on the button; the list shows the wishes with their whole titles
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(birthday.getByRole("button", { name: "Ny önskning, Födelsedag" })).toBeFocused();
  await expect(birthday.getByRole("heading", { level: 3, name: long })).toBeVisible();

  // R7: an edit closes the card, a screen reader hears that it was saved, and focus is on the pencil
  await birthday.getByRole("button", { name: "Ändra fotboll" }).click();
  await expect(name).toHaveValue("fotboll");
  expect(await selection(name)).toEqual([0, 7]);
  await page.keyboard.type("basket");
  await dialog.getByRole("button", { name: "Spara" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(said(page, "basket sparades")).toBeAttached();
  await expect(birthday.getByRole("button", { name: "Ändra basket" })).toBeFocused();
});

test("MUPP-045-R2 R5 R7 R8 the Secret Santa tab: a new group with one field, a new person through Enter, and a member's partner list", async ({ page }) => {
  const chef = uniqueName("Chef");
  await addParent(chef, true);
  const ek = await addSantaEvent("Familjen Ek");
  await addSantaEvent("Familjen Ask");
  await addSantaMember(ek, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  await addSantaMember(ek, "Bertil Testsson", "0700002222", "bertil@exempel.invalid");
  await page.setViewportSize({ width: 375, height: 667 });
  await adminSignIn(page, chef);
  await page.getByRole("tab", { name: "Secret Santa" }).click();
  const dialog = card(page);

  // R2 R5: a family has one field, so Enter sends it
  await page.getByRole("button", { name: "Ny grupp", exact: true }).click();
  await expect(dialog.getByRole("heading", { level: 2, name: "Ny grupp" })).toBeVisible();
  await expect(dialog.getByLabel("Gruppens namn")).toBeFocused();
  await page.keyboard.type("Familjen Alm");
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(said(page, "Familjen Alm lades till")).toBeAttached();
  await expect(page.getByRole("heading", { level: 3, name: "Familjen Alm" })).toBeVisible();

  // R5: a new person: Enter goes from the name to the phone to the e-mail, which sends; the Enter key of a phone says "Nästa" twice and "Klar"
  await page.getByRole("button", { name: "Ny person i Familjen Ask" }).click();
  await expect(dialog.getByLabel("Namn")).toBeFocused();
  await expect(dialog.getByLabel("Namn")).toHaveAttribute("enterkeyhint", "next");
  await expect(dialog.getByLabel("Telefon")).toHaveAttribute("enterkeyhint", "next");
  await expect(dialog.getByLabel("E-post")).toHaveAttribute("enterkeyhint", "done");
  await page.keyboard.type("Cilla Testsson");
  await page.keyboard.press("Enter");
  await expect(dialog.getByLabel("Telefon")).toBeFocused();
  await page.keyboard.type("0700003333");
  await page.keyboard.press("Enter");
  await expect(dialog.getByLabel("E-post")).toBeFocused();
  await expectNoA11yViolations(page);
  await page.keyboard.type("cilla@exempel.invalid");
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(said(page, "Cilla Testsson lades till")).toBeAttached();

  // R2 R8: a member's card has its fields filled in and a partner list that works in the card; the first field's text is selected
  await page.getByRole("button", { name: "Ändra Anna Testsson i Familjen Ek" }).click();
  await expect(dialog.getByLabel("Namn")).toHaveValue("Anna Testsson");
  expect(await selection(dialog.getByLabel("Namn"))).toEqual([0, 13]);
  await dialog.getByRole("button", { name: /^Partner/ }).click();
  await page.getByRole("option", { name: "Bertil Testsson" }).click();
  await dialog.getByRole("button", { name: "Spara" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(said(page, "Anna Testsson sparades")).toBeAttached();
  await expect(page.getByText("Partner: Bertil Testsson").first()).toBeVisible();
});

test("MUPP-045-R2 R6 R7 the Secret Santa own page: a new wish keeps the card open with a confirmation, an edit closes it and is announced", async ({ page }) => {
  const family = await addSantaEvent("Familjen Test");
  await addSantaMember(family, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  await signInSanta(page, "Familjen Test", "Anna Testsson", "0700001111");
  await page.getByRole("link", { name: "Min önskelista" }).click();
  const dialog = card(page);

  await page.getByRole("button", { name: "Ny önskning, Familjen Test" }).click();
  await expect(dialog.getByRole("heading", { level: 2, name: "Ny önskning, Familjen Test" })).toBeVisible();
  await expect(dialog.getByLabel("Namn")).toBeFocused();
  await expect(dialog.getByLabel("Obegränsad")).toHaveCount(0);
  await page.keyboard.type("Bok");
  await dialog.getByRole("button", { name: "Lägg till" }).click();
  await expect(dialog.getByRole("status")).toHaveText("Bok lades till");
  await expect(dialog.getByLabel("Namn")).toHaveValue("");
  await expect(dialog.getByLabel("Namn")).toBeFocused();
  await expectNoA11yViolations(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { level: 3, name: "Bok" })).toBeVisible();

  await page.getByRole("button", { name: "Ändra Bok" }).click();
  await page.keyboard.type("Kokbok");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(said(page, "Kokbok sparades")).toBeAttached();
  await expect(page.getByRole("button", { name: "Ändra Kokbok" })).toBeFocused();
});

test("MUPP-045-R2 R4 R5 R7 the kid's sizes are a card on /admin: Enter goes through the four fields, a save closes it and is announced, and the page /admin/barn/<id>/storlekar is gone", async ({ page }) => {
  const mia = uniqueName("Mia");
  const kidId = await addChild(await addParent(mia), "Otis");
  await setSizes(kidId, { clothes: "128", shoes: "31" });
  await page.setViewportSize({ width: 375, height: 667 });
  await adminSignIn(page, mia);
  const button = page.getByRole("button", { name: "Storlekar för Otis" });
  const dialog = card(page);
  const fields = ["Kläder", "Skor", "Huvud", "Handskar"].map((label) => dialog.getByLabel(label));

  await button.click();
  await expect(dialog.getByRole("heading", { level: 2, name: "Storlekar för Otis" })).toBeVisible();
  await expect(fields[0]).toHaveValue("128");
  await expect(fields[1]).toHaveValue("31");
  await expect(fields[0]).toBeFocused();
  expect(await selection(fields[0])).toEqual([0, 3]);
  for (const [i, field] of fields.entries()) await expect(field).toHaveAttribute("enterkeyhint", i < 3 ? "next" : "done");
  await expectNoA11yViolations(page);
  // R5: Enter goes from field to field and sends from the last
  await page.keyboard.type("134");
  await page.keyboard.press("Enter");
  await page.keyboard.type("32");
  await page.keyboard.press("Enter");
  await page.keyboard.type("54");
  await page.keyboard.press("Enter");
  await expect(fields[3]).toBeFocused();
  await page.keyboard.type("5");
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(said(page, "Storlekarna för Otis sparades")).toBeAttached();
  await expect(button).toBeFocused();
  await button.click();
  await expect(fields[0]).toHaveValue("134");
  await expect(fields[3]).toHaveValue("5");
  await page.keyboard.press("Escape");

  // The old page is gone, for the kid's own parent too
  await goto(page, `/admin/barn/${kidId}/storlekar`);
  await expect(page.getByRole("heading", { level: 1, name: "Sidan finns inte" })).toBeVisible();
});

test("MUPP-045-R2 R3 R4 R5 the claim window is a form card (a cross and no Avbryt, focus in the name, Enter sends, a tap outside does nothing) and a question card keeps its buttons, with focus on the safe one and no cross", async ({ page }) => {
  const child = await addChild(await addParent(uniqueName("Förälder")), "Vera", birthdateIn(20).birthdate);
  await addWish(child, "birthday", "Cykel");
  await addWish(child, "birthday", "Hoppborg", { claimedBy: "Moster Lisa" });
  await page.setViewportSize({ width: 375, height: 667 });
  await goto(page, "/");
  await page.getByRole("article").getByRole("button", { name: /^Önskelista/ }).click();
  const region = page.getByRole("region", { name: "Önskelista" });
  await region.getByRole("checkbox", { name: "Cykel" }).check();
  const claim = region.getByRole("button", { name: /^Paxa \(/ });
  const dialog = page.getByRole("dialog");

  // R2 R3 R4: a cross instead of "Avbryt", focus in the name field at once, and a tap on the dark area does nothing
  await claim.click();
  await expect(dialog.getByRole("heading", { level: 2, name: "Paxa presenten" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Avbryt" })).toHaveCount(0);
  await expect(dialog.getByLabel("Ditt namn")).toBeFocused();
  const cross = await settledBox(dialog.getByRole("button", { name: "Stäng" }));
  expect(cross.width).toBeGreaterThanOrEqual(44);
  expect(cross.height).toBeGreaterThanOrEqual(44);
  await outside(page);
  await expect(dialog).toBeVisible();
  // R5: Enter in the name field sends the form, and an empty name is refused as before (the tap outside took the focus out of the field)
  await dialog.getByLabel("Ditt namn").focus();
  await page.keyboard.press("Enter");
  await expect(dialog.getByRole("alert")).toHaveText("Skriv ditt namn.");
  await dialog.getByRole("button", { name: "Stäng" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(claim).toBeFocused();
  expect(await claimedByOf("Cykel")).toBeNull();
  await claim.click();
  await page.keyboard.type("Moster Lisa");
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  expect(await claimedByOf("Cykel")).toBe("Moster Lisa");

  // R2 R3 R4: the question card keeps its buttons and gets no cross; focus starts on the safe one and Esc gives it back to the button
  const undo = region.getByRole("button", { name: "Ta bort paxningen på Hoppborg" });
  await undo.click();
  const question = page.getByRole("alertdialog");
  await expect(question.getByRole("heading", { level: 2, name: "Ta bort paxningen" })).toBeVisible();
  await expect(question.getByRole("button", { name: "Avbryt" })).toBeFocused();
  await expect(question.getByRole("button", { name: "Stäng" })).toHaveCount(0);
  await expectNoA11yViolations(page);
  await page.keyboard.press("Escape");
  await expect(question).toHaveCount(0);
  await expect(undo).toBeFocused();
});

test("MUPP-045-R1 a card grows out of its button and folds back into it, a quick close and reopen leaves no copy, a card without a button only fades, and with reduced motion nothing moves", async ({ page, browser, baseURL }) => {
  const child = await addChild(await addParent(uniqueName("Förälder")), "Vera", birthdateIn(20).birthdate);
  await addWish(child, "birthday", "Cykel");
  await page.setViewportSize({ width: 375, height: 667 });
  await goto(page, "/");
  await page.getByRole("article").getByRole("button", { name: /^Önskelista/ }).click();
  const region = page.getByRole("region", { name: "Önskelista" });
  await region.getByRole("checkbox", { name: "Cykel" }).check();
  const claim = region.getByRole("button", { name: /^Paxa \(/ });
  const dialog = page.getByRole("dialog");
  const button = await settledBox(claim);

  // Opening: right after the press the card is moved and scaled from the button's box to its own
  await claim.click();
  const grow = await transformsOf(dialog);
  await pageAnimationsDone(page);
  const full = await settledBox(dialog);
  expect(grow).toHaveLength(2);
  expectOnto(grow[0], full, button);

  // Closing: the real card is gone at once and a copy of it moves and scales onto the button
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(ghost(page)).toHaveCount(1);
  const shrink = await transformsOf(ghost(page));
  expectOnto(shrink[shrink.length - 1], full, button);
  await pageAnimationsDone(page);
  await expect(ghost(page)).toHaveCount(0);
  await expect(claim).toBeFocused();

  // Closed while it opens, and opened again during the fold: the state is final at once and no copy is left
  await claim.click();
  await page.keyboard.press("Escape");
  await claim.click();
  await expect(dialog).toBeVisible();
  await expect(ghost(page)).toHaveCount(0);
  await expect(dialog.getByLabel("Ditt namn")).toBeFocused();
  await page.keyboard.press("Escape");
  await pageAnimationsDone(page);
  await expect(ghost(page)).toHaveCount(0);

  // Reduced motion: nothing moves or fades, and no copy is made
  await page.emulateMedia({ reducedMotion: "reduce" });
  await claim.click();
  expect(await dialog.evaluate((el) => el.getAnimations().length)).toBe(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(ghost(page)).toHaveCount(0);

  // A card with no button to grow from ("Så funkar listorna" the first time the site is opened) only fades: its copy is not moved
  const context = await newcomer(browser, baseURL);
  const first = await context.newPage();
  await goto(first, "/");
  const intro = first.getByRole("dialog", { name: "Så funkar listorna" });
  await expect(intro).toBeVisible();
  await intro.getByRole("button", { name: "OK" }).click();
  await expect(intro).toHaveCount(0);
  await expect(ghost(first)).toHaveCount(1);
  expect((await transformsOf(ghost(first))).every((t) => t === "none")).toBe(true);
  await context.close();
});
