import { describe, expect, test } from "vitest";
import { CHILD_COLORS, childColor } from "./child-colors";

describe("MUPP-001-R6 child colours", () => {
  test("MUPP-001-R6 the same number gives the same colour", () => {
    expect(childColor(2)).toBe(childColor(2));
  });

  test("MUPP-001-R6 numbers 0 to 5 give six different colours, and larger numbers repeat in order", () => {
    const first = [0, 1, 2, 3, 4, 5].map(childColor);
    expect(new Set(first).size).toBe(6);
    expect(first).toEqual([...CHILD_COLORS]);
    expect([6, 7, 11, 12].map(childColor)).toEqual([first[0], first[1], first[5], first[0]]);
  });

  test("MUPP-001-R6 any number gives a colour", () => {
    for (const n of [-1, -7, 1.9, 1e15, Number.MAX_SAFE_INTEGER, NaN, Infinity, -Infinity]) {
      expect(CHILD_COLORS).toContain(childColor(n));
    }
  });
});
