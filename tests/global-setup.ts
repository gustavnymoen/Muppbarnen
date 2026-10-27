import { chromium, type FullConfig } from "@playwright/test";
import { siteSessionFile, testIp } from "./site-session";

// Körs en gång före alla tester: loggar in med sajtlösenordet och sparar kakan.
// Utan SITE_PASSWORD (rökproven mot förhandsversionen och produktionen) görs inget.
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
    await context.storageState({ path: siteSessionFile });
  } finally {
    await browser.close();
  }
}
