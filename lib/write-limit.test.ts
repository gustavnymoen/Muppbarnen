import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { unitTestDbFile } from "./local-db.mjs";

// lib/db.ts väljer databasen när den läses in: pekas ut före importen, så att det
// är enhetstesternas egen databas och aldrig den riktiga
process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { run, get } = await import("./db");
const { MAX_WRITES, WINDOW_SECONDS, registerWrite } = await import("./write-limit");
const { originMatches } = await import("./request-guard");

const now = Date.UTC(2026, 9, 28);
const clear = () => run("DELETE FROM write_requests");
beforeEach(clear);
afterAll(clear);

describe("TECH-005-R2 request limit for writes", () => {
  test("TECH-005-R2 60 writing requests in a minute are allowed and the 61st is refused", async () => {
    expect(MAX_WRITES).toBe(60);
    for (let i = 1; i <= MAX_WRITES; i++) expect(await registerWrite("1.2.3.4", now + i * 10), `request ${i}`).toBe(true);
    expect(await registerWrite("1.2.3.4", now + 900)).toBe(false);
    expect(await registerWrite("1.2.3.4", now + 950)).toBe(false);
  });

  test("TECH-005-R2 another address has its own count", async () => {
    for (let i = 0; i <= MAX_WRITES; i++) await registerWrite("1.2.3.4", now);
    expect(await registerWrite("5.6.7.8", now)).toBe(true);
  });

  test("TECH-005-R2 after a minute the address may write again and old rows are removed", async () => {
    for (let i = 0; i <= MAX_WRITES; i++) await registerWrite("1.2.3.4", now);
    expect(await registerWrite("1.2.3.4", now + (WINDOW_SECONDS + 1) * 1000)).toBe(true);
    expect((await get<{ n: number }>("SELECT COUNT(*) AS n FROM write_requests"))?.n).toBe(1);
  });

  test("TECH-005-R2 many requests at once cannot all get under the limit", async () => {
    const results = await Promise.all(Array.from({ length: MAX_WRITES + 20 }, () => registerWrite("1.2.3.4", now)));
    expect(results.filter(Boolean).length).toBeLessThanOrEqual(MAX_WRITES);
  });
});

describe("TECH-005-R4 the origin of a writing request", () => {
  test("TECH-005-R4 the site's own origin and a request without Origin are accepted", () => {
    expect(originMatches("https://muppbarnen.vercel.app", "muppbarnen.vercel.app")).toBe(true);
    expect(originMatches("http://localhost:3100", "localhost:3100")).toBe(true);
    expect(originMatches(null, "muppbarnen.vercel.app")).toBe(true);
  });

  test("TECH-005-R4 another site, a sub-domain, another port and a broken Origin are refused", () => {
    expect(originMatches("https://evil.example", "muppbarnen.vercel.app")).toBe(false);
    expect(originMatches("https://muppbarnen.vercel.app.evil.example", "muppbarnen.vercel.app")).toBe(false);
    expect(originMatches("https://a.muppbarnen.vercel.app", "muppbarnen.vercel.app")).toBe(false);
    expect(originMatches("http://localhost:3000", "localhost:3100")).toBe(false);
    expect(originMatches("null", "muppbarnen.vercel.app")).toBe(false);
    expect(originMatches("https://muppbarnen.vercel.app", null)).toBe(false);
  });
});
