import { describe, expect, test } from "vitest";
import { createSantaSession, verifySantaSession } from "./santa-session";

const secret = "en-hemlig-nyckel-för-testet";

describe("MUPP-039-R5 the Secret Santa cookie", () => {
  test("MUPP-039-R5 holds only the person id and a signature, and gives the id back", () => {
    const value = createSantaSession(secret, 42);
    expect(value).toMatch(/^42\.[0-9a-f]{64}$/);
    expect(verifySantaSession(value, secret)).toBe(42);
  });

  test("MUPP-039-R5 R6 another person's id, another key or a malformed value is not accepted", () => {
    const value = createSantaSession(secret, 42);
    const signature = value.split(".")[1];
    expect(verifySantaSession(`43.${signature}`, secret)).toBeNull();
    expect(verifySantaSession(value, "en-annan-nyckel")).toBeNull();
    expect(verifySantaSession(value, undefined)).toBeNull();
    for (const bad of [undefined, "", "42", "42.", `42.${signature.slice(1)}`, `-1.${signature}`, `42.${signature}.x`]) {
      expect(verifySantaSession(bad, secret)).toBeNull();
    }
  });

  test("MUPP-039-R5 a signature of the admin or site cookie kind does not fit", async () => {
    const { createAdminSession } = await import("./admin-session");
    const admin = createAdminSession(secret, 42, 42);
    expect(verifySantaSession(`42.${admin.split(".")[2]}`, secret)).toBeNull();
  });
});
