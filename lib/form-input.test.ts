import { describe, expect, test } from "vitest";
import { collect, parseBirthdate, parseId, parseLink, parseOccasion, parseText } from "./form-input";

describe("MUPP-003-R7 input is checked on the server", () => {
  test("MUPP-003-R7 ids are positive integers written with digits and nothing else", () => {
    expect(parseId("12")).toBe(12);
    for (const bad of ["0", "-1", "1.5", "1e3", " 4", "abc", "", "1; DROP TABLE child", null, undefined, 3, ["1"]]) expect(parseId(bad), String(bad)).toBeNull();
  });

  test("MUPP-003-R7 the occasion is one of two values", () => {
    expect(parseOccasion("birthday")).toBe("birthday");
    expect(parseOccasion("christmas")).toBe("christmas");
    for (const bad of ["easter", "", null, undefined, "Birthday"]) expect(parseOccasion(bad)).toBeNull();
  });

  test("MUPP-003-R7 text is a string of limited length, trimmed, counted in characters", () => {
    expect(parseText("  Lego  ", 40)).toEqual({ ok: true, value: "Lego" });
    expect(parseText("", 40)).toEqual({ ok: true, value: "" });
    expect(parseText("", 40, true).ok).toBe(false);
    expect(parseText("   ", 40, true).ok).toBe(false);
    expect(parseText("a".repeat(40), 40).ok).toBe(true);
    expect(parseText("a".repeat(41), 40)).toEqual({ ok: false, error: "Högst 40 tecken." });
    // 20 tecken, 40 UTF-16-enheter: tecken räknas som i databasen
    expect(parseText("😀".repeat(40), 40).ok).toBe(true);
    for (const bad of [null, undefined, 5, ["a"], { a: 1 }]) expect(parseText(bad, 40).ok).toBe(false);
    expect(parseText("a\u0000b", 40).ok).toBe(false);
    expect(parseText("två\nrader", 40).ok).toBe(true);
  });

  test("MUPP-003-R5 a birthdate is a real date, not in the future", () => {
    const today = new Date("2026-10-28T12:00:00Z");
    expect(parseBirthdate("2020-02-29", today)).toEqual({ ok: true, value: "2020-02-29" });
    expect(parseBirthdate("2026-10-28", today).ok).toBe(true);
    for (const bad of ["2026-10-29", "2021-02-29", "2020-13-01", "2020-1-1", "20200101", "1899-12-31", "", null, undefined, "2020-02-30"]) {
      expect(parseBirthdate(bad, today).ok, String(bad)).toBe(false);
    }
  });

  test("MUPP-003-R4 a link is empty or starts with http:// or https://", () => {
    expect(parseLink("https://exempel.se/lego?x=1")).toEqual({ ok: true, value: "https://exempel.se/lego?x=1" });
    expect(parseLink("http://exempel.se").ok).toBe(true);
    expect(parseLink("")).toEqual({ ok: true, value: "" });
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "ftp://exempel.se", "exempel.se", "//exempel.se", "https://" + "a".repeat(500)]) {
      expect(parseLink(bad).ok, bad).toBe(false);
    }
  });

  test("MUPP-003-R7 collect gives the values, or the errors by field", () => {
    expect(collect({ a: parseText("x", 5), b: parseText("y", 5) })).toEqual({ ok: true, values: { a: "x", b: "y" } });
    const bad = collect({ a: parseText("", 5, true), b: parseText("y", 5), c: parseLink("nej") });
    expect(bad).toEqual({ ok: false, errors: { a: "Fyll i det här fältet.", c: "Länken måste börja med http:// eller https://." } });
  });
});
