import { describe, expect, test } from "vitest";
import { ONBOARDING_SECONDS, onboardingCookieOptions } from "./onboarding";

describe("MUPP-035-R7 the onboarding cookie", () => {
  test("MUPP-035-R7 it is HttpOnly and Secure for the whole site and lasts one year, with no Domain", () => {
    const options = onboardingCookieOptions(true);
    expect(options).toMatchObject({ httpOnly: true, secure: true, path: "/", maxAge: 365 * 24 * 60 * 60 });
    expect(ONBOARDING_SECONDS).toBe(31_536_000);
    expect(options).not.toHaveProperty("domain");
  });
});
