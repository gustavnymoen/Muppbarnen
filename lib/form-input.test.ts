import { describe, expect, test } from "vitest";
import { collect, latestBirthdate, parseBirthdate, parseId, parseLink, parseOccasion, parseText } from "./form-input";

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

  test("MUPP-011-R1 a birthdate is a real date, from 1900 up to ten months ahead", () => {
    const today = new Date("2026-10-29T12:00:00Z");
    expect(parseBirthdate("2020-02-29", today)).toEqual({ ok: true, value: "2020-02-29" });
    for (const good of ["2026-10-29", "2027-03-05", "2027-08-29", "1900-01-01"]) expect(parseBirthdate(good, today).ok, good).toBe(true);
    for (const bad of ["2027-08-30", "2062-01-01", "2021-02-29", "2020-13-01", "2020-1-1", "20200101", "1899-12-31", "", null, undefined, "2020-02-30"]) {
      expect(parseBirthdate(bad, today), String(bad)).toEqual({ ok: false, error: "Skriv ett riktigt datum, högst tio månader fram." });
    }
  });

  test("MUPP-011-R1 the latest birthdate stays in the month at month ends and uses the Swedish date", () => {
    expect(latestBirthdate(new Date("2026-04-30T12:00:00Z"))).toBe("2027-02-28");
    expect(latestBirthdate(new Date("2026-12-31T12:00:00Z"))).toBe("2027-10-31");
    expect(latestBirthdate(new Date("2026-03-31T12:00:00Z"))).toBe("2027-01-31");
    // 23:30 UTC är redan nästa dag i Sverige
    expect(latestBirthdate(new Date("2026-10-28T23:30:00Z"))).toBe("2027-08-29");
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
