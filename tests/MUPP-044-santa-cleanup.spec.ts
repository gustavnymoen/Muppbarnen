import { expect, test } from "@playwright/test";
import { adminSignIn, goto, runsLocally, uniqueName } from "./helpers";
import { addParent, addSantaDrawRows, addSantaEvent, addSantaMember, addSantaWish, clearFamily, clearSanta, santaDraw, santaStatusOf, santaWishes, setSantaCleanupYear } from "./family-db";
import { eventCard, openEventCard, santaSignIn } from "./santa";
import { testIp } from "./site-session";

// The test server runs the cleanup as if it were 1 February 2099 (SANTA_CLEANUP_TODAY, scripts/test-server.mjs) and knows the cron secret
test.skip(!runsLocally, "the Secret Santa tests need the local test server (its own database and passwords)");

const CRON = { authorization: "Bearer påhittad-cronhemlighet" };
const realYear = new Date().getFullYear();

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
  await clearSanta();
});
test.afterEach(async () => {
  await clearSanta();
  await clearFamily();
  // The cleanup moved the year to 2099; put it back so the next test's cookies and cleanup start from the same place
  await setSantaCleanupYear(realYear);
});

test("MUPP-044-R4 a cookie from before the cleanup stops working, and the route refuses a call without the secret", async ({ page }) => {
  const event = await addSantaEvent("Emmas jul", undefined, "started");
  const anna = await addSantaMember(event, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida");
  await expect(page.getByRole("heading", { level: 1, name: "Hej Anna Testsson!" })).toBeVisible();

  expect((await page.request.get("/api/santa-cleanup")).status()).toBe(401);
  expect((await page.request.get("/api/santa-cleanup", { headers: { authorization: "Bearer fel" } })).status()).toBe(401);
  await goto(page, "/secret-santa/min-sida");
  await expect(page.getByRole("heading", { level: 1, name: "Hej Anna Testsson!" })).toBeVisible();

  const done = await page.request.get("/api/santa-cleanup", { headers: CRON });
  expect(await done.json()).toEqual({ cleaned: 1 });
  await goto(page, "/secret-santa/min-sida");
  await expect(page).toHaveURL(/\/secret-santa$/);
  await expect(page.getByRole("heading", { level: 1, name: "Secret Santa" })).toBeVisible();
});

test("MUPP-044-R1 R2 R3 after the cleanup the group is inactive with empty lists, and activating and starting it again avoids last year's receivers", async ({ page }) => {
  const emma = uniqueName("Emma");
  const event = await addSantaEvent("Emmas jul", await addParent(emma), "started");
  const [anna, bertil, cia] = [
    await addSantaMember(event, "Anna Testsson", "0700001111", "anna@exempel.invalid"),
    await addSantaMember(event, "Bertil Testsson", "0700002222", "bertil@exempel.invalid"),
    await addSantaMember(event, "Cia Testsson", "0700003333", "cia@exempel.invalid"),
  ];
  await addSantaWish(anna, "Bok");
  // Last year's draw: the log the next draw reads
  await addSantaDrawRows(event, realYear - 1, [[anna, bertil], [bertil, cia], [cia, anna]]);

  await page.request.get("/api/santa-cleanup", { headers: CRON });
  expect(await santaStatusOf(event)).toBe("inactive");
  expect(await santaWishes(anna)).toEqual([]);
  expect(await santaDraw(event)).toHaveLength(3);

  // R3: the administrator starts the new year: with three people and last year's pairs out, one draw is left
  await adminSignIn(page, emma);
  await page.getByRole("tab", { name: "Secret Santa" }).click();
  const card = eventCard(page, "Emmas jul");
  await openEventCard(card);
  await expect(card).toContainText("Status: Inaktiv");
  await card.getByRole("switch", { name: "Aktiv Emmas jul" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Aktivera", exact: true }).click();
  await expect(card).toContainText("Status: Förbereder");
  await expect(card.getByRole("img", { name: "Har skrivit en önskelista" })).toHaveCount(0);
  await card.getByRole("switch", { name: "Startad Emmas jul" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Starta", exact: true }).click();
  await expect(card).toContainText("Status: Startad");
  expect(await santaDraw(event, realYear)).toEqual([[anna, cia], [bertil, anna], [cia, bertil]]);
  expect(await santaDraw(event, realYear - 1)).toHaveLength(3);
});
