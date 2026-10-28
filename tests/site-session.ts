import type { Browser } from "@playwright/test";

// Var inloggningen med sajtlösenordet sparas (av tests/global-setup.ts), så att
// testerna slipper logga in en gång var. Mappen ignoreras av Git.
export const siteSessionFile = "playwright/.auth/site.json";

// Ett eget "IP-nummer" per test, så att spärren efter fel lösenord och gränsen för
// skrivande anrop inte delas mellan testerna. Sajten läser det ur x-real-ip.
// Varje testfil läser in modulen på nytt och spärrarna ligger kvar i testdatabasen
// under hela körningen, så räknaren börjar på ett slumptal, annars skulle två filer
// få samma adresser.
let nextIp = Math.floor(Math.random() * 60_000);
export const testIp = () => `10.${Math.floor(nextIp / 62_500)}.${Math.floor(nextIp / 250) % 250}.${(nextIp++ % 250) + 1}`;

// En besökare utan inloggning och med ett eget "IP-nummer", för tester av lösenordssidan
export const newVisitor = (browser: Browser, baseURL: string | undefined, viewport?: { width: number; height: number }) =>
  browser.newContext({ baseURL, viewport, extraHTTPHeaders: { "x-real-ip": testIp() } });
