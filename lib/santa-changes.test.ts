import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { unitTestDbFile } from "./local-db.mjs";

// lib/db.ts väljer databasen när den läses in: enhetstesternas egen, aldrig den riktiga
process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { run, get } = await import("./db");
const changes = await import("./santa-changes");
const wishes = await import("./santa-wishes");
const santa = await import("./santa");
const { listChangedMail } = await import("./santa-mail");

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

const HOUR = changes.MAIL_INTERVAL_MS;
const thisYear = new Date().getFullYear();
let counter = 0;
// En startad grupp där Anna ger till Bo och Bo till Anna
async function started(status = "started") {
  const event = (await run("INSERT INTO ss_event (owner_id, name, status) VALUES (?, ?, ?)", [ownerId, `Grupp ${++counter}`, status])).lastId;
  const member = async (name: string) => (await run("INSERT INTO ss_member (event_id, name, phone, email) VALUES (?, ?, ?, ?)", [event, name, `070003${String(++counter).padStart(4, "0")}`, `${name.toLowerCase()}@exempel.se`])).lastId;
  const [anna, bo] = [await member("Anna"), await member("Bo")];
  await run("INSERT INTO ss_draw (event_id, year, giver_id, receiver_id) VALUES (?, ?, ?, ?), (?, ?, ?, ?)", [event, thisYear, anna, bo, event, thisYear, bo, anna]);
  return { event, anna, bo };
}
const sink = () => {
  const sent: { to: string; subject: string; text: string }[] = [];
  return { sent, send: async (to: string, mail: { subject: string; text: string }) => (to.startsWith("fel@") ? { ok: false } : (sent.push({ to, ...mail }), { ok: true })) };
};
const add = (memberId: number, title = "Bok") => wishes.saveWish(memberId, { title, size: "", description: "", url: "" });
const pending = async (memberId: number) => (await get<{ list_changed_at: number | null }>("SELECT list_changed_at FROM ss_member WHERE id = ?", [memberId]))!.list_changed_at;

describe("MUPP-042-R3 changes are marked only after the draw", () => {
  test("MUPP-042-R3 adding, editing and removing a wish in a started event marks the list; a failed save does not", async () => {
    const { bo } = await started();
    expect(await add(bo, "")).toMatchObject({ ok: false });
    expect(await pending(bo)).toBeNull();
    for (const step of [() => add(bo), async () => wishes.saveWish(bo, { wishId: String((await get<{ id: number }>("SELECT id FROM ss_wish"))!.id), title: "Ny", size: "", description: "", url: "" }), async () => wishes.removeWish(bo, String((await get<{ id: number }>("SELECT id FROM ss_wish"))!.id))]) {
      await run("UPDATE ss_member SET list_changed_at = NULL");
      expect(await step()).toEqual({ ok: true });
      expect(await pending(bo)).not.toBeNull();
    }
  });

  test("MUPP-042-R3 a change while the event is preparing is not marked, and no mail follows", async () => {
    const { bo } = await started("preparing");
    expect(await add(bo)).toEqual({ ok: true });
    expect(await pending(bo)).toBeNull();
    const { sent, send } = sink();
    expect(await changes.sendListChangeMails(Date.now(), send)).toEqual({ sent: 0, failed: 0 });
    expect(sent).toEqual([]);
  });

  test("MUPP-042-R3 starting and stopping the draw drops what was waiting for the old draw", async () => {
    const { event, bo } = await started("preparing");
    await run("UPDATE ss_member SET list_changed_at = 5, list_mailed_at = 6 WHERE id = ?", [bo]);
    await run("DELETE FROM ss_draw");
    const member = { id: ownerId, name: "Chef", isMasterAdmin: true };
    expect(await santa.startDraw(member, String(event))).toMatchObject({ ok: true });
    expect(await get("SELECT 1 FROM ss_member WHERE list_changed_at IS NOT NULL OR list_mailed_at IS NOT NULL")).toBeUndefined();
    await add(bo);
    expect(await pending(bo)).not.toBeNull();
    expect(await santa.stopDraw(member, String(event))).toMatchObject({ ok: true });
    expect(await pending(bo)).toBeNull();
  });
});

describe("MUPP-042-R3 the mail to the giver, collected once an hour", () => {
  test("MUPP-042-R3 one change gives one mail to the giver, naming the event and nobody else", async () => {
    const { bo } = await started();
    await add(bo);
    const { sent, send } = sink();
    expect(await changes.sendListChangeMails(Date.now(), send)).toEqual({ sent: 1, failed: 0 });
    expect(sent).toHaveLength(1);
    const group = sent[0].subject.slice("Secret Santa: ".length).split(" – ")[0];
    expect(sent[0]).toEqual({ to: "anna@exempel.se", ...listChangedMail(group) });
    expect(group).toMatch(/^Grupp \d+$/);
    expect(JSON.stringify(sent)).not.toMatch(/Bo\b|Bok/);
  });

  test("MUPP-042-R3 many changes within the hour give one mail, and the next one only an hour after it", async () => {
    const { bo } = await started();
    const { sent, send } = sink();
    const t0 = Date.now();
    for (const title of ["A", "B", "C"]) await add(bo, title);
    await changes.sendListChangeMails(t0, send);
    // Fler ändringar direkt efter: väntar, och ingen går förlorad
    await add(bo, "D");
    await add(bo, "E");
    expect(await changes.sendListChangeMails(t0 + 10 * 60 * 1000, send)).toEqual({ sent: 0, failed: 0 });
    expect(await changes.sendListChangeMails(t0 + HOUR - 1000, send)).toEqual({ sent: 0, failed: 0 });
    expect(await pending(bo)).not.toBeNull();
    expect(await changes.sendListChangeMails(Date.now() + HOUR + 1000, send)).toEqual({ sent: 1, failed: 0 });
    expect(sent).toHaveLength(2);
    expect(await pending(bo)).toBeNull();
  });

  test("MUPP-042-R3 no change since the last mail gives no mail, however often the job runs", async () => {
    const { bo } = await started();
    const { sent, send } = sink();
    await add(bo);
    await changes.sendListChangeMails(Date.now(), send);
    for (let i = 1; i <= 3; i++) await changes.sendListChangeMails(Date.now() + i * 2 * HOUR, send);
    expect(sent).toHaveLength(1);
    expect(await changes.sendListChangeMails(Date.now(), send)).toEqual({ sent: 0, failed: 0 });
  });

  test("MUPP-042-R3 each receiver who changed their list gets their own giver a mail", async () => {
    const { anna, bo } = await started();
    await add(anna);
    await add(bo);
    const { sent, send } = sink();
    expect(await changes.sendListChangeMails(Date.now(), send)).toEqual({ sent: 2, failed: 0 });
    expect(sent.map((m) => m.to).sort()).toEqual(["anna@exempel.se", "bo@exempel.se"]);
  });

  test("MUPP-042-R3 a mail that cannot be sent is tried again by the next run, and does not stop the others", async () => {
    const { anna, bo } = await started();
    await run("UPDATE ss_member SET email = 'fel@exempel.se' WHERE id = ?", [anna]);
    await add(bo);
    await add(anna);
    const { sent, send } = sink();
    expect(await changes.sendListChangeMails(Date.now(), send)).toEqual({ sent: 1, failed: 1 });
    expect(sent.map((m) => m.to)).toEqual(["bo@exempel.se"]);
    expect(await pending(bo)).not.toBeNull();
    await run("UPDATE ss_member SET email = 'anna@exempel.se' WHERE id = ?", [anna]);
    expect(await changes.sendListChangeMails(Date.now(), send)).toEqual({ sent: 1, failed: 0 });
  });

  test("MUPP-042-R3 a sender that throws counts as a failed mail and the mark is put back", async () => {
    const { bo } = await started();
    await add(bo);
    expect(await changes.sendListChangeMails(Date.now(), async () => Promise.reject(new Error("nere")))).toEqual({ sent: 0, failed: 1 });
    expect(await pending(bo)).not.toBeNull();
  });

  test("MUPP-042-R3 two runs at the same time send one mail: the mark is taken before sending", async () => {
    const { bo } = await started();
    await add(bo);
    const { sent, send } = sink();
    await Promise.all([changes.sendListChangeMails(Date.now(), send), changes.sendListChangeMails(Date.now(), send)]);
    expect(sent).toHaveLength(1);
  });

  test("MUPP-042-R3 nothing is sent for an event that is no longer started", async () => {
    const { event, bo } = await started();
    await add(bo);
    await run("UPDATE ss_event SET status = 'preparing' WHERE id = ?", [event]);
    const { sent, send } = sink();
    expect(await changes.sendListChangeMails(Date.now(), send)).toEqual({ sent: 0, failed: 0 });
    expect(sent).toEqual([]);
  });
});
