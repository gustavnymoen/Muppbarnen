import { defineConfig } from "@playwright/test";
import { siteSessionFile } from "./tests/site-session";

// The tests run against the live site by default.
// BASE_URL points them elsewhere: npm run test:local starts a production build
// on port 3100 with its own fresh test database (scripts/test-server.mjs).
const baseURL = process.env.BASE_URL ?? "https://muppbarnen.vercel.app";
const local = baseURL.startsWith("http://localhost");

// Preview deployments on Vercel ask for a Vercel sign-in. Preview tests send
// this secret, which lets automated tests past it.
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

try {
  process.loadEnvFile(".env.local");
} catch {}

// Sajten ligger bakom sajtlösenordet. Mot den lokala testservern används påhittade
// värden, som skriver över alla riktiga; mot en driftsatt sajt anger du lösenordet
// själv i SITE_PASSWORD. Utan det hinner testerna bara se lösenordssidan (rökproven).
if (local) {
  process.env.SITE_PASSWORD = "påhittat-testlösenord";
  process.env.SITE_SESSION_SECRET = "påhittad-testnyckel-som-inte-skyddar-något-alls";
  // Samma för admin (MUPP-003): adminsidorna testas bara mot den lokala testservern
  process.env.ADMIN_PASSWORD = "påhittat-adminlösenord";
  process.env.ADMIN_SESSION_SECRET = "påhittad-adminnyckel-som-inte-skyddar-något-alls";
}
const siteSignIn = process.env.SITE_PASSWORD ? siteSessionFile : undefined;

export default defineConfig({
  testDir: "./tests",
  // On GitHub, also an HTML report that is saved when tests fail
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  // A forgotten test.only must not make the pipeline skip the other tests
  forbidOnly: !!process.env.CI,
  // Loggar in med sajtlösenordet en gång; testerna återanvänder kakan (storageState)
  globalSetup: "./tests/global-setup.ts",
  // One test at a time: the tests share one database, and some check totals
  workers: 1,
  // The live site answers slower than a local server (network, Turso)
  expect: { timeout: local ? 5_000 : 10_000 },
  use: {
    baseURL,
    browserName: "chromium",
    locale: "sv-SE",
    storageState: siteSignIn,
    // Sent with every request, so no bypass cookie is needed
    extraHTTPHeaders: bypassSecret ? { "x-vercel-protection-bypass": bypassSecret } : undefined,
    // Screenshot of failing tests, for the report. A trace only locally: it
    // saves every request's headers and typed values, and so the bypass secret,
    // which the runs against a deployed site use.
    screenshot: "only-on-failure",
    trace: local ? "retain-on-failure" : "off",
  },
  webServer: local
    ? { command: "node scripts/test-server.mjs", url: baseURL, reuseExistingServer: false, timeout: 300_000 }
    : undefined,
});
