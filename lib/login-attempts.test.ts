import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { unitTestDbFile } from "./local-db.mjs";

// lib/db.ts väljer databasen när den läses in: pekas ut före importen, så att det
// är enhetstesternas egen databas och aldrig den riktiga
process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { run, get } = await import("./db");
const { MAX_ATTEMPTS, WINDOW_SECONDS, registerAttempt } = await import("./login-attempts");

const now = Date.UTC(2026, 9, 27);
const clear = () => run("DELETE FROM login_attempts");
beforeEach(clear);
afterAll(clear);

describe("MUPP-009-R5 limited attempts", () => {
  test("MUPP-009-R5 five attempts in 15 minutes are allowed and the sixth is refused", async () => {
    for (let i = 1; i <= MAX_ATTEMPTS; i++) expect(await registerAttempt("1.2.3.4", now + i * 1000), `attempt ${i}`).toBe(true);
    expect(await registerAttempt("1.2.3.4", now + 6000)).toBe(false);
    expect(await registerAttempt("1.2.3.4", now + 7000)).toBe(false);
  });

  test("MUPP-009-R5 another address has its own count", async () => {
    for (let i = 0; i <= MAX_ATTEMPTS; i++) await registerAttempt("1.2.3.4", now);
    expect(await registerAttempt("5.6.7.8", now)).toBe(true);
  });

  test("MUPP-009-R5 after 15 minutes the address may try again and old attempts are removed", async () => {
    for (let i = 0; i <= MAX_ATTEMPTS; i++) await registerAttempt("1.2.3.4", now);
    expect(await registerAttempt("1.2.3.4", now + (WINDOW_SECONDS + 1) * 1000)).toBe(true);
    expect((await get<{ n: number }>("SELECT COUNT(*) AS n FROM login_attempts"))?.n).toBe(1);
  });
});
