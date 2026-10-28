import { chromium, type FullConfig } from "@playwright/test";
import { siteSessionFile } from "./site-session";

// Runs once after all tests. Tests delete what they create, but a test that
// fails halfway leaves its data behind. This removes everything named "E2E …"
// through the admin page, so the live site stays clean.
// Adapt the sign-in, the page's ready signal and the delete patterns to the
// project's admin page; the patterns go in the order things depend on each other.
export default async function globalTeardown(config: FullConfig) {
  const { baseURL, extraHTTPHeaders } = config.projects[0].use;
  if (!process.env.ADMIN_PASSWORD || !baseURL) return;

  const browser = await chromium.launch();
  try {
    // Förbi sajtlösenordet med inloggningen från tests/global-setup.ts
    const storageState = process.env.SITE_PASSWORD ? siteSessionFile : undefined;
    const page = await browser.newPage({ baseURL, extraHTTPHeaders, storageState });
    const login = await page.goto("/admin/login");
    // Admin-sidan kommer med MUPP-003; tills dess finns inget att städa
    if (login?.status() === 404) return;
    await page.getByLabel("Lösenord").fill(process.env.ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Logga in" }).click();
    await page.waitForURL(/\/admin$/);
    await page.getByRole("heading", { name: "Admin", exact: true }).waitFor();

    for (const pattern of [/^Ta bort E2E/]) {
      const buttons = page.getByRole("button", { name: pattern });
      while ((await buttons.count()) > 0) {
        const label = (await buttons.first().getAttribute("aria-label"))!;
        await buttons.first().click();
        const dialog = page.getByRole("alertdialog");
        await dialog.getByRole("button", { name: "Ja" }).click();
        await page.getByRole("button", { name: label, exact: true }).waitFor({ state: "detached" });
        console.log(`Removed leftover test data: ${label}`);
      }
    }
  } finally {
    await browser.close();
  }
}
