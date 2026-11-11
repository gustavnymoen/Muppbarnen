import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { unitTestDbFile } from "./local-db.mjs";

// lib/db.ts väljer databasen när den läses in: enhetstesternas egen, aldrig den riktiga
process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { run, get, all } = await import("./db");
const chat = await import("./santa-chat");
const santa = await import("./santa");
const { runCleanup } = await import("./santa-cleanup");
const { messageFromGiverMail, messageFromReceiverMail } = await import("./santa-mail");

const clear = async () => {
  await run("DELETE FROM ss_message");
  await run("DELETE FROM ss_draw");
  await run("DELETE FROM ss_wish");
  await run("DELETE FROM ss_member");
  await run("DELETE FROM ss_event");
  await run("DELETE FROM parent");
};
let ownerId: number;
beforeEach(async () => {
  await clear();
  await run("UPDATE ss_cleanup SET year = 2020");
  ownerId = (await run("INSERT INTO parent (name, is_master_admin) VALUES ('Chef', 1)")).lastId;
});
afterAll(clear);

const thisYear = new Date().getFullYear();
let counter = 0;
// En startad grupp: Anna ger till Bo, Bo till Cia, Cia till Anna (asymmetrisk), och Dan och Eva ger till varandra
async function started(status = "started") {
  const event = (await run("INSERT INTO ss_event (owner_id, name, status) VALUES (?, ?, ?)", [ownerId, `Grupp ${++counter}`, status])).lastId;
  const member = async (name: string) => (await run("INSERT INTO ss_member (event_id, name, phone, email) VALUES (?, ?, ?, ?)", [event, name, `070004${String(++counter).padStart(4, "0")}`, `${name.toLowerCase()}@exempel.se`])).lastId;
  const [anna, bo, cia, dan, eva] = [await member("Anna"), await member("Bo"), await member("Cia"), await member("Dan"), await member("Eva")];
  for (const [giver, receiver] of [[anna, bo], [bo, cia], [cia, anna], [dan, eva], [eva, dan]]) {
    await run("INSERT INTO ss_draw (event_id, year, giver_id, receiver_id) VALUES (?, ?, ?, ?)", [event, thisYear, giver, receiver]);
  }
  return { event, anna, bo, cia, dan, eva };
}
const sink = () => {
  const sent: { to: string; subject: string; text: string }[] = [];
  return { sent, send: async (to: string, mail: { subject: string; text: string }) => (to.startsWith("fel@") ? { ok: false } : (sent.push({ to, ...mail }), { ok: true })) };
};
const texts = (result: Awaited<ReturnType<typeof chat.openChat>>) => (result.ok ? result.messages : []);
const count = async () => (await get<{ n: number }>("SELECT COUNT(*) AS n FROM ss_message"))!.n;
const MINUTE = 60 * 1000;

describe("MUPP-043-R1 R2 both sides write", () => {
  test("MUPP-043-R1 the giver writes 1 to 500 characters; empty, blank and too long are refused with a message", async () => {
    const { anna } = await started();
    expect(await chat.sendMessage(anna, "giver", "Hej!")).toEqual({ ok: true, messages: [{ mine: true, text: "Hej!" }] });
    expect(await chat.sendMessage(anna, "giver", "x".repeat(500))).toMatchObject({ ok: true });
    expect(await chat.sendMessage(anna, "giver", "")).toEqual({ ok: false, error: "Skriv ett meddelande." });
    expect(await chat.sendMessage(anna, "giver", "   ")).toEqual({ ok: false, error: "Skriv ett meddelande." });
    expect(await chat.sendMessage(anna, "giver", undefined)).toMatchObject({ ok: false });
    expect(await chat.sendMessage(anna, "giver", "x".repeat(501))).toEqual({ ok: false, error: "Meddelandet får vara högst 500 tecken." });
    expect(await count()).toBe(2);
  });

  test("MUPP-043-R1 text is stored as text, never changed into markup", async () => {
    const { anna, bo } = await started();
    await chat.sendMessage(anna, "giver", '<script>alert("hej")</script> & <b>fet</b>');
    expect(texts(await chat.openChat(bo, "receiver"))).toEqual([{ mine: false, text: '<script>alert("hej")</script> & <b>fet</b>' }]);
  });

  test("MUPP-043-R2 the receiver may write first, before the giver has written, and the giver sees it in the same conversation", async () => {
    const { anna, bo } = await started();
    expect(await chat.sendMessage(bo, "receiver", "Vilken storlek vill du ha?")).toMatchObject({ ok: true });
    expect(texts(await chat.openChat(anna, "giver"))).toEqual([{ mine: false, text: "Vilken storlek vill du ha?" }]);
    expect(texts(await chat.openChat(bo, "receiver"))).toEqual([{ mine: true, text: "Vilken storlek vill du ha?" }]);
  });

  test("MUPP-043-R2 each side may send several messages in a row, in order", async () => {
    const { anna, bo } = await started();
    for (const text of ["ett", "två", "tre"]) await chat.sendMessage(anna, "giver", text);
    await chat.sendMessage(bo, "receiver", "fyra");
    await chat.sendMessage(bo, "receiver", "fem");
    expect(texts(await chat.openChat(bo, "receiver")).map((m) => m.text)).toEqual(["ett", "två", "tre", "fyra", "fem"]);
    expect(texts(await chat.openChat(bo, "receiver")).map((m) => m.mine)).toEqual([false, false, false, true, true]);
  });

  test("MUPP-043-R2 a group that is not started has no conversation, and an unknown side is refused", async () => {
    const { anna } = await started("preparing");
    expect(await chat.sendMessage(anna, "giver", "Hej")).toEqual({ ok: false, error: "Du kan inte göra det här." });
    expect(await chat.openChat(anna, "giver")).toMatchObject({ ok: false });
    expect(chat.parseSide("giver")).toBe("giver");
    expect(chat.parseSide("receiver")).toBe("receiver");
    expect(chat.parseSide("annan")).toBeNull();
    expect(chat.parseSide(undefined)).toBeNull();
  });
});

describe("MUPP-043-R3 R4 the draw stays secret and each conversation has one pair", () => {
  test("MUPP-043-R3 an asymmetric draw gives separate conversations: Bo's two chats never mix, and nothing says who the other is", async () => {
    const { anna, bo, cia } = await started();
    await chat.sendMessage(anna, "giver", "Från Anna till Bo");
    await chat.sendMessage(cia, "giver", "Från Cia till Anna");
    await chat.sendMessage(bo, "giver", "Från Bo till Cia");
    // Bo som mottagare ser bara Anna (utan namn), Bo som givare bara samtalet med Cia
    expect(texts(await chat.openChat(bo, "receiver"))).toEqual([{ mine: false, text: "Från Anna till Bo" }]);
    expect(texts(await chat.openChat(bo, "giver"))).toEqual([{ mine: true, text: "Från Bo till Cia" }]);
    expect(texts(await chat.openChat(anna, "giver"))).toEqual([{ mine: true, text: "Från Anna till Bo" }]);
    expect(texts(await chat.openChat(anna, "receiver"))).toEqual([{ mine: false, text: "Från Cia till Anna" }]);
    // Allt som lämnar funktionerna är { mine, text }: inget id, ingen tid, inget namn
    const all = [...texts(await chat.openChat(bo, "receiver")), ...texts(await chat.openChat(bo, "giver"))];
    for (const message of all) expect(Object.keys(message).sort()).toEqual(["mine", "text"]);
    expect(JSON.stringify(all)).not.toMatch(/Anna Testsson|giver_id|created_at/);
  });

  test("MUPP-043-R3 two members who give to each other have one conversation per direction", async () => {
    const { dan, eva } = await started();
    await chat.sendMessage(dan, "giver", "Dan som givare");
    await chat.sendMessage(dan, "receiver", "Dan som mottagare");
    expect(texts(await chat.openChat(eva, "receiver")).map((m) => m.text)).toEqual(["Dan som givare"]);
    expect(texts(await chat.openChat(eva, "giver")).map((m) => m.text)).toEqual(["Dan som mottagare"]);
  });

  test("MUPP-043-R4 a third member sees nothing of another pair's conversation, and no function takes a pair from the caller", async () => {
    const { anna, bo, cia, dan } = await started();
    await chat.sendMessage(anna, "giver", "Bara för Bo");
    for (const [member, side] of [[cia, "giver"], [cia, "receiver"], [dan, "giver"], [dan, "receiver"]] as const) {
      expect(JSON.stringify(await chat.openChat(member, side))).not.toContain("Bara för Bo");
    }
    expect(texts(await chat.openChat(bo, "receiver"))).toHaveLength(1);
    // Ett fel medlems-id eller en fel sida ger ingenting
    expect(await chat.openChat(999999, "giver")).toMatchObject({ ok: false });
    expect(await chat.sendMessage(999999, "receiver", "Hej")).toMatchObject({ ok: false });
  });
});

describe("MUPP-043-R5 unread", () => {
  test("MUPP-043-R5 a message is unread for the other side only, and opening the chat marks it read; one's own messages count as read", async () => {
    const { anna, bo, cia } = await started();
    expect(await chat.unreadSides(bo)).toEqual({ giver: false, receiver: false });
    await chat.sendMessage(anna, "giver", "Hej Bo");
    expect(await chat.unreadSides(anna)).toEqual({ giver: false, receiver: false });
    expect(await chat.unreadSides(bo)).toEqual({ giver: false, receiver: true });
    expect(await chat.unreadSides(cia)).toEqual({ giver: false, receiver: false });
    await chat.openChat(bo, "receiver");
    expect(await chat.unreadSides(bo)).toEqual({ giver: false, receiver: false });
    // Svaret är oläst för Anna, som givare
    await chat.sendMessage(bo, "receiver", "Hej tillbaka");
    expect(await chat.unreadSides(anna)).toEqual({ giver: true, receiver: false });
    await chat.openChat(anna, "giver");
    expect(await chat.unreadSides(anna)).toEqual({ giver: false, receiver: false });
  });

  test("MUPP-043-R5 opening the other chat does not mark this one read", async () => {
    const { anna, bo, cia } = await started();
    await chat.sendMessage(anna, "giver", "Till Bo som mottagare");
    await chat.sendMessage(cia, "receiver", "Till Bo som givare");
    await chat.openChat(bo, "giver");
    expect(await chat.unreadSides(bo)).toEqual({ giver: false, receiver: true });
  });
});

describe("MUPP-043-R6 message mail", () => {
  test("MUPP-043-R6 messages within ten minutes give one mail per conversation and direction, with no text or names", async () => {
    const { anna, bo, cia } = await started();
    const t = 1_000_000_000_000;
    await chat.sendMessage(anna, "giver", "Hemligt 1", t);
    await chat.sendMessage(anna, "giver", "Hemligt 2", t + 2 * MINUTE);
    await chat.sendMessage(bo, "receiver", "Svar", t + 3 * MINUTE);
    await chat.sendMessage(cia, "giver", "Annat samtal", t + 4 * MINUTE);
    const { sent, send } = sink();
    const eventName = (await get<{ name: string }>("SELECT name FROM ss_event"))!.name;
    // Före tio minuter väntar allt
    expect(await chat.sendMessageMails(t + 9 * MINUTE, send)).toEqual({ sent: 0, failed: 0 });
    expect(await chat.sendMessageMails(t + 10 * MINUTE, send)).toEqual({ sent: 1, failed: 0 });
    // Annas två meddelanden gav ett mejl till Bo (mejl 6); Bos svar och Cias meddelande väntar på sina tio minuter
    expect(sent).toEqual([{ to: "bo@exempel.se", ...messageFromGiverMail(eventName) }]);
    expect(await chat.sendMessageMails(t + 14 * MINUTE, send)).toEqual({ sent: 2, failed: 0 });
    expect(sent.map((m) => m.to).sort()).toEqual(["anna@exempel.se", "bo@exempel.se", "anna@exempel.se"].sort());
    expect(sent.filter((m) => m.subject === messageFromReceiverMail(eventName).subject).map((m) => m.to)).toEqual(["anna@exempel.se"]);
    for (const mail of sent) expect(`${mail.subject} ${mail.text}`).not.toMatch(/Hemligt|Svar|Annat|Anna|Bo|Cia/);
    // Inget skickas två gånger
    expect(await chat.sendMessageMails(t + 60 * MINUTE, send)).toEqual({ sent: 0, failed: 0 });
  });

  test("MUPP-043-R6 a message already read gives no mail, and a mail that fails is tried again", async () => {
    const { anna, bo } = await started();
    const t = 2_000_000_000_000;
    await chat.sendMessage(anna, "giver", "Läst", t);
    await chat.openChat(bo, "receiver", t + MINUTE);
    const { sent, send } = sink();
    expect(await chat.sendMessageMails(t + 10 * MINUTE, send)).toEqual({ sent: 0, failed: 0 });
    expect(sent).toEqual([]);
    await run("UPDATE ss_member SET email = 'fel@exempel.se' WHERE id = ?", [bo]);
    await chat.sendMessage(anna, "giver", "Oläst", t + 20 * MINUTE);
    expect(await chat.sendMessageMails(t + 30 * MINUTE, send)).toEqual({ sent: 0, failed: 1 });
    await run("UPDATE ss_member SET email = 'bo@exempel.se' WHERE id = ?", [bo]);
    expect(await chat.sendMessageMails(t + 31 * MINUTE, send)).toEqual({ sent: 1, failed: 0 });
  });
});

describe("MUPP-043-R7 gone with the draw", () => {
  const owner = () => ({ id: ownerId, name: "Chef", isMasterAdmin: true });

  test("MUPP-043-R7 stopping the draw and deleting the group delete the conversations", async () => {
    const { event, anna } = await started();
    await chat.sendMessage(anna, "giver", "Hej");
    expect(await santa.stopDraw(owner(), String(event))).toMatchObject({ ok: true });
    expect(await count()).toBe(0);
    const other = await started();
    await chat.sendMessage(other.anna, "giver", "Hej");
    expect(await santa.removeEvent(owner(), String(other.event))).toEqual({ ok: true });
    expect(await count()).toBe(0);
  });

  test("MUPP-043-R7 a new draw starts without old conversations, and only that group's are deleted", async () => {
    const { event, anna } = await started("preparing");
    await run("DELETE FROM ss_draw");
    await run("INSERT INTO ss_message (event_id, giver_id, receiver_id, from_giver, text, created_at) VALUES (?, ?, ?, 1, 'Gammalt', 1)", [event, anna, anna + 1]);
    const another = await started();
    await chat.sendMessage(another.anna, "giver", "Annan grupp");
    expect(await santa.startDraw(owner(), String(event))).toMatchObject({ ok: true });
    expect((await all<{ text: string }>("SELECT text FROM ss_message")).map((m) => m.text)).toEqual(["Annan grupp"]);
  });

  test("MUPP-043-R7 the yearly cleanup deletes the conversations", async () => {
    const { anna } = await started();
    await chat.sendMessage(anna, "giver", "Hej");
    expect(await runCleanup({ year: thisYear + 1, month: 2, day: 1 })).toEqual({ cleaned: 1 });
    expect(await count()).toBe(0);
  });
});
