import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";
import { unitTestDbFile } from "./local-db.mjs";

// lib/db.ts väljer databasen när den läses in: pekas ut före importen, så att det
// är enhetstesternas egen databas och aldrig den riktiga
process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { run, get } = await import("./db");
const { BLOCK_SECONDS, MAX_WRONG, WINDOW_SECONDS, beginAttempt, checkLogin, clearAttempt, registerWrong, wrongWait } = await import("./login-block");

const now = Date.UTC(2026, 9, 28);
const clear = async () => {
  await run("DELETE FROM login_attempts");
  await run("DELETE FROM login_blocks");
};
beforeEach(clear);
afterAll(clear);

// Ett fel lösenord: försöket skrivs in, kontrolleras och blir fel
async function wrong(ip: string, ms: number) {
  const attempt = await beginAttempt(ip, ms);
  if (attempt !== null) await registerWrong(ip, ms);
  return attempt !== null;
}

describe("TECH-005-R3 block after wrong passwords", () => {
  test("TECH-005-R3 five wrong passwords are allowed, the sixth wrong one blocks, and then even the right one is refused", async () => {
    for (let i = 1; i <= MAX_WRONG + 1; i++) expect(await wrong("1.2.3.4", now + i * 1000), `attempt ${i}`).toBe(true);
    expect(await beginAttempt("1.2.3.4", now + 7000)).toBeNull();
    expect(await beginAttempt("1.2.3.4", now + 60_000)).toBeNull();
  });

  test("TECH-005-R3 the sixth try may be the right password after five wrong ones", async () => {
    for (let i = 1; i <= MAX_WRONG; i++) await wrong("1.2.3.4", now + i * 1000);
    const sixth = await beginAttempt("1.2.3.4", now + 6000);
    expect(sixth).not.toBeNull();
  });

  test("TECH-005-R3 right passwords are not counted", async () => {
    for (let i = 1; i <= 20; i++) {
      const attempt = await beginAttempt("1.2.3.4", now + i * 1000);
      expect(attempt, `right ${i}`).not.toBeNull();
      await clearAttempt(attempt!);
    }
    expect((await get<{ n: number }>("SELECT COUNT(*) AS n FROM login_attempts"))?.n).toBe(0);
    for (let i = 1; i <= MAX_WRONG; i++) expect(await wrong("1.2.3.4", now + 30_000 + i * 1000)).toBe(true);
  });

  test("TECH-005-R3 the block lasts 20 minutes and then ends", async () => {
    for (let i = 1; i <= MAX_WRONG + 1; i++) await wrong("1.2.3.4", now);
    expect(BLOCK_SECONDS).toBe(20 * 60);
    expect(await beginAttempt("1.2.3.4", now + (BLOCK_SECONDS - 1) * 1000)).toBeNull();
    expect(await beginAttempt("1.2.3.4", now + (BLOCK_SECONDS + 1) * 1000)).not.toBeNull();
  });

  test("TECH-005-R3 wrong passwords older than 15 minutes do not count", async () => {
    for (let i = 1; i <= MAX_WRONG; i++) await wrong("1.2.3.4", now);
    const later = now + (WINDOW_SECONDS + 1) * 1000;
    for (let i = 1; i <= MAX_WRONG; i++) expect(await wrong("1.2.3.4", later + i * 1000)).toBe(true);
    expect((await get<{ n: number }>("SELECT COUNT(*) AS n FROM login_attempts"))?.n).toBe(MAX_WRONG);
  });

  test("TECH-005-R3 another address is not blocked", async () => {
    for (let i = 1; i <= MAX_WRONG + 1; i++) await wrong("1.2.3.4", now);
    expect(await beginAttempt("5.6.7.8", now)).not.toBeNull();
  });

  test("TECH-005-R3 many attempts at once cannot all get past the block", async () => {
    const results = await Promise.all(Array.from({ length: 20 }, () => beginAttempt("1.2.3.4", now)));
    expect(results.filter((id) => id !== null).length).toBeLessThanOrEqual(MAX_WRONG + 1);
    expect(await beginAttempt("1.2.3.4", now + 1000)).toBeNull();
  });
});

describe("TECH-018-R2 the wait after a wrong password", () => {
  test("TECH-018-R2 it is skipped only when the setting is on and the database is a local file", () => {
    expect(wrongWait("1", "file:/tmp/test.db")).toBe(0);
    // Turso (Vercel) or no setting: the wait stays
    expect(wrongWait("1", "libsql://muppbarnen.turso.io")).toBe(1000);
    expect(wrongWait("1", "https://example.invalid")).toBe(1000);
    expect(wrongWait(undefined, "file:/tmp/test.db")).toBe(1000);
    expect(wrongWait("0", "file:/tmp/test.db")).toBe(1000);
  });

  test("TECH-018-R2 MUPP-003-R1 R8 MUPP-009-R1 R5 with the default wait a wrong password is answered only after one second, a right one at once", async () => {
    expect(await checkLogin("1.2.3.4", "rätt", "rätt")).toBe("ok");
    // Bara timern är falsk: databasen svarar på riktigt
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    try {
      let answered = false;
      const answer = checkLogin("1.2.3.5", "fel", "rätt").then((r) => ((answered = true), r));
      while (vi.getTimerCount() === 0) await new Promise((resolve) => setImmediate(resolve));
      await vi.advanceTimersByTimeAsync(999);
      expect(answered).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(await answer).toBe("wrong");
    } finally {
      vi.useRealTimers();
    }
  });
});
