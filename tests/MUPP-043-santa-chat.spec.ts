import { expect, request as playwrightRequest, test, type Page } from "@playwright/test";
import { expectNoA11yViolations, goto, runsLocally } from "./helpers";
import { addSantaDraw, addSantaEvent, addSantaMember, addSantaMessage, ageSantaMessages, clearFamily, clearSanta, santaMessages } from "./family-db";
import { clearOutbox, readOutbox } from "../lib/mail-sink";
import { santaSignIn } from "./santa";
import { testIp } from "./site-session";

// The tests make their data straight in the local test database (never the user's own) and remove it again
test.skip(!runsLocally, "the Secret Santa tests need the local test server (its own database and passwords)");

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
  await clearSanta();
});
test.afterEach(async () => {
  await clearSanta();
  await clearFamily();
});

// A started event where Anna gives to Bo, Bo to Cia and Cia to Anna, and Dan and Eva give to each other
async function startedEvent() {
  const event = await addSantaEvent("Familjen Test", undefined, "started");
  const [anna, bo, cia, dan, eva] = [
    await addSantaMember(event, "Anna Testsson", "0700001111", "anna@exempel.invalid"),
    await addSantaMember(event, "Bo Testsson", "0700002222", "bo@exempel.invalid"),
    await addSantaMember(event, "Cia Testsson", "0700003333", "cia@exempel.invalid"),
    await addSantaMember(event, "Dan Testsson", "0700004444", "dan@exempel.invalid"),
    await addSantaMember(event, "Eva Testsson", "0700005555", "eva@exempel.invalid"),
  ];
  for (const [giver, receiver] of [[anna, bo], [bo, cia], [cia, anna], [dan, eva], [eva, dan]]) await addSantaDraw(event, giver, receiver);
  return { event, anna, bo, cia, dan, eva };
}

const GIVER_BUBBLE = /^Chatt med din matchning/;
const RECEIVER_BUBBLE = /^Chatt med din Secret Santa/;
// The chat is opened from inside the lists: "Min matchning" for the giver's side, "Min önskelista" for the receiver's
async function openChat(page: Page, side: "giver" | "receiver") {
  await goto(page, side === "giver" ? "/secret-santa/min-sida/matchning" : "/secret-santa/min-sida/onskelista");
  await page.getByRole("button", { name: side === "giver" ? GIVER_BUBBLE : RECEIVER_BUBBLE }).click();
}
const chatOf = (page: Page, title: string) => page.getByRole("dialog", { name: title });

// Writes one message in the open chat and waits until it is in the list
async function write(page: Page, title: string, text: string) {
  const chat = chatOf(page, title);
  await chat.getByRole("textbox", { name: "Meddelande" }).fill(text);
  await chat.getByRole("button", { name: "Skicka" }).click();
  await expect(chat.getByRole("log").getByText(text)).toBeVisible();
}

test("MUPP-043-R1 the giver writes from 'Min matchning': 1 to 500 characters, text shown as text, empty and too long refused with a message, several in a row", async ({ page }) => {
  const { anna } = await startedEvent();
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida/matchning");
  await page.getByRole("button", { name: GIVER_BUBBLE }).click();
  const chat = chatOf(page, "Din matchning");
  await expect(chat).toBeVisible();
  await expect(chat.getByText("Inga meddelanden ännu")).toBeVisible();
  // The chat names nobody: not the match either (the card on the page does)
  await expect(chat).not.toContainText("Bo Testsson");
  await expectNoA11yViolations(page);

  await write(page, "Din matchning", "Hej! Vilken storlek har du?");
  await write(page, "Din matchning", "<b>fet</b> & <script>window.hacked = 1</script>");
  await write(page, "Din matchning", "Ett tredje i rad");
  // Text is shown as text, never as markup
  await expect(chat.locator("b, script")).toHaveCount(0);
  expect(await page.evaluate(() => "hacked" in window)).toBe(false);

  // Empty (also only spaces) and too long are refused with a message, and nothing is sent
  await chat.getByRole("textbox", { name: "Meddelande" }).fill("   ");
  await chat.getByRole("button", { name: "Skicka" }).click();
  await expect(chat.getByRole("alert")).toHaveText("Skriv ett meddelande.");
  await chat.getByRole("textbox", { name: "Meddelande" }).evaluate((el: HTMLTextAreaElement) => {
    el.removeAttribute("maxlength");
    el.value = "x".repeat(501);
  });
  await chat.getByRole("button", { name: "Skicka" }).click();
  await expect(chat.getByRole("alert")).toHaveText("Meddelandet får vara högst 500 tecken.");
  await chat.getByRole("textbox", { name: "Meddelande" }).fill("x".repeat(500));
  await chat.getByRole("button", { name: "Skicka" }).click();
  await expect(chat.getByRole("alert")).toHaveText("");
  expect((await santaMessages()).map((m) => m.text.length)).toEqual([27, 47, 16, 500]);
  await expectNoA11yViolations(page);
});

test("MUPP-043-R2 R5 the receiver sees the giver's message with a notice before opening it, no name anywhere, and writes back; the notice is gone after the chat was opened", async ({ page }) => {
  const { anna, bo } = await startedEvent();
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida/matchning");
  await page.getByRole("button", { name: GIVER_BUBBLE }).click();
  await write(page, "Din matchning", "Hej Bo, vad önskar du dig?");

  await santaSignIn(page, bo);
  await goto(page, "/secret-santa/min-sida");
  // R5: the card "Min önskelista" has the notice (a text for screen readers, not colour alone) and no button; the other card has none
  await expect(page.getByRole("link", { name: "Min önskelista Nytt meddelande" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Min matchning/ })).not.toContainText("Nytt meddelande");
  await expect(page.getByRole("button", { name: /Chatt/ })).toHaveCount(0);
  await expectNoA11yViolations(page);
  // R3: nothing on the page names the giver, who is Anna
  await expect(page.getByRole("main")).not.toContainText("Anna");
  expect(await page.content()).not.toContain("Anna Testsson");
  // The same notice in the opened list
  await page.getByRole("link", { name: "Min önskelista" }).click();
  await expect(page).toHaveURL(/\/min-sida\/onskelista$/);
  await expect(page.getByRole("button", { name: "Chatt med din Secret Santa, nytt meddelande" })).toBeVisible();
  await page.getByRole("button", { name: /^Chatt med din Secret Santa/ }).click();
  const chat = chatOf(page, "Din Secret Santa");
  await expect(chat.getByRole("log").getByText("Hej Bo, vad önskar du dig?")).toBeVisible();
  // With one message the list is mostly empty and the message sits at its bottom, like in an ordinary chat
  const log = chat.getByRole("log");
  await expect.poll(async () => {
    const [l, m] = await Promise.all([log.boundingBox(), log.locator("> div").last().boundingBox()]);
    return l && m ? l.y + l.height - (m.y + m.height) : 999;
  }).toBeLessThan(4);
  // R5: the message is marked read when it is shown
  await expect.poll(async () => (await santaMessages())[0].read).toBe(true);
  await expect(page.getByRole("button", { name: "Chatt med din Secret Santa", exact: true })).toBeVisible();
  await expectNoA11yViolations(page);
  // R2: the receiver writes back, several in a row
  await write(page, "Din Secret Santa", "En bok vore fint");
  await write(page, "Din Secret Santa", "Och något varmt");
  await page.keyboard.press("Escape");
  await expect(chat).toBeHidden();
  await goto(page, "/secret-santa/min-sida");
  await expect(page.getByText("Nytt meddelande")).toHaveCount(0);

  // Anna sees Bo's two messages as unread on the card "Min matchning: Bo Testsson", and the notice goes once she has opened the chat
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida");
  await expect(page.getByRole("link", { name: /^Min matchning: Bo Testsson Nytt meddelande/ })).toBeVisible();
  await openChat(page, "giver");
  await expect(chatOf(page, "Din matchning").getByRole("log").getByText("Och något varmt")).toBeVisible();
  await page.keyboard.press("Escape");
  await goto(page, "/secret-santa/min-sida");
  await expect(page.getByText("Nytt meddelande")).toHaveCount(0);
});

test("MUPP-043-R2 the receiver may write first, before the giver has written anything, and the giver sees it", async ({ page }) => {
  const { dan, eva } = await startedEvent();
  await santaSignIn(page, eva);
  await goto(page, "/secret-santa/min-sida/onskelista");
  await page.getByRole("button", { name: RECEIVER_BUBBLE }).click();
  await write(page, "Din Secret Santa", "Jag skriver först!");
  await santaSignIn(page, dan);
  await goto(page, "/secret-santa/min-sida");
  await expect(page.getByRole("link", { name: /^Min matchning: Eva Testsson Nytt meddelande/ })).toBeVisible();
  await openChat(page, "giver");
  await expect(chatOf(page, "Din matchning").getByRole("log").getByText("Jag skriver först!")).toBeVisible();
});

test("MUPP-043-R3 R4 in an asymmetric draw Bo's two chats are separate, a third member sees neither, and no answer to the receiver carries a name or an id of the giver", async ({ page }) => {
  const { anna, bo, cia, dan } = await startedEvent();
  const answers: string[] = [];
  page.on("response", async (response) => {
    // The pages (with the messages they send along) and the actions' answers
    if (["document", "fetch", "xhr"].includes(response.request().resourceType())) answers.push(await response.text().catch(() => ""));
  });
  // Anna (gives to Bo) writes; Cia (gives to Anna) writes too
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida/matchning");
  await page.getByRole("button", { name: GIVER_BUBBLE }).click();
  await write(page, "Din matchning", "Första hälsningen");
  await santaSignIn(page, cia);
  await goto(page, "/secret-santa/min-sida/matchning");
  await page.getByRole("button", { name: GIVER_BUBBLE }).click();
  await write(page, "Din matchning", "Andra hälsningen");

  // Only what the server answers to Bo is checked for the giver
  answers.length = 0;
  // Bo: as receiver the message of Anna, as giver nothing (Cia has not been written to)
  await santaSignIn(page, bo);
  await openChat(page, "receiver");
  await expect(chatOf(page, "Din Secret Santa").getByRole("log")).toContainText("Första hälsningen");
  await expect(chatOf(page, "Din Secret Santa").getByRole("log")).not.toContainText("Andra hälsningen");
  await page.keyboard.press("Escape");
  await openChat(page, "giver");
  await expect(chatOf(page, "Din matchning").getByText("Inga meddelanden ännu")).toBeVisible();
  // R3: nothing the server sent to Bo (pages and answers) names or numbers the giver
  await expect.poll(() => answers.length).toBeGreaterThan(1);
  // (Bo shares the family name with Anna, so only her first name and address are looked for; the message texts carry no name)
  for (const answer of answers) expect(answer).not.toMatch(/Anna|anna@exempel/);

  // R4: Dan, in the same event but in another pair, has no notice and both his chats are empty
  await santaSignIn(page, dan);
  await goto(page, "/secret-santa/min-sida");
  await expect(page.getByText("Nytt meddelande")).toHaveCount(0);
  for (const [side, title] of [["giver", "Din matchning"], ["receiver", "Din Secret Santa"]] as const) {
    await openChat(page, side);
    await expect(chatOf(page, title).getByText("Inga meddelanden ännu")).toBeVisible();
    await page.keyboard.press("Escape");
  }
});

test("MUPP-043-R6 a message mails the other side once the ten minutes have passed, one mail for several messages, naming the group but nobody and nothing that was written", async ({ page }) => {
  clearOutbox();
  const { anna, bo } = await startedEvent();
  const caller = await playwrightRequest.newContext({ baseURL: process.env.BASE_URL, extraHTTPHeaders: { "x-real-ip": testIp() } });
  const runJob = async () => (await caller.post("/api/santa-mails", { headers: { authorization: `Bearer ${process.env.SANTA_JOB_SECRET}` } })).json();

  await santaSignIn(page, anna);
  await openChat(page, "giver");
  await write(page, "Din matchning", "Hemligt ett");
  await write(page, "Din matchning", "Hemligt två");
  // Within the first ten minutes the messages are collected
  expect(await runJob()).toEqual({ sent: 0, failed: 0 });
  await ageSantaMessages();
  expect(await runJob()).toEqual({ sent: 1, failed: 0 });
  expect(readOutbox().map((mail) => `${mail.to} ${mail.subject}`)).toEqual(["bo@exempel.invalid Secret Santa: Familjen Test – nytt meddelande från din Secret Santa"]);
  expect(JSON.stringify(readOutbox())).not.toMatch(/Testsson|Hemligt|Anna/);
  expect(await runJob()).toEqual({ sent: 0, failed: 0 });

  // Bo's answer, after ten minutes, mails Anna (mail 7)
  await santaSignIn(page, bo);
  await openChat(page, "receiver");
  await write(page, "Din Secret Santa", "Hemligt svar");
  await ageSantaMessages();
  expect(await runJob()).toEqual({ sent: 1, failed: 0 });
  expect(readOutbox().map((mail) => `${mail.to} ${mail.subject}`).pop()).toBe("anna@exempel.invalid Secret Santa: Familjen Test – nytt meddelande från din matchning");
  await caller.dispose();
  clearOutbox();
});

test("MUPP-043-R5 a new message shows on the button also when the same list was visited and read earlier in the same visit, and the chat is there at once", async ({ page }) => {
  const { event, anna, bo } = await startedEvent();
  await addSantaMessage(event, anna, bo, false, "Första");
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida");
  await page.getByRole("link", { name: /^Min matchning/ }).click();
  await expect(page).toHaveURL(/\/matchning$/);
  await expect(page.getByRole("button", { name: "Chatt med din matchning, nytt meddelande" })).toBeVisible();
  // The messages come with the page, so they are shown the moment the card opens; opening reads them and the notice goes
  await page.getByRole("button", { name: /^Chatt med din matchning/ }).click();
  await expect(chatOf(page, "Din matchning").getByRole("log")).toContainText("Första");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Chatt med din matchning", exact: true })).toBeVisible();
  // Back to the cards and into the same list again without a reload: a message that came meanwhile gives the notice again
  await addSantaMessage(event, anna, bo, false, "Andra");
  await page.getByRole("link", { name: "Tillbaka" }).click();
  await expect(page).toHaveURL(/\/min-sida$/);
  await page.getByRole("link", { name: /^Min matchning/ }).click();
  await expect(page).toHaveURL(/\/matchning$/);
  await expect(page.getByRole("button", { name: "Chatt med din matchning, nytt meddelande" })).toBeVisible();
});

test("MUPP-043-R2 a message that comes between loading the page and opening the chat is in the chat, and one that comes while it is open shows within ten seconds", async ({ page }) => {
  const { event, anna, bo } = await startedEvent();
  await page.clock.install();
  await santaSignIn(page, anna);
  await goto(page, "/secret-santa/min-sida/matchning");
  await addSantaMessage(event, anna, bo, false, "Kom efter sidladdningen");
  await page.getByRole("button", { name: /^Chatt med din matchning/ }).click();
  const log = chatOf(page, "Din matchning").getByRole("log");
  await expect(log).toContainText("Kom efter sidladdningen");
  await addSantaMessage(event, anna, bo, false, "Kom medan chatten var öppen");
  await page.clock.fastForward(10_500);
  await expect(log).toContainText("Kom medan chatten var öppen");
  await expectNoA11yViolations(page);
});
