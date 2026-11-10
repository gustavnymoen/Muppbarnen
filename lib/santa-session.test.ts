import { createHmac } from "node:crypto";
import { describe, expect, test } from "vitest";
import { createSantaSession, verifySantaSession } from "./santa-session";

const secret = "en-hemlig-nyckel-för-testet";

describe("MUPP-039-R5 the Secret Santa cookie", () => {
  test("MUPP-039-R5 holds only the member id, the cleanup year and a signature, and gives the id and year back", () => {
    const value = createSantaSession(secret, 42, 2026);
    expect(value).toMatch(/^42\.2026\.[0-9a-f]{64}$/);
    expect(verifySantaSession(value, secret)).toEqual({ memberId: 42, cleanupYear: 2026 });
  });

  test("MUPP-044-R4 the year is signed: another year or a cookie from before the year was added is not accepted", () => {
    const signature = createSantaSession(secret, 42, 2026).split(".")[2];
    expect(verifySantaSession(`42.2027.${signature}`, secret)).toBeNull();
    expect(verifySantaSession(`42.${signature}`, secret)).toBeNull();
  });

  test("MUPP-039-R5 R6 another member's id, another key or a malformed value is not accepted", () => {
    const value = createSantaSession(secret, 42, 2026);
    const signature = value.split(".")[2];
    expect(verifySantaSession(`43.2026.${signature}`, secret)).toBeNull();
    expect(verifySantaSession(value, "en-annan-nyckel")).toBeNull();
    expect(verifySantaSession(value, undefined)).toBeNull();
    for (const bad of [undefined, "", "42", "42.", `42.2026.${signature.slice(1)}`, `-1.2026.${signature}`, `42.2026.${signature}.x`]) {
      expect(verifySantaSession(bad, secret)).toBeNull();
    }
  });

  test("MUPP-048-R5 a cookie signed before the events (for a person id) is not accepted as a member id", () => {
    const old = createHmac("sha256", secret).update("santa.42").digest("hex");
    expect(verifySantaSession(`42.2026.${old}`, secret)).toBeNull();
  });

  test("MUPP-039-R5 a signature of the admin or site cookie kind does not fit", async () => {
    const { createAdminSession } = await import("./admin-session");
    const admin = createAdminSession(secret, 42, 42);
    expect(verifySantaSession(`42.2026.${admin.split(".")[2]}`, secret)).toBeNull();
  });
});
