import { chromium, expect, type FullConfig } from "@playwright/test";
import { runsLocally } from "./helpers";
import { adminSessionFile, siteSessionFile, testIp } from "./site-session";

// Körs en gång före alla tester: loggar in med sajtlösenordet och sparar kakan, och mot
// den lokala testservern även med adminlösenordet (adminSignIn i helpers.ts). Utan SITE_PASSWORD (rökproven mot förhandsversionen och produktionen) görs inget.
export default async function globalSetup(config: FullConfig) {
  const { baseURL, extraHTTPHeaders } = config.projects[0].use;
  if (!process.env.SITE_PASSWORD || !baseURL) return;

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ baseURL, extraHTTPHeaders: { ...extraHTTPHeaders, "x-real-ip": testIp() } });
    const page = await context.newPage();
    await page.goto("/losenord");
    await page.getByLabel("Lösenord").fill(process.env.SITE_PASSWORD);
    await page.getByRole("button", { name: "Öppna" }).click();
    await page.waitForURL((url) => url.pathname === "/");
    // Rutan "Så funkar listorna" öppnas vid första besöket (MUPP-035): trycker OK så att kakan följer med i den sparade inloggningen
    await page.getByRole("button", { name: "OK" }).click();
    await expect.poll(async () => (await context.cookies()).some((c) => c.name.endsWith("onboarding"))).toBe(true);
    await context.storageState({ path: siteSessionFile });

    if (!runsLocally) return;
    await page.goto("/admin");
    await page.getByLabel("Adminlösenord").fill(process.env.ADMIN_PASSWORD ?? "");
    await page.getByRole("button", { name: "Logga in" }).click();
    await page.getByLabel("Adminlösenord").waitFor({ state: "detached" });
    await context.storageState({ path: adminSessionFile });
  } finally {
    await browser.close();
  }
}
