import { expect, test } from "@playwright/test";
import { adminSignIn, expectNoA11yViolations, runsLocally, uniqueName } from "./helpers";
import { addChild, addParent, clearFamily } from "./family-db";
import { testIp } from "./site-session";

test.skip(!runsLocally, "the admin tests need the local test server (its own database, passwords and picture folder)");

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
});
test.afterEach(clearFamily);

test("MUPP-018-R1 the description field stops at 100 characters, and the server refuses 101", async ({ page }) => {
  const mia = uniqueName("Mia");
  const kid = await addChild(await addParent(mia, true), uniqueName("Barn"));
  await adminSignIn(page, mia);
  await page.goto(`/admin/barn/${kid}/onskelistor`);
  const birthday = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Födelsedag", exact: true }) });
  await birthday.getByRole("button", { name: "Ny önskning" }).click();
  await birthday.getByLabel("Namn").fill("Pussel");

  // The field stops at 100 characters
  const description = birthday.getByLabel("Beskrivning");
  await description.pressSequentially("a".repeat(120));
  await expect(description).toHaveValue("a".repeat(100));

  // The browser's own limit is taken away to reach the server's
  await description.evaluate((el) => el.removeAttribute("maxlength"));
  await description.fill("a".repeat(101));
  await birthday.getByRole("button", { name: "Lägg till" }).click();
  await expect(birthday.getByRole("alert").filter({ hasText: "Högst 100 tecken." })).toBeVisible();
  await expect(description).toHaveAttribute("aria-invalid", "true");
  await expectNoA11yViolations(page);

  await description.fill("a".repeat(100));
  await birthday.getByRole("button", { name: "Lägg till" }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Pussel" })).toBeVisible();
});
