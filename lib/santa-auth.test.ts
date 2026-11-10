import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";
import { unitTestDbFile } from "./local-db.mjs";

// lib/db.ts väljer databasen när den läses in: enhetstesternas egen, aldrig den riktiga
process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { get, run } = await import("./db");
const { MAX_WRONG } = await import("./login-block");
const { checkSantaSignIn, contactMatches, entranceEvents, entranceMembers, findMember, normalizePhone } = await import("./santa-auth");

const clear = async () => {
  await run("DELETE FROM ss_member");
  await run("DELETE FROM ss_event");
  await run("DELETE FROM parent");
  await run("DELETE FROM login_attempts");
  await run("DELETE FROM login_blocks");
};
beforeEach(clear);
afterAll(clear);

// Påhittade uppgifter
const saved = { phone: "0701234567", email: "Anna.Test@Exempel.invalid" };
async function newEvent(name = "Testgruppen") {
  const owner = (await run("INSERT INTO parent (name) VALUES ('Förälder')")).lastId;
  return (await run("INSERT INTO ss_event (owner_id, name) VALUES (?, ?)", [owner, name])).lastId;
}
async function member(name: string, phone: string, event?: number) {
  const eventId = event ?? (await newEvent());
  const id = (await run("INSERT INTO ss_member (event_id, name, phone, email) VALUES (?, ?, ?, ?)", [eventId, name, phone, saved.email])).lastId;
  return { event: eventId, member: id };
}

describe("MUPP-039-R4 matching of phone and email", () => {
  test("MUPP-039-R4 a phone matches with spaces, dashes and +46 read as a leading 0", () => {
    for (const typed of ["0701234567", "070-123 45 67", " 070 123 45 67 ", "+46701234567", "+46 70-123 45 67"]) {
      expect(contactMatches("phone", typed, saved), typed).toBe(true);
    }
    expect(normalizePhone("(070) 123 45 67")).toBe("0701234567");
  });

  test("MUPP-039-R4 another number, letters or nothing do not match a phone", () => {
    for (const typed of ["0701234568", "070123456", "+4670123456", "07012345a7", "", "anna.test@exempel.invalid"]) {
      expect(contactMatches("phone", typed, saved), typed).toBe(false);
    }
  });

  test("MUPP-039-R4 an email matches ignoring case and outer spaces, and only an email", () => {
    expect(contactMatches("email", "anna.test@exempel.invalid", saved)).toBe(true);
    expect(contactMatches("email", "  ANNA.TEST@EXEMPEL.INVALID ", saved)).toBe(true);
    for (const typed of ["", " ", "anna@exempel.invalid", "0701234567"]) expect(contactMatches("email", typed, saved), typed).toBe(false);
  });
});

describe("MUPP-039-R3 R4 what visitors read and the sign-in check", () => {
  test("MUPP-039-R3 the entrance reads names only", async () => {
    const { event, member: id } = await member("Anna", saved.phone);
    expect(await entranceEvents()).toEqual([{ id: event, name: "Testgruppen" }]);
    const members = await entranceMembers(event);
    expect(members).toEqual([{ memberId: id, name: "Anna" }]);
    expect(JSON.stringify(members)).not.toContain(saved.phone);
  });

  test("MUPP-048-R4 R5 the names of an event are only its own members, also when the same person is in two events", async () => {
    const a = await member("Anna", saved.phone);
    const b = await member("Anna", saved.phone, (await newEvent("Annan grupp")));
    await member("Bo", "0707777777", a.event);
    expect((await entranceEvents()).map((e) => e.name)).toEqual(["Annan grupp", "Testgruppen"]);
    expect((await entranceMembers(a.event)).map((m) => m.name)).toEqual(["Anna", "Bo"]);
    expect(await entranceMembers(b.event)).toEqual([{ memberId: b.member, name: "Anna" }]);
    // Samma uppgifter i två grupper: inloggningen gäller bara den medlem som valts
    expect(await checkSantaSignIn("1.1.1.6", { memberId: String(b.member), kind: "phone", value: saved.phone }, 0)).toEqual({ result: "ok", memberId: b.member });
    expect(await findMember(b.member)).toEqual({ id: b.member, name: "Anna", eventId: b.event, eventName: "Annan grupp", status: "inactive" });
  });

  test("MUPP-039-R4 the right value signs in, a wrong one does not and says nothing about which part", async () => {
    const { member: person } = await member("Anna", saved.phone);
    expect(await checkSantaSignIn("1.1.1.1", { memberId: String(person), kind: "phone", value: "070-123 45 67" }, 0)).toEqual({ result: "ok", memberId: person });
    expect(await checkSantaSignIn("1.1.1.1", { memberId: String(person), kind: "email", value: saved.email.toUpperCase() }, 0)).toEqual({ result: "ok", memberId: person });
    for (const input of [
      { memberId: String(person), kind: "phone", value: "0709999999" },
      { memberId: String(person + 1), kind: "phone", value: saved.phone },
      { memberId: "abc", kind: "phone", value: saved.phone },
      { memberId: String(person), kind: "annat", value: saved.phone },
      { memberId: String(person), kind: "phone", value: 123 },
    ]) {
      expect(await checkSantaSignIn("1.1.1.2", input, 0)).toEqual({ result: "wrong" });
    }
  });

  test("MUPP-039-R4 repeated wrong tries block the address like the other sign-ins, and a right one is not counted", async () => {
    const { member: person } = await member("Anna", saved.phone);
    const right = { memberId: String(person), kind: "phone", value: saved.phone };
    const wrong = { ...right, value: "0700000000" };
    for (let i = 0; i < MAX_WRONG * 2; i++) await checkSantaSignIn("1.1.1.3", right, 0);
    for (let i = 0; i <= MAX_WRONG; i++) expect((await checkSantaSignIn("1.1.1.3", wrong, 0)).result).toBe("wrong");
    expect(await checkSantaSignIn("1.1.1.3", right, 0)).toEqual({ result: "blocked" });
    expect(await checkSantaSignIn("1.1.1.4", right, 0)).toEqual({ result: "ok", memberId: person });
  });
});

describe("MUPP-060-R3 a changed phone and email", () => {
  test("MUPP-060-R3 the old phone no longer signs in, the new one does, and the member id the cookie holds still reads as the member", async () => {
    const { event, member: id } = await member("Anna", "0701234567");
    await run("UPDATE ss_member SET phone = '0709999999', email = 'ny@exempel.invalid' WHERE id = ?", [id]);
    expect(await checkSantaSignIn("1.1.1.1", { memberId: String(id), kind: "phone", value: "0701234567" }, 0)).toEqual({ result: "wrong" });
    expect(await checkSantaSignIn("1.1.1.2", { memberId: String(id), kind: "email", value: saved.email }, 0)).toEqual({ result: "wrong" });
    expect(await checkSantaSignIn("1.1.1.3", { memberId: String(id), kind: "phone", value: "070-999 99 99" }, 0)).toEqual({ result: "ok", memberId: id });
    expect(await findMember(id)).toMatchObject({ id, name: "Anna", eventId: event });
  });
});

describe("TECH-018-R2 the wait after a wrong Secret Santa sign-in", () => {
  test("TECH-018-R2 with the default wait a wrong try is answered only after one second, and still counts", async () => {
    const { member: person } = await member("Anna", saved.phone);
    // Bara timern är falsk: databasen svarar på riktigt
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    try {
      let answered = false;
      const answer = checkSantaSignIn("1.1.1.5", { memberId: String(person), kind: "phone", value: "0700000000" }).then((r) => ((answered = true), r));
      // Databasen svarar på riktigt (setImmediate är inte falsk); sedan väntar försöket på sin timer
      while (vi.getTimerCount() === 0) await new Promise((resolve) => setImmediate(resolve));
      expect(answered).toBe(false);
      await vi.advanceTimersByTimeAsync(999);
      expect(answered).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(await answer).toEqual({ result: "wrong" });
      expect((await get<{ n: number }>("SELECT COUNT(*) AS n FROM login_attempts WHERE ip = '1.1.1.5'"))?.n).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
