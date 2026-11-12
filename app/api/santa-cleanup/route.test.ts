import { afterAll, describe, expect, test, vi } from "vitest";
import { unitTestDbFile } from "@/lib/local-db.mjs";

// guardWrite läser adressen ur förfrågans rubriker; här är det en fast adress per test
let ip = "10.0.0.1";
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-real-ip": ip }) }));

process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { GET } = await import("./route");
const { run } = await import("@/lib/db");
const { MAX_WRITES } = await import("@/lib/write-limit");

const secret = "påhittad-hemlighet-som-är-minst-32-tecken-lång";
const call = (authorization?: string) => GET(new Request("http://localhost/api/santa-cleanup", { headers: authorization ? { authorization } : {} }));

afterAll(() => {
  delete process.env.CRON_SECRET;
  delete process.env.SANTA_CLEANUP_TODAY;
});

describe("MUPP-044 the cleanup route needs the cron secret", () => {
  test("MUPP-044 without a secret in the environment nobody gets in, not even with an empty header", async () => {
    delete process.env.CRON_SECRET;
    for (const header of [undefined, "", "Bearer ", "Bearer undefined"]) expect((await call(header)).status, String(header)).toBe(401);
  });

  test("MUPP-044 a missing or wrong secret is refused, the right one runs the cleanup", async () => {
    process.env.CRON_SECRET = secret;
    process.env.SANTA_CLEANUP_TODAY = "2099-02-01";
    expect((await call()).status).toBe(401);
    expect((await call("Bearer fel")).status).toBe(401);
    expect((await call(secret)).status).toBe(401);
    await run("UPDATE ss_cleanup SET year = 2098");
    expect(await (await call(`Bearer ${secret}`)).json()).toEqual({ cleaned: expect.any(Number) });
    await run("UPDATE ss_cleanup SET year = CAST(strftime('%Y', 'now') AS INTEGER)");
  });

  test("TECH-024-R3 a secret shorter than 32 characters is refused, even when the caller sends exactly it", async () => {
    process.env.CRON_SECRET = "påhittad-hemlighet";
    expect((await call("Bearer påhittad-hemlighet")).status).toBe(401);
  });

  test("TECH-024-R3 past the write limit the route answers 429 before it looks at the secret", async () => {
    process.env.CRON_SECRET = secret;
    ip = "10.0.0.2";
    for (let n = 0; n < MAX_WRITES; n++) expect((await call("Bearer fel")).status).toBe(401);
    expect((await call(`Bearer ${secret}`)).status).toBe(429);
    expect((await call("Bearer fel")).status).toBe(429);
    await run("DELETE FROM write_requests WHERE ip = ?", [ip]);
  });
});
