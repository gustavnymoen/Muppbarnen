import type { Browser } from "@playwright/test";

// Var inloggningen med sajtlösenordet sparas (av tests/global-setup.ts), så att
// testerna slipper logga in en gång var. Mappen ignoreras av Git.
export const siteSessionFile = "playwright/.auth/site.json";

// Ett eget "IP-nummer" per test, så att försöksgränsen (5 per 15 minuter och
// adress) inte delas mellan testerna. Sajten läser det ur x-real-ip.
let nextIp = 1;
export const testIp = () => `10.0.${Math.floor(nextIp / 250)}.${(nextIp++ % 250) + 1}`;

// En besökare utan inloggning och med ett eget "IP-nummer", för tester av lösenordssidan
export const newVisitor = (browser: Browser, baseURL: string | undefined, viewport?: { width: number; height: number }) =>
  browser.newContext({ baseURL, viewport, extraHTTPHeaders: { "x-real-ip": testIp() } });
