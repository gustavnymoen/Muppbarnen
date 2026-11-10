import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations, goto, runsLocally } from "./helpers";
import { addSantaEvent, addSantaMember, clearSanta } from "./family-db";
import { testIp } from "./site-session";
import { openSignInForm, pickName, SANTA_COOKIE, santaSignIn, sendPhone } from "./santa";

// The tests make their data straight in the local test database (never the user's own) and remove it again
test.skip(!runsLocally, "the Secret Santa tests need the local test server (its own database and passwords)");

// Made-up details, never real ones
const PHONE = "0700001111";
const EMAIL = "Hemlig.Testperson@exempel.invalid";

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearSanta();
});
test.afterEach(clearSanta);

// Not the route announcer: with a page title that changes it now holds text too (MUPP-046)
const message = (page: Page) => page.getByRole("alert").filter({ hasText: /\S/ }).and(page.locator("#santa-fel"));
const santaCookie = async (page: Page) => (await page.context().cookies()).find((c) => c.name === SANTA_COOKIE);

async function oneFamily() {
  const family = await addSantaEvent("Familjen Test");
  await addSantaMember(family, "Anna Testsson", PHONE, EMAIL);
  await addSantaMember(family, "Bertil Testsson", "0700002222", "bertil@exempel.invalid");
  return family;
}

test("MUPP-039-R1 R2 R3 the menu opens the entrance; one family shows its names directly, several are choices; no phone or email is in the page", async ({ page }) => {
  const family = await oneFamily();
  // R1: the menu entry opens the entrance
  await goto(page, "/");
  await page.getByRole("button", { name: "Meny" }).click();
  await page.getByRole("link", { name: "Secret Santa" }).click();
  await expect(page).toHaveURL(/\/secret-santa$/);
  await expect(page.getByRole("heading", { level: 1, name: "Secret Santa" })).toBeVisible();

  // R2: one family goes straight to its members
  await expect(page.getByRole("link", { name: "Anna Testsson" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Tillbaka" })).toHaveAttribute("href", "/");

  // R3: names only, in the page and in the next step
  await expectNoA11yViolations(page);
  const annaLink = await page.getByRole("link", { name: "Anna Testsson" }).getAttribute("href");
  for (const path of ["/secret-santa", annaLink!]) {
    const html = await page.context().request.get(path).then((r) => r.text());
    for (const secret of [PHONE, EMAIL, EMAIL.toLowerCase(), "0700002222", "bertil@"]) expect(html, path).not.toContain(secret);
  }

  // R2: several families are choices
  const other = await addSantaEvent("Familjen Annan");
  await addSantaMember(other, "Cecilia Annan", "0700003333", "cecilia@exempel.invalid");
  await goto(page, "/secret-santa");
  await expect(page.getByRole("link", { name: "Anna Testsson" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Familjen Annan" })).toBeVisible();
  await expectNoA11yViolations(page);
  await page.getByRole("link", { name: "Familjen Test" }).click();
  await expect(page).toHaveURL(new RegExp(`grupp=${family}$`));
  await expect(page.getByRole("link", { name: "Bertil Testsson" })).toBeVisible();
  // MUPP-048-R8: the back button goes back to the events, and "Byt familj" is gone
  await expect(page.getByRole("link", { name: "Byt familj" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Byt grupp" })).toHaveCount(0);
  await page.getByRole("link", { name: "Tillbaka" }).click();
  await expect(page.getByRole("link", { name: "Familjen Annan" })).toBeVisible();
});

test("MUPP-047-R1 R2 R3 the sign-in step has Tillbaka and no 'Det är inte jag', the new welcome line and 'Fortsätt'; Tillbaka and Esc return to the names with nothing typed", async ({ page }) => {
  await oneFamily();
  await openSignInForm(page, "Anna Testsson");

  // R1: Tillbaka is there, the text button is not
  const back = page.getByRole("link", { name: "Tillbaka" });
  await expect(back).toBeVisible();
  await expect(page.getByText("Det är inte jag")).toHaveCount(0);
  // R2: the welcome line, exactly, and the old one is gone
  await expect(page.getByRole("main").getByRole("paragraph").first()).toHaveText("Hej Anna Testsson, ange ditt telefonnummer eller e-post för att komma vidare");
  await expect(page.getByText("Skriv det du sparat hos oss")).toHaveCount(0);
  // R3: Fortsätt, and nothing named Logga in
  await expect(page.getByRole("button", { name: "Fortsätt" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Logga in" })).toHaveCount(0);
  await expectNoA11yViolations(page);

  // R1: keyboard focus, then Tillbaka shows the names again with nobody picked and the typed value gone
  await back.focus();
  await expect(back).toBeFocused();
  await page.getByLabel("Ditt telefonnummer").fill("0700");
  await back.click();
  await expect(page.getByRole("link", { name: "Bertil Testsson", exact: true })).toBeVisible();
  await expect(page.getByLabel("Ditt telefonnummer")).toHaveCount(0);
  // The names step has its own Tillbaka since MUPP-048-R8 (to the start page, there is one group)
  await expect(page.getByRole("link", { name: "Tillbaka" })).toHaveAttribute("href", "/");
  await page.getByRole("link", { name: "Anna Testsson", exact: true }).click();
  await expect(page.getByLabel("Ditt telefonnummer")).toHaveValue("");

  // R1: Esc in an open menu only closes the menu
  await page.getByRole("button", { name: "Meny" }).click();
  await expect(page.getByRole("navigation", { name: "Huvudmeny" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Huvudmeny" })).toHaveCount(0);
  await expect(page.getByLabel("Ditt telefonnummer")).toBeVisible();

  // R1: Esc does the same as Tillbaka
  await page.getByLabel("Ditt telefonnummer").fill("0700");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("link", { name: "Bertil Testsson", exact: true })).toBeVisible();
});

test("MUPP-039-R4 R4b the form opens with the phone field in focus; email switches the field; wrong values say only 'Det stämde inte'", async ({ page }) => {
  await oneFamily();
  await openSignInForm(page, "Anna Testsson");

  const phone = page.getByLabel("Ditt telefonnummer");
  await expect(page.getByRole("radio", { name: "Telefon" })).toBeChecked();
  await expect(phone).toHaveAttribute("type", "tel");
  await expect(phone).toHaveAttribute("inputmode", "tel");
  await expect(phone).toBeFocused();
  await expectNoA11yViolations(page);

  await page.getByRole("radio", { name: "E-post" }).check();
  const email = page.getByLabel("Din e-postadress");
  await expect(email).toHaveAttribute("type", "email");
  await expect(email).toHaveAttribute("inputmode", "email");
  await expect(email).toHaveValue("");
  await expect(email).toBeFocused();
  // The radio buttons work with the keyboard
  await page.getByRole("radio", { name: "E-post" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("radio", { name: "Telefon" })).toBeChecked();
  await expect(page.getByLabel("Ditt telefonnummer")).toHaveValue("");

  // A wrong phone, and Bertil's phone on Anna: the same short message, still no cookie
  for (const wrong of ["0700009999", "0700002222"]) {
    await sendPhone(page, wrong);
    await expect(message(page)).toHaveText("Det stämde inte");
    await expect(page.getByLabel("Ditt telefonnummer")).toBeFocused();
  }
  expect(await santaCookie(page)).toBeUndefined();
  await expectNoA11yViolations(page);
});

test("MUPP-039-R4 the saved phone in other writings, and the email in other letters, sign in", async ({ page }) => {
  const family = await oneFamily();
  await addSantaEvent("Familjen Annan"); // two groups, so that Tillbaka on the own page signs out (MUPP-055)
  await goto(page, `/secret-santa?grupp=${family}`);
  await pickName(page, "Anna Testsson");
  for (const typed of ["070-000 11 11", "+46700001111"]) {
    await sendPhone(page, typed);
    await expect(page.getByRole("heading", { level: 1, name: "Hej Anna Testsson!" })).toBeVisible();
    await page.getByRole("button", { name: "Tillbaka" }).click();
    await page.getByRole("link", { name: "Familjen Test" }).click();
    await pickName(page, "Anna Testsson");
  }
  await page.getByRole("radio", { name: "E-post" }).check();
  await page.getByLabel("Din e-postadress").fill(EMAIL.toUpperCase());
  await page.getByRole("button", { name: "Fortsätt" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Hej Anna Testsson!" })).toBeVisible();
});

test("MUPP-039-R5 R6 the own page is reached only with the own cookie, which is __Host-, HttpOnly, Secure, path / and holds only the id, the cleanup year and a signature; it is remembered and Tillbaka removes it", async ({ page }) => {
  await oneFamily();
  await addSantaEvent("Familjen Annan"); // two groups, so that Tillbaka on the own page signs out (MUPP-055)
  // R6: no cookie gives the entrance
  await goto(page, "/secret-santa/min-sida");
  await expect(page).toHaveURL(/\/secret-santa$/);

  await page.getByRole("link", { name: "Familjen Test" }).click();
  await pickName(page, "Anna Testsson");
  await sendPhone(page, PHONE);
  await expect(page.getByRole("heading", { level: 1, name: "Hej Anna Testsson!" })).toBeVisible();

  // R5: the cookie
  const cookie = (await santaCookie(page))!;
  expect(cookie).toMatchObject({ httpOnly: true, secure: true, path: "/", sameSite: "Lax" });
  expect(cookie.value).toMatch(/^\d+\.\d{4}\.[0-9a-f]{64}$/);
  expect(cookie.value).not.toContain(PHONE);
  expect(cookie.domain).not.toMatch(/^\./);

  // R6: the own page holds no one else's details
  const html = await page.context().request.get("/secret-santa/min-sida").then((r) => r.text());
  expect(html).not.toContain("Bertil");
  expect(html).not.toContain(PHONE);

  // R5: back at the entrance: straight to the own page
  await goto(page, "/secret-santa");
  await expect(page.getByRole("heading", { level: 1, name: "Hej Anna Testsson!" })).toBeVisible();
  await expectNoA11yViolations(page);

  // R5: Tillbaka removes the cookie
  await page.getByRole("button", { name: "Tillbaka" }).click();
  await expect(page.getByRole("link", { name: "Familjen Test" })).toBeVisible();
  expect(await santaCookie(page)).toBeUndefined();

  // R6: the same signature on another person's id is not accepted
  const [, year, signature] = cookie.value.split(".");
  const bertil = Number(cookie.value.split(".")[0]) + 1;
  await page.context().addCookies([{ ...cookie, value: `${bertil}.${year}.${signature}` }]);
  await goto(page, "/secret-santa/min-sida");
  await expect(page).toHaveURL(/\/secret-santa$/);
  await expect(page.getByRole("heading", { name: /Hej/ })).toHaveCount(0);

  // R6: a removed person's cookie is no longer worth anything
  await page.context().addCookies([cookie]);
  await clearSanta();
  await goto(page, "/secret-santa/min-sida");
  await expect(page).toHaveURL(/\/secret-santa$/);
});

test("MUPP-055-R1 R2 the own page has no 'Byt person': several groups give the arrow Tillbaka, a form post that signs out and shows the groups; one group gives the cross Stäng to the start page and keeps the sign-in", async ({ page }) => {
  const family = await oneFamily();
  const anna = await addSantaMember(family, "Anna Extra", "0700003333", "anna.extra@exempel.invalid");
  await santaSignIn(page, anna);

  // R1: one group: the cross, not the arrow, no text button
  await goto(page, "/secret-santa/min-sida");
  await expect(page.getByRole("heading", { level: 1, name: "Hej Anna Extra!" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Byt person" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Tillbaka" })).toHaveCount(0);
  await expectNoA11yViolations(page);
  const cross = page.getByRole("link", { name: "Stäng" });
  await cross.focus();
  await expect(cross).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/$/);
  expect(await santaCookie(page)).toBeDefined();
  await goto(page, "/secret-santa/min-sida");
  await expect(page.getByRole("heading", { level: 1, name: "Hej Anna Extra!" })).toBeVisible();

  // R1 R2: several groups: the arrow is a button in a form; the form post is what a request without the site session is refused on (lib/route-checks.test.ts)
  await addSantaEvent("Familjen Annan");
  await goto(page, "/secret-santa/min-sida");
  await expect(page.getByRole("link", { name: "Stäng" })).toHaveCount(0);
  const arrow = page.getByRole("button", { name: "Tillbaka" });
  await expect(arrow).toHaveAttribute("type", "submit");
  await expect(page.locator("form").filter({ has: arrow })).toHaveCount(1);
  await expectNoA11yViolations(page);
  // R1: the arrow in the page itself signs out and the own page then leads to the entrance
  await arrow.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("link", { name: "Familjen Test" })).toBeVisible();
  expect(await santaCookie(page)).toBeUndefined();
  await goto(page, "/secret-santa/min-sida");
  await expect(page).toHaveURL(/\/secret-santa$/);
});
