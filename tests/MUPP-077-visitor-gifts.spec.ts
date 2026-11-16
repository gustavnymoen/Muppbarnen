import { expect, test, type Page } from "@playwright/test";
import { addChild, addParent, addWish, claimedByOf, clearFamily, giftOf } from "./family-db";
import { adminSignIn, animationsDone, birthdateIn, dateIn, expectNoA11yViolations, goto, runsLocally, settledBox, uniqueName } from "./helpers";
import { testIp } from "./site-session";

// De här testen gör egna barn i testdatabasen, så de körs bara lokalt
test.skip(!runsLocally, "needs the local test database");

const card = (page: Page) => page.getByRole("article").first();
const region = (page: Page) => card(page).getByRole("region", { name: "Önskelista" });
const dialog = (page: Page) => page.locator("dialog[open]");
// Exakt: "Ditt namn" på steg 2 innehåller också "namn"
const field = (page: Page, label: string) => dialog(page).getByLabel(label, { exact: true });
const addButton = (page: Page) => region(page).getByRole("button", { name: /^Lägg till/ });
const row = (page: Page, title: string) => region(page).getByRole("listitem").filter({ hasText: title });
const undo = (page: Page, title: string) => region(page).getByRole("button", { name: `Ta bort presenten ${title}` });
const undoClaim = (page: Page, title: string) => region(page).getByRole("button", { name: `Ta bort paxningen på ${title}` });

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
});
test.afterAll(clearFamily);

// Vera har ett kort för sig själv; telefonen först (320 px). days: när födelsedagen kommer (negativt: var, MUPP-031)
async function openList(page: Page, wishes: (child: number) => Promise<void>, days = 20) {
  const parent = await addParent(uniqueName("Förälder"));
  const vera = await addChild(parent, "Vera", birthdateIn(days).birthdate);
  await wishes(vera);
  await page.setViewportSize({ width: 320, height: 640 });
  await goto(page, "/");
  await animationsDone(card(page));
  if (days < 0) {
    await page.getByRole("button", { name: "Föregående kort" }).click();
    await animationsDone(card(page));
  }
  await card(page).getByRole("button", { name: /^Önskelista/ }).click();
  await expect(region(page)).toBeVisible();
  return vera;
}

// En hel resa i samma lista (TECH-015): knappen sist i en lång lista, båda stegen, felen, tillbaka, sparandet och radens utseende
test("MUPP-077-R1 R2 R3 R4 R5 the add button ends a long list, step 1 checks the gift, step 2 the name, back keeps what was typed, the gift is saved as claimed and shown as added, and a parent's claimed row keeps its dialog", async ({ page }) => {
  await openList(page, async (vera) => {
    for (let i = 1; i <= 12; i++) await addWish(vera, "birthday", `Önskan ${i}`);
    // En förälders paxade rad (R5, sist i testet)
    await addWish(vera, "birthday", "Cykel", { claimedBy: "Moster Lisa" });
  });

  // R1: sist i den scrollande ytan, efter sista raden
  await addButton(page).scrollIntoViewIfNeeded();
  const [last, button] = await Promise.all([settledBox(row(page, "Önskan 12")), settledBox(addButton(page))]);
  expect(button.y).toBeGreaterThanOrEqual(last.y + last.height);
  await expectNoA11yViolations(page);
  await addButton(page).click();
  await expect(dialog(page)).toHaveAccessibleName("Lägg till en present");
  await expect(field(page, "Namn")).toBeFocused();

  // R2: fel visas på fältet och fönstret står kvar på steg 1
  await dialog(page).getByRole("button", { name: "Nästa" }).click();
  await expect(field(page, "Namn")).toHaveAttribute("aria-invalid", "true");
  await expect(field(page, "Namn")).toBeFocused();
  await expect(dialog(page)).toHaveAccessibleName("Lägg till en present");
  await field(page, "Namn").fill("Pussel");
  await field(page, "Länk").fill("javascript:alert(1)");
  await dialog(page).getByRole("button", { name: "Nästa" }).click();
  await expect(field(page, "Länk")).toHaveAttribute("aria-invalid", "true");
  await expect(dialog(page).getByLabel("Kan köpas flera gånger")).toHaveCount(0);
  await expectNoA11yViolations(page);
  await field(page, "Länk").fill("https://exempel.se/pussel");
  await field(page, "Storlek").fill("1000 bitar");
  await field(page, "Beskrivning").fill("Ett pussel med hästar");
  await dialog(page).getByRole("button", { name: "Nästa" }).click();

  // R3: steg 2 frågar efter namnet; ett tomt namn ger "Skriv ditt namn."
  await expect(dialog(page)).toHaveAccessibleName("Ange ditt namn");
  await expect(field(page, "Ditt namn")).toBeFocused();
  await expectNoA11yViolations(page);
  await dialog(page).getByRole("button", { name: "Lägg till" }).click();
  await expect(dialog(page).getByText("Skriv ditt namn.")).toBeVisible();
  expect(await giftOf("Pussel")).toBeUndefined();
  await field(page, "Ditt namn").fill("Moster Lisa");
  // Tillbaka behåller allt, och namnet står kvar när man går framåt igen
  await dialog(page).getByRole("button", { name: "Tillbaka" }).click();
  await expect(dialog(page)).toHaveAccessibleName("Lägg till en present");
  await expect(field(page, "Namn")).toHaveValue("Pussel");
  await expect(field(page, "Storlek")).toHaveValue("1000 bitar");
  await expect(field(page, "Beskrivning")).toHaveValue("Ett pussel med hästar");
  await expect(field(page, "Länk")).toHaveValue("https://exempel.se/pussel");
  await dialog(page).getByRole("button", { name: "Nästa" }).click();
  await expect(field(page, "Ditt namn")).toHaveValue("Moster Lisa");

  // R4: Enter skickar; raden är sparad som paxad och märkt, och står kvar efter en omladdning
  await field(page, "Ditt namn").press("Enter");
  await expect(dialog(page)).toHaveCount(0);
  await expect(addButton(page)).toBeFocused();
  expect(await giftOf("Pussel")).toEqual({ claimedBy: "Moster Lisa", addedBy: "Moster Lisa", unlimited: false });
  await goto(page, "/");
  await animationsDone(card(page));
  await card(page).getByRole("button", { name: /^Önskelista/ }).click();
  await expect(row(page, "Pussel")).toContainText("Tillagd av Moster Lisa");
  await expect(row(page, "Pussel")).not.toContainText("Paxad");
  await expect(row(page, "Pussel").getByRole("checkbox")).toHaveCount(0);
  // Sorterad bland de paxade: sist, efter de lediga
  await expect(region(page).getByRole("listitem").last()).toContainText("Pussel");
  await row(page, "Pussel").getByRole("button", { name: /^Pussel/ }).click();
  await expect(row(page, "Pussel")).toContainText(/Tillagd av Moster Lisa \d{4}-\d{2}-\d{2}/);
  await expectNoA11yViolations(page);

  // R5: en förälders paxade rad har kvar dagens dialog, om paxningen
  await undoClaim(page, "Cykel").click();
  const ask = page.getByRole("alertdialog");
  await expect(ask).toContainText("Cykel är paxad av Moster Lisa.");
  await expect(ask).toHaveAccessibleName("Ta bort paxningen");
  await expect(ask.getByRole("button", { name: "Ta bort", exact: true })).toBeVisible();
  await expectNoA11yViolations(page);
});

test("MUPP-077-R1 R4 R5 R7 the button is in an empty list too; the undo dialog asks to remove the gift, removing it deletes the row, and without a site session nothing is saved", async ({ page }) => {
  await openList(page, async () => {});
  await expect(region(page)).toContainText("Inga önskningar än.");
  await expect(addButton(page)).toBeVisible();
  await addButton(page).click();
  for (const [title, name] of [["Pussel", "Moster Lisa"], ["Lego", "Farmor"]]) {
    await field(page, "Namn").fill(title);
    await dialog(page).getByRole("button", { name: "Nästa" }).click();
    await field(page, "Ditt namn").fill(name);
    await dialog(page).getByRole("button", { name: "Lägg till" }).click();
    await expect(dialog(page)).toHaveCount(0);
    if (title === "Pussel") await addButton(page).click();
  }
  await expect(row(page, "Lego")).toContainText("Tillagd av Farmor");
  await expect(row(page, "Pussel")).toContainText("Tillagd av Moster Lisa");

  // R5: dialogen frågar om presenten, säger vem som lade till den och har bara "Avbryt" (fokus) och "Ta bort", som ryms på 320 px
  await undo(page, "Pussel").click();
  const ask = page.getByRole("alertdialog");
  await expect(ask).toHaveAccessibleName("Ta bort presenten");
  await expect(ask).toContainText("Pussel är tillagd av Moster Lisa.");
  await expect(ask.getByRole("button")).toHaveCount(2);
  await expect(ask.getByRole("button", { name: "Avbryt" })).toBeFocused();
  for (const name of ["Avbryt", "Ta bort"]) {
    const box = await settledBox(ask.getByRole("button", { name }));
    expect(box.x + box.width).toBeLessThanOrEqual(320);
  }
  await expectNoA11yViolations(page);
  await ask.getByRole("button", { name: "Avbryt" }).click();
  await expect(ask).toHaveCount(0);
  expect(await giftOf("Pussel")).toBeDefined();

  // Ta bort presenten: raden raderas
  await undo(page, "Lego").click();
  await ask.getByRole("button", { name: "Ta bort", exact: true }).click();
  await expect(ask).toHaveCount(0);
  await expect(row(page, "Lego")).toHaveCount(0);
  expect(await giftOf("Lego")).toBeUndefined();

  // R7: utan sajtkaka sparas ingenting, och fönstret säger det (sist: kakorna tas bort)
  await addButton(page).click();
  await field(page, "Namn").fill("Kamera");
  await dialog(page).getByRole("button", { name: "Nästa" }).click();
  await field(page, "Ditt namn").fill("Moster Lisa");
  await page.context().clearCookies();
  await dialog(page).getByRole("button", { name: "Lägg till" }).click();
  await expect(dialog(page).getByText("Något gick fel. Försök igen.")).toBeVisible();
  expect(await giftOf("Kamera")).toBeUndefined();
});

test("MUPP-077-R1 R4 the button is on a card in the month after the occasion, and the gift lands in that list", async ({ page }) => {
  test.skip(dateIn(0).endsWith("-12-25"), "Christmas Eve is the card one step back on 25 December");
  await openList(page, async (vera) => addWish(vera, "birthday", "Cykel", { addedAt: dateIn(-15) }), -1);
  await expect(card(page).getByRole("heading", { level: 2 })).toHaveText(birthdateIn(-1).date);
  await addButton(page).click();
  await field(page, "Namn").fill("Pussel");
  await dialog(page).getByRole("button", { name: "Nästa" }).click();
  await field(page, "Ditt namn").fill("Moster Lisa");
  await dialog(page).getByRole("button", { name: "Lägg till" }).click();
  await expect(row(page, "Pussel")).toContainText("Tillagd av Moster Lisa");
});

test("MUPP-077-R6 the admin page and the archive show who added a gift, and the warning names them", async ({ page }) => {
  const name = uniqueName("Förälder");
  const vera = await addChild(await addParent(name), "Vera", birthdateIn(-40).birthdate);
  await addWish(vera, "birthday", "Gammal present", { addedAt: dateIn(-50), claimedBy: "Farmor", addedBy: "Farmor" });
  await addWish(vera, "birthday", "Pussel", { claimedBy: "Moster Lisa", addedBy: "Moster Lisa" });
  await adminSignIn(page, name);
  await goto(page, `/admin/barn/${vera}/onskelistor`);

  const list = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Födelsedag" }) });
  await expect(list).toContainText("Tillagd av Moster Lisa");
  await list.getByRole("button", { name: /^Ta bort/ }).click();
  await expect(page.getByRole("alertdialog")).toContainText("Pussel är tillagd av Moster Lisa. Hen kan redan ha köpt den.");
  await expectNoA11yViolations(page);
  await page.keyboard.press("Escape");

  const archive = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Arkiv" }) });
  await archive.getByRole("button", { name: /^Visa/ }).click();
  await expect(archive).toContainText("Tillagd av Farmor");
  expect(await claimedByOf("Gammal present")).toBe("Farmor");
});
