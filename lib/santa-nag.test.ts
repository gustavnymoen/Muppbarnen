import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { unitTestDbFile } from "./local-db.mjs";

// lib/db.ts väljer databasen när den läses in: enhetstesternas egen, aldrig den riktiga
process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { run, get } = await import("./db");
const nag = await import("./santa-nag");
const { matchOf } = await import("./santa-match");
const santa = await import("./santa");
const { nagListMail } = await import("./santa-mail");

const clear = async () => {
  await run("DELETE FROM ss_draw");
  await run("DELETE FROM ss_wish");
  await run("DELETE FROM ss_member");
  await run("DELETE FROM ss_event");
  await run("DELETE FROM parent");
};
let ownerId: number;
beforeEach(async () => {
  await clear();
  ownerId = (await run("INSERT INTO parent (name, is_master_admin) VALUES ('Chef', 1)")).lastId;
});
afterAll(clear);

const HOUR = nag.NAG_LOCK_MS;
const DELAY = nag.NAG_DELAY_MS;
const thisYear = new Date().getFullYear();
let counter = 0;
// En grupp där Anna ger till Bo och Bo till Anna
async function group(status = "started") {
  const event = (await run("INSERT INTO ss_event (owner_id, name, status) VALUES (?, ?, ?)", [ownerId, `Grupp ${++counter}`, status])).lastId;
  const member = async (name: string) => (await run("INSERT INTO ss_member (event_id, name, phone, email) VALUES (?, ?, ?, ?)", [event, name, `070004${String(++counter).padStart(4, "0")}`, `${name.toLowerCase()}@exempel.se`])).lastId;
  const [anna, bo] = [await member("Anna"), await member("Bo")];
  await run("INSERT INTO ss_draw (event_id, year, giver_id, receiver_id) VALUES (?, ?, ?, ?), (?, ?, ?, ?)", [event, thisYear, anna, bo, event, thisYear, bo, anna]);
  return { event, anna, bo };
}
const sink = () => {
  const sent: { to: string; subject: string; text: string }[] = [];
  return { sent, send: async (to: string, mail: { subject: string; text: string }) => (to.startsWith("fel@") ? { ok: false } : (sent.push({ to, ...mail }), { ok: true })) };
};
const addWish = (memberId: number) => run("INSERT INTO ss_wish (member_id, title, description, size, url) VALUES (?, 'Bok', '', '', '')", [memberId]);
const row = (memberId: number) => get<{ nag_requested_at: number | null; nag_mailed_at: number | null }>("SELECT nag_requested_at, nag_mailed_at FROM ss_member WHERE id = ?", [memberId]);
const NOW = Date.now();

describe("MUPP-071-R2 R4 the request", () => {
  test("MUPP-071-R4 only the giver of a started group with an empty list can queue, and the receiver is the draw's, never the caller's", async () => {
    const { anna, bo } = await group();
    expect(await nag.requestNag(anna, NOW)).toEqual({ ok: true });
    expect((await row(bo))!.nag_requested_at).toBe(NOW);
    expect((await row(anna))!.nag_requested_at).toBeNull();
    // Someone outside any draw, and a member of a group that is not started, queue nothing
    expect(await nag.requestNag(999999, NOW)).toEqual({ ok: false });
    const preparing = await group("preparing");
    expect(await nag.requestNag(preparing.anna, NOW)).toEqual({ ok: false });
    expect((await row(preparing.bo))!.nag_requested_at).toBeNull();
  });

  test("MUPP-071-R4 a match with a wish cannot be nagged", async () => {
    const { anna, bo } = await group();
    await addWish(bo);
    expect(await nag.requestNag(anna, NOW)).toEqual({ ok: false });
    expect((await row(bo))!.nag_requested_at).toBeNull();
  });
});

describe("MUPP-071-R3 the lock", () => {
  test("MUPP-071-R3 a second request is refused while the mail waits, and for an hour after it was sent, then allowed again", async () => {
    const { anna, bo } = await group();
    expect(await nag.requestNag(anna, NOW)).toEqual({ ok: true });
    expect(await nag.requestNag(anna, NOW + 1)).toEqual({ ok: false });
    expect(nag.nagState((await row(bo))!, NOW)).toBe("queued");
    const { sent, send } = sink();
    await nag.sendNagMails(NOW + DELAY + 5, send);
    expect(sent).toHaveLength(1);
    expect(nag.nagState((await row(bo))!, NOW + DELAY + 10)).toBe("recent");
    expect(await nag.requestNag(anna, NOW + DELAY + HOUR)).toEqual({ ok: false });
    expect(nag.nagState((await row(bo))!, NOW + DELAY + 5 + HOUR + 1)).toBe("free");
    expect(await nag.requestNag(anna, NOW + DELAY + 5 + HOUR + 1)).toEqual({ ok: true });
  });

  test("MUPP-071-R3 the match page gets the state with the match", async () => {
    const { anna } = await group();
    expect((await matchOf(anna))!.nag).toBe("free");
    await nag.requestNag(anna);
    expect((await matchOf(anna))!.nag).toBe("queued");
  });

  test("MUPP-071-R3 stopping the draw clears what waits and the sent time (start goes through the same clearListChanges, tested in santa-changes.test.ts)", async () => {
    const { event, anna, bo } = await group();
    await nag.requestNag(anna, NOW);
    await run("UPDATE ss_member SET nag_mailed_at = ? WHERE id = ?", [NOW, anna]);
    const admin = { id: ownerId, name: "Chef", isMasterAdmin: true };
    await santa.stopDraw(admin, String(event));
    expect(await row(bo)).toEqual({ nag_requested_at: null, nag_mailed_at: null });
    expect(await row(anna)).toEqual({ nag_requested_at: null, nag_mailed_at: null });
  });
});

describe("MUPP-071-R2 the mail", () => {
  test("MUPP-071-R2 the job mails the match, and only the match, with the group in the subject and nobody's name in it", async () => {
    const { anna, bo } = await group();
    await nag.requestNag(anna, NOW);
    const { sent, send } = sink();
    expect(await nag.sendNagMails(NOW + DELAY + 1, send)).toEqual({ sent: 1, failed: 0 });
    expect(sent).toEqual([{ to: "bo@exempel.se", ...nagListMail(`Grupp ${counter - 2}`) }]);
    expect(sent[0].subject).toMatch(/^Secret Santa: Grupp \d+ – Din secret santa vill ha in en lista!$/);
    expect(sent[0].text).toBe("Rappa på! Din secret santa vill att du skickar in en önskelista, personen är het på gröten! Ho ho ho!");
    expect(JSON.stringify(sent)).not.toMatch(/Anna|Bo\b/);
    // Nothing waits any more: the next run sends nothing
    expect(await nag.sendNagMails(NOW + DELAY + 2, send)).toEqual({ sent: 0, failed: 0 });
    expect((await row(bo))!.nag_requested_at).toBeNull();
  });

  test("MUPP-071-R2 the mail waits an hour, so it does not ping the match soon after the giver pressed", async () => {
    const { anna } = await group();
    await nag.requestNag(anna, NOW);
    const { sent, send } = sink();
    expect(await nag.sendNagMails(NOW + DELAY - 1, send)).toEqual({ sent: 0, failed: 0 });
    expect(sent).toEqual([]);
    expect(await nag.sendNagMails(NOW + DELAY, send)).toEqual({ sent: 1, failed: 0 });
  });

  test("MUPP-071-R2 a wish written before the job runs, or a stopped draw, drops the request without a mail", async () => {
    const { anna, bo } = await group();
    await nag.requestNag(anna, NOW);
    await addWish(bo);
    const { sent, send } = sink();
    expect(await nag.sendNagMails(NOW + DELAY + 1, send)).toEqual({ sent: 0, failed: 0 });
    expect(sent).toEqual([]);
    expect(await row(bo)).toEqual({ nag_requested_at: null, nag_mailed_at: null });
    const other = await group();
    await nag.requestNag(other.anna, NOW);
    await run("UPDATE ss_event SET status = 'preparing' WHERE id = ?", [other.event]);
    expect(await nag.sendNagMails(NOW + DELAY + 1, send)).toEqual({ sent: 0, failed: 0 });
    expect((await row(other.bo))!.nag_requested_at).toBeNull();
  });

  test("MUPP-071-R2 a mail that fails stays queued, and the next run tries again", async () => {
    const { anna, bo } = await group();
    await run("UPDATE ss_member SET email = 'fel@exempel.se' WHERE id = ?", [bo]);
    await nag.requestNag(anna, NOW);
    const { send } = sink();
    expect(await nag.sendNagMails(NOW + DELAY + 1, send)).toEqual({ sent: 0, failed: 1 });
    expect(await row(bo)).toEqual({ nag_requested_at: NOW, nag_mailed_at: null });
    await run("UPDATE ss_member SET email = 'bo@exempel.se' WHERE id = ?", [bo]);
    const again = sink();
    expect(await nag.sendNagMails(NOW + DELAY + 2, again.send)).toEqual({ sent: 1, failed: 0 });
  });
});
