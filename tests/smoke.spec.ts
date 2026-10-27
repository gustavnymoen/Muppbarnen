import { expect, test } from "@playwright/test";

// Rökproven läser bara. De körs mot förhandsversionen och produktionen
// efter varje deploy; varje funktion lägger till sina egna här.

test("TECH-001-R4 @smoke the start page loads with its heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Muppbarnens önskelistor", level: 1 })).toBeVisible();
});
