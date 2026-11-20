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

// first and last words of each section: together they show that the groups follow the old bullet order
const starts: Record<string, RegExp[]> = {
  Deltagare: [
    /^Hitta din Secret Santa[\s\S]*eventuell länk\.$/,
    /^När den startas lottas du[\s\S]*hens önskelista\.$/,
    /^Du får mejl från tomten[\s\S]*skräpposten\.$/,
  ],
  Admin: [
    /^Du som admin kan skapa[\s\S]*personerna\.$/,
    /^Du aktiverar eventet[\s\S]*när det startat\.$/,
    /^Du kan se om alla fyllt i[\s\S]*Du behöver inte göra något\.$/,
  ],
};

test("MUPP-086-R3 the Secret Santa guides are sections without list items or headings, and the dialog is as tall on every tab", async ({
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
    await expect(panel.getByRole("heading")).toHaveCount(0);
    await expect(panel.getByRole("paragraph")).toHaveCount(3);
    // every sentence of the old bullets is there, in the old order: the paragraphs start with the first bullet of their group
    await expect(panel.getByRole("paragraph")).toHaveText(starts[name]);
    await height();
    await expectNoA11yViolations(page);
  }
  expect(new Set(heights.map(Math.round)).size).toBe(1); // offsetHeight ignores the opening animation
});
