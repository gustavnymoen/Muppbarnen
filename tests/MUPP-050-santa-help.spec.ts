import { expect, test } from "@playwright/test";
import { expectNoA11yViolations, goto } from "./helpers";
import { newcomer } from "./site-session";

test("MUPP-050-R1 R2 R3 R7 the dialog Så funkar det has the tabs Barnens listor and Secret Santa, the Secret Santa guide has Deltagare and Admin, and each panel passes axe", async ({ page }) => {
  await goto(page, "/");
  await page.getByRole("button", { name: "Meny" }).click();
  await page.getByRole("navigation", { name: "Huvudmeny" }).getByRole("button", { name: "Så funkar det" }).click();
  const dialog = page.getByRole("dialog", { name: "Så funkar det" });
  await expect(dialog).toBeVisible();

  // R2: Barnens listor first, with the guide that was there before
  const guides = dialog.getByRole("tablist", { name: "Välj guide" });
  await expect(guides.getByRole("tab")).toHaveText(["Barnens listor", "Secret Santa"]);
  await expect(guides.getByRole("tab", { name: "Barnens listor" })).toHaveAttribute("aria-selected", "true");
  await expect(dialog.getByRole("tabpanel", { name: "Besökare" })).toContainText("Paxa en present");
  await expectNoA11yViolations(page);
  await dialog.getByRole("tab", { name: "Förälder" }).click();
  await expectNoA11yViolations(page);

  // R2: the arrow keys move between the top tabs, and a new top tab starts on its first tab
  await guides.getByRole("tab", { name: "Barnens listor" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(guides.getByRole("tab", { name: "Secret Santa" })).toBeFocused();
  await expect(guides.getByRole("tab", { name: "Secret Santa" })).toHaveAttribute("aria-selected", "true");
  await expect(guides.getByRole("tab", { name: "Barnens listor" })).toHaveAttribute("tabindex", "-1");
  await page.keyboard.press("Home");
  await expect(guides.getByRole("tab", { name: "Barnens listor" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(guides.getByRole("tab", { name: "Secret Santa" })).toHaveAttribute("aria-selected", "true");

  // R3: the participant text and the administrator text
  const kinds = dialog.getByRole("tablist", { name: "Läs som" });
  await expect(kinds.getByRole("tab")).toHaveText(["Deltagare", "Admin"]);
  await expect(kinds.getByRole("tab", { name: "Deltagare" })).toHaveAttribute("aria-selected", "true");
  const participant = dialog.getByRole("tabpanel", { name: "Deltagare" });
  await expect(participant.getByRole("listitem")).toHaveCount(6);
  await expect(participant).toContainText("tomten@kusinportalen.com");
  await expectNoA11yViolations(page);
  await kinds.getByRole("tab", { name: "Admin" }).click();
  const admin = dialog.getByRole("tabpanel", { name: "Admin" });
  await expect(admin.getByRole("listitem")).toHaveCount(7);
  await expect(admin).toContainText("En månad efter julafton rensas eventet");
  await expectNoA11yViolations(page);

  // R7: Esc closes it and the focus is back on the menu button, also after switching tabs
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Meny" })).toBeFocused();
});

test("MUPP-050-R5 the menu opens the dialog on Secret Santa on a Secret Santa page and on Barnens listor elsewhere, and every opening starts fresh", async ({ page }) => {
  const dialog = page.getByRole("dialog", { name: "Så funkar det" });
  const open = async () => {
    await page.getByRole("button", { name: "Meny" }).click();
    await page.getByRole("navigation", { name: "Huvudmeny" }).getByRole("button", { name: "Så funkar det" }).click();
    await expect(dialog).toBeVisible();
  };
  await goto(page, "/secret-santa");
  await open();
  await expect(dialog.getByRole("tab", { name: "Secret Santa" })).toHaveAttribute("aria-selected", "true");
  await expect(dialog.getByRole("tab", { name: "Deltagare" })).toHaveAttribute("aria-selected", "true");
  await dialog.getByRole("tab", { name: "Admin" }).click();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await open();
  await expect(dialog.getByRole("tab", { name: "Deltagare" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Escape");

  await goto(page, "/");
  await open();
  await expect(dialog.getByRole("tab", { name: "Barnens listor" })).toHaveAttribute("aria-selected", "true");
  await expect(dialog.getByRole("tab", { name: "Besökare" })).toHaveAttribute("aria-selected", "true");
});

test("MUPP-050-R5 R6 the first visit opens Barnens listor, and closing it on Secret Santa sets the cookie so it stays closed", async ({ browser, baseURL }) => {
  const context = await newcomer(browser, baseURL);
  const page = await context.newPage();
  await goto(page, "/");
  const dialog = page.getByRole("dialog", { name: "Så funkar det" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("tab", { name: "Barnens listor" })).toHaveAttribute("aria-selected", "true");
  await dialog.getByRole("tab", { name: "Secret Santa" }).click();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect.poll(async () => (await context.cookies()).some((c) => c.name.endsWith("onboarding"))).toBe(true);
  expect((await context.cookies()).find((c) => c.name.endsWith("onboarding"))).toMatchObject({ name: "__Host-onboarding", httpOnly: true, secure: true, path: "/", value: "1" });
  await goto(page, "/");
  await expect(dialog).toBeHidden();
  await context.close();
});
