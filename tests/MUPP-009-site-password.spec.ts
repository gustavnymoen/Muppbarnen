import { expect, test, type Page } from "@playwright/test";
import { createSession } from "../lib/site-session";
import { expectNoA11yViolations, runsLocally } from "./helpers";
import { newVisitor, testIp } from "./site-session";

// Alla tester här börjar utan inloggning (de andra testerna återanvänder en inloggning)
test.use({ storageState: { cookies: [], origins: [] } });

const password = process.env.SITE_PASSWORD ?? "";
const hasHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
// Försöksgränsen räknas per adress: ett eget "IP-nummer" per test (sajten läser x-real-ip)
const ownIp = () => ({ "x-real-ip": testIp() });

test.skip(!password, "SITE_PASSWORD is not set");

async function signInWith(page: Page, text: string) {
  await page.getByLabel("Lösenord").fill(text);
  await page.getByRole("button", { name: "Öppna" }).click();
}

test("MUPP-009-R3 without the cookie a page is sent to the password page, and an API route, an action and a picture get 401", async ({ playwright, baseURL }) => {
  const request = await playwright.request.newContext({ baseURL, extraHTTPHeaders: ownIp() });

  // Sidor, också /design och sidor som inte finns: skickas vidare, utan innehåll
  for (const [path, till] of [["/", "/"], ["/design", "/design"], ["/finns-inte", "/finns-inte"], ["/design?x=1", "/design?x=1"]]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(307);
    expect(new URL(response.headers().location, baseURL).pathname + new URL(response.headers().location, baseURL).search, path).toBe(
      `/losenord?till=${encodeURIComponent(till)}`,
    );
    // Next.js skriver själv redirect-adressen som text i svaret; inget annat får finnas där
    expect(["", response.headers().location ], path).toContain(await response.text());
  }

  // API-rutter, bilder och serveråtgärder: 401 utan innehåll
  for (const response of [
    await request.get("/api/barn", { maxRedirects: 0 }),
    await request.post("/api/barn", { maxRedirects: 0, data: "{}" }),
    await request.get("/bilder/alma.jpg", { maxRedirects: 0 }),
    await request.post("/", { maxRedirects: 0, headers: { "next-action": "abc" }, data: "[]" }),
  ]) {
    expect(response.status(), response.url()).toBe(401);
    expect(await response.text()).toBe("");
  }
  await request.dispose();
});

test("MUPP-009-R1 R2 R5 the password page, a wrong and the right password, the cookie and where you land", async ({ browser, baseURL }) => {
  const context = await newVisitor(browser, baseURL, { width: 320, height: 568 });
  const page = await context.newPage();
  const requests: string[] = [];
  page.on("response", (response) => requests.push(`${new URL(response.url()).pathname} ${response.status()}`));

  // R1: ett försök att nå /design leder hit, och sidan har namnet, fältet och knappen, inget annat
  await page.goto("/design");
  await expect(page).toHaveURL(/\/losenord\?till=%2Fdesign$/);
  await expect(page.getByRole("heading", { level: 1, name: "Muppbarnens önskelistor" })).toBeVisible();
  const field = page.getByLabel("Lösenord");
  await expect(field).toHaveAttribute("type", "password");
  await expect(field).toHaveAttribute("autocomplete", "current-password");
  await expect(page.getByRole("button", { name: "Öppna" })).toBeVisible();
  await expect(page.getByRole("link")).toHaveCount(0);
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(page.locator("#losenord-fel")).toHaveText("");
  // R3: bara sidan själv, och dess stilar, skript och typsnitt, har hämtats
  expect(requests.filter((r) => !r.includes(" 200") && !r.startsWith("/design 307"))).toEqual([]);
  // R1: fungerar från 320 px, och inga axe-fel
  expect(await hasHorizontalScroll(page)).toBe(false);
  await expectNoA11yViolations(page);

  // R1 R5: ett fel lösenord ger "Fel lösenord." som text vid fältet, efter ungefär en sekund
  const started = Date.now();
  await signInWith(page, "fel lösenord");
  const error = page.locator("#losenord-fel");
  await expect(error).toHaveText("Fel lösenord.");
  expect(Date.now() - started).toBeGreaterThanOrEqual(900);
  await expect(field).toHaveAccessibleDescription("Fel lösenord.");
  await expect(page.getByLabel("Lösenord")).toBeVisible();
  expect(await hasHorizontalScroll(page)).toBe(false);
  await expectNoA11yViolations(page);
  expect(await context.cookies()).toEqual([]);

  // R1 R2: rätt lösenord ger kakan och leder till sidan man bad om
  await signInWith(page, password);
  await expect(page).toHaveURL(/\/design$/);
  await expect(page.getByRole("heading", { level: 1, name: "Stilguide" })).toBeVisible();
  const cookies = await context.cookies();
  expect(cookies).toHaveLength(1);
  const [cookie] = cookies;
  expect(cookie).toMatchObject({ name: "__Host-site_session", httpOnly: true, sameSite: "Lax", secure: true });
  expect(cookie.value).toMatch(/^\d+\.[0-9a-f]{64}$/);
  expect(cookie.value).not.toContain(password);
  const days = (cookie.expires - Date.now() / 1000) / 86400;
  expect(days).toBeGreaterThan(179);
  expect(days).toBeLessThanOrEqual(180);
  // R2: kakan syns inte för skript på sidan
  expect(await page.evaluate(() => document.cookie)).toBe("");
  await context.close();
});

test("MUPP-009-R1 only an address on this site is accepted as the target", async ({ browser, baseURL }) => {
  const context = await newVisitor(browser, baseURL);
  const page = await context.newPage();
  await page.goto("/losenord?till=https%3A%2F%2Fevil.example%2Fstart");
  await signInWith(page, password);
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await expect(page.getByRole("heading", { level: 1, name: "Muppbarnens önskelistor" })).toBeVisible();
  await context.close();
});

test("MUPP-009-R2 a changed or foreign cookie is rejected, one signed with the secret is accepted", async ({ browser, baseURL }) => {
  test.skip(!runsLocally, "needs the test server's secret");
  const context = await newVisitor(browser, baseURL);
  const page = await context.newPage();
  const set = (value: string) => context.addCookies([{ name: "__Host-site_session", value, domain: new URL(baseURL!).hostname, path: "/", secure: true }]);
  const signed = createSession(process.env.SITE_SESSION_SECRET!);

  for (const value of [createSession("en annan nyckel"), signed.replace(/.$/, signed.endsWith("0") ? "1" : "0"), "bara-skräp"]) {
    await set(value);
    await page.goto("/design");
    await expect(page).toHaveURL(/\/losenord/);
  }

  await set(signed);
  await page.goto("/design");
  await expect(page).toHaveURL(/\/design$/);
  await expect(page.getByRole("heading", { level: 1, name: "Stilguide" })).toBeVisible();
  await context.close();
});
