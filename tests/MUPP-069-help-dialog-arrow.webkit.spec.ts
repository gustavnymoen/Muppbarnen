import { devices, expect, test } from "@playwright/test";
import { goto, runsLocally, settledBox } from "./helpers";

// Körs bara med `npm run test:webkit` (WebKit är inte installerat i CI). Safari på iPhone ritade pilen över flikknapparna i
// rutan "Så funkar det": Chromium räknar ut höjden på en flex-ruta med max-höjd på ett sätt, Safari på ett annat.
test.skip(!runsLocally, "needs the local test server");
test.use({ ...devices["iPhone 13"], browserName: "webkit" });

test("MUPP-069-R1 R2 on an iPhone the arrow of the dialog Så funkar det is under the panel, not over the tabs", async ({ page }) => {
  await goto(page, "/");
  await page.getByRole("button", { name: "Meny" }).tap();
  await page.getByRole("button", { name: "Så funkar det" }).tap();
  const dialog = page.getByRole("dialog", { name: "Så funkar det" });
  await expect(dialog).toBeVisible();
  const tabs = await settledBox(dialog.getByRole("tab", { name: "Besökare" }));
  const panel = await settledBox(dialog.locator("div.overflow-y-auto"));
  const arrow = await settledBox(dialog.getByRole("button", { name: "Läs vidare" }));
  const box = await settledBox(dialog);
  // The panel starts under the tabs, the arrow under the panel, and all of it is inside the dialog
  expect(panel.height).toBeGreaterThan(44);
  expect(panel.y).toBeGreaterThanOrEqual(tabs.y + tabs.height);
  expect(arrow.y).toBeGreaterThanOrEqual(panel.y + panel.height);
  expect(arrow.y + arrow.height).toBeLessThanOrEqual(box.y + box.height);
});
