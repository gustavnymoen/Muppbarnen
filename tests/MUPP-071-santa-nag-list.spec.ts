import { expect, request as playwrightRequest, test } from "@playwright/test";
import { expectNoA11yViolations, goto, runsLocally } from "./helpers";
import { addSantaDraw, addSantaEvent, addSantaMember, addSantaWish, ageSantaNag, ageSantaNagRequest, clearFamily, clearSanta } from "./family-db";
import { clearOutbox, readOutbox } from "./mail-outbox";
import { santaSignIn } from "./santa";
import { testIp } from "./site-session";

// The tests make their data straight in the local test database (never the user's own) and remove it again
test.skip(!runsLocally, "the Secret Santa tests need the local test server (its own database and passwords)");

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
  await clearSanta();
  clearOutbox();
});
test.afterEach(async () => {
  await clearSanta();
  await clearFamily();
});

// A started group where Anna gives to Bo and Bo to Anna
async function startedEvent() {
  const event = await addSantaEvent("Familjen Test", undefined, "started");
  const anna = await addSantaMember(event, "Anna Testsson", "0700001111", "anna@exempel.invalid");
  const bo = await addSantaMember(event, "Bo Testsson", "0700002222", "bo@exempel.invalid");
  await addSantaDraw(event, anna, bo);
  await addSantaDraw(event, bo, anna);
  return { anna, bo };
}

// The scheduled job, called as the workflow does: without a site cookie, with the job secret
async function runJob() {
  const caller = await playwrightRequest.newContext({ baseURL: process.env.BASE_URL, extraHTTPHeaders: { "x-real-ip": testIp() } });
  return (await caller.post("/api/santa-mails", { headers: { authorization: `Bearer ${process.env.SANTA_JOB_SECRET}` } })).json();
}

const NAG = "Tjata in en lista";

test("MUPP-071-R1 the button is shown under 'Inga önskningar ännu.' only when the match's list is empty, and the icon is a drawn SVG", async ({ page }) => {
  const { anna, bo } = await startedEvent();
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida/matchning");
  await expect(page.getByText("Inga önskningar ännu.")).toBeVisible();
  const button = page.getByRole("button", { name: NAG, exact: true });
  await expect(button).toBeEnabled();
  expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  // The icon is an SVG that screen readers skip; the name of the button is its text
  await expect(button.locator("svg")).toHaveAttribute("aria-hidden", "true");
  await expectNoA11yViolations(page);

  await addSantaWish(bo, "En bok");
  await goto(page, "/secret-santa/min-sida/matchning");
  await expect(page.getByText("Inga önskningar ännu.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Tjat/ })).toHaveCount(0);
});

test("MUPP-071-R2 R3 R4 pressing locks the button and the job mails the match once, naming the group but nobody; the button stays locked for an hour and then opens again", async ({ page }) => {
  const { anna, bo } = await startedEvent();
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida/matchning");
  await page.getByRole("button", { name: NAG, exact: true }).click();
  // R3: while the mail waits the button is disabled and says why, in words
  const queued = page.getByRole("button", { name: "Tjatet är på väg", exact: true });
  await expect(queued).toBeDisabled();
  await expectNoA11yViolations(page);
  // R2: the job (called as the scheduled workflow does, without a site cookie) sends one mail, to Bo only
  // R2: the mail waits an hour, so it does not ping Bo soon after Anna pressed; the job sends nothing yet
  expect(await runJob()).toEqual({ sent: 0, failed: 0 });
  expect(readOutbox()).toEqual([]);
  await ageSantaNagRequest(bo);
  expect(await runJob()).toEqual({ sent: 1, failed: 0 });
  expect(readOutbox().map((mail) => `${mail.to} ${mail.subject}`)).toEqual(["bo@exempel.invalid Secret Santa: Familjen Test – Din secret santa vill ha in en lista!"]);
  expect(readOutbox()[0].text).toContain("Rappa på! Din secret santa vill att du skickar in en önskelista");
  expect(JSON.stringify(readOutbox())).not.toMatch(/Anna|Testsson/);
  expect(await runJob()).toEqual({ sent: 0, failed: 0 });

  // R3: for an hour after the mail the button is locked and says so; then it is free again
  await goto(page, "/secret-santa/min-sida/matchning");
  await expect(page.getByRole("button", { name: "Du har tjatat nyss", exact: true })).toBeDisabled();
  // MUPP-072-R5: the same text under it, as for "Tjatet är på väg"
  await expect(page.getByText("Du kan bara tjata en gång i timmen.")).toBeVisible();
  await expectNoA11yViolations(page);
  await ageSantaNag(bo);
  await goto(page, "/secret-santa/min-sida/matchning");
  await expect(page.getByRole("button", { name: NAG, exact: true })).toBeEnabled();
});

test("MUPP-071-R2 a wish written before the job runs drops the nag without a mail", async ({ page }) => {
  const { anna, bo } = await startedEvent();
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida/matchning");
  await page.getByRole("button", { name: NAG, exact: true }).click();
  await expect(page.getByRole("button", { name: "Tjatet är på väg" })).toBeDisabled();
  await addSantaWish(bo, "En bok");
  expect(await runJob()).toEqual({ sent: 0, failed: 0 });
  expect(readOutbox()).toEqual([]);
});
