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

test("MUPP-018-R1 MUPP-023-R3 the description field stops at 100 characters and the title field at 60, and the server refuses 101 and 61", async ({ page }) => {
  const mia = uniqueName("Mia");
  const kid = await addChild(await addParent(mia, true), uniqueName("Barn"));
  await adminSignIn(page, mia, `/admin/barn/${kid}/onskelistor`);
  const birthday = page.locator("section", { has: page.getByRole("heading", { level: 2, name: "Födelsedag", exact: true }) });
  await birthday.getByRole("button", { name: "Ny önskning" }).click();

  // MUPP-023-R3: the title field stops at 60 characters, and the server refuses 61 (the browser's own limit is taken away to reach it)
  const title = birthday.getByLabel("Namn");
  await title.pressSequentially("a".repeat(80));
  await expect(title).toHaveValue("a".repeat(60));
  await title.evaluate((el) => el.removeAttribute("maxlength"));
  await title.fill("a".repeat(61));
  await birthday.getByRole("button", { name: "Lägg till" }).click();
  await expect(birthday.getByRole("alert").filter({ hasText: "Högst 60 tecken." })).toBeVisible();
  await expect(title).toHaveAttribute("aria-invalid", "true");
  await title.fill("a".repeat(60));

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
  await expect(page.getByRole("heading", { level: 3, name: "a".repeat(60) })).toBeVisible();
});
