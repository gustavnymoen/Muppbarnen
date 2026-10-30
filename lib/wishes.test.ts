import { describe, expect, test } from "vitest";
import type { Wish } from "./deck";
import { canClaim, sortWishes, webLink } from "./wishes";

// Påhittade önskningar
const wish = (id: number, extra: Partial<Wish> = {}): Wish => ({ id, title: `Önskan ${id}`, description: "", size: "", url: "", unlimited: false, claimedBy: null, claimedAt: null, ...extra });
const claimed = { claimedBy: "Moster", claimedAt: "2026-10-30" };

describe("MUPP-005-R1 the order of the rows", () => {
  test("MUPP-005-R1 claimed wishes come last and the others keep their order", () => {
    const sorted = sortWishes([wish(1, claimed), wish(2), wish(3, claimed), wish(4, { unlimited: true }), wish(5)]);
    expect(sorted.map((w) => w.id)).toEqual([2, 4, 5, 1, 3]);
  });

  test("MUPP-005-R1 sorting does not change the list it is given", () => {
    const list = [wish(1, claimed), wish(2)];
    sortWishes(list);
    expect(list.map((w) => w.id)).toEqual([1, 2]);
  });
});

describe("MUPP-005-R3 what can be marked", () => {
  test("MUPP-005-R3 only a wish that is neither claimed nor unlimited", () => {
    expect(canClaim(wish(1))).toBe(true);
    expect(canClaim(wish(2, claimed))).toBe(false);
    expect(canClaim(wish(3, { unlimited: true }))).toBe(false);
  });
});

describe("MUPP-005-R2 the link", () => {
  test("MUPP-005-R2 only http and https are links", () => {
    expect(webLink("https://example.com/cykel")).toBe("https://example.com/cykel");
    expect(webLink("http://example.com")).toBe("http://example.com");
    for (const bad of ["javascript:alert(1)", "data:text/html,hej", "ftp://example.com", "example.com", "", "//example.com"]) expect(webLink(bad), bad).toBeNull();
  });
});
