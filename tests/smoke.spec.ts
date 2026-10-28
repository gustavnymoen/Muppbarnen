import { expect, test } from "@playwright/test";

// Rökproven kör utan inloggning och utan lösenord: de ser bara lösenordssidan
test.use({ storageState: { cookies: [], origins: [] } });

// Rökproven läser bara. De körs mot förhandsversionen och produktionen
// efter varje deploy; varje funktion lägger till sina egna här.

test("MUPP-009-R6 @smoke the site answers with the password page and none of its content", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/losenord\?till=%2F$/);
  await expect(page.getByRole("heading", { name: "Muppbarnens önskelistor", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Lösenord")).toBeVisible();
  await expect(page.getByRole("button", { name: "Öppna" })).toBeVisible();
  // Inget annat från sajten: varken kort, meny eller länkar
  await expect(page.getByRole("article")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Meny" })).toHaveCount(0);
  await expect(page.getByRole("link")).toHaveCount(0);
});
