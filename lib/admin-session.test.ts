import { describe, expect, test } from "vitest";
import { ADMIN_SESSION_SECONDS, adminSecrets, createAdminSession, verifyAdminSession } from "./admin-session";

const secret = "påhittad-adminnyckel";
const now = Date.UTC(2026, 9, 28);

describe("MUPP-003-R1 the signed admin cookie", () => {
  test("MUPP-003-R1 a fresh cookie is accepted, holds the chosen parent and lasts 8 hours", () => {
    const value = createAdminSession(secret, 7, now / 1000 + ADMIN_SESSION_SECONDS);
    expect(value).toMatch(/^\d+\.7\.[0-9a-f]{64}$/);
    expect(ADMIN_SESSION_SECONDS).toBe(8 * 60 * 60);
    expect(verifyAdminSession(value, secret, now + 7 * 3600 * 1000)).toEqual({ expires: now / 1000 + ADMIN_SESSION_SECONDS, parentId: 7 });
  });

  test("MUPP-003-R1 a cookie is rejected after 8 hours", () => {
    const value = createAdminSession(secret, 0, now / 1000 + ADMIN_SESSION_SECONDS);
    expect(verifyAdminSession(value, secret, now + (ADMIN_SESSION_SECONDS + 1) * 1000)).toBeNull();
  });

  test("MUPP-003-R1 a changed cookie is rejected: another parent, a longer time or a changed signature", () => {
    const [expires, parent, signature] = createAdminSession(secret, 3, now / 1000 + ADMIN_SESSION_SECONDS).split(".");
    expect(verifyAdminSession(`${expires}.1.${signature}`, secret, now)).toBeNull();
    expect(verifyAdminSession(`${Number(expires) + 1}.${parent}.${signature}`, secret, now)).toBeNull();
    expect(verifyAdminSession(`${expires}.${parent}.${signature.replace(/.$/, signature.endsWith("0") ? "1" : "0")}`, secret, now)).toBeNull();
  });

  test("MUPP-003-R1 a cookie signed with another secret, junk or a missing value or secret is rejected", () => {
    const value = createAdminSession("en-annan-nyckel", 0, now / 1000 + 60);
    expect(verifyAdminSession(value, secret, now)).toBeNull();
    expect(verifyAdminSession("skräp", secret, now)).toBeNull();
    expect(verifyAdminSession(undefined, secret, now)).toBeNull();
    expect(verifyAdminSession(createAdminSession(secret, 0, now / 1000 + 60), undefined, now)).toBeNull();
  });

  test("MUPP-003-R1 a missing password or secret closes admin", () => {
    expect(adminSecrets({ ADMIN_PASSWORD: "a", ADMIN_SESSION_SECRET: "b" })).toEqual({ password: "a", secret: "b" });
    expect(adminSecrets({ ADMIN_PASSWORD: "a" })).toBeNull();
    expect(adminSecrets({ ADMIN_SESSION_SECRET: "b" })).toBeNull();
    expect(adminSecrets({ ADMIN_PASSWORD: "", ADMIN_SESSION_SECRET: "b" })).toBeNull();
  });
});
