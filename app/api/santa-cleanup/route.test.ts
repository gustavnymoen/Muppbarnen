import { afterAll, describe, expect, test } from "vitest";
import { unitTestDbFile } from "@/lib/local-db.mjs";

process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { GET } = await import("./route");
const { run } = await import("@/lib/db");

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
    process.env.CRON_SECRET = "påhittad-hemlighet";
    process.env.SANTA_CLEANUP_TODAY = "2099-02-01";
    expect((await call()).status).toBe(401);
    expect((await call("Bearer fel")).status).toBe(401);
    expect((await call("påhittad-hemlighet")).status).toBe(401);
    await run("UPDATE ss_cleanup SET year = 2098");
    expect(await (await call("Bearer påhittad-hemlighet")).json()).toEqual({ cleaned: expect.any(Number) });
    await run("UPDATE ss_cleanup SET year = CAST(strftime('%Y', 'now') AS INTEGER)");
  });
});
