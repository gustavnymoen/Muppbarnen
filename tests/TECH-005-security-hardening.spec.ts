import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations, runsLocally } from "./helpers";
import { newVisitor } from "./site-session";

// Alla tester här börjar utan inloggning
test.use({ storageState: { cookies: [], origins: [] } });

const password = process.env.SITE_PASSWORD ?? "";
test.skip(!password, "SITE_PASSWORD is not set");

async function signInWith(page: Page, text: string) {
  await page.getByLabel("Lösenord").fill(text);
  await page.getByRole("button", { name: "Öppna" }).click();
}

test("TECH-005-R3 the sixth wrong password blocks the address, and then even the right one is refused", async ({ browser, baseURL }) => {
  test.skip(!runsLocally, "would lock this computer out of a deployed site, and x-real-ip is set by the platform there");
  const context = await newVisitor(browser, baseURL);
  // Sex fel samtidigt, så att väntan på en sekund per fel bara tas en gång. Alla sex får
  // pröva, men det sjätte felet spärrar adressen. Att rätta lösenord inte räknas är ett enhetstest.
  const pages = await Promise.all(Array.from({ length: 6 }, () => context.newPage()));
  for (const page of pages) await page.goto("/losenord");
  for (const page of pages) await signInWith(page, "fel lösenord");
  for (const page of pages) await expect(page.locator("#losenord-fel")).toHaveText("Fel lösenord.");

  // Därefter nekas allt, också rätt lösenord, och besökaren ser fortfarande lösenordssidan
  const page = pages[0];
  await page.goto("/losenord");
  await signInWith(page, password);
  await expect(page.locator("#losenord-fel")).toHaveText("För många försök. Försök igen om en stund.");
  await expect(page).toHaveURL(/\/losenord/);
  await expect(page.getByLabel("Lösenord")).toBeVisible();
  await expectNoA11yViolations(page);
  expect(await context.cookies()).toEqual([]);
  await context.close();
});

test("TECH-005-R4 the Content-Security-Policy limits everything to the site itself and the pages still work", async ({ browser, baseURL }) => {
  const context = await newVisitor(browser, baseURL);
  const page = await context.newPage();
  const violations: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("Content Security Policy")) violations.push(message.text());
  });

  const response = await page.goto("/losenord");
  const csp = response!.headers()["content-security-policy"];
  const directive = (name: string) => csp.split("; ").find((d) => d.startsWith(`${name} `));
  for (const name of ["default-src", "script-src", "style-src", "img-src", "font-src", "connect-src"]) {
    expect(directive(name), name).toMatch(/^[a-z-]+ 'self'( 'unsafe-inline')?( blob: data:)?$/);
  }
  expect(directive("object-src")).toBe("object-src 'none'");
  expect(directive("base-uri")).toBe("base-uri 'self'");
  expect(directive("form-action")).toBe("form-action 'self'");
  expect(directive("frame-ancestors")).toBe("frame-ancestors 'none'");
  expect(csp).not.toMatch(/https?:|\*/);
  expect(response!.headers()["x-frame-options"]).toBe("DENY");

  // Skripten kör (formuläret skickas utan att sidan laddas om) och inget blockeras
  await signInWith(page, password);
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await expect(page.getByRole("group", { name: /Barnens kort/ })).toBeVisible();
  await page.goto("/design");
  await expect(page.getByRole("heading", { level: 1, name: "Stilguide" })).toBeVisible();
  expect(violations).toEqual([]);

  // Inget annat än den egna sajten: ett skript från en annan adress får inte köras
  const blocked = await page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const script = document.createElement("script");
        script.src = "https://example.com/x.js";
        script.onerror = () => resolve(true);
        script.onload = () => resolve(false);
        document.head.append(script);
      }),
  );
  expect(blocked).toBe(true);
  await context.close();
});

test("TECH-005-R4 the session cookie has the __Host- prefix: secure, no Domain, path /", async ({ browser, baseURL }) => {
  const context = await newVisitor(browser, baseURL);
  const page = await context.newPage();
  await page.goto("/losenord");
  await signInWith(page, password);
  await expect(page).toHaveURL((url) => url.pathname === "/");
  const cookies = await context.cookies();
  expect(cookies.map((c) => c.name)).toEqual(["__Host-site_session"]);
  expect(cookies[0]).toMatchObject({ secure: true, path: "/", httpOnly: true });
  await context.close();
});
