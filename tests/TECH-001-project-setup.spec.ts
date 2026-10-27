import { expect, test } from "@playwright/test";
import { expectNoA11yViolations } from "./helpers";

test("TECH-001-R4 the start page has its heading, language and title, and no a11y violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Muppbarnens önskelistor", level: 1 })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "sv");
  await expect(page).toHaveTitle("Muppbarnens önskelistor");
  await expectNoA11yViolations(page);
});

test("TECH-001-R1 every response has the security headers", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["content-security-policy"]).toBe("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});
