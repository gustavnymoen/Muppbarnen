import { describe, expect, test } from "vitest";
import { createSession, passwordMatches, safeTarget, SESSION_SECONDS, siteSecrets, verifySession } from "./site-session";

const secret = "påhittad-nyckel";
const now = Date.UTC(2026, 9, 27);

describe("MUPP-009-R2 the signed cookie", () => {
  test("MUPP-009-R2 a fresh cookie is accepted and lasts 180 days", () => {
    const value = createSession(secret, now);
    expect(value).toMatch(/^\d+\.[0-9a-f]{64}$/);
    expect(Number(value.split(".")[0])).toBe(now / 1000 + SESSION_SECONDS);
    expect(SESSION_SECONDS).toBe(180 * 24 * 60 * 60);
    expect(verifySession(value, secret, now + 179 * 24 * 3600 * 1000)).toBe(true);
  });

  test("MUPP-009-R2 an expired cookie is rejected", () => {
    const value = createSession(secret, now);
    expect(verifySession(value, secret, now + (SESSION_SECONDS + 1) * 1000)).toBe(false);
  });

  test("MUPP-009-R2 a changed cookie is rejected", () => {
    const [expires, signature] = createSession(secret, now).split(".");
    // Längre tid med den gamla signaturen, och en ändrad signatur
    expect(verifySession(`${Number(expires) + 1}.${signature}`, secret, now)).toBe(false);
    expect(verifySession(`${expires}.${signature.replace(/.$/, signature.endsWith("0") ? "1" : "0")}`, secret, now)).toBe(false);
    for (const junk of ["", "abc", `${expires}.`, `${expires}.zz`, `.${signature}`, `${expires}.${signature}.x`]) {
      expect(verifySession(junk, secret, now), junk).toBe(false);
    }
    expect(verifySession(undefined, secret, now)).toBe(false);
  });

  test("MUPP-009-R2 a cookie signed with another secret is rejected, so changing the secret signs everyone out", () => {
    const value = createSession(secret, now);
    expect(verifySession(value, "en-annan-nyckel", now)).toBe(false);
    expect(verifySession(value, undefined, now)).toBe(false);
    expect(verifySession(value, "", now)).toBe(false);
  });
});

describe("MUPP-009-R3 the site is closed without its settings", () => {
  test("MUPP-009-R3 a missing password or secret gives no settings at all", () => {
    expect(siteSecrets({ SITE_PASSWORD: "a", SITE_SESSION_SECRET: "b" })).toEqual({ password: "a", secret: "b" });
    expect(siteSecrets({ SITE_PASSWORD: "a" })).toBeNull();
    expect(siteSecrets({ SITE_SESSION_SECRET: "b" })).toBeNull();
    expect(siteSecrets({ SITE_PASSWORD: "", SITE_SESSION_SECRET: "b" })).toBeNull();
  });
});

describe("MUPP-009-R1 where the sign-in leads", () => {
  test("MUPP-009-R1 addresses on this site are kept", () => {
    expect(safeTarget("/design")).toBe("/design");
    expect(safeTarget("/barn/3?flik=onskelista")).toBe("/barn/3?flik=onskelista");
  });

  test("MUPP-009-R1 anything else goes to the start page", () => {
    for (const target of ["https://evil.se", "//evil.se", "/\\evil.se", "/\t/evil.se", "javascript:alert(1)", "evil", "", undefined, null, 5, "/losenord", "/losenord?till=/"]) {
      expect(safeTarget(target), String(target)).toBe("/");
    }
  });
});

describe("MUPP-009-R5 the password comparison", () => {
  test("MUPP-009-R5 only the exact password matches, whatever its length", () => {
    expect(passwordMatches("hemligt", "hemligt")).toBe(true);
    for (const wrong of ["", "hemlig", "hemligt ", "Hemligt", "hemligt".repeat(1000)]) expect(passwordMatches(wrong, "hemligt"), wrong).toBe(false);
  });
});
