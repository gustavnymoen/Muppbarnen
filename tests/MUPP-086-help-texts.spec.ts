import { expect, test } from "@playwright/test";
import { expectNoA11yViolations, goto } from "./helpers";

async function openDialog(page: import("@playwright/test").Page) {
  await goto(page, "/");
  await page.getByRole("button", { name: "Meny" }).click();
  await page
    .getByRole("navigation", { name: "Huvudmeny" })
    .getByRole("button", { name: "Så funkar det" })
    .click();
  const dialog = page.getByRole("dialog", { name: "Så funkar det" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test("MUPP-086-R1 R2 Besökare has Välj familj first and Lägg till egna presenter after the undo part, with the approved texts", async ({
  page,
}) => {
  const dialog = await openDialog(page);
  const panel = dialog.getByRole("tabpanel", { name: "Besökare" });
  await expect(panel.getByRole("heading")).toHaveText([
    "Välj familj",
    "Önskelistor",
    "Paxa en present",
    "Ångrat dig eller klickat fel?",
    "Lägg till egna presenter",
  ]);
  await expect(panel).toContainText(
    "Välj de familjer du tillhör, så får du bara upp relevanta barn och Secret Santa-grupper. Du hittar filtret uppe i vänstra hörnet.",
  );
  await expect(panel).toContainText(
    "Du kan i barnens önskelista lägga till egna presenter om du kommer på något som inte finns i önskelistan. Du kan sedan ta bort den om du ångrat dig.",
  );
  await expect(panel).not.toContainText("tratt");
  // the intro stays above all parts
  expect(
    (await panel.getByText("Här samlar vi").boundingBox())!.y,
  ).toBeLessThan(
    (await panel.getByRole("heading", { name: "Välj familj" }).boundingBox())!
      .y,
  );
  await expectNoA11yViolations(page);
});

const parts: Record<string, [string, string][]> = {
  Deltagare: [
    ["Logga in", "Hitta din grupp och logga in med hjälp av ditt namn + telefonnummer eller e-post."],
    ["Skriv din önskelista", "Du kan fylla på din önskelista från och med att Secret Santa aktiveras till julafton. Fyll gärna i storlek, beskrivning och eventuell länk."],
    ["Lottningen", "När Secret Santa startas lottas du ihop med en person att ge present till! Du får ett mejl om detta."],
    [
      "Din och din matchnings lista",
      "När du loggat in ser du din egen och din matchnings lista. I din önskelista kan du skriva med personen som ska handla till dig. I din matchnings önskelista kan du ställa frågor och få svar om hens önskelista. Tar det tid för din matchning att fylla på sin lista kan du klicka på tjat-knappen!",
    ],
    ["Mejl från tomten", "Du får mejl från tomten@kusinportalen.com vid förändring i eventet, i din matchnings önskelista eller vid nya meddelanden. Se till att det inte hamnar i skräpposten."],
  ],
  Admin: [
    ["Skapa gruppen", "Du som admin kan skapa en Secret Santa-grupp samt lägga till och ändra personer. Vill du att par inte ska få varandra, ange då partner på personerna."],
    [
      "Aktivera och Starta",
      "När du aktiverar gruppen får deltagarna mejl och kan fylla på sina önskelistor! I denna status kan du lägga till och ta bort personer. När du startar eventet matchas personerna. Deltagare kan fortsätta redigera sina listor efter att eventet startat. Du kan välja att aktivera och starta på samma gång, men tänk på att personer inte kan läggas till eller tas bort efter att eventet startat.",
    ],
    ["Följ upp", "Du kan se om alla fyllt i minst en sak i sin lista, så du vet vem du ska tjata på (men aldrig VAD de fyllt i)."],
    [
      "Stoppa och rensa",
      "Du kan stoppa och avaktivera Secret Santa om du missat något. Matchningar görs dock om vid ny start. En månad efter julafton rensas chattar och önskelistor och gruppen avaktiveras, men personerna är kvar tills nästa år. Du behöver inte göra något.",
    ],
  ],
};

test("MUPP-087-R1 R2 R3 the Secret Santa guides are parts with the approved headings and texts and no list items, and the dialog is as tall on every tab", async ({
  page,
}) => {
  const dialog = await openDialog(page);
  const heights: number[] = [];
  const height = async () =>
    heights.push(
      await dialog.evaluate((el) => (el as HTMLElement).offsetHeight),
    );
  await height();
  await dialog.getByRole("tab", { name: "Secret Santa" }).click();
  for (const name of ["Deltagare", "Admin"]) {
    await dialog.getByRole("tab", { name, exact: true }).click();
    const panel = dialog.getByRole("tabpanel", { name });
    await expect(panel.getByRole("listitem")).toHaveCount(0);
    await expect(panel.getByRole("heading")).toHaveText(parts[name].map(([title]) => title));
    await expect(panel.getByRole("paragraph")).toHaveText(parts[name].map(([, text]) => text));
    await height();
    await expectNoA11yViolations(page);
  }
  expect(new Set(heights.map(Math.round)).size).toBe(1); // offsetHeight ignores the opening animation
});
