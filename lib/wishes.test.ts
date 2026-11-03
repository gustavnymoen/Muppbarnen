import { describe, expect, test } from "vitest";
import type { Wish } from "./deck";
import { canClaim, canUnclaim, isLongTitle, sortWishes, webLink } from "./wishes";

// Påhittade önskningar
const wish = (id: number, extra: Partial<Wish> = {}): Wish => ({ id, title: `Önskan ${id}`, description: "", size: "", url: "", unlimited: false, claimedBy: null, claimedAt: null, ...extra });
const claimed = { claimedBy: "Moster", claimedAt: "2026-10-30" };

describe("MUPP-019-R2 the order of the rows", () => {
  test("MUPP-019-R2 claimable first, then unlimited, then claimed, each group in its own order", () => {
    const sorted = sortWishes([wish(1, claimed), wish(2, { unlimited: true }), wish(3), wish(4, claimed), wish(5, { unlimited: true }), wish(6)]);
    expect(sorted.map((w) => w.id)).toEqual([3, 6, 2, 5, 1, 4]);
  });

  test("MUPP-019-R2 a claimed unlimited wish counts as claimed", () => {
    expect(sortWishes([wish(1, { ...claimed, unlimited: true }), wish(2, { unlimited: true })]).map((w) => w.id)).toEqual([2, 1]);
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

describe("MUPP-006-R1 which rows get the undo button", () => {
  test("MUPP-006-R1 only a claimed wish that is not unlimited", () => {
    expect(canUnclaim(wish(1, claimed))).toBe(true);
    expect(canUnclaim(wish(2))).toBe(false);
    expect(canUnclaim(wish(3, { ...claimed, unlimited: true }))).toBe(false);
  });
});

describe("MUPP-005-R2 the link", () => {
  test("MUPP-005-R2 only http and https are links", () => {
    expect(webLink("https://example.com/cykel")).toBe("https://example.com/cykel");
    expect(webLink("http://example.com")).toBe("http://example.com");
    for (const bad of ["javascript:alert(1)", "data:text/html,hej", "ftp://example.com", "example.com", "", "//example.com"]) expect(webLink(bad), bad).toBeNull();
  });
});

describe("MUPP-023-R2 a long title", () => {
  test("MUPP-023-R2 a title over 24 characters is long, a shorter one is not", () => {
    expect(isLongTitle("a".repeat(24))).toBe(false);
    expect(isLongTitle("a".repeat(25))).toBe(true);
    expect(isLongTitle("")).toBe(false);
  });
});
