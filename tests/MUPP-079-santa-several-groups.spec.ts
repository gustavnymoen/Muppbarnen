import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations, goto, runsLocally } from "./helpers";
import { addSantaEvent, addSantaMember, clearSanta, removeSantaMember, santaCleanupYear, santaWishes } from "./family-db";
import { testIp } from "./site-session";
import { createSantaSession } from "../lib/santa-session";
import { pickName, SANTA_COOKIE, santaSignIn, sendPhone, wishRow } from "./santa";

test.skip(!runsLocally, "the Secret Santa tests need the local test server (its own database and passwords)");

// Made-up details, never real ones
const PHONE = "0700001111";

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearSanta();
});
test.afterEach(clearSanta);

const cookie = async (page: Page) => (await page.context().cookies()).find((c) => c.name === SANTA_COOKIE);
const hello = (page: Page, name: string) => expect(page.getByRole("heading", { level: 1, name: `Hej ${name}!` })).toBeVisible();

// The same person (same phone) in two groups: two members, one in each (MUPP-048)
async function twoGroups() {
  const a = await addSantaEvent("Familjen A");
  const b = await addSantaEvent("Familjen B");
  const annaA = await addSantaMember(a, "Anna i A", PHONE, "anna@exempel.invalid");
  const annaB = await addSantaMember(b, "Anna i B", PHONE, "anna@exempel.invalid");
  return { a, b, annaA, annaB };
}

test("MUPP-079-R1 R2 R3 sign in to two groups with the form, go back and forth without signing in again; the cookie holds only ids, the year and signatures", async ({ page }) => {
  const { a, b } = await twoGroups();
  await goto(page, "/secret-santa");
  await page.getByRole("link", { name: "Familjen A" }).click();
  await pickName(page, "Anna i A");
  await sendPhone(page, PHONE);
  await hello(page, "Anna i A");
  await expect(page).toHaveURL(new RegExp(`min-sida\\?grupp=${a}$`));

  // R3: Tillbaka leads to the choice of group, and the choice of A goes straight to the own page
  await page.getByRole("link", { name: "Tillbaka" }).click();
  await expect(page.getByRole("link", { name: "Familjen B" })).toBeVisible();
  await expectNoA11yViolations(page);

  // R2: signing in to B adds it
  await page.getByRole("link", { name: "Familjen B" }).click();
  await pickName(page, "Anna i B");
  await sendPhone(page, PHONE);
  await hello(page, "Anna i B");
  await expect(page).toHaveURL(new RegExp(`min-sida\\?grupp=${b}$`));
  expect((await cookie(page))!.value).toMatch(/^\d+\.\d{4}\.[0-9a-f]{64}_\d+\.\d{4}\.[0-9a-f]{64}$/);

  // R3: back and forth without signing in again
  await page.getByRole("link", { name: "Tillbaka" }).click();
  await page.getByRole("link", { name: "Familjen A" }).click();
  await hello(page, "Anna i A");
  await expectNoA11yViolations(page);
  await goto(page, `/secret-santa?grupp=${b}`);
  await hello(page, "Anna i B");
  await expectNoA11yViolations(page);
});

test("MUPP-079-R3 a group in the address without a sign-in asks for the sign-in, the sub pages too, and no group gives the choice of group (with one sign-in the own page)", async ({ page }) => {
  const { a, b, annaA, annaB } = await twoGroups();
  await santaSignIn(page, annaA);
  // B is not signed in: the names of B, nothing of A's page
  await goto(page, `/secret-santa/min-sida?grupp=${b}`);
  await expect(page).toHaveURL(new RegExp(`/secret-santa\\?grupp=${b}$`));
  await expect(page.getByRole("link", { name: "Anna i B", exact: true })).toBeVisible();
  await goto(page, `/secret-santa/min-sida/onskelista?grupp=${b}`);
  await expect(page).toHaveURL(new RegExp(`/secret-santa\\?grupp=${b}$`));
  // A group that does not exist gives the entrance too, never A's page
  await goto(page, "/secret-santa/min-sida?grupp=999999");
  await expect(page).toHaveURL(/\/secret-santa\?grupp=999999$/);
  await expect(page.getByRole("heading", { level: 1, name: /^Hej/ })).toHaveCount(0);
  // No group in the address and one sign-in: that group, as before
  await goto(page, "/secret-santa");
  await expect(page).toHaveURL(new RegExp(`min-sida\\?grupp=${a}$`));
  // Two sign-ins and no group: the choice of group
  await santaSignIn(page, annaA, annaB);
  await goto(page, "/secret-santa");
  await expect(page.getByRole("link", { name: "Familjen A" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Familjen B" })).toBeVisible();
});

test("MUPP-079-R3 the wish list of each group is the member's own: a write in B goes to B, and a group id without a sign-in in the form writes nothing", async ({ page }) => {
  const { a, b, annaA, annaB } = await twoGroups();
  const c = await addSantaEvent("Familjen C");
  await addSantaMember(c, "Anna i C", PHONE, "anna@exempel.invalid");
  await santaSignIn(page, annaA, annaB);
  await goto(page, `/secret-santa/min-sida/onskelista?grupp=${b}`);
  await expect(page.getByText("Din önskelista i Familjen B")).toBeVisible();
  await page.getByRole("button", { name: "Ny önskning, Familjen B" }).click();
  await page.getByLabel("Namn").fill("Önskan i C");
  // The group id in the form is changed to a group the visitor has no sign-in for: nothing is written, in any group
  await page.locator('input[name="eventId"]').evaluate((input, group) => ((input as HTMLInputElement).value = group), String(c));
  await page.getByRole("button", { name: "Lägg till" }).click();
  await expect(page).toHaveURL(/\/secret-santa(\?grupp=\d+)?$/);
  expect(await santaWishes(annaA)).toHaveLength(0);
  expect(await santaWishes(annaB)).toHaveLength(0);

  await goto(page, `/secret-santa/min-sida/onskelista?grupp=${b}`);
  await page.getByRole("button", { name: "Ny önskning, Familjen B" }).click();
  await page.getByLabel("Namn").fill("Önskan i B");
  await page.getByRole("button", { name: "Lägg till" }).click();
  await expect(wishRow(page, "Önskan i B")).toBeVisible();
  expect(await santaWishes(annaB)).toHaveLength(1);
  expect(await santaWishes(annaA)).toHaveLength(0);
  await goto(page, `/secret-santa/min-sida/onskelista?grupp=${a}`);
  await expect(page.getByText("Din önskelista i Familjen A")).toBeVisible();
  await expect(wishRow(page, "Önskan i B")).toHaveCount(0);
});

test("MUPP-079-R4 a member removed from one group only loses that sign-in; the yearly cleanup ends the older entries only", async ({ page }) => {
  const { a, b, annaA, annaB } = await twoGroups();
  await santaSignIn(page, annaA, annaB);
  await goto(page, `/secret-santa/min-sida?grupp=${a}`);
  await hello(page, "Anna i A");
  // The member of A is removed: B still works, A asks for the sign-in
  await removeSantaMember(annaA);
  await goto(page, `/secret-santa/min-sida?grupp=${a}`);
  await expect(page).toHaveURL(new RegExp(`/secret-santa\\?grupp=${a}$`));
  await goto(page, `/secret-santa/min-sida?grupp=${b}`);
  await hello(page, "Anna i B");

  // An entry made before the cleanup (an older year) is refused, the one of this year next to it is kept
  const year = await santaCleanupYear();
  const secret = process.env.SITE_SESSION_SECRET!;
  const annaC = await addSantaMember(a, "Anna ny i A", PHONE, "ny@exempel.invalid");
  const value = [createSantaSession(secret, annaC, year - 1), createSantaSession(secret, annaB, year)].join("_");
  await page.context().addCookies([{ name: SANTA_COOKIE, value, domain: "localhost", path: "/", secure: true, httpOnly: true, sameSite: "Lax" }]);
  await goto(page, `/secret-santa/min-sida?grupp=${a}`);
  await expect(page).toHaveURL(new RegExp(`/secret-santa\\?grupp=${a}$`));
  await goto(page, `/secret-santa/min-sida?grupp=${b}`);
  await hello(page, "Anna i B");
});

test("MUPP-079-R5 an entry with a signature that does not match is ignored, and the valid one next to it still works", async ({ page }) => {
  const { a, b, annaA, annaB } = await twoGroups();
  await santaSignIn(page, annaA);
  const good = (await cookie(page))!;
  const [, year, signature] = good.value.split(".");
  // B's member id with A's signature
  await page.context().addCookies([{ ...good, value: `${good.value}_${annaB}.${year}.${signature}` }]);
  await goto(page, `/secret-santa/min-sida?grupp=${a}`);
  await hello(page, "Anna i A");
  await goto(page, `/secret-santa/min-sida?grupp=${b}`);
  await expect(page).toHaveURL(new RegExp(`/secret-santa\\?grupp=${b}$`));
  await expect(page.getByRole("heading", { level: 1, name: /^Hej/ })).toHaveCount(0);
});

test("MUPP-079-R6 the same phone in two groups signs in to each group separately", async ({ page }) => {
  const { a, b } = await twoGroups();
  for (const [group, name] of [[a, "Anna i A"], [b, "Anna i B"]] as const) {
    await goto(page, `/secret-santa?grupp=${group}`);
    await pickName(page, name);
    await sendPhone(page, PHONE);
    await hello(page, name);
  }
});
