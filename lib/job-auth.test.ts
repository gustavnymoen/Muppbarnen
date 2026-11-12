import { describe, expect, test } from "vitest";
import { jobAuthorized } from "./job-auth";

const secret = "a".repeat(32);

describe("MUPP-042-R3 the job's secret", () => {
  test("MUPP-042-R3 only the exact secret as a Bearer token is accepted", () => {
    expect(jobAuthorized(`Bearer ${secret}`, secret)).toBe(true);
    for (const header of [null, "", secret, `bearer ${secret}`, `Bearer ${secret}x`, `Bearer ${secret.slice(1)}`, "Bearer ", `Basic ${secret}`]) expect(jobAuthorized(header, secret), String(header)).toBe(false);
  });

  test("MUPP-042-R3 without a secret, or with a short one, the job is closed for everyone, also for an empty token", () => {
    for (const short of [undefined, "", "kort"]) {
      expect(jobAuthorized(`Bearer ${short ?? ""}`, short)).toBe(false);
      expect(jobAuthorized("Bearer ", short)).toBe(false);
    }
  });
});
